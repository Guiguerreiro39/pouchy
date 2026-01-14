import { createFileRoute } from "@tanstack/react-router";

import {
  SettingsPage,
  SettingsPageSkeleton,
} from "@/pages/settings/ui/settings-page";
import { requireAuth } from "@/shared/lib/auth/require-auth";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  pendingComponent: SettingsPageSkeleton,
  beforeLoad: requireAuth,
});
