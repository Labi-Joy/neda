import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShineButton } from "@/components/shine-button";

type Variant = "public" | "app-authed";

type Props = {
  variant?: Variant;
  rightSlot?: React.ReactNode;
};

export function SiteHeader({ variant = "public", rightSlot }: Props) {
  if (variant === "app-authed") {
    return (
      <header className="relative z-20 border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/app" className="font-bold tracking-widest text-lg">
              NEDA
            </Link>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/app" className="hover:text-foreground">
                Invoices
              </Link>
              <Link href="/app/settings" className="hover:text-foreground">
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">{rightSlot}</div>
        </div>
      </header>
    );
  }

  return (
    <header className="relative z-20 mx-auto max-w-6xl flex items-center justify-between px-6 py-6">
      <Link href="/" className="font-bold tracking-widest text-lg">
        NEDA
      </Link>
      <nav className="flex items-center gap-3">
        <ThemeToggle />
        <a
          href="https://github.com/Labi-Joy/neda"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-mono text-muted-foreground hover:text-foreground px-2 py-1"
        >
          github
        </a>
        <ShineButton href="/app" size="sm">
          Launch app
        </ShineButton>
      </nav>
    </header>
  );
}
