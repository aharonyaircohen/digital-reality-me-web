# Deployment and custom domain

## Current setup

- Repository: `aharonyaircohen/me`, production branch `main`.
- Public URL: <https://me.thedigitalreality.app/>.
- Hosting: GitHub Pages, using `.github/workflows/pages.yml`.
- DNS provider: Vercel, for `thedigitalreality.app`.
- DNS record: `me` CNAME `aharonyaircohen.github.io`.
- GitHub Pages custom domain: `me.thedigitalreality.app`; Enforce HTTPS enabled.

This is a plain static site. GitHub Pages is sufficient; Vercel hosting is
optional. Neither option needs a database, framework, or application server.
The repository's `CNAME` records the intended domain. With the current Actions
deployment, configure the domain in GitHub Pages settings as well; the file alone
does not configure it.

## Publish updates

1. Follow `AGENTS.md`, run `npm test` and `git diff --check`.
2. Commit and push to `main`.
3. Wait for the **Deploy GitHub Pages** workflow to succeed.
4. Verify the public URL over HTTPS and open it in a browser. For page changes,
   inspect desktop and mobile, images, article expand/collapse, and changed links.
5. Report any unverified checks explicitly.

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

Use these steps when the owner requests Vercel hosting. This is an alternative
deployment plan, not the current hosting configuration.

1. Import the existing `aharonyaircohen/me` GitHub repository into a Vercel
   project. Select `main` as the production branch.
2. Select framework preset **Other**, repository root as Root Directory,
   no Build Command, no Install Command, and `.` as Output Directory. Override
   automatic commands with empty values when needed. Do not introduce a framework
   or build script just to publish these files.
3. Deploy and test the generated Vercel URL first: homepage, assets, mobile and
   desktop layouts, both article controls, and a nonexistent path returning 404.
   Confirm the custom `404.html` renders; fix routing if it does not.
4. Add `me.thedigitalreality.app` under the project's Domains settings. Inspect
   the DNS target Vercel specifies for that project; do not guess a target.
5. Replace only the `me` CNAME with that target. Wait for domain verification
   and certificate issuance. Verify HTTPS with normal certificate validation,
   HTTP-to-HTTPS redirection, and a real browser before reporting completion.
6. After a successful switch, update this document, README, and AGENTS with
   the actual host and project. Deliberately retire or retain the Pages workflow;
   do not leave the instructions claiming it publishes the production domain.
   Remove the Pages custom-domain setting if Pages is retained at its default URL.
7. Verify that a later push deploys automatically through the GitHub integration.

If the cutover fails, restore the `me` CNAME to `aharonyaircohen.github.io` and
the GitHub Pages domain setting, then verify GitHub HTTPS again. Keep the working
Pages deployment available until the Vercel cutover is verified.

References: [Vercel build settings](https://vercel.com/docs/builds/configure-a-build),
[GitHub integration](https://vercel.com/docs/git/vercel-for-github),
[custom domains](https://vercel.com/docs/domains/set-up-custom-domain).
