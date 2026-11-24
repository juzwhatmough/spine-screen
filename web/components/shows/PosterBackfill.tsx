"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { backfillShowPosters } from "@/lib/actions/showPosters";

// Invisible. When some shows have no poster yet, quietly fetches them in
// batches in the background and refreshes the page as they arrive, so
// posters fade in without the user doing anything. Runs once per page load.
export function PosterBackfill({ pending }: { pending: number }) {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (pending <= 0 || started.current) return;
    started.current = true;

    let cancelled = false;
    (async () => {
      try {
        // Safety cap so a misbehaving loop can never run away.
        for (let i = 0; i < 20 && !cancelled; i++) {
          const { updated, remaining } = await backfillShowPosters();
          if (updated > 0) router.refresh();
          if (remaining <= 0) break;
        }
      } catch {
        // Posters are a nicety — fail silently and keep the coloured cards.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pending, router]);

  return null;
}
