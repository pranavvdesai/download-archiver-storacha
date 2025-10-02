import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, HardDrive, BarChart3 } from 'lucide-react';
import { StorageAnalytics, FileTypeDistribution } from '../types';

interface StorageUsageChartProps {
  analytics: StorageAnalytics;
  fileTypeDistribution: FileTypeDistribution[];
  formatBytes: (bytes: number) => string;
}

export const StorageUsageChart: React.FC<StorageUsageChartProps> = ({
  analytics,
  fileTypeDistribution,
  formatBytes
}) => {
  const [activeChart, setActiveChart] = useState<'pie' | 'bar' | 'trend'>('pie');

  const pieData = fileTypeDistribution.map(item => ({
    name: item.type,
    value: item.size,
    count: item.count,
    percentage: item.percentage,
    color: item.color
  }));

  const barData = fileTypeDistribution.map(item => ({
    type: item.type,
    size: item.size,
    count: item.count,
    percentage: item.percentage
  }));

  const trendData = analytics.trends.storageGrowth.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    used: item.used,
    formatted: formatBytes(item.used)
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            Size: {formatBytes(data.value || data.size)}
          </p>
          {data.count && (
            <p className="text-sm text-gray-600">
              Files: {data.count}
            </p>
          )}
          {data.percentage && (
            <p className="text-sm text-gray-600">
              Percentage: {data.percentage.toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Storage Usage</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveChart('pie')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeChart === 'pie'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pie
          </button>
          <button
            onClick={() => setActiveChart('bar')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeChart === 'bar'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bar
          </button>
          <button
            onClick={() => setActiveChart('trend')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeChart === 'trend'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Trend
          </button>
        </div>
      </div>

      <div className="h-80">
        {activeChart === 'pie' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis tickFormatter={(value) => formatBytes(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="size" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'trend' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatBytes(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="used" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Storage Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Total Storage</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatBytes(analytics.storageUsage.total)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Used Storage</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatBytes(analytics.storageUsage.used)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Available</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatBytes(analytics.storageUsage.available)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Storage Usage</span>
          <span className="text-sm font-medium text-gray-700">
            {analytics.storageUsage.percentageUsed.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              analytics.storageUsage.percentageUsed > 90
                ? 'bg-red-500'
                : analytics.storageUsage.percentageUsed > 75
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(analytics.storageUsage.percentageUsed, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
