import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { create } from '@web3-storage/w3up-client';
import { User } from '../types';

let client: any = null;

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
    const storedSession = localStorage.getItem('storacha-session');
    if (storedSession) {
      const sessionData = JSON.parse(storedSession);
      const userData = sessionData.user || {
        id: '1',
        email: sessionData.email,
        name: sessionData.email.split('@')[0]
      };
      setUser(userData);
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
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        lastActivity: Date.now(),
        sessionExpiry: Date.now() + 24 * 60 * 60 * 1000
      };
      
      setUser(mockUser);
      const sessionData = {
        user: mockUser,
        email: mockUser.email
      };
      localStorage.setItem('storacha-session', JSON.stringify(sessionData));
    } else {
      throw new Error('Invalid credentials');
    }
    
    setIsLoading(false);
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('storacha-session');
  };

  return {
    user,
    isLoading,
    signIn,
    signOut,
  };
};

export { AuthContext };

export async function getClient() {
  if (!client) {
    client = await create();
    const storedSession = localStorage.getItem('storacha-session');
    if (!storedSession) {
      throw new Error('No session found');
    }
    const { email } = JSON.parse(storedSession);
    const account = await client.login(email);
    await account.plan.wait();
  }
  return client;
}