import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import Header from "./components/Header";
import ProgressBar from "./components/ProgressBar";
import LuckyButton from "./components/LuckyButton";
import LiveFeed from "./components/LiveFeed";
import HowItWorks from "./components/HowItWorks";
import ABI from "./abis/ImprovedLottery.json";
import { useTranslation } from "react-i18next";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const PUBLIC_RPC = import.meta.env.VITE_PUBLIC_RPC || "https://polygon-rpc.com";

export default function App(){
  const { t } = useTranslation();

  const [provider, setProvider] = useState(null); // ethers provider (Web3 provider when wallet connected)
  const [readProvider, setReadProvider] = useState(null); // public JSON-RPC provider for reads/events fallback
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [poolAmount, setPoolAmount] = useState(0);
  const [round, setRound] = useState(0);
  const [ticketsCount, setTicketsCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(()=>{
    const p = new ethers.JsonRpcProvider(PUBLIC_RPC);
    setReadProvider(p);
  },[]);

  // when readProvider available, create read-only contract for pool queries
  useEffect(()=>{
    if(!readProvider) return;
    try{
      const rc = new ethers.Contract(CONTRACT_ADDRESS, ABI, readProvider);
      setContract(rc);
    }catch(e){
      console.error("read contract init", e);
    }
  },[readProvider]);

  // fetch pool data periodically
  useEffect(()=>{
    let mounted = true;
    async function refresh(){
      try{
        if(!contract) return;
        const pool = await contract.prizePool();
        const tickets = await contract.ticketsCount();
        const roundN = await contract.round();
        const poolMatic = Number(ethers.formatEther(pool));
        if(mounted){
          setPoolAmount(poolMatic);
          setTicketsCount(Number(tickets));
          setRound(Number(roundN));
        }
      }catch(e){
        console.error("refresh error", e);
      }
    }
    refresh();
    const id = setInterval(refresh, 10000);
    return ()=>{ mounted=false; clearInterval(id); };
  },[contract]);

  // subscribe to provider when user connects
  useEffect(()=>{
    if(!provider) return;
    const handleAccounts = (accounts) => {
      if(accounts.length === 0){
        setConnected(false); setAccount(null); setSigner(null);
      } else {
        setAccount(accounts[0]);
        setConnected(true);
        const s = provider.getSigner();
        setSigner(s);
      }
    };
    // EIP-1193
    try{
      provider.on && provider.on("accountsChanged", handleAccounts);
    }catch(e){}
    return ()=>{
      try{ provider.removeListener && provider.removeListener("accountsChanged", handleAccounts); }catch(e){}
    };
  },[provider]);

  const connectWallet = async ()=>{
    try{
      if(!window.ethereum) { setStatusMsg("MetaMask not found"); return; }
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const signerLocal = await web3Provider.getSigner();
      const addr = await signerLocal.getAddress();
      setProvider(web3Provider);
      setSigner(signerLocal);
      setAccount(addr);
      setConnected(true);

      // create contract connected with signer for write operations
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, ABI, signerLocal);
      setContract(contractWithSigner);
      setStatusMsg("");
    }catch(e){
      console.error(e);
      setStatusMsg("Connection failed");
    }
  };

  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setConnected(false);
    setStatusMsg("Disconnected");
    // note: can't programmatically disconnect MetaMask from the dapp; this is local
  };

  const handleBuy = async () => {
    try{
      if(!signer) { setStatusMsg("Connect wallet"); return; }
      // ticket price 30 MATIC
      const tx = await signer.sendTransaction({ to: CONTRACT_ADDRESS, value: ethers.parseEther("30") });
      setStatusMsg("Waiting for confirmation...");
      await tx.wait();
      setStatusMsg("Ticket bought!");
    }catch(e){
      console.error(e);
      setStatusMsg("Purchase failed");
    }
  };

  // "I'm feeling lucky" triggers same as buy but with small animation; here we call buy as well
  const handleLucky = async ()=>{
    await handleBuy();
  };

  return (
    <div className="container">
      <Header onConnect={connectWallet} connected={connected} account={account} onDisconnect={disconnect} />
      <div className="row" style={{marginTop:18,alignItems:"flex-start"}}>
        <div className="left">
          <div className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div className="title">{t("currentJackpot")}</div>
                <div className="muted">{t("poolProgress")}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div className="muted">{t("round")}: {round}</div>
                <div style={{fontWeight:700,fontSize:18}}>{poolAmount.toFixed(4)} MATIC</div>
              </div>
            </div>

            <div style={{marginTop:18}}>
              <ProgressBar amount={poolAmount} />
            </div>

            <div style={{marginTop:18}}>
              <LuckyButton onClick={handleLucky} />
            </div>

            <div style={{marginTop:12}} className="muted">Tickets sold: {ticketsCount}</div>
            <div style={{marginTop:12}} className="muted">{statusMsg}</div>
          </div>

          <div style={{marginTop:12}}>
            <HowItWorks />
          </div>
        </div>

        <div className="right">
          <LiveFeed provider={readProvider} contractAddress={CONTRACT_ADDRESS} />
        </div>
      </div>

      <div className="footer">
        <div>{t("footerNote")} — Chainlink VRF</div>
        <div style={{marginTop:10}} className="muted">Contract: {CONTRACT_ADDRESS}</div>
      </div>
    </div>
  );
}
