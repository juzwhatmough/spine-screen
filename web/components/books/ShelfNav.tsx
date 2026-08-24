"use client";

import { useEffect, useState } from "react";

// Port of the sticky-nav scroll-spy from index.html — same
// IntersectionObserver + rootMargin approach. `onActiveChange` is used by
// the Add FAB (see AddBookFab.tsx/AddShowFab.tsx) to pre-fill the modal's
// Genre dropdown with whatever shelf is currently in view — this is the
// only reason that callback exists, ShelfNav itself doesn't need it.
export function ShelfNav({
  shelves,
  onActiveChange,
}: {
  shelves: { id: string; tag: string }[];
  onActiveChange?: (tag: string) => void;
}) {
  const [active, setActive] = useState<string | undefined>(shelves[0]?.id);

  useEffect(() => {
    const sections = shelves
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [shelves]);

  useEffect(() => {
    const shelf = shelves.find((s) => s.id === active);
    if (shelf) onActiveChange?.(shelf.tag);
  }, [active, shelves, onActiveChange]);

  return (
    <nav className="shelves">
      {shelves.map((s) => (
        <button
          key={s.id}
          className={active === s.id ? "active" : ""}
          onClick={() =>
            document
              .getElementById(s.id)
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        >
          {s.tag}
        </button>
      ))}
    </nav>
  );
}
