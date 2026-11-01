// Moved out of components/filters/SearchBox.tsx — that component's input
// UI is gone (search now lives in the header, see
// components/nav/ShelfHeader.tsx, per web/REDESIGN_SPEC.md section 5.5),
// but this matching logic is unchanged and still shared by Books and
// Shows. Every word typed must appear somewhere in the haystack, so
// "hannah night" finds "The Nightingale" by Kristin Hannah.
export function matchesQuery(query: string, ...fields: (string | null | undefined)[]): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return words.every((w) => haystack.includes(w));
}
