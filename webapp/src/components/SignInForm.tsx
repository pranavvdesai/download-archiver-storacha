import React, { useState, useEffect } from "react";
import { Mail, Lock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface UserSession {
  email: string;
  spaceDid: string;
}

import { useAuth } from "../hooks/useAuth"; // adjust path as needed

export const SignInForm: React.FC = () => {
  const { signIn, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  // Restore session email for input autofill & auto-login (optional)
  useEffect(() => {
    const saved = localStorage.getItem("storacha-session");
    if (saved) {
      try {
        const parsed: UserSession = JSON.parse(saved);
        setEmail(parsed.email);
        signIn(parsed.email).catch(() => toast.error("Failed to restore session"));
      } catch {
        localStorage.removeItem("storacha-session");
      }
    }
  }, [signIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      await signIn(email);
    } catch (err: any) {
      setError(err.message || "Login failed");
      toast.error(err.message || "Login failed");
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Storacha</h1>
          <p className="text-gray-600 mt-2">Sign in with your email to access storage</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};
