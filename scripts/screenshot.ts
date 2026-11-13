import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "/tmp/neda-shots";
mkdirSync(OUT, { recursive: true });

async function shoot(theme: "dark" | "light", path: string, name: string) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: theme,
  });
  const page = await ctx.newPage();
  // Set theme cookie-free via localStorage before load
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }, theme);
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  // Wait for theme-provider to resolve and for fonts
  await page.waitForTimeout(800);
  await page.screenshot({
    path: `${OUT}/${name}-${theme}.png`,
    fullPage: true,
  });
  await browser.close();
  console.log(`  ${OUT}/${name}-${theme}.png`);
}

async function shootAuthed(theme: "dark" | "light", path: string, name: string) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: theme,
  });
  // Pre-set the auth cookie so the dashboard renders
  await ctx.addCookies([
    {
      name: "neda_near_id",
      value: "example.near",
      domain: "localhost",
      path: "/",
    },
  ]);
  const page = await ctx.newPage();
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }, theme);
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: `${OUT}/${name}-${theme}.png`,
    fullPage: true,
  });
  await browser.close();
  console.log(`  ${OUT}/${name}-${theme}.png`);
}

async function main() {
  console.log("shooting landing (dark)...");
  await shoot("dark", "/", "landing");
  console.log("shooting landing (light)...");
  await shoot("light", "/", "landing");

  console.log("shooting dashboard (dark)...");
  await shootAuthed("dark", "/app", "dashboard");
  console.log("shooting invoice form (dark)...");
  await shootAuthed("dark", "/app/invoices/new", "newinvoice");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
