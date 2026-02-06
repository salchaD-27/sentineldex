'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../context/WalletContext";

export default function Dashboard(){
    const router = useRouter();
    const {isConnected, address, disconnect} = useWallet();

    useEffect(()=>{
        if(!isConnected) router.push('/')
    }, [isConnected])

    return (
        <div className="h-[100vh] w-screen flex flex-col items-center justify-center">
            <div className="h-[9%] w-full flex items-center justify-center bg-neutral-800">
                <div className="h-full w-[20%] flex items-center justify-center text-[154%]">SentinelDEX</div>
                <div className="h-full w-[70%] flex items-center justify-center"></div>
                <div className="h-full w-[10%] flex items-center justify-center gap-[4px]">
                    <button onClick={()=>router.push(`${isConnected?'/dashboard':'/connect-wallet'}`)} className="h-auto w-auto p-[10px] rounded bg-white text-black text-[90%] hover:opacity-70 cursor-pointer">{isConnected?`${address?.substring(0, 4)}...${address?.substring(address.length - 4)}`:'ConnectWallet'}</button>
                    <button onClick={()=>{disconnect();router.push('/')}} className="h-auto w-auto p-[10px] rounded border-1 border-white text-white text-[90%] hover:opacity-70 cursor-pointer">Disconnect</button>
                </div>
            </div>
            <div className="h-[91%] w-full flex items-center justify-center"></div>
        </div>
    );
}