import React, { useState }  from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { LogoutModal } from './LogoutModal';
import { AdvancedSearch } from './AdvancedSearch';
import { SearchResult } from '../services/searchService';
import { StorachaFile } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchResults?: (results: SearchResult[]) => void;
  onFileSelect?: (file: StorachaFile) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSearchResults,
  onFileSelect,
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Storacha</h1>
        </div>

        <div className="flex-1 max-w-2xl mx-8">
          <AdvancedSearch
            onResultsChange={onSearchResults}
            onFileSelect={onFileSelect}
            placeholder="Search files, content, and more..."
            className="w-full"
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
            <span className="text-sm font-medium text-gray-700">
              {user?.name}
            </span>
          </div>

          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          signOut();
          setIsLogoutModalOpen(false);
        }}
      />
    </header>
  );
};
