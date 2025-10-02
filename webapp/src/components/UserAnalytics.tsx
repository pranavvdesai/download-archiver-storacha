import React from 'react';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Clock, 
  Download, 
  Share2,
  BarChart3,
  Calendar
} from 'lucide-react';
import { ActivityAnalytics } from '../types';

interface UserAnalyticsProps {
  analytics: ActivityAnalytics;
}

export const UserAnalytics: React.FC<UserAnalyticsProps> = ({ analytics }) => {
  const { userStats, patterns, fileActivity } = analytics;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getPeakHours = () => {
    const maxActivity = Math.max(...patterns.peakHours);
    const peakHourIndices = patterns.peakHours
      .map((count, index) => ({ count, hour: index }))
      .filter(item => item.count === maxActivity)
      .map(item => item.hour);
    
    return peakHourIndices.map(hour => {
      const time = new Date();
      time.setHours(hour, 0, 0, 0);
      return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        hour12: true 
      });
    });
  };

  const getMostActiveDay = () => {
    const days = Object.entries(patterns.weeklyPattern);
    if (days.length === 0) return 'No data';
    
    const mostActive = days.reduce((max, [day, count]) => 
      count > max.count ? { day, count } : max, 
      { day: '', count: 0 }
    );
    
    return mostActive.day;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Activity Analytics</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{userStats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Active Users</p>
              <p className="text-2xl font-bold text-green-900">{userStats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-600">Most Active</p>
              <p className="text-lg font-bold text-purple-900 truncate">
                {userStats.mostActiveUser || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h4 className="text-lg font-semibold text-gray-900">Peak Activity Hours</h4>
          </div>
          <div className="space-y-2">
            {getPeakHours().map((hour, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">{hour}</span>
                <span className="text-sm text-gray-500">
                  {Math.max(...patterns.peakHours)} activities
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h4 className="text-lg font-semibold text-gray-900">Weekly Activity</h4>
          </div>
          <div className="space-y-2">
            {Object.entries(patterns.weeklyPattern).map(([day, count]) => (
              <div key={day} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{day}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(count / Math.max(...Object.values(patterns.weeklyPattern))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Download className="w-5 h-5 text-gray-600" />
            <h4 className="text-lg font-semibold text-gray-900">Most Accessed Files</h4>
          </div>
          <div className="space-y-2">
            {fileActivity.mostAccessed.slice(0, 5).map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-2">
                  {file.fileName}
                </span>
                <span className="text-sm text-gray-500">
                  {file.accessCount} accesses
                </span>
              </div>
            ))}
            {fileActivity.mostAccessed.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No access data available</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Share2 className="w-5 h-5 text-gray-600" />
            <h4 className="text-lg font-semibold text-gray-900">Most Shared Files</h4>
          </div>
          <div className="space-y-2">
            {fileActivity.sharedFiles.slice(0, 5).map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-2">
                  {file.fileName}
                </span>
                <span className="text-sm text-gray-500">
                  {file.shareCount} shares
                </span>
              </div>
            ))}
            {fileActivity.sharedFiles.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No sharing data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Activity Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{analytics.timeline.length}</p>
            <p className="text-sm text-gray-600">Total Activities</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{fileActivity.mostAccessed.length}</p>
            <p className="text-sm text-gray-600">Files Accessed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{fileActivity.sharedFiles.length}</p>
            <p className="text-sm text-gray-600">Files Shared</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{getMostActiveDay()}</p>
            <p className="text-sm text-gray-600">Most Active Day</p>
          </div>
        </div>
      </div>
    </div>
  );
};
