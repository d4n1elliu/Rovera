import type { Metadata } from "next";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";

export const metadata: Metadata = { title: "My account" };

// Placeholder — connect to an auth provider (NextAuth, Clerk, …) and load
// the signed-in customer's profile.
export default function AccountPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold">My account</h1>
      <form className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="firstName" placeholder="First name" />
          <Input name="lastName" placeholder="Last name" />
        </div>
        <Input name="email" type="email" placeholder="Email" />
        <Input name="phone" type="tel" placeholder="Phone" />
        <Button type="submit">Save changes</Button>
      </form>
    </div>
  );
}
