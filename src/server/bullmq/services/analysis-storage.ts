import prisma from "@/lib/prisma";
import { DataSourceAnalysisResult } from "../types";

// Store the analysis result in the appropriate database tables
export async function storeAnalysisResult(
  startupId: string,
  analysisResult: DataSourceAnalysisResult,
): Promise<void> {
  try {
    // Store in a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Store key metrics
      if (analysisResult.keyMetrics && analysisResult.keyMetrics.length > 0) {
        for (const metric of analysisResult.keyMetrics) {
          await tx.keyMetric.create({
            data: {
              startupId,
              name: metric.name,
              value: metric.value,
              unit: metric.unit || null,
              reportedDate: metric.reportedDate
                ? new Date(metric.reportedDate)
                : null,
              insight: metric.insight || null,
            },
          });
        }
      }

      // Store team members
      if (analysisResult.teamMembers && analysisResult.teamMembers.length > 0) {
        for (const member of analysisResult.teamMembers) {
          await tx.teamMember.create({
            data: {
              startupId,
              name: member.name,
              role: member.role || null,
              linkedInUrl: member.linkedInUrl || null,
              bioSummary: member.bioSummary || null,
            },
          });
        }
      }

      // Store market info (upsert since there's only one per startup)
      if (analysisResult.marketInfo) {
        await tx.marketInfo.upsert({
          where: { startupId },
          update: {
            tam: analysisResult.marketInfo.tam || null,
            sam: analysisResult.marketInfo.sam || null,
            som: analysisResult.marketInfo.som || null,
            analysis: analysisResult.marketInfo.analysis || null,
          },
          create: {
            startupId,
            tam: analysisResult.marketInfo.tam || null,
            sam: analysisResult.marketInfo.sam || null,
            som: analysisResult.marketInfo.som || null,
            analysis: analysisResult.marketInfo.analysis || null,
          },
        });
      }

      // Store risk indicators
      if (analysisResult.risks && analysisResult.risks.length > 0) {
        for (const risk of analysisResult.risks) {
          await tx.riskIndicator.create({
            data: {
              startupId,
              riskTitle: risk.riskTitle,
              explanation: risk.explanation,
              severity: risk.severity as any, // Cast to match Prisma enum
            },
          });
        }
      }

      // Update startup with summary and insights
      const insightsText = analysisResult.insights?.join("; ") || "";
      await tx.startup.update({
        where: { id: startupId },
        data: {
          description: analysisResult.summary,
          finalSummary: insightsText,
        },
      });
    });

    console.log(`Successfully stored analysis result for startup ${startupId}`);
  } catch (error) {
    console.error(
      `Error storing analysis result for startup ${startupId}:`,
      error,
    );
    throw error;
  }
}

// Get analysis results for a startup
export async function getAnalysisResults(startupId: string) {
  try {
    const [keyMetrics, teamMembers, marketInfo, riskIndicators, startup] =
      await Promise.all([
        prisma.keyMetric.findMany({
          where: { startupId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.teamMember.findMany({
          where: { startupId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.marketInfo.findUnique({
          where: { startupId },
        }),
        prisma.riskIndicator.findMany({
          where: { startupId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.startup.findUnique({
          where: { id: startupId },
          select: {
            id: true,
            name: true,
            description: true,
            finalSummary: true,
            overallStatus: true,
          },
        }),
      ]);

    return {
      startup,
      keyMetrics,
      teamMembers,
      marketInfo,
      riskIndicators,
    };
  } catch (error) {
    console.error(
      `Error getting analysis results for startup ${startupId}:`,
      error,
    );
    throw error;
  }
}
