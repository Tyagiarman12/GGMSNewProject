"use client";

import { useState, useEffect } from "react";
import { 
  X, Loader2, Plus, Trash2, Check, Eye, Edit, Printer, Package, 
  Coins, User, ShoppingCart, Sparkles, AlertTriangle
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import type { Company } from "../../data/mock";
import { money } from "../../lib/utils";
import { apiFetch } from "../../lib/api";
import { SectionTitle, ConfirmDeleteModal } from "../../modules/shared/screen-kit";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export function PurchaseEnquiriesPage({
  activeCompany,
  onConvertToOrder,
  initialQuotation,
  onClearInitialQuotation
}: {
  activeCompany: Company;
  onConvertToOrder?: (enquiryId: string) => void;
  initialQuotation?: any;
  onClearInitialQuotation?: () => void;
}) {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "create" | "detail">("list");
  
  // List parameters
  const [search, setSearch] = useState("");
  
  // Form State
  const [deletingEnquiry, setDeletingEnquiry] = useState<any | null>(null);
  const [editingEnquiry, setEditingEnquiry] = useState<any | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [title, setTitle] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [remarks, setRemarks] = useState("");
  const [enquiryDate, setEnquiryDate] = useState(new Date().toISOString().split("T")[0]);
  const [discountAmount, setDiscountAmount] = useState("0");
  const [enquiryLines, setEnquiryLines] = useState<any[]>([]);
  const [status, setStatus] = useState("Draft");
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");

  // Item Picker State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemUom, setItemUom] = useState("pcs");
  const [itemRate, setItemRate] = useState("");

  // Quick Add Supplier State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierEmail, setNewSupplierEmail] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");

  const [editingLineIdx, setEditingLineIdx] = useState<number | null>(null);

  const handleUpdateLine = (idx: number, field: string, val: any) => {
    setEnquiryLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;
      const updated = { ...line, [field]: val };
      
      // Re-calculate line totals
      const qVal = parseFloat(field === "qty" ? val : updated.qty) || 0;
      const rVal = parseFloat(field === "rate" ? val : updated.rate) || 0;
      const lineAmt = qVal * rVal;
      const vatAmt = lineAmt * 0.05;
      const grossAmt = lineAmt + vatAmt;
      
      return {
        ...updated,
        amount: lineAmt,
        vatAmt,
        grossAmt
      };
    }));
  };

  const fetchEnquiries = () => {
    setLoading(true);
    apiFetch<any[]>(`api/PurchaseEnquiries?companyId=${activeCompany.id}&search=${search}`)
      .then((data) => {
        setEnquiries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching purchase enquiries:", err);
        setLoading(false);
      });
  };

  const fetchReferenceData = () => {
    apiFetch<any[]>(`api/Suppliers?companyId=${activeCompany.id}`)
      .then((data) => setSuppliers(data))
      .catch((err) => console.error("Error fetching suppliers:", err));

    apiFetch<any[]>(`api/Products?companyId=${activeCompany.id}`)
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  };

  useEffect(() => {
    fetchEnquiries();
    fetchReferenceData();
  }, [search]);

  useEffect(() => {
    if (initialQuotation) {
      setEditingEnquiry(null);
      setTitle(`RFQ for Quotation #${initialQuotation.id} - ${initialQuotation.title || ""}`);
      setSalesperson(initialQuotation.salesperson || "");
      setRemarks(`Generated from Sales Quotation #${initialQuotation.id} (Customer: ${initialQuotation.customer || ""})`);
      setEnquiryDate(new Date().toISOString().split("T")[0]);
      setDiscountAmount(String(initialQuotation.discount || 0));
      setStatus("Draft");

      try {
        const parsedLines = JSON.parse(initialQuotation.itemsJson || "[]");
        if (Array.isArray(parsedLines) && parsedLines.length > 0) {
          const mappedLines = parsedLines.map((line: any, idx: number) => {
            const qty = line.qty || line.quantity || 1;
            const rate = line.rate || line.unitPrice || line.unitCost || 0;
            const amount = qty * rate;
            const vatAmt = amount * 0.05;
            const grossAmt = amount + vatAmt;
            return {
              slNo: idx + 1,
              productId: line.productId || line.barcode || "",
              barcode: line.barcode || line.productId || "",
              description: line.description || line.productName || line.itemName || "Item",
              qty,
              uom: line.uom || "pcs",
              rate,
              amount,
              vatPct: 5,
              vatAmt,
              grossAmt
            };
          });
          setEnquiryLines(mappedLines);
        } else {
          setEnquiryLines([]);
        }
      } catch (e) {
        setEnquiryLines([]);
      }

      setViewMode("create");
      if (onClearInitialQuotation) {
        onClearInitialQuotation();
      }
    }
  }, [initialQuotation]);

  // Totals calculations
  const calculateTotals = () => {
    const totalAmount = enquiryLines.reduce((sum, line) => sum + line.amount, 0);
    const discountPct = parseFloat(discountAmount) || 0;
    const discount = (totalAmount * discountPct) / 100;
    const subtotal = totalAmount - discount;
    const vat = subtotal * 0.05;
    const grandTotal = subtotal + vat;

    return {
      totalAmount,
      discountPct,
      discount,
      subtotal,
      vat,
      grandTotal
    };
  };

  const calculatedTotals = calculateTotals();

  // Product helper
  const currentProduct = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    if (currentProduct) {
      setItemRate(String(currentProduct.buyPrice || 0)); // buyPrice for purchases!
    } else {
      setItemRate("");
    }
  }, [selectedProductId]);

  const handleAddLine = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const qty = parseInt(itemQty) || 1;
    const rate = parseFloat(itemRate) || 0;
    const lineAmt = qty * rate;
    const vatAmt = lineAmt * 0.05;
    const grossAmt = lineAmt + vatAmt;

    const newLine = {
      slNo: enquiryLines.length + 1,
      productId: prod.id,
      barcode: prod.id,
      description: prod.name,
      qty,
      uom: itemUom,
      rate,
      amount: lineAmt,
      vatPct: 5,
      vatAmt,
      grossAmt
    };

    setEnquiryLines([...enquiryLines, newLine]);
    
    // Clear picker
    setSelectedProductId("");
    setItemQty("1");
    setItemUom("pcs");
    setItemRate("");
  };

  const handleRemoveLine = (idx: number) => {
    setEnquiryLines(prev => prev.filter((_, i) => i !== idx).map((line, i) => ({ ...line, slNo: i + 1 })));
  };

  const handleSaveEnquiry = async () => {
    if (!supplierName) {
      alert("Supplier is required.");
      return;
    }
    if (enquiryLines.length === 0) {
      alert("At least one enquiry line is required.");
      return;
    }

    const payload = {
      supplierName,
      title: title.trim() || enquiryLines[0]?.description || "Supplier purchase enquiry",
      amount: calculatedTotals.subtotal,
      vat: calculatedTotals.vat,
      status: status,
      date: enquiryDate,
      remarks: remarks.trim(),
      salesperson: salesperson.trim(),
      itemsJson: JSON.stringify(enquiryLines),
      notes: notes.trim(),
      termsAndConditions: termsAndConditions.trim()
    };

    try {
      if (editingEnquiry) {
        await apiFetch(`api/PurchaseEnquiries/${editingEnquiry.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("api/PurchaseEnquiries", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      setViewMode("list");
      fetchEnquiries();
      // Clear fields
      setSupplierName("");
      setTitle("");
      setSalesperson("");
      setRemarks("");
      setEnquiryLines([]);
      setDiscountAmount("0");
      setStatus("Draft");
      setNotes("");
      setTermsAndConditions("");
      setEditingEnquiry(null);
    } catch (e) {
      console.error(e);
      alert("Error saving purchase enquiry.");
    }
  };

  const handleEditEnquiry = (enquiry: any) => {
    setEditingEnquiry(enquiry);
    setSupplierName(enquiry.supplierName || "");
    setTitle(enquiry.title || "");
    setSalesperson(enquiry.salesperson || "");
    setDiscountAmount(String(enquiry.discount || 0));
    setRemarks(enquiry.remarks || "");
    setEnquiryDate(enquiry.date || new Date().toISOString().split("T")[0]);
    setStatus(enquiry.status || "Draft");
    setNotes(enquiry.notes || "");
    setTermsAndConditions(enquiry.termsAndConditions || "");
    
    try {
      const parsedLines = JSON.parse(enquiry.itemsJson || "[]");
      setEnquiryLines(parsedLines);
    } catch (e) {
      setEnquiryLines([]);
    }
    setViewMode("create");
  };

  const handleDeleteEnquiry = async (id: string) => {
    try {
      await apiFetch(`api/PurchaseEnquiries/${id}`, { method: "DELETE" });
      fetchEnquiries();
      if (editingEnquiry?.id === id) {
        setViewMode("list");
        setEditingEnquiry(null);
      }
      setDeletingEnquiry(null);
    } catch (err: any) {
      console.error("Error deleting purchase enquiry:", err);
      alert(err.message || "Failed to delete Purchase Enquiry.");
      setDeletingEnquiry(null);
    }
  };

  const openNewEnquiry = () => {
    setEditingEnquiry(null);
    setSupplierName("");
    setTitle("");
    setSalesperson("");
    setRemarks("");
    setEnquiryLines([]);
    setDiscountAmount("0");
    setStatus("Draft");
    setNotes("");
    setTermsAndConditions("");
    setEnquiryDate(new Date().toISOString().split("T")[0]);
    setViewMode("create");
  };

  const handleQuickAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    try {
      const payload = {
        name: newSupplierName.trim(),
        companyId: activeCompany.id,
        vatNumber: "",
        email: newSupplierEmail.trim(),
        contactPersonName: "",
        contactPersonNumber: newSupplierPhone.trim(),
        category: "General",
        notes: "Quick added from purchase enquiry screen."
      };
      await apiFetch("api/Suppliers", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      fetchReferenceData();
      setSupplierName(newSupplierName.trim());
      setIsSupplierModalOpen(false);
      
      // Clear fields
      setNewSupplierName("");
      setNewSupplierEmail("");
      setNewSupplierPhone("");
    } catch (e) {
      console.error(e);
      alert("Error adding supplier.");
    }
  };

  // KPIs
  const totalValue = enquiries.reduce((sum, item) => sum + item.amount, 0);
  const pendingValue = enquiries.filter(e => e.status === "Draft" || e.status === "Sent").reduce((sum, item) => sum + item.amount, 0);
  const approvedCount = enquiries.filter(e => e.status === "Approved").length;

  return (
    <div className="space-y-4">
      {viewMode === "list" && (
        <>
          <SectionTitle
            title="Purchase Enquiries"
            subtitle="Draft RFQs, track supplier quotations, and monitor procurement pipelines."
          />

          {/* Top KPI Dash Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  Total RFQ Value
                </span>
                <span className="text-xl font-black text-slate-900 block leading-tight">
                  {money(totalValue, activeCompany.currency)}
                </span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-505 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  Pending RFQ Value
                </span>
                <span className="text-xl font-black text-slate-900 block leading-tight">
                  {money(pendingValue, activeCompany.currency)}
                </span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-505 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  Approved RFQs
                </span>
                <span className="text-xl font-black text-slate-900 block leading-tight">
                  {approvedCount} RFQs
                </span>
              </div>
            </div>
          </div>

          {/* Search container */}
          <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search RFQs by supplier, title, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 placeholder-slate-400 outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>
            <Button
              variant="primary"
              onClick={openNewEnquiry}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-xl shadow-md shadow-blue-500/10 flex items-center gap-1.5 transition active:scale-98"
            >
              <Plus className="h-4 w-4" /> New Enquiry
            </Button>
          </div>

          {loading ? (
            <div className="flex h-72 items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800">RFQ Register</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Procurement enquiries and requests for quote generated by this company workspace</p>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-200/80 border-b border-slate-300 text-[10px] font-extrabold uppercase text-slate-800 tracking-wider">
                      <th className="p-3.5 w-20 text-center">RFQ ID</th>
                      <th className="p-3.5">Supplier</th>
                      <th className="p-3.5">Title / Subject</th>
                      <th className="p-3.5">Procurement Representative</th>
                      <th className="p-3.5 text-right">Amount</th>
                      <th className="p-3.5 text-right">VAT</th>
                      <th className="p-3.5 w-24 text-center">Status</th>
                      <th className="p-3.5 w-28">Date</th>
                      <th className="p-3.5 w-36 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {enquiries.map((enquiry) => (
                      <tr key={enquiry.id} className="hover:bg-slate-200/60 transition duration-150">
                        <td className="p-3.5 font-bold text-slate-400 text-center">{enquiry.id}</td>
                        <td className="p-3.5 font-bold text-slate-850">{enquiry.supplierName}</td>
                        <td className="p-3.5 font-semibold text-slate-700">{enquiry.title}</td>
                        <td className="p-3.5 text-slate-600 font-medium">{enquiry.salesperson || "Unassigned"}</td>
                        <td className="p-3.5 font-mono text-right font-bold text-slate-800">{money(enquiry.amount, activeCompany.currency)}</td>
                        <td className="p-3.5 font-mono text-right text-slate-505 font-semibold">{money(enquiry.vat, activeCompany.currency)}</td>
                        <td className="p-3.5 text-center">
                          <Badge
                            variant={enquiry.status === "Approved" ? "success" : enquiry.status === "Expired" ? "danger" : enquiry.status === "Sent" ? "info" : "warning"}
                            className="font-bold text-[10px] px-2 py-0.5 rounded"
                          >
                            {enquiry.status}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-500">{enquiry.date}</td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {enquiry.status === "Approved" && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onConvertToOrder) {
                                    onConvertToOrder(enquiry.id);
                                  } else {
                                    apiFetch(`api/PurchaseOrders/convert-enquiry/${enquiry.id}`, { method: "POST" })
                                      .then(() => {
                                        fetchEnquiries();
                                        alert(`Purchase Enquiry ${enquiry.id} successfully converted to Purchase Order!`);
                                      })
                                      .catch((err) => alert(err.message || "Conversion failed."));
                                  }
                                }}
                                className="h-8 w-8 rounded-lg border border-emerald-200 bg-emerald-50/60 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300 flex items-center justify-center transition active:scale-95 shadow-2xs"
                                title="Convert Approved Enquiry to Purchase Order"
                              >
                                <ShoppingCart className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => { setEditingEnquiry(enquiry); setViewMode("detail"); }}
                              className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center transition active:scale-95 shadow-2xs"
                              title="View RFQ"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditEnquiry(enquiry)}
                              className="h-8 w-8 rounded-lg border border-blue-200 bg-blue-50/60 text-blue-600 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 flex items-center justify-center transition active:scale-95 shadow-2xs"
                              title="Edit RFQ"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingEnquiry(enquiry)}
                              className="h-8 w-8 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition"
                              title="Delete Enquiry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {enquiries.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                          No purchase enquiries matching search conditions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {viewMode === "create" && (
        <div className="space-y-6">
          {/* Header Card */}
          <Card className="border-slate-200/80 shadow-md shadow-slate-200/40 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg font-black text-slate-900 uppercase">
                  {editingEnquiry ? `Edit Purchase Enquiry: ${editingEnquiry.id}` : "Construct Purchase Enquiry (RFQ)"}
                </CardTitle>
                <p className="text-xs text-slate-505 mt-0.5">Define RFQ header details, supplier targets, and conditions</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setViewMode("list")}
                className="h-10 rounded-xl font-bold text-xs px-4"
              >
                Back to Register
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-4">
                {/* Supplier select */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Supplier *</label>
                    <button
                      type="button"
                      onClick={() => setIsSupplierModalOpen(true)}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" /> Quick Add
                    </button>
                  </div>
                  <select
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                  >
                    <option value="">Choose Supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">RFQ Title / Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Raw materials delivery"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-955 placeholder-slate-400 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Procurement Officer</label>
                  <input
                    type="text"
                    placeholder="e.g. Ahmed Salim"
                    value={salesperson}
                    onChange={(e) => setSalesperson(e.target.value)}
                    className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-955 placeholder-slate-400 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">RFQ Date</label>
                  <input
                    type="date"
                    value={enquiryDate}
                    onChange={(e) => setEnquiryDate(e.target.value)}
                    className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-955 font-mono font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Remarks / Brief Description</label>
                  <input
                    type="text"
                    placeholder="Details of components or materials required..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-955 placeholder-slate-400 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">RFQ Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-955 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Approved">Approved</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Builder area: split line-builder and live totals */}
          <div className="grid gap-6 lg:grid-cols-3 items-start">
            {/* Line items builder card */}
            <Card className="lg:col-span-2 border-slate-200/80 shadow-md shadow-slate-200/40 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-slate-400" /> Requisition Line Items Builder
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Select Product</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                    >
                      <option value="">Choose item...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-955 font-mono font-bold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">UOM</label>
                    <select
                      value={itemUom}
                      onChange={(e) => setItemUom(e.target.value)}
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                    >
                      <option value="pcs">pcs</option>
                      <option value="box">box</option>
                      <option value="meter">meter</option>
                      <option value="hour">hour</option>
                      <option value="job">job</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 items-end">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Buying Rate (OMR)</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={itemRate}
                      onChange={(e) => setItemRate(e.target.value)}
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-955 font-mono font-bold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Standard VAT</label>
                    <input
                      type="text"
                      disabled
                      value="5.00% (Add-on)"
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 font-semibold text-center outline-none"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddLine}
                    className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 active:scale-98 transition"
                  >
                    <Plus className="h-4 w-4" /> Add Item Line
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live calculation sidebar */}
            <Card className="border-slate-200/80 shadow-md shadow-slate-200/40 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-slate-400" /> Requisition Pricing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {currentProduct ? (
                  <div className="space-y-3.5 text-xs font-semibold">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Reference Stock</span>
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                        {currentProduct.stock || 0} units
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Buy Rate Reference</span>
                      <span className="font-mono font-bold text-slate-800">
                        {currentProduct.buyPrice?.toFixed(3) || "0.000"} OMR
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Estimated Line Cost</span>
                      <span className="font-mono font-bold text-blue-600">
                        {((parseInt(itemQty) || 1) * (parseFloat(itemRate) || 0)).toFixed(2)} OMR
                      </span>
                    </div>
                    <div className="bg-blue-50/40 border border-blue-100/50 p-2.5 rounded-xl text-[10px] text-blue-800 leading-relaxed font-semibold">
                      This calculation uses the supplier's buying price reference of 5% VAT. Review items prior to submission.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-center space-y-2">
                    <Package className="h-8 w-8 text-slate-300 stroke-1" />
                    <p className="text-[10px] font-semibold tracking-wide">Select a product to view stock and pricing projections.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Added items lines table */}
          <Card className="border-slate-200/80 shadow-md shadow-slate-200/40 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 py-3.5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">RFQ Lines Table</CardTitle>
                <p className="text-xs text-slate-550 mt-0.5">Editable items requested from the selected supplier</p>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-700 tracking-wider">
                    <th className="p-3.5 w-14 text-center">SlNo</th>
                    <th className="p-3.5">Product Requisition Description</th>
                    <th className="p-3.5 w-24 text-right">Quantity</th>
                    <th className="p-3.5 w-20 text-center">UOM</th>
                    <th className="p-3.5 w-32 text-right">Buying Rate</th>
                    <th className="p-3.5 w-28 text-right">Subtotal</th>
                    <th className="p-3.5 w-20 text-right">VAT Rate</th>
                    <th className="p-3.5 w-24 text-right">VAT Amt</th>
                    <th className="p-3.5 w-32 text-right">Gross Total</th>
                    <th className="p-3.5 w-20 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 font-semibold">
                  {enquiryLines.map((line, idx) => {
                    const isEditing = editingLineIdx === idx;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/30 transition duration-100">
                        <td className="p-3.5 text-center font-bold text-slate-500">{line.slNo}</td>
                        <td className="p-3.5 font-bold text-slate-900">{line.description}</td>
                        <td className="p-3.5 font-mono text-right font-bold text-slate-800">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0.001"
                              step="any"
                              value={line.qty}
                              onChange={(e) => handleUpdateLine(idx, "qty", e.target.value)}
                              className="w-20 h-9 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-955 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-bold"
                            />
                          ) : (
                            line.qty
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <Badge variant="default" className="bg-slate-200/50 hover:bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">{line.uom}</Badge>
                        </td>
                        <td className="p-3.5 font-mono text-right text-slate-600 font-semibold">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.001"
                              value={line.rate}
                              onChange={(e) => handleUpdateLine(idx, "rate", e.target.value)}
                              className="w-24 h-9 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-955 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-bold"
                            />
                          ) : (
                            `${line.rate.toFixed(2)} OMR`
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-right font-bold text-slate-800">
                          {line.amount.toFixed(2)} OMR
                        </td>
                        <td className="p-3.5 font-mono text-right text-slate-500 font-semibold">5.0%</td>
                        <td className="p-3.5 font-mono text-right text-slate-600 font-semibold">{line.vatAmt.toFixed(2)} OMR</td>
                        <td className="p-3.5 font-mono text-right text-slate-950 font-black">
                          {line.grossAmt.toFixed(2)} OMR
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => setEditingLineIdx(null)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition active:scale-90"
                                title="Save changes"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingLineIdx(idx)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition active:scale-90"
                                title="Edit line"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition active:scale-90"
                              title="Delete line"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {enquiryLines.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-12 text-center text-slate-400 font-medium">
                        No items added to this purchase enquiry. Select a product and click "Add Item Line" above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Pricing statement fields and Action Buttons */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-slate-200/80 shadow-md shadow-slate-200/40 p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Discount (%)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">RFQ Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional procurement details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 placeholder-slate-400 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Delivery & Payment Terms</label>
                <textarea
                  rows={2}
                  placeholder="RFQ validity, standard delivery details, etc."
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-955 placeholder-slate-400 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="border-slate-200/80 shadow-md shadow-slate-200/40 p-5 space-y-3 font-semibold text-xs text-slate-650 bg-slate-50/50">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Requisition Gross:</span>
                  <span className="font-mono text-slate-800 font-bold text-sm">
                    {calculatedTotals.totalAmount.toFixed(2)} {activeCompany.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center text-red-650">
                  <span>Requisition Discount ({calculatedTotals.discountPct}%):</span>
                  <span className="font-mono font-bold text-sm text-red-600">
                    -{calculatedTotals.discount.toFixed(2)} {activeCompany.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 font-bold text-slate-800">
                  <span>Subtotal:</span>
                  <span className="font-mono text-sm">
                    {calculatedTotals.subtotal.toFixed(2)} {activeCompany.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Add: 5% VAT Amt:</span>
                  <span className="font-mono font-bold text-slate-700 text-sm">
                    {calculatedTotals.vat.toFixed(2)} {activeCompany.currency}
                  </span>
                </div>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-705 text-white rounded-2xl p-4 flex justify-between items-center shadow-lg shadow-blue-600/10 font-bold mt-2">
                  <div className="space-y-0.5">
                    <span className="block text-[10px] text-blue-200 uppercase tracking-wider">NET RFQ ESTIMATED TOTAL</span>
                    <span className="text-[10px] text-blue-100 font-medium">Inclusive of OMR Requisition taxes</span>
                  </div>
                  <span className="font-mono text-xl font-black">
                    {calculatedTotals.grandTotal.toFixed(2)} {activeCompany.currency}
                  </span>
                </div>
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setViewMode("list")}
                  className="font-bold text-xs h-11 px-6 rounded-xl border border-slate-200 hover:bg-slate-100 transition duration-150 active:scale-98"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveEnquiry}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 px-8 rounded-xl shadow-md shadow-blue-500/10 transition duration-150 active:scale-98"
                >
                  {editingEnquiry ? "Update & Save RFQ" : "Construct & Save RFQ"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "detail" && editingEnquiry && (
        <div className="space-y-6 print:space-y-0 print:p-0 animate-fade-in">
          {/* Header Action Bar (hidden during printing) */}
          <div className="flex justify-between items-center bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm print:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 uppercase">RFQ: {editingEnquiry.id}</h2>
                <p className="text-xs text-slate-500">Review, print, or manage this purchase enquiry document</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setViewMode("list")}
                className="font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5"
              >
                Back to List
              </Button>
              {editingEnquiry.status === "Approved" && (
                <Button
                  type="button"
                  onClick={() => {
                    if (onConvertToOrder) {
                      onConvertToOrder(editingEnquiry.id);
                    } else {
                      apiFetch(`api/PurchaseOrders/convert-enquiry/${editingEnquiry.id}`, { method: "POST" })
                        .then(() => {
                          fetchEnquiries();
                          alert(`Purchase Enquiry ${editingEnquiry.id} successfully converted to Purchase Order!`);
                        })
                        .catch((err) => alert(err.message || "Conversion failed."));
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                >
                  <ShoppingCart className="h-4 w-4" /> Convert to Purchase Order
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10"
              >
                <Printer className="h-4 w-4" /> Print RFQ Sheet
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleDeleteEnquiry(editingEnquiry.id)}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Delete RFQ
              </Button>
            </div>
          </div>

          {/* Premium Dossier Paper */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl max-w-4xl mx-auto p-8 space-y-8 print:border-none print:shadow-none print:p-0 print:mx-0">
            {/* Top details */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div>
                {/* Logo & Company Info */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-650 text-white font-black text-base shadow-md">
                    GG
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-950 leading-tight">{activeCompany.name}</h2>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mt-0.5">Commercial Registration / VAT {activeCompany.taxNumber}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>HQ: Al Khuwair, Muscat, Sultanate of Oman</p>
                  <p>Email: procurement@ggms.om | Tel: +968 24490011</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Request For Quote</h1>
                <div className="mt-2 text-xs text-slate-550 space-y-1 font-semibold">
                  <p><span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider mr-1">RFQ ID:</span> {editingEnquiry.id}</p>
                  <p><span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider mr-1">Date:</span> {editingEnquiry.date}</p>
                  <p>
                    <span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider mr-1">Status: </span>
                    <span className={`font-bold ${editingEnquiry.status === "Approved" ? "text-emerald-600" : "text-amber-500"}`}>{editingEnquiry.status}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Supplier & Representative Details */}
            <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-5 rounded-2xl border border-slate-200/50 print:bg-white print:border-slate-300">
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Target Supplier:</h4>
                <span className="font-black text-slate-955 block text-sm">{editingEnquiry.supplierName}</span>
                <span className="text-slate-505 block mt-1">Muscat, Sultanate of Oman</span>
              </div>
              <div className="text-right">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Procurement Officer:</h4>
                <span className="font-bold text-slate-955 block text-sm">{editingEnquiry.salesperson || "Procurement Agent"}</span>
                <span className="text-slate-500 block mt-0.5">Ref ID: {editingEnquiry.id}</span>
              </div>
            </div>

            {/* Scope / Title */}
            {editingEnquiry.title && (
              <div className="text-xs font-semibold">
                <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">Requisition Subject / title:</span>
                <p className="font-bold text-slate-800 text-sm mt-1">{editingEnquiry.title}</p>
              </div>
            )}

            {/* Grid Items Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-800 tracking-wider">
                    <th className="p-3.5 w-10 text-center">#</th>
                    <th className="p-3.5">Requisition Item Description</th>
                    <th className="p-3.5 w-20 text-right">Qty</th>
                    <th className="p-3.5 w-16 text-center">UOM</th>
                    <th className="p-3.5 w-24 text-right">Estimated Rate</th>
                    <th className="p-3.5 w-24 text-right">Amount</th>
                    <th className="p-3.5 w-16 text-right">VAT %</th>
                    <th className="p-3.5 w-24 text-right">VAT Amt</th>
                    <th className="p-3.5 w-28 text-right">Gross Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {(() => {
                    try {
                      const lines = JSON.parse(editingEnquiry.itemsJson || "[]");
                      if (lines && lines.length > 0) {
                        return lines.map((line: any, idx: number) => {
                          const rate = line.rate || 0;
                          const qty = line.qty || 0;
                          const amt = line.amount || (qty * rate);
                          const vatAmt = line.vatAmt || (amt * 0.05);
                          const grossAmt = line.grossAmt || (amt + vatAmt);
                          return (
                            <tr key={idx}>
                              <td className="p-3.5 text-slate-500 text-center font-bold">{idx + 1}</td>
                              <td className="p-3.5 font-bold text-slate-900">{line.description}</td>
                              <td className="p-3.5 text-right font-mono font-bold text-slate-800">{qty}</td>
                              <td className="p-3.5 text-center"><Badge variant="default" className="bg-slate-200/50 hover:bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">{line.uom || "pcs"}</Badge></td>
                              <td className="p-3.5 font-mono text-right text-slate-600 font-semibold">{rate.toFixed(2)}</td>
                              <td className="p-3.5 font-mono text-right text-slate-855 font-bold">{amt.toFixed(2)}</td>
                              <td className="p-3.5 font-mono text-right text-slate-500 font-semibold">5.0%</td>
                              <td className="p-3.5 font-mono text-right text-slate-600 font-semibold">{vatAmt.toFixed(2)}</td>
                              <td className="p-3.5 font-mono text-right text-slate-955 font-black">{grossAmt.toFixed(2)}</td>
                            </tr>
                          );
                        });
                      }
                    } catch (e) {}
                    return (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-slate-400 font-semibold">No requisition lines found.</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Calculations and Summary */}
            <div className="grid gap-6 md:grid-cols-2 text-xs pt-2">
              {/* Payment and Validity Terms */}
              <div className="space-y-3 font-semibold">
                {editingEnquiry.termsAndConditions && (
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/50 print:bg-transparent print:border-none print:p-0">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Delivery & Payment Terms:</span>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">{editingEnquiry.termsAndConditions}</p>
                  </div>
                )}
                {editingEnquiry.notes && (
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/50 print:bg-transparent print:border-none print:p-0">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Remarks / Notes:</span>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">{editingEnquiry.notes}</p>
                  </div>
                )}
              </div>

              {/* Grand Totals */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2.5 justify-self-end w-full max-w-sm font-semibold text-xs shadow-2xs">
                <div className="flex justify-between text-slate-550 font-medium">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono font-bold text-slate-900">{editingEnquiry.amount.toFixed(2)} {activeCompany.currency}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Add: 5% VAT:</span>
                  <span className="font-mono font-semibold text-slate-700">{editingEnquiry.vat.toFixed(2)} {activeCompany.currency}</span>
                </div>
                <div className="border-t-2 border-slate-300 pt-3 flex justify-between items-center font-black text-blue-700 text-sm">
                  <span>NET REQUISITION TOTAL:</span>
                  <span className="font-mono text-base">{(editingEnquiry.amount + editingEnquiry.vat).toFixed(2)} {activeCompany.currency}</span>
                </div>
              </div>
            </div>

            {/* Footer Signatures */}
            <div className="border-t border-slate-200 pt-10 mt-6 grid grid-cols-2 text-center text-[10px] text-slate-400 font-semibold">
              <div>
                <div className="mx-auto w-32 border-b border-slate-300 h-10"></div>
                <p className="mt-2 font-semibold text-slate-505 uppercase tracking-wider">Supplier Acceptance</p>
                <p className="text-[9px] text-slate-400">Sign & Stamp</p>
              </div>
              <div>
                <div className="mx-auto w-32 border-b border-slate-300 h-10"></div>
                <p className="mt-2 font-semibold text-slate-505 uppercase tracking-wider">Authorized Procurement Officer</p>
                <p className="text-[9px] text-slate-400">{activeCompany.name}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Quick Add Supplier Modal --- */}
      {isSupplierModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsSupplierModalOpen(false); }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-955/60 backdrop-blur-md p-4 animate-fade-in"
        >
          <div className="relative bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-505" /> Quick Add Supplier
              </h3>
              <button
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muscat Trading LLC"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email ID</label>
                <input
                  type="email"
                  placeholder="sales@muscattrading.com"
                  value={newSupplierEmail}
                  onChange={(e) => setNewSupplierEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Contact Number</label>
                <input
                  type="text"
                  placeholder="Contact phone number"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-mono font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setIsSupplierModalOpen(false)} className="h-10 rounded-xl font-bold">Cancel</Button>
                <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 rounded-xl shadow-md shadow-blue-500/10">Add Supplier</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingEnquiry}
        title="Delete Purchase Enquiry"
        description="Are you sure you want to delete this purchase enquiry record? This action cannot be undone."
        itemName={deletingEnquiry?.id ? `${deletingEnquiry.id} (${deletingEnquiry.supplierName || 'Supplier'})` : undefined}
        onConfirm={() => deletingEnquiry && handleDeleteEnquiry(deletingEnquiry.id)}
        onClose={() => setDeletingEnquiry(null)}
      />
    </div>
  );
}
