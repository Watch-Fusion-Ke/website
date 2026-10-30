import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import BottomTabBar from "@/components/BottomTabBar";
import { WixClientContextProvider } from "@/context/wixContext";
import { THEME_SCRIPT } from "@/lib/theme";

// Jost carries all text: it is the font the shop had before, and the owner asked for it back. Cormorant Garamond is the
// display face for section titles (loaded in bold only), which gives the shop a boutique, watchmaker feel next to the text face.
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "700",
  display: "swap",
});

// Lets the page use the whole screen on iPhones, so the tab bar can sit above the home indicator.
export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Authentic Watches in Nairobi Kenya | Free Deliveries on Orders above Ksh 10,000`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    `Shop authentic watches and premium gift packages at ${SITE_NAME}. Personalize your gift with custom engraving and enjoy same-day delivery and FREE delivery on orders above KSh 10,000.`,
  // Search engines give little weight to this list; the words that count are in each page's title, description and headings. It still
  // names what the shop sells and where, in the ways people search for it.
  keywords: [
    "watches Kenya",
    "watch shop Nairobi",
    "original watches Nairobi",
    "authentic watches Kenya",
    "buy watches online Kenya",
    "men's watches Kenya",
    "ladies watches Kenya",
    "Casio watches Nairobi",
    "Casio watches Kenya",
    "Naviforce watches Kenya",
    "Curren watches Kenya",
    "Poedagar watches Kenya",
    "Olevs watches Kenya",
    "Hannah Martin watches Kenya",
    "Reward watches Kenya",
    "gift packages Nairobi",
    "corporate gifts Nairobi",
    "birthday gifts Nairobi",
    "Valentine's gifts Kenya",
    "Christmas gifts Nairobi",
    "custom engraved watch Kenya",
    "personalised gifts Nairobi",
    "same day delivery Nairobi",
    "free delivery watches Kenya",
    SITE_NAME,
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: "/share-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME}: Wear the Moment, Own the Legacy`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/share-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-KE" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${jost.variable} ${cormorant.variable} font-sans antialiased pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[calc(5.5rem_+_env(safe-area-inset-bottom))] md:pb-0`}>
        <WixClientContextProvider>
          <AnnouncementBar />
          <Navbar />
          {children}
          <Footer />
          <WhatsAppButton />
          <Suspense fallback={null}>
            <BottomTabBar />
          </Suspense>
        </WixClientContextProvider>
        
      </body>
    </html>
  );
}
