// Deterministic cover/poster colour for the Marquee redesign — see
// web/REDESIGN_SPEC.md section 2. A simple string hash mod the palette
// length, so a given item id always gets the same pair, with no need to
// store a colour anywhere. Replaces the genre shelf colour cards used to
// take (lib/books/genres.ts and lib/shows/genres.ts's `color` field is
// left in place, unused, per the spec — shelf headings still use it
// until a later PR).
const PALETTE: { bg: string; fg: string }[] = [
  { bg: "#E4572E", fg: "#FFF6F2" },
  { bg: "#3D5AFE", fg: "#F2F4FF" },
  { bg: "#F2C14E", fg: "#1D1606" },
  { bg: "#2EC4B6", fg: "#06201D" },
  { bg: "#7A2E27", fg: "#FFF1EC" },
  { bg: "#9B8CFF", fg: "#120D2E" },
  { bg: "#5F6E56", fg: "#F2F5EF" },
  { bg: "#FF6B57", fg: "#1A0B08" },
];

export function coverColor(id: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
