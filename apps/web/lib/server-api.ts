import { headers } from "next/headers"
import type { CompanyDashboardData } from "@/lib/dashboard-data"

interface ActiveCompanyMembership {
  companySlug: string
}

interface AccessibleCompany {
  id: string
  slug: string
  name: string
  displayName: string | null
  role: string
}

export interface VoucherDetailLineItem {
  id: string
  lineNumber: number
  accountId: string | null
  accountName: string | null
  itemId: string | null
  itemName: string | null
  description: string | null
  quantity: string | null
  rate: string | null
  debitAmount: string | null
  creditAmount: string | null
}

export interface VoucherDetail {
  id: string
  voucherNumber: string
  voucherDate: string
  referenceNumber: string | null
  totalAmount: string
  status: string
  narration: string | null
  dueDate: string | null
  partyId: string | null
  partyName: string | null
  voucherTypeId: string
  voucherTypeName: string | null
  voucherClass: string | null
  lineItems: VoucherDetailLineItem[]
}

export interface VoucherTypeOptionPayload {
  id: string
  name: string
  prefix: string | null
  currentNumber: number
}

export interface PartyOptionPayload {
  id: string
  name: string
  displayName: string | null
  type: string
  accountId: string | null
  gstin?: string | null
}

export interface AccountOptionPayload {
  id: string
  name: string
  code: string | null
  groupName?: string | null
}

export interface ItemOptionPayload {
  id: string
  name: string
  code: string | null
  salesRate: string | null
  purchaseRate: string | null
  taxRate: string | null
  unitSymbol: string | null
}

export interface ItemVoucherFormPayload {
  companyId: string
  companySlug: string
  voucherTypes: VoucherTypeOptionPayload[]
  parties: PartyOptionPayload[]
  items: ItemOptionPayload[]
  accounts: AccountOptionPayload[]
}

export interface AccountVoucherFormPayload {
  companyId: string
  companySlug: string
  voucherTypes: VoucherTypeOptionPayload[]
  parties: PartyOptionPayload[]
  accounts: AccountOptionPayload[]
  cashBankAccounts: AccountOptionPayload[]
}

interface DashboardCompany {
  id: string
  slug: string
  name: string
  displayName: string | null
}

interface DashboardMembership {
  id: string
  role: string
  isActive: boolean
}

export interface CompanyDashboardPayload extends CompanyDashboardData {
  company: DashboardCompany
  membership: DashboardMembership
}

function getErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message
  }

  return "Request failed."
}

async function getBaseUrl() {
  const incomingHeaders = await headers()
  const host =
    incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host")

  if (!host) {
    throw new Error("Unable to resolve request host.")
  }

  const protocol = incomingHeaders.get("x-forwarded-proto") ?? "http"
  return `${protocol}://${host}`
}

export async function serverApiRequest<T = any>(path: string) {
  const incomingHeaders = await headers()
  const requestHeaders = new Headers()
  const cookie = incomingHeaders.get("cookie")

  if (cookie) {
    requestHeaders.set("cookie", cookie)
  }

  const response = await fetch(`${await getBaseUrl()}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: requestHeaders,
  })

  const payload = (await response.json()) as T | { error?: string; message?: string }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload))
  }

  return payload as T
}

export function getFirstActiveCompany() {
  return serverApiRequest<ActiveCompanyMembership | null>("/api/companies/active")
}

export function getAccessibleCompanies() {
  return serverApiRequest<AccessibleCompany[]>("/api/companies/accessible")
}

export function getCompanyDashboardData(companySlug: string) {
  return serverApiRequest<CompanyDashboardPayload>(
    `/api/companies/${encodeURIComponent(companySlug)}/dashboard`
  )
}

export function getCompanySettingsData(companySlug: string) {
  return serverApiRequest(`/api/companies/${encodeURIComponent(companySlug)}/settings`)
}

export function getChartOfAccountsData(companySlug: string) {
  return serverApiRequest(
    `/api/companies/${encodeURIComponent(companySlug)}/chart-of-accounts`
  )
}

export function getBankingData(companySlug: string) {
  return serverApiRequest(`/api/companies/${encodeURIComponent(companySlug)}/banking`)
}

export function getMasterResourceData(companySlug: string, resource: string) {
  return serverApiRequest(
    `/api/companies/${encodeURIComponent(companySlug)}/masters/${resource}`
  )
}

export function getVoucherListData(companySlug: string, voucherClass: string) {
  const params = new URLSearchParams({ voucherClass })
  return serverApiRequest(
    `/api/companies/${encodeURIComponent(
      companySlug
    )}/voucher-list?${params.toString()}`
  )
}

export function getVoucherFormData(companySlug: string, voucherClass: string) {
  const params = new URLSearchParams({ voucherClass })
  return serverApiRequest<ItemVoucherFormPayload | AccountVoucherFormPayload>(
    `/api/companies/${encodeURIComponent(
      companySlug
    )}/voucher-form-data?${params.toString()}`
  )
}

export function getVoucherDetailData(companySlug: string, voucherId: string) {
  return serverApiRequest<VoucherDetail>(
    `/api/companies/${encodeURIComponent(
      companySlug
    )}/vouchers/${encodeURIComponent(voucherId)}`
  )
}
