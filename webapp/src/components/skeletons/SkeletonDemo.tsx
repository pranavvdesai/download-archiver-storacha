import React from 'react';
import { FileCardSkeleton, FileListSkeleton, FormSkeleton, HeaderSkeleton } from './index';

export const SkeletonDemo: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Skeleton Components Demo</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Header Skeleton</h3>
            <HeaderSkeleton />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Form Skeleton</h3>
            <div className="max-w-md">
              <FormSkeleton />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">File Card Skeletons (Grid View)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <FileCardSkeleton key={index} />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">File List Skeletons</h3>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <FileListSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
