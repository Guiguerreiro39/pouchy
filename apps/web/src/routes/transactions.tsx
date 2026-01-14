import { createFileRoute } from "@tanstack/react-router";

import {
  TransactionsPage,
  TransactionsPageSkeleton,
} from "@/pages/transactions/ui/transactions-page";
import { requireAuth } from "@/shared/lib/auth/require-auth";

export const Route = createFileRoute("/transactions")({
  component: TransactionsPage,
  pendingComponent: TransactionsPageSkeleton,
  beforeLoad: requireAuth,
});
