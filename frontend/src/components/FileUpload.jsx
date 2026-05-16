import React from 'react';
import { useDropzone } from 'react-dropzone';

export default function FileUpload({ onUpload, isUploading, fileName }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [], "application/pdf": [] },
    maxFiles: 1,
    onDrop: async (files) => {
      if (files.length > 0) {
        onUpload(files[0]);
      }
    },
  });

  return (
    <div
      {...getRootProps()}
      className="hover-lift"
      style={{
        border: `2px dashed ${isDragActive ? "var(--primary)" : "var(--surface-border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "3rem",
        textAlign: "center",
        cursor: "pointer",
        background: isDragActive ? "var(--status-normal-bg)" : "var(--surface)",
        marginBottom: 32,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      <input {...getInputProps()} />
      <div style={{ fontSize: 40, marginBottom: 12, opacity: isDragActive ? 1 : 0.7 }}>📄</div>
      {isDragActive
        ? <p style={{ color: "var(--primary)", margin: 0, fontWeight: 500 }}>Drop it here...</p>
        : <p style={{ color: "var(--text-muted)", margin: 0, fontSize: 15 }}>
            Drag and drop your report here, or <strong style={{ color: "var(--primary)", fontWeight: 600 }}>click to browse</strong><br />
            <span style={{ fontSize: 13, opacity: 0.8, display: "inline-block", marginTop: 8 }}>PDF, JPG, PNG — max 10MB</span>
          </p>
      }
      {fileName && !isUploading && (
        <p className="animate-fade-in" style={{ marginTop: 12, fontSize: 14, color: "var(--primary)", fontWeight: 500 }}>
          Selected: {fileName}
        </p>
      )}
    </div>
  );
}
