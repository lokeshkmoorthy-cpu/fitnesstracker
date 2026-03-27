import React, { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";

interface AuthPanelProps {
  loading: boolean;
  onLogin: (payload: { email: string; password: string }) => Promise<void>;
  onSignup: (payload: { email: string; password: string; displayName: string }) => Promise<void>;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({ loading, onLogin, onSignup }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        await onLogin({ email, password });
      } else {
        await onSignup({ email, password, displayName });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#07080D] text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          {mode === "login" ? "Login" : "Create Account"}
        </h1>
        <p className="text-sm text-slate-400 mb-5">
          {mode === "login"
            ? "Sign in to view your private fitness dashboard."
            : "Sign up to start tracking your own fitness data."}
        </p>
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" ? (
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
              Display Name
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="h-10 rounded-lg bg-slate-950/60 border border-white/15 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300/80"
                required
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 rounded-lg bg-slate-950/60 border border-white/15 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300/80"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 rounded-lg bg-slate-950/60 border border-white/15 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300/80"
              required
            />
          </label>

          {error ? <p className="text-xs text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-cyan-300/20 border border-cyan-200/40 text-cyan-100 text-xs uppercase font-mono tracking-[0.14em] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {mode === "login" ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((prev) => (prev === "login" ? "signup" : "login"));
            setError("");
          }}
          className="mt-4 text-xs text-slate-400 hover:text-cyan-200 transition-colors"
        >
          {mode === "login"
            ? "New here? Create account"
            : "Already registered? Login"}
        </button>
      </div>
    </div>
  );
};
