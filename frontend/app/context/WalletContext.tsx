'use client';

import { createContext, useContext } from 'react';
import {
  Connector,
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSignMessage,
} from 'wagmi';
import { Chain as ViemChain } from 'viem';

// Extend Wagmi/Viem Chain with custom field
export type Chain = ViemChain & {
  isAnchorChain: boolean;
};

// Wallet context type
type WalletContextType = {
  address?: `0x${string}`;
  chain?: Chain;
  chainId: number;
  isConnecting: boolean;
  isConnected: boolean;
  connectors: readonly Connector[];
  connect: (connector: Connector) => void;
  disconnect: () => void;
};

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Provider component
export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { address, isConnecting, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Add isAnchorChain safely
  const myChain: Chain | undefined = chain
    ? { ...chain, isAnchorChain: chain.id === 31337 } // hardhat localhost as anchor
    : undefined;

  return (
    <WalletContext.Provider
      value={{
        address,
        chain: myChain,
        chainId,
        isConnecting,
        isConnected,
        connectors,
        connect: (c) => connect({ connector: c }),
        disconnect
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Hook to consume the wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
