# SOTI Union

Corporate website of **UAB „SOTI Union“** — steelwork and outfitting services for shipbuilding,
wind-offshore, oil & gas and steel construction, Klaipėda, Lithuania.

Live: <https://sotiunion.com> · Languages: English (`/`), Lithuanian (`/lt/`), Russian (`/ru/`)

## Stack

| Concern | Choice                                                                                    |
| ------- | ----------------------------------------------------------------------------------------- |
| Site    | [Astro](https://astro.build) 7 + TypeScript (strictest), static output, zero JS framework |
| Styling | Tailwind CSS 4, self-hosted Inter (Latin + Cyrillic)                                      |
| Images  | `astro:assets` — responsive WebP generated at build time                                  |
| Tests   | Vitest (unit) · Playwright + axe-core (e2e, WCAG 2.1 AA) on desktop and mobile            |
| Quality | ESLint, Prettier, `astro check`                                                           |
| Runtime | nginx (unprivileged, read-only container) with strict CSP and security headers            |
| CI/CD   | GitHub Actions → GHCR image (amd64 + arm64) → optional SSH deploy                         |

## Getting started

Requires Node.js 24 (see `.nvmrc`).

```sh
npm ci
npm run dev          # http://localhost:4321
```

| Script                  | What it does                                             |
| ----------------------- | -------------------------------------------------------- |
| `npm run build`         | Production build into `dist/`                            |
| `npm run preview`       | Serve `dist/` locally                                    |
| `npm test`              | Unit tests                                               |
| `npm run test:coverage` | Unit tests with coverage                                 |
| `npm run test:e2e`      | Playwright e2e + accessibility tests (run `build` first) |
| `npm run lint`          | ESLint                                                   |
| `npm run check`         | Astro/TypeScript type-check                              |
| `npm run format`        | Prettier                                                 |
| `npm run validate`      | Lint, format check, type-check, unit tests, build        |

First-time e2e setup: `npx playwright install chromium`.
To run the e2e suite against any running server (e.g. the Docker container or production), set
`BASE_URL` — this also enables the nginx checks in `tests/e2e/server.spec.ts`:

```sh
BASE_URL=http://localhost:8080 npm run test:e2e
```

## Project layout

```
src/
  i18n/
    locales.ts            locales, routes, path helpers
    translations/         en.ts (source of truth, defines the Dictionary type), lt.ts, ru.ts
  data/company.ts         company details shared by all languages (address, codes, phones)
  pages/[...lang]/        every page, generated once per locale
  components/  layouts/  styles/
  assets/images/          source photos (optimized at build time)
nginx/                    production server config
tests/unit/  tests/e2e/
```

### Editing content

- **Text** lives in `src/i18n/translations/*.ts`. `lt.ts` and `ru.ts` are typed against `en.ts`, so a
  missing or extra key fails the type-check, and unit tests verify every locale has the same structure
  and no empty strings.
- **Contacts / company codes** live in `src/data/company.ts`.
- **Adding a reference project**: add an item at the top of `references.items` in all three
  translation files (keep newest first — a test enforces it).
- **Adding a page**: create `src/pages/[...lang]/<name>.astro` (copy an existing page), add the path to
  `routes` in `src/i18n/locales.ts` and a nav label in the translations.

## Docker

```sh
docker compose up --build    # http://localhost:8080
```

The image is a multi-stage build: Node builds the static site, then `nginxinc/nginx-unprivileged`
serves it on port **8080** as a non-root user. It ships with:

- strict Content-Security-Policy (no inline scripts or styles) and standard security headers
- immutable caching for hashed assets, `no-cache` for HTML, gzip
- `GET /healthz` for health checks (used by the Docker `HEALTHCHECK`)
- 301 redirects from the old site's URLs (`/about.html`, `/lt/contact.html`, `/news.html`, …)

Build for a different domain with `--build-arg SITE_URL=https://example.com` (used for canonical
URLs, hreflang and the sitemap).

## CI/CD

`.github/workflows/ci.yml` runs on every push and pull request:

1. **verify** — lint, format check, type-check, unit tests with coverage, build
2. **e2e** — Playwright against `astro preview`
3. **docker** — builds the image, starts it read-only and runs the full e2e suite (including
   redirects and headers) against nginx
4. **publish** (pushes to `main` and `v*.*.*` tags) — multi-arch image to
   `ghcr.io/izzzicos/soti-union` tagged `latest`, `sha-…` and semver
5. **deploy** (optional, `main` only) — SSH to a server and `docker compose pull && up -d`

To enable deployment, copy `compose.yaml` to the server, put TLS in front of it (Caddy, Traefik, a
cloud load balancer…), then configure the repository:

| Kind     | Name             | Value                                   |
| -------- | ---------------- | --------------------------------------- |
| Variable | `DEPLOY_HOST`    | Server hostname or IP                   |
| Variable | `DEPLOY_USER`    | SSH user (must be able to run `docker`) |
| Variable | `DEPLOY_PATH`    | Directory containing `compose.yaml`     |
| Secret   | `DEPLOY_SSH_KEY` | Private key for that user               |

If the GHCR package is private, run `docker login ghcr.io` on the server once. Create a
`production` environment in the repository settings to add approval rules.

## Image credits

- Project photos and the workshop hero image: © UAB „SOTI Union“.
- AIDAprima rendering: © AIDA Cruises, as published on the previous site.
- Market photos from Wikimedia Commons, all **CC0 / public domain**:
  [Kentish Flats Offshore Wind Farm](https://commons.wikimedia.org/wiki/File:Kentish_Flats_Offshore_Wind_Farm.jpg),
  [Montrose Alpha](https://commons.wikimedia.org/wiki/File:Montrose_Alpha.JPG),
  [Container ship in Koper](https://commons.wikimedia.org/wiki/File:Container_ship_in_Koper_2013.jpg),
  [Steel frame structure](https://commons.wikimedia.org/wiki/File:Steel_frame_structure.jpg).
- Icons adapted from [Lucide](https://lucide.dev) (ISC).
