import { ApiPromise, WsProvider } from '@polkadot/api';

let api: ApiPromise | null = null;

export const getPolkadotApi = async () => {
  if (api) return api;

  // Sử dụng RPC của Polkadot giống dự án mẫu
  const provider = new WsProvider('wss://rpc.polkadot.io'); 
  api = await ApiPromise.create({ provider });
  return api;
};