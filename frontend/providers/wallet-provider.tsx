"use client";

import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from "@/Config/wagmi.config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}