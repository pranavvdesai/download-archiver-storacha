import React, { useState, useMemo } from "react";
import { Menu, Settings } from "lucide-react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { FileGrid } from "./FileGrid";
import { BulkOperationsToolbar } from "./BulkOperationsToolbar";
import { OCRSettings } from "./OCRSettings";
import { useFiles } from "../hooks/useFiles";
import { useOCR } from "../hooks/useOCR";
import { FilterState, ViewMode } from "../types";

export const Dashboard: React.FC = () => {
  const {
    files,
    isLoading,
    filterFiles,
    addTag,
    removeTag,
    addTagsToFiles,
    removeTagsFromFiles,
    retryOCR,
  } = useFiles();
  const { settings, updateSettings } = useOCR();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    fileType: "all",
    dateRange: "all",
    tags: [],
    sortBy: "date",
    sortOrder: "desc",
  });

  const filteredFiles = useMemo(() => {
    return filterFiles(filters);
  }, [filters, filterFiles]);

  const handleSearchChange = (search: string) => {
    setFilters({ ...filters, search });
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
        <Sidebar
          files={files}
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 lg:ml-0">
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <div className="lg:hidden flex space-x-2">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                  <span>Filters</span>
                </button>
              </div>
              <div className="hidden lg:block">
                <h1 className="text-2xl font-bold text-gray-900">Files</h1>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                  showSettings
                    ? "bg-red-100 border-red-300 text-red-700"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>OCR Settings</span>
              </button>
            </div>

            <BulkOperationsToolbar
              selectedFiles={selectedFiles}
              onAddTags={addTagsToFiles}
              onRemoveTags={removeTagsFromFiles}
              onClearSelection={handleClearSelection}
            />

            {showSettings && (
              <div className="mb-6">
                <OCRSettings
                  settings={settings}
                  onUpdateSettings={updateSettings}
                />
              </div>
            )}

            <FileGrid
              files={filteredFiles}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              isLoading={isLoading}
              selectedFiles={selectedFiles}
              onSelectionChange={handleSelectionChange}
              showSelection={true}
              onRetryOCR={retryOCR}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
