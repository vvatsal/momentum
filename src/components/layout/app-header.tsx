import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  homeHref: string;
}

export function AppHeader({ title, subtitle, homeHref }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4 sm:max-w-2xl lg:max-w-4xl">
        <div className="min-w-0">
          <Link href={homeHref} className="block truncate font-semibold">
            {title}
          </Link>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
