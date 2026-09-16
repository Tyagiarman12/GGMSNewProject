"use client";

import { Boxes } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import type { Company } from "../../data/mock";
import { money } from "../../lib/utils";
import type { ProductItem } from "../../modules/shared/domain";
import { Info, SectionTitle } from "../../modules/shared/screen-kit";

export function InventoryPage({
  activeCompany,
  products,
  setProducts
}: {
  activeCompany: Company;
  products: ProductItem[];
  setProducts: (items: ProductItem[] | ((items: ProductItem[]) => ProductItem[])) => void;
}) {
  function issueToProject(productId: string) {
    setProducts((current) => current.map((item) => item.id === productId ? { ...item, stock: Math.max(item.stock - 1, 0) } : item));
  }

  return (
    <div className="space-y-4">
      <SectionTitle title="Inventory" subtitle="Stock on hand, low-stock alerts, project issue, and inventory valuation." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {products.filter((item) => item.type === "Product" || item.type === "License").map((item) => (
          <Card key={item.id}>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Boxes className="h-5 w-5" /></div>
                <Badge variant={item.stock <= item.minStock ? "warning" : "success"}>{item.stock <= item.minStock ? "Low stock" : "Available"}</Badge>
              </div>
              <div>
                <p className="font-black text-slate-950">{item.name}</p>
                <p className="text-sm text-slate-500">{item.category} / {item.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Info label="Stock" value={String(item.stock)} />
                <Info label="Value" value={money(item.stock * item.buyPrice, activeCompany.currency)} />
              </div>
              <Button className="w-full" disabled={item.stock <= 0} onClick={() => issueToProject(item.id)}>Issue 1 to project</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
