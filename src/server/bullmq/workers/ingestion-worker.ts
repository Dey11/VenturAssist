import { Job } from "bullmq";
import { getWorker, QUEUE_NAMES } from "../config";
import {
  IngestionJobData,
  IngestionJobResult,
  IngestionDataSourceSummary,
} from "../types";
import { JobStatus } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import {
  loadDataSourcesForProcessing,
  updateDataSourceStatus,
  updateMultipleDataSourceStatuses,
  getStartupContext,
} from "../services/data-source-loader";
import { getDataSourceContent } from "../services/object-storage";
import { analyzeDataSource } from "../services/analyzer";
import { storeAnalysisResult } from "../services/analysis-storage";
import { addRedLensJob } from "../queues/redlens-queue";
import { addCompetitorJob } from "../queues/competitor-queue";
import { JobType } from "@/generated/prisma/client";

/**
 * Get analysis data for RedLens risk assessment
 */
async function getAnalysisDataForRedLens(startupId: string) {
  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    include: {
      keyMetrics: true,
      teamMembers: true,
      marketInfo: true,
      risks: true,
    },
  });

  if (!startup) {
    throw new Error(`Startup not found: ${startupId}`);
  }

  return {
    keyMetrics: startup.keyMetrics.map((metric) => ({
      name: metric.name,
      value: metric.value,
      unit: metric.unit || undefined,
      reportedDate: metric.reportedDate || undefined,
      insight: metric.insight || undefined,
    })),
    teamMembers: startup.teamMembers.map((member) => ({
      name: member.name,
      role: member.role || undefined,
      linkedInUrl: member.linkedInUrl || undefined,
      bioSummary: member.bioSummary || undefined,
    })),
    marketInfo: startup.marketInfo
      ? {
          tam: startup.marketInfo.tam || undefined,
          sam: startup.marketInfo.sam || undefined,
          som: startup.marketInfo.som || undefined,
          analysis: startup.marketInfo.analysis || undefined,
        }
      : undefined,
    risks: startup.risks.map((risk) => ({
      riskTitle: risk.riskTitle,
      explanation: risk.explanation,
      severity: risk.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    })),
    description: startup.description || undefined,
    finalSummary: startup.finalSummary || undefined,
  };
}

/**
 * Get analysis data for competitor analysis
 */
async function getAnalysisDataForCompetitor(startupId: string) {
  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    include: {
      keyMetrics: true,
      teamMembers: true,
      marketInfo: true,
    },
  });

  if (!startup) {
    throw new Error(`Startup ${startupId} not found`);
  }

  return {
    name: startup.name,
    description: startup.description || undefined,
    websiteUrl: startup.websiteUrl || undefined,
    keyMetrics: startup.keyMetrics.map((metric) => ({
      name: metric.name,
      value: metric.value,
      unit: metric.unit || undefined,
      reportedDate: metric.reportedDate || undefined,
      insight: metric.insight || undefined,
    })),
    teamMembers: startup.teamMembers.map((member) => ({
      name: member.name,
      role: member.role || undefined,
      linkedInUrl: member.linkedInUrl || undefined,
      bioSummary: member.bioSummary || undefined,
    })),
    marketInfo: startup.marketInfo
      ? {
          tam: startup.marketInfo.tam || undefined,
          sam: startup.marketInfo.sam || undefined,
          som: startup.marketInfo.som || undefined,
          analysis: startup.marketInfo.analysis || undefined,
        }
      : undefined,
    finalSummary: startup.finalSummary || undefined,
  };
}

// Main job processor function
async function processIngestionJob(
  job: Job<IngestionJobData>,
): Promise<IngestionJobResult> {
  const { jobId, startupId, dataSourceIds } = job.data;

  console.log(`Processing ingestion job ${jobId} for startup ${startupId}`);

  try {
    // Update job status to IN_PROGRESS
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    // Get startup context
    const startup = await getStartupContext(startupId);
    if (!startup) {
      throw new Error(`Startup not found: ${startupId}`);
    }

    // Load data sources for processing
    const dataSourceSummaries = await loadDataSourcesForProcessing(
      startupId,
      dataSourceIds,
    );

    if (dataSourceSummaries.length === 0) {
      throw new Error("No data sources found for processing");
    }

    console.log(`Processing ${dataSourceSummaries.length} data sources`);

    // Process all data sources and combine content for AI analysis
    const processedDataSources: IngestionDataSourceSummary[] = [];
    const errors: string[] = [];
    const allContent: string[] = [];
    const contentMetadata: Array<{
      fileName?: string;
      type: string;
      content: string;
    }> = [];

    // First, extract content from all data sources
    for (const dataSourceSummary of dataSourceSummaries) {
      try {
        console.log(
          `Extracting content from data source ${dataSourceSummary.dataSourceId}`,
        );

        // Update data source status to IN_PROGRESS
        await updateDataSourceStatus(
          dataSourceSummary.dataSourceId,
          JobStatus.IN_PROGRESS,
        );

        // Get the full data source record
        const dataSource = await prisma.dataSource.findUnique({
          where: { id: dataSourceSummary.dataSourceId },
        });

        if (!dataSource) {
          throw new Error(
            `Data source not found: ${dataSourceSummary.dataSourceId}`,
          );
        }

        // Get content based on data source type
        const content = await getDataSourceContent(
          dataSource.type,
          dataSource.sourceUrl,
          dataSource.content,
          dataSource.fileName,
        );

        // Store content and metadata
        allContent.push(content);
        contentMetadata.push({
          fileName: dataSource.fileName || undefined,
          type: dataSource.type,
          content: content.substring(0, 1000), // Store first 1000 chars for reference
        });

        console.log(
          `Extracted ${content.length} characters from ${dataSource.fileName || dataSource.type}`,
        );

        // Update data source with extracted content
        await prisma.dataSource.update({
          where: { id: dataSourceSummary.dataSourceId },
          data: {
            content: content.substring(0, 1000), // Store first 1000 chars
          },
        });

        processedDataSources.push({
          ...dataSourceSummary,
          status: JobStatus.IN_PROGRESS,
          extractedContent: content.substring(0, 500),
        });
      } catch (error) {
        const errorMsg = `Failed to extract content from data source ${dataSourceSummary.dataSourceId}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error(errorMsg);

        // Mark this data source as failed
        await updateDataSourceStatus(
          dataSourceSummary.dataSourceId,
          JobStatus.FAILED,
        );

        processedDataSources.push({
          ...dataSourceSummary,
          status: JobStatus.FAILED,
          error: errorMsg,
        });
      }
    }

    // If we have content, perform AI analysis on all combined content
    // We can proceed with analysis even if some files failed, as long as we have some content
    if (allContent.length > 0) {
      try {
        console.log(
          `Performing AI analysis on ${allContent.length} data sources`,
        );

        // Combine all content with metadata
        const combinedContent = allContent
          .map((content, index) => {
            const meta = contentMetadata[index];
            return `--- ${meta.type.toUpperCase()}${meta.fileName ? ` (${meta.fileName})` : ""} ---\n${content}\n`;
          })
          .join("\n\n");

        console.log(
          `Combined content length: ${combinedContent.length} characters from ${allContent.length} sources`,
        );

        // Analyze the combined content with AI
        const analysisResult = await analyzeDataSource(
          combinedContent,
          `${startup.name} - Multiple Documents`,
          startup.name,
        );

        // Store the analysis result in the appropriate database tables
        await storeAnalysisResult(startupId, analysisResult);

        // Mark all data sources as completed
        for (const dataSourceSummary of dataSourceSummaries) {
          await updateDataSourceStatus(
            dataSourceSummary.dataSourceId,
            JobStatus.COMPLETED,
          );
        }

        // Update processed data sources with completion status
        processedDataSources.forEach((ds) => {
          if (ds.status === JobStatus.IN_PROGRESS) {
            ds.status = JobStatus.COMPLETED;
          }
        });

        console.log(`AI analysis completed for startup ${startupId}`);
      } catch (error) {
        const errorMsg = `Failed to perform AI analysis: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error(errorMsg);

        // Mark all data sources as failed
        for (const dataSourceSummary of dataSourceSummaries) {
          await updateDataSourceStatus(
            dataSourceSummary.dataSourceId,
            JobStatus.FAILED,
          );
        }

        // Update processed data sources with failure status
        processedDataSources.forEach((ds) => {
          if (ds.status === JobStatus.IN_PROGRESS) {
            ds.status = JobStatus.FAILED;
            ds.error = errorMsg;
          }
        });
      }
    }

    // Calculate final statistics
    const totalProcessed = processedDataSources.filter(
      (ds) => ds.status === JobStatus.COMPLETED,
    ).length;
    const totalFailed = processedDataSources.filter(
      (ds) => ds.status === JobStatus.FAILED,
    ).length;

    // Create the result
    const result: IngestionJobResult = {
      processedDataSources,
      totalProcessed,
      totalFailed,
      errors,
      completedAt: new Date().toISOString(),
    };

    // Determine final status - if we have any successful analysis, mark as completed
    const hasSuccessfulAnalysis = totalProcessed > 0;
    const finalStatus = hasSuccessfulAnalysis
      ? JobStatus.COMPLETED
      : JobStatus.FAILED;

    // Update job with result
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        result: result as any, // Store the result as JSON
        completedAt: new Date(),
        logs: errors.length > 0 ? errors.join("\n") : null,
      },
    });

    // Update startup overall status
    await prisma.startup.update({
      where: { id: startupId },
      data: {
        overallStatus: finalStatus,
      },
    });

    // If ingestion was successful, trigger RedLens risk assessment
    if (hasSuccessfulAnalysis) {
      try {
        console.log(
          `Triggering RedLens risk assessment for startup ${startupId}`,
        );

        // Get the analysis data for RedLens
        const analysisData = await getAnalysisDataForRedLens(startupId);

        // Create a RedLens job
        const redLensJob = await prisma.job.create({
          data: {
            type: JobType.REDLENS_RISK_ASSESSMENT,
            status: JobStatus.PENDING,
            startupId,
            payload: { startupId, analysisData },
          },
        });

        // Add the job to the RedLens queue
        await addRedLensJob({
          jobId: redLensJob.id,
          startupId,
          analysisData,
        });

        console.log(
          `RedLens job ${redLensJob.id} queued for startup ${startupId}`,
        );
      } catch (error) {
        console.error(
          `Failed to trigger RedLens assessment for startup ${startupId}:`,
          error,
        );
        // Don't fail the ingestion job if RedLens trigger fails
      }

      // Also trigger competitor analysis
      try {
        console.log(`Triggering competitor analysis for startup ${startupId}`);

        // Get the analysis data for competitor analysis
        const startupData = await getAnalysisDataForCompetitor(startupId);

        // Create a competitor analysis job
        const competitorJob = await prisma.job.create({
          data: {
            type: JobType.COMPETITOR_ANALYSIS,
            status: JobStatus.PENDING,
            startupId,
            payload: { startupId, startupData },
          },
        });

        // Add the job to the competitor queue
        await addCompetitorJob({
          jobId: competitorJob.id,
          startupId,
          startupData,
        });

        console.log(
          `Competitor analysis job ${competitorJob.id} queued for startup ${startupId}`,
        );
      } catch (error) {
        console.error(
          `Failed to trigger competitor analysis for startup ${startupId}:`,
          error,
        );
        // Don't fail the ingestion job if competitor analysis trigger fails
      }
    }

    console.log(
      `Completed ingestion job ${jobId}: ${totalProcessed} processed, ${totalFailed} failed`,
    );

    return result;
  } catch (error) {
    console.error(`Error processing ingestion job ${jobId}:`, error);

    // Update job status to FAILED
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        completedAt: new Date(),
        logs: error instanceof Error ? error.message : "Unknown error",
      },
    });

    // Update startup overall status
    await prisma.startup.update({
      where: { id: startupId },
      data: {
        overallStatus: JobStatus.FAILED,
      },
    });

    throw error;
  }
}

/**
 * Create the ingestion worker
 */
export function createIngestionWorker() {
  const worker = getWorker(QUEUE_NAMES.INGESTION, processIngestionJob, {
    concurrency: 3, // Process up to 3 jobs concurrently
  });

  // Add event listeners for monitoring
  worker.on("completed", (job: any) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job: any, err: any) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  worker.on("error", (err: any) => {
    console.error("Worker error:", err);
  });

  worker.on("ready", () => {
    console.log("Ingestion worker is ready and listening for jobs");
  });

  return worker;
}
