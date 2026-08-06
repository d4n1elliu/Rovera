import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, SIGN_IN_PATH } from "@/auth";
import { Input } from "@/frontend/components/ui/input";

export const metadata: Metadata = { title: "My account" };

// Reflects the signed-in renter, so it cannot be prerendered.
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  /* Checked here as well as in middleware: middleware only sees requests
   * matching its config, so a page showing someone's details confirms who is
   * asking rather than assuming something upstream already did. */
  const session = await auth();
  if (!session?.user) redirect(`${SIGN_IN_PATH}?callbackUrl=/account`);

  const { firstName, lastName, email, role } = session.user;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold">My account</h1>

      {/* Shown disabled rather than editable-but-inert. The previous version
          was a live-looking form with a "Save changes" button that saved
          nothing; nothing here should imply a write that cannot happen. */}
      <div className="space-y-4 rounded-lg border bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-gray-600">
            First name
            <Input defaultValue={firstName} disabled className="mt-1" />
          </label>
          <label className="block text-sm text-gray-600">
            Last name
            <Input defaultValue={lastName} disabled className="mt-1" />
          </label>
        </div>

        <label className="block text-sm text-gray-600">
          Email
          <Input defaultValue={email ?? ""} disabled className="mt-1" />
        </label>

        {role === "admin" && (
          <p className="text-xs font-medium uppercase tracking-wide text-brand">
            Administrator
          </p>
        )}

        <p className="text-xs text-gray-500">
          Editing your details is not available yet.
        </p>
      </div>

      <Link
        href="/rentals"
        className="inline-block text-sm text-brand underline underline-offset-4"
      >
        View my rentals
      </Link>
    </div>
  );
}
