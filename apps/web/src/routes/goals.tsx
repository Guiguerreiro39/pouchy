import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { Schema } from "effect";
import { Check, MoreHorizontal, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/goals")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <Authenticated>
        <GoalsContent />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="w-full max-w-md">
            {showSignIn ? (
              <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
            ) : (
              <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
            )}
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <GoalsSkeleton />
      </AuthLoading>
    </>
  );
}

function GoalsContent() {
  const [showCompleted, setShowCompleted] = useState(false);
  const goals = useQuery(api.goals.list, { includeCompleted: showCompleted });

  if (!goals) {
    return <GoalsSkeleton />;
  }

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalProgress = activeGoals.reduce(
    (sum, g) => sum + g.currentAmount,
    0
  );
  const overallPercent =
    totalTarget > 0 ? (totalProgress / totalTarget) * 100 : 0;

  return (
    <div className="flex-1 space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Goals</h1>
          <p className="text-muted-foreground text-sm">
            Track your financial goals
          </p>
        </div>
        <CreateGoalDialog />
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-medium text-sm">
            Overall Progress
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-2xl">
              {formatCurrency(totalProgress)}
            </span>
            <span className="text-muted-foreground text-sm">
              of {formatCurrency(totalTarget)}
            </span>
          </div>
          <Progress className="mt-2" value={overallPercent} />
          <p className="mt-1 text-muted-foreground text-xs">
            {formatPercent(overallPercent)} complete across {activeGoals.length}{" "}
            goals
          </p>
        </CardContent>
      </Card>

      {/* Active Goals */}
      <div>
        <h2 className="mb-4 font-semibold text-lg">Active Goals</h2>
        {activeGoals.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {activeGoals.map((goal) => (
              <GoalCard goal={goal} key={goal._id} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No active goals</p>
              <CreateGoalDialog>
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first goal
                </Button>
              </CreateGoalDialog>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Goals Toggle */}
      {completedGoals.length > 0 && (
        <div>
          <Button
            className="mb-4"
            onClick={() => setShowCompleted(!showCompleted)}
            variant="ghost"
          >
            <Check className="mr-2 h-4 w-4" />
            {showCompleted ? "Hide" : "Show"} Completed ({completedGoals.length}
            )
          </Button>
          {showCompleted && (
            <div className="grid gap-4 md:grid-cols-2">
              {completedGoals.map((goal) => (
                <GoalCard goal={goal} isCompleted key={goal._id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  isCompleted = false,
}: {
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
}) {
  const [showAddProgress, setShowAddProgress] = useState(false);
  const [progressAmount, setProgressAmount] = useState("");

  const addProgress = useMutation(api.goals.addProgress);
  const markComplete = useMutation(api.goals.markComplete);
  const removeGoal = useMutation(api.goals.remove);

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressAmount) {
      return;
    }

    try {
      const result = await addProgress({
        id: goal._id,
        amount: Number.parseFloat(progressAmount),
      });
      if (result.isCompleted) {
        toast.success("Congratulations! Goal completed!");
      } else {
        toast.success("Progress added");
      }
      setShowAddProgress(false);
      setProgressAmount("");
    } catch {
      toast.error("Failed to add progress");
    }
  };

  const handleMarkComplete = async () => {
    try {
      await markComplete({ id: goal._id });
      toast.success("Goal marked as complete");
    } catch {
      toast.error("Failed to complete goal");
    }
  };

  const handleDelete = async () => {
    try {
      await removeGoal({ id: goal._id });
      toast.success("Goal deleted");
    } catch {
      toast.error("Failed to delete goal");
    }
  };

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
                <DropdownMenuItem onClick={handleMarkComplete}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark Complete
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
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
          <form className="mt-4 flex gap-2" onSubmit={handleAddProgress}>
            <Input
              className="flex-1"
              min="0"
              onChange={(e) => setProgressAmount(e.target.value)}
              placeholder="Amount"
              step="0.01"
              type="number"
              value={progressAmount}
            />
            <Button size="sm" type="submit">
              Add
            </Button>
            <Button
              onClick={() => setShowAddProgress(false)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

const GoalFormSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Goal name is required" })
  ),
  targetAmount: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Target amount is required" })
  ),
  currentAmount: Schema.String,
  targetDate: Schema.String,
  icon: Schema.String,
});

const GOAL_ICONS = ["🎯", "🏠", "🚗", "✈️", "💍", "🎓", "💰", "🏝️", "📱", "💻"];

function CreateGoalDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const createGoal = useMutation(api.goals.create);

  const form = useForm({
    defaultValues: {
      name: "",
      targetAmount: "",
      currentAmount: "",
      targetDate: "",
      icon: "🎯",
    },
    onSubmit: async ({ value }) => {
      try {
        await createGoal({
          name: value.name,
          targetAmount: Number.parseFloat(value.targetAmount),
          currentAmount: value.currentAmount
            ? Number.parseFloat(value.currentAmount)
            : undefined,
          currency: "USD",
          targetDate: value.targetDate
            ? new Date(value.targetDate).getTime()
            : undefined,
          icon: value.icon || undefined,
        });
        toast.success("Goal created");
        setOpen(false);
        form.reset();
      } catch {
        toast.error("Failed to create goal");
      }
    },
    validators: {
      onSubmit: Schema.standardSchemaV1(GoalFormSchema),
    },
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Goal</DialogTitle>
          <DialogDescription>
            Set a new financial goal to track.
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
          <form.Field name="icon">
            {(field) => (
              <div className="space-y-2">
                <Label>Icon</Label>
                <form.Subscribe selector={(state) => state.values.icon}>
                  {(selectedIcon) => (
                    <div className="flex gap-2">
                      {GOAL_ICONS.map((i) => (
                        <button
                          className={`rounded p-2 text-xl hover:bg-accent ${
                            selectedIcon === i ? "bg-accent" : ""
                          }`}
                          key={i}
                          onClick={() => field.handleChange(i)}
                          type="button"
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  )}
                </form.Subscribe>
              </div>
            )}
          </form.Field>

          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., Emergency Fund"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="targetAmount">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount</Label>
                  <Input
                    id="targetAmount"
                    min="0"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="10000"
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

            <form.Field name="currentAmount">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="currentAmount">Current Progress</Label>
                  <Input
                    id="currentAmount"
                    min="0"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="0"
                    step="0.01"
                    type="number"
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="targetDate">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date (optional)</Label>
                <Input
                  id="targetDate"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="date"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>

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
                  {state.isSubmitting ? "Creating..." : "Create Goal"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalsSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-2 w-full" />
          <Skeleton className="mt-1 h-3 w-40" />
        </CardContent>
      </Card>
      <div>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...new Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-8" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="mt-2 h-2 w-full" />
                <Skeleton className="mt-2 h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
