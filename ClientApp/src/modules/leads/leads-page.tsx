"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import type { Company } from "../../data/mock";
import { money } from "../../lib/utils";
import { SectionTitle } from "../../modules/shared/screen-kit";
import { Button } from "../../components/ui/button";
import { X, Loader2, Edit, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Plus, Target, Flame, DollarSign, CalendarRange } from "lucide-react";
import { exportToCSV, exportToPDF } from "../../lib/export";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export function LeadsPage({ activeCompany }: { activeCompany: Company }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Pagination & search states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const [search, setSearch] = useState("");

  // Aggregate KPIs
  const [hotLeads, setHotLeads] = useState(0);
  const [pipelineValue, setPipelineValue] = useState(0);
  const [overdueFollowUps, setOverdueFollowUps] = useState(0);

  const [formData, setFormData] = useState({
    clientName: "",
    contact: "",
    requirement: "",
    value: "",
    status: "New",
    owner: "Sales",
    nextFollowUp: "Today"
  });

  const fetchLeads = (targetPage?: number) => {
    const activePage = targetPage !== undefined ? targetPage : page;
    setLoading(true);
    apiFetch<any>(`api/Leads?companyId=${activeCompany.id}&paginate=true&page=${activePage}&pageSize=${pageSize}&search=${search}`)
      .then((data) => {
        const mapped = data.items.map((l: any) => ({
          ...l,
          client: l.clientName
        }));
        setLeads(mapped);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
        setHotLeads(data.hotLeads);
        setPipelineValue(data.pipelineValue);
        setOverdueFollowUps(data.overdueFollowUps);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching leads:", err);
        setLoading(false);
      });
  };

  // Debounce search input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchVal);
      setPage(1);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchVal]);

  useEffect(() => {
    fetchLeads();
  }, [activeCompany.id, page, search]);

  const [editingLead, setEditingLead] = useState<any | null>(null);

  const openAddModal = () => {
    setEditingLead(null);
    setFormData({
      clientName: "",
      contact: "",
      requirement: "",
      value: "",
      status: "New",
      owner: "Sales",
      nextFollowUp: "Today"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (lead: any) => {
    setEditingLead(lead);
    setFormData({
      clientName: lead.clientName,
      contact: lead.contact || "",
      requirement: lead.requirement || "",
      value: String(lead.value ?? ""),
      status: lead.status || "New",
      owner: lead.owner || "Sales",
      nextFollowUp: lead.nextFollowUp || "Today"
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
    setEditingLead(null);
    setFormData({
      clientName: "",
      contact: "",
      requirement: "",
      value: "",
      status: "New",
      owner: "Sales",
      nextFollowUp: "Today"
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      setError("Client Name is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      clientName: formData.clientName.trim(),
      contact: formData.contact.trim(),
      requirement: formData.requirement.trim(),
      value: parseFloat(formData.value) || 0,
      status: formData.status,
      owner: formData.owner.trim() || "Sales",
      nextFollowUp: formData.nextFollowUp
    };

    try {
      if (editingLead) {
        await apiFetch(`api/Leads/${editingLead.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("api/Leads", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      closeModal();
      if (!editingLead) {
        setPage(1);
        fetchLeads(1);
      } else {
        fetchLeads();
      }
    } catch (err: any) {
      console.error("Failed to save lead:", err);
      setError(err?.message || "An error occurred while saving the lead. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    apiFetch<any[]>(`api/Leads?companyId=${activeCompany.id}&paginate=false&search=${search}`)
      .then((data) => {
        const headers = ["ID", "Client", "Contact", "Requirement", "Value", "Status", "Owner", "Next Follow-up"];
        const keys = ["id", "clientName", "contact", "requirement", "value", "status", "owner", "nextFollowUp"];
        exportToCSV(data, headers, keys, "Leads_List");
      })
      .catch((err) => console.error("Export failed:", err));
  };

  const handleExportPDF = () => {
    apiFetch<any[]>(`api/Leads?companyId=${activeCompany.id}&paginate=false&search=${search}`)
      .then((data) => {
        const headers = ["ID", "Client", "Contact", "Requirement", "Value", "Status", "Owner", "Next Follow-up"];
        const keys = ["id", "clientName", "contact", "requirement", "value", "status", "owner", "nextFollowUp"];
        exportToPDF("GGMS Leads Pipeline", data, headers, keys);
      })
      .catch((err) => console.error("Export failed:", err));
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Leads"
        subtitle="GGMS Oman lead pipeline, follow-up ownership, and next action visibility."
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Total Active Leads
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight font-mono">
              {totalItems}
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Hot Opportunities
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight text-red-600 font-mono">
              {hotLeads} Hot
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-555 shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Pipeline Value
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight font-mono">
              {money(pipelineValue, activeCompany.currency)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Overdue Actions
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight text-amber-600 font-mono">
              {overdueFollowUps} Alerts
            </span>
          </div>
        </div>
      </div>

      {/* Search and export actions container */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
        <div className="flex-1 w-full sm:max-w-sm">
          <input
            type="text"
            placeholder="Search leads by client name, requirement, status, owner..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-955 placeholder-slate-400 outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="secondary"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 h-10 border border-slate-200 rounded-xl font-bold text-xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 h-10 border border-slate-200 rounded-xl font-bold text-xs"
          >
            <FileText className="h-4 w-4 text-red-650" /> Export PDF
          </Button>
          <Button
            variant="primary"
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-xl shadow-md shadow-blue-500/10 flex items-center gap-1.5 transition active:scale-98 text-xs px-4"
          >
            <Plus className="h-4 w-4" /> New Lead
          </Button>
        </div>
      </div>

      {/* Leads Table Card */}
      <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">Lead Pipeline Register</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Track deal progress, potential contract valuations, and follow-up activities</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading && leads.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-200/80 border-b border-slate-300 text-[10px] font-extrabold uppercase text-slate-800 tracking-wider">
                  <th className="p-3.5 w-20 text-center">ID</th>
                  <th className="p-3.5">Client & Contact</th>
                  <th className="p-3.5">Requirement Details</th>
                  <th className="p-3.5 w-36 text-right">Pipeline Value</th>
                  <th className="p-3.5 w-28 text-center">Status</th>
                  <th className="p-3.5 w-32">Representative</th>
                  <th className="p-3.5 w-36 text-center">Next Action</th>
                  <th className="p-3.5 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 font-semibold">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-200/60 transition duration-150">
                    <td className="p-3.5 font-bold text-slate-400 text-center font-mono">{lead.id}</td>
                    <td className="p-3.5">
                      <span className="font-bold block text-slate-900">{lead.client}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{lead.contact || "No contact"}</span>
                    </td>
                    <td className="p-3.5 text-slate-655 font-bold">{lead.requirement}</td>
                    <td className="p-3.5 font-mono text-right text-slate-900 font-extrabold">{money(lead.value, activeCompany.currency)}</td>
                    <td className="p-3.5 text-center">
                      <Badge
                        variant={lead.status === "Hot" ? "danger" : lead.status === "New" ? "info" : "warning"}
                        className="font-bold text-[10px] px-2 py-0.5 rounded"
                      >
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-700 font-bold">{lead.owner}</td>
                    <td className="p-3.5 text-center">
                      <Badge
                        variant={lead.nextFollowUp === "Overdue" ? "danger" : "default"}
                        className="font-bold text-[10px] px-2 py-0.5 rounded-full"
                      >
                        {lead.nextFollowUp}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <div className="flex justify-center items-center">
                        <button
                          onClick={() => openEditModal(lead)}
                          className="inline-flex h-8 px-2.5 items-center gap-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition active:scale-95"
                          title="Edit Lead"
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                      No leads found in sales pipeline. Click "New Lead" to register one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between bg-white px-5 py-4.5 rounded-2xl border border-slate-100 shadow-sm text-xs font-bold text-slate-500">
        <span>
          Showing <span className="font-extrabold text-slate-900">{leads.length}</span> of{" "}
          <span className="font-extrabold text-slate-900">{totalItems}</span> Pipeline Leads
        </span>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs h-9 border border-slate-200"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </Button>
          <span className="text-slate-655 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-150 font-extrabold">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs h-9 border border-slate-200"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/65 backdrop-blur-md p-4 overflow-y-auto animate-fade-in"
        >
          <div className="relative bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{editingLead ? "Edit Lead Profile" : "Create New Lead"}</h3>
                <p className="text-xs text-slate-500 font-semibold">{editingLead ? "Update details for this sales pipeline entry." : "Create a new sales pipeline entry."}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 font-semibold">
              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-655 border border-red-100 font-bold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Barka Poultry"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Requirement
                </label>
                <input
                  type="text"
                  placeholder="e.g. CCTV AMC Support"
                  value={formData.requirement}
                  onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Value ({activeCompany.currency || "OMR"})
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="e.g. 1200"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-mono font-bold text-right"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  >
                    <option value="New">New</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Hot">Hot</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Owner
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sales"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-850 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Next Follow-up
                  </label>
                  <select
                    value={formData.nextFollowUp}
                    onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
                    className="block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Next week">Next week</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  disabled={submitting}
                  className="h-10 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 rounded-xl shadow-md shadow-blue-500/10 min-w-[90px]"
                >
                  {submitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save Lead"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
