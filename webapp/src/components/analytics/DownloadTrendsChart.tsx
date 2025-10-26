import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsService } from '../../services/database';

interface DownloadTrendsChartProps {
  spaceId: string;
  days: number;
}

interface TrendData {
  date: string;
  downloads: number;
  views: number;
  shares: number;
}

export const DownloadTrendsChart: React.FC<DownloadTrendsChartProps> = ({ spaceId, days }) => {
  const [data, setData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [spaceId, days]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const rawData = await analyticsService.getDownloadTrends(spaceId, days);
      
      const dateMap = new Map<string, { downloads: number; views: number; shares: number }>();

      rawData.forEach((item) => {
        const existing = dateMap.get(item.metric_date) || { downloads: 0, views: 0, shares: 0 };
        dateMap.set(item.metric_date, {
          downloads: existing.downloads + (item.downloads || 0),
          views: existing.views + (item.views || 0),
          shares: existing.shares + (item.shares || 0),
        });
      });

      const chartData = Array.from(dateMap.entries())
        .map(([date, metrics]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          ...metrics,
        }))
        .slice(-days);

      setData(chartData);
    } catch (error) {
      console.error('Failed to load download trends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No download data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
        <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
        />
        <Legend />
        <Bar dataKey="downloads" fill="#dc2626" name="Downloads" />
        <Bar dataKey="views" fill="#3b82f6" name="Views" />
        <Bar dataKey="shares" fill="#10b981" name="Shares" />
      </BarChart>
    </ResponsiveContainer>
  );
};
