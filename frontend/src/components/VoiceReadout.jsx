import { useState, useEffect, useRef } from "react";

export default function VoiceReadout({ report, language }) {
  const [speaking,  setSpeaking]  = useState(false);
  const [paused,    setPaused]    = useState(false);
  const [supported, setSupported] = useState(true);
  const utteranceRef              = useRef(null);

  // Check browser support on mount
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setSupported(false);
    }
    // Cleanup: stop speech if user navigates away
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Stop speech whenever a new report loads
  useEffect(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, [report]);

  // ── Build the full script from report data ─────────────────────────────────
  const buildScript = () => {
    if (!report) return "";

    const lines = [];

    lines.push("Medical Report Summary.");
    lines.push(report.summary);
    lines.push(""); // natural pause

    if (report.parameters?.length) {
      lines.push(`Now let's go through your ${report.parameters.length} test results.`);

      report.parameters.forEach((p, i) => {
        lines.push(`Test ${i + 1}. ${p.name}.`);
        lines.push(`Your result is ${p.value}.`);
        lines.push(`The normal range is ${p.normal_range}.`);
        if (p.risk_level !== "normal") {
          lines.push(`Status: ${p.flag || "Outside normal range"}.`);
        }
        lines.push(p.explanation);
        lines.push(""); // pause between tests
      });
    }

    lines.push("What to do next.");
    lines.push(report.what_to_do);
    lines.push(report.disclaimer);

    return lines.join(" ");
  };

  // ── Language code map → BCP-47 codes for Web Speech API ───────────────────
  const getLangCode = () => {
    const map = {
      English: "en-IN",
      Hindi:   "hi-IN",
      Marathi: "mr-IN",
      Kannada: "kn-IN",
      Tamil:   "ta-IN",
      Telugu:  "te-IN",
    };
    return map[language] || "en-IN";
  };

  // ── Controls ───────────────────────────────────────────────────────────────
  const handlePlay = () => {
    if (!supported) return;
    window.speechSynthesis.cancel(); // clear any existing

    const script    = buildScript();
    const utterance = new SpeechSynthesisUtterance(script);
    const langCode  = getLangCode();
    utterance.lang  = langCode;
    utterance.rate  = 0.92;   // slightly slower = clearer for medical terms
    utterance.pitch = 1;
    utterance.volume = 1;

    // Explicitly find and set the voice for better cross-browser language support
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.lang.startsWith(langCode) || v.lang.startsWith(langCode.split('-')[0]));
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onstart  = () => { setSpeaking(true);  setPaused(false); };
    utterance.onend    = () => { setSpeaking(false); setPaused(false); };
    utterance.onerror  = () => { setSpeaking(false); setPaused(false); };
    utterance.onpause  = () => setPaused(true);
    utterance.onresume = () => setPaused(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setPaused(true);
  };

  const handleResume = () => {
    window.speechSynthesis.resume();
    setPaused(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  };

  // ── Not supported ──────────────────────────────────────────────────────────
  if (!supported) {
    return (
      <span style={{ fontSize: 12, color: "#aaa", fontStyle: "italic" }}>
        Voice not supported in this browser
      </span>
    );
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const btn = (disabled = false, type = "btn-secondary") => ({
    display:        "inline-flex",
    alignItems:     "center",
    gap:            6,
    padding:        "8px 16px",
    fontSize:       13,
    fontWeight:     500,
    border:         "none",
    borderRadius:   24,
    cursor:         disabled ? "not-allowed" : "pointer",
    transition:     "opacity 0.15s",
    opacity:        disabled ? 0.7 : 1,
  });

  const pulsingDot = {
    width:            8,
    height:           8,
    borderRadius:     "50%",
    background:       "#E24B4A",
    display:          "inline-block",
    animation:        "pulse 1.2s infinite",
    flexShrink:       0,
  };

  return (
    <div style={{
      display:        "flex",
      alignItems:     "center",
      gap:            8,
      flexWrap:       "wrap",
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>

      {/* Not speaking — show Play button */}
      {!speaking && (
        <button className="btn-primary hover-lift" style={{ padding: "8px 16px", fontSize: 13 }} onClick={handlePlay}>
          🔊 Listen to report
        </button>
      )}

      {/* Speaking — show live controls */}
      {speaking && (
        <>
          <span style={pulsingDot}></span>
          <span style={{ fontSize: 13, color: "var(--status-urgent-fg)", fontWeight: 500 }}>
            Reading aloud...
          </span>

          {!paused ? (
            <button className="btn-secondary" style={btn()} onClick={handlePause}>
              ⏸ Pause
            </button>
          ) : (
            <button className="btn-primary hover-lift" style={{ padding: "8px 16px", fontSize: 13 }} onClick={handleResume}>
              ▶ Resume
            </button>
          )}

          <button className="btn-secondary hover-lift" style={{ ...btn(), color: "var(--status-urgent-fg)" }} onClick={handleStop}>
            ⏹ Stop
          </button>
        </>
      )}
    </div>
  );
}
