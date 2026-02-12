"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Check } from "lucide-react";

// Steps will be imported dynamically or defined in separate files
import StepUpload from "@/components/EvaluationSteps/StepUpload";
import StepCoding from "@/components/EvaluationSteps/StepCoding";
import StepAnalysis from "@/components/EvaluationSteps/StepAnalysis";
import StepReview from "@/components/EvaluationSteps/StepReview";

function EvaluationWizardContent() {
    const searchParams = useSearchParams();
    const teacherId = searchParams.get("teacherId");

    const [currentStep, setCurrentStep] = useState(1);
    const [evalData, setEvalData] = useState({
        teacherId: teacherId || "",
        date: new Date().toISOString().split("T")[0],
        transcript: "",
        evidence: [], // [{ timestamp, text, codes: [] }]
        analysis: {
            noticings: [],
            wonderings: [],
            glows: [],
            grows: []
        }
    });

    const steps = [
        { id: 1, name: "Upload & Setup" },
        { id: 2, name: "Coding" },
        { id: 3, name: "Analysis" },
        { id: 4, name: "Review & Export" },
    ];

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

    return (
        <div style={{ paddingRight: "2rem", height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Wizard Header */}
            <header style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "1rem" }}>New Evaluation</h2>

                {/* Progress Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {steps.map((step, index) => (
                        <div key={step.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: currentStep >= step.id ? "var(--text-accent)" : "rgba(255,255,255,0.1)",
                                color: currentStep >= step.id ? "#000" : "var(--text-secondary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "700",
                                fontSize: "0.875rem"
                            }}>
                                {currentStep > step.id ? <Check size={16} /> : step.id}
                            </div>
                            <span style={{
                                color: currentStep >= step.id ? "var(--text-primary)" : "var(--text-secondary)",
                                fontWeight: currentStep === step.id ? "600" : "400"
                            }}>
                                {step.name}
                            </span>
                            {index < steps.length - 1 && (
                                <div style={{ width: "40px", height: "2px", background: "rgba(255,255,255,0.1)", margin: "0 0.5rem" }} />
                            )}
                        </div>
                    ))}
                </div>
            </header>

            {/* Main Content Area */}
            <div className="glass-panel" style={{ flex: 1, padding: "2rem", display: "flex", flexDirection: "column" }}>
                {currentStep === 1 && (
                    <StepUpload
                        data={evalData}
                        updateData={(updates) => setEvalData({ ...evalData, ...updates })}
                        onNext={nextStep}
                    />
                )}
                {currentStep === 2 && (
                    <StepCoding
                        data={evalData}
                        updateData={(updates) => setEvalData({ ...evalData, ...updates })}
                        onNext={nextStep}
                        onBack={prevStep}
                    />
                )}
                {currentStep === 3 && (
                    <StepAnalysis
                        data={evalData}
                        updateData={(updates) => setEvalData({ ...evalData, ...updates })}
                        onNext={nextStep}
                        onBack={prevStep}
                    />
                )}
                {currentStep === 4 && (
                    <StepReview
                        data={evalData}
                        onBack={prevStep}
                    />
                )}
            </div>
        </div>
    );
}

export default function NewEvaluationPage() {
    return (
        <Suspense fallback={<div className="glass-panel" style={{ padding: "2rem" }}>Loading Wizard...</div>}>
            <EvaluationWizardContent />
        </Suspense>
    );
}
