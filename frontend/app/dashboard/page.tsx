'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../context/WalletContext";
import CopyButton from "../components/CopyButton";
import Tab0 from "../components/Tab0";
import Account from "../components/Account";

export default function Dashboard(){
    const router = useRouter();
    const {isConnected, address, disconnect} = useWallet();
    const [tabOpen, setTabOpen] = useState<number>(1);

    useEffect(()=>{
        if(!isConnected) router.push('/')
    }, [isConnected])

    return (
        <div className="h-[100vh] w-screen flex flex-col items-center justify-center">
            <div className="h-[9%] w-full flex items-center justify-center bg-neutral-800">
                <div className="h-full w-[20%] flex items-center justify-center text-[154%] font-extrabold">SentinelDEX</div>
                <div className="h-full w-[60%] flex items-center justify-center">
                    {/* <div onClick={()=>setTabOpen(0)} className="h-full w-[154px] flex items-center justify-center font-semibold text-[100%] cursor-pointer hover:opacity-70">Pools</div> */}
                </div>
                <div className="h-full w-[20%] flex items-center justify-end gap-[7px] pr-[10px] font-semibold">
                    {/* <button onClick={()=>setTabOpen(1)} className="h-auto w-[100px] p-[10px] rounded border-1 border-white text-white text-[90%] hover:opacity-70 cursor-pointer">Account</button> */}
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