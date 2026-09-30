"use client";

import Link from "next/link";
import { useState } from "react";

// Client component so the tab you tap lights up *immediately* (and shows a
// small spinner) while the other page loads from the server — without this,
// the old tab stayed highlighted for a couple of seconds and it looked like
// the tap hadn't registered. The page remounts on arrival, so `target`
// resets by itself.
export function TabNav({ active }: { active: "books" | "shows" }) {
  const [target, setTarget] = useState<"books" | "shows" | null>(null);
  const shown = target ?? active;
  const loading = target !== null && target !== active;

  return (
    <div className="tab-nav" role="tablist" aria-busy={loading}>
      <Link
        href="/books"
        className={shown === "books" ? "active" : ""}
        role="tab"
        aria-selected={shown === "books"}
        onClick={() => setTarget("books")}
      >
        📚 Books
        {loading && target === "books" && <span className="tab-spinner" aria-hidden="true" />}
      </Link>
      <Link
        href="/shows"
        className={shown === "shows" ? "active" : ""}
        role="tab"
        aria-selected={shown === "shows"}
        onClick={() => setTarget("shows")}
      >
        📺 Shows
        {loading && target === "shows" && <span className="tab-spinner" aria-hidden="true" />}
      </Link>
    </div>
  );
}
