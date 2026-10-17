import AuthForm from "@/components/auth/AuthForm";
import type { ShowcaseWatch } from "@/components/auth/AuthShowcase";
import { OAuthStrategy, createClient } from "@wix/sdk";
import { unstable_cache } from "next/cache";
import { listProducts } from "@/lib/storeProducts";

export const metadata = { title: "Log in" };
export const revalidate = 600;

// Shown if the shop's products cannot be loaded, so the page never looks empty.
const FALLBACK: ShowcaseWatch[] = ["meg1", "cr1", "hn1"].map((n) => ({
  id: n,
  name: "Watch Fusion Kenya",
  imageUrl: `/products/${n}.jpg`,
  priceLabel: "",
}));

// Kept for ten minutes, so the login page does not wait on a product search for every visitor.
// It uses its own visitor session, since a cached result cannot depend on the shopper's cookies.
const loadWatches = unstable_cache(async (): Promise<ShowcaseWatch[]> => {
  try {
    const client = createClient({ auth: OAuthStrategy({ clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID! }) });
    client.auth.setTokens(await client.auth.generateVisitorTokens());
    const page = await listProducts(
      (url, init) => client.fetchWithAuth(url, { ...init, signal: AbortSignal.timeout(4000) }),
      { limit: 5 }
    );
    const watches = page.items.flatMap((p) =>
      p.imageUrl ? [{ id: p.id, name: p.name, imageUrl: p.imageUrl, priceLabel: p.priceLabel }] : []
    );
    if (watches.length === 0) throw new Error("no products with a picture");
    return watches;
  } catch (e) {
    console.error("Login page: could not load watches for the showcase", e);
    throw e; // a failed load is not kept; the page shows the fallback below
  }
}, ["login-showcase-watches"], { revalidate: 600 });

const watchesOrFallback = async (): Promise<ShowcaseWatch[]> => {
  try {
    return await loadWatches();
  } catch {
    return FALLBACK;
  }
};

const LoginPage = async () => <AuthForm watches={await watchesOrFallback()} />;

export default LoginPage;
