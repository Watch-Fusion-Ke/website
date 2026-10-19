import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redirectLoginAvailable } from "@/lib/loginCheck";

export const dynamic = "force-dynamic";

// Each server instance remembers the answer for a minute, so the login page does not ask Wix on every visit.
const KEEP_FOR = 60_000;
const known = new Map<string, { at: number; available: boolean }>();

// Tells the login page whether to finish sign-in by sending the member to Wix and back, or by the older method.
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const cached = known.get(origin);
  if (cached && Date.now() - cached.at < KEEP_FOR) return NextResponse.json({ redirectLogin: cached.available });

  let refreshToken: string | undefined;
  try {
    refreshToken = JSON.parse(cookies().get("refreshToken")?.value || "{}")?.value;
  } catch {
    refreshToken = undefined;
  }
  const available = await redirectLoginAvailable({
    origin,
    clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID!,
    refreshToken: typeof refreshToken === "string" ? refreshToken : undefined,
  });
  if (known.size > 50) known.clear();
  known.set(origin, { at: Date.now(), available });
  return NextResponse.json({ redirectLogin: available });
}
