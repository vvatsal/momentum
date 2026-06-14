"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { AppHeader } from "@/components/layout/app-header";
import { StudentBottomNav } from "@/components/layout/student-bottom-nav";
import { User, KeyRound, Loader2, Mail, Sun, Moon } from "lucide-react";
import type { Profile } from "@/types/database";

export function ProfileClient({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [email, setEmail] = useState(profile.email || "");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    const root = document.documentElement;
    if (newTheme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  };

  const username = profile.username || profile.email?.split("@")[0] || "N/A";
  const homeHref = profile.role === "admin" ? "/admin" : "/dashboard";

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === profile.email) {
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) {
        toast({
          title: "Error updating email",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email update requested",
          description: "A confirmation link has been sent to your new email address. Please verify it.",
        });
        router.refresh();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        title: "Validation error",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Validation error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({
          title: "Error updating password",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password updated",
          description: "Successfully updated your password.",
        });
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <>
      <AppHeader
        title="My Profile"
        subtitle={profile.full_name ?? profile.email}
        homeHref={homeHref}
      />

      <div className="mx-auto max-w-lg px-4 pb-28 pt-6 sm:max-w-2xl space-y-6">
        {/* User Card */}
        <div className="bento-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">
                {profile.full_name || "No Name"}
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                @{username}
              </p>
            </div>
          </div>
          <Badge
            variant={profile.role === "admin" ? "default" : "secondary"}
            className="text-[10px] uppercase font-semibold tracking-wider px-2.5 py-1"
          >
            {profile.role}
          </Badge>
        </div>

        {/* Display Settings Card */}
        <div className="bento-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Preferences</h3>
          </div>
          <div className="space-y-4">
            <Label className="text-xs uppercase font-bold text-muted-foreground/60 tracking-wider">Display Theme</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => toggleTheme("light")}
                className="gap-2 h-11 font-bold border-border hover:bg-accent rounded-2xl"
              >
                <Sun className="h-4 w-4 text-amber-400" />
                Light
              </Button>
              <Button
                type="button"
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => toggleTheme("dark")}
                className="gap-2 h-11 font-bold border-border hover:bg-accent rounded-2xl"
              >
                <Moon className="h-4 w-4 text-cyan-400" />
                Dark
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Info & Email Settings */}
        <div className="bento-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Email Settings</h3>
          </div>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email Address</Label>
              <Input
                id="profile-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="bg-background"
              />
            </div>
            <Button
              type="submit"
              disabled={isUpdatingEmail || email.trim() === profile.email}
              className="shine-btn w-full font-bold"
            >
              {isUpdatingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Email Address"
              )}
            </Button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="bento-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Change Password</h3>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-new-password">New Password</Label>
              <Input
                id="profile-new-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-confirm-password">Confirm New Password</Label>
              <Input
                id="profile-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background"
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              disabled={isUpdatingPassword || !password}
              className="shine-btn w-full font-bold"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </div>
      </div>

      {profile.role === "student" && <StudentBottomNav />}
    </>
  );
}
