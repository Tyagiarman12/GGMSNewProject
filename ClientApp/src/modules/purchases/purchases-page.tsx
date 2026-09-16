"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Td, Th } from "../../components/ui/table";
import type { Company } from "../../data/mock";
import { money } from "../../lib/utils";
import type { ProductItem, PurchaseRecord } from "../../modules/shared/domain";
import { DataTable, Field, Info, SectionTitle } from "../../modules/shared/screen-kit";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function PurchasesPage({
  activeCompany,
  products,
  setProducts,
  purchaseRecords,
  setPurchaseRecords
}: {
  activeCompany: Company;
  products: ProductItem[];
  setProducts: (items: ProductItem[] | ((items: ProductItem[]) => ProductItem[])) => void;
  purchaseRecords: PurchaseRecord[];
  setPurchaseRecords: (records: PurchaseRecord[] | ((records: PurchaseRecord[]) => PurchaseRecord[])) => void;
}) {
  const [supplier, setSupplier] = useState("Muscat Technical Trading LLC");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("5");
  const selectedProduct = products.find((item) => item.id === selectedProductId) ?? products[0];

  function receivePurchase() {
    if (!selectedProduct) return;
    const qty = Number(quantity) || 0;
    const vatAmount = roundMoney(selectedProduct.buyPrice * qty * selectedProduct.vatRate);
    const totalAmount = roundMoney(selectedProduct.buyPrice * qty + vatAmount);
    setPurchaseRecords((current) => [
      ...current,
      {
        id: `PO-${String(current.length + 1001)}`,
        supplier: supplier.trim() || "Supplier",
        productId: selectedProduct.id,
        itemName: selectedProduct.name,
        quantity: qty,
        unitCost: selectedProduct.buyPrice,
        vatAmount,
        totalAmount,
        status: "Received"
      }
    ]);
    setProducts((current) => current.map((item) => item.id === selectedProduct.id ? { ...item, stock: item.stock + qty } : item));
  }

  return (
    <div className="space-y-4">
      <SectionTitle title="Purchases" subtitle="Buying flow: supplier bill -> VAT input -> stock in -> inventory value." />
      <Card>
        <CardHeader><CardTitle>Receive supplier bill / stock</CardTitle></CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[1fr_1fr_0.4fr_auto]">
          <Field label="Supplier" value={supplier} onChange={setSupplier} />
          <label className="block">
            <span className="text-xs font-semibold uppercase text-slate-500">Item</span>
            <select className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
              {products.filter((item) => item.type === "Product" || item.type === "License").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <Field label="Qty" value={quantity} onChange={setQuantity} />
          <Button className="self-end" variant="primary" onClick={receivePurchase}><Plus className="h-4 w-4" /> Receive</Button>
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-4">
        <Info label="Selected cost" value={selectedProduct ? money(selectedProduct.buyPrice, activeCompany.currency) : "-"} />
        <Info label="VAT input" value={selectedProduct ? money(roundMoney((Number(quantity) || 0) * selectedProduct.buyPrice * selectedProduct.vatRate), activeCompany.currency) : "-"} />
        <Info label="Stock after receive" value={selectedProduct ? String(selectedProduct.stock + (Number(quantity) || 0)) : "-"} />
        <Info label="Supplier bills" value={String(purchaseRecords.length)} />
      </div>
      <DataTable title="Purchase history" action="Upload supplier bill">
        <thead><tr><Th>PO</Th><Th>Supplier</Th><Th>Item</Th><Th>Qty</Th><Th>Unit cost</Th><Th>VAT</Th><Th>Total</Th><Th>Status</Th></tr></thead>
        <tbody>
          {purchaseRecords.map((purchase) => (
            <tr key={purchase.id}>
              <Td>{purchase.id}</Td><Td>{purchase.supplier}</Td><Td>{purchase.itemName}</Td><Td>{purchase.quantity}</Td><Td>{money(purchase.unitCost, activeCompany.currency)}</Td><Td>{money(purchase.vatAmount, activeCompany.currency)}</Td><Td>{money(purchase.totalAmount, activeCompany.currency)}</Td><Td><Badge variant="success">{purchase.status}</Badge></Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}
