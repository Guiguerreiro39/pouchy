import { useForm } from "@tanstack/react-form";

import { Schema } from "effect";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateInvestment } from "@/entities/investment/api/use-create-investment";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  CURRENCIES,
  INVESTMENT_TYPES,
  InvestmentFormSchema,
} from "../model/investment-form-schema";

export function CreateInvestmentDialog({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const createInvestment = useCreateInvestment();

  const form = useForm({
    defaultValues: {
      name: "",
      type: "stock" as
        | "stock"
        | "etf"
        | "crypto"
        | "mutual_fund"
        | "bond"
        | "real_estate"
        | "other",
      symbol: "",
      quantity: "",
      purchasePrice: "",
      currentPrice: "",
      currency: "USD",
      purchaseDate: new Date().toISOString().split("T")[0],
    },
    onSubmit: async ({ value }) => {
      try {
        await createInvestment({
          name: value.name,
          type: value.type,
          symbol: value.symbol || undefined,
          quantity: Number.parseFloat(value.quantity),
          purchasePrice: Number.parseFloat(value.purchasePrice),
          currentPrice: value.currentPrice
            ? Number.parseFloat(value.currentPrice)
            : undefined,
          currency: value.currency,
          purchaseDate: new Date(value.purchaseDate).getTime(),
        });
        toast.success("Investment added");
        setOpen(false);
        form.reset();
      } catch {
        toast.error("Failed to add investment");
      }
    },
    validators: {
      onSubmit: Schema.standardSchemaV1(InvestmentFormSchema),
    },
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Investment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Investment</DialogTitle>
          <DialogDescription>
            Track a new investment position.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., Apple Inc."
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="text-destructive text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Field name="symbol">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol (optional)</Label>
                  <Input
                    id="symbol"
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(e.target.value.toUpperCase())
                    }
                    placeholder="e.g., AAPL"
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="type">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    items={INVESTMENT_TYPES.map((t) => ({
                      value: t.value,
                      label: t.label,
                    }))}
                    onValueChange={(val: string | null) =>
                      val &&
                      field.handleChange(
                        val as
                          | "stock"
                          | "etf"
                          | "crypto"
                          | "mutual_fund"
                          | "bond"
                          | "real_estate"
                          | "other"
                      )
                    }
                    value={field.state.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select investment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVESTMENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            <form.Field name="currency">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    items={[...CURRENCIES]}
                    onValueChange={(val: string | null) =>
                      val && field.handleChange(val)
                    }
                    value={field.state.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="quantity">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    min="0"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="0"
                    step="any"
                    type="number"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="text-destructive text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Field name="purchasePrice">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    min="0"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="text-destructive text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="currentPrice">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="currentPrice">Current Price (optional)</Label>
                  <Input
                    id="currentPrice"
                    min="0"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Same as purchase"
                    step="0.01"
                    type="number"
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="purchaseDate">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="date"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="text-destructive text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <form.Subscribe>
              {(state) => (
                <Button disabled={state.isSubmitting} type="submit">
                  {state.isSubmitting ? "Adding..." : "Add Investment"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
