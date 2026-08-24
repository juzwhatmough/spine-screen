// Staleness threshold for the "last verified" note on a show's platform.
// The ticket's own example ("60+ days") is used as-is rather than
// inventing a different number.
export const STALE_AFTER_DAYS = 60;

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export function isStale(iso: string | null | undefined): boolean {
  return !iso || daysSince(iso) >= STALE_AFTER_DAYS;
}

// Deliberately coarse (weeks/months, not exact days) — this is a low
// visual weight footnote, not a precision timestamp.
export function formatRelativeTime(iso: string): string {
  const days = daysSince(iso);
  if (days <= 0) return "checked today";
  if (days === 1) return "checked yesterday";
  if (days < 7) return `checked ${days} days ago`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return `checked ${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return `checked ${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.round(days / 365);
  return `checked ${years} year${years === 1 ? "" : "s"} ago`;
}
