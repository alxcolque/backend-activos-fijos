import { MaintenanceType } from '@prisma/client';

export interface ReportFilterOptions {
  category?: string;
  status?: string;
  location?: string;
  projectId?: string;
  type?: MaintenanceType;
  startDate?: string;
  endDate?: string;
  year?: number;
  activeOnly?: boolean;
}

export interface AssetsReportResult {
  summary: {
    totalAssets: number;
    totalPurchaseValue: number;
    totalCurrentValue: number;
  };
  items: any[];
}

export interface DepreciationItem {
  id: string;
  code: string;
  name: string;
  category: string;
  purchaseYear: number | null;
  purchaseValue: number;
  usefulLife: number;
  elapsedYears: number;
  annualDepreciation: number;
  accumulatedDepreciation: number;
  netBookValue: number;
}

export interface DepreciationReportResult {
  summary: {
    totalAssets: number;
    totalOriginalValue: number;
    totalAccumulatedDepreciation: number;
    totalNetBookValue: number;
  };
  items: DepreciationItem[];
}

export interface AssignmentsReportResult {
  summary: {
    totalAssignments: number;
    activeAssignments: number;
  };
  items: any[];
}

export interface MaintenancesReportResult {
  summary: {
    totalInterventions: number;
    totalCost: number;
    preventiveCost: number;
    correctiveCost: number;
  };
  items: any[];
}

export interface IReportRepository {
  getAssetsReport(options: ReportFilterOptions): Promise<AssetsReportResult>;
  getDepreciationReport(options: ReportFilterOptions): Promise<DepreciationReportResult>;
  getAssignmentsReport(options: ReportFilterOptions): Promise<AssignmentsReportResult>;
  getMaintenancesReport(options: ReportFilterOptions): Promise<MaintenancesReportResult>;
}
