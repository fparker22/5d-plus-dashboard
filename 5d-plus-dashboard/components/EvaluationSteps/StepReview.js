"use client";

import { CheckCircle, Download, Mail } from "lucide-react";

export default function StepReview({ data, onBack }) {
    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <div style={{
                    width: "60px",
                    height: "60px",
                    background: "var(--color-curriculum)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem auto",
                    color: "#000"
                }}>
                    <CheckCircle size={32} />
                </div>
                <h3 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Ready to Finalize</h3>
                <p style={{ color: "var(--text-secondary)" }}>
                    Review the evaluation summary below before generating artifacts.
                </p>
            </div>

            <div className="glass-panel" style={{ padding: "2rem", flex: 1, marginBottom: "2rem", overflowY: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                    <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>TEACHER</label>
                        <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>{data.teacherId}</div>
                    </div>
                    <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>DATE</label>
                        <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>{data.date}</div>
                    </div>
                </div>

                <div style={{ marginBottom: "2rem" }}>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>CODED EVIDENCE</label>
                    <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>{data.evidence.length} items coded</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ padding: "1rem", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)" }}>
                        <div style={{ color: "var(--color-engagement)", fontWeight: "700", marginBottom: "0.25rem" }}>GLOWS</div>
                        <div>{data.analysis.glows.length} items</div>
                    </div>
                    <div style={{ padding: "1rem", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)" }}>
                        <div style={{ color: "var(--color-curriculum)", fontWeight: "700", marginBottom: "0.25rem" }}>GROWS</div>
                        <div>{data.analysis.grows.length} items</div>
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <button className="glass-button" style={{ justifyContent: "center", display: "flex", gap: "0.5rem" }}>
                    <Download size={18} />
                    Export PDF Packet
                </button>
                <button className="glass-button" style={{ justifyContent: "center", display: "flex", gap: "0.5rem", background: "var(--text-accent)", color: "#000" }}>
                    <Mail size={18} />
                    Send Email Summary
                </button>
            </div>

            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                <button onClick={onBack} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", textDecoration: "underline" }}>
                    Back to Analysis
                </button>
            </div>
        </div>
    );
}
