"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { type Company } from "../../data/mock";
import { SectionTitle } from "../../modules/shared/screen-kit";
import { Button } from "../../components/ui/button";
import { X, Loader2, Edit, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Plus, Truck, Receipt, ClipboardCheck } from "lucide-react";
import { exportToCSV, exportToPDF } from "../../lib/export";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export function SuppliersPage({ activeCompany }: { activeCompany: Company }) {
  const [ggmsSuppliers, setGgmsSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);

  // Pagination & search states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const [search, setSearch] = useState("");

  // Aggregate KPIs
  const [totalActiveOrders, setTotalActiveOrders] = useState(0);
  const [totalDueBills, setTotalDueBills] = useState(0);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    category: "",
    vatNumber: "",
    email: "",
    contactPersonName: "",
    contactPersonNumber: "",
    activeOrders: "0",
    billsDue: "0",
    notes: ""
  });

  const fetchSuppliers = (targetPage?: number) => {
    const activePage = targetPage !== undefined ? targetPage : page;
    setLoading(true);
    apiFetch<any>(`api/Suppliers?companyId=${activeCompany.id}&paginate=true&page=${activePage}&pageSize=${pageSize}&search=${search}`)
      .then((data) => {
        setGgmsSuppliers(data.items);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
        setTotalActiveOrders(data.totalActiveOrders);
        setTotalDueBills(data.totalDueBills);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching suppliers:", err);
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
    fetchSuppliers();
  }, [activeCompany.id, page, search]);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      id: "",
      name: "",
      category: "",
      vatNumber: "",
      email: "",
      contactPersonName: "",
      contactPersonNumber: "",
      activeOrders: "0",
      billsDue: "0",
      notes: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: any) => {
    setEditingSupplier(supplier);
    setFormData({
      id: supplier.id,
      name: supplier.name,
      category: supplier.category || "",
      vatNumber: supplier.vatNumber || "",
      email: supplier.email || "",
      contactPersonName: supplier.contactPersonName || "",
      contactPersonNumber: supplier.contactPersonNumber || "",
      activeOrders: String(supplier.activeOrders ?? 0),
      billsDue: String(supplier.billsDue ?? 0),
      notes: supplier.notes || ""
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
    setEditingSupplier(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.name.trim()) {
      setError("Supplier ID and Name are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      id: formData.id.trim(),
      name: formData.name.trim(),
      companyId: activeCompany.id,
      category: formData.category.trim(),
      vatNumber: formData.vatNumber.trim(),
      email: formData.email.trim(),
      contactPersonName: formData.contactPersonName.trim(),
      contactPersonNumber: formData.contactPersonNumber.trim(),
      notes: formData.notes.trim(),
      activeOrders: parseInt(formData.activeOrders) || 0,
      billsDue: parseInt(formData.billsDue) || 0
    };

    try {
      if (editingSupplier) {
        // Edit mode (PUT)
        await apiFetch(`api/Suppliers/${editingSupplier.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        // Create mode (POST)
        await apiFetch("api/Suppliers", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      closeModal();
      if (!editingSupplier) {
        setPage(1);
        fetchSuppliers(1);
      } else {
        fetchSuppliers();
      }
    } catch (err: any) {
      console.error("Failed to save supplier:", err);
      setError(err?.message || "An error occurred while saving the supplier.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    apiFetch<any>(`api/Suppliers?companyId=${activeCompany.id}&paginate=false&search=${search}`)
      .then((data) => {
        const headers = ["ID", "Name", "Category", "VAT Number", "Email", "Contact Person", "Contact Number", "Active Orders", "Bills Due", "Notes"];
        const keys = ["id", "name", "category", "vatNumber", "email", "contactPersonName", "contactPersonNumber", "activeOrders", "billsDue", "notes"];
        exportToCSV(data, headers, keys, "Suppliers_List");
      })
      .catch((err) => console.error("Export failed:", err));
  };

  const handleExportPDF = () => {
    apiFetch<any>(`api/Suppliers?companyId=${activeCompany.id}&paginate=false&search=${search}`)
      .then((data) => {
        const headers = ["ID", "Supplier Name", "Category", "VAT Number", "Email", "Contact Person", "Phone"];
        const keys = ["id", "name", "category", "vatNumber", "email", "contactPersonName", "contactPersonNumber"];
        exportToPDF("GGMS Suppliers List", data, headers, keys);
      })
      .catch((err) => console.error("Export failed:", err));
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Suppliers"
        subtitle="Manage vendor records, contact profiles, active purchase orders, and outstanding payables."
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            <Truck className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Total Suppliers
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight font-mono">
              {totalItems} Vendors
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Active PO Orders
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight text-amber-600 font-mono">
              {totalActiveOrders} POs
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 shrink-0">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Bills Outstanding
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight text-purple-650 font-mono">
              {totalDueBills} Bills
            </span>
          </div>
        </div>
      </div>

      {/* Search and export actions container */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
        <div className="flex-1 w-full sm:max-w-sm">
          <input
            type="text"
            placeholder="Search suppliers by name or category..."
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
            <Plus className="h-4 w-4" /> New Supplier
          </Button>
        </div>
      </div>

      {/* Suppliers Table Card */}
      <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">Supplier Directory</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Manage partner supply categories, VAT coordinates, and balance histories</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading && ggmsSuppliers.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-200/80 border-b border-slate-300 text-[10px] font-extrabold uppercase text-slate-800 tracking-wider">
                  <th className="p-3.5 w-20 text-center">Code</th>
                  <th className="p-3.5">Supplier Profile</th>
                  <th className="p-3.5 w-40">Category</th>
                  <th className="p-3.5 w-40">VAT Number</th>
                  <th className="p-3.5">Contact Person</th>
                  <th className="p-3.5 w-28 text-center">Active POs</th>
                  <th className="p-3.5 w-32 text-center">Outstanding Bills</th>
                  <th className="p-3.5 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 font-semibold">
                {ggmsSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-200/60 transition duration-150">
                    <td className="p-3.5 font-bold text-slate-400 text-center font-mono">{supplier.id}</td>
                    <td className="p-3.5">
                      <span className="font-bold block text-slate-950 text-xs">{supplier.name}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{supplier.email || "No email info"}</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-600">{supplier.category || "General Supply"}</td>
                    <td className="p-3.5 font-mono text-slate-500">{supplier.vatNumber || "N/A"}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-705 block">{supplier.contactPersonName || "N/A"}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{supplier.contactPersonNumber}</span>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-550">{supplier.activeOrders}</td>
                    <td className="p-3.5 text-center font-mono font-black text-slate-900">{supplier.billsDue} Bills</td>
                    <td className="p-3.5 text-center">
                      <div className="flex justify-center items-center">
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="inline-flex h-8 px-2.5 items-center gap-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition active:scale-95"
                          title="Edit Supplier"
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {ggmsSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                      No supplier records found. Click "New Supplier" to register one.
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
          Showing <span className="font-extrabold text-slate-900">{ggmsSuppliers.length}</span> of{" "}
          <span className="font-extrabold text-slate-900">{totalItems}</span> Suppliers
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
                <h3 className="text-base font-extrabold text-slate-900">{editingSupplier ? "Edit Supplier Profile" : "Register New Supplier"}</h3>
                <p className="text-xs text-slate-500 font-semibold">Specify vendor details, tax registrations, and contact credentials.</p>
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
                    Supplier ID *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingSupplier !== null}
                    placeholder="e.g. muscat-tech"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold disabled:opacity-50 disabled:bg-slate-100"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muscat Tech Co."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IT Equipment"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-805 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OM550099881"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-805 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
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
                    placeholder="e.g. Salim Al Jabri"
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
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. contact@supplier.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Active Orders
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.activeOrders}
                    onChange={(e) => setFormData({ ...formData, activeOrders: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Bills Outstanding
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.billsDue}
                    onChange={(e) => setFormData({ ...formData, billsDue: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Remarks or payment terms..."
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
                    "Save Supplier"
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
