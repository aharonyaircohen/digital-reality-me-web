import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(resolve(root, "index.html"), "utf8");
const urls = [...new Set(
  [...html.matchAll(/href="(https:\/\/[^"#]+)"/g)].map((match) => match[1]),
)];

if (urls.length === 0) {
  throw new Error("No external HTTPS links found.");
}

const failures = [];

for (const url of urls) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "me-page-link-checker/1.0" },
    });

    // 401, 403, and 429 still prove that the destination exists. Fail only
    // missing pages and server errors.
    if (response.status === 404 || response.status >= 500) {
      failures.push(`${response.status} ${url}`);
      console.error(`FAIL ${response.status} ${url}`);
    } else {
      console.log(`OK   ${response.status} ${url}`);
    }
  } catch (error) {
    failures.push(`${error.name}: ${url}`);
    console.error(`FAIL ${error.name} ${url}`);
  } finally {
    clearTimeout(timeout);
  }
}

if (failures.length > 0) {
  throw new Error(`${failures.length} external link(s) failed.`);
}

console.log(`Checked ${urls.length} external links.`);
