import { useState } from "react";
import { useWallet } from "../context/WalletContext";

function CopyButton({ address }:{ address: `0x${string}`|undefined}) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const {isConnected} = useWallet();

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const displayText = copied ? "Copied!" : hovered ? "Copy" : `${address?.substring(0, 4)}...${address?.substring(address.length - 4)}`;

  return (
    <button
      className="h-auto w-[100px] p-[10px] rounded bg-white text-black text-[90%] hover:opacity-70 cursor-pointer transition-all duration-200"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCopy}
    >
      {isConnected?displayText:''}
    </button>
  );
}

export default CopyButton;
