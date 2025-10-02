import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Lightbulb, 
  Trash2, 
  FileX, 
  Clock, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Archive
} from 'lucide-react';
import { StorageAnalytics } from '../types';

interface StorageInsightsProps {
  analytics: StorageAnalytics;
  formatBytes: (bytes: number) => string;
}

export const StorageInsights: React.FC<StorageInsightsProps> = ({
  analytics,
  formatBytes
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    duplicates: true,
    largeFiles: true,
    oldFiles: true,
    recommendations: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Storage Health</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {analytics.insights.duplicateFiles.length}
            </div>
            <div className="text-sm text-red-600 font-medium">Duplicate Files</div>
            <div className="text-xs text-gray-500 mt-1">
              {formatBytes(analytics.insights.duplicateFiles.reduce((sum, group) => sum + group.totalSize, 0))} wasted
            </div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {analytics.insights.largeFiles.length}
            </div>
            <div className="text-sm text-yellow-600 font-medium">Large Files</div>
            <div className="text-xs text-gray-500 mt-1">
              {formatBytes(analytics.insights.largeFiles.reduce((sum, file) => sum + file.size, 0))} total
            </div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {analytics.insights.oldFiles.length}
            </div>
            <div className="text-sm text-blue-600 font-medium">Old Files</div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.insights.oldFiles.length > 0 ? `${analytics.insights.oldFiles[0].age}+ days old` : 'None'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('duplicates')}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FileX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Duplicate Files</h3>
              <p className="text-sm text-gray-600">
                {analytics.insights.duplicateFiles.length} duplicate groups found
              </p>
            </div>
          </div>
          {expandedSections.duplicates ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.duplicates && (
          <div className="px-6 pb-6">
            <div className="space-y-3">
              {analytics.insights.duplicateFiles.map((group, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded ${getPriorityColor('high')}`}>
                      {getPriorityIcon('high')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {group.files.length} duplicate files
                      </p>
                      <p className="text-sm text-gray-600">
                        {group.files.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">
                      {formatBytes(group.totalSize)}
                    </p>
                    <button className="text-xs text-red-600 hover:text-red-700 font-medium">
                      Remove duplicates
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('largeFiles')}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Archive className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Large Files</h3>
              <p className="text-sm text-gray-600">
                {analytics.insights.largeFiles.length} files over 10MB
              </p>
            </div>
          </div>
          {expandedSections.largeFiles ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.largeFiles && (
          <div className="px-6 pb-6">
            <div className="space-y-3">
              {analytics.insights.largeFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded ${getPriorityColor('medium')}`}>
                      {getPriorityIcon('medium')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">Large file</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-yellow-600">
                      {formatBytes(file.size)}
                    </p>
                    <button className="text-xs text-yellow-600 hover:text-yellow-700 font-medium">
                      Compress
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('oldFiles')}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Old Files</h3>
              <p className="text-sm text-gray-600">
                {analytics.insights.oldFiles.length} files older than 90 days
              </p>
            </div>
          </div>
          {expandedSections.oldFiles ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.oldFiles && (
          <div className="px-6 pb-6">
            <div className="space-y-3">
              {analytics.insights.oldFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded ${getPriorityColor('low')}`}>
                      {getPriorityIcon('low')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {file.age} days old
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('recommendations')}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Lightbulb className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
              <p className="text-sm text-gray-600">
                {analytics.insights.recommendations.length} optimization tips
              </p>
            </div>
          </div>
          {expandedSections.recommendations ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.recommendations && (
          <div className="px-6 pb-6">
            <div className="space-y-3">
              {analytics.insights.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="p-1 rounded-full bg-green-100 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{recommendation}</p>
                  </div>
                  <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
            <Trash2 className="w-5 h-5 text-red-600" />
            <div className="text-left">
              <p className="font-medium text-red-900">Clean Up Duplicates</p>
              <p className="text-sm text-red-600">Remove duplicate files automatically</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <Archive className="w-5 h-5 text-yellow-600" />
            <div className="text-left">
              <p className="font-medium text-yellow-900">Archive Old Files</p>
              <p className="text-sm text-yellow-600">Move old files to archive</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Download className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-blue-900">Export Report</p>
              <p className="text-sm text-blue-600">Download storage analytics report</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-green-900">Optimize Storage</p>
              <p className="text-sm text-green-600">Apply all recommendations</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
