import { createFileRoute } from "@tanstack/react-router";

import {
  DashboardPage,
  DashboardPageSkeleton,
} from "@/pages/dashboard/ui/dashboard-page";
import { requireAuth } from "@/shared/lib/auth/require-auth";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  pendingComponent: DashboardPageSkeleton,
  beforeLoad: requireAuth,
});
