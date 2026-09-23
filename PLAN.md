# Plan: Build the site from web content

Status: plan only. The generator has not been merged into `main` or deployed.

## Repositories

- `aharonyaircohen/digital-reality-me-web` is the **public site** repository.
  GitHub Pages serves it at `me.thedigitalreality.app`.
- `aharonyaircohen/digital-reality-web-content` holds the post source files.
  The build script loads them through GitHub's API. Site visitors receive
  generated HTML and images; their browsers do not contact GitHub for posts.

## Target

Post text and media are edited in one place: `digital-reality-web-content`.
A small build script turns published Hebrew posts into static pages using one
post template. The homepage keeps its current simple layout and four visible
topic groups. English and pending posts do not appear on the site.

## Steps

1. Add a build script that calls the GitHub API to list post folders and fetch
   each `metadata.json`, `source.html`, and referenced media. Use one source
   commit SHA for the whole build. Validate status, language, title, post ID,
   and media. A bad record stops the build with a clear error.
2. Assign each included post to `מים`, `תודעה`, `תזונה`, or `בריאות` from its
   content. Cover the category rules with representative tests and flag
   ambiguous posts for review. Keep the homepage and post-page label aligned.
3. Add one post HTML template. Generate homepage post cards and
   `/posts/<wordpress-id>/` pages into ignored `dist/`. Copy only needed media,
   optimize images, preserve linked PDFs, and reuse the site's existing CSS.
4. Compare the generated site with the current Hebrew pages. Once content,
   images, links, and categories match, remove the copied post files and
   handwritten post cards from the site repository.
5. Update the existing GitHub Pages workflow to build, test, and deploy `dist/`.
   Run it on site pushes and daily to pick up source edits. Configure read
   access to the source repository as part of the workflow setup. A failed
   build must leave the last working public deployment in place.

## Verification

- Test API responses, the published/Hebrew filter, category assignments,
  missing data, escaping, media paths, and stable post URLs.
- Build from the real source and confirm each expected Hebrew post appears once,
  with no English or pending post in the output.
- Check generated links and assets. Inspect the homepage, an image post, a table
  post, and the 404 page locally at desktop and mobile widths.
- After deployment, check the public site and confirm removed English post URLs
  return the custom 404 page.

Done when source edits require no copied post HTML in the site repository and
the public site remains simple, static, and verified.
