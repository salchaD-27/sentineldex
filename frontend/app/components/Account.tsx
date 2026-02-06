'use client'
import { useEffect, useState } from "react"
import CopyButton from "./CopyButton";
import { useWallet } from "../context/WalletContext";

interface Pools{
    pool: `0x${string}`
    token0: string,
    token1: string,
    lpTokenAddress: `0x${string}`
    lpTokenSymbol: string,
    balance: number,
    lpTotalSupply: string,
}

interface Tokens{
    tokenAddress: `0x${string}`,
    tokenName: string,
    tokenSymbol: string,
    balance: number,
    tokenTotalSupply: BigInt,
}

export default function Account(){
    const [open, setOpen] = useState<number>(1);
    const [sideOpen, setSideOpen] = useState<string>('');
    const [pools, setPools] = useState<Pools[]>([]);
    const [tokens, setTokens] = useState<Tokens[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const {address} = useWallet();

    const [token1Address, setToken1Address] = useState('');
    const [token2Address, setToken2Address] = useState('');
    
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);

                const poolsRes = await fetch('http://localhost:3001/api/pools', {
                    method: 'POST', headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({walletAddress: address}) 
                });
                if(!poolsRes.ok) throw new Error('Failed to fetch pools');
                const { pools } = await poolsRes.json();
                setPools(pools);
                console.log(pools);

                const tokensRes = await fetch('http://localhost:3001/api/tokens', {
                    method: 'POST', headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({walletAddress: address})
                });
                if(!tokensRes.ok) throw new Error('Failed to fetch tokens');
                const { tokens } = await tokensRes.json();
                setTokens(tokens);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
                console.error('Fetch error:', err);
                setPools([]);
                setTokens([]);
            } finally {setLoading(false);}
        }
        fetchData();
    }, []);

    const handleCreatePool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token1Address || !token2Address) return;
        try {
            const res = await fetch('http://localhost:3001/api/create-pool', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token1: token1Address, token2: token2Address }),
            });
            const data = await res.json();
            console.log('Pool creation response:', data);
        } catch (err) {
            console.error('Error creating pool:', err);
        }
    };

    return(
        <div className="h-full w-full flex items-center justify-center gap-[10px]">
            <div className="h-[90%] w-[60%] flex flex-col items-center justify-center border-r-1 border-white">
                <div className="h-[10%] w-[90%] flex items-center justify-center gap-[10px] font-semibold">
                    <button onClick={()=>setOpen(0)} className="h-auto w-[100px] p-[10px] rounded border-1 border-white bg-white text-black text-[90%] hover:opacity-70 cursor-pointer">Pools</button>
                    <button onClick={()=>setOpen(1)} className="h-auto w-[100px] p-[10px] rounded border-1 border-white bg-white text-black text-[90%] hover:opacity-70 cursor-pointer">Tokens</button>
                </div>
                <div className="h-[90%] w-[90%] flex flex-col items-center justify-center">
                    {open==0?(
                    <>
                        <div className="h-[10%] w-full flex items-center justify-center rounded bg-neutral-800 font-semibold">
                            <div className="h-full w-1/7 flex items-center justify-center">Pool Address</div>
                            <div className="h-full w-1/7 flex items-center justify-center">Token 1</div>
                            <div className="h-full w-1/7 flex items-center justify-center">Token 2</div>
                            <div className="h-full w-1/7 flex items-center justify-center">LP Token Address</div>
                            <div className="h-full w-1/7 flex items-center justify-center">LP Token Symbol</div>
                            <div className="h-full w-1/7 flex items-center justify-center">Your Liquidity</div>
                            <div className="h-full w-1/7 flex items-center justify-center">%</div>
                            <div className="h-full w-[10px] flex items-center justify-center"></div>
                        </div>
                        <div className="h-[90%] w-full flex flex-col items-center justify-start pt-[7px]">
                            {pools.map((pool, idx)=>(
                                <div key={idx} className="h-[7%] w-full flex items-center justify-center">
                                    <div className="h-full w-1/7 flex items-center justify-center"><CopyButton address={pool.pool}/></div>
                                    <div className="h-full w-1/7 flex items-center justify-center">{pool.token0}</div>
                                    <div className="h-full w-1/7 flex items-center justify-center">{pool.token1}</div>
                                    <div className="h-full w-1/7 flex items-center justify-center"><CopyButton address={pool.lpTokenAddress}/></div>
                                    <div className="h-full w-1/7 flex items-center justify-center">{pool.lpTokenSymbol}</div>
                                    <div className="h-full w-1/7 flex items-center justify-center">{Number(pool.balance)}</div>
                                    <div className="h-full w-1/7 flex items-center justify-center">{Number(pool.lpTotalSupply) > 0 ? (Number(pool.balance) * 100 / Number(pool.lpTotalSupply)).toFixed(2) : '0.00'}</div>
                                    <div onClick={()=>setSideOpen(pool.lpTokenSymbol)} className="h-1/2 w-[10px] flex items-center justify-center hover:opacity-70 cursor-pointer">►</div>
                                </div>
                            ))}
                            {loading && <div className="h-full w-full flex items-center justify-center">
                                <div className="text-white">Loading data...</div>
                            </div>}
                            {error &&  <div className="h-full w-full flex items-center justify-center">
                                <div className="text-red-500">Error: {error}</div>
                            </div>}
                        </div>
                    </>
                    ):(
                    <>
                        <div className="h-[10%] w-full flex items-center justify-center rounded bg-neutral-800 font-semibold">
                            <div className="h-full w-1/5 flex items-center justify-center">ERC20 Token</div>
                            <div className="h-full w-1/5 flex items-center justify-center">Token Name</div>
                            <div className="h-full w-1/5 flex items-center justify-center">Token Symbol</div>
                            <div className="h-full w-1/5 flex items-center justify-center">Balance</div>
                            <div className="h-full w-1/5 flex items-center justify-center">Total Supply (Gwei)</div>
                        </div>
                        <div className="h-[90%] w-full flex flex-col items-center justify-start pt-[7px]">
                            {tokens.map((token, idx)=>(
                                <div key={idx} className="h-[7%] w-full flex items-center justify-center">
                                    <div className="h-full w-1/5 flex items-center justify-center"><CopyButton address={token.tokenAddress as `0x${string}`}/></div>
                                    <div className="h-full w-1/5 flex items-center justify-center">{token.tokenName}</div>
                                    <div className="h-full w-1/5 flex items-center justify-center">{token.tokenSymbol}</div>
                                    <div className="h-full w-1/5 flex items-center justify-center">{token.balance}</div>
                                    <div className="h-full w-1/5 flex items-center justify-center">{Number(token.tokenTotalSupply)/10**18}</div>
                                </div>
                            ))}
                            {loading && <div className="h-full w-full flex items-center justify-center">
                                <div className="text-white">Loading data...</div>
                            </div>}
                            {error &&  <div className="h-full w-full flex items-center justify-center">
                                <div className="text-red-500">Error: {error}</div>
                            </div>}
                        </div>
                    </>
                    )}
                </div>
            </div>


            <div className="h-[90%] w-[30%] flex flex-col items-center justify-start bg-neutral-800 rounded">
                <div className="h-[10vh] w-full flex items-center justify-center text-[154%] font-semibold">Create New Pool</div>
                <form id="tokenForm" onSubmit={handleCreatePool} className="h-auto w-[90%] flex flex-col items-center justify-center gap-[2vh]">
                    <div className="h-auto w-full flex flex-col items-center justify-center gap-[10px]">
                        <div className="h-[] w-full flex items-center justify-center text-[120%]">Token 1 Address</div>
                        <input
                        type="text"
                        id="token1"
                        name="token1"
                        placeholder="0x..."
                        required
                        pattern="0x[a-fA-F0-9]{40}"
                        title="Enter a valid ERC20 token address"
                        value={token1Address}
                        onChange={(e) => setToken1Address(e.target.value)}
                        className="h-[40px] w-full border-1 border-white rounded focus:outline-2 focus:outline-white px-[4px]"
                        />
                    </div>
                    <div className="h-auto w-full flex flex-col items-center justify-center gap-[10px]">
                        <div className="h-[] w-full flex items-center justify-center text-[120%]">Token 2 Address</div>
                        <input
                        type="text"
                        id="token2"
                        name="token2"
                        placeholder="0x..."
                        required
                        pattern="0x[a-fA-F0-9]{40}"
                        title="Enter a valid ERC20 token address"
                        value={token2Address}
                        onChange={(e) => setToken2Address(e.target.value)}
                        className="h-[40px] w-full border-1 border-white rounded focus:outline-2 focus:outline-white px-[4px]"
                        />
                    </div>
                    <button type="submit" className="h-auto w-auto p-[10px] rounded border-1 border-white bg-white text-black text-[90%] hover:opacity-70 cursor-pointer font-semibold">Create New Pool</button>
                </form>
            </div>
        </div>
    )
}