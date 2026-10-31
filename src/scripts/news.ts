/**
 * News from the CMS, loaded in the browser (see NewsFeed.astro):
 * - `latest`: the three newest posts; the surrounding section stays hidden if there are none.
 * - `page`: the news list with "show more", or a single post when the URL has ?post=slug.
 */
import { focalClass, safeSrcset, type CmsImage } from "~/cms/media";

interface Labels {
  loading: string;
  empty: string;
  error: string;
  notFound: string;
}

interface Post {
  slug: string;
  title: string | null;
  excerpt: string | null;
  published_at: string | null;
  cover: CmsImage | null;
  body?: string | null;
  images?: (CmsImage & { caption: string | null })[];
  documents?: { url: string; name: string; size: number | null }[];
  /** What search engines show; Facebook and LinkedIn get it from news-og.php. */
  seo?: { title: string | null; description: string | null };
}

/** How wide the pictures are shown, for choosing from their srcset. */
const CARD_SIZES = "(min-width: 64rem) 24rem, (min-width: 40rem) 50vw, 100vw";
const COVER_SIZES = "(min-width: 48rem) 48rem, 100vw";
const GALLERY_SIZES = "(min-width: 48rem) 16rem, 50vw";

interface Page {
  data: Post[];
  meta: { current_page: number; last_page: number };
}

const PER_PAGE = 9;

export function initNews(root: HTMLElement): void {
  const api = root.dataset["api"] ?? "";
  const locale = root.dataset["locale"] ?? "en";
  const pageUrl = root.dataset["pageUrl"] ?? "/news/";
  const labels = JSON.parse(root.dataset["labels"] ?? "{}") as Labels;
  const status = root.querySelector<HTMLElement>("[data-news-status]")!;
  const list = root.querySelector<HTMLUListElement>("[data-news-list]")!;

  const date = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" });
  const postUrl = (slug: string) => `${pageUrl}?post=${encodeURIComponent(slug)}`;

  const setStatus = (text: string) => {
    status.textContent = text;
    status.hidden = text === "";
  };

  const get = async <T>(path: string): Promise<T | null> => {
    const response = await fetch(`${api}${path}`, { headers: { Accept: "application/json" } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`News request failed: ${response.status}`);
    return (await response.json()) as T;
  };

  const card = (post: Post): Node => {
    const node = template(root, "[data-news-card]");
    field<HTMLAnchorElement>(node, "link").href = postUrl(post.slug);
    setDate(field(node, "date"), post.published_at, date);
    field(node, "title").textContent = post.title ?? "";
    fillOrRemove(field(node, "excerpt"), post.excerpt);
    const cover = field<HTMLImageElement>(node, "cover");
    if (post.cover) showPicture(cover, post.cover, post.cover.thumb_url, CARD_SIZES, api);
    else cover.remove();
    return node;
  };

  if (root.dataset["news"] === "latest") {
    const section = root.closest<HTMLElement>("[data-news-section]");
    if (!api) return;
    get<Page>(`/news?lang=${locale}&per_page=3`)
      .then((page) => {
        if (!page || page.data.length === 0) return;
        list.append(...page.data.map(card));
        if (section) section.hidden = false;
      })
      .catch(() => {
        /* the section simply stays hidden */
      });
    return;
  }

  if (!api) {
    setStatus(labels.error);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("post");

  if (slug) {
    // a preview of an unpublished post must not end up in search results
    if (params.has("preview")) {
      document.head.append(
        Object.assign(document.createElement("meta"), { name: "robots", content: "noindex" }),
      );
    }
    showPost(slug, params.get("preview"));
  } else {
    showList();
  }

  function showList(): void {
    const more = root.querySelector<HTMLButtonElement>("[data-news-more]")!;
    let page = 0;

    const load = async () => {
      more.disabled = true;
      root.setAttribute("aria-busy", "true");
      try {
        const result = await get<Page>(
          `/news?lang=${locale}&per_page=${PER_PAGE}&page=${page + 1}`,
        );
        page = result?.meta.current_page ?? page + 1;
        list.append(...(result?.data ?? []).map(card));
        setStatus(list.children.length === 0 ? labels.empty : "");
        more.hidden = !result || result.meta.current_page >= result.meta.last_page;
      } catch {
        setStatus(labels.error);
      } finally {
        more.disabled = false;
        root.removeAttribute("aria-busy");
      }
    };

    more.addEventListener("click", load);
    void load();
  }

  async function showPost(slug: string, preview: string | null): Promise<void> {
    const container = root.querySelector<HTMLElement>("[data-news-post]")!;
    root.setAttribute("aria-busy", "true");

    try {
      // A preview link from the CMS (?preview=token) also shows unpublished posts.
      const path = preview
        ? `/news/${encodeURIComponent(slug)}/preview?lang=${locale}&token=${encodeURIComponent(preview)}`
        : `/news/${encodeURIComponent(slug)}?lang=${locale}`;
      const result = await get<{ data: Post }>(path);
      if (!result) {
        setStatus(labels.notFound);
        return;
      }

      const post = result.data;
      const node = template(root, "[data-news-article]");
      field<HTMLAnchorElement>(node, "back").href = pageUrl;
      setDate(field(node, "date"), post.published_at, date);
      field(node, "title").textContent = post.title ?? "";
      // The CMS cleans the HTML of the post text before sending it.
      field(node, "body").innerHTML = post.body ?? "";

      const cover = field<HTMLImageElement>(node, "cover");
      if (post.cover) {
        showPicture(cover, post.cover, post.cover.url, COVER_SIZES, api);
        cover.alt = post.cover.alt ?? "";
      } else cover.remove();

      const pictures = post.images ?? [];
      const pictureList = field(node, "picture-list");
      for (const image of pictures) {
        const item = template(root, "[data-news-picture]");
        field<HTMLAnchorElement>(item, "link").href = image.url;
        const img = field<HTMLImageElement>(item, "image");
        showPicture(img, image, image.thumb_url, GALLERY_SIZES, api);
        img.alt = image.alt ?? image.caption ?? "";
        fillOrRemove(field(item, "caption"), image.caption);
        pictureList.append(item);
      }
      if (pictures.length === 0) field(node, "pictures").remove();

      const documents = post.documents ?? [];
      const documentList = field(node, "document-list");
      for (const file of documents) {
        const item = template(root, "[data-news-document]");
        field<HTMLAnchorElement>(item, "link").href = file.url;
        field(item, "name").textContent = file.name;
        fillOrRemove(field(item, "size"), formatSize(file.size, locale));
        documentList.append(item);
      }
      if (documents.length === 0) field(node, "documents").remove();

      container.replaceChildren(node);
      container.hidden = false;
      setStatus("");
      showSeo(post.seo?.title || post.title, post.seo?.description || post.excerpt);
    } catch {
      setStatus(labels.error);
    } finally {
      root.removeAttribute("aria-busy");
    }
  }
}

/**
 * A CMS picture in its sizes (the browser picks one for `sizes`), cropped around the
 * focal point set in the CMS.
 */
function showPicture(
  img: HTMLImageElement,
  image: CmsImage,
  src: string,
  sizes: string,
  api: string,
): void {
  img.src = src;
  const srcset = safeSrcset(image.srcset, api);
  if (srcset) {
    img.srcset = srcset;
    img.sizes = sizes;
  }
  if (image.width && image.height) {
    img.width = image.width;
    img.height = image.height;
  }
  const focal = focalClass(image.focal);
  if (focal) img.classList.add(focal);
}

/**
 * The post's title and description in the page head, for search engines (which run
 * this script) and the browser tab.
 */
function showSeo(title: string | null | undefined, description: string | null | undefined): void {
  if (title) document.title = `${title} | ${document.title.split(" | ").pop()}`;
  if (description) {
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute("content", description);
  }
}

function template(root: HTMLElement, selector: string): DocumentFragment {
  const element = root.querySelector<HTMLTemplateElement>(`template${selector}`)!;
  return element.content.cloneNode(true) as DocumentFragment;
}

function field<T extends HTMLElement = HTMLElement>(node: ParentNode, name: string): T {
  return node.querySelector<T>(`[data-field="${name}"]`)!;
}

function fillOrRemove(element: HTMLElement, text: string | null | undefined): void {
  if (text) element.textContent = text;
  else element.remove();
}

function setDate(element: HTMLElement, iso: string | null, format: Intl.DateTimeFormat): void {
  if (!iso) return element.remove();
  element.textContent = format.format(new Date(iso));
  element.setAttribute("datetime", iso);
}

export function formatSize(bytes: number | null, locale: string): string | null {
  if (!bytes) return null;
  const units = ["B", "kB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: exponent > 1 ? 1 : 0 }).format(value)} ${units[exponent]}`;
}
