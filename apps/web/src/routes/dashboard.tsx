import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
} from "convex/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  RefreshCcw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import OnboardingWizard from "@/components/onboarding-wizard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
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

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  pendingComponent: DashboardSkeleton,
});

function RouteComponent() {
  return (
    <>
      <Authenticated>
        <DashboardContent />
      </Authenticated>
      <Unauthenticated>
        {/* Redirect to login if not authenticated */}
        <div className="flex min-h-screen items-center justify-center">
          <meta content="0;url=/login" httpEquiv="refresh" />
          {/* Fallback/loading while redirecting */}
        </div>
      </Unauthenticated>
      <AuthLoading>
        <DashboardSkeleton />
      </AuthLoading>
    </>
  );
}

function DashboardContent() {
  const { data: settings } = useQuery({
    ...convexQuery(api.userSettings.getOrCreate, {}),
    staleTime: STALE_TIME.STATIC,
  });
  const { data: summary } = useQuery({
    ...convexQuery(
      api.dashboard.getSummary,
      settings ? { days: 30, baseCurrency: settings.baseCurrency } : "skip"
    ),
    staleTime: STALE_TIME.DYNAMIC,
  });
  const seedCategories = useMutation(api.categories.seedDefaultCategories);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Seed categories on first load
  useEffect(() => {
    seedCategories();
  }, [seedCategories]);

  // Check if onboarding should be shown
  useEffect(() => {
    if (settings && !settings.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [settings]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  if (!(summary && settings)) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      {/* Onboarding Wizard */}
      {showOnboarding && settings && (
        <OnboardingWizard
          initialStep={settings.onboardingStep ?? 0}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Dashboard Content */}
      <div className="flex-1 space-y-6 p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Your financial overview at a glance
            </p>
          </div>
          <p className="text-muted-foreground text-sm">Last 30 days</p>
        </div>

        {/* Balance Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-medium text-sm">
                Total Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {formatCurrency(summary.totalBalance, settings.baseCurrency)}
              </div>
              <p className="text-muted-foreground text-xs">
                Across {summary.accountBalances.length} accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-medium text-sm">Income</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-green-500">
                +{formatCurrency(summary.totalIncome, settings.baseCurrency)}
              </div>
              <p className="text-muted-foreground text-xs">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-medium text-sm">Expenses</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-red-500">
                -{formatCurrency(summary.totalExpenses, settings.baseCurrency)}
              </div>
              <p className="text-muted-foreground text-xs">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-medium text-sm">Net Change</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`font-bold text-2xl ${
                  summary.netChange >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {summary.netChange >= 0 ? "+" : ""}
                {formatCurrency(summary.netChange, settings.baseCurrency)}
              </div>
              <p className="text-muted-foreground text-xs">This month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-7">
          {/* Spending by Category */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Where your money goes</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.spendingByCategory.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <div className="h-[200px]">
                    <ResponsiveContainer height="100%" width="100%">
                      <PieChart>
                        <Pie
                          cx="50%"
                          cy="50%"
                          data={
                            summary.spendingByCategory as unknown as Record<
                              string,
                              unknown
                            >[]
                          }
                          dataKey="amount"
                          innerRadius={60}
                          nameKey="name"
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {summary.spendingByCategory.map((entry, index) => (
                            <Cell fill={entry.color} key={index} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload?.[0]) {
                              const data = payload[0].payload;
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <span>{data.icon}</span>
                                    <span className="font-medium">
                                      {data.name}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground text-sm">
                                    {formatCurrency(
                                      data.amount,
                                      settings.baseCurrency
                                    )}{" "}
                                    ({formatPercent(data.percentage)})
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {summary.spendingByCategory.slice(0, 5).map((cat) => (
                      <div
                        className="flex items-center gap-2"
                        key={cat.categoryId}
                      >
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="flex-1 text-sm">{cat.name}</span>
                        <span className="font-medium text-sm">
                          {formatCurrency(cat.amount, settings.baseCurrency)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatPercent(cat.percentage)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  No spending data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {summary.recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {summary.recentTransactions.map((tx) => (
                      <div className="flex items-center gap-4" key={tx._id}>
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${getTransactionBgClass(tx.type)}`}
                        >
                          <TransactionIcon type={tx.type} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-sm leading-none">
                            {tx.description}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatDate(tx.date)}
                          </p>
                        </div>
                        <div
                          className={`font-medium text-sm ${getTransactionTextClass(tx.type)}`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {formatCurrency(tx.amount, tx.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                    No transactions yet
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Account Balances */}
          <Card>
            <CardHeader>
              <CardTitle>Accounts</CardTitle>
              <CardDescription>Your account balances</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.accountBalances.length > 0 ? (
                <div className="space-y-4">
                  {summary.accountBalances.map((account) => (
                    <div className="flex items-center gap-4" key={account.id}>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{account.name}</p>
                        <p className="text-muted-foreground text-xs capitalize">
                          {account.type}
                        </p>
                      </div>
                      <p className="font-medium text-sm">
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[150px] items-center justify-center text-muted-foreground">
                  No accounts yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Renewals</CardTitle>
              <CardDescription>Subscriptions due in 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.upcomingSubscriptions.length > 0 ? (
                <div className="space-y-4">
                  {summary.upcomingSubscriptions.map((sub) => (
                    <div className="flex items-center gap-4" key={sub._id}>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10">
                        <DollarSign className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{sub.name}</p>
                        <p className="text-muted-foreground text-xs">
                          Due {formatDate(sub.nextRenewalDate)}
                        </p>
                      </div>
                      <p className="font-medium text-sm">
                        {formatCurrency(sub.amount, sub.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[150px] items-center justify-center text-muted-foreground">
                  No upcoming renewals
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...new Array(4)].map((_, i) => (
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
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...new Array(5)].map((_, i) => (
                <div className="flex items-center gap-4" key={i}>
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
