import Link from "next/link";
import { getCurrentNearId } from "@/lib/auth";
import { AuthGate } from "@/components/auth-gate";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nearId = await getCurrentNearId();

  if (!nearId) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="mx-auto w-full max-w-6xl flex items-center justify-between px-6 py-5">
          <Link href="/" className="font-semibold tracking-tight text-lg">
            neda
          </Link>
        </header>
        <AuthGate />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/app" className="font-semibold tracking-tight text-lg">
              neda
            </Link>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/app" className="hover:text-foreground">
                Invoices
              </Link>
              <Link
                href="/app/settings"
                className="hover:text-foreground"
              >
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground font-mono text-xs hidden md:inline">
              {nearId}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
