import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/frontend/config/site";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a1730]">
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
          <Link
            href="/help"
            className="hidden h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-gray-900 transition-colors hover:bg-blue-50 sm:inline-flex"
          >
            Contact us
          </Link>
        </div>
      </nav>
    </header>
  );
}
