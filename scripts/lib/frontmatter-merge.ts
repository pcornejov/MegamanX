import fs from 'node:fs';
import matter from 'gray-matter';

// Merges only the given keys into a Markdown file's frontmatter, leaving the
// body and any hand-authored keys untouched. Safe to re-run (idempotent).
export function mergeFrontmatter(filePath: string, patch: Record<string, unknown>): void {
  const file = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(file);
  const merged = { ...parsed.data, ...patch };
  const output = matter.stringify(parsed.content, merged);
  fs.writeFileSync(filePath, output);
}

// Merges keys into a JSON data file (characters/enemies), leaving any other
// hand-authored keys untouched. Safe to re-run (idempotent).
export function mergeJson(filePath: string, patch: Record<string, unknown>): void {
  const current = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const merged = { ...current, ...patch };
  fs.writeFileSync(filePath, `${JSON.stringify(merged, null, 2)}\n`);
}
