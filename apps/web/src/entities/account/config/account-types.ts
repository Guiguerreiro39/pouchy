import { CreditCard, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import type { AccountType } from "../types/account-id";

export const ACCOUNT_TYPES: {
  value: AccountType;
  label: string;
  icon: typeof CreditCard;
}[] = [
  { value: "checking", label: "Checking", icon: CreditCard },
  { value: "savings", label: "Savings", icon: PiggyBank },
  { value: "credit", label: "Credit Card", icon: CreditCard },
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "investment", label: "Investment", icon: TrendingUp },
];
