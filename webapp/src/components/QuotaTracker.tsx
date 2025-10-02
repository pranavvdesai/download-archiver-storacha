import React from 'react';
import { AlertTriangle, CheckCircle, HardDrive, TrendingUp, AlertCircle } from 'lucide-react';
import { StorageQuota } from '../types';

interface QuotaTrackerProps {
  quota: StorageQuota;
  formatBytes: (bytes: number) => string;
}

export const QuotaTracker: React.FC<QuotaTrackerProps> = ({
  quota,
  formatBytes
}) => {
  const getQuotaStatus = () => {
    if (quota.percentageUsed >= quota.criticalThreshold) {
      return {
        status: 'critical',
        color: 'red',
        icon: AlertTriangle,
        message: 'Storage quota critically high',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-900'
      };
    } else if (quota.percentageUsed >= quota.warningThreshold) {
      return {
        status: 'warning',
        color: 'yellow',
        icon: AlertCircle,
        message: 'Storage quota approaching limit',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-900'
      };
    } else {
      return {
        status: 'healthy',
        color: 'green',
        icon: CheckCircle,
        message: 'Storage quota healthy',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-900'
      };
    }
  };

  const quotaStatus = getQuotaStatus();
  const StatusIcon = quotaStatus.icon;

  const getProgressBarColor = () => {
    if (quota.percentageUsed >= quota.criticalThreshold) {
      return 'bg-red-500';
    } else if (quota.percentageUsed >= quota.warningThreshold) {
      return 'bg-yellow-500';
    } else {
      return 'bg-green-500';
    }
  };

  const getRemainingDays = () => {
    const dailyGrowth = quota.used * 0.01; 
    const remainingSpace = quota.available;
    return Math.floor(remainingSpace / dailyGrowth);
  };

  return (
    <div className={`rounded-lg border-2 ${quotaStatus.borderColor} ${quotaStatus.bgColor} p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${quotaStatus.bgColor}`}>
            <StatusIcon className={`w-6 h-6 ${quotaStatus.textColor}`} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${quotaStatus.textColor}`}>
              Storage Quota
            </h3>
            <p className={`text-sm ${quotaStatus.textColor} opacity-80`}>
              {quotaStatus.message}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${quotaStatus.textColor}`}>
            {quota.percentageUsed.toFixed(1)}%
          </div>
          <div className={`text-sm ${quotaStatus.textColor} opacity-80`}>
            Used
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${quotaStatus.textColor}`}>
            Storage Usage
          </span>
          <span className={`text-sm font-medium ${quotaStatus.textColor}`}>
            {formatBytes(quota.used)} / {formatBytes(quota.total)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(quota.percentageUsed, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-white rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {formatBytes(quota.used)}
          </div>
          <div className="text-sm text-gray-600">Used</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {formatBytes(quota.available)}
          </div>
          <div className="text-sm text-gray-600">Available</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {formatBytes(quota.total)}
          </div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Warning Threshold</span>
          <span className="font-medium text-yellow-600">
            {quota.warningThreshold}%
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Critical Threshold</span>
          <span className="font-medium text-red-600">
            {quota.criticalThreshold}%
          </span>
        </div>
      </div>

      {quota.percentageUsed > 50 && (
        <div className="mt-4 p-3 bg-white rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Projected Timeline</span>
          </div>
          <p className="text-sm text-gray-600">
            Based on current usage patterns, you may reach capacity in approximately{' '}
            <span className="font-semibold text-blue-600">
              {getRemainingDays()} days
            </span>
            .
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {quota.percentageUsed >= quota.warningThreshold && (
          <>
            <button className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors">
              Clean Up Files
            </button>
            <button className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md text-sm font-medium hover:bg-yellow-200 transition-colors">
              Archive Old Files
            </button>
          </>
        )}
        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors">
          Upgrade Plan
        </button>
        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors">
          View Details
        </button>
      </div>

      {quota.percentageUsed >= quota.criticalThreshold && (
        <div className="mt-4 p-3 bg-red-100 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Immediate Action Required
              </p>
              <p className="text-sm text-red-700 mt-1">
                Your storage is critically full. Consider deleting unnecessary files or upgrading your plan immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {quota.percentageUsed >= quota.warningThreshold && quota.percentageUsed < quota.criticalThreshold && (
        <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Storage Warning
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                You're approaching your storage limit. Consider cleaning up old files or archiving unused content.
              </p>
            </div>
          </div>
        </div>
      )}

      {quota.percentageUsed < quota.warningThreshold && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Storage Healthy
              </p>
              <p className="text-sm text-green-700 mt-1">
                Your storage usage is within normal limits. Continue managing your files efficiently.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
