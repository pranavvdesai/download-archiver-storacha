import { useState, useEffect } from 'react';
import { create } from '@web3-storage/w3up-client';

interface Space {
  did: () => string;
  name: string;
}

interface UseSpacesReturn {
  spaces: Space[];
  currentSpace: Space | null;
  isLoading: boolean;
  error: string | null;
  selectSpace: (spaceDid: string) => Promise<void>;
}

export const useSpaces = (): UseSpacesReturn => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const initializeSpaces = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const storedUser = localStorage.getItem('storacha_user');
        const storedSpaceDid = localStorage.getItem('storacha_space_did');
        
        if (!storedUser) {
          throw new Error('User not authenticated');
        }

        const { email } = JSON.parse(storedUser);
        
        const newClient = await create();
        const account = await newClient.login(email);
        await account.plan.wait();
        
        const availableSpaces = newClient.spaces();
        setSpaces(availableSpaces);

        if (storedSpaceDid) {
          const savedSpace = availableSpaces.find(s => s.did() === storedSpaceDid);
          if (savedSpace) {
            await newClient.setCurrentSpace(savedSpace.did());
            setCurrentSpace(savedSpace);
          }
        }

        if (!currentSpace) {
          const defaultSpace = availableSpaces.find(s => s.name === 'download-vault');
          if (defaultSpace) {
            await newClient.setCurrentSpace(defaultSpace.did());
            setCurrentSpace(defaultSpace);
            localStorage.setItem('storacha_space_did', defaultSpace.did());
          }
        }

        setClient(newClient);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize spaces');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSpaces();
  }, []);

  const selectSpace = async (spaceDid: string) => {
    try {
      setError(null);
      
      const selectedSpace = spaces.find(s => s.did() === spaceDid);
      if (!selectedSpace) {
        throw new Error('Space not found');
      }

      const response = await chrome.runtime.sendMessage({ 
        type: 'SELECT_SPACE', 
        spaceDid 
      });

      if (!response.ok) {
        throw new Error(response.error || 'Failed to select space');
      }

      setCurrentSpace(selectedSpace);
      localStorage.setItem('storacha_space_did', spaceDid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select space');
      throw err;
    }
  };

  return {
    spaces,
    currentSpace,
    isLoading,
    error,
    selectSpace
  };
};
