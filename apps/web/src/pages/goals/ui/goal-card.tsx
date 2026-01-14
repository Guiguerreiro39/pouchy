import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import { MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";

import { CompleteGoalMenuItem } from "@/features/complete-goal/ui/complete-goal-menu-item";
import { DeleteGoalMenuItem } from "@/features/delete-goal/ui/delete-goal-menu-item";
import { AddGoalProgressForm } from "@/features/update-goal-progress/ui/add-goal-progress-form";
import { formatCurrency } from "@/shared/lib/format/currency";
import { formatDate } from "@/shared/lib/format/date";
import { formatPercent } from "@/shared/lib/format/percent";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Progress } from "@/shared/ui/progress";

interface GoalCardProps {
  goal: {
    _id: Id<"goals">;
    name: string;
    targetAmount: number;
    currentAmount: number;
    currency: string;
    targetDate?: number;
    icon?: string;
    color?: string;
  };
  isCompleted?: boolean;
}

export function GoalCard({ goal, isCompleted = false }: GoalCardProps) {
  const [showAddProgress, setShowAddProgress] = useState(false);

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <Card className={isCompleted ? "opacity-60" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{goal.icon || "🎯"}</span>
          <div>
            <CardTitle className="text-base">{goal.name}</CardTitle>
            {goal.targetDate && (
              <CardDescription>
                Target: {formatDate(goal.targetDate)}
              </CardDescription>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isCompleted && (
              <>
                <DropdownMenuItem onClick={() => setShowAddProgress(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Progress
                </DropdownMenuItem>
                <CompleteGoalMenuItem goalId={goal._id} />
              </>
            )}
            <DeleteGoalMenuItem goalId={goal._id} />
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <span className="font-bold text-xl">
            {formatCurrency(goal.currentAmount, goal.currency)}
          </span>
          <span className="text-muted-foreground text-sm">
            of {formatCurrency(goal.targetAmount, goal.currency)}
          </span>
        </div>
        <Progress className="mt-2" value={Math.min(progress, 100)} />
        <div className="mt-2 flex items-center justify-between text-muted-foreground text-xs">
          <span>{formatPercent(progress)} complete</span>
          {!isCompleted && remaining > 0 && (
            <span>{formatCurrency(remaining, goal.currency)} to go</span>
          )}
          {isCompleted && (
            <Badge className="bg-green-500" variant="default">
              Completed
            </Badge>
          )}
        </div>

        {/* Add Progress Form */}
        {showAddProgress && (
          <AddGoalProgressForm
            goalId={goal._id}
            onCancel={() => setShowAddProgress(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}
