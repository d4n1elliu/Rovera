import { LOCATIONS } from "@/shared/constants";

// rovera.org redirects to www, so canonical URLs use the www host.
const DEFAULT_SITE_URL = "https://www.rovera.org";

export const siteConfig = {
  name: "Rovera",
  description: "Rent the right car for every journey.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
  tagline: "Car rental without the counter.",
  // Rovera is a portfolio project; this copy is shown wherever that must be clear.
  portfolio: {
    author: "Daniel Liu",
    notice:
      "Rovera is a portfolio project by Daniel Liu. Bookings are simulated and no vehicles are provided.",
    sourceUrl: "https://github.com/d4n1elliu/Rovera",
    testCard: "4242 4242 4242 4242",
  },
  // Copy for search results and link previews, separate from the UI strings.
  seo: {
    title: "Rovera | Car rental demo (portfolio project)",
    tagline: "Car rental, booked in minutes — a portfolio project",
    description:
      "A full-stack car rental booking demo built with Next.js, Stripe and Supabase. Portfolio project by Daniel Liu — not a real rental service.",
    keywords: [
      "car rental demo",
      "portfolio project",
      "Next.js demo",
      "full-stack demo",
      "Stripe test mode",
      "Supabase",
    ],
    author: "Daniel Liu",
    locale: "en_AU",
    themeColor: "#0a1730",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Cars", href: "/cars" },
    { label: "My Rentals", href: "/rentals" },
    { label: "Help", href: "/help" },
  ],
  contactCta: { label: "Contact us", href: "/help" },
  locations: LOCATIONS,
  socialProof: {
    rating: "4.8",
    clients: "100+",
  },
  copyrightStartYear: 2025,
  footerColumns: [
    {
      title: "Rent",
      links: [
        { label: "Browse cars", href: "/cars" },
        { label: "My rentals", href: "/rentals" },
        { label: "Account", href: "/account" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help center", href: "/help" },
        { label: "Contact us", href: "/help" },
        { label: "Cancellation policy", href: "/help" },
      ],
    },
  ],
  legalLinks: [
    { label: "Terms of Use", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
