import { convexQuery } from "@convex-dev/react-query";
import { useForm, useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
} from "convex/react";
import { Schema } from "effect";
import {
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { STALE_TIME } from "@/lib/query";

type TransactionType = "income" | "expense" | "transfer";

const TRANSACTION_STYLES: Record<
  TransactionType,
  { bg: string; text: string }
> = {
  income: { bg: "bg-green-500/10 text-green-500", text: "text-green-500" },
  transfer: { bg: "bg-blue-500/10 text-blue-500", text: "text-blue-500" },
  expense: { bg: "bg-red-500/10 text-red-500", text: "text-red-500" },
};

function getTransactionBgClass(type: TransactionType): string {
  return TRANSACTION_STYLES[type].bg;
}

function getTransactionTextClass(type: TransactionType): string {
  return TRANSACTION_STYLES[type].text;
}

function TransactionIcon({ type }: { type: TransactionType }) {
  switch (type) {
    case "income":
      return <ArrowUpRight className="h-4 w-4" />;
    case "transfer":
      return <RefreshCcw className="h-4 w-4" />;
    default:
      return <ArrowDownRight className="h-4 w-4" />;
  }
}

export const Route = createFileRoute("/transactions")({
  component: RouteComponent,
  pendingComponent: TransactionsSkeleton,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <Authenticated>
        <TransactionsContent />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="w-full max-w-md">
            {showSignIn ? (
              <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
            ) : (
              <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
            )}
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <TransactionsSkeleton />
      </AuthLoading>
    </>
  );
}

function TransactionsTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...new Array(5)].map((_, i) => (
        <div className="flex items-center gap-4" key={i}>
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function TransactionsContent() {
  const [filter, setFilter] = useState<
    "all" | "expense" | "income" | "transfer"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: transactions } = useQuery({
    ...convexQuery(api.transactions.list, {
      limit: 50,
      ...(filter !== "all" && { type: filter }),
    }),
    staleTime: STALE_TIME.DYNAMIC,
  });
  const { data: accounts } = useQuery({
    ...convexQuery(api.accounts.list, {}),
    staleTime: STALE_TIME.SEMI_STATIC,
  });
  const { data: categories } = useQuery({
    ...convexQuery(api.categories.list, {}),
    staleTime: STALE_TIME.STATIC,
  });

  // Only show full skeleton when accounts/categories are not loaded yet (initial load)
  if (!(accounts && categories)) {
    return <TransactionsSkeleton />;
  }

  const accountMap = new Map(accounts.map((a) => [a._id, a]));
  const categoryMap = new Map(categories.map((c) => [c._id, c]));

  const getFilteredTransactions = () => {
    if (!transactions) {
      return null;
    }
    if (!searchQuery) {
      return transactions;
    }
    return transactions.filter((tx) =>
      tx.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredTransactions = getFilteredTransactions();

  const transactionCount = filteredTransactions?.length ?? 0;

  return (
    <div className="flex-1 space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            View, filter, and manage all your transactions
          </p>
        </div>
        <CreateTransactionDialog accounts={accounts} categories={categories} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {filteredTransactions
              ? `${transactionCount} transactions`
              : "Loading..."}
          </CardDescription>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                value={searchQuery}
              />
            </div>
            <Tabs
              onValueChange={(v) => setFilter(v as typeof filter)}
              value={filter}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="expense">Expenses</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="transfer">Transfers</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredTransactions && <TransactionsTableSkeleton />}
          {filteredTransactions && filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Filter className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                No transactions found
              </p>
              {accounts.length > 0 ? (
                <CreateTransactionDialog
                  accounts={accounts}
                  categories={categories}
                >
                  <Button className="mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first transaction
                  </Button>
                </CreateTransactionDialog>
              ) : (
                <p className="mt-2 text-muted-foreground text-sm">
                  Create an account first to add transactions
                </p>
              )}
            </div>
          )}
          {filteredTransactions && filteredTransactions.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => {
                  const account = accountMap.get(tx.accountId);
                  const category = categoryMap.get(tx.categoryId);

                  return (
                    <TransactionRow
                      account={account}
                      categories={categories}
                      category={category}
                      key={tx._id}
                      transaction={tx}
                    />
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionRow({
  transaction,
  account,
  category,
  categories,
}: {
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
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const removeTransaction = useMutation(api.transactions.remove);

  const handleDelete = async () => {
    try {
      await removeTransaction({ id: transaction._id });
      toast.success("Transaction deleted");
    } catch {
      toast.error("Failed to delete transaction");
    }
  };

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
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
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

const EditTransactionFormSchema = Schema.Struct({
  categoryId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Category is required" })
  ),
  description: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Description is required" })
  ),
  date: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Date is required" })
  ),
  notes: Schema.String,
});

function EditTransactionDialog({
  transaction,
  categories,
  open,
  onOpenChange,
}: {
  transaction: {
    _id: Id<"transactions">;
    type: "expense" | "income" | "transfer";
    description: string;
    date: number;
    categoryId: Id<"categories">;
  };
  categories: Array<{
    _id: Id<"categories">;
    name: string;
    icon: string;
    type: "expense" | "income";
  }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTransaction = useMutation(api.transactions.update);

  const form = useForm({
    defaultValues: {
      categoryId: transaction.categoryId as string,
      description: transaction.description,
      date: new Date(transaction.date).toISOString().split("T")[0],
      notes: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await updateTransaction({
          id: transaction._id,
          categoryId: value.categoryId as Id<"categories">,
          description: value.description,
          date: new Date(value.date).getTime(),
          ...(value.notes && { notes: value.notes }),
        });
        toast.success("Transaction updated");
        onOpenChange(false);
      } catch {
        toast.error("Failed to update transaction");
      }
    },
    validators: {
      onSubmit: Schema.standardSchemaV1(EditTransactionFormSchema),
    },
  });

  // Filter categories based on transaction type
  const filteredCategories =
    transaction.type === "transfer"
      ? categories
      : categories.filter((c) => c.type === transaction.type);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>Update transaction details.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field name="description">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., Grocery shopping"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="categoryId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  items={filteredCategories.map((c) => ({
                    value: c._id,
                    label: `${c.icon} ${c.name}`,
                  }))}
                  onValueChange={(val: string | null) =>
                    field.handleChange(val || "")
                  }
                  value={field.state.value || undefined}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem
                        key={c._id}
                        label={`${c.icon} ${c.name}`}
                        value={c._id}
                      >
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="date">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="date"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="notes">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Add any notes..."
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <form.Subscribe>
              {(state) => (
                <Button disabled={state.isSubmitting} type="submit">
                  {state.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const TransactionFormSchema = Schema.Struct({
  type: Schema.Literal("expense", "income", "transfer"),
  accountId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Account is required" })
  ),
  categoryId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Category is required" })
  ),
  amount: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Amount is required" })
  ),
  description: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Description is required" })
  ),
  date: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Date is required" })
  ),
  toAccountId: Schema.String,
});

function CreateTransactionDialog({
  accounts,
  categories,
  children,
}: {
  accounts: Array<{ _id: Id<"accounts">; name: string; currency: string }>;
  categories: Array<{
    _id: Id<"categories">;
    name: string;
    icon: string;
    type: "expense" | "income";
  }>;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const createTransaction = useMutation(api.transactions.create);

  const form = useForm({
    defaultValues: {
      type: "expense" as "expense" | "income" | "transfer",
      accountId: "",
      categoryId: "",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      toAccountId: "",
    },
    onSubmit: async ({ value }) => {
      const selectedAccount = accounts.find((a) => a._id === value.accountId);
      try {
        await createTransaction({
          accountId: value.accountId as Id<"accounts">,
          categoryId: value.categoryId as Id<"categories">,
          type: value.type,
          amount: Number.parseFloat(value.amount),
          currency: selectedAccount?.currency || "USD",
          description: value.description,
          date: new Date(value.date).getTime(),
          ...(value.type === "transfer" &&
            value.toAccountId && {
              toAccountId: value.toAccountId as Id<"accounts">,
            }),
        });
        toast.success("Transaction created");
        setOpen(false);
        form.reset();
      } catch {
        toast.error("Failed to create transaction");
      }
    },
    validators: {
      onSubmit: Schema.standardSchemaV1(TransactionFormSchema),
    },
  });

  const currentType = useStore(form.store, (state) => state.values.type);
  const currentAccountId = useStore(
    form.store,
    (state) => state.values.accountId
  );

  const filteredCategories =
    currentType === "transfer"
      ? categories
      : categories.filter(
          (c) => c.type === currentType || currentType === "expense"
        );

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {children || (
          <Button disabled={accounts.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Record a new transaction.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field name="type">
            {(field) => (
              <div className="space-y-2">
                <Label>Type</Label>
                <Tabs
                  onValueChange={(v) =>
                    field.handleChange(v as typeof currentType)
                  }
                  value={field.state.value}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="expense">Expense</TabsTrigger>
                    <TabsTrigger value="income">Income</TabsTrigger>
                    <TabsTrigger value="transfer">Transfer</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
          </form.Field>

          <form.Field name="accountId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="account">
                  {currentType === "transfer" ? "From Account" : "Account"}
                </Label>
                <Select
                  items={accounts.map((a) => ({
                    value: a._id,
                    label: `${a.name} (${a.currency})`,
                  }))}
                  onValueChange={(val: string | null) =>
                    field.handleChange(val || "")
                  }
                  value={field.state.value || undefined}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem
                        key={a._id}
                        label={`${a.name} (${a.currency})`}
                        value={a._id}
                      >
                        {a.name} ({a.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {currentType === "transfer" && (
            <form.Field name="toAccountId">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="toAccount">To Account</Label>
                  <Select
                    items={accounts
                      .filter((a) => a._id !== currentAccountId)
                      .map((a) => ({
                        value: a._id,
                        label: `${a.name} (${a.currency})`,
                      }))}
                    onValueChange={(val: string | null) =>
                      field.handleChange(val || "")
                    }
                    value={field.state.value || undefined}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select destination account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((a) => a._id !== currentAccountId)
                        .map((a) => (
                          <SelectItem
                            key={a._id}
                            label={`${a.name} (${a.currency})`}
                            value={a._id}
                          >
                            {a.name} ({a.currency})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          )}

          <form.Field name="categoryId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  items={filteredCategories.map((c) => ({
                    value: c._id,
                    label: `${c.icon} ${c.name}`,
                  }))}
                  onValueChange={(val: string | null) =>
                    field.handleChange(val || "")
                  }
                  value={field.state.value || undefined}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem
                        key={c._id}
                        label={`${c.icon} ${c.name}`}
                        value={c._id}
                      >
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="amount">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  min="0"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., Grocery shopping"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="date">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="date"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <form.Subscribe>
              {(state) => (
                <Button disabled={state.isSubmitting} type="submit">
                  {state.isSubmitting ? "Adding..." : "Add Transaction"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-64" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...new Array(5)].map((_, i) => (
              <div className="flex items-center gap-4" key={i}>
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
