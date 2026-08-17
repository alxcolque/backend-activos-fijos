export interface DashboardSummary {
  totalAssets: number;
  totalValue: number;
  operationalAssets: number;
  maintenanceAssets: number;
  inactiveAssets: number;
  totalProjects: number;
  activeProjects: number;
  totalAssignedQuantity: number;
  totalAvailableQuantity: number;
}

export interface StatusStat {
  status: string;
  count: number;
}

export interface CategoryStat {
  category: string;
  quantity: number;
  value: number;
}

export interface LocationStat {
  location: string;
  quantity: number;
}

export interface RecentAsset {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
}

export interface RecentActivity {
  action: string;
  description: string | null;
  date: Date;
}

export interface DashboardData {
  summary: DashboardSummary;
  byStatus: StatusStat[];
  byCategory: CategoryStat[];
  byLocation: LocationStat[];
  recentAssets: RecentAsset[];
  recentActivities: RecentActivity[];
}

export interface IDashboardRepository {
  getSummary(): Promise<DashboardSummary>;
  getAssetsByStatus(): Promise<StatusStat[]>;
  getAssetsByCategory(): Promise<CategoryStat[]>;
  getAssetsByLocation(): Promise<LocationStat[]>;
  getRecentAssets(limit?: number): Promise<RecentAsset[]>;
  getRecentActivities(limit?: number): Promise<RecentActivity[]>;
  getDashboardData(): Promise<DashboardData>;
}
