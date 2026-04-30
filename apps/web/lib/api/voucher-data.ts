import type {
  AccountVoucherFormPayload,
  ItemVoucherFormPayload,
  VoucherDetail,
} from "@/lib/server-api"
import { apiRequest } from "@/lib/api-client"

export function getVoucherList<T = unknown[]>(
  companySlug: string,
  voucherClass: string
) {
  const params = new URLSearchParams({ voucherClass })

  return apiRequest<T>(
    `/api/companies/${encodeURIComponent(
      companySlug
    )}/voucher-list?${params.toString()}`
  )
}

export function getVoucherFormData(
  companySlug: string,
  voucherClass: string
) {
  const params = new URLSearchParams({ voucherClass })

  return apiRequest<ItemVoucherFormPayload | AccountVoucherFormPayload>(
    `/api/companies/${encodeURIComponent(
      companySlug
    )}/voucher-form-data?${params.toString()}`
  )
}

export function getVoucherDetail(companySlug: string, voucherId: string) {
  return apiRequest<VoucherDetail>(
    `/api/companies/${encodeURIComponent(
      companySlug
    )}/vouchers/${encodeURIComponent(voucherId)}`
  )
}
