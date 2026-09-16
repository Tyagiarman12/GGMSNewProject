export type Company = {
  id: string;
  name: string;
  country: string;
  countryCode?: string;
  currency: string;
  currencyCode?: string;
  currencySymbol?: string;
  currencyDecimals?: number;
  defaultVatRate?: number;
  taxNumber: string; // VAT No.
  profit: number;
  logoUrl?: string;
  address?: string;
  branch?: string;
  crNumber?: string;
  contactNo?: string;
  email?: string;
  website?: string;
};

export const companies: Company[] = [
  {
    id: "ggms-oman",
    name: "GGMS Global IT Solutions SPC",
    country: "Oman",
    countryCode: "OM",
    currency: "OMR",
    currencyCode: "OMR",
    currencySymbol: "OMR",
    currencyDecimals: 3,
    defaultVatRate: 5.0,
    taxNumber: "OM11023891",
    crNumber: "CR-1049281",
    branch: "Muscat Main HQ",
    address: "Building 42, Street 19, Al Khuwair, Muscat, Sultanate of Oman",
    contactNo: "+968 2449 0011",
    email: "billing@ggms.om",
    website: "https://www.ggms.om",
    logoUrl: "/ggms-logo.png",
    profit: 18420
  }
];

export const clients = [
  {
    id: "kleev",
    name: "KLEEV",
    companyId: "ggms-oman",
    industry: "Retail",
    contacts: ["Operations Manager", "Finance Lead"],
    locations: ["Muscat HQ", "Azaiba Warehouse"],
    projects: ["Server & Firewall Setup", "IT AMC"],
    profitability: 34,
    openTasks: 8,
    invoicesDue: 2,
    credentials: 12,
    notes: "High-value managed IT account with firewall renewal due this quarter."
  },
  {
    id: "timberworks",
    name: "Timberworks",
    companyId: "ggms-oman",
    industry: "Manufacturing",
    contacts: ["Plant Admin", "Procurement"],
    locations: ["Barka Factory"],
    projects: ["CCTV AMC Support"],
    profitability: 18,
    openTasks: 5,
    invoicesDue: 1,
    credentials: 6,
    notes: "AMC usage is above expected visit consumption. Watch margin."
  },
  {
    id: "salamander",
    name: "Salamander Oil & Gas",
    companyId: "ggms-oman",
    industry: "Oil & Gas",
    contacts: ["IT Manager", "HSE Coordinator"],
    locations: ["Dammam Site"],
    projects: ["Access Control Setup"],
    profitability: 41,
    openTasks: 4,
    invoicesDue: 0,
    credentials: 8,
    notes: "Security project on track, pending final site acceptance."
  },
  {
    id: "al-badea",
    name: "Al Badea National",
    companyId: "ggms-oman",
    industry: "Construction",
    contacts: ["Projects Director"],
    locations: ["Riyadh Office"],
    projects: ["CCTV AMC Support"],
    profitability: 22,
    openTasks: 9,
    invoicesDue: 3,
    credentials: 10,
    notes: "Receivables need management attention."
  },
  {
    id: "oneroad",
    name: "OneRoad Group",
    companyId: "ggms-oman",
    industry: "Logistics",
    contacts: ["CEO Office", "Marketing"],
    locations: ["Dubai"],
    projects: ["Website Development"],
    profitability: 48,
    openTasks: 6,
    invoicesDue: 1,
    credentials: 5,
    notes: "Website phase 2 proposal ready for follow-up."
  },
  {
    id: "barka",
    name: "Barka Poultry",
    companyId: "ggms-oman",
    industry: "Food Production",
    contacts: ["Maintenance Head"],
    locations: ["Barka Farm"],
    projects: ["Server & Firewall Setup"],
    profitability: 29,
    openTasks: 3,
    invoicesDue: 1,
    credentials: 7,
    notes: "Warranty expiry coming for UPS and NAS."
  },
  {
    id: "al-reem",
    name: "Al Reem",
    companyId: "ggms-oman",
    industry: "Real Estate",
    contacts: ["Admin Manager"],
    locations: ["Dubai Marina"],
    projects: ["HRMS Software"],
    profitability: 37,
    openTasks: 11,
    invoicesDue: 2,
    credentials: 4,
    notes: "HRMS payroll export configuration pending."
  }
];

export const controlTower = {
  totalLeads: 42,
  hotLeads: 11,
  missedFollowUps: 7,
  expiredQuotations: 5,
  runningProjects: 14,
  delayedProjects: 3,
  pendingTasks: 86,
  overdueTasks: 19,
  monthlyExpenses: 18250,
  pendingExpenseApprovals: 12,
  expensesWithoutReceipt: 6,
  pendingInvoices: 21,
  overdueInvoices: 8,
  paymentsReceived: 93500,
  receivables: 128400,
  payables: 34200,
  upcomingRenewals: 18,
  amcContractsAtRisk: 4,
  lowMarginProjects: 3,
  underperformingEmployees: 2,
  vatPayable: 14630,
  payrollPending: 2,
  assetsExpiring: 16,
  netProfit: 38920
};

export const attentionItems = [
  { type: "Leads", label: "7 leads not followed up", severity: "danger", owner: "Sales" },
  { type: "Quotations", label: "5 quotations expired", severity: "warning", owner: "Manager" },
  { type: "Tasks", label: "19 tasks overdue", severity: "danger", owner: "Project Managers" },
  { type: "Invoices", label: "8 invoices overdue", severity: "danger", owner: "Accounts" },
  { type: "Renewals", label: "18 renewals due within 30 days", severity: "warning", owner: "Account Managers" },
  { type: "AMC", label: "4 AMC contracts overused or low margin", severity: "warning", owner: "Operations" }
] as const;

export const expenses = [
  { id: "EXP-1042", date: "2026-06-04", companyId: "ggms-oman", category: "Fuel", amount: 34.5, vat: 1.64, status: "Pending", receipt: true, project: "CCTV AMC Support" },
  { id: "EXP-1043", date: "2026-06-05", companyId: "ggms-oman", category: "Cable", amount: 128, vat: 6.1, status: "Approved", receipt: true, project: "Server & Firewall Setup" },
  { id: "EXP-1044", date: "2026-06-06", companyId: "pentagram-ksa", category: "Emergency purchase", amount: 875, vat: 114.13, status: "Pending", receipt: false, project: "Access Control Setup" },
  { id: "EXP-1045", date: "2026-06-07", companyId: "krativegrowth-uae", category: "Courier", amount: 90, vat: 4.29, status: "Rejected", receipt: true, project: "HRMS Software" }
];

export const renewals = [
  { client: "KLEEV", type: "Firewall subscription", due: "2026-06-25", value: 1850, status: "Due 15 days", margin: 42 },
  { client: "Timberworks", type: "CCTV AMC", due: "2026-07-09", value: 4200, status: "Due 30 days", margin: 16 },
  { client: "OneRoad Group", type: "Website maintenance", due: "2026-08-15", value: 12000, status: "Due 60 days", margin: 55 },
  { client: "Al Reem", type: "HRMS support", due: "2026-06-18", value: 9000, status: "Due 15 days", margin: 38 }
];

export const assets = [
  { code: "AST-OM-0009", client: "KLEEV", category: "Firewall", brand: "Fortinet", warranty: "2026-07-12", location: "Muscat HQ", status: "Warranty expiring" },
  { code: "AST-OM-0014", client: "Barka Poultry", category: "NAS", brand: "Synology", warranty: "2026-06-28", location: "Barka Farm", status: "Warranty expiring" },
  { code: "AST-SA-0031", client: "Salamander Oil & Gas", category: "Access Control", brand: "Hikvision", warranty: "2027-01-10", location: "Dammam Site", status: "Healthy" },
  { code: "AST-AE-0022", client: "Al Reem", category: "License", brand: "Microsoft 365", warranty: "2026-06-30", location: "Cloud", status: "License expiring" }
];

export const employees = [
  { name: "Abdullah", role: "Engineer", completed: 42, overdue: 3, followUp: 88, timesheet: 94, revenue: 18300, productivity: 86 },
  { name: "Rizwan", role: "Project Manager", completed: 31, overdue: 1, followUp: 92, timesheet: 98, revenue: 24500, productivity: 91 },
  { name: "Sales Team", role: "Sales", completed: 24, overdue: 6, followUp: 61, timesheet: 80, revenue: 11200, productivity: 63 },
  { name: "Accounts", role: "Accounts", completed: 38, overdue: 2, followUp: 90, timesheet: 96, revenue: 0, productivity: 89 },
  { name: "Project Coordinator", role: "Coordinator", completed: 29, overdue: 2, followUp: 84, timesheet: 90, revenue: 6400, productivity: 82 }
];

export const projects = [
  { name: "Server & Firewall Setup", client: "KLEEV", revenue: 8500, cost: 5480, margin: 36, status: "Running", delayed: false },
  { name: "HRMS Software", client: "Al Reem", revenue: 42000, cost: 26400, margin: 37, status: "Running", delayed: true },
  { name: "CCTV AMC Support", client: "Timberworks", revenue: 4200, cost: 3520, margin: 16, status: "At Risk", delayed: false },
  { name: "IT AMC", client: "KLEEV", revenue: 9800, cost: 6100, margin: 38, status: "Running", delayed: false },
  { name: "Access Control Setup", client: "Salamander Oil & Gas", revenue: 76000, cost: 44800, margin: 41, status: "Running", delayed: false },
  { name: "Website Development", client: "OneRoad Group", revenue: 18000, cost: 9360, margin: 48, status: "Running", delayed: false }
];

export const vatScanResult = {
  supplierName: "Muscat Technical Trading LLC",
  supplierVat: "OM110223344",
  invoiceNumber: "MTT-INV-28671",
  invoiceDate: "2026-06-06",
  netAmount: 128,
  vatAmount: 6.1,
  totalAmount: 134.1,
  currency: "OMR",
  category: "Cable",
  confidence: 91
};

export const aiClassifications = [
  "Lead",
  "Expense",
  "VAT bill",
  "Task",
  "Ticket",
  "Asset",
  "Credential",
  "Meeting note",
  "Service report",
  "Project document",
  "Invoice",
  "Renewal",
  "Payroll document"
];
