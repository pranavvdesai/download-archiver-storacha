import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Search, Settings, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSpaces } from '../hooks/useSpaces';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  const { user, signOut } = useAuth();
  const { spaces, currentSpace, isLoading, selectSpace } = useSpaces();
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleSpaceChange = async (spaceDid: string) => {
    try {
      await selectSpace(spaceDid);
      setNotification({ type: 'success', message: 'Space selected successfully' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Failed to select space'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      {notification && (
        <div
          className={`fixed top-4 right-4 flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}
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
          <div className="relative">
            <select
              id="space-selector"
              className={`appearance-none w-full px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 pr-10 cursor-pointer text-sm font-medium ${isLoading ? 'text-gray-400' : 'text-gray-700'}`}
              value={currentSpace?.did() || ''}
              onChange={(e) => handleSpaceChange(e.target.value)}
              disabled={isLoading}
            >
              <option value="" disabled>
                {isLoading ? 'Loading spaces...' : 'Select Space'}
              </option>
              {!isLoading && spaces.length === 0 && (
                <option value="" disabled>No spaces available</option>
              )}
              {spaces.map((space) => (
                <option key={space.did()} value={space.did()}>
                  {space.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
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

