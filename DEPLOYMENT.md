# Deployment

The graded workflow is a static frontend with a hardcoded sample dataset —
it needs **no API key and no backend** to run or deploy.

## Local

```bash
npm install
npm run build      # tsc -b && vite build → outputs to dist/
npm run preview    # serve the production build locally to sanity-check it
```

## Deploy to Vercel (recommended — free, static, zero config)

Vercel does not let you rename an existing project once it's created, and
the auto-generated slug from an early commit (with a typo in the repo name)
is what produced the wrong URL previously. The fix is to deploy under a
**new** project with the correct name rather than try to rename the old one:

```bash
npm install -g vercel     # or use the Vercel web UI / GitHub import
npm run build
vercel --name pipeline-triage-beyond-the-chatbot
# then, once you're happy with it:
vercel --prod --name pipeline-triage-beyond-the-chatbot
```

If you're importing the repo through the Vercel dashboard instead of the
CLI: **Add New → Project → Import Git Repository**, and on the "Configure
Project" screen (before the first deploy), set **Project Name** to
`pipeline-triage-beyond-the-chatbot` — Vercel will not let you fix this
after the first deploy without creating a new project, so it's worth
getting right at import time. Framework preset should auto-detect as Vite;
build command `npm run build`, output directory `dist`.

Either path gives you a URL like
`https://pipeline-triage-beyond-the-chatbot.vercel.app`. If the exact slug
is taken, Vercel appends a suffix — check the deployment output for the
final URL before submitting it.

The old, misnamed deployment (if still live) can be deleted from the
Vercel dashboard under that project's **Settings → Advanced → Delete
Project** once the new one is confirmed working, so only the correctly
named URL is discoverable.

## Deploy elsewhere

Netlify, Cloudflare Pages, or GitHub Pages work the same way: run
`npm run build`, then point the host at the `dist/` folder. Because
`vite.config.ts` sets `base: './'`, the build works from any subpath —
no rewrite rules needed, and since the app has no client-side router
there's no single-page-app fallback to configure either.
