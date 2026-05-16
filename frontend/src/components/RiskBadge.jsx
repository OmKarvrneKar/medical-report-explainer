import React from 'react';

export default function RiskBadge({ level }) {
  const styles = {
    normal:    { background: "var(--status-normal-bg)", color: "var(--status-normal-fg)" },
    low:       { background: "var(--status-attn-bg)", color: "var(--status-attn-fg)" },
    high:      { background: "var(--status-urgent-bg)", color: "var(--status-urgent-fg)" },
  };
  return (
    <span style={{
      ...styles[level] || styles.normal,
      padding: "2px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 500,
      textTransform: "capitalize"
    }}>
      {level}
    </span>
  );
}
