import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { Authenticated } from "convex/react";
import { ConvexProvider } from "@/app/providers/convex-provider";
import { QueryProvider } from "@/app/providers/query-provider";
import appCss from "@/app/styles/index.css?url";
import type { RouterAppContext } from "@/app/types/router-app-context";
import { getToken } from "@/shared/config/auth-server";
import { Toaster } from "@/shared/ui/sonner";
import { Navbar } from "@/widgets/navbar/ui/navbar";
import { Sidebar } from "@/widgets/sidebar/ui/sidebar";

const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  return await getToken();
});

// Re-export for other routes that may need it
export type { RouterAppContext } from "@/app/types/router-app-context";

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Pouchy - Personal Finance",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
  beforeLoad: async (ctx) => {
    const token = await getAuth();
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return {
      isAuthenticated: !!token,
      token,
    };
  },
});

function RootDocument() {
  const context = useRouteContext({ from: Route.id });

  return (
    <ConvexProvider
      client={context.convexQueryClient.convexClient}
      initialToken={context.token ?? null}
    >
      <QueryProvider client={context.queryClient}>
        <html lang="en">
          <head>
            <HeadContent />
          </head>
          <body>
            <div className="flex h-svh">
              {/* Only show sidebar when authenticated, avoiding the "useless sidebar" on login */}
              <Authenticated>
                <Sidebar />
              </Authenticated>
              <main className="flex flex-1 flex-col overflow-hidden">
                <Navbar />
                <div className="flex-1 overflow-auto">
                  <Outlet />
                </div>
              </main>
            </div>
            <Toaster richColors />
            <TanStackRouterDevtools position="bottom-left" />
            <Scripts />
          </body>
        </html>
      </QueryProvider>
    </ConvexProvider>
  );
}
