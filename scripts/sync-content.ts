/**
 * Sends the site's editable texts (the repository texts) to the CMS, so they show
 * up in the panel. Runs before the deploy build:
 *
 *   CMS_URL=https://admin.suerteksa.com CONTENT_SYNC_TOKEN=… npm run content:sync
 *
 * With --dry-run it only prints what would be sent.
 */
import { buildManifest } from "../src/cms/editable.ts";
import { companyDefaults } from "../src/data/company-defaults.ts";
import en from "../src/i18n/translations/en.ts";
import lt from "../src/i18n/translations/lt.ts";
import ru from "../src/i18n/translations/ru.ts";

const entries = buildManifest({ en, lt, ru }, companyDefaults);
const lists = entries.filter((e) => e.type === "list").map((e) => e.key);
console.log(`${entries.length} editable texts (lists: ${lists.join(", ") || "none"})`);

if (process.argv.includes("--dry-run")) {
  console.log(JSON.stringify(entries, null, 2));
  process.exit(0);
}

const url = (process.env["CMS_URL"] ?? "").replace(/\/+$/, "");
const site = process.env["CMS_SITE"] ?? "soti";
const token = process.env["CONTENT_SYNC_TOKEN"] ?? "";

if (!url || !token) {
  console.error("Set CMS_URL and CONTENT_SYNC_TOKEN.");
  process.exit(1);
}

const response = await fetch(`${url}/api/v1/${site}/content/sync`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Sync-Token": token,
  },
  body: JSON.stringify({ entries }),
});

const body = await response.text();
if (!response.ok) {
  console.error(`CMS refused the texts (${response.status}): ${body}`);
  process.exit(1);
}

const result = JSON.parse(body) as {
  created: number;
  updated: number;
  removed: number;
  unused: string[];
};
console.log(
  `CMS: ${result.created} new, ${result.updated} updated, ${result.removed} removed` +
    (result.unused.length
      ? `; changed in the panel but no longer used: ${result.unused.join(", ")}`
      : ""),
);
