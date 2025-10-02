import React, { useState, useMemo, useEffect } from 'react';
import { Menu, Files, Activity, HardDrive } from 'lucide-react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FileGrid } from './FileGrid';
import { BulkOperationsToolbar } from './BulkOperationsToolbar';
import { ActivityTimeline } from './ActivityTimeline.tsx';
import { StorageAnalytics } from './StorageAnalytics';
import { FilterState, ViewMode, StorachaFile } from '../types';
import { getClient } from '../hooks/useAuth';
import { decodeCidToString } from '../utils/decodeCidToString';


export const Dashboard: React.FC = () => {
  const [files, setFiles] = useState<StorachaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'activity' | 'storage'>('files');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    fileType: 'all',
    dateRange: 'all',
    tags: [],
    sortBy: 'date',
    sortOrder: 'desc'
  });

  function mapUploadsToFiles(uploadResponse: any[]): any[] {
    return uploadResponse.map((upload, index) => ({
      id: upload.root['/'],           
      cid: upload.root['/'],
      name: `File ${index + 1}`,      
      size: 0,                       
      created: new Date(upload.insertedAt).getTime(),
      updated: new Date(upload.updatedAt).getTime(),
      shards: upload.shards.map((shard: any) => shard['/']),
    }));
  }

  async function listFiles() {
    setIsLoading(true);
    try {
      const client = await getClient();
      const response = await client.capability.upload.list({ cursor: '', size: 25 });
      const mappedFiles = mapUploadsToFiles(response.results);
      setFiles(mappedFiles);
    } catch (error) {
      console.error("Failed to list files: ", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    listFiles();
  }, []);

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const cidStr = decodeCidToString(file.cid).toLowerCase();
        if (!file.name.toLowerCase().includes(searchLower) && !cidStr.includes(searchLower)) {
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
    setSelectedFiles(prev => 
      selected 
        ? [...prev, fileId]
        : prev.filter(id => id !== fileId)
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
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Menu className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>

            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('files')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === 'files'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Files className="w-4 h-4" />
                    <span>Files</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === 'activity'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Activity</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('storage')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === 'storage'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Storage</span>
                  </button>
                </nav>
              </div>
            </div>

            {activeTab === 'files' ? (
              <>
                <BulkOperationsToolbar
                  selectedFiles={selectedFiles}
                  onAddTags={() => {}}
                  onRemoveTags={() => {}}
                  onClearSelection={handleClearSelection}
                />

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
              </>
            ) : activeTab === 'activity' ? (
              <ActivityTimeline />
            ) : (
              <StorageAnalytics files={files} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
