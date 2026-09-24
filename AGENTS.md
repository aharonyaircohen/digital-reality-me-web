# Agent instructions for Me

## Purpose

This repository is the source for Aharon Yair Cohen's public profile and content
library. It is a static GitHub Pages site with a visual hero, featured courses,
community links, and categorized article collections. Keep it fast, accessible,
and easy to maintain without a database, login, framework, package installation,
or build step.

The public site is:

`https://me.thedigitalreality.app/`

GitHub Pages remains the host. Vercel provides DNS for the custom domain only.
Read `DEPLOYMENT.md` before changing hosting, DNS, or HTTPS settings. It includes
the current deployment process, certificate troubleshooting, and optional Vercel
migration instructions. Documenting Vercel does not authorize switching hosts.

## Architecture

- `index.html` contains the homepage shell, icons, sharing metadata, and content
  placeholders. `scripts/posts.mjs` fetches `pages/3988-yac/homepage.json` from the
  content repository on visitor page load and renders the profile, social links,
  course/community cards, and footer. Do not duplicate that content in this repo.
- `post.html` is the shared post template. `scripts/posts.mjs` loads published
  post content from the public `digital-reality-web-content` repository.
- Old `/posts/<id>/` routes are retired; do not recreate per-post files.
- `assets/site.css` contains shared colors, themes, and layout.
- Homepage images, profile, and sharing artwork live in the content repository
  under `pages/3988-yac/media/`. Article images live with their source posts.
  Reference these public files directly; do not copy images into this repo.
- `.github/workflows/pages.yml` deploys the repository to GitHub Pages.
- `.github/workflows/check-links.yml` checks external destinations every week.
- `tests/site.test.mjs` checks the important structure and local assets.

Do not add a CMS, backend, database, analytics tracker, UI framework, or build
tool unless the owner explicitly asks for it.

## Language and direction

- The public profile is Hebrew and must remain `lang="he" dir="rtl"`.
- Code, commit messages, documentation, and maintenance instructions are English.
- Keep external brand names such as WhatsApp and Digital Reality in their normal
  spelling.

## Updating content

### Change homepage content

Edit `pages/3988-yac/homepage.json` in the public content repository. It owns the
name, description, hero image, social links, course/community cards, section
headings, and footer text. Keep the existing simple JSON shape. Array order is
display order; `footer.socialOrder` refers to icons in the shared `social` list.

- To add/remove a card, add/remove its object in `courses.items` or
  `community.items`. Use `kind: "contact"` for the contact row.
- Use plain text, HTTPS destinations (or `mailto:` for social email), and
  repository-relative image paths under `pages/3988-yac/media/`.
- Do not add executable HTML or layout rules to the content JSON.
- Static title, description, and sharing tags remain in each page's HTML for
  crawlers. Update those separately when the site's identity changes.
- Source images may be shared with other sites; check references before deleting.

### Refresh published posts

- The browser reads the source repository's `index.json` and includes only
  Hebrew posts with `status: "publish"`. Never display pending or draft posts.
- Read the title and full text, then assign each post to one homepage topic by
  its main subject. Use `מים` for water, hydration, filtration, and water systems;
  `תודעה` for meditation, emotions, and personal growth; `תזונה` for food and
  eating; and `בריאות` for body, movement, and other health subjects. Ignore
  missing or misleading source categories. Reuse these four topics unless a
  genuinely distinct collection needs a new one; do not add an uncategorized
  group. Keep the homepage heading and post-page category label in sync. The
  browser assigns topics from the title and excerpt. Post links use WordPress
  IDs and open `post.html?id=<id>`.
- Use each published post's `source.html` for its full text. The browser loads
  referenced media from the content repository and shows the featured image in
  the post header; do not copy post HTML or media into this repository.
- Source post 4564 has an empty title in metadata. Its displayed title is
  `טבלה מורחבת — השקט הפנימי` until the source supplies one.
- Run the post regression test and inspect the homepage category groups plus
  representative Hebrew, English, image, and table posts in a browser.

### Change an image

1. Reuse an existing content-repository image when it matches the desired visual.
2. If a site-specific image is missing, add it under `pages/3988-yac/media/` in
   the content repository. Prefer optimized WebP below 200 KB.
3. Update the image path in `homepage.json` (or HTML for sharing metadata).
   Preserve meaningful hero alt text;
   decorative card thumbnails use `alt=""`.
4. Profile and sharing URLs appear in all page heads and homepage metadata.
   The sharing SVG and PNG are maintained alongside the source images.
5. Preserve image focal points via `--image-position` and, for the hero,
   `--image-position-mobile`.
6. Verify every changed public image URL and visually inspect the page.

## Updating the design

- Preserve the purple outer gradient and deep-indigo content-library structure
  unless the owner asks for a redesign.
- Set the same active `data-theme` on `<html>` in `index.html` and `404.html`.
  Review each page's `theme-color` metadata when changing themes; update sharing
  artwork when the branding changes. Update tests that intentionally assert the
  active theme or palette to match the approved change.
- Available themes are `ocean-blue`, `sky`, and `deep-water`.
- Change shared colors through the variables in `assets/site.css`.
- A new theme must define the same tokens and must not duplicate layout rules.
- After changing `assets/site.css`, update its `?v=` value in `index.html`,
  `post.html`, and `404.html`. After changing `scripts/posts.mjs`, update its
  `?v=` value in the homepage and post template. Match versions across pages.
- Keep the hero, content area, shell, and footer on the same `--content-base`
  background. Do not reintroduce a separate header or footer color or divider.
- Keep the desktop shell at 760px and its primary content at 680px unless a
  verified layout problem requires a change.
- Do not add a section tab bar or jump-navigation bar.
- Course cards must not show arrows. Community, contact, and article rows may
  keep their small, unboxed chevrons.
- Keep the four category groups as simple headings and lists. JavaScript fills
  them after the content API responds; do not add expand/collapse controls.
- Preserve the mobile image framing rules: the hero must keep the face and bowl
  visible, featured cards stay 190px tall, and thumbnails remain center-cropped.
- Keep `404.html` visually aligned with the active theme and retain its
  `noindex` directive and link back to `/` on the custom domain.
- Keep visible keyboard focus styles and reduced-motion support.
- Check both narrow mobile width and desktop width before publishing.
- Do not add "Powered by" branding or third-party scripts.

## Required checks

Before committing:

1. Run `npm test`.
2. Use the local HTTP server described in `README.md`; inspect the homepage and
   `/404.html` at mobile and desktop widths. Verify missing-path 404 behavior on
   the deployed site, since the Python server uses its own error page.
3. Check every changed external link.
4. Confirm every changed content-repository image URL loads.
5. Confirm Hebrew text still reads right-to-left.
6. Run `npm run check:links` when link destinations change.

After pushing to `main`, wait for the `Deploy GitHub Pages` workflow and verify
the public URL. A change is not fully complete until the live page loads.
For deployment or certificate changes, verify HTTPS without bypassing certificate
validation, then open the public URL in a real browser. For visible changes, check
desktop and mobile layouts, images, category groups, and a
representative destination link. Report checks that could not run; an HTTP 200
alone is not a browser or visual test. Documentation-only changes require
`npm test` and `git diff --check`, but no new visual checks.

## Git rules

- Keep commits small and describe the visible result.
- Do not force-push `main`.
- Never commit passwords, tokens, private contact data, or local environment
  files.
- GitHub Pages deployment must stay automatic through the existing workflow.
