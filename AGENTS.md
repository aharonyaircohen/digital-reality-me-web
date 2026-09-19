# Agent instructions for My Linktree

## Purpose

This repository is the source for Aharon Yair Cohen's public link page. It is a
small, static GitHub Pages site. Keep it simple, fast, accessible, and easy to
maintain without a database, login, framework, package installation, or build
step.

The public site is:

`https://aharonyaircohen.github.io/me/`

## Architecture

- `index.html` contains all profile text, social accounts, and link cards.
- `themes.css` contains the named color themes and is the color source of truth.
- `styles.css` contains the complete visual design.
- `assets/images/` contains the profile photo and link thumbnails.
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

Each destination is one `<a class="link-card">` inside `.link-list` in
`index.html`.

1. Copy an existing card.
2. Change its `href`, title, subtitle, and image path.
3. For an external link, keep `target="_blank" rel="noopener noreferrer"`.
4. Use a short Hebrew title and optional short subtitle.
5. Keep cards under the matching section label and keep the contact card last.

### Remove a link

Delete the complete matching `link-card` element. Delete its image only when no
other part of the site uses that image.

### Change an image

1. Put the new image in `assets/images/` with a short lowercase filename.
2. Prefer WebP, JPEG, or PNG. Avoid files larger than 1 MB.
3. Use a square image for the profile photo. Link thumbnails may be square or
   landscape because CSS crops them safely.
4. Update the matching path in `index.html`.
5. Keep meaningful `alt` text for the profile image. Decorative link thumbnails
   should keep `alt=""` because the adjacent link text already describes them.
6. When profile branding changes, update `social-preview.svg`, regenerate
   `social-preview.png` at 1200×630, and visually inspect the PNG.

## Updating the design

- Preserve the calm blue water style unless the owner asks for a redesign.
- The active theme is the `data-theme` value on `<html>` in `index.html`.
- Available themes are `ocean-blue`, `sky`, and `deep-water`.
- Change shared colors only through the variables in `themes.css`.
- A new theme must define the same tokens and must not duplicate layout rules.
- After changing `themes.css` or `styles.css`, update the `?v=` value on both
  stylesheet links in `index.html` so browsers do not show stale colors.
- Keep the content column at or below 650px for readable mobile layouts.
- Keep visible keyboard focus styles and reduced-motion support.
- Check both narrow mobile width and desktop width before publishing.
- Do not add "Powered by" branding or third-party scripts.

## Required checks

Before committing:

1. Run `npm test`.
2. Open `index.html` locally and inspect it at mobile and desktop widths.
3. Check every changed external link.
4. Confirm every local image path loads.
5. Confirm Hebrew text still reads right-to-left.
6. Run `npm run check:links` when link destinations change.

After pushing to `main`, wait for the `Deploy GitHub Pages` workflow and verify
the public URL. A change is not fully complete until the live page loads.

## Git rules

- Keep commits small and describe the visible result.
- Do not force-push `main`.
- Never commit passwords, tokens, private contact data, or local environment
  files.
- GitHub Pages deployment must stay automatic through the existing workflow.
