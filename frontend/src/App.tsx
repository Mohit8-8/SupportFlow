import React, { useState, useEffect } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { CustomerDashboard } from "@/components/CustomerDashboard"; // 1. Import Customer Panel
import { AgentDashboard } from "@/components/AgentDashboard";       // 2. Import Agent Panel

interface UserSession {
  id: string;
  email: string;
  role: "CUSTOMER" | "AGENT";
}

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setAppReady(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (!appReady) return null;

  return (
    <>
      {!user ? (
        <AuthScreen onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)} />
      ) : (
        <div className="min-h-screen bg-neutral-50 p-4 sm:p-6 md:p-8 dark:bg-neutral-950">
          <div className="mx-auto max-w-7xl space-y-6">
            
            {/* Global Application Banner Navigation */}
            <div className="flex items-center justify-between border-b border-neutral-200 bg-white p-5 rounded-xl shadow-sm border dark:border-neutral-800 dark:bg-neutral-900">
              <div>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">AI Support Workspace</h1>
                <p className="text-sm text-neutral-500">
                  Logged in as: <span className="font-medium text-neutral-700 dark:text-neutral-300">{user.email}</span> 
                  <span className="ml-2 px-2 py-0.5 text-xs rounded bg-neutral-100 text-neutral-700 font-mono font-semibold uppercase">{user.role}</span>
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Log Out
              </button>
            </div>
            
            {/* 3. DYNAMIC WORKSPACE SWAP */}
            {user.role === "AGENT" ? <AgentDashboard /> : <CustomerDashboard />}

          </div>
        </div>
      )}
    </>
  );
}