"use client"; //Enables client-side features like useState, useEffect, and router

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { persistSession } from "../lib/session";

//Defines the expected response structure from register API

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};
  // State variables for form inputs
export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState(""); // Stores user name
  const [email, setEmail] = useState(""); // Stores user email
  const [password, setPassword] = useState("");  // Stores password
  const [confirmPassword, setConfirmPassword] = useState(""); // Stores confirm password
  // UI states
  const [loading, setLoading] = useState(false); // Shows loading state while request is processing
  const [error, setError] = useState("");  // Stores validation or API errors

  // Runs when page loads
  useEffect(() => {
    // Check if user is already authenticate and token exists in local storege. 
    const token = window.localStorage.getItem("crm_token");
    if (token) {
      router.replace("/dashboard");   // If token exists, redirect user to dashboard
    }
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Prevent browser refresh on form submit
    setLoading(true); // Start loading state
    setError("");  // Clear previous errors
 
    // Frontend password validation
    if (password !== confirmPassword) { // If passwords do not match, set error message and stop submission
      setError("Passwords do not match."); // Show validation error
      setLoading(false);
      return; // Stop further execution
    }
    
    // Send registration request to backend API
    try {
      const response = await apiFetch<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      persistSession(response.token, response.user); // Save authentication token and user info after successful registration
      router.push("/dashboard");       // Redirect new user to dashboard
    } catch (requestError) {
      setError(       // Handle API or network errors
        requestError instanceof Error
          ? requestError.message
          : "Unable to create account.",
      );
    } finally {
      setLoading(false);       // Stop loading whether success or failure
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <section className="grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-panel rounded-4xl p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-600">
            Create account
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">
            Start tracking leads in minutes
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            New users are stored in MongoDB, receive a JWT, and are sent
            straight to a personalized dashboard after signup.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Professional CRM landing experience",
              "Dynamic dashboard with live MongoDB records",
              "Lead notes, status updates, and filtering",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-xs text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-4xl p-8 lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-600">
              Sign up
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              Create your workspace
            </h2>
          </div>

          <form className="mt-8 space-y-3" onSubmit={handleSubmit}>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-700">
                Full name
              </span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-300"
                placeholder="Avery Johnson"
              />
            </label>

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
                placeholder="Create a secure password"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-700">
                Confirm Password
              </span>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-300"
                placeholder="Confirm password"
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-4 text-xs text-slate-600">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-teal-600 transition hover:text-teal-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
