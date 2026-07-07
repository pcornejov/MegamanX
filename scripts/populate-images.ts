import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Wiki page titles for game cover art don't follow a predictable pattern
// from the game id, so they're hand-mapped here (only for games already authored).
const gameWikiTitles: Record<string, string> = {
  x1: 'Mega Man X (video game)',
  x2: 'Mega Man X2',
  x3: 'Mega Man X3',
  x4: 'Mega Man X4',
  x5: 'Mega Man X5',
  x6: 'Mega Man X6',
  x7: 'Mega Man X7',
  x8: 'Mega Man X8',
};

// One-off script: downloads portrait/enemy thumbnails from the Fandom MediaWiki
// API (no key needed) for every character/enemy JSON that has a sourceWikiUrl
// but no local image yet, and rewrites the JSON with a local /images path.
// Run with: npx tsx scripts/populate-images.ts

const UA = 'Mozilla/5.0 (compatible; megamanx-guide-image-fetch/1.0)';

function titleFromWikiUrl(url: string): string {
  const slug = url.split('/wiki/')[1];
  return decodeURIComponent(slug).replace(/_/g, ' ');
}

async function fetchThumbnail(title: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '400',
    format: 'json',
    redirects: '1',
  });
  const res = await fetch(`https://megaman.fandom.com/api.php?${params}`, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const page: any = Object.values(data.query?.pages ?? {})[0];
  return page?.thumbnail?.source ?? null;
}

async function downloadImage(url: string, destNoExt: string): Promise<string | null> {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') ?? '';
  const ext = contentType.includes('webp') ? 'webp' : contentType.includes('png') ? 'png' : 'jpg';
  const dest = `${destNoExt}.${ext}`;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return `/${path.relative('public', dest)}`;
}

async function processCollection(collection: 'characters' | 'enemies', imageField: 'portrait' | 'image') {
  const dir = path.join('src/content', collection);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (data[imageField] || !data.sourceWikiUrl) continue;

    const title = titleFromWikiUrl(data.sourceWikiUrl);
    try {
      const thumbUrl = await fetchThumbnail(title);
      if (!thumbUrl) {
        console.warn(`No thumbnail found for ${collection}/${file} ("${title}")`);
        continue;
      }
      const destNoExt = path.join('public/images', collection, data.id);
      const localPath = await downloadImage(thumbUrl, destNoExt);
      if (!localPath) {
        console.warn(`Failed to download image for ${collection}/${file}`);
        continue;
      }
      data[imageField] = localPath;
      fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
      console.log(`${collection}/${file} -> ${localPath}`);
    } catch (err) {
      console.error(`Error processing ${collection}/${file}:`, (err as Error).message);
    }
  }
}

async function processGameCovers() {
  const dir = 'src/content/games';
  for (const [id, title] of Object.entries(gameWikiTitles)) {
    const filePath = path.join(dir, `${id}.md`);
    if (!fs.existsSync(filePath)) continue;
    const file = matter.read(filePath);
    if (file.data.coverImage) continue;

    try {
      const thumbUrl = await fetchThumbnail(title);
      if (!thumbUrl) {
        console.warn(`No cover thumbnail found for games/${id} ("${title}")`);
        continue;
      }
      const destNoExt = path.join('public/images/games', id);
      const localPath = await downloadImage(thumbUrl, destNoExt);
      if (!localPath) continue;
      file.data.coverImage = localPath;
      fs.writeFileSync(filePath, matter.stringify(file.content, file.data));
      console.log(`games/${id}.md -> ${localPath}`);
    } catch (err) {
      console.error(`Error processing games/${id}:`, (err as Error).message);
    }
  }
}

async function main() {
  await processCollection('characters', 'portrait');
  await processCollection('enemies', 'image');
  await processGameCovers();
}

main();
