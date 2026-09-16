"use client";

import { useState, useEffect } from "react";
import { Building2, CircleDollarSign, FileText, ReceiptText, X } from "lucide-react";
import { KpiCard } from "../../components/command-center";
import { Badge } from "../../components/ui/badge";
import { Td, Th } from "../../components/ui/table";
import type { Company } from "../../data/mock";
import { money } from "../../lib/utils";
import { apiFetch } from "../../lib/api";
import { DataTable, Info, SectionTitle } from "../../modules/shared/screen-kit";
import { Button } from "../../components/ui/button";

export function AccountsPage({ activeCompany }: { activeCompany: Company }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [showDo, setShowDo] = useState(false);
  const [printMode, setPrintMode] = useState<"invoice" | "do">("invoice");

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      apiFetch<any[]>(`api/Invoices?companyId=${activeCompany.id}`),
      apiFetch<any[]>(`api/Bills?companyId=${activeCompany.id}`)
    ])
      .then(([invoicesData, billsData]) => {
        if (active) {
          setInvoices(invoicesData || []);
          setBills(billsData || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching accounts data:", err);
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeCompany.id]);

  const receivableTotal = invoices.reduce((sum, item) => sum + item.amount, 0);
  const payableTotal = bills.reduce((sum, item) => sum + item.amount, 0);
  const overdueReceivables = invoices.filter((item) => item.status === "Overdue").reduce((sum, item) => sum + item.amount, 0);
  const bankBalance = 18450;
  const pettyCash = 620;
  const vatInput = bills.reduce((sum, item) => sum + item.amount * 0.05 / 1.05, 0);
  const vatOutput = invoices.reduce((sum, item) => sum + item.amount * 0.05 / 1.05, 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-slate-500">Loading accounts data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionTitle title="Accounts" subtitle="Receivables, payables, bank, petty cash, VAT position, and cash visibility for GGMS Oman." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Receivables" value={money(receivableTotal, activeCompany.currency)} icon={<CircleDollarSign className="h-5 w-5" />} trend="Collect" tone="warning" />
        <KpiCard label="Payables" value={money(payableTotal, activeCompany.currency)} icon={<ReceiptText className="h-5 w-5" />} tone="danger" />
        <KpiCard label="Bank balance" value={money(bankBalance, activeCompany.currency)} icon={<Building2 className="h-5 w-5" />} tone="success" />
        <KpiCard label="VAT payable" value={money(Math.max(vatOutput - vatInput, 0), activeCompany.currency)} icon={<FileText className="h-5 w-5" />} tone="info" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <DataTable title="Receivables" action="Record payment">
          <thead><tr><Th>Invoice</Th><Th>Customer</Th><Th>Amount</Th><Th>Due</Th><Th>Status</Th><Th>Action</Th></tr></thead>
          <tbody>
            {invoices.map((item) => (
              <tr key={item.id}>
                <Td>{item.id}</Td>
                <Td>{item.customer}</Td>
                <Td>{money(item.amount, activeCompany.currency)}</Td>
                <Td>{item.due}</Td>
                <Td><Badge variant={item.status === "Overdue" ? "danger" : item.status === "Due" ? "warning" : "info"}>{item.status}</Badge></Td>
                <Td>
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedInvoice(item); setPrintMode("invoice"); setShowDo(true); }}>
                    View / Print
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        <DataTable title="Payables" action="Pay supplier">
          <thead><tr><Th>Bill</Th><Th>Supplier</Th><Th>Amount</Th><Th>Due</Th><Th>Status</Th></tr></thead>
          <tbody>
            {bills.map((item) => (
              <tr key={item.id}><Td>{item.id}</Td><Td>{item.supplier}</Td><Td>{money(item.amount, activeCompany.currency)}</Td><Td>{item.due}</Td><Td><Badge variant={item.status === "To Pay" ? "warning" : "info"}>{item.status}</Badge></Td></tr>
            ))}
          </tbody>
        </DataTable>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Info label="Overdue receivables" value={money(overdueReceivables, activeCompany.currency)} />
        <Info label="Petty cash" value={money(pettyCash, activeCompany.currency)} />
        <Info label="Input VAT" value={money(vatInput, activeCompany.currency)} />
        <Info label="Output VAT" value={money(vatOutput, activeCompany.currency)} />
      </div>

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
                <span className="text-[10px] text-slate-500 block">Assigned Address: Muscat, Oman</span>
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
                  {(() => {
                    try {
                      const lines = JSON.parse(selectedInvoice.itemsJson || "[]");
                      if (lines && lines.length > 0) {
                        return lines.map((line: any, idx: number) => {
                          const rate = line.rate || line.unitPrice || 0;
                          const qty = line.qty || line.quantity || 0;
                          const amt = qty * rate;
                          const vatAmt = amt * 0.05;
                          const grossAmt = amt + vatAmt;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-semibold text-slate-500">{idx + 1}</td>
                              <td className="p-2.5 text-slate-500">{line.barcode || "N/A"}</td>
                              <td className="p-2.5 font-bold text-slate-900">{line.description || line.itemName}</td>
                              <td className="p-2.5 text-right font-semibold text-slate-950">{qty}</td>
                              <td className="p-2.5"><Badge variant="default">{line.uom || "pcs"}</Badge></td>
                              {printMode === "invoice" && (
                                <>
                                  <td className="p-2.5 text-right">{rate.toFixed(2)}</td>
                                  <td className="p-2.5 text-right font-medium">{amt.toFixed(2)}</td>
                                  <td className="p-2.5 text-right">5.0%</td>
                                  <td className="p-2.5 text-right text-slate-500">{vatAmt.toFixed(2)}</td>
                                  <td className="p-2.5 text-right font-semibold text-slate-950">{grossAmt.toFixed(2)}</td>
                                </>
                              )}
                            </tr>
                          );
                        });
                      }
                    } catch (e) {}
                    return (
                      <tr>
                        <td className="p-2.5 text-slate-500">1</td>
                        <td className="p-2.5 text-slate-500">N/A</td>
                        <td className="p-2.5 font-bold text-slate-900">Standard Service / Goods Delivery</td>
                        <td className="p-2.5 text-right font-semibold text-slate-950">1</td>
                        <td className="p-2.5"><Badge variant="default">pcs</Badge></td>
                        {printMode === "invoice" && (
                          <>
                            <td className="p-2.5 text-right">{selectedInvoice.amount.toFixed(2)}</td>
                            <td className="p-2.5 text-right font-medium">{selectedInvoice.amount.toFixed(2)}</td>
                            <td className="p-2.5 text-right">5.0%</td>
                            <td className="p-2.5 text-right text-slate-500">{(selectedInvoice.amount * 0.05).toFixed(2)}</td>
                            <td className="p-2.5 text-right font-semibold text-slate-950">{(selectedInvoice.amount * 1.05).toFixed(2)}</td>
                          </>
                        )}
                      </tr>
                    );
                  })()}
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
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Stock status:</span>
                      <span className="font-bold text-slate-800">Available</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Margin:</span>
                      <span className="font-bold text-emerald-700">22.5%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Amount Received:</span>
                      <span className="font-bold text-slate-900">{(selectedInvoice.amount * 1.05 - (selectedInvoice.discount || 0)).toFixed(2)} OMR</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Balance:</span>
                      <span className="font-bold text-slate-900">0.00 OMR</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Quantity:</span>
                    <span className="text-base font-black text-blue-600">
                      {(() => {
                        try {
                          const lines = JSON.parse(selectedInvoice.itemsJson || "[]");
                          if (lines && lines.length > 0) {
                            return lines.reduce((sum: number, line: any) => sum + (line.qty || line.quantity || 0), 0);
                          }
                        } catch (e) {}
                        return 1;
                      })()} Units
                    </span>
                  </div>
                )}
              </div>

              {/* Right Totals Sequence panel */}
              {printMode === "invoice" && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 justify-self-end w-full max-w-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Total Amount:</span>
                    <span className="font-bold text-slate-900">{(selectedInvoice.amount).toFixed(2)} OMR</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Discount:</span>
                    <span>-{selectedInvoice.discount?.toFixed(2) || "0.00"} OMR</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-1.5 font-semibold text-slate-900">
                    <span>Gross Amount:</span>
                    <span>{(selectedInvoice.amount - selectedInvoice.discount).toFixed(2)} OMR</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tax Amount (5% VAT):</span>
                    <span>{selectedInvoice.vat?.toFixed(2) || (selectedInvoice.amount * 0.05).toFixed(2)} OMR</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-black text-blue-600 text-sm">
                    <span>Net Amount:</span>
                    <span>{(selectedInvoice.amount - selectedInvoice.discount + (selectedInvoice.vat || (selectedInvoice.amount * 0.05))).toFixed(2)} OMR</span>
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
