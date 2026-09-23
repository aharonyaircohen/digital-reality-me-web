import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import sharp from "sharp";
import { build, isPublicHebrewPost, topicFor } from "../scripts/build.mjs";

test("publication and language filters keep English and pending posts off the site", () => {
  assert.equal(isPublicHebrewPost({ status: "publish", title: "מים ובריאות" }, ""), true);
  assert.equal(isPublicHebrewPost({ status: "publish", title: "Water and health" }, ""), false);
  assert.equal(isPublicHebrewPost({ status: "pending", title: "מים ובריאות" }, ""), false);
});

test("topics come from post context when source categories are unhelpful", () => {
  for (const [title, topic] of [
    ["נחושת ותכונותיה", "מים"],
    ["השקט הפנימי", "תודעה"],
    ["למה אכילה מודעת משפרת את העיכול", "תזונה"],
    ["הגוף כמחשב הידרופילי ביו־אלקטרי", "בריאות"],
  ]) {
    assert.equal(topicFor({ title, categories: ["ללא קטגוריה"] }), topic);
  }
});

test("one template renders only eligible source posts and their media", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "me-build-test-"));
  const source = join(temporary, "source");
  const destination = join(temporary, "site");
  const image = await sharp({ create: { width: 1, height: 1, channels: 3, background: "white" } }).png().toBuffer();
  const createPost = async (id, title, status) => {
    const directory = join(source, "posts", String(id));
    await mkdir(join(directory, "media"), { recursive: true });
    await writeFile(join(directory, "metadata.json"), JSON.stringify({
      wordpress_id: id, title, status, categories: ["ללא קטגוריה"],
      published_at: "2025-10-18 16:12:46", source_url: `https://example.com/${id}`,
      featured_media_source_url: `https://example.com/${id}.png`,
      media: [{ file: "media/image.png", source_url: `https://example.com/${id}.png` }],
    }));
    await writeFile(join(directory, "source.html"), '<p>טקסט המאמר</p><img src="./media/image.png" alt="">');
    await writeFile(join(directory, "media", "image.png"), image);
  };

  try {
    await createPost(1, "מים ובריאות", "publish");
    await createPost(2, "English post", "publish");
    await createPost(3, "השקט הפנימי", "pending");
    const posts = await build(source, destination);
    assert.deepEqual(posts.map((post) => post.metadata.wordpress_id), [1]);
    const homepage = await readFile(join(destination, "index.html"), "utf8");
    const article = await readFile(join(destination, "posts", "1", "index.html"), "utf8");
    assert.match(homepage, /href="posts\/1\/"/);
    assert.doesNotMatch(homepage, /posts\/(?:2|3)\//);
    assert.match(article, /<span class="post-category">מים<\/span>/);
    assert.match(article, /<p>טקסט המאמר<\/p><img src="\.\/media\/featured\.webp"/);
    assert.deepEqual(await readdir(join(destination, "posts")), ["1"]);
    assert.deepEqual(await readdir(join(destination, "posts", "1", "media")), ["featured.webp"]);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
