"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    PlusCircle
} from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Teachers", href: "/teachers", icon: Users },
        { name: "Evaluations", href: "/evaluations", icon: FileText },
        { name: "Settings", href: "/settings", icon: Settings },
    ];

    return (
        <aside className="glass-panel" style={{
            height: "calc(100vh - 4rem)",
            marginTop: "2rem",
            marginBottom: "2rem",
            marginLeft: "2rem",
            display: "flex",
            flexDirection: "column",
            padding: "1.5rem"
        }}>
            <div style={{ marginBottom: "3rem", paddingLeft: "0.5rem" }}>
                <h1 style={{
                    fontSize: "1.5rem",
                    fontWeight: "800",
                    background: "linear-gradient(to right, #38bdf8, #818cf8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                }}>
                    5D+ Console
                </h1>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                    Agentic Evaluation Tool
                </p>
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                padding: "0.75rem 1rem",
                                borderRadius: "var(--radius-md)",
                                background: isActive ? "rgba(56, 189, 248, 0.15)" : "transparent",
                                color: isActive ? "var(--text-accent)" : "var(--text-secondary)",
                                transition: "all 0.2s"
                            }}
                            className="nav-item"
                        >
                            <Icon size={20} />
                            <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--border-glass)" }}>
                <button className="glass-button" style={{ width: "100%", display: "flex", justifyContent: "center", gap: "0.5rem", alignItems: "center" }}>
                    <PlusCircle size={18} />
                    New Eval
                </button>
            </div>
        </aside>
    );
}
