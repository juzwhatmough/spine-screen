import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function Loading() {
  return (
    <PageSkeleton
      active="books"
      blurb="Your favourite authors, more of their own work, and the writers you might fall for next — sorted the way a good bookshop shelves them, by genre rather than app."
    />
  );
}
