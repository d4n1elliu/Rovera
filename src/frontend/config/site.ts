export const siteConfig = {
  name: "Rovera",
  description: "Rent the right car for every journey.",
  url: "https://rovera.example.com",
  nav: [
    { label: "Home", href: "/" },
    { label: "Cars", href: "/cars" },
    { label: "My Rentals", href: "/rentals" },
    { label: "Help", href: "/help" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
