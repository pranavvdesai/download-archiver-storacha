import { StorachaFile } from "../types";

export const formatFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const getFileTypeIcon = (type: string): string => {
  switch (type) {
    case 'document': return '📄';
    case 'archive': return '📦';
    case 'image': return '🖼️';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'data': return '💾';
    default: return '📁';
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};

export function getAllTags(files: StorachaFile[] = []): string[] {
  const tagSet = new Set<string>();

  files.forEach(file => {
    (file.tags ?? []).forEach(tag => {
      tagSet.add(tag);
    });
  });

  return Array.from(tagSet);
}
