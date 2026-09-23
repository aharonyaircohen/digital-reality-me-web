# Plan: Load posts when a visitor opens the site

Status: deployed to GitHub Pages and verified. The anonymous GitHub API request
succeeds, and the live site loads the source repository content in the visitor's
browser.

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
   in the existing four simple topic lists, including thumbnails whose
   `featured_media_path` points back to the content repository. The site does
   not fetch every post's metadata just to make homepage cards.
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
- Anonymous access to the public content API returned HTTP 200. The live
  homepage loaded in Chrome with 29 published Hebrew posts across all four
  topic groups, with English posts excluded.
- The live `post.html?id=5007` page loaded its title, category, date, and article
  body through the shared template. Its featured image is sourced from the
  public content repository.
- The old `/posts/5007/` address serves its redirect to the shared page. The
  removed English `/posts/142/` route returns 404.
- GitHub Actions run `35912845834` passed its test and deploy jobs. The deployed
  homepage and post template both return HTTP 200 over HTTPS.

Done: browser page loads obtain posts from the public content repository, one
template renders posts, copied post content has been removed from the site
repository, and the deployed site has been verified.

## Restore homepage post thumbnails

The first deployed version removed the copied post images but the public
content index did not yet include featured image paths, so homepage rows had no
thumbnails. The content repository now adds `featured_media_path` to its
published post records (commit `c66a538`). The site resolves those paths to
`raw.githubusercontent.com` and renders the images from the content repository.
This keeps the homepage to one index API request.
