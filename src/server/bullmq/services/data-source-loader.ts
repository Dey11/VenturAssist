import prisma from "@/lib/prisma";
import { DataSourceType, JobStatus } from "@/generated/prisma/client";
import { IngestionDataSourceSummary } from "../types";

// Load data sources for a startup that are ready for processing
export async function loadDataSourcesForProcessing(
  startupId: string,
  dataSourceIds: string[],
): Promise<IngestionDataSourceSummary[]> {
  const dataSources = await prisma.dataSource.findMany({
    where: {
      id: { in: dataSourceIds },
      startupId,
      status: JobStatus.PENDING,
    },
    select: {
      id: true,
      type: true,
      fileName: true,
      sourceUrl: true,
      content: true,
      status: true,
      createdAt: true,
    },
  });

  return dataSources.map((ds) => ({
    dataSourceId: ds.id,
    type: ds.type,
    fileName: ds.fileName || undefined,
    status: ds.status,
    processedAt: new Date().toISOString(),
  }));
}

// Update data source status
export async function updateDataSourceStatus(
  dataSourceId: string,
  status: JobStatus,
  error?: string,
): Promise<void> {
  await prisma.dataSource.update({
    where: { id: dataSourceId },
    data: {
      status,
      ...(error && { content: error }), // Store error in content field temporarily
    },
  });
}

// Update multiple data source statuses
export async function updateMultipleDataSourceStatuses(
  dataSourceIds: string[],
  status: JobStatus,
): Promise<void> {
  await prisma.dataSource.updateMany({
    where: { id: { in: dataSourceIds } },
    data: { status },
  });
}

// Get startup information for context
export async function getStartupContext(startupId: string) {
  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    select: {
      id: true,
      name: true,
      description: true,
      websiteUrl: true,
      createdAt: true,
    },
  });

  return startup;
}
