import { TabNav } from "@/components/nav/TabNav";

// Shown instantly by app/books/loading.tsx and app/shows/loading.tsx while
// the real page is fetched from the server, so switching tabs never leaves
// the old page frozen on screen.
export function PageSkeleton({
  active,
  blurb,
}: {
  active: "books" | "shows";
  blurb: string;
}) {
  return (
    <>
      <header>
        <div className="spine-strip" />
        <p className="eyebrow">Personal library · Est. Aug 2026</p>
        <h1>
          The <em>Shelf</em>
        </h1>
        <p className="sub">{blurb}</p>
        <TabNav active={active} />
      </header>

      <div className="skeleton-wrap" aria-busy="true" aria-label="Loading your shelf">
        <div className="skeleton-line" style={{ width: "40%" }} />
        <div className="skeleton-line" style={{ width: "70%" }} />
        <div className="cards">
          {[0, 1, 2].map((i) => (
            <div className="skeleton-card" key={i}>
              <div className="skeleton-line" style={{ width: "30%", height: 10 }} />
              <div className="skeleton-line" style={{ width: "75%", height: 18 }} />
              <div className="skeleton-line" style={{ width: "90%" }} />
              <div className="skeleton-line" style={{ width: "60%" }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
