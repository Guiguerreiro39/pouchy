import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { Schema } from "effect";
import {
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/investments")({
  component: RouteComponent,
});

const INVESTMENT_TYPES = [
  { value: "stock", label: "Stock" },
  { value: "etf", label: "ETF" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "mutual_fund", label: "Mutual Fund" },
  { value: "bond", label: "Bond" },
  { value: "real_estate", label: "Real Estate" },
  { value: "other", label: "Other" },
] as const;

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <Authenticated>
        <InvestmentsContent />
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
        <InvestmentsSkeleton />
      </AuthLoading>
    </>
  );
}

function InvestmentsContent() {
  const portfolio = useQuery(api.investments.getPortfolioSummary);

  if (!portfolio) {
    return <InvestmentsSkeleton />;
  }

  const isPositive = portfolio.totalGain >= 0;

  return (
    <div className="flex-1 space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Investments</h1>
          <p className="text-muted-foreground text-sm">
            Track your investment portfolio
          </p>
        </div>
        <CreateInvestmentDialog />
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency(portfolio.totalValue)}
            </div>
            <p className="text-muted-foreground text-xs">
              Cost basis: {formatCurrency(portfolio.totalCost)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">
              Total Gain/Loss
            </CardTitle>
            {isPositive ? (
              <ArrowUp className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`font-bold text-2xl ${isPositive ? "text-green-500" : "text-red-500"}`}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(portfolio.totalGain)}
            </div>
            <p
              className={`text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}
            >
              {isPositive ? "+" : ""}
              {formatPercent(portfolio.gainPercent)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {portfolio.investments.length}
            </div>
            <p className="text-muted-foreground text-xs">investments</p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings List */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>Your investment positions</CardDescription>
        </CardHeader>
        <CardContent>
          {portfolio.investments.length > 0 ? (
            <div className="space-y-4">
              {portfolio.investments.map((inv) => (
                <InvestmentItem investment={inv} key={inv.id} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No investments yet</p>
              <CreateInvestmentDialog>
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first investment
                </Button>
              </CreateInvestmentDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvestmentItem({
  investment,
}: {
  investment: {
    id: Id<"investments">;
    name: string;
    type: string;
    value: number;
    gain: number;
    gainPercent: number;
  };
}) {
  const removeInvestment = useMutation(api.investments.remove);
  const isPositive = investment.gain >= 0;

  const handleDelete = async () => {
    try {
      await removeInvestment({ id: investment.id });
      toast.success("Investment deleted");
    } catch {
      toast.error("Failed to delete investment");
    }
  };

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
            {formatCurrency(investment.value)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p
            className={`font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(investment.gain)}
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
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

const InvestmentFormSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Name is required" })
  ),
  type: Schema.Literal(
    "stock",
    "etf",
    "crypto",
    "mutual_fund",
    "bond",
    "real_estate",
    "other"
  ),
  symbol: Schema.String,
  quantity: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Quantity is required" })
  ),
  purchasePrice: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Purchase price is required" })
  ),
  currentPrice: Schema.String,
  purchaseDate: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Purchase date is required" })
  ),
});

function CreateInvestmentDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const createInvestment = useMutation(api.investments.create);

  const form = useForm({
    defaultValues: {
      name: "",
      type: "stock" as
        | "stock"
        | "etf"
        | "crypto"
        | "mutual_fund"
        | "bond"
        | "real_estate"
        | "other",
      symbol: "",
      quantity: "",
      purchasePrice: "",
      currentPrice: "",
      purchaseDate: new Date().toISOString().split("T")[0],
    },
    onSubmit: async ({ value }) => {
      try {
        await createInvestment({
          name: value.name,
          type: value.type,
          symbol: value.symbol || undefined,
          quantity: Number.parseFloat(value.quantity),
          purchasePrice: Number.parseFloat(value.purchasePrice),
          currentPrice: value.currentPrice
            ? Number.parseFloat(value.currentPrice)
            : undefined,
          currency: "USD",
          purchaseDate: new Date(value.purchaseDate).getTime(),
        });
        toast.success("Investment added");
        setOpen(false);
        form.reset();
      } catch {
        toast.error("Failed to add investment");
      }
    },
    validators: {
      onSubmit: Schema.standardSchemaV1(InvestmentFormSchema),
    },
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Investment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Investment</DialogTitle>
          <DialogDescription>
            Track a new investment position.
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
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., Apple Inc."
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="text-destructive text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Field name="symbol">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol (optional)</Label>
                  <Input
                    id="symbol"
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(e.target.value.toUpperCase())
                    }
                    placeholder="e.g., AAPL"
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="type">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  items={INVESTMENT_TYPES.map((t) => ({
                    value: t.value,
                    label: t.label,
                  }))}
                  onValueChange={(val: string | null) =>
                    val &&
                    field.handleChange(
                      val as
                        | "stock"
                        | "etf"
                        | "crypto"
                        | "mutual_fund"
                        | "bond"
                        | "real_estate"
                        | "other"
                    )
                  }
                  value={field.state.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select investment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="quantity">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    min="0"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="0"
                    step="any"
                    type="number"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="text-destructive text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Field name="purchasePrice">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    min="0"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="text-destructive text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="currentPrice">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="currentPrice">Current Price (optional)</Label>
                  <Input
                    id="currentPrice"
                    min="0"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Same as purchase"
                    step="0.01"
                    type="number"
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="purchaseDate">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="date"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="text-destructive text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

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
                  {state.isSubmitting ? "Adding..." : "Add Investment"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InvestmentsSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[...new Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...new Array(3)].map((_, i) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4"
                key={i}
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-1 h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
