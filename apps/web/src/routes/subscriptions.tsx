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
  Calendar,
  DollarSign,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatCurrency, formatDate } from "@/lib/format";

type SubscriptionStatus = "active" | "paused" | "cancelled";

function getStatusBadgeVariant(
  status: SubscriptionStatus
): "default" | "secondary" | "outline" {
  if (status === "active") {
    return "default";
  }
  if (status === "paused") {
    return "secondary";
  }
  return "outline";
}

export const Route = createFileRoute("/subscriptions")({
  component: RouteComponent,
});

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const;

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <Authenticated>
        <SubscriptionsContent />
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
        <SubscriptionsSkeleton />
      </AuthLoading>
    </>
  );
}

function SubscriptionsContent() {
  const subscriptions = useQuery(api.subscriptions.list, {});
  const totalMonthly = useQuery(api.subscriptions.getTotalMonthly);
  const accounts = useQuery(api.accounts.list, {});
  const categories = useQuery(api.categories.list);

  if (
    !(subscriptions && accounts && categories) ||
    totalMonthly === undefined
  ) {
    return <SubscriptionsSkeleton />;
  }

  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const pausedCount = subscriptions.filter((s) => s.status === "paused").length;

  return (
    <div className="flex-1 space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground text-sm">
            Track your recurring payments
          </p>
        </div>
        <CreateSubscriptionDialog accounts={accounts} categories={categories} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency(totalMonthly)}
            </div>
            <p className="text-muted-foreground text-xs">per month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">Active</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{activeCount}</div>
            <p className="text-muted-foreground text-xs">subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">Paused</CardTitle>
            <Pause className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{pausedCount}</div>
            <p className="text-muted-foreground text-xs">subscriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length > 0 ? (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <SubscriptionItem key={sub._id} subscription={sub} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No subscriptions yet</p>
              <CreateSubscriptionDialog
                accounts={accounts}
                categories={categories}
              >
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first subscription
                </Button>
              </CreateSubscriptionDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionItem({
  subscription,
}: {
  subscription: {
    _id: Id<"subscriptions">;
    name: string;
    amount: number;
    currency: string;
    frequency: string;
    status: "active" | "paused" | "cancelled";
    nextRenewalDate: number;
  };
}) {
  const pauseSub = useMutation(api.subscriptions.pause);
  const resumeSub = useMutation(api.subscriptions.resume);
  const cancelSub = useMutation(api.subscriptions.cancel);
  const removeSub = useMutation(api.subscriptions.remove);

  const handlePause = async () => {
    try {
      await pauseSub({ id: subscription._id });
      toast.success("Subscription paused");
    } catch {
      toast.error("Failed to pause subscription");
    }
  };

  const handleResume = async () => {
    try {
      await resumeSub({ id: subscription._id });
      toast.success("Subscription resumed");
    } catch {
      toast.error("Failed to resume subscription");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSub({ id: subscription._id });
      toast.success("Subscription cancelled");
    } catch {
      toast.error("Failed to cancel subscription");
    }
  };

  const handleDelete = async () => {
    try {
      await removeSub({ id: subscription._id });
      toast.success("Subscription deleted");
    } catch {
      toast.error("Failed to delete subscription");
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{subscription.name}</p>
            <Badge variant={getStatusBadgeVariant(subscription.status)}>
              {subscription.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {formatCurrency(subscription.amount, subscription.currency)} /{" "}
            {subscription.frequency}
          </p>
          {subscription.status === "active" && (
            <p className="text-muted-foreground text-xs">
              Next: {formatDate(subscription.nextRenewalDate)}
            </p>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {subscription.status === "active" && (
            <DropdownMenuItem onClick={handlePause}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </DropdownMenuItem>
          )}
          {subscription.status === "paused" && (
            <DropdownMenuItem onClick={handleResume}>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </DropdownMenuItem>
          )}
          {subscription.status !== "cancelled" && (
            <DropdownMenuItem onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const SubscriptionFormSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Name is required" })
  ),
  accountId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Account is required" })
  ),
  categoryId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Category is required" })
  ),
  amount: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Amount is required" })
  ),
  frequency: Schema.Literal(
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    "yearly"
  ),
  startDate: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Start date is required" })
  ),
});

function CreateSubscriptionDialog({
  accounts,
  categories,
  children,
}: {
  accounts: Array<{ _id: Id<"accounts">; name: string; currency: string }>;
  categories: Array<{ _id: Id<"categories">; name: string; icon: string }>;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const createSubscription = useMutation(api.subscriptions.create);

  const form = useForm({
    defaultValues: {
      name: "",
      accountId: "",
      categoryId: "",
      amount: "",
      frequency: "monthly" as
        | "daily"
        | "weekly"
        | "monthly"
        | "quarterly"
        | "yearly",
      startDate: new Date().toISOString().split("T")[0],
    },
    onSubmit: async ({ value }) => {
      const selectedAccount = accounts.find((a) => a._id === value.accountId);
      try {
        await createSubscription({
          name: value.name,
          accountId: value.accountId as Id<"accounts">,
          categoryId: value.categoryId as Id<"categories">,
          amount: Number.parseFloat(value.amount),
          currency: selectedAccount?.currency || "USD",
          frequency: value.frequency,
          startDate: new Date(value.startDate).getTime(),
        });
        toast.success("Subscription created");
        setOpen(false);
        form.reset();
      } catch {
        toast.error("Failed to create subscription");
      }
    },
    validators: {
      onSubmit: Schema.standardSchemaV1(SubscriptionFormSchema),
    },
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {children || (
          <Button disabled={accounts.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Subscription</DialogTitle>
          <DialogDescription>
            Track a recurring payment or subscription.
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
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., Netflix"
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

          <form.Field name="accountId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="account">Account</Label>
                <Select
                  items={accounts.map((a) => ({
                    value: a._id,
                    label: `${a.name} (${a.currency})`,
                  }))}
                  onValueChange={(val: string | null) =>
                    val && field.handleChange(val)
                  }
                  value={field.state.value || undefined}
                >
                  <SelectTrigger>
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

          <form.Field name="categoryId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  items={categories.map((c) => ({
                    value: c._id,
                    label: `${c.icon} ${c.name}`,
                  }))}
                  onValueChange={(val: string | null) =>
                    val && field.handleChange(val)
                  }
                  value={field.state.value || undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
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

          <div className="grid grid-cols-2 gap-4">
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

            <form.Field name="frequency">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    items={FREQUENCIES.map((f) => ({
                      value: f.value,
                      label: f.label,
                    }))}
                    onValueChange={(val: string | null) =>
                      val &&
                      field.handleChange(
                        val as
                          | "daily"
                          | "weekly"
                          | "monthly"
                          | "quarterly"
                          | "yearly"
                      )
                    }
                    value={field.state.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="startDate">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
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
                  {state.isSubmitting ? "Adding..." : "Add Subscription"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubscriptionsSkeleton() {
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
          <Skeleton className="h-5 w-40" />
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
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
