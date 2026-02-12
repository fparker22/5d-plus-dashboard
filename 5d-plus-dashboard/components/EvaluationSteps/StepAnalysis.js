"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function StepAnalysis({ data, updateData, onNext, onBack }) {
    const [activeTab, setActiveTab] = useState("glows");

    const categories = [
        { id: "glows", label: "Glows", icon: "✨", color: "var(--color-engagement)" },
        { id: "grows", label: "Grows", icon: "🌱", color: "var(--color-curriculum)" },
        { id: "noticings", label: "Noticings", icon: "👀", color: "var(--text-accent)" },
        { id: "wonderings", label: "Wonderings", icon: "🤔", color: "var(--color-assessment)" },
    ];

    const handleAddItem = () => {
        const newItem = { id: Date.now(), text: "" };
        const currentList = data.analysis[activeTab] || [];
        updateData({
            analysis: {
                ...data.analysis,
                [activeTab]: [...currentList, newItem]
            }
        });
    };

    const handleUpdateItem = (id, text) => {
        const currentList = data.analysis[activeTab];
        const updatedList = currentList.map(item => item.id === id ? { ...item, text } : item);
        updateData({
            analysis: {
                ...data.analysis,
                [activeTab]: updatedList
            }
        });
    };

    const handleDeleteItem = (id) => {
        const currentList = data.analysis[activeTab];
        updateData({
            analysis: {
                ...data.analysis,
                [activeTab]: currentList.filter(item => item.id !== id)
            }
        });
    };

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <h3 style={{ marginBottom: "1.5rem" }}>Analysis & Feedback</h3>

            <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "2rem", flex: 1 }}>

                {/* Sidebar Tabs */}
                <div className="glass-panel" style={{ padding: "1rem", height: "fit-content" }}>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            style={{
                                width: "100%",
                                padding: "1rem",
                                textAlign: "left",
                                marginBottom: "0.5rem",
                                borderRadius: "var(--radius-md)",
                                background: activeTab === cat.id ? "rgba(255,255,255,0.1)" : "transparent",
                                color: activeTab === cat.id ? "var(--text-primary)" : "var(--text-secondary)",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                fontWeight: activeTab === cat.id ? "600" : "400",
                                transition: "all 0.2s"
                            }}
                        >
                            <span style={{ fontSize: "1.2rem" }}>{cat.icon}</span>
                            {cat.label}
                            <span style={{ marginLeft: "auto", fontSize: "0.8rem", opacity: 0.5 }}>
                                {data.analysis[cat.id]?.length || 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", alignItems: "center" }}>
                        <h4 style={{ fontSize: "1.25rem", color: categories.find(c => c.id === activeTab).color }}>
                            {categories.find(c => c.id === activeTab).label}
                        </h4>
                        <button className="glass-button" onClick={handleAddItem} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
                            <Plus size={16} style={{ marginRight: "0.5rem" }} />
                            Add New
                        </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", flex: 1, paddingRight: "0.5rem" }}>
                        {(data.analysis[activeTab] || []).map((item) => (
                            <div key={item.id} style={{ display: "flex", gap: "1rem", alignItems: "start" }}>
                                <textarea
                                    value={item.text}
                                    onChange={(e) => handleUpdateItem(item.id, e.target.value)}
                                    placeholder={`Enter ${categories.find(c => c.id === activeTab).label.slice(0, -1)} details...`}
                                    className="glass-input"
                                    style={{ minHeight: "80px", resize: "vertical" }}
                                />
                                <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    style={{
                                        padding: "0.75rem",
                                        background: "rgba(248, 113, 113, 0.2)",
                                        color: "#f87171",
                                        border: "none",
                                        borderRadius: "var(--radius-md)",
                                        cursor: "pointer"
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {(data.analysis[activeTab] || []).length === 0 && (
                            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                                No entries yet. Click "Add New" to start.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
                <button className="glass-button" onClick={onBack} style={{ background: "transparent" }}>Back</button>
                <button className="glass-button" onClick={onNext} style={{ background: "var(--text-accent)", color: "#000" }}>Next: Review</button>
            </div>
        </div>
    );
}
