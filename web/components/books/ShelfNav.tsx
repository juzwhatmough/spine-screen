"use client";

import { useEffect, useState } from "react";

// Port of the sticky-nav scroll-spy from index.html — same
// IntersectionObserver + rootMargin approach.
export function ShelfNav({ shelves }: { shelves: { id: string; tag: string }[] }) {
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
