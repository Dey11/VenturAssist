import prisma from "@/lib/prisma";
import { RedLensJobResult } from "../types";

/**
 * Store RedLens risk assessment results in the database
 */
export async function storeRedLensAssessment(
  startupId: string,
  assessmentResult: RedLensJobResult,
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      // Create or update the main RedLens assessment
      const redLensAssessment = await tx.redLensAssessment.upsert({
        where: { startupId },
        update: {
          overallScore: assessmentResult.overallScore,
          summary: assessmentResult.summary,
          recommendation: assessmentResult.recommendation,
          confidenceScore: assessmentResult.confidenceScore,
        },
        create: {
          startupId,
          overallScore: assessmentResult.overallScore,
          summary: assessmentResult.summary,
          recommendation: assessmentResult.recommendation,
          confidenceScore: assessmentResult.confidenceScore,
        },
      });

      // Delete existing module assessments to replace them
      await tx.redLensModuleAssessment.deleteMany({
        where: { redLensAssessmentId: redLensAssessment.id },
      });

      // Create new module assessments
      for (const moduleAssessment of assessmentResult.moduleAssessments) {
        await tx.redLensModuleAssessment.create({
          data: {
            redLensAssessmentId: redLensAssessment.id,
            module: moduleAssessment.module,
            score: moduleAssessment.score,
            findings: moduleAssessment.findings,
            recommendations: moduleAssessment.recommendations,
            confidence: moduleAssessment.confidence,
          },
        });
      }
    });

    console.log(
      `Successfully stored RedLens assessment for startup ${startupId}`,
    );
  } catch (error) {
    console.error(
      `Error storing RedLens assessment for startup ${startupId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Retrieve RedLens assessment results for a startup
 */
export async function getRedLensAssessment(startupId: string) {
  try {
    const assessment = await prisma.redLensAssessment.findUnique({
      where: { startupId },
      include: {
        moduleAssessments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return assessment;
  } catch (error) {
    console.error(
      `Error getting RedLens assessment for startup ${startupId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Get all RedLens assessments with their module details
 */
export async function getAllRedLensAssessments() {
  try {
    const assessments = await prisma.redLensAssessment.findMany({
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        moduleAssessments: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return assessments;
  } catch (error) {
    console.error("Error getting all RedLens assessments:", error);
    throw error;
  }
}
