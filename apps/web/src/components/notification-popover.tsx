import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import type { Doc } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCheck,
  type LucideIcon,
  RefreshCcw,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeDate } from "@/lib/format";

type NotificationType = Doc<"notifications">["type"];

function getNotificationIcon(type: NotificationType): LucideIcon {
  switch (type) {
    case "subscription_renewal":
      return RefreshCcw;
    case "goal_reached":
      return Target;
    case "budget_exceeded":
      return Wallet;
    default:
      return AlertCircle;
  }
}

function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case "subscription_renewal":
      return "text-orange-500 bg-orange-500/10";
    case "goal_reached":
      return "text-green-500 bg-green-500/10";
    case "budget_exceeded":
      return "text-red-500 bg-red-500/10";
    default:
      return "text-blue-500 bg-blue-500/10";
  }
}

export function NotificationPopover() {
  const notifications = useQuery(api.notifications.list, {});
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const removeNotification = useMutation(api.notifications.remove);

  const hasUnread = (unreadCount ?? 0) > 0;

  return (
    <Popover>
      <PopoverTrigger>
        <Button className="relative h-9 w-9" size="icon" variant="outline">
          <Bell className="h-4 w-4" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary font-medium text-[10px] text-primary-foreground">
              {unreadCount && unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {hasUnread && (
            <Button
              className="h-7 gap-1 text-xs"
              onClick={() => markAllAsRead()}
              size="sm"
              variant="ghost"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[320px]">
          {(() => {
            if (!notifications) {
              return (
                <div className="flex h-[100px] items-center justify-center text-muted-foreground text-sm">
                  Loading...
                </div>
              );
            }

            if (notifications.length === 0) {
              return (
                <div className="flex h-[100px] flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Bell className="h-8 w-8 opacity-40" />
                  No notifications
                </div>
              );
            }

            return (
              <div className="flex flex-col">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const colorClass = getNotificationColor(notification.type);

                  return (
                    <div
                      className={`group relative flex gap-3 border-b px-4 py-3 transition-colors last:border-0 hover:bg-muted/50 ${
                        notification.isRead ? "" : "bg-muted/30"
                      }`}
                      key={notification._id}
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="font-medium text-sm leading-snug">
                          {notification.title}
                        </p>
                        <p className="text-muted-foreground text-xs leading-snug">
                          {notification.message}
                        </p>
                        <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
                          {formatRelativeDate(notification.createdAt)}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {!notification.isRead && (
                          <Button
                            className="h-6 w-6"
                            onClick={() => markAsRead({ id: notification._id })}
                            size="icon"
                            title="Mark as read"
                            variant="ghost"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() =>
                            removeNotification({ id: notification._id })
                          }
                          size="icon"
                          title="Delete"
                          variant="ghost"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
