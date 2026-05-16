import React from 'react';

export default function LoadingState() {
  return (
    <div className="glass-card animate-fade-in" style={{ textAlign: "center", padding: "3rem", marginBottom: 24 }}>
      <div style={{ fontSize: 32, marginBottom: 16, animation: "pulse 1.5s infinite" }}>⏳</div>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "var(--text-main)" }}>Analysing your report...</p>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-muted)" }}>This takes about 10–15 seconds</p>
    </div>
  );
}
