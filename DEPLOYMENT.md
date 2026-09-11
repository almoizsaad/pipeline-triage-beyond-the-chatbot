# Deployment

The graded workflow (`/triage`) is a static frontend with a hardcoded sample
dataset — it needs **no API key and no backend** to run or deploy.

## Local

```bash
npm install
npm run build      # tsc -b && vite build → outputs to dist/
npm run preview    # serve the production build locally to sanity-check it
```

## Deploy (any static host works — Vercel used as the example)

```bash
npm install -g vercel   # or use the Vercel web UI / GitHub integration
npm run build
vercel deploy dist --prod
```

Netlify, Cloudflare Pages, or GitHub Pages work the same way: run
`npm run build`, then point the host at the `dist/` folder. Because
`vite.config.ts` sets `base: './'`, the build works from any subpath —
no rewrite rules needed beyond a single-page-app fallback to `index.html`
(the app uses `HashRouter`, so even that fallback usually isn't necessary —
the only routes are `/#/` and `/#/triage`, both of which load the same
triage workflow directly, and any static host serves them correctly by
default).
