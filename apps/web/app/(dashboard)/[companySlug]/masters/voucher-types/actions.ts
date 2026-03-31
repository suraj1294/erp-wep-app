"use server"

import { createVoucherType as createVoucherTypeRecord, deleteVoucherType as deleteVoucherTypeRecord, updateVoucherType as updateVoucherTypeRecord } from "@workspace/db"
import { revalidatePath } from "next/cache"
import { requireCompanyAccess } from "@/lib/company-access"

interface VoucherTypeData {
  name: string
  code: string
  voucherClass: string
  prefix?: string
  startingNumber?: number
}

export async function createVoucherType(
  companySlug: string,
  data: VoucherTypeData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await createVoucherTypeRecord(company.id, data)

  revalidatePath(`/${company.slug}/masters/voucher-types`)
}

export async function updateVoucherType(
  companySlug: string,
  id: string,
  data: VoucherTypeData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await updateVoucherTypeRecord(company.id, id, data)

  revalidatePath(`/${company.slug}/masters/voucher-types`)
}

export async function deleteVoucherType(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await deleteVoucherTypeRecord(company.id, id)

  revalidatePath(`/${company.slug}/masters/voucher-types`)
}
