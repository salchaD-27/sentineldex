'use client';
import Image from "next/image";
import { useWallet } from "./context/WalletContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { connectors, connect, isConnecting, isConnected} = useWallet();
  
  useEffect(() => {
      if (isConnected) router.push("/dashboard");
  }, [isConnected, router]);

  return (
    <div className="h-[100vh] w-screen flex flex-col items-center justify-center">
      <div className="h-[9%] w-full flex items-center justify-center bg-neutral-800 text-[154%]">SentinelDEX</div>
      <div className="h-[91%] w-full flex items-center justify-center">
        <div className="h-full w-full flex flex-col items-center justify-center text-[27px]">
          <div className="text-[54px] mb-4">Connect Wallet</div>
          <div className="mb-2">Connect with:</div>
          <div className="flex">
          {connectors.map((connector) => (
              <button
              key={connector.uid}
              className="px-[20px] py-[6px] mx-[4px] rounded bg-white text-black text-[17px] hover:opacity-70"
              onClick={() => connect(connector)}
              disabled={isConnecting||isConnected}
              >
              {connector.name}
              </button>
          ))}
          </div>
          {isConnecting && <div className="mt-3">Connecting wallet…</div>}
          {isConnected && <div className="mt-3">Wallet Connected. Redirecting...</div>}
        </div>
      </div>
    </div>
  );
}
