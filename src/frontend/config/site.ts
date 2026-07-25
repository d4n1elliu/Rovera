export const siteConfig = {
  name: "Rovera",
  description: "Rent the right car for every journey.",
  url: "https://rovera.example.com",
  tagline: "Car rental without the counter.",
  nav: [
    { label: "Home", href: "/" },
    { label: "Cars", href: "/cars" },
    { label: "My Rentals", href: "/rentals" },
    { label: "Help", href: "/help" },
  ],
  contactCta: { label: "Contact us", href: "/help" },
  locations: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
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
