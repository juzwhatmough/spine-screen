"use client";

export type FilterDef = {
  id: string;
  label: string;
  value: string;
  options: string[];
};

// Shared between Books (Author + Genre) and Shows (Genre + Platform) so
// the two never visually drift apart. Options are always the full set
// derived from the caller's loaded data — this component doesn't narrow
// one dropdown's options based on another filter's current value.
export function FilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: FilterDef[];
  onChange: (id: string, value: string) => void;
  onClear: () => void;
}) {
  const anyActive = filters.some((f) => f.value !== "");

  return (
    <div className="filter-row">
      {filters.map((f) => (
        <div className="filter-field" key={f.id}>
          <label htmlFor={`filter-${f.id}`}>{f.label}</label>
          <select
            id={`filter-${f.id}`}
            value={f.value}
            onChange={(e) => onChange(f.id, e.target.value)}
          >
            <option value="">All</option>
            {f.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))}
      {anyActive && (
        <button type="button" className="link-btn" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
