"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import { type Company } from "../../data/mock";
import { percent } from "../../lib/utils";
import { SectionTitle } from "../../modules/shared/screen-kit";
import { Button } from "../../components/ui/button";
import { X, Loader2, Edit, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Plus, UserCheck, CheckSquare, Coins, TrendingUp } from "lucide-react";
import { exportToCSV, exportToPDF } from "../../lib/export";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export function ClientsPage({ activeCompany }: { activeCompany: Company }) {
  const [ggmsClients, setGgmsClients] = useState<any[]>([]);
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
  const [totalOpenTasks, setTotalOpenTasks] = useState(0);
  const [totalDueInvoices, setTotalDueInvoices] = useState(0);
  const [avgProfitability, setAvgProfitability] = useState(0);

  const [editingClient, setEditingClient] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    industry: "",
    contacts: "",
    locations: "",
    projects: "",
    profitability: "30",
    notes: "",
    vatNumber: "",
    email: "",
    contactPersonName: "",
    contactPersonNumber: ""
  });

  const fetchClients = (targetPage?: number) => {
    const activePage = targetPage !== undefined ? targetPage : page;
    setLoading(true);
    const compId = activeCompany?.id || "ggms-oman";
    apiFetch<any>(`api/Clients?companyId=${compId}&paginate=true&page=${activePage}&pageSize=${pageSize}&search=${encodeURIComponent(search || "")}`)
      .then((data) => {
        if (!data) {
          setGgmsClients([]);
          setLoading(false);
          return;
        }
        const rawItems = Array.isArray(data) ? data : (data.items || []);
        const mapped = rawItems.map((c: any) => ({
          ...c,
          contacts: Array.isArray(c.contacts)
            ? c.contacts.map((ct: any) => (typeof ct === "string" ? ct : ct?.contactName || ""))
            : [],
          locations: Array.isArray(c.locations)
            ? c.locations.map((l: any) => (typeof l === "string" ? l : l?.locationName || ""))
            : [],
          projects: Array.isArray(c.projects)
            ? c.projects.map((p: any) => (typeof p === "string" ? p : p?.projectName || ""))
            : []
        }));
        setGgmsClients(mapped);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems !== undefined ? data.totalItems : mapped.length);
        setTotalOpenTasks(data.totalOpenTasks || 0);
        setTotalDueInvoices(data.totalDueInvoices || 0);
        setAvgProfitability(data.avgProfitability || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching clients:", err);
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
    fetchClients();
  }, [activeCompany?.id, page, search]);

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({
      id: "",
      name: "",
      industry: "",
      contacts: "",
      locations: "",
      projects: "",
      profitability: "30",
      notes: "",
      vatNumber: "",
      email: "",
      contactPersonName: "",
      contactPersonNumber: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (client: any) => {
    setEditingClient(client);
    setFormData({
      id: client.id,
      name: client.name,
      industry: client.industry || "",
      contacts: client.contacts.join(", "),
      locations: client.locations.join(", "),
      projects: client.projects.join(", "),
      profitability: String(client.profitability || 30),
      notes: client.notes || "",
      vatNumber: client.vatNumber || "",
      email: client.email || "",
      contactPersonName: client.contactPersonName || "",
      contactPersonNumber: client.contactPersonNumber || ""
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
    setEditingClient(null);
    setFormData({
      id: "",
      name: "",
      industry: "",
      contacts: "",
      locations: "",
      projects: "",
      profitability: "30",
      notes: "",
      vatNumber: "",
      email: "",
      contactPersonName: "",
      contactPersonNumber: ""
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Client Name is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    const parsedContacts = formData.contacts
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c !== "");
    const parsedLocations = formData.locations
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l !== "");
    const parsedProjects = formData.projects
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p !== "");

    const payload = {
      id: editingClient ? formData.id : "",
      name: formData.name.trim(),
      companyId: activeCompany.id,
      industry: formData.industry.trim(),
      notes: formData.notes.trim(),
      profitability: parseInt(formData.profitability) || 0,
      vatNumber: formData.vatNumber.trim(),
      email: formData.email.trim(),
      contactPersonName: formData.contactPersonName.trim(),
      contactPersonNumber: formData.contactPersonNumber.trim(),
      contacts: parsedContacts,
      locations: parsedLocations,
      projects: parsedProjects
    };

    try {
      if (editingClient) {
        await apiFetch(`api/Clients/${editingClient.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("api/Clients", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      closeModal();
      if (!editingClient) {
        setPage(1);
        fetchClients(1);
      } else {
        fetchClients();
      }
    } catch (err: any) {
      console.error("Failed to save client:", err);
      setError(err?.message || "An error occurred while saving the client. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    apiFetch<any[]>(`api/Clients?companyId=${activeCompany.id}&paginate=false&search=${search}`)
      .then((data) => {
        const mapped = data.map((c: any) => ({
          ...c,
          contacts: c.contacts?.map((ct: any) => ct.contactName) || [],
          locations: c.locations?.map((l: any) => l.locationName) || [],
          projects: c.projects?.map((p: any) => p.projectName) || []
        }));
        const headers = ["ID", "Name", "Industry", "VAT Number", "Email", "Contact Person", "Phone", "Profitability", "Notes"];
        const keys = ["id", "name", "industry", "vatNumber", "email", "contactPersonName", "contactPersonNumber", "profitability", "notes"];
        exportToCSV(mapped, headers, keys, "Clients_List");
      })
      .catch((err) => console.error("Export failed:", err));
  };

  const handleExportPDF = () => {
    apiFetch<any[]>(`api/Clients?companyId=${activeCompany.id}&paginate=false&search=${search}`)
      .then((data) => {
        const mapped = data.map((c: any) => ({
          ...c,
          contacts: c.contacts?.map((ct: any) => ct.contactName) || [],
          locations: c.locations?.map((l: any) => l.locationName) || [],
          projects: c.projects?.map((p: any) => p.projectName) || []
        }));
        const headers = ["ID", "Client Name", "Industry", "VAT Number", "Email", "Contact Person", "Phone"];
        const keys = ["id", "name", "industry", "vatNumber", "email", "contactPersonName", "contactPersonNumber"];
        exportToPDF("GGMS Clients List", mapped, headers, keys);
      })
      .catch((err) => console.error("Export failed:", err));
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Clients"
        subtitle="GGMS Oman customer list with delivery, finance, asset, and credential signals."
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Active Clients
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {totalItems} Accounts
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Open CRM Tasks
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight text-amber-600">
              {totalOpenTasks} Tasks
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 shrink-0">
            <Coins className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Invoices Due
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight text-purple-600">
              {totalDueInvoices} Bills
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-555 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Avg. Profitability
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight text-emerald-600">
              {percent(avgProfitability)}
            </span>
          </div>
        </div>
      </div>

      {/* Search and export actions container */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
        <div className="flex-1 w-full sm:max-w-sm">
          <input
            type="text"
            placeholder="Search clients by name or industry..."
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
            <Plus className="h-4 w-4" /> New Client
          </Button>
        </div>
      </div>

      {/* Clients Card Table */}
      <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">Customer Directory</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Manage customer contracts, contact points, and profit indicators</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading && ggmsClients.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-200/80 border-b border-slate-300 text-[10px] font-extrabold uppercase text-slate-800 tracking-wider">
                  <th className="p-3.5 w-20 text-center">ID</th>
                  <th className="p-3.5">Client Profile</th>
                  <th className="p-3.5">Industry</th>
                  <th className="p-3.5">Locations</th>
                  <th className="p-3.5">Projects</th>
                  <th className="p-3.5 w-28 text-center">Open Tasks</th>
                  <th className="p-3.5 w-28 text-center">Bills Due</th>
                  <th className="p-3.5 w-28 text-center">Profitability</th>
                  <th className="p-3.5 w-32 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 font-semibold">
                {ggmsClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-200/60 transition duration-150">
                    <td className="p-3.5 font-bold text-slate-400 text-center font-mono">{client.id}</td>
                    <td className="p-3.5">
                      <span className="font-bold block text-slate-950 text-xs">{client.name}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{client.email || client.contacts.join(", ") || "No email"}</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-600">{client.industry || "General"}</td>
                    <td className="p-3.5 text-slate-605">{client.locations.join(", ") || "Not set"}</td>
                    <td className="p-3.5 text-slate-700">{client.projects.join(", ") || "None"}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-500">{client.openTasks}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-800">{client.invoicesDue}</td>
                    <td className="p-3.5 text-center">
                      <Badge
                        variant={client.profitability < 20 ? "warning" : "success"}
                        className="font-bold text-[10px] px-2 py-0.5 rounded"
                      >
                        {percent(client.profitability)}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <div className="flex justify-center items-center">
                        <button
                          onClick={() => openEditModal(client)}
                          className="inline-flex h-8 px-2.5 items-center gap-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition active:scale-95"
                          title="Edit Customer"
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {ggmsClients.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                      No customer accounts found. Click "New Client" to create one.
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
          Showing <span className="font-extrabold text-slate-900">{ggmsClients.length}</span> of{" "}
          <span className="font-extrabold text-slate-900">{totalItems}</span> Customers
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
          <span className="text-slate-650 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-150 font-extrabold">
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
                <h3 className="text-base font-extrabold text-slate-900">{editingClient ? "Edit Client Profile" : "Add Client Profile"}</h3>
                <p className="text-xs text-slate-500 font-semibold">{editingClient ? "Update client details and system parameters." : "Create a new customer profile with default system parameters."}</p>
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
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smart Tech Co."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OM110022334"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Email ID
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. info@client.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Operations"
                    value={formData.contactPersonName}
                    onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +968 99112233"
                    value={formData.contactPersonNumber}
                    onChange={(e) => setFormData({ ...formData, contactPersonNumber: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Industry
                </label>
                <input
                  type="text"
                  placeholder="e.g. Telecommunications"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Contacts <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe, Jane Smith"
                  value={formData.contacts}
                  onChange={(e) => setFormData({ ...formData, contacts: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Locations <span className="text-slate-400 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Muscat, Sohar"
                    value={formData.locations}
                    onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Projects <span className="text-slate-400 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CCTV Install, AMC Contract"
                    value={formData.projects}
                    onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Profitability (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 30"
                    value={formData.profitability}
                    onChange={(e) => setFormData({ ...formData, profitability: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-805 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional client details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold resize-none"
                />
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
                    "Save Client"
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
