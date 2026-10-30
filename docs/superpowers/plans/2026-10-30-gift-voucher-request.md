# Gift voucher request flow

## Decision and scope

The customer starts on a Gift Vouchers page, enters the amount and gift details, and continues to WhatsApp with a prepared message. Staff confirm payment in the payment account, then issue the voucher in Wix and send it to the recipient. The website does not create or activate vouchers. The voucher artwork will be designed separately.

The Wix-hosted checkout remains the place for online code redemption. In-store staff can redeem a code against an unpaid Wix order from the dashboard. Neither redemption path is being changed by this branch.

## Site work

1. Add a public `/gift-vouchers` page with a small form: amount in whole KES, sender name, a grouped recipient name, phone and email, and optional message. The sender's WhatsApp chat supplies their phone number, so the form does not ask for it.
2. Validate and normalise entries before building the WhatsApp message. Opening WhatsApp does not submit or pay for a voucher; the customer must send the prepared message.
3. Link the page in the header, mobile menu, footer, and sitemap. Keep the desktop form and process explanation within a typical desktop viewport. On phones and tablets, show the process in an introductory dialog before the form, with a way to reopen it. Hide the floating WhatsApp shortcut on this page so it does not cover the form. No voucher artwork is used on this page yet.
4. Test the validation and handoff, including line breaks, special characters, and the absence of any client-side issuance capability.

## Security and operating flow

- The public form is a request only. It never calls a Wix admin API, returns a code, or marks an order paid.
- Wix credentials remain server-side; no new credential is needed for this page.
- Staff verify payment independently of a screenshot or customer message, then issue in the Wix dashboard. Only authorized staff should have the relevant Wix role.
- The WhatsApp URL contains the form details so the customer can review and send them. The page explains this before continuing. The website does not store the request; the WhatsApp conversation is the request record until staff issue the card in Wix.
- Staff check Wix's current status and balance at redemption. The future PNG is presentation, not proof of value.

## Deployment and verification

1. In the Wix dashboard, activate Wix Gift Cards, set KES and the chosen expiration policy, and customize the recipient email. This is an operator action, not done by this branch.
2. Confirm the Gift Cards toggle is enabled at Wix checkout. Test a real low-value issue and redemption on the preview flow before promoting the page.
3. Confirm an unpaid Wix order can be redeemed in the dashboard for an in-store purchase. Do not hand over a watch before redemption succeeds.
4. Confirm the recipient email and final voucher artwork with the owner before adding artwork automation.

## Unverified

- Whether Wix Gift Cards is installed and active on the live Wix site.
- Whether the current Wix-hosted checkout exposes the gift card field for this headless storefront.
- Whether the owner's chosen payment method, denominations, and expiration policy are configured.

## Sources

- Wix setup and checkout toggle: https://support.wix.com/en/article/setting-up-wix-gift-cards-9451439
- Manual issuance and recipient email: https://support.wix.com/en/article/wix-gift-cards-issuing-gift-cards-from-the-dashboard
- Balance, disabling, and dashboard redemption: https://support.wix.com/en/article/managing-purchased-wix-gift-cards
- Admin credential boundary: https://dev.wix.com/docs/go-headless/authentication/admin/make-admin-api-calls-with-client-credentials
