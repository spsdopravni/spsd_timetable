import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DepartureSkeleton } from '@/components/ui/skeleton';

interface DepartureListSkeletonProps {
  itemCount?: number;
}

const DepartureListSkeletonComponent: React.FC<DepartureListSkeletonProps> = ({
  itemCount = 7
}) => {
  return (
    <Card className="shadow-lg bg-white/90 dark:bg-gray-800/90 h-full border-2 border-gray-300 dark:border-gray-600 flex flex-col overflow-hidden">
      <CardContent className="flex-1 p-2 flex flex-col min-h-full">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col space-y-1">
            {Array.from({ length: itemCount }, (_, index) => (
              <DepartureSkeleton key={index} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DepartureListSkeleton = memo(DepartureListSkeletonComponent);