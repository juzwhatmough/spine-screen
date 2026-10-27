import { TabNav } from "@/components/nav/TabNav";

// Shown instantly while the server fetches the real list, so the header and tabs
// are on screen immediately and the cards fade in where the placeholders sit.
export function PageSkeleton({ active }: { active: "books" | "shows" }) {
  return (
    <>
      <header>
        <div className="spine-strip" />
        <p className="eyebrow">Personal library · Est. Aug 2026</p>
        <h1>
          The <em>Shelf</em>
        </h1>
        <TabNav active={active} />
      </header>
      <main aria-busy="true" aria-label="Loading your shelf" className="skeleton-list">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card" />
        ))}
      </main>
    </>
  );
}
