import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { defineChain } from 'viem';

// Paseo Asset Hub (Polkadot EVM)
export const paseoAssetHub = defineChain({
  id: 420420417,
  name: 'Paseo Asset Hub',
  nativeCurrency: {
    name: 'PAS',
    symbol: 'PAS',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://services.polkadothub-rpc.com/testnet'] },
  },
  blockExplorers: {
    default: { name: 'Subscan', url: 'https://assethub-paseo.subscan.io' },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [paseoAssetHub],
  connectors: [
    injected(), // MetaMask, Coinbase Wallet, etc.
  ],
  transports: {
    [paseoAssetHub.id]: http(),
  },
});