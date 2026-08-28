"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NAV_ITEMS } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = NAV_ITEMS.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase()),
  );

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent md:flex"
      >
        <Search className="size-4" />
        <span>Search…</span>
        <kbd className="ml-2 rounded border bg-muted px-1.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[20%] max-w-lg translate-y-0 p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Search PostPilot</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search PostPilot…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-80 overflow-y-auto p-2">
            {results.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matches.
              </li>
            )}
            {results.map((item) => (
              <li key={item.href}>
                <button
                  onClick={() => go(item.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent",
                  )}
                >
                  <item.icon className="size-4 text-muted-foreground" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
