import { useState, useEffect } from 'react';
import { create } from '@web3-storage/w3up-client';

interface Client {
  spaces: () => Promise<Space[]>;
  createSpace: (name: string) => Promise<Space>;
  setCurrentSpace: (did: string) => Promise<void>;
  login: (email: string) => Promise<any>;
};

interface Space {
  did: () => string;
  name: string;
  capability?: {
    store: {
      save: () => Promise<void>;
    };
  };
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
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const initializeSpaces = async () => {
      try {
        console.log('Initializing spaces...');
        setIsLoading(true);
        setError(null);

        const storedSession = localStorage.getItem('storacha-session');
        const storedSpaceDid = localStorage.getItem('storacha_space_did');
        console.log('Stored session:', storedSession);
        console.log('Stored space DID:', storedSpaceDid);
        
        if (!storedSession) {
          throw new Error('User not authenticated');
        }

        const sessionData = JSON.parse(storedSession);
        const email = sessionData.email || sessionData.user?.email;
        
        if (!email) {
          throw new Error('No email found in session data');
        }
        
        console.log('Using email:', email);
        console.log('User email:', email);
        
        console.log('Creating w3up client...');
        const newClient = await create() as unknown as Client;
        console.log('Client created:', newClient);
        
        console.log('Logging in...');
        const account = await newClient.login(email);
        console.log('Account:', account);
        
        console.log('Waiting for plan...');
        await account.plan.wait();
        console.log('Plan ready');
        
        console.log('Fetching spaces...');
        let spacesArray: Space[] = [];
        try {
          const availableSpaces = await newClient.spaces();
          console.log('Available spaces:', availableSpaces);
          spacesArray = availableSpaces;
          console.log('Spaces array:', spacesArray);
        } catch (err: unknown) {
          console.log('Error fetching spaces:', err);
          // If error is about no spaces, we'll create one below
          if (err instanceof Error && err.message?.includes('no spaces')) {
            console.log('No spaces found, will create one');
          } else {
            throw err;
          }
        }
        setSpaces(spacesArray);

        if (storedSpaceDid && spacesArray.length > 0) {
          const savedSpace = spacesArray.find(s => s.did() === storedSpaceDid);
          if (savedSpace) {
            console.log('Found stored space:', savedSpace);
            await newClient.setCurrentSpace(savedSpace.did());
            setCurrentSpace(savedSpace);
          } else {
            console.log('Stored space not found in available spaces');
          }
        }

        if (spacesArray.length === 0) {
          console.log('No spaces found, creating default space...');
          try {
            const space = await newClient.createSpace('download-vault');
            console.log('Default space created:', space);
            
            const updatedSpaces = await newClient.spaces();
            console.log('Updated spaces array:', updatedSpaces);
            setSpaces(updatedSpaces);
            
            await newClient.setCurrentSpace(space.did());
            setCurrentSpace(space);
            localStorage.setItem('storacha_space_did', space.did());
            
            spacesArray = updatedSpaces;
          } catch (err) {
            console.error('Error creating space:', err);
            throw new Error('Failed to create default space: ' + (err instanceof Error ? err.message : String(err)));
          }
        } else if (!currentSpace) {
          const defaultSpace = spacesArray[0];
          console.log('Setting first available space as default:', defaultSpace);
          await newClient.setCurrentSpace(defaultSpace.did());
          setCurrentSpace(defaultSpace);
          localStorage.setItem('storacha_space_did', defaultSpace.did());
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

      if (client) {
        await client.setCurrentSpace(spaceDid);
      } else {
        throw new Error('Client not initialized');
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
