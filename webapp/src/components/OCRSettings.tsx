import React from "react";
import { Settings, FileText, Clock, HardDrive } from "lucide-react";
import { UserSettings } from "../types";

interface OCRSettingsProps {
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

export const OCRSettings: React.FC<OCRSettingsProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb}MB`;
  };

  const formatTimeout = (ms: number): string => {
    return `${ms / 1000}s`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">OCR Settings</h3>
      </div>

      <div className="space-y-4">
        {/* Enable/Disable OCR */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable OCR Processing
              </label>
              <p className="text-xs text-gray-500">
                Extract text from PDFs and images for searchability
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.ocrEnabled}
              onChange={(e) =>
                onUpdateSettings({ ocrEnabled: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        {/* Max file size */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-gray-500" />
            <div>
              <label className="text-sm font-medium text-gray-700">
                Max File Size for OCR
              </label>
              <p className="text-xs text-gray-500">
                Files larger than this won't be processed
              </p>
            </div>
          </div>
          <select
            value={settings.maxFileSizeForOcr}
            onChange={(e) =>
              onUpdateSettings({ maxFileSizeForOcr: parseInt(e.target.value) })
            }
            className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={!settings.ocrEnabled}
          >
            <option value={10 * 1024 * 1024}>10MB</option>
            <option value={25 * 1024 * 1024}>25MB</option>
            <option value={50 * 1024 * 1024}>50MB</option>
            <option value={100 * 1024 * 1024}>100MB</option>
          </select>
        </div>

        {/* Timeout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <label className="text-sm font-medium text-gray-700">
                Processing Timeout
              </label>
              <p className="text-xs text-gray-500">
                Maximum time to wait for OCR processing
              </p>
            </div>
          </div>
          <select
            value={settings.ocrTimeout}
            onChange={(e) =>
              onUpdateSettings({ ocrTimeout: parseInt(e.target.value) })
            }
            className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={!settings.ocrEnabled}
          >
            <option value={15000}>15s</option>
            <option value={30000}>30s</option>
            <option value={60000}>60s</option>
            <option value={120000}>120s</option>
          </select>
        </div>

        {/* Current settings display */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Current Settings
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>OCR: {settings.ocrEnabled ? "Enabled" : "Disabled"}</div>
            <div>Max Size: {formatFileSize(settings.maxFileSizeForOcr)}</div>
            <div>Timeout: {formatTimeout(settings.ocrTimeout)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
