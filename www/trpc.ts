import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../stripe-update-card";
import { inferRouterOutputs } from "@trpc/server";

// Notice the <AppRouter> generic here.
export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      // url: "http://localhost:4545/trpc",
      url: "https://billing-api.troybroussard.com/trpc",
    }),
  ],
});

export type RouterOutput = inferRouterOutputs<AppRouter>;
