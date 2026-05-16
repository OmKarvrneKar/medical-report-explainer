import React, { useState } from 'react';
import RiskBadge from './RiskBadge';
import VoiceReadout from './VoiceReadout';
import { exportReportPdf } from '../utils/api';

const statusColors = {
  normal:         { bg: "var(--status-normal-bg)", color: "var(--status-normal-fg)", label: "All values normal" },
  attention_needed: { bg: "var(--status-attn-bg)", color: "var(--status-attn-fg)", label: "Some values need attention" },
  urgent_review:  { bg: "var(--status-urgent-bg)", color: "var(--status-urgent-fg)", label: "Please see a doctor soon" },
};

export default function ReportDisplay({ result }) {
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!result?.id) {
      alert("Please upload or save a report first.");
      return;
    }
    setExportingPdf(true);
    try {
      const blob     = await exportReportPdf(result.id);
      const url      = window.URL.createObjectURL(blob);
      const link     = document.createElement("a");
      link.href      = url;
      link.download  = `medical_report_${result.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Could not generate PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  if (!result) return null;

  return (
    <div className="animate-fade-in delay-200">
      <div style={{
        background: statusColors[result.overall_status]?.bg || "var(--status-normal-bg)",
        color: statusColors[result.overall_status]?.color || "var(--status-normal-fg)",
        borderRadius: "var(--radius-lg)", padding: "16px 20px", marginBottom: 24, fontSize: 16, fontWeight: 600,
        boxShadow: "var(--shadow-sm)"
      }}>
        {statusColors[result.overall_status]?.label}
      </div>

      <div className="glass-card" style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        flexWrap:       "wrap",
        gap:            16,
        marginBottom:   24,
        padding:        "16px 20px",
      }}>
        <VoiceReadout report={result} language={result.language} />
        
        <button
          onClick={handleDownloadPdf}
          disabled={exportingPdf}
          className="btn-secondary"
        >
          {exportingPdf ? "⏳ Generating..." : "📥 Download PDF"}
        </button>
      </div>

      <div className="glass-card hover-lift" style={{ padding: "20px 24px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Summary</h2>
        <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>{result.summary}</p>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Your Results</h2>
      {result.parameters && result.parameters.map((p, i) => (
        <div key={i} className="glass-card hover-lift" style={{
          padding: "16px 20px", marginBottom: 16
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{p.name}</span>
            <RiskBadge level={p.risk_level} />
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 14, color: "var(--text-muted)", marginBottom: 10 }}>
            <span>Your value: <strong style={{ color: "var(--text-main)" }}>{p.value}</strong></span>
            <span>Normal: {p.normal_range}</span>
          </div>
          {p.flag && (
            <div style={{ fontSize: 13, color: "var(--status-attn-fg)", marginBottom: 8, fontWeight: 500 }}>⚠ {p.flag}</div>
          )}
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{p.explanation}</p>
        </div>
      ))}

      <div className="glass-card hover-lift" style={{ background: "var(--bg-gradient)", padding: "20px 24px", marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>What to do next</h2>
        <p style={{ fontSize: 15, color: "var(--text-main)", margin: "0 0 12px", lineHeight: 1.6 }}>{result.what_to_do || result.advice}</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, fontStyle: "italic", opacity: 0.8 }}>{result.disclaimer}</p>
      </div>
    </div>
  );
}
