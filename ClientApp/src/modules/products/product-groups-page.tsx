"use client";

import { useMemo, useState, useEffect } from "react";
import { Badge } from "../../components/ui/badge";
import { SectionTitle, ConfirmDeleteModal } from "../../modules/shared/screen-kit";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Plus, Boxes, Layers, Percent, Edit, Trash2, X, Loader2, CheckCircle2 } from "lucide-react";
import type { Company } from "../../data/mock";
import type { ProductGroupItem, ProductItem } from "../../modules/shared/domain";
import { apiFetch } from "../../lib/api";

export function ProductGroupsPage({
  activeCompany,
  products
}: {
  activeCompany: Company;
  products: ProductItem[];
}) {
  const [productGroups, setProductGroups] = useState<ProductGroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form & Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProductGroupItem | null>(null);
  const [name, setName] = useState("");
  const [vatPercentage, setVatPercentage] = useState<"5.0" | "0.0">("5.0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGroups = () => {
    setLoading(true);
    apiFetch<ProductGroupItem[]>(`api/ProductGroups?companyId=${activeCompany.id}`)
      .then((data) => {
        setProductGroups(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading product groups:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGroups();
  }, [activeCompany.id]);

  const groupsWithMetrics = useMemo(() => {
    return productGroups.map(group => {
      const matchedProducts = products.filter(p =>
        p.category === group.name || p.productGroupId === group.id
      );
      const itemsCount = matchedProducts.length;
      const stockTotal = matchedProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
      const valueTotal = matchedProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.buyPrice || 0)), 0);

      return {
        ...group,
        itemsCount,
        stockTotal,
        valueTotal
      };
    });
  }, [productGroups, products]);

  const openAddModal = () => {
    setEditingGroup(null);
    setName("");
    setVatPercentage("5.0");
    setIsModalOpen(true);
  };

  const openEditModal = (group: ProductGroupItem) => {
    setEditingGroup(group);
    setName(group.name);
    setVatPercentage(group.vatPercentage === 0 ? "0.0" : "5.0");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const payload = {
      name: name.trim(),
      vatPercentage: parseFloat(vatPercentage),
      companyId: activeCompany.id
    };

    if (editingGroup) {
      apiFetch<ProductGroupItem>(`api/ProductGroups/${editingGroup.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })
        .then(() => {
          fetchGroups();
          closeModal();
          setIsSubmitting(false);
        })
        .catch((err) => {
          console.error("Error updating Product Group:", err);
          alert(err.message || "Failed to update Product Group.");
          setIsSubmitting(false);
        });
    } else {
      apiFetch<ProductGroupItem>("api/ProductGroups", {
        method: "POST",
        body: JSON.stringify(payload)
      })
        .then(() => {
          fetchGroups();
          closeModal();
          setIsSubmitting(false);
        })
        .catch((err) => {
          console.error("Error creating Product Group:", err);
          alert(err.message || "Failed to create Product Group.");
          setIsSubmitting(false);
        });
    }
  };

  const [deletingGroup, setDeletingGroup] = useState<ProductGroupItem | null>(null);

  const confirmDeleteGroup = () => {
    if (!deletingGroup) return;
    apiFetch(`api/ProductGroups/${deletingGroup.id}`, { method: "DELETE" })
      .then(() => {
        fetchGroups();
        setDeletingGroup(null);
      })
      .catch((err) => {
        console.error("Error deleting Product Group:", err);
        alert("Failed to delete Product Group.");
        setDeletingGroup(null);
      });
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Product Groups"
        subtitle="Define inventory groupings, tax percentage compliance (5% VAT / 0% VAT), and stock valuations."
        action={
          <Button
            variant="primary"
            onClick={openAddModal}
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 px-5 active:scale-98 transition"
          >
            <Plus className="h-4 w-4" /> Create Product Group
          </Button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Total Product Groups
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {productGroups.length} Groups
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Percent className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Standard Tax Rate
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              5% Standard VAT
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Exempt / Zero-Rated Groups
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {productGroups.filter(g => g.vatPercentage === 0).length} Groups
            </span>
          </div>
        </div>
      </div>

      {/* Catalog Product Groups Grid Card */}
      <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">Catalog Product Groups</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Defined inventory categories and assigned VAT rates</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span>Loading product groups...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-200/80 border-b border-slate-300 text-[10px] font-extrabold uppercase text-slate-800 tracking-wider">
                  <th className="p-3.5">Group / Category Name</th>
                  <th className="p-3.5 text-center">VAT Percentage</th>
                  <th className="p-3.5 w-36 text-right">Item Count</th>
                  <th className="p-3.5 w-36 text-right">Total Stock Qty</th>
                  <th className="p-3.5 w-44 text-right">Group Valuation</th>
                  <th className="p-3.5 w-28 text-center">Status</th>
                  <th className="p-3.5 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 font-semibold">
                {groupsWithMetrics.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-200/60 transition duration-150">
                    <td className="p-3.5 font-bold text-slate-900">{g.name}</td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold ${g.vatPercentage === 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                        {g.vatPercentage === 0 ? "0% VAT (Exempt)" : "5% VAT"}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-right text-slate-700 font-bold">{g.itemsCount} Items</td>
                    <td className="p-3.5 font-mono text-right text-slate-800 font-bold">{g.stockTotal} Units</td>
                    <td className="p-3.5 font-mono text-right text-slate-950 font-black">{g.valueTotal.toFixed(2)} OMR</td>
                    <td className="p-3.5 text-center">
                      <Badge
                        variant={g.itemsCount > 0 ? "success" : "default"}
                        className="font-bold text-[10px] px-2 py-0.5 rounded"
                      >
                        {g.itemsCount > 0 ? "Active" : "Empty"}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(g)}
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition"
                          title="Edit Group"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingGroup(g)}
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center transition"
                          title="Delete Group"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {groupsWithMetrics.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                      No product groups registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Product Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                {editingGroup ? "Edit Product Group" : "Add Product Group"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Product Group Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CCTV, Storage, Cable, Software"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  VAT Percentage <span className="text-rose-500">*</span>
                </label>
                <select
                  value={vatPercentage}
                  onChange={(e) => setVatPercentage(e.target.value as "5.0" | "0.0")}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="5.0">5% VAT (Standard Rate)</option>
                  <option value="0.0">0% VAT (Exempt / Zero-Rated)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Products linked to this group will automatically adopt this VAT percentage rate.
                </p>
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
                  {editingGroup ? "Save Changes" : "Create Product Group"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingGroup}
        title="Delete Product Group"
        description="Are you sure you want to delete this product group? Linked products will have their VAT updated. This action cannot be undone."
        itemName={deletingGroup?.name}
        onConfirm={confirmDeleteGroup}
        onClose={() => setDeletingGroup(null)}
      />
    </div>
  );
}
