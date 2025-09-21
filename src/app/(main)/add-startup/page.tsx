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

  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [session, router]);

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

  const [errors, setErrors] = useState<string[]>([]);

  React.useEffect(() => {
    if (
      waitingForUploads &&
      startupId &&
      uploadedFiles.length >= files.length
    ) {
      console.log("All uploads complete, redirecting...");
      router.push(`/startup/${startupId}/processing`);
    }
  }, [
    waitingForUploads,
    startupId,
    uploadedFiles.length,
    files.length,
    router,
  ]);

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (waitingForUploads && startupId) {
      timeoutId = setTimeout(() => {
        console.warn("Upload timeout reached, redirecting anyway...");
        router.push(`/startup/${startupId}/processing`);
      }, 30000); // 30 seconds timeout
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [waitingForUploads, startupId, router]);

  const handleSectorChange = (sector: Sector) => {
    setSelectedSector(sector);
  };

  const handleStageChange = (stage: Stage) => {
    setSelectedStage(stage);
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
