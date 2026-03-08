import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="modern-card p-6 md:p-8">
      <div className="flex items-center gap-4 mb-5">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-6 h-6 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-[200px]" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-6 h-6 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-[180px]" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-6 h-6 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-[220px]" />
        </div>
      </div>
    </div>
  );
}

export function DirectoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SiteDetailSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero Skeleton */}
      <div className="py-12 md:py-20 px-4">
        <div className="container max-w-5xl mx-auto">
          <Skeleton className="h-4 w-32 mb-8" />
          <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
            <Skeleton className="w-20 h-20 md:w-28 md:h-28 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-36" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl border p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="bg-card rounded-2xl border p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GuideCardSkeleton() {
  return (
    <div className="modern-card p-8">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-7 w-3/4 mb-4" />
      <Skeleton className="h-4 w-32 mb-6" />
      <Skeleton className="h-5 w-28" />
    </div>
  );
}
