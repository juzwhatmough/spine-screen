import type { SourceStatus } from "@/types/database";

// Direct port of kindLabel() from index.html — 5 source_status values map
// to 4 distinct labels. The Batch 3 spec only mentioned 3 values
// (want/more/discover); keeping all 5 here preserves the original app's
// exact card-label behavior (ai/ai-known both existed and meant different
// things from a generic "discover").
export function kindLabel(status: SourceStatus | undefined): string {
  if (status === "want") return "From your list";
  if (status === "more") return "More by this author";
  if (status === "ai-known") return "More by this author";
  if (status === "ai") return "Suggested for you";
  return "New to you";
}
