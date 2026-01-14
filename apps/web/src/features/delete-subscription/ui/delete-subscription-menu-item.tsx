import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteSubscription } from "@/entities/subscription/api/use-delete-subscription";
import type { SubscriptionId } from "@/entities/subscription/types/subscription-id";
import { DropdownMenuItem } from "@/shared/ui/dropdown-menu";

interface DeleteSubscriptionMenuItemProps {
  subscriptionId: SubscriptionId;
}

export function DeleteSubscriptionMenuItem({
  subscriptionId,
}: DeleteSubscriptionMenuItemProps) {
  const deleteSubscription = useDeleteSubscription();

  const handleDelete = async () => {
    try {
      await deleteSubscription({ id: subscriptionId });
      toast.success("Subscription deleted");
    } catch {
      toast.error("Failed to delete subscription");
    }
  };

  return (
    <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </DropdownMenuItem>
  );
}
