import React, { useState } from "react";
import { api } from "../lib/api";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Lock, Mail, UserCheck, Loader2 } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (user: { id: string; email: string; role: "CUSTOMER" | "AGENT" }) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  // Toggle state between Login and Register modes
  const [isLogin, setIsLogin] = useState(true);
  
  // Form input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "AGENT">("CUSTOMER");
  
  // UI feedback states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Trigger Login Endpoint
        const response = await api.auth.login({ email, password });
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        onAuthSuccess(response.user);
      } else {
        // Trigger Registration Endpoint
        await api.auth.register({ email, password, role });
        // Auto-login the user immediately after successful registration
        const loginResponse = await api.auth.login({ email, password });
        localStorage.setItem("token", loginResponse.token);
        localStorage.setItem("user", JSON.stringify(loginResponse.user));
        onAuthSuccess(loginResponse.user);
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        
        {/* Header Block */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {isLogin ? "Enter your credentials to access your tickets" : "Sign up to start tracking support threads"}
          </p>
        </div>

        {/* Global Error Alert Banner */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Interactive Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-4 w-4 text-neutral-400" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-4 w-4 text-neutral-400" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Contextual Account Role Selector (Only renders during registration mode) */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("CUSTOMER")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                    role === "CUSTOMER"
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-900"
                      : "border-neutral-200 bg-transparent text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  }`}
                >
                  Customer Account
                </button>
                <button
                  type="button"
                  onClick={() => setRole("AGENT")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                    role === "AGENT"
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-900"
                      : "border-neutral-200 bg-transparent text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                  Support Agent
                </button>
              </div>
            </div>
          )}

          {/* Shadcn UI Action Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </span>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Register Account"
            )}
          </Button>
        </form>

        {/* View Switching Footer Link */}
        <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-700 dark:text-neutral-50 dark:hover:text-neutral-300"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </div>

      </div>
    </div>
  );
}