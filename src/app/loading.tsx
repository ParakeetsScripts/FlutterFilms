import { PosterSkeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 h-10 w-48 animate-pulse bg-[#1c1b19]" />
      <PosterSkeleton />
    </div>
  );
}
