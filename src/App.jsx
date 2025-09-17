import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import en from "./i18n/en.json";
import es from "./i18n/es.json";
// import other languages similarly (zh, ja, de, ru, fr, ko)
import LotteryAbi from "./abis/ImprovedLottery.json";

const LANGS = {
  en: { name: "English", data: en },
  es: { name: "Español", data: es },
  // add mapping: 'zh': { name: '中文', data: zh }, etc.
  // keep English as default
};

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
const RPC_FALLBACK = import.meta.env.VITE_PUBLIC_RPC || "";

export default function App() {
  const [lang, setLang] = useState("en");
  const t = LANGS[lang]?.data || en;

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  const [pool, setPool] = useState("0.0");
  const [ticketsCount, setTicketsCount] = useState(0);
  const [ticketPrice, setTicketPrice] = useState(null);
  const [userTickets, setUserTickets] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initProvider();
    loadPublicData();
    // eslint-disable-next-line
  }, []);

  function initProvider() {
    if (window.ethereum) {
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      // auto-detect account change
      window.ethereum?.on?.("accountsChanged", () => {
        window.location.reload();
      });
      window.ethereum?.on?.("chainChanged", () => {
        window.location.reload();
      });
    }
  }

  async function loadPublicData() {
    try {
      const rpc = RPC_FALLBACK || null;
      const rpcProvider = rpc ? new ethers.JsonRpcProvider(rpc) : (provider ? provider : new ethers.getDefaultProvider());
      if (!CONTRACT_ADDRESS || !LotteryAbi || !LotteryAbi.abi) {
        // nothing to fetch until contract and ABI are provided
        return;
      }
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LotteryAbi.abi, rpcProvider);
      const price = await contract.ticketPrice();
      setTicketPrice(ethers.formatEther(price));
      const count = await contract.ticketsCount();
      setTicketsCount(Number(count.toString()));
      const bal = await rpcProvider.getBalance(CONTRACT_ADDRESS);
      setPool(ethers.formatEther(bal));
    } catch (e) {
      console.warn("loadPublicData:", e);
    }
  }

  async function connectWallet() {
    if (!window.ethereum) return alert("Install MetaMask or compatible wallet");
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      const s = await p.getSigner();
      setSigner(s);
      const addr = await s.getAddress();
      setAccount(addr);
      // load user-specific
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LotteryAbi.abi, s);
      const userTicketsBN = await contract.ticketsOf(addr);
      setUserTickets(Number(userTicketsBN.toString()));
      loadPublicData();
    } catch (err) {
      console.error("connect:", err);
      alert("Connection failed");
    }
  }

  async function buyTicket() {
    if (!signer) return await connectWallet();
    setLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LotteryAbi.abi, signer);
      const priceEth = await contract.ticketPrice();
      const tx = await contract.buyTicket({ value: priceEth });
      await tx.wait();
      alert("Ticket purchased!");
      await loadPublicData();
      const addr = await signer.getAddress();
      const userTicketsBN = await contract.ticketsOf(addr);
      setUserTickets(Number(userTicketsBN.toString()));
    } catch (e) {
      console.error("buyTicket error", e);
      alert("Purchase failed");
    }
    setLoading(false);
  }

  function shortAddr(a = "") {
    return a ? `${a.slice(0,6)}...${a.slice(-4)}` : "";
  }

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo">LC</div>
          <div>
            <div className="title">{t.title}</div>
            <div className="small">Decentralized lottery — 90% to winner, 10% to project</div>
          </div>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div className="lang">
            <select value={lang} onChange={(e)=>setLang(e.target.value)} style={{background:"transparent",color:"var(--text)",border:"none"}}>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="ru">Русский</option>
              <option value="fr">Français</option>
              <option value="ko">한국어</option>
            </select>
          </div>

          {account ? (
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div className="small">{t.connected_as}: {shortAddr(account)}</div>
              <button className="ghost" onClick={()=>{ setAccount(null); window.location.reload(); }}>{t.disconnect || "Disconnect"}</button>
            </div>
          ):(
            <button className="button" onClick={connectWallet}>{t.connect_wallet}</button>
          )}
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <h2 className="h1">{t.cta_enter}</h2>
          <p className="p">Participate by buying a ticket. Prize pool is distributed automatically by the smart contract: 90% to winner, 10% retained by project.</p>

          <div style={{marginTop:18}}>
            <div className="row"><div className="small">{t.pool}</div><div>{pool} ETH</div></div>
            <div className="row"><div className="small">{t.tickets}</div><div>{ticketsCount}</div></div>
            <div className="row"><div className="small">{t.price_per_ticket}</div><div>{ticketPrice ? ticketPrice + " ETH" : "—"}</div></div>
            <div className="row"><div className="small">{t.your_tickets}</div><div>{userTickets}</div></div>
            <div style={{marginTop:16, display:"flex",gap:12}}>
              <button className="button" onClick={buyTicket} disabled={loading || !CONTRACT_ADDRESS}>{loading ? "Processing..." : t.buy_ticket}</button>
              <button className="ghost" onClick={loadPublicData}>Refresh</button>
            </div>
          </div>
        </section>

        <aside className="card">
          <div style={{marginBottom:12}}>
            <strong>How it works</strong>
            <p className="small">Connect your MetaMask, buy a ticket (0.0025 ETH each), and wait for the next draw. The team triggers a random draw (Chainlink VRF) and winner receives 90% of the pool.</p>
          </div>

          <div style={{marginTop:12}}>
            <strong>Quick links</strong>
            <div style={{marginTop:8, display:"flex",flexDirection:"column",gap:8}}>
              <a className="ghost" href="#rules">Rules</a>
              <a className="ghost" href="#terms">Terms</a>
              <a className="ghost" href="#contact">Contact</a>
            </div>
          </div>
        </aside>
      </main>

      <footer className="footer">
        <div>© {new Date().getFullYear()} Lottery Chain</div>
        <div>Contract: {CONTRACT_ADDRESS ? `${CONTRACT_ADDRESS.slice(0,6)}...${CONTRACT_ADDRESS.slice(-4)}` : "Not set"}</div>
      </footer>
    </div>
  );
}
