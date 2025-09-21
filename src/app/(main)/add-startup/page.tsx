"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FileDropzone from "@/components/landing/file-dropzone";
import { authClient } from "@/lib/auth-client";

type Sector = "fintech" | "healthtech" | "edtech" | "other";
type Stage = "idea" | "preseed" | "seed" | "series a";

export default function AddStartupPage() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [startupName, setStartupName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startupId, setStartupId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [shouldUploadFiles, setShouldUploadFiles] = useState(false);
  const [waitingForUploads, setWaitingForUploads] = useState(false);
  const [hasEnqueuedJob, setHasEnqueuedJob] = useState(false);
  const [enqueueError, setEnqueueError] = useState<string | null>(null);
  const [isEnqueuing, setIsEnqueuing] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
  }, [session, router]);

  React.useEffect(() => {
    if (
      waitingForUploads &&
      startupId &&
      uploadedFiles.length >= files.length &&
      !hasEnqueuedJob &&
      !isEnqueuing
    ) {
      console.log("All uploads complete, enqueuing job...");
      enqueueIngestionJob();
    }
  }, [
    waitingForUploads,
    startupId,
    uploadedFiles.length,
    files.length,
    hasEnqueuedJob,
    isEnqueuing,
  ]);

  React.useEffect(() => {
    if (hasEnqueuedJob && startupId) {
      console.log("Job enqueued successfully, redirecting...");
      router.push(`/startup/${startupId}/processing`);
    }
  }, [hasEnqueuedJob, startupId, router]);

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (waitingForUploads && startupId && !hasEnqueuedJob) {
      timeoutId = setTimeout(() => {
        console.warn(
          "Upload timeout reached, attempting to enqueue job anyway...",
        );
        if (!isEnqueuing) {
          enqueueIngestionJob();
        }
      }, 30000); // 30 seconds timeout
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [waitingForUploads, startupId, hasEnqueuedJob, isEnqueuing]);

  const handleSectorChange = (sector: Sector) => {
    setSelectedSector(sector);
  };

  const handleStageChange = (stage: Stage) => {
    setSelectedStage(stage);
  };

  const enqueueIngestionJob = async () => {
    if (!startupId || isEnqueuing) {
      return;
    }

    setIsEnqueuing(true);
    setEnqueueError(null);

    try {
      const response = await fetch("/api/data-sources/enqueue-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startupId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to enqueue job");
      }

      const result = await response.json();
      console.log("Job enqueued successfully:", result);
      setHasEnqueuedJob(true);
    } catch (error) {
      console.error("Error enqueuing job:", error);
      setEnqueueError(
        error instanceof Error ? error.message : "Failed to enqueue job",
      );

      // Retry after a delay
      setTimeout(() => {
        if (!hasEnqueuedJob) {
          console.log("Retrying job enqueue...");
          enqueueIngestionJob();
        }
      }, 2000);
    } finally {
      setIsEnqueuing(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const canProceedStep1 = startupName.trim();
  const canProceedStep2 = selectedSector !== null;
  const canProceedStep3 = selectedStage !== null;

  const handleSubmit = async () => {
    if (
      !canProceedStep3 ||
      !startupName.trim() ||
      !selectedSector ||
      !selectedStage ||
      !(files.length > 0)
    ) {
      return;
    }

    if (!startupName.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedName = startupName.trim();
      const trimmedWebsiteUrl = websiteUrl.trim();

      const requestBody: any = {
        name: trimmedName,
        sector: selectedSector!,
        websiteUrl: trimmedWebsiteUrl,
        stage: selectedStage!,
      };

      const createResponse = await fetch("/api/startup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error(
          "Create startup failed:",
          createResponse.status,
          errorText,
        );
        throw new Error("Failed to create startup");
      }

      const { id: newStartupId } = await createResponse.json();
      setStartupId(newStartupId);

      setWaitingForUploads(true);
      setShouldUploadFiles(true);
    } catch (error) {
      console.error("Submission error:", error);
      setIsSubmitting(false);
      setWaitingForUploads(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 md:space-y-8">
            <div className="space-y-2">
              <label className="block text-base font-medium text-gray-700 md:text-lg">
                Name of startup *
              </label>
              <Input
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                placeholder="Enter startup name"
                className="w-full text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-base font-medium text-gray-700 md:text-lg">
                Website URL of startup
              </label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full text-base"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 md:space-y-8">
            <label className="block text-base font-medium text-gray-700 md:text-lg">
              Which sector does your startup belong to? *
            </label>
            <div className="space-y-2">
              {(["fintech", "healthtech", "edtech", "other"] as Sector[]).map(
                (sector) => (
                  <button
                    key={sector}
                    onClick={() => handleSectorChange(sector)}
                    className={`w-full cursor-pointer rounded-md border p-2 text-left transition-colors md:p-3 ${
                      selectedSector === sector
                        ? "border-[#296a86] bg-[#296a86]/5"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-700 capitalize md:text-base">
                      {sector}
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 md:space-y-8">
            <label className="block text-base font-medium text-gray-700 md:text-lg">
              What stage is your startup in currently? *
            </label>
            <div className="space-y-2">
              {(["idea", "preseed", "seed", "series a"] as Stage[]).map(
                (stage) => (
                  <button
                    key={stage}
                    onClick={() => handleStageChange(stage)}
                    className={`w-full cursor-pointer rounded-md border p-2 text-left transition-colors md:p-3 ${
                      selectedStage === stage
                        ? "border-[#296a86] bg-[#296a86]/5"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-700 capitalize md:text-base">
                      {stage === "series a" ? "Series A" : stage}
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 pt-16 md:pt-4 md:pl-20">
        <h1 className="font-dmsans text-2xl font-semibold md:text-3xl">
          Add a Startup
        </h1>
        <p className="font-dmsans pt-2 text-base text-gray-600 md:text-lg">
          Our AI Analyst will analyze your startup and provide you with a
          report.
        </p>

        <div className="grid grid-cols-1 gap-6 py-6 md:grid-cols-6 md:gap-8 md:py-8">
          <div className="md:col-span-2">
            <FileDropzone
              redirectToUpload={false}
              startupId={startupId || undefined}
              onFilesSelected={setFiles}
              onUploadComplete={setUploadedFiles}
              disabled={isSubmitting}
              uploadedFiles={uploadedFiles}
              shouldUpload={shouldUploadFiles}
            />

            {/* Show enqueuing status */}
            {waitingForUploads && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm font-medium text-blue-800">
                    {isEnqueuing
                      ? "Preparing analysis..."
                      : "Uploading files..."}
                  </span>
                </div>
                {enqueueError && (
                  <p className="mt-2 text-sm text-red-600">
                    Error: {enqueueError}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="md:col-span-4">
            <div className="mb-4 flex items-center justify-center space-x-2 md:mb-6">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-6 rounded-full md:w-8 ${
                    currentStep >= step ? "bg-[#296a86]" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <div className="space-y-4 md:space-y-6">{renderStepContent()}</div>

            <div className="mt-4 md:mt-6">
              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    isSubmitting ||
                    (currentStep === 1 && !canProceedStep1) ||
                    (currentStep === 2 && !canProceedStep2) ||
                    (currentStep === 3 && !canProceedStep3)
                  }
                  className="w-full bg-[#296a86] text-white hover:bg-[#296a86]/90 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceedStep3}
                  className="w-full bg-[#296a86] text-white hover:bg-[#296a86]/90 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Processing...
                    </div>
                  ) : (
                    "Continue"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
