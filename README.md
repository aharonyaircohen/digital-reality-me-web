# Me

A personal profile and content library for Aharon Yair Cohen, hosted with GitHub
Pages. It includes courses, communities, water articles, and consciousness
articles. It uses plain HTML, CSS, and a small JavaScript file, so there is no
database, login, framework, or build process.

## Public site

<https://aharonyaircohen.github.io/me/>

## Update the page

- Profile text and links: edit `index.html`.
- Theme colors: edit `themes.css` or change `data-theme` in `index.html`.
- Spacing and layout: edit `styles.css`.
- Article expansion behavior: edit `script.js`.
- Hero and content images: add optimized WebP files under `assets/images/content/`.
- Profile and social-preview assets: update files under `assets/images/`.
- Full agent instructions: read `AGENTS.md` before making changes.

Run the local checks with:

```bash
npm test
npm run check:links
```

You can preview the site by opening `index.html` directly or by running:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

Pushing to `main` automatically deploys the current version to GitHub Pages.
