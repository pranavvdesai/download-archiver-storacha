import React, { useState, useEffect } from "react";
import {
  Folder,
  Plus,
  Edit3,
  Trash2,
  FolderOpen,
  Files,
  HardDrive,
} from "lucide-react";
import { Folder as FolderType } from "../types";
import { extensionService } from "../services/extensionService";
import { formatFileSize } from "../utils/fileUtils";
import toast from "react-hot-toast";

interface FolderManagerProps {
  selectedFolderId?: string;
  onFolderSelect: (folderId: string | null) => void;
  onFolderChange?: () => void;
}

export const FolderManager: React.FC<FolderManagerProps> = ({
  selectedFolderId,
  onFolderSelect,
  onFolderChange,
}) => {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [newFolder, setNewFolder] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });

  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EF4444",
    "#06B6D4",
    "#84CC16",
    "#6B7280",
    "#EC4899",
    "#F97316",
    "#8B5A2B",
    "#059669",
  ];

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const folderList = await extensionService.getFolders();
      setFolders(folderList);
    } catch (error) {
      console.error("Failed to load folders:", error);
      toast.error("Failed to load folders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolder.name.trim()) {
      toast.error("Folder name is required");
      return;
    }

    try {
      const folder = await extensionService.createFolder(
        newFolder.name.trim(),
        newFolder.description.trim(),
        newFolder.color
      );
      setFolders((prev) => [...prev, folder]);
      setNewFolder({ name: "", description: "", color: "#3B82F6" });
      setIsCreating(false);
      onFolderChange?.();
      toast.success("Folder created successfully");
    } catch (error) {
      console.error("Failed to create folder:", error);
      toast.error("Failed to create folder");
    }
  };

  const handleUpdateFolder = async (
    folderId: string,
    updates: Partial<FolderType>
  ) => {
    try {
      const updatedFolder = await extensionService.updateFolder(
        folderId,
        updates
      );
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? updatedFolder : f))
      );
      setEditingFolder(null);
      onFolderChange?.();
      toast.success("Folder updated successfully");
    } catch (error) {
      console.error("Failed to update folder:", error);
      toast.error("Failed to update folder");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this folder? Files will be moved to Miscellaneous."
      )
    ) {
      return;
    }

    try {
      await extensionService.deleteFolder(folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      if (selectedFolderId === folderId) {
        onFolderSelect(null);
      }
      onFolderChange?.();
      toast.success("Folder deleted successfully");
    } catch (error) {
      console.error("Failed to delete folder:", error);
      toast.error("Failed to delete folder");
    }
  };

  const totalFiles = folders.reduce((sum, folder) => sum + folder.fileCount, 0);
  const totalSize = folders.reduce((sum, folder) => sum + folder.totalSize, 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Folder className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Folder</span>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {folders.length}
            </div>
            <div className="text-gray-500">Folders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalFiles}</div>
            <div className="text-gray-500">Files</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatFileSize(totalSize * 1024 * 1024)}
            </div>
            <div className="text-gray-500">Total Size</div>
          </div>
        </div>
      </div>

      {/* All Files Option */}
      <div className="p-4 border-b border-gray-100">
        <button
          onClick={() => onFolderSelect(null)}
          className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 ${
            !selectedFolderId
              ? "bg-red-50 text-red-700 border border-red-200"
              : "hover:bg-gray-50 text-gray-700"
          }`}
        >
          <div className="flex items-center space-x-3">
            <Files className="w-5 h-5" />
            <div>
              <div className="font-medium">All Files</div>
              <div className="text-xs text-gray-500">
                View all uploaded files
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{totalFiles}</div>
            <div className="text-xs text-gray-500">
              {formatFileSize(totalSize * 1024 * 1024)}
            </div>
          </div>
        </button>
      </div>

      {/* Folder List */}
      <div className="max-h-96 overflow-y-auto">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="p-4 border-b border-gray-100 last:border-b-0"
          >
            {editingFolder === folder.id ? (
              <EditFolderForm
                folder={folder}
                colors={colors}
                onSave={(updates) => handleUpdateFolder(folder.id, updates)}
                onCancel={() => setEditingFolder(null)}
              />
            ) : (
              <div className="flex items-center justify-between group">
                <button
                  onClick={() => onFolderSelect(folder.id)}
                  className={`flex-1 flex items-center space-x-3 p-2 rounded-lg text-left transition-all duration-200 ${
                    selectedFolderId === folder.id
                      ? "bg-red-50 text-red-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: folder.color }}
                  />
                  <FolderOpen className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{folder.name}</div>
                    {folder.description && (
                      <div className="text-xs text-gray-500 truncate">
                        {folder.description}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-medium">
                      {folder.fileCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(folder.totalSize * 1024 * 1024)}
                    </div>
                  </div>
                </button>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button
                    onClick={() => setEditingFolder(folder.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Edit folder"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete folder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Folder Form */}
      {isCreating && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <CreateFolderForm
            folder={newFolder}
            colors={colors}
            onChange={setNewFolder}
            onSave={handleCreateFolder}
            onCancel={() => {
              setIsCreating(false);
              setNewFolder({ name: "", description: "", color: "#3B82F6" });
            }}
          />
        </div>
      )}
    </div>
  );
};

// Create Folder Form Component
interface CreateFolderFormProps {
  folder: { name: string; description: string; color: string };
  colors: string[];
  onChange: (folder: {
    name: string;
    description: string;
    color: string;
  }) => void;
  onSave: () => void;
  onCancel: () => void;
}

const CreateFolderForm: React.FC<CreateFolderFormProps> = ({
  folder,
  colors,
  onChange,
  onSave,
  onCancel,
}) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Name
      </label>
      <input
        type="text"
        value={folder.name}
        onChange={(e) => onChange({ ...folder, name: e.target.value })}
        placeholder="Folder name"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        autoFocus
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Description
      </label>
      <input
        type="text"
        value={folder.description}
        onChange={(e) => onChange({ ...folder, description: e.target.value })}
        placeholder="Optional description"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Color
      </label>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onChange({ ...folder, color })}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              folder.color === color
                ? "border-gray-400 scale-110"
                : "border-gray-200"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
    <div className="flex justify-end space-x-2 pt-2">
      <button
        onClick={onCancel}
        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Create
      </button>
    </div>
  </div>
);

// Edit Folder Form Component
interface EditFolderFormProps {
  folder: FolderType;
  colors: string[];
  onSave: (updates: Partial<FolderType>) => void;
  onCancel: () => void;
}

const EditFolderForm: React.FC<EditFolderFormProps> = ({
  folder,
  colors,
  onSave,
  onCancel,
}) => {
  const [updates, setUpdates] = useState({
    name: folder.name,
    description: folder.description,
    color: folder.color,
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          value={updates.name}
          onChange={(e) => setUpdates({ ...updates, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          value={updates.description}
          onChange={(e) =>
            setUpdates({ ...updates, description: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setUpdates({ ...updates, color })}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                updates.color === color
                  ? "border-gray-400 scale-110"
                  : "border-gray-200"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(updates)}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
};
