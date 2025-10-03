import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function LuckyButton({ onClick }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";

  // single phrase per session: saved in sessionStorage under "lucky_phrase_index_{lang}"
  const phrases = t("luckyPhrases", { returnObjects: true });
  const key = `lucky_phrase_index_${lang}`;

  const [index, setIndex] = useState(() => {
    const s = sessionStorage.getItem(key);
    if (s !== null) return Number(s);
    const idx = Math.floor(Math.random() * phrases.length);
    sessionStorage.setItem(key, String(idx));
    return idx;
  });

  // Allow phrase to change once user revisits in new session (sessionStorage cleared on tab close)
  useEffect(() => {
    // if language changed, ensure we have phrase for that language
    const s = sessionStorage.getItem(key);
    if (s === null) {
      const idx = Math.floor(Math.random() * phrases.length);
      sessionStorage.setItem(key, String(idx));
      setIndex(idx);
    } else {
      setIndex(Number(s));
    }
  }, [lang]); // recalc when language changes

  const phrase = (phrases && phrases[index]) || "";

  return (
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <button className="btn btn-primary" onClick={onClick}>
        {t("participate")}
      </button>

      <div className="tooltip">
        <button className="btn btn-ghost" style={{padding:"10px 14px",borderRadius:12,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontWeight:700}}>{t("feelingLucky")}</span>
        </button>
        <div className="tooltiptext">{phrase}</div>
      </div>
    </div>
  );
}
