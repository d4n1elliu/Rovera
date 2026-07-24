import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/frontend/config/site";

const LINK_COLUMNS = [
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
];

const LOCATIONS = ["New York", "Los Angeles", "San Francisco", "Miami", "Chicago"];
const PAYMENT_METHODS = ["Visa", "Mastercard", "Amex", "Apple Pay"];

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="w-full px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <Image src="/logo.png" alt="" width={28} height={28} className="rounded" />
              <span className="text-lg">{siteConfig.name}</span>
            </div>
            <p className="text-sm text-gray-500">
              Car rental without the counter. Insurance included, free cancellation up to 24 hours
              before pickup, and 24/7 roadside support on every booking.
            </p>
            <p className="text-sm text-gray-500">
              <span aria-hidden className="text-amber-500">
                ★
              </span>{" "}
              <span className="font-medium text-gray-700">4.8</span> average from 2,300+ rentals
            </p>
          </div>

          {LINK_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-gray-900">{column.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-500">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition-colors hover:text-gray-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Locations</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              {LOCATIONS.map((city) => (
                <li key={city}>{city}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t pt-6 text-sm text-gray-500 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <ul className="flex items-center gap-2" aria-label="Accepted payment methods">
            {PAYMENT_METHODS.map((method) => (
              <li
                key={method}
                className="rounded border px-2 py-1 text-xs font-medium text-gray-600"
              >
                {method}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
