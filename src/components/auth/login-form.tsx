"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type FormValues = z.infer<typeof schema>;

interface LoginFormProps {
  mode: "student" | "admin";
  redirectTo?: string;
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
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;

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
        if (!values.password) {
          setError("Password is required");
          setLoading(false);
          return;
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (signInError) throw signInError;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Sign in failed");

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = profile?.role;
        if (mode === "admin" && role !== "admin") {
          await supabase.auth.signOut();
          throw new Error("This account is not an admin.");
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
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
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
