import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import { ArrowDown, ArrowUp, MoreHorizontal } from "lucide-react";

import { DeleteInvestmentMenuItem } from "@/features/delete-investment/ui/delete-investment-menu-item";
import { formatCurrency } from "@/shared/lib/format/currency";
import { formatPercent } from "@/shared/lib/format/percent";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface InvestmentItemProps {
  investment: {
    id: Id<"investments">;
    name: string;
    type: string;
    value: number;
    gain: number;
    gainPercent: number;
    currency: string;
  };
}

export function InvestmentItem({ investment }: InvestmentItemProps) {
  const isPositive = investment.gain >= 0;

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isPositive ? "bg-green-500/10" : "bg-red-500/10"
          }`}
        >
          {isPositive ? (
            <ArrowUp className="h-5 w-5 text-green-500" />
          ) : (
            <ArrowDown className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{investment.name}</p>
            <Badge className="capitalize" variant="outline">
              {investment.type.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {formatCurrency(investment.value, investment.currency)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p
            className={`font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(investment.gain, investment.currency)}
          </p>
          <p
            className={`text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}
          >
            {isPositive ? "+" : ""}
            {formatPercent(investment.gainPercent)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DeleteInvestmentMenuItem investmentId={investment.id} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
