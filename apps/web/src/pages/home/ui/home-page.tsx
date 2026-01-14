import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import {
  ArrowRight,
  CreditCard,
  PieChart,
  RefreshCcw,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/shared/ui/button";

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Wallet className="h-12 w-12 text-primary" />
          <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
            Pouchy
          </h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Your personal financial companion. Track expenses, manage
          subscriptions, monitor investments, and achieve your financial goals.
        </p>
        <div className="mt-8 flex gap-4">
          <Authenticated>
            <Link to="/dashboard">
              <Button size="lg">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Authenticated>
          <Unauthenticated>
            <Link to="/dashboard">
              <Button size="lg">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Unauthenticated>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-bold text-2xl">
            Everything you need to manage your finances
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              description="Manage multiple accounts across currencies. Track balances in real-time."
              icon={CreditCard}
              title="Account Tracking"
            />
            <FeatureCard
              description="Visualize spending by category. Understand where your money goes."
              icon={PieChart}
              title="Expense Analytics"
            />
            <FeatureCard
              description="Track recurring payments. Get notified before renewals."
              icon={RefreshCcw}
              title="Subscription Manager"
            />
            <FeatureCard
              description="Monitor your investments. Track gains and losses over time."
              icon={TrendingUp}
              title="Investment Portfolio"
            />
            <FeatureCard
              description="Set savings goals. Track progress and celebrate achievements."
              icon={Target}
              title="Financial Goals"
            />
            <FeatureCard
              description="Support for multiple currencies with automatic conversion."
              icon={Wallet}
              title="Multi-Currency"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
