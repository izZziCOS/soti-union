# SOTI Union

Corporate website of **UAB „SOTI Union“**, Klaipėda, Lithuania. The company provides steelwork
and outfitting services for shipbuilding, wind-offshore, oil & gas and steel construction.

Live: <https://sotiunion.com>. Languages: English (`/`), Lithuanian (`/lt/`), Russian (`/ru/`).

News and page texts are managed in the **Suerteksa CMS** (repository `suerteksa-backend`).

## Stack

| Concern | Choice                                                                                     |
| ------- | ------------------------------------------------------------------------------------------ |
| Site    | [Astro](https://astro.build) 7 + TypeScript (strictest), static output, no JS framework    |
| Content | Suerteksa CMS: texts are applied at build time, news is loaded in the browser              |
| Styling | Tailwind CSS 4, self-hosted Inter (Latin + Cyrillic)                                       |
| Images  | `astro:assets`, responsive WebP generated at build time                                    |
| Tests   | Vitest (unit), Playwright + axe-core (e2e, WCAG 2.1 AA) on desktop and mobile              |
| Quality | ESLint, Prettier, `astro check`                                                            |
| Hosting | IONOS web hosting (Apache): strict CSP, security headers and redirects in `.htaccess`      |
| CI/CD   | GitHub Actions: checks and e2e on Apache, deploy over SFTP on demand or from the CMS panel |

## Getting started

Requires Node.js 24 (see `.nvmrc`).

```sh
npm ci
npm run dev          # http://localhost:4321
```

Without a CMS the site uses the texts in the repository and the news pages show a notice.
To work with a local CMS, copy `.env.example` to `.env`. The default `CMS_URL` there is
`http://localhost:8095`.

| Script                  | What it does                                                     |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run build`         | Production build into `dist/`, including `dist/.htaccess`        |
| `npm run preview`       | Serve `dist/` locally                                            |
| `npm test`              | Unit tests                                                       |
| `npm run test:coverage` | Unit tests with coverage                                         |
| `npm run test:e2e`      | Playwright e2e + accessibility tests (run `build` first)         |
| `npm run content:sync`  | Send the editable texts to the CMS (`-- --dry-run` to list them) |
| `npm run lint`          | ESLint                                                           |
| `npm run check`         | Astro/TypeScript type-check                                      |
| `npm run format`        | Prettier                                                         |
| `npm run validate`      | Lint, format check, type-check, unit tests, build                |

First-time e2e setup: `npx playwright install chromium`.

The news tests mock the CMS. They need a build and a test run with the same `CMS_URL`.
`BASE_URL` runs the suite against any running server; it also enables the Apache checks in
`tests/e2e/server.spec.ts`.

```sh
CMS_URL=https://cms.test CMS_FETCH_CONTENT=false npm run build
CMS_URL=https://cms.test CMS_FETCH_CONTENT=false npm run test:e2e
```

## Project layout

```
src/
  i18n/
    locales.ts            locales, routes, path helpers
    translations/         en.ts (source of truth, defines the Dictionary type), lt.ts, ru.ts
  cms/
    editable.ts           which texts the CMS may change, and how its values are applied
    remote.ts             loads the CMS texts at build time
  data/company-defaults.ts  company details (address, codes, phones); company.ts adds CMS changes
  pages/[...lang]/        every page, generated once per locale
  components/  layouts/  styles/
  scripts/news.ts         loads news from the CMS in the browser
  assets/images/          source photos (optimized at build time)
scripts/sync-content.ts   sends the editable texts to the CMS (runs on deploy)
server/htaccess           Apache configuration, written to dist/.htaccess by the build
server/news-og.php        link previews of news posts, written to dist/ by the build
tests/unit/  tests/e2e/
```

## Content

### In the CMS panel

- **News** (Suerteksa CMS → SOTI Union → News) appears on the site as soon as it is saved.
  It shows on the News page and in the "Latest news" section of the home page, which stays
  hidden while there is no news. The browser loads it from the CMS
  (`/api/v1/soti/news`).
  - Pictures come in several sizes (`srcset`) and are cropped around the **focal point**
    set in the CMS media library. The CSP forbids inline styles, so the focal point is
    rounded to 10 % and applied as one of the classes `global.css` generates. The home page
    photo is mirrored, and so is its focal point.
  - A post's search engine title and description replace the page's own once it loads.
  - **Link previews**: Facebook, LinkedIn and other link preview crawlers do not run
    JavaScript. `.htaccess` sends them, and only them, from `/news/?post={slug}` to
    `news-og.php`, which serves the same news page with the post's title, description and
    picture from the CMS in its head. The link stays on this site. This needs PHP on the
    web hosting (IONOS includes it); without an answer from the CMS the page is sent as it
    is. Check a post with the
    [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or the
    [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).
- **Page content** (CMS → Page content) holds every text of the site.
  - Company details (phones, emails, address, codes) are entered once for all languages.
  - **Open positions** (`career.positions`) are a list: positions can be added, removed and
    reordered, with requirements one per line.
  - Changes appear after **Publish website**, which runs the deploy workflow.
- The texts in this repository stay the defaults. A panel change wins; **Reset** in the panel
  brings the repository text back.

### In the repository

- **Text** lives in `src/i18n/translations/*.ts`.
  - `lt.ts` and `ru.ts` are typed against `en.ts`, so a missing or extra key fails the
    type-check.
  - Unit tests check that every locale has the same structure and no empty strings.
  - New keys show up in the CMS with the next deploy. Removed keys disappear from it, unless
    they were changed in the panel.
- **Lists that should be editable as a whole** (items added or removed in the panel) go into
  `editableLists` in `src/cms/editable.ts`.
- **Contacts / company codes** live in `src/data/company-defaults.ts`. Fields listed in
  `editableCompanyFields` can be changed in the CMS.
- **Adding a reference project**: add an item at the top of `references.items` in all three
  translation files. Keep them newest first; a test enforces it.
- **Adding a page**:
  1. Create `src/pages/[...lang]/<name>.astro` by copying an existing page.
  2. Add the path to `routes` in `src/i18n/locales.ts`.
  3. Add a nav label in the translations.

## Deploying to IONOS

`.github/workflows/ci.yml` runs on every push and pull request:

1. **verify**: lint, format check, type-check, unit tests with coverage, build
2. **e2e**: Playwright against `astro preview`
3. **apache**: the full e2e suite against Apache (`httpd`) serving `dist/` with its `.htaccess`.
   This covers the CSP, redirects from the old site's URLs, caching headers and the 404 page.

`.github/workflows/deploy.yml` publishes the site. Start it from **Actions → Deploy → Run
workflow**, or with **Publish website** in the CMS panel. It runs the checks above, then:

1. sends the editable texts to the CMS;
2. builds with the texts as changed in the CMS. If the CMS can't be reached, the build fails
   rather than publishing outdated texts;
3. uploads `dist/` over SFTP. Files no longer in the build are removed from the folder.

Setup:

1. In the IONOS control panel, point the domain at its **own folder**, for example
   `/sites/sotiunion`. The upload replaces everything in that folder.
2. In this repository, go to **Settings → Environments → production** and add:

   | Kind     | Name                 | Value                                                |
   | -------- | -------------------- | ---------------------------------------------------- |
   | Variable | `SITE_URL`           | `https://sotiunion.com` (canonical URLs, sitemap)    |
   | Variable | `CMS_URL`            | `https://admin.suerteksa.com`                        |
   | Variable | `SFTP_HOST`          | IONOS SFTP host                                      |
   | Variable | `SFTP_USER`          | IONOS SFTP user                                      |
   | Variable | `SFTP_PATH`          | The domain's folder, e.g. `/sites/sotiunion`         |
   | Secret   | `SFTP_PASSWORD`      | IONOS SFTP password                                  |
   | Secret   | `CONTENT_SYNC_TOKEN` | Same value as `CONTENT_SYNC_TOKEN` in the CMS `.env` |

3. Add the site's address to `CORS_ALLOWED_ORIGINS` in the CMS `.env`, so browsers may load
   the news.

## Image credits

- Project photos: © UAB „SOTI Union“.
- AIDAprima rendering: © AIDA Cruises, as published on the previous site.
- Home page photo: [Welder in a workshop](<https://commons.wikimedia.org/wiki/File:Welder_in_a_workshop_(Unsplash).jpg>)
  by Uğur Gürcüoğlu (Unsplash), **CC0**.
- Market photos from Wikimedia Commons, all **CC0 / public domain**:
  [Kentish Flats Offshore Wind Farm](https://commons.wikimedia.org/wiki/File:Kentish_Flats_Offshore_Wind_Farm.jpg),
  [Montrose Alpha](https://commons.wikimedia.org/wiki/File:Montrose_Alpha.JPG),
  [Container ship in Koper](https://commons.wikimedia.org/wiki/File:Container_ship_in_Koper_2013.jpg),
  [Steel frame structure](https://commons.wikimedia.org/wiki/File:Steel_frame_structure.jpg).
- Icons adapted from [Lucide](https://lucide.dev) (ISC).
