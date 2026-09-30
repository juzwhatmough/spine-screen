"use client";

// Free-text search shared by Books and Shows. Matching is done by the
// caller (simple case-insensitive "contains" on title + author/platform);
// this component is only the input, so the two tabs can't drift apart.
export function SearchBox({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="search-row">
      <div className="search-box">
        <svg
          className="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          aria-label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onChange("");
          }}
        />
        {value && (
          <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => onChange("")}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// Every word typed must appear somewhere in the haystack, so "hannah night"
// finds "The Nightingale" by Kristin Hannah.
export function matchesQuery(query: string, ...fields: (string | null | undefined)[]): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return words.every((w) => haystack.includes(w));
}
