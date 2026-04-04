import { apiRequest } from "@/lib/api-client"

type MasterResource =
  | "account-groups"
  | "accounts"
  | "items"
  | "locations"
  | "parties"
  | "units"
  | "voucher-types"

function resourcePath(
  companySlug: string,
  resource: MasterResource,
  id?: string
) {
  const base = `/api/companies/${encodeURIComponent(
    companySlug
  )}/masters/${resource}`

  return id ? `${base}/${encodeURIComponent(id)}` : base
}

function createMaster<T>(
  companySlug: string,
  resource: MasterResource,
  data: T
) {
  return apiRequest<{ ok: true }>(resourcePath(companySlug, resource), {
    method: "POST",
    body: JSON.stringify(data),
  })
}

function updateMaster<T>(
  companySlug: string,
  resource: MasterResource,
  id: string,
  data: T
) {
  return apiRequest<{ ok: true }>(resourcePath(companySlug, resource, id), {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

function deleteMaster(
  companySlug: string,
  resource: MasterResource,
  id: string
) {
  return apiRequest<{ ok: true }>(resourcePath(companySlug, resource, id), {
    method: "DELETE",
  })
}

export function createAccountGroup(
  companySlug: string,
  data: {
    name: string
    code?: string
    accountType: string
    nature: string
    parentId?: string | null
  }
) {
  return createMaster(companySlug, "account-groups", data)
}

export function updateAccountGroup(
  companySlug: string,
  id: string,
  data: {
    name: string
    code?: string
    accountType: string
    nature: string
    parentId?: string | null
  }
) {
  return updateMaster(companySlug, "account-groups", id, data)
}

export function deleteAccountGroup(companySlug: string, id: string) {
  return deleteMaster(companySlug, "account-groups", id)
}

export function createAccount(
  companySlug: string,
  data: {
    name: string
    code?: string
    description?: string
    groupId?: string | null
    openingBalance?: string
  }
) {
  return createMaster(companySlug, "accounts", data)
}

export function updateAccount(
  companySlug: string,
  id: string,
  data: {
    name: string
    code?: string
    description?: string
    groupId?: string | null
    openingBalance?: string
  }
) {
  return updateMaster(companySlug, "accounts", id, data)
}

export function deleteAccount(companySlug: string, id: string) {
  return deleteMaster(companySlug, "accounts", id)
}

export function createItem(
  companySlug: string,
  data: {
    name: string
    code?: string
    description?: string
    category?: string
    unitId?: string | null
    itemType?: string
    hsnCode?: string
    taxRate?: string
    purchaseRate?: string
    salesRate?: string
    mrp?: string
  }
) {
  return createMaster(companySlug, "items", data)
}

export function updateItem(
  companySlug: string,
  id: string,
  data: {
    name: string
    code?: string
    description?: string
    category?: string
    unitId?: string | null
    itemType?: string
    hsnCode?: string
    taxRate?: string
    purchaseRate?: string
    salesRate?: string
    mrp?: string
  }
) {
  return updateMaster(companySlug, "items", id, data)
}

export function deleteItem(companySlug: string, id: string) {
  return deleteMaster(companySlug, "items", id)
}

export function createLocation(
  companySlug: string,
  data: {
    name: string
    code?: string
    address?: string
    contactPerson?: string
    phone?: string
    isDefault?: boolean
  }
) {
  return createMaster(companySlug, "locations", data)
}

export function updateLocation(
  companySlug: string,
  id: string,
  data: {
    name: string
    code?: string
    address?: string
    contactPerson?: string
    phone?: string
    isDefault?: boolean
  }
) {
  return updateMaster(companySlug, "locations", id, data)
}

export function deleteLocation(companySlug: string, id: string) {
  return deleteMaster(companySlug, "locations", id)
}

export function createParty(
  companySlug: string,
  data: {
    name: string
    displayName?: string
    type: string
    contactPerson?: string
    phone?: string
    email?: string
    gstin?: string
    pan?: string
    creditLimit?: string
    creditDays?: number
  }
) {
  return createMaster(companySlug, "parties", data)
}

export function updateParty(
  companySlug: string,
  id: string,
  data: {
    name: string
    displayName?: string
    type: string
    contactPerson?: string
    phone?: string
    email?: string
    gstin?: string
    pan?: string
    creditLimit?: string
    creditDays?: number
  }
) {
  return updateMaster(companySlug, "parties", id, data)
}

export function deleteParty(companySlug: string, id: string) {
  return deleteMaster(companySlug, "parties", id)
}

export function createUnit(
  companySlug: string,
  data: {
    name: string
    symbol: string
    decimalPlaces: number
    isBaseUnit: boolean
    conversionFactor: string
  }
) {
  return createMaster(companySlug, "units", data)
}

export function updateUnit(
  companySlug: string,
  id: string,
  data: {
    name: string
    symbol: string
    decimalPlaces: number
    isBaseUnit: boolean
    conversionFactor: string
  }
) {
  return updateMaster(companySlug, "units", id, data)
}

export function deleteUnit(companySlug: string, id: string) {
  return deleteMaster(companySlug, "units", id)
}

export function createVoucherType(
  companySlug: string,
  data: {
    name: string
    code: string
    voucherClass: string
    prefix?: string
    startingNumber?: number
  }
) {
  return createMaster(companySlug, "voucher-types", data)
}

export function updateVoucherType(
  companySlug: string,
  id: string,
  data: {
    name: string
    code: string
    voucherClass: string
    prefix?: string
    startingNumber?: number
  }
) {
  return updateMaster(companySlug, "voucher-types", id, data)
}

export function deleteVoucherType(companySlug: string, id: string) {
  return deleteMaster(companySlug, "voucher-types", id)
}
