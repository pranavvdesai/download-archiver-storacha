import React, { useState, useEffect } from "react";
import { Tag, X, Check, FolderOpen, RefreshCw, Archive } from "lucide-react";
import { Folder } from "../types";
import { extensionService } from "../services/extensionService";
import toast from "react-hot-toast";

interface BulkOperationsToolbarProps {
  selectedFiles: string[];
  onAddTags: (fileIds: string[], tag: string) => void;
  onRemoveTags: (fileIds: string[], tag: string) => void;
  onClearSelection: () => void;
  onBulkOperationComplete?: () => void;
}

export const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  selectedFiles,
  onAddTags,
  onRemoveTags,
  onClearSelection,
  onBulkOperationComplete,
}) => {
  const [newTag, setNewTag] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isMovingFiles, setIsMovingFiles] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const folderList = await extensionService.getFolders();
      setFolders(folderList);
    } catch (error) {
      console.error("Failed to load folders:", error);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    try {
      setIsLoading(true);
      await extensionService.bulkTagFiles(
        selectedFiles,
        [newTag.trim()],
        "add"
      );
      onAddTags(selectedFiles, newTag.trim());
      setNewTag("");
      setIsAddingTag(false);
      onBulkOperationComplete?.();
      toast.success(
        `Added tag "${newTag.trim()}" to ${selectedFiles.length} files`
      );
    } catch (error) {
      console.error("Failed to add tags:", error);
      toast.error("Failed to add tags");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveToFolder = async (folderId: string) => {
    try {
      setIsLoading(true);
      const result = await extensionService.bulkMoveFiles(
        selectedFiles,
        folderId
      );

      if (result.failed.length > 0) {
        toast.error(`Failed to move ${result.failed.length} files`);
      } else {
        const folder = folders.find((f) => f.id === folderId);
        toast.success(
          `Moved ${result.success.length} files to ${folder?.name || "folder"}`
        );
      }

      setIsMovingFiles(false);
      onBulkOperationComplete?.();
    } catch (error) {
      console.error("Failed to move files:", error);
      toast.error("Failed to move files");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecategorize = async () => {
    try {
      setIsLoading(true);
      const result = await extensionService.bulkRecategorizeFiles(
        selectedFiles
      );

      if (result.failed.length > 0) {
        toast.error(`Failed to recategorize ${result.failed.length} files`);
      } else {
        toast.success(`Recategorized ${result.success.length} files`);
      }

      onBulkOperationComplete?.();
    } catch (error) {
      console.error("Failed to recategorize files:", error);
      toast.error("Failed to recategorize files");
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedFiles.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-900">
          {selectedFiles.length} {selectedFiles.length === 1 ? "file" : "files"}{" "}
          selected
        </span>
        <button
          onClick={onClearSelection}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear selection
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Add Tag */}
        {isAddingTag ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag name"
              className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              autoFocus
            />
            <button
              onClick={handleAddTag}
              disabled={isLoading}
              className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
              title="Add tag"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAddingTag(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTag(true)}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
          >
            <Tag className="w-4 h-4" />
            <span>Add Tag</span>
          </button>
        )}

        {/* Move to Folder */}
        <div className="relative">
          <button
            onClick={() => setIsMovingFiles(!isMovingFiles)}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Move to Folder</span>
          </button>

          {isMovingFiles && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleMoveToFolder(folder.id)}
                  disabled={isLoading}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: folder.color }}
                  />
                  <span className="flex-1 truncate">{folder.name}</span>
                  <span className="text-xs text-gray-500">
                    {folder.fileCount}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recategorize */}
        <button
          onClick={handleRecategorize}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Recategorize</span>
        </button>

        {/* Archive (placeholder for future feature) */}
        <button
          disabled={true}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-400 rounded transition-colors opacity-50 cursor-not-allowed"
          title="Coming soon"
        >
          <Archive className="w-4 h-4" />
          <span>Archive</span>
        </button>
      </div>

      {/* Click outside to close folder dropdown */}
      {isMovingFiles && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsMovingFiles(false)}
        />
      )}
    </div>
  );
};
