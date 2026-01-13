import { convexQuery } from "@convex-dev/react-query";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import type { Doc } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
} from "convex/react";
import { Schema } from "effect";
import {
  Archive,
  ArchiveRestore,
  CreditCard,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
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
import { formatCurrency } from "@/lib/format";
import { STALE_TIME } from "@/lib/query";

export const Route = createFileRoute("/accounts")({
  component: RouteComponent,
  pendingComponent: AccountsSkeleton,
});

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking", icon: CreditCard },
  { value: "savings", label: "Savings", icon: PiggyBank },
  { value: "credit", label: "Credit Card", icon: CreditCard },
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "investment", label: "Investment", icon: TrendingUp },
] as const;

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "BRL", label: "BRL - Brazilian Real" },
];

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <Authenticated>
        <AccountsContent />
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
        <AccountsSkeleton />
      </AuthLoading>
    </>
  );
}

function AccountsContent() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: settings } = useQuery({
    ...convexQuery(api.userSettings.getOrCreate, {}),
    staleTime: STALE_TIME.STATIC,
  });
  const { data: accounts } = useQuery({
    ...convexQuery(api.accounts.list, {
      includeArchived: showArchived,
    }),
    staleTime: STALE_TIME.SEMI_STATIC,
  });
  const { data: balanceData } = useQuery({
    ...convexQuery(
      api.accounts.getTotalBalance,
      settings ? { baseCurrency: settings.baseCurrency } : "skip"
    ),
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  if (!(accounts && settings && balanceData)) {
    return <AccountsSkeleton />;
  }

  const activeAccounts = accounts.filter((a) => !a.isArchived);
  const archivedAccounts = accounts.filter((a) => a.isArchived);
  const totalBalance = balanceData.total;

  return (
    <div className="flex-1 space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Accounts</h1>
          <p className="text-muted-foreground text-sm">
            Manage your bank accounts, cards, and wallets
          </p>
        </div>
        <CreateAccountDialog />
      </div>

      {/* Total Balance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-medium text-sm">Total Balance</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            {formatCurrency(totalBalance, settings.baseCurrency)}
          </div>
          <p className="text-muted-foreground text-xs">
            Across {activeAccounts.length} active accounts
          </p>
        </CardContent>
      </Card>

      {/* Active Accounts */}
      <div>
        <h2 className="mb-4 font-semibold text-lg">Active Accounts</h2>
        {activeAccounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeAccounts.map((account) => (
              <AccountCard account={account} key={account._id} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No accounts yet</p>
              <CreateAccountDialog>
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first account
                </Button>
              </CreateAccountDialog>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Archived Accounts Toggle */}
      {archivedAccounts.length > 0 && (
        <div>
          <Button
            className="mb-4"
            onClick={() => setShowArchived(!showArchived)}
            variant="ghost"
          >
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? "Hide" : "Show"} Archived ({archivedAccounts.length}
            )
          </Button>
          {showArchived && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {archivedAccounts.map((account) => (
                <AccountCard account={account} isArchived key={account._id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AccountCard({
  account,
  isArchived = false,
}: {
  account: Doc<"accounts">;
  isArchived?: boolean;
}) {
  const archiveAccount = useMutation(api.accounts.archive);
  const unarchiveAccount = useMutation(api.accounts.unarchive);
  const removeAccount = useMutation(api.accounts.remove);

  const TypeIcon =
    ACCOUNT_TYPES.find((t) => t.value === account.type)?.icon || CreditCard;

  const handleArchive = async () => {
    try {
      await archiveAccount({ id: account._id });
      toast.success("Account archived");
    } catch {
      toast.error("Failed to archive account");
    }
  };

  const handleUnarchive = async () => {
    try {
      await unarchiveAccount({ id: account._id });
      toast.success("Account restored");
    } catch {
      toast.error("Failed to restore account");
    }
  };

  const handleDelete = async () => {
    try {
      await removeAccount({ id: account._id });
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  return (
    <Card className={isArchived ? "opacity-60" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <TypeIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{account.name}</CardTitle>
            <CardDescription className="capitalize">
              {account.type}
            </CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isArchived ? (
              <DropdownMenuItem onClick={handleUnarchive}>
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">
          {formatCurrency(account.balance, account.currency)}
        </div>
        <p className="text-muted-foreground text-xs">{account.currency}</p>
      </CardContent>
    </Card>
  );
}

const AccountFormSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Account name is required" })
  ),
  type: Schema.Literal("checking", "savings", "credit", "cash", "investment"),
  currency: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Currency is required" })
  ),
  balance: Schema.String,
});

function CreateAccountDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const createAccount = useMutation(api.accounts.create);

  const form = useForm({
    defaultValues: {
      name: "",
      type: "checking" as
        | "checking"
        | "savings"
        | "credit"
        | "cash"
        | "investment",
      currency: "USD",
      balance: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await createAccount({
          name: value.name,
          type: value.type,
          currency: value.currency,
          balance: value.balance ? Number.parseFloat(value.balance) : 0,
        });
        toast.success("Account created");
        setOpen(false);
        form.reset();
      } catch {
        toast.error("Failed to create account");
      }
    },
    validators: {
      onSubmit: Schema.standardSchemaV1(AccountFormSchema),
    },
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription>
            Add a new financial account to track.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., Main Checking"
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

          <form.Field name="type">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="type">Account Type</Label>
                <Select
                  items={ACCOUNT_TYPES.map((t) => ({
                    value: t.value,
                    label: t.label,
                  }))}
                  onValueChange={(val: string | null) =>
                    val &&
                    field.handleChange(
                      val as
                        | "checking"
                        | "savings"
                        | "credit"
                        | "cash"
                        | "investment"
                    )
                  }
                  value={field.state.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="currency">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  items={CURRENCIES}
                  onValueChange={(val: string | null) =>
                    val && field.handleChange(val)
                  }
                  value={field.state.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="balance">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="balance">Initial Balance</Label>
                <Input
                  id="balance"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={field.state.value}
                />
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
                  {state.isSubmitting ? "Creating..." : "Create Account"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AccountsSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-3 w-32" />
        </CardContent>
      </Card>
      <div>
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...new Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-1 h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-32" />
                <Skeleton className="mt-1 h-3 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
