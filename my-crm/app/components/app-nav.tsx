"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearSession } from "../lib/session";

type AppNavProps = {
  active: "home" | "dashboard";
  userName: string;
};

export default function AppNav({ active, userName }: AppNavProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  function handleSignOut() {
    // Clear the stored session before sending the user back to the public home page.
    clearSession();
    router.push("/");
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/"
        className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
          active === "home"
            ? "bg-teal-600 text-white"
            : "border border-slate-300 text-slate-700 hover:bg-slate-50"
        }`}
      >
        Home
      </Link>
      <Link
        href="/dashboard"
        className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
          active === "dashboard"
            ? "bg-teal-600 text-white"
            : "border border-slate-300 text-slate-700 hover:bg-slate-50"
        }`}
      >
        Dashboard
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setProfileOpen((previous) => !previous)}
          className="flex items-center gap-3 rounded-full border border-slate-300 bg-white px-3 py-2 text-left shadow-sm transition hover:bg-slate-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
            {userName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase() || "U"}
          </span>
          <span className="hidden text-xs font-medium text-slate-700 sm:block">
            Hello, {userName}
          </span>
        </button>

        {profileOpen ? (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-md px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
