import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteGoal } from "@/entities/goal/api/use-delete-goal";
import type { GoalId } from "@/entities/goal/types/goal-id";
import { DropdownMenuItem } from "@/shared/ui/dropdown-menu";

interface DeleteGoalMenuItemProps {
  goalId: GoalId;
}

export function DeleteGoalMenuItem({ goalId }: DeleteGoalMenuItemProps) {
  const deleteGoal = useDeleteGoal();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await deleteGoal({ id: goalId });
      toast.success("Goal deleted");
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  return (
    <DropdownMenuItem
      className="text-destructive focus:text-destructive"
      onClick={handleDelete}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </DropdownMenuItem>
  );
}
