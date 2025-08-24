import React from 'react';
import { LogOut, User, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSpaces } from '../hooks/useSpaces';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange }) => {
  const { user, signOut } = useAuth();
  const { spaces, currentSpace, isLoading, selectSpace } = useSpaces();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Storacha</h1>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search files, CIDs, or tags..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative group">
            <button
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              onClick={() => document.getElementById('space-selector')?.click()}
            >
              <span className="text-sm font-medium text-gray-700">
                {currentSpace?.name || 'Select Space'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            <select
              id="space-selector"
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              value={currentSpace?.did() || ''}
              onChange={(e) => selectSpace(e.target.value)}
              disabled={isLoading}
            >
              <option value="" disabled>Select Space</option>
              {spaces.map((space) => (
                <option key={space.did()} value={space.did()}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

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
            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
          </div>
          
          <button
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};