import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Chain, Client } from "viem";
import { http, WagmiProvider, type Transport, createConfig, useClient, type Config } from "wagmi";
import { mainnet, linea, lineaSepolia } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";
import { FallbackProvider, JsonRpcProvider } from 'ethers'
import { useMemo } from 'react'



export function clientToProvider(client: Client<Transport, Chain>) {
  const { chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  if (transport.type === 'fallback') {
    const providers = (transport.transports as ReturnType<Transport>[]).map(
      ({ value }) => new JsonRpcProvider(value?.url, network),
    )
    if (providers.length === 1) return providers[0]
    return new FallbackProvider(providers)
  }
  return new JsonRpcProvider(transport.url, network)
}


export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const client = useClient<Config>({ chainId })
  return useMemo(() => (client ? clientToProvider(client) : undefined), [client])
}

export const config = createConfig({
    ssr: true, // Make sure to enable this for server-side rendering (SSR) applications.
    chains: [mainnet, linea, lineaSepolia],
    connectors: [metaMask()],
    transports: {
      [mainnet.id]: http(),
      [linea.id]: http(),
      [lineaSepolia.id]: http(),
    },
  });
  


const client = new QueryClient();

export const WalletContextProvider = ({children}:React.PropsWithChildren) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}