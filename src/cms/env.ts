/**
 * CMS connection, read when the site is built:
 *
 * - `CMS_URL`: address of the CMS, e.g. https://admin.suerteksa.com. News pages load
 *   their posts from it in the browser; without it they show a notice.
 * - `CMS_SITE`: this site's key in the CMS.
 * - `CMS_FETCH_CONTENT`: set to `false` to build with the repository texts even when
 *   `CMS_URL` is set (tests).
 */
export const cms = {
  url: (process.env["CMS_URL"] ?? "").replace(/\/+$/, ""),
  site: process.env["CMS_SITE"] ?? "soti",
  fetchContent: !!process.env["CMS_URL"] && process.env["CMS_FETCH_CONTENT"] !== "false",
};
