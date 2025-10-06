import React from 'react';
import { AuthProvider } from './components/AuthProvider';
import { SignInForm } from './components/SignInForm';
import { Dashboard } from './components/Dashboard';
import { useAuth } from './hooks/useAuth';
import { FormSkeleton } from './components/skeletons';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FormSkeleton />;
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