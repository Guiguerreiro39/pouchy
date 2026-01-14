import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import type { Doc } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
  Archive,
  ArchiveRestore,
  CreditCard,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { ACCOUNT_TYPES } from "@/entities/account/config/account-types";
import { DeleteAccountMenuItem } from "@/features/delete-account/ui/delete-account-menu-item";
import { formatCurrency } from "@/shared/lib/format/currency";
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

interface AccountCardProps {
  account: Doc<"accounts">;
  isArchived?: boolean;
}

export function AccountCard({ account, isArchived = false }: AccountCardProps) {
  const archiveAccount = useMutation(api.accounts.archive);
  const unarchiveAccount = useMutation(api.accounts.unarchive);

  const TypeIcon =
    ACCOUNT_TYPES.find((t) => t.value === account.type)?.icon || CreditCard;

  const handleArchive = async () => {
    try {
      await archiveAccount({ id: account._id });
      toast.success("Account archived");
    } catch {
      toast.error("Failed to archive account");
    }
  };

  const handleUnarchive = async () => {
    try {
      await unarchiveAccount({ id: account._id });
      toast.success("Account restored");
    } catch {
      toast.error("Failed to restore account");
    }
  };

  return (
    <Card className={isArchived ? "opacity-60" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <TypeIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{account.name}</CardTitle>
            <CardDescription className="capitalize">
              {account.type}
            </CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isArchived ? (
              <DropdownMenuItem onClick={handleUnarchive}>
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            )}
            <DeleteAccountMenuItem accountId={account._id} />
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">
          {formatCurrency(account.balance, account.currency)}
        </div>
        <p className="text-muted-foreground text-xs">{account.currency}</p>
      </CardContent>
    </Card>
  );
}
