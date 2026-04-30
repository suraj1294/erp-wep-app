import "server-only"

export type {
  CompanyDashboardData,
  DashboardMonthlyActivityItem,
  DashboardRecentTransaction,
  DashboardSummary,
  DashboardVoucherMixItem,
} from "@workspace/db/services/dashboard"
export { getCompanyDashboardSnapshot } from "@workspace/db/services/dashboard"
