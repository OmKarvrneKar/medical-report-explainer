import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useReport } from '../hooks/useReport';
import LanguageSelector from '../components/LanguageSelector';
import FileUpload from '../components/FileUpload';
import LoadingState from '../components/LoadingState';
import ReportDisplay from '../components/ReportDisplay';

export default function Home() {
  const navigate = useNavigate();
  const { language, setLanguage, loading, result, error, fileName, handleUpload } = useReport();

  return (
    <div className="glass-panel animate-fade-in-up" style={{ padding: "2.5rem" }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 20,
      }}>
        <h1 className="text-gradient" style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>
          Medical Report Explainer
        </h1>
        <button
          onClick={() => navigate("/history")}
          className="btn-secondary hover-lift"
        >
          📋 History
        </button>
      </div>
      <p style={{ color: "var(--text-muted)", marginBottom: 32, fontSize: 16 }}>
        Upload your lab report and get a plain-language explanation instantly.
      </p>

      <LanguageSelector language={language} setLanguage={setLanguage} />
      <FileUpload onUpload={handleUpload} isUploading={loading} fileName={fileName} />

      {loading && <LoadingState />}

      {error && (
        <div className="animate-fade-in" style={{ background: "var(--status-urgent-bg)", border: "1px solid var(--status-urgent-fg)", borderRadius: 12, padding: "16px", color: "var(--status-urgent-fg)", fontSize: 14, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {result && <ReportDisplay result={result} />}
    </div>
  );
}
