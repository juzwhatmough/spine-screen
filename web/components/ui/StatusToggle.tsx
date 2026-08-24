"use client";

export type StatusView = "shelf" | "finished";

// Reuses .tab-nav's exact visual styling (see globals.css) rather than a
// dropdown, per the brief — same component the Books/Shows header
// switcher uses, just with buttons instead of links and placed next to
// the stats bar instead of the header.
export function StatusToggle({
  value,
  onChange,
}: {
  value: StatusView;
  onChange: (value: StatusView) => void;
}) {
  return (
    <div className="tab-nav status-toggle" role="tablist">
      <button
        type="button"
        className={value === "shelf" ? "active" : ""}
        role="tab"
        aria-selected={value === "shelf"}
        onClick={() => onChange("shelf")}
      >
        On the Shelf
      </button>
      <button
        type="button"
        className={value === "finished" ? "active" : ""}
        role="tab"
        aria-selected={value === "finished"}
        onClick={() => onChange("finished")}
      >
        Finished
      </button>
    </div>
  );
}
