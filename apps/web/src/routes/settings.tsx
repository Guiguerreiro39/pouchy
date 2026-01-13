import { convexQuery } from "@convex-dev/react-query";
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
import { Bell, DollarSign, Settings, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { STALE_TIME } from "@/lib/query";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
  pendingComponent: SettingsSkeleton,
});

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

const DATE_RANGES = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
  { value: 60, label: "Last 60 days" },
  { value: 90, label: "Last 90 days" },
];

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <Authenticated>
        <SettingsContent />
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
        <SettingsSkeleton />
      </AuthLoading>
    </>
  );
}

function SettingsContent() {
  const { data: settings } = useQuery({
    ...convexQuery(api.userSettings.getOrCreate, {}),
    staleTime: STALE_TIME.STATIC,
  });
  const { data: accounts } = useQuery({
    ...convexQuery(api.accounts.list, {}),
    staleTime: STALE_TIME.SEMI_STATIC,
  });
  const updateSettings = useMutation(api.userSettings.update);

  if (!(settings && accounts)) {
    return <SettingsSkeleton />;
  }

  const handleCurrencyChange = async (currency: string) => {
    try {
      await updateSettings({ baseCurrency: currency });
      toast.success("Currency updated");
    } catch {
      toast.error("Failed to update currency");
    }
  };

  const handleDefaultAccountChange = async (accountId: string) => {
    try {
      await updateSettings({ defaultAccountId: accountId as Id<"accounts"> });
      toast.success("Default account updated");
    } catch {
      toast.error("Failed to update default account");
    }
  };

  const handleDateRangeChange = async (days: string) => {
    try {
      await updateSettings({ dashboardDateRange: Number.parseInt(days, 10) });
      toast.success("Dashboard date range updated");
    } catch {
      toast.error("Failed to update date range");
    }
  };

  const handleNotificationsChange = async (enabled: boolean) => {
    try {
      await updateSettings({ notificationsEnabled: enabled });
      toast.success(
        enabled ? "Notifications enabled" : "Notifications disabled"
      );
    } catch {
      toast.error("Failed to update notifications");
    }
  };

  const handleEmailNotificationsChange = async (enabled: boolean) => {
    try {
      await updateSettings({ emailNotifications: enabled });
      toast.success(
        enabled ? "Email notifications enabled" : "Email notifications disabled"
      );
    } catch {
      toast.error("Failed to update email notifications");
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Customize your preferences and notifications
        </p>
      </div>

      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Currency</CardTitle>
          </div>
          <CardDescription>
            Set your base currency for calculations and display
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="currency">Base Currency</Label>
            <Select
              items={CURRENCIES}
              onValueChange={(val: string | null) =>
                val && handleCurrencyChange(val)
              }
              value={settings.baseCurrency || "USD"}
            >
              <SelectTrigger className="w-[200px]">
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
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <CardTitle>Accounts</CardTitle>
          </div>
          <CardDescription>
            Configure your default account for transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="defaultAccount">Default Account</Label>
            <Select
              items={accounts.map((a) => ({ value: a._id, label: a.name }))}
              onValueChange={(val: string | null) =>
                val && handleDefaultAccountChange(val)
              }
              value={settings.defaultAccountId || ""}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Dashboard</CardTitle>
          </div>
          <CardDescription>Customize your dashboard experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dateRange">Default Date Range</Label>
            <Select
              items={DATE_RANGES.map((r) => ({
                value: r.value.toString(),
                label: r.label,
              }))}
              onValueChange={(val: string | null) =>
                val && handleDateRangeChange(val)
              }
              value={settings.dashboardDateRange.toString()}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value.toString()}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">In-App Notifications</Label>
              <p className="text-muted-foreground text-xs">
                Receive notifications within the app
              </p>
            </div>
            <Checkbox
              checked={settings.notificationsEnabled}
              id="notifications"
              onCheckedChange={handleNotificationsChange}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-muted-foreground text-xs">
                Receive important updates via email
              </p>
            </div>
            <Checkbox
              checked={settings.emailNotifications}
              id="emailNotifications"
              onCheckedChange={handleEmailNotificationsChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-4 lg:p-6">
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      {[...new Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-[200px]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
