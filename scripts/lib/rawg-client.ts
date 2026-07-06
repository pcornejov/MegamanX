const RAWG_BASE = 'https://api.rawg.io/api';

export interface RawgGame {
  released: string | null;
  platforms: { platform: { name: string } }[] | null;
  background_image: string | null;
  description_raw: string | null;
  metacritic: number | null;
}

export async function fetchRawgGame(slug: string, apiKey: string): Promise<RawgGame> {
  const url = `${RAWG_BASE}/games/${slug}?key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`RAWG request failed for "${slug}": ${res.status} ${res.statusText}`);
  }
  return res.json();
}
