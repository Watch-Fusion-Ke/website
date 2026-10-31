import { OAuthStrategy, createClient } from "@wix/sdk";
import { NextRequest, NextResponse } from "next/server";

// Every page and data route of the shop needs the visitor's Wix session. The site's own files and pictures never do, and they are fetched
// by link previews and search crawlers that carry no cookie, so they are left out: each would otherwise cost a call to Wix, and a Wix
// outage would stop even the pictures from loading.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|css|js|map|woff2?|ttf|otf|mp4|webm|txt|xml|json)$).*)"],
};

export const middleware = async (request: NextRequest) => {
  const cookies = request.cookies;
  const res = NextResponse.next();

  if (cookies.get("refreshToken")) {
    return res;
  }

  try {
    const wixClient = createClient({
      auth: OAuthStrategy({ clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID! }),
    });

    const tokens = await wixClient.auth.generateVisitorTokens();
    res.cookies.set("refreshToken", JSON.stringify(tokens.refreshToken), {
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch (error) {
    // The page still opens. The visitor gets a session on a later visit, once Wix answers again.
    console.error("middleware: could not start a visitor session", error);
  }

  return res;
};
