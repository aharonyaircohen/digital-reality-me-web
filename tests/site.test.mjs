import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(resolve(root, "index.html"), "utf8");
const themes = await readFile(resolve(root, "themes.css"), "utf8");
const styles = await readFile(resolve(root, "styles.css"), "utf8");
const script = await readFile(resolve(root, "script.js"), "utf8");

test("page declares Hebrew RTL, its theme, and essential metadata", () => {
  assert.match(html, /<html lang="he" dir="rtl" data-theme="deep-water">/);
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/aharonyaircohen\.github\.io\/me\/">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/aharonyaircohen\.github\.io\/me\/assets\/images\/social-preview\.png">/);
  assert.doesNotMatch(html, /my-linktree/);
  assert.match(html, /<link rel="stylesheet" href="themes\.css\?v=[^"]+">/);
  assert.match(html, /<link rel="stylesheet" href="styles\.css\?v=[^"]+">/);
});

test("links are grouped for easier scanning", () => {
  for (const section of ["קורסים וסדנאות", "קבוצות ומעגלים", "מאמרים — מים", "מאמרים — תודעה"]) {
    assert.match(html, new RegExp(section));
  }
});

test("content library keeps its complete structure", () => {
  assert.equal((html.match(/class="featured-card"/g) ?? []).length, 4);
  assert.equal((html.match(/class="media-row media-row--community"/g) ?? []).length, 2);
  assert.equal((html.match(/class="media-row media-row--contact"/g) ?? []).length, 1);
  assert.equal((html.match(/class="media-row media-row--water"/g) ?? []).length, 11);
  assert.equal((html.match(/class="media-row media-row--mind"/g) ?? []).length, 10);
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

test("expandable article lists stay available without extra tab navigation", () => {
  assert.doesNotMatch(html, /class="section-nav"/);
  assert.equal((html.match(/data-collapsible/g) ?? []).length, 2);
  assert.equal((html.match(/class="show-more"/g) ?? []).length, 2);
  assert.match(script, /classList\.add\("is-collapsed"\)/);
  assert.match(script, /aria-expanded/);
});

test("course cards stay clean while smaller rows keep subtle chevrons", () => {
  assert.doesNotMatch(html, /class="card-arrow"/);
  assert.equal((html.match(/class="row-arrow"/g) ?? []).length, 24);
});

test("mobile layout shows four articles before expanding", () => {
  assert.match(styles, /\.article-list\.is-collapsed \.media-row:nth-child\(n \+ 5\)/);
  assert.match(styles, /\.featured-card \{\s*height: 190px;/);
  assert.match(styles, /object-position: center 38%/);
});

test("external blank-target links are protected", () => {
  const blankLinks = html.match(/<a\b[^>]*target="_blank"[^>]*>/g) ?? [];
  assert.ok(blankLinks.length >= 30);
  for (const link of blankLinks) {
    assert.match(link, /rel="noopener noreferrer"/);
  }
});

test("all local image files exist", async () => {
  const imagePaths = [...new Set(
    [...html.matchAll(/(?:src|href)="(assets\/images\/[^"]+)"/g)]
      .map((match) => match[1]),
  )];
  assert.ok(imagePaths.length >= 30);
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
  assert.equal(cards.length, 28);
  for (const destination of cards) {
    assert.match(destination, /^https:\/\//);
  }
});
