"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u: string, p: string) => {
    setEmail(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden transition-colors">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl mb-4 shadow-xl shadow-zinc-200 dark:shadow-zinc-900 rotate-3 transform transition-transform hover:rotate-0">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Sign in to continue your journey
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] shadow-xl border border-zinc-100 dark:border-zinc-800 backdrop-blur-xl bg-opacity-80 dark:bg-opacity-80">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="w-1 h-1 bg-red-500 rounded-full" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 transition-colors group-focus-within:text-zinc-900 dark:group-focus-within:text-white">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 font-medium focus:bg-white dark:focus:bg-zinc-700 focus:border-zinc-300 dark:focus:border-zinc-600 focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 outline-none transition-all"
                  placeholder="Username"
                />
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 transition-colors group-focus-within:text-zinc-900 dark:group-focus-within:text-white">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 font-medium focus:bg-white dark:focus:bg-zinc-700 focus:border-zinc-300 dark:focus:border-zinc-600 focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 outline-none transition-all"
                  placeholder="Password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold text-lg shadow-lg shadow-zinc-200 dark:shadow-zinc-900 hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider font-bold">
                <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 dark:text-zinc-500">Demo Accounts</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillDemo("BABER", "baberhusband")}
                className="flex flex-col items-center p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600 rounded-2xl transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center mb-2 text-zinc-900 dark:text-white font-bold group-hover:scale-110 transition-transform">
                  B
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">BABER</span>
                <span className="text-[10px] text-zinc-400 font-mono">baberhusband</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo("baber", "baberwife")}
                className="flex flex-col items-center p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600 rounded-2xl transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center mb-2 text-zinc-900 dark:text-white font-bold group-hover:scale-110 transition-transform">
                  b
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">baber</span>
                <span className="text-[10px] text-zinc-400 font-mono">baberwife</span>
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
          &copy; {new Date().getFullYear()} TravelAI. All rights reserved.
        </p>
      </div>
    </div>
  );
}
