import React, { useState } from 'react';
import RiskBadge from './RiskBadge';
import VoiceReadout from './VoiceReadout';
import { exportReportPdf } from '../utils/api';

const statusColors = {
  normal:         { bg: "var(--status-normal-bg)", color: "var(--status-normal-fg)", label: "All values normal" },
  attention_needed: { bg: "var(--status-attn-bg)", color: "var(--status-attn-fg)", label: "Some values need attention" },
  urgent_review:  { bg: "var(--status-urgent-bg)", color: "var(--status-urgent-fg)", label: "Please see a doctor soon" },
};

const ValidationBadge = ({ status }) => {
  if (!status || status === "MATCH") {
    return <span className="text-green-600 text-xs font-bold" title="Validated against original text">✓</span>;
  }
  if (status === "UNVERIFIED") {
    return <span className="text-orange-500 text-xs font-bold" title="Could not verify against original text">?</span>;
  }
  return <span className="text-red-600 text-xs font-bold" title="Mismatch with original text">✗</span>;
};

export default function ReportDisplay({ result }) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [mode, setMode] = useState("patient"); // "patient" or "clinical"

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

  const summaryText = mode === "patient" ? result.patient_summary : result.clinical_summary;
  // Handle fallback if backend returns old format "summary" or missing panels
  const displaySummary = summaryText || result.summary || "No summary available.";
  const panels = result.panels || (result.parameters ? [{ name: "General Panel", summary: "", parameters: result.parameters }] : []);

  return (
    <div className="animate-fade-in delay-200">
      
      {/* Confidence Banner */}
      {result.confidence_score !== undefined && result.confidence_score < 60 && (
        <div style={{
          background: "var(--status-attn-bg)", color: "var(--status-attn-fg)",
          borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 16, fontSize: 14, fontWeight: 600,
          border: "1px solid var(--status-attn-fg)"
        }}>
          ⚠️ Low scan quality detected (Confidence: {result.confidence_score.toFixed(1)}/100). Please verify values against your original report.
        </div>
      )}

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
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <VoiceReadout report={{ ...result, summary: displaySummary }} language={result.language} />
          <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button 
              onClick={() => setMode("patient")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === "patient" ? "bg-white shadow-sm text-slate-800 font-medium" : "text-slate-500 hover:text-slate-700"}`}
            >
              Patient Mode
            </button>
            <button 
              onClick={() => setMode("clinical")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === "clinical" ? "bg-white shadow-sm text-slate-800 font-medium" : "text-slate-500 hover:text-slate-700"}`}
            >
              Doctor Mode
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDownloadPdf}
          disabled={exportingPdf}
          className="btn-secondary"
        >
          {exportingPdf ? "⏳ Generating..." : "📥 Download PDF"}
        </button>
      </div>

      <div className="glass-card hover-lift" style={{ padding: "20px 24px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Summary ({mode === "patient" ? "Plain Language" : "Clinical"})</h2>
        <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>{displaySummary}</p>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Your Results</h2>
      
      {panels.map((panel, pIndex) => (
        <div key={pIndex} className="mb-6">
          {panel.name && <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--text-main)" }}>{panel.name}</h3>}
          {panel.summary && <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 12 }}>{panel.summary}</p>}
          
          {panel.parameters && panel.parameters.map((p, i) => (
            <div key={i} className="glass-card hover-lift" style={{
              padding: "16px 20px", marginBottom: 16
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 16, display: "flex", alignItems: "center", gap: "8px" }}>
                  {p.name}
                  <ValidationBadge status={p.validation_status} />
                </span>
                <RiskBadge level={p.risk_level} />
              </div>
              <div style={{ display: "flex", gap: 24, fontSize: 14, color: "var(--text-muted)", marginBottom: 10 }}>
                <span>Your value: <strong style={{ color: "var(--text-main)" }}>{p.value}</strong></span>
                <span>Normal: {p.normal_range}</span>
              </div>
              {p.flag && (
                <div style={{ fontSize: 13, color: "var(--status-attn-fg)", marginBottom: 8, fontWeight: 500 }}>⚠ {p.flag}</div>
              )}
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                {mode === "patient" ? p.patient_explanation : p.clinical_explanation || p.explanation}
              </p>
            </div>
          ))}
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
