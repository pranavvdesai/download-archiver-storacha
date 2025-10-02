import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, BarChart3, FileText, Lightbulb, HardDrive } from 'lucide-react';
import { StorageUsageChart } from './StorageUsageChart';
import { FileStatistics } from './FileStatistics';
import { StorageInsights } from './StorageInsights';
import { QuotaTracker } from './QuotaTracker';
import { useStorageAnalytics } from '../hooks/useStorageAnalytics';
import { StorachaFile } from '../types';

interface StorageAnalyticsProps {
  files: StorachaFile[];
}

export const StorageAnalytics: React.FC<StorageAnalyticsProps> = ({ files }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'statistics' | 'insights'>('overview');
  const [isExporting, setIsExporting] = useState(false);
  
  const {
    analytics,
    quota,
    fileTypeDistribution,
    isLoading,
    loadAnalytics,
    formatBytes,
    exportAnalytics,
    refreshAnalytics
  } = useStorageAnalytics();

  useEffect(() => {
    if (files.length > 0) {
      loadAnalytics(files);
    }
  }, [files, loadAnalytics]);

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      exportAnalytics(format);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = async () => {
    await refreshAnalytics();
    if (files.length > 0) {
      loadAnalytics(files);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading storage analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics || !quota) {
    return (
      <div className="text-center py-12">
        <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Storage Data</h3>
        <p className="text-gray-600">Upload some files to see storage analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Storage Analytics</h2>
          <p className="text-gray-600">Monitor your storage usage and optimize your files</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <div className="relative">
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
          </div>
        </div>
      </div>

      <QuotaTracker quota={quota} formatBytes={formatBytes} />

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'statistics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Statistics</span>
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'insights'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Insights</span>
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <StorageUsageChart
            analytics={analytics}
            fileTypeDistribution={fileTypeDistribution}
            formatBytes={formatBytes}
          />
        </div>
      )}

      {activeTab === 'statistics' && (
        <FileStatistics
          analytics={analytics}
          fileTypeDistribution={fileTypeDistribution}
          formatBytes={formatBytes}
        />
      )}

      {activeTab === 'insights' && (
        <StorageInsights
          analytics={analytics}
          formatBytes={formatBytes}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HardDrive className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Storage</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatBytes(analytics.storageUsage.total)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-lg font-semibold text-gray-900">
                {analytics.fileStats.totalFiles.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">File Types</p>
              <p className="text-lg font-semibold text-gray-900">
                {Object.keys(analytics.storageUsage.byFileType).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Lightbulb className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Recommendations</p>
              <p className="text-lg font-semibold text-gray-900">
                {analytics.insights.recommendations.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
