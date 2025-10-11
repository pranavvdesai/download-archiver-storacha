import React, { useState } from "react";
import {
  Download,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import { SpaceBackup } from "../../types";
import { formatFileSize, formatDate } from "../../utils/fileUtils";

// Mock data - replace with actual API calls
const mockBackups: SpaceBackup[] = [
  {
    id: "1",
    name: "Weekly Backup - Feb 18",
    createdAt: new Date("2024-02-18T10:00:00"),
    size: 2.4 * 1024 * 1024 * 1024,
    fileCount: 1247,
    type: "auto",
    status: "ready",
  },
  {
    id: "2",
    name: "Manual Backup - Feb 15",
    createdAt: new Date("2024-02-15T14:30:00"),
    size: 2.2 * 1024 * 1024 * 1024,
    fileCount: 1198,
    type: "manual",
    status: "ready",
  },
  {
    id: "3",
    name: "Weekly Backup - Feb 11",
    createdAt: new Date("2024-02-11T10:00:00"),
    size: 2.1 * 1024 * 1024 * 1024,
    fileCount: 1156,
    type: "auto",
    status: "ready",
  },
];

const statusIcons = {
  creating: Loader,
  ready: CheckCircle,
  failed: XCircle,
};

const statusColors = {
  creating: "text-blue-600",
  ready: "text-green-600",
  failed: "text-red-600",
};

interface CreateBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

const CreateBackupModal: React.FC<CreateBackupModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Create Manual Backup
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Backup Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Before major update"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Create Backup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BackupManagement: React.FC = () => {
  const [backups] = useState<SpaceBackup[]>(mockBackups);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  const handleCreateBackup = (name: string) => {
    console.log("Creating backup:", name);
    // Implement backup creation logic
  };

  const handleDownloadBackup = (backupId: string) => {
    console.log("Downloading backup:", backupId);
    // Implement backup download logic
  };

  const handleRestoreBackup = (backupId: string) => {
    console.log("Restoring backup:", backupId);
    // Implement backup restore logic
  };

  const handleDeleteBackup = (backupId: string) => {
    console.log("Deleting backup:", backupId);
    // Implement backup deletion logic
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Backup & Restore
          </h2>
          <p className="text-gray-600">
            Manage your workspace backups and restore points
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus className="w-4 h-4" />
          <span>Create Backup</span>
        </button>
      </div>

      {/* Auto Backup Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Automatic Backups
        </h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">
                Enable automatic backups
              </div>
              <div className="text-sm text-gray-600">
                Create weekly backups of your workspace
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoBackupEnabled}
              onChange={(e) => setAutoBackupEnabled(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
          </label>

          {autoBackupEnabled && (
            <div className="pl-4 border-l-2 border-gray-200">
              <div className="text-sm text-gray-600">
                <p>• Backups are created every Sunday at 10:00 AM</p>
                <p>• Last 4 automatic backups are kept</p>
                <p>• Older backups are automatically deleted</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Backup History</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {backups.map((backup) => {
            const StatusIcon = statusIcons[backup.status];
            return (
              <div key={backup.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <StatusIcon
                        className={`w-5 h-5 ${statusColors[backup.status]} ${
                          backup.status === "creating" ? "animate-spin" : ""
                        }`}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {backup.name}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(backup.createdAt)}</span>
                          </span>
                          <span>{formatFileSize(backup.size)}</span>
                          <span>{backup.fileCount.toLocaleString()} files</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              backup.type === "auto"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {backup.type === "auto" ? "Automatic" : "Manual"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {backup.status === "ready" && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownloadBackup(backup.id)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => handleRestoreBackup(backup.id)}
                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CreateBackupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateBackup}
      />
    </div>
  );
};
