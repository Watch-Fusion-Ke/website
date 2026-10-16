# How a change reaches the live site

Two long-lived branches:

- `main` is the live site. www.watchfusionkenya.com is built from it.
- `develop` is the preview. Every change lands here first. Vercel builds it on its own address, `https://watchfusionke-git-develop-watch-fusion-ke.vercel.app`, which always shows the latest `develop`.

Both branches are protected on GitHub: they cannot be deleted or force-pushed, and the automatic checks must pass before a merge. This also keeps the setting that deletes a pull request's branch after merging from deleting `develop` when it is released into `main`.

## Steps

1. Work on a short branch (`feat/...`, `fix/...`, `chore/...`) cut from `develop`.
2. Open a pull request into `develop`. The checks (lint, type check, tests, build) must pass and the change is reviewed.
3. Merge into `develop` with a merge commit. The preview address updates within a few minutes.
4. The owner looks at the preview and approves.
5. Open one pull request from `develop` into `main` that lists the changes it carries. Merge it with a merge commit. Vercel then publishes the live site.
6. A fix that cannot wait goes into `main` through its own pull request. Straight after, open a pull request from `main` into `develop` and merge it, so `develop` has the fix too and the two do not drift apart. The fix is then visible on the preview as well.

## Showing a preview to the owner

Vercel asks for a Vercel login on every preview address. The owner has no Vercel account, so do one of these in the Vercel project:

- Settings, Deployment Protection, "Deployment Protection Exceptions", Add Domain. Enter `watchfusionke-git-develop-watch-fusion-ke.vercel.app`. That address becomes public for anyone who has the link, and stays so until the exception is removed. Available on all Vercel plans, including Hobby.
- Or create a Shareable Link for the `develop` branch in the same settings area. The link carries a secret in the address, and the address can be revoked.

Vercel marks every preview with `X-Robots-Tag: noindex`, so search engines do not list it, whichever option is used.

## Things to know

- The preview uses the live store. Adding to the cart works the same, and an order placed from the preview is a real order. Checkout also sends the shopper back to the live site, because the return addresses are fixed to www.watchfusionkenya.com in `src/components/CartModal.tsx` and `src/app/cart/page.tsx`.
- Everything in `develop` goes live together. To hold a change back, keep it out of `develop` until it is approved.
- The Wix settings for the build (client ID, app ID, featured category) must exist for Vercel's Preview environment as well as Production. They do today, since previews build.
- Signing in and registering on a preview has not been tried. The Wix app lists only the live addresses as allowed, so it may need a setting there.
