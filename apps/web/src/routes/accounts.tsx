import { createFileRoute } from "@tanstack/react-router";

import {
  AccountsPage,
  AccountsPageSkeleton,
} from "@/pages/accounts/ui/accounts-page";
import { requireAuth } from "@/shared/lib/auth/require-auth";

export const Route = createFileRoute("/accounts")({
  component: AccountsPage,
  pendingComponent: AccountsPageSkeleton,
  beforeLoad: requireAuth,
});
