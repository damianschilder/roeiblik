# Roeiblik

**[roeiblik.com](https://roeiblik.com)**: Dutch rowing results, searchable by person.

Rowers, coxes and coaches race under many club and crew names. Their results are spread over
Time-Team (competition and regattas) and the KNRB's own results site. Roeiblik puts a person's
races on one page, with times per 500 m, every round of a race, and their crewmates.

| | |
|---|---|
| **Compobeter** | Search Time-Team for anyone's competition and regatta results. |
| **KNRBeter** | Search the KNRB's classified results: every race, heat and final, with positions and split times. |

<p>
  <img src="docs/screenshots/home.png" alt="Roeiblik start page" width="100%">
</p>
<p>
  <img src="docs/screenshots/knrb-person.png" alt="A rower's KNRB results" width="76%">
  <img src="docs/screenshots/time-team-person-phone.png" alt="A rower's Time-Team results and wins on a phone" width="21%">
</p>

## Why it exists

Time-Team shows results per race, not per person. To see one rower's races together, Damian
looked in the browser's developer tools at the endpoints Time-Team's own site uses, and built
Roeiblik on top of them. The KNRB's results were added later.

## How it was built

### 2024–2025: designed in Figma, a hybrid build

- **Designed in Figma first**: the last of Damian's projects with a hand-made design; later ones
  were designed with AI tools.
- **November 2024 to April 2025**, 113 commits, with Nuxt 3, Pinia, and Pug and SCSS templates.
- **A hybrid.** The frontend (pages, components, styling, and the logic that groups a person's
  races) was written by hand. The server routes that talk to the Time-Team and KNRB APIs
  (November 2024 to January 2025) were written with help from AI chatbots in the browser:
  ChatGPT, and from January 2025 also Gemini.
- There was also a statistics page with national KNRB results per event.

### November 2026: back online, with Claude Code

The site was put back online safely with [Claude Code](https://claude.com/claude-code), without
changing how it looks and works.

- **Safe to run.** Every API route validates its input, people can ask to be removed, person pages
  stay out of search engines, and there are no cookies. See [Security and privacy](#security-and-privacy).
- **Up to date.** Nuxt 3.14 became Nuxt 4.6, with current versions of every dependency, running
  on Cloudflare Workers.
- **Wins that add up.** Wins are decided on the server, by one rule on both tools: first place in
  the race that decided the event. That is the A-final, or without a final the last round after
  which nothing follows; never a heat, repechage, semi-final or B-final. The count, the
  *Alleen winsten* filter and the trophy all use that rule.
- **Searches that behave.** A search runs when you submit it and survives the Back button. The
  server merges a person's data before it reaches the browser. A quick answer shows no loader.
  Each failure gets its own message: not found, too many requests, offline, or Time-Team or the
  KNRB not answering.
- **Lowercase addresses.** `/time-team` and `/knrb`. The old `/Time-Team` and `/KNRB` addresses
  redirect in one step.
- **Faster fonts.** 340 kB of TTF became 37 kB of WOFF2, with fallbacks of the same size. On a
  slow phone the text is in Mulish after 4.3–4.5 s instead of 11–15 s, and no longer jumps
  when the font arrives.
- **Phone and accessibility.** A menu on phones, AA contrast, keyboard and screen-reader support,
  and no sideways scrolling on a person page.
- **Findable, but not the people.** robots.txt, a sitemap, `llms.txt`, canonical addresses and
  link previews for the public pages. Person pages are `noindex`, and AI crawlers stay off them.
- **Removed:** the statistics page. Its address redirects to KNRBeter.

## Addresses

| Page | Address |
|---|---|
| Compobeter (Time-Team) | `/time-team`, a person at `/time-team/persoon/<id>` |
| KNRBeter | `/knrb`, a person at `/knrb/persoon/<id>` |
| API | `/api/time-team/{search,person,entry}`, `/api/knrb/{search,person,round}` |

Until November 2026 the sections were `/Time-Team` and `/KNRB`. Any casing of those (and of
`/api/Time-Team`, `/api/KNRB`) is redirected to the lowercase address, keeping the rest of the
path and the query: 301 for pages, 308 for the API. The old statistics page (`/knrb/statistieken`)
redirects to `/knrb`. A wrong host and an old path are corrected in a single redirect
(`server/utils/address.js`).

## Stack

Nuxt 4 (Vue 3, server-side rendering), Pinia, and Pug and SCSS templates. The Nitro server runs on
Cloudflare Workers with static assets.

## Security and privacy

- **No database, no accounts, no cookies.** The server passes each search on to Time-Team or the
  KNRB (via Foys). It keeps the raw answer for five minutes (Time-Team) or ten (KNRB), never
  longer, in two places:
  - an in-memory cache capped at 500 entries and 8 MB;
  - Cloudflare's cache in the same data centre.

  Identical requests in flight share a single upstream call. Removal requests are applied after
  the cache, on every request.
- **Every API route validates its input.** An id must match `[A-Za-z0-9_-]{1,64}`, a race id must
  be numeric, and a search term must be 2–100 characters. Values are URL-encoded before they reach
  an upstream URL, so the server cannot be used as a proxy to other paths on those APIs.
  Upstream errors are logged by host and path only and never sent to the browser.
- **Errors have a real status** and a body `{ "error": "..." }`, never cached: 400 for a malformed
  request, 404 for an unknown person or race, 502 when Time-Team or the KNRB answers with an error,
  503 with `Retry-After` when it does not answer in time. A person on the removal list gets the
  same 404 as an unknown one. The routes return only the fields the pages show.
- **Security headers** on every response: `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`, `Permissions-Policy`, HSTS and a CSP with `frame-ancestors 'none'`.
- **Person pages are `noindex`**, via both a header and a meta tag. Their HTML holds no names: the
  page loads them in the browser from `/api/`, which no crawler may fetch. People can be found by
  searching on Roeiblik, not through search engines.
- **Removal on request.** The ids in `NUXT_BLOCKED_PERSON_IDS` disappear from search results,
  crews and lineups, and their person pages answer as if they did not exist. See the
  [privacy page](https://roeiblik.com/privacy) (in Dutch).
- **Cookieless analytics**, optional: Cloudflare Web Analytics, with no cookies and no personal
  data, so no consent banner is needed.
- **No datasets are published.** Everything shown comes live from the two APIs.

## Run it locally

Requires Node.js 22 or newer.

```sh
npm install
npm run dev        # http://127.0.0.1:3000
```

## Configuration

| Variable | Purpose |
|---|---|
| `NUXT_BLOCKED_PERSON_IDS` | Comma-separated Time-Team and KNRB person ids to hide (removal requests). |
| `NUXT_PUBLIC_CF_BEACON_TOKEN` | Cloudflare Web Analytics token. Empty means no analytics script. |
| `NUXT_CANONICAL_HOST` | The one host the site answers on; other hosts get a 301 to it. Set to `roeiblik.com` by the Worker config. |

## Deploy (Cloudflare Workers)

```sh
npx wrangler login     # once
npm run deploy         # nuxt build, then wrangler deploy
```

- The build writes the Worker config (`.output/server/wrangler.json`) from `nuxt.config.ts`
  (`nitro.cloudflare.wrangler`): Worker `roeiblik` on the custom domains `roeiblik.com` and
  `www.roeiblik.com`, with the `*.workers.dev` address and preview URLs switched off. The site is
  only reachable on roeiblik.com; www and any other host get a 301 there. roeiblik.nl has its own
  redirect rule in Cloudflare.
- A custom domain can't be created on a hostname that still has a CNAME record: delete that record
  in Cloudflare DNS before the first deploy.
- Set `NUXT_BLOCKED_PERSON_IDS` and `NUXT_PUBLIC_CF_BEACON_TOKEN` as Worker variables (Settings →
  Variables). `keep_vars` makes deploys leave them alone.
- Recommended: a Cloudflare rate-limiting rule on `/api/*` (Security → WAF → Rate limiting rules),
  e.g. 60 requests per minute per IP. It stops anyone from scraping Time-Team or the KNRB through
  Roeiblik.

## Data sources

Results come from [Time-Team Regatta Systems](https://time-team.nl/) and the
[KNRB](https://roeievenementen.knrb.nl/) (via Foys). Roeiblik is an independent hobby project and
is not affiliated with either.

## License

The code is available under the [MIT License](LICENSE). The results shown on the site come from
Time-Team and the KNRB and are not covered by this license.
