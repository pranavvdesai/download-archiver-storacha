import React from 'react';

export const FormSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 skeleton-shimmer rounded-full mx-auto mb-4"></div>
          <div className="h-6 skeleton-shimmer rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 skeleton-shimmer rounded w-64 mx-auto"></div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="h-4 skeleton-shimmer rounded w-24 mb-2"></div>
            <div className="h-12 skeleton-shimmer rounded-lg"></div>
          </div>

          <div className="h-12 skeleton-shimmer rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};
