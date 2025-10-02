import React from 'react';
import { Activity } from 'lucide-react';

export const ActivityTimeline: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Timeline</h3>
        <p className="text-gray-600">Activity tracking feature coming soon.</p>
      </div>
    </div>
  );
};
