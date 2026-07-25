import { siteConfig } from "@/frontend/config/site";

/** Anchor id of the fleet section; hero CTAs scroll here. */
export const FLEET_SECTION_ID = "fleet";

export const heroContent = {
  headline: ["Drive the future", "with Rovera."],
  subline: "No counters. No hidden fees.",
  cta: { label: "Book a car", href: `#${FLEET_SECTION_ID}` },
} as const;

export const heroSlides = ["/hero.jpg", "/hero-2.jpg", "/hero-3.jpg"];

export const HERO_AUTOPLAY_MS = 7000;

export const aboutContent = {
  eyebrow: "Renting made simple",
  heading: `We are ${siteConfig.name}`,
  body: "Book online, pick up in five Australian cities, and drive. Insurance, free cancellation, and 24/7 support included.",
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

export const stats = [
  { value: siteConfig.socialProof.clients, label: "happy clients" },
  { value: `${siteConfig.socialProof.rating} ★`, label: "average rating" },
  { value: String(siteConfig.locations.length), label: "cities served" },
  { value: "24/7", label: "roadside support" },
] as const;

export const testimonialsContent = {
  eyebrow: "What clients say",
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
