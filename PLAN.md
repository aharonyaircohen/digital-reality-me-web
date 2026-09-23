# Plan: Generate the static site from the content library

Status: planning. The generation described below has not been merged into
`main` or deployed.

## Goal

Keep `aharonyaircohen/digital-reality-web-content` as the only place where post
text and media are edited. At build time, generate the homepage post links and all
post pages for `me.thedigitalreality.app`. The published site remains plain,
static HTML and CSS. Visitors do not fetch content from GitHub.

## Current state

- `me/index.html` contains handwritten post cards, and `me/posts/<id>/` contains
  copies of post HTML and media. Updating a post requires copying it here.
- The source repository is private. GitHub Actions in `me` currently has no
  credential to read it.
- The site has four visible topic groups: `מים`, `תודעה`, `תזונה`, and
  `בריאות`.
- The requested public collection is published Hebrew posts only. Four English
  posts currently in `me` must disappear when the new build is deployed.

## Build design

1. Give the `me` workflow read-only access to the private source repository.
   Prefer a fine-grained token limited to `digital-reality-web-content` with
   **Contents: read**, stored as the `WEB_CONTENT_READ_TOKEN` Actions secret
   in `me`.
   Do not place the token in code, logs, generated pages, or a browser request.
2. Add one small Node build script. It fetches a specific source revision from
   GitHub, reads each `posts/*/metadata.json` and `source.html`, and records the
   source commit SHA in the build log so a deployment can be reproduced.
3. Include a post only when its status is `publish` and its authored content is
   Hebrew. Validate required metadata and referenced media. Stop the build on
   missing or malformed source data rather than publishing an incomplete page.
4. Assign one of the four existing topics from the article's title and content.
   Keep the rules small and covered by examples. Flag ambiguous cases for review
   instead of silently choosing an unrelated topic. Use the same result for the
   homepage heading and post-page label. Correct missing titles in the source
   repository so there is no second editorial source in `me`.
5. Render all posts through one `templates/post.html`. Render homepage post
   cards into a homepage template; keep existing profile, course, community,
   theme, and 404 markup. Preserve `/posts/<wordpress-id>/` URLs.
6. Copy only referenced media into the output. Optimize article images to WebP,
   preserve linked PDFs, and use the featured image in each post header and its
   homepage card. Write the finished site to ignored `dist/`.
7. Update the existing Pages workflow to test and upload `dist/`. Build on a
   push to `main`, a manual workflow run, and a daily schedule so source-only
   edits eventually reach the site. If the source fetch or build fails, stop
   deployment and leave the last successful live site in place.
8. After the generated output matches the current Hebrew pages, remove the
   copied `posts/` files and handwritten post cards from `me`. Keep the source
   content in `digital-reality-web-content` and the generated output out of Git.

## Verification before rollout

- Unit tests cover published/pending status, Hebrew/English selection, topic
  examples, missing metadata or media, HTML escaping, and stable post URLs.
- A build against the real source produces every expected Hebrew post exactly
  once, excludes the four English posts, and contains no unpublished post.
- Generated-page tests check category labels, local links, all image/PDF paths,
  RTL markup, and the existing 404 page. Run the external-link check.
- Serve `dist/` locally and inspect the homepage, a normal post, an image-heavy
  post, a table post, and the 404 page at desktop and narrow mobile widths.
- Deploy only after the credential is configured. Wait for GitHub Pages to
  finish, then verify the live homepage, category groups, representative post,
  images, and a removed English post URL returning the custom 404 page.

## Decisions needed

- Confirm private-source access: the recommended read-only token, or making
  `digital-reality-web-content` public. The token keeps drafts and source
  history private.
- Confirm the daily refresh cadence if source changes need to appear sooner.

## Done when

Post edits happen only in `digital-reality-web-content`; one template generates
all public post pages; the homepage shows only published Hebrew posts in the four topic
groups; local and deployed checks pass; and the public site remains static.
