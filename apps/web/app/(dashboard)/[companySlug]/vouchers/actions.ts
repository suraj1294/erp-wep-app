"use server"

import { revalidatePath } from "next/cache"
import {
  cancelVoucher as cancelVoucherRecord,
  createVoucher as createVoucherRecord,
  getVoucherDetail as getVoucherDetailRecord,
  getVouchersByClass as getVouchersByClassRecord,
} from "@workspace/db"
import type {
  AccountLineInput,
  CreateVoucherInput,
  ItemLineInput,
} from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"

export async function createVoucher(
  companySlug: string,
  input: CreateVoucherInput
) {
  const { session, company } = await requireCompanyAccess(companySlug)
  const result = await createVoucherRecord(company.id, session.user.id, input)

  revalidatePath(`/${company.slug}`)
  return result
}

export async function cancelVoucher(companySlug: string, voucherId: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await cancelVoucherRecord(company.id, voucherId)
  revalidatePath(`/${company.slug}`)
}

export async function getVouchersByClass(
  companySlug: string,
  voucherClasses: string[]
) {
  const { company } = await requireCompanyAccess(companySlug)
  return getVouchersByClassRecord(company.id, voucherClasses)
}

export async function getVoucherDetail(companySlug: string, voucherId: string) {
  const { company } = await requireCompanyAccess(companySlug)
  return getVoucherDetailRecord(company.id, voucherId)
}
