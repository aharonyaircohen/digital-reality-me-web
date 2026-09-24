import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { HOMEPAGE_PATH, loadProfile, renderHomepage, decodeContentsResponse, githubFileUrl, homepageFeaturedImageUrl, isPublishedHebrewPost, topicForPost } from "../scripts/posts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(resolve(root, "index.html"), "utf8");
const postHtml = await readFile(resolve(root, "post.html"), "utf8");
const styles = await readFile(resolve(root, "assets/site.css"), "utf8");
const themes = styles;
const notFound = await readFile(resolve(root, "404.html"), "utf8");

// Synthetic content exercises the template without keeping a copy of live content.
const card = { title: "כותרת", subtitle: "תיאור", url: "https://example.org/course", image: "pages/3988-yac/media/example.webp" };
const profile = {
  name: "שם לדוגמה", kicker: "פתיח", description: "תיאור לדוגמה",
  hero: { image: card.image, alt: "תיאור תמונה" },
  social: [
    { icon: "instagram", label: "Instagram", url: "https://example.org/instagram" },
    { icon: "facebook", label: "Facebook", url: "https://example.org/facebook" },
    { icon: "email", label: "Email", url: "mailto:example@example.org" },
  ],
  courses: { kicker: "ללמוד", title: "קורסים וסדנאות", items: [card, card] },
  community: { kicker: "להתחבר", title: "קבוצות ומעגלים", items: [{ ...card, kind: "community" }, { ...card, kind: "contact" }] },
  posts: { kicker: "לקריאה", title: "מאמרים" },
  footer: { text: "סיום", socialOrder: ["instagram", "email", "facebook"] },
};
const rendered = Object.values(renderHomepage(profile)).join("\n");

test("page declares Hebrew RTL, its theme, and essential metadata", () => {
  assert.match(html, /<html lang="he" dir="rtl" data-theme="deep-water">/);
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/me\.thedigitalreality\.app\/">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/raw\.githubusercontent\.com\/aharonyaircohen\/digital-reality-web-content\/main\/pages\/3988-yac\/media\/social-preview\.png\?v=[^"]+">/);
  assert.doesNotMatch(html, /my-linktree/);
  assert.match(html, /<link rel="stylesheet" href="assets\/site\.css\?v=[^"]+">/);
});

test("links are grouped for easier scanning", () => {
  for (const section of ["קורסים וסדנאות", "קבוצות ומעגלים", "מאמרים"]) {
    assert.match(rendered, new RegExp(section));
  }
});

test("content library keeps its complete structure", () => {
  assert.equal((rendered.match(/class="featured-card"/g) ?? []).length, 2);
  assert.equal((rendered.match(/class="media-row media-row--community"/g) ?? []).length, 1);
  assert.equal((rendered.match(/class="media-row media-row--contact"/g) ?? []).length, 1);
  assert.equal((html.match(/class="media-row media-row--water"/g) ?? []).length, 0);
  assert.equal((html.match(/class="media-row media-row--mind"/g) ?? []).length, 0);
});

test("all documented themes are defined", () => {
  for (const theme of ["ocean-blue", "sky", "deep-water"]) {
    assert.match(themes, new RegExp(`\\[data-theme="${theme}"\\]`));
  }
});

test("deep-water uses the Digital Reality background palette", () => {
  for (const color of ["#0a0f2a", "#020064", "#300060", "#6a00a8", "#b300b3"]) {
    assert.match(themes, new RegExp(color));
  }
  assert.match(styles, /linear-gradient\(135deg, var\(--page-start\), var\(--page-middle\), var\(--page-end\)\)/);
  assert.match(styles, /background: var\(--content-base\)/);
  assert.match(html, /<meta name="theme-color" content="#0a0f2a">/);
});

test("desktop proportions match the reference layout", () => {
  assert.match(styles, /width: min\(100% - 40px, 760px\)/);
  assert.match(styles, /padding: 36px 0/);
  assert.match(styles, /width: min\(100%, 680px\)/);
  assert.match(styles, /height: 240px/);
  assert.match(styles, /\.hero[\s\S]*?background: var\(--content-base\)/);
  assert.match(styles, /footer[\s\S]*?background: var\(--content-base\)/);
});

test("header, content, shell, and footer share one seamless background", () => {
  assert.match(styles, /\.site-shell[\s\S]*?background: var\(--content-base\)/);
  assert.match(styles, /\.hero[\s\S]*?background: var\(--content-base\)/);
  assert.match(styles, /\.content-shell[\s\S]*?background: var\(--content-base\)/);
  assert.match(styles, /footer[\s\S]*?background: var\(--content-base\)/);
  assert.doesNotMatch(styles, /footer[\s\S]*?border-top:/);
});

test("social links use the shared polished icon set", () => {
  for (const icon of ["instagram", "facebook", "email"]) {
    assert.match(html, new RegExp(`<symbol id="icon-${icon}"`));
    assert.equal((rendered.match(new RegExp(`href="#icon-${icon}"`, "g")) ?? []).length, 2);
  }
  assert.equal((rendered.match(/aria-label="(?:Instagram|Facebook|Email)"/g) ?? []).length, 6);
});

test("published posts are visible by category without an archive or disclosure control", () => {
  assert.doesNotMatch(html, /class="section-nav"/);
  assert.equal((html.match(/<section class="post-group"/g) ?? []).length, 4);
  assert.doesNotMatch(html, /<details|<summary|posts-entry|script\.js|ארכיון הפוסטים/);
});

test("post runtime URL changes when the GitHub image loader is updated", () => {
  for (const page of [html, postHtml]) {
    assert.match(page, /scripts\/posts\.mjs\?v=20260924-homepage/);
    assert.doesNotMatch(page, /scripts\/posts\.mjs\?v=20260923-runtime/);
  }
});

test("course cards stay clean while smaller rows keep subtle chevrons", () => {
  assert.doesNotMatch(rendered, /class="card-arrow"/);
  assert.equal((rendered.match(/class="row-arrow"/g) ?? []).length, 2);
});

test("mobile layout keeps featured cards and category headings", () => {
  assert.match(styles, /\.post-group h3/);
  assert.match(styles, /\.featured-card \{\s*height: 190px;/);
  assert.match(styles, /--image-position-mobile/);
});

test("post pages use the site palette and align featured images with article width", () => {
  assert.match(styles, /\.post-content \{[\s\S]*?width: min\(100%, 680px\);[\s\S]*?color: var\(--ink\);[\s\S]*?background: rgba\(12, 42, 84, 0\.88\);/);
  assert.match(styles, /\.post-featured-image \{[\s\S]*?width: min\(100%, 680px\);[\s\S]*?height: auto;/);
  assert.doesNotMatch(styles, /\.post-content \{[^}]*background: #f8fbff;/);
});

test("images support optional focal points without CSS edits", () => {
  assert.match(styles, /object-position: var\(--image-position, center 45%\)/);
  assert.match(styles, /object-position: var\(--image-position, center\)/);
  assert.match(rendered, /--image-position-mobile: center 38%/);
});

test("custom 404 page returns visitors to the profile", () => {
  assert.match(notFound, /<meta name="robots" content="noindex">/);
  assert.match(notFound, /<html lang="he" dir="rtl" data-theme="deep-water">/);
  assert.match(notFound, /href="\/"/);
  assert.match(notFound, /404/);
});

test("custom domain configuration is present", async () => {
  const cname = await readFile(resolve(root, "CNAME"), "utf8");
  assert.equal(cname.trim(), "me.thedigitalreality.app");
  assert.doesNotMatch(html, /aharonyaircohen\.github\.io\/me/);
});

test("external blank-target links are protected", () => {
  const blankLinks = rendered.match(/<a\b[^>]*target="_blank"[^>]*>/g) ?? [];
  assert.ok(blankLinks.length >= 7);
  for (const link of blankLinks) {
    assert.match(link, /rel="noopener noreferrer"/);
  }
});

test("all page images and sharing metadata use the public content repository", () => {
  const mediaRoot = "https://raw.githubusercontent.com/aharonyaircohen/digital-reality-web-content/main/pages/3988-yac/media/";
  for (const page of [html, postHtml, notFound, rendered]) {
    const imageUrls = [
      ...[...page.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]),
      ...[...page.matchAll(/<link rel="icon" href="([^"]+)"/g)].map((match) => match[1]),
      ...[...page.matchAll(/<meta (?:property="og:image"|name="twitter:image") content="([^"]+)"/g)].map((match) => match[1]),
    ];
    assert.ok(imageUrls.length > 0);
    for (const url of imageUrls) assert.ok(url.startsWith(mediaRoot), `Unexpected image source: ${url}`);
    assert.doesNotMatch(page, /assets\/images\//);
  }
  assert.equal((rendered.match(/<img[^>]+src="https:/g) || []).length, 5);
});

test("each page loads one shared stylesheet from a valid local path", async () => {
  for (const page of [html, postHtml, notFound]) {
    const sheets = [...page.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(sheets.length, 1);
    assert.match(sheets[0], /^\/?assets\/site\.css\?v=/);
    await access(resolve(root, sheets[0].replace(/^\//, "").split("?")[0]));
  }
});

test("all public content cards have a real destination", () => {
  const cards = [...rendered.matchAll(/<a class="(?:featured-card|media-row[^"]*)" href="([^"]+)"/g)]
    .map((match) => match[1]);
  assert.equal(cards.length, 4);
  for (const destination of cards) {
    assert.match(destination, /^https:\/\//);
  }
});

test("posts load from the GitHub API into one shared page template", async () => {
  const postTemplate = await readFile(resolve(root, "post.html"), "utf8");
  assert.match(html, /src="scripts\/posts\.mjs\?v=/);
  assert.match(html, /id="post-groups" hidden/);
  assert.match(postTemplate, /src="scripts\/posts\.mjs\?v=/);
  assert.match(postTemplate, /id="post-content"[^>]*hidden/);
  assert.match(postTemplate, /id="post-featured-image"/);
  assert.match(postTemplate, /post-page-header/);
  await access(resolve(root, "scripts", "posts.mjs"));
});

test("retired routes and copied media are absent; posts use the shared template", async () => {
  for (const path of ["posts", "assets/images", "PLAN.md", "styles.css", "themes.css"]) {
    await assert.rejects(access(resolve(root, path)));
  }
  const runtime = await readFile(resolve(root, "scripts/posts.mjs"), "utf8");
  assert.match(runtime, /link\.href = `post\.html\?id=/);
  assert.doesNotMatch(html, /href="\/?posts\//);
});

test("GitHub post filtering and topic assignment keep English and drafts out", () => {
  const hebrew = { status: "publish", wordpress_id: 5007, title: "מים מזוקקים בטבע" };
  assert.equal(isPublishedHebrewPost(hebrew), true);
  assert.equal(isPublishedHebrewPost({ ...hebrew, status: "pending" }), false);
  assert.equal(isPublishedHebrewPost({ ...hebrew, title: "English only" }), false);
  assert.equal(topicForPost(hebrew), "מים");
  assert.equal(topicForPost({ title: "אכילה מודעת" }), "תזונה");
  assert.equal(topicForPost({ title: "שקט פנימי" }), "תודעה");
  assert.equal(topicForPost({ title: "תנועה ובריאות הגוף" }), "בריאות");
  assert.equal(isPublishedHebrewPost({ status: "publish", wordpress_id: 4564, title: "" }), true);
  assert.equal(topicForPost({ wordpress_id: 4564, title: "" }), "תודעה");
  assert.match(githubFileUrl("posts/5007/source.html"), /api\.github\.com\/repos\/aharonyaircohen\/digital-reality-web-content\/contents\/posts\/5007\/source\.html\?ref=main/);
});

test("GitHub API file contents decode as UTF-8", () => {
  const json = JSON.stringify({ title: "מים" });
  const content = Buffer.from(json).toString("base64");
  assert.equal(decodeContentsResponse(JSON.stringify({ content })), json);
  assert.equal(decodeContentsResponse("מים", "application/vnd.github.raw"), "מים");
});

test("homepage featured images resolve to the public content repository safely", () => {
  assert.equal(
    homepageFeaturedImageUrl({
      path: "posts/5007-no-distilled-water-in-nature-myth",
      featured_media_path: "media/snow-water.jpg",
    }),
    "https://raw.githubusercontent.com/aharonyaircohen/digital-reality-web-content/main/posts/5007-no-distilled-water-in-nature-myth/media/snow-water.jpg",
  );
  assert.equal(homepageFeaturedImageUrl({ path: "posts/5007" }), null);
  assert.equal(homepageFeaturedImageUrl({ path: "posts/5007", featured_media_path: "../../private.jpg" }), null);
});

function profilePage() {
  const nodes = Object.fromEntries(["profile", "courses", "community", "profile-footer", "posts-kicker", "posts-title"].map((id) => [id, { hidden: true, innerHTML: "" }]));
  const status = { textContent: "loading", removed: false, remove() { this.removed = true; } };
  return { nodes, status, querySelector: () => status, getElementById: (id) => nodes[id] };
}

test("homepage requests the content JSON on page load and renders current values", async () => {
  const page = profilePage();
  const changed = structuredClone(profile);
  changed.name = "שם מעודכן";
  changed.courses.items = [{ ...card, title: "קורס חדש", url: "https://example.org/new" }];
  let requested;
  await loadProfile(page, async (url, options) => {
    requested = { url, options };
    return new Response(JSON.stringify(changed), { headers: { "content-type": "application/vnd.github.raw+json" } });
  });
  assert.equal(requested.url, githubFileUrl(HOMEPAGE_PATH));
  assert.equal(requested.options.cache, "no-store");
  assert.match(page.nodes.profile.innerHTML, /שם מעודכן/);
  assert.match(page.nodes.courses.innerHTML, /קורס חדש/);
  assert.match(page.nodes.courses.innerHTML, /https:\/\/example.org\/new/);
  assert.equal((page.nodes.courses.innerHTML.match(/class="featured-card"/g) || []).length, 1);
  assert.ok(Object.values(page.nodes).every((node) => !node.hidden));
  assert.equal(page.status.removed, true);
  assert.match(html, /id="profile" hidden/);
  assert.doesNotMatch(html, /class="featured-card"|instagram.com|mailto:|chat.whatsapp.com/);
});

test("homepage failures leave a readable message without exposing empty sections", async () => {
  for (const fetchImpl of [
    async () => new Response("limited", { status: 403 }),
    async () => new Response("invalid json", { headers: { "content-type": "application/vnd.github.raw+json" } }),
    async () => new Response("{}", { headers: { "content-type": "application/vnd.github.raw+json" } }),
  ]) {
    const page = profilePage();
    await loadProfile(page, fetchImpl);
    assert.match(page.status.textContent, /לא ניתן לטעון/);
    assert.equal(page.status.removed, false);
    assert.ok(Object.values(page.nodes).every((node) => node.hidden));
  }
});

test("homepage JSON is text, not executable markup or arbitrary image locations", () => {
  const changed = structuredClone(profile);
  changed.name = '<img src=x onerror="alert(1)">';
  assert.match(renderHomepage(changed).profile, /&lt;img/);
  assert.doesNotMatch(renderHomepage(changed).profile, /<img src=x/);
  changed.social[0].url = "javascript:alert(1)";
  assert.throws(() => renderHomepage(changed), /Invalid homepage link/);
  changed.social[0].url = profile.social[0].url;
  changed.hero.image = "pages/3988-yac/media/../private.jpg";
  assert.throws(() => renderHomepage(changed), /Invalid homepage image/);
});
