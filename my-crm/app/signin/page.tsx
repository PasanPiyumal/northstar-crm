"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { persistSession } from "../lib/session";

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); // Store user input values
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("crm_token"); //check localStorage for token to determine if user is already authenticated
    if (token) {
      router.replace("/dashboard"); //If found, the user is redirected directly to the dashboard.
    }
  }, [router]);

  // Keep logged-in users out of the sign-in form so the dashboard remains the primary destination.

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) { //Stops form reload.
    event.preventDefault();
    setLoading(true); //show loading
    setError(""); //clear previous errors

    try {
      const response = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }), //Send email/password to backend for authentication.
      });

      persistSession(response.token, response.user); //saves login info. token,user details in localStorage and cookies for session persistence.
      router.push("/dashboard"); //Redirect after success.
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <section className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-panel rounded-lg p-8 lg:p-10 border border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-600">
            Welcome back
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">
            Sign in to your CRM workspace
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            Review the pipeline, update leads, and keep notes in sync from a
            single dashboard.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ["Secure JWT auth", "Token-based sessions for every user."],
              ["MongoDB storage", "Leads and notes persist in the database."],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-medium text-slate-900">{title}</p>
                <p className="mt-2 text-xs text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-lg p-8 lg:p-10 border border-slate-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-600">
              Sign in
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              Access your dashboard
            </h2>
          </div>

          <form className="mt-8 space-y-3" onSubmit={handleSubmit}>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-700">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-300"
                placeholder="you@company.com"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-700">
                Password
              </span>
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-300"
                placeholder="Enter your password"
              />
            </label>

            {error ? (
              <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-xs text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-teal-600 transition hover:text-teal-700"
            >
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
