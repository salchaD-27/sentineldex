'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../context/WalletContext";
import CopyButton from "../components/CopyButton";
import Tab0 from "../components/Tab0";
import Account from "../components/Account";
import { useConnection } from "wagmi";

export default function Dashboard(){
    const router = useRouter();
    const {isConnected, address, chain, disconnect, walletBalance, setWalletBalance} = useWallet();
    const [tabOpen, setTabOpen] = useState<number>(1);

    useEffect(()=>{
        if(!isConnected) router.push('/')
    }, [isConnected])

    async function fund(){
        try{
            const res = await fetch('http://localhost:3001/api/fund');
            if(!res.ok) throw new Error('Failed to fund wallet');
        }catch{}
    }

    return (
        <div className="h-[100vh] w-screen flex flex-col items-center justify-center">
            <div className="h-[9%] w-full flex items-center justify-center bg-neutral-800">
                <div className="h-full w-[20%] flex items-center justify-center text-[154%] font-extrabold">SentinelDEX</div>
                <div className="h-full w-[50%] flex items-center justify-center">
                    {/* <div onClick={()=>setTabOpen(0)} className="h-full w-[154px] flex items-center justify-center font-semibold text-[100%] cursor-pointer hover:opacity-70">Pools</div> */}
                </div>
                <div className="h-full w-[30%] flex items-center justify-end gap-[7px] pr-[10px] font-semibold">
                    {/* <button onClick={()=>setTabOpen(1)} className="h-auto w-[100px] p-[10px] rounded border-1 border-white text-white text-[90%] hover:opacity-70 cursor-pointer">Account</button> */}
                    <div className="h-full w-auto flex flex-col items-end justify-center font-light mr-[10px] gap-[4px]">
                        <div className="h-auto w-full flex items-center justify-end">Balance (Local Hardhat):&nbsp;<span className="font-semibold text-indigo-500">{Number(walletBalance) > 0 ? (Number(walletBalance) / 10**18).toFixed(6) : '0.000000'} ETH</span></div>
                        <button disabled={Number(walletBalance)>=1000} onClick={fund} className={`h-auto w-auto py-[2px] px-[10px] flex items-center justify-center font-semibold border-1 border-white rounded ${Number(walletBalance)>=1000?'disabled cursor-not-allowed, opacity-40':'cursor-pointer hover:opacity-70'}`}>Fund Wallet&nbsp;<span className="text-green-600">(1000 ETH)</span></button>
                    </div>
                    <CopyButton address={address}/>
                    <button onClick={()=>{disconnect();router.push('/')}} className="h-auto w-[100px] p-[10px] rounded border-1 border-white text-white text-[90%] hover:opacity-70 cursor-pointer">Disconnect</button>
                </div>
            </div>
            <div className="h-[91%] w-full flex items-center justify-center">
                {/* {tabOpen==0 && <Tab0/>} */}
                {tabOpen==1 && <Account/>}
            </div>
        </div>
    );
}