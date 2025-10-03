import React, { useState, useMemo, useEffect } from "react";
import { Menu, Folder } from "lucide-react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { FileGrid } from "./FileGrid";
import { BulkOperationsToolbar } from "./BulkOperationsToolbar";
import { FolderManager } from "./FolderManager";
import { FilterState, ViewMode, StorachaFile } from "../types";
import { getClient, useAuth } from "../hooks/useAuth";
import { decodeCidToString } from "../utils/decodeCidToString";
import { extensionService } from "../services/extensionService";
import toast from "react-hot-toast";

export const Dashboard: React.FC = () => {
  const { user, isSessionFresh, needsReauth } = useAuth();
  const [files, setFiles] = useState<StorachaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    fileType: "all",
    dateRange: "all",
    tags: [],
    sortBy: "date",
    sortOrder: "desc",
  });

  // Map upload API response to StorachaFile[]
  function mapUploadsToFiles(uploadResponse: any[]): any[] {
    return uploadResponse.map((upload, index) => ({
      id: upload.root["/"], // use root CID as ID
      cid: upload.root["/"],
      name: `File ${index + 1}`, // fabricate name as no name in response
      size: 0, // no size info in response, default to 0 or fetch if available
      created: new Date(upload.insertedAt).getTime(),
      updated: new Date(upload.updatedAt).getTime(),
      shards: upload.shards.map((shard: unknown) => shard["/"]),
    }));
  }

  // Call client upload list once on mount
  // Enhanced file loading with folder filtering
  async function listFiles() {
    // Don't try to load files if user is not authenticated or session is stale
    if (!user || !isSessionFresh || needsReauth) {
      console.log(
        "Skipping file load - user not authenticated or session stale"
      );
      return;
    }

    setIsLoading(true);
    try {
      if (selectedFolderId) {
        // Load files from specific folder using extension service
        const folderFiles = await extensionService.getFilesByFolder(
          selectedFolderId
        );
        const enhancedFiles = folderFiles.map((metadata) => ({
          id: metadata.cid,
          name: metadata.fileName,
          cid: metadata.cid,
          size: metadata.fileSizeMB * 1024 * 1024, // Convert MB to bytes
          type: metadata.category,
          mimeType: metadata.mimeType,
          created: new Date(metadata.uploadedAt),
          updated: new Date(metadata.uploadedAt),
          tags: metadata.autoTags || [],
          isPublic: true, // Default for now
          downloadCount: 0, // Default for now
          category: metadata.category,
          extension: metadata.extension,
          autoTags: metadata.autoTags,
          folderId: metadata.folderId,
          filePath: metadata.filePath,
          uploadedAt: metadata.uploadedAt,
        }));
        setFiles(enhancedFiles);
      } else {
        // Load all files from Storacha
        try {
          const client = await getClient();

          // Check if client has a current space
          const currentSpace = client.currentSpace();
          if (!currentSpace) {
            console.log(
              "No current space set, trying to set space from user data"
            );
            if (user.spaceDid) {
              await client.setCurrentSpace(user.spaceDid);
            } else {
              throw new Error("No space available. Please re-authenticate.");
            }
          }

          const response = await client.capability.upload.list({
            cursor: "",
            size: 25,
          });
          const mappedFiles = mapUploadsToFiles(response.results);

          // Try to enhance with metadata from extension
          const enhancedFiles = await Promise.all(
            mappedFiles.map(async (file) => {
              try {
                const metadata = await extensionService.getFileMetadata(
                  file.id
                );
                return {
                  ...file,
                  category: metadata.category,
                  extension: metadata.extension,
                  autoTags: metadata.autoTags,
                  folderId: metadata.folderId,
                  tags: metadata.autoTags || file.tags || [],
                };
              } catch (error) {
                // If no metadata found, return original file
                return file;
              }
            })
          );

          setFiles(enhancedFiles);
        } catch (storageError: any) {
          if (storageError.message.includes("missing current space")) {
            toast.error("Please re-authenticate to access your files");
            console.error("Space not set:", storageError);
          } else {
            throw storageError;
          }
        }
      }
    } catch (error) {
      console.error("Failed to list files: ", error);
      toast.error(
        "Failed to load files. Please try refreshing or re-authenticating."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Only load files if user is authenticated and session is fresh
    if (user && isSessionFresh && !needsReauth) {
      listFiles();
    }
  }, [selectedFolderId, user, isSessionFresh, needsReauth]);

  const handleBulkOperationComplete = () => {
    listFiles(); // Reload files after bulk operations
    setSelectedFiles([]); // Clear selection
  };

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const cidStr = decodeCidToString(file.cid).toLowerCase();
        if (
          !file.name.toLowerCase().includes(searchLower) &&
          !cidStr.includes(searchLower)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [files, filters]);

  const handleSearchChange = (search: string) => {
    console.log("Search changed: ", search);
    setFilters({ ...filters, search: search.trim() });
  };

  const handleSelectionChange = (fileId: string, selected: boolean) => {
    setSelectedFiles((prev) =>
      selected ? [...prev, fileId] : prev.filter((id) => id !== fileId)
    );
  };

  const handleClearSelection = () => {
    setSelectedFiles([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        searchQuery={filters.search}
        onSearchChange={handleSearchChange}
      />

      <div className="flex">
        <div className="hidden lg:flex lg:flex-col lg:w-80 lg:space-y-4 lg:p-6">
          <FolderManager
            selectedFolderId={selectedFolderId}
            onFolderSelect={setSelectedFolderId}
            onFolderChange={listFiles}
          />
          <Sidebar
            files={files}
            filters={filters}
            onFiltersChange={setFilters}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Mobile Sidebar */}
        <Sidebar
          files={files}
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 lg:ml-0">
          <div className="p-6">
            <div className="lg:hidden mb-4 flex items-center space-x-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Menu className="w-5 h-5" />
                <span>Filters</span>
              </button>
              <button
                onClick={() => setShowFolderManager(!showFolderManager)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Folder className="w-5 h-5" />
                <span>Folders</span>
              </button>
            </div>

            {/* Folder Manager */}
            {showFolderManager && (
              <div className="mb-6">
                <FolderManager
                  selectedFolderId={selectedFolderId}
                  onFolderSelect={setSelectedFolderId}
                  onFolderChange={listFiles}
                />
              </div>
            )}

            <BulkOperationsToolbar
              selectedFiles={selectedFiles}
              onAddTags={() => {}}
              onRemoveTags={() => {}}
              onClearSelection={handleClearSelection}
              onBulkOperationComplete={handleBulkOperationComplete}
            />

            {!user || !isSessionFresh || needsReauth ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <div className="text-gray-500 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Authentication Required
                  </h3>
                  <p className="text-gray-600">
                    Please sign in to view your files and use the enhanced
                    categorization features.
                  </p>
                </div>
              </div>
            ) : (
              <FileGrid
                files={filteredFiles}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onAddTag={() => {}}
                onRemoveTag={() => {}}
                isLoading={isLoading}
                selectedFiles={selectedFiles}
                onSelectionChange={handleSelectionChange}
                showSelection={true}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
