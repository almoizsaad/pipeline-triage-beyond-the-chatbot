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
routes are `/#/triage`, `/#/workspace`, etc., which any static host serves
correctly by default).

## Optional: the legacy `/workspace` route

The out-of-scope generative-OS demo at `/workspace` (see NOTES.md) can call
a Moonshot-compatible LLM API if you want to explore it. It is not required
for grading. If you want to try it:

```env
# .env
VITE_API_KEY=your_api_key
VITE_API_BASE_URL=https://api.moonshot.cn/v1
```

Without these set, `/workspace` falls back to local/offline behavior per
`FAILURE_TESTS.md`'s original "API Unavailable" scenario — it won't crash
the app.
