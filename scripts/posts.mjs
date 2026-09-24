const OWNER = "aharonyaircohen";
const REPOSITORY = "digital-reality-web-content";
const REF = "main";
const API_ROOT = `https://api.github.com/repos/${OWNER}/${REPOSITORY}/contents/`;
const RAW_ROOT = `https://raw.githubusercontent.com/${OWNER}/${REPOSITORY}/${REF}/`;
const TOPICS = ["מים", "תודעה", "תזונה", "בריאות"];
export const HOMEPAGE_PATH = "pages/3988-yac/homepage.json";

function escapeHTML(value) {
  if (typeof value !== "string") throw new Error("Expected homepage text");
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function homepageLink(url) {
  if (typeof url !== "string" || !/^(https:\/\/|mailto:)/.test(url)) throw new Error("Invalid homepage link");
  return `href="${escapeHTML(url)}"${url.startsWith("https://") ? ' target="_blank" rel="noopener noreferrer"' : ""}`;
}

function homepageImage(path) {
  if (typeof path !== "string" || !path.startsWith("pages/3988-yac/media/")
    || path.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("Invalid homepage image");
  return escapeHTML(RAW_ROOT + path.split("/").map(encodeURIComponent).join("/"));
}

// Content is plain text and URLs; markup and layout remain owned by this site.
export function renderHomepage(data) {
  const socialLink = (item) => {
    if (!item || !["instagram", "facebook", "email"].includes(item.icon)) throw new Error("Unknown social icon");
    return `<a ${homepageLink(item.url)} aria-label="${escapeHTML(item.label)}"><svg aria-hidden="true"><use href="#icon-${item.icon}"></use></svg></a>`;
  };
  const heading = (section, id) => `<div class="section-heading"><p>${escapeHTML(section.kicker)}</p><h2 id="${id}-title">${escapeHTML(section.title)}</h2></div>`;
  const course = (item) => `<a class="featured-card" ${homepageLink(item.url)}>
    <img src="${homepageImage(item.image)}" alt="" width="720" height="720">
    <span class="featured-overlay" aria-hidden="true"></span>
    <span class="featured-copy"><small>${escapeHTML(item.subtitle)}</small><strong>${escapeHTML(item.title)}</strong></span>
  </a>`;
  const community = (item) => `<a class="media-row media-row--${item.kind === "contact" ? "contact" : "community"}" ${homepageLink(item.url)}>
    <img src="${homepageImage(item.image)}" alt="" width="240" height="160" loading="lazy">
    <span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.subtitle)}</small></span>
    <span class="row-arrow" aria-hidden="true">←</span>
  </a>`;
  return {
    profile: `<img class="hero-image" src="${homepageImage(data.hero.image)}" alt="${escapeHTML(data.hero.alt)}" width="1000" height="822" style="--image-position: center 43%; --image-position-mobile: center 38%;">
      <div class="hero-shade" aria-hidden="true"></div>
      <div class="hero-content">
        <p class="hero-kicker">${escapeHTML(data.kicker)}</p>
        <h1>${escapeHTML(data.name)}</h1>
        <p class="hero-description">${escapeHTML(data.description)}</p>
        <nav class="social-pills" aria-label="רשתות חברתיות ויצירת קשר">${data.social.map(socialLink).join("")}</nav>
      </div>`,
    courses: heading(data.courses, "courses") + `<div class="featured-list">${data.courses.items.map(course).join("")}</div>`,
    community: heading(data.community, "community") + `<div class="row-list">${data.community.items.map(community).join("")}</div>`,
    "profile-footer": `<nav class="footer-social" aria-label="רשתות חברתיות">${data.footer.socialOrder.map((icon) => socialLink(data.social.find((item) => item.icon === icon))).join("")}</nav><p>${escapeHTML(data.footer.text)}</p>`,
    "posts-kicker": escapeHTML(data.posts.kicker),
    "posts-title": escapeHTML(data.posts.title),
  };
}

export async function loadProfile(page = document, fetchImpl = fetch) {
  const status = page.querySelector("#homepage-load-status");
  try {
    const data = JSON.parse(await fetchGitHubFile(HOMEPAGE_PATH, fetchImpl));
    const sections = renderHomepage(data);
    for (const [id, markup] of Object.entries(sections)) {
      const target = page.getElementById(id);
      target.innerHTML = markup;
      target.hidden = false;
    }
    status.remove();
  } catch {
    status.textContent = "לא ניתן לטעון את פרטי האתר כרגע. אפשר לרענן את העמוד ולנסות שוב.";
  }
}

export function githubFileUrl(path) {
  return `${API_ROOT}${path.split("/").map(encodeURIComponent).join("/")}?ref=${REF}`;
}

export function topicForPost(post) {
  if (TOPICS.includes(post.display_topic)) return post.display_topic;
  const title = post.title || (Number(post.wordpress_id) === 4564 ? "טבלה מורחבת — השקט הפנימי" : "");
  const text = `${title} ${post.excerpt || ""}`.normalize("NFD").replace(/\p{M}/gu, "");
  if (/אוכל|אכילה|תזונה|מלח/.test(text)) return "תזונה";
  if (/נפש|תודעה|ילד.{0,5}פנימי|שקט.{0,6}פנימי|מוח|עץ הצללים|מראות|שליטה|מדיטציה/.test(text)) return "תודעה";
  if (/מים|שתייה|שתיה|סינון|אוסמוזה|וורטקס|מרווים|התייבשות|ימה|נחושת|בצורת תאית|שקית התה|מיקרו קלסטרינג/.test(text)) return "מים";
  return "בריאות";
}

export function isPublishedHebrewPost(post) {
  const title = post?.title || (Number(post?.wordpress_id) === 4564 ? "טבלה מורחבת — השקט הפנימי" : "");
  return post?.status === "publish"
    && Number.isInteger(Number(post.wordpress_id))
    && Number(post.wordpress_id) > 0
    && /[\u0590-\u05ff]/.test(title);
}

function postTitle(post) {
  return post.title || (Number(post.wordpress_id) === 4564 ? "טבלה מורחבת — השקט הפנימי" : "מאמר");
}

export function decodeContentsResponse(text, contentType = "") {
  if (contentType.includes("application/vnd.github.raw")) return text;
  const result = JSON.parse(text);
  if (typeof result.content !== "string") throw new Error("GitHub response has no file content");
  const bytes = Uint8Array.from(atob(result.content.replace(/\s/g, "")), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function fetchGitHubFile(path, fetchImpl = fetch) {
  const response = await fetchImpl(githubFileUrl(path), {
    headers: { Accept: "application/vnd.github.raw+json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  const type = response.headers.get("content-type") || "";
  return decodeContentsResponse(await response.text(), type);
}

function safeArticleHTML(markup, mediaBase) {
  const parsed = new DOMParser().parseFromString(markup, "text/html");
  parsed.querySelectorAll("script, style, iframe, object, embed, form, input, button").forEach((node) => node.remove());
  for (const element of parsed.body.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith("on") || ["style", "srcdoc", "srcset", "action", "formaction"].includes(name)) {
        element.removeAttribute(attribute.name);
      } else if (["href", "src", "xlink:href"].includes(name)) {
        if (/^(javascript|vbscript|data):/i.test(value)) element.removeAttribute(attribute.name);
        else if (/^(\.\/|media\/)/.test(value)) {
          const resolved = new URL(value, mediaBase);
          if (resolved.href.startsWith(mediaBase)) element.setAttribute(attribute.name, resolved.href);
          else element.removeAttribute(attribute.name);
        } else if (value.startsWith("../")) element.removeAttribute(attribute.name);
      }
    }
  }
  return parsed.body.innerHTML;
}

function rawMediaBase(path) {
  return `${RAW_ROOT}${path.replace(/\/$/, "").split("/").map(encodeURIComponent).join("/")}/`;
}

export function homepageFeaturedImageUrl(post) {
  if (typeof post?.path !== "string" || !post.path.startsWith("posts/")
    || post.path.split("/").some((part) => !part || part === "." || part === "..")
    || typeof post.featured_media_path !== "string") return null;
  const mediaPath = post.featured_media_path.replace(/^\.\//, "");
  if (!mediaPath || mediaPath.startsWith("/")
    || mediaPath.split("/").some((part) => !part || part === "." || part === "..")) return null;
  const base = rawMediaBase(post.path);
  const imageUrl = new URL(mediaPath, base).href;
  return imageUrl.startsWith(base) ? imageUrl : null;
}

async function loadHomepage() {
  const target = document.querySelector("#post-groups");
  const status = document.querySelector("#post-load-status");
  try {
    const index = JSON.parse(await fetchGitHubFile("index.json"));
    const posts = (index.posts || []).filter(isPublishedHebrewPost);
    for (const topic of TOPICS) {
      const group = target.querySelector(`[data-topic="${topic}"] .article-list`);
      const groupPosts = posts.filter((post) => topicForPost(post) === topic);
      for (const post of groupPosts) {
        const link = document.createElement("a");
        link.className = `media-row post-list-row ${topic === "תודעה" ? "media-row--mind" : "media-row--water"}`;
        link.href = `post.html?id=${encodeURIComponent(post.wordpress_id)}`;
        link.lang = "he";
        const label = document.createElement("span");
        const title = document.createElement("strong");
        title.textContent = postTitle(post);
        label.append(title);
        const imageUrl = homepageFeaturedImageUrl(post);
        if (imageUrl) {
          const image = document.createElement("img");
          image.src = imageUrl;
          image.alt = "";
          image.loading = "lazy";
          link.prepend(image);
        }
        const arrow = document.createElement("span");
        arrow.className = "row-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "←";
        link.append(label, arrow);
        group.append(link);
      }
      if (groupPosts.length === 0) group.closest(".post-group").hidden = true;
    }
    target.hidden = false;
    status.remove();
  } catch {
    status.textContent = "לא ניתן לטעון את המאמרים כרגע. כדאי לנסות שוב מאוחר יותר.";
    status.setAttribute("role", "status");
  }
}

async function loadPost() {
  const id = new URLSearchParams(location.search).get("id");
  const status = document.querySelector("#post-load-status");
  if (!/^\d{1,10}$/.test(id || "")) {
    status.textContent = "המאמר לא נמצא.";
    return;
  }
  try {
    const index = JSON.parse(await fetchGitHubFile("index.json"));
    const post = (index.posts || []).find((entry) => String(entry.wordpress_id) === id && isPublishedHebrewPost(entry));
    if (!post || typeof post.path !== "string" || !post.path.startsWith("posts/") || post.path.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("Post unavailable");
    const base = rawMediaBase(post.path);
    const [metadataText, source] = await Promise.all([
      fetchGitHubFile(`${post.path}/metadata.json`),
      fetchGitHubFile(`${post.path}/source.html`),
    ]);
    const metadata = JSON.parse(metadataText);
    if (metadata.status !== "publish" || Number(metadata.wordpress_id) !== Number(id)) throw new Error("Post unavailable");
    const title = metadata.title || postTitle(post);
    document.title = `${title} — יאיר אהרון כהן`;
    document.querySelector("#post-title").textContent = title;
    document.querySelector("#post-category").textContent = topicForPost({ ...post, ...metadata });
    const date = document.querySelector("#post-date");
    if (metadata.published_at) {
      date.dateTime = metadata.published_at.slice(0, 10);
      date.textContent = date.dateTime;
    } else date.remove();
    const featured = metadata.media?.find((item) => item.source_url === metadata.featured_media_source_url) || metadata.media?.[0];
    const image = document.querySelector("#post-featured-image");
    if (featured?.file) {
      const imageUrl = new URL(featured.file.replace(/^\.\//, ""), base);
      if (!imageUrl.href.startsWith(base)) throw new Error("Invalid featured image path");
      image.src = imageUrl.href;
      image.alt = "";
    } else image.remove();
    document.querySelector("#post-content").innerHTML = safeArticleHTML(source, base);
    document.querySelector("#post-content").hidden = false;
    document.querySelector("#post-source-link").href = metadata.source_url || `https://thedigitalreality.net/?p=${id}`;
    document.querySelector("#post-source").hidden = false;
    status.remove();
  } catch {
    status.textContent = "לא ניתן לטעון את המאמר כרגע. כדאי לנסות שוב מאוחר יותר.";
    status.setAttribute("role", "status");
  }
}

if (typeof document !== "undefined") {
  if (document.querySelector("#profile")) loadProfile();
  if (document.querySelector("#post-groups")) loadHomepage();
  if (document.querySelector("#post-content")) loadPost();
}
