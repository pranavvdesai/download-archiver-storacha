import React, { useState, useEffect } from 'react';
import { Download, Calendar } from 'lucide-react';
import { analyticsService } from '../../services/database';

interface PopularFilesTableProps {
  spaceId: string;
}

interface PopularFile {
  cid: string;
  name: string;
  download_count: number;
  size_bytes: number;
  uploaded_at: string;
}

export const PopularFilesTable: React.FC<PopularFilesTableProps> = ({ spaceId }) => {
  const [files, setFiles] = useState<PopularFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [spaceId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await analyticsService.getMostPopularFiles(spaceId, 10);
      setFiles(data as PopularFile[]);
    } catch (error) {
      console.error('Failed to load popular files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No files available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              File Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Downloads
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((file) => (
            <tr key={file.cid} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                  {file.name}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-xs font-mono">
                  {file.cid.substring(0, 20)}...
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatBytes(file.size_bytes)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900">{file.download_count}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {new Date(file.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
