import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsService } from '../../services/database';

interface StorageChartProps {
  spaceId: string;
  days: number;
}

interface DataPoint {
  date: string;
  storage: number;
}

export const StorageChart: React.FC<StorageChartProps> = ({ spaceId, days }) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [spaceId, days]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const rawData = await analyticsService.getStorageOverTime(spaceId, days);
      
      const dateMap = new Map<string, number>();
      let cumulative = 0;

      rawData.forEach((item) => {
        const date = new Date(item.uploaded_at).toISOString().split('T')[0];
        cumulative += item.size_bytes;
        dateMap.set(date, cumulative);
      });

      const chartData = Array.from(dateMap.entries())
        .map(([date, storage]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          storage: storage / (1024 * 1024), 
        }))
        .slice(-days);

      setData(chartData);
    } catch (error) {
      console.error('Failed to load storage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1024).toFixed(1)} GB`;
    }
    return `${value.toFixed(0)} MB`;
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
        No storage data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
        <YAxis tickFormatter={formatYAxis} stroke="#9ca3af" style={{ fontSize: '12px' }} />
        <Tooltip
          formatter={(value: number) => [`${formatYAxis(value)}`, 'Storage']}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
        />
        <Line type="monotone" dataKey="storage" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};
