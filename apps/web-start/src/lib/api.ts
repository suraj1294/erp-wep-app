export interface Company {
  id: string;
  name: string;
  slug: string;
  displayName: string | null;
  isActive: boolean;
  role: string;
}

export interface AccountGroup {
  id: string;
  name: string;
  code: string | null;
  accountType: string;
  nature: string;
  level: number;
  parentId: string | null;
  isSystem: boolean;
  isActive: boolean;
}

export interface AccountGroupOption {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  groupId: string | null;
  openingBalance: string;
  isActive: boolean;
}

export interface VoucherType {
  id: string;
  name: string;
  code: string;
  voucherClass: string;
  prefix: string | null;
  startingNumber: number;
  currentNumber: number;
  isActive: boolean;
}

export interface Party {
  id: string;
  name: string;
  displayName: string | null;
  type: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  pan: string | null;
  creditLimit: string | null;
  creditDays: number | null;
  isActive: boolean;
}

export interface Item {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  category: string | null;
  unitId: string | null;
  itemType: string | null;
  hsnCode: string | null;
  taxRate: string | null;
  purchaseRate: string | null;
  salesRate: string | null;
  mrp: string | null;
  isActive: boolean;
}

export interface UnitOption {
  id: string;
  name: string;
  symbol: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBaseUnit: boolean;
  conversionFactor: string;
  isActive: boolean;
}

export interface DashboardData {
  summary: {
    accountsCount: number;
    partiesCount: number;
    itemsCount: number;
    vouchersCount: number;
  };
  recentTransactions: {
    id: string;
    voucherNumber: string;
    voucherDate: string;
    voucherTypeName: string | null;
    voucherClass: string;
    voucherClassLabel: string;
    partyName: string | null;
    totalAmount: string;
    status: string;
  }[];
  voucherMix: {
    voucherClass: string;
    label: string;
    count: number;
    totalAmount: string;
  }[];
}

const API_BASE = "/api/companies";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function getAccessibleCompanies() {
  return apiFetch<Company[]>(`${API_BASE}/accessible`);
}

export function getActiveCompany() {
  return apiFetch<{ companySlug: string } | null>(`${API_BASE}/active`);
}

export function createCompany(data: { name: string; displayName?: string; email?: string; phone?: string; gstin?: string; pan?: string }) {
  return apiFetch<Company>(`${API_BASE}`, {
    method: "POST",
    body: JSON.stringify({ ...data, seedDefaults: true }),
  });
}

export function getAccountGroups(companySlug: string) {
  return apiFetch<AccountGroup[]>(`${API_BASE}/${companySlug}/masters/account-groups`);
}

export function createAccountGroup(companySlug: string, data: { name: string; code?: string | null; accountType: string; nature: string; parentId?: string | null }) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/account-groups`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAccountGroup(companySlug: string, id: string, data: { name: string; code?: string | null; accountType: string; nature: string; parentId?: string | null }) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/account-groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAccountGroup(companySlug: string, id: string) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/account-groups/${id}`, {
    method: "DELETE",
  });
}

export function getAccounts(companySlug: string) {
  return apiFetch<{ accounts: Account[]; accountGroups: AccountGroupOption[] }>(`${API_BASE}/${companySlug}/masters/accounts`);
}

export function createAccount(companySlug: string, data: { name: string; code?: string | null; groupId?: string | null; openingBalance?: string | null }) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/accounts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAccount(companySlug: string, id: string, data: { name: string; code?: string | null; groupId?: string | null; openingBalance?: string | null }) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAccount(companySlug: string, id: string) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/accounts/${id}`, {
    method: "DELETE",
  });
}

export function getVoucherTypes(companySlug: string) {
  return apiFetch<VoucherType[]>(`${API_BASE}/${companySlug}/masters/voucher-types`);
}

export function createVoucherType(companySlug: string, data: { name: string; code: string; voucherClass: string; prefix?: string | null; startingNumber?: number | null }) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/voucher-types`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateVoucherType(companySlug: string, id: string, data: { name: string; code: string; voucherClass: string; prefix?: string | null; startingNumber?: number | null }) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/voucher-types/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteVoucherType(companySlug: string, id: string) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/voucher-types/${id}`, {
    method: "DELETE",
  });
}

export function getDashboard(companySlug: string) {
  return apiFetch<DashboardData>(`${API_BASE}/${companySlug}/dashboard`);
}

export function getParties(companySlug: string) {
  return apiFetch<Party[]>(`${API_BASE}/${companySlug}/masters/parties`);
}

export function createParty(companySlug: string, data: { name: string; type: string; phone?: string | null; email?: string | null; gstin?: string | null }) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/parties`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateParty(companySlug: string, id: string, data: { name: string; type: string; phone?: string | null; email?: string | null; gstin?: string | null }) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/parties/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteParty(companySlug: string, id: string) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/parties/${id}`, {
    method: "DELETE",
  });
}

export function getItems(companySlug: string) {
  return apiFetch<{ items: Item[]; units: UnitOption[] }>(`${API_BASE}/${companySlug}/masters/items`);
}

export function createItem(companySlug: string, data: { name: string; code?: string | null; hsnCode?: string | null; salesRate?: string | null; unitId?: string | null }) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/items`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateItem(companySlug: string, id: string, data: { name: string; code?: string | null; hsnCode?: string | null; salesRate?: string | null; unitId?: string | null }) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteItem(companySlug: string, id: string) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/items/${id}`, {
    method: "DELETE",
  });
}

export function getUnits(companySlug: string) {
  return apiFetch<Unit[]>(`${API_BASE}/${companySlug}/masters/units`);
}

export function createUnit(companySlug: string, data: { name: string; symbol: string; decimalPlaces: number; isBaseUnit: boolean; conversionFactor: string }) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/units`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUnit(companySlug: string, id: string, data: { name: string; symbol: string; decimalPlaces: number; isBaseUnit: boolean; conversionFactor: string }) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/units/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteUnit(companySlug: string, id: string) {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/${companySlug}/masters/units/${id}`, {
    method: "DELETE",
  });
}