# fitle: Cop or Drop

A daily game about fashion prices and taste. Every day, three pieces: guess the price in five
tries, then vote COP or DROP and see how the crowd went.

Phase 1 is a playable MVP. Crowd numbers are simulated and all sample brands are fictional.
Choices the spec left open are in [DECISIONS.md](DECISIONS.md).

## Run

Requires Node 20.9 or newer.

```sh
npm install
npm run dev       # http://localhost:3000
```

## Test

```sh
npm test                    # unit tests
npm run lint
npm run validate-content
npx playwright install chromium   # first time only
npm run test:e2e            # builds the app, then plays through it
```

## Add a day's puzzle

1. Copy a file in `content/puzzles/` to `content/puzzles/YYYY-MM-DD.json`.
2. Set `date` to match the file name. Keep exactly three items in the order budget, mid, bougie,
   with item ids unique across all files (for example `2026-11-11-budget`).
3. Set `priceCents` to the full, non-sale US price in cents, and record `retailerName` and
   `priceCheckedAt`.
4. Remove `"_sample": true` if the content is real.
5. Run `npm run validate-content`. Errors must be fixed; warnings list upcoming days with no puzzle.

`imageUrl` is `placeholder:<kind>` for an illustrated card (`shirt`, `jeans`, `dress`, `jacket`,
`shoe`, `bag`, `hat`, `ring`). Any other value is used as a real image URL. Only use licensed
images, never scraped or hotlinked ones, and set `imageCredit` when you do.

Item-specific host lines go in each item's `host` field. The fallback pool is
`content/host/lines.json`.

## Where things live

- `lib/game/`: all game rules, as pure functions with no framework code
- `lib/game/config.ts`: launch date, site URL, host name
- `components/`: the interface
- `app/puzzles/[date]/`: serves each day's puzzle as a static file, so future days stay out of the
  page bundle
