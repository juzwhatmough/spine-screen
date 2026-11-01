import Link from "next/link";

// Books/Shows segmented control — web/REDESIGN_SPEC.md section 4.2.
// Same role="tablist"/aria-selected contract as before; just restyled
// from the old `.tab-nav` look to `.mq-segmented` (see globals.css).
export function TabNav({ active }: { active: "books" | "shows" }) {
  return (
    <div className="mq-segmented" role="tablist" aria-label="Library">
      <Link
        href="/books"
        role="tab"
        aria-selected={active === "books"}
        className={active === "books" ? "mq-segmented-item active" : "mq-segmented-item"}
      >
        Books
      </Link>
      <Link
        href="/shows"
        role="tab"
        aria-selected={active === "shows"}
        className={active === "shows" ? "mq-segmented-item active" : "mq-segmented-item"}
      >
        Shows
      </Link>
    </div>
  );
}
