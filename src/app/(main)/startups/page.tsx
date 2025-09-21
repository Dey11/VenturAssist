"use client";

import { StartupCard } from "@/components/ui/startup-card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const sampleStartups = [
  {
    id: "1",
    name: "EcoCharge",
    tagline: "Green batteries for a sustainable world",
    teamSize: 5,
    arr: "$1.2M ARR",
    riskLevel: "Medium" as const,
  },
];

export default function StartupsPage() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [session, router]);

  const [startups] = useState(sampleStartups);

  const handleViewAnalysis = (id: string) => {
    // TODO: Navigate to analysis page
    console.log("View analysis for startup:", id);
  };

  const handleUploadPitchDeck = () => {
    // TODO: Implement file upload
    console.log("Upload pitch deck");
  };

  return (
    <div className="min-h-screen p-5">
      <div className="mx-auto rounded-lg bg-white px-4 py-8">
        <div className="mb-8">
          <h1 className="font-dmsans mb-2 text-2xl font-bold text-gray-900">
            Your Startup Analyses
          </h1>
          <p className="font-dmsans max-w-2xl text-xl text-gray-600">
            Browse, compare, and revisit all the startups you've analyzed with
            DealScope.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="h-full">
            <div className="h-full">
              {startups.map((startup) => (
                <StartupCard
                  key={startup.id}
                  {...startup}
                  onViewAnalysis={handleViewAnalysis}
                />
              ))}
            </div>
          </div>

          <div className="h-full">
            <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center transition-colors hover:border-gray-400">
              <div className="space-y-4">
                <div className="">
                  <h3 className="text-brand-secondary mb-2 text-lg font-medium">
                    Upload a Pitch Deck
                  </h3>
                  <Button
                    variant="default"
                    className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                    onClick={handleUploadPitchDeck}
                  >
                    <Plus />
                    Upload Pitch Deck
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
