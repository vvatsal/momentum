"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { asProfileClient, getProfileRole } from "@/lib/supabase/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface LoginFormProps {
  mode: "student" | "admin";
  redirectTo?: string;
}

function getClientAppUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export function LoginForm({ mode, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [useMagicLink, setUseMagicLink] = useState(mode === "student");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const appUrl = getClientAppUrl();

    try {
      if (useMagicLink && mode === "student") {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: values.email,
          options: {
            emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(redirectTo ?? "/dashboard")}`,
          },
        });
        if (otpError) throw otpError;
        setMessage("Check your email for the magic link.");
      } else {
        const password = values.password?.trim() ?? "";
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password,
        });
        if (signInError) throw signInError;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Sign in failed");

        const role = await getProfileRole(asProfileClient(supabase), user.id);

        if (!role) {
          await supabase.auth.signOut();
          throw new Error(
            "Your account has no profile yet. Run npm run db:seed locally, or ask an admin to set your role in Supabase."
          );
        }

        if (mode === "admin" && role !== "admin") {
          await supabase.auth.signOut();
          throw new Error(
            "This account is not an admin. Use /login for students, or fix the role in Supabase → profiles."
          );
        }
        if (mode === "student" && role !== "student") {
          await supabase.auth.signOut();
          throw new Error("Please use the admin login for this account.");
        }

        router.push(redirectTo ?? (mode === "admin" ? "/admin" : "/dashboard"));
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@school.edu"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {(!useMagicLink || mode === "admin") && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
        </div>
      )}

      {mode === "student" && (
        <button
          type="button"
          className="text-sm text-primary underline-offset-4 hover:underline"
          onClick={() => setUseMagicLink((v) => !v)}
        >
          {useMagicLink ? "Use email and password instead" : "Use magic link instead"}
        </button>
      )}

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          {message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? "Please wait…"
          : useMagicLink && mode === "student"
            ? "Send magic link"
            : "Sign in"}
      </Button>
    </form>
  );
}
