"use client";

import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
    return (
        <div style={{ paddingRight: "2rem" }}>
            <header style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "2rem", fontWeight: "700" }}>Settings</h2>
                <p style={{ color: "var(--text-secondary)" }}>Configure dashboard preferences</p>
            </header>

            <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                <SettingsIcon size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                <p>Settings configuration coming soon.</p>
            </div>
        </div>
    );
}
