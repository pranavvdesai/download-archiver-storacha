import { useState, useEffect } from 'react';
import { StorachaFile, FilterState } from '../types';
import { useCache } from './useCache';

const MOCK_FILES: StorachaFile[] = [
  {
    id: '1',
    name: 'project-proposal.pdf',
    cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    size: 2048576,
    type: 'document',
    mimeType: 'application/pdf',
    uploadedAt: new Date('2024-12-15'),
    tags: ['work', 'important'],
    isPublic: false,
    downloadCount: 15
  },
  {
    id: '2',
    name: 'vacation-photos.zip',
    cid: 'bafkreihdwdcefgh4dqkjv67uzcmw7ojmmvkjk3h2cdqf5jcdh5p7fjqmw',
    size: 52428800,
    type: 'archive',
    mimeType: 'application/zip',
    uploadedAt: new Date('2024-12-14'),
    tags: ['personal', 'photos'],
    isPublic: true,
    downloadCount: 3
  },
  {
    id: '3',
    name: 'presentation.pptx',
    cid: 'bafkreicysg23kiwv34eg2d7qweipicolvbfhkdhbkljt5fcg2b7rr3rgm',
    size: 8388608,
    type: 'document',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    uploadedAt: new Date('2024-12-13'),
    tags: ['work', 'presentation'],
    isPublic: false,
    downloadCount: 28
  },
  {
    id: '4',
    name: 'music-collection.tar.gz',
    cid: 'bafkreiesubnkjy3q4xnv7f7w3wjbsdz4c5c4u5w6hpwxvqg7w8u4f3o1u',
    size: 134217728,
    type: 'archive',
    mimeType: 'application/gzip',
    uploadedAt: new Date('2024-12-12'),
    tags: ['personal', 'music'],
    isPublic: true,
    downloadCount: 7
  },
  {
    id: '5',
    name: 'database-backup.sql',
    cid: 'bafkreiay4d7x5g7f4g5h8j9k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    size: 16777216,
    type: 'data',
    mimeType: 'application/sql',
    uploadedAt: new Date('2024-12-11'),
    tags: ['backup', 'database'],
    isPublic: false,
    downloadCount: 2
  },
  {
    id: '6',
    name: 'website-assets.zip',
    cid: 'bafkreib9f6g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c',
    size: 25165824,
    type: 'archive',
    mimeType: 'application/zip',
    uploadedAt: new Date('2024-12-10'),
    tags: ['web', 'assets'],
    isPublic: true,
    downloadCount: 12
  }
];

export const useFiles = () => {
  const [files, setFiles] = useState<StorachaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { get, set } = useCache();

  const loadFiles = async () => {
    setIsLoading(true);
    
    // Check cache first
    const cachedFiles = get<StorachaFile[]>('files');
    if (cachedFiles) {
      setFiles(cachedFiles);
      setIsLoading(false);
      return;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setFiles(MOCK_FILES);
    set('files', MOCK_FILES, 5 * 60 * 1000); // Cache for 5 minutes
    setIsLoading(false);
  };

  const filterFiles = (filters: FilterState): StorachaFile[] => {
    let filteredFiles = [...files];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredFiles = filteredFiles.filter(file =>
        file.name.toLowerCase().includes(searchTerm) ||
        file.cid.toLowerCase().includes(searchTerm) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // File type filter
    if (filters.fileType && filters.fileType !== 'all') {
      filteredFiles = filteredFiles.filter(file => file.type === filters.fileType);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filteredFiles = filteredFiles.filter(file =>
        filters.tags.every(tag => file.tags.includes(tag))
      );
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filteredFiles = filteredFiles.filter(file => file.uploadedAt >= filterDate);
    }

    // Sort files
    filteredFiles.sort((a, b) => {
      let compareValue = 0;
      
      switch (filters.sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'date':
          compareValue = a.uploadedAt.getTime() - b.uploadedAt.getTime();
          break;
        case 'size':
          compareValue = a.size - b.size;
          break;
        case 'downloads':
          compareValue = a.downloadCount - b.downloadCount;
          break;
      }
      
      return filters.sortOrder === 'desc' ? -compareValue : compareValue;
    });

    return filteredFiles;
  };

  const addTag = (fileId: string, tag: string) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId && !file.tags.includes(tag)
          ? { ...file, tags: [...file.tags, tag] }
          : file
      )
    );
  };

  const removeTag = (fileId: string, tag: string) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId
          ? { ...file, tags: file.tags.filter(t => t !== tag) }
          : file
      )
    );
  };

  const addTagsToFiles = (fileIds: string[], tag: string) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        fileIds.includes(file.id) && !file.tags.includes(tag)
          ? { ...file, tags: [...file.tags, tag] }
          : file
      )
    );
  };

  const removeTagsFromFiles = (fileIds: string[], tag: string) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        fileIds.includes(file.id)
          ? { ...file, tags: file.tags.filter(t => t !== tag) }
          : file
      )
    );
  };

  useEffect(() => {
    loadFiles();
  }, []);

  return {
    files,
    isLoading,
    filterFiles,
    addTag,
    removeTag,
    addTagsToFiles,
    removeTagsFromFiles,
    refreshFiles: loadFiles
  };
};