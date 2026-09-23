# Plan: Load posts when a visitor opens the site

Status: implemented locally and verified against the now-public content
repository. The anonymous GitHub API request succeeds. The change is not yet
deployed to GitHub Pages.

## Goal

Keep the personal site on GitHub Pages. Keep post content in
`aharonyaircohen/digital-reality-web-content` as the single source. Use one
post-page HTML template in `aharonyaircohen/digital-reality-me-web`, with no
generated post pages or site build step.

## Page-load flow

1. A visitor opens the homepage. Browser JavaScript calls the GitHub API for
   the content repository's `index.json`, then renders links for published
   Hebrew posts in the existing four visible topic groups. English and
   unpublished posts are excluded.
2. The visitor opens a post link such as `post.html?id=5007`. The browser calls
   the GitHub API for that post's `metadata.json` and `source.html`, then fills
   the single `post.html` template. The title, category, featured image, body,
   and inline media use the site's existing layout and colors.
3. Relative media references in `source.html` resolve to files in the public
   content repository. The browser shows a small error message if an API call
   fails or a post is unavailable. It never displays drafts.

This is a **browser request on each page load**, including direct visits to a
post URL. GitHub Actions does not fetch posts or generate HTML for them.

## Implementation

1. The content repository and media are publicly readable. The site uses
   unauthenticated API requests; no GitHub token is included in site JavaScript.
2. A small browser script reads `index.json` and renders published Hebrew posts
   in the existing four simple topic lists. The links are text-only; the site
   does not fetch every post just to make homepage cards.
3. One `post.html` template and the browser script load a selected post's
   metadata and source. They validate the post ID and published status, resolve
   featured and inline media, and remove executable markup from source HTML.
4. Copied article pages and images have been removed. New links use
   `post.html?id=<wordpress-id>`. Existing Hebrew `/posts/<id>/` paths are short
   redirects to the shared template. English post routes were removed.

## Verification

- Automated tests cover published/Hebrew filtering, categories, API decoding,
  and old post redirects. The post page also uses a browser-side markup
  sanitizer before inserting source HTML.
- Anonymous access to the public content API returned HTTP 200. The local site
  loaded in a real browser with 29 published Hebrew posts, and a post with a
  featured image opened through the shared template.
- The deployed site still needs verification after the change is published.

Done locally: browser page loads obtain posts from the public content
repository, one template renders posts, and the site repository contains no
copied post content. Deployment and deployed browser verification remain.
