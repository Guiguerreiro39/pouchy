import { ArrowDownRight, ArrowUpRight, RefreshCcw } from "lucide-react";
import type { TransactionType } from "../types/transaction-type";

export function TransactionIcon({ type }: { type: TransactionType }) {
  switch (type) {
    case "income":
      return <ArrowUpRight className="h-4 w-4" />;
    case "transfer":
      return <RefreshCcw className="h-4 w-4" />;
    default:
      return <ArrowDownRight className="h-4 w-4" />;
  }
}
