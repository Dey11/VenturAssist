import {
  DataSourceType,
  JobStatus,
  RedLensModule,
} from "@/generated/prisma/client";

// Job data payload for ingestion queue
export interface IngestionJobData {
  jobId: string;
  startupId: string;
  dataSourceIds: string[];
}

// Result structure for ingestion job
export interface IngestionJobResult {
  processedDataSources: IngestionDataSourceSummary[];
  totalProcessed: number;
  totalFailed: number;
  errors: string[];
  completedAt: string;
}

// Summary of processed data source
export interface IngestionDataSourceSummary {
  dataSourceId: string;
  type: DataSourceType;
  fileName?: string;
  status: JobStatus;
  extractedContent?: string;
  analysisResult?: DataSourceAnalysisResult;
  error?: string;
  processedAt: string;
}

// AI analysis result for a data source
export interface DataSourceAnalysisResult {
  summary: string;
  keyMetrics?: KeyMetric[];
  teamMembers?: TeamMember[];
  marketInfo?: MarketInfo;
  risks?: RiskIndicator[];
  insights: string[];
}

// Key metric extracted from data source
export interface KeyMetric {
  name: string;
  value: string;
  unit?: string;
  reportedDate?: string;
  insight?: string;
}

// Team member extracted from data source
export interface TeamMember {
  name: string;
  role?: string;
  linkedInUrl?: string;
  bioSummary?: string;
}

// Market information extracted from data source
export interface MarketInfo {
  tam?: string; // Total Addressable Market
  sam?: string; // Serviceable Available Market
  som?: string; // Serviceable Obtainable Market
  analysis?: string;
}

// Risk indicator extracted from data source
export interface RiskIndicator {
  riskTitle: string;
  explanation: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// Job progress tracking
export interface JobProgress {
  jobId: string;
  status: JobStatus;
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Queue job options
export interface QueueJobOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
  backoff?: {
    type: "fixed" | "exponential";
    delay: number;
  };
}

// ========================================
// REDLENS RISK ASSESSMENT TYPES
// ========================================

// Job data payload for RedLens risk assessment queue
export interface RedLensJobData {
  jobId: string;
  startupId: string;
  analysisData: {
    keyMetrics: KeyMetric[];
    teamMembers: TeamMember[];
    marketInfo?: MarketInfo;
    risks: RiskIndicator[];
    description?: string;
    finalSummary?: string;
  };
}

// Result structure for RedLens risk assessment job
export interface RedLensJobResult {
  overallScore: number; // 0-1 (0 = low risk, 1 = high risk)
  summary: string;
  recommendation: string;
  confidenceScore: number; // 0-1
  moduleAssessments: RedLensModuleAssessmentResult[];
  completedAt: string;
}

// Individual module assessment result
export interface RedLensModuleAssessmentResult {
  module: RedLensModule;
  score: number; // 0-1 (0 = low risk, 1 = high risk)
  findings: string[];
  recommendations: string[];
  confidence: number; // 0-1
}
