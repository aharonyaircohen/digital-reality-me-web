import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { decodeContentsResponse, githubFileUrl, homepageFeaturedImageUrl, isPublishedHebrewPost, topicForPost } from "../scripts/posts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(resolve(root, "index.html"), "utf8");
const postHtml = await readFile(resolve(root, "post.html"), "utf8");
const themes = await readFile(resolve(root, "themes.css"), "utf8");
const styles = await readFile(resolve(root, "styles.css"), "utf8");
const notFound = await readFile(resolve(root, "404.html"), "utf8");

test("page declares Hebrew RTL, its theme, and essential metadata", () => {
  assert.match(html, /<html lang="he" dir="rtl" data-theme="deep-water">/);
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/me\.thedigitalreality\.app\/">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/me\.thedigitalreality\.app\/assets\/images\/social-preview\.png\?v=[^"]+">/);
  assert.doesNotMatch(html, /my-linktree/);
  assert.match(html, /<link rel="stylesheet" href="themes\.css\?v=[^"]+">/);
  assert.match(html, /<link rel="stylesheet" href="styles\.css\?v=[^"]+">/);
});

test("links are grouped for easier scanning", () => {
  for (const section of ["קורסים וסדנאות", "קבוצות ומעגלים", "מאמרים"]) {
    assert.match(html, new RegExp(section));
  }
});

test("content library keeps its complete structure", () => {
  assert.equal((html.match(/class="featured-card"/g) ?? []).length, 4);
  assert.equal((html.match(/class="media-row media-row--community"/g) ?? []).length, 2);
  assert.equal((html.match(/class="media-row media-row--contact"/g) ?? []).length, 1);
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
    assert.equal((html.match(new RegExp(`href="#icon-${icon}"`, "g")) ?? []).length, 2);
  }
  assert.equal((html.match(/aria-label="(?:Instagram|Facebook|Email)"/g) ?? []).length, 6);
});

test("published posts are visible by category without an archive or disclosure control", () => {
  assert.doesNotMatch(html, /class="section-nav"/);
  assert.equal((html.match(/<section class="post-group"/g) ?? []).length, 4);
  assert.doesNotMatch(html, /<details|<summary|posts-entry|script\.js|ארכיון הפוסטים/);
});

test("post runtime URL changes when the GitHub image loader is updated", () => {
  for (const page of [html, postHtml]) {
    assert.match(page, /scripts\/posts\.mjs\?v=4ded655/);
    assert.doesNotMatch(page, /scripts\/posts\.mjs\?v=20260923-runtime/);
  }
});

test("course cards stay clean while smaller rows keep subtle chevrons", () => {
  assert.doesNotMatch(html, /class="card-arrow"/);
  assert.equal((html.match(/class="row-arrow"/g) ?? []).length, 3);
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
  assert.match(html, /--image-position-mobile: center 38%/);
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
  const blankLinks = html.match(/<a\b[^>]*target="_blank"[^>]*>/g) ?? [];
  assert.ok(blankLinks.length >= 7);
  for (const link of blankLinks) {
    assert.match(link, /rel="noopener noreferrer"/);
  }
});

test("all local image files exist", async () => {
  const imagePaths = [...new Set(
    [...html.matchAll(/(?:src|href)="(assets\/images\/[^"]+)"/g)]
      .map((match) => match[1]),
  )];
  assert.ok(imagePaths.length >= 7);
  await Promise.all(imagePaths.map((path) => access(resolve(root, path))));
  await access(resolve(root, "assets/images/social-preview.png"));
});

test("web images stay lightweight", async () => {
  const webImages = [...new Set(
    [...html.matchAll(/src="(assets\/images\/[^"]+\.webp)"/g)]
      .map((match) => match[1]),
  )];

  for (const image of webImages) {
    const details = await stat(resolve(root, image));
    assert.ok(details.size < 200_000, `${image} should stay below 200 KB`);
  }

  const preview = await stat(resolve(root, "assets/images/social-preview.png"));
  assert.ok(preview.size < 1_000_000, "social preview should stay below 1 MB");
});

test("all public content cards have a real destination", () => {
  const cards = [...html.matchAll(/<a class="(?:featured-card|media-row[^"]*)" href="([^"]+)"/g)]
    .map((match) => match[1]);
  assert.equal(cards.length, 7);
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

test("old Hebrew post URLs redirect to the shared template without copied media", async () => {
  const postIds = await readdir(resolve(root, "posts"));
  assert.ok(postIds.length > 0);
  for (const id of postIds) {
    assert.match(id, /^\d+$/);
    const redirect = await readFile(resolve(root, "posts", id, "index.html"), "utf8");
    assert.match(redirect, new RegExp(`post\\.html\\?id=${id}`));
    await assert.rejects(access(resolve(root, "posts", id, "media")));
  }
  await assert.rejects(access(resolve(root, "posts", "142", "index.html")));
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
