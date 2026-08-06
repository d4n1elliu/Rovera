import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { siteConfig } from "@/frontend/config/site";
import { PillLink } from "@/frontend/components/ui/pill-link";
import { SignOutButton } from "@/frontend/components/layout/user-menu";

/* Reads the session on the server so the signed-in state is right on first
 * paint. Fetching it in the browser instead would show "Sign in" to everyone
 * for a moment and then correct itself — a flicker on every navigation, and
 * the wrong greeting for anyone signed in.
 *
 * The cost is that this layout can no longer be statically generated, so
 * pages that were prerendered now render per request. A navbar that knows who
 * you are cannot be baked at build time. */
export async function Navbar() {
  const session = await auth();

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

          {session?.user ? (
            <SignOutButton firstName={session.user.firstName} />
          ) : (
            <Link
              href="/signin"
              className="text-sm text-blue-100 transition-colors hover:text-white"
            >
              Sign in
            </Link>
          )}

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
