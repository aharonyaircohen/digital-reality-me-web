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

- `index.html` contains profile text, social accounts, featured cards,
  community links, and published post links grouped by their main topic.
- `posts/<wordpress-id>/index.html` are a checked-in static snapshot of
  published posts from `digital-reality-web-content/posts/`.
- `themes.css` contains the named color themes and is the color source of truth.
- `styles.css` contains the complete visual design.
- `assets/images/content/` contains hero, course, community, and article images.
- `assets/images/` also contains profile and social-sharing assets.
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

### Change the name or description

Edit the profile header in `index.html`. Also update the page title,
description, and Open Graph metadata in `<head>` when relevant.

### Add or update a link

Every destination is an anchor in `index.html`. Use `featured-card` for courses,
`media-row--community` or `media-row--contact` for direct contact, and a
`media-row` inside the matching `post-group` for published posts.

1. Copy an existing card from the same section and preserve its class.
2. Change its `href`, title, subtitle, and image path.
3. For an external link, keep `target="_blank" rel="noopener noreferrer"`.
4. Use a short Hebrew title and optional short subtitle.
5. Keep cards under the matching section and preserve the order: courses,
   community, posts grouped by topic.

### Remove a link

Delete the complete matching anchor element. Delete its image only when no other
part of the site uses that image.

### Refresh published posts

- Read each source post's `metadata.json` and include only `status: "publish"`.
  Never copy pending or draft post content into this public repository.
- Read the title and full text, then assign each post to one homepage topic by
  its main subject. Use `מים` for water, hydration, filtration, and water systems;
  `תודעה` for meditation, emotions, and personal growth; `תזונה` for food and
  eating; and `בריאות` for body, movement, and other health subjects. Ignore
  missing or misleading source categories. Reuse these four topics unless a
  genuinely distinct collection needs a new one; do not add an uncategorized
  group. Keep the homepage heading and post-page category label in sync. This
  classification happens when refreshing the static HTML, not in the browser.
  Post links use WordPress IDs.
- Use each published post's `source.html` for its full text. Copy only media it
  references; convert inline images to lightweight WebP files and update their
  paths. Copy and optimize its `featured_media_source_url` image as
  `posts/<id>/media/featured.webp` and show it in the post header. Keep linked
  PDFs available beside the post.
- Source post 4564 has an empty title in metadata. Its displayed title is
  `טבלה מורחבת — השקט הפנימי` until the source supplies one.
- Run the post regression test and inspect the homepage category groups plus
  representative Hebrew, English, image, and table posts in a browser.

### Change an image

1. Put the new image in `assets/images/` with a short lowercase filename.
2. Use WebP for page images and keep each file below 200 KB.
3. Hero and featured images may be large landscape or square images. Article
   thumbnails may use any ratio because CSS crops them safely.
4. Update the matching path in `index.html`.
5. Keep meaningful `alt` text for the profile image. Decorative link thumbnails
   should keep `alt=""` because the adjacent link text already describes them.
6. When profile branding changes, update `social-preview.svg`, regenerate
   `social-preview.png` at 1200×630, and visually inspect the PNG.
7. To adjust a crop without editing CSS, add
   `style="--image-position: 50% 35%;"` to that `<img>`. The hero may also set
   `--image-position-mobile` for a separate narrow-screen crop.

## Updating the design

- Preserve the purple outer gradient and deep-indigo content-library structure
  unless the owner asks for a redesign.
- Set the same active `data-theme` on `<html>` in `index.html` and `404.html`.
  Review each page's `theme-color` metadata when changing themes; update sharing
  artwork when the branding changes. Update tests that intentionally assert the
  active theme or palette to match the approved change.
- Available themes are `ocean-blue`, `sky`, and `deep-water`.
- Change shared colors only through the variables in `themes.css`.
- A new theme must define the same tokens and must not duplicate layout rules.
- After changing `themes.css` or `styles.css`, update the `?v=` value on both
  stylesheet links in both `index.html` and `404.html` so browsers do not show
  stale colors. Use matching versions for the same asset across both pages.
- Keep the hero, content area, shell, and footer on the same `--content-base`
  background. Do not reintroduce a separate header or footer color or divider.
- Keep the desktop shell at 760px and its primary content at 680px unless a
  verified layout problem requires a change.
- Do not add a section tab bar or jump-navigation bar.
- Course cards must not show arrows. Community, contact, and article rows may
  keep their small, unboxed chevrons.
- Keep every category group visible as a simple heading and list, with no
  expand/collapse control or JavaScript.
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
4. Confirm every local image path loads.
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
