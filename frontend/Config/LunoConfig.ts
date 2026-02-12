import { createConfig } from '@luno-kit/react'
import { polkadot } from '@luno-kit/react/chains'
import { polkadotjsConnector } from '@luno-kit/react/connectors'

const config = createConfig({
  appName: 'My app',
  chains: [polkadot],
  connectors: [polkadotjsConnector()],
})