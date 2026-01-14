import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import { MoreHorizontal, Pencil } from "lucide-react";
import { useState } from "react";

import {
  getTransactionBgClass,
  getTransactionTextClass,
} from "@/entities/transaction/lib/get-transaction-style";
import { TransactionIcon } from "@/entities/transaction/ui/transaction-icon";
import { DeleteTransactionButton } from "@/features/delete-transaction/ui/delete-transaction-button";
import { EditTransactionDialog } from "@/features/edit-transaction/ui/edit-transaction-dialog";
import { formatCurrency } from "@/shared/lib/format/currency";
import { formatDate } from "@/shared/lib/format/date";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { TableCell, TableRow } from "@/shared/ui/table";

interface TransactionRowProps {
  transaction: {
    _id: Id<"transactions">;
    type: "expense" | "income" | "transfer";
    description: string;
    amount: number;
    currency: string;
    date: number;
    categoryId: Id<"categories">;
  };
  account?: { name: string };
  category?: { name: string; icon: string; color: string };
  categories: Array<{
    _id: Id<"categories">;
    name: string;
    icon: string;
    type: "expense" | "income";
  }>;
}

export function TransactionRow({
  transaction,
  account,
  category,
  categories,
}: TransactionRowProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${getTransactionBgClass(transaction.type)}`}
            >
              <TransactionIcon type={transaction.type} />
            </div>
            <span className="font-medium">{transaction.description}</span>
          </div>
        </TableCell>
        <TableCell>
          {category && (
            <div className="flex items-center gap-2">
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </div>
          )}
        </TableCell>
        <TableCell>{account?.name || "Unknown"}</TableCell>
        <TableCell>{formatDate(transaction.date)}</TableCell>
        <TableCell className="text-right">
          <span className={getTransactionTextClass(transaction.type)}>
            {transaction.type === "income" ? "+" : "-"}
            {formatCurrency(transaction.amount, transaction.currency)}
          </span>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DeleteTransactionButton transactionId={transaction._id} />
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      <EditTransactionDialog
        categories={categories}
        onOpenChange={setEditDialogOpen}
        open={editDialogOpen}
        transaction={transaction}
      />
    </>
  );
}
