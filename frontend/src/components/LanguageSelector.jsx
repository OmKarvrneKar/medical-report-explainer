import React from 'react';

const LANGUAGES = ["English", "Hindi", "Marathi", "Kannada", "Tamil", "Telugu"];

export default function LanguageSelector({ language, setLanguage }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
      <label style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>Language:</label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--surface-border)", fontSize: 14, background: "var(--surface)", color: "var(--text-main)", cursor: "pointer", outline: "none", boxShadow: "var(--shadow-sm)" }}
      >
        {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
      </select>
    </div>
  );
}
