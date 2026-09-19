import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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
  assert.match(html, /<link rel="stylesheet" href="themes\.css">/);
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
});

test("all public cards have a real destination", () => {
  const cards = [...html.matchAll(/<a class="link-card[^"]*" href="([^"]+)"/g)]
    .map((match) => match[1]);
  assert.equal(cards.length, 6);
  for (const destination of cards) {
    assert.match(destination, /^https:\/\//);
  }
});
