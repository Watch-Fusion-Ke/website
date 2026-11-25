# Watch Fusion Kenya – project context for Claude

## Business

- Watch Fusion Kenya sells watches and accessories from a shop in Nairobi. Most customer contact and ordering happens on WhatsApp; the website supports that (see `OrderOnWhatsApp`, `WhatsAppButton`, `whatsappOrder.ts`).
- Owner: Masi Njuguna. She approves every change on the preview before it goes live.
- Live site: www.watchfusionkenya.com. Store runs on Wix (headless) with this Next.js front end.
- Reputation matters to the owner. Treat anything that could produce a bad customer experience (broken checkout, wrong prices, failed forms, slow pages) as high priority.

## Maintainer

- Illustriober Creatives (freelance studio) maintains the site. Channel for site work: the "Watch Fusion Tech, Support" WhatsApp group.
- Default to small, reviewable changes with a clear summary the owner can follow without technical background.

## Stack

- Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS 3, Zustand, GSAP.
- Wix headless SDK (`@wix/stores`, `@wix/ecom`, `@wix/members`, `@wix/data`, `@wix/redirects`). Wix client code is in `src/lib/wixClientServer.ts` and `src/lib/wixApps.ts`.
- Tests: Vitest (`npm test`). Lint: `npm run lint`. Types: `npm run typecheck`. Build: `npm run build`. CI runs all four on every PR.
- Hosting: Vercel. `main` = live, `develop` = preview.

## Workflow (see `docs/branching.md`)

1. Branch from `develop` (`feat/...`, `fix/...`, `chore/...`).
2. PR into `develop`; checks must pass. Merge commit.
3. Owner reviews the preview; then one PR `develop` → `main` listing the changes.
4. Hotfixes go to `main`, then immediately back-merge `main` → `develop`.
- The preview uses the live store. Orders placed on it are real orders.
- Wix settings (client ID, app ID, featured and new-products category IDs) must exist in both Vercel Preview and Production. A green build does not prove they are set.

## Enforced conventions (tests fail if broken)

- Brand palette is navy and gold. No pink, purple, rose, fuchsia or the template's `lama` colours (`src/noPink.test.ts`). Red is allowed only for errors and remove actions.
- No emoji in source, SVG, JSON or `public` files. Use drawn icons from `src/components/icons.tsx` / `NavIcons.tsx` (`src/noEmoji.test.ts`). ©, ® and ™ are allowed.
- One listing page for all categories: `/shop` and `/shop/<category>`. `/list` redirects permanently to `/shop`; do not add `src/app/list` (`src/oneCategoryPage.test.ts`).
- Server-only code stays server-only (`src/lib/serverOnly.test.ts`).
- Each lib and component has a co-located `*.test.ts(x)`. Add or update tests with every behaviour change.

## Audience constraints

- Shoppers are mostly on mobile, often on limited or unstable bandwidth in Kenya. Keep pages light: optimise images, avoid heavy client-side JS and new animation libraries, keep fallbacks for failed requests.
- Prices and delivery are in KES. Delivery rates and fees live in `src/lib/delivery*.ts` and `feeSync.ts`.
- Remote images are allowed only from the hosts listed in `next.config.mjs`.

## Working rules for Claude

- Prefer simple, reliable solutions over clever or trendy ones.
- Do not make design or visual-direction changes that were not requested; the owner is particular about how the site looks. If a request implies a design change, state it in the PR description.
- Keep the owner-facing PR summary short: what changed, what she will see on the preview, and anything to check.
- State assumptions explicitly instead of asking when a sensible default exists.
- Never commit secrets or Wix keys. Environment values belong in Vercel.
- Open pull requests as drafts into `develop`, not `main`, unless told it is a hotfix.
