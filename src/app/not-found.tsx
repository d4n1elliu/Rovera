import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-4xl font-bold">404</h2>
      <p className="text-gray-500">We couldn&apos;t find the page you were looking for.</p>
      <Link href="/" className="text-brand underline underline-offset-4">
        Back to home
      </Link>
    </div>
  );
}
