import React from 'react';

export const FileCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="aspect-square skeleton-shimmer relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
        </div>
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="h-4 skeleton-shimmer rounded w-3/4"></div>
        
        <div className="space-y-2">
          <div className="h-3 skeleton-shimmer rounded w-1/2"></div>
          <div className="h-3 skeleton-shimmer rounded w-2/3"></div>
          <div className="h-3 skeleton-shimmer rounded w-1/3"></div>
        </div>
        
        <div className="flex space-x-2">
          <div className="h-6 skeleton-shimmer rounded-full w-16"></div>
          <div className="h-6 skeleton-shimmer rounded-full w-20"></div>
        </div>
      </div>
    </div>
  );
};
