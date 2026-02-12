"use client";

import { UploadCloud } from "lucide-react";

export default function StepUpload({ data, updateData, onNext }) {

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Mock reading file - In real app, use FileReader
            const mockTranscript = `00:00 - T: Good morning everyone. Today we are learning about...
00:15 - S: Is this related to yesterday's lesson?
00:20 - T: Yes, exactly! Great connection. [P3]`;

            updateData({ transcript: mockTranscript, fileName: file.name });
        }
    };

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Upload Transcript</h3>

            <div style={{ marginBottom: "2rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>
                    Teacher & Date
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                    <input
                        type="text"
                        placeholder="Teacher Name or ID"
                        value={data.teacherId}
                        onChange={(e) => updateData({ teacherId: e.target.value })}
                        className="glass-input"
                    />
                    <input
                        type="date"
                        value={data.date}
                        onChange={(e) => updateData({ date: e.target.value })}
                        className="glass-input"
                    />
                </div>
            </div>

            <div style={{
                border: "2px dashed var(--border-glass)",
                borderRadius: "var(--radius-lg)",
                padding: "3rem",
                textAlign: "center",
                background: "rgba(255,255,255,0.02)",
                cursor: "pointer",
                transition: "all 0.2s"
            }}
                onClick={() => document.getElementById("file-upload").click()}
            >
                <input
                    id="file-upload"
                    type="file"
                    style={{ display: "none" }}
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileUpload}
                />
                <UploadCloud size={48} style={{ color: "var(--text-accent)", marginBottom: "1rem" }} />
                <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                    {data.fileName ? data.fileName : "Click to upload transcript"}
                </h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    Supported formats: .txt, .pdf, .docx
                </p>
            </div>

            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                <button
                    className="glass-button"
                    onClick={onNext}
                    disabled={!data.transcript} // Require transcript
                    style={{
                        opacity: data.transcript ? 1 : 0.5,
                        cursor: data.transcript ? "pointer" : "not-allowed",
                        background: "var(--text-accent)",
                        color: "#0f172a"
                    }}
                >
                    Continue to Coding
                </button>
            </div>
        </div>
    );
}
