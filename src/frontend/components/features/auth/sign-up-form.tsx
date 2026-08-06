"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { MIN_PASSWORD_LENGTH, registerSchema } from "@/shared/schemas/auth.schema";

export function SignUpForm({ callbackUrl = "/rentals" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries(form);
    // An optional field submits as "", which is not a valid phone number.
    if (raw.phone === "") delete raw.phone;

    /* The same schema the API validates with, so the rules cannot drift and
     * the renter is told about a bad password before a round trip. */
    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Please check the form");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Could not create your account.");
        return;
      }

      /* Straight in rather than sending them to the sign-in form to retype
       * what they just chose. */
      const signedIn = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });

      if (!signedIn || signedIn.error) {
        // The account exists; only the automatic sign-in failed.
        setError("Account created, but sign-in failed. Please sign in.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Could not create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-gray-600">
          First name
          <Input name="firstName" autoComplete="given-name" required className="mt-1" />
        </label>
        <label className="block text-sm text-gray-600">
          Last name
          <Input name="lastName" autoComplete="family-name" required className="mt-1" />
        </label>
      </div>

      <label className="block text-sm text-gray-600">
        Email
        <Input name="email" type="email" autoComplete="email" required className="mt-1" />
      </label>

      <label className="block text-sm text-gray-600">
        Phone <span className="text-gray-400">(optional)</span>
        <Input name="phone" type="tel" autoComplete="tel" className="mt-1" />
      </label>

      <label className="block text-sm text-gray-600">
        Password
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1"
        />
        <span className="mt-1 block text-xs text-gray-500">
          At least {MIN_PASSWORD_LENGTH} characters.
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
