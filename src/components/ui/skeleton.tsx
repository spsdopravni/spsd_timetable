import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        'bg-gray-200 dark:bg-gray-700',
        className
      )}
      {...props}
    />
  );
}

// Specialized skeleton components
export const DepartureSkeleton: React.FC = () => (
  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between rounded-lg border p-3 mb-2">
    <div className="flex items-center gap-4 w-full lg:w-auto">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="h-6 w-32 mb-2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
    <div className="text-center lg:text-right flex-shrink-0 w-full lg:w-auto">
      <Skeleton className="h-10 w-20 mx-auto lg:mx-0" />
    </div>
  </div>
);

export const WeatherSkeleton: React.FC = () => (
  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl border-2 border-white/30">
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  </div>
);

export const HeaderSkeleton: React.FC = () => (
  <div className="text-white shadow-lg relative bg-blue-900/80">
    <div className="px-4 py-6 relative z-10 h-full flex items-center">
      <div className="grid grid-cols-1 lg:grid-cols-3 w-full gap-4 items-center">
        <div className="flex items-center gap-6 justify-start">
          <Skeleton className="h-40 w-64" />
        </div>
        <div className="text-center">
          <Skeleton className="h-16 w-48 mx-auto" />
        </div>
        <div className="flex flex-col items-end gap-3">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-6 w-56" />
        </div>
      </div>
    </div>
  </div>
);