"use client";

import { LunoKitProvider } from "@luno-kit/ui";
import { lunoConfig } from "@/Config/LunoConfig";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <LunoKitProvider config={lunoConfig}>
        {children}
      </LunoKitProvider>
    </QueryClientProvider>
  );
}