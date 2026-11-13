export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
        <div>NEDA / 2026 / built at NEAR HACKATHON</div>
        <div className="flex gap-5">
          <a
            href="https://github.com/Labi-Joy/neda"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            github
          </a>
          <a
            href="https://docs.near-intents.org/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            near intents
          </a>
          <a
            href="https://near.ai/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            near ai
          </a>
        </div>
      </div>
    </footer>
  );
}
