import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignUpForm } from "@/frontend/components/features/auth/sign-up-form";

export const metadata: Metadata = { title: "Create account" };

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  // Paths only — see the note in the sign-in page about open redirects.
  const target =
    searchParams.callbackUrl?.startsWith("/") && !searchParams.callbackUrl.startsWith("//")
      ? searchParams.callbackUrl
      : "/rentals";

  const session = await auth();
  if (session?.user) redirect(target);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-gray-500">
        Booked with us as a guest? Use the same email and your existing rentals
        will already be here.
      </p>

      <div className="mt-6">
        <SignUpForm callbackUrl={target} />
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href={`/signin?callbackUrl=${encodeURIComponent(target)}`}
          className="font-medium text-brand underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
