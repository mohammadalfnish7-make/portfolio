import Link from "next/link";

const links = [
  { href: "/courses", label: "Courses" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/agents", label: "Agents" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg tracking-tight"
          data-track="nav-brand"
        >
          Mohammad Alfnish
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-fg-muted">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-fg transition-colors min-h-11 inline-flex items-center"
              data-track={`nav-${l.label.toLowerCase()}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <details className="relative md:hidden">
          <summary className="list-none cursor-pointer min-h-11 min-w-11 inline-flex items-center justify-center rounded-md border border-border px-3">
            Menu
          </summary>
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-bg-elevated p-2 shadow-xl">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block rounded-md px-3 py-3 text-sm hover:bg-accent-soft"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="container-page flex flex-col gap-4 py-10 text-sm text-fg-muted md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Mohammad Alfnish · Dubai, UAE</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refunds">Refunds</Link>
          <a
            href="https://linkedin.com/in/mohammadalfnish"
            target="_blank"
            rel="noreferrer"
            data-track="footer-linkedin"
          >
            LinkedIn
          </a>
          <a
            href="https://github.com/mohammadalfnish"
            target="_blank"
            rel="noreferrer"
            data-track="footer-github"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
