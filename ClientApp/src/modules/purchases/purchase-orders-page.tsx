"use client";

import { useState, useEffect } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SectionTitle, ConfirmDeleteModal } from "../../modules/shared/screen-kit";
import { Plus, Edit, Trash2, Printer, Loader2, ArrowRight, Package, Coins, Barcode, X, Check } from "lucide-react";
import type { Company } from "../../data/mock";
import type { PurchaseOrderRecord, ProductItem, UomItem } from "../shared/domain";
import { apiFetch } from "../../lib/api";
import { money } from "../../lib/utils";

export function PurchaseOrdersPage({
  activeCompany,
  initialEnquiryId,
  onClearInitialEnquiry
}: {
  activeCompany: Company;
  initialEnquiryId?: string;
  onClearInitialEnquiry?: () => void;
}) {
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [uoms, setUoms] = useState<UomItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"list" | "form" | "detail">("list");
  const [search, setSearch] = useState("");

  const [editingOrder, setEditingOrder] = useState<PurchaseOrderRecord | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<PurchaseOrderRecord | null>(null);
  const [printPo, setPrintPo] = useState<PurchaseOrderRecord | null>(null);

  const confirmDeleteOrder = () => {
    if (!deletingOrder) return;
    apiFetch(`api/PurchaseOrders/${deletingOrder.id}`, { method: "DELETE" })
      .then(() => {
        setOrders(prev => prev.filter(o => o.id !== deletingOrder.id));
        setDeletingOrder(null);
      })
      .catch((err) => {
        console.error("Error deleting Purchase Order:", err);
        alert(err.message || "Failed to delete Purchase Order.");
      });
  };
  const [poNo, setPoNo] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [vendorName, setVendorName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [purEnquiryNo, setPurEnquiryNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [termsConditions, setTermsConditions] = useState("");
  const [notes, setNotes] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0.000");

  // Quick Add Supplier State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierEmail, setNewSupplierEmail] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [submittingSupplier, setSubmittingSupplier] = useState(false);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    setSubmittingSupplier(true);
    apiFetch("api/Suppliers", {
      method: "POST",
      body: JSON.stringify({
        name: newSupplierName,
        email: newSupplierEmail,
        phone: newSupplierPhone,
        companyId: activeCompany.id
      })
    })
      .then((created: any) => {
        setSuppliers(prev => [created, ...prev]);
        setVendorName(created.name);
        setVendorEmail(created.email || "");
        setIsSupplierModalOpen(false);
        setNewSupplierName("");
        setNewSupplierEmail("");
        setNewSupplierPhone("");
        setSubmittingSupplier(false);
      })
      .catch((err) => {
        console.error("Error creating supplier:", err);
        setSubmittingSupplier(false);
      });
  };

  // Grid line picker state
  const [pickerBarcode, setPickerBarcode] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [pickerQty, setPickerQty] = useState("1");
  const [pickerUom, setPickerUom] = useState("pcs");
  const [pickerRate, setPickerRate] = useState("0.000");
  const [pickerVatPercent, setPickerVatPercent] = useState("5.000");
  const [pickerSalesRate, setPickerSalesRate] = useState("0.000");

  const [editingLineIdx, setEditingLineIdx] = useState<number | null>(null);

  interface POLine {
    slNo: number;
    barcode: string;
    description: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
    vatPercent: number;
    vatRate: number;
    vatAmt: number;
    grossRate: number;
    grossAmt: number;
    salesRate: number;
  }
  const [poLines, setPoLines] = useState<POLine[]>([]);

  const fetchOrders = () => {
    setLoading(true);
    apiFetch<PurchaseOrderRecord[]>(`api/PurchaseOrders?companyId=${activeCompany.id}&search=${search}`)
      .then((data) => {
        setOrders(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading Purchase Orders:", err);
        setLoading(false);
      });
  };

  const fetchMasterData = () => {
    apiFetch<any[]>(`api/Suppliers?companyId=${activeCompany.id}`)
      .then((data) => setSuppliers(data || []))
      .catch((err) => console.error(err));

    apiFetch<ProductItem[]>(`api/Products?companyId=${activeCompany.id}`)
      .then((data) => setProducts(data || []))
      .catch((err) => console.error(err));

    apiFetch<UomItem[]>(`api/Uoms?companyId=${activeCompany.id}`)
      .then((data) => setUoms(data || []))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchOrders();
    fetchMasterData();
  }, [activeCompany.id, search]);

  // Convert Purchase Enquiry automatically if initialEnquiryId passed
  useEffect(() => {
    if (initialEnquiryId) {
      handleConvertFromEnquiry(initialEnquiryId);
    }
  }, [initialEnquiryId]);

  const handleConvertFromEnquiry = (enquiryId: string) => {
    setLoading(true);
    apiFetch<PurchaseOrderRecord>(`api/PurchaseOrders/convert-enquiry/${enquiryId}`, {
      method: "POST"
    })
      .then((newPo) => {
        fetchOrders();
        openEditOrder(newPo);
        if (onClearInitialEnquiry) onClearInitialEnquiry();
        alert(`Successfully converted Purchase Enquiry ${enquiryId} to Purchase Order ${newPo.purchaseOrderNo}!`);
      })
      .catch((err) => {
        console.error("Error converting enquiry:", err);
        alert(err.message || "Failed to convert Purchase Enquiry.");
        setLoading(false);
      });
  };

  const openNewOrder = () => {
    setEditingOrder(null);
    setPoNo(`PO1_${orders.length + 1}`);
    setPoDate(new Date().toISOString().split("T")[0]);
    setVendorName(suppliers[0]?.name || "");
    setVendorEmail(suppliers[0]?.email || "");
    setPurEnquiryNo("");
    setRemarks("");
    setTermsConditions("Payment within 30 days. Delivery at site.");
    setNotes("Standard purchase order terms.");
    setDiscountAmount("0.000");
    setPoLines([]);
    setViewMode("form");
  };

  const openEditOrder = (order: PurchaseOrderRecord) => {
    setEditingOrder(order);
    setPoNo(order.purchaseOrderNo);
    setPoDate(order.orderDate || new Date().toISOString().split("T")[0]);
    setVendorName(order.supplierName || "");
    setVendorEmail(order.supplierEmail || "");
    setPurEnquiryNo(order.purchaseEnquiryId || "");
    setRemarks(order.remarks || "");
    setTermsConditions(order.termsAndConditions || "");
    setNotes(order.notes || "");
    setDiscountAmount((order.discountAmount || 0).toFixed(3));

    try {
      const parsedItems = JSON.parse(order.itemsJson || "[]");
      if (Array.isArray(parsedItems)) {
        const lines: POLine[] = parsedItems.map((item: any, idx: number) => {
          const qty = parseFloat(item.quantity || item.qty) || 1;
          const rate = parseFloat(item.unitPrice || item.rate) || 0;
          const amt = qty * rate;
          const vatPct = parseFloat(item.vatPercent) || 5.0;
          const vatRate = rate * (vatPct / 100);
          const vatAmt = amt * (vatPct / 100);
          const grossRate = rate + vatRate;
          const grossAmt = amt + vatAmt;
          return {
            slNo: idx + 1,
            barcode: item.barcode || item.productId || "",
            description: item.description || item.itemName || "",
            qty,
            uom: item.uom || "pcs",
            rate,
            amount: amt,
            vatPercent: vatPct,
            vatRate,
            vatAmt,
            grossRate,
            grossAmt,
            salesRate: parseFloat(item.salesRate) || 0
          };
        });
        setPoLines(lines);
      }
    } catch (e) {
      console.error(e);
      setPoLines([]);
    }

    setViewMode("form");
  };

  const handleBarcodeLookup = () => {
    if (!pickerBarcode.trim()) return;
    const prod = products.find(p =>
      p.id.toLowerCase() === pickerBarcode.trim().toLowerCase() ||
      (p.barcode && p.barcode.toLowerCase() === pickerBarcode.trim().toLowerCase())
    );
    if (prod) {
      setSelectedProductId(prod.id);
      setPickerRate(prod.buyPrice.toFixed(3));
      setPickerSalesRate(prod.sellPrice.toFixed(3));
      setPickerUom(prod.uom || "pcs");
      setPickerVatPercent((prod.vatRate * 100).toFixed(3));
    }
  };

  const handleProductChange = (pId: string) => {
    setSelectedProductId(pId);
    const prod = products.find(p => p.id === pId);
    if (prod) {
      setPickerBarcode(prod.barcode || prod.id);
      setPickerRate(prod.buyPrice.toFixed(3));
      setPickerSalesRate(prod.sellPrice.toFixed(3));
      setPickerUom(prod.uom || "pcs");
      setPickerVatPercent((prod.vatRate * 100).toFixed(3));
    }
  };

  // Line computations
  const qNum = parseFloat(pickerQty) || 0;
  const rNum = parseFloat(pickerRate) || 0;
  const vPctNum = parseFloat(pickerVatPercent) || 0;
  const sRateNum = parseFloat(pickerSalesRate) || 0;

  const derivedAmt = qNum * rNum;
  const derivedVatRate = rNum * (vPctNum / 100);
  const derivedVatAmt = derivedAmt * (vPctNum / 100);
  const derivedGrossRate = rNum + derivedVatRate;
  const derivedGrossAmt = derivedAmt + derivedVatAmt;

  const handleAddOrUpdateLine = () => {
    if (!selectedProductId && !pickerBarcode) return;
    const prod = products.find(p => p.id === selectedProductId);
    const desc = prod ? prod.name : "Custom Item";

    const newLine: POLine = {
      slNo: editingLineIdx !== null ? editingLineIdx + 1 : poLines.length + 1,
      barcode: pickerBarcode || (prod ? prod.barcode || prod.id : ""),
      description: desc,
      qty: qNum,
      uom: pickerUom,
      rate: rNum,
      amount: derivedAmt,
      vatPercent: vPctNum,
      vatRate: derivedVatRate,
      vatAmt: derivedVatAmt,
      grossRate: derivedGrossRate,
      grossAmt: derivedGrossAmt,
      salesRate: sRateNum
    };

    if (editingLineIdx !== null) {
      const updated = [...poLines];
      updated[editingLineIdx] = newLine;
      setPoLines(updated);
      setEditingLineIdx(null);
    } else {
      setPoLines(prev => [...prev, newLine]);
    }

    // Reset picker
    setPickerBarcode("");
    setSelectedProductId("");
    setPickerQty("1");
    setPickerRate("0.000");
    setPickerSalesRate("0.000");
  };

  const handleRemoveLine = (idx: number) => {
    setPoLines(prev => prev.filter((_, i) => i !== idx).map((l, i) => ({ ...l, slNo: i + 1 })));
  };

  const handleEditLine = (idx: number) => {
    const l = poLines[idx];
    setEditingLineIdx(idx);
    setPickerBarcode(l.barcode);
    const prod = products.find(p => p.barcode === l.barcode || p.name === l.description);
    if (prod) setSelectedProductId(prod.id);
    setPickerQty(String(l.qty));
    setPickerUom(l.uom);
    setPickerRate(l.rate.toFixed(3));
    setPickerVatPercent(l.vatPercent.toFixed(3));
    setPickerSalesRate(l.salesRate.toFixed(3));
  };

  // Totals
  const totalQty = poLines.reduce((sum, l) => sum + l.qty, 0);
  const totalAmount = poLines.reduce((sum, l) => sum + l.amount, 0);
  const totalVatAmt = poLines.reduce((sum, l) => sum + l.vatAmt, 0);
  const totalGrossAmt = poLines.reduce((sum, l) => sum + l.grossAmt, 0);

  const discountVal = parseFloat(discountAmount) || 0;
  const netAmount = totalGrossAmt - discountVal;

  const handleSavePO = () => {
    if (!vendorName) {
      alert("Please select a Vendor.");
      return;
    }
    if (poLines.length === 0) {
      alert("Please add at least one line item to the Purchase Order.");
      return;
    }

    const payload = {
      purchaseOrderNo: poNo,
      purchaseEnquiryId: purEnquiryNo,
      supplierName: vendorName,
      supplierEmail: vendorEmail,
      orderDate: poDate,
      remarks,
      itemsJson: JSON.stringify(
        poLines.map(l => ({
          barcode: l.barcode,
          itemName: l.description,
          description: l.description,
          quantity: l.qty,
          qty: l.qty,
          uom: l.uom,
          unitPrice: l.rate,
          rate: l.rate,
          amount: l.amount,
          vatPercent: l.vatPercent,
          vatRate: l.vatRate,
          vatAmt: l.vatAmt,
          grossRate: l.grossRate,
          grossAmt: l.grossAmt,
          salesRate: l.salesRate
        }))
      ),
      totalAmount,
      vatAmount: totalVatAmt,
      grossAmount: totalGrossAmt,
      discountAmount: discountVal,
      netAmount,
      termsAndConditions: termsConditions,
      notes,
      status: "Issued",
      companyId: activeCompany.id
    };

    if (editingOrder) {
      apiFetch(`api/PurchaseOrders/${editingOrder.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })
        .then(() => {
          fetchOrders();
          setViewMode("list");
          setEditingOrder(null);
          alert(`Purchase Order ${poNo} updated successfully!`);
        })
        .catch((err) => {
          console.error(err);
          alert("Error updating Purchase Order.");
        });
    } else {
      apiFetch("api/PurchaseOrders", {
        method: "POST",
        body: JSON.stringify(payload)
      })
        .then(() => {
          fetchOrders();
          setViewMode("list");
          alert(`Purchase Order ${poNo} saved successfully!`);
        })
        .catch((err) => {
          console.error(err);
          alert("Error saving Purchase Order.");
        });
    }
  };

  return (
    <div className="space-y-6">
      {viewMode === "list" && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <SectionTitle
              title="Purchase Orders"
              subtitle="Generate, view, and process vendor purchase orders linked to approved procurement enquiries."
            />
            <Button
              variant="primary"
              onClick={openNewOrder}
              className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 px-5 active:scale-98 transition"
            >
              <Plus className="h-4 w-4" /> Create Purchase Order
            </Button>
          </div>

          {/* Search container */}
          <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search PO number, vendor, RFQ ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 placeholder-slate-400 outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white transition"
              />
            </div>
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
                  <CardTitle className="text-base font-bold text-slate-800">PO Register</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Procurement orders sent to suppliers and vendors</p>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-200/80 border-b border-slate-300 text-[10px] font-extrabold uppercase text-slate-800 tracking-wider">
                      <th className="p-3.5 w-24 text-center">PO ID</th>
                      <th className="p-3.5 w-32">Linked RFQ</th>
                      <th className="p-3.5">Vendor / Supplier</th>
                      <th className="p-3.5">Remarks</th>
                      <th className="p-3.5 text-right">Amount</th>
                      <th className="p-3.5 text-right">VAT</th>
                      <th className="p-3.5 text-right">Net Total</th>
                      <th className="p-3.5 w-24 text-center">Status</th>
                      <th className="p-3.5 w-28">Date</th>
                      <th className="p-3.5 w-48 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 font-semibold">
                    {orders.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-200/60 transition duration-150">
                        <td className="p-3.5 font-mono font-bold text-blue-700 text-center">{po.purchaseOrderNo}</td>
                        <td className="p-3.5">
                          {po.purchaseEnquiryId ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              <ArrowRight className="h-3 w-3" /> {po.purchaseEnquiryId}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Direct PO</span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{po.supplierName}</td>
                        <td className="p-3.5 text-slate-600 font-medium">{po.remarks || "No remarks"}</td>
                        <td className="p-3.5 font-mono text-right font-bold text-slate-800">{money(po.totalAmount, activeCompany.currency)}</td>
                        <td className="p-3.5 font-mono text-right text-slate-500 font-semibold">{money(po.vatAmount, activeCompany.currency)}</td>
                        <td className="p-3.5 font-mono text-right text-slate-950 font-black">{money(po.netAmount, activeCompany.currency)}</td>
                        <td className="p-3.5 text-center">
                          <Badge variant="success" className="font-bold text-[10px] px-2 py-0.5 rounded">
                            {po.status || "Issued"}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-500">{po.orderDate}</td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPrintPo(po)}
                              className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center transition active:scale-95 shadow-2xs"
                              title="Print Purchase Order Sheet"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditOrder(po)}
                              className="h-8 w-8 rounded-lg border border-blue-200 bg-blue-50/60 text-blue-600 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 flex items-center justify-center transition active:scale-95 shadow-2xs"
                              title="Edit Purchase Order"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingOrder(po)}
                              className="h-8 w-8 rounded-lg border border-rose-200 bg-rose-50/60 text-rose-600 hover:bg-rose-100 hover:text-rose-800 hover:border-rose-300 flex items-center justify-center transition active:scale-95 shadow-2xs"
                              title="Delete Purchase Order"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-12 text-center text-slate-400 font-medium">
                          No Purchase Orders registered yet.
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

      {/* --- PURCHASE ORDER FORM (MATCHING ENQUIRY DESIGN LAYOUT) --- */}
      {viewMode === "form" && (
        <div className="space-y-6">
          {/* Header Parameters Card */}
          <Card className="border-slate-200/80 shadow-md shadow-slate-200/40 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg font-black text-slate-900 uppercase">
                  {editingOrder ? `Edit Purchase Order: ${editingOrder.purchaseOrderNo}` : "Construct Purchase Order"}
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Define PO header parameters, vendor info, line items, and terms</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setViewMode("list")}
                  className="h-10 rounded-xl font-bold text-xs px-4"
                >
                  Back to PO List
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSavePO}
                  className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 px-5 active:scale-98 transition"
                >
                  <Check className="h-4 w-4" /> Save Purchase Order
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-4">
                {/* Vendor select */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Vendor / Supplier *</label>
                    <button
                      type="button"
                      onClick={() => setIsSupplierModalOpen(true)}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" /> Quick Add
                    </button>
                  </div>
                  <select
                    value={vendorName}
                    onChange={(e) => {
                      setVendorName(e.target.value);
                      const sup = suppliers.find(s => s.name === e.target.value);
                      if (sup) setVendorEmail(sup.email || "");
                    }}
                    className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                  >
                    <option value="">Select Vendor...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Purchase Order No</label>
                  <input
                    type="text"
                    value={poNo}
                    onChange={(e) => setPoNo(e.target.value)}
                    className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-mono font-bold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Purchase Order Date</label>
                  <input
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-mono font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Vendor Email</label>
                  <input
                    type="email"
                    placeholder="e.g. vendor@supplier.com"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 placeholder-slate-400 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Pur Quotation No / Linked RFQ</label>
                  <input
                    type="text"
                    placeholder="e.g. PE-OM-1001"
                    value={purEnquiryNo}
                    onChange={(e) => setPurEnquiryNo(e.target.value)}
                    className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-mono font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Remarks / Order Details</label>
                  <input
                    type="text"
                    placeholder="Additional order specifications or instructions..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 placeholder-slate-400 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Builder area: split line-builder and live stock summary */}
          <div className="grid gap-6 lg:grid-cols-3 items-start">
            {/* Line items builder card */}
            <Card className="lg:col-span-2 border-slate-200/80 shadow-md shadow-slate-200/40 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-slate-400" /> Purchase Order Line Items Builder
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Select Product / Description</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                    >
                      <option value="">Select Description...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Barcode / Item Code</label>
                    <div className="relative mt-1.5">
                      <input
                        type="text"
                        placeholder="Barcode"
                        value={pickerBarcode}
                        onChange={(e) => setPickerBarcode(e.target.value)}
                        onBlur={handleBarcodeLookup}
                        onKeyDown={(e) => e.key === "Enter" && handleBarcodeLookup()}
                        className="block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-mono font-bold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                      />
                      <Barcode className="absolute right-3 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={pickerQty}
                      onChange={(e) => setPickerQty(e.target.value)}
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-mono font-bold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition text-right"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-5 items-end">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">UOM</label>
                    <select
                      value={pickerUom}
                      onChange={(e) => setPickerUom(e.target.value)}
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                    >
                      {uoms.map(u => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                      {uoms.length === 0 && <option value="pcs">pcs</option>}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Buying Rate (Rate)</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={pickerRate}
                      onChange={(e) => setPickerRate(e.target.value)}
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-mono font-bold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">VAT %</label>
                    <input
                      type="number"
                      step="0.001"
                      value={pickerVatPercent}
                      onChange={(e) => setPickerVatPercent(e.target.value)}
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-mono font-bold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Sales Rate</label>
                    <input
                      type="number"
                      step="0.001"
                      value={pickerSalesRate}
                      onChange={(e) => setPickerSalesRate(e.target.value)}
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-mono font-bold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition text-right"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddOrUpdateLine}
                    className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 active:scale-98 transition"
                  >
                    <Plus className="h-4 w-4" /> {editingLineIdx !== null ? "Update Line" : "Add Line Item"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live calculation sidebar */}
            <Card className="border-slate-200/80 shadow-md shadow-slate-200/40 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-slate-400" /> Item Pricing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {selectedProductId ? (
                  <div className="space-y-3.5 text-xs font-semibold">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Stock On Hand</span>
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                        {products.find(p => p.id === selectedProductId)?.stock || 0} units
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Unit Buying Cost</span>
                      <span className="font-mono font-bold text-slate-800">
                        {derivedGrossRate.toFixed(3)} OMR
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Line Gross Amount</span>
                      <span className="font-mono font-bold text-blue-600">
                        {derivedGrossAmt.toFixed(3)} OMR
                      </span>
                    </div>
                    <div className="bg-blue-50/40 border border-blue-100/50 p-2.5 rounded-xl text-[10px] text-blue-800 leading-relaxed font-semibold">
                      Calculates line total with {pickerVatPercent}% VAT included. Verify vendor pricing before saving order.
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

          {/* Added PO lines table */}
          <Card className="border-slate-200/80 shadow-md shadow-slate-200/40 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 py-3.5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Purchase Order Lines Table</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Editable list of products ordered from vendor</p>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-700 tracking-wider">
                    <th className="p-3.5 w-12 text-center">SlNo</th>
                    <th className="p-3.5 w-28">BarCode</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5 w-20 text-right">Qty</th>
                    <th className="p-3.5 w-16 text-center">UOM</th>
                    <th className="p-3.5 w-24 text-right">Rate</th>
                    <th className="p-3.5 w-28 text-right">Amount</th>
                    <th className="p-3.5 w-16 text-right">VAT %</th>
                    <th className="p-3.5 w-20 text-right">VAT Rate</th>
                    <th className="p-3.5 w-24 text-right">VAT Amt</th>
                    <th className="p-3.5 w-24 text-right">Gross Rate</th>
                    <th className="p-3.5 w-28 text-right">Gross Amt</th>
                    <th className="p-3.5 w-24 text-right">Sales Rate</th>
                    <th className="p-3.5 w-20 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 font-semibold">
                  {poLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 transition duration-100">
                      <td className="p-3.5 text-center font-bold text-slate-500">{line.slNo}</td>
                      <td className="p-3.5 font-mono text-slate-600">{line.barcode}</td>
                      <td className="p-3.5 font-bold text-slate-900 uppercase">{line.description}</td>
                      <td className="p-3.5 font-mono text-right font-bold text-slate-800">{line.qty}</td>
                      <td className="p-3.5 text-center">
                        <Badge variant="default" className="bg-slate-200/50 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          {line.uom}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-mono text-right text-slate-600">{line.rate.toFixed(3)}</td>
                      <td className="p-3.5 font-mono text-right font-bold text-slate-800">{line.amount.toFixed(3)}</td>
                      <td className="p-3.5 font-mono text-right text-slate-500">{line.vatPercent.toFixed(1)}%</td>
                      <td className="p-3.5 font-mono text-right text-slate-600">{line.vatRate.toFixed(3)}</td>
                      <td className="p-3.5 font-mono text-right text-slate-600">{line.vatAmt.toFixed(3)}</td>
                      <td className="p-3.5 font-mono text-right text-slate-700">{line.grossRate.toFixed(3)}</td>
                      <td className="p-3.5 font-mono text-right font-black text-slate-950">{line.grossAmt.toFixed(3)}</td>
                      <td className="p-3.5 font-mono text-right text-slate-600">{line.salesRate.toFixed(3)}</td>
                      <td className="p-3.5 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditLine(idx)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition active:scale-90"
                            title="Edit line"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
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
                  ))}
                  {poLines.length === 0 && (
                    <tr>
                      <td colSpan={14} className="p-12 text-center text-slate-400 font-medium">
                        No products added to this purchase order. Select a product and click "Add Line Item" above.
                      </td>
                    </tr>
                  )}
                  {poLines.length > 0 && (
                    <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                      <td colSpan={3} className="p-3.5 text-right uppercase tracking-wider text-slate-500 text-[10px]">Total:</td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-900">{totalQty}</td>
                      <td colSpan={2}></td>
                      <td className="p-3.5 text-right font-mono text-slate-900">{totalAmount.toFixed(3)}</td>
                      <td colSpan={2}></td>
                      <td className="p-3.5 text-right font-mono text-slate-900">{totalVatAmt.toFixed(3)}</td>
                      <td></td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-950">{totalGrossAmt.toFixed(3)}</td>
                      <td colSpan={2}></td>
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Terms & Conditions</label>
                <textarea
                  rows={2}
                  placeholder="Payment within 30 days. Standard delivery terms..."
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional order instructions or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                />
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="border-slate-200/80 shadow-md shadow-slate-200/40 p-5 space-y-3 font-semibold text-xs text-slate-600 bg-slate-50/50">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Total Amount:</span>
                  <span className="font-mono text-slate-800 font-bold text-sm">
                    {totalAmount.toFixed(3)} {activeCompany.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Tax Amount (VAT):</span>
                  <span className="font-mono text-slate-800 font-bold text-sm">
                    {totalVatAmt.toFixed(3)} {activeCompany.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 font-bold text-slate-800">
                  <span>Gross Amount:</span>
                  <span className="font-mono text-sm">
                    {totalGrossAmt.toFixed(3)} {activeCompany.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center text-red-600">
                  <span>Discount Amount:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs">-</span>
                    <input
                      type="number"
                      step="0.001"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-28 h-8 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right font-mono font-bold text-xs text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-4 flex justify-between items-center shadow-lg shadow-blue-600/10 font-bold mt-2">
                  <div className="space-y-0.5">
                    <span className="block text-[10px] text-blue-200 uppercase tracking-wider">NET PURCHASE ORDER TOTAL</span>
                    <span className="text-[10px] text-blue-100 font-medium">Inclusive of vendor taxes</span>
                  </div>
                  <span className="font-mono text-xl font-black">
                    {netAmount.toFixed(3)} {activeCompany.currency}
                  </span>
                </div>
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setViewMode("list")}
                  className="h-11 rounded-xl font-bold text-xs px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSavePO}
                  className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 px-8 active:scale-98 transition"
                >
                  <Check className="h-4 w-4" /> Save Purchase Order
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Add Supplier Modal Overlay */}
          {isSupplierModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-fade-in">
              <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-600" /> Quick Add Supplier
                  </h3>
                  <button
                    onClick={() => setIsSupplierModalOpen(false)}
                    className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSupplier} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Supplier / Vendor Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Atlas Business Trading LLC"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Supplier Email</label>
                    <input
                      type="email"
                      placeholder="supplier@company.com"
                      value={newSupplierEmail}
                      onChange={(e) => setNewSupplierEmail(e.target.value)}
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+968 24000000"
                      value={newSupplierPhone}
                      onChange={(e) => setNewSupplierPhone(e.target.value)}
                      className="mt-1.5 block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsSupplierModalOpen(false)}
                      className="h-10 rounded-xl font-bold text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submittingSupplier}
                      className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-5"
                    >
                      {submittingSupplier ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Supplier"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      {/* --- PRINTABLE PURCHASE ORDER MODAL OVERLAY --- */}
      {printPo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in print:bg-white print:p-0 print:static print:z-auto">
          <div className="relative bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-4xl w-full p-8 space-y-6 max-h-[95vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
            {/* Top Toolbar */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Badge variant="success" className="font-bold text-xs">
                  Official Purchase Order
                </Badge>
                <span className="font-mono font-bold text-slate-700">{printPo.purchaseOrderNo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                >
                  <Printer className="h-4 w-4" /> Print Order Sheet
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPrintPo(null)}
                  className="font-bold text-xs h-9 px-3 rounded-xl"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Official PO Letterhead Content */}
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-base shadow-md">
                      GG
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-950 leading-tight">{activeCompany.name}</h2>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mt-0.5">
                        Commercial Registration / VAT {activeCompany.taxNumber}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p>HQ: Al Khuwair, Muscat, Sultanate of Oman</p>
                    <p>Email: procurement@ggms.om | Tel: +968 24490011</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Purchase Order</h1>
                  <div className="text-xs text-slate-600 font-semibold space-y-0.5">
                    <p><span className="font-extrabold text-slate-400 uppercase text-[10px]">PO NO:</span> {printPo.purchaseOrderNo}</p>
                    <p><span className="font-extrabold text-slate-400 uppercase text-[10px]">DATE:</span> {printPo.orderDate}</p>
                    {printPo.purchaseEnquiryId && (
                      <p><span className="font-extrabold text-slate-400 uppercase text-[10px]">LINKED RFQ:</span> {printPo.purchaseEnquiryId}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendor & Order Metadata */}
              <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/60 print:bg-white print:border-slate-300">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Vendor / Supplier:</h4>
                  <span className="font-black text-slate-950 block text-sm">{printPo.supplierName}</span>
                  {printPo.supplierEmail && <span className="text-slate-600 block mt-0.5">{printPo.supplierEmail}</span>}
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Status & Reference:</h4>
                  <span className="font-bold text-emerald-700 block text-sm">{printPo.status || "Issued"}</span>
                  {printPo.remarks && <span className="text-slate-500 block mt-0.5 italic">Ref: {printPo.remarks}</span>}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase text-slate-700 tracking-wider">
                      <th className="p-3 w-8 text-center">#</th>
                      <th className="p-3 w-28">Barcode</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 w-16 text-right">Qty</th>
                      <th className="p-3 w-14 text-center">UOM</th>
                      <th className="p-3 w-20 text-right">Rate</th>
                      <th className="p-3 w-20 text-right">VAT %</th>
                      <th className="p-3 w-20 text-right">VAT Amt</th>
                      <th className="p-3 w-24 text-right">Gross Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {(() => {
                      try {
                        const items = JSON.parse(printPo.itemsJson || "[]");
                        return items.map((item: any, idx: number) => {
                          const qty = parseFloat(item.quantity ?? item.qty) || 0;
                          const rate = parseFloat(item.unitPrice ?? item.rate) || 0;
                          const vatPct = parseFloat(item.vatPercent) || 5.0;
                          const vatAmt = parseFloat(item.vatAmt) || (qty * rate * (vatPct / 100));
                          const grossAmt = parseFloat(item.grossAmt) || (qty * rate + vatAmt);

                          return (
                            <tr key={idx}>
                              <td className="p-3 text-slate-500 text-center font-bold">{idx + 1}</td>
                              <td className="p-3 font-mono text-slate-600">{item.barcode}</td>
                              <td className="p-3 font-bold text-slate-900">{item.itemName || item.description}</td>
                              <td className="p-3 font-mono text-right font-bold text-slate-800">{qty}</td>
                              <td className="p-3 text-center text-slate-600">{item.uom || "pcs"}</td>
                              <td className="p-3 font-mono text-right text-slate-700">{rate.toFixed(3)}</td>
                              <td className="p-3 font-mono text-right text-slate-500">{vatPct.toFixed(1)}%</td>
                              <td className="p-3 font-mono text-right text-slate-600">{vatAmt.toFixed(3)}</td>
                              <td className="p-3 font-mono text-right font-black text-slate-950">{grossAmt.toFixed(3)}</td>
                            </tr>
                          );
                        });
                      } catch (e) {
                        return (
                          <tr>
                            <td colSpan={9} className="p-4 text-center text-rose-500 font-semibold">Error reading purchase order items.</td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Totals & Terms Footer */}
              <div className="grid grid-cols-2 gap-6 text-xs pt-2">
                <div className="space-y-3 text-slate-600">
                  {printPo.termsAndConditions && (
                    <div>
                      <h5 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-1">Terms & Conditions:</h5>
                      <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] leading-relaxed">{printPo.termsAndConditions}</p>
                    </div>
                  )}
                  {printPo.notes && (
                    <div>
                      <h5 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-1">Notes:</h5>
                      <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] leading-relaxed">{printPo.notes}</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 font-semibold text-slate-700">
                  <div className="flex justify-between items-center">
                    <span>Total Subtotal:</span>
                    <span className="font-mono font-bold">{printPo.totalAmount.toFixed(3)} OMR</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>VAT Tax Amount:</span>
                    <span className="font-mono font-bold">{printPo.vatAmount.toFixed(3)} OMR</span>
                  </div>
                  {printPo.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-rose-600">
                      <span>Less Discount:</span>
                      <span className="font-mono font-bold">-{printPo.discountAmount.toFixed(3)} OMR</span>
                    </div>
                  )}
                  <div className="border-t-2 border-slate-300 pt-2 flex justify-between items-center font-black text-slate-950 text-sm">
                    <span>NET AMOUNT PAYABLE:</span>
                    <span className="font-mono text-emerald-700 text-base">{printPo.netAmount.toFixed(3)} OMR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingOrder}
        title="Delete Purchase Order"
        description="Are you sure you want to delete this purchase order record? This action cannot be undone."
        itemName={deletingOrder?.id ? `${deletingOrder.id} (${deletingOrder.supplierName || 'Supplier'})` : undefined}
        onConfirm={confirmDeleteOrder}
        onClose={() => setDeletingOrder(null)}
      />
    </div>
  );
}
