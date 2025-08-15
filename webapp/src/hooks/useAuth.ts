import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('storacha_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'demo@storacha.com' && password === 'demo123') {
      const mockUser: User = {
        id: '1',
        email: email,
        name: 'Demo User',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
      };
      
      setUser(mockUser);
      localStorage.setItem('storacha_user', JSON.stringify(mockUser));
    } else {
      throw new Error('Invalid credentials');
    }
    
    setIsLoading(false);
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('storacha_user');
  };

  return {
    user,
    isLoading,
    signIn,
    signOut,
  };
};

export { AuthContext };