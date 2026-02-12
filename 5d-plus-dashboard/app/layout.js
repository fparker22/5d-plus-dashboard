import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
    title: "5D+ Evaluation Console",
    description: "Agentic Teacher Evaluation Dashboard",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <div className="grid-dashboard">
                    <Sidebar />
                    <main style={{ padding: "2rem 0" }}>
                        <div className="animate-fade-in" style={{ height: "100%" }}>
                            {children}
                        </div>
                    </main>
                </div>
            </body>
        </html>
    );
}
