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
    reserve0: string,
    reserve1: string,
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
    const [isSideOpen, setIsSideOpen] = useState<boolean>(false);
    const [sidePool, setSidePool] = useState<Pools>();

    const [pools, setPools] = useState<Pools[]>([]);
    const [tokens, setTokens] = useState<Tokens[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const {address, walletBalance, fetchWalletBalance} = useWallet();

    const [token1Address, setToken1Address] = useState('');
    const [token2Address, setToken2Address] = useState('');
    const [token1AddAmount, setToken1AddAmount] = useState('');
    const [token2AddAmount, setToken2AddAmount] = useState('');
    const [token1RemoveAmount, setToken1RemoveAmount] = useState('');
    const [token2RemoveAmount, setToken2RemoveAmount] = useState('');
    const [token1SwapAmount, setToken1SwapAmount] = useState('');
    const [token2SwapAmount, setToken2SwapAmount] = useState('');
    
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
    }, [address]);

    const handleCreatePool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token1Address || !token2Address) return;
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('http://localhost:3001/api/create-pool', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token1: token1Address, token2: token2Address }),
            });
            const data = await res.json();
            if (data.success) {
                setError(null);
                alert(`Pool created successfully!\nPool Address: ${data.pool}\nTx Hash: ${data.txHash}`);
                
                setToken1Address('');
                setToken2Address('');
                
                const poolsRes = await fetch('http://localhost:3001/api/pools', {
                    method: 'POST', headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({walletAddress: address}) 
                });
                if(!poolsRes.ok) throw new Error('Failed to fetch pools');
                const { pools: newPools } = await poolsRes.json();
                setPools(newPools);
                
                fetchWalletBalance();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error('Error creating pool:', err);
            alert('Failed to create pool. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLiquidity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token1AddAmount || !token2AddAmount) return;
        try{
            const res = await fetch('http://localhost:3001/api/liquidity/add', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    poolAddress: sidePool?.pool,
                    amount0: token1AddAmount, 
                    amount1: token2AddAmount
                }) 
            })
            if(!res.ok) throw new Error('Failed to add liquidity');
            alert(`Liqudity added successfully to pool: ${sidePool?.pool}`);
        }catch(err){console.error('Error creating pool:', err);}
    }
    
    const handleRemoveLiquidity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token1RemoveAmount || !token2RemoveAmount) return;
        try{
            const res = await fetch('http://localhost:3001/api/liquidity/remove', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    poolAddress: sidePool?.pool,
                    amount0: token1RemoveAmount, 
                    amount1: token2RemoveAmount
                }) 
            })
            if(!res.ok) throw new Error('Failed to remove liquidity');
            alert(`Liqudity removed successfully from pool: ${sidePool?.pool}`);
        }catch{}
    }
    
    const handleSwap = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token1SwapAmount && !token2SwapAmount) return;
        try{
            const res = await fetch('http://localhost:3001/api/liquidity/swap', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    poolAddress: sidePool?.pool,
                    amount: token1SwapAmount || token2SwapAmount,
                }) 
            })
            if(!res.ok) throw new Error('Failed to swap liquidity');
            alert(`Liqudity swapped successfully in pool: ${sidePool?.pool}`);
        }catch{}
    }

    return(
        <div className="h-full w-full flex items-center justify-center gap-[10px]">
            <div className="h-[90%] w-[60%] flex flex-col items-center justify-center border-r-1 border-white">
                <div className="h-[10%] w-[90%] flex items-center justify-center gap-[10px] font-semibold">
                    <button onClick={()=>{setOpen(0);setIsSideOpen(false)}} className="h-auto w-[100px] p-[10px] rounded border-1 border-white bg-white text-black text-[90%] hover:opacity-70 cursor-pointer">Pools</button>
                    <button onClick={()=>{setOpen(1);setIsSideOpen(false)}} className="h-auto w-[100px] p-[10px] rounded border-1 border-white bg-white text-black text-[90%] hover:opacity-70 cursor-pointer">Tokens</button>
                </div>
                <div className="h-[90%] w-[90%] flex flex-col items-center justify-center">
                    {open===0?(
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
                        <div className="h-[90%] w-full flex flex-col items-center justify-start pt-[7px] overflow-y-auto overflow-scroll">
                            {pools.map((pool, idx)=>(
                                <div key={idx} className="h-[7%] w-full flex items-center justify-center">
                                    <div className="h-full w-1/7 flex items-center justify-center"><CopyButton address={pool.pool}/></div>
                                    <div className="h-full w-1/7 flex items-center justify-center">{pool.token0}</div>
                                    <div className="h-full w-1/7 flex items-center justify-center">{pool.token1}</div>
                                    <div className="h-full w-1/7 flex items-center justify-center"><CopyButton address={pool.lpTokenAddress}/></div>
                                    <div className="h-full w-1/7 flex items-center justify-center">{pool.lpTokenSymbol}</div>
                                    <div className="h-full w-1/7 flex items-center justify-center">{Number(pool.balance)/10**18}</div>
                                    <div className="h-full w-1/7 flex items-center justify-center">{Number(pool.lpTotalSupply) > 0 ? (Number(pool.balance) * 100 / Number(pool.lpTotalSupply)).toFixed(2) : '0.00'}</div>
                                    <div onClick={()=>{setIsSideOpen(true);setSidePool(pool);}} className="h-1/2 w-[10px] flex items-center justify-center hover:opacity-70 cursor-pointer">►</div>
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
                        <div className="h-[90%] w-full flex flex-col items-center justify-start pt-[7px] overflow-y-auto">
                            {tokens.map((token, idx)=>(
                                <div key={idx} className="h-[7%] w-full flex items-center justify-center">
                                    <div className="h-full w-1/5 flex items-center justify-center"><CopyButton address={token.tokenAddress as `0x${string}`}/></div>
                                    <div className="h-full w-1/5 flex items-center justify-center">{token.tokenName}</div>
                                    <div className="h-full w-1/5 flex items-center justify-center">{token.tokenSymbol}</div>
                                    <div className="h-full w-1/5 flex items-center justify-center">{Number(token.balance)/10**18}</div>
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

            <div className="relative h-[90%] w-[30%] flex flex-col items-center justify-start bg-neutral-800 rounded">
                {isSideOpen?(
                <>
                    {Number(sidePool?.lpTotalSupply)===0 && <div className="absolute top-[10px] right-[10px] h-auto w-auto p-[10px] text-[100%] font-semibold rounded border-2 border-white bg-green-700">Bootstrap</div>}
                    <div className="h-[20%] w-full flex flex-col items-center justify-center text-[107%] font-semibold">
                        <span>Liquidity Pool</span>
                        <span className="text-[154%]">{sidePool?.lpTokenSymbol}</span>
                        <span>&nbsp;</span>
                        <span>Total Supply: {Number(sidePool?.lpTotalSupply)/10**18}</span>
                        {Number(sidePool?.lpTotalSupply)!==0 && <span>{`Current Exchange: 1 ${sidePool?.token0} = ${Number(sidePool?.reserve0)/Number(sidePool?.reserve1)} ${sidePool?.token1}`}</span>}
                    </div>
                    
                    <div className="h-[5%] w-[90%] flex items-center justify-center rounded bg-black font-semibold">
                        <div className="h-full w-1/4 flex items-center justify-center">Token</div>
                        <div className="h-full w-1/4 flex items-center justify-center">Address</div>
                        <div className="h-full w-1/4 flex items-center justify-center">Symbol</div>
                        <div className="h-full w-1/4 flex items-center justify-center">Reserve</div>
                    </div>
                    <div className="h-[5%] w-[90%] flex items-center justify-center">
                        <div className="h-full w-1/4 flex items-center justify-center">1</div>
                        <div className="h-full w-1/4 flex items-center justify-center p-[2px]">
                            <CopyButton address={tokens.find((token)=>token.tokenSymbol===sidePool?.token0)?.tokenAddress as `0x${string}` || "0x"}/>
                        </div>
                        <div className="h-full w-1/4 flex items-center justify-center">{sidePool?.token0}</div>
                        <div className="h-full w-1/4 flex items-center justify-center">{Number(sidePool?.reserve0)/10**18}</div>
                    </div>
                    <div className="h-[5%] w-[90%] flex items-center justify-center">
                        <div className="h-full w-1/4 flex items-center justify-center">2</div>
                        <div className="h-full w-1/4 flex items-center justify-center p-[2px]">
                            <CopyButton address={tokens.find((token)=>token.tokenSymbol===sidePool?.token1)?.tokenAddress as `0x${string}` || "0x"}/>
                        </div>
                        <div className="h-full w-1/4 flex items-center justify-center">{sidePool?.token1}</div>
                        <div className="h-full w-1/4 flex items-center justify-center">{Number(sidePool?.reserve1)/10**18}</div>
                    </div>
                    



                    <div className="relative h-[55%] w-[90%] flex flex-col items-center justify-center">
                        <div className="h-[9.5%] w-full"></div>

                        <div className="h-[27%] w-full flex items-center justify-center">
                            <form id="tokenForm" onSubmit={handleAddLiquidity} className="h-auto w-[90%] flex items-center justify-center gap-[2vh]">
                                <div className="h-full w-2/3 flex flex-col items-center justify-cente gap-[10px]">
                                    <div className="h-auto w-full flex items-center justify-center gap-[10px]">
                                        <div className="h-auto w-auto flex items-center justify-center text-[120%]">{sidePool?.token0}</div>
                                        <input
                                        type="text"
                                        id="token1"
                                        name="token1"
                                        placeholder="amount"
                                        required
                                        value={token1AddAmount}
                                        onChange={(e) => setToken1AddAmount(e.target.value)}
                                        className="h-[40px] w-full border-1 border-white rounded focus:outline-2 focus:outline-white px-[4px]"
                                        />
                                    </div>
                                    <div className="h-auto w-full flex items-center justify-center gap-[10px]">
                                        <div className="h-auto w-auto flex items-center justify-center text-[120%]">{sidePool?.token1}</div>
                                        <input
                                        type="text"
                                        id="token2"
                                        name="token2"
                                        placeholder="amount"
                                        required
                                        value={token2AddAmount}
                                        onChange={(e) => setToken2AddAmount(e.target.value)}
                                        className="h-[40px] w-full border-1 border-white rounded focus:outline-2 focus:outline-white px-[4px]"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="h-full w-1/3 p-[10px] rounded border-1 border-white bg-white text-black text-[90%] hover:opacity-70 cursor-pointer font-semibold">Add Liquidity</button>
                            </form>
                        </div>

                        {Number(sidePool?.lpTotalSupply)===0 && <div className="absolute top-[36.5%] h-[27%] w-full bg-neutral-800 opacity-50"></div>}
                        <div className="h-[27%] w-full flex items-center justify-center">
                            <form id="tokenForm" onSubmit={handleRemoveLiquidity} className="h-auto w-[90%] flex items-center justify-center gap-[2vh]">
                                <div className="h-full w-2/3 flex flex-col items-center justify-cente gap-[10px]">
                                    <div className="h-auto w-full flex items-center justify-center gap-[10px]">
                                        <div className="h-auto w-auto flex items-center justify-center text-[120%]">{sidePool?.token0}</div>
                                        <input
                                        type="text"
                                        id="token1"
                                        name="token1"
                                        placeholder="amount"
                                        required
                                        value={token1RemoveAmount}
                                        onChange={(e) => setToken1RemoveAmount(e.target.value)}
                                        className="h-[40px] w-full border-1 border-white rounded focus:outline-2 focus:outline-white px-[4px]"
                                        />
                                    </div>
                                    <div className="h-auto w-full flex items-center justify-center gap-[10px]">
                                        <div className="h-auto w-auto flex items-center justify-center text-[120%]">{sidePool?.token1}</div>
                                        <input
                                        type="text"
                                        id="token2"
                                        name="token2"
                                        placeholder="amount"
                                        required
                                        value={token2RemoveAmount}
                                        onChange={(e) => setToken2RemoveAmount(e.target.value)}
                                        className="h-[40px] w-full border-1 border-white rounded focus:outline-2 focus:outline-white px-[4px]"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="h-full w-1/3 p-[10px] rounded border-1 border-white bg-white text-black text-[90%] hover:opacity-70 cursor-pointer font-semibold">Remove Liquidity</button>
                            </form>
                        </div>
                        
                        {Number(sidePool?.lpTotalSupply)===0 && <div className="absolute top-[63.5%] h-[27%] w-full bg-neutral-800 opacity-50"></div>}
                        <div className="h-[27%] w-full flex items-center justify-center">
                            <form id="tokenForm" onSubmit={handleSwap} className="h-auto w-[90%] flex items-center justify-center gap-[2vh]">
                                <div className="h-full w-2/3 flex flex-col items-center justify-cente gap-[10px]">
                                    <div className="h-auto w-full flex items-center justify-center gap-[10px]">
                                        <div className={`h-auto w-auto flex items-center justify-center text-[120%] ${token2SwapAmount?'opacity-40':''}`}>{sidePool?.token0}</div>
                                        <input
                                        type="text"
                                        id="token1"
                                        name="token1"
                                        placeholder="amount"
                                        required
                                        disabled={token2SwapAmount!==''}
                                        value={token1SwapAmount}
                                        onChange={(e) => setToken1SwapAmount(e.target.value)}
                                        className={`h-[40px] w-full border-1 border-white rounded focus:outline-2 focus:outline-white px-[4px] ${token2SwapAmount?'opacity-40 cursor-not-allowed':''}`}
                                        />
                                    </div>
                                    <div className="h-auto w-full flex items-center justify-center gap-[10px]">
                                        <div className={`h-auto w-auto flex items-center justify-center text-[120%] ${token1SwapAmount?'opacity-40':''}`}>{sidePool?.token1}</div>
                                        <input
                                        type="text"
                                        id="token2"
                                        name="token2"
                                        placeholder="amount"
                                        required
                                        disabled={token1SwapAmount!==''}
                                        value={token2SwapAmount}
                                        onChange={(e) => setToken2SwapAmount(e.target.value)}
                                        className={`h-[40px] w-full border-1 border-white rounded focus:outline-2 focus:outline-white px-[4px] ${token1SwapAmount?'opacity-40 cursor-not-allowed':''}`}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="h-full w-1/3 p-[10px] rounded border-1 border-white bg-white text-black text-[90%] hover:opacity-70 cursor-pointer font-semibold">Swap</button>
                            </form>
                        </div>

                        <div className="h-[9.5%] w-full"></div>
                    </div>


                    <div className="h-[10%] w-[90%] flex items-center justify-center border-t-1 border-white">
                        <button onClick={()=>setIsSideOpen(false)} className="h-auto w-auto p-[10px] rounded border-1 border-white bg-white text-black text-[90%] hover:opacity-70 cursor-pointer font-semibold">Create New Pool</button>
                    </div>
                </>
                ):(
                <>
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
                </>
                )}
            </div>
        </div>
    )
}