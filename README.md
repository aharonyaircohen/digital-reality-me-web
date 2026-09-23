# Digital Reality Me Web

A personal profile and content library for Aharon Yair Cohen, hosted with GitHub
Pages. It includes courses, communities, and published posts grouped by category
on the homepage. Each post has a static reading page. It uses plain HTML and CSS,
with no database, login, framework, or build process.

## Public site

<https://me.thedigitalreality.app/>

## Update the page

- Profile text and links: edit `index.html`.
- Published posts: `index.html` groups links by the main subject inferred from
  each article's title and full text. The same topic appears on the post page.
  `posts/<wordpress-id>/index.html` contains each complete post. To refresh them,
  use `digital-reality-web-content/posts/*/metadata.json` and `source.html`; include only
  entries whose status is `publish`. Copy and optimize each featured image and
  media referenced by the post. The browser never fetches the private website content
  repository. Original working material and the Markdown book manuscript live
  separately in the private `digital-reality-source` repository.
- Theme colors: edit `themes.css`; keep `data-theme` and theme metadata aligned
  in `index.html` and `404.html` (see `AGENTS.md`).
- Spacing and layout: edit `styles.css`.
- Hero and content images: add optimized WebP files under `assets/images/content/`.
- Per-image crop: set `--image-position` on an image; the hero also supports
  `--image-position-mobile`.
- Profile and social-preview assets: update files under `assets/images/`.
- Full agent instructions: read `AGENTS.md` before making changes.

## Local checks and preview

Use Node.js 22 (matching CI) with npm for checks, and Python 3 for the preview
server. No `npm install` is needed; the tests use Node's built-in tools.

Run the local checks from the repository root:

```bash
npm test
npm run check:links
```

Preview through a local HTTP server so root-relative asset paths work:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080> and <http://localhost:8080/404.html>.
The Python server does not automatically serve our custom 404 page for missing
paths; test a nonexistent URL on the deployed site to verify that behavior.

Pushing to `main` automatically deploys the current version to GitHub Pages.

GitHub Pages hosts the site and provides HTTPS. Vercel currently manages DNS
only. See [deployment instructions](DEPLOYMENT.md) for normal publishing,
certificate troubleshooting, and an optional move to Vercel hosting.
