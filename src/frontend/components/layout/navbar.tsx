import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/frontend/config/site";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image src="/logo.png" alt={siteConfig.name} width={32} height={32} />
          <span className="text-lg">{siteConfig.name}</span>
        </Link>

        <ul className="flex items-center gap-6 text-sm">
          {siteConfig.nav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="text-gray-600 transition-colors hover:text-gray-900">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
