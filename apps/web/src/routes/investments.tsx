import { createFileRoute } from "@tanstack/react-router";

import {
  InvestmentsPage,
  InvestmentsPageSkeleton,
} from "@/pages/investments/ui/investments-page";
import { requireAuth } from "@/shared/lib/auth/require-auth";

export const Route = createFileRoute("/investments")({
  component: InvestmentsPage,
  pendingComponent: InvestmentsPageSkeleton,
  beforeLoad: requireAuth,
});
