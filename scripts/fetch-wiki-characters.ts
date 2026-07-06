import path from 'node:path';
import { fetchWikiExtract } from './lib/mediawiki-client';
import { mergeJson } from './lib/frontmatter-merge';
import titleMap from './data/character-wiki-titles.json';

// One-off/manual script: run with `npm run fetch:characters`.
// The Fandom MediaWiki API needs no auth. Only backfills `sourceWikiUrl` (and a
// thumbnail URL for scripts/download-images.ts to pick up) — bios stay
// hand-authored/paraphrased rather than auto-overwritten with raw wiki text.
async function main() {
  for (const [characterId, title] of Object.entries(titleMap)) {
    try {
      const result = await fetchWikiExtract(title);
      const filePath = path.join('src/content/characters', `${characterId}.json`);
      const patch: Record<string, unknown> = { sourceWikiUrl: result.pageUrl };
      if (result.thumbnailUrl) patch.remoteThumbnailUrl = result.thumbnailUrl;
      mergeJson(filePath, patch);
      console.log(`Updated ${characterId} from MMKB (${title}).`);
    } catch (err) {
      console.error(`Skipping ${characterId}:`, (err as Error).message);
    }
  }
}

main();
