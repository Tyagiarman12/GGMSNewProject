"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SectionTitle, ConfirmDeleteModal } from "../../modules/shared/screen-kit";
import { Plus, Edit, Trash2, X, Ruler, CheckCircle2, Loader2 } from "lucide-react";
import type { Company } from "../../data/mock";
import type { UomItem } from "../shared/domain";
import { apiFetch } from "../../lib/api";

export function UomMasterPage({ activeCompany }: { activeCompany: Company }) {
  const [uoms, setUoms] = useState<UomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUom, setEditingUom] = useState<UomItem | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUoms = () => {
    setLoading(true);
    apiFetch<UomItem[]>(`api/Uoms?companyId=${activeCompany.id}`)
      .then((data) => {
        setUoms(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading UOM records:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUoms();
  }, [activeCompany.id]);

  const openAddModal = () => {
    setEditingUom(null);
    setName("");
    setDescription("");
    setIsModalOpen(true);
  };

  const openEditModal = (uom: UomItem) => {
    setEditingUom(uom);
    setName(uom.name);
    setDescription(uom.description || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUom(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      companyId: activeCompany.id
    };

    if (editingUom) {
      apiFetch<UomItem>(`api/Uoms/${editingUom.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })
        .then(() => {
          fetchUoms();
          closeModal();
          setIsSubmitting(false);
        })
        .catch((err) => {
          console.error("Error updating UOM:", err);
          alert(err.message || "Failed to update UOM.");
          setIsSubmitting(false);
        });
    } else {
      apiFetch<UomItem>("api/Uoms", {
        method: "POST",
        body: JSON.stringify(payload)
      })
        .then(() => {
          fetchUoms();
          closeModal();
          setIsSubmitting(false);
        })
        .catch((err) => {
          console.error("Error creating UOM:", err);
          alert(err.message || "Failed to create UOM.");
          setIsSubmitting(false);
        });
    }
  };

  const [deletingUom, setDeletingUom] = useState<UomItem | null>(null);

  const confirmDeleteUom = () => {
    if (!deletingUom) return;
    apiFetch(`api/Uoms/${deletingUom.id}`, { method: "DELETE" })
      .then(() => {
        fetchUoms();
        setDeletingUom(null);
      })
      .catch((err) => {
        console.error("Error deleting UOM:", err);
        alert("Failed to delete UOM record.");
        setDeletingUom(null);
      });
  };

  const filteredUoms = uoms.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.description && u.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <SectionTitle
        title="UOM Master"
        subtitle="Manage Units of Measurement (e.g. Pcs, Meter, Box, Kg, Set) used across inventory and invoicing."
        action={
          <Button
            variant="primary"
            onClick={openAddModal}
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 px-5 active:scale-98 transition"
          >
            <Plus className="h-4 w-4" /> Add New UOM
          </Button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            <Ruler className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Total UOM Master Units
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {uoms.length} Units
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Active Operational Status
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              Fully Compliant
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Ruler className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Company Context
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              GGMS Oman
            </span>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">Unit of Measurement Records</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Master standard quantity measurement units</p>
          </div>
          <input
            type="text"
            placeholder="Search UOM name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span>Loading UOM records...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-200/80 border-b border-slate-300 text-[10px] font-extrabold uppercase text-slate-800 tracking-wider">
                  <th className="p-3.5 w-16 text-center">#</th>
                  <th className="p-3.5">UOM Code / Name</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 font-semibold">
                {filteredUoms.map((uom, idx) => (
                  <tr key={uom.id} className="hover:bg-slate-200/60 transition duration-150">
                    <td className="p-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <span className="h-6 px-2.5 rounded-md bg-blue-50 text-blue-700 font-extrabold border border-blue-200/60 inline-flex items-center text-xs">
                        {uom.name}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">
                      {uom.description || "—"}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(uom)}
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition"
                          title="Edit UOM"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingUom(uom)}
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center transition"
                          title="Delete UOM"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUoms.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">
                      No UOM records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit UOM Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Ruler className="h-5 w-5 text-blue-600" />
                {editingUom ? "Edit UOM Record" : "Add New UOM Record"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  UOM Name / Symbol <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pcs, Meter, Box, Kg, Set"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Description / Specification
                </label>
                <input
                  type="text"
                  placeholder="e.g. Individual pieces or units"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={closeModal}
                  className="h-10 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="primary"
                  className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {editingUom ? "Save Changes" : "Create UOM"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingUom}
        title="Delete UOM Record"
        description="Are you sure you want to delete this unit of measurement record? This action cannot be undone."
        itemName={deletingUom?.name}
        onConfirm={confirmDeleteUom}
        onClose={() => setDeletingUom(null)}
      />
    </div>
  );
}
