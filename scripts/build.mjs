import { execFile } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import sharp from "sharp";

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const topics = ["מים", "תודעה", "תזונה", "בריאות"];
const rowClass = { מים: "water", תודעה: "mind", תזונה: "water", בריאות: "mind" };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function isPublicHebrewPost(metadata, content) {
  if (metadata.status !== "publish") return false;
  const text = metadata.title || content.replace(/<[^>]+>/g, " ").slice(0, 1000);
  return (text.match(/[\u0590-\u05ff]/g) ?? []).length >= 3;
}

export function topicFor(metadata) {
  const title = (metadata.title || "").normalize("NFD").replace(/[\u0591-\u05c7]/g, "");
  const category = (metadata.categories || []).join(" ").normalize("NFD").replace(/[\u0591-\u05c7]/g, "");
  if (/מים|וורטקס|התייבשות|בצורת תאית|נחושת|אוסמוזה|ימה|שקית התה|מיקרו קלסטרינג/.test(title)) return "מים";
  if (/אכיל|אוכל|מזון|מלח|תזונה/.test(title)) return "תזונה";
  if (/נפש|תודעה|ילד הפנימי|האני כמחשב|מוח כמחשב|עץ הצללים|השקט|דממה|מראות|שליטה מול ביטחון/.test(title)) return "תודעה";
  if (/מים/.test(category)) return "מים";
  if (/תודעה/.test(category)) return "תודעה";
  if (/תזונה|הזנה/.test(category)) return "תזונה";
  return "בריאות";
}

function render(template, values) {
  return template.replace(/{{([A-Z_]+)}}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Missing template value: ${key}`);
    return values[key];
  });
}

async function optimizeImage(input, output) {
  for (const width of [1200, 1000, 800]) {
    for (const quality of [78, 65, 52]) {
      const bytes = await sharp(input).rotate().resize({ width, withoutEnlargement: true })
        .webp({ quality }).toBuffer();
      if (bytes.length < 200_000 || (width === 800 && quality === 52)) {
        await writeFile(output, bytes);
        return;
      }
    }
  }
}

async function writePost(post, template, destination) {
  const { directory, metadata } = post;
  const id = String(metadata.wordpress_id);
  const mediaDirectory = join(destination, "posts", id, "media");
  await mkdir(mediaDirectory, { recursive: true });
  const featured = metadata.media.find((item) => item.source_url === metadata.featured_media_source_url);
  if (!featured) throw new Error(`Post ${id} has no local featured image`);

  let content = post.content;
  const used = new Set([featured.file]);
  for (const [, file] of content.matchAll(/\.\/media\/([^"'?#\s)]+)/g)) used.add(`media/${file}`);
  for (const file of used) {
    const asset = metadata.media.find((item) => item.file === file);
    if (!asset) throw new Error(`Post ${id} references missing media: ${file}`);
    const source = join(directory, file);
    const image = extname(file).toLowerCase() !== ".pdf";
    const outputName = file === featured.file ? "featured.webp" :
      image ? `${basename(file, extname(file))}.webp` : basename(file);
    const target = join(mediaDirectory, outputName);
    if (image) await optimizeImage(source, target);
    else await cp(source, target);
    content = content.replaceAll(`./${file}`, `./media/${outputName}`);
  }

  const title = metadata.title || "טבלה מורחבת — השקט הפנימי";
  const date = (metadata.published_at || "").slice(0, 10);
  const html = render(template, {
    ID: escapeHtml(id), TITLE: escapeHtml(title), CATEGORY: escapeHtml(post.topic),
    DATE: escapeHtml(date), SOURCE_URL: escapeHtml(metadata.source_url), CONTENT: content,
  });
  await writeFile(join(destination, "posts", id, "index.html"), html);
}

export async function build(source, destination = join(root, "dist")) {
  const entries = await readdir(join(source, "posts"), { withFileTypes: true });
  const posts = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const directory = join(source, "posts", entry.name);
    const metadata = JSON.parse(await readFile(join(directory, "metadata.json"), "utf8"));
    if (metadata.status !== "publish") continue;
    const content = await readFile(join(directory, "source.html"), "utf8");
    if (!isPublicHebrewPost(metadata, content)) continue;
    posts.push({ directory, metadata, content, topic: topicFor(metadata) });
  }
  posts.sort((a, b) => b.metadata.published_at.localeCompare(a.metadata.published_at));

  const staging = await mkdtemp(join(root, ".site-build-"));
  try {
    for (const asset of ["404.html", "CNAME", ".nojekyll", "styles.css", "themes.css"]) {
      await cp(join(root, asset), join(staging, asset));
    }
    await cp(join(root, "assets"), join(staging, "assets"), { recursive: true });

    const postTemplate = await readFile(join(root, "templates/post.html"), "utf8");
    for (const post of posts) await writePost(post, postTemplate, staging);

    const groups = topics.map((topic, index) => {
      const cards = posts.filter((post) => post.topic === topic).map(({ metadata }) => {
        const id = escapeHtml(metadata.wordpress_id);
        const title = escapeHtml(metadata.title || "טבלה מורחבת — השקט הפנימי");
        return `                <a class="media-row media-row--${rowClass[topic]}" href="posts/${id}/" lang="he">\n` +
          `                  <img src="posts/${id}/media/featured.webp" alt="" loading="lazy">\n` +
          `                  <span><strong>${title}</strong></span><span class="row-arrow" aria-hidden="true">←</span>\n` +
          `                </a>`;
      }).join("\n");
      if (!cards) return "";
      const number = index + 1;
      return `            <section class="post-group" id="category-${number}" aria-labelledby="category-${number}-title">\n` +
        `              <h3 id="category-${number}-title">${topic}</h3>\n` +
        `              <div class="article-list">\n${cards}\n              </div>\n            </section>`;
    }).filter(Boolean).join("\n");
    const homeTemplate = await readFile(join(root, "templates/index.html"), "utf8");
    await writeFile(join(staging, "index.html"), render(homeTemplate, {
      POST_GROUPS: `<div class="post-groups">\n${groups}\n          </div>`,
    }));
    await rm(destination, { recursive: true, force: true });
    await rename(staging, destination);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
  return posts;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceArg = process.argv.indexOf("--source");
  let source = sourceArg >= 0 ? resolve(process.argv[sourceArg + 1]) : null;
  let checkout;
  try {
    if (!source) {
      checkout = await mkdtemp(join(tmpdir(), "me-content-library-"));
      source = join(checkout, "content-library");
      await run("gh", ["repo", "clone", "aharonyaircohen/content-library", source, "--", "--depth", "1"]);
    }
    const posts = await build(source);
    console.log(`Built ${posts.length} Hebrew posts from content-library into dist/`);
  } finally {
    if (checkout) await rm(checkout, { recursive: true, force: true });
  }
}
