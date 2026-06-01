import Link from "next/link";
import { LogOut, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  homeHref: string;
}

export function AppHeader({ title, subtitle, homeHref }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] glass-strong">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4 sm:max-w-2xl lg:max-w-4xl">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={homeHref}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-glow-sm"
            aria-label="Home"
          >
            <Zap className="h-4 w-4 text-white" />
          </Link>
          <div className="min-w-0">
            <Link
              href={homeHref}
              className="block truncate text-sm font-bold tracking-tight"
            >
              {title}
            </Link>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
