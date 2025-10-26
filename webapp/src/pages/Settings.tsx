import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Users } from 'lucide-react';
import { SpaceManagement } from '../components/SpaceManagement';
import { SpaceCollaboration } from '../components/SpaceCollaboration';
import { useAuth } from '../hooks/useAuth';

type Tab = 'spaces' | 'collaboration';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('spaces');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('spaces')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'spaces'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database className="w-5 h-5" />
              Space Management
            </button>
            <button
              onClick={() => setActiveTab('collaboration')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'collaboration'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5" />
              Team Collaboration
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'spaces' && <SpaceManagement />}
            {activeTab === 'collaboration' && user?.spaceDid && (
              <SpaceCollaboration
                spaceId={user.spaceDid}
                spaceName="Download Vault"
              />
            )}
            {activeTab === 'collaboration' && !user?.spaceDid && (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-1">No Space Selected</p>
                <p className="text-sm">Please configure your space first in the Space Management tab</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
