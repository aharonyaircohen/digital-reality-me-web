import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(resolve(root, "dist", "index.html"), "utf8");
const urls = [...new Set(
  [...html.matchAll(/href="(https:\/\/[^"#]+)"/g)].map((match) => match[1]),
)];

if (urls.length === 0) {
  throw new Error("No external HTTPS links found.");
}

const failures = [];

for (const url of urls) {
  try {
    const { stdout } = await run("curl", [
      "--location",
      "--silent",
      "--show-error",
      "--output", "/dev/null",
      "--write-out", "%{http_code}",
      "--max-time", "20",
      "--user-agent", "me-page-link-checker/1.0",
      url,
    ]);
    const status = Number.parseInt(stdout.trim(), 10);

    // 401, 403, and 429 still prove that the destination exists. Fail only
    // missing pages and server errors.
    if (status === 404 || status >= 500 || !Number.isInteger(status)) {
      failures.push(`${status || "unknown"} ${url}`);
      console.error(`FAIL ${status || "unknown"} ${url}`);
    } else {
      console.log(`OK   ${status} ${url}`);
    }
  } catch (error) {
    failures.push(`${error.message}: ${url}`);
    console.error(`FAIL ${error.message} ${url}`);
  }
}

if (failures.length > 0) {
  throw new Error(`${failures.length} external link(s) failed.`);
}

console.log(`Checked ${urls.length} external links.`);
