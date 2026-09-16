"use client";

import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import type { Company } from "../../data/mock";
import { money } from "../../lib/utils";
import { SectionTitle, ConfirmDeleteModal } from "../../modules/shared/screen-kit";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import type { ProductGroupItem, UomItem } from "../shared/domain";
import { UniversalProductSearch, UniversalCustomerSearch, UniversalUserSearch } from "../../components/ui/universal-search";
import {
  X,
  Loader2,
  Plus,
  Trash2,
  Check,
  FileSpreadsheet,
  Eye,
  FileText,
  ArrowRight,
  Edit,
  Printer,
  Package,
  Coins,
  TrendingUp,
  User,
  AlertCircle,
  Barcode,
  Send,
  ChevronDown,
  ListChecks,
  ShoppingCart
} from "lucide-react";

function amountInWords(amount: number, currency: string = "OMR"): string {
  if (isNaN(amount) || amount <= 0) return "Zero " + currency + " Only";
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(num: number): string {
    if (num < 20) return units[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? "-" + units[num % 10] : "");
    if (num < 1000) return units[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + convert(num % 100) : "");
    if (num < 1000000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
    return convert(Math.floor(num / 1000000)) + " Million" + (num % 1000000 ? " " + convert(num % 1000000) : "");
  }

  const whole = Math.floor(amount);
  const baisa = Math.round((amount - whole) * 1000);

  let words = whole > 0 ? convert(whole) + " " + currency : "";
  if (baisa > 0) {
    words += (whole > 0 ? " and " : "") + convert(baisa) + " Baisa";
  }
  return (words || ("Zero " + currency)) + " Only";
}

export function QuotationsPage({ activeCompany, onConvertToInvoice, onCreatePurchase }: { activeCompany: Company; onConvertToInvoice?: (quotation: any) => void; onCreatePurchase?: (quotation: any) => void }) {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<any | null>(null);
  const [printQuote, setPrintQuote] = useState<any | null>(null);

  // Views
  const [viewMode, setViewMode] = useState<"list" | "create" | "detail" | "do">("list");
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Pagination & search
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const [search, setSearch] = useState("");

  // Aggregate KPIs
  const [quoteValue, setQuoteValue] = useState(0);
  const [approvedValue, setApprovedValue] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);

  // --- Quotation Builder State ---
  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [salesman, setSalesman] = useState("");
  const [creditDays, setCreditDays] = useState("30");
  const [requestNo, setRequestNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split("T")[0]);
  const [discountAmount, setDiscountAmount] = useState("0");
  const [quoteLines, setQuoteLines] = useState<any[]>([]);
  const [editingLineIdx, setEditingLineIdx] = useState<number | null>(null);
  const [status, setStatus] = useState("Draft");
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");

  // Item Picker State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemUom, setItemUom] = useState("pcs");
  const [itemRate, setItemRate] = useState("");

  // Quick Add Client State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: "",
    vatNumber: "",
    email: "",
    contactPersonName: "",
    contactPersonNumber: "",
    industry: "",
    contacts: "",
    locations: "",
    projects: "",
    profitability: "30",
    notes: ""
  });

  // Quick Add Product State
  const [productGroups, setProductGroups] = useState<ProductGroupItem[]>([]);
  const [uomMasterList, setUomMasterList] = useState<UomItem[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductBarcode, setNewProductBarcode] = useState("");
  const [newProductGroupId, setNewProductGroupId] = useState("");
  const [newProductUom, setNewProductUom] = useState("");
  const [newProductBuyPrice, setNewProductBuyPrice] = useState("");
  const [newProductSellPrice, setNewProductSellPrice] = useState("");
  const [newProductVatRate, setNewProductVatRate] = useState("");
  const [newProductStock, setNewProductStock] = useState("");
  const [quickProductError, setQuickProductError] = useState("");
  const [quickProductErrorPopup, setQuickProductErrorPopup] = useState<string | null>(null);

  // Send Quotation Modal State
  const [deletingQuote, setDeletingQuote] = useState<any | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendQuoteTarget, setSendQuoteTarget] = useState<any | null>(null);
  const [sendEmailInput, setSendEmailInput] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendEmailSuccess, setSendEmailSuccess] = useState<string | null>(null);
  const [sendEmailError, setSendEmailError] = useState<string | null>(null);

  const openQuickProductModal = () => {
    setNewProductName("");
    setNewProductBarcode("");
    setNewProductGroupId("");
    setNewProductUom("");
    setNewProductBuyPrice("");
    setNewProductSellPrice("");
    setNewProductVatRate("");
    setNewProductStock("");
    setQuickProductError("");
    setIsProductModalOpen(true);
  };

  const handleQuickProductGroupChange = (groupId: string) => {
    setNewProductGroupId(groupId);
    const grp = productGroups.find((g) => String(g.id) === String(groupId));
    if (grp) {
      const vatDecimal = (grp.vatPercentage / 100).toString();
      setNewProductVatRate(vatDecimal);
    } else {
      setNewProductVatRate("");
    }
  };

  const fetchQuotations = (targetPage?: number) => {
    const activePage = targetPage !== undefined ? targetPage : page;
    setLoading(true);
    apiFetch<any>(`api/Quotations?companyId=${activeCompany.id}&paginate=true&page=${activePage}&pageSize=${pageSize}&search=${search}`)
      .then((data) => {
        setQuotations(data.items);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
        setQuoteValue(data.quoteValue);
        setApprovedValue(data.approvedValue);
        setExpiredCount(data.expiredCount);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching quotations:", err);
        setLoading(false);
      });
  };

  const fetchReferenceData = () => {
    // Fetch clients (non-paginated for complete list in dropdowns)
    apiFetch<any>(`api/Clients?companyId=${activeCompany.id}&paginate=false`)
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          setClients(data.items);
        } else if (Array.isArray(data)) {
          setClients(data);
        } else {
          setClients([]);
        }
      })
      .catch((err) => console.error("Error fetching clients:", err));

    // Fetch products
    apiFetch<any[]>(`api/Products?companyId=${activeCompany.id}`)
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));

    // Fetch users
    apiFetch<any[]>("api/Users")
      .then((data) => setUsers(data))
      .catch((err) => console.error("Error fetching users:", err));

    // Fetch Product Groups
    apiFetch<ProductGroupItem[]>(`api/ProductGroups?companyId=${activeCompany.id}`)
      .then((data) => setProductGroups(data || []))
      .catch((err) => console.error("Error fetching product groups:", err));

    // Fetch UOMs
    apiFetch<UomItem[]>(`api/Uoms?companyId=${activeCompany.id}`)
      .then((data) => setUomMasterList(data || []))
      .catch((err) => console.error("Error fetching UOMs:", err));
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchVal);
      setPage(1);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchVal]);

  useEffect(() => {
    fetchQuotations();
  }, [page, search, activeCompany.id]);

  useEffect(() => {
    fetchReferenceData();
  }, [activeCompany.id]);

  // Handle client selection change (pre-populate email/phone)
  useEffect(() => {
    if (customer) {
      const match = clients.find(c => c.name === customer || c.id === customer);
      if (match) {
        setEmail(match.email || "");
        setTelephone(match.contactPersonNumber || "");
      }
    }
  }, [customer, clients]);

  // Handle selected product change (pre-populate rate)
  const currentProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [selectedProductId, products]);

  useEffect(() => {
    if (currentProduct) {
      setItemRate(String(currentProduct.sellPrice));
    } else {
      setItemRate("");
    }
  }, [currentProduct]);

  // Product price history lookup
  const priceHistory = useMemo(() => {
    if (!customer || !selectedProductId) return { lastCustRate: "N/A", lastOthersRate: "N/A" };

    let lastCustRate = "N/A";
    let lastOthersRate = "N/A";

    // Scan existing quotations to simulate history
    for (const q of quotations) {
      try {
        const lines = JSON.parse(q.itemsJson || "[]");
        const matchLine = lines.find((l: any) => l.productId === selectedProductId);
        if (matchLine) {
          if (q.customer === customer) {
            lastCustRate = `${matchLine.rate.toFixed(2)} OMR (${q.expires || "Recent"})`;
          } else {
            lastOthersRate = `${matchLine.rate.toFixed(2)} OMR (${q.customer})`;
          }
        }
      } catch (e) { }
    }

    return { lastCustRate, lastOthersRate };
  }, [customer, selectedProductId, quotations]);

  // Sequence Calculations
  const calculatedTotals = useMemo(() => {
    // 1. Total Amount (sum of lines qty * rate)
    const totalAmount = quoteLines.reduce((sum, line) => sum + (line.qty * line.rate), 0);

    // 2. Less: Discount (calculated as percentage)
    const discountPct = parseFloat(discountAmount) || 0;
    const discount = Math.round(totalAmount * (discountPct / 100) * 100) / 100;

    // 3. Subtotal
    const subtotal = Math.max(totalAmount - discount, 0);

    // 4. Add: 5% VAT on subtotal
    const vat = Math.round(subtotal * 0.05 * 100) / 100;

    // 5. Grand Total
    const grandTotal = subtotal + vat;

    return {
      totalAmount,
      discount,
      discountPct,
      subtotal,
      vat,
      grandTotal
    };
  }, [quoteLines, discountAmount]);

  const handleQuotationProductChange = (pId: string) => {
    setSelectedProductId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      setItemRate(prod.sellPrice ? prod.sellPrice.toFixed(3) : "0.000");
      if (prod.uom) {
        setItemUom(prod.uom);
      }
    } else {
      setItemRate("");
    }
  };

  const handleAddLine = () => {
    if (!selectedProductId || !itemRate) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const qtyVal = parseFloat(itemQty) || 1;
    const rateVal = parseFloat(itemRate) || 0;
    const amountVal = qtyVal * rateVal;
    const vatVal = Math.round(amountVal * 0.05 * 100) / 100;
    const grossVal = amountVal + vatVal;

    const newLine = {
      slNo: quoteLines.length + 1,
      barcode: prod.id,
      productId: prod.id,
      description: prod.name,
      qty: qtyVal,
      uom: itemUom,
      rate: rateVal,
      amount: amountVal,
      vatPercent: 5.0,
      vatAmt: vatVal,
      grossAmt: grossVal
    };

    setQuoteLines(prev => [...prev, newLine]);

    // Reset picker
    setSelectedProductId("");
    setItemQty("1");
    setItemUom("pcs");
    setItemRate("");
  };

  const handleUpdateLine = (idx: number, field: string, value: any) => {
    setQuoteLines(prev => {
      const copy = [...prev];
      const line = { ...copy[idx] };

      if (field === "description") {
        line.description = value;
      } else if (field === "qty") {
        line.qty = parseFloat(value) || 0;
      } else if (field === "rate") {
        line.rate = parseFloat(value) || 0;
      }

      // Recalculate totals
      line.amount = line.qty * line.rate;
      line.vatAmt = Math.round(line.amount * 0.05 * 100) / 100;
      line.grossAmt = line.amount + line.vatAmt;

      copy[idx] = line;
      return copy;
    });
  };

  const handleRemoveLine = (idx: number) => {
    if (editingLineIdx === idx) {
      setEditingLineIdx(null);
    } else if (editingLineIdx !== null && editingLineIdx > idx) {
      setEditingLineIdx(editingLineIdx - 1);
    }
    setQuoteLines(prev => prev.filter((_, i) => i !== idx).map((line, i) => ({ ...line, slNo: i + 1 })));
  };

  const handleSaveQuotation = async () => {
    if (!customer) {
      alert("Customer is required.");
      return;
    }
    if (quoteLines.length === 0) {
      alert("At least one quotation line is required.");
      return;
    }

    setSubmitting(true);
    const payload = {
      companyId: activeCompany.id,
      customer,
      title: quoteLines[0]?.description || "Services quotation",
      amount: calculatedTotals.subtotal,
      status: status,
      expires: editingQuotation ? editingQuotation.expires : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      lastFollowUp: editingQuotation ? editingQuotation.lastFollowUp : "Not sent",
      salesperson: salesman,
      discount: parseFloat(discountAmount) || 0,
      itemsJson: JSON.stringify(quoteLines),
      notes: notes,
      termsAndConditions: termsAndConditions
    };

    try {
      if (editingQuotation) {
        await apiFetch(`api/Quotations/${editingQuotation.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("api/Quotations", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      setPage(1);
      setViewMode("list");
      fetchQuotations(1);
      // Clear fields
      setCustomer("");
      setEmail("");
      setTelephone("");
      setSalesman("");
      setRemarks("");
      setRequestNo("");
      setQuoteLines([]);
      setDiscountAmount("0");
      setStatus("Draft");
      setNotes("");
      setTermsAndConditions("");
      setEditingQuotation(null);
      setEditingLineIdx(null);
    } catch (e) {
      console.error(e);
      alert("Error saving quotation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditQuotation = (quote: any) => {
    setEditingQuotation(quote);
    setCustomer(quote.customer || "");
    setEmail(quote.email || "");
    setTelephone(quote.telephone || "");
    setSalesman(quote.salesperson || "");
    setDiscountAmount(String(quote.discount || 0));
    setRemarks(quote.remarks || "");
    setRequestNo(quote.requestNo || "");
    setQuoteDate(quote.quoteDate || new Date().toISOString().split("T")[0]);
    setStatus(quote.status || "Draft");
    setNotes(quote.notes || "");
    setTermsAndConditions(quote.termsAndConditions || "");

    try {
      const parsedLines = JSON.parse(quote.itemsJson || "[]");
      setQuoteLines(parsedLines);
    } catch (e) {
      setQuoteLines([]);
    }
    setEditingLineIdx(null);
    setViewMode("create");
  };

  const openNewQuotation = () => {
    setEditingQuotation(null);
    setCustomer("");
    setEmail("");
    setTelephone("");
    setSalesman("");
    setRemarks("");
    setRequestNo("");
    setQuoteLines([]);
    setDiscountAmount("0");
    setStatus("Draft");
    setNotes("");
    setTermsAndConditions("");
    setQuoteDate(new Date().toISOString().split("T")[0]);
    setEditingLineIdx(null);
    setViewMode("create");
  };

  const handleQuickAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.name.trim()) return;

    try {
      const payload = {
        name: newClientForm.name.trim(),
        companyId: activeCompany.id,
        vatNumber: newClientForm.vatNumber.trim(),
        email: newClientForm.email.trim(),
        contactPersonName: newClientForm.contactPersonName.trim(),
        contactPersonNumber: newClientForm.contactPersonNumber.trim(),
        industry: newClientForm.industry.trim() || "General",
        contacts: newClientForm.contacts ? newClientForm.contacts.split(",").map(c => c.trim()).filter(Boolean) : [],
        locations: newClientForm.locations ? newClientForm.locations.split(",").map(l => l.trim()).filter(Boolean) : ["Muscat"],
        projects: newClientForm.projects ? newClientForm.projects.split(",").map(p => p.trim()).filter(Boolean) : [],
        profitability: Number(newClientForm.profitability) || 30,
        notes: newClientForm.notes.trim() || "Quick added from quotation screen."
      };
      await apiFetch("api/Clients", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      fetchReferenceData();
      setCustomer(newClientForm.name.trim());
      if (newClientForm.email.trim()) setEmail(newClientForm.email.trim());
      if (newClientForm.contactPersonNumber.trim()) setTelephone(newClientForm.contactPersonNumber.trim());
      setIsClientModalOpen(false);

      // Clear fields
      setNewClientForm({
        name: "",
        vatNumber: "",
        email: "",
        contactPersonName: "",
        contactPersonNumber: "",
        industry: "",
        contacts: "",
        locations: "",
        projects: "",
        profitability: "30",
        notes: ""
      });
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error adding client.");
    }
  };

  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickProductError("");
    if (!newProductName.trim()) {
      setQuickProductError("Product Name is required.");
      return;
    }
    if (!newProductBarcode.trim()) {
      setQuickProductError("Barcode / Product Code is required.");
      return;
    }
    if (!newProductGroupId) {
      setQuickProductError("Please select a Product Group.");
      return;
    }
    if (!newProductUom) {
      setQuickProductError("Please select a UOM.");
      return;
    }

    const buyPriceVal = parseFloat(newProductBuyPrice) || 0;
    const sellPriceVal = parseFloat(newProductSellPrice) || 0;
    if (buyPriceVal >= sellPriceVal) {
      const errMsg = "Cost price must be less than sales price.";
      setQuickProductError(errMsg);
      setQuickProductErrorPopup(errMsg);
      return;
    }

    const grp = productGroups.find((g) => String(g.id) === String(newProductGroupId));

    try {
      const payload = {
        companyId: activeCompany.id,
        id: newProductBarcode.trim(),
        barcode: newProductBarcode.trim(),
        name: newProductName.trim(),
        productGroupId: newProductGroupId,
        category: grp ? grp.name : "General",
        uom: newProductUom,
        buyPrice: parseFloat(newProductBuyPrice) || 0,
        sellPrice: parseFloat(newProductSellPrice) || 0,
        vatRate: parseFloat(newProductVatRate) || 0,
        stock: parseInt(newProductStock) || 0,
        minStock: 5,
        type: "Product"
      };
      const res = await apiFetch<any>("api/Products", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setIsProductModalOpen(false);
      // Refresh reference data
      const updatedProds = await apiFetch<any[]>(`api/Products?companyId=${activeCompany.id}`);
      setProducts(updatedProds || []);
      // Select new product
      setSelectedProductId(res.id || payload.id);
      setItemRate(res.sellPrice ? res.sellPrice.toFixed(3) : "0.000");
      if (res.uom) setItemUom(res.uom);
    } catch (err: any) {
      console.error(err);
      setQuickProductError(err.message || "Error adding product. Ensure barcode is unique.");
    }
  };

  const handleConvertInvoice = async (quote: any) => {
    try {
      setLoading(true);
      await apiFetch(`api/Invoices/convert-quotation/${quote.id}`, {
        method: "POST"
      });
      fetchQuotations();
      setViewMode("list");
      if (onConvertToInvoice) {
        onConvertToInvoice(quote);
      } else {
        alert("Successfully converted quotation to invoice!");
      }
    } catch (err) {
      console.error(err);
      if (onConvertToInvoice) {
        onConvertToInvoice(quote);
      } else {
        alert("Conversion failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    try {
      await apiFetch(`api/Quotations/${id}`, { method: "DELETE" });
      fetchQuotations();
      if (selectedQuote?.id === id) {
        setViewMode("list");
        setSelectedQuote(null);
      }
      setDeletingQuote(null);
    } catch (err: any) {
      console.error("Error deleting quotation:", err);
      alert(err.message || "Failed to delete quotation.");
      setDeletingQuote(null);
    }
  };

  const handleOpenSendModal = (quotation: any) => {
    setSendQuoteTarget(quotation);
    setSendEmailSuccess(null);
    setSendEmailError(null);

    // Auto-fill email by matching customer in clients list
    let customerMail = "";
    if (quotation.customer) {
      const match = clients.find(
        (c) => c.name?.toLowerCase() === quotation.customer?.toLowerCase() || c.id === quotation.customer
      );
      if (match && match.email) {
        customerMail = match.email;
      }
    }
    setSendEmailInput(customerMail);
    setSendModalOpen(true);
  };

  const handleSendQuotationEmail = async () => {
    if (!sendQuoteTarget) return;
    if (!sendEmailInput || !sendEmailInput.trim()) {
      setSendEmailError("Please enter a valid recipient email address.");
      return;
    }

    setSendingEmail(true);
    setSendEmailError(null);
    try {
      await apiFetch<any>(`api/Quotations/${sendQuoteTarget.id}/send-email`, {
        method: "POST",
        body: JSON.stringify({ email: sendEmailInput.trim() })
      });

      setSendEmailSuccess(`Quotation ${sendQuoteTarget.id} successfully sent to ${sendEmailInput.trim()}!`);

      // Update local quotations state & selected quote status to Sent
      const todayStr = new Date().toISOString().split("T")[0];
      setQuotations((prev) =>
        prev.map((q) => (q.id === sendQuoteTarget.id ? { ...q, status: "Sent", lastFollowUp: todayStr } : q))
      );
      if (selectedQuote && selectedQuote.id === sendQuoteTarget.id) {
        setSelectedQuote((prev: any) => ({ ...prev, status: "Sent", lastFollowUp: todayStr }));
      }

      setTimeout(() => {
        setSendModalOpen(false);
        setSendQuoteTarget(null);
        setSendEmailSuccess(null);
      }, 1600);
    } catch (err: any) {
      console.error("Error sending quotation email:", err);
      setSendEmailError(err?.message || "Failed to send quotation email. Please try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-4">
      {viewMode === "list" && (
        <>
          <SectionTitle
            title="Sales Quotations"
            subtitle="GGMS Oman quotation register with detailed item billing and automatic invoice conversions."
          />

          {/* Top KPI Dash Grid */}
          <div className="grid gap-6 md:grid-cols-4">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  Open Quotations
                </span>
                <span className="text-xl font-black text-slate-900 block leading-tight">
                  {totalItems} Quotes
                </span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                <Coins className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  Quote Value
                </span>
                <span className="text-xl font-black text-slate-900 block leading-tight">
                  {money(quoteValue, activeCompany.currency)}
                </span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  Approved Value
                </span>
                <span className="text-xl font-black text-slate-900 block leading-tight">
                  {money(approvedValue, activeCompany.currency)}
                </span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex items-start gap-4 hover:shadow-md transition duration-200">
              <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  Expired Drafts
                </span>
                <span className="text-xl font-black text-slate-900 block leading-tight">
                  {expiredCount} Expired
                </span>
              </div>
            </div>
          </div>

          {/* Search container */}
          <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search quotations by customer, title, status..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 placeholder-slate-400 outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>
            <Button
              variant="primary"
              onClick={openNewQuotation}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-xl shadow-md shadow-blue-500/10 flex items-center gap-1.5 transition active:scale-98"
            >
              <Plus className="h-4 w-4" /> New Quotation
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
                  <CardTitle className="text-base font-bold text-slate-800">Quotation Register</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Commercial quotations registered for active company workspaces</p>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-200/80 border-b border-slate-300 text-[10px] font-extrabold uppercase text-slate-800 tracking-wider">
                      <th className="p-3.5 w-14 text-center">Sl No</th>
                      <th className="p-3.5 w-32 text-center">Quotation No</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Subject / Title</th>
                      <th className="p-3.5">Representative</th>
                      <th className="p-3.5 text-right">Amount</th>
                      <th className="p-3.5 text-right">VAT</th>
                      <th className="p-3.5 w-24 text-center">Status</th>
                      <th className="p-3.5 w-28">Expires</th>
                      <th className="p-3.5 w-28 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {quotations.map((quotation, index) => (
                      <tr
                        key={quotation.id}
                        className={`transition duration-150 hover:bg-slate-200/60 ${openActionMenuId === quotation.id ? "bg-slate-200/80" : ""
                          }`}
                      >
                        <td className="p-3.5 font-bold text-slate-500 text-center font-mono">{(page - 1) * pageSize + index + 1}</td>
                        <td className="p-3.5 text-center font-mono">
                          <button
                            type="button"
                            onClick={() => setPrintQuote(quotation)}
                            className="font-extrabold text-blue-600 hover:text-blue-800 hover:underline transition cursor-pointer"
                            title="Click to open print preview"
                          >
                            {quotation.id}
                          </button>
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">{quotation.customer}</td>
                        <td className="p-3.5 font-semibold text-slate-700">{quotation.title}</td>
                        <td className="p-3.5 text-slate-605 font-medium">{quotation.salesperson || "Unassigned"}</td>
                        <td className="p-3.5 font-mono text-right font-bold text-slate-800">{money(quotation.amount, activeCompany.currency)}</td>
                        <td className="p-3.5 font-mono text-right text-slate-500 font-semibold">{money(quotation.vat, activeCompany.currency)}</td>
                        <td className="p-3.5 text-center">
                          <Badge
                            variant={quotation.status === "Approved" ? "success" : quotation.status === "Expired" ? "danger" : quotation.status === "Sent" ? "info" : "warning"}
                            className="font-bold text-[10px] px-2 py-0.5 rounded"
                          >
                            {quotation.status}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-500">{quotation.expires}</td>
                        <td className="p-3.5 text-center">
                          <div className="relative inline-block text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(openActionMenuId === quotation.id ? null : quotation.id);
                              }}
                              className="h-8 px-3 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-xs border border-slate-500/60"
                              title="Actions Menu"
                            >
                              <ListChecks className="h-4 w-4 text-white" />
                              <ChevronDown className="h-3 w-3 text-slate-200 fill-slate-200" />
                            </button>

                            {openActionMenuId === quotation.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setOpenActionMenuId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1.5 z-50 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 text-left text-xs font-semibold animate-in fade-in duration-150">
                                  <button
                                    type="button"
                                    onClick={() => { setOpenActionMenuId(null); handleOpenSendModal(quotation); }}
                                    className="w-full px-3.5 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition"
                                  >
                                    <Send className="h-3.5 w-3.5 text-indigo-500" /> Send Quotation
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setOpenActionMenuId(null); setPrintQuote(quotation); }}
                                    className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition"
                                  >
                                    <Printer className="h-3.5 w-3.5 text-slate-500" /> Print Quotation
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setOpenActionMenuId(null); setSelectedQuote(quotation); setViewMode("detail"); }}
                                    className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-slate-500" /> View Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setOpenActionMenuId(null); handleEditQuotation(quotation); }}
                                    className="w-full px-3.5 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition"
                                  >
                                    <Edit className="h-3.5 w-3.5 text-blue-500" /> Edit Quotation
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setOpenActionMenuId(null); handleConvertInvoice(quotation); }}
                                    className="w-full px-3.5 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-2 transition"
                                  >
                                    <ArrowRight className="h-3.5 w-3.5 text-emerald-500" /> Convert to Invoice
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setOpenActionMenuId(null); if (onCreatePurchase) onCreatePurchase(quotation); }}
                                    className="w-full px-3.5 py-2 text-slate-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2 transition"
                                  >
                                    <ShoppingCart className="h-3.5 w-3.5 text-purple-500" /> Create Purchase
                                  </button>
                                  <div className="my-1 border-t border-slate-100" />
                                  <button
                                    type="button"
                                    onClick={() => { setOpenActionMenuId(null); setDeletingQuote(quotation); }}
                                    className="w-full px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-rose-500" /> Delete Quotation
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {quotations.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                          No quotations matching search conditions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl border border-slate-200/80 shadow-sm text-sm">
            <span className="text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{quotations.length}</span> of{" "}
              <span className="font-bold text-slate-800">{totalItems}</span> registered quotations
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="h-9 px-3 rounded-lg"
              >
                Previous
              </Button>
              <span className="text-slate-505 text-xs px-2 font-medium">
                Page <span className="font-bold text-slate-800">{page}</span> of{" "}
                <span className="font-bold text-slate-800">{totalPages || 1}</span>
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="h-9 px-3 rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* --- Detailed Sales Quotation Builder --- */}
      {viewMode === "create" && (
        <div className="grid gap-8 animate-fade-in">
          {/* Header Card */}
          <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 overflow-visible bg-slate-50/30">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-xl"></div>
            <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-800">{editingQuotation ? `Edit Sales Quotation: ${editingQuotation.id}` : "Sales Quotation Builder"}</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">{editingQuotation ? "Modify details and pricing lines for this commercial quote." : "Construct detailed items quotation with price histories and custom parameters."}</p>
                </div>
              </div>
              <Button variant="secondary" onClick={() => { setViewMode("list"); setEditingQuotation(null); }} className="h-9 px-3 rounded-lg">
                <X className="h-4 w-4" /> Close
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-5 overflow-visible">
              {/* Header parameters grid */}
              <div className="grid gap-5 sm:grid-cols-3 relative z-30">
                <div className="relative z-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Customer</label>
                    <button type="button" onClick={() => setIsClientModalOpen(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5 transition">
                      <Plus className="h-3 w-3" /> Quick Add
                    </button>
                  </div>
                  <UniversalCustomerSearch
                    clients={clients}
                    selectedCustomer={customer}
                    onSelectCustomer={(clientName) => setCustomer(clientName)}
                    placeholder="Search customer by name, code, email..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="info@client.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Telephone / Phone</label>
                  <input
                    type="text"
                    placeholder="Contact phone number"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3 relative z-[20]">
                <div className="relative z-[50]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Salesman / Assigned User</label>
                  <UniversalUserSearch
                    users={users}
                    selectedUser={salesman}
                    onSelectUser={(userVal) => setSalesman(userVal)}
                    placeholder="Search salesperson by name or email..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Credit Days</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={creditDays}
                    onChange={(e) => setCreditDays(e.target.value)}
                    className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-mono font-bold text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Quotation Date</label>
                  <input
                    type="date"
                    value={quoteDate}
                    onChange={(e) => setQuoteDate(e.target.value)}
                    className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3 relative z-10">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Request No / Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. REQ_123"
                    value={requestNo}
                    onChange={(e) => setRequestNo(e.target.value)}
                    className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Remarks / Scope Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Validity 30 Days."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div className="flex flex-col justify-center bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Status Mode</span>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    {["Draft", "Sent", "Approved", "Expired"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(st)}
                        className={`flex-1 text-center py-1.5 text-[10px] font-black uppercase rounded transition-all duration-200 ${status === st
                          ? "bg-white text-blue-600 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                          }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Item Picker Section */}
          <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
            <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-800">Quotation Line Items</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Manage details of items included in the quotation, tax rates and totals</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Elegant Line Item Entry Panel */}
              <div className="p-6 bg-slate-50/50 border-b border-slate-200/85">
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Left Side: Input Fields (2/3 width) */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                      Add item details
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-bold uppercase text-slate-500">Product / Item Description</label>
                          <button type="button" onClick={openQuickProductModal} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition">
                            <Plus className="h-3 w-3" /> Quick Add Product
                          </button>
                        </div>
                        <UniversalProductSearch
                          products={products}
                          selectedProductId={selectedProductId}
                          onSelectProduct={(prod) => {
                            if (prod) {
                              handleQuotationProductChange(prod.id);
                            } else {
                              handleQuotationProductChange("");
                            }
                          }}
                          placeholder="Type product name, code or category..."
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5 font-sans">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={itemQty}
                          onChange={(e) => setItemQty(e.target.value)}
                          className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 font-mono font-bold text-right outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">UOM</label>
                        <select
                          value={itemUom}
                          onChange={(e) => setItemUom(e.target.value)}
                          className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                        >
                          <option value="Pcs">Pcs</option>
                          <option value="pcs">pcs</option>
                          <option value="Meter">Meter</option>
                          <option value="mtr">mtr</option>
                          <option value="Box">Box</option>
                          <option value="box">box</option>
                          <option value="Kg">Kg</option>
                          <option value="Set">Set</option>
                          <option value="Roll">Roll</option>
                          <option value="job">job</option>
                          <option value="pack">pack</option>
                          {itemUom && !["Pcs", "pcs", "Meter", "mtr", "Box", "box", "Kg", "Set", "Roll", "job", "pack"].includes(itemUom) && (
                            <option value={itemUom}>{itemUom}</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5 font-sans">Rate (OMR)</label>
                        <input
                          type="number"
                          step="0.001"
                          placeholder="0.000"
                          value={itemRate}
                          onChange={(e) => setItemRate(e.target.value)}
                          className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 font-mono font-bold text-right outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">VAT %</label>
                        <input
                          type="text"
                          disabled
                          value="5.000"
                          className="block w-full h-10 rounded-xl border border-slate-100 bg-slate-100 px-3 py-2 text-sm text-slate-400 font-semibold text-center outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Live calculations */}
                  {(() => {
                    const qVal = parseFloat(itemQty) || 0;
                    const rVal = parseFloat(itemRate) || 0;
                    const lineAmt = qVal * rVal;
                    const lineVat = lineAmt * 0.05;
                    const lineGross = lineAmt + lineVat;

                    return (
                      <div className="bg-slate-100/60 rounded-2xl p-5 border border-slate-200/60 flex flex-col justify-between space-y-4">
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Subtotal Amount:</span>
                            <span className="font-mono font-semibold text-slate-700">{lineAmt.toFixed(2)} OMR</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">VAT (5.0%):</span>
                            <span className="font-mono font-semibold text-slate-700">+{lineVat.toFixed(2)} OMR</span>
                          </div>
                          <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm">
                            <span className="text-slate-900 font-bold">Gross Total:</span>
                            <span className="font-mono font-black text-slate-950 text-base">{lineGross.toFixed(2)} OMR</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!selectedProductId || !itemRate}
                          onClick={handleAddLine}
                          className={`w-full h-10 font-bold rounded-xl text-xs transition shadow-sm active:scale-[0.97] flex items-center justify-center gap-1.5 ${selectedProductId && itemRate
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/15"
                            : "bg-slate-300 text-slate-400 cursor-not-allowed"
                            }`}
                        >
                          <Plus className="h-4 w-4" /> Add Line Item
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Price History dashboard widgets */}
                {selectedProductId && (
                  <div className="grid gap-4 sm:grid-cols-4 mt-6 pt-5 border-t border-slate-200/50">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Stock Qty</span>
                        <span className="text-sm font-black text-slate-900">{currentProduct?.stock ?? 0} {itemUom}</span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-505 shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Last Cust. Rate</span>
                        <span className="text-sm font-black text-indigo-950 truncate max-w-[130px] block leading-tight mt-0.5">{priceHistory.lastCustRate}</span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-505 shrink-0">
                        <Coins className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Last Others Rate</span>
                        <span className="text-sm font-black text-slate-800 truncate max-w-[130px] block leading-tight mt-0.5">{priceHistory.lastOthersRate}</span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Buying Margin</span>
                        <span className="text-sm font-black text-emerald-600 block mt-0.5">
                          {currentProduct ? `${(currentProduct.sellPrice - currentProduct.buyPrice).toFixed(2)} OMR` : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Grid list of added lines */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-700 tracking-wider">
                      <th className="p-3.5 w-16 text-center">SlNo</th>
                      <th className="p-3.5 w-28">BarCode</th>
                      <th className="p-3.5">Description</th>
                      <th className="p-3.5 w-24 text-right">Qty</th>
                      <th className="p-3.5 w-20 text-center">UOM</th>
                      <th className="p-3.5 w-24 text-right">Rate</th>
                      <th className="p-3.5 w-28 text-right">Amount</th>
                      <th className="p-3.5 w-16 text-right">VAT %</th>
                      <th className="p-3.5 w-24 text-right">VAT Amt</th>
                      <th className="p-3.5 w-28 text-right">Gross Amt</th>
                      <th className="p-3.5 w-24 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {quoteLines.map((line, idx) => {
                      const isEditing = editingLineIdx === idx;
                      return (
                        <tr key={idx} className={`hover:bg-slate-50/50 transition duration-150 ${isEditing ? "bg-amber-50/30" : ""}`}>
                          <td className="p-3.5 font-bold text-slate-400 text-center">{line.slNo}</td>
                          <td className="p-3.5 font-mono text-slate-600">{line.barcode}</td>
                          <td className="p-3.5 font-bold text-slate-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={line.description}
                                onChange={(e) => handleUpdateLine(idx, "description", e.target.value)}
                                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-950 font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                              />
                            ) : (
                              line.description
                            )}
                          </td>
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
                              <div className="flex justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingLineIdx(idx)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition active:scale-90"
                                  title="Edit item"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(idx)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition active:scale-90"
                                  title="Remove item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {quoteLines.length === 0 && (
                      <tr>
                        <td colSpan={11} className="p-12 text-center">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 shadow-2xs">
                              <FileSpreadsheet className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">Builder lines are empty</p>
                              <p className="text-xs text-slate-400 mt-1">Select products and add lines above to construct the commercial quotation sheet details.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Calculations section */}
          <div className="grid gap-8 md:grid-cols-2 pt-2">
            <div className="space-y-4 max-w-md w-full">
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Discount Amount (%)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 font-mono font-bold text-right outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Quotation Notes (Internal)</label>
                <textarea
                  rows={2}
                  placeholder="Internal reminders, remarks or transaction records..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Terms & Conditions (Visible)</label>
                <textarea
                  rows={2}
                  placeholder="Warranty period, payment structure, delivery options..."
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/80 space-y-3 justify-self-end w-full max-w-sm text-xs font-semibold h-fit shadow-2xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Total Amount:</span>
                <span className="font-mono font-bold text-slate-700 text-sm">{calculatedTotals.totalAmount.toFixed(2)} OMR</span>
              </div>
              <div className="flex justify-between items-center text-red-600">
                <span>Less: Discount ({calculatedTotals.discountPct}%):</span>
                <span className="font-mono font-bold">-{calculatedTotals.discount.toFixed(2)} OMR</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-2.5 text-slate-850 font-bold">
                <span>Subtotal:</span>
                <span className="font-mono text-sm">{calculatedTotals.subtotal.toFixed(2)} OMR</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Add: 5% VAT Amount:</span>
                <span className="font-mono text-slate-750 font-bold">{calculatedTotals.vat.toFixed(2)} OMR</span>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-4.5 rounded-2xl text-white shadow-md shadow-blue-500/15">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                <div className="flex justify-between items-center relative z-10">
                  <span className="font-bold uppercase text-[10px] tracking-widest text-blue-100">
                    Grand Total
                  </span>
                  <div className="text-right">
                    <span className="font-mono font-black text-xl tracking-tight block">
                      {calculatedTotals.grandTotal.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-blue-100 font-bold uppercase tracking-wider">
                      OMR Total Due
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/60">
            <Button variant="secondary" onClick={() => { setViewMode("list"); setEditingQuotation(null); }} disabled={submitting} className="h-10 rounded-xl font-bold">Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSaveQuotation}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 rounded-xl shadow-md shadow-emerald-500/10 flex items-center gap-1.5 transition active:scale-98"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving Quote...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Save Quotation
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* --- Detailed Quote view with Convert option --- */}
      {viewMode === "detail" && selectedQuote && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Sales Quotation: {selectedQuote.id}</h2>
                <p className="text-xs text-slate-500">Detailed line breakdown, follow-ups, and convert-to-billing options.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setViewMode("list")} className="h-9 rounded-lg font-bold">Back</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleOpenSendModal(selectedQuote)}
                className="flex items-center gap-1.5 h-9 rounded-lg font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Send className="h-4 w-4" /> Send Quotation
              </Button>
              <Button type="button" variant="secondary" onClick={() => setPrintQuote(selectedQuote)} className="flex items-center gap-1.5 h-9 rounded-lg font-bold">
                <Printer className="h-4 w-4" /> Print Preview
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { if (onCreatePurchase) onCreatePurchase(selectedQuote); }}
                className="flex items-center gap-1.5 h-9 rounded-lg font-bold border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <ShoppingCart className="h-4 w-4 text-purple-600" /> Create Purchase
              </Button>
              <Button
                variant="primary"
                disabled={selectedQuote.status === "Approved"}
                onClick={() => handleConvertInvoice(selectedQuote)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-lg shadow-sm shadow-emerald-500/10 flex items-center gap-1.5 transition active:scale-98"
              >
                <ArrowRight className="h-4 w-4" /> Convert to Invoice
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 bg-slate-50 rounded-2xl p-5 border border-slate-100 text-xs font-semibold">
            <div className="space-y-0.5">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Customer:</span>
              <span className="font-bold text-slate-900 text-sm block">{selectedQuote.customer}</span>
            </div>
            <div className="space-y-0.5">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Salesperson:</span>
              <span className="font-bold text-slate-900 text-sm block">{selectedQuote.salesperson || "Unassigned"}</span>
            </div>
            <div className="space-y-0.5">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Expires:</span>
              <span className="font-bold text-slate-900 text-sm block">{selectedQuote.expires}</span>
            </div>
          </div>

          {/* Render Lines */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-700 tracking-wider">
                  <th className="p-3.5 w-16 text-center">#</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 w-24 text-right">Qty</th>
                  <th className="p-3.5 w-20 text-center">UOM</th>
                  <th className="p-3.5 w-28 text-right">Rate</th>
                  <th className="p-3.5 w-28 text-right">Amount</th>
                  <th className="p-3.5 w-28 text-right">VAT Amt</th>
                  <th className="p-3.5 w-32 text-right">Gross Amt</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 font-semibold">
                {(JSON.parse(selectedQuote.itemsJson || "[]") as any[]).map((line: any) => (
                  <tr key={line.slNo}>
                    <td className="p-3.5 text-slate-400 text-center font-bold">{line.slNo}</td>
                    <td className="p-3.5 font-bold text-slate-900">{line.description}</td>
                    <td className="p-3.5 font-mono text-right text-slate-800 font-bold">{line.qty}</td>
                    <td className="p-3.5 text-center"><Badge variant="default" className="bg-slate-200/50 hover:bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">{line.uom}</Badge></td>
                    <td className="p-3.5 font-mono text-right text-slate-600 font-semibold">{line.rate.toFixed(2)} OMR</td>
                    <td className="p-3.5 font-mono text-right text-slate-800 font-bold">{line.amount.toFixed(2)} OMR</td>
                    <td className="p-3.5 font-mono text-right text-slate-600 font-semibold">{line.vatAmt.toFixed(2)} OMR</td>
                    <td className="p-3.5 font-mono text-right text-slate-950 font-black">{line.grossAmt.toFixed(2)} OMR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Sequence */}
          <div className="flex justify-end">
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/80 space-y-2.5 w-full max-w-sm text-xs font-semibold shadow-2xs">
              {selectedQuote.discount > 0 ? (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>Total Amount:</span>
                    <span className="font-mono font-bold">{(selectedQuote.amount / (1 - (selectedQuote.discount / 100))).toFixed(2)} OMR</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Less: Discount ({selectedQuote.discount}%):</span>
                    <span className="font-mono font-bold">-{(selectedQuote.amount / (1 - (selectedQuote.discount / 100)) * (selectedQuote.discount / 100)).toFixed(2)} OMR</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-2.5 font-bold text-slate-800">
                    <span>Subtotal:</span>
                    <span className="font-mono">{selectedQuote.amount.toFixed(2)} OMR</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedQuote.amount.toFixed(2)} OMR</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Add: 5% VAT:</span>
                <span className="font-mono font-semibold text-slate-700">{selectedQuote.vat.toFixed(2)} OMR</span>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-4.5 rounded-2xl text-white shadow-md shadow-blue-500/15">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                <div className="flex justify-between items-center relative z-10">
                  <span className="font-bold uppercase text-[10px] tracking-widest text-blue-100">
                    Grand Total
                  </span>
                  <div className="text-right">
                    <span className="font-mono font-black text-xl tracking-tight block">
                      {(selectedQuote.amount + selectedQuote.vat).toFixed(2)}
                    </span>
                    <span className="text-[9px] text-blue-100 font-bold uppercase tracking-wider">
                      OMR Total Due
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(selectedQuote.notes || selectedQuote.termsAndConditions) && (
            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-slate-200/60 text-xs font-semibold">
              {selectedQuote.notes && (
                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 shadow-2xs">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Notes / Remarks:</span>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">{selectedQuote.notes}</p>
                </div>
              )}
              {selectedQuote.termsAndConditions && (
                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 shadow-2xs">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Terms & Conditions:</span>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">{selectedQuote.termsAndConditions}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}



      {/* --- Quick Add Client Modal */}
      {isClientModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsClientModalOpen(false); }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in"
        >
          <div className="relative bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" /> Quick Add Customer
                </h3>
                <p className="text-xs text-slate-500 font-semibold">Create a new customer profile with full system parameters.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleQuickAddClient} className="flex-1 overflow-y-auto p-6 space-y-4 font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Client / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smart Tech LLC"
                    value={newClientForm.name}
                    onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
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
                    value={newClientForm.vatNumber}
                    onChange={(e) => setNewClientForm({ ...newClientForm, vatNumber: e.target.value })}
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
                    value={newClientForm.email}
                    onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
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
                    value={newClientForm.contactPersonName}
                    onChange={(e) => setNewClientForm({ ...newClientForm, contactPersonName: e.target.value })}
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
                    value={newClientForm.contactPersonNumber}
                    onChange={(e) => setNewClientForm({ ...newClientForm, contactPersonNumber: e.target.value })}
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
                  value={newClientForm.industry}
                  onChange={(e) => setNewClientForm({ ...newClientForm, industry: e.target.value })}
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
                  value={newClientForm.contacts}
                  onChange={(e) => setNewClientForm({ ...newClientForm, contacts: e.target.value })}
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
                    value={newClientForm.locations}
                    onChange={(e) => setNewClientForm({ ...newClientForm, locations: e.target.value })}
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
                    value={newClientForm.projects}
                    onChange={(e) => setNewClientForm({ ...newClientForm, projects: e.target.value })}
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
                    value={newClientForm.profitability}
                    onChange={(e) => setNewClientForm({ ...newClientForm, profitability: e.target.value })}
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
                  placeholder="Additional client details..."
                  value={newClientForm.notes}
                  onChange={(e) => setNewClientForm({ ...newClientForm, notes: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setIsClientModalOpen(false)} className="h-10 rounded-xl font-bold">Cancel</Button>
                <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 rounded-xl shadow-md shadow-blue-500/10">Add Customer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Quick Add Product Modal --- */}
      {isProductModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsProductModalOpen(false); }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-955/60 backdrop-blur-md p-4 animate-fade-in"
        >
          <div className="relative bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-500" /> Quick Add Product
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Add product inventories to billing master data</p>
              </div>
              <button type="button" onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition p-1 hover:bg-slate-50 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {quickProductError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{quickProductError}</span>
              </div>
            )}

            <form onSubmit={handleQuickAddProduct} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hikvision 4MP IP Camera"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Barcode / Product Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Scan with camera or type code"
                      value={newProductBarcode}
                      onChange={(e) => setNewProductBarcode(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                    <Barcode className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Barcode / Product code must be unique</p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Product Group <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={newProductGroupId}
                    onChange={(e) => handleQuickProductGroupChange(e.target.value)}
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
                    value={newProductUom}
                    onChange={(e) => setNewProductUom(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="">Select UOM...</option>
                    {uomMasterList.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} - {u.description || u.name}
                      </option>
                    ))}
                    {uomMasterList.length === 0 && (
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
                    value={newProductBuyPrice}
                    onChange={(e) => setNewProductBuyPrice(e.target.value)}
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
                    value={newProductSellPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewProductSellPrice(val);
                      if (newProductBuyPrice.trim() !== "" && val.trim() !== "") {
                        const buy = parseFloat(newProductBuyPrice);
                        const sell = parseFloat(val);
                        if (!isNaN(buy) && !isNaN(sell) && buy < sell) {
                          if (quickProductError === "Cost price must be less than sales price.") {
                            setQuickProductError("");
                          }
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (newProductBuyPrice.trim() !== "" && val.trim() !== "") {
                        const buy = parseFloat(newProductBuyPrice);
                        const sell = parseFloat(val);
                        if (!isNaN(buy) && !isNaN(sell) && buy >= sell) {
                          const errMsg = "Cost price must be less than sales price.";
                          setQuickProductError(errMsg);
                          setQuickProductErrorPopup(errMsg);
                        }
                      }
                    }}
                    className={`w-full h-10 rounded-xl border px-3 text-sm font-mono font-bold text-slate-900 outline-none transition ${newProductBuyPrice !== "" && newProductSellPrice !== "" && parseFloat(newProductBuyPrice) >= parseFloat(newProductSellPrice)
                      ? "border-rose-500 bg-rose-50/50 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 text-rose-900"
                      : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white"
                      }`}
                  />
                  {newProductBuyPrice !== "" && newProductSellPrice !== "" && parseFloat(newProductBuyPrice) >= parseFloat(newProductSellPrice) && (
                    <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" /> Cost price must be less than sales price.
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
                    value={newProductVatRate !== "" ? `${(parseFloat(newProductVatRate) * 100).toFixed(0)}% VAT (Derived from Product Group)` : ""}
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
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setIsProductModalOpen(false)} className="h-10 rounded-xl font-bold">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 rounded-xl shadow-md shadow-emerald-500/20">
                  Save Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Quotation Print Modal Overlay --- */}
      {printQuote && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setPrintQuote(null); }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 backdrop-blur-md p-4 overflow-y-auto print:p-0 print:bg-white print:static animate-fade-in"
        >
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-8 space-y-6 print:border-none print:shadow-none print:p-0 my-6 print:my-0 text-slate-900">
            {/* Header (hidden on print) */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 uppercase">
                    Print Quotation Preview
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official Quotation format matching standard company layout
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                >
                  <Printer className="h-4 w-4" /> Print Sheet
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPrintQuote(null)}
                  className="font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5"
                >
                  <X className="h-4 w-4" /> Close
                </Button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-6 bg-white text-slate-900 font-sans space-y-6 print:p-0 print:shadow-none">
              
              {/* Header Section */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 gap-6">
                <div className="flex items-start gap-4">
                  {activeCompany.logoUrl ? (
                    <img
                      src={activeCompany.logoUrl}
                      alt={activeCompany.name}
                      className="h-16 w-auto max-w-[240px] object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white text-2xl font-black">
                      {activeCompany.name?.charAt(0) || "G"}
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">{activeCompany.name}</h2>
                      {activeCompany.branch && (
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          {activeCompany.branch}
                        </span>
                      )}
                    </div>
                    {activeCompany.address && (
                      <p className="text-xs text-slate-700 font-medium leading-relaxed max-w-lg">{activeCompany.address}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 flex-wrap pt-0.5">
                      {activeCompany.taxNumber && <span>VAT No: <strong className="text-slate-900 font-mono">{activeCompany.taxNumber}</strong></span>}
                      {activeCompany.crNumber && <span>CR No: <strong className="text-slate-900 font-mono">{activeCompany.crNumber}</strong></span>}
                      {activeCompany.contactNo && <span>Tel: <strong className="text-slate-900">{activeCompany.contactNo}</strong></span>}
                      {activeCompany.email && <span>Email: <strong className="text-slate-900">{activeCompany.email}</strong></span>}
                    </div>
                  </div>
                </div>

                <div className="text-right whitespace-nowrap space-y-1">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-md">
                    Quotation
                  </div>
                  <h1 className="text-2xl font-black font-mono tracking-tight text-slate-900">{printQuote.id}</h1>
                  <p className="text-xs font-semibold text-slate-500">Date: {printQuote.quoteDate || new Date().toISOString().split("T")[0]}</p>
                </div>
              </div>

              {/* Customer & Document Details Grid */}
              {(() => {
                const clientMatch = clients.find(
                  (c) =>
                    c.name === printQuote.customer ||
                    c.id === printQuote.customerId ||
                    c.id === printQuote.customerNo ||
                    (c.name && printQuote.customer && c.name.toLowerCase() === printQuote.customer.toLowerCase())
                );

                const customerNoVal = printQuote.customerNo || printQuote.customerId || clientMatch?.id || "CLT-1001";
                const companyVal = printQuote.customerCompany || clientMatch?.name || printQuote.customer || "N/A";
                const nameVal = printQuote.customerName || clientMatch?.contactPersonName || clientMatch?.name || printQuote.customer || "N/A";
                const emailVal = printQuote.email || clientMatch?.email || (Array.isArray(clientMatch?.contacts) && clientMatch.contacts.length > 0 ? (clientMatch.contacts[0].contactName || clientMatch.contacts[0]) : "") || "N/A";
                const phoneVal = printQuote.telephone || clientMatch?.contactPersonNumber || clientMatch?.phone || "N/A";

                let addressVal = printQuote.address || "";
                if (!addressVal && clientMatch) {
                  if (Array.isArray(clientMatch.locations) && clientMatch.locations.length > 0) {
                    addressVal = clientMatch.locations.map((loc: any) => typeof loc === "string" ? loc : (loc.locationName || loc.name || "")).filter(Boolean).join(", ");
                  } else if (clientMatch.address) {
                    addressVal = clientMatch.address;
                  }
                }
                if (!addressVal) {
                  addressVal = "Muscat, Sultanate of Oman";
                }

                const vatinVal = printQuote.vatin || clientMatch?.vatNumber || clientMatch?.vatin || "N/A";
                const paymentTermVal = printQuote.paymentTerms || clientMatch?.paymentTerms || "CHEQUE";

                return (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Customer Box */}
                    <div className="md:col-span-7 rounded-xl border border-slate-300 bg-slate-50/50 p-4 space-y-2 text-xs">
                      <div className="text-xs font-black uppercase text-slate-900 tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
                        <span>Billed To / Customer Details</span>
                        <span className="font-mono text-[11px] font-bold text-blue-700">{customerNoVal}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-slate-800">
                        <div><span className="font-bold text-slate-900">Company:</span> {companyVal}</div>
                        <div><span className="font-bold text-slate-900">Contact:</span> {nameVal}</div>
                        <div><span className="font-bold text-slate-900">Email:</span> {emailVal}</div>
                        <div><span className="font-bold text-slate-900">Phone:</span> {phoneVal}</div>
                        <div className="col-span-2"><span className="font-bold text-slate-900">Address:</span> {addressVal}</div>
                        <div><span className="font-bold text-slate-900">VATIN:</span> <span className="font-mono">{vatinVal}</span></div>
                        <div><span className="font-bold text-slate-900">Payment Term:</span> <span className="font-semibold">{paymentTermVal}</span></div>
                      </div>
                    </div>

                    {/* Quotation Ref Box */}
                    <div className="md:col-span-5 rounded-xl border border-slate-300 bg-slate-50/50 p-4 space-y-2 text-xs">
                      <div className="text-xs font-black uppercase text-slate-900 tracking-wider border-b border-slate-200 pb-1.5">
                        Quotation References
                      </div>
                      <div className="space-y-1.5 pt-1 text-slate-800">
                        <div className="flex justify-between"><span className="font-bold text-slate-900">Qtn No:</span> <span className="font-mono font-bold text-slate-950">{printQuote.id}</span></div>
                        <div className="flex justify-between"><span className="font-bold text-slate-900">Qtn Date:</span> <span>{printQuote.quoteDate || new Date().toISOString().split("T")[0]}</span></div>
                        <div className="flex justify-between"><span className="font-bold text-slate-900">Inquiry No:</span> <span>{printQuote.inquiryNo || "N/A"}</span></div>
                        <div className="flex justify-between"><span className="font-bold text-slate-900">Inquiry Ref:</span> <span>{printQuote.inquiryRefNo || "N/A"}</span></div>
                        <div className="flex justify-between"><span className="font-bold text-slate-900">Cost Centre:</span> <span className="font-bold text-slate-950">{activeCompany.name}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Line Items Table */}
              {(() => {
                let lines: any[] = [];
                try {
                  lines = JSON.parse(printQuote.itemsJson || "[]");
                } catch (e) { }

                const subtotal = printQuote.amount || 0;
                const vat = printQuote.vat || 0;
                const discount = printQuote.discount ? (subtotal * (printQuote.discount / 100)) : 0;
                const grandTotal = subtotal + vat - discount;
                const currency = activeCompany.currency || "OMR";

                return (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-300 overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider">
                            <th className="p-3 w-12 text-center border-r border-slate-800">#</th>
                            <th className="p-3 border-r border-slate-800">Item / Service Description</th>
                            <th className="p-3 w-20 text-center border-r border-slate-800">Qty</th>
                            <th className="p-3 w-32 text-right border-r border-slate-800">Unit Price ({currency})</th>
                            <th className="p-3 w-32 text-right">Total ({currency})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-semibold text-slate-900">
                          {lines.length > 0 ? (
                            lines.map((line: any, idx: number) => {
                              const qty = line.qty || 1;
                              const rate = line.rate || 0;
                              const total = line.amount || (qty * rate);
                              return (
                                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                                  <td className="p-3 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                                  <td className="p-3 border-r border-slate-200 font-bold text-slate-950">{line.description || line.productName || "Service Item"}</td>
                                  <td className="p-3 text-center border-r border-slate-200 font-mono font-bold">{qty}</td>
                                  <td className="p-3 text-right border-r border-slate-200 font-mono font-bold">{rate.toFixed(3)}</td>
                                  <td className="p-3 text-right font-mono font-bold text-slate-950">{total.toFixed(3)}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr className="bg-white">
                              <td className="p-3 text-center border-r border-slate-200 font-bold">1</td>
                              <td className="p-3 border-r border-slate-200 font-bold text-slate-950">{printQuote.title || "Standard Service Item"}</td>
                              <td className="p-3 text-center border-r border-slate-200 font-mono font-bold">1</td>
                              <td className="p-3 text-right border-r border-slate-200 font-mono font-bold">{subtotal.toFixed(3)}</td>
                              <td className="p-3 text-right font-mono font-bold text-slate-950">{subtotal.toFixed(3)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Amount In Words Box */}
                      <div className="md:col-span-7 rounded-xl border border-slate-300 bg-slate-50/60 p-4 flex flex-col justify-between text-xs space-y-3">
                        <div>
                          <p className="font-extrabold uppercase text-[10px] text-slate-500 tracking-wider mb-1">Amount In Words</p>
                          <p className="font-black text-slate-900 text-sm">{amountInWords(grandTotal, currency)}</p>
                        </div>
                        <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-600 font-medium">
                          <span>Note: Quotation valid for 30 days from date of issue.</span>
                        </div>
                      </div>

                      {/* Totals Table */}
                      <div className="md:col-span-5 rounded-xl border border-slate-300 overflow-hidden text-xs divide-y divide-slate-200">
                        <div className="flex justify-between p-2.5 bg-white font-semibold">
                          <span className="text-slate-600">Net Amount ({currency}):</span>
                          <span className="font-mono font-bold text-slate-900">{subtotal.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between p-2.5 bg-white font-semibold">
                          <span className="text-slate-600">VAT (5%):</span>
                          <span className="font-mono font-bold text-slate-900">{vat.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between p-2.5 bg-white font-semibold">
                          <span className="text-slate-600">Discount ({currency}):</span>
                          <span className="font-mono font-bold text-slate-900">{discount.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-slate-900 text-white font-black text-sm">
                          <span>Grand Total ({currency}):</span>
                          <span className="font-mono text-base">{grandTotal.toFixed(3)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* Terms & Conditions Section */}
              <div className="pt-2 space-y-1.5 text-xs text-slate-700 font-medium border-t border-slate-200">
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">Terms & Conditions:</h4>
                <p className="leading-relaxed">
                  1. We trust the above quotation meets with your approval. Kindly forward technical data/drawings for any specific requirements.
                </p>
                <p className="leading-relaxed">
                  2. All prices are subject to company standard terms of delivery and payment approval.
                </p>
              </div>

              {/* Signatures Row */}
              <div className="pt-6 grid grid-cols-2 text-xs font-semibold text-slate-900 gap-8">
                <div className="space-y-12">
                  <p className="font-bold">Customer Acceptance Signature:</p>
                  <div className="border-b border-slate-400 w-48" />
                </div>
                <div className="space-y-2 text-right">
                  <p className="font-black text-slate-950 uppercase">{activeCompany.name}</p>
                  <p className="font-semibold text-slate-600">Authorized Sales Representative</p>
                  <p className="font-mono text-slate-800 text-[11px] pt-4">Tel: {activeCompany.contactNo || "+968 93398555"}</p>
                </div>
              </div>

              {/* Document Footer */}
              <div className="pt-6 border-t border-slate-300 text-center text-[10px] font-semibold text-slate-600 space-y-1">
                <p className="font-bold uppercase tracking-wider text-slate-900">{activeCompany.name} • {activeCompany.address || "Sultanate of Oman"}</p>
                <p className="flex justify-center items-center gap-4 text-slate-500">
                  {activeCompany.contactNo && <span>Tel: {activeCompany.contactNo}</span>}
                  {activeCompany.email && <span>Email: {activeCompany.email}</span>}
                  {activeCompany.website && <span>Web: {activeCompany.website}</span>}
                </p>
              </div>

            </div>

            {/* Bottom Action Buttons (hidden on print) */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
              <Button
                variant="secondary"
                onClick={() => setPrintQuote(null)}
                className="font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10"
              >
                <Printer className="h-4 w-4" /> Print Quotation PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Product Error Popup Modal */}
      {quickProductErrorPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Validation Error</h3>
                <p className="text-xs font-semibold text-rose-600">Cost Price Error</p>
              </div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm font-medium text-slate-800">
              {quickProductErrorPopup}
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setQuickProductErrorPopup(null)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl px-5 py-2.5 shadow-md shadow-rose-200"
              >
                OK, Got It
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Quotation Email Popup Modal */}
      {sendModalOpen && sendQuoteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Send Quotation</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {sendQuoteTarget.id} • {sendQuoteTarget.customer}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSendModalOpen(false);
                  setSendQuoteTarget(null);
                }}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {sendEmailSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{sendEmailSuccess}</span>
                </div>
              ) : (
                <>
                  {sendEmailError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>{sendEmailError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Customer Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={sendEmailInput}
                      onChange={(e) => setSendEmailInput(e.target.value)}
                      placeholder="customer@company.com"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Autofilled from customer records. You can edit this before sending.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSendModalOpen(false);
                  setSendQuoteTarget(null);
                }}
                className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Close
              </button>
              {!sendEmailSuccess && (
                <button
                  type="button"
                  onClick={handleSendQuotationEmail}
                  disabled={sendingEmail}
                  className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Send
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Quotation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingQuote}
        title="Delete Quotation"
        description="Are you sure you want to delete this commercial quotation profile? This action cannot be undone."
        itemName={deletingQuote?.id ? `${deletingQuote.id} (${deletingQuote.customer || 'Quotation'})` : undefined}
        onConfirm={() => deletingQuote && handleDeleteQuotation(deletingQuote.id)}
        onClose={() => setDeletingQuote(null)}
      />
    </div>
  );
}
