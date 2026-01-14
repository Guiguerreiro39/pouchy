import { createFileRoute } from "@tanstack/react-router";

import { GoalsPage, GoalsPageSkeleton } from "@/pages/goals/ui/goals-page";
import { requireAuth } from "@/shared/lib/auth/require-auth";

export const Route = createFileRoute("/goals")({
  component: GoalsPage,
  pendingComponent: GoalsPageSkeleton,
  beforeLoad: requireAuth,
});
