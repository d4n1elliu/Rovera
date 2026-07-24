import Link from "next/link";
import { siteConfig } from "@/frontend/config/site";

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link href="/help" className="hover:text-gray-900">
            Help
          </Link>
          <Link href="/cars" className="hover:text-gray-900">
            Browse cars
          </Link>
        </div>
      </div>
    </footer>
  );
}
