import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(resolve(root, "index.html"), "utf8");
const themes = await readFile(resolve(root, "themes.css"), "utf8");

test("page declares Hebrew RTL, its theme, and essential metadata", () => {
  assert.match(html, /<html lang="he" dir="rtl" data-theme="ocean-blue">/);
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/aharonyaircohen\.github\.io\/me\/">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/aharonyaircohen\.github\.io\/me\/assets\/images\/social-preview\.png">/);
  assert.doesNotMatch(html, /my-linktree/);
  assert.match(html, /<link rel="stylesheet" href="themes\.css\?v=[^"]+">/);
  assert.match(html, /<link rel="stylesheet" href="styles\.css\?v=[^"]+">/);
});

test("links are grouped for easier scanning", () => {
  for (const section of ["קורסים ותכנים", "קהילה וסדנאות", "יצירת קשר"]) {
    assert.match(html, new RegExp(section));
  }
});

test("all documented themes are defined", () => {
  for (const theme of ["ocean-blue", "sky", "deep-water"]) {
    assert.match(themes, new RegExp(`\\[data-theme="${theme}"\\]`));
  }
});

test("external blank-target links are protected", () => {
  const blankLinks = html.match(/<a\b[^>]*target="_blank"[^>]*>/g) ?? [];
  assert.ok(blankLinks.length >= 8);
  for (const link of blankLinks) {
    assert.match(link, /rel="noopener noreferrer"/);
  }
});

test("all local image files exist", async () => {
  const imagePaths = [...html.matchAll(/(?:src|href)="(assets\/images\/[^"]+)"/g)]
    .map((match) => match[1]);
  assert.ok(imagePaths.length >= 7);
  await Promise.all(imagePaths.map((path) => access(resolve(root, path))));
  await access(resolve(root, "assets/images/social-preview.png"));
});

test("web images stay lightweight", async () => {
  const webImages = [
    "profile.webp",
    "yama-course.webp",
    "yama-support.webp",
    "dehydration-course.webp",
    "digital-reality.webp",
    "contact.webp",
  ];

  for (const image of webImages) {
    const details = await stat(resolve(root, "assets/images", image));
    assert.ok(details.size < 200_000, `${image} should stay below 200 KB`);
  }

  const preview = await stat(resolve(root, "assets/images/social-preview.png"));
  assert.ok(preview.size < 1_000_000, "social preview should stay below 1 MB");
});

test("all public cards have a real destination", () => {
  const cards = [...html.matchAll(/<a class="link-card[^"]*" href="([^"]+)"/g)]
    .map((match) => match[1]);
  assert.equal(cards.length, 6);
  for (const destination of cards) {
    assert.match(destination, /^https:\/\//);
  }
});
