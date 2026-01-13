import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import {
  Activity,
  ArrowUpRight,
  type LucideIcon,
  RefreshCcw,
  Target,
  Trash2,
  TrendingUp,
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
import { STALE_TIME } from "@/lib/query";

function getActivityIcon(type: string, entityType: string): LucideIcon {
  if (type.startsWith("delete_")) {
    return Trash2;
  }

  switch (entityType) {
    case "account":
      return Wallet;
    case "transaction":
      return ArrowUpRight; // Default, logic can be refined if we had transaction type in metadata
    case "investment":
      return TrendingUp;
    case "goal":
      return Target;
    case "subscription":
      return RefreshCcw;
    default:
      return Activity;
  }
}

function getActivityColor(type: string, entityType: string): string {
  if (type.startsWith("delete_")) {
    return "text-red-500 bg-red-500/10";
  }

  switch (entityType) {
    case "account":
      return "text-blue-500 bg-blue-500/10";
    case "transaction":
      return "text-green-500 bg-green-500/10";
    case "investment":
      return "text-purple-500 bg-purple-500/10";
    case "goal":
      return "text-amber-500 bg-amber-500/10";
    case "subscription":
      return "text-orange-500 bg-orange-500/10";
    default:
      return "text-primary bg-primary/10";
  }
}

function formatActivityDescription(description: string) {
  // Simple heuristic to bold the entity name if it's at the end
  // "Created account Main Checking" -> "Created account **Main Checking**"
  const parts = description.split(" ");
  if (parts.length > 2) {
    const action = parts.slice(0, 2).join(" ");
    const rest = parts.slice(2).join(" ");
    return (
      <span>
        {action} <span className="font-medium text-foreground">{rest}</span>
      </span>
    );
  }
  return description;
}

export function ActivityPopover() {
  const { data: activities } = useQuery({
    ...convexQuery(api.activities.get, { limit: 20 }),
    staleTime: STALE_TIME.REALTIME,
  });

  return (
    <Popover>
      <PopoverTrigger>
        <Button className="relative h-9 w-9" size="icon" variant="outline">
          <Activity className="h-4 w-4" />
          <span className="sr-only">Toggle activity feed</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold text-sm">Activity</h4>
          <span className="text-muted-foreground text-xs">Recent actions</span>
        </div>
        <ScrollArea className="h-[320px]">
          {(() => {
            if (!activities) {
              return (
                <div className="flex h-[100px] items-center justify-center text-muted-foreground text-sm">
                  Loading...
                </div>
              );
            }

            if (activities.length === 0) {
              return (
                <div className="flex h-[100px] items-center justify-center text-muted-foreground text-sm">
                  No recent activity
                </div>
              );
            }

            return (
              <div className="flex flex-col">
                {activities.map((activity) => {
                  const Icon = getActivityIcon(
                    activity.type,
                    activity.entityType
                  );
                  const colorClass = getActivityColor(
                    activity.type,
                    activity.entityType
                  );

                  return (
                    <div
                      className="flex gap-3 border-b px-4 py-3 transition-colors last:border-0 hover:bg-muted/50"
                      key={activity._id}
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="text-muted-foreground text-sm leading-snug">
                          {formatActivityDescription(activity.description)}
                        </p>
                        <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
                          {formatRelativeDate(activity.timestamp)}
                        </span>
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
