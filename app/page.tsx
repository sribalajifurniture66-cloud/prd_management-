"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      // Set auth cookie via API route
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      router.push("/dashboard");
    } else {
      setError("Invalid password");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 sm:p-6">
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-2xl shadow-black/30 sm:p-9">
        <div className="mb-8 flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-xl font-black text-white shadow-lg shadow-emerald-600/20">
            V
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to Vardhan Stock Room</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="password" className="form-label">
              Admin Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              placeholder="Enter password"
              autoFocus
            />
          </div>

          {error && <p className="status-message border-red-200 bg-red-50 text-red-700">{error}</p>}

          <button
            type="submit"
            className="primary-button w-full"
          >
            Enter dashboard
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Private inventory and sales workspace
        </p>
      </div>
    </main>
  );
}
