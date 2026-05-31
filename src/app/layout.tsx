import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZeroWait Care — Virtual Care, Zero Wait Time",
  description:
    "AI-powered asynchronous virtual care that eliminates wait times while keeping clinicians in charge of every medical decision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-surface text-text-primary">
        {/* ── Top Navigation Bar ─────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-border backdrop-blur-xl bg-surface/80">
          <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight text-text-primary transition-colors hover:text-primary"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary text-sm font-bold">
                Z
              </span>
              <span>
                Zero<span className="text-primary">Wait</span>
              </span>
            </Link>

            <div className="flex items-center gap-1">
              <Link
                href="/patient"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary transition-all hover:bg-surface-alt hover:text-text-primary"
              >
                Patient Portal
              </Link>
              <Link
                href="/provider"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary transition-all hover:bg-surface-alt hover:text-text-primary"
              >
                Provider Dashboard
              </Link>
            </div>
          </nav>
        </header>

        {/* ── Main Content ───────────────────────────────────────── */}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
