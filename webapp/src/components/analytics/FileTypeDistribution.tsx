import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface FileTypeDistributionProps {
  data: Record<string, number>;
}

const COLORS = {
  document: '#3b82f6',
  image: '#10b981',
  video: '#8b5cf6',
  audio: '#f59e0b',
  archive: '#ef4444',
  other: '#6b7280',
};

export const FileTypeDistribution: React.FC<FileTypeDistributionProps> = ({ data }) => {
  const chartData = Object.entries(data).map(([kind, count]) => ({
    name: kind.charAt(0).toUpperCase() + kind.slice(1),
    value: count,
    color: COLORS[kind as keyof typeof COLORS] || COLORS.other,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No file type data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
