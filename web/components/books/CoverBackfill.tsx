"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { backfillBookCovers } from "@/lib/actions/bookCovers";

// Invisible. When some books have no cover yet, quietly fetches them in
// batches in the background and refreshes the page as they arrive. Runs
// once per page load. Mirrors components/shows/PosterBackfill.tsx.
export function CoverBackfill({ pending }: { pending: number }) {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (pending <= 0 || started.current) return;
    started.current = true;

    let cancelled = false;
    (async () => {
      try {
        for (let i = 0; i < 20 && !cancelled; i++) {
          const { updated, remaining } = await backfillBookCovers();
          if (updated > 0) router.refresh();
          if (remaining <= 0) break;
        }
      } catch {
        // Covers are a nicety — fail silently and keep the coloured cards.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pending, router]);

  return null;
}
