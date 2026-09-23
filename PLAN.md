# Plan: Load posts when a visitor opens the site

Status: plan only. This behavior has not been implemented or deployed.

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

## Changes needed

1. Make the content repository and media publicly readable. The browser must
   use unauthenticated API requests; no GitHub token belongs in site JavaScript.
2. Extend the content repository's existing `index.json` entries with the
   display topic and featured-image path needed for homepage cards. Derive the
   four topics from post content when maintaining the source index, and flag
   ambiguous assignments for review. Keep this metadata with the content so
   the homepage needs one API request instead of fetching every post.
3. Replace hardcoded homepage post cards with a small browser script that
   reads the index and renders the same simple lists. Keep the rest of the
   homepage static.
4. Add one `post.html` template and a small browser script for loading a post.
   Validate the post ID and fetched status before rendering. Resolve the
   featured image and inline media paths, and reject executable markup from
   source HTML.
5. Once the new pages work, remove copied post HTML and post images from the
   site repository. New links use `post.html?id=<wordpress-id>`. Decide how to
   handle existing `/posts/<id>/` links before removing those URLs.

## Verification

- Test the published/Hebrew filter, categories, bad API responses, media paths,
  HTML safety, and direct post links.
- Serve the real site locally and check the homepage plus posts with a featured
  image, inline image, and table on desktop and mobile.
- Check the deployed site with the real public content API. Confirm a new
  published source post appears after a reload without a site deployment, and
  confirm unpublished and English posts remain hidden.

Done when browser page loads obtain posts from the content repository, one
template renders every post, and the site repository contains no copied post
content.
