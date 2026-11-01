# AI Focus Groups

Run a simulated focus group on a product, landing page, design, or startup idea. Paste a URL, some text, or both. A panel of AI personas reviews it, each answering separately, and the app combines their verdicts into a results dashboard.

Built with Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, and the Vercel AI SDK (OpenAI).

## Panels

| Panel | Who's on it | What you get |
|---|---|---|
| **Consumer** | 20 everyday buyers across four generations (budget parent, Gen Z early adopter, skeptical exec, retiree, …) | Purchase intent, emotions, painkiller vs. vitamin, pricing expectations, top frictions, feature appeal, cohort comparison, linked quotes |
| **Design** | 5 working designers (UX, brand, design systems, motion, accessibility) | Scored critique of craft, usability, and clarity, with issues ranked by severity and a list of strengths. Reviews a **screenshot** of the page |
| **Startup** | 6 operators and investors (YC partner, VC, growth, engineering, marketing, PR) | Invest/pass verdicts, bull and bear cases, risks, and a memo-style summary |

You can also define your own personas. A single run is capped at 6 panelists (`MAX_PANELISTS` in `lib/panels.ts`).

## How it works

1. **Input:** the input box takes a URL, free text, or both. If it finds a URL, `app/api/analyze/route.ts` fetches the page's HTML and pulls out its text and title (it prefers `og:title`, then `<title>`, then the first `<h1>`).
2. **Headless browser:** the Design panel always renders the page in Chromium (`lib/screenshot.ts`, using puppeteer-core) so it gets a full-page screenshot to review. The Consumer and Startup panels use Chromium only when the plain fetch returns too little text, which happens with JS-rendered pages.
3. **Panelists:** each persona is a separate `generateObject` call with a Zod schema for that panel (`lib/analysis.ts`). The shared context is cached across these calls.
4. **Aggregation:** `lib/aggregate.ts` turns the structured verdicts into the charts and lists on the dashboard (`components/panel/results/*`).
5. **History:** past sessions are kept in the browser's `sessionStorage` (the session history sheet). If MongoDB is configured, each run is also stored there for the admin dashboard.

## Getting started

Requires Node 20+ and pnpm.

```bash
pnpm install
```

Create `.env.local` (see [Environment variables](#environment-variables)), then:

```bash
pnpm dev
```

Open http://localhost:3000.

### Local Chromium

On Vercel or AWS Lambda the app uses the Chromium build bundled with `@sparticuz/chromium`. Locally it runs a system Chromium, which defaults to `/opt/pw-browsers/chromium`. Point it somewhere else with `CHROMIUM_EXECUTABLE_PATH`, for example on macOS:

```bash
CHROMIUM_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Only the Design panel needs a browser. The other panels still work without one, but JS-heavy pages may yield too little text.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Used by `@ai-sdk/openai`. The model is set in `MODEL_ID` in `app/api/analyze/route.ts` |
| `MONGODB_URI` | No | Turns on run logging and the admin dashboard. Without it, runs are not saved |
| `MONGODB_DB` | No | Database name (default `panel`). Runs go into the `runs` collection |
| `ADMIN_USER` / `ADMIN_PASSWORD` | For `/admin` | HTTP Basic Auth credentials. If they're unset, `/admin` returns 503 so it is never left open |
| `CHROMIUM_EXECUTABLE_PATH` | No | Path to a local Chromium or Chrome binary (not used on serverless) |

## Admin dashboard

`/admin` sits behind Basic Auth, which `proxy.ts` enforces. It shows:

- run counts and token usage
- estimated cost (from the placeholder prices in `lib/metrics.ts`)
- runs broken down by panel, by input mode, and by day
- a list of recent runs

Each run links to a page at `/admin/runs/[id]` with its full panelist responses.

## Project layout

```
app/
  page.tsx                  # Main app
  api/analyze/route.ts      # Content retrieval + per-panelist LLM calls
  admin/                    # Usage dashboard and per-run detail
components/
  panel/                    # Setup, running view, results dashboard, persona sheets
  admin/                    # Usage charts
  ui/                       # shadcn/ui primitives
lib/
  personas.ts               # Consumer roster
  panels.ts                 # Design + Startup rosters, panel metadata, limits
  analysis.ts               # Zod verdict schemas and label maps
  aggregate.ts              # Verdicts → dashboard data
  screenshot.ts             # Headless Chromium capture
  mongo.ts, metrics.ts      # Run persistence and admin queries
proxy.ts                    # Basic Auth for /admin
```

## Deploying

The app is set up for Vercel. `next.config.mjs` lists Chromium, puppeteer-core, and mongodb as server-external packages, and forces the `@sparticuz/chromium` binary into the `/api/analyze` function trace. The analyze route has `maxDuration` set to 120 seconds. Set the environment variables above in the Vercel project settings.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
