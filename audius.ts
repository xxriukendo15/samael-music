import { CONFIG } from './config';

export type Track = {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
  provider: 'audius' | 'itunes';
  previewUrl?: string;
};

const FALLBACK_HOST = 'https://discoveryprovider.audius.co';
let host: string | null = null;

async function getHost(): Promise<string> {
  if (host) return host;
  try {
    const r = await fetch('https://api.audius.co');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const list: string[] = j.data ?? [];
    host = list.length ? list[Math.floor(Math.random() * list.length)] : FALLBACK_HOST;
  } catch {
    host = FALLBACK_HOST;
  }
  return host!;
}

const appParam = `app_name=${encodeURIComponent(CONFIG.audius.appName)}`;

function mapAudiusTrack(t: any): Track {
  return {
    id: `audius:${String(t.id)}`,
    title: t.title ?? 'Sin título',
    artist: t.user?.name ?? 'Artista desconocido',
    artwork: t.artwork?.['480x480'] ?? t.artwork?.['150x150'],
    duration: t.duration ?? 0,
    provider: 'audius',
  };
}

function mapITunesTrack(t: any): Track | null {
  if (!t.previewUrl) return null;
  return {
    id: `itunes:${String(t.trackId)}`,
    title: t.trackName ?? 'Sin título',
    artist: t.artistName ?? 'Artista desconocido',
    artwork: typeof t.artworkUrl100 === 'string'
      ? t.artworkUrl100.replace('100x100bb', '600x600bb')
      : undefined,
    duration: Math.floor((t.trackTimeMillis ?? 0) / 1000),
    provider: 'itunes',
    previewUrl: t.previewUrl,
  };
}

async function getAudiusJson(path: string) {
  const h = await getHost();
  const r = await fetch(`${h}${path}`);
  if (!r.ok) {
    host = null;
    throw new Error(`Audius HTTP ${r.status}`);
  }
  return r.json();
}

async function searchAudius(query: string): Promise<Track[]> {
  const j = await getAudiusJson(
    `/v1/tracks/search?query=${encodeURIComponent(query)}&limit=30&${appParam}`
  );
  return (j.data ?? []).map(mapAudiusTrack);
}

async function searchITunes(query: string): Promise<Track[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=30&country=PE`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`iTunes HTTP ${r.status}`);
  const j = await r.json();
  return (j.results ?? []).map(mapITunesTrack).filter(Boolean) as Track[];
}

/** Busca en dos catálogos. iTunes ofrece previsualizaciones; Audius puede ofrecer la pista completa. */
export async function searchTracks(query: string): Promise<Track[]> {
    return searchAudius(query);
}

export async function trendingTracks(): Promise<Track[]> {
  const j = await getAudiusJson(`/v1/tracks/trending?limit=30&${appParam}`);
  return (j.data ?? []).map(mapAudiusTrack);
}

export async function streamUrl(track: Track): Promise<string> {
  if (track.provider === 'itunes') {
    if (!track.previewUrl) throw new Error('Esta canción no tiene previsualización disponible.');
    return track.previewUrl;
  }
  const h = await getHost();
  const id = track.id.replace(/^audius:/, '');
  return `${h}/v1/tracks/${encodeURIComponent(id)}/stream?${appParam}`;
}
