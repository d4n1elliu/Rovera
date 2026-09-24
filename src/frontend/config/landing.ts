import { siteConfig } from "@/frontend/config/site";

/** Anchor id of the fleet section; hero CTAs scroll here. */
export const FLEET_SECTION_ID = "fleet";

export const heroContent = {
  headline: ["Drive the future", "with Rovera."],
  subline: "No counters. No hidden fees.",
  demoNote: "A full-stack car rental booking demo built to showcase Next.js, Stripe and Supabase.",
  cta: { label: "Book a car", href: `#${FLEET_SECTION_ID}` },
} as const;

export const heroSlides = ["/hero.jpg", "/hero-2.jpg", "/hero-3.jpg"];

export const HERO_AUTOPLAY_MS = 7000;

export const aboutContent = {
  eyebrow: "Renting made simple",
  heading: `We are ${siteConfig.name}`,
  body: "This demo models a rental service: book online, pick up in one of five fictional Australian branches, and drive. Insurance, free cancellation and 24/7 support are part of the scenario, not real offers.",
  cta: { label: "Read more", href: "/help" },
  image: {
    src: "/car_images/2022-Tesla-Model-3-Electric.png",
    alt: `Tesla Model 3 from the ${siteConfig.name} fleet`,
    width: 637,
    height: 405,
  },
} as const;

export const fleetContent = {
  eyebrow: "Our fleet",
  heading: "Available cars",
} as const;

// Sample figures for the demo, not real usage.
export const stats = [
  { value: siteConfig.socialProof.clients, label: "sample clients" },
  { value: `${siteConfig.socialProof.rating} ★`, label: "sample rating" },
  { value: String(siteConfig.locations.length), label: "demo cities" },
  { value: "24/7", label: "support (modelled)" },
] as const;

export const testimonialsContent = {
  eyebrow: "Sample reviews (fictional)",
  heading: "Trusted on every trip",
  items: [
    {
      quote:
        "Booked at 11pm, picked the car up at 7 the next morning. Zero paperwork at pickup and the deposit came back the same week.",
      author: "Sarah M.",
      detail: "Rented a Toyota Corolla",
    },
    {
      quote:
        "My flight got cancelled and I had to push the trip by two days. Cancelling and rebooking took about a minute — no fees, no phone calls.",
      author: "James T.",
      detail: "Rented a Tesla Model 3",
    },
  ],
} as const;

export const priceFilterOptions = [
  { label: "Any price", value: "" },
  { label: "Up to $60/day", value: "60" },
  { label: "Up to $90/day", value: "90" },
  { label: "Up to $120/day", value: "120" },
  { label: "Up to $150/day", value: "150" },
] as const;

export const sortOptions = [
  { label: "Recommended", value: "" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
  { label: "Top rated", value: "rating" },
] as const;
