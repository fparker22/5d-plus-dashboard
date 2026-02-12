"use client";

import { useState } from "react";
import { Plus, X, Tag } from "lucide-react";

const DIMENSIONS = [
    { id: "P", name: "Purpose", color: "var(--color-purpose)" },
    { id: "SE", name: "Student Engagement", color: "var(--color-engagement)" },
    { id: "CP", name: "Curriculum & Pedagogy", color: "var(--color-curriculum)" },
    { id: "A", name: "Assessment", color: "var(--color-assessment)" },
    { id: "CEC", name: "Classroom Environment & Culture", color: "var(--color-culture)" },
];

export default function StepCoding({ data, updateData, onNext, onBack }) {
    const [selectedText, setSelectedText] = useState("");
    const [selectedDim, setSelectedDim] = useState(null);

    const handleAddEvidence = () => {
        if (!selectedText || !selectedDim) return;

        const newEvidence = {
            id: Date.now(),
            text: selectedText,
            dimension: selectedDim,
            timestamp: "00:00" // Mock timestamp
        };

        updateData({ evidence: [...data.evidence, newEvidence] });
        setSelectedText("");
        setSelectedDim(null);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", height: "100%" }}>

            {/* Left: Transcript View */}
            <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
                <h3 style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between" }}>
                    Transcript
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Select text to code</span>
                </h3>
                <textarea
                    value={data.transcript}
                    readOnly
                    onSelect={(e) => {
                        const start = e.target.selectionStart;
                        const end = e.target.selectionEnd;
                        if (start !== end) {
                            setSelectedText(data.transcript.substring(start, end));
                        }
                    }}
                    style={{
                        flex: 1,
                        background: "rgba(0,0,0,0.2)",
                        color: "var(--text-primary)",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        padding: "1rem",
                        resize: "none",
                        fontFamily: "monospace",
                        lineHeight: "1.6"
                    }}
                />
            </div>

            {/* Right: Coding Panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                {/* Coding Actions */}
                <div className="glass-panel" style={{ padding: "1.5rem" }}>
                    <h4 style={{ marginBottom: "1rem", fontWeight: "600" }}>Apply Code</h4>

                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem", display: "block" }}>
                            Selected Evidence:
                        </label>
                        <div style={{
                            padding: "0.75rem",
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: "var(--radius-sm)",
                            fontStyle: "italic",
                            minHeight: "3rem"
                        }}>
                            "{selectedText || "Select text from transcript..."}"
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                        {DIMENSIONS.map((dim) => (
                            <button
                                key={dim.id}
                                onClick={() => setSelectedDim(dim.id)}
                                style={{
                                    padding: "0.5rem 1rem",
                                    borderRadius: "99px",
                                    border: selectedDim === dim.id ? `2px solid ${dim.color}` : "1px solid var(--border-glass)",
                                    background: selectedDim === dim.id ? "rgba(255,255,255,0.1)" : "transparent",
                                    color: dim.color,
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "0.85rem"
                                }}
                            >
                                {dim.id}
                            </button>
                        ))}
                    </div>

                    <button
                        className="glass-button"
                        onClick={handleAddEvidence}
                        disabled={!selectedText || !selectedDim}
                        style={{ width: "100%", opacity: (!selectedText || !selectedDim) ? 0.5 : 1 }}
                    >
                        <Plus size={18} style={{ marginRight: "0.5rem" }} />
                        Add to Matrix
                    </button>
                </div>

                {/* Coded Evidence List */}
                <div className="glass-panel" style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
                    <h4 style={{ marginBottom: "1rem", fontWeight: "600" }}>Coded Evidence ({data.evidence.length})</h4>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {data.evidence.map((item) => {
                            const dimColor = DIMENSIONS.find(d => d.id === item.dimension)?.color;
                            return (
                                <div key={item.id} style={{
                                    padding: "1rem",
                                    background: "rgba(255,255,255,0.03)",
                                    borderRadius: "var(--radius-md)",
                                    borderLeft: `3px solid ${dimColor}`
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                        <span style={{ color: dimColor, fontWeight: "700", fontSize: "0.8rem" }}>{item.dimension}</span>
                                        <button onClick={() => {
                                            updateData({ evidence: data.evidence.filter(e => e.id !== item.id) });
                                        }}>
                                            <X size={14} style={{ opacity: 0.5 }} />
                                        </button>
                                    </div>
                                    <p style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>{item.text}</p>
                                </div>
                            );
                        })}

                        {data.evidence.length === 0 && (
                            <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "2rem" }}>
                                No evidence coded yet.
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button className="glass-button" onClick={onBack} style={{ background: "transparent" }}>Back</button>
                    <button className="glass-button" onClick={onNext} style={{ background: "var(--text-accent)", color: "#000" }}>Next: Analysis</button>
                </div>
            </div>
        </div>
    );
}
