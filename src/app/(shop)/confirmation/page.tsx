import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Booking confirmed" };

export default function ConfirmationPage({ searchParams }: { searchParams: { id?: string } }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
        ✓
      </div>
      <h1 className="text-3xl font-bold">Booking confirmed!</h1>
      {searchParams.id && (
        <p className="text-gray-500">
          Reference: <span className="font-mono">{searchParams.id}</span>
        </p>
      )}
      <p className="text-gray-500">A confirmation email is on its way to you.</p>
      <Link href="/rentals" className="text-brand underline underline-offset-4">
        View my rentals
      </Link>
    </div>
  );
}
