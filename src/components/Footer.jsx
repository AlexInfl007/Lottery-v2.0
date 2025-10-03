import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <div>© {new Date().getFullYear()} Lottery Chain</div>
      <div className="small">Contract: {process.env.VITE_CONTRACT_ADDRESS || "Not set"}</div>
    </footer>
  );
}
