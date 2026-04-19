"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FileUpload } from "@/components/input/FileUpload";
import { ExtractionReview } from "@/components/input/ExtractionReview";
import { GapFilling } from "@/components/input/GapFilling";
import { generateKitName } from "@/lib/utils";

type Step = "upload" | "gaps" | "review";

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;

  const [step, setStep] = useState<Step>("upload");
  const [kitName, setKitName] = useState("");
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileAccepted(file: File) {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const response = await fetch("/api/kits/parse-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to parse document. Please try again.");
        return;
      }

      const data = await response.json();

      // Auto kit naming — UX-04
      if (data.checklist_data?.product_name) {
        setKitName(generateKitName(data.checklist_data.product_name));
      }

      setExtractedData(data.checklist_data);
      setStep("gaps");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewComplete(finalData: Record<string, unknown>) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: kitName || "Untitled UI Kit",
          category,
          input_method: "upload",
          checklist_data: finalData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to create kit.");
        return;
      }

      const data = await response.json();
      router.push(`/kit/${data.id}`);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link
          href={`/dashboard/new/${category}`}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors"
        >
          ← Back
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`flex items-center gap-2 text-sm font-medium ${step === "upload" ? "text-white" : "text-white/40"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "upload" ? "bg-brand-500" : "bg-success/20 text-success"}`}>
              {step !== "upload" ? "✓" : "1"}
            </span>
            Upload
          </div>
          <div className="flex-1 h-px bg-surface-300" />
          <div className={`flex items-center gap-2 text-sm font-medium ${step === "gaps" ? "text-white" : "text-white/40"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "gaps" ? "bg-brand-500" : step === "review" ? "bg-success/20 text-success" : "bg-surface-200"}`}>
              {step === "review" ? "✓" : "2"}
            </span>
            Fill Gaps
          </div>
          <div className="flex-1 h-px bg-surface-300" />
          <div className={`flex items-center gap-2 text-sm font-medium ${step === "review" ? "text-white" : "text-white/40"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "review" ? "bg-brand-500" : "bg-surface-200"}`}>
              3
            </span>
            Review
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Kit name input */}
        {(step === "gaps" || step === "review") && (
          <div className="mb-6">
            <label className="label">Kit name</label>
            <input
              type="text"
              value={kitName}
              onChange={(e) => setKitName(e.target.value)}
              placeholder="My UI Kit"
              className="input"
            />
          </div>
        )}

        {/* Step content */}
        {step === "upload" && (
          <FileUpload
            onFileAccepted={handleFileAccepted}
            loading={loading}
          />
        )}

        {step === "gaps" && extractedData && (
          <GapFilling
            data={extractedData}
            category={category as "game" | "mobile" | "web"}
            onComplete={(filledData) => {
              setExtractedData(filledData);
              setStep("review");
            }}
          />
        )}

        {step === "review" && extractedData && (
          <ExtractionReview
            data={extractedData}
            category={category}
            onComplete={handleReviewComplete}
            loading={loading}
          />
        )}

      </div>
    </div>
  );
}