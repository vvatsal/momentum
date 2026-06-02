"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/layout/page-shell";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("If an account exists for this email, you will receive a reset code shortly.");
            setTimeout(() => {
                router.push(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 2000);
        }
        setLoading(false);
    };

    return (
        <PageShell centered className="justify-center px-4 py-10">
            <div className="mx-auto w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-black tracking-tight">
                        Forgot <span className="gradient-text">password?</span>
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter your email to receive an activation code
                    </p>
                </div>

                <div className="relative bento-card p-6 sm:p-8">
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
                            {loading ? "Sending..." : "Send activation code"}
                        </Button>
                    </form>
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
