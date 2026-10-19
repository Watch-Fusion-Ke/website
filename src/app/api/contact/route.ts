import { NextResponse } from "next/server";
import { adminConfigured, adminFetch } from "@/lib/wixAdmin";
import { contactFormAvailable, submitContact } from "@/lib/contactForm";
import { withoutDetail } from "@/lib/deliveryService";

export const dynamic = "force-dynamic";

// One visitor may send only a few messages a minute, so the form cannot be used to flood the shop's inbox.
const WINDOW = 60_000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();
const tooMany = (key: string, now = Date.now()): boolean => {
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW);
  hits.push(now);
  recent.set(key, hits);
  if (recent.size > 5000) recent.forEach((v, k) => v.every((t) => now - t >= WINDOW) && recent.delete(k));
  return hits.length > MAX_PER_WINDOW;
};

// Only the shop's own pages may send a message through this route.
const fromAnotherSite = (request: Request): boolean => {
  const origin = request.headers.get("origin");
  return origin !== null && origin !== new URL(request.url).origin;
};

const visitor = (request: Request): string => (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();

// Whether the page should show the form: true only when the Wix form exists and fits.
export async function GET() {
  if (!adminConfigured()) return NextResponse.json({ available: false });
  return NextResponse.json({ available: await contactFormAvailable({ adminFetch }) }, { headers: { "cache-control": "no-store" } });
}

const MAX_BODY = 20_000; // far more than any real message

export async function POST(request: Request) {
  if (fromAnotherSite(request)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "The message form is not available right now. Please message us on WhatsApp or call us instead.", unavailable: true },
      { status: 503 }
    );
  }
  if (tooMany(visitor(request))) {
    return NextResponse.json({ error: "Too many messages. Please wait a minute and try again." }, { status: 429 });
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) {
    return NextResponse.json({ error: "That message is too long." }, { status: 413 });
  }

  let input: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return NextResponse.json({ error: "That message is too long." }, { status: 413 });
    input = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Please check the highlighted boxes." }, { status: 400 });
  }
  const result = await submitContact({ adminFetch }, input);
  return NextResponse.json(withoutDetail(result.body, process.env.VERCEL_ENV === "production"), { status: result.status });
}
