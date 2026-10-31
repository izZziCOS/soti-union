<?php

/**
 * Link previews of news posts. Facebook, LinkedIn and the other link preview crawlers
 * do not run JavaScript, so they would only see the news page's own title and picture.
 * .htaccess sends them (only them) here for /news/?post=slug: this is the same news page
 * with the post's title, description and picture from the CMS in its head. The link
 * stays on the website. Should anything fail, the page is sent as it is.
 *
 * The build writes this file to dist/news-og.php, filling in the placeholders.
 */

declare(strict_types=1);

const CMS_API = '%CMS_API%';   // e.g. https://admin.suerteksa.com/api/v1/soti
const SITE_URL = '%SITE_URL%'; // the website with its base path, without the final slash
const DEFAULT_LOCALE = '%DEFAULT_LOCALE%';

$lang = is_string($_GET['lang'] ?? null) && preg_match('/^[a-z]{2}$/', $_GET['lang']) ? $_GET['lang'] : DEFAULT_LOCALE;
$prefix = $lang === DEFAULT_LOCALE ? '' : "{$lang}/";
$page = __DIR__."/{$prefix}news/index.html";

if (! is_file($page)) {
    $prefix = '';
    $lang = DEFAULT_LOCALE;
    $page = __DIR__.'/news/index.html';
}

$html = (string) file_get_contents($page);
$slug = is_string($_GET['post'] ?? null) ? $_GET['post'] : '';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=300');

$post = preg_match('/^[A-Za-z0-9_-]{1,255}$/', $slug) === 1 && CMS_API !== '' ? fetchPost($slug, $lang) : null;

if ($post === null) {
    echo $html;

    exit;
}

$seo = is_array($post['seo'] ?? null) ? $post['seo'] : [];
$title = text($seo['title'] ?? null) ?? text($post['title'] ?? null);
$description = text($seo['description'] ?? null) ?? text($post['excerpt'] ?? null);
$image = is_array($seo['image'] ?? null) ? $seo['image'] : null;
$url = SITE_URL."/{$prefix}news/?post=".rawurlencode($slug);

if ($title !== null) {
    // "News | Company" becomes "Post title | Company"
    $html = (string) preg_replace_callback('#<title>(.*?)</title>#s', function (array $match) use ($title): string {
        $parts = explode(' | ', html_entity_decode($match[1], ENT_QUOTES | ENT_HTML5));

        return '<title>'.e($title.(count($parts) > 1 ? ' | '.end($parts) : '')).'</title>';
    }, $html, 1);
    $html = setMeta($html, 'property', 'og:title', $title);
    $html = setMeta($html, 'name', 'twitter:title', $title);
}

if ($description !== null) {
    $html = setMeta($html, 'name', 'description', $description);
    $html = setMeta($html, 'property', 'og:description', $description);
    $html = setMeta($html, 'name', 'twitter:description', $description);
}

if ($image !== null && webUrl($image['url'] ?? null) !== null) {
    $html = setMeta($html, 'property', 'og:image', (string) webUrl($image['url']));
    $html = setMeta($html, 'name', 'twitter:image', (string) webUrl($image['url']));
    $html = setMeta($html, 'property', 'og:image:width', is_int($image['width'] ?? null) ? (string) $image['width'] : null);
    $html = setMeta($html, 'property', 'og:image:height', is_int($image['height'] ?? null) ? (string) $image['height'] : null);
    $html = setMeta($html, 'property', 'og:image:alt', text($image['alt'] ?? null));
}

$html = setMeta($html, 'property', 'og:url', $url);
$html = setMeta($html, 'property', 'og:type', 'article');
$html = (string) preg_replace('#<link\s+rel="canonical"[^>]*>#', '<link rel="canonical" href="'.e($url).'">', $html, 1);

if (is_string($post['published_at'] ?? null)) {
    $html = setMeta($html, 'property', 'article:published_time', $post['published_at']);
}

echo $html;

/**
 * The published post from the CMS in one language, null when there is none or the CMS
 * does not answer in time.
 *
 * @return array<string, mixed>|null
 */
function fetchPost(string $slug, string $lang): ?array
{
    $url = CMS_API.'/news/'.rawurlencode($slug).'?lang='.rawurlencode($lang);

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $body = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    } else {
        $body = @file_get_contents($url, false, stream_context_create([
            'http' => ['timeout' => 5, 'header' => "Accept: application/json\r\n", 'ignore_errors' => true],
        ]));
        $status = preg_match('#^HTTP/\S+\s+(\d+)#', $http_response_header[0] ?? '', $m) === 1 ? (int) $m[1] : 0;
    }

    if (! is_string($body) || $status !== 200) {
        return null;
    }

    $data = json_decode($body, true);

    return is_array($data) && is_array($data['data'] ?? null) ? $data['data'] : null;
}

/**
 * Set the content of a meta tag, adding the tag when the page has none; a null
 * content removes it.
 */
function setMeta(string $html, string $attribute, string $key, ?string $content): string
{
    $pattern = '#<meta\s[^>]*'.$attribute.'="'.preg_quote($key, '#').'"[^>]*>\s*#';
    $tag = $content === null ? '' : '<meta '.$attribute.'="'.e($key).'" content="'.e($content).'">';

    if (preg_match($pattern, $html) === 1) {
        return (string) preg_replace_callback($pattern, fn () => $tag, $html, 1);
    }

    return $tag === '' ? $html : (string) preg_replace('#</head>#', $tag.'</head>', $html, 1);
}

function text(mixed $value): ?string
{
    return is_string($value) && trim($value) !== '' ? trim($value) : null;
}

/** Only http(s) addresses from the CMS reach the page. */
function webUrl(mixed $value): ?string
{
    return is_string($value) && preg_match('#^https?://#i', $value) === 1 && filter_var($value, FILTER_VALIDATE_URL) !== false ? $value : null;
}

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}
