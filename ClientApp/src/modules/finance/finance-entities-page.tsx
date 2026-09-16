"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  FileText,
  RefreshCw,
  FolderTree,
  RotateCcw
} from "lucide-react";
import type { Company } from "../../data/mock";
import { apiFetch } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { SectionTitle, ConfirmDeleteModal } from "../shared/screen-kit";
import type {
  LedgerItem,
  EntryTypeItem,
  CostCentreItem,
  ProfitCentreItem,
  JournalEntryRecord,
  JournalEntryLineItem
} from "../shared/domain";

export function FinanceEntitiesPage({
  activeCompany,
  initialTab = "ledgers"
}: {
  activeCompany: Company;
  initialTab?: "ledgers" | "entry-types" | "cost-profit-centres" | "journal-entries";
}) {
  const [activeTab, setActiveTab] = useState<"ledgers" | "entry-types" | "cost-profit-centres" | "journal-entries">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Data states
  const [ledgers, setLedgers] = useState<LedgerItem[]>([]);
  const [recycledLedgers, setRecycledLedgers] = useState<LedgerItem[]>([]);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [entryTypes, setEntryTypes] = useState<EntryTypeItem[]>([]);
  const [costCentres, setCostCentres] = useState<CostCentreItem[]>([]);
  const [profitCentres, setProfitCentres] = useState<ProfitCentreItem[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryRecord[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search & Filter states
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerClassFilter, setLedgerClassFilter] = useState("All");

  const [entryTypeSearch, setEntryTypeSearch] = useState("");

  // Modals state
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState<LedgerItem | null>(null);

  const [isEntryTypeModalOpen, setIsEntryTypeModalOpen] = useState(false);
  const [editingEntryType, setEditingEntryType] = useState<EntryTypeItem | null>(null);

  const [isCostCentreModalOpen, setIsCostCentreModalOpen] = useState(false);

  const [isProfitCentreModalOpen, setIsProfitCentreModalOpen] = useState(false);

  // Delete Modal state
  const [deleteTarget, setDeleteTarget] = useState<{ type: "ledger" | "entry-type" | "cost-centre" | "profit-centre" | "journal-entry"; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Journal Entry Form State
  const [viewEntryMode, setViewEntryMode] = useState<"list" | "create">("list");
  const [entryTypeVal, setEntryTypeVal] = useState("1001");
  const [fiscalYearVal, setFiscalYearVal] = useState("2025-26 (Jul 1st 25 to Jun 30th 26)");
  const [datetimeVal, setDatetimeVal] = useState(new Date().toLocaleString());
  const [referenceVal, setReferenceVal] = useState("");
  const [notesVal, setNotesVal] = useState("");
  const [entryLines, setEntryLines] = useState<JournalEntryLineItem[]>([
    { ledgerCode: "10001", ledgerName: "Main Bank Account", debit: 0, credit: 0, notes: "", profitCentreCode: "", costCentreCode: "" },
    { ledgerCode: "4001", ledgerName: "Sales Revenue", debit: 0, credit: 0, notes: "", profitCentreCode: "", costCentreCode: "" }
  ]);

  // Load all finance entities
  const loadData = async () => {
    setLoading(true);
    try {
      const [ledgersRes, entryTypesRes, costCentresRes, profitCentresRes, entriesRes] = await Promise.all([
        apiFetch<LedgerItem[]>(`api/FinanceEntities/ledgers?companyId=${activeCompany.id}`),
        apiFetch<EntryTypeItem[]>(`api/FinanceEntities/entry-types?companyId=${activeCompany.id}`),
        apiFetch<CostCentreItem[]>(`api/FinanceEntities/cost-centres?companyId=${activeCompany.id}`),
        apiFetch<ProfitCentreItem[]>(`api/FinanceEntities/profit-centres?companyId=${activeCompany.id}`),
        apiFetch<JournalEntryRecord[]>(`api/FinanceEntities/entries?companyId=${activeCompany.id}`)
      ]);

      setLedgers(ledgersRes || []);
      setEntryTypes(entryTypesRes || []);
      setCostCentres(costCentresRes || []);
      setProfitCentres(profitCentresRes || []);
      setJournalEntries(entriesRes || []);
    } catch (err) {
      console.error("Error loading finance entities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompany.id]);

  const showToast = (type: "success" | "error", text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // -------------------------------------------------------------
  // LEDGER HANDLERS
  // -------------------------------------------------------------
  const handleSaveLedger = async (formData: LedgerItem) => {
    try {
      await apiFetch<LedgerItem>("api/FinanceEntities/ledgers", {
        method: "POST",
        body: JSON.stringify({ ...formData, companyId: activeCompany.id })
      });
      showToast("success", `Ledger ${formData.code} saved successfully to database!`);
      setIsLedgerModalOpen(false);
      setEditingLedger(null);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save ledger");
    }
  };

  // -------------------------------------------------------------
  // ENTRY TYPE HANDLERS
  // -------------------------------------------------------------
  const handleSaveEntryType = async (formData: EntryTypeItem) => {
    try {
      await apiFetch<EntryTypeItem>("api/FinanceEntities/entry-types", {
        method: "POST",
        body: JSON.stringify({ ...formData, companyId: activeCompany.id })
      });
      showToast("success", `Entry Type ${formData.code} saved successfully!`);
      setIsEntryTypeModalOpen(false);
      setEditingEntryType(null);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save entry type");
    }
  };

  // -------------------------------------------------------------
  // COST & PROFIT CENTRE HANDLERS
  // -------------------------------------------------------------
  const handleSaveCostCentre = async (formData: CostCentreItem) => {
    try {
      await apiFetch("api/FinanceEntities/cost-centres", {
        method: "POST",
        body: JSON.stringify({ ...formData, companyId: activeCompany.id })
      });
      showToast("success", `Cost Centre ${formData.code} saved!`);
      setIsCostCentreModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save cost centre");
    }
  };

  const handleSaveProfitCentre = async (formData: ProfitCentreItem) => {
    try {
      await apiFetch("api/FinanceEntities/profit-centres", {
        method: "POST",
        body: JSON.stringify({ ...formData, companyId: activeCompany.id })
      });
      showToast("success", `Profit Centre ${formData.code} saved!`);
      setIsProfitCentreModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save profit centre");
    }
  };

  // -------------------------------------------------------------
  // DELETE HANDLER
  // -------------------------------------------------------------
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === "ledger") {
        const itemToRecycle = ledgers.find((l) => l.code === deleteTarget.id);
        if (itemToRecycle && !recycledLedgers.some((r) => r.code === itemToRecycle.code)) {
          setRecycledLedgers((prev) => [...prev, itemToRecycle]);
        }
        await apiFetch(`api/FinanceEntities/ledgers/${deleteTarget.id}`, { method: "DELETE" });
      } else if (deleteTarget.type === "entry-type") {
        await apiFetch(`api/FinanceEntities/entry-types/${deleteTarget.id}`, { method: "DELETE" });
      } else if (deleteTarget.type === "cost-centre") {
        await apiFetch(`api/FinanceEntities/cost-centres/${deleteTarget.id}`, { method: "DELETE" });
      } else if (deleteTarget.type === "profit-centre") {
        await apiFetch(`api/FinanceEntities/profit-centres/${deleteTarget.id}`, { method: "DELETE" });
      } else if (deleteTarget.type === "journal-entry") {
        await apiFetch(`api/FinanceEntities/entries/${deleteTarget.id}`, { method: "DELETE" });
      }
      showToast("success", `${deleteTarget.name} deleted successfully.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Deletion failed");
    } finally {
      setIsDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // JOURNAL ENTRY SUBMIT
  // -------------------------------------------------------------
  const totalDebit = entryLines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = entryLines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const handleSaveJournalEntry = async () => {
    if (!isBalanced) {
      showToast("error", "Journal Entry is not balanced! Total Debit must equal Total Credit.");
      return;
    }

    const selectedTypeObj = entryTypes.find((t) => t.code === entryTypeVal);
    const typeName = selectedTypeObj ? selectedTypeObj.name : "Journal Entry (JV)";

    const payload: JournalEntryRecord = {
      id: `JV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
      companyId: activeCompany.id,
      entryTypeCode: entryTypeVal,
      entryTypeName: typeName,
      fiscalYear: fiscalYearVal,
      datetime: datetimeVal,
      reference: referenceVal,
      totalDebit,
      totalCredit,
      notes: notesVal,
      status: "Saved",
      lines: entryLines.map((l) => {
        const foundLedger = ledgers.find((led) => led.code === l.ledgerCode);
        return {
          ...l,
          ledgerName: foundLedger ? foundLedger.name : l.ledgerName || l.ledgerCode
        };
      })
    };

    try {
      await apiFetch("api/FinanceEntities/entries", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showToast("success", `Voucher Entry ${payload.id} saved to DB!`);
      setViewEntryMode("list");
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save entry to database");
    }
  };

  // Download Chart of Accounts CSV
  const handleExportChartOfAccounts = () => {
    const headers = ["Ledger Code", "Ledger Name", "Class", "Parent Code", "Retained Earnings", "Description"];
    const rows = ledgers.map((l) => [
      l.code,
      `"${l.name.replace(/"/g, '""')}"`,
      l.class,
      l.parentCode || "No Parent",
      l.isRetainedEarnings ? "Yes" : "No",
      `"${(l.description || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Chart_of_Accounts_${activeCompany.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort and group ledgers hierarchically (Parent -> Children)
  const getSortedHierarchicalLedgers = (items: LedgerItem[]) => {
    const parents = items.filter(
      (item) => !item.parentCode || item.parentCode === "No Parent"
    );
    const result: { item: LedgerItem; isParent: boolean }[] = [];

    parents.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

    parents.forEach((parent) => {
      result.push({ item: parent, isParent: true });
      const children = items.filter((child) => child.parentCode === parent.code);
      children.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
      children.forEach((child) => {
        result.push({ item: child, isParent: false });
      });
    });

    const processedCodes = new Set(result.map((r) => r.item.code));
    const remaining = items.filter((item) => !processedCodes.has(item.code));
    remaining.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    remaining.forEach((item) => {
      const isParent = !item.parentCode || item.parentCode === "No Parent";
      result.push({ item, isParent });
    });

    return result;
  };

  // Filtering Ledgers
  const filteredLedgers = ledgers.filter((l) => {
    const matchesSearch = l.code.toLowerCase().includes(ledgerSearch.toLowerCase()) || l.name.toLowerCase().includes(ledgerSearch.toLowerCase());
    const matchesClass = ledgerClassFilter === "All" || l.class === ledgerClassFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {feedbackMsg && (
        <div
          className={`fixed top-5 right-5 z-[120] flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl transition-all duration-300 ${
            feedbackMsg.type === "success" ? "bg-emerald-600 text-white shadow-emerald-500/30" : "bg-rose-600 text-white shadow-rose-500/30"
          }`}
        >
          {feedbackMsg.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-xs font-bold">{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="ml-2 hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Dynamic Header Based on Active Tab */}
      <SectionTitle
        title={
          activeTab === "ledgers"
            ? "Ledgers (Chart of Accounts)"
            : activeTab === "entry-types"
            ? "Entry Types"
            : activeTab === "cost-profit-centres"
            ? "Cost & Profit Centres"
            : "Journal Entries (Vouchers)"
        }
        subtitle={
          activeTab === "ledgers"
            ? "Manage hierarchical Chart of Accounts, parent-child ledgers, filter by ledger class, and export financial reports."
            : activeTab === "entry-types"
            ? "Configure financial voucher entry types (JV, PV, Receipt Vouchers, Contra Entries, Opening Balances, etc.)."
            : activeTab === "cost-profit-centres"
            ? "Manage departmental cost allocation centres and business unit profit generation centres."
            : "Record and review balanced multi-line debit & credit journal vouchers saved in SQLite DB."
        }
        icon={
          activeTab === "ledgers"
            ? FolderTree
            : activeTab === "entry-types"
            ? Layers
            : activeTab === "cost-profit-centres"
            ? Building2
            : FileText
        }
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-3 text-xs font-bold text-slate-500">Loading Finance Entities from database...</span>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: LEDGERS (CHART OF ACCOUNTS) */}
          {/* ========================================================================= */}
          {activeTab === "ledgers" && (
            <div className="space-y-4">
              {/* Controls Bar */}
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by Code or Name..."
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <select
                    value={ledgerClassFilter}
                    onChange={(e) => setLedgerClassFilter(e.target.value)}
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="All">All Ledger Classes</option>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRecycleBinOpen(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-[#d9534f] hover:bg-[#c9302c] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Open Recycle Bin {recycledLedgers.length > 0 && `(${recycledLedgers.length})`}
                  </button>
                  <Button size="sm" variant="secondary" onClick={handleExportChartOfAccounts} className="h-9 gap-1.5 text-xs font-bold">
                    <Download className="h-3.5 w-3.5" /> Download Chart of Accounts
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setEditingLedger(null);
                      setIsLedgerModalOpen(true);
                    }}
                    className="h-9 gap-1.5 text-xs font-bold bg-[#28a745] hover:bg-[#218838] text-white border-none"
                  >
                    <Plus className="h-3.5 w-3.5" /> New Ledger
                  </Button>
                </div>
              </div>

              {/* Table Matching Screenshot Format (Ledger Code, Ledger Name, Ledger Class, Actions) */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#212529] text-white font-bold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-5 w-48 border-b border-slate-800">Ledger Code</th>
                      <th className="py-3.5 px-5 border-b border-slate-800">Ledger Name</th>
                      <th className="py-3.5 px-5 w-44 border-b border-slate-800">Ledger Class</th>
                      <th className="py-3.5 px-5 w-32 text-center border-b border-slate-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800 bg-white">
                    {getSortedHierarchicalLedgers(filteredLedgers).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-slate-400 font-medium">
                          No Ledgers found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      getSortedHierarchicalLedgers(filteredLedgers).map(({ item, isParent }) => (
                        <tr key={item.code} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-5">
                            <span className={isParent ? "font-extrabold text-slate-950 text-xs" : "pl-8 inline-block text-slate-700 text-xs font-normal"}>
                              {item.code}
                            </span>
                          </td>
                          <td className="py-3 px-5">
                            <span className={isParent ? "font-extrabold text-slate-950 text-xs" : "text-slate-700 text-xs font-normal"}>
                              {item.name}
                            </span>
                          </td>
                          <td className="py-3 px-5">
                            <span className={isParent ? "font-extrabold text-slate-900 text-xs" : "text-slate-700 text-xs font-normal"}>
                              {item.class}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingLedger(item);
                                  setIsLedgerModalOpen(true);
                                }}
                                className="bg-[#17a2b8] hover:bg-[#138496] text-white p-1.5 rounded shadow-sm transition-colors"
                                title="Edit Ledger"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-white" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTarget({
                                    type: "ledger",
                                    id: item.code,
                                    name: `Ledger ${item.code} (${item.name})`
                                  })
                                }
                                className="bg-[#dc3545] hover:bg-[#c82333] text-white p-1.5 rounded shadow-sm transition-colors"
                                title="Delete Ledger"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-white" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ENTRY TYPES */}
          {/* ========================================================================= */}
          {activeTab === "entry-types" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Entry Types..."
                    value={entryTypeSearch}
                    onChange={(e) => setEntryTypeSearch(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setEditingEntryType(null);
                    setIsEntryTypeModalOpen(true);
                  }}
                  className="h-9 gap-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Plus className="h-3.5 w-3.5" /> New Entry Type
                </Button>
              </div>

              {/* Entry Types Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-extrabold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-4 w-16">SL</th>
                      <th className="py-3.5 px-4 w-28">Code</th>
                      <th className="py-3.5 px-4">Name</th>
                      <th className="py-3.5 px-4">Description</th>
                      <th className="py-3.5 px-4">Creator</th>
                      <th className="py-3.5 px-4 w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {entryTypes
                      .filter((et) => et.name.toLowerCase().includes(entryTypeSearch.toLowerCase()) || et.code.includes(entryTypeSearch))
                      .map((et, idx) => (
                        <tr key={et.code} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-extrabold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{et.code}</td>
                          <td className="py-3 px-4 font-extrabold text-slate-900">{et.name}</td>
                          <td className="py-3 px-4 text-slate-500">{et.description || "—"}</td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">{et.creator || "Tatweer Admin"}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingEntryType(et);
                                  setIsEntryTypeModalOpen(true);
                                }}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTarget({
                                    type: "entry-type",
                                    id: et.code,
                                    name: `Entry Type ${et.code} (${et.name})`
                                  })
                                }
                                className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: COST & PROFIT CENTRES */}
          {/* ========================================================================= */}
          {activeTab === "cost-profit-centres" && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profit Centres Panel */}
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Profit Centres</h3>
                    <p className="text-[11px] font-medium text-slate-500">Business units & revenue generation centres</p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => setIsProfitCentreModalOpen(true)} className="h-8 text-xs font-bold">
                    <Plus className="h-3.5 w-3.5" /> Add Profit Centre
                  </Button>
                </div>

                <div className="space-y-2">
                  {profitCentres.map((pc) => (
                    <div key={pc.code} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-blue-600">{pc.code}</span>
                          <span className="text-xs font-extrabold text-slate-900">{pc.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{pc.businessUnit} • {pc.description}</p>
                      </div>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: "profit-centre",
                            id: pc.code,
                            name: `Profit Centre ${pc.code} (${pc.name})`
                          })
                        }
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Centres Panel */}
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Cost Centres</h3>
                    <p className="text-[11px] font-medium text-slate-500">Departmental cost allocation & tracking</p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => setIsCostCentreModalOpen(true)} className="h-8 text-xs font-bold">
                    <Plus className="h-3.5 w-3.5" /> Add Cost Centre
                  </Button>
                </div>

                <div className="space-y-2">
                  {costCentres.map((cc) => (
                    <div key={cc.code} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-indigo-600">{cc.code}</span>
                          <span className="text-xs font-extrabold text-slate-900">{cc.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{cc.department} • {cc.description}</p>
                      </div>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: "cost-centre",
                            id: cc.code,
                            name: `Cost Centre ${cc.code} (${cc.name})`
                          })
                        }
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: JOURNAL ENTRIES (VOUCHERS) */}
          {/* ========================================================================= */}
          {activeTab === "journal-entries" && (
            <div className="space-y-6">
              {/* Header Toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {viewEntryMode === "create" ? "New Entry Form" : "Recorded Journal Vouchers"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {viewEntryMode === "create" ? "Create a balanced debit & credit voucher entry." : "Historical accounting vouchers saved in SQLite DB."}
                  </p>
                </div>

                {viewEntryMode === "list" ? (
                  <Button size="sm" variant="primary" onClick={() => setViewEntryMode("create")} className="h-9 gap-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700">
                    <Plus className="h-4 w-4" /> Create New Entry
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setViewEntryMode("list")} className="h-9 gap-1.5 text-xs font-bold">
                    Go Back to Entries List
                  </Button>
                )}
              </div>

              {/* CREATE NEW ENTRY FORM (Replicating Screenshot 1) */}
              {viewEntryMode === "create" ? (
                <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  {/* Top Form Fields */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                        Entry Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={entryTypeVal}
                        onChange={(e) => setEntryTypeVal(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                      >
                        {entryTypes.map((t) => (
                          <option key={t.code} value={t.code}>
                            {t.name} ({t.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                        Fiscal Year <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={fiscalYearVal}
                        onChange={(e) => setFiscalYearVal(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                      >
                        <option value="2025-26 (Jul 1st 25 to Jun 30th 26)">2025-26 (Jul 1st 25 to Jun 30th 26)</option>
                        <option value="2026-27 (Jul 1st 26 to Jun 30th 27)">2026-27 (Jul 1st 26 to Jun 30th 27)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                        Datetime <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={datetimeVal}
                        onChange={(e) => setDatetimeVal(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">Reference</label>
                      <input
                        type="text"
                        placeholder="e.g. REF-9902"
                        value={referenceVal}
                        onChange={(e) => setReferenceVal(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Lines Items Table Grid */}
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-800 text-white font-extrabold uppercase text-[11px]">
                          <th className="py-3 px-3 w-44">Profit Centre</th>
                          <th className="py-3 px-3 w-44">Cost Centre</th>
                          <th className="py-3 px-3">Ledger Account</th>
                          <th className="py-3 px-3 w-32 text-right">Debit ({activeCompany.currency})</th>
                          <th className="py-3 px-3 w-32 text-right">Credit ({activeCompany.currency})</th>
                          <th className="py-3 px-3">Notes</th>
                          <th className="py-3 px-2 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {entryLines.map((line, index) => (
                          <tr key={index}>
                            <td className="p-2">
                              <select
                                value={line.profitCentreCode}
                                onChange={(e) => {
                                  const updated = [...entryLines];
                                  updated[index].profitCentreCode = e.target.value;
                                  setEntryLines(updated);
                                }}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium outline-none"
                              >
                                <option value="">-- Select Profit Centre --</option>
                                {profitCentres.map((pc) => (
                                  <option key={pc.code} value={pc.code}>
                                    {pc.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="p-2">
                              <select
                                value={line.costCentreCode}
                                onChange={(e) => {
                                  const updated = [...entryLines];
                                  updated[index].costCentreCode = e.target.value;
                                  setEntryLines(updated);
                                }}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium outline-none"
                              >
                                <option value="">-- Select Cost Centre --</option>
                                {costCentres.map((cc) => (
                                  <option key={cc.code} value={cc.code}>
                                    {cc.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="p-2">
                              <select
                                value={line.ledgerCode}
                                onChange={(e) => {
                                  const updated = [...entryLines];
                                  const selLed = ledgers.find((l) => l.code === e.target.value);
                                  updated[index].ledgerCode = e.target.value;
                                  if (selLed) updated[index].ledgerName = selLed.name;
                                  setEntryLines(updated);
                                }}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                              >
                                <option value="">-- Select Ledger --</option>
                                {ledgers.map((l) => (
                                  <option key={l.code} value={l.code}>
                                    [{l.code}] {l.name} ({l.class})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="p-2">
                              <input
                                type="number"
                                step="0.001"
                                value={line.debit || ""}
                                placeholder="0.000"
                                onChange={(e) => {
                                  const updated = [...entryLines];
                                  updated[index].debit = parseFloat(e.target.value) || 0;
                                  setEntryLines(updated);
                                }}
                                className="h-9 w-full text-right font-mono font-bold text-slate-900 rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-blue-500"
                              />
                            </td>

                            <td className="p-2">
                              <input
                                type="number"
                                step="0.001"
                                value={line.credit || ""}
                                placeholder="0.000"
                                onChange={(e) => {
                                  const updated = [...entryLines];
                                  updated[index].credit = parseFloat(e.target.value) || 0;
                                  setEntryLines(updated);
                                }}
                                className="h-9 w-full text-right font-mono font-bold text-slate-900 rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-blue-500"
                              />
                            </td>

                            <td className="p-2">
                              <input
                                type="text"
                                value={line.notes || ""}
                                placeholder="Line note..."
                                onChange={(e) => {
                                  const updated = [...entryLines];
                                  updated[index].notes = e.target.value;
                                  setEntryLines(updated);
                                }}
                                className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none"
                              />
                            </td>

                            <td className="p-2 text-center">
                              {entryLines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setEntryLines(entryLines.filter((_, i) => i !== index))}
                                  className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Footer Totals */}
                    <div className="border-t border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setEntryLines([
                              ...entryLines,
                              { ledgerCode: "1001", ledgerName: "Current Asset", debit: 0, credit: 0, notes: "", profitCentreCode: "", costCentreCode: "" }
                            ])
                          }
                          className="h-8 gap-1.5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add New Line
                        </Button>

                        <div className="flex items-center gap-6 text-xs font-bold text-slate-800">
                          <div>
                            <span>Total Debit: </span>
                            <span className="font-mono text-sm font-black text-slate-950">{totalDebit.toFixed(3)}</span>
                          </div>

                          <div>
                            <span>Total Credit: </span>
                            <span className="font-mono text-sm font-black text-slate-950">{totalCredit.toFixed(3)}</span>
                          </div>

                          <div>
                            <span>Difference: </span>
                            <span className={`font-mono text-sm font-black ${isBalanced ? "text-emerald-600" : "text-rose-600"}`}>
                              {difference < 0.001 ? "0.000 (Balanced)" : difference.toFixed(3)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Area */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">Entry Description & Remarks</label>
                    <textarea
                      rows={3}
                      value={notesVal}
                      onChange={(e) => setNotesVal(e.target.value)}
                      placeholder="Write entry remarks or details..."
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <Button variant="secondary" onClick={() => setViewEntryMode("list")}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSaveJournalEntry}
                      disabled={!isBalanced}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold"
                    >
                      Save Entry
                    </Button>
                  </div>
                </div>
              ) : (
                /* JOURNAL ENTRIES LIST TABLE */
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-extrabold uppercase text-[11px] tracking-wider">
                        <th className="py-3.5 px-4 w-36">Entry ID</th>
                        <th className="py-3.5 px-4 w-32">Type</th>
                        <th className="py-3.5 px-4">Datetime / Ref</th>
                        <th className="py-3.5 px-4 text-right">Total Debit</th>
                        <th className="py-3.5 px-4 text-right">Total Credit</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 w-20 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {journalEntries.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No recorded Journal Entries. Click "Create New Entry" to record your first entry.
                          </td>
                        </tr>
                      ) : (
                        journalEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono font-bold text-blue-600">{entry.id}</td>
                            <td className="py-3 px-4 font-extrabold text-slate-900">{entry.entryTypeName}</td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900">{entry.datetime}</p>
                              {entry.reference && <p className="text-[10px] text-slate-400 font-mono">Ref: {entry.reference}</p>}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{entry.totalDebit.toFixed(3)}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{entry.totalCredit.toFixed(3)}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="success">Saved</Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() =>
                                  setDeleteTarget({
                                    type: "journal-entry",
                                    id: entry.id,
                                    name: `Voucher Entry ${entry.id}`
                                  })
                                }
                                className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW / EDIT LEDGER (Replicating Screenshot 3) */}
      {/* ========================================================================= */}
      {isLedgerModalOpen && (
        <LedgerFormModal
          editingLedger={editingLedger}
          allLedgers={ledgers}
          onClose={() => setIsLedgerModalOpen(false)}
          onSave={handleSaveLedger}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW / EDIT ENTRY TYPE (Replicating Screenshot 2) */}
      {/* ========================================================================= */}
      {isEntryTypeModalOpen && (
        <EntryTypeFormModal
          editingEntryType={editingEntryType}
          allEntryTypes={entryTypes}
          onClose={() => setIsEntryTypeModalOpen(false)}
          onSave={handleSaveEntryType}
        />
      )}

      {/* MODAL: COST CENTRE */}
      {isCostCentreModalOpen && (
        <CostCentreFormModal onClose={() => setIsCostCentreModalOpen(false)} onSave={handleSaveCostCentre} />
      )}

      {/* MODAL: PROFIT CENTRE */}
      {isProfitCentreModalOpen && (
        <ProfitCentreFormModal onClose={() => setIsProfitCentreModalOpen(false)} onSave={handleSaveProfitCentre} />
      )}

      {/* MODAL: RECYCLE BIN */}
      {isRecycleBinOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-rose-500" />
                <h3 className="text-base font-bold text-slate-900">Ledgers Recycle Bin</h3>
              </div>
              <button onClick={() => setIsRecycleBinOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recycledLedgers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                        Recycle bin is currently empty.
                      </td>
                    </tr>
                  ) : (
                    recycledLedgers.map((item) => (
                      <tr key={item.code} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                        <td className="py-3 px-4 text-slate-600">{item.class}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={async () => {
                              try {
                                await apiFetch("api/FinanceEntities/ledgers", {
                                  method: "POST",
                                  body: JSON.stringify({ ...item, companyId: activeCompany.id })
                                });
                                setRecycledLedgers(recycledLedgers.filter((l) => l.code !== item.code));
                                showToast("success", `Restored ${item.name} from Recycle Bin`);
                                loadData();
                              } catch (err: any) {
                                showToast("error", err.message || "Failed to restore ledger");
                              }
                            }}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-bold shadow-sm"
                          >
                            <RotateCcw className="h-3 w-3" /> Restore
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setIsRecycleBinOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Confirm Deletion"
        description="Are you sure you want to delete this record from database?"
        itemName={deleteTarget?.name}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
        loading={isDeleting}
      />
    </div>
  );
}

// =========================================================================
// SUB-MODAL COMPONENTS
// =========================================================================

function LedgerFormModal({
  editingLedger,
  allLedgers,
  onClose,
  onSave
}: {
  editingLedger: LedgerItem | null;
  allLedgers: LedgerItem[];
  onClose: () => void;
  onSave: (data: LedgerItem) => void;
}) {
  const [code, setCode] = useState(editingLedger?.code || "");
  const [name, setName] = useState(editingLedger?.name || "");
  const [ledgerClass, setLedgerClass] = useState<LedgerItem["class"]>(editingLedger?.class || "Asset");
  const [parentCode, setParentCode] = useState(editingLedger?.parentCode || "No Parent");
  const [isRetainedEarnings, setIsRetainedEarnings] = useState<boolean>(editingLedger?.isRetainedEarnings || false);
  const [description, setDescription] = useState(editingLedger?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;
    onSave({
      code,
      name,
      class: ledgerClass,
      parentCode,
      isRetainedEarnings,
      description
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900">{editingLedger ? "Edit Ledger" : "New Ledger"}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                Ledger Parent <span className="text-rose-500">*</span>
              </label>
              <select
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
              >
                <option value="No Parent">No Parent</option>
                {allLedgers
                  .filter((l) => l.code !== code)
                  .map((l) => (
                    <option key={l.code} value={l.code}>
                      [{l.code}] {l.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                Ledger Class <span className="text-rose-500">*</span>
              </label>
              <select
                value={ledgerClass}
                onChange={(e) => setLedgerClass(e.target.value as any)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
              >
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                Ledger Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!!editingLedger}
                placeholder="e.g. 100201"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                Ledger Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Machinery & Equipment"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">Retained Earnings ?</label>
            <div className="flex items-center gap-6 mt-1 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="retained"
                  checked={isRetainedEarnings}
                  onChange={() => setIsRetainedEarnings(true)}
                  className="accent-blue-600"
                />
                <span>Yes</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="retained"
                  checked={!isRetainedEarnings}
                  onChange={() => setIsRetainedEarnings(false)}
                  className="accent-blue-600"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed ledger account notes..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl">
              Close
            </Button>
            <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
              Save Ledger
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EntryTypeFormModal({
  editingEntryType,
  allEntryTypes = [],
  onClose,
  onSave
}: {
  editingEntryType: EntryTypeItem | null;
  allEntryTypes?: EntryTypeItem[];
  onClose: () => void;
  onSave: (data: EntryTypeItem) => void;
}) {
  const getNextCode = () => {
    if (editingEntryType) return editingEntryType.code;
    let nextNum = 1001;
    allEntryTypes.forEach((e) => {
      const num = parseInt(e.code, 10);
      if (!isNaN(num) && num >= nextNum) {
        nextNum = num + 1;
      }
    });
    return nextNum.toString();
  };

  const [code, setCode] = useState(editingEntryType?.code || getNextCode());
  const [name, setName] = useState(editingEntryType?.name || "");
  const [description, setDescription] = useState(editingEntryType?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      code: code.trim() || getNextCode(),
      name: name.trim(),
      description: description.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900">{editingEntryType ? "Edit Entry Type" : "New Entry Type"}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
              Entry Type Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!!editingEntryType}
              placeholder="e.g. 1009"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
              Entry Type Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Credit Note"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Entry type purpose & details..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl">
              Close
            </Button>
            <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
              Save Entry Type
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CostCentreFormModal({ onClose, onSave }: { onClose: () => void; onSave: (data: CostCentreItem) => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900">New Cost Centre</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!code || !name) return;
            onSave({ code, name, department, description });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">Cost Centre Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. CC-104"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">Cost Centre Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Marketing & Advertising"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">Department</label>
            <input
              type="text"
              placeholder="e.g. Commercial"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" variant="primary" className="bg-blue-600 text-white font-bold">
              Save Cost Centre
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfitCentreFormModal({ onClose, onSave }: { onClose: () => void; onSave: (data: ProfitCentreItem) => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [businessUnit, setBusinessUnit] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900">New Profit Centre</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!code || !name) return;
            onSave({ code, name, businessUnit, description });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">Profit Centre Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. PC-400"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">Profit Centre Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Managed Cloud Services"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">Business Unit</label>
            <input
              type="text"
              placeholder="e.g. Cloud & SaaS"
              value={businessUnit}
              onChange={(e) => setBusinessUnit(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" variant="primary" className="bg-blue-600 text-white font-bold">
              Save Profit Centre
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
