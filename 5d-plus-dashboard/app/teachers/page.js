import fs from "fs";
import path from "path";
import Link from "next/link";
import { Search, MoreVertical } from "lucide-react";

// Server Component (Data Fetching)
async function getTeachers() {
    const filePath = path.join(process.cwd(), "data", "teachers.json");
    if (!fs.existsSync(filePath)) return [];
    const fileContents = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContents);
}

export default async function TeachersPage() {
    const teachers = await getTeachers();

    return (
        <div style={{ paddingRight: "2rem" }}>
            <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: "2rem", fontWeight: "700" }}>Teachers</h2>
                    <p style={{ color: "var(--text-secondary)" }}>Manage your roster and view profiles.</p>
                </div>
                <div style={{ position: "relative" }}>
                    <Search size={18} style={{ position: "absolute", left: "12px", top: "14px", color: "var(--text-secondary)" }} />
                    <input
                        type="text"
                        placeholder="Search teachers..."
                        className="glass-input"
                        style={{ paddingLeft: "40px", width: "300px" }}
                    />
                </div>
            </header>

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1.5rem"
            }}>
                {teachers.map((teacher) => (
                    <div key={teacher.id} className="glass-panel" style={{ padding: "1.5rem", position: "relative", transition: "transform 0.2s" }}>
                        <div style={{ position: "absolute", top: "1rem", right: "1rem", cursor: "pointer", color: "var(--text-secondary)" }}>
                            <MoreVertical size={20} />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem" }}>
                            <img
                                src={teacher.photoUrl}
                                alt={`${teacher.firstName} ${teacher.lastName}`}
                                style={{
                                    width: "80px",
                                    height: "80px",
                                    borderRadius: "50%",
                                    border: "2px solid var(--text-accent)",
                                    marginBottom: "1rem",
                                    objectFit: "cover"
                                }}
                            />
                            <h3 style={{ fontSize: "1.25rem", fontWeight: "600" }}>{teacher.firstName} {teacher.lastName}</h3>
                            <p style={{ color: "var(--text-secondary)" }}>{teacher.subject}</p>
                            <div style={{
                                marginTop: "0.5rem",
                                padding: "0.25rem 0.75rem",
                                background: "rgba(255, 255, 255, 0.05)",
                                borderRadius: "99px",
                                fontSize: "0.75rem"
                            }}>
                                {teacher.school} • Grade {teacher.grade}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                            <button className="glass-button" style={{ fontSize: "0.875rem", padding: "0.5rem" }}>
                                View Profile
                            </button>
                            <Link href={`/evaluations/new?teacherId=${teacher.id}`} style={{ width: "100%" }}>
                                <button className="glass-button" style={{
                                    width: "100%",
                                    fontSize: "0.875rem",
                                    padding: "0.5rem",
                                    background: "rgba(129, 140, 248, 0.2)",
                                    color: "white",
                                    borderColor: "rgba(129, 140, 248, 0.3)"
                                }}>
                                    Evaluate
                                </button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
