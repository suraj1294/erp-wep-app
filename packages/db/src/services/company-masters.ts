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
} from "./masters"

type CompanyMasterHandler = {
  pagePath: string
  create: (companyId: string, data: unknown) => Promise<unknown>
  update: (companyId: string, id: string, data: unknown) => Promise<unknown>
  delete: (companyId: string, id: string) => Promise<unknown>
}

const COMPANY_MASTER_HANDLERS = {
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

export type CompanyMasterResource = keyof typeof COMPANY_MASTER_HANDLERS

export function isCompanyMasterResource(
  value: string
): value is CompanyMasterResource {
  return value in COMPANY_MASTER_HANDLERS
}

export function getCompanyMasterPagePath(resource: CompanyMasterResource) {
  return COMPANY_MASTER_HANDLERS[resource].pagePath
}

export async function createCompanyMasterRecord(
  companyId: string,
  resource: CompanyMasterResource,
  data: unknown
) {
  return COMPANY_MASTER_HANDLERS[resource].create(companyId, data)
}

export async function updateCompanyMasterRecord(
  companyId: string,
  resource: CompanyMasterResource,
  id: string,
  data: unknown
) {
  return COMPANY_MASTER_HANDLERS[resource].update(companyId, id, data)
}

export async function deleteCompanyMasterRecord(
  companyId: string,
  resource: CompanyMasterResource,
  id: string
) {
  return COMPANY_MASTER_HANDLERS[resource].delete(companyId, id)
}
