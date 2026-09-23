# Me

A personal profile and content library for Aharon Yair Cohen, hosted with GitHub
Pages. It includes courses, communities, and published posts grouped by category
on the homepage. Each post has a static reading page. A small Node script builds
the pages from the private `content-library` repository. The public site remains
plain HTML and CSS, with no database, login, or framework.

## Public site

<https://me.thedigitalreality.app/>

## Update the page

- Profile text and links: edit `templates/index.html`.
- Posts: edit `content-library/posts/*/metadata.json` and `source.html` in the
  source repository. `scripts/build.mjs` reads published Hebrew posts, groups them
  by subject, and renders `templates/post.html` for every post. English and pending
  posts stay off this site. Images are optimized into the generated site. No post
  text or media is checked into this repository.
- Theme colors: edit `themes.css`; keep `data-theme` and theme metadata aligned
  in `templates/index.html`, `templates/post.html`, and `404.html` (see `AGENTS.md`).
- Spacing and layout: edit `styles.css`.
- Hero and content images: add optimized WebP files under `assets/images/content/`.
- Per-image crop: set `--image-position` on an image; the hero also supports
  `--image-position-mobile`.
- Profile and social-preview assets: update files under `assets/images/`.
- Full agent instructions: read `AGENTS.md` before making changes.

## Local checks and preview

Use Node.js 22 (matching CI), npm, GitHub CLI (`gh`) signed in with read access
to `aharonyaircohen/content-library`, and Python 3 for the preview server.

Run the local checks from the repository root:

```bash
npm ci
npm test
npm run build
npm run test:site
npm run check:links
```

Preview through a local HTTP server so root-relative asset paths work:

```bash
cd dist && python3 -m http.server 8080
```

Then open <http://localhost:8080> and <http://localhost:8080/404.html>.
The Python server does not automatically serve our custom 404 page for missing
paths; test a nonexistent URL on the deployed site to verify that behavior.

Pushing to `main` or using **Run workflow** builds and deploys the site. A daily
workflow also picks up source content changes. The workflow needs a repository
secret named `CONTENT_LIBRARY_READ_TOKEN` with read access to the private
`content-library` repository. The browser never requests the private source.

GitHub Pages hosts the site and provides HTTPS. Vercel currently manages DNS
only. See [deployment instructions](DEPLOYMENT.md) for normal publishing,
certificate troubleshooting, and an optional move to Vercel hosting.
