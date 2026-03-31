import React, { useState } from "react";
import { LogIn, UserPlus, Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow duration-300">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-pulse tracking-wider">
            FIT TRACKER
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-cyan-400 to-purple-600 mx-auto mt-2 rounded-full animate-pulse"></div>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          {mode === "login" ? "Login" : "Create Account"}
        </h2>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" ? (
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
              Display Name
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="h-10 rounded-lg bg-slate-900 border border-slate-700 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300/80 hover:border-cyan-400/60 transition-colors"
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
              className="h-10 rounded-lg bg-slate-900 border border-slate-700 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300/80 hover:border-cyan-400/60 transition-colors"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
            Password
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-10 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 pr-10 text-sm text-slate-100 outline-none focus:border-cyan-300/80 hover:border-cyan-400/60 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors hover:scale-110"
              >
                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </label>

          {error ? <p className="text-xs text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full h-10 rounded-lg bg-cyan-300/20 border border-cyan-200/40 text-cyan-100 text-xs uppercase font-mono tracking-[0.14em] flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-cyan-300/30 hover:border-cyan-200/60 transition-all duration-200"
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
          className="cursor-pointer mt-4 text-xs text-slate-400 hover:text-cyan-200 transition-colors"
        >
          {mode === "login"
            ? "New here? Create account"
            : "Already registered? Login"}
        </button>
      </div>
    </div>
  );
};
