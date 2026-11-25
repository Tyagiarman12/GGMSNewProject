"use client";

import {
  Bell,
  Bot,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  Command,
  Database,
  ChevronDown,
  DatabaseZap,
  FileSpreadsheet,
  FileScan,
  Gauge,
  HardDrive,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  NotepadText,
  ReceiptText,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  Zap,
  Globe
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { type Company } from "../data/mock";
import { useCompany } from "../context/company-context";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import { SettingsDrawer } from "./settings-drawer";

export const navItems = [
  { id: "control-tower", name: "CEO Control Tower", icon: LayoutDashboard, group: "Command" },
  { id: "master" as any, name: "Master", icon: Database, group: "Revenue" },
  { id: "clients", name: "Clients", icon: Users, group: "Revenue" },
  { id: "suppliers", name: "Suppliers", icon: Users, group: "Revenue" },
  { id: "leads", name: "Leads", icon: NotepadText, group: "Revenue" },
  { id: "quotations", name: "Quotations", icon: FileScan, group: "Revenue" },
  { id: "invoice-builder", name: "Invoice Builder", icon: ReceiptText, group: "Revenue" },
  { id: "sales-flow", name: "Sales Workflow", icon: ClipboardList, group: "Revenue" },
  { id: "purchase" as any, name: "Purchase", icon: ShoppingCart, group: "Revenue" },
  { id: "finance-entities", name: "Entities & Setup", icon: Building2, group: "Finance" },
  { id: "finance-flow", name: "Finance Flow", icon: CircleDollarSign, group: "Finance" },
  // { id: "finance-entities", name: "Entities & Setup", icon: Building2, group: "Finance" },
  { id: "accounts", name: "Accounts", icon: FileSpreadsheet, group: "Finance" },
  { id: "expenses", name: "Expenses & Petty Cash", icon: CircleDollarSign, group: "Finance" },
  { id: "vat-scanner", name: "VAT Bill Scanner", icon: FileScan, group: "Finance" },
  { id: "profitability", name: "Project Profitability", icon: ChartNoAxesCombined, group: "Delivery" },
  { id: "client-room", name: "Client 360 Room", icon: Users, group: "Delivery" },
  { id: "employees", name: "Employee Performance", icon: Gauge, group: "Delivery" },
  { id: "inventory", name: "Inventory", icon: Boxes, group: "Operations" },
  { id: "renewals", name: "Recurring Renewals", icon: DatabaseZap, group: "Operations" },
  { id: "assets", name: "Asset Management", icon: HardDrive, group: "Operations" },
  { id: "credentials", name: "Credential Vault", icon: LockKeyhole, group: "Secure" },
  { id: "ai-capture", name: "AI Capture Anything", icon: Sparkles, group: "AI" },
  { id: "hr", name: "HR Lite", icon: Users, group: "Admin" },
  { id: "payroll", name: "Payroll / WPS", icon: Landmark, group: "Admin" }
] as const;

export type AppPage = (typeof navItems)[number]["id"] | "products" | "product-groups" | "uom-master" | "users" | "purchases" | "purchase-enquiry" | "purchase-orders" | "finance-entities" | "finance-ledgers" | "finance-entry-types" | "finance-cost-centres" | "finance-entries";

export const pageToUrlMap: Record<string, string> = {
  "control-tower": "/command/control-tower",
  "clients": "/revenue/clients",
  "suppliers": "/revenue/suppliers",
  "leads": "/revenue/leads",
  "quotations": "/revenue/quotations",
  "invoice-builder": "/revenue/invoice-builder",
  "sales-flow": "/revenue/sales-flow",
  "products": "/revenue/products",
  "product-groups": "/revenue/product-groups",
  "uom-master": "/revenue/uom-master",
  "users": "/revenue/users",
  "purchases": "/revenue/purchases",
  "purchase-enquiry": "/revenue/purchase-enquiry",
  "purchase-orders": "/revenue/purchase-orders",
  "finance-flow": "/finance/finance-flow",
  "finance-entities": "/finance/entities",
  "finance-ledgers": "/finance/ledgers",
  "finance-entry-types": "/finance/entry-types",
  "finance-cost-centres": "/finance/cost-centres",
  "finance-entries": "/finance/entries",
  "accounts": "/finance/accounts",
  "expenses": "/finance/expenses",
  "vat-scanner": "/finance/vat-scanner",
  "profitability": "/delivery/profitability",
  "client-room": "/delivery/client-room",
  "employees": "/delivery/employees",
  "inventory": "/operations/inventory",
  "renewals": "/operations/renewals",
  "assets": "/operations/assets",
  "credentials": "/secure/credentials",
  "ai-capture": "/ai/ai-capture",
  "hr": "/admin/hr",
  "payroll": "/admin/payroll"
};

export function getPageUrl(page: AppPage): string {
  return pageToUrlMap[page] || "/revenue/clients";
}

export function getPageFromPath(pathname: string): AppPage | null {
  const cleanPath = pathname.replace(/\/$/, "");
  if (!cleanPath) return "clients";

  for (const [page, url] of Object.entries(pageToUrlMap)) {
    if (cleanPath === url || cleanPath === url + "/") {
      return page as AppPage;
    }
  }

  if (cleanPath === "/command") return "control-tower";
  if (cleanPath === "/revenue") return "clients";
  if (cleanPath === "/finance") return "finance-flow";
  if (cleanPath === "/delivery") return "profitability";
  if (cleanPath === "/operations") return "inventory";
  if (cleanPath === "/secure") return "credentials";
  if (cleanPath === "/ai") return "ai-capture";
  if (cleanPath === "/admin") return "hr";

  const segments = cleanPath.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  if (lastSegment && pageToUrlMap[lastSegment]) {
    return lastSegment as AppPage;
  }

  return null;
}

const navGroups = ["Command", "Revenue", "Finance", "Delivery", "Operations", "Secure", "AI", "Admin"] as const;

export function AppShell({
  activeCompany,
  activePage,
  setActivePage,
  onLogout,
  children
}: {
  activeCompany: Company;
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="premium-surface min-h-screen">
      <TopBar
        activeCompany={activeCompany}
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={onLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <AppSidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="lg:pl-80 print:pl-0">
        <main className="px-4 py-6 sm:px-6 lg:px-8 xl:px-10 print:p-0">{children}</main>
      </div>

      {/* Settings Drawer Modal rendered at root level for full viewport backdrop */}
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export function AppSidebar({
  activePage,
  setActivePage
}: {
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;
}) {
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isFinanceEntitiesOpen, setIsFinanceEntitiesOpen] = useState(false);

  return (
    <aside className="sidebar-glow fixed inset-y-0 left-0 z-30 hidden w-80 border-r border-slate-800/60 text-white shadow-2xl shadow-slate-950/40 lg:block print:hidden">
      <div className="flex h-24 items-center justify-between border-b border-white/10 px-4 backdrop-blur-md">
        <div className="flex items-center justify-center w-full h-full py-2">
          <div className="bg-white rounded-xl px-3 py-1.5 shadow-md shadow-blue-950/40 flex items-center justify-center w-full h-full overflow-hidden">
            <img
              src="/ggms-logo-horizontal.png"
              alt="GGMS IT Solutions"
              className="h-12 w-auto max-w-full object-contain"
            />
          </div>
        </div>
      </div>
      <div className="h-[calc(100vh-6rem)] overflow-y-auto px-4 py-5 space-y-6">
        {navGroups.map((group) => {
          const items = navItems.filter((item) => item.group === group);
          return (
            <div key={group} className="space-y-1.5">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90">{group}</p>
              <div className="space-y-1">
                {items.map((item) => {
                  if (item.id === "finance-entities") {
                    const isSubActive = ["finance-entities", "finance-ledgers", "finance-entry-types", "finance-cost-centres", "finance-entries"].includes(activePage);
                    return (
                      <div key={item.name} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setIsFinanceEntitiesOpen(!isFinanceEntitiesOpen)}
                          className={cn(
                            "group flex h-11 w-full items-center justify-between rounded-xl px-3.5 text-left text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/10 hover:text-white",
                            (isFinanceEntitiesOpen || isSubActive) && "bg-white/10 text-white font-semibold"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-300" />
                            {item.name}
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isFinanceEntitiesOpen && "rotate-180")} />
                        </button>
                        {(isFinanceEntitiesOpen || isSubActive) && (
                          <div className="pl-6 space-y-1 border-l border-white/15 ml-5 my-1.5">
                            <button
                              type="button"
                              onClick={() => setActivePage("finance-ledgers")}
                              className={cn(
                                "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                                activePage === "finance-ledgers" && "bg-white text-slate-950 hover:bg-white hover:text-slate-950 font-bold shadow-md shadow-black/20"
                              )}
                            >
                              Ledgers (Chart of Accounts)
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePage("finance-entry-types")}
                              className={cn(
                                "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                                activePage === "finance-entry-types" && "bg-white text-slate-950 hover:bg-white hover:text-slate-950 font-bold shadow-md shadow-black/20"
                              )}
                            >
                              Entry Types
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePage("finance-cost-centres")}
                              className={cn(
                                "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                                activePage === "finance-cost-centres" && "bg-white text-slate-950 hover:bg-white hover:text-slate-950 font-bold shadow-md shadow-black/20"
                              )}
                            >
                              Cost & Profit Centres
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePage("finance-entries")}
                              className={cn(
                                "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                                activePage === "finance-entries" && "bg-white text-slate-950 hover:bg-white hover:text-slate-950 font-bold shadow-md shadow-black/20"
                              )}
                            >
                              Journal Entries (Vouchers)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (item.id === "master") {
                    const isSubActive = ["products", "product-groups", "uom-master", "users"].includes(activePage);
                    return (
                      <div key={item.name} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setIsMasterOpen(!isMasterOpen)}
                          className={cn(
                            "group flex h-11 w-full items-center justify-between rounded-xl px-3.5 text-left text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/10 hover:text-white",
                            (isMasterOpen || isSubActive) && "bg-white/10 text-white font-semibold"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-300" />
                            {item.name}
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isMasterOpen && "rotate-180")} />
                        </button>
                        {isMasterOpen && (
                          <div className="pl-6 space-y-1 border-l border-white/15 ml-5 my-1.5">
                            <button
                              type="button"
                              onClick={() => setActivePage("products")}
                              className={cn(
                                "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                                activePage === "products" && "bg-white text-slate-950 hover:bg-white hover:text-slate-950 font-bold shadow-md shadow-black/20"
                              )}
                            >
                              Products
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePage("product-groups")}
                              className={cn(
                                "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                                activePage === "product-groups" && "bg-white text-slate-950 hover:bg-white hover:text-slate-950 font-bold shadow-md shadow-black/20"
                              )}
                            >
                              Product Groups
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePage("uom-master")}
                              className={cn(
                                "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                                activePage === "uom-master" && "bg-white text-slate-950 hover:bg-white hover:text-slate-950 font-bold shadow-md shadow-black/20"
                              )}
                            >
                              UOM Master
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePage("users")}
                              className={cn(
                                "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                                activePage === "users" && "bg-white text-slate-950 hover:bg-white hover:text-slate-950 font-bold shadow-md shadow-black/20"
                              )}
                            >
                              Users
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (item.id === "purchase") {
                    const isSubActive = ["purchase-enquiry", "purchase-orders", "purchase"].includes(activePage);
                    return (
                      <div key={item.name} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setIsPurchaseOpen(!isPurchaseOpen)}
                          className={cn(
                            "group flex h-11 w-full items-center justify-between rounded-xl px-3.5 text-left text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/10 hover:text-white",
                            (isPurchaseOpen || isSubActive) && "bg-white/10 text-white font-semibold"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-300" />
                            {item.name}
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isPurchaseOpen && "rotate-180")} />
                        </button>
                        {isPurchaseOpen && (
                          <div className="pl-6 space-y-1 border-l border-white/15 ml-5 my-1.5">
                            <button
                              type="button"
                              onClick={() => setActivePage("purchase-enquiry")}
                              className={cn(
                                "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                                activePage === "purchase-enquiry" && "bg-white text-slate-950 hover:bg-white hover:text-slate-950 font-bold shadow-md shadow-black/20"
                              )}
                            >
                              Enquiry (RFQ)
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePage("purchase-orders")}
                              className={cn(
                                "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                                activePage === "purchase-orders" && "bg-white text-slate-950 hover:bg-white hover:text-slate-950 font-bold shadow-md shadow-black/20"
                              )}
                            >
                              Purchase Orders
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setActivePage(item.id)}
                      className={cn(
                        "group relative flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/10 hover:text-white",
                        isActive && "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-600 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-300", isActive && "text-white")} />
                      <span className="flex-1 truncate">{item.name}</span>
                      {isActive && <span className="h-2 w-2 rounded-full bg-white shadow-sm" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export function TopBar({
  activeCompany,
  activePage,
  setActivePage,
  onLogout,
  onOpenSettings
}: {
  activeCompany: Company;
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}) {
  const loggedInUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
  const userName = loggedInUser.name || loggedInUser.email || "User";
  const userInitials = userName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0].toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-40 h-24 border-b border-white/10 bg-[#071727] px-4 text-white shadow-xl shadow-slate-950/10 sm:px-6 lg:ml-80 lg:px-5 xl:px-7 print:hidden">
      <div className="flex h-full min-w-0 items-center gap-3 xl:gap-5">
        <div className="group relative lg:hidden">
          <Button size="icon" aria-label="Open navigation" className="h-10 w-10 border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Menu className="h-4 w-4" />
          </Button>
          <div className="invisible absolute left-0 top-12 z-50 max-h-[80vh] w-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50", activePage === item.id && "bg-blue-50 text-blue-700 font-bold")}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <AiCommandBar />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <CompanyBadge activeCompany={activeCompany} onClick={onOpenSettings} />

          <div className="relative">
            <Button size="icon" aria-label="Notifications" className="relative h-12 w-12 rounded-2xl border-0 bg-slate-100 text-slate-700 shadow-none hover:bg-white">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-cyan-500 ring-2 ring-slate-100" />
            </Button>
          </div>

          <div className="relative">
            <Button
              size="icon"
              aria-label="Settings"
              onClick={onOpenSettings}
              className="h-12 w-12 rounded-2xl border-0 bg-slate-100 text-slate-700 shadow-none hover:bg-white hover:text-blue-600"
              title="Company & Currency Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          <div className="hidden h-12 max-w-56 items-center gap-3 rounded-2xl border border-white/10 bg-slate-100 px-3 text-slate-900 sm:flex">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b293b] text-xs font-black text-cyan-300">
              {userInitials}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-extrabold">{userName}</p>
              <p className="text-[11px] font-medium text-slate-400">Full Access</p>
            </div>
          </div>

          <Button size="icon" aria-label="Logout" onClick={onLogout} className="h-12 w-12 rounded-2xl border-0 bg-slate-100 text-slate-600 shadow-none hover:bg-rose-50 hover:text-red-600">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export function AiCommandBar() {
  return (
    <div className="group flex h-12 w-full max-w-[52rem] items-center gap-3 rounded-2xl border border-white/20 bg-slate-100/90 px-3 shadow-inner shadow-slate-950/10 transition-all duration-200 focus-within:border-cyan-300/70 focus-within:ring-4 focus-within:ring-cyan-400/10 hover:bg-white">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#071727] text-cyan-300 shadow-sm">
        <Search className="h-4 w-4" />
      </span>
      <input className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 text-slate-900 sm:text-base" placeholder="Search or ask AI: invoices, projects, clients..." />
      <div className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-400 sm:flex">
        <Command className="h-3 w-3" />
        K
      </div>
      <Button size="sm" className="h-10 shrink-0 rounded-xl bg-[#071727] px-3 text-white shadow-none hover:bg-[#102d40]">
        <Bot className="h-4 w-4 text-cyan-300" />
        Ask AI
      </Button>
    </div>
  );
}

export function CompanyBadge({ activeCompany, onClick }: { activeCompany: Company; onClick: () => void }) {
  const { selectedCountry, setSelectedCountry, availableCountries } = useCompany();
  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
  const isAdmin = currentUser?.role === "Admin";

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {/* 2-Tier Region & Country Selector Pill (Admins only) */}
      {isAdmin && (
        <div className="hidden items-center gap-1.5 rounded-2xl border border-white/10 bg-white/10 px-3 py-1.5 text-white transition hover:bg-white/15 2xl:flex">
          <Globe className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="max-w-24 bg-transparent text-xs font-black text-white outline-none cursor-pointer pr-1"
            title="Filter active company dropdown by Country"
          >
            {availableCountries.map((country) => (
              <option key={country} value={country} className="bg-white font-bold text-slate-900">
                {country === "UAE" ? "🇦🇪 UAE (Dubai)" : country === "Oman" ? "🇴🇲 Oman" : country === "Saudi Arabia" ? "🇸🇦 Saudi Arabia" : "🌐 All Regions"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Active Entity Badge */}
      <button
        type="button"
        onClick={onClick}
        className="flex h-12 min-w-0 max-w-64 cursor-pointer items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-100 px-2.5 text-left text-slate-900 transition hover:bg-white sm:min-w-48 sm:px-3"
        title="Click to configure Company & Currency settings"
      >
        <span className="flex min-w-0 items-center gap-2">
          {activeCompany.logoUrl ? (
            <img src={activeCompany.logoUrl} alt={activeCompany.name} className="h-10 w-10 shrink-0 rounded-xl border border-slate-100 object-contain p-0.5" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b293b] font-black text-cyan-300">
              {activeCompany.name?.charAt(0) || "G"}
            </div>
          )}
          <span className="min-w-0">
            <span className="block max-w-28 truncate text-xs font-extrabold sm:max-w-32">{activeCompany.name}</span>
            <span className="block max-w-28 truncate text-[11px] font-medium text-slate-400 sm:max-w-32">
              {activeCompany.branch || activeCompany.country} · <strong className="font-mono text-cyan-700">{activeCompany.currency}</strong>
            </span>
          </span>
        </span>
        <Badge variant="success" className="hidden shrink-0 sm:flex">
          <Zap className="mr-1 h-3 w-3 animate-pulse" />Live
        </Badge>
      </button>
    </div>
  );
}
