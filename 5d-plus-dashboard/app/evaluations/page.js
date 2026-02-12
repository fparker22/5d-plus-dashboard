"use client";

import { Activity, Filter } from "lucide-react";

export default function EvaluationsPage() {
    return (
        <div style={{ paddingRight: "2rem" }}>
            <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: "2rem", fontWeight: "700" }}>Evaluations</h2>
                    <p style={{ color: "var(--text-secondary)" }}>Manage and review teacher evaluations</p>
                </div>
                <button className="glass-button" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <Filter size={18} />
                    Filter
                </button>
            </header>

            <div className="glass-panel">
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    <Activity size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                    <p>No evaluations found. Start a new evaluation to see it here.</p>
                </div>
            </div>
        </div>
    );
}
