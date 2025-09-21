import prisma from "@/lib/prisma";
import { CompetitorAnalysisJobResult } from "../types";

/**
 * Store competitor analysis results in the database
 */
export async function storeCompetitorAnalysisResult(
  startupId: string,
  analysisResult: CompetitorAnalysisJobResult,
): Promise<void> {
  try {
    console.log(
      `Storing competitor analysis results for startup: ${startupId}`,
    );

    // Store in a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Create the main competitor analysis record
      const competitorAnalysis = await tx.competitorAnalysis.create({
        data: {
          startupId,
          overallScore: analysisResult.overallScore,
          marketPosition: analysisResult.marketPosition,
          competitiveAdvantage: analysisResult.competitiveAdvantage,
          threats: analysisResult.threats,
          opportunities: analysisResult.opportunities,
          recommendations: analysisResult.recommendations,
          confidenceScore: analysisResult.confidenceScore,
        },
      });

      // Store individual competitors
      if (analysisResult.competitors && analysisResult.competitors.length > 0) {
        for (const competitor of analysisResult.competitors) {
          await tx.competitor.create({
            data: {
              competitorAnalysisId: competitorAnalysis.id,
              name: competitor.name,
              website: competitor.website || null,
              description: competitor.description || null,
              marketPosition: competitor.marketPosition || null,
              strengths: competitor.strengths,
              weaknesses: competitor.weaknesses,
              similarityScore: competitor.similarityScore,
              threatLevel: competitor.threatLevel,
              funding: competitor.funding || null,
              employees: competitor.employees || null,
              founded: competitor.founded || null,
            },
          });
        }
      }
    });

    console.log(
      `Successfully stored competitor analysis results for startup: ${startupId}`,
    );
  } catch (error) {
    console.error("Error storing competitor analysis results:", error);
    throw new Error(
      `Failed to store competitor analysis results: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Retrieve competitor analysis results for a startup
 */
export async function getCompetitorAnalysisResult(startupId: string) {
  try {
    const result = await prisma.competitorAnalysis.findUnique({
      where: {
        startupId,
      },
      include: {
        competitors: {
          orderBy: {
            similarityScore: "desc", // Order by most similar first
          },
        },
      },
    });

    return result;
  } catch (error) {
    console.error("Error retrieving competitor analysis results:", error);
    throw new Error(
      `Failed to retrieve competitor analysis results: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
