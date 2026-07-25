import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { QuickAddItem } from "../types";

export function QuickAddBar({ items }: { items: QuickAddItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Button key={item.id} variant="secondary" size="sm" className="rounded-full px-4">
          <Plus className="h-3.5 w-3.5" />
          {item.label}
        </Button>
      ))}
    </div>
  );
}
