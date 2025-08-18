import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '../types';

// 15 minutes session timeout
const SESSION_TIMEOUT = 15 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSessionFresh: boolean;
  needsReauth: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  checkSessionFreshness: () => boolean;
  updateLastActivity: () => void;
  reauthorize: (email: string) => Promise<void>;
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
  const [isSessionFresh, setIsSessionFresh] = useState(true);
  const [needsReauth, setNeedsReauth] = useState(false);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('storacha_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      const isFresh = checkSessionFreshness();
      setIsSessionFresh(isFresh);
      setNeedsReauth(!isFresh);
    }
    setIsLoading(false);
  }, []);

  const checkSessionFreshness = () => {
    if (!user) return false;
    
    const now = Date.now();
    const isExpired = now >= user.sessionExpiry;
    const isInactive = (now - user.lastActivity) >= SESSION_TIMEOUT;
    
    const isFresh = !isExpired && !isInactive;
    setIsSessionFresh(isFresh);
    setNeedsReauth(!isFresh);
    
    return isFresh;
  };

  const updateLastActivity = () => {
    if (!user) return;

    const now = Date.now();
    const updatedUser = {
      ...user,
      lastActivity: now,
      sessionExpiry: now + SESSION_TIMEOUT
    };

    setUser(updatedUser);
    localStorage.setItem('storacha_user', JSON.stringify(updatedUser));
    setIsSessionFresh(true);
    setNeedsReauth(false);
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'demo@storacha.com' && password === 'demo123') {
      const now = Date.now();
      const mockUser: User = {
        id: '1',
        email: email,
        name: 'Demo User',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        lastActivity: now,
        sessionExpiry: now + SESSION_TIMEOUT
      };
      
      setUser(mockUser);
      localStorage.setItem('storacha_user', JSON.stringify(mockUser));
      setIsSessionFresh(true);
      setNeedsReauth(false);
    } else {
      throw new Error('Invalid credentials');
    }
    
    setIsLoading(false);
  };

  const reauthorize = async (email: string) => {
    if (!user || user.email !== email) {
      throw new Error('Invalid reauthorization attempt');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateLastActivity();
  };

  const signOut = () => {
    setUser(null);
    setIsSessionFresh(false);
    setNeedsReauth(false);
    localStorage.removeItem('storacha_user');
  };

  return {
    user,
    isLoading,
    isSessionFresh,
    needsReauth,
    signIn,
    signOut,
    checkSessionFreshness,
    updateLastActivity,
    reauthorize,
  };
};

export { AuthContext };