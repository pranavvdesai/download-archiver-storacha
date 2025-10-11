import React from 'react';

export const FileListSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="w-10 h-10 skeleton-shimmer rounded-lg"></div>
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 skeleton-shimmer rounded w-3/4"></div>
            
            <div className="flex items-center space-x-4">
              <div className="h-3 skeleton-shimmer rounded w-16"></div>
              <div className="h-3 skeleton-shimmer rounded w-20"></div>
              <div className="h-3 skeleton-shimmer rounded w-12"></div>
              <div className="h-3 skeleton-shimmer rounded w-16"></div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="h-6 skeleton-shimmer rounded-full w-12"></div>
            <div className="h-6 skeleton-shimmer rounded-full w-16"></div>
          </div>
          
          <div className="w-8 h-8 skeleton-shimmer rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};
