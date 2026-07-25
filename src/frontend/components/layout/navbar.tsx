import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/frontend/config/site";
import { PillLink } from "@/frontend/components/ui/pill-link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-navy">
      <nav className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <Image src="/logo.png" alt={siteConfig.name} width={32} height={32} className="rounded-lg" />
          <span className="text-lg">{siteConfig.name}</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <ul className="flex items-center gap-3 text-sm sm:gap-6">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-blue-100 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <PillLink
            href={siteConfig.contactCta.href}
            variant="white"
            size="sm"
            className="hidden sm:inline-flex"
          >
            {siteConfig.contactCta.label}
          </PillLink>
        </div>
      </nav>
    </header>
  );
}
