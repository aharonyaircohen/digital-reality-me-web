# Me

A personal profile and content library for Aharon Yair Cohen, hosted with GitHub
Pages. Browser JavaScript loads homepage content and posts from the `digital-reality-web-content`
GitHub repository when visitors open the homepage or a post.

## Public site

<https://me.thedigitalreality.app/>

## Update the page

- Profile text, social links, course/community cards, and section headings: edit
  [`pages/3988-yac/homepage.json`](https://github.com/aharonyaircohen/digital-reality-web-content/blob/main/pages/3988-yac/homepage.json)
  in the content repository. The browser fetches it through the GitHub API on
  page load using the existing `scripts/posts.mjs` loader. No site deployment is
  needed for these edits; GitHub may briefly cache its file responses.
- `index.html` keeps the page shell and icons. Rendering templates live in
  `scripts/posts.mjs`. Static title, description, favicon, and sharing metadata
  remain in the HTML for crawlers that do not execute JavaScript; update those
  separately when changing the site's identity. Homepage content and posts load
  independently, each with a visible message if its request fails.
- Published posts: the browser reads the source repository's `index.json`, then
  loads a selected post's `metadata.json` and `source.html` into the shared
  `post.html` template. Only published Hebrew posts appear. No GitHub token is
  used in browser code. Old `/posts/<id>/` addresses are retired.
- Colors and layout: edit `assets/site.css`; keep page theme metadata aligned
  (see `AGENTS.md`).
- Homepage images and sharing artwork: use `pages/3988-yac/media/` in the public
  content repository. The site references those files directly; no images are
  copied into this repository.
- Image framing stays in the site template and CSS; changing content does not
  change the layout.
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
