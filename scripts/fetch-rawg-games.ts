import path from 'node:path';
import { fetchRawgGame } from './lib/rawg-client';
import { mergeFrontmatter } from './lib/frontmatter-merge';
import slugMap from './data/rawg-game-slugs.json';

// One-off/manual script: run with `npm run fetch:games`.
// Requires RAWG_API_KEY in the environment (see .env.example). Not run in CI —
// output is committed as regular content, since GitHub Pages serves a static build.
async function main() {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.error('Missing RAWG_API_KEY. Copy .env.example to .env and set your key.');
    process.exit(1);
  }

  for (const [gameId, slug] of Object.entries(slugMap)) {
    try {
      const game = await fetchRawgGame(slug, apiKey);
      const filePath = path.join('src/content/games', `${gameId}.md`);
      const patch: Record<string, unknown> = { rawgSlug: slug };
      if (game.released) patch.releaseYear = new Date(game.released).getFullYear();
      if (game.platforms) patch.platforms = game.platforms.map((p) => p.platform.name);
      mergeFrontmatter(filePath, patch);
      console.log(`Updated ${gameId} from RAWG (${slug}).`);
    } catch (err) {
      console.error(`Skipping ${gameId}:`, (err as Error).message);
    }
  }
}

main();
