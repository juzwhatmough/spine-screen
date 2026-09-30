import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function Loading() {
  return (
    <PageSkeleton
      active="shows"
      blurb="Shows queued up across every app you pay for — sorted the way a good shelf would, by genre rather than platform."
    />
  );
}
