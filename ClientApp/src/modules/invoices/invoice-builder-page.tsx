"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import type { Company } from "../../data/mock";
import type { InvoiceLine, ProductItem, ProductGroupItem, UomItem } from "../../modules/shared/domain";
import { SectionTitle, ConfirmDeleteModal } from "../../modules/shared/screen-kit";
import { apiFetch } from "../../lib/api";
import { UniversalProductSearch, UniversalQuotationSearch } from "../../components/ui/universal-search";
import {
  Check,
  Edit,
  Plus,
  Trash2,
  X,
  RotateCw,
  Printer,
  FileText,
  FileSpreadsheet,
  Package,
  Coins,
  TrendingUp,
  User,
  DollarSign,
  AlertTriangle,
  Barcode,
  AlertCircle,
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

export function InvoiceBuilderPage({
  activeCompany,
  products,
  setProducts,
  invoiceLines,
  setInvoiceLines,
  initialQuotationId
}: {
  activeCompany: Company;
  products: ProductItem[];
  setProducts: (items: ProductItem[] | ((items: ProductItem[]) => ProductItem[])) => void;
  invoiceLines: InvoiceLine[];
  setInvoiceLines: (lines: InvoiceLine[] | ((lines: InvoiceLine[]) => InvoiceLine[])) => void;
  initialQuotationId?: string;
}) {
  // Master Data Lists
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invoice Header Fields
  const [salesType, setSalesType] = useState("Credit");
  const [salesNo, setSalesNo] = useState("");
  const [salesDate, setSalesDate] = useState(new Date().toISOString().split("T")[0]);
  const [creditDays, setCreditDays] = useState("0");
  const [quotationNo, setQuotationNo] = useState("");
  const [salesman, setSalesman] = useState("");
  const [printOption, setPrintOption] = useState<"SalesInvoice" | "DO">("SalesInvoice");

  // Customer Contact Fields
  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [remarks, setRemarks] = useState("");

  // Grid entry row fields
  const [pickerBarcode, setPickerBarcode] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [pickerQty, setPickerQty] = useState("1");
  const [pickerUom, setPickerUom] = useState("pcs");
  const [pickerRate, setPickerRate] = useState("0.000");
  const [pickerVatPercent, setPickerVatPercent] = useState("5.000");

  // Track if we are editing an existing row index in the grid
  const [editingLineIdx, setEditingLineIdx] = useState<number | null>(null);

  // Invoice footer states
  const [amountReceived, setAmountReceived] = useState("0.000");
  const [discountAmount, setDiscountAmount] = useState("0.000");

  // Local builder lines state (representing the items currently in the invoice)
  interface BuilderLine {
    slNo: number;
    barcode: string;
    productId: string;
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
    unitCost: number;
  }
  const [builderLines, setBuilderLines] = useState<BuilderLine[]>([]);

  // Modals and Alerts
  const [isClearConfirmModalOpen, setIsClearConfirmModalOpen] = useState(false);
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

  // Post success / printing overlay state
  const [postedInvoice, setPostedInvoice] = useState<any | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Generate a random Sales Number on mount
  useEffect(() => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSalesNo(`SI${rand}`);
  }, []);

  // Fetch Master Data: Clients, Users (Salesmen), Quotations, Product Groups, UOMs
  useEffect(() => {
    let active = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const [clientsData, usersData, quotationsData, groupsData, uomsData] = await Promise.all([
          apiFetch<any[]>(`api/Clients?companyId=${activeCompany.id}`),
          apiFetch<any[]>("api/Users"),
          apiFetch<any[]>(`api/Quotations?companyId=${activeCompany.id}`),
          apiFetch<ProductGroupItem[]>(`api/ProductGroups?companyId=${activeCompany.id}`),
          apiFetch<UomItem[]>(`api/Uoms?companyId=${activeCompany.id}`)
        ]);

        if (active) {
          setClients(clientsData || []);
          setUsers(usersData || []);
          setQuotations(quotationsData || []);
          setProductGroups(groupsData || []);
          setUomMasterList(uomsData || []);
        }
      } catch (err) {
        console.error("Error loading master data in Invoice Builder:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [activeCompany.id]);

  useEffect(() => {
    if (initialQuotationId && quotations.length > 0) {
      handleQuotationChange(initialQuotationId);
    }
  }, [initialQuotationId, quotations]);

  // Sync client details when Customer dropdown selection changes
  const handleCustomerChange = (customerName: string) => {
    setCustomer(customerName);
    const matchedClient = clients.find((c) => c.name === customerName);
    if (matchedClient) {
      setEmail(matchedClient.email || "");
      setTelephone(matchedClient.contactPersonNumber || matchedClient.phone || "");
    } else {
      setEmail("");
      setTelephone("");
    }
  };

  // Sync builder details when a Quotation No. is selected
  const handleQuotationChange = (qId: string) => {
    setQuotationNo(qId);
    if (!qId) return;

    const matchedQuote = quotations.find((q) => q.id === qId);
    if (matchedQuote) {
      setCustomer(matchedQuote.customer || "");
      setEmail(matchedQuote.email || "");
      setTelephone(matchedQuote.telephone || "");
      setSalesman(matchedQuote.salesperson || "");
      setDiscountAmount(String((matchedQuote.discount || 0).toFixed(3)));
      setRemarks(matchedQuote.remarks || "");

      // Load quotation lines
      try {
        const parsedLines = JSON.parse(matchedQuote.itemsJson || "[]");
        if (Array.isArray(parsedLines)) {
          const mappedLines = parsedLines.map((line: any, idx: number) => {
            const qtyVal = parseFloat(line.qty) || 1;
            const rateVal = parseFloat(line.rate) || 0;
            const amtVal = qtyVal * rateVal;
            const vatPct = parseFloat(line.vatPercent) || 5.0;
            const vatR = rateVal * (vatPct / 100);
            const vatA = amtVal * (vatPct / 100);
            const grossR = rateVal + vatR;
            const grossA = amtVal + vatA;

            return {
              slNo: idx + 1,
              barcode: line.barcode || line.productId || "",
              productId: line.productId || "",
              description: line.description || line.itemName || "",
              qty: qtyVal,
              uom: line.uom || "pcs",
              rate: rateVal,
              amount: amtVal,
              vatPercent: vatPct,
              vatRate: vatR,
              vatAmt: vatA,
              grossRate: grossR,
              grossAmt: grossA,
              unitCost: line.unitCost || 0
            };
          });
          setBuilderLines(mappedLines);
        }
      } catch (e) {
        console.error("Error parsing quotation lines:", e);
      }
    }
  };

  // Find currently selected product in picker
  const currentPickerProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [selectedProductId, products]);

  // Calculate pricing history (Last Rate of Cust & Last Rate of Others)
  const priceHistory = useMemo(() => {
    if (!selectedProductId) return { lastCustRate: "0.000 OMR", lastOthersRate: "0.000 OMR" };

    // Search historical quotations for matching lines to estimate price history
    let lastCustRate = 0;
    let lastOthersRate = 0;

    quotations.forEach((q) => {
      try {
        const lines = JSON.parse(q.itemsJson || "[]");
        if (Array.isArray(lines)) {
          lines.forEach((line) => {
            if (line.productId === selectedProductId) {
              if (q.customer === customer && q.status === "Approved") {
                lastCustRate = parseFloat(line.rate) || lastCustRate;
              } else {
                lastOthersRate = parseFloat(line.rate) || lastOthersRate;
              }
            }
          });
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    });

    const format = (v: number) => (v > 0 ? `${v.toFixed(3)} OMR` : "0.000 OMR");
    return {
      lastCustRate: format(lastCustRate),
      lastOthersRate: format(lastOthersRate)
    };
  }, [selectedProductId, customer, quotations]);

  // Margin calculation: sell rate - unit buy price
  const buyMargin = useMemo(() => {
    const rateVal = parseFloat(pickerRate) || 0;
    const costVal = currentPickerProduct ? currentPickerProduct.buyPrice : 0;
    if (rateVal === 0) return { val: 0, percent: "0.0%" };
    const diff = rateVal - costVal;
    const pct = ((diff / rateVal) * 100).toFixed(1);
    return {
      val: diff,
      percent: `${pct}%`
    };
  }, [pickerRate, currentPickerProduct]);

  // Sync barcode scanner field with product
  const handleBarcodeLookup = () => {
    if (!pickerBarcode.trim()) return;
    const matchedProduct = products.find(
      (p) => p.id.toLowerCase() === pickerBarcode.trim().toLowerCase() ||
             (p.barcode && p.barcode.toLowerCase() === pickerBarcode.trim().toLowerCase())
    );
    if (matchedProduct) {
      setSelectedProductId(matchedProduct.id);
      setPickerRate(matchedProduct.sellPrice.toFixed(3));
      setPickerVatPercent((matchedProduct.vatRate * 100).toFixed(3));
      if (matchedProduct.uom) {
        setPickerUom(matchedProduct.uom);
      }
    }
  };

  // Sync product selection in description drop-down
  const handleProductChange = (pId: string) => {
    setSelectedProductId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      setPickerBarcode(prod.barcode || prod.id);
      setPickerRate(prod.sellPrice.toFixed(3));
      setPickerVatPercent((prod.vatRate * 100).toFixed(3));
      if (prod.uom) {
        setPickerUom(prod.uom);
      }
    } else {
      setPickerBarcode("");
      setPickerRate("0.000");
      setPickerVatPercent("5.000");
    }
  };

  // Reactive Entry Row calculations
  const pickerQtyNum = parseFloat(pickerQty) || 0;
  const pickerRateNum = parseFloat(pickerRate) || 0;
  const pickerVatPctNum = parseFloat(pickerVatPercent) || 0;

  const derivedPickerAmount = pickerQtyNum * pickerRateNum;
  const derivedPickerVatRate = pickerRateNum * (pickerVatPctNum / 100);
  const derivedPickerVatAmt = derivedPickerAmount * (pickerVatPctNum / 100);
  const derivedPickerGrossRate = pickerRateNum + derivedPickerVatRate;
  const derivedPickerGrossAmt = derivedPickerAmount + derivedPickerVatAmt;

  // Add or Update line item in grid
  const handleAddOrUpdateLine = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Product Return validation: check that returned qty does not exceed originally sold quantity
    if (pickerQtyNum < 0) {
      if (quotationNo) {
        const matchedQuote = quotations.find((q) => q.id === quotationNo);
        if (matchedQuote) {
          try {
            const qLines = JSON.parse(matchedQuote.itemsJson || "[]");
            const matchedLine = qLines.find(
              (l: any) => l.productId === prod.id || l.barcode === prod.id || l.itemName === prod.name
            );
            if (matchedLine) {
              const maxSold = Math.abs(parseFloat(matchedLine.qty) || 0);
              if (Math.abs(pickerQtyNum) > maxSold) {
                alert(`Returned quantity (${Math.abs(pickerQtyNum)}) cannot exceed the quantity originally sold (${maxSold}) against ${quotationNo}.`);
                return;
              }
            }
          } catch (e) {
            console.error("Error checking quote lines for return validation:", e);
          }
        }
      }
    }

    const newLine: BuilderLine = {
      slNo: editingLineIdx !== null ? editingLineIdx + 1 : builderLines.length + 1,
      barcode: pickerBarcode || prod.id,
      productId: prod.id,
      description: prod.name,
      qty: pickerQtyNum,
      uom: pickerUom,
      rate: pickerRateNum,
      amount: derivedPickerAmount,
      vatPercent: pickerVatPctNum,
      vatRate: derivedPickerVatRate,
      vatAmt: derivedPickerVatAmt,
      grossRate: derivedPickerGrossRate,
      grossAmt: derivedPickerGrossAmt,
      unitCost: prod.buyPrice
    };

    if (editingLineIdx !== null) {
      // Update existing index
      const updatedLines = [...builderLines];
      updatedLines[editingLineIdx] = {
        ...newLine,
        slNo: editingLineIdx + 1
      };
      setBuilderLines(updatedLines);
      setEditingLineIdx(null);
    } else {
      // Add new
      setBuilderLines((prev) => [...prev, newLine]);
    }

    // Reset picker
    setPickerBarcode("");
    setSelectedProductId("");
    setPickerQty("1");
    setPickerUom("pcs");
    setPickerRate("0.000");
    setPickerVatPercent("5.000");
  };

  // Remove line item
  const handleRemoveLine = (idx: number) => {
    const updated = builderLines
      .filter((_, i) => i !== idx)
      .map((line, newIdx) => ({
        ...line,
        slNo: newIdx + 1
      }));
    setBuilderLines(updated);
    if (editingLineIdx === idx) {
      setEditingLineIdx(null);
      setPickerBarcode("");
      setSelectedProductId("");
      setPickerQty("1");
      setPickerRate("0.000");
    }
  };

  // Edit line item: loads line back into entry fields
  const handleEditLine = (idx: number) => {
    const line = builderLines[idx];
    setEditingLineIdx(idx);
    setPickerBarcode(line.barcode);
    setSelectedProductId(line.productId);
    setPickerQty(String(line.qty));
    setPickerUom(line.uom);
    setPickerRate(line.rate.toFixed(3));
    setPickerVatPercent(line.vatPercent.toFixed(3));
  };

  // Grid Totals
  const totalQty = builderLines.reduce((sum, l) => sum + l.qty, 0);
  const totalAmount = builderLines.reduce((sum, l) => sum + l.amount, 0);
  const totalVatAmt = builderLines.reduce((sum, l) => sum + l.vatAmt, 0);
  const totalGrossAmt = builderLines.reduce((sum, l) => sum + l.grossAmt, 0);

  // Footer Totals calculations
  const discountVal = parseFloat(discountAmount) || 0;
  const grossAmount = Math.max(0, totalAmount - discountVal);
  const taxAmount = totalVatAmt;
  const netAmount = grossAmount + taxAmount;

  const amtReceivedVal = parseFloat(amountReceived) || 0;
  const balanceVal = netAmount - amtReceivedVal;

  // Handle Quick Add Client Form
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
        notes: newClientForm.notes.trim() || "Quick added from invoice builder screen."
      };
      await apiFetch("api/Clients", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      // Reload clients
      const clientsData = await apiFetch<any[]>(`api/Clients?companyId=${activeCompany.id}`);
      setClients(clientsData || []);
      setCustomer(newClientForm.name.trim());
      if (newClientForm.email.trim()) setEmail(newClientForm.email.trim());

      // Reset fields & close
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
      setIsClientModalOpen(false);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error adding client.");
    }
  };

  // Handle Quick Add Product Form
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
      // Refresh products list
      const updatedProds = await apiFetch<any[]>(`api/Products?companyId=${activeCompany.id}`);
      setProducts(updatedProds || []);
      // Select new product
      setSelectedProductId(res.id || payload.id);
      setPickerBarcode(res.barcode || res.id || payload.id);
      setPickerRate(res.sellPrice ? res.sellPrice.toFixed(3) : "0.000");
      setPickerVatPercent(res.vatRate ? (res.vatRate * 100).toFixed(3) : "5.000");
      if (res.uom) setPickerUom(res.uom);
    } catch (err: any) {
      console.error(err);
      setQuickProductError(err.message || "Error adding product. Ensure barcode is unique.");
    }
  };

  // Post Invoice (Save draft in database & update stock)
  const handlePostInvoice = async () => {
    if (builderLines.length === 0) return;
    if (!customer) {
      alert("Please select a Customer before posting.");
      return;
    }

    setIsPosting(true);
    try {
      const payload = {
        companyId: activeCompany.id,
        customer,
        amount: netAmount,
        due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days due
        status: balanceVal <= 0 ? "Paid" : "Open",
        salesperson: salesman || "Commercial",
        discount: discountVal,
        vat: taxAmount,
        itemsJson: JSON.stringify(
          builderLines.map((l) => ({
            productId: l.productId,
            itemName: l.description,
            quantity: l.qty,
            unitPrice: l.rate,
            unitCost: l.unitCost,
            vatRate: l.vatPercent / 100,
            barcode: l.barcode,
            uom: l.uom
          }))
        ),
        notes: remarks,
        termsAndConditions: "Validity 30 Days. Bank transfer only."
      };

      const result = await apiFetch<any>("api/Invoices", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      // Update local product stocks in parent state
      setProducts((current) =>
        current.map((item) => {
          const sold = builderLines.find((l) => l.productId === item.id);
          if (sold && (item.type === "Product" || item.type === "License")) {
            return { ...item, stock: Math.max(item.stock - sold.qty, 0) };
          }
          return item;
        })
      );

      // Open printable PDF overlay
      setPostedInvoice(result);
    } catch (e: any) {
      console.error("Error posting invoice:", e);
      alert(e.message || "Error posting invoice to backend database.");
    } finally {
      setIsPosting(false);
    }
  };

  const handlePreviewInvoice = () => {
    if (builderLines.length === 0) {
      alert("Please add at least one line item to preview.");
      return;
    }
    const draftPreview = {
      id: salesNo || "INV-DRAFT",
      customer: customer || "Walk-in Customer",
      salesperson: salesman,
      itemsJson: JSON.stringify(builderLines.map(line => ({
        description: line.description,
        quantity: line.qty,
        unitPrice: line.rate,
        vatPercent: line.vatPercent,
        vatRate: line.vatRate,
        amount: line.amount,
        uom: line.uom,
        barcode: line.barcode
      }))),
      amount: netAmount,
      vat: taxAmount,
      discount: parseFloat(discountAmount) || 0,
      isDraftPreview: true
    };
    setPostedInvoice(draftPreview);
  };

  const resetForm = () => {
    setBuilderLines([]);
    setCustomer("");
    setEmail("");
    setTelephone("");
    setQuotationNo("");
    setSalesman("");
    setRemarks("");
    setDiscountAmount("0.000");
    setAmountReceived("0.000");
    setEditingLineIdx(null);
    setPickerBarcode("");
    setSelectedProductId("");
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSalesNo(`SI${rand}`);
  };

  // Reset Builder Draft (Cancel button)
  const handleCancel = () => {
    setIsClearConfirmModalOpen(true);
  };

  const confirmClearDraft = () => {
    resetForm();
    setIsClearConfirmModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <SectionTitle
        title="Sales Invoice Builder"
        subtitle="Manage billing transactions, load quotations, calculate VAT rates, verify margins and track stock outlays in real-time."
      />

      {/* Loading state indicator */}
      {loading && (
        <div className="flex items-center justify-center p-6 bg-blue-50/50 border border-blue-100 rounded-2xl animate-pulse">
          <RotateCw className="h-5 w-5 animate-spin text-blue-600 mr-3" />
          <span className="text-sm font-semibold text-blue-700">Syncing database & importing master records...</span>
        </div>
      )}

      {/* Main Builder Grid */}
      <div className="grid gap-8">
        {/* Top Header Parameters section */}
        <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 overflow-hidden bg-slate-50/30">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-800">Header Parameters</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Specify sales transaction type, dates, customer info and credit options</p>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Sales Type
                  </label>
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 border border-blue-200/80 shadow-2xs">
                    {salesType}
                  </span>
                </div>
                <select
                  value={salesType}
                  onChange={(e) => setSalesType(e.target.value)}
                  className="block w-full h-10 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-900 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold shadow-2xs"
                >
                  <option value="Credit">Credit Sales</option>
                  <option value="Cash">Cash Sales</option>
                  <option value="Export">Export Sales</option>
                  <option value="Local">Local Sales</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Sales No
                </label>
                <input
                  type="text"
                  disabled
                  value={salesNo}
                  className="block w-full h-10 rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-sm text-slate-500 font-mono font-bold outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Sales Date
                </label>
                <input
                  type="date"
                  value={salesDate}
                  onChange={(e) => setSalesDate(e.target.value)}
                  className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Credit Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={creditDays}
                  onChange={(e) => setCreditDays(e.target.value)}
                  className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-mono font-bold text-right"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Customer
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsClientModalOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5 transition"
                  >
                    <Plus className="h-3 w-3" /> Quick Add
                  </button>
                </div>
                <select
                  value={customer}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-bold text-blue-900"
                >
                  <option value="">Select Customer...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Quotation No.
                </label>
                <UniversalQuotationSearch
                  quotations={quotations}
                  selectedQuotationId={quotationNo}
                  onSelectQuotation={(qId) => handleQuotationChange(qId)}
                  customer={customer}
                  placeholder="Type quotation ID, customer, amount..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Salesman / Agent
                </label>
                <select
                  value={salesman}
                  onChange={(e) => setSalesman(e.target.value)}
                  className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                >
                  <option value="">Select Salesperson...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-center bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Print Mode Options
                </span>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPrintOption("SalesInvoice")}
                    className={`flex-1 text-center py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                      printOption === "SalesInvoice"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintOption("DO")}
                    className={`flex-1 text-center py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                      printOption === "DO"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    DO Delivery
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Customer Email
                </label>
                <input
                  type="email"
                  placeholder="customer@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Customer Telephone
                </label>
                <input
                  type="text"
                  placeholder="Contact telephone number"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="Payment details, delivery terms, etc."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid Entry row and items table */}
        <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
          <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-800">Invoice Line Items</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Manage details of items included in the invoice, tax rates and totals</p>
              </div>
            </div>
            {editingLineIdx !== null && (
              <Badge variant="warning" className="animate-pulse px-3 py-1 font-bold text-xs">
                Editing Line #{editingLineIdx + 1}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {/* Elegant Line Item Entry Panel */}
            <div className={`p-6 border-b border-slate-200/85 transition-all duration-300 ${
              editingLineIdx !== null 
                ? "bg-amber-50/40 border-amber-200 ring-2 ring-amber-500/5" 
                : "bg-slate-50/50"
            }`}>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Left Side: Input Fields (2/3 width) */}
                <div className="md:col-span-2 space-y-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${editingLineIdx !== null ? "bg-amber-500" : "bg-blue-500"}`}></span>
                    {editingLineIdx !== null ? "Modify item properties" : "Add new item details"}
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        BarCode
                      </label>
                      <input
                        type="text"
                        placeholder="Scan / type ID"
                        value={pickerBarcode}
                        onChange={(e) => setPickerBarcode(e.target.value)}
                        onBlur={handleBarcodeLookup}
                        onKeyDown={(e) => e.key === "Enter" && handleBarcodeLookup()}
                        className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 font-mono font-bold outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold uppercase text-slate-500">
                          Description
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={openQuickProductModal}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition"
                          >
                            <Plus className="h-3 w-3" /> Quick Add Product
                          </button>
                          <button
                            type="button"
                            title="Sync description with barcode lookup"
                            onClick={handleBarcodeLookup}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"
                          >
                            <RotateCw className="h-3.5 w-3.5" /> Sync
                          </button>
                        </div>
                      </div>
                      <UniversalProductSearch
                        products={products}
                        selectedProductId={selectedProductId}
                        onSelectProduct={(prod) => {
                          if (prod) {
                            handleProductChange(prod.id);
                          } else {
                            handleProductChange("");
                          }
                        }}
                        placeholder="Type product name, code or category..."
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold uppercase text-slate-500">
                          Qty
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseFloat(pickerQty) || 0;
                            setPickerQty(val > 0 ? `-${val}` : String(Math.abs(val) || 1));
                          }}
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border transition ${
                            parseFloat(pickerQty) < 0
                              ? "bg-rose-500 text-white border-rose-600"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                          title="Toggle Product Return (Negative Qty)"
                        >
                          {parseFloat(pickerQty) < 0 ? "Return Active" : "Set Return (-)"}
                        </button>
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={pickerQty}
                        onChange={(e) => setPickerQty(e.target.value)}
                        placeholder="e.g. 1 or -1 for Return"
                        className={`block w-full h-10 rounded-xl border px-3 py-2 text-sm font-mono font-bold text-right outline-none transition-all ${
                          parseFloat(pickerQty) < 0
                            ? "bg-rose-50 border-rose-300 text-rose-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                            : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        UOM
                      </label>
                      <select
                        value={pickerUom}
                        onChange={(e) => setPickerUom(e.target.value)}
                        className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                      >
                        <option value="pcs">pcs</option>
                        <option value="box">box</option>
                        <option value="mtr">mtr</option>
                        <option value="job">job</option>
                        <option value="pack">pack</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        Rate (OMR)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={pickerRate}
                        onChange={(e) => setPickerRate(e.target.value)}
                        className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 font-mono font-bold text-right outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        VAT %
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={pickerVatPercent}
                        onChange={(e) => setPickerVatPercent(e.target.value)}
                        className="block w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 font-mono font-semibold text-right outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Side: Live pricing summary & Add action (1/3 width) */}
                <div className="bg-slate-100/60 rounded-2xl p-5 border border-slate-200/60 flex flex-col justify-between space-y-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Subtotal Amount:</span>
                      <span className="font-mono font-semibold text-slate-700">{derivedPickerAmount.toFixed(3)} OMR</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-0.5 text-slate-500 font-medium">
                        <span>Tax (VAT {pickerVatPercent}%):</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-700">+{derivedPickerVatAmt.toFixed(3)} OMR</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm">
                      <span className="text-slate-900 font-bold">Gross Total:</span>
                      <span className="font-mono font-black text-slate-950 text-base">{derivedPickerGrossAmt.toFixed(3)} OMR</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {editingLineIdx !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLineIdx(null);
                          setPickerBarcode("");
                          setSelectedProductId("");
                          setPickerQty("1");
                          setPickerUom("pcs");
                          setPickerRate("0.000");
                          setPickerVatPercent("5.000");
                        }}
                        className="flex-1 h-10 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!selectedProductId}
                      onClick={handleAddOrUpdateLine}
                      className={`flex-1 h-10 font-bold rounded-xl text-xs transition shadow-sm active:scale-[0.97] flex items-center justify-center gap-1.5 ${
                        selectedProductId
                          ? editingLineIdx !== null
                            ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/10"
                            : "bg-[#2563EB] hover:bg-blue-700 text-white shadow-blue-500/15"
                          : "bg-slate-300 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {editingLineIdx !== null ? (
                        <>
                          <Check className="h-4 w-4" /> Save Line
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" /> Add Item
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main grid line table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-200/80 border-b border-slate-300 text-[10px] font-extrabold uppercase text-slate-800 tracking-wider">
                    <th className="p-3.5 w-10 text-center">#</th>
                    <th className="p-3.5 w-28">BarCode</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5 w-20 text-right">Qty</th>
                    <th className="p-3.5 w-20 text-center">UOM</th>
                    <th className="p-3.5 w-24 text-right">Rate</th>
                    <th className="p-3.5 w-28 text-right">Amount</th>
                    <th className="p-3.5 w-20 text-right">VAT %</th>
                    <th className="p-3.5 w-20 text-right">VAT Rate</th>
                    <th className="p-3.5 w-20 text-right">VAT Amt</th>
                    <th className="p-3.5 w-24 text-right">Gross Rate</th>
                    <th className="p-3.5 w-28 text-right">Gross Amt</th>
                    <th className="p-3.5 w-16 text-center">Edit</th>
                    <th className="p-3.5 w-16 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {builderLines.map((line, idx) => {
                    const matchProd = products.find((p) => p.id === line.productId || p.id === line.barcode);
                    const isOverStock = matchProd && (matchProd.type === "Product" || matchProd.type === "License") && line.qty > matchProd.stock;

                    return (
                      <tr
                        key={line.slNo}
                        className={`hover:bg-slate-50/50 transition duration-150 ${
                          editingLineIdx === idx ? "bg-amber-50/30" : isOverStock ? "bg-rose-50/30" : ""
                        }`}
                      >
                        <td className="p-3.5 font-bold text-slate-400 text-center">
                          {line.slNo}
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-slate-600">{line.barcode}</td>
                        <td className="p-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{line.description}</span>
                            {line.qty < 0 && (
                              <span className="inline-flex items-center gap-1 rounded bg-rose-500 text-white px-2 py-0.5 text-[10px] font-black uppercase shadow-xs">
                                RETURN
                              </span>
                            )}
                            {isOverStock ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 border border-rose-200/90 shadow-2xs">
                                <AlertTriangle className="h-3 w-3 text-rose-600 animate-pulse" />
                                Insufficient Stock ({matchProd?.stock ?? 0} available)
                              </span>
                            ) : matchProd ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                (Stock: {matchProd.stock} {line.uom})
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className={`p-3.5 font-mono text-right font-bold ${line.qty < 0 ? "text-rose-600 font-extrabold" : "text-slate-800"}`}>
                          {line.qty.toFixed(3)}
                        </td>
                      <td className="p-3.5 text-center">
                        <Badge
                          variant="default"
                          className="bg-slate-200/50 hover:bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]"
                        >
                          {line.uom}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-mono text-right text-slate-600 font-semibold">
                        {line.rate.toFixed(3)}
                      </td>
                      <td className={`p-3.5 font-mono text-right font-bold ${line.amount < 0 ? "text-rose-600 font-extrabold" : "text-slate-800"}`}>
                        {line.amount.toFixed(3)}
                      </td>
                      <td className="p-3.5 font-mono text-right text-slate-500 font-semibold">
                        {line.vatPercent.toFixed(3)}
                      </td>
                      <td className="p-3.5 font-mono text-right text-slate-500 font-medium">
                        {line.vatRate.toFixed(3)}
                      </td>
                      <td className={`p-3.5 font-mono text-right font-semibold ${line.vatAmt < 0 ? "text-rose-600 font-extrabold" : "text-slate-800"}`}>
                        {line.vatAmt.toFixed(3)}
                      </td>
                      <td className="p-3.5 font-mono text-right text-slate-600 font-semibold">
                        {line.grossRate.toFixed(3)}
                      </td>
                      <td className={`p-3.5 font-mono text-right font-black ${line.grossAmt < 0 ? "text-rose-600 font-black" : "text-slate-950"}`}>
                        {line.grossAmt.toFixed(3)}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleEditLine(idx)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition active:scale-90"
                          title="Edit line item"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition active:scale-90"
                          title="Delete line item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    );
                  })}

                  {builderLines.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 shadow-2xs animate-bounce">
                            <FileSpreadsheet className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">Draft is currently empty</p>
                            <p className="text-xs text-slate-400 mt-1">Select a product and configure details in the entry form above to add items to your invoice transaction.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // Total Summary row
                    <tr className="bg-rose-50/20 font-bold text-rose-900 border-t border-slate-200">
                      <td className="p-3.5"></td>
                      <td className="p-3.5"></td>
                      <td className="p-3.5 font-extrabold uppercase text-xs tracking-wider text-rose-950">Total Summary</td>
                      <td className="p-3.5 font-mono text-right text-sm font-black text-rose-950">{totalQty.toFixed(3)}</td>
                      <td className="p-3.5"></td>
                      <td className="p-3.5"></td>
                      <td className="p-3.5 font-mono text-right text-sm font-black text-rose-950">{totalAmount.toFixed(3)}</td>
                      <td className="p-3.5"></td>
                      <td className="p-3.5"></td>
                      <td className="p-3.5 font-mono text-right text-sm font-black text-rose-950">{totalVatAmt.toFixed(3)}</td>
                      <td className="p-3.5"></td>
                      <td className="p-3.5 font-mono text-right text-sm font-black text-rose-950">{totalGrossAmt.toFixed(3)}</td>
                      <td className="p-3.5"></td>
                      <td className="p-3.5"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer Statistics & Final Calculations section */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left panel: Stock & Margins */}
          <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 bg-slate-50/30">
            <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-800">Product Info & Pricing History</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Track inventory levels, customer quotes, and estimated margins</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                
                {/* Widget 1: Stock */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition duration-200 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                    <Package className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                      Stock Availability
                    </span>
                    <span className="text-base font-black text-slate-900 block leading-tight">
                      {currentPickerProduct
                        ? `${currentPickerProduct.stock.toFixed(3)} ${pickerUom}`
                        : "0.000 UOM"}
                    </span>
                    {currentPickerProduct && currentPickerProduct.stock <= currentPickerProduct.minStock && (
                      <Badge variant="warning" className="mt-1.5 px-2 py-0 text-[9px] font-bold">
                        Low Stock
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Widget 2: Last Customer Rate */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition duration-200 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                      Last Cust. Rate
                    </span>
                    <span className="text-base font-black text-indigo-950 block leading-tight">
                      {priceHistory.lastCustRate}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block">Approved quote history</span>
                  </div>
                </div>

                {/* Widget 3: Last Others Rate */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition duration-200 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Coins className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                      Last Others Rate
                    </span>
                    <span className="text-base font-black text-slate-800 block leading-tight">
                      {priceHistory.lastOthersRate}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block">Global reference rate</span>
                  </div>
                </div>

                {/* Widget 4: Margin */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition duration-200 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                    <TrendingUp className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                      Profit Margin (Est.)
                    </span>
                    <span className="text-base font-black text-slate-900 block leading-tight">
                      {currentPickerProduct ? `${buyMargin.val.toFixed(3)} OMR` : "0.000 OMR"}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-black block">
                      {buyMargin.percent} Margin
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment inputs */}
              <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-slate-200/60">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Amount Received (OMR)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 font-mono font-bold text-right outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Remaining Balance
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${balanceVal.toFixed(3)} OMR`}
                    className="block w-full rounded-xl border border-slate-100 bg-slate-100/80 px-3 py-2 text-sm text-slate-600 font-mono font-bold text-right outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right panel: Final Invoicing Sums */}
          <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 bg-slate-50/30">
            <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 border border-violet-100 text-violet-600">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-800">Billing Statement</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Summary of transaction amounts, adjustments and net receivable</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                  <span className="text-slate-500 font-semibold">Total Amount:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {totalAmount.toFixed(3)} OMR
                  </span>
                </div>

                <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                  <span className="text-slate-500 font-semibold">Discount Amount:</span>
                  <div className="w-32">
                    <input
                      type="number"
                      step="0.001"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 font-mono font-bold text-right outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                  <span className="text-slate-500 font-semibold">Gross Amount (Pre-Tax):</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {grossAmount.toFixed(3)} OMR
                  </span>
                </div>

                <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                  <span className="text-slate-500 font-semibold">Tax Amount (VAT 5%):</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {taxAmount.toFixed(3)} OMR
                  </span>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-5 rounded-2xl text-white shadow-lg shadow-blue-500/15">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                  <div className="flex justify-between items-center relative z-10">
                    <span className="font-bold uppercase text-[11px] tracking-widest text-blue-100">
                      Net Amount Receivable
                    </span>
                    <div className="text-right">
                      <span className="font-mono font-black text-2xl tracking-tight block">
                        {netAmount.toFixed(3)}
                      </span>
                      <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">
                        OMR Net Total
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handlePostInvoice}
                  disabled={builderLines.length === 0 || isPosting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold h-11 rounded-xl shadow-md shadow-emerald-500/10 transition active:scale-98 flex items-center justify-center gap-1.5 text-xs"
                >
                  {isPosting ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Post Invoice
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handlePreviewInvoice}
                  disabled={builderLines.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold h-11 rounded-xl shadow-md shadow-blue-500/10 transition active:scale-98 flex items-center justify-center gap-1.5 text-xs"
                >
                  <Printer className="h-4 w-4" />
                  Print Preview
                </Button>
                <Button
                  onClick={handleCancel}
                  className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 font-bold h-11 px-4 rounded-xl transition active:scale-98 flex items-center justify-center gap-1.5 text-xs"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- QUICK ADD CLIENT MODAL --- */}
      {isClientModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsClientModalOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in"
        >
          <div className="relative bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" /> Quick Add Customer
                </h3>
                <p className="text-xs text-slate-500 font-semibold">Register client profile into active workspace CRM</p>
              </div>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddClient} className="flex-1 overflow-y-auto p-6 space-y-4 font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Client / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muscat Trading LLC"
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
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. billings@muscattrading.com"
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
                    Telephone Contact
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +968 24509922"
                    value={newClientForm.contactPersonNumber}
                    onChange={(e) => setNewClientForm({ ...newClientForm, contactPersonNumber: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-mono font-semibold"
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
                <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 rounded-xl shadow-md shadow-blue-500/10">Save Customer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- INVOICE PRINT PREVIEW MODAL OVERLAY --- */}
      {postedInvoice && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              const isDraft = postedInvoice.isDraftPreview;
              setPostedInvoice(null);
              if (!isDraft) {
                resetForm();
              }
            }
          }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 backdrop-blur-md p-4 overflow-y-auto print:p-0 print:bg-white print:static animate-fade-in"
        >
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-8 space-y-6 print:border-none print:shadow-none print:p-0 my-6 print:my-0 text-slate-900">
            {/* Header control toolbar (hidden when printing) */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 uppercase">
                    {printOption === "SalesInvoice" ? "Print Sales Invoice Preview" : "Print Delivery Order Preview"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official Tax Invoice format matching standard company layout
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
                  onClick={() => {
                    const isDraft = postedInvoice.isDraftPreview;
                    setPostedInvoice(null);
                    if (!isDraft) {
                      resetForm();
                    }
                  }}
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
                    {printOption === "SalesInvoice" ? "Tax Invoice" : "Delivery Order"}
                  </div>
                  <h1 className="text-2xl font-black font-mono tracking-tight text-slate-900">{postedInvoice.id}</h1>
                  <p className="text-xs font-semibold text-slate-500">Date: {salesDate || postedInvoice.salesDate || new Date().toISOString().split("T")[0]}</p>
                </div>
              </div>

              {/* Customer & Document Details Grid */}
              {(() => {
                const clientMatch = clients.find(
                  (c) =>
                    c.name === postedInvoice.customer ||
                    c.id === postedInvoice.customerId ||
                    c.id === postedInvoice.customerNo ||
                    (c.name && postedInvoice.customer && c.name.toLowerCase() === postedInvoice.customer.toLowerCase())
                );

                const customerNoVal = postedInvoice.customerNo || postedInvoice.customerId || clientMatch?.id || "CLT-1001";
                const companyVal = postedInvoice.customerCompany || clientMatch?.name || postedInvoice.customer || customer || "N/A";
                const nameVal = postedInvoice.customerName || clientMatch?.contactPersonName || clientMatch?.name || postedInvoice.customer || customer || "N/A";
                const emailVal = email || postedInvoice.email || clientMatch?.email || (Array.isArray(clientMatch?.contacts) && clientMatch.contacts.length > 0 ? (clientMatch.contacts[0].contactName || clientMatch.contacts[0]) : "") || "N/A";
                const phoneVal = telephone || postedInvoice.telephone || clientMatch?.contactPersonNumber || clientMatch?.phone || "N/A";

                let addressVal = postedInvoice.address || "";
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

                const vatinVal = postedInvoice.vatin || clientMatch?.vatNumber || clientMatch?.vatin || "N/A";
                const paymentTermVal = salesType || postedInvoice.paymentTerms || clientMatch?.paymentTerms || "CHEQUE";

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

                    {/* Invoice Ref Box */}
                    <div className="md:col-span-5 rounded-xl border border-slate-300 bg-slate-50/50 p-4 space-y-2 text-xs">
                      <div className="text-xs font-black uppercase text-slate-900 tracking-wider border-b border-slate-200 pb-1.5">
                        Invoice References
                      </div>
                      <div className="space-y-1.5 pt-1 text-slate-800">
                        <div className="flex justify-between"><span className="font-bold text-slate-900">Inv No:</span> <span className="font-mono font-bold text-slate-950">{postedInvoice.id}</span></div>
                        <div className="flex justify-between"><span className="font-bold text-slate-900">Inv Date:</span> <span>{salesDate || postedInvoice.salesDate || new Date().toISOString().split("T")[0]}</span></div>
                        <div className="flex justify-between"><span className="font-bold text-slate-900">Sales Type:</span> <span>{salesType || postedInvoice.salesType || "Credit"}</span></div>
                        <div className="flex justify-between"><span className="font-bold text-slate-900">Quotation Ref:</span> <span>{quotationNo || postedInvoice.quotationNo || "N/A"}</span></div>
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
                  lines = typeof postedInvoice.itemsJson === "string" ? JSON.parse(postedInvoice.itemsJson || "[]") : (postedInvoice.itemsJson || []);
                } catch (e) { }

                if (!lines || lines.length === 0) {
                  lines = builderLines;
                }

                const currency = activeCompany.currency || "OMR";
                let subtotal = 0;
                let vat = 0;

                lines.forEach((l: any) => {
                  const qty = parseFloat(l.quantity ?? l.qty) || 0;
                  const rate = parseFloat(l.unitPrice ?? l.rate) || 0;
                  const vatR = l.vatRate !== undefined ? parseFloat(l.vatRate) : (parseFloat(l.vatPercent) ? parseFloat(l.vatPercent) / 100 : 0.05);
                  const lineSub = qty * rate;
                  const lineVat = lineSub * vatR;
                  subtotal += lineSub;
                  vat += lineVat;
                });

                const discount = parseFloat(discountAmount) || postedInvoice.discount || 0;
                const grandTotal = subtotal - discount + vat;

                return (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-300 overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider">
                            <th className="p-3 w-12 text-center border-r border-slate-800">#</th>
                            <th className="p-3 border-r border-slate-800">Item / Product Description</th>
                            <th className="p-3 w-20 text-center border-r border-slate-800">Qty</th>
                            <th className="p-3 w-16 text-center border-r border-slate-800">UOM</th>
                            {printOption === "SalesInvoice" && (
                              <>
                                <th className="p-3 w-28 text-right border-r border-slate-800">Rate ({currency})</th>
                                <th className="p-3 w-24 text-right border-r border-slate-800">VAT ({currency})</th>
                                <th className="p-3 w-32 text-right">Total ({currency})</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-semibold text-slate-900">
                          {lines.length > 0 ? (
                            lines.map((line: any, idx: number) => {
                              const qty = parseFloat(line.quantity ?? line.qty) || 1;
                              const rate = parseFloat(line.unitPrice ?? line.rate) || 0;
                              const vatR = line.vatRate !== undefined ? parseFloat(line.vatRate) : (parseFloat(line.vatPercent) ? parseFloat(line.vatPercent) / 100 : 0.05);
                              const lineSub = qty * rate;
                              const lineVat = lineSub * vatR;
                              const total = lineSub + lineVat;
                              const displayName = line.description || line.productName || line.itemName || line.name || "Service Item";

                              return (
                                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                                  <td className="p-3 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                                  <td className="p-3 border-r border-slate-200 font-bold text-slate-950">{displayName}</td>
                                  <td className="p-3 text-center border-r border-slate-200 font-mono font-bold">{qty}</td>
                                  <td className="p-3 text-center border-r border-slate-200 text-slate-600">{line.uom || "pcs"}</td>
                                  {printOption === "SalesInvoice" && (
                                    <>
                                      <td className="p-3 text-right border-r border-slate-200 font-mono font-bold">{rate.toFixed(3)}</td>
                                      <td className="p-3 text-right border-r border-slate-200 font-mono font-bold">{lineVat.toFixed(3)}</td>
                                      <td className="p-3 text-right font-mono font-bold text-slate-950">{total.toFixed(3)}</td>
                                    </>
                                  )}
                                </tr>
                              );
                            })
                          ) : (
                            <tr className="bg-white">
                              <td className="p-3 text-center border-r border-slate-200 font-bold">1</td>
                              <td className="p-3 border-r border-slate-200 font-bold text-slate-950">Standard Item</td>
                              <td className="p-3 text-center border-r border-slate-200 font-mono font-bold">1</td>
                              <td className="p-3 text-center border-r border-slate-200 text-slate-600">pcs</td>
                              {printOption === "SalesInvoice" && (
                                <>
                                  <td className="p-3 text-right border-r border-slate-200 font-mono font-bold">{subtotal.toFixed(3)}</td>
                                  <td className="p-3 text-right border-r border-slate-200 font-mono font-bold">{vat.toFixed(3)}</td>
                                  <td className="p-3 text-right font-mono font-bold text-slate-950">{grandTotal.toFixed(3)}</td>
                                </>
                              )}
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Cards */}
                    {printOption === "SalesInvoice" ? (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Amount In Words Box */}
                        <div className="md:col-span-7 rounded-xl border border-slate-300 bg-slate-50/60 p-4 flex flex-col justify-between text-xs space-y-3">
                          <div>
                            <p className="font-extrabold uppercase text-[10px] text-slate-500 tracking-wider mb-1">Amount In Words</p>
                            <p className="font-black text-slate-900 text-sm">{amountInWords(grandTotal, currency)}</p>
                          </div>
                          <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-600 font-medium">
                            <span>Note: Goods received in good condition. All disputes subject to Muscat court jurisdiction.</span>
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
                    ) : (
                      <div className="pt-6 grid grid-cols-2 text-xs gap-16 font-semibold">
                        <div className="border-t border-slate-300 pt-4 text-center">
                          <p className="text-slate-400 font-bold uppercase text-[9px] mb-2 tracking-wider">
                            Received & Approved By Customer
                          </p>
                          <div className="h-16"></div>
                          <p className="text-slate-900 font-bold">Sign & Stamp</p>
                        </div>
                        <div className="border-t border-slate-300 pt-4 text-center">
                          <p className="text-slate-400 font-bold uppercase text-[9px] mb-2 tracking-wider">
                            Dispatched By {activeCompany.name} Logistics
                          </p>
                          <div className="h-16"></div>
                          <p className="text-slate-900 font-bold">Authorized Signature</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Terms & Conditions Section */}
              <div className="pt-2 space-y-1.5 text-xs text-slate-700 font-medium border-t border-slate-200">
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">Terms & Conditions:</h4>
                <p className="leading-relaxed">
                  1. Goods received in good condition. All disputes subject to Muscat court jurisdiction.
                </p>
                <p className="leading-relaxed">
                  2. This is a computer generated document and does not require a physical signature for verification unless specified.
                </p>
              </div>

              {/* Signatures Row */}
              {printOption === "SalesInvoice" && (
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
              )}

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
                onClick={() => {
                  const isDraft = postedInvoice.isDraftPreview;
                  setPostedInvoice(null);
                  if (!isDraft) {
                    resetForm();
                  }
                }}
                className="font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10"
              >
                <Printer className="h-4 w-4" /> Print Tax Invoice PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Quick Add Product Modal --- */}
      {isProductModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsProductModalOpen(false); }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-955/60 backdrop-blur-md p-4 animate-fade-in print:hidden"
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
                    className={`w-full h-10 rounded-xl border px-3 text-sm font-mono font-bold text-slate-900 outline-none transition ${
                      newProductBuyPrice !== "" && newProductSellPrice !== "" && parseFloat(newProductBuyPrice) >= parseFloat(newProductSellPrice)
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

      {/* Clear Draft Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isClearConfirmModalOpen}
        title="Clear Invoice Draft"
        description="Are you sure you want to clear all entered product items and reset this invoice draft?"
        confirmText="Clear Draft"
        cancelText="Keep Editing"
        onConfirm={confirmClearDraft}
        onClose={() => setIsClearConfirmModalOpen(false)}
      />
    </div>
  );
}
