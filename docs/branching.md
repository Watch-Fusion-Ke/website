# How a change reaches the live site

Two long-lived branches:

- `main` is the live site. www.watchfusionkenya.com is built from it.
- `develop` is the preview. Every change lands here first. Vercel builds it on its own address, `https://watchfusionke-git-develop-watch-fusion-ke.vercel.app`, which always shows the latest `develop`.

## Steps

1. Work on a short branch (`feat/...`, `fix/...`, `chore/...`) cut from `develop`.
2. Open a pull request into `develop`. The checks (lint, type check, tests, build) must pass and the change is reviewed.
3. Merge into `develop` with a merge commit. The preview address updates within a few minutes.
4. The owner looks at the preview and approves.
5. Open one pull request from `develop` into `main` that lists the changes it carries. Merge it with a merge commit. Vercel then publishes the live site.
6. A fix that cannot wait goes into `main` through its own pull request, and `main` is merged back into `develop` right after.

## Things to know

- The preview uses the live store. Adding to the cart works the same, and an order placed from the preview is a real order. Checkout also sends the shopper back to the live site, because the return addresses are fixed to www.watchfusionkenya.com.
- Everything in `develop` goes live together. To hold a change back, keep it out of `develop` until it is approved.
- Previews are protected by Vercel until an exception is added for the preview address in the project's Deployment Protection settings.
