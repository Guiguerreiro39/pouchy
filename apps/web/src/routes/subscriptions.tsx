import { createFileRoute } from "@tanstack/react-router";

import {
  SubscriptionsPage,
  SubscriptionsPageSkeleton,
} from "@/pages/subscriptions/ui/subscriptions-page";
import { requireAuth } from "@/shared/lib/auth/require-auth";

export const Route = createFileRoute("/subscriptions")({
  component: SubscriptionsPage,
  pendingComponent: SubscriptionsPageSkeleton,
  beforeLoad: requireAuth,
});
