import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ABI from "../abis/ImprovedLottery.json";
import { useTranslation } from "react-i18next";

export default function LiveFeed({ provider, contractAddress }) {
  const { t } = useTranslation();
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    if (!provider || !contractAddress) return;
    let contract;
    try {
      contract = new ethers.Contract(contractAddress, ABI, provider);
    } catch (e) {
      console.error("LiveFeed contract init error", e);
      return;
    }

    const onBought = (buyer, round) => {
      const short = `${buyer.slice(0,6)}...${buyer.slice(-4)}`;
      setFeed(prev => {
        const next = [{ text: `${short} bought a ticket — 30 MATIC`, time: Date.now() }, ...prev];
        return next.slice(0, 30);
      });
    };

    // subscribe (provider must be WebSocket or EIP-1193 provider; ethers will use event polling if needed)
    contract.on("TicketBought", onBought);

    // optional: fetch recent Transfer events from chain (skipped - relies on events)
    return () => {
      try { contract.off("TicketBought", onBought); } catch (e) {}
    };
  }, [provider, contractAddress]);

  return (
    <div className="card">
      <div className="title">{t("currentJackpot")}</div>
      <div className="muted">Live feed</div>
      <div style={{marginTop:12}}>
        {feed.length === 0 && <div className="muted">No recent buys yet</div>}
        {feed.map((f, i) => <div key={i} className="live-item">{f.text}</div>)}
      </div>
      <div style={{marginTop:12}} className="muted">{t("footerNote")}</div>
    </div>
  );
}
