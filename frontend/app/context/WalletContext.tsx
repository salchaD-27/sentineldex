'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  Connector,
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
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
  walletBalance: string;
  setWalletBalance: (walletBalance: string) => void;
  fetchWalletBalance: () => void;
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
  const [walletBalance, setWalletBalance] = useState<string>("0");

  const fetchWalletBalance = async () => {
    if (!address) return;
    try {
        const balanceRes = await fetch('http://localhost:3001/api/wallet-balance', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({walletAddress: address})
        });
        if(balanceRes.ok) {
            const { balance } = await balanceRes.json();
            setWalletBalance(balance);
        }
    } catch (err) {
        console.error('Error fetching wallet balance:', err);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
    const interval = setInterval(fetchWalletBalance, 3000);
    return () => clearInterval(interval);
  }, [address]);

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
        walletBalance,
        setWalletBalance,
        fetchWalletBalance,
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
