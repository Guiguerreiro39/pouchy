import { Bell } from "lucide-react";
import { toast } from "sonner";

import { useUpdateSettings } from "@/entities/user-settings/api/use-update-settings";
import { useUserSettings } from "@/entities/user-settings/api/use-user-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";

export function NotificationsForm() {
  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateSettings();

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleNotificationsChange = async (enabled: boolean) => {
    try {
      await updateSettings({ notificationsEnabled: enabled });
      toast.success(
        enabled ? "Notifications enabled" : "Notifications disabled"
      );
    } catch {
      toast.error("Failed to update notifications");
    }
  };

  const handleEmailNotificationsChange = async (enabled: boolean) => {
    try {
      await updateSettings({ emailNotifications: enabled });
      toast.success(
        enabled ? "Email notifications enabled" : "Email notifications disabled"
      );
    } catch {
      toast.error("Failed to update email notifications");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Notifications</CardTitle>
        </div>
        <CardDescription>Manage how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">In-App Notifications</Label>
            <p className="text-muted-foreground text-xs">
              Receive notifications within the app
            </p>
          </div>
          <Checkbox
            checked={settings.notificationsEnabled}
            id="notifications"
            onCheckedChange={handleNotificationsChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailNotifications">Email Notifications</Label>
            <p className="text-muted-foreground text-xs">
              Receive important updates via email
            </p>
          </div>
          <Checkbox
            checked={settings.emailNotifications}
            id="emailNotifications"
            onCheckedChange={handleEmailNotificationsChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
