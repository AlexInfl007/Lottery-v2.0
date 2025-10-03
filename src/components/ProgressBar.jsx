import React from "react";

export default function ProgressBar({ amount }) {
  // amount is BigNumber or number in MATIC units (string/number)
  // We don't cap the width — we show an animated repeating gradient relative to amount.
  // For simplicity, display amount and show fill percentage relative to a 1,000 MATIC visual baseline.
  const parsed = Number(amount) || 0;
  const baseline = 1000; // visual baseline for percent. no hard cap: above baseline will show 100% with pulsing.
  const percent = Math.min(100, (parsed / baseline) * 100);
  const style = { width: `${percent}%` };

  return (
    <div>
      <div className="progress-track" role="progressbar" aria-valuenow={parsed} aria-valuemin="0">
        <div className="progress-fill" style={style}></div>
        <div className="progress-text">{parsed.toFixed(4)} MATIC</div>
      </div>
      <div className="muted" style={{marginTop:8}}>No hard cap — bar grows as pool grows (visual baseline {baseline} MATIC)</div>
    </div>
  );
}
