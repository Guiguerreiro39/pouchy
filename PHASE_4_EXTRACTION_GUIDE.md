# Phase 4: Feature Extraction Guide

**Current Status:** Auth feature complete, 19 features remaining
**Complexity:** HIGH - Large dialogs embedded in route files
**Template:** Use auth feature as pattern

---

## 📋 Features to Extract

### Priority 1: Transaction Features (Most Used)

**Source:** `routes/transactions.tsx` (972 lines)

#### 1. create-transaction

**Lines:** 576-900+ (TransactionFormSchema + CreateTransactionDialog)

**Extract to:**
```
features/create-transaction/
├── ui/
│   └── create-transaction-dialog.tsx
├── model/
│   ├── transaction-form-schema.ts
│   └── use-create-transaction-form.ts
└── index.ts
```

**Schema (line 576):**
```typescript
const TransactionFormSchema = Schema.Struct({
  type: Schema.Literal("expense", "income", "transfer"),
  accountId: Schema.String.pipe(Schema.minLength(1)),
  categoryId: Schema.String.pipe(Schema.minLength(1)),
  amount: Schema.String.pipe(Schema.minLength(1)),
  description: Schema.String.pipe(Schema.minLength(1)),
  date: Schema.String.pipe(Schema.minLength(1)),
  toAccountId: Schema.String,
});
```

**Component (line 596):**
- Uses `useMutation(api.transactions.create)`
- Complex form with type tabs (expense/income/transfer)
- Conditional fields (toAccountId for transfers)
- Category filtering based on type

#### 2. edit-transaction

**Lines:** 376-574 (EditTransactionFormSchema + EditTransactionDialog)

**Extract to:**
```
features/edit-transaction/
├── ui/
│   └── edit-transaction-dialog.tsx
├── model/
│   ├── edit-transaction-schema.ts
│   └── use-edit-transaction-form.ts
└── index.ts
```

**Schema (line 376):**
```typescript
const EditTransactionFormSchema = Schema.Struct({
  categoryId: Schema.String.pipe(Schema.minLength(1)),
  description: Schema.String.pipe(Schema.minLength(1)),
  date: Schema.String.pipe(Schema.minLength(1)),
  notes: Schema.String,
});
```

**Component (line 389):**
- Uses `useMutation(api.transactions.update)`
- Simpler than create (no type/amount changes)
- Category field, description, date, notes

#### 3. delete-transaction

**Lines:** 304-311 (handleDelete in TransactionRow)

**Extract to:**
```
features/delete-transaction/
├── ui/
│   └── delete-transaction-button.tsx
├── model/
│   └── use-delete-transaction.ts
└── index.ts
```

**Logic:**
```typescript
const handleDelete = async () => {
  try {
    await removeTransaction({ id: transaction._id });
    toast.success("Transaction deleted");
  } catch {
    toast.error("Failed to delete transaction");
  }
};
```

**Note:** Could be a dropdown menu item or confirmation dialog

---

### Priority 2: Account Features

**Source:** `routes/accounts.tsx`

Extract similar patterns:
- `features/create-account/` - CreateAccountDialog
- `features/edit-account/` - EditAccountDialog
- `features/delete-account/` - Delete logic

---

### Priority 3: Goal Features

**Source:** `routes/goals.tsx`

Extract:
- `features/create-goal/` - CreateGoalDialog
- `features/edit-goal/` - EditGoalDialog
- `features/update-goal-progress/` - Progress dialog

---

### Priority 4: Investment Features

**Source:** `routes/investments.tsx`

Extract:
- `features/create-investment/` - CreateInvestmentDialog
- `features/edit-investment/` - EditInvestmentDialog

---

### Priority 5: Subscription Features

**Source:** `routes/subscriptions.tsx`

Extract:
- `features/create-subscription/` - CreateSubscriptionDialog
- `features/edit-subscription/` - EditSubscriptionDialog
- `features/manage-subscription-status/` - Pause/Resume/Cancel

---

### Priority 6: Settings Features

**Source:** `routes/settings.tsx`

Extract:
- `features/update-settings/` - Settings form sections

---

## 🔧 Extraction Steps

### Step 1: Create Feature Structure

```bash
mkdir -p features/create-transaction/{ui,model}
```

### Step 2: Extract Schema

Create `model/transaction-form-schema.ts`:
```typescript
import { Schema } from "effect";

export const TransactionFormSchema = Schema.Struct({
  // Copy from route file
});
```

### Step 3: Extract Form Hook (Optional)

If form logic is complex, create `model/use-create-transaction-form.ts`:
```typescript
import { useForm, useStore } from "@tanstack/react-form";
import { Schema } from "effect";
import { toast } from "sonner";
import { useCreateTransaction } from "@/entities/transaction";
import { TransactionFormSchema } from "./transaction-form-schema";

export function useCreateTransactionForm(
  accounts: Array<{ _id: Id<"accounts">; currency: string }>,
  onSuccess: () => void
) {
  const createTransaction = useCreateTransaction();

  return useForm({
    defaultValues: { /* ... */ },
    onSubmit: async ({ value }) => {
      // Submit logic
    },
    validators: {
      onSubmit: Schema.standardSchemaV1(TransactionFormSchema),
    },
  });
}
```

### Step 4: Extract Dialog Component

Create `ui/create-transaction-dialog.tsx`:
```typescript
import { useState } from "react";
import { Plus } from "lucide-react";
import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
// Import entity hooks
import { useCreateTransaction } from "@/entities/transaction";
// Import local form logic
import { useCreateTransactionForm } from "../model/use-create-transaction-form";

export function CreateTransactionDialog({ accounts, categories, children }) {
  const [open, setOpen] = useState(false);
  const form = useCreateTransactionForm(accounts, () => {
    setOpen(false);
    form.reset();
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {children || <Button>Add Transaction</Button>}
      </DialogTrigger>
      <DialogContent>
        {/* Form fields */}
      </DialogContent>
    </Dialog>
  );
}
```

### Step 5: Create Public API

Create `index.ts`:
```typescript
export { CreateTransactionDialog } from "./ui/create-transaction-dialog";
export { useCreateTransactionForm } from "./model/use-create-transaction-form";
export { TransactionFormSchema } from "./model/transaction-form-schema";
```

### Step 6: Update Route File

In `routes/transactions.tsx`:
```typescript
// Before
function CreateTransactionDialog() { /* 200+ lines */ }

// After
import { CreateTransactionDialog } from "@/features/create-transaction";
```

### Step 7: Test

Verify the dialog still works correctly.

---

## 📐 Pattern Reference

### Auth Feature (Completed Example)

```
features/auth/
├── ui/
│   ├── sign-in-form.tsx
│   └── sign-up-form.tsx
└── index.ts
```

**index.ts:**
```typescript
export { default as SignInForm } from "./ui/sign-in-form";
export { default as SignUpForm } from "./ui/sign-up-form";
```

**Usage in routes:**
```typescript
import { SignInForm, SignUpForm } from "@/features/auth";
```

---

## ⚠️ Common Pitfalls

1. **Missing dependencies** - Dialog components import many UI components, ensure all imports
2. **Type imports** - Need Convex Id types from entities
3. **Form state** - TanStack Form useStore for reactive fields
4. **Toast notifications** - Import from "sonner"
5. **Entity hooks** - Use entity API hooks, not direct mutations
6. **Effect Schema** - Use Schema.standardSchemaV1 wrapper

---

## 🎯 Testing Checklist

After each extraction:

- [ ] Dialog opens correctly
- [ ] Form validation works
- [ ] Submit succeeds
- [ ] Error handling works
- [ ] Toast notifications appear
- [ ] Dialog closes on success
- [ ] Form resets properly
- [ ] No console errors
- [ ] TypeScript compiles

---

## 📊 Progress Tracking

### Completed
- [x] Auth feature (sign-in, sign-up)

### In Progress
- [ ] create-transaction
- [ ] edit-transaction
- [ ] delete-transaction

### TODO
- [ ] create-account
- [ ] edit-account
- [ ] delete-account
- [ ] create-goal
- [ ] edit-goal
- [ ] update-goal-progress
- [ ] create-investment
- [ ] edit-investment
- [ ] create-subscription
- [ ] edit-subscription
- [ ] manage-subscription-status
- [ ] update-settings

**Total:** 1/20 features complete (5%)

---

## 💡 Tips

1. **Start with create-transaction** - Most complex, good learning
2. **Copy paste first** - Get it working, then refactor
3. **Test incrementally** - Don't extract all at once
4. **Keep forms simple** - Don't over-engineer form hooks
5. **Follow auth pattern** - Simple public API, minimal abstraction

---

## 🚀 Quick Start

To extract create-transaction feature:

```bash
# 1. Create structure
cd /Users/guilhermeguerreiro/Documents/Git/pouchy/apps/web/src
mkdir -p features/create-transaction/{ui,model}

# 2. Copy schema from line 576 of routes/transactions.tsx
# Create features/create-transaction/model/transaction-form-schema.ts

# 3. Copy CreateTransactionDialog from line 596
# Create features/create-transaction/ui/create-transaction-dialog.tsx

# 4. Create public API
# Create features/create-transaction/index.ts

# 5. Update routes/transactions.tsx
# Remove CreateTransactionDialog function
# Add import: import { CreateTransactionDialog } from "@/features/create-transaction";

# 6. Test the transaction page
```

---

## 📝 Notes

- Each feature extraction takes 15-30 minutes
- Transaction features are most complex (type switching, validation)
- Simpler features (settings) can be done in 10 minutes
- Total time for all 19 features: ~6-8 hours
- Can be done incrementally over multiple sessions
