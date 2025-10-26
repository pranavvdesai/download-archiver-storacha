import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, HardDrive, Download, Activity, FileText, Image, Video, Music, Archive, File } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { analyticsService } from '../services/database';
import { StorageChart } from '../components/analytics/StorageChart';
import { DownloadTrendsChart } from '../components/analytics/DownloadTrendsChart';
import { PopularFilesTable } from '../components/analytics/PopularFilesTable';
import { ActivityTimeline } from '../components/analytics/ActivityTimeline';
import { FileTypeDistribution } from '../components/analytics/FileTypeDistribution';
import toast from 'react-hot-toast';

interface SpaceStats {
  totalFiles: number;
  totalSize: number;
  totalDownloads: number;
  filesByKind: Record<string, number>;
}

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SpaceStats | null>(null);
  const [timeRange, setTimeRange] = useState(30); 

  useEffect(() => {
    loadAnalytics();
  }, [user, timeRange]);

  const loadAnalytics = async () => {
    if (!user?.spaceDid) {
      toast.error('No space selected');
      return;
    }

    setIsLoading(true);
    try {
      const spaceStats = await analyticsService.getSpaceStats(user.spaceDid);
      setStats(spaceStats);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      toast.error(`Failed to load analytics: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileKindIcon = (kind: string) => {
    switch (kind) {
      case 'document':
        return <FileText className="w-5 h-5" />;
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      case 'archive':
        return <Archive className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Total Files</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalFiles}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <HardDrive className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Storage Used</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatBytes(stats.totalSize)}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Download className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Total Downloads</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDownloads}</p>
            </div>
          </div>
        ) : null}

        {stats && Object.keys(stats.filesByKind).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Files by Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats.filesByKind).map(([kind, count]) => (
                <div key={kind} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-600">{getFileKindIcon(kind)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 capitalize">{kind}</p>
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {user?.spaceDid && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Storage Over Time</h2>
              <StorageChart spaceId={user.spaceDid} days={timeRange} />
            </div>
          )}

          {stats && Object.keys(stats.filesByKind).length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">File Type Distribution</h2>
              <FileTypeDistribution data={stats.filesByKind} />
            </div>
          )}
        </div>

        {user?.spaceDid && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Trends</h2>
            <DownloadTrendsChart spaceId={user.spaceDid} days={timeRange} />
          </div>
        )}

        {user?.spaceDid && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Popular Files</h2>
            <PopularFilesTable spaceId={user.spaceDid} />
          </div>
        )}

        {user?.spaceDid && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <ActivityTimeline spaceId={user.spaceDid} />
          </div>
        )}
      </main>
    </div>
  );
};
