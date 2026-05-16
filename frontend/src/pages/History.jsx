import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchHistory, fetchReportById, deleteReport, exportReportPdf } from "../utils/api";
import VoiceReadout from "../components/VoiceReadout";

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  normal:           { bg: "var(--status-normal-bg)", color: "var(--status-normal-fg)", label: "All Normal",      dot: "var(--status-normal-fg)" },
  attention_needed: { bg: "var(--status-attn-bg)", color: "var(--status-attn-fg)", label: "Needs Attention", dot: "var(--status-attn-fg)" },
  urgent_review:    { bg: "var(--status-urgent-bg)", color: "var(--status-urgent-fg)", label: "Urgent Review",   dot: "var(--status-urgent-fg)" },
};

const RISK_STYLES = {
  normal: { bg: "var(--status-normal-bg)", color: "var(--status-normal-fg)" },
  low:    { bg: "var(--status-attn-bg)", color: "var(--status-attn-fg)" },
  high:   { bg: "var(--status-urgent-bg)", color: "var(--status-urgent-fg)" },
};

const formatDate = (iso) => {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// ── sub-components ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.normal;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 500,
      padding: "3px 10px", borderRadius: 20,
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }}></span>
      {s.label}
    </span>
  );
};

const RiskBadge = ({ level }) => {
  const s = RISK_STYLES[level] || RISK_STYLES.normal;
  return (
    <span style={{
      ...s, fontSize: 11, fontWeight: 500,
      padding: "2px 8px", borderRadius: 20,
      textTransform: "capitalize",
    }}>
      {level}
    </span>
  );
};

// ── Report detail modal ───────────────────────────────────────────────────────
const ReportModal = ({ report, onClose }) => {
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!report?.id) return;
    setExportingPdf(true);
    try {
      const blob     = await exportReportPdf(report.id);
      const url      = window.URL.createObjectURL(blob);
      const link     = document.createElement("a");
      link.href      = url;
      link.download  = `medical_report_${report.id}.pdf`;
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

  if (!report) return null;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "flex-start",
      justifyContent: "center",
      padding: "2rem 1rem",
      zIndex: 1000,
      overflowY: "auto",
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--surface-solid)", borderRadius: "var(--radius-lg)",
        width: "100%", maxWidth: 680,
        padding: "2rem",
        boxShadow: "var(--shadow-lg)",
      }}>
        {/* Modal header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Report Details</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
              {formatDate(report.created_at)} · {report.language || "English"}
            </p>
          </div>
          <button onClick={onClose} className="btn-secondary">
            ✕ Close
          </button>
        </div>

        {/* Overall status */}
        <div style={{
          background: STATUS_STYLES[report.overall_status]?.bg || "var(--status-normal-bg)",
          color: STATUS_STYLES[report.overall_status]?.color || "var(--status-main)",
          borderRadius: "var(--radius-md)", padding: "12px 16px",
          marginBottom: 16, fontSize: 14, fontWeight: 600,
        }}>
          {STATUS_STYLES[report.overall_status]?.label || "Status unknown"}
        </div>

        {/* Action Row: Voice + Download */}
        <div className="glass-card" style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          flexWrap:       "wrap",
          gap:            12,
          margin:         "16px 0",
          padding:        "16px",
        }}>
          <VoiceReadout report={report} language={report.language} />
          
          <button
            onClick={handleDownloadPdf}
            disabled={exportingPdf}
            className="btn-secondary"
          >
            {exportingPdf ? "⏳ Generating..." : "📥 Download PDF"}
          </button>
        </div>

        {/* Summary */}
        <div className="glass-card hover-lift" style={{
          padding: "16px 20px", marginBottom: 20,
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Summary</p>
          <p style={{ margin: 0, fontSize: 15, color: "var(--text-main)", lineHeight: 1.7 }}>{report.summary}</p>
        </div>

        {/* Parameters */}
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Test Results</p>
        {(report.parameters || []).map((p, i) => (
          <div key={i} className="glass-card hover-lift" style={{
            padding: "14px 16px", marginBottom: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
              <RiskBadge level={p.risk_level} />
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
              <span>Your value: <strong style={{ color: "var(--text-main)" }}>{p.value}</strong></span>
              <span>Normal: {p.normal_range}</span>
            </div>
            {p.flag && (
              <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--status-attn-fg)", fontWeight: 500 }}>⚠ {p.flag}</p>
            )}
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{p.explanation}</p>
          </div>
        ))}

        {/* What to do */}
        <div className="glass-card hover-lift" style={{
          background: "var(--bg-gradient)", padding: "16px 20px", marginTop: 20,
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>What to do</p>
          <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-main)", lineHeight: 1.6 }}>{report.what_to_do}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>{report.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};

// ── Main History page ─────────────────────────────────────────────────────────
export default function History() {
  const navigate                        = useNavigate();
  const [reports,    setReports]        = useState([]);
  const [loading,    setLoading]        = useState(true);
  const [error,      setError]          = useState(null);
  const [page,       setPage]           = useState(1);
  const [hasMore,    setHasMore]        = useState(false);
  const [selected,   setSelected]       = useState(null);   // full report shown in modal
  const [loadingId,  setLoadingId]      = useState(null);   // which row is loading
  const [deletingId, setDeletingId]     = useState(null);   // which row is deleting
  const LIMIT = 10;

  // fetch list on mount + page change
  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHistory(page, LIMIT);
      // backend may return { reports: [], total: N } or just []
      const list = Array.isArray(data) ? data : (data.reports || []);
      const total = data.total || list.length;
      setReports(list);
      setHasMore(list.length === LIMIT);
    } catch {
      setError("Could not load history. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    setLoadingId(id);
    try {
      const report = await fetchReportById(id);
      // parse parameters if stored as JSON string
      if (typeof report.parameters === "string") {
        try { report.parameters = JSON.parse(report.parameters); } catch {}
      }
      setSelected(report);
    } catch {
      alert("Could not load this report. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Could not delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="glass-panel animate-fade-in-up delay-100" style={{ padding: "2.5rem" }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <button
          onClick={() => navigate("/")}
          className="btn-secondary hover-lift"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-gradient" style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Report History</h1>
          <p style={{ margin: "4px 0 0", fontSize: 15, color: "var(--text-muted)" }}>
            All your previously analysed lab reports
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#888" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
          <p style={{ margin: 0, fontSize: 14 }}>Loading your reports...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          background: "#FCEBEB", border: "1px solid #F09595",
          borderRadius: 10, padding: "14px 16px",
          color: "#791F1F", fontSize: 14, marginBottom: 16,
        }}>
          {error}
          <button
            onClick={loadHistory}
            style={{ marginLeft: 12, fontSize: 12, cursor: "pointer", color: "#791F1F", textDecoration: "underline", background: "none", border: "none", padding: 0 }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && reports.length === 0 && (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "#fafafa", borderRadius: 14,
          border: "1px dashed #ddd",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <p style={{ margin: "0 0 4px", fontWeight: 500, color: "#444" }}>No reports yet</p>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#888" }}>
            Upload your first lab report to see it here.
          </p>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "#185FA5", color: "#fff",
              border: "none", borderRadius: 24,
              padding: "10px 24px", fontSize: 13,
              fontWeight: 500, cursor: "pointer",
            }}
          >
            Upload a report
          </button>
        </div>
      )}

      {/* Report list */}
      {!loading && reports.map((report) => {
        const st = STATUS_STYLES[report.overall_status] || STATUS_STYLES.normal;
        return (
          <div key={report.id} className="glass-card hover-lift" style={{
            padding: "16px 20px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}>
            {/* Status dot */}
            <div style={{
              width: 12, height: 12, borderRadius: "50%",
              background: st.dot, flexShrink: 0,
            }} />

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <StatusBadge status={report.overall_status} />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {report.language || "English"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
                {formatDate(report.created_at)}
              </p>
              {report.summary && (
                <p style={{
                  margin: "6px 0 0", fontSize: 14, color: "var(--text-main)",
                  whiteSpace: "nowrap", overflow: "hidden",
                  textOverflow: "ellipsis", maxWidth: "90%",
                }}>
                  {report.summary}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => handleView(report.id)}
                disabled={loadingId === report.id}
                className="btn-primary"
                style={{ padding: "8px 16px", fontSize: 13 }}
              >
                {loadingId === report.id ? "Loading..." : "View"}
              </button>

              <button
                onClick={() => handleDelete(report.id)}
                disabled={deletingId === report.id}
                className="btn-secondary"
                style={{ padding: "8px 14px", color: "var(--status-urgent-fg)" }}
              >
                {deletingId === report.id ? "..." : "🗑"}
              </button>
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {!loading && reports.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "8px 18px", fontSize: 13,
              background: page === 1 ? "#f0f0f0" : "#fff",
              color: page === 1 ? "#aaa" : "#333",
              border: "1px solid #ddd", borderRadius: 8, cursor: page === 1 ? "not-allowed" : "pointer",
            }}
          >
            ← Prev
          </button>
          <span style={{ padding: "8px 14px", fontSize: 13, color: "#666" }}>
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            style={{
              padding: "8px 18px", fontSize: 13,
              background: !hasMore ? "#f0f0f0" : "#fff",
              color: !hasMore ? "#aaa" : "#333",
              border: "1px solid #ddd", borderRadius: 8, cursor: !hasMore ? "not-allowed" : "pointer",
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Report detail modal */}
      <ReportModal
        report={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
