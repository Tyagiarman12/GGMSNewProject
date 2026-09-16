import type { ProductItem } from "./domain";


export const ggmsQuotations = [
  { id: "QT-OM-2201", customer: "KLEEV", title: "IT AMC", amount: 9800, vat: 490, status: "Sent", expires: "2026-06-28", lastFollowUp: "1 day ago" },
  { id: "QT-OM-2202", customer: "Barka Poultry", title: "Server & Firewall Setup", amount: 8500, vat: 425, status: "Approved", expires: "2026-07-05", lastFollowUp: "Today" },
  { id: "QT-OM-2203", customer: "Timberworks", title: "CCTV AMC Support", amount: 4200, vat: 210, status: "Expired", expires: "2026-06-08", lastFollowUp: "6 days ago" },
  { id: "QT-OM-2204", customer: "KLEEV", title: "Microsoft 365 migration", amount: 3100, vat: 155, status: "Draft", expires: "2026-07-12", lastFollowUp: "Not sent" }
];

export const initialProducts: ProductItem[] = [
  { id: "ITM-001", companyId: "ggms-oman", name: "Hikvision 4MP IP Camera", type: "Product", category: "CCTV", buyPrice: 28, sellPrice: 48, stock: 12, minStock: 5, vatRate: 0.05 },
  { id: "ITM-002", companyId: "ggms-oman", name: "8 Channel NVR", type: "Product", category: "CCTV", buyPrice: 85, sellPrice: 135, stock: 4, minStock: 2, vatRate: 0.05 },
  { id: "ITM-003", companyId: "ggms-oman", name: "1TB Surveillance HDD", type: "Product", category: "Storage", buyPrice: 22, sellPrice: 38, stock: 8, minStock: 4, vatRate: 0.05 },
  { id: "ITM-004", companyId: "ggms-oman", name: "Cat6 Cable Box", type: "Product", category: "Cable", buyPrice: 32, sellPrice: 55, stock: 3, minStock: 4, vatRate: 0.05 },
  { id: "ITM-005", companyId: "ggms-oman", name: "Firewall Configuration Service", type: "Service", category: "IT Service", buyPrice: 0, sellPrice: 180, stock: 0, minStock: 0, vatRate: 0.05 },
  { id: "ITM-006", companyId: "ggms-oman", name: "IT AMC Monthly Plan", type: "AMC", category: "AMC", buyPrice: 120, sellPrice: 320, stock: 0, minStock: 0, vatRate: 0.05 },
  { id: "ITM-007", companyId: "ggms-oman", name: "Microsoft 365 Business Basic", type: "License", category: "Software", buyPrice: 2.4, sellPrice: 3.5, stock: 25, minStock: 10, vatRate: 0.05 }
];

export const accountReceivables = [
  { id: "INV-3028", customer: "KLEEV", amount: 1850, due: "2026-06-18", status: "Overdue" },
  { id: "INV-3031", customer: "Timberworks", amount: 4200, due: "2026-06-25", status: "Due" },
  { id: "INV-3036", customer: "Barka Poultry", amount: 8925, due: "2026-07-05", status: "Open" }
];

export const accountPayables = [
  { id: "BILL-771", supplier: "Muscat Technical Trading LLC", amount: 134.1, due: "2026-06-20", status: "To Pay" },
  { id: "BILL-774", supplier: "Oman Network Supplies", amount: 690, due: "2026-06-28", status: "To Pay" },
  { id: "BILL-779", supplier: "Cloud License Distributor", amount: 420, due: "2026-07-02", status: "Scheduled" }
];

export const hrEmployees = [
  { id: "EMP-001", name: "Abdullah", role: "Engineer", department: "Operations", salary: 650, bank: "Bank Muscat", iban: "OM12BMUS000000001", status: "Active" },
  { id: "EMP-002", name: "Rizwan", role: "Project Manager", department: "Delivery", salary: 850, bank: "Sohar International", iban: "OM44SOIB000000002", status: "Active" },
  { id: "EMP-003", name: "Sales Team", role: "Sales", department: "Sales", salary: 700, bank: "Bank Muscat", iban: "Missing", status: "Needs IBAN" },
  { id: "EMP-004", name: "Accounts", role: "Accounts", department: "Finance", salary: 600, bank: "NBO", iban: "OM77NBOB000000004", status: "Active" },
  { id: "EMP-005", name: "Project Coordinator", role: "Coordinator", department: "Delivery", salary: 500, bank: "Bank Dhofar", iban: "OM55BDOF000000005", status: "Active" }
];
