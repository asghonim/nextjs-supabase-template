import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col items-center min-h-screen w-full gap-16">
      {/* Hero skeleton */}
      <div className="w-full flex flex-col items-center gap-6 pt-20 px-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-6 w-120 max-w-full" />
        <Skeleton className="h-6 w-90 max-w-full" />
        <Skeleton className="h-12 w-40 mt-4 rounded-full" />
      </div>
      {/* Logo row skeleton */}
      <div className="flex gap-8 items-center justify-center flex-wrap px-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded" />
        ))}
      </div>
      {/* Feature cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl px-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
