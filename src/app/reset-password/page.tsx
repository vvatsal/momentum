"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/layout/page-shell";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState(searchParams.get("email") || "");
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const emailParam = searchParams.get("email");
        if (emailParam) setEmail(emailParam);
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const supabase = createClient();

        // 1. Verify the OTP
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "recovery",
        });

        if (verifyError) {
            setError(verifyError.message);
            setLoading(false);
            return;
        }

        // 2. Update the password
        const { error: updateError } = await supabase.auth.updateUser({
            password: password,
        });

        if (updateError) {
            setError(updateError.message);
        } else {
            setMessage("Password updated successfully! Redirecting to login...");
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="token">Activation Code (OTP)</Label>
                <Input
                    id="token"
                    type="text"
                    placeholder="123456"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                />
            </div>

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
                disabled={loading}
            >
                {loading ? "Updating..." : "Reset Password"}
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <PageShell centered className="justify-center px-4 py-10">
            <div className="mx-auto w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-black tracking-tight">
                        Reset <span className="gradient-text">password</span>
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter the code from your email and your new password
                    </p>
                </div>

                <div className="relative bento-card p-6 sm:p-8">
                    <Suspense fallback={<div>Loading...</div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    <Link
                        href="/login"
                        className="font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                        ← Back to login
                    </Link>
                </p>
            </div>
        </PageShell>
    );
}
