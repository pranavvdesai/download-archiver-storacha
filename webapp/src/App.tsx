import React from 'react';
import { AuthProvider } from './components/AuthProvider';
import { SignInForm } from './components/SignInForm';
import { Dashboard } from './components/Dashboard';
import { useAuth } from './hooks/useAuth';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return user ? <Dashboard /> : <SignInForm />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;