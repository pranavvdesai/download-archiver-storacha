import React from 'react';

export const HeaderSkeleton: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 skeleton-shimmer rounded-lg"></div>
          <div className="h-6 skeleton-shimmer rounded w-24"></div>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <div className="h-10 skeleton-shimmer rounded-lg"></div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 skeleton-shimmer rounded-full"></div>
            <div className="h-4 skeleton-shimmer rounded w-20"></div>
          </div>
          
          <div className="w-10 h-10 skeleton-shimmer rounded-lg"></div>
        </div>
      </div>
    </header>
  );
};
