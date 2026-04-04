import {
  createAccount,
  createAccountGroup,
  createItem,
  createLocation,
  createParty,
  createUnit,
  createVoucherType,
  deleteAccount,
  deleteAccountGroup,
  deleteItem,
  deleteLocation,
  deleteParty,
  deleteUnit,
  deleteVoucherType,
  updateAccount,
  updateAccountGroup,
  updateItem,
  updateLocation,
  updateParty,
  updateUnit,
  updateVoucherType,
} from "@workspace/db"
import { revalidatePath } from "next/cache"
import { requireCompanyAccess } from "@/lib/company-access"

type CompanyMasterHandler = {
  pagePath: string
  create: (companyId: string, data: unknown) => Promise<unknown>
  update: (companyId: string, id: string, data: unknown) => Promise<unknown>
  delete: (companyId: string, id: string) => Promise<unknown>
}

const MASTER_HANDLERS = {
  "account-groups": {
    pagePath: "account-groups",
    create: (companyId, data) =>
      createAccountGroup(
        companyId,
        data as Parameters<typeof createAccountGroup>[1]
      ),
    update: (companyId, id, data) =>
      updateAccountGroup(
        companyId,
        id,
        data as Parameters<typeof updateAccountGroup>[2]
      ),
    delete: deleteAccountGroup,
  },
  accounts: {
    pagePath: "accounts",
    create: (companyId, data) =>
      createAccount(companyId, data as Parameters<typeof createAccount>[1]),
    update: (companyId, id, data) =>
      updateAccount(companyId, id, data as Parameters<typeof updateAccount>[2]),
    delete: deleteAccount,
  },
  items: {
    pagePath: "items",
    create: (companyId, data) =>
      createItem(companyId, data as Parameters<typeof createItem>[1]),
    update: (companyId, id, data) =>
      updateItem(companyId, id, data as Parameters<typeof updateItem>[2]),
    delete: deleteItem,
  },
  locations: {
    pagePath: "locations",
    create: (companyId, data) =>
      createLocation(companyId, data as Parameters<typeof createLocation>[1]),
    update: (companyId, id, data) =>
      updateLocation(
        companyId,
        id,
        data as Parameters<typeof updateLocation>[2]
      ),
    delete: deleteLocation,
  },
  parties: {
    pagePath: "parties",
    create: (companyId, data) =>
      createParty(companyId, data as Parameters<typeof createParty>[1]),
    update: (companyId, id, data) =>
      updateParty(companyId, id, data as Parameters<typeof updateParty>[2]),
    delete: deleteParty,
  },
  units: {
    pagePath: "units",
    create: (companyId, data) =>
      createUnit(companyId, data as Parameters<typeof createUnit>[1]),
    update: (companyId, id, data) =>
      updateUnit(companyId, id, data as Parameters<typeof updateUnit>[2]),
    delete: deleteUnit,
  },
  "voucher-types": {
    pagePath: "voucher-types",
    create: (companyId, data) =>
      createVoucherType(
        companyId,
        data as Parameters<typeof createVoucherType>[1]
      ),
    update: (companyId, id, data) =>
      updateVoucherType(
        companyId,
        id,
        data as Parameters<typeof updateVoucherType>[2]
      ),
    delete: deleteVoucherType,
  },
} satisfies Record<string, CompanyMasterHandler>

export type CompanyMasterResource = keyof typeof MASTER_HANDLERS

export function isCompanyMasterResource(
  value: string
): value is CompanyMasterResource {
  return value in MASTER_HANDLERS
}

function getHandler(resource: CompanyMasterResource) {
  return MASTER_HANDLERS[resource]
}

export async function createCompanyMasterResource(
  companySlug: string,
  resource: CompanyMasterResource,
  data: unknown
) {
  const { company } = await requireCompanyAccess(companySlug)
  const handler = getHandler(resource)

  await handler.create(company.id, data)
  revalidatePath(`/${company.slug}/masters/${handler.pagePath}`)
}

export async function updateCompanyMasterResource(
  companySlug: string,
  resource: CompanyMasterResource,
  id: string,
  data: unknown
) {
  const { company } = await requireCompanyAccess(companySlug)
  const handler = getHandler(resource)

  await handler.update(company.id, id, data)
  revalidatePath(`/${company.slug}/masters/${handler.pagePath}`)
}

export async function deleteCompanyMasterResource(
  companySlug: string,
  resource: CompanyMasterResource,
  id: string
) {
  const { company } = await requireCompanyAccess(companySlug)
  const handler = getHandler(resource)

  await handler.delete(company.id, id)
  revalidatePath(`/${company.slug}/masters/${handler.pagePath}`)
}
