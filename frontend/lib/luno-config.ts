import { createConfig } from '@luno-kit/react';
import { polkadot } from '@luno-kit/react/chains';
import { polkadotjsConnector } from '@luno-kit/react/connectors';

export const lunoConfig = createConfig({
  appName: 'ContrAI',
  chains: [polkadot],
  connectors: [polkadotjsConnector()],
});
