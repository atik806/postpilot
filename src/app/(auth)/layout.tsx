import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { APP_TAGLINE } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.12]" />
        <Link href="/" className="relative z-10">
          <Logo className="text-primary-foreground [&_svg]:text-primary-foreground" />
        </Link>
        <div className="relative z-10 space-y-4">
          <p className="text-3xl font-semibold leading-tight text-balance">
            {APP_TAGLINE}
          </p>
          <p className="max-w-sm text-sm text-primary-foreground/75">
            One post. Every platform. Zero repetitive work. PostPilot adapts,
            schedules and publishes your content everywhere.
          </p>
        </div>
        <p className="relative z-10 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} PostPilot
        </p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex lg:hidden">
            <Logo />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
