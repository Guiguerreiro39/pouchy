import { Check } from "lucide-react";
import { toast } from "sonner";
import { useCompleteGoal } from "@/entities/goal/api/use-complete-goal";
import type { GoalId } from "@/entities/goal/types/goal-id";
import { DropdownMenuItem } from "@/shared/ui/dropdown-menu";

interface CompleteGoalMenuItemProps {
  goalId: GoalId;
}

export function CompleteGoalMenuItem({ goalId }: CompleteGoalMenuItemProps) {
  const completeGoal = useCompleteGoal();

  const handleMarkComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await completeGoal({ id: goalId });
      toast.success("Goal marked as complete");
    } catch {
      toast.error("Failed to complete goal");
    }
  };

  return (
    <DropdownMenuItem onClick={handleMarkComplete}>
      <Check className="mr-2 h-4 w-4" />
      Mark Complete
    </DropdownMenuItem>
  );
}
