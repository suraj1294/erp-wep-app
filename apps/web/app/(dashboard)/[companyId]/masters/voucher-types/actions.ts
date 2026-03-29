"use server"

import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@workspace/db/client"
import { voucherTypes } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"

interface VoucherTypeData {
  name: string
  code: string
  voucherClass: string
  prefix?: string
  startingNumber?: number
}

export async function createVoucherType(
  companyId: string,
  data: VoucherTypeData
) {
  await requireCompanyAccess(companyId)

  await db.insert(voucherTypes).values({
    companyId,
    name: data.name,
    code: data.code,
    voucherClass: data.voucherClass,
    prefix: data.prefix ?? null,
    startingNumber: data.startingNumber ?? 1,
    currentNumber: data.startingNumber ?? 1,
  })

  revalidatePath(`/${companyId}/masters/voucher-types`)
}

export async function updateVoucherType(
  companyId: string,
  id: string,
  data: VoucherTypeData
) {
  await requireCompanyAccess(companyId)

  await db
    .update(voucherTypes)
    .set({
      name: data.name,
      code: data.code,
      voucherClass: data.voucherClass,
      prefix: data.prefix ?? null,
      startingNumber: data.startingNumber ?? 1,
    })
    .where(and(eq(voucherTypes.id, id), eq(voucherTypes.companyId, companyId)))

  revalidatePath(`/${companyId}/masters/voucher-types`)
}

export async function deleteVoucherType(companyId: string, id: string) {
  await requireCompanyAccess(companyId)

  await db
    .delete(voucherTypes)
    .where(and(eq(voucherTypes.id, id), eq(voucherTypes.companyId, companyId)))

  revalidatePath(`/${companyId}/masters/voucher-types`)
}
