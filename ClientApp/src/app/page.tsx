"use client";

import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Filter,
  LockKeyhole,
  Paperclip,
  Plus,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TimerReset,
  UserPlus,
} from "lucide-react";
import { AppShell, type AppPage, getPageUrl, getPageFromPath } from "../components/app-shell";
import { AccountsPage } from "../modules/accounts/accounts-page";
import {
  ActivityTimeline,
  AssetCard,
  AttentionPanel as ModernAttentionPanel,
  ChatPreview,
  ClientHealthCard,
  CredentialVaultCard,
  EmployeeScoreCard,
  KpiCard,
  ProjectProfitTable,
  RenewalCard,
  UploadDropzone,
} from "../components/command-center";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Td, Th } from "../components/ui/table";
import { CompanyProvider, useCompany } from "../context/company-context";
import {
  aiClassifications,
  controlTower,
  projects,
  renewals,
  type Company
} from "../data/mock";
import type {
  ProductItem,
  PurchaseRecord,
  InvoiceLine,
  FinanceExpense,
  FinanceVatEntry,
  FinanceInvoice,
  FinancePayment,
  WorkflowLead,
  WorkflowCustomer,
  WorkflowQuotation,
  WorkflowProject
} from "../modules/shared/domain";
import { money, percent } from "../lib/utils";
import { LoginPage } from "../modules/auth/login-page";
import { ClientsPage } from "../modules/clients/clients-page";
import { FinanceEntitiesPage } from "../modules/finance/finance-entities-page";
import { ExpensesPage } from "../modules/finance/expenses-page";
import { FinanceFlowPage } from "../modules/finance/finance-flow-page";
import { VatBillScannerPage } from "../modules/finance/vat-bill-scanner-page";
import { HrPage } from "../modules/hr/hr-page";
import { EmployeePerformancePage } from "../modules/hr/employee-performance-page";
import { InventoryPage } from "../modules/inventory/inventory-page";
import { InvoiceBuilderPage } from "../modules/invoices/invoice-builder-page";
import { LeadsPage } from "../modules/leads/leads-page";
import { PayrollPanel } from "../modules/payroll/payroll-page";
import { ProductListPage } from "../modules/products/products-page";
import { ProductGroupsPage } from "../modules/products/product-groups-page";
import { UomMasterPage } from "../modules/products/uom-master-page";
import { PurchasesPage } from "../modules/purchases/purchases-page";
import { PurchaseEnquiriesPage } from "../modules/purchases/purchase-enquiries-page";
import { PurchaseOrdersPage } from "../modules/purchases/purchase-orders-page";
import { QuotationsPage } from "../modules/quotations/quotations-page";
import { SuppliersPage } from "../modules/suppliers/suppliers-page";
import { UsersPage } from "../modules/users/users-page";
import {
  DataTable,
  Field,
  FlowStep,
  Info,
  QuickRule,
  SectionTitle,
  WorkflowTable
} from "../modules/shared/screen-kit";

const metricLabels: Record<string, string> = {
  totalLeads: "Total leads",
  hotLeads: "Hot leads",
  missedFollowUps: "Missed follow-ups",
  expiredQuotations: "Expired quotations",
  runningProjects: "Running projects",
  delayedProjects: "Delayed projects",
  pendingTasks: "Pending tasks",
  overdueTasks: "Overdue tasks",
  monthlyExpenses: "Monthly expenses",
  pendingExpenseApprovals: "Pending expense approvals",
  expensesWithoutReceipt: "Expenses without receipt",
  pendingInvoices: "Pending invoices",
  overdueInvoices: "Overdue invoices",
  paymentsReceived: "Payments received",
  receivables: "Receivables",
  payables: "Payables",
  upcomingRenewals: "Upcoming renewals",
  amcContractsAtRisk: "AMC contracts at risk",
  lowMarginProjects: "Low-margin projects",
  underperformingEmployees: "Underperforming employees",
  vatPayable: "VAT payable summary",
  payrollPending: "Payroll pending",
  assetsExpiring: "Assets/warranties expiring",
  netProfit: "Net profit"
};

const moneyMetrics = new Set(["monthlyExpenses", "paymentsReceived", "receivables", "payables", "vatPayable", "netProfit"]);

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function HomeInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { activeCompany, setActiveCompanyId } = useCompany();

  const initialPage = getPageFromPath(location.pathname) ?? "clients";
  const [activePage, setActiveState] = useState<AppPage>(initialPage);

  useEffect(() => {
    if (!isLoggedIn) {
      if (location.pathname !== "/login" && location.pathname !== "/login/") {
        navigate("/login" + location.search, { replace: true });
      }
      return;
    }

    if (location.pathname === "/login" || location.pathname === "/login/") {
      const targetUrl = getPageUrl(activePage);
      navigate(targetUrl, { replace: true });
      return;
    }

    const page = getPageFromPath(location.pathname);
    if (page) {
      setActiveState(page);
      const targetUrl = getPageUrl(page);
      if (location.pathname !== targetUrl && location.pathname !== targetUrl + "/") {
        navigate(targetUrl, { replace: true });
      }
    } else {
      const defaultPage: AppPage = "clients";
      setActiveState(defaultPage);
      navigate(getPageUrl(defaultPage), { replace: true });
    }
  }, [isLoggedIn, location.pathname, navigate, activePage]);

  const setActivePage = (page: AppPage) => {
    setActiveState(page);
    const targetUrl = getPageUrl(page);
    if (location.pathname !== targetUrl) {
      navigate(targetUrl);
    }
  };

  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | undefined>(undefined);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | undefined>(undefined);
  const [selectedQuotationForPurchase, setSelectedQuotationForPurchase] = useState<any | null>(null);

  const handleConvertToInvoice = (quotation: any) => {
    if (quotation && quotation.id) {
      setSelectedQuotationId(quotation.id);
      setActivePage("invoice-builder");
    }
  };

  const handleCreatePurchaseFromQuotation = (quotation: any) => {
    if (quotation) {
      setSelectedQuotationForPurchase(quotation);
      setActivePage("purchase-enquiry");
    }
  };

  const handleConvertToOrder = (enquiryId: string) => {
    if (enquiryId) {
      setSelectedEnquiryId(enquiryId);
      setActivePage("purchase-orders");
    }
  };

  useEffect(() => {
    let active = true;
    apiFetch<any[]>(`api/Clients?companyId=${activeCompany.id}`)
      .then((data) => {
        if (active && Array.isArray(data)) {
          const mapped = data.map((client) => ({
            ...client,
            companyId: client.companyId ?? activeCompany.id,
            contacts: client.contacts?.map((contact: any) => contact.contactName) ?? [],
            locations: client.locations?.map((location: any) => location.locationName) ?? [],
            projects: client.projects?.map((project: any) => project.projectName) ?? [],
            notes: client.notes ?? "No notes available.",
            openTasks: client.openTasks ?? 0,
            invoicesDue: client.invoicesDue ?? 0,
            profitability: client.profitability ?? 0,
          }));
          setClientsList(mapped);
        }
      })
      .catch((err) => {
        console.error("Error fetching clients on mount:", err);
      });
    return () => { active = false; };
  }, [activeCompany.id]);

  const filteredClients = useMemo(() => clientsList.filter((client) => client.companyId === activeCompany.id), [clientsList, activeCompany.id]);
  const selectedClient = filteredClients[0] ?? clientsList[0];

  useEffect(() => {
    let active = true;
    apiFetch<ProductItem[]>(`api/Products?companyId=${activeCompany.id}`)
      .then((data) => {
        if (active) {
          setProductItems(data);
        }
      })
      .catch((err) => {
        console.error("Error fetching products on mount:", err);
      });
    return () => { active = false; };
  }, [activeCompany.id]);

  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={(user) => {
          setIsLoggedIn(true);
          if (user && user.companyId) {
            setActiveCompanyId(user.companyId);
          }
          navigate(getPageUrl(activePage));
        }}
      />
    );
  }

  return (
    <AppShell
      activeCompany={activeCompany}
      activePage={activePage}
      setActivePage={setActivePage}
      onLogout={() => {
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        navigate("/login");
      }}
    >
      <AppView
        activePage={activePage}
        setActivePage={setActivePage}
        activeCompany={activeCompany}
        selectedClient={selectedClient}
        productItems={productItems}
        setProductItems={setProductItems}
        purchaseRecords={purchaseRecords}
        setPurchaseRecords={setPurchaseRecords}
        invoiceLines={invoiceLines}
        setInvoiceLines={setInvoiceLines}
        selectedQuotationId={selectedQuotationId}
        onConvertToInvoice={handleConvertToInvoice}
        selectedEnquiryId={selectedEnquiryId}
        setSelectedEnquiryId={setSelectedEnquiryId}
        onConvertToOrder={handleConvertToOrder}
        onCreatePurchase={handleCreatePurchaseFromQuotation}
        selectedQuotationForPurchase={selectedQuotationForPurchase}
        setSelectedQuotationForPurchase={setSelectedQuotationForPurchase}
      />
    </AppShell>
  );
}

export default function Home() {
  return (
    <CompanyProvider>
      <HomeInner />
    </CompanyProvider>
  );
}

function AppView({
  activePage,
  setActivePage,
  activeCompany,
  selectedClient,
  productItems,
  setProductItems,
  purchaseRecords,
  setPurchaseRecords,
  invoiceLines,
  setInvoiceLines,
  selectedQuotationId,
  onConvertToInvoice,
  selectedEnquiryId,
  setSelectedEnquiryId,
  onConvertToOrder,
  onCreatePurchase,
  selectedQuotationForPurchase,
  setSelectedQuotationForPurchase
}: {
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;
  activeCompany: Company;
  selectedClient: any;
  productItems: ProductItem[];
  setProductItems: (items: ProductItem[] | ((items: ProductItem[]) => ProductItem[])) => void;
  purchaseRecords: PurchaseRecord[];
  setPurchaseRecords: (records: PurchaseRecord[] | ((records: PurchaseRecord[]) => PurchaseRecord[])) => void;
  invoiceLines: InvoiceLine[];
  setInvoiceLines: (lines: InvoiceLine[] | ((lines: InvoiceLine[]) => InvoiceLine[])) => void;
  selectedQuotationId?: string;
  onConvertToInvoice?: (quotation: any) => void;
  selectedEnquiryId?: string;
  setSelectedEnquiryId: (id: string | undefined) => void;
  onConvertToOrder?: (enquiryId: string) => void;
  onCreatePurchase?: (quotation: any) => void;
  selectedQuotationForPurchase?: any;
  setSelectedQuotationForPurchase?: (q: any) => void;
}) {
  if (activePage === "clients") return <ClientsPage activeCompany={activeCompany} />;
  if (activePage === "suppliers") return <SuppliersPage activeCompany={activeCompany} />;
  if (activePage === "users") return <UsersPage />;
  if (activePage === "product-groups") return <ProductGroupsPage activeCompany={activeCompany} products={productItems} />;
  if (activePage === "uom-master") return <UomMasterPage activeCompany={activeCompany} />;
  if (activePage === "leads") return <LeadsPage activeCompany={activeCompany} />;
  if (activePage === "quotations") return <QuotationsPage activeCompany={activeCompany} onConvertToInvoice={onConvertToInvoice} onCreatePurchase={onCreatePurchase} />;
  if (activePage === "products") return <ProductListPage activeCompany={activeCompany} products={productItems} setProducts={setProductItems} />;
  if (activePage === "purchases") return <PurchasesPage activeCompany={activeCompany} products={productItems} setProducts={setProductItems} purchaseRecords={purchaseRecords} setPurchaseRecords={setPurchaseRecords} />;
  if (activePage === "purchase-orders") return <PurchaseOrdersPage activeCompany={activeCompany} initialEnquiryId={selectedEnquiryId} onClearInitialEnquiry={() => setSelectedEnquiryId(undefined)} />;
  if (activePage === "purchase-enquiry") return <PurchaseEnquiriesPage activeCompany={activeCompany} onConvertToOrder={onConvertToOrder} initialQuotation={selectedQuotationForPurchase} onClearInitialQuotation={() => setSelectedQuotationForPurchase?.(null)} />;
  if (activePage === "accounts") return <AccountsPage activeCompany={activeCompany} />;
  if (activePage === "inventory") return <InventoryPage activeCompany={activeCompany} products={productItems} setProducts={setProductItems} />;
  if (activePage === "invoice-builder") return <InvoiceBuilderPage activeCompany={activeCompany} products={productItems} setProducts={setProductItems} invoiceLines={invoiceLines} setInvoiceLines={setInvoiceLines} initialQuotationId={selectedQuotationId} />;
  if (activePage === "sales-flow") return <SalesWorkflow activeCompany={activeCompany} />;
  if (activePage === "finance-flow") return <FinanceFlowPage activeCompany={activeCompany} />;
  if (activePage === "finance-entities") return <FinanceEntitiesPage activeCompany={activeCompany} initialTab="ledgers" />;
  if (activePage === "finance-ledgers") return <FinanceEntitiesPage activeCompany={activeCompany} initialTab="ledgers" />;
  if (activePage === "finance-entry-types") return <FinanceEntitiesPage activeCompany={activeCompany} initialTab="entry-types" />;
  if (activePage === "finance-cost-centres") return <FinanceEntitiesPage activeCompany={activeCompany} initialTab="cost-profit-centres" />;
  if (activePage === "finance-entries") return <FinanceEntitiesPage activeCompany={activeCompany} initialTab="journal-entries" />;

  if (activePage === "control-tower") {
    return <ControlTowerPage activeCompany={activeCompany} setActivePage={setActivePage} />;
  }

  if (activePage === "client-room") return <ClientRoom client={selectedClient} />;
  if (activePage === "ai-capture") return <AiCapture />;
  if (activePage === "vat-scanner") return <VatBillScannerPage activeCompany={activeCompany} />;
  if (activePage === "expenses") return <ExpensesPage activeCompany={activeCompany} />;
  if (activePage === "renewals") return <RenewalsPanel />;
  if (activePage === "assets") return <AssetsPanel />;
  if (activePage === "employees") return <EmployeePerformancePage activeCompany={activeCompany} />;
  if (activePage === "profitability") return <ProjectProfitability />;
  if (activePage === "credentials") return <CredentialVault />;
  if (activePage === "hr") return <HrPage activeCompany={activeCompany} />;
  return <PayrollPanel />;
}

function ControlTowerPage({ activeCompany, setActivePage }: { activeCompany: Company; setActivePage: (page: AppPage) => void }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    let active = true;
    apiFetch<any>(`api/Dashboard/stats?companyId=${activeCompany.id}`)
      .then((data) => {
        if (active) {
          setStats(data);
        }
      })
      .catch((err) => {
        console.error("Error fetching dashboard stats:", err);
      });
    return () => { active = false; };
  }, [activeCompany.id]);

  const mergedControlTower = useMemo(() => {
    if (!stats) {
      return {
        totalLeads: 0,
        hotLeads: 0,
        missedFollowUps: 0,
        expiredQuotations: 0,
        runningProjects: 0,
        delayedProjects: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        monthlyExpenses: 0,
        pendingExpenseApprovals: 0,
        expensesWithoutReceipt: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        paymentsReceived: 0,
        receivables: 0,
        payables: 0,
        upcomingRenewals: 0,
        amcContractsAtRisk: 0,
        lowMarginProjects: 0,
        underperformingEmployees: 0,
        vatPayable: 0,
        payrollPending: 0,
        assetsExpiring: 0,
        netProfit: 0
      };
    }
    return {
      totalLeads: stats.totalLeads ?? 0,
      hotLeads: stats.hotLeads ?? 0,
      missedFollowUps: stats.missedFollowUps ?? 0,
      expiredQuotations: stats.expiredQuotations ?? 0,
      runningProjects: stats.runningProjects ?? 0,
      delayedProjects: stats.delayedProjects ?? 0,
      pendingTasks: stats.pendingTasks ?? 0,
      overdueTasks: stats.overdueTasks ?? 0,
      monthlyExpenses: stats.monthlyExpenses ?? 0,
      pendingExpenseApprovals: stats.pendingExpenseApprovals ?? 0,
      expensesWithoutReceipt: stats.expensesWithoutReceipt ?? 0,
      pendingInvoices: stats.pendingInvoices ?? 0,
      overdueInvoices: stats.overdueInvoices ?? 0,
      paymentsReceived: stats.paymentsReceived ?? 0,
      receivables: stats.receivables ?? 0,
      payables: stats.payables ?? 0,
      upcomingRenewals: stats.upcomingRenewals ?? 0,
      amcContractsAtRisk: stats.amcContractsAtRisk ?? 0,
      lowMarginProjects: stats.lowMarginProjects ?? 0,
      underperformingEmployees: stats.underperformingEmployees ?? 0,
      vatPayable: stats.vatPayable ?? 0,
      payrollPending: stats.payrollPending ?? 0,
      assetsExpiring: stats.assetsExpiring ?? 0,
      netProfit: stats.netProfit ?? 0
    };
  }, [stats]);

  const displayAlerts = stats?.alerts || [];
  const displayTimeline = stats?.timeline || [];

  const netProfitVal = stats ? stats.netProfit : 0;
  const receivablesVal = stats ? stats.receivables : 0;
  const overdueTasksVal = stats ? stats.overdueTasks : 0;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[#0B1220] p-6 text-white shadow-xl shadow-slate-300/60 sm:p-8">
        <div>
          <p className="text-sm font-semibold text-blue-200">GGMS Business Control AI</p>
          <h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight sm:text-4xl">
            Management visibility, AI-assisted data entry, staff-speed workflows.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Version 1 is focused on GGMS Global IT Solutions SPC - Oman. Fast actions, clean signals, and executive control without slowing the team down.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => setActivePage("ai-capture")}>
            <Plus className="h-4 w-4" /> Quick capture
          </Button>
          <Button className="border-white/10 bg-white/10 text-white hover:bg-white/15">
            <Filter className="h-4 w-4" /> Smart filters
          </Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-white via-blue-50/60 to-white">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Badge variant="info">CEO Control Tower</Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{stats?.companyName || "GGMS Oman"} command center</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">Critical alerts, profit, receivables, delivery health, VAT, renewals, and team accountability in one executive view.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="primary"><Bot className="h-4 w-4" /> Ask AI</Button>
                <Button><FileText className="h-4 w-4" /> Export</Button>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <KpiCard label="Net profit" value={money(netProfitVal, activeCompany.currency)} icon={<TrendingUp className="h-5 w-5" />} trend="+12%" tone="success" />
              <KpiCard label="Receivables" value={money(receivablesVal, activeCompany.currency)} icon={<CircleDollarSign className="h-5 w-5" />} trend="Act" tone="warning" />
              <KpiCard label="Overdue tasks" value={String(overdueTasksVal)} icon={<AlertTriangle className="h-5 w-5" />} trend="+5" tone="danger" />
            </div>
          </CardContent>
        </Card>
        <ChatPreview />
      </div>
      <ModernAttentionPanel items={displayAlerts} />
      <MetricGrid activeCompany={activeCompany} stats={mergedControlTower} />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ProjectProfitTable projects={projects} currency={activeCompany.currency} />
        <ActivityTimeline events={displayTimeline} />
      </div>
      <GgmsScopePanel activeCompany={activeCompany} />
    </div>
  );
}

function FinanceWorkflow({ activeCompany }: { activeCompany: Company }) {
  const [expenseCategory, setExpenseCategory] = useState("Cable and connectors");
  const [expenseProject, setExpenseProject] = useState("CCTV AMC Support");
  const [expenseNet, setExpenseNet] = useState("180");
  const [invoiceCustomer, setInvoiceCustomer] = useState("Barka Poultry");
  const [invoiceProject, setInvoiceProject] = useState("CCTV AMC Support");
  const [invoiceSubtotal, setInvoiceSubtotal] = useState("1200");
  const [financeExpenses, setFinanceExpenses] = useState<FinanceExpense[]>([]);
  const [vatEntries, setVatEntries] = useState<FinanceVatEntry[]>([]);
  const [financeInvoices, setFinanceInvoices] = useState<FinanceInvoice[]>([]);
  const [payments, setPayments] = useState<FinancePayment[]>([]);

  const vatRate = 0.05;
  const totalCosts = financeExpenses.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalVatInput = vatEntries.reduce((sum, item) => sum + item.vatAmount, 0);
  const totalSales = financeInvoices.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalVatOutput = financeInvoices.reduce((sum, item) => sum + item.vatAmount, 0);
  const totalPaid = payments.reduce((sum, item) => sum + item.amount, 0);
  const receivable = totalSales - totalPaid;
  const vatPayable = Math.max(totalVatOutput - totalVatInput, 0);
  const netProfit = financeInvoices.reduce((sum, item) => sum + item.subtotal, 0) - financeExpenses.reduce((sum, item) => sum + item.netAmount, 0);
  const nextNumber = financeExpenses.length + vatEntries.length + financeInvoices.length + payments.length + 2001;

  function createExpense() {
    const netAmount = Number(expenseNet) || 0;
    const vatAmount = roundMoney(netAmount * vatRate);
    const totalAmount = roundMoney(netAmount + vatAmount);
    setFinanceExpenses((current) => [
      ...current,
      {
        id: `EXP-${nextNumber}`,
        companyId: activeCompany.id,
        category: expenseCategory.trim() || "General expense",
        project: expenseProject.trim() || "Overhead",
        netAmount,
        vatAmount,
        totalAmount,
        status: "Draft"
      }
    ]);
  }

  function postToVat(expense: FinanceExpense) {
    setFinanceExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, status: "Posted" } : item));
    setVatEntries((current) => [
      ...current,
      {
        id: `VAT-P-${nextNumber}`,
        expenseId: expense.id,
        type: "Purchase",
        supplier: "Mock Supplier LLC",
        netAmount: expense.netAmount,
        vatAmount: expense.vatAmount,
        totalAmount: expense.totalAmount
      }
    ]);
  }

  function createInvoice() {
    const subtotal = Number(invoiceSubtotal) || 0;
    const vatAmount = roundMoney(subtotal * vatRate);
    setFinanceInvoices((current) => [
      ...current,
      {
        id: `INV-${nextNumber}`,
        companyId: activeCompany.id,
        customer: invoiceCustomer.trim() || "Walk-in customer",
        project: invoiceProject.trim() || "General service",
        subtotal,
        vatAmount,
        totalAmount: roundMoney(subtotal + vatAmount),
        status: "Draft"
      }
    ]);
  }

  function sendInvoice(invoice: FinanceInvoice) {
    setFinanceInvoices((current) => current.map((item) => item.id === invoice.id ? { ...item, status: "Sent" } : item));
  }

  function recordPayment(invoice: FinanceInvoice) {
    setPayments((current) => [
      ...current,
      {
        id: `PAY-${nextNumber}`,
        invoiceId: invoice.id,
        customer: invoice.customer,
        amount: invoice.totalAmount,
        method: "Bank transfer",
        reference: `REF-${nextNumber}`
      }
    ]);
    setFinanceInvoices((current) => current.map((item) => item.id === invoice.id ? { ...item, status: "Paid" } : item));
  }

  return (
    <div className="space-y-4">
      <SectionTitle title="Expense to Profit Workflow" subtitle="Expense -> VAT Register -> Invoice -> Payment -> Profit" />
      <div className="grid gap-3 md:grid-cols-5">
        <FlowStep icon={<ReceiptText className="h-4 w-4" />} label="Expenses" count={financeExpenses.length} />
        <FlowStep icon={<FileText className="h-4 w-4" />} label="VAT entries" count={vatEntries.length} />
        <FlowStep icon={<FileText className="h-4 w-4" />} label="Invoices" count={financeInvoices.length} />
        <FlowStep icon={<CircleDollarSign className="h-4 w-4" />} label="Payments" count={payments.length} />
        <FlowStep icon={<TrendingUp className="h-4 w-4" />} label="Profit" count={Math.round(netProfit)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create expense</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Category" value={expenseCategory} onChange={setExpenseCategory} />
            <Field label="Project" value={expenseProject} onChange={setExpenseProject} />
            <Field label="Net amount" value={expenseNet} onChange={setExpenseNet} />
            <Button className="self-end" variant="primary" onClick={createExpense}><Plus className="h-4 w-4" /> Add expense</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Create invoice</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer" value={invoiceCustomer} onChange={setInvoiceCustomer} />
            <Field label="Project" value={invoiceProject} onChange={setInvoiceProject} />
            <Field label="Subtotal" value={invoiceSubtotal} onChange={setInvoiceSubtotal} />
            <Button className="self-end" variant="primary" onClick={createInvoice}><Plus className="h-4 w-4" /> Create invoice</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Info label="Cost incl. VAT" value={money(totalCosts, activeCompany.currency)} />
        <Info label="Input VAT" value={money(totalVatInput, activeCompany.currency)} />
        <Info label="Output VAT" value={money(totalVatOutput, activeCompany.currency)} />
        <Info label="Receivable" value={money(receivable, activeCompany.currency)} />
        <Info label="Net profit" value={money(netProfit, activeCompany.currency)} />
      </div>

      <WorkflowTable title="1. Expenses">
        <thead><tr><Th>ID</Th><Th>Category</Th><Th>Project</Th><Th>Net</Th><Th>VAT</Th><Th>Total</Th><Th>Status</Th><Th>Action</Th></tr></thead>
        <tbody>
          {financeExpenses.map((expense) => (
            <tr key={expense.id}>
              <Td>{expense.id}</Td><Td>{expense.category}</Td><Td>{expense.project}</Td><Td>{money(expense.netAmount, activeCompany.currency)}</Td><Td>{money(expense.vatAmount, activeCompany.currency)}</Td><Td>{money(expense.totalAmount, activeCompany.currency)}</Td>
              <Td><Badge variant={expense.status === "Posted" ? "success" : "warning"}>{expense.status}</Badge></Td>
              <Td><Button size="sm" disabled={expense.status === "Posted"} onClick={() => postToVat(expense)}>Post VAT</Button></Td>
            </tr>
          ))}
        </tbody>
      </WorkflowTable>

      <WorkflowTable title="2. VAT Purchase Register">
        <thead><tr><Th>ID</Th><Th>Expense</Th><Th>Supplier</Th><Th>Net</Th><Th>Input VAT</Th><Th>Total</Th></tr></thead>
        <tbody>
          {vatEntries.map((entry) => (
            <tr key={entry.id}>
              <Td>{entry.id}</Td><Td>{entry.expenseId}</Td><Td>{entry.supplier}</Td><Td>{money(entry.netAmount, activeCompany.currency)}</Td><Td>{money(entry.vatAmount, activeCompany.currency)}</Td><Td>{money(entry.totalAmount, activeCompany.currency)}</Td>
            </tr>
          ))}
        </tbody>
      </WorkflowTable>

      <WorkflowTable title="3. Invoices">
        <thead><tr><Th>ID</Th><Th>Customer</Th><Th>Project</Th><Th>Subtotal</Th><Th>VAT</Th><Th>Total</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {financeInvoices.map((invoice) => (
            <tr key={invoice.id}>
              <Td>{invoice.id}</Td><Td>{invoice.customer}</Td><Td>{invoice.project}</Td><Td>{money(invoice.subtotal, activeCompany.currency)}</Td><Td>{money(invoice.vatAmount, activeCompany.currency)}</Td><Td>{money(invoice.totalAmount, activeCompany.currency)}</Td>
              <Td><Badge variant={invoice.status === "Paid" ? "success" : invoice.status === "Sent" ? "info" : "warning"}>{invoice.status}</Badge></Td>
              <Td className="space-x-2">
                <Button size="sm" disabled={invoice.status !== "Draft"} onClick={() => sendInvoice(invoice)}>Send</Button>
                <Button size="sm" disabled={invoice.status !== "Sent"} onClick={() => recordPayment(invoice)}>Record payment</Button>
              </Td>
            </tr>
          ))}
        </tbody>
      </WorkflowTable>

      <WorkflowTable title="4. Payments">
        <thead><tr><Th>ID</Th><Th>Invoice</Th><Th>Customer</Th><Th>Amount</Th><Th>Method</Th><Th>Reference</Th></tr></thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <Td>{payment.id}</Td><Td>{payment.invoiceId}</Td><Td>{payment.customer}</Td><Td>{money(payment.amount, activeCompany.currency)}</Td><Td>{payment.method}</Td><Td>{payment.reference}</Td>
            </tr>
          ))}
        </tbody>
      </WorkflowTable>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>5. Profit and VAT summary</CardTitle>
          <Badge variant={netProfit >= 0 ? "success" : "danger"}>{netProfit >= 0 ? "Profitable" : "Loss"}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Info label="Payments received" value={money(totalPaid, activeCompany.currency)} />
          <Info label="Receivables" value={money(receivable, activeCompany.currency)} />
          <Info label="VAT payable" value={money(vatPayable, activeCompany.currency)} />
          <Info label="Net profit before overhead" value={money(netProfit, activeCompany.currency)} />
        </CardContent>
      </Card>
    </div>
  );
}

function SalesWorkflow({ activeCompany }: { activeCompany: Company }) {
  const [leadName, setLeadName] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadNeed, setLeadNeed] = useState("");
  const [leadValue, setLeadValue] = useState("");

  const [leads, setLeads] = useState<WorkflowLead[]>([]);
  const [workflowCustomers, setWorkflowCustomers] = useState<WorkflowCustomer[]>([]);
  const [workflowQuotations, setWorkflowQuotations] = useState<WorkflowQuotation[]>([]);
  const [workflowProjects, setWorkflowProjects] = useState<WorkflowProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPipeline = () => {
    setLoading(true);
    Promise.all([
      apiFetch<any[]>(`api/Leads?companyId=${activeCompany.id}`),
      apiFetch<any[]>(`api/Clients?companyId=${activeCompany.id}`),
      apiFetch<any[]>("api/Quotations")
    ])
      .then(([leadsData, clientsData, quotesData]) => {
        // 1. Map leads
        const mappedLeads: WorkflowLead[] = leadsData.map((l) => ({
          id: l.id,
          companyId: l.companyId,
          name: l.clientName,
          contact: l.contact,
          need: l.requirement,
          value: l.value,
          status: l.status === "Converted" ? "Converted" : "New",
          customerId: clientsData.find((c) => c.name === l.clientName)?.id
        }));

        // 2. Map clients
        const mappedClients: WorkflowCustomer[] = clientsData.map((c) => ({
          id: c.id,
          companyId: c.companyId,
          name: c.name,
          sourceLeadId: leadsData.find((l) => l.clientName === c.name)?.id || ""
        }));

        // 3. Map quotations
        const mappedQuotes: WorkflowQuotation[] = quotesData.map((q) => ({
          id: q.id,
          companyId: activeCompany.id,
          customerId: clientsData.find((c) => c.name === q.customer)?.id || "",
          customerName: q.customer,
          title: q.title,
          amount: q.amount,
          status: q.status === "Approved" ? "Approved" : "Draft"
        }));

        // 4. Map projects from client.projects nested relation
        const mappedProjects: WorkflowProject[] = [];
        clientsData.forEach((c) => {
          c.projects?.forEach((p: any) => {
            const projectBudget = quotesData.find((q) => q.customer === c.name && q.title === p.projectName)?.amount || 4200;
            mappedProjects.push({
              id: String(p.id),
              companyId: c.companyId,
              customerName: c.name,
              name: p.projectName,
              budget: projectBudget,
              status: "Running"
            });
          });
        });

        setLeads(mappedLeads);
        setWorkflowCustomers(mappedClients);
        setWorkflowQuotations(mappedQuotes);
        setWorkflowProjects(mappedProjects);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching workflow pipeline:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPipeline();
  }, [activeCompany.id]);

  async function addLead() {
    try {
      const amount = Number(leadValue) || 0;
      const payload = {
        clientName: leadName.trim() || "Untitled lead",
        contact: leadContact.trim() || "Unknown contact",
        requirement: leadNeed.trim() || "General requirement",
        value: amount,
        status: "New",
        owner: "Sales",
        nextFollowUp: "Today"
      };
      await apiFetch("api/Leads", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      // Clear fields on successful save
      setLeadName("");
      setLeadContact("");
      setLeadNeed("");
      setLeadValue("");
      fetchPipeline();
    } catch (err) {
      console.error("Failed to add lead:", err);
    }
  }

  async function convertLead(lead: WorkflowLead) {
    try {
      const payload = {
        name: lead.name,
        companyId: activeCompany.id,
        industry: "Technology",
        notes: `Converted from Lead ${lead.id}`,
        profitability: 30,
        vatNumber: "",
        email: "",
        contactPersonName: lead.contact,
        contactPersonNumber: "",
        contacts: [lead.contact],
        locations: ["Muscat"],
        projects: []
      };
      // 1. Create client
      await apiFetch("api/Clients", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      // 2. Mark lead as converted
      await apiFetch(`api/Leads/${lead.id}/status`, {
        method: "PUT",
        body: JSON.stringify("Converted")
      });
      fetchPipeline();
    } catch (err) {
      console.error("Failed to convert lead:", err);
    }
  }

  async function createQuotation(customer: WorkflowCustomer) {
    try {
      const sourceLead = leads.find((lead) => lead.id === customer.sourceLeadId);
      const payload = {
        customer: customer.name,
        title: sourceLead?.need ?? "Service quotation",
        amount: sourceLead?.value ?? 0,
        status: "Draft",
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        lastFollowUp: "Not sent"
      };
      await apiFetch("api/Quotations", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      fetchPipeline();
    } catch (err) {
      console.error("Failed to create quotation:", err);
    }
  }

  async function approveQuotation(quotation: WorkflowQuotation) {
    try {
      await apiFetch(`api/Quotations/${quotation.id}/status`, {
        method: "PUT",
        body: JSON.stringify("Approved")
      });
      fetchPipeline();
    } catch (err) {
      console.error("Failed to approve quotation:", err);
    }
  }

  async function createProject(quotation: WorkflowQuotation) {
    try {
      await apiFetch(`api/Clients/${quotation.customerId}/projects`, {
        method: "POST",
        body: JSON.stringify(quotation.title)
      });
      fetchPipeline();
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-slate-500 font-semibold">Loading sales pipeline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionTitle title="Lead to Project Workflow" subtitle="Add Lead -> Convert to Customer -> Create Quotation -> Approve -> Create Project" />
      <div className="grid gap-3 md:grid-cols-5">
        <FlowStep icon={<UserPlus className="h-4 w-4" />} label="Lead" count={leads.length} />
        <FlowStep icon={<Building2 className="h-4 w-4" />} label="Customer" count={workflowCustomers.length} />
        <FlowStep icon={<FileText className="h-4 w-4" />} label="Quotation" count={workflowQuotations.length} />
        <FlowStep icon={<CheckCircle2 className="h-4 w-4" />} label="Approved" count={workflowQuotations.filter((quotation) => quotation.status === "Approved").length} />
        <FlowStep icon={<BriefcaseBusiness className="h-4 w-4" />} label="Project" count={workflowProjects.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add lead</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[1fr_0.8fr_1fr_0.5fr_auto]">
          <Field label="Lead name" value={leadName} onChange={setLeadName} />
          <Field label="Contact" value={leadContact} onChange={setLeadContact} />
          <Field label="Requirement" value={leadNeed} onChange={setLeadNeed} />
          <Field label="Value" value={leadValue} onChange={setLeadValue} />
          <Button className="self-end" variant="primary" onClick={addLead}><Plus className="h-4 w-4" /> Add</Button>
        </CardContent>
      </Card>

      <WorkflowTable title="1. Leads">
        <thead><tr><Th>ID</Th><Th>Lead</Th><Th>Need</Th><Th>Value</Th><Th>Status</Th><Th>Action</Th></tr></thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <Td>{lead.id}</Td><Td>{lead.name}<span className="block text-xs text-slate-500">{lead.contact}</span></Td><Td>{lead.need}</Td><Td>{money(lead.value, activeCompany.currency)}</Td>
              <Td><Badge variant={lead.status === "Converted" ? "success" : "warning"}>{lead.status}</Badge></Td>
              <Td><Button size="sm" disabled={lead.status === "Converted"} onClick={() => convertLead(lead)}>Convert</Button></Td>
            </tr>
          ))}
        </tbody>
      </WorkflowTable>

      <WorkflowTable title="2. Customers">
        <thead><tr><Th>ID</Th><Th>Customer</Th><Th>Source lead</Th><Th>Action</Th></tr></thead>
        <tbody>
          {workflowCustomers.map((customer) => {
            const hasQuotation = workflowQuotations.some((quotation) => quotation.customerId === customer.id);
            return (
              <tr key={customer.id}>
                <Td>{customer.id}</Td><Td>{customer.name}</Td><Td>{customer.sourceLeadId}</Td>
                <Td><Button size="sm" disabled={hasQuotation} onClick={() => createQuotation(customer)}>Create quotation</Button></Td>
              </tr>
            );
          })}
        </tbody>
      </WorkflowTable>

      <WorkflowTable title="3. Quotations">
        <thead><tr><Th>ID</Th><Th>Customer</Th><Th>Title</Th><Th>Amount</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {workflowQuotations.map((quotation) => {
            const hasProject = workflowProjects.some((project) => project.name === quotation.title && project.customerName === quotation.customerName);
            return (
              <tr key={quotation.id}>
                <Td>{quotation.id}</Td><Td>{quotation.customerName}</Td><Td>{quotation.title}</Td><Td>{money(quotation.amount, activeCompany.currency)}</Td>
                <Td><Badge variant={quotation.status === "Approved" ? "success" : "warning"}>{quotation.status}</Badge></Td>
                <Td className="space-x-2">
                  <Button size="sm" disabled={quotation.status === "Approved"} onClick={() => approveQuotation(quotation)}>Approve</Button>
                  <Button size="sm" disabled={quotation.status !== "Approved" || hasProject} onClick={() => createProject(quotation)}>Create project</Button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </WorkflowTable>

      <WorkflowTable title="4. Projects">
        <thead><tr><Th>ID</Th><Th>Project</Th><Th>Customer</Th><Th>Budget</Th><Th>Status</Th></tr></thead>
        <tbody>
          {workflowProjects.map((project) => (
            <tr key={project.id}>
              <Td>{project.id}</Td><Td>{project.name}</Td><Td>{project.customerName}</Td><Td>{money(project.budget, activeCompany.currency)}</Td><Td><Badge variant="success">{project.status}</Badge></Td>
            </tr>
          ))}
        </tbody>
      </WorkflowTable>
    </div>
  );
}

function MetricGrid({ activeCompany, stats }: { activeCompany: Company; stats: typeof controlTower }) {
  const iconMap: Record<string, ReactNode> = {
    totalLeads: <UserPlus className="h-5 w-5" />,
    hotLeads: <TrendingUp className="h-5 w-5" />,
    missedFollowUps: <AlertTriangle className="h-5 w-5" />,
    expiredQuotations: <FileText className="h-5 w-5" />,
    runningProjects: <BriefcaseBusiness className="h-5 w-5" />,
    delayedProjects: <TimerReset className="h-5 w-5" />,
    pendingTasks: <CheckCircle2 className="h-5 w-5" />,
    overdueTasks: <AlertTriangle className="h-5 w-5" />,
    monthlyExpenses: <CircleDollarSign className="h-5 w-5" />,
    pendingExpenseApprovals: <ReceiptText className="h-5 w-5" />,
    expensesWithoutReceipt: <Paperclip className="h-5 w-5" />,
    pendingInvoices: <FileText className="h-5 w-5" />,
    overdueInvoices: <AlertTriangle className="h-5 w-5" />,
    paymentsReceived: <CircleDollarSign className="h-5 w-5" />,
    receivables: <CircleDollarSign className="h-5 w-5" />,
    payables: <CircleDollarSign className="h-5 w-5" />,
    upcomingRenewals: <TimerReset className="h-5 w-5" />,
    amcContractsAtRisk: <AlertTriangle className="h-5 w-5" />,
    lowMarginProjects: <TrendingUp className="h-5 w-5" />,
    underperformingEmployees: <UserPlus className="h-5 w-5" />,
    vatPayable: <ReceiptText className="h-5 w-5" />,
    payrollPending: <FileText className="h-5 w-5" />,
    assetsExpiring: <Paperclip className="h-5 w-5" />,
    netProfit: <TrendingUp className="h-5 w-5" />
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Object.entries(stats).map(([key, value]) => (
        <KpiCard
          key={key}
          label={metricLabels[key]}
          value={moneyMetrics.has(key) ? money(value, activeCompany.currency) : String(value)}
          icon={iconMap[key] ?? <Sparkles className="h-5 w-5" />}
          trend={["missedFollowUps", "overdueTasks", "overdueInvoices", "amcContractsAtRisk"].includes(key) ? "Act" : undefined}
          tone={["missedFollowUps", "overdueTasks", "overdueInvoices", "amcContractsAtRisk"].includes(key) ? "danger" : moneyMetrics.has(key) ? "success" : "info"}
        />
      ))}
    </div>
  );
}

function ClientRoom({ client }: { client: any }) {
  return (
    <div className="space-y-6">
      <SectionTitle title="Client 360 Room" subtitle="One client workspace for sales, delivery, support, accounts, documents, credentials, and profitability." />
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ClientHealthCard name={client.name} industry={client.industry} profitability={client.profitability} tasks={client.openTasks} invoices={client.invoicesDue} notes={client.notes} />
        <div className="grid gap-4 lg:grid-cols-2">
          <ActivityTimeline events={["AI summary refreshed from open quotations, projects, AMC usage, invoices, and support notes.", "Engineer uploaded site photo for firewall rack cleanup.", "Accounts marked invoice INV-3028 as overdue follow-up required."]} />
          <ChatPreview />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Contacts", "Locations", "Leads", "Quotations", "Projects", "Tasks", "Service visits", "Tickets", "AMC", "Credentials", "Documents", "Timeline"].map((item) => (
          <Badge key={item}>{item}</Badge>
        ))}
      </div>
    </div>
  );
}

function AiCapture() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> AI Capture Anything</CardTitle>
        <Badge variant="info">Mock AI</Badge>
      </CardHeader>
      <CardContent>
        <UploadDropzone title="AI Capture Anything" subtitle="Drop image, receipt, PDF, site photo, asset photo, voice note, WhatsApp text, email text, or document." />
        <div className="mt-4 flex flex-wrap gap-2">
          {aiClassifications.map((item) => <Badge key={item}>{item}</Badge>)}
        </div>
      </CardContent>
    </Card>
  );
}

function CredentialVault() {
  const [credentialsList, setCredentialsList] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    apiFetch<any[]>("api/Credentials")
      .then((data) => {
        if (active) {
          setCredentialsList(data);
        }
      })
      .catch((err) => {
        console.error("Error fetching credentials:", err);
      });
    return () => { active = false; };
  }, []);

  return (
    <Card id="screen-credential-vault">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-danger" /> Credential Vault</CardTitle>
        <Badge variant="danger">Restricted</Badge>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {credentialsList.map((cred) => (
          <CredentialVaultCard key={cred.id} name={cred.name} username={cred.username} password={cred.password} />
        ))}
      </CardContent>
    </Card>
  );
}

function RenewalsPanel() {
  return (
    <div className="space-y-4">
      <SectionTitle title="Recurring Renewals" subtitle="Renewal risk, due dates, and upcoming value for GGMS Oman." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {renewals.map((renewal) => <RenewalCard key={`${renewal.client}-${renewal.type}`} {...renewal} />)}
      </div>
    </div>
  );
}

function AssetsPanel() {
  const [assetList, setAssetList] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    apiFetch<any[]>("api/Assets")
      .then((data) => {
        if (active) {
          setAssetList(data);
        }
      })
      .catch((err) => {
        console.error("Error fetching assets:", err);
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-4">
      <SectionTitle title="Asset Management" subtitle="Client and internal assets with QR placeholder, warranty, license, and AMC status." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {assetList.map((asset) => <AssetCard key={asset.code} {...asset} />)}
      </div>
    </div>
  );
}

function EmployeePerformance() {
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiFetch<any[]>("api/Employees/performance")
      .then((data) => {
        if (active) {
          setEmployeeList(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching employee performance:", err);
        if (active) {
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-slate-500">Loading performance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionTitle title="Employee Performance" subtitle="Output-focused accountability. No mouse tracking, no login-duration tracking." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {employeeList.map((employee) => (
          <EmployeeScoreCard
            key={employee.name}
            name={employee.name}
            role={employee.role}
            productivity={employee.productivity}
            completed={employee.completed}
            overdue={employee.overdue}
          />
        ))}
      </div>
      <DataTable title="Performance detail" action="Assign task">
        <thead>
          <tr>
            <Th>Employee</Th>
            <Th>Follow-up</Th>
            <Th>Timesheet</Th>
            <Th>Revenue</Th>
            <Th>Score</Th>
          </tr>
        </thead>
        <tbody>
          {employeeList.map((employee) => (
            <tr key={employee.name}>
              <Td>{employee.name}</Td>
              <Td>{percent(employee.followUp)}</Td>
              <Td>{percent(employee.timesheet)}</Td>
              <Td>{money(employee.revenue)}</Td>
              <Td>
                <Badge variant={employee.productivity < 70 ? "danger" : "success"}>
                  {percent(employee.productivity)}
                </Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}

function ProjectProfitability() {
  return <ProjectProfitTable projects={projects} currency="OMR" />;
}

function GgmsScopePanel({ activeCompany }: { activeCompany: Company }) {
  return (
    <div className="space-y-4">
      <SectionTitle title="GGMS Oman Scope" subtitle="Version 1 focuses on one company. The database still keeps companyId so multi-company can return later." />
      <Card className="border-primary">
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Info label="Company" value={activeCompany.name} />
          <Info label="Country" value={activeCompany.country} />
          <Info label="Currency" value={activeCompany.currency} />
          <Info label="VAT number" value={activeCompany.taxNumber} />
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickRule icon={<ShieldCheck className="h-4 w-4" />} title="RBAC ready" body="Records remain company-scoped for future company expansion." />
        <QuickRule icon={<TimerReset className="h-4 w-4" />} title="Fast updates" body="Start, complete, note, photo, hours, save in under 60 seconds." />
        <QuickRule icon={<Paperclip className="h-4 w-4" />} title="Attachments" body="Azure Blob Storage placeholder for receipts, VAT bills, site photos, and documents." />
      </div>
    </div>
  );
}
