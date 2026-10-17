import AuthForm from "@/components/auth/AuthForm";
import type { ShowcaseWatch } from "@/components/auth/AuthShowcase";
import { listProducts } from "@/lib/storeProducts";
import { wixClientServer } from "@/lib/wixClientServer";

export const metadata = { title: "Log in" };

// Shown if the shop's products cannot be loaded, so the page never looks empty.
const FALLBACK: ShowcaseWatch[] = ["meg1", "cr1", "hn1"].map((n) => ({
  id: n,
  name: "Watch Fusion Kenya",
  imageUrl: `/products/${n}.jpg`,
  priceLabel: "",
}));

const loadWatches = async (): Promise<ShowcaseWatch[]> => {
  try {
    const client = await wixClientServer();
    const page = await listProducts(
      (url, init) => client.fetchWithAuth(url, { ...init, signal: AbortSignal.timeout(4000) }),
      { limit: 5 }
    );
    const watches = page.items.flatMap((p) =>
      p.imageUrl ? [{ id: p.id, name: p.name, imageUrl: p.imageUrl, priceLabel: p.priceLabel }] : []
    );
    return watches.length > 0 ? watches : FALLBACK;
  } catch (e) {
    console.error("Login page: could not load watches for the showcase", e);
    return FALLBACK;
  }
};

const LoginPage = async () => <AuthForm watches={await loadWatches()} />;

export default LoginPage;
