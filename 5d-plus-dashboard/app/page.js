"use client";

import Link from "next/link";
import {
    FileCheck,
    Clock,
    Users,
    ArrowRight,
    Activity
} from "lucide-react";

export default function Dashboard() {
    const stats = [
        { label: "Pending Reviews", value: "3", icon: Clock, color: "var(--color-engagement)" },
        { label: "Completed Evals", value: "12", icon: FileCheck, color: "var(--color-curriculum)" },
        { label: "Active Teachers", value: "24", icon: Users, color: "var(--text-accent)" },
    ];

    return (
        <div style={{ paddingRight: "2rem" }}>
            <header style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "2rem", fontWeight: "700" }}>Dashboard</h2>
                <p style={{ color: "var(--text-secondary)" }}>
                    Welcome back, Administrator. You have 3 evaluations pending review.
                </p>
            </header>

            {/* Stats Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1.5rem",
                marginBottom: "2.5rem"
            }}>
                {stats.map((stat) => (
                    <div key={stat.label} className="glass-panel" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{
                            padding: "1rem",
                            borderRadius: "50%",
                            background: `rgba(255, 255, 255, 0.05)`,
                            color: stat.color
                        }}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: "2rem", fontWeight: "700" }}>{stat.value}</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Activity size={20} className="text-accent" />
                Recent Activity
            </h3>

            <div className="glass-panel" style={{ padding: "0" }}>
                {[1, 2, 3].map((i) => (
                    <div key={i} style={{
                        padding: "1.5rem",
                        borderBottom: i < 3 ? "1px solid var(--border-glass)" : "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--text-secondary)", opacity: 0.2 }}></div>
                            <div>
                                <div style={{ fontWeight: "600" }}>Jane Doe - Observation</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Mathematics • Grade 8</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <span style={{
                                padding: "0.25rem 0.75rem",
                                borderRadius: "99px",
                                background: "rgba(244, 114, 182, 0.2)",
                                color: "var(--color-purpose)",
                                fontSize: "0.75rem",
                                fontWeight: "600"
                            }}>In Progress</span>
                            <button className="glass-button" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}>
                                Resume
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
