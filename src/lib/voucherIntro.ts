// The voucher page explains how vouchers work in a dialog that opens by itself on a phone. It does that only the first time, so a returning
// visitor goes straight to the form. The "How it works" button always opens it again.
export const INTRO_SEEN_KEY = "wf-gift-voucher-intro-seen";

type Storage = { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void };

// A browser that blocks storage (private windows, some settings) counts as not having seen it, so the explanation still shows.
export const introSeen = (storage: Storage | null): boolean => {
  try {
    return storage?.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

export const markIntroSeen = (storage: Storage | null): void => {
  try {
    storage?.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // nothing to do: it will simply show again next time
  }
};
