import { CONFIG } from './config';

export type Track = {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
};

const FALLBACK_HOST = 'https://discoveryprovider.audius.co';
let host: string | null = null;

async function getHost(): Promise<string> {
  if (host) return host;
  try {
    const r = await fetch('https://api.audius.co');
    const j = await r.json();
    const list: string[] = j.data ?? [];
    host = list.length ? list[Math.floor(Math.random() * list.length)] : FALLBACK_HOST;
  } catch {
    host = FALLBACK_HOST;
  }
  return host!;
}

const appParam = `app_name=${encodeURIComponent(CONFIG.audius.appName)}`;

function mapTrack(t: any): Track {
  return {
    id: String(t.id),
    title: t.title ?? 'Sin título',
    artist: t.user?.name ?? 'Artista desconocido',
    artwork: t.artwork?.['480x480'] ?? t.artwork?.['150x150'],
    duration: t.duration ?? 0,
  };
}

async function getJson(path: string) {
  const h = await getHost();
  const r = await fetch(`${h}${path}`);
  if (!r.ok) {
    host = null;
    throw new Error(`HTTP ${r.status}`);
  }
  return r.json();
}

export async function searchTracks(query: string): Promise<Track[]> {
  const j = await getJson(
    `/v1/tracks/search?query=${encodeURIComponent(query)}&limit=30&${appParam}`
  );
  return (j.data ?? []).map(mapTrack);
}

export async function trendingTracks(): Promise<Track[]> {
  const j = await getJson(`/v1/tracks/trending?limit=30&${appParam}`);
  return (j.data ?? []).map(mapTrack);
}

export async function streamUrl(id: string): Promise<string> {
  const h = await getHost();
  return `${h}/v1/tracks/${id}/stream?${appParam}`;
}
