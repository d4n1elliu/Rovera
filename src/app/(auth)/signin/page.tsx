import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInForm } from "@/frontend/components/features/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

// Depends on whether the visitor already has a session.
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  /* Only ever a path, never an absolute URL. Following a caller-supplied
   * origin would turn this page into an open redirect: a link to
   * /signin?callbackUrl=https://example.com would bounce a renter off the
   * site immediately after they signed in. */
  const target =
    searchParams.callbackUrl?.startsWith("/") && !searchParams.callbackUrl.startsWith("//")
      ? searchParams.callbackUrl
      : "/rentals";

  // Nothing to sign in to if they already are.
  const session = await auth();
  if (session?.user) redirect(target);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-gray-500">Sign in to see your rentals.</p>

      <div className="mt-6">
        <SignInForm callbackUrl={target} />
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        No account?{" "}
        <Link
          href={`/signup?callbackUrl=${encodeURIComponent(target)}`}
          className="font-medium text-brand underline underline-offset-4"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
