import React from "react";
import {
  HardDrive,
  FileText,
  Wifi,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { formatFileSize } from "../../utils/fileUtils";
import { SpaceUsage } from "../../types";

// Mock data - replace with actual API calls
const mockUsage: SpaceUsage = {
  storageUsed: 2.4 * 1024 * 1024 * 1024, // 2.4 GB
  storageQuota: 10 * 1024 * 1024 * 1024, // 10 GB
  fileCount: 1247,
  fileQuota: 5000,
  bandwidthUsed: 15.6 * 1024 * 1024 * 1024, // 15.6 GB
  bandwidthQuota: 100 * 1024 * 1024 * 1024, // 100 GB
};

interface UsageCardProps {
  title: string;
  used: number;
  quota: number;
  icon: React.ComponentType<{ className?: string }>;
  formatter?: (value: number) => string;
  unit?: string;
}

const UsageCard: React.FC<UsageCardProps> = ({
  title,
  used,
  quota,
  icon: Icon,
  formatter = (v) => v.toString(),
  unit = "",
}) => {
  const percentage = (used / quota) * 100;
  const isWarning = percentage > 80;
  const isCritical = percentage > 95;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${
              isCritical
                ? "bg-red-100"
                : isWarning
                ? "bg-yellow-100"
                : "bg-blue-100"
            }`}
          >
            <Icon
              className={`w-5 h-5 ${
                isCritical
                  ? "text-red-600"
                  : isWarning
                  ? "text-yellow-600"
                  : "text-blue-600"
              }`}
            />
          </div>
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        {isWarning && (
          <AlertTriangle
            className={`w-5 h-5 ${
              isCritical ? "text-red-500" : "text-yellow-500"
            }`}
          />
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Used</span>
          <span className="font-medium">
            {formatter(used)}
            {unit}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isCritical
                ? "bg-red-500"
                : isWarning
                ? "bg-yellow-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{percentage.toFixed(1)}% used</span>
          <span className="text-gray-600">
            Limit: {formatter(quota)}
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
};

export const UsageStats: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UsageCard
          title="Storage"
          used={mockUsage.storageUsed}
          quota={mockUsage.storageQuota}
          icon={HardDrive}
          formatter={formatFileSize}
        />

        <UsageCard
          title="Files"
          used={mockUsage.fileCount}
          quota={mockUsage.fileQuota}
          icon={FileText}
          formatter={(v) => v.toLocaleString()}
        />

        <UsageCard
          title="Bandwidth (Monthly)"
          used={mockUsage.bandwidthUsed}
          quota={mockUsage.bandwidthQuota}
          icon={Wifi}
          formatter={formatFileSize}
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Usage Trends</h3>
        </div>

        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Usage graphs will be displayed here</p>
            <p className="text-sm">
              Connect to analytics service to view trends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
