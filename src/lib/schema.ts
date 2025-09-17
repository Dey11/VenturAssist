import { z } from "zod/v4";

export const getSignedUrlForUploadingSchema = z.object({
  startupId: z.string(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
});

export const finalizeFileUploadSchema = z.object({
  key: z.string(),
  fileName: z.string(),
  startupId: z.string(),
});

export const dataSourcesTextInputSchema = z.object({
  startupId: z.string(),
  content: z.string(),
});

export const enqueueJobSchema = z.object({
  startupId: z.string(),
});

export const getJobSchema = z.object({
  jobId: z.string(),
});
export const createStartupSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  websiteUrl: z.string().url().optional(),
});

export const updateStartupSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});
