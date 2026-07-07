---
name: astro-github-pages-gotchas
description: >-
  Use when configuring or debugging an Astro site deployed to GitHub Pages as
  a project page — especially when touching astro.config.mjs, the `base`
  option, internal links/hrefs, local <img src> paths, or when images/CSS/
  links 404 in production despite a green build and a 200 on the deployed
  HTML. Prevents two real production bugs hit in this project: a case-mismatched
  base path, and hand-written asset paths missing the base prefix.
---

# Astro + GitHub Pages gotchas

Two production bugs, each real, each cost a full debug → fix → rebuild →
redeploy → reverify cycle. Both are 100% avoidable up front on any Astro +
GitHub Pages project.

## 1. `base` must match the repo name's exact casing

GitHub Pages serves project pages (`https://<user>.github.io/<repo>/`)
respecting the **exact casing** of the repo name in the URL path, even
though the `github.io` domain itself is not case-sensitive. If the repo is
`MegamanX` and `astro.config.mjs` has `base: '/megamanx'` (lowercase), every
link Astro generates from that `base` will 404 in production — the site
still builds cleanly and looks fine locally, only production breaks.

Fix: set `base` to match the repo name byte-for-byte.

```js
// astro.config.mjs
export default defineConfig({
  site: 'https://<user>.github.io',
  base: '/MegamanX', // exact repo casing, not '/megamanx'
  trailingSlash: 'never',
});
```

Also check any hardcoded references outside Astro's own asset pipeline —
e.g. a manually-written favicon `<link>` — for the same casing mismatch.

## 2. Astro does NOT auto-prefix hand-written `href`/`src` with `base`

Astro only prepends `base` to assets *it* generates (bundled JS/CSS,
`Image`/`Picture` component output, etc). Any `href` or `src` you write by
hand as a plain string — internal nav links, local `<img src="/images/...">`
— is left untouched. Locally this doesn't matter because `base` is often
empty in dev; in production it means dead links and broken images with **no
build error at all**.

The insidious part: it's easy to fix nav links and declare victory, then
forget local `<img src>` paths (covers, portraits, thumbnails) — which is
exactly what happened here. A 100%-successful build shipped with every
image broken until the user reported "images don't show."

Fix: one small helper, applied to *every* local `href` and *every* local
`<img src>`, no exceptions.

```ts
// src/lib/url.ts
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`;
}
```

```astro
---
import { withBase } from '@/lib/url';
---
<a href={withBase('/games')}>Games</a>
<img src={withBase(coverImage)} alt="" />
```

When auditing a component/page, grep for `src="/` and `href="/` (or
template-literal equivalents) — every hit on a *local* path needs
`withBase()`. External URLs (`https://...`) never need it.

## 3. Verify assets on the live URL, not just HTML status codes

A broken `base` can leave every page returning 200 while images/CSS are
silently 404ing underneath — the failure is invisible unless you check for
it. After every deploy, `curl -I` at least one non-HTML asset on the live
URL, not just the page itself:

```bash
curl -sI https://<user>.github.io/<repo>/                          # page: 200 is not enough
curl -sI https://<user>.github.io/<repo>/images/games/x1.webp      # confirm an actual asset
```

If the asset 404s while the page is 200, suspect a `base`/`withBase()`
mismatch first.

## 4. One manual step GitHub Pages needs that no API here can set

`Settings → Pages → Source = "GitHub Actions"` on the repo is a one-time
manual toggle in the GitHub UI. There is no tool in this environment that
can set it via API — confirm with the user it's already done (or ask them
to do it) before expecting a `withastro/action` + `actions/deploy-pages`
workflow to actually publish anything.
