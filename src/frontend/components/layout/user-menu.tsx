"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

/* The only part of the navbar that needs to be interactive. The signed-in
 * name is rendered on the server — see navbar.tsx — so it is correct on first
 * paint rather than flashing "Sign in" and then correcting itself. */
export function SignOutButton({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    // redirect: false so the server components can be refreshed in place;
    // letting NextAuth navigate would skip that and leave a stale navbar.
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-blue-100 sm:inline">Hi, {firstName}</span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="text-blue-100 transition-colors hover:text-white disabled:opacity-50"
      >
        {isSigningOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
