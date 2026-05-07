"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import { clearSession } from "../lib/session";
import AppNav from "../components/app-nav";

type Note = {
  _id: string;
  content: string;
  createdBy: string;
  createdAt: string;
};

type RecentNote = Note & {
  leadId: string;
  leadName: string;
};

type Lead = {
  _id: string;
  leadName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  leadSource: string;
  assignedSalesperson: string;
  status: string;
  estimatedDealValue: number;
  createdAt: string;
  updatedAt: string;
  notes?: Note[];
};

type DashboardSummary = {
  metrics: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    wonLeads: number;
    lostLeads: number;
    totalEstimatedDealValue: number;
    totalWonDealValue: number;
  };
  recentNotes: RecentNote[];
};

type LeadForm = {
  leadName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  leadSource: string;
  assignedSalesperson: string;
  status: string;
  estimatedDealValue: string;
};

type FilterState = {
  search: string;
  status: string;
  leadSource: string;
  assignedSalesperson: string;
};

const emptyForm: LeadForm = {
  leadName: "",
  companyName: "",
  email: "",
  phoneNumber: "",
  leadSource: "Website",
  assignedSalesperson: "",
  status: "New",
  estimatedDealValue: "",
};

const defaultFilters: FilterState = {
  search: "",
  status: "",
  leadSource: "",
  assignedSalesperson: "",
};

const statusStyles: Record<string, string> = {
  New: "bg-sky-100 text-sky-700 border-sky-300",
  Contacted: "bg-amber-100 text-amber-700 border-amber-300",
  Qualified: "bg-teal-100 text-teal-700 border-teal-300",
  "Proposal Sent": "bg-violet-100 text-violet-700 border-violet-300",
  Won: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Lost: "bg-rose-100 text-rose-700 border-rose-300",
};

type DashboardClientProps = {
  token: string;
  userName: string;
};

export default function DashboardClient({
  token,
  userName,
}: DashboardClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadForm, setLeadForm] = useState<LeadForm>(emptyForm);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [noteContent, setNoteContent] = useState("");
  const [feedback, setFeedback] = useState("");
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const selectedLead = useMemo(
    () =>
      leads.find(
        (lead) => lead._id === (selectedLeadId ?? leads[0]?._id ?? null),
      ) ?? null,
    [leads, selectedLeadId],
  );

  const selectedLeadNotes = useMemo(
    () =>
      [...(selectedLead?.notes ?? [])].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
    [selectedLead?.notes],
  );

  const recentNotes = useMemo(
    () =>
      [...(summary?.recentNotes ?? [])]
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        )
        .slice(0, 6),
    [summary?.recentNotes],
  );

  const loadDashboard = useCallback(
    async (currentToken: string) => {
      setLoading(true);
      setFeedback("");

      try {
        const query = new URLSearchParams();

        if (filters.search) query.set("search", filters.search);
        if (filters.status) query.set("status", filters.status);
        if (filters.leadSource) query.set("leadSource", filters.leadSource);
        if (filters.assignedSalesperson)
          query.set("assignedSalesperson", filters.assignedSalesperson);

        const [summaryResponse, leadsResponse] = await Promise.all([
          apiFetch<DashboardSummary>("/api/dashboard/summary", {
            token: currentToken,
          }),
          apiFetch<{ leads: Lead[] }>(`/api/leads?${query.toString()}`, {
            token: currentToken,
          }),
        ]);

        setSummary(summaryResponse);
        setLeads(leadsResponse.leads);
        setSelectedLeadId(
          (previous) => previous ?? leadsResponse.leads[0]?._id ?? null,
        );
      } catch (requestError) {
        setFeedback(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load dashboard.",
        );
        if (
          requestError instanceof Error &&
          requestError.message.toLowerCase().includes("unauthorized")
        ) {
          clearSession();
          router.replace("/signin");
        }
      } finally {
        setLoading(false);
      }
    },
    [filters, router],
  );

  useEffect(() => {
    // The dashboard fetch intentionally starts after hydration so the token and filters are available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboard(token);
    // The fetch is intentionally driven by token + filters so the list stays live.
  }, [token, loadDashboard]);

  function resetForm() {
    setLeadForm(emptyForm);
    setEditingLeadId(null);
    setFeedback("");
  }

  function beginEditLead(lead: Lead) {
    setEditingLeadId(lead._id);
    setLeadForm({
      leadName: lead.leadName,
      companyName: lead.companyName,
      email: lead.email,
      phoneNumber: lead.phoneNumber,
      leadSource: lead.leadSource,
      assignedSalesperson: lead.assignedSalesperson,
      status: lead.status,
      estimatedDealValue: String(lead.estimatedDealValue),
    });
    setSelectedLeadId(lead._id);
  }

  async function handleLeadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setSaving(true);
    setFeedback("");

    const payload = {
      ...leadForm,
      estimatedDealValue: Number(leadForm.estimatedDealValue || 0),
    };

    try {
      if (editingLeadId) {
        await apiFetch(`/api/leads/${editingLeadId}`, {
          method: "PUT",
          token,
          body: JSON.stringify(payload),
        });
        setFeedback("Lead updated successfully.");
      } else {
        await apiFetch(`/api/leads`, {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
        setFeedback("Lead created successfully.");
      }

      resetForm();
      await loadDashboard(token);
    } catch (requestError) {
      setFeedback(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save lead.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openDeleteLeadModal(lead: Lead) {
    setLeadToDelete(lead);
  }

  async function handleNoteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !selectedLeadId || !selectedLead || !noteContent.trim()) {
      return;
    }

    try {
      console.log(`Creating note for lead ${selectedLeadId}`);
      const response = await apiFetch(`/api/leads/${selectedLeadId}/notes`, {
        method: "POST",
        token,
        body: JSON.stringify({ content: noteContent }),
      });
      console.log("Note created:", response);
      setNoteContent("");
      setFeedback("Note added to the lead.");
      await loadDashboard(token);
    } catch (requestError) {
      console.error("Note creation error:", requestError);
      setFeedback(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add note.",
      );
    }
  }

  async function confirmDeleteLead(leadId: string) {
    if (!token) {
      return;
    }

    try {
      await apiFetch(`/api/leads/${leadId}`, {
        method: "DELETE",
        token,
      });
      setFeedback("Lead deleted.");
      if (selectedLeadId === leadId) {
        setSelectedLeadId(null);
      }
      setLeadToDelete(null);
      await loadDashboard(token);
    } catch (requestError) {
      setFeedback(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete lead.",
      );
    }
  }

  const metricCards = [
    ["Total leads", summary?.metrics.totalLeads ?? 0],
    ["New leads", summary?.metrics.newLeads ?? 0],
    ["Qualified", summary?.metrics.qualifiedLeads ?? 0],
    ["Won", summary?.metrics.wonLeads ?? 0],
    ["Lost", summary?.metrics.lostLeads ?? 0],
    [
      "Estimated value",
      `$${(summary?.metrics.totalEstimatedDealValue ?? 0).toLocaleString()}`,
    ],
    [
      "Won value",
      `$${(summary?.metrics.totalWonDealValue ?? 0).toLocaleString()}`,
    ],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="glass-panel flex flex-col gap-4 rounded-lg border border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-600">
              Customer dashboard
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-900">
              Good to see you, {userName}.
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Use this workspace to manage leads, notes, and pipeline activity
              in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
            >
              New lead
            </button>
            <AppNav active="dashboard" userName={userName} />
          </div>
        </header>

        {/* Top summary uses boxed panels to guide the customer through the workflow. */}
        <section className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-panel rounded-4xl border border-slate-200 p-4 md:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-600">
              Workspace overview
            </p>
            <h2 className="mt-4 max-w-2xl text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
              Create, review, and update every lead from a single clean
              workspace.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              This CRM keeps the key actions visible: create a lead, view the
              full record, edit or delete when needed, and add notes after every
              interaction.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Create", "Capture a new lead quickly."],
                ["View", "Open full lead details and notes."],
                ["Update", "Edit, delete, and add follow-ups."],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-600">
                    {title}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-600">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-4xl border border-slate-200 p-4 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-600">
              Customer activities
            </p>
            <div className="mt-5 space-y-3">
              {[
                "Create a lead from the form below.",
                "View lead details in the detail panel.",
                "Edit or delete a lead from the table.",
                "Add a note after calls or meetings.",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-xs leading-5 text-slate-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {metricCards.map(([label, value], index) => (
            <div
              key={label}
              className="glass-panel rounded-lg border border-slate-200 p-4 md:p-5"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <p className="text-xs text-slate-600">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {value}
              </p>
            </div>
          ))}
        </section>

        {feedback ? (
          <div className="rounded-lg border border-teal-300 bg-teal-50 px-4 py-3 text-xs text-teal-700">
            {feedback}
          </div>
        ) : null}

        <section className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-[0.9fr_1.1fr] xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            {/* Lead creation and editing stay in one place so the customer can manage the full lifecycle without leaving the dashboard. */}
            <div className="glass-panel rounded-lg p-4 md:p-6 border border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                    Lead actions
                  </p>
                  <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-slate-900\">
                    {editingLeadId ? "Edit lead" : "Create lead"}
                  </h2>
                </div>
                {editingLeadId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>

              <form
                className="mt-6 grid gap-3 sm:grid-cols-2"
                onSubmit={handleLeadSubmit}
              >
                {[
                  ["leadName", "Lead name", "Apex Growth"],
                  ["companyName", "Company name", "Apex Labs"],
                  ["email", "Email", "lead@company.com"],
                  ["phoneNumber", "Phone number", "+1 (555) 123-4567"],
                  ["leadSource", "Lead source", "Website"],
                  [
                    "assignedSalesperson",
                    "Assigned salesperson",
                    "Avery Johnson",
                  ],
                ].map(([field, label, placeholder]) => (
                  <label key={field} className="space-y-2">
                    <span className="text-sm font-medium text-slate-200">
                      {label}
                    </span>
                    <input
                      required={
                        field !== "assignedSalesperson" &&
                        field !== "phoneNumber"
                          ? true
                          : field !== "assignedSalesperson"
                      }
                      value={leadForm[field as keyof LeadForm]}
                      onChange={(event) =>
                        setLeadForm((previous) => ({
                          ...previous,
                          [field]: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-300"
                      placeholder={placeholder}
                    />
                  </label>
                ))}

                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-700">
                    Status
                  </span>
                  <select
                    value={leadForm.status}
                    onChange={(event) =>
                      setLeadForm((previous) => ({
                        ...previous,
                        status: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-300"
                  >
                    {Object.keys(statusStyles).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-700">
                    Estimated deal value
                  </span>
                  <input
                    required
                    type="number"
                    min="0"
                    value={leadForm.estimatedDealValue}
                    onChange={(event) =>
                      setLeadForm((previous) => ({
                        ...previous,
                        estimatedDealValue: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-300"
                    placeholder="25000"
                  />
                </label>

                <div className="sm:col-span-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving
                      ? "Saving..."
                      : editingLeadId
                        ? "Update lead"
                        : "Create lead"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Reset form
                  </button>
                </div>
              </form>
            </div>

            <div className="glass-panel rounded-lg p-4 md:p-6 border border-slate-200">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                    Search and filters
                  </p>
                  <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-slate-900\">
                    Refine your pipeline view
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setFilters(defaultFilters)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Clear filters
                </button>
              </div>

              <div className="mt-6 grid gap-2 md:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["search", "Search leads", "Search name, company, or email"],
                  ["status", "Status", "Filter by status"],
                  ["leadSource", "Lead source", "Filter by source"],
                  ["assignedSalesperson", "Salesperson", "Filter by owner"],
                ].map(([field, label, placeholder]) =>
                  field === "search" ? (
                    <label key={field} className="space-y-1 xl:col-span-2">
                      <span className="text-xs font-medium text-slate-700">
                        {label}
                      </span>
                      <input
                        value={filters.search}
                        onChange={(event) =>
                          setFilters((previous) => ({
                            ...previous,
                            search: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-300"
                        placeholder={placeholder}
                      />
                    </label>
                  ) : (
                    <label key={field} className="space-y-1">
                      <span className="text-xs font-medium text-slate-700">
                        {label}
                      </span>
                      <select
                        value={filters[field as keyof FilterState]}
                        onChange={(event) =>
                          setFilters((previous) => ({
                            ...previous,
                            [field]: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-300"
                      >
                        <option value="">All</option>
                        {field === "status"
                          ? Object.keys(statusStyles).map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))
                          : field === "leadSource"
                            ? [
                                "Website",
                                "LinkedIn",
                                "Referral",
                                "Cold email",
                                "Event",
                              ].map((source) => (
                                <option key={source} value={source}>
                                  {source}
                                </option>
                              ))
                            : Array.from(
                                new Set(
                                  leads
                                    .map((lead) => lead.assignedSalesperson)
                                    .filter(Boolean),
                                ),
                              ).map((salesperson) => (
                                <option key={salesperson} value={salesperson}>
                                  {salesperson}
                                </option>
                              ))}
                      </select>
                    </label>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-4xl p-4 md:p-6 border border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                    Lead list
                  </p>
                  <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-slate-900">
                    Your active pipeline
                  </h2>
                </div>
                <span className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 whitespace-nowrap">
                  {loading ? "Refreshing..." : `${leads.length} records`}
                </span>
              </div>

              <div className="mt-4 md:mt-6 overflow-hidden rounded-lg border border-slate-200">
                <div className="max-h-120 md:max-h-136 overflow-x-auto overflow-y-auto\">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Lead</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Value</th>
                        <th className="px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white text-slate-900">
                      {leads.length === 0 ? (
                        <tr>
                          <td
                            className="px-4 py-8 text-center text-slate-500"
                            colSpan={4}
                          >
                            No leads match the current filters.
                          </td>
                        </tr>
                      ) : (
                        leads.map((lead) => (
                          <tr
                            key={lead._id}
                            className={`cursor-pointer transition hover:bg-slate-50 ${
                              selectedLeadId === lead._id ? "bg-slate-100" : ""
                            }`}
                            onClick={() => setSelectedLeadId(lead._id)}
                          >
                            <td className="px-4 py-4 align-top">
                              <p className="font-semibold text-slate-900">
                                {lead.leadName}
                              </p>
                              <p className="text-xs text-slate-600">
                                {lead.companyName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {lead.email}
                              </p>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[lead.status] ?? "border-slate-300 bg-slate-100 text-slate-700"}`}
                              >
                                {lead.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-top text-slate-700">
                              $
                              {Number(lead.estimatedDealValue).toLocaleString()}
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    beginEditLead(lead);
                                  }}
                                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openDeleteLeadModal(lead);
                                  }}
                                  className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              {/* The right-side detail panel gives the customer a fast way to inspect the selected lead without leaving the list. */}
              <div className="glass-panel rounded-lg p-4 md:p-6 border border-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Lead details
                </p>
                {selectedLead ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-semibold text-slate-900">
                        {selectedLead.leadName}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600\">
                        {selectedLead.companyName}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ["Email", selectedLead.email],
                        ["Phone", selectedLead.phoneNumber || "Not added"],
                        ["Source", selectedLead.leadSource],
                        [
                          "Salesperson",
                          selectedLead.assignedSalesperson || "Unassigned",
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                        >
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-600">
                            {label}
                          </p>
                          <p className="mt-2 text-xs font-medium text-slate-900">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-600">
                            Current status
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-900">
                            {selectedLead.status}
                          </p>
                        </div>
                        <p className="text-lg font-semibold text-teal-600">
                          $
                          {Number(
                            selectedLead.estimatedDealValue,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        [
                          "Created date",
                          new Date(selectedLead.createdAt).toLocaleString(),
                        ],
                        [
                          "Last updated",
                          new Date(selectedLead.updatedAt).toLocaleString(),
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-600">
                            {label}
                          </p>
                          <p className="mt-2 text-xs font-medium text-slate-900">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        Notes
                      </p>
                      <div className="mt-3 space-y-2">
                        {selectedLeadNotes.length === 0 ? (
                          <p className="text-xs text-slate-600">
                            No local notes yet. Add the first follow-up update.
                          </p>
                        ) : (
                          selectedLeadNotes.map((note) => (
                            <div
                              key={note._id}
                              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                            >
                              <p className="whitespace-pre-wrap wrap-break-word text-xs leading-5 text-slate-700">
                                {note.content}
                              </p>
                              <p className="mt-3 text-xs text-slate-500">
                                {note.createdBy} ·{" "}
                                {new Date(note.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-slate-600">
                    Select a lead to review the full record.
                  </p>
                )}
              </div>

              <div className="glass-panel rounded-lg p-4 md:p-6 border border-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Add note
                </p>
                <form className="mt-4 space-y-3\" onSubmit={handleNoteSubmit}>
                  <textarea
                    value={noteContent}
                    onChange={(event) => setNoteContent(event.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-300"
                    placeholder="Summarize the call, objections, next steps, or follow-up date."
                  />
                  <button
                    type="submit"
                    disabled={!selectedLeadId}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Save note
                  </button>
                </form>

                <div className="mt-6 space-y-2">
                  <p className="text-xs font-semibold text-slate-900">
                    Recent activity
                  </p>
                  {recentNotes.length ? (
                    recentNotes.map((note) => (
                      <div
                        key={`${note.leadId}-${note._id}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <p className="text-xs font-medium text-slate-900">
                          {note.leadName}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap wrap-break-word text-xs text-slate-700">
                          {note.content}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {note.createdBy} ·{" "}
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600">
                      Recent notes will appear here once you start logging
                      updates.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {leadToDelete ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-red-600">
                Delete lead
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                Remove {leadToDelete.leadName}?
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                This action will permanently delete the lead from the CRM. Notes
                stored for this lead will also be removed.
              </p>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setLeadToDelete(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDeleteLead(leadToDelete._id)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                >
                  Delete lead
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
