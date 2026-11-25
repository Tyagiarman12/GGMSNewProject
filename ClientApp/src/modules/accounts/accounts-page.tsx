"use client";

import { useState, useEffect, useMemo } from "react";
import { CircleDollarSign, FileText, ReceiptText, X } from "lucide-react";
import { KpiCard } from "../../components/command-center";
import { Badge } from "../../components/ui/badge";
import { Td, Th } from "../../components/ui/table";
import type { Company } from "../../data/mock";
import { money } from "../../lib/utils";
import { apiFetch } from "../../lib/api";
import { DataTable, Info, SectionTitle } from "../../modules/shared/screen-kit";
import { Button } from "../../components/ui/button";

type InvoicePrintLine = {
  description?: string;
  itemName?: string;
  barcode?: string;
  quantity?: number;
  qty?: number;
  unitPrice?: number;
  rate?: number;
  vatRate?: number;
  vatPercent?: number;
  uom?: string;
};

function readInvoiceLines(itemsJson?: string): { lines: InvoicePrintLine[]; invalid: boolean } {
  if (!itemsJson) return { lines: [], invalid: false };
  try {
    const parsed: unknown = JSON.parse(itemsJson);
    return Array.isArray(parsed)
      ? { lines: parsed as InvoicePrintLine[], invalid: false }
      : { lines: [], invalid: true };
  } catch {
    return { lines: [], invalid: true };
  }
}

export function AccountsPage({ activeCompany }: { activeCompany: Company }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [customerPayments, setCustomerPayments] = useState<any[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [showDo, setShowDo] = useState(false);
  const [printMode, setPrintMode] = useState<"invoice" | "do">("invoice");
  const [paymentTarget, setPaymentTarget] = useState<{ type: "invoice" | "bill"; id: string; name: string; balance: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      apiFetch<any[]>(`api/Invoices?companyId=${encodeURIComponent(activeCompany.id)}`),
      apiFetch<any[]>(`api/Bills?companyId=${encodeURIComponent(activeCompany.id)}`),
      apiFetch<any[]>(`api/Expenses?companyId=${encodeURIComponent(activeCompany.id)}`),
      apiFetch<any[]>(`api/Payments?companyId=${encodeURIComponent(activeCompany.id)}`),
      apiFetch<any[]>(`api/Payments/supplier?companyId=${encodeURIComponent(activeCompany.id)}`)
    ])
      .then(([invoicesData, billsData, expenseData, customerPaymentData, supplierPaymentData]) => {
        if (active) {
          setInvoices(invoicesData || []);
          setBills(billsData || []);
          setExpenses(expenseData || []);
          setCustomerPayments(customerPaymentData || []);
          setSupplierPayments(supplierPaymentData || []);
          setFeedback(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching accounts data:", err);
        if (active) {
          setFeedback(err instanceof Error ? err.message : "Unable to load accounts data.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeCompany.id]);

  const customerPaidByInvoice = useMemo(() => customerPayments.reduce<Record<string, number>>((totals, payment) => {
    if (payment.status === "Posted") totals[payment.invoiceId] = (totals[payment.invoiceId] || 0) + Number(payment.amount || 0);
    return totals;
  }, {}), [customerPayments]);
  const supplierPaidByBill = useMemo(() => supplierPayments.reduce<Record<string, number>>((totals, payment) => {
    if (payment.status === "Posted") totals[payment.billId] = (totals[payment.billId] || 0) + Number(payment.amount || 0);
    return totals;
  }, {}), [supplierPayments]);
  const invoiceBalance = (invoice: any) => Math.max(Number(invoice.amount || 0) - (customerPaidByInvoice[invoice.id] || 0), 0);
  const billBalance = (bill: any) => Math.max(Number(bill.amount || 0) - (supplierPaidByBill[bill.id] || 0), 0);
  const isInvoiceOverdue = (invoice: any) => invoiceBalance(invoice) > 0 && Boolean(invoice.due) && new Date(invoice.due) < new Date();
  const collectableInvoices = invoices.filter((invoice) => !["Draft", "Cancelled", "Void"].includes(invoice.status));
  const receivableTotal = collectableInvoices.reduce((sum, item) => sum + invoiceBalance(item), 0);
  const payableTotal = bills.reduce((sum, item) => sum + billBalance(item), 0);
  const paymentsReceived = customerPayments
    .filter((payment) => payment.status === "Posted")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const overdueReceivables = collectableInvoices.filter(isInvoiceOverdue)
    .reduce((sum, item) => sum + invoiceBalance(item), 0);
  const vatInput = expenses.filter((item) => item.status === "Posted").reduce((sum, item) => sum + Number(item.vat || 0), 0);
  const vatOutput = collectableInvoices.reduce((sum, item) => sum + Number(item.vat || 0), 0);
  const vatPosition = vatOutput - vatInput;
  const selectedInvoiceLines = selectedInvoice ? readInvoiceLines(selectedInvoice.itemsJson) : { lines: [], invalid: false };
  const selectedInvoiceVat = Number(selectedInvoice?.vat || 0);
  const selectedInvoiceDiscount = Number(selectedInvoice?.discount || 0);
  const selectedInvoiceSubtotal = Math.max(Number(selectedInvoice?.amount || 0) - selectedInvoiceVat + selectedInvoiceDiscount, 0);
  const selectedInvoicePaid = selectedInvoice ? customerPaidByInvoice[selectedInvoice.id] || 0 : 0;
  const selectedInvoiceBalance = selectedInvoice ? invoiceBalance(selectedInvoice) : 0;

  const openPayment = (type: "invoice" | "bill", item: any, balance: number) => {
    setPaymentTarget({ type, id: item.id, name: type === "invoice" ? item.customer : item.supplier, balance });
    setPaymentAmount(balance.toFixed(activeCompany.currencyDecimals ?? 3));
    setPaymentMethod("Bank transfer");
    setPaymentReference("");
  };

  const recordPayment = async () => {
    if (!paymentTarget) return;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > paymentTarget.balance) {
      setFeedback(`Enter a payment greater than zero and no more than ${money(paymentTarget.balance, activeCompany.currency)}.`);
      return;
    }

    setSavingPayment(true);
    setFeedback(null);
    try {
      const isInvoice = paymentTarget.type === "invoice";
      await apiFetch(isInvoice ? "api/Payments/customer" : "api/Payments/supplier", {
        method: "POST",
        body: JSON.stringify({
          companyId: activeCompany.id,
          ...(isInvoice ? { invoiceId: paymentTarget.id } : { billId: paymentTarget.id }),
          amount,
          method: paymentMethod,
          reference: paymentReference.trim()
        })
      });
      setPaymentTarget(null);
      setFeedback("Payment recorded.");
      const [invoicesData, billsData, customerPaymentData, supplierPaymentData] = await Promise.all([
        apiFetch<any[]>(`api/Invoices?companyId=${encodeURIComponent(activeCompany.id)}`),
        apiFetch<any[]>(`api/Bills?companyId=${encodeURIComponent(activeCompany.id)}`),
        apiFetch<any[]>(`api/Payments?companyId=${encodeURIComponent(activeCompany.id)}`),
        apiFetch<any[]>(`api/Payments/supplier?companyId=${encodeURIComponent(activeCompany.id)}`)
      ]);
      setInvoices(invoicesData || []);
      setBills(billsData || []);
      setCustomerPayments(customerPaymentData || []);
      setSupplierPayments(supplierPaymentData || []);
    } catch (error) {
      console.error("Unable to record account payment:", error);
      setFeedback(error instanceof Error ? error.message : "Unable to record payment.");
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-slate-500">Loading accounts data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionTitle title="Accounts" subtitle={`Open customer and supplier balances, recorded payments, and VAT position for ${activeCompany.name}.`} />
      {feedback && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{feedback}</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Receivables" value={money(receivableTotal, activeCompany.currency)} icon={<CircleDollarSign className="h-5 w-5" />} trend="Collect" tone="warning" />
        <KpiCard label="Payables" value={money(payableTotal, activeCompany.currency)} icon={<ReceiptText className="h-5 w-5" />} tone="danger" />
        <KpiCard label="Payments received" value={money(paymentsReceived, activeCompany.currency)} icon={<CircleDollarSign className="h-5 w-5" />} tone="info" />
        <KpiCard label={vatPosition < 0 ? "VAT refundable" : "VAT payable"} value={money(Math.abs(vatPosition), activeCompany.currency)} icon={<FileText className="h-5 w-5" />} tone="info" />
      </div>
      <div className="space-y-4">
        <DataTable title="Receivables" action="" tableClassName="min-w-[1080px] table-fixed">
          <colgroup><col style={{ width: "10%" }} /><col style={{ width: "16%" }} /><col style={{ width: "13%" }} /><col style={{ width: "13%" }} /><col style={{ width: "10%" }} /><col style={{ width: "12%" }} /><col style={{ width: "26%" }} /></colgroup>
          <thead><tr><Th>Invoice</Th><Th>Customer</Th><Th>Amount</Th><Th>Balance</Th><Th>Due</Th><Th>Status</Th><Th>Action</Th></tr></thead>
          <tbody>
            {invoices.map((item) => (
              <tr key={item.id}>
                <Td className="whitespace-nowrap">{item.id}</Td>
                <Td className="whitespace-nowrap">{item.customer}</Td>
                <Td className="whitespace-nowrap">{money(item.amount, activeCompany.currency)}</Td>
                <Td className="whitespace-nowrap">{money(invoiceBalance(item), activeCompany.currency)}</Td>
                <Td className="whitespace-nowrap">{item.due}</Td>
                <Td className="whitespace-nowrap"><Badge variant={invoiceBalance(item) === 0 ? "success" : isInvoiceOverdue(item) ? "danger" : "warning"}>{invoiceBalance(item) === 0 ? "Paid" : isInvoiceOverdue(item) ? "Overdue" : item.status}</Badge></Td>
                <Td>
                  <div className="flex whitespace-nowrap gap-1">
                    <Button size="sm" variant="secondary" onClick={() => { setSelectedInvoice(item); setPrintMode("invoice"); setShowDo(true); }}>View / Print</Button>
                    <Button size="sm" disabled={!collectableInvoices.includes(item) || invoiceBalance(item) <= 0} onClick={() => openPayment("invoice", item, invoiceBalance(item))}>Record payment</Button>
                  </div>
                </Td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={7} className="p-5 text-center text-sm text-slate-500">No invoices found.</td></tr>}
          </tbody>
        </DataTable>
        <DataTable title="Payables" action="" tableClassName="min-w-[1080px] table-fixed">
          <colgroup><col style={{ width: "10%" }} /><col style={{ width: "18%" }} /><col style={{ width: "13%" }} /><col style={{ width: "13%" }} /><col style={{ width: "10%" }} /><col style={{ width: "12%" }} /><col style={{ width: "24%" }} /></colgroup>
          <thead><tr><Th>Bill</Th><Th>Supplier</Th><Th>Amount</Th><Th>Balance</Th><Th>Due</Th><Th>Status</Th><Th>Action</Th></tr></thead>
          <tbody>
            {bills.map((item) => <tr key={item.id}>
              <Td className="whitespace-nowrap">{item.id}</Td><Td className="whitespace-nowrap">{item.supplier}</Td><Td className="whitespace-nowrap">{money(item.amount, activeCompany.currency)}</Td>
              <Td className="whitespace-nowrap">{money(billBalance(item), activeCompany.currency)}</Td><Td className="whitespace-nowrap">{item.due}</Td>
              <Td className="whitespace-nowrap"><Badge variant={billBalance(item) === 0 ? "success" : "warning"}>{billBalance(item) === 0 ? "Paid" : item.status}</Badge></Td>
              <Td className="whitespace-nowrap"><Button size="sm" disabled={billBalance(item) <= 0} onClick={() => openPayment("bill", item, billBalance(item))}>Pay supplier</Button></Td>
            </tr>)}
            {bills.length === 0 && <tr><td colSpan={7} className="p-5 text-center text-sm text-slate-500">No supplier bills found.</td></tr>}
          </tbody>
        </DataTable>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Info label="Overdue receivables" value={money(overdueReceivables, activeCompany.currency)} />
        <Info label="Input VAT" value={money(vatInput, activeCompany.currency)} />
        <Info label="Output VAT" value={money(vatOutput, activeCompany.currency)} />
        <Info label="Petty cash balance" value="Not tracked" />
        <Info label={vatPosition < 0 ? "VAT refundable" : "VAT payable"} value={money(Math.abs(vatPosition), activeCompany.currency)} />
      </div>
      <div className="space-y-4">
        <DataTable title="Customer payments" action="" tableClassName="min-w-[980px] table-fixed">
          <colgroup><col style={{ width: "15%" }} /><col style={{ width: "15%" }} /><col style={{ width: "22%" }} /><col style={{ width: "16%" }} /><col style={{ width: "16%" }} /><col style={{ width: "16%" }} /></colgroup>
          <thead><tr><Th>Date</Th><Th>Invoice</Th><Th>Customer</Th><Th>Amount</Th><Th>Method</Th><Th>Reference</Th></tr></thead>
          <tbody>
            {customerPayments.map((payment) => <tr key={payment.id}><Td className="whitespace-nowrap">{payment.paymentDate}</Td><Td className="whitespace-nowrap">{payment.invoiceId}</Td><Td>{payment.customer}</Td><Td className="whitespace-nowrap">{money(payment.amount, activeCompany.currency)}</Td><Td>{payment.method}</Td><Td>{payment.reference || "—"}</Td></tr>)}
            {customerPayments.length === 0 && <tr><td colSpan={6} className="p-5 text-center text-sm text-slate-500">No customer payments recorded.</td></tr>}
          </tbody>
        </DataTable>
        <DataTable title="Supplier payments" action="" tableClassName="min-w-[980px] table-fixed">
          <colgroup><col style={{ width: "15%" }} /><col style={{ width: "15%" }} /><col style={{ width: "22%" }} /><col style={{ width: "16%" }} /><col style={{ width: "16%" }} /><col style={{ width: "16%" }} /></colgroup>
          <thead><tr><Th>Date</Th><Th>Bill</Th><Th>Supplier</Th><Th>Amount</Th><Th>Method</Th><Th>Reference</Th></tr></thead>
          <tbody>
            {supplierPayments.map((payment) => <tr key={payment.id}><Td className="whitespace-nowrap">{payment.paymentDate}</Td><Td className="whitespace-nowrap">{payment.billId}</Td><Td>{payment.supplier}</Td><Td className="whitespace-nowrap">{money(payment.amount, activeCompany.currency)}</Td><Td>{payment.method}</Td><Td>{payment.reference || "—"}</Td></tr>)}
            {supplierPayments.length === 0 && <tr><td colSpan={6} className="p-5 text-center text-sm text-slate-500">No supplier payments recorded.</td></tr>}
          </tbody>
        </DataTable>
      </div>

      {paymentTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="account-payment-title">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 id="account-payment-title" className="text-lg font-bold text-slate-950">{paymentTarget.type === "invoice" ? "Record customer payment" : "Record supplier payment"}</h2>
                <p className="mt-1 text-sm text-slate-500">{paymentTarget.id} · {paymentTarget.name}</p>
              </div>
              <button type="button" onClick={() => setPaymentTarget(null)} aria-label="Close payment dialog"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-slate-600">Outstanding: <strong>{money(paymentTarget.balance, activeCompany.currency)}</strong></p>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Payment amount ({activeCompany.currency})
              <input type="number" min="0.001" max={paymentTarget.balance} step="0.001" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Payment method
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
                <option>Bank transfer</option><option>Cash</option><option>Card</option><option>Cheque</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Reference
              <input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" disabled={savingPayment} onClick={() => setPaymentTarget(null)}>Cancel</Button>
              <Button variant="primary" disabled={savingPayment} onClick={() => void recordPayment()}>{savingPayment ? "Saving…" : "Save payment"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Sales Invoice / DO Overlay --- */}
      {showDo && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="relative bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-4xl w-full p-6 space-y-4 print:border-none print:shadow-none print:p-0">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 print:hidden">
              <div>
                <h3 className="text-lg font-bold text-slate-900 uppercase">
                  {printMode === "invoice" ? "Sales Invoice" : "Delivery Order (DO)"}
                </h3>
                <p className="text-xs text-slate-500">
                  {printMode === "invoice" ? "Full details with pricing, VAT calculation, and payments." : "Dispatch validation document. All pricing is hidden."}
                </p>
              </div>

              {/* Radio Selector at Top Right */}
              <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <input
                    type="radio"
                    name="printMode"
                    checked={printMode === "invoice"}
                    onChange={() => setPrintMode("invoice")}
                    className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  Print as SalesInvoice
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <input
                    type="radio"
                    name="printMode"
                    checked={printMode === "do"}
                    onChange={() => setPrintMode("do")}
                    className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  Print as DO
                </label>
              </div>

              <button type="button" onClick={() => { setShowDo(false); setSelectedInvoice(null); }} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Header info matching layout */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Customer:</span>
                <span className="font-bold text-slate-900 block mt-0.5">{selectedInvoice.customer}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Salesperson / Sales No:</span>
                <span className="font-bold text-slate-900 block mt-0.5">{selectedInvoice.salesperson || "Unassigned"} ({selectedInvoice.id})</span>
              </div>
              <div className="md:text-right">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Due Date:</span>
                <span className="font-bold text-slate-900 block mt-0.5">{selectedInvoice.due}</span>
                <span className="text-[10px] text-slate-500 block">Doc Date: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Grid Items Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-500">
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">BarCode</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5">UOM</th>
                    {printMode === "invoice" && (
                      <>
                        <th className="p-2.5 text-right">Rate</th>
                        <th className="p-2.5 text-right">Amount</th>
                        <th className="p-2.5 text-right">VAT %</th>
                        <th className="p-2.5 text-right">VAT Amt</th>
                        <th className="p-2.5 text-right">Gross Amt</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoiceLines.lines.map((line, idx) => {
                    const rate = Number(line.unitPrice ?? line.rate ?? 0);
                    const qty = Number(line.quantity ?? line.qty ?? 0);
                    const amount = qty * rate;
                    const rawVatRate = Number(line.vatRate ?? (Number(line.vatPercent ?? activeCompany.defaultVatRate ?? 0) / 100));
                    const vatRate = rawVatRate > 1 ? rawVatRate / 100 : rawVatRate;
                    const vatAmount = amount * vatRate;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-semibold text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 text-slate-500">{line.barcode || "N/A"}</td>
                        <td className="p-2.5 font-bold text-slate-900">{line.description || line.itemName || "—"}</td>
                        <td className="p-2.5 text-right font-semibold text-slate-950">{qty}</td>
                        <td className="p-2.5"><Badge variant="default">{line.uom || "pcs"}</Badge></td>
                        {printMode === "invoice" && (
                          <>
                            <td className="p-2.5 text-right">{rate.toFixed(activeCompany.currencyDecimals ?? 3)}</td>
                            <td className="p-2.5 text-right font-medium">{amount.toFixed(activeCompany.currencyDecimals ?? 3)}</td>
                            <td className="p-2.5 text-right">{(vatRate * 100).toFixed(2)}%</td>
                            <td className="p-2.5 text-right text-slate-500">{vatAmount.toFixed(activeCompany.currencyDecimals ?? 3)}</td>
                            <td className="p-2.5 text-right font-semibold text-slate-950">{(amount + vatAmount).toFixed(activeCompany.currencyDecimals ?? 3)}</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                  {selectedInvoiceLines.lines.length === 0 && (
                    <tr><td colSpan={printMode === "invoice" ? 10 : 5} className="p-4 text-center text-slate-500">
                      {selectedInvoiceLines.invalid ? "Stored invoice line details could not be read." : "No invoice line details were saved."}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Panels block */}
            <div className="grid gap-4 md:grid-cols-2 pt-2 text-xs">
              {/* Left Stats panel matching layout */}
              <div>
                {printMode === "invoice" ? (
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Amount Received:</span>
                      <span className="font-bold text-slate-900">{money(selectedInvoicePaid, activeCompany.currency)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Balance:</span>
                      <span className="font-bold text-slate-900">{money(selectedInvoiceBalance, activeCompany.currency)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Quantity:</span>
                    <span className="text-base font-black text-blue-600">
                      {(() => {
                        if (selectedInvoiceLines.lines.length === 0) return "Unavailable";
                        return selectedInvoiceLines.lines.reduce((sum, line) => sum + Number(line.qty ?? line.quantity ?? 0), 0);
                      })()} Units
                    </span>
                  </div>
                )}
              </div>

              {/* Right Totals Sequence panel */}
              {printMode === "invoice" && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 justify-self-end w-full max-w-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Subtotal before discount:</span>
                    <span className="font-bold text-slate-900">{money(selectedInvoiceSubtotal, activeCompany.currency)}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Discount:</span>
                    <span>-{money(selectedInvoiceDiscount, activeCompany.currency)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-1.5 font-semibold text-slate-900">
                    <span>Taxable amount:</span>
                    <span>{money(selectedInvoiceSubtotal - selectedInvoiceDiscount, activeCompany.currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>VAT:</span>
                    <span>{money(selectedInvoiceVat, activeCompany.currency)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-black text-blue-600 text-sm">
                    <span>Total due:</span>
                    <span>{money(selectedInvoice.amount, activeCompany.currency)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 pt-6 text-[10px] text-center font-semibold text-slate-400">
              <div>
                <div className="border-t border-slate-200 w-36 mx-auto pt-1">Prepared By</div>
              </div>
              <div>
                <div className="border-t border-slate-200 w-36 mx-auto pt-1">Received By</div>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 print:hidden">
              <Button variant="secondary" onClick={() => { setShowDo(false); setSelectedInvoice(null); }}>Close</Button>
              <Button variant="primary" onClick={() => window.print()} className="flex items-center gap-1">
                <FileText className="h-4 w-4" /> Print {printMode === "invoice" ? "Sales Invoice" : "DO"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
