'use client';
import Image from "next/image";
import { useWallet } from "./context/WalletContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const {isConnected, address} = useWallet();
  return (
    <div className="h-[100vh] w-screen flex flex-col items-center justify-center">
      <div className="h-[9%] w-full flex items-center justify-center bg-neutral-800">
        <div className="h-full w-[20%] flex items-center justify-center text-[154%]">SentinelDEX</div>
        <div className="h-full w-[70%] flex items-center justify-center"></div>
        <div className="h-full w-[10%] flex flex-col items-center justify-center">
          <button onClick={()=>router.push(`${isConnected?'/dashboard':'/connect-wallet'}`)} className="h-auto w-auto p-[10px] rounded bg-white text-black text-[90%] hover:opacity-70 cursor-pointer">{isConnected?`${address?.substring(0, 4)}...${address?.substring(address.length - 4)}`:'Connect Wallet'}</button>
        </div>
      </div>
      <div className="h-[91%] w-full flex items-center justify-center"></div>
    </div>
  );
}
