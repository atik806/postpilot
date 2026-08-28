import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  Sparkles,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PlatformIcon } from "@/components/social/platform-icon";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLANS } from "@/lib/constants";
import { PLATFORMS } from "@/types";

const STEPS = [
  { n: "01", title: "Create", body: "Write your content once in a focused composer." },
  { n: "02", title: "Customize", body: "AI adapts it for every platform — you keep final say." },
  { n: "03", title: "Publish", body: "Schedule or publish everywhere. Workers do the rest." },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI content engine",
    body: "Generate captions, rewrite per platform, and produce hashtags — behind a provider-agnostic abstraction.",
  },
  {
    icon: CalendarClock,
    title: "Reliable scheduling",
    body: "A database-backed queue with retries, backoff and idempotency. No open browser required.",
  },
  {
    icon: BarChart3,
    title: "Honest analytics",
    body: "Metrics come only from real platform data. PostPilot never shows placeholder numbers.",
  },
  {
    icon: Users,
    title: "Workspaces & roles",
    body: "Owner, admin, editor and viewer roles with strict per-workspace isolation enforced in the database.",
  },
];

const FAQ = [
  {
    q: "Do I need developer accounts for each platform?",
    a: "No. Without credentials, platforms connect in a clearly-labelled Sandbox mode so you can try the full flow. Add a platform's OAuth keys to go live.",
  },
  {
    q: "Where is my data stored?",
    a: "In your own Supabase project — Postgres for data, Supabase Storage for media. Social tokens are encrypted at rest with AES-256-GCM.",
  },
  {
    q: "What happens if a post fails on one platform?",
    a: "The post is marked partially published, the failed target retries with exponential backoff, and you get a one-click retry.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.15]" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Create Once. Publish Everywhere.
              </span>
              <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                The AI-powered social media command center
              </h1>
              <p className="max-w-md text-lg text-muted-foreground">
                One post. Every platform. Zero repetitive work. PostPilot adapts,
                schedules and publishes your content for creators, businesses and
                teams.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/signup">
                    Start free <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#how">See how it works</a>
                </Button>
              </div>
              <div className="flex items-center gap-3 pt-2 text-sm text-muted-foreground">
                <div className="flex gap-1.5">
                  {PLATFORMS.map((p) => (
                    <PlatformIcon key={p} platform={p} brand className="size-5" />
                  ))}
                </div>
                <span>and more</span>
              </div>
            </div>

            <div className="relative">
              <Card className="shadow-xl">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <Logo />
                    <span className="text-xs text-muted-foreground">Create Post</span>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                    Introducing our newest product 🚀 — built for teams who move
                    fast.
                  </div>
                  <div className="space-y-2">
                    {PLATFORMS.slice(0, 4).map((p) => (
                      <div
                        key={p}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <PlatformIcon platform={p} brand className="size-4" />
                          {p[0].toUpperCase() + p.slice(1)}
                        </span>
                        <Check className="size-4 text-success" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
                    <span className="flex items-center gap-2">
                      <Sparkles className="size-4" /> AI optimized
                    </span>
                    <span>Scheduled for 8:00 PM</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            From idea to published in under a minute
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border bg-card p-6">
                <p className="text-sm font-semibold text-primary">{s.n}</p>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-center text-3xl font-semibold tracking-tight">
              Built like a product you&apos;d pay for
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex gap-4 rounded-xl border bg-card p-6">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Simple pricing
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Object.values(PLANS).map((plan) => (
              <div
                key={plan.tier}
                className={`flex flex-col rounded-xl border bg-card p-6 ${
                  plan.recommended ? "border-primary shadow-md" : ""
                }`}
              >
                <p className="font-semibold">{plan.name}</p>
                <p className="mt-2 text-3xl font-semibold">
                  ${plan.priceMonthly}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {h}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.recommended ? "default" : "outline"}
                  className="mt-6"
                >
                  <Link href="/signup">Get started</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="border-t bg-muted/30">
          <div className="mx-auto max-w-3xl px-4 py-20">
            <h2 className="text-center text-3xl font-semibold tracking-tight">
              Frequently asked
            </h2>
            <div className="mt-10 space-y-4">
              {FAQ.map((item) => (
                <div key={item.q} className="rounded-xl border bg-card p-5">
                  <p className="font-medium">{item.q}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Create once. Publish everywhere.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start free — no credit card, no platform credentials required.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/signup">
              Get started <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} PostPilot. Create Once. Publish Everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
