import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function HowItWorks(){
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="how-card" onMouseLeave={()=>setOpen(false)}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div className="muted">{t("howItWorks")}</div>
        <button className="btn btn-ghost" onMouseEnter={()=>setOpen(true)} onClick={()=>setOpen(!open)}>{t("howItWorks")}</button>
      </div>

      {open && (
        <div className="how-popup">
          <div style={{fontWeight:700,marginBottom:8}}>{t("howItWorks")}</div>
          <ol style={{margin:0,paddingLeft:18}}>
            {t("howSteps", { returnObjects: true }).map((s,idx)=>(
              <li key={idx} style={{marginBottom:8}}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
