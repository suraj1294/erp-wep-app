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
  companySlug: string,
  data: VoucherTypeData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await db.insert(voucherTypes).values({
    companyId: company.id,
    name: data.name,
    code: data.code,
    voucherClass: data.voucherClass,
    prefix: data.prefix ?? null,
    startingNumber: data.startingNumber ?? 1,
    currentNumber: data.startingNumber ?? 1,
  })

  revalidatePath(`/${company.slug}/masters/voucher-types`)
}

export async function updateVoucherType(
  companySlug: string,
  id: string,
  data: VoucherTypeData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await db
    .update(voucherTypes)
    .set({
      name: data.name,
      code: data.code,
      voucherClass: data.voucherClass,
      prefix: data.prefix ?? null,
      startingNumber: data.startingNumber ?? 1,
    })
    .where(and(eq(voucherTypes.id, id), eq(voucherTypes.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/voucher-types`)
}

export async function deleteVoucherType(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await db
    .delete(voucherTypes)
    .where(and(eq(voucherTypes.id, id), eq(voucherTypes.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/voucher-types`)
}
