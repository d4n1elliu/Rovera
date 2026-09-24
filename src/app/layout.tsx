import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/frontend/components/layout/navbar";
import { Footer } from "@/frontend/components/layout/footer";
import { PortfolioBanner } from "@/frontend/components/PortfolioBanner";
import { siteConfig } from "@/frontend/config/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const { seo } = siteConfig;

// Images and icons come from the file conventions beside this layout
// (opengraph-image.tsx, icon.png, apple-icon.png, favicon.ico).
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: seo.title,
    template: `%s | ${siteConfig.name} demo`,
  },
  description: seo.description,
  applicationName: siteConfig.name,
  category: "portfolio",
  keywords: [...seo.keywords],
  authors: [{ name: seo.author }],
  creator: seo.author,
  manifest: "/site.webmanifest",
  robots: { index: true, follow: true },
  // Canonical and og:url are per page (pageMetadata in frontend/config/seo.ts).
  openGraph: {
    type: "website",
    siteName: `${siteConfig.name} — portfolio project`,
    description: seo.description,
    locale: seo.locale,
  },
  twitter: { card: "summary_large_image", description: seo.description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: seo.themeColor,
};

// WebSite schema only: no Organization, since there is no business behind the site.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteConfig.url}/#website`,
  name: siteConfig.name,
  url: siteConfig.url,
  description: seo.description,
  isAccessibleForFree: true,
  inLanguage: "en-AU",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteConfig.url}/cars?query={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col bg-gray-50 text-gray-900`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <PortfolioBanner />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
