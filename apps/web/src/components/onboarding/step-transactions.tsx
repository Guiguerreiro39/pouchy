import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function StepTransactions() {
  const accounts = useQuery(api.accounts.list, {});
  const categories = useQuery(api.categories.list);
  const transactions = useQuery(api.transactions.list, {});
  const createTransaction = useMutation(api.transactions.create);
  const removeTransaction = useMutation(api.transactions.remove);

  const [accountId, setAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!(accountId && categoryId && amount && description)) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsAdding(true);
    try {
      const account = accounts?.find((a) => a._id === accountId);
      if (!account) {
        toast.error("Invalid account");
        return;
      }

      await createTransaction({
        accountId: accountId as Id<"accounts">,
        categoryId: categoryId as Id<"categories">,
        type,
        amount: Number.parseFloat(amount),
        currency: account.currency,
        description: description.trim(),
        date: new Date(date).getTime(),
      });

      setAmount("");
      setDescription("");
      toast.success("Transaction added!");
    } catch (_error) {
      toast.error("Failed to add transaction");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: Id<"transactions">) => {
    try {
      await removeTransaction({ id });
      toast.success("Transaction removed");
    } catch (_error) {
      toast.error("Failed to remove transaction");
    }
  };

  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg">
          Add recent transactions (Optional)
        </h3>
        <p className="text-muted-foreground text-sm">
          Add some recent transactions to get started. You can skip this step
          and add them later.
        </p>
      </div>

      {/* Add Transaction Form */}
      <div className="space-y-4 rounded-lg border p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tx-account">Account</Label>
            <Select
              onValueChange={(value) => value && setAccountId(value)}
              value={accountId}
            >
              <SelectTrigger id="tx-account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((acc) => (
                  <SelectItem key={acc._id} value={acc._id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-category">Category</Label>
            <Select
              onValueChange={(value) => value && setCategoryId(value)}
              value={categoryId}
            >
              <SelectTrigger id="tx-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-type">Type</Label>
            <Select
              onValueChange={(v) => setType(v as "expense" | "income")}
              value={type}
            >
              <SelectTrigger id="tx-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-amount">Amount</Label>
            <Input
              id="tx-amount"
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              type="number"
              value={amount}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-description">Description</Label>
            <Input
              id="tx-description"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Grocery shopping"
              value={description}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-date">Date</Label>
            <Input
              id="tx-date"
              onChange={(e) => setDate(e.target.value)}
              type="date"
              value={date}
            />
          </div>
        </div>

        <Button
          className="w-full"
          disabled={isAdding || !accounts || accounts.length === 0}
          onClick={handleAdd}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="space-y-2">
          <Label>Recent Transactions ({recentTransactions.length})</Label>
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <div
                className="flex items-center justify-between rounded-lg border p-3"
                key={tx._id}
              >
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-muted-foreground text-sm">
                    {tx.type === "income" ? "+" : "-"}
                    {tx.currency} {tx.amount.toFixed(2)}
                  </p>
                </div>
                <Button
                  onClick={() => handleDelete(tx._id)}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
