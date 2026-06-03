"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  mode?: "student" | "admin";
  redirectTo?: string;
}

function getClientAppUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

function isSupabaseConfiguredInBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return (
    url.includes(".supabase.co") &&
    !url.includes("your-project") &&
    key.length > 20 &&
    !key.includes("your-anon")
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}

export function LoginForm({ mode = "student", redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfiguredInBrowser()) {
      setConfigError(
        "This deployment has no Supabase URL in the app build. Add env vars on Vercel (Production), then Redeploy — login will not work until you do."
      );
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    if (configError) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    let supabase;
    try {
      supabase = createClient();
    } catch (configError) {
      setError(
        configError instanceof Error
          ? configError.message
          : "App is not configured. Redeploy Vercel after setting env vars."
      );
      setLoading(false);
      return;
    }

    try {
      const password = values.password?.trim() ?? "";
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      const { error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: values.email,
          password,
        }),
        20000,
        "Login timed out. On Vercel: set real Supabase URL + anon key, then Redeploy (required for NEXT_PUBLIC_*)."
      );
      if (signInError) throw signInError;

      // Fetch role immediately to speed up the first redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const role = await getProfileRole(asProfileClient(supabase), user.id);
        if (role) {
          // Set cookie for middleware to pick up
          document.cookie = `user-role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

          // Redirect directly to the correct dashboard
          const target = redirectTo || (role === "admin" ? "/admin" : "/dashboard");
          router.push(target);
          router.refresh();
          return;
        }
      }

      // Fallback redirect
      router.push(redirectTo ?? "/");
      router.refresh();
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
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
      </div>

      {configError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {configError}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300">
          {message}
        </p>
      )}

      <Button
        type="submit"
        className="w-full shine-btn"
        size="lg"
        disabled={loading || !!configError}
      >
        {loading ? "Please wait…" : "Sign in"}
      </Button>
    </form>
  );
}
