const MMKB_API = 'https://megaman.fandom.com/api.php';

export interface WikiExtract {
  title: string;
  extract: string | null;
  thumbnailUrl: string | null;
  pageUrl: string;
}

export async function fetchWikiExtract(title: string, thumbSize = 600): Promise<WikiExtract> {
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'revisions|pageimages',
    rvprop: 'content',
    rvslots: 'main',
    piprop: 'thumbnail',
    pithumbsize: String(thumbSize),
    format: 'json',
  });

  const res = await fetch(`${MMKB_API}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`MediaWiki request failed for "${title}": ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0] as any;

  const wikitext: string | undefined = page?.revisions?.[0]?.slots?.main?.['*'];
  const extract = wikitext ? extractIntroParagraph(wikitext) : null;

  return {
    title: page?.title ?? title,
    extract,
    thumbnailUrl: page?.thumbnail?.source ?? null,
    pageUrl: `https://megaman.fandom.com/wiki/${encodeURIComponent((page?.title ?? title).replace(/ /g, '_'))}`,
  };
}

// Strips wikitext markup from the first real paragraph, used as a short bio seed.
// Output must still be hand-reviewed/paraphrased before being committed as content.
function extractIntroParagraph(wikitext: string): string {
  const withoutTemplates = wikitext.replace(/\{\{[\s\S]*?\}\}/g, '');
  const firstParagraph = withoutTemplates
    .split('\n')
    .find((line) => line.trim().length > 40 && !line.trim().startsWith('['));
  if (!firstParagraph) return '';
  return firstParagraph
    .replace(/'''?/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/<ref[\s\S]*?<\/ref>/g, '')
    .replace(/<ref[^/]*\/>/g, '')
    .trim();
}
