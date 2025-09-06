import { useState, useEffect, createContext, useContext } from "react";
import { User } from "../types";
import { create } from "@web3-storage/w3up-client";
import * as DID from "@ipld/dag-ucan/did";
import * as Delegation from "@ucanto/core/delegation";
import toast from "react-hot-toast";
import { generateAvatarUrl } from "../utils/avatar";


interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string;
  signIn: (email: string) => Promise<void>;
  signOut: () => void;
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
let clientPromise: Promise<any> | null = null;

// Exported function to get or create the client
export function getClient() {
  if (!clientPromise) {
    clientPromise = create();
  }
  return clientPromise;
}


export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("storacha-session");
    if (storedUser) {
      try {
        const parsed: User = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        localStorage.removeItem("storacha-session");
      }
    }
    setIsLoading(false);
  }, []);

  // Core client initialization and login logic inside hook
  async function initClient(userEmail: `${string}@${string}`, savedSpaceDid?: `did:${string}:${string}`) {
    let toastId: string | undefined;

    try {
      setError("");
      toastId = toast.loading("Connecting to Storacha...");

      const indexDB = await indexedDB.databases();
      const isExistingDB = indexDB.find(i => i.name === 'w3up-client');

      if (!isExistingDB) toast("Verification email sent! Please check your inbox.");

      const client = await getClient();
      const account = await client.login(userEmail);

      await account.plan.wait(); // Await user email verification
      toast.success("Email verified successfully! 🚀");

      let spaceDid: `did:${string}:${string}`;

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

      const newUser: User = {
        email: userEmail,
        spaceDid: savedSpaceDid || (client.currentSpace())?.did(),
        avatar: generateAvatarUrl(userEmail),
      };

      localStorage.setItem("storacha-session", JSON.stringify(newUser));
      setUser(newUser);

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
    } catch {
      // error & toast handled in initClient
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem("storacha-session");
    const dbDeleteRequest = indexedDB.deleteDatabase("w3up-client");

    dbDeleteRequest.onerror = (event) => {
      console.error("Failed to delete IndexedDB access-store", event);
    };
    dbDeleteRequest.onblocked = () => {
      console.warn("Deletion of IndexedDB access-store blocked");
    };
    dbDeleteRequest.onsuccess = () => {
      console.log("IndexedDB access-store deleted successfully");
    };
  };

  return {
    user,
    isLoading,
    error,
    signIn,
    signOut,
  };
};


export { AuthContext };
