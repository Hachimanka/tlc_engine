export type SuperadminOverviewPeriod = "week" | "month" | "year";

export type SuperadminOverviewSummary = {
  totalOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  inactiveOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  totalDemoRequests: number;
  pendingDemoRequests: number;
  convertedDemoRequests: number;
  rejectedDemoRequests: number;
  conversionRate: number;
  estimatedMonthlyRevenue: number;
  healthScore: string;
  healthPercent: number;
  emailConfigured: boolean;
  newOrganizationsInPeriod: number;
  newUsersInPeriod: number;
  newDemoRequestsInPeriod: number;
  activityCountInPeriod: number;
};

export type SuperadminOverviewPipelineItem = {
  label: string;
  status: string;
  value: number;
  color: string;
};

export type SuperadminOverviewPlanItem = {
  label: string;
  value: number;
  color: string;
};

export type SuperadminOverviewOrganizationItem = {
  id: string;
  name: string;
  plan: string;
  status: string;
  users: number;
  createdAt?: string | null;
};

export type SuperadminOverviewActivityItem = {
  id: string;
  action: string;
  name: string;
  type: string;
  status: string;
  target?: string | null;
  targetType?: string | null;
  userName?: string | null;
  createdAt: string;
};

export type SuperadminOverviewActivityBucket = {
  label: string;
  value: number;
};

export type SuperadminOverviewGrowthBucket = {
  label: string;
  orgs: number;
  demos: number;
};

export type SuperadminOverviewHealthCheck = {
  label: string;
  value: string;
  status: "operational" | "warning" | "info";
};

export type SuperadminOverviewPayload = {
  period: SuperadminOverviewPeriod;
  generatedAt: string;
  summary: SuperadminOverviewSummary;
  pipeline: SuperadminOverviewPipelineItem[];
  planDistribution: SuperadminOverviewPlanItem[];
  recentOrganizations: SuperadminOverviewOrganizationItem[];
  topOrganizations: SuperadminOverviewOrganizationItem[];
  recentActivity: SuperadminOverviewActivityItem[];
  activityBuckets: SuperadminOverviewActivityBucket[];
  growthBuckets: SuperadminOverviewGrowthBucket[];
  healthChecks: SuperadminOverviewHealthCheck[];
};
