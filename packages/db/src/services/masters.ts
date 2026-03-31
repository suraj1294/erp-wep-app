import { and, asc, eq } from "drizzle-orm"
import { db } from "../client"
import {
  accountGroups,
  accounts,
  items,
  locations,
  parties,
  unitsOfMeasure,
  voucherTypes,
} from "../schema"

export async function listAccountGroups(companyId: string) {
  return db
    .select()
    .from(accountGroups)
    .where(eq(accountGroups.companyId, companyId))
    .orderBy(asc(accountGroups.level), asc(accountGroups.name))
}

export async function createAccountGroup(
  companyId: string,
  data: {
    name: string
    code?: string | null
    accountType: string
    nature: string
    parentId?: string | null
  }
) {
  await db.insert(accountGroups).values({
    companyId,
    name: data.name,
    code: data.code ?? null,
    accountType: data.accountType,
    nature: data.nature,
    parentId: data.parentId ?? null,
  })
}

export async function updateAccountGroup(
  companyId: string,
  id: string,
  data: {
    name: string
    code?: string | null
    accountType: string
    nature: string
    parentId?: string | null
  }
) {
  await db
    .update(accountGroups)
    .set({
      name: data.name,
      code: data.code ?? null,
      accountType: data.accountType,
      nature: data.nature,
      ...(data.parentId !== id ? { parentId: data.parentId ?? null } : {}),
    })
    .where(and(eq(accountGroups.id, id), eq(accountGroups.companyId, companyId)))
}

export async function deleteAccountGroup(companyId: string, id: string) {
  await db
    .delete(accountGroups)
    .where(and(eq(accountGroups.id, id), eq(accountGroups.companyId, companyId)))
}

export async function listAccounts(companyId: string) {
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.companyId, companyId))
    .orderBy(asc(accounts.name))
}

export async function listAccountGroupOptions(companyId: string) {
  return db
    .select({ id: accountGroups.id, name: accountGroups.name })
    .from(accountGroups)
    .where(eq(accountGroups.companyId, companyId))
    .orderBy(asc(accountGroups.name))
}

export async function listAccountsWithGroups(companyId: string) {
  return db
    .select({
      id: accounts.id,
      name: accounts.name,
      code: accounts.code,
      groupName: accountGroups.name,
    })
    .from(accounts)
    .leftJoin(accountGroups, eq(accounts.groupId, accountGroups.id))
    .where(and(eq(accounts.companyId, companyId), eq(accounts.isActive, true)))
    .orderBy(asc(accounts.name))
}

export async function createAccount(
  companyId: string,
  data: {
    name: string
    code?: string | null
    description?: string | null
    groupId?: string | null
    openingBalance?: string | null
  }
) {
  await db.insert(accounts).values({
    companyId,
    name: data.name,
    code: data.code ?? null,
    description: data.description ?? null,
    groupId: data.groupId ?? null,
    openingBalance: data.openingBalance ?? "0",
  })
}

export async function updateAccount(
  companyId: string,
  id: string,
  data: {
    name: string
    code?: string | null
    description?: string | null
    groupId?: string | null
    openingBalance?: string | null
  }
) {
  await db
    .update(accounts)
    .set({
      name: data.name,
      code: data.code ?? null,
      description: data.description ?? null,
      groupId: data.groupId ?? null,
      openingBalance: data.openingBalance ?? "0",
    })
    .where(and(eq(accounts.id, id), eq(accounts.companyId, companyId)))
}

export async function deleteAccount(companyId: string, id: string) {
  await db
    .delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.companyId, companyId)))
}

export async function listParties(companyId: string) {
  return db
    .select()
    .from(parties)
    .where(eq(parties.companyId, companyId))
    .orderBy(asc(parties.name))
}

export async function listActiveParties(companyId: string) {
  return db
    .select({
      id: parties.id,
      name: parties.name,
      displayName: parties.displayName,
      type: parties.type,
      accountId: parties.accountId,
      gstin: parties.gstin,
    })
    .from(parties)
    .where(and(eq(parties.companyId, companyId), eq(parties.isActive, true)))
    .orderBy(asc(parties.name))
}

export async function createParty(
  companyId: string,
  data: {
    name: string
    displayName?: string | null
    type: string
    contactPerson?: string | null
    phone?: string | null
    email?: string | null
    gstin?: string | null
    pan?: string | null
    creditLimit?: string | null
    creditDays?: number | null
  }
) {
  await db.insert(parties).values({
    companyId,
    name: data.name,
    displayName: data.displayName ?? null,
    type: data.type,
    contactPerson: data.contactPerson ?? null,
    phone: data.phone ?? null,
    email: data.email ?? null,
    gstin: data.gstin ?? null,
    pan: data.pan ?? null,
    creditLimit: data.creditLimit ?? "0",
    creditDays: data.creditDays ?? 0,
  })
}

export async function updateParty(
  companyId: string,
  id: string,
  data: {
    name: string
    displayName?: string | null
    type: string
    contactPerson?: string | null
    phone?: string | null
    email?: string | null
    gstin?: string | null
    pan?: string | null
    creditLimit?: string | null
    creditDays?: number | null
  }
) {
  await db
    .update(parties)
    .set({
      name: data.name,
      displayName: data.displayName ?? null,
      type: data.type,
      contactPerson: data.contactPerson ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      gstin: data.gstin ?? null,
      pan: data.pan ?? null,
      creditLimit: data.creditLimit ?? "0",
      creditDays: data.creditDays ?? 0,
    })
    .where(and(eq(parties.id, id), eq(parties.companyId, companyId)))
}

export async function deleteParty(companyId: string, id: string) {
  await db
    .delete(parties)
    .where(and(eq(parties.id, id), eq(parties.companyId, companyId)))
}

export async function listItems(companyId: string) {
  return db
    .select()
    .from(items)
    .where(eq(items.companyId, companyId))
    .orderBy(asc(items.name))
}

export async function listActiveItems(companyId: string) {
  return db
    .select({
      id: items.id,
      name: items.name,
      code: items.code,
      salesRate: items.salesRate,
      purchaseRate: items.purchaseRate,
      taxRate: items.taxRate,
      unitId: items.unitId,
    })
    .from(items)
    .where(and(eq(items.companyId, companyId), eq(items.isActive, true)))
    .orderBy(asc(items.name))
}

export async function createItem(
  companyId: string,
  data: {
    name: string
    code?: string | null
    description?: string | null
    category?: string | null
    unitId?: string | null
    itemType?: string | null
    hsnCode?: string | null
    taxRate?: string | null
    purchaseRate?: string | null
    salesRate?: string | null
    mrp?: string | null
  }
) {
  await db.insert(items).values({
    companyId,
    name: data.name,
    code: data.code ?? null,
    description: data.description ?? null,
    category: data.category ?? null,
    unitId: data.unitId ?? null,
    itemType: data.itemType ?? "goods",
    hsnCode: data.hsnCode ?? null,
    taxRate: data.taxRate ?? "0",
    purchaseRate: data.purchaseRate ?? null,
    salesRate: data.salesRate ?? null,
    mrp: data.mrp ?? null,
  })
}

export async function updateItem(
  companyId: string,
  id: string,
  data: {
    name: string
    code?: string | null
    description?: string | null
    category?: string | null
    unitId?: string | null
    itemType?: string | null
    hsnCode?: string | null
    taxRate?: string | null
    purchaseRate?: string | null
    salesRate?: string | null
    mrp?: string | null
  }
) {
  await db
    .update(items)
    .set({
      name: data.name,
      code: data.code ?? null,
      description: data.description ?? null,
      category: data.category ?? null,
      unitId: data.unitId ?? null,
      itemType: data.itemType ?? "goods",
      hsnCode: data.hsnCode ?? null,
      taxRate: data.taxRate ?? "0",
      purchaseRate: data.purchaseRate ?? null,
      salesRate: data.salesRate ?? null,
      mrp: data.mrp ?? null,
    })
    .where(and(eq(items.id, id), eq(items.companyId, companyId)))
}

export async function deleteItem(companyId: string, id: string) {
  await db
    .delete(items)
    .where(and(eq(items.id, id), eq(items.companyId, companyId)))
}

export async function listLocations(companyId: string) {
  return db
    .select()
    .from(locations)
    .where(eq(locations.companyId, companyId))
    .orderBy(asc(locations.name))
}

export async function createLocation(
  companyId: string,
  data: {
    name: string
    code?: string | null
    address?: string | null
    contactPerson?: string | null
    phone?: string | null
    isDefault?: boolean | null
  }
) {
  await db.insert(locations).values({
    companyId,
    name: data.name,
    code: data.code ?? null,
    address: data.address ?? null,
    contactPerson: data.contactPerson ?? null,
    phone: data.phone ?? null,
    isDefault: data.isDefault ?? false,
  })
}

export async function updateLocation(
  companyId: string,
  id: string,
  data: {
    name: string
    code?: string | null
    address?: string | null
    contactPerson?: string | null
    phone?: string | null
    isDefault?: boolean | null
  }
) {
  await db
    .update(locations)
    .set({
      name: data.name,
      code: data.code ?? null,
      address: data.address ?? null,
      contactPerson: data.contactPerson ?? null,
      phone: data.phone ?? null,
      isDefault: data.isDefault ?? false,
    })
    .where(and(eq(locations.id, id), eq(locations.companyId, companyId)))
}

export async function deleteLocation(companyId: string, id: string) {
  await db
    .delete(locations)
    .where(and(eq(locations.id, id), eq(locations.companyId, companyId)))
}

export async function listUnits(companyId: string) {
  return db
    .select()
    .from(unitsOfMeasure)
    .where(eq(unitsOfMeasure.companyId, companyId))
    .orderBy(asc(unitsOfMeasure.name))
}

export async function listUnitOptions(companyId: string) {
  return db
    .select({
      id: unitsOfMeasure.id,
      name: unitsOfMeasure.name,
      symbol: unitsOfMeasure.symbol,
    })
    .from(unitsOfMeasure)
    .where(eq(unitsOfMeasure.companyId, companyId))
    .orderBy(asc(unitsOfMeasure.name))
}

export async function getBaseUnit(companyId: string) {
  const [unit] = await db
    .select({ id: unitsOfMeasure.id })
    .from(unitsOfMeasure)
    .where(eq(unitsOfMeasure.companyId, companyId))
    .orderBy(asc(unitsOfMeasure.isBaseUnit), asc(unitsOfMeasure.name))

  return unit ?? null
}

export async function createUnit(
  companyId: string,
  data: {
    name: string
    symbol: string
    decimalPlaces: number
    isBaseUnit: boolean
    conversionFactor: string
  }
) {
  await db.insert(unitsOfMeasure).values({
    companyId,
    name: data.name,
    symbol: data.symbol,
    decimalPlaces: data.decimalPlaces,
    isBaseUnit: data.isBaseUnit,
    conversionFactor: data.conversionFactor,
  })
}

export async function updateUnit(
  companyId: string,
  id: string,
  data: {
    name: string
    symbol: string
    decimalPlaces: number
    isBaseUnit: boolean
    conversionFactor: string
  }
) {
  await db
    .update(unitsOfMeasure)
    .set({
      name: data.name,
      symbol: data.symbol,
      decimalPlaces: data.decimalPlaces,
      isBaseUnit: data.isBaseUnit,
      conversionFactor: data.conversionFactor,
    })
    .where(and(eq(unitsOfMeasure.id, id), eq(unitsOfMeasure.companyId, companyId)))
}

export async function deleteUnit(companyId: string, id: string) {
  await db
    .delete(unitsOfMeasure)
    .where(and(eq(unitsOfMeasure.id, id), eq(unitsOfMeasure.companyId, companyId)))
}

export async function listVoucherTypes(companyId: string) {
  return db
    .select()
    .from(voucherTypes)
    .where(eq(voucherTypes.companyId, companyId))
    .orderBy(asc(voucherTypes.name))
}

export async function listActiveVoucherTypesByClass(
  companyId: string,
  voucherClass: string
) {
  return db
    .select({
      id: voucherTypes.id,
      name: voucherTypes.name,
      prefix: voucherTypes.prefix,
      currentNumber: voucherTypes.currentNumber,
    })
    .from(voucherTypes)
    .where(
      and(
        eq(voucherTypes.companyId, companyId),
        eq(voucherTypes.voucherClass, voucherClass),
        eq(voucherTypes.isActive, true)
      )
    )
    .orderBy(asc(voucherTypes.name))
}

export async function createVoucherType(
  companyId: string,
  data: {
    name: string
    code: string
    voucherClass: string
    prefix?: string | null
    startingNumber?: number | null
  }
) {
  await db.insert(voucherTypes).values({
    companyId,
    name: data.name,
    code: data.code,
    voucherClass: data.voucherClass,
    prefix: data.prefix ?? null,
    startingNumber: data.startingNumber ?? 1,
    currentNumber: data.startingNumber ?? 1,
  })
}

export async function updateVoucherType(
  companyId: string,
  id: string,
  data: {
    name: string
    code: string
    voucherClass: string
    prefix?: string | null
    startingNumber?: number | null
  }
) {
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
}

export async function deleteVoucherType(companyId: string, id: string) {
  await db
    .delete(voucherTypes)
    .where(and(eq(voucherTypes.id, id), eq(voucherTypes.companyId, companyId)))
}

export async function seedCompanyMasters(
  companyId: string,
  input: {
    parties: Array<{
      name: string
      displayName?: string
      type?: string
      phone?: string
      email?: string
    }>
    items: Array<{
      name: string
      code?: string
      salesRate?: string
      purchaseRate?: string
    }>
    locations: Array<{
      name: string
      code?: string
      phone?: string
    }>
  }
) {
  const baseUnit = await getBaseUnit(companyId)

  const partyRows = input.parties
    .map((party) => ({
      companyId,
      name: party.name.trim(),
      displayName: party.displayName?.trim() || null,
      type: party.type?.trim() || "customer",
      phone: party.phone?.trim() || null,
      email: party.email?.trim() || null,
    }))
    .filter((party) => party.name)

  const itemRows = input.items
    .map((item) => ({
      companyId,
      name: item.name.trim(),
      code: item.code?.trim() || null,
      salesRate: item.salesRate?.trim() || null,
      purchaseRate: item.purchaseRate?.trim() || null,
      unitId: baseUnit?.id ?? null,
    }))
    .filter((item) => item.name)

  const locationRows = input.locations
    .map((location) => ({
      companyId,
      name: location.name.trim(),
      code: location.code?.trim() || null,
      phone: location.phone?.trim() || null,
    }))
    .filter((location) => location.name)

  if (partyRows.length > 0) {
    await db.insert(parties).values(partyRows)
  }

  if (itemRows.length > 0) {
    await db.insert(items).values(itemRows)
  }

  if (locationRows.length > 0) {
    await db.insert(locations).values(locationRows)
  }
}
