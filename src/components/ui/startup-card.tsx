import { Button } from "./button";
import Image from "next/image";

interface StartupCardProps {
  id: string;
  name: string;
  tagline: string;
  teamSize: number;
  arr: string;
  riskLevel: "Low" | "Medium" | "High";
  thumbnailUrl?: string;
  onViewAnalysis?: (id: string) => void;
}

export function StartupCard({
  id,
  name,
  tagline,
  teamSize,
  arr,
  riskLevel,
  thumbnailUrl,
  onViewAnalysis,
}: StartupCardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-green-600 bg-green-100";
      case "Medium":
        return "text-yellow-600 bg-yellow-100";
      case "High":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={`${name} analysis`}
            width={200}
            height={120}
            className="h-24 w-full rounded border object-cover"
          />
        ) : (
          <div className="flex h-46 w-full items-center justify-center rounded border bg-gray-100">
            <div className="text-center text-xs text-gray-400">
              <div className="font-semibold">1.0 SUBTOPIC 1</div>
              <div className="text-xs">1.2 SUBTOPIC 2</div>
              <div className="text-xs">2.0 IMPORTANT NOTE</div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-brand-primary text-lg font-semibold">{name}</h3>
          <p className="text-brand-primary text-sm">{tagline}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Team:</span>
            <span className="font-medium">{teamSize} members</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Financials:</span>
            <span className="font-medium">{arr}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Risk Level:</span>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${getRiskColor(
                riskLevel,
              )}`}
            >
              {riskLevel}
            </span>
          </div>
        </div>
        <Button
          variant="brand"
          className="mt-4 w-full"
          onClick={() => onViewAnalysis?.(id)}
        >
          View Analysis
        </Button>
      </div>
    </div>
  );
}
