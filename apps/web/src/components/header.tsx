import { Link } from "@tanstack/react-router";
import { Authenticated } from "convex/react";
import {
  CreditCard,
  LayoutDashboard,
  Receipt,
  Settings,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import UserMenu from "./user-menu";

export default function Header() {
  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/accounts", label: "Accounts", icon: CreditCard },
    { to: "/transactions", label: "Transactions", icon: Receipt },
    { to: "/subscriptions", label: "Subscriptions", icon: CreditCard },
    { to: "/investments", label: "Investments", icon: TrendingUp },
    { to: "/goals", label: "Goals", icon: Target },
  ] as const;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        <Link className="flex items-center gap-2 font-semibold" to="/">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="text-lg">Pouchy</span>
        </Link>

        <Authenticated>
          <nav className="ml-8 flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                className="flex items-center gap-2 rounded-md px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
                key={to}
                to={to}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </Authenticated>

        <div className="ml-auto flex items-center gap-2">
          <Authenticated>
            <Link
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              to="/settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <UserMenu />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}
