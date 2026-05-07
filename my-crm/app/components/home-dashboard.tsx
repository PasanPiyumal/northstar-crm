"use client"; // Enables client-side React hooks and browser functionality

import { useEffect, useState, useRef } from "react";
import { apiFetch } from "../lib/api";

// Type definition for dashboard summary data returned from backend
type DashboardData = {
  metrics: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    wonLeads: number;
    lostLeads: number;
    totalEstimatedDealValue: number;
    totalWonDealValue: number;
  };
  recentNotes: {
    _id: string;
    leadId: string;
    leadName: string;
    content: string;
    createdBy: string;
    createdAt: string;
  }[];
};
// Type definition for individual lead objects
type Lead = {
  _id: string;
  leadName: string;
  email: string;
  companyName: string;
  status: string;
  estimatedDealValue: number;
  leadSource: string;
  assignedSalesperson: string;
  createdAt: string;
  updatedAt: string;
};
// Dashboard component receives authentication token as prop
export default function HomeDashboard({ token }: { token: string }) {
  const [data, setData] = useState<DashboardData | null>(null);   // Stores dashboard summary data
  const [leads, setLeads] = useState<Lead[]>([]);   // Stores lead list data
  const [loading, setLoading] = useState(true); // Controls loading state while fetching data
  const [error, setError] = useState<string | null>(null); // Stores error messages if API request fails
  const fetchedRef = useRef(false); // Prevents API from being called multiple times unnecessarily

  useEffect(() => {
    // Stop duplicate fetching
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    // Function to fetch dashboard data
    const fetchData = async () => {
      try {
        setError(null); // Clear previous errors
        // Decide which API endpoint to use
        // If logged in -> private dashboard data
        // If not logged in -> public dashboard summary

        // Use public endpoint if no token, otherwise use user-specific endpoint
        const summaryEndpoint = token
          ? "/api/dashboard/summary"
          : "/api/dashboard/summary/public";

        const summaryResponse = await apiFetch<DashboardData>(
          summaryEndpoint,
          token ? { token } : {},
        );
        setData(summaryResponse);

        // Only fetch individual leads for authenticated users
        if (token) {
          const leadsResponse = await apiFetch<{ leads: Lead[] }>(
            "/api/leads?status=",
            { token },
          );
        // Save only first 3 leads for dashboard preview
          setLeads(leadsResponse.leads.slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching home dashboard data:", err);
        setError(
          "Unable to load dashboard data. Please try again later or log in.",
        );
      } finally {
        setLoading(false); // Stop loading regardless of success/failure
      }
    };
    // Call fetch function
    void fetchData(); // Runs when token changes
  }, [token]);

  if (loading) {
    return (
      <div className="relative animate-fade-up lg:justify-self-end">
        <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-xl bg-teal-100/40 blur-2xl animate-float" />
        <div className="glass-panel rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs text-slate-500">Today&apos;s snapshot</p>
              <h2 className="text-lg font-semibold text-slate-900">
                Sales command center
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              Loading...
            </span>
          </div>
          <div className="mt-6 space-y-2 animate-pulse">
            <div className="h-10 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative animate-fade-up lg:justify-self-end">
        <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-xl bg-teal-100/40 blur-2xl animate-float" />
        <div className="glass-panel rounded-xl p-6 shadow-sm border border-red-200 bg-red-50">
          <div className="flex items-center justify-between border-b border-red-200 pb-4">
            <div>
              <p className="text-xs text-red-600">Error</p>
              <h2 className="text-lg font-semibold text-red-900">
                Could not load data
              </h2>
            </div>
          </div>
          <p className="mt-4 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative animate-fade-up lg:justify-self-end">
      <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-xl bg-teal-100/40 blur-2xl animate-float" />
      <div className="glass-panel rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs text-slate-500">Today&apos;s snapshot</p>
            <h2 className="text-lg font-semibold text-slate-900">
              Sales command center
            </h2>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {token ? "Live data" : "Public data"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            [data?.metrics.totalLeads ?? 0, "total leads"],
            [data?.metrics.qualifiedLeads ?? 0, "qualified"],
            [data?.metrics.wonLeads ?? 0, "won deals"],
            [
              `$${((data?.metrics.totalEstimatedDealValue ?? 0) / 1000000).toFixed(1)}M`,
              "pipeline value",
            ],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-xl font-semibold text-slate-900">{value}</p>
              <p className="mt-1 text-xs text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {leads.length > 0 ? (
            leads.map((lead) => (
              <div
                key={lead._id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {lead.leadName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lead.assignedSalesperson || "Unassigned"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-teal-600">
                    {lead.status}
                  </p>
                  <p className="text-xs text-slate-500">
                    ${lead.estimatedDealValue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : token ? (
            <p className="text-xs text-slate-600 text-center py-4">
              No leads yet. Create your first lead in the dashboard.
            </p>
          ) : (
            <p className="text-xs text-slate-600 text-center py-4">
              Log in to see your leads and manage your pipeline.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
