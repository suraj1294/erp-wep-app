export type MasterResource =
  | "account-groups"
  | "accounts"
  | "items"
  | "locations"
  | "parties"
  | "units"
  | "voucher-types"

export const companyKeys = {
  all: ["companies"] as const,
  active: () => [...companyKeys.all, "active"] as const,
  accessible: () => [...companyKeys.all, "accessible"] as const,
  detail: (companySlug: string) => [...companyKeys.all, companySlug] as const,
  dashboard: (companySlug: string) =>
    [...companyKeys.detail(companySlug), "dashboard"] as const,
  settings: (companySlug: string) =>
    [...companyKeys.detail(companySlug), "settings"] as const,
  sampleData: (companySlug: string) =>
    [...companyKeys.settings(companySlug), "sample-data"] as const,
  masters: (companySlug: string) =>
    [...companyKeys.detail(companySlug), "masters"] as const,
  master: (companySlug: string, resource: MasterResource) =>
    [...companyKeys.masters(companySlug), resource] as const,
  vouchers: (companySlug: string) =>
    [...companyKeys.detail(companySlug), "vouchers"] as const,
  voucherList: (
    companySlug: string,
    filters: { voucherClass?: string; voucherClasses?: string[] } = {}
  ) => [...companyKeys.vouchers(companySlug), "list", filters] as const,
  voucherFormData: (companySlug: string, voucherClass: string) =>
    [...companyKeys.vouchers(companySlug), "form-data", voucherClass] as const,
  voucherDetail: (companySlug: string, voucherId: string) =>
    [...companyKeys.vouchers(companySlug), "detail", voucherId] as const,
  reports: (companySlug: string) =>
    [...companyKeys.detail(companySlug), "reports"] as const,
}
