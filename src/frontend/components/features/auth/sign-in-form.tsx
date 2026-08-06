"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { credentialsSchema } from "@/shared/schemas/auth.schema";

/** Where to land after signing in. Supplied by middleware when it turns a
 *  signed-out visitor away, so they resume what they were doing. */
export function SignInForm({ callbackUrl = "/rentals" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = credentialsSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Please check the form");
      return;
    }

    setIsSubmitting(true);
    try {
      /* redirect: false so a failure can be shown in place. Letting NextAuth
       * redirect would bounce to its own error page and lose what was typed. */
      const result = await signIn("credentials", {
        ...parsed.data,
        redirect: false,
      });

      if (!result || result.error) {
        /* Deliberately not "no account with that email" or "wrong password".
         * Saying which would let anyone check whether an address is
         * registered here. */
        setError("Email or password is incorrect.");
        return;
      }

      router.push(callbackUrl);
      // The navbar reads the session on the server, so it needs re-rendering
      // for the signed-in state to appear.
      router.refresh();
    } catch {
      setError("Could not sign you in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <label className="block text-sm text-gray-600">
        Email
        <Input name="email" type="email" autoComplete="email" required className="mt-1" />
      </label>

      <label className="block text-sm text-gray-600">
        Password
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
