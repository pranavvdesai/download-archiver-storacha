import React, { useState }  from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Search, Settings, Clock, Home } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { LogoutModal } from './LogoutModal';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Storacha</h1>
          </div>

          <nav className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-red-50 text-red-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="w-4 h-4" />
              Files
            </button>
            <button
              onClick={() => navigate('/upload-history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/upload-history') 
                  ? 'bg-red-50 text-red-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              Upload History
            </button>
          </nav>
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
