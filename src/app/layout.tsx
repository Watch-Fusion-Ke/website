import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Jost } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import BottomTabBar from "@/components/BottomTabBar";
import { WixClientContextProvider } from "@/context/wixContext";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

// Lets the page use the whole screen on iPhones, so the tab bar can sit above the home indicator.
export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://watchfusionkenya.com"),
  title: {
    default: "Watch Fusion Kenya | Premium Watches in Nairobi",
    template: "%s | Watch Fusion Kenya",
  },
  description:
    "Shop premium watches in Kenya. WatchFusion Kenya offers luxury, sport & casual watches with fast delivery across Nairobi and Kenya. Wear the Moment, Own the Legacy.",
  keywords: [
    "watches Kenya",
    "buy watches Nairobi",
    "luxury watches Kenya",
    "affordable watches Nairobi",
    "WatchFusion Kenya",
    "online watch store Kenya",
    "men watches Kenya",
    "women watches Kenya",
    "sport watches Nairobi",
    "wrist watches Kenya",
  ],
  authors: [{ name: "WatchFusion Kenya" }],
  creator: "WatchFusion Kenya",
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://watchfusionkenya.com",
    siteName: "WatchFusion Kenya",
    title: "WatchFusion Kenya | Premium Watches in Nairobi",
    description:
      "Shop premium watches in Kenya. Luxury, sport & casual watches with fast delivery across Nairobi and Kenya.",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "WatchFusion Kenya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchFusion Kenya | Premium Watches in Nairobi",
    description:
      "Shop premium watches in Kenya. Fast delivery across Nairobi and Kenya.",
    images: ["/logo.png"],
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
  alternates: {
    canonical: "https://watchfusionkenya.com",
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
    <html lang="en">
      <body className={`${jost.className} antialiased pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[calc(4rem_+_env(safe-area-inset-bottom))] md:pb-0`}>
        <WixClientContextProvider>
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
