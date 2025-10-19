import { useState, useEffect, createContext, useContext } from "react";
import { User } from "../types";
import { create } from "@web3-storage/w3up-client";
import * as DID from "@ipld/dag-ucan/did";
import * as Delegation from "@ucanto/core/delegation";
import toast from "react-hot-toast";
import { generateAvatarUrl } from "../utils/avatar";
import { userService, userSettingsService, spaceService, sessionService, eventService } from "../services/database";


// 15 minutes session timeout
const SESSION_TIMEOUT = 15 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSessionFresh: boolean;
  needsReauth: boolean;
  error: string;
  signIn: (email: string) => Promise<void>;
  signOut: () => void;
  checkSessionFreshness: () => boolean;
  updateLastActivity: () => void;
  reauthorize: (email: string) => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


// Global client singleton promise
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clientPromise: Promise<any> | null = null;
let isClientInitialized = false;

// Exported function to get or create the client
export async function getClient(skipRestore = false) {
  if (!clientPromise) {
    clientPromise = create();
  }

  const client = await clientPromise;

  // Restore session from localStorage if not already initialized and not explicitly skipped
  if (!isClientInitialized && !skipRestore) {
    const storedUser = localStorage.getItem("storacha-session");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        const accounts = client.accounts();
        if (accounts.length === 0) {
          throw new Error('Session expired - please login again');
        }

        if (parsedUser.spaceDid) {
          const spaces = client.spaces();
          const spaceExists = spaces.some((s: any) => s.did() === parsedUser.spaceDid);

          if (spaceExists) {
            await client.setCurrentSpace(parsedUser.spaceDid);
          } else {
            throw new Error('Space not found - please login again');
          }
        }
      } catch (error) {
        localStorage.removeItem("storacha-session");
        throw error;
      }
    }
    isClientInitialized = true;
  }

  return client;
}

// Reset client initialization state (used during login/logout)
export function resetClientState() {
  isClientInitialized = false;
}


export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionFresh, setIsSessionFresh] = useState(true);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("storacha-session");
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
    localStorage.setItem('storacha-session', JSON.stringify(updatedUser));
    setIsSessionFresh(true);
    setNeedsReauth(false);
  };


  // Core client initialization and login logic inside hook
  async function initClient(userEmail: `${string}@${string}`, savedSpaceDid?: `did:${string}:${string}`) {
    let toastId: string | undefined;
    let sessionId: string | undefined;

    try {
      setError("");
      toastId = toast.loading("Connecting to Storacha...");

      const indexDB = await indexedDB.databases();
      const isExistingDB = indexDB.find(i => i.name === 'w3up-client');

      if (!isExistingDB) toast("Verification email sent! Please check your inbox.");

      // Skip session restoration during login - we're setting it up fresh
      const client = await getClient(true);
      const account = await client.login(userEmail);

      await account.plan.wait(); // Await user email verification
      toast.success("Email verified successfully! 🚀");

      let spaceDid: `did:${string}:${string}`;
      let isNewSpace = false;

      if (savedSpaceDid) {
        spaceDid = savedSpaceDid;
        await client.setCurrentSpace(spaceDid);
      } else {
        const existingSpaces = client.spaces();
        const vault = existingSpaces.find((s: any) => s.name === "download-vault");

        if (vault) {
          spaceDid = vault.did();
          await client.setCurrentSpace(spaceDid);
        } else {
          const space = await client.createSpace("download-vault", { account });
          spaceDid = space.did();
          await client.setCurrentSpace(spaceDid);
          isNewSpace = true;
        }

        // Create delegation for agent
        const agentDid = client.agent.did();
        const delegation = await client.createDelegation(
          DID.parse(agentDid),
          ["space/blob/add", "space/index/add", "upload/add", "store/add"],
          { expiration: Infinity }
        );

        const { ok: archiveBytes } = await delegation.archive();
        if (!archiveBytes) throw new Error("Error creating delegation");
        const { ok: proof } = await Delegation.extract(new Uint8Array(archiveBytes));
        if (!proof) throw new Error("Delegation proof extraction failed");
        await client.addSpace(proof);
      }

      const now = Date.now();
      const newUser: User = {
        id: userEmail,
        name: userEmail.split('@')[0],
        email: userEmail,
        spaceDid: savedSpaceDid || (client.currentSpace())?.did(),
        avatar: generateAvatarUrl(userEmail),
        lastActivity: now,
        sessionExpiry: now + SESSION_TIMEOUT
      };

      localStorage.setItem("storacha-session", JSON.stringify(newUser));
      setUser(newUser);

      // Mark client as initialized after successful login
      resetClientState();

      // 1. Create or update user in database
      try {
        await userService.upsertUser({
          email: userEmail,
          name: newUser.name,
          avatar_url: newUser.avatar,
          default_space_id: spaceDid,
          last_login_at: new Date().toISOString()
        });

        // 2. Ensure user settings exist
        await userSettingsService.getOrCreateUserSettings(userEmail);

        // 3. Create or update space in database
        await spaceService.upsertSpace({
          space_id: spaceDid,
          name: "download-vault",
          owner_email: userEmail,
          visibility: 'private'
        });

        // 4. Create session record
        const session = await sessionService.createSession({
          user_email: userEmail,
          expires_at: new Date(now + SESSION_TIMEOUT).toISOString(),
          user_agent: navigator.userAgent,
          session_data: { space_id: spaceDid }
        });
        sessionId = session?.session_id;

        // 5. Log login event
        await eventService.logEvent({
          event_type: isNewSpace ? 'user.registered' : 'user.login',
          user_email: userEmail,
          space_id: spaceDid,
          payload: {
            is_new_space: isNewSpace,
            session_id: sessionId
          }
        });

      } catch (dbError: any) {
        console.error('Database sync error during login:', dbError);
        toast.error('Warning: Database sync partially failed');
      }

      toast.success("Logged in successfully!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login failed");
      toast.error(err.message || "Login failed");
      throw err;
    } finally {
      if (toastId) toast.dismiss(toastId);
      setIsLoading(false);
    }
  }

  // Sign in wrapper calls initClient
  const signIn = async (email: string) => {
    try {
      await initClient(email as `${string}@${string}`, user?.spaceDid);
      setIsSessionFresh(true);
      setNeedsReauth(false);
    } catch {
      // error & toast handled in initClient
    }
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
    localStorage.removeItem("storacha-session");

    resetClientState();
    clientPromise = null;
    indexedDB.deleteDatabase("w3up-client");
  };

  return {
    user,
    isLoading,
    isSessionFresh,
    needsReauth,
    error,
    signIn,
    signOut,
    checkSessionFreshness,
    updateLastActivity,
    reauthorize,
  };
};


export { AuthContext };
