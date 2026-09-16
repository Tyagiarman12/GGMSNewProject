"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../../lib/api";
import { AlertTriangle, Boxes, PackageOpen, Plus, X, Edit, Trash2, ChevronLeft, ChevronRight, Loader2, Barcode, Camera } from "lucide-react";
import { Button } from "../../components/ui/button";
import type { Company } from "../../data/mock";
import type { ProductItem, UomItem, ProductGroupItem } from "../../modules/shared/domain";
import { SectionTitle, ConfirmDeleteModal } from "../../modules/shared/screen-kit";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export function ProductListPage({
  activeCompany,
  products,
  setProducts
}: {
  activeCompany: Company;
  products: ProductItem[];
  setProducts: (items: ProductItem[] | ((items: ProductItem[]) => ProductItem[])) => void;
}) {
  // Master references
  const [uoms, setUoms] = useState<UomItem[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroupItem[]>([]);

  // Pagination and search state
  const [paginatedProducts, setPaginatedProducts] = useState<ProductItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Server-side KPIs
  const [serverStockValue, setServerStockValue] = useState(0);
  const [serverTotalCount, setServerTotalCount] = useState(0);
  const [serverLowStockCount, setServerLowStockCount] = useState(0);

  // Modal & Editing State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);

  // Camera Barcode Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [simulatedBarcode, setSimulatedBarcode] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"Product" | "Service" | "AMC" | "License">("Product");
  const [formGroupId, setFormGroupId] = useState<number | "">("");
  const [formCategory, setFormCategory] = useState("");
  const [formUom, setFormUom] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formBuyPrice, setFormBuyPrice] = useState("");
  const [formSellPrice, setFormSellPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formMinStock, setFormMinStock] = useState("");
  const [formVatRate, setFormVatRate] = useState("0.05");
  const [formError, setFormError] = useState("");
  const [errorPopupMessage, setErrorPopupMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch product groups & UOMs for drop-downs
  useEffect(() => {
    apiFetch<ProductGroupItem[]>(`api/ProductGroups?companyId=${activeCompany.id}`)
      .then((groups) => setProductGroups(groups || []))
      .catch((err) => console.error("Error fetching product groups:", err));

    apiFetch<UomItem[]>(`api/Uoms?companyId=${activeCompany.id}`)
      .then((uomList) => setUoms(uomList || []))
      .catch((err) => console.error("Error fetching UOMs:", err));
  }, [activeCompany.id]);

  const fetchProducts = (targetPage?: number) => {
    const activePage = targetPage !== undefined ? targetPage : page;
    setLoading(true);
    apiFetch<any>(
      `api/Products?companyId=${activeCompany.id}&paginate=true&page=${activePage}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`
    )
      .then((data) => {
        setPaginatedProducts(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || 0);
        setServerStockValue(data.totalStockValue || 0);
        setServerTotalCount(data.totalCount || 0);
        setServerLowStockCount(data.lowStockCount || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
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
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompany.id, page, search]);

  // Handle Product Group Selection -> Automatically set VAT rate!
  const handleProductGroupChange = (groupIdVal: string) => {
    if (!groupIdVal) {
      setFormGroupId("");
      setFormCategory("");
      setFormVatRate("");
      return;
    }
    const gId = parseInt(groupIdVal);
    setFormGroupId(gId);
    const selectedGroup = productGroups.find(g => g.id === gId);
    if (selectedGroup) {
      setFormCategory(selectedGroup.name);
      // Auto-set VAT rate: 5% -> 0.05, 0% -> 0.0
      const vatDecimal = (selectedGroup.vatPercentage / 100).toString();
      setFormVatRate(vatDecimal);
    }
  };

  const startCamera = async () => {
    setCameraError("");
    setIsScannerOpen(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        if ("BarcodeDetector" in window) {
          const detector = new (window as any).BarcodeDetector({
            formats: ["code_128", "code_39", "ean_13", "ean_8", "qr_code", "upc_a", "upc_e"]
          });
          const interval = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0) {
                  const detectedValue = barcodes[0].rawValue;
                  if (detectedValue) {
                    setFormBarcode(detectedValue);
                    stopCamera();
                    clearInterval(interval);
                  }
                }
              } catch (e) {
                // ignore frame detection errors
              }
            }
          }, 300);
        }
      } else {
        setCameraError("Camera access is not supported on this device/browser.");
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Camera permission denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScannerOpen(false);
  };

  const openAddModal = () => {
    setFormError("");
    setEditingProduct(null);
    setFormName("");
    setFormType("Product");
    setFormGroupId("");
    setFormCategory("");
    setFormUom("");
    setFormBarcode("");
    setFormBuyPrice("");
    setFormSellPrice("");
    setFormStock("");
    setFormMinStock("");
    setFormVatRate(""); // Blank initially until Product Group is selected!
    setIsModalOpen(true);
  };

  const openEditModal = (product: ProductItem) => {
    setFormError("");
    setEditingProduct(product);
    setFormName(product.name);
    setFormType(product.type);
    setFormCategory(product.category);
    setFormGroupId(product.productGroupId || 1);
    setFormUom(product.uom || "Pcs");
    setFormBarcode(product.barcode || product.id);
    setFormBuyPrice(String(product.buyPrice));
    setFormSellPrice(String(product.sellPrice));
    setFormStock(String(product.stock));
    setFormMinStock(String(product.minStock));
    setFormVatRate(String(product.vatRate));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formName.trim()) {
      setFormError("Product Name is required.");
      return;
    }
    if (!formGroupId) {
      setFormError("Please select a Product Group.");
      return;
    }
    if (!formUom) {
      setFormError("Please select a UOM.");
      return;
    }
    if (!formBarcode.trim()) {
      setFormError("Please enter or generate a Barcode / Product Code.");
      return;
    }

    const buyPriceNum = Number(formBuyPrice) || 0;
    const sellPriceNum = Number(formSellPrice) || 0;
    if (buyPriceNum >= sellPriceNum) {
      const errMsg = "Cost price must be less than sales price.";
      setFormError(errMsg);
      setErrorPopupMessage(errMsg);
      return;
    }

    setIsSubmitting(true);
    const payload = {
      id: editingProduct ? editingProduct.id : "",
      name: formName.trim(),
      type: formType,
      category: formCategory.trim() || "General",
      barcode: formBarcode.trim(),
      uom: formUom || "Pcs",
      productGroupId: Number(formGroupId) || 1,
      buyPrice: Number(formBuyPrice) || 0,
      sellPrice: Number(formSellPrice) || 0,
      stock: Number(formStock) || 0,
      minStock: Number(formMinStock) || 0,
      vatRate: Number(formVatRate) || 0,
      companyId: activeCompany.id
    };

    if (editingProduct) {
      apiFetch<ProductItem>(`api/Products/${editingProduct.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })
        .then((savedItem) => {
          setProducts((current) => current.map((p) => p.id === savedItem.id ? savedItem : p));
          fetchProducts();
          closeModal();
          setIsSubmitting(false);
        })
        .catch((err) => {
          console.error("Error updating product:", err);
          setFormError(err.message || "Failed to update product. Barcode must be unique.");
          setIsSubmitting(false);
        });
    } else {
      apiFetch<ProductItem>("api/Products", {
        method: "POST",
        body: JSON.stringify(payload)
      })
        .then((savedItem) => {
          setProducts((current) => [savedItem, ...current]);
          setPage(1);
          fetchProducts(1);
          closeModal();
          setIsSubmitting(false);
        })
        .catch((err) => {
          console.error("Error creating product:", err);
          setFormError(err.message || "Failed to create product. Barcode must be unique.");
          setIsSubmitting(false);
        });
    }
  };

  const confirmDelete = () => {
    if (!deletingProduct) return;
    apiFetch(`api/Products/${deletingProduct.id}`, {
      method: "DELETE"
    })
      .then(() => {
        setProducts((current) => current.filter((p) => p.id !== deletingProduct.id));
        fetchProducts();
        setDeletingProduct(null);
      })
      .catch((err) => {
        console.error("Error deleting product:", err);
        alert("Failed to delete product.");
        setDeletingProduct(null);
      });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <SectionTitle
        title="Product Master Catalog"
        subtitle="Manage product items, barcodes, UOMs, purchase & sales prices, and group VAT rates."
        action={
          <Button
            variant="primary"
            onClick={openAddModal}
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 px-5 active:scale-98 transition"
          >
            <Plus className="h-4 w-4" /> Add New Product
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Total Products Registered
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {serverTotalCount} Items
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <PackageOpen className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Total Stock Asset Valuation
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {serverStockValue.toFixed(2)} OMR
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              Low Stock Warnings
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {serverLowStockCount} Items Below Min
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">Master Product Catalog</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Search by product name, barcode, or code</p>
          </div>
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Search product name, barcode, code..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span>Loading products...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-200/80 border-b border-slate-300 text-[10px] font-extrabold uppercase text-slate-800 tracking-wider">
                  <th className="p-3.5">Barcode / Product Code</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Product Group</th>
                  <th className="p-3.5 text-center">UOM</th>
                  <th className="p-3.5 text-right">Purchase Price</th>
                  <th className="p-3.5 text-right">Sales Price</th>
                  <th className="p-3.5 text-center">Group VAT %</th>
                  <th className="p-3.5 text-right">In Stock</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 font-semibold">
                {paginatedProducts.map((p) => {
                  const vatPercentageDisplay = (p.vatRate * 100).toFixed(0);
                  return (
                    <tr key={p.id} className="hover:bg-slate-200/60 transition duration-150">
                      <td className="p-3.5 font-mono text-slate-700 font-bold flex items-center gap-1.5">
                        <Barcode className="h-3.5 w-3.5 text-slate-400" />
                        <span>{p.barcode || p.id}</span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-950">{p.name}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-700">
                        <span className="uppercase text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {p.uom || "Pcs"}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-right text-slate-600">{p.buyPrice.toFixed(3)} OMR</td>
                      <td className="p-3.5 font-mono text-right text-slate-950 font-black">{p.sellPrice.toFixed(3)} OMR</td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold ${p.vatRate === 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                          {vatPercentageDisplay}% VAT
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {p.stock} {p.uom || "pcs"}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition"
                            title="Edit Product"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(p)}
                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center transition"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedProducts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                      No products found matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 bg-slate-50/50">
            <span className="text-xs text-slate-500 font-semibold">
              Showing page {page} of {totalPages} ({totalItems} total items)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="h-8 px-3 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="h-8 px-3 text-xs"
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Boxes className="h-5 w-5 text-blue-600" />
                {editingProduct ? "Edit Product Record" : "Add New Product"}
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
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hikvision 4MP IP Camera"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                      Barcode / Product Code <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition"
                      title="Open Camera Scanner"
                    >
                      <Camera className="h-3.5 w-3.5 text-blue-600" /> Scanner
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Scan with camera or type code"
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                    <Barcode className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Barcode / Product code must be unique for every item</p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Product Group <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formGroupId}
                    onChange={(e) => handleProductGroupChange(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="">Select Product Group...</option>
                    {productGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.vatPercentage}% VAT)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    UOM (Unit of Measurement) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formUom}
                    onChange={(e) => setFormUom(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="">Select UOM...</option>
                    {uoms.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} - {u.description || u.name}
                      </option>
                    ))}
                    {uoms.length === 0 && (
                      <>
                        <option value="Pcs">Pcs</option>
                        <option value="Meter">Meter</option>
                        <option value="Box">Box</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Purchase Price (OMR)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Sales Price (OMR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={formSellPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormSellPrice(val);
                      if (formBuyPrice.trim() !== "" && val.trim() !== "") {
                        const buy = parseFloat(formBuyPrice);
                        const sell = parseFloat(val);
                        if (!isNaN(buy) && !isNaN(sell) && buy < sell) {
                          if (formError === "Cost price must be less than sales price.") {
                            setFormError("");
                          }
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (formBuyPrice.trim() !== "" && val.trim() !== "") {
                        const buy = parseFloat(formBuyPrice);
                        const sell = parseFloat(val);
                        if (!isNaN(buy) && !isNaN(sell) && buy >= sell) {
                          const errMsg = "Cost price must be less than sales price.";
                          setFormError(errMsg);
                          setErrorPopupMessage(errMsg);
                        }
                      }
                    }}
                    className={`w-full h-10 rounded-xl border px-3 text-sm font-mono font-bold text-slate-900 outline-none transition ${
                      formBuyPrice !== "" && formSellPrice !== "" && parseFloat(formBuyPrice) >= parseFloat(formSellPrice)
                        ? "border-rose-500 bg-rose-50/50 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 text-rose-900"
                        : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white"
                    }`}
                  />
                  {formBuyPrice !== "" && formSellPrice !== "" && parseFloat(formBuyPrice) >= parseFloat(formSellPrice) && (
                    <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" /> Cost price must be less than sales price.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Assigned Group VAT Rate
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    placeholder="Select Product Group to view VAT rate"
                    value={formVatRate !== "" ? `${(parseFloat(formVatRate) * 100).toFixed(0)}% VAT (Derived from Product Group)` : ""}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-100 px-3 text-xs font-bold text-emerald-700 outline-none cursor-not-allowed placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Initial Stock Qty
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
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
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Boxes className="h-4 w-4" />}
                  {editingProduct ? "Save Product Changes" : "Add Product Record"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingProduct}
        title="Delete Product"
        description="Are you sure you want to delete this item profile? This action cannot be undone."
        itemName={deletingProduct ? `${deletingProduct.name} (${deletingProduct.barcode || deletingProduct.id})` : undefined}
        onConfirm={confirmDelete}
        onClose={() => setDeletingProduct(null)}
      />
      {/* Camera Barcode Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Live Camera Barcode Scanner</h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{cameraError}</span>
                </div>
                <p className="text-slate-600">
                  You can use the simulated barcode input below or type/scan directly with your barcode scanner device.
                </p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border-2 border-emerald-500/50 shadow-inner">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {/* Scanner Target Box with Pulsing Red Laser Line */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-32 border-2 border-dashed border-emerald-400 rounded-lg relative flex items-center justify-center">
                    <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse"></div>
                    <span className="absolute bottom-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-slate-900/80 px-2 py-0.5 rounded">
                      Align Barcode Here
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Test / Manual Barcode Input Overlay */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                Manual / Simulated Barcode Scan Entry
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter or scan test barcode..."
                  value={simulatedBarcode}
                  onChange={(e) => setSimulatedBarcode(e.target.value)}
                  className="flex-1 h-9 px-3 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (simulatedBarcode.trim()) {
                      setFormBarcode(simulatedBarcode.trim());
                      setSimulatedBarcode("");
                      stopCamera();
                    }
                  }}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition"
                >
                  Use Code
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={stopCamera} className="text-xs font-bold">
                Close Scanner
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Popup Modal */}
      {errorPopupMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Validation Error</h3>
                <p className="text-xs font-semibold text-rose-600">Cost Price Error</p>
              </div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm font-medium text-slate-800">
              {errorPopupMessage}
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setErrorPopupMessage(null)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl px-5 py-2.5 shadow-md shadow-rose-200"
              >
                OK, Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
