const API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;

export type YouTubeResult = {
  videoId: string;
  title: string;
  artist: string;
  artwork?: string;
};

const decode = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

export async function searchYouTube(query: string): Promise<YouTubeResult[]> {
  if (!API_KEY || !query.trim()) return [];

  const url =
    'https://www.googleapis.com/youtube/v3/search' +
    `?part=snippet&type=video&videoCategoryId=10&maxResults=25` +
    `&q=${encodeURIComponent(query)}&key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API ${res.status}`);
  const data = await res.json();

  return (data.items ?? []).map((item: any) => ({
    videoId: item.id.videoId,
    title: decode(item.snippet.title),
    artist: decode(item.snippet.channelTitle),
    artwork:
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.default?.url,
  }));
}
