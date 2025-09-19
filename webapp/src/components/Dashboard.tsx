import React, { useState, useMemo } from "react";
import { Menu } from "lucide-react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { FileGrid } from "./FileGrid";
import { BulkOperationsToolbar } from "./BulkOperationsToolbar";
import { SpaceManagement } from "./SpaceManagement";
import { useFiles } from "../hooks/useFiles";
import { FilterState, ViewMode } from "../types";

type DashboardView = "files" | "space";

export const Dashboard: React.FC = () => {
  const {
    files,
    isLoading,
    filterFiles,
    addTag,
    removeTag,
    addTagsToFiles,
    removeTagsFromFiles,
  } = useFiles();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<DashboardView>("files");
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
  }, [files, filters, filterFiles]);

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

  if (currentView === "space") {
    return <SpaceManagement />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        searchQuery={filters.search}
        onSearchChange={handleSearchChange}
        onSpaceManagement={() => setCurrentView("space")}
        onBackToFiles={() => setCurrentView("files")}
        currentView={currentView}
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
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Menu className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>

            <BulkOperationsToolbar
              selectedFiles={selectedFiles}
              onAddTags={addTagsToFiles}
              onRemoveTags={removeTagsFromFiles}
              onClearSelection={handleClearSelection}
            />

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
            />
          </div>
        </main>
      </div>
    </div>
  );
};
