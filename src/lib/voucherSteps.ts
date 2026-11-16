// The three steps of a gift voucher request, shown on the page and in the phone introduction. Vouchers are never created by the site:
// staff issue the card in Wix after payment is confirmed on WhatsApp.
export const VOUCHER_STEPS = [
  { title: "Fill in the form", detail: "Amount and who it is for." },
  { title: "Confirm on WhatsApp", detail: "We tell you how to pay." },
  { title: "They get the code", detail: "We email the code to the recipient." },
] as const;
