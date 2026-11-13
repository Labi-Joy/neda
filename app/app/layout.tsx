import { getCurrentNearId } from "@/lib/auth";
import { AuthGate } from "@/components/auth-gate";
import { SignOutButton } from "@/components/sign-out-button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nearId = await getCurrentNearId();

  if (!nearId) {
    return (
      <div className="flex-1 flex flex-col">
        <SiteHeader variant="public" />
        <AuthGate />
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader
        variant="app-authed"
        rightSlot={
          <>
            <span className="text-muted-foreground font-mono text-xs hidden md:inline">
              {nearId}
            </span>
            <ThemeToggle />
            <SignOutButton />
          </>
        }
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
