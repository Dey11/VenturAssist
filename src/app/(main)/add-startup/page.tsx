"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FileDropzone from "@/components/landing/file-dropzone";

type Sector = "fintech" | "healthtech" | "edtech" | "other";
type Stage = "idea" | "preseed" | "seed" | "series a";

export default function AddStartupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [startupName, setStartupName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);

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

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedStep1 = startupName.trim();
  const canProceedStep2 = selectedSector !== null;
  const canProceedStep3 = selectedStage !== null;

  const handleSubmit = () => {
    // TODO: Implement form submission logic
    console.log({
      startupName,
      websiteUrl,
      sector: selectedSector,
      stage: selectedStage,
    });
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
            <FileDropzone redirectToUpload={true} />
          </div>
          <div className="md:col-span-4">
            {/* Progress Indicator */}
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

            {/* Step Content */}
            <div className="space-y-4 md:space-y-6">{renderStepContent()}</div>

            {/* Navigation Buttons */}
            <div className="mt-4 md:mt-6">
              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={
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
                  disabled={!canProceedStep3}
                  className="w-full bg-[#296a86] text-white hover:bg-[#296a86]/90 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Continue
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
