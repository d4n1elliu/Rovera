/* Sign-in and sign-up share a narrow, centred column. Kept as a route-group
 * layout so both pages stay free of positioning concerns and cannot drift
 * apart visually. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-12 sm:py-16">
      {children}
    </div>
  );
}
