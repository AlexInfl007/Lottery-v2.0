import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";

export default function Header({ onConnect, connected, account, onDisconnect }) {
  const { t } = useTranslation();

  return (
    <div className="header">
      <div className="header-left">
        <div className="logo">LC</div>
        <div>
          <div className="title">{t("siteName")}</div>
          <div className="muted">{t("footerNote")}</div>
        </div>
      </div>

      <div className="header-right">
        <LanguageSelector />
        {!connected ? (
          <button className="btn btn-primary" onClick={onConnect}>{t("connectWallet")}</button>
        ) : (
          <>
            <div className="muted" style={{padding:"8px 12px",borderRadius:10,background:"rgba(255,255,255,0.02)"}}>{account ? `${account.slice(0,6)}...${account.slice(-4)}` : t("connected")}</div>
            <button className="btn btn-ghost" onClick={onDisconnect}>{t("disconnect")}</button>
          </>
        )}
      </div>
    </div>
  );
}
