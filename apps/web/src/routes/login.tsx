import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { Wallet } from "lucide-react";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const [view, setView] = useState<"signin" | "signup">("signin");
  // const navigate = useNavigate();

  return (
    <>
      <Authenticated>
        <div className="flex min-h-screen items-center justify-center">
          <meta content="0;url=/dashboard" httpEquiv="refresh" />
        </div>
      </Authenticated>
      <Unauthenticated>
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
          {/* Left Column - Branding/Marketing */}
          <div className="flex flex-col justify-between bg-zinc-900 p-8 text-white lg:p-12">
            <div>
              <div className="flex items-center gap-2 font-bold text-xl">
                <Wallet className="h-6 w-6" />
                <span>Pouchy</span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="font-bold text-4xl leading-tight lg:text-5xl">
                Master your money, <br />
                unleash your freedom.
              </h1>
              <p className="text-lg text-zinc-400">
                Track expenses, manage subscriptions, and watch your investments
                grow. All in one beautiful place.
              </p>
            </div>

            <div className="text-sm text-zinc-500">
              © {new Date().getFullYear()} Pouchy. All rights reserved.
            </div>
          </div>

          {/* Right Column - Auth Form */}
          <div className="flex items-center justify-center bg-background p-8">
            <div className="w-full max-w-sm space-y-6">
              {view === "signin" ? (
                <SignInForm onSwitchToSignUp={() => setView("signup")} />
              ) : (
                <SignUpForm onSwitchToSignIn={() => setView("signin")} />
              )}
            </div>
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}
