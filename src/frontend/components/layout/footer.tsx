import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/frontend/config/site";
import { PaymentIcons } from "@/frontend/components/layout/payment-icons";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-brand-navy text-blue-200">
      <div className="w-full px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-3 font-semibold text-white">
              <Image src="/logo.png" alt="" width={40} height={40} className="rounded-xl" />
              <span className="text-2xl">{siteConfig.name}</span>
            </div>
            <p className="text-sm">{siteConfig.tagline}</p>
          </div>

          {siteConfig.footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-white">{column.title}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold text-white">Locations</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {siteConfig.locations.map((city) => (
                <li key={city}>{city}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/10 pt-6 text-sm sm:flex-row sm:justify-between">
          <p>
            © {siteConfig.copyrightStartYear}–{new Date().getFullYear()} {siteConfig.name}. All
            rights reserved.
          </p>
          <nav className="flex items-center gap-6" aria-label="Legal">
            {siteConfig.legalLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
          <PaymentIcons />
        </div>
      </div>
    </footer>
  );
}
