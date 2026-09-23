# Deployment and custom domain

## Current setup

- Repository: `aharonyaircohen/me`, production branch `main`.
- Public URL: <https://me.thedigitalreality.app/>.
- Hosting: GitHub Pages, using `.github/workflows/pages.yml`.
- DNS provider: Vercel, for `thedigitalreality.app`.
- DNS record: `me` CNAME `aharonyaircohen.github.io`.
- GitHub Pages custom domain: `me.thedigitalreality.app`; Enforce HTTPS enabled.

This is a generated static site. GitHub Pages is sufficient; Vercel hosting is
optional. Neither option needs a database or application server.
The repository's `CNAME` records the intended domain. With the current Actions
deployment, configure the domain in GitHub Pages settings as well; the file alone
does not configure it.

## Publish updates

1. Add a read-only `CONTENT_LIBRARY_READ_TOKEN` repository secret with access to
   the private `aharonyaircohen/content-library` repository. Keep it out of code.
2. Follow `AGENTS.md`; run `npm ci`, `npm test`, `npm run build`,
   `npm run test:site`, and `git diff --check`.
3. Commit and push to `main`.
4. Wait for the **Deploy GitHub Pages** workflow to succeed.
5. Verify the public URL over HTTPS and open it in a browser. For page changes,
   inspect desktop and mobile, images, categories, and changed links.
6. Report any unverified checks explicitly.

## Roll back a site update

Use a new revert commit to undo a bad update while preserving history:

1. Check `git status` and preserve any uncommitted work before proceeding.
2. Use `git log --oneline` and `git show COMMIT_SHA` to identify the exact commit
   that introduced the problem. Replace `COMMIT_SHA` with that reviewed hash.
3. Run `git revert COMMIT_SHA`. For multiple commits or a merge, inspect the
   dependencies and changes first rather than guessing a range or merge parent.
4. Run the required checks in `AGENTS.md`, then push the revert to `main`.
5. Wait for the Pages workflow and verify the restored behavior at the public URL.

Do not force-push or reset shared history. A code revert does not undo DNS or
GitHub settings changes; restore and verify those separately if relevant.

## Diagnose and repair HTTPS

Read the current state rather than assuming a certificate is still pending:

```bash
gh api repos/aharonyaircohen/me/pages
dig +short me.thedigitalreality.app CNAME
dig +short thedigitalreality.app CAA
curl -I https://me.thedigitalreality.app/
curl -I http://me.thedigitalreality.app/
```

The CNAME should point to `aharonyaircohen.github.io`. If CAA records exist,
they must allow `letsencrypt.org`. Do not change unrelated DNS records.

If GitHub serves a `*.github.io` certificate for the custom domain, the
certificate does not match. Do not bypass the browser warning or use `curl -k`
as proof that HTTPS works.

When DNS is correct but issuance is stuck, follow GitHub's documented restart:
open repository **Settings → Pages**, remove the custom domain, and immediately
re-add `me.thedigitalreality.app`. Merely saving the same value is not this reset.
Allow issuance to finish, then enable **Enforce HTTPS**. Check the API certificate
state and repeat the HTTPS request. GitHub says availability can take up to an
hour; avoid repeatedly resetting issuance while it is progressing.

This restart resolved the mismatch on September 20, 2026. HTTPS returned 200,
HTTP redirected to HTTPS, and Chrome opened the page without a privacy warning.
That is historical evidence, not a substitute for checking current status.

The default `github.io/me/` address may redirect to the custom domain; do not
present it as an independent backup without testing it.

References: [GitHub HTTPS troubleshooting](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https),
[custom-domain troubleshooting](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages).

## Optional deployment to Vercel

This migration guide has not been tested for this repository. Use it only when
the owner requests Vercel hosting, and verify the current linked vendor guidance.

1. Import `aharonyaircohen/me`, use production branch `main`, and configure a
   static deployment: **Other** preset, repository root, `npm ci` install command,
   `npm run build` build command, output directory `dist`. Give the build a
   read-only `GH_TOKEN` with access to `content-library`.
2. Test the Vercel URL before changing DNS: desktop/mobile, assets, article
   controls, and custom 404 behavior. Keep the working Pages deployment available.
3. Add the custom domain and replace only the `me` CNAME with the target Vercel
   supplies. Verify certificate validity, HTTPS redirection, and browser loading.
4. Verify automatic Git deployments, update these docs with the actual setup,
   and deliberately retire or retain Pages. If retaining its default URL, remove
   its custom-domain setting and check asset paths before calling it a backup.

If migration fails, restore the GitHub CNAME and Pages domain setting listed
above, then verify HTTPS again.

References: [Vercel build settings](https://vercel.com/docs/builds/configure-a-build),
[GitHub integration](https://vercel.com/docs/git/vercel-for-github),
[custom domains](https://vercel.com/docs/domains/set-up-custom-domain).
