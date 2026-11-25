export type WorkflowLead = {
  id: string;
  companyId: string;
  name: string;
  contact: string;
  need: string;
  value: number;
  status: "New" | "Converted";
  customerId?: string;
};

export type WorkflowCustomer = {
  id: string;
  companyId: string;
  name: string;
  sourceLeadId: string;
};

export type WorkflowQuotation = {
  id: string;
  companyId: string;
  customerId: string;
  customerName: string;
  title: string;
  amount: number;
  status: "Draft" | "Approved";
};

export type WorkflowProject = {
  id: string;
  companyId: string;
  customerName: string;
  name: string;
  budget: number;
  status: "Running";
};

export type FinanceExpense = {
  id: string;
  companyId: string;
  category: string;
  project: string;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: "Draft" | "Posted";
};

export type FinanceVatEntry = {
  id: string;
  expenseId: string;
  type: "Purchase";
  supplier: string;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
};

export type FinanceInvoice = {
  id: string;
  companyId: string;
  customer: string;
  project: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  status: "Draft" | "Sent" | "Paid";
};

export type FinancePayment = {
  id: string;
  invoiceId: string;
  customer: string;
  amount: number;
  method: string;
  reference: string;
};

export type ProductItem = {
  id: string;
  companyId: string;
  name: string;
  type: "Product" | "Service" | "AMC" | "License";
  category: string;
  barcode?: string;
  uom?: string;
  productGroupId?: number;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  vatRate: number;
};

export type UomItem = {
  id: number;
  name: string;
  description: string;
  companyId: string;
};

export type ProductGroupItem = {
  id: number;
  name: string;
  vatPercentage: number;
  companyId: string;
};

export type PurchaseOrderRecord = {
  id: string;
  purchaseOrderNo: string;
  purchaseEnquiryId: string;
  supplierName: string;
  supplierEmail: string;
  orderDate: string;
  remarks: string;
  itemsJson: string;
  totalAmount: number;
  vatAmount: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  termsAndConditions: string;
  notes: string;
  status: string;
  companyId: string;
};

export type PurchaseRecord = {
  id: string;
  supplier: string;
  productId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  vatAmount: number;
  totalAmount: number;
  status: "Received";
};

export type InvoiceLine = {
  id: string;
  productId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  vatRate: number;
};

export type LedgerItem = {
  code: string;
  companyId?: string;
  name: string;
  class: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  parentCode?: string;
  isRetainedEarnings?: boolean;
  description?: string;
  createdAt?: string;
};

export type EntryTypeItem = {
  code: string;
  companyId?: string;
  name: string;
  description?: string;
  creator?: string;
  editor?: string;
  createdAt?: string;
};

export type CostCentreItem = {
  code: string;
  companyId?: string;
  name: string;
  profitCentreCode: string;
  description?: string;
  creator?: string;
};

export type ProfitCentreItem = {
  code: string;
  companyId?: string;
  name: string;
  businessUnit?: string;
  description?: string;
  creator?: string;
};

export type JournalEntryLineItem = {
  id?: number;
  journalEntryId?: string;
  profitCentreCode?: string;
  costCentreCode?: string;
  ledgerCode: string;
  ledgerName?: string;
  debit: number;
  credit: number;
  notes?: string;
};

export type JournalEntryRecord = {
  id: string;
  companyId?: string;
  entryTypeCode: string;
  entryTypeName: string;
  creator?: string;
  fiscalYear: string;
  datetime: string;
  reference?: string;
  attachmentUrl?: string;
  totalDebit: number;
  totalCredit: number;
  notes?: string;
  status: string;
  lines: JournalEntryLineItem[];
};
