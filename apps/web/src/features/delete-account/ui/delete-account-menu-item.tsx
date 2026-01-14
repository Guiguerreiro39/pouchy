import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteAccount } from "@/entities/account/api/use-delete-account";
import type { AccountId } from "@/entities/account/types/account-id";
import { DropdownMenuItem } from "@/shared/ui/dropdown-menu";

interface DeleteAccountMenuItemProps {
  accountId: AccountId;
}

export function DeleteAccountMenuItem({
  accountId,
}: DeleteAccountMenuItemProps) {
  const deleteAccount = useDeleteAccount();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await deleteAccount({ id: accountId });
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
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
