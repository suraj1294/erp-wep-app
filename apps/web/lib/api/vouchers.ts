import type { CreateVoucherInput, UpdateVoucherInput } from "@workspace/db"
import { apiRequest } from "@/lib/api-client"

export function createVoucher(companySlug: string, input: CreateVoucherInput) {
  return apiRequest<{ voucherId: string; voucherNumber: string }>(
    `/api/companies/${encodeURIComponent(companySlug)}/vouchers`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  )
}

export function updateVoucher(
  companySlug: string,
  voucherId: string,
  input: UpdateVoucherInput
) {
  return apiRequest<{ voucherId: string; voucherNumber: string }>(
    `/api/companies/${encodeURIComponent(
      companySlug
    )}/vouchers/${encodeURIComponent(voucherId)}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    }
  )
}

export function cancelVoucher(companySlug: string, voucherId: string) {
  return apiRequest<{ ok: true }>(
    `/api/companies/${encodeURIComponent(
      companySlug
    )}/vouchers/${encodeURIComponent(voucherId)}/cancel`,
    {
      method: "POST",
    }
  )
}

export function getVouchersByClass(
  companySlug: string,
  voucherClasses: string[]
) {
  const params = new URLSearchParams()
  params.set("voucherClasses", voucherClasses.join(","))

  return apiRequest<unknown[]>(
    `/api/companies/${encodeURIComponent(companySlug)}/vouchers?${params.toString()}`
  )
}

export function getVoucherDetail(companySlug: string, voucherId: string) {
  return apiRequest<unknown>(
    `/api/companies/${encodeURIComponent(
      companySlug
    )}/vouchers/${encodeURIComponent(voucherId)}`
  )
}
