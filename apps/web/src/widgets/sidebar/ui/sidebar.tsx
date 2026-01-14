import { Link } from "@tanstack/react-router";
import { Authenticated } from "convex/react";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Target,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";

import { useCurrentUser } from "@/entities/user/api/use-current-user";
import { authClient } from "@/shared/config/auth-client";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Separator } from "@/shared/ui/separator";

const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/accounts", label: "Accounts", icon: CreditCard },
  { to: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/investments", label: "Investments", icon: TrendingUp },
  { to: "/goals", label: "Goals", icon: Target },
] as const;

const bottomLinks = [
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center border-b bg-sidebar px-4 lg:hidden">
        <Button
          className="mr-2"
          onClick={() => setMobileOpen(true)}
          size="icon"
          variant="ghost"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link className="flex items-center gap-2 font-semibold" to="/">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="text-lg">Pouchy</span>
        </Link>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
          type="button"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-svh w-56 flex-col border-r bg-sidebar transition-transform duration-200 lg:relative lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button for mobile */}
        <div className="absolute top-3 right-3 lg:hidden">
          <Button
            onClick={() => setMobileOpen(false)}
            size="icon"
            variant="ghost"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Logo */}
        <div className="flex h-14 items-center gap-2 px-4">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Pouchy</span>
        </div>

        <Separator />

        {/* Main navigation */}
        <Authenticated>
          <nav className="flex-1 space-y-1 p-2">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sidebar-foreground/70 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
                key={to}
                onClick={() => setMobileOpen(false)}
                to={to}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto">
            <Separator />

            {/* Bottom links */}
            <div className="space-y-1 p-2">
              {bottomLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sidebar-foreground/70 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
                  key={to}
                  onClick={() => setMobileOpen(false)}
                  to={to}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            <Separator />

            {/* User profile */}
            <SidebarUser />
          </div>
        </Authenticated>
      </aside>

      {/* Spacer for mobile header */}
      <div className="h-14 lg:hidden" />
    </>
  );
}

function SidebarUser() {
  const { data: user } = useCurrentUser();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent"
            type="button"
          >
            <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-medium text-sm">{user?.name}</p>
              <p className="truncate text-muted-foreground text-xs">
                {user?.email}
              </p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      location.reload();
                    },
                  },
                });
              }}
              variant="destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
