import { and, eq, sql } from "drizzle-orm"
import { db } from "../client"
import {
  accountGroups,
  accounts,
  companies,
  items,
  locations,
  parties,
  stockMovements,
  taxRates,
  unitsOfMeasure,
  voucherItems,
  vouchers,
  voucherTypes,
} from "../schema"

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

type VoucherClass =
  | "sales"
  | "purchase"
  | "payment"
  | "receipt"
  | "contra"
  | "journal"
  | "credit_note"
  | "debit_note"

type SampleDataSeedStepKey =
  | "validate"
  | "reference-data"
  | "accounts"
  | "tax-rates"
  | "locations"
  | "parties"
  | "items"
  | "vouchers"
  | "finalize"

type SampleDataSeedStepStatus = "pending" | "running" | "done" | "error"

export interface SampleDataSeedStep {
  key: SampleDataSeedStepKey
  label: string
  status: SampleDataSeedStepStatus
  detail?: string
}

export interface SampleDataSeedProgress {
  status: "running" | "completed" | "error"
  message: string
  currentStepKey: SampleDataSeedStepKey | null
  steps: SampleDataSeedStep[]
  startedAt: string
  updatedAt: string
  completedAt?: string
  error?: string
}

interface ItemLineInput {
  itemId: string
  description: string
  quantity: number
  rate: number
  taxRate: number
}

interface AccountLineInput {
  accountId: string
  description: string
  debitAmount: number
  creditAmount: number
}

interface VoucherSeedInput {
  voucherClass: VoucherClass
  voucherDate: string
  referenceNumber?: string
  partyId?: string
  narration?: string
  dueDate?: string
  itemLines?: ItemLineInput[]
  accountLines?: AccountLineInput[]
  balancingAccountId?: string
}

interface PartySeed {
  name: string
  type: "customer" | "supplier"
  gstin: string
  pan: string
  city: string
  state: string
  pincode: string
  addressLine1: string
  creditDays: number
  creditLimit: string
  phone: string
  email: string
  contactPerson: string
}

interface ItemSeed {
  name: string
  code: string
  description: string
  category: string
  unitSymbol: string
  itemType: "goods" | "services"
  hsnCode: string
  taxRate: string
  purchaseRate: string
  salesRate: string
  mrp: string
  minimumStock: string
  reorderLevel: string
}

interface ExtraAccountSeed {
  name: string
  code: string
  groupName: string
  openingBalance?: string
  currentBalance?: string
}

const EXTRA_ACCOUNTS: ExtraAccountSeed[] = [
  {
    name: "HDFC Bank",
    code: "HDFC-BANK",
    groupName: "Bank Accounts",
    openingBalance: "250000.00",
    currentBalance: "250000.00",
  },
  {
    name: "SBI Bank",
    code: "SBI-BANK",
    groupName: "Bank Accounts",
    openingBalance: "125000.00",
    currentBalance: "125000.00",
  },
  {
    name: "Salary & Wages",
    code: "SALARY-WAGES",
    groupName: "Indirect Expenses",
  },
  {
    name: "Rent",
    code: "RENT-EXP",
    groupName: "Indirect Expenses",
  },
  {
    name: "Depreciation",
    code: "DEPR-EXP",
    groupName: "Indirect Expenses",
  },
  {
    name: "Salary Payable",
    code: "SALARY-PAY",
    groupName: "Provisions",
  },
  {
    name: "Office Equipment",
    code: "OFFICE-EQP",
    groupName: "Fixed Assets",
    openingBalance: "150000.00",
    currentBalance: "150000.00",
  },
]

const GST_RATES = [0, 5, 12, 18, 28] as const

const SAMPLE_DATA_STEP_LABELS: Record<SampleDataSeedStepKey, string> = {
  validate: "Validate company",
  "reference-data": "Load reference masters",
  accounts: "Create supporting ledgers",
  "tax-rates": "Create tax rates",
  locations: "Create extra locations",
  parties: "Create parties and ledgers",
  items: "Create items",
  vouchers: "Post sample vouchers",
  finalize: "Finalize seed",
}

const PARTY_SEEDS: PartySeed[] = [
  {
    name: "Arya Retail Private Limited",
    type: "customer",
    gstin: "27AABCA1001A1Z5",
    pan: "AABCA1001A",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    addressLine1: "12 Nariman Point",
    creditDays: 30,
    creditLimit: "500000.00",
    phone: "+91 98765 41001",
    email: "accounts@aryaretail.in",
    contactPerson: "Rohan Mehta",
  },
  {
    name: "Bluebird Infosystems LLP",
    type: "customer",
    gstin: "29AAMFB2202B1Z3",
    pan: "AAMFB2202B",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
    addressLine1: "44 Residency Road",
    creditDays: 21,
    creditLimit: "350000.00",
    phone: "+91 98765 42002",
    email: "finance@bluebirdinfo.in",
    contactPerson: "Sneha Rao",
  },
  {
    name: "Crescent Trading Co",
    type: "customer",
    gstin: "24AANFC3303C1Z1",
    pan: "AANFC3303C",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380009",
    addressLine1: "8 CG Road",
    creditDays: 45,
    creditLimit: "420000.00",
    phone: "+91 98765 43003",
    email: "ops@crescenttrading.in",
    contactPerson: "Imran Shaikh",
  },
  {
    name: "Delta Workspace Solutions",
    type: "customer",
    gstin: "07AALFD4404D1Z8",
    pan: "AALFD4404D",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110001",
    addressLine1: "21 Barakhamba Road",
    creditDays: 30,
    creditLimit: "300000.00",
    phone: "+91 98765 44004",
    email: "payables@deltaworkspace.in",
    contactPerson: "Kritika Sethi",
  },
  {
    name: "Everest Healthcare Services",
    type: "customer",
    gstin: "19AAAFE5505E1Z5",
    pan: "AAAFE5505E",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700001",
    addressLine1: "3 Camac Street",
    creditDays: 15,
    creditLimit: "250000.00",
    phone: "+91 98765 45005",
    email: "billing@everesthealth.in",
    contactPerson: "Ananya Ghosh",
  },
  {
    name: "Fusion Fabricators",
    type: "customer",
    gstin: "27AAEFF6606F1Z2",
    pan: "AAEFF6606F",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    addressLine1: "78 FC Road",
    creditDays: 30,
    creditLimit: "275000.00",
    phone: "+91 98765 46006",
    email: "finance@fusionfab.in",
    contactPerson: "Vikas Jadhav",
  },
  {
    name: "Greenfield Packaging Industries",
    type: "customer",
    gstin: "33AAAFG7707G1Z9",
    pan: "AAAFG7707G",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600002",
    addressLine1: "105 Mount Road",
    creditDays: 25,
    creditLimit: "320000.00",
    phone: "+91 98765 47007",
    email: "accounts@greenfieldpack.in",
    contactPerson: "Madhan Kumar",
  },
  {
    name: "Horizon Learning Hub",
    type: "customer",
    gstin: "09AAFCH8808H1Z4",
    pan: "AAFCH8808H",
    city: "Lucknow",
    state: "Uttar Pradesh",
    pincode: "226001",
    addressLine1: "17 Hazratganj",
    creditDays: 14,
    creditLimit: "180000.00",
    phone: "+91 98765 48008",
    email: "admin@horizonlearning.in",
    contactPerson: "Priya Srivastava",
  },
  {
    name: "Indus Office Mart",
    type: "customer",
    gstin: "08AAAFI9909I1Z0",
    pan: "AAAFI9909I",
    city: "Jaipur",
    state: "Rajasthan",
    pincode: "302001",
    addressLine1: "5 MI Road",
    creditDays: 35,
    creditLimit: "230000.00",
    phone: "+91 98765 49009",
    email: "books@indusoffice.in",
    contactPerson: "Gautam Sharma",
  },
  {
    name: "Jupiter Industrial Works",
    type: "customer",
    gstin: "06AAFJJ1010J1Z7",
    pan: "AAFJJ1010J",
    city: "Gurugram",
    state: "Haryana",
    pincode: "122001",
    addressLine1: "90 Udyog Vihar Phase 2",
    creditDays: 40,
    creditLimit: "450000.00",
    phone: "+91 98765 50010",
    email: "ap@jupiterworks.in",
    contactPerson: "Neeraj Malik",
  },
  {
    name: "Kaveri Tech Supplies",
    type: "supplier",
    gstin: "29AABCK1111K1Z4",
    pan: "AABCK1111K",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560020",
    addressLine1: "11 Peenya Industrial Area",
    creditDays: 30,
    creditLimit: "600000.00",
    phone: "+91 98765 51011",
    email: "sales@kaveritech.in",
    contactPerson: "Shashank Pai",
  },
  {
    name: "Lotus Office Essentials",
    type: "supplier",
    gstin: "27AABCL2222L1Z2",
    pan: "AABCL2222L",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400703",
    addressLine1: "201 TTC Industrial Area",
    creditDays: 21,
    creditLimit: "300000.00",
    phone: "+91 98765 52012",
    email: "orders@lotusoffice.in",
    contactPerson: "Nikita Desai",
  },
  {
    name: "Metro Metals and Wires",
    type: "supplier",
    gstin: "24AABCM3333M1Z9",
    pan: "AABCM3333M",
    city: "Vadodara",
    state: "Gujarat",
    pincode: "390010",
    addressLine1: "Plot 6 Makarpura GIDC",
    creditDays: 45,
    creditLimit: "800000.00",
    phone: "+91 98765 53013",
    email: "dispatch@metrometals.in",
    contactPerson: "Harsh Patel",
  },
  {
    name: "Nexa Furniture House",
    type: "supplier",
    gstin: "07AABCN4444N1Z7",
    pan: "AABCN4444N",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110020",
    addressLine1: "18 Okhla Industrial Estate",
    creditDays: 30,
    creditLimit: "350000.00",
    phone: "+91 98765 54014",
    email: "accounts@nexafurniture.in",
    contactPerson: "Pooja Khanna",
  },
  {
    name: "Orbit Business Services",
    type: "supplier",
    gstin: "19AABCO5555O1Z5",
    pan: "AABCO5555O",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700017",
    addressLine1: "42 Park Street",
    creditDays: 15,
    creditLimit: "200000.00",
    phone: "+91 98765 55015",
    email: "service@orbitbiz.in",
    contactPerson: "Sourav Dutta",
  },
]

const ITEM_SEEDS: ItemSeed[] = [
  {
    name: "Laptop Pro 14",
    code: "ITM-LAP-14",
    description: "14-inch business laptop",
    category: "Electronics",
    unitSymbol: "Nos",
    itemType: "goods",
    hsnCode: "84713010",
    taxRate: "18.00",
    purchaseRate: "42000.00",
    salesRate: "52000.00",
    mrp: "56000.00",
    minimumStock: "2.00",
    reorderLevel: "3.00",
  },
  {
    name: "Wireless Mouse",
    code: "ITM-MOU-WL",
    description: "2.4G wireless optical mouse",
    category: "Electronics",
    unitSymbol: "Nos",
    itemType: "goods",
    hsnCode: "84716070",
    taxRate: "18.00",
    purchaseRate: "450.00",
    salesRate: "650.00",
    mrp: "799.00",
    minimumStock: "20.00",
    reorderLevel: "25.00",
  },
  {
    name: "USB-C Cable 1m",
    code: "ITM-USBC-1M",
    description: "Fast charging braided USB-C cable",
    category: "Electronics",
    unitSymbol: "Nos",
    itemType: "goods",
    hsnCode: "85444299",
    taxRate: "18.00",
    purchaseRate: "120.00",
    salesRate: "220.00",
    mrp: "299.00",
    minimumStock: "30.00",
    reorderLevel: "40.00",
  },
  {
    name: "Mechanical Keyboard",
    code: "ITM-KEY-MEC",
    description: "Backlit office mechanical keyboard",
    category: "Electronics",
    unitSymbol: "Nos",
    itemType: "goods",
    hsnCode: "84716040",
    taxRate: "18.00",
    purchaseRate: "1400.00",
    salesRate: "2100.00",
    mrp: "2499.00",
    minimumStock: "8.00",
    reorderLevel: "10.00",
  },
  {
    name: "HDMI Cable 2m",
    code: "ITM-HDMI-2M",
    description: "High-speed HDMI cable",
    category: "Electronics",
    unitSymbol: "Nos",
    itemType: "goods",
    hsnCode: "85444290",
    taxRate: "18.00",
    purchaseRate: "210.00",
    salesRate: "350.00",
    mrp: "449.00",
    minimumStock: "15.00",
    reorderLevel: "20.00",
  },
  {
    name: "A4 Copier Paper",
    code: "ITM-A4-PAPER",
    description: "500-sheet copier paper ream",
    category: "Stationery",
    unitSymbol: "Nos",
    itemType: "goods",
    hsnCode: "48025690",
    taxRate: "12.00",
    purchaseRate: "180.00",
    salesRate: "235.00",
    mrp: "250.00",
    minimumStock: "80.00",
    reorderLevel: "100.00",
  },
  {
    name: "Printer Cartridge 88A",
    code: "ITM-CART-88A",
    description: "Laser printer toner cartridge",
    category: "Stationery",
    unitSymbol: "Nos",
    itemType: "goods",
    hsnCode: "84439959",
    taxRate: "18.00",
    purchaseRate: "1400.00",
    salesRate: "1850.00",
    mrp: "2100.00",
    minimumStock: "5.00",
    reorderLevel: "8.00",
  },
  {
    name: "Heavy Duty Stapler",
    code: "ITM-STAPLER-HD",
    description: "Heavy duty metal stapler",
    category: "Stationery",
    unitSymbol: "Nos",
    itemType: "goods",
    hsnCode: "84729099",
    taxRate: "12.00",
    purchaseRate: "160.00",
    salesRate: "240.00",
    mrp: "299.00",
    minimumStock: "10.00",
    reorderLevel: "12.00",
  },
  {
    name: "Spiral Notebook",
    code: "ITM-NOTE-SP",
    description: "A5 spiral bound notebook",
    category: "Stationery",
    unitSymbol: "Nos",
    itemType: "goods",
    hsnCode: "48201010",
    taxRate: "12.00",
    purchaseRate: "30.00",
    salesRate: "55.00",
    mrp: "65.00",
    minimumStock: "40.00",
    reorderLevel: "50.00",
  },
  {
    name: "Steel Rod 12mm",
    code: "ITM-STEEL-12",
    description: "12mm mild steel rod",
    category: "Raw Materials",
    unitSymbol: "Kg",
    itemType: "goods",
    hsnCode: "72142090",
    taxRate: "18.00",
    purchaseRate: "58.00",
    salesRate: "74.00",
    mrp: "82.00",
    minimumStock: "250.00",
    reorderLevel: "300.00",
  },
  {
    name: "Copper Wire Coil",
    code: "ITM-COPPER-WIRE",
    description: "Insulated copper wire coil",
    category: "Raw Materials",
    unitSymbol: "Mtr",
    itemType: "goods",
    hsnCode: "85444999",
    taxRate: "18.00",
    purchaseRate: "42.00",
    salesRate: "58.00",
    mrp: "65.00",
    minimumStock: "500.00",
    reorderLevel: "650.00",
  },
  {
    name: "Plastic Granules PP",
    code: "ITM-PLASTIC-PP",
    description: "Polypropylene plastic granules",
    category: "Raw Materials",
    unitSymbol: "Kg",
    itemType: "goods",
    hsnCode: "39021000",
    taxRate: "18.00",
    purchaseRate: "92.00",
    salesRate: "118.00",
    mrp: "130.00",
    minimumStock: "150.00",
    reorderLevel: "200.00",
  },
  {
    name: "Office Chair",
    code: "ITM-CHAIR-OFF",
    description: "Ergonomic office chair",
    category: "General",
    unitSymbol: "Nos",
    itemType: "goods",
    hsnCode: "94013000",
    taxRate: "18.00",
    purchaseRate: "2800.00",
    salesRate: "3900.00",
    mrp: "4500.00",
    minimumStock: "5.00",
    reorderLevel: "7.00",
  },
  {
    name: "Desk Lamp LED",
    code: "ITM-LAMP-LED",
    description: "LED desk lamp",
    category: "General",
    unitSymbol: "Nos",
    itemType: "goods",
    hsnCode: "94052090",
    taxRate: "12.00",
    purchaseRate: "650.00",
    salesRate: "980.00",
    mrp: "1150.00",
    minimumStock: "10.00",
    reorderLevel: "12.00",
  },
  {
    name: "Whiteboard 4x3",
    code: "ITM-WB-43",
    description: "Magnetic whiteboard 4x3 feet",
    category: "General",
    unitSymbol: "Nos",
    itemType: "goods",
    hsnCode: "96100000",
    taxRate: "18.00",
    purchaseRate: "2200.00",
    salesRate: "3200.00",
    mrp: "3600.00",
    minimumStock: "3.00",
    reorderLevel: "4.00",
  },
  {
    name: "AMC Support Plan",
    code: "SRV-AMC",
    description: "Annual maintenance contract",
    category: "Services",
    unitSymbol: "Nos",
    itemType: "services",
    hsnCode: "998719",
    taxRate: "18.00",
    purchaseRate: "8000.00",
    salesRate: "12000.00",
    mrp: "12000.00",
    minimumStock: "0.00",
    reorderLevel: "0.00",
  },
  {
    name: "Software License Annual",
    code: "SRV-SW-LIC",
    description: "Annual business software license",
    category: "Services",
    unitSymbol: "Nos",
    itemType: "services",
    hsnCode: "997331",
    taxRate: "18.00",
    purchaseRate: "12000.00",
    salesRate: "18000.00",
    mrp: "18000.00",
    minimumStock: "0.00",
    reorderLevel: "0.00",
  },
  {
    name: "Consulting Fee",
    code: "SRV-CONSULT",
    description: "Professional consulting service",
    category: "Services",
    unitSymbol: "Nos",
    itemType: "services",
    hsnCode: "998312",
    taxRate: "18.00",
    purchaseRate: "15000.00",
    salesRate: "25000.00",
    mrp: "25000.00",
    minimumStock: "0.00",
    reorderLevel: "0.00",
  },
]

function parseDateOnly(value: string | Date | null | undefined) {
  if (!value) {
    return new Date(Date.UTC(new Date().getUTCFullYear(), 3, 1))
  }
  if (value instanceof Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
    )
  }
  const parts = value.split("-").map(Number)
  const year = parts[0] ?? new Date().getUTCFullYear()
  const month = parts[1] ?? 1
  const day = parts[2] ?? 1
  return new Date(Date.UTC(year, month - 1, day))
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function fiscalDate(start: Date, monthOffset: number, dayOfMonth: number) {
  return formatDate(
    new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth() + monthOffset,
        dayOfMonth
      )
    )
  )
}

function getIsoTimestamp() {
  return new Date().toISOString()
}

async function pauseForSeedProgressVisibility() {
  const delayMs = Number(process.env.E2E_SAMPLE_DATA_SEED_DELAY_MS ?? "0")
  if (!Number.isFinite(delayMs) || delayMs <= 0) {
    return
  }

  await new Promise((resolve) => setTimeout(resolve, delayMs))
}

function createInitialSampleDataSeedProgress(
  status: SampleDataSeedProgress["status"] = "running"
): SampleDataSeedProgress {
  const timestamp = getIsoTimestamp()
  return {
    status,
    message: "Preparing sample data seed.",
    currentStepKey: status === "completed" ? "finalize" : "validate",
    steps: Object.entries(SAMPLE_DATA_STEP_LABELS).map(([key, label]) => ({
      key: key as SampleDataSeedStepKey,
      label,
      status: status === "completed" && key === "finalize" ? "done" : "pending",
    })),
    startedAt: timestamp,
    updatedAt: timestamp,
    completedAt: status === "completed" ? timestamp : undefined,
  }
}

export function getSampleDataSeedProgress(
  settings: unknown
): SampleDataSeedProgress | null {
  if (!settings || typeof settings !== "object") {
    return null
  }

  const raw = (settings as Record<string, unknown>).sampleDataSeedProgress
  if (!raw || typeof raw !== "object") {
    return null
  }

  const progress = raw as Partial<SampleDataSeedProgress>
  if (
    progress.status !== "running" &&
    progress.status !== "completed" &&
    progress.status !== "error"
  ) {
    return null
  }

  if (!Array.isArray(progress.steps)) {
    return null
  }

  return progress as SampleDataSeedProgress
}

async function updateCompanySettings(
  companyId: string,
  updater: (settings: Record<string, unknown>) => Record<string, unknown>
) {
  const [company] = await db
    .select({ settings: companies.settings })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1)

  const settings =
    company?.settings && typeof company.settings === "object"
      ? (company.settings as Record<string, unknown>)
      : {}
  const nextSettings = updater(settings)

  await db
    .update(companies)
    .set({
      settings: nextSettings,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId))

  return nextSettings
}

async function updateSampleDataSeedProgress(
  companyId: string,
  updater: (
    progress: SampleDataSeedProgress | null
  ) => SampleDataSeedProgress | null
) {
  let nextProgress: SampleDataSeedProgress | null = null

  await updateCompanySettings(companyId, (settings) => {
    const currentProgress = getSampleDataSeedProgress(settings)
    nextProgress = updater(currentProgress)

    if (!nextProgress) {
      const { sampleDataSeedProgress: _ignored, ...rest } = settings
      return rest
    }

    return {
      ...settings,
      sampleDataSeedProgress: nextProgress,
    }
  })

  return nextProgress
}

function updateStepState(
  progress: SampleDataSeedProgress | null,
  stepKey: SampleDataSeedStepKey,
  stepStatus: SampleDataSeedStepStatus,
  message: string,
  detail?: string
): SampleDataSeedProgress {
  const current = progress ?? createInitialSampleDataSeedProgress()
  const timestamp = getIsoTimestamp()

  return {
    ...current,
    status: stepStatus === "error" ? "error" : current.status,
    message,
    currentStepKey: stepStatus === "done" ? current.currentStepKey : stepKey,
    updatedAt: timestamp,
    error: stepStatus === "error" ? (detail ?? message) : undefined,
    steps: current.steps.map((step) =>
      step.key === stepKey ? { ...step, status: stepStatus, detail } : step
    ),
  }
}

async function startSeedStep(
  companyId: string,
  stepKey: SampleDataSeedStepKey,
  message: string,
  detail?: string
) {
  const nextProgress = await updateSampleDataSeedProgress(
    companyId,
    (progress) => {
      const current = progress ?? createInitialSampleDataSeedProgress()
      const timestamp = getIsoTimestamp()
      return {
        ...updateStepState(current, stepKey, "running", message, detail),
        status: "running",
        currentStepKey: stepKey,
        startedAt: current.startedAt ?? timestamp,
      }
    }
  )

  await pauseForSeedProgressVisibility()
  return nextProgress
}

async function completeSeedStep(
  companyId: string,
  stepKey: SampleDataSeedStepKey,
  message: string,
  detail?: string
) {
  return updateSampleDataSeedProgress(companyId, (progress) =>
    updateStepState(progress, stepKey, "done", message, detail)
  )
}

async function failSeedProgress(companyId: string, message: string) {
  return updateSampleDataSeedProgress(companyId, (progress) => {
    const current = progress ?? createInitialSampleDataSeedProgress()
    const timestamp = getIsoTimestamp()
    return {
      ...current,
      status: "error",
      message,
      updatedAt: timestamp,
      error: message,
      steps: current.steps.map((step) =>
        step.key === current.currentStepKey && step.status === "running"
          ? { ...step, status: "error", detail: message }
          : step
      ),
    }
  })
}

function buildItemBasedEntries(
  input: VoucherSeedInput,
  partyAccountId: string | null,
  salesAccountId: string | null,
  purchaseAccountId: string | null,
  gstOutputAccountId: string | null,
  gstInputAccountId: string | null
) {
  const lines = input.itemLines ?? []
  const isSalesType =
    input.voucherClass === "sales" || input.voucherClass === "credit_note"

  let subtotal = 0
  const taxMap: Record<number, number> = {}

  for (const line of lines) {
    const lineSubtotal = line.quantity * line.rate
    subtotal += lineSubtotal
    const taxAmount = (lineSubtotal * line.taxRate) / 100
    taxMap[line.taxRate] = (taxMap[line.taxRate] ?? 0) + taxAmount
  }

  const totalTax = Object.values(taxMap).reduce(
    (sum, amount) => sum + amount,
    0
  )
  const grandTotal = subtotal + totalTax

  const entries: Array<{
    accountId: string | null
    itemId: string | null
    description: string
    quantity: number | null
    rate: number | null
    debitAmount: number
    creditAmount: number
    lineNumber: number
  }> = []

  let lineNumber = 1

  for (const line of lines) {
    entries.push({
      accountId: isSalesType ? salesAccountId : purchaseAccountId,
      itemId: line.itemId,
      description: line.description,
      quantity: line.quantity,
      rate: line.rate,
      debitAmount: isSalesType ? 0 : line.quantity * line.rate,
      creditAmount: isSalesType ? line.quantity * line.rate : 0,
      lineNumber: lineNumber++,
    })
  }

  for (const [rate, taxAmount] of Object.entries(taxMap)) {
    if (taxAmount === 0) {
      continue
    }
    entries.push({
      accountId: isSalesType ? gstOutputAccountId : gstInputAccountId,
      itemId: null,
      description: `GST @ ${rate}%`,
      quantity: null,
      rate: null,
      debitAmount: isSalesType ? 0 : taxAmount,
      creditAmount: isSalesType ? taxAmount : 0,
      lineNumber: lineNumber++,
    })
  }

  if (partyAccountId) {
    entries.push({
      accountId: partyAccountId,
      itemId: null,
      description: "",
      quantity: null,
      rate: null,
      debitAmount: isSalesType ? grandTotal : 0,
      creditAmount: isSalesType ? 0 : grandTotal,
      lineNumber: lineNumber++,
    })
  }

  return { entries, grandTotal }
}

async function insertVoucher(
  tx: Transaction,
  companyId: string,
  userId: string,
  accountByCode: Map<string, { id: string }>,
  voucherTypeByClass: Map<VoucherClass, { id: string }>,
  partyAccountByPartyId: Map<string, string>,
  itemById: Map<string, { itemType: string }>,
  input: VoucherSeedInput
) {
  const voucherTypeRef = voucherTypeByClass.get(input.voucherClass)
  if (!voucherTypeRef) {
    throw new Error(`Voucher type not found for ${input.voucherClass}`)
  }

  const [voucherType] = await tx
    .select()
    .from(voucherTypes)
    .where(
      and(
        eq(voucherTypes.id, voucherTypeRef.id),
        eq(voucherTypes.companyId, companyId)
      )
    )
    .for("update")

  if (!voucherType) {
    throw new Error(`Voucher type not found for ${input.voucherClass}`)
  }

  const currentNumber = voucherType.currentNumber ?? 1
  const voucherNumber = `${voucherType.prefix ?? voucherType.code}-${String(currentNumber).padStart(4, "0")}`

  await tx
    .update(voucherTypes)
    .set({ currentNumber: currentNumber + 1 })
    .where(eq(voucherTypes.id, voucherType.id))

  const partyAccountId = input.partyId
    ? (partyAccountByPartyId.get(input.partyId) ?? null)
    : null

  let entries: Array<{
    accountId: string | null
    itemId: string | null
    description: string
    quantity: number | null
    rate: number | null
    debitAmount: number
    creditAmount: number
    lineNumber: number
  }> = []

  let totalAmount = 0
  const isItemBased = [
    "sales",
    "purchase",
    "credit_note",
    "debit_note",
  ].includes(input.voucherClass)

  if (isItemBased) {
    const { entries: builtEntries, grandTotal } = buildItemBasedEntries(
      input,
      partyAccountId,
      accountByCode.get("SALES")?.id ?? null,
      accountByCode.get("PURCHASE")?.id ?? null,
      accountByCode.get("GST-OUTPUT")?.id ?? null,
      accountByCode.get("GST-INPUT")?.id ?? null
    )
    entries = builtEntries
    totalAmount = grandTotal
  } else {
    let lineNumber = 1
    for (const line of input.accountLines ?? []) {
      entries.push({
        accountId: line.accountId,
        itemId: null,
        description: line.description,
        quantity: null,
        rate: null,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        lineNumber: lineNumber++,
      })
      totalAmount += line.debitAmount
    }

    if (
      input.balancingAccountId &&
      (input.voucherClass === "payment" || input.voucherClass === "receipt")
    ) {
      const isPayment = input.voucherClass === "payment"
      entries.push({
        accountId: input.balancingAccountId,
        itemId: null,
        description: "",
        quantity: null,
        rate: null,
        debitAmount: isPayment ? 0 : totalAmount,
        creditAmount: isPayment ? totalAmount : 0,
        lineNumber: lineNumber++,
      })
    }
  }

  const [voucher] = await tx
    .insert(vouchers)
    .values({
      companyId,
      voucherTypeId: voucherType.id,
      voucherNumber,
      referenceNumber: input.referenceNumber ?? null,
      voucherDate: input.voucherDate,
      partyId: input.partyId ?? null,
      narration: input.narration ?? null,
      totalAmount: totalAmount.toFixed(2),
      dueDate: input.dueDate ?? null,
      createdBy: userId,
      status: "active",
    })
    .returning({ id: vouchers.id })

  if (!voucher) {
    throw new Error("Failed to create voucher")
  }

  if (entries.length > 0) {
    await tx.insert(voucherItems).values(
      entries.map((entry) => ({
        voucherId: voucher.id,
        accountId: entry.accountId,
        itemId: entry.itemId,
        description: entry.description,
        quantity: entry.quantity !== null ? String(entry.quantity) : null,
        rate: entry.rate !== null ? String(entry.rate) : null,
        debitAmount: entry.debitAmount.toFixed(2),
        creditAmount: entry.creditAmount.toFixed(2),
        lineNumber: entry.lineNumber,
      }))
    )
  }

  if (isItemBased) {
    const isSalesType =
      input.voucherClass === "sales" || input.voucherClass === "credit_note"

    for (const line of input.itemLines ?? []) {
      const itemRef = itemById.get(line.itemId)
      if (!itemRef || itemRef.itemType === "services") {
        continue
      }

      const movementType =
        input.voucherClass === "sales"
          ? "sale_out"
          : input.voucherClass === "purchase"
            ? "purchase_in"
            : input.voucherClass === "credit_note"
              ? "credit_note_in"
              : "debit_note_out"

      const quantityDelta = isSalesType ? -line.quantity : line.quantity
      const lineValue = line.quantity * line.rate

      await tx.insert(stockMovements).values({
        companyId,
        itemId: line.itemId,
        voucherId: voucher.id,
        movementType,
        quantity: String(Math.abs(line.quantity)),
        rate: String(line.rate),
        value: lineValue.toFixed(2),
      })

      await tx
        .update(items)
        .set({
          currentStock: sql`${items.currentStock} + ${quantityDelta}`,
        })
        .where(and(eq(items.id, line.itemId), eq(items.companyId, companyId)))
    }
  }

  for (const entry of entries) {
    if (!entry.accountId) {
      continue
    }
    const netChange = entry.debitAmount - entry.creditAmount
    if (netChange === 0) {
      continue
    }
    await tx
      .update(accounts)
      .set({
        currentBalance: sql`${accounts.currentBalance} + ${netChange}`,
      })
      .where(
        and(eq(accounts.id, entry.accountId), eq(accounts.companyId, companyId))
      )
  }
}

export async function seedSampleData(companyId: string, userId: string) {
  const [companyRecord] = await db
    .select({
      financialYearStart: companies.financialYearStart,
      settings: companies.settings,
    })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1)

  if (!companyRecord) {
    return {
      ok: false,
      message: "Company not found.",
    }
  }

  const currentSettings =
    companyRecord.settings && typeof companyRecord.settings === "object"
      ? (companyRecord.settings as Record<string, unknown>)
      : {}
  const currentProgress = getSampleDataSeedProgress(currentSettings)

  if (currentProgress?.status === "running") {
    return {
      ok: true,
      message: "Sample data seeding is already in progress.",
    }
  }

  const [existingParty] = await db
    .select({ id: parties.id })
    .from(parties)
    .where(eq(parties.companyId, companyId))
    .limit(1)

  if (existingParty) {
    await updateCompanySettings(companyId, (settings) => ({
      ...settings,
      sampleDataSeeded: true,
      sampleDataSeedProgress: {
        ...createInitialSampleDataSeedProgress("completed"),
        message: "Sample data has already been seeded for this company.",
      },
    }))

    return {
      ok: true,
      message: "Sample data has already been seeded for this company.",
    }
  }

  await startSeedStep(
    companyId,
    "validate",
    "Validating company for sample data."
  )

  try {
    return await db.transaction(async (tx) => {
      const company = companyRecord

      await completeSeedStep(
        companyId,
        "validate",
        "Company is ready for sample data."
      )

      await startSeedStep(
        companyId,
        "reference-data",
        "Loading default masters and references."
      )

      const [companyFromTx] = await tx
        .select({
          financialYearStart: companies.financialYearStart,
          settings: companies.settings,
        })
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1)

      if (!companyFromTx) {
        throw new Error("Company not found")
      }

      const [groupRows, accountRows, voucherTypeRows, unitRows, locationRows] =
        await Promise.all([
          tx
            .select({ id: accountGroups.id, name: accountGroups.name })
            .from(accountGroups)
            .where(eq(accountGroups.companyId, companyId)),
          tx
            .select({
              id: accounts.id,
              name: accounts.name,
              code: accounts.code,
            })
            .from(accounts)
            .where(eq(accounts.companyId, companyId)),
          tx
            .select({
              id: voucherTypes.id,
              voucherClass: voucherTypes.voucherClass,
            })
            .from(voucherTypes)
            .where(eq(voucherTypes.companyId, companyId)),
          tx
            .select({ id: unitsOfMeasure.id, symbol: unitsOfMeasure.symbol })
            .from(unitsOfMeasure)
            .where(eq(unitsOfMeasure.companyId, companyId)),
          tx
            .select({ id: locations.id, name: locations.name })
            .from(locations)
            .where(eq(locations.companyId, companyId)),
        ])

      const groupByName = new Map(groupRows.map((row) => [row.name, row.id]))
      const accountByCode = new Map(
        accountRows
          .filter((row): row is { id: string; name: string; code: string } =>
            Boolean(row.code)
          )
          .map((row) => [row.code, { id: row.id, name: row.name }])
      )
      const voucherTypeByClass = new Map(
        voucherTypeRows.map((row) => [
          row.voucherClass as VoucherClass,
          { id: row.id },
        ])
      )
      const unitBySymbol = new Map(
        unitRows
          .filter((row): row is { id: string; symbol: string } =>
            Boolean(row.symbol)
          )
          .map((row) => [row.symbol, row.id])
      )
      const locationByName = new Map(
        locationRows.map((row) => [row.name, row.id])
      )

      for (const requiredGroup of [
        "Sundry Debtors",
        "Sundry Creditors",
        "Bank Accounts",
        "Indirect Expenses",
        "Provisions",
        "Fixed Assets",
      ]) {
        if (!groupByName.has(requiredGroup)) {
          throw new Error(`Missing account group: ${requiredGroup}`)
        }
      }

      for (const requiredAccountCode of [
        "CASH",
        "SALES",
        "PURCHASE",
        "GST-INPUT",
        "GST-OUTPUT",
      ]) {
        if (!accountByCode.has(requiredAccountCode)) {
          throw new Error(`Missing account: ${requiredAccountCode}`)
        }
      }

      await completeSeedStep(
        companyId,
        "reference-data",
        "Loaded base masters for sample data."
      )

      await startSeedStep(companyId, "accounts", "Creating supporting ledgers.")

      const insertedAccounts = await tx
        .insert(accounts)
        .values(
          EXTRA_ACCOUNTS.map((account) => ({
            companyId,
            groupId: groupByName.get(account.groupName) ?? null,
            name: account.name,
            code: account.code,
            openingBalance: account.openingBalance ?? "0.00",
            currentBalance:
              account.currentBalance ?? account.openingBalance ?? "0.00",
          }))
        )
        .returning({
          id: accounts.id,
          code: accounts.code,
          name: accounts.name,
        })

      for (const account of insertedAccounts) {
        if (account.code) {
          accountByCode.set(account.code, {
            id: account.id,
            name: account.name,
          })
        }
      }

      await completeSeedStep(
        companyId,
        "accounts",
        "Created additional ledgers for banking and journals."
      )

      await startSeedStep(companyId, "tax-rates", "Creating GST rate masters.")

      await tx.insert(taxRates).values(
        GST_RATES.map((rate) => ({
          companyId,
          name: `GST ${rate}%`,
          rate: rate.toFixed(2),
          taxType: "gst",
          components:
            rate === 0
              ? []
              : [
                  { name: "CGST", rate: rate / 2 },
                  { name: "SGST", rate: rate / 2 },
                ],
          applicableFrom: formatDate(parseDateOnly(company.financialYearStart)),
        }))
      )

      await completeSeedStep(
        companyId,
        "tax-rates",
        "Created GST rates from 0% to 28%."
      )

      await startSeedStep(
        companyId,
        "locations",
        "Creating additional warehouse location."
      )

      if (!locationByName.has("Warehouse B")) {
        await tx.insert(locations).values({
          companyId,
          name: "Warehouse B",
          code: "WH-B",
          address: "Plot 18, Bhiwandi Storage Park, Thane",
          contactPerson: "Warehouse Supervisor",
          phone: "+91 98765 60001",
          isDefault: false,
        })
      }

      await completeSeedStep(companyId, "locations", "Warehouse B is ready.")

      await startSeedStep(
        companyId,
        "parties",
        "Creating customers, suppliers, and linked ledgers."
      )

      const partyAccountRows = await tx
        .insert(accounts)
        .values(
          PARTY_SEEDS.map((party, index) => ({
            companyId,
            groupId:
              party.type === "customer"
                ? (groupByName.get("Sundry Debtors") ?? null)
                : (groupByName.get("Sundry Creditors") ?? null),
            name: party.name,
            code: `${party.type === "customer" ? "CUS" : "SUP"}-${String(index + 1).padStart(3, "0")}`,
          }))
        )
        .returning({ id: accounts.id })

      const partyRows = await tx
        .insert(parties)
        .values(
          PARTY_SEEDS.map((party, index) => ({
            companyId,
            accountId: partyAccountRows[index]?.id ?? null,
            type: party.type,
            name: party.name,
            displayName: party.name,
            contactPerson: party.contactPerson,
            phone: party.phone,
            email: party.email,
            gstin: party.gstin,
            pan: party.pan,
            address: {
              line1: party.addressLine1,
              city: party.city,
              state: party.state,
              postalCode: party.pincode,
              country: "India",
            },
            creditLimit: party.creditLimit,
            creditDays: party.creditDays,
            taxRegistration: {
              type: "regular",
              gstin: party.gstin,
            },
          }))
        )
        .returning({
          id: parties.id,
          name: parties.name,
          accountId: parties.accountId,
        })

      const partyByName = new Map(partyRows.map((row) => [row.name, row.id]))
      const partyAccountByPartyId = new Map(
        partyRows
          .filter(
            (row): row is { id: string; name: string; accountId: string } =>
              Boolean(row.accountId)
          )
          .map((row) => [row.id, row.accountId])
      )

      await completeSeedStep(
        companyId,
        "parties",
        `Created ${partyRows.length} parties with ledger accounts.`
      )

      await startSeedStep(
        companyId,
        "items",
        "Creating sample inventory and services."
      )

      const itemRows = await tx
        .insert(items)
        .values(
          ITEM_SEEDS.map((item) => ({
            companyId,
            name: item.name,
            code: item.code,
            description: item.description,
            category: item.category,
            unitId: unitBySymbol.get(item.unitSymbol) ?? null,
            itemType: item.itemType,
            hsnCode: item.hsnCode,
            taxRate: item.taxRate,
            purchaseRate: item.purchaseRate,
            salesRate: item.salesRate,
            mrp: item.mrp,
            minimumStock: item.minimumStock,
            reorderLevel: item.reorderLevel,
          }))
        )
        .returning({
          id: items.id,
          name: items.name,
          code: items.code,
          itemType: items.itemType,
        })

      const itemByName = new Map(
        itemRows.map((row) => [
          row.name,
          {
            id: row.id,
            code: row.code,
            itemType: row.itemType ?? "goods",
          },
        ])
      )
      const itemById = new Map(
        itemRows.map((row) => [row.id, { itemType: row.itemType ?? "goods" }])
      )

      await completeSeedStep(
        companyId,
        "items",
        `Created ${itemRows.length} sample items.`
      )

      const fyStart = parseDateOnly(company.financialYearStart)
      const voucherDates = {
        april: fiscalDate(fyStart, 0, 12),
        may: fiscalDate(fyStart, 1, 9),
        june: fiscalDate(fyStart, 2, 18),
        july: fiscalDate(fyStart, 3, 7),
        august: fiscalDate(fyStart, 4, 22),
        september: fiscalDate(fyStart, 5, 11),
        october: fiscalDate(fyStart, 6, 19),
        november: fiscalDate(fyStart, 7, 6),
        december: fiscalDate(fyStart, 8, 14),
        january: fiscalDate(fyStart, 9, 10),
        february: fiscalDate(fyStart, 10, 21),
        march: fiscalDate(fyStart, 11, 26),
      }

      const vouchersToInsert: VoucherSeedInput[] = [
        {
          voucherClass: "purchase",
          voucherDate: voucherDates.april,
          referenceNumber: "KV/24-25/0412",
          partyId: partyByName.get("Kaveri Tech Supplies"),
          dueDate: formatDate(addDays(parseDateOnly(voucherDates.april), 30)),
          narration: "Initial electronics procurement for Q1 dispatches.",
          itemLines: [
            {
              itemId: itemByName.get("Laptop Pro 14")!.id,
              description: "Laptop Pro 14",
              quantity: 6,
              rate: 42000,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Wireless Mouse")!.id,
              description: "Wireless Mouse",
              quantity: 60,
              rate: 450,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Mechanical Keyboard")!.id,
              description: "Mechanical Keyboard",
              quantity: 25,
              rate: 1400,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "sales",
          voucherDate: fiscalDate(fyStart, 0, 25),
          referenceNumber: "SO-1001",
          partyId: partyByName.get("Arya Retail Private Limited"),
          dueDate: formatDate(
            addDays(parseDateOnly(fiscalDate(fyStart, 0, 25)), 30)
          ),
          narration: "Supply of laptops and accessories against April order.",
          itemLines: [
            {
              itemId: itemByName.get("Laptop Pro 14")!.id,
              description: "Laptop Pro 14",
              quantity: 2,
              rate: 52000,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Wireless Mouse")!.id,
              description: "Wireless Mouse",
              quantity: 10,
              rate: 650,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("USB-C Cable 1m")!.id,
              description: "USB-C Cable 1m",
              quantity: 20,
              rate: 220,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "purchase",
          voucherDate: voucherDates.may,
          referenceNumber: "LO/24-25/0509",
          partyId: partyByName.get("Lotus Office Essentials"),
          dueDate: formatDate(addDays(parseDateOnly(voucherDates.may), 21)),
          narration: "Stationery replenishment for branch offices.",
          itemLines: [
            {
              itemId: itemByName.get("A4 Copier Paper")!.id,
              description: "A4 Copier Paper",
              quantity: 200,
              rate: 180,
              taxRate: 12,
            },
            {
              itemId: itemByName.get("Printer Cartridge 88A")!.id,
              description: "Printer Cartridge 88A",
              quantity: 25,
              rate: 1400,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Heavy Duty Stapler")!.id,
              description: "Heavy Duty Stapler",
              quantity: 30,
              rate: 160,
              taxRate: 12,
            },
            {
              itemId: itemByName.get("Spiral Notebook")!.id,
              description: "Spiral Notebook",
              quantity: 150,
              rate: 30,
              taxRate: 12,
            },
          ],
        },
        {
          voucherClass: "receipt",
          voucherDate: fiscalDate(fyStart, 1, 28),
          referenceNumber: "RCPT-1001",
          narration: "Part payment received from Arya Retail.",
          accountLines: [
            {
              accountId: partyAccountByPartyId.get(
                partyByName.get("Arya Retail Private Limited")!
              )!,
              description: "Against INV-0001",
              debitAmount: 0,
              creditAmount: 82600,
            },
          ],
          balancingAccountId: accountByCode.get("HDFC-BANK")!.id,
        },
        {
          voucherClass: "sales",
          voucherDate: voucherDates.june,
          referenceNumber: "SO-1002",
          partyId: partyByName.get("Bluebird Infosystems LLP"),
          dueDate: formatDate(addDays(parseDateOnly(voucherDates.june), 21)),
          narration: "Stationery and consumables for corporate office.",
          itemLines: [
            {
              itemId: itemByName.get("A4 Copier Paper")!.id,
              description: "A4 Copier Paper",
              quantity: 50,
              rate: 235,
              taxRate: 12,
            },
            {
              itemId: itemByName.get("Printer Cartridge 88A")!.id,
              description: "Printer Cartridge 88A",
              quantity: 4,
              rate: 1850,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Spiral Notebook")!.id,
              description: "Spiral Notebook",
              quantity: 40,
              rate: 55,
              taxRate: 12,
            },
          ],
        },
        {
          voucherClass: "purchase",
          voucherDate: fiscalDate(fyStart, 2, 26),
          referenceNumber: "MM/24-25/0626",
          partyId: partyByName.get("Metro Metals and Wires"),
          dueDate: formatDate(
            addDays(parseDateOnly(fiscalDate(fyStart, 2, 26)), 45)
          ),
          narration: "Bulk purchase of raw materials for fabrication jobs.",
          itemLines: [
            {
              itemId: itemByName.get("Steel Rod 12mm")!.id,
              description: "Steel Rod 12mm",
              quantity: 800,
              rate: 58,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Copper Wire Coil")!.id,
              description: "Copper Wire Coil",
              quantity: 1500,
              rate: 42,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Plastic Granules PP")!.id,
              description: "Plastic Granules PP",
              quantity: 500,
              rate: 92,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "receipt",
          voucherDate: fiscalDate(fyStart, 3, 2),
          referenceNumber: "RCPT-1002",
          narration: "Full cash receipt from Bluebird Infosystems.",
          accountLines: [
            {
              accountId: partyAccountByPartyId.get(
                partyByName.get("Bluebird Infosystems LLP")!
              )!,
              description: "Against INV-0002",
              debitAmount: 0,
              creditAmount: 24429,
            },
          ],
          balancingAccountId: accountByCode.get("CASH")!.id,
        },
        {
          voucherClass: "sales",
          voucherDate: voucherDates.july,
          referenceNumber: "SO-1003",
          partyId: partyByName.get("Crescent Trading Co"),
          dueDate: formatDate(addDays(parseDateOnly(voucherDates.july), 45)),
          narration: "Dispatch of steel and copper for fabrication contract.",
          itemLines: [
            {
              itemId: itemByName.get("Steel Rod 12mm")!.id,
              description: "Steel Rod 12mm",
              quantity: 200,
              rate: 74,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Copper Wire Coil")!.id,
              description: "Copper Wire Coil",
              quantity: 300,
              rate: 58,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "purchase",
          voucherDate: voucherDates.august,
          referenceNumber: "NX/24-25/0822",
          partyId: partyByName.get("Nexa Furniture House"),
          dueDate: formatDate(addDays(parseDateOnly(voucherDates.august), 30)),
          narration: "Furniture and lighting purchase for demo office setup.",
          itemLines: [
            {
              itemId: itemByName.get("Office Chair")!.id,
              description: "Office Chair",
              quantity: 20,
              rate: 2800,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Desk Lamp LED")!.id,
              description: "Desk Lamp LED",
              quantity: 35,
              rate: 650,
              taxRate: 12,
            },
            {
              itemId: itemByName.get("Whiteboard 4x3")!.id,
              description: "Whiteboard 4x3",
              quantity: 12,
              rate: 2200,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "sales",
          voucherDate: fiscalDate(fyStart, 4, 27),
          referenceNumber: "SO-1004",
          partyId: partyByName.get("Delta Workspace Solutions"),
          dueDate: formatDate(
            addDays(parseDateOnly(fiscalDate(fyStart, 4, 27)), 30)
          ),
          narration: "Office furniture order for new workspace launch.",
          itemLines: [
            {
              itemId: itemByName.get("Office Chair")!.id,
              description: "Office Chair",
              quantity: 6,
              rate: 3900,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Desk Lamp LED")!.id,
              description: "Desk Lamp LED",
              quantity: 8,
              rate: 980,
              taxRate: 12,
            },
            {
              itemId: itemByName.get("Whiteboard 4x3")!.id,
              description: "Whiteboard 4x3",
              quantity: 2,
              rate: 3200,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "sales",
          voucherDate: voucherDates.september,
          referenceNumber: "SO-1005",
          partyId: partyByName.get("Everest Healthcare Services"),
          dueDate: formatDate(
            addDays(parseDateOnly(voucherDates.september), 15)
          ),
          narration: "Software licensing and consulting bundle.",
          itemLines: [
            {
              itemId: itemByName.get("Software License Annual")!.id,
              description: "Software License Annual",
              quantity: 2,
              rate: 18000,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Consulting Fee")!.id,
              description: "Consulting Fee",
              quantity: 1,
              rate: 25000,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "purchase",
          voucherDate: voucherDates.october,
          referenceNumber: "OBS/24-25/1019",
          partyId: partyByName.get("Orbit Business Services"),
          dueDate: formatDate(addDays(parseDateOnly(voucherDates.october), 15)),
          narration: "Procurement of service contracts and accessories.",
          itemLines: [
            {
              itemId: itemByName.get("USB-C Cable 1m")!.id,
              description: "USB-C Cable 1m",
              quantity: 120,
              rate: 120,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("HDMI Cable 2m")!.id,
              description: "HDMI Cable 2m",
              quantity: 80,
              rate: 210,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("AMC Support Plan")!.id,
              description: "AMC Support Plan",
              quantity: 4,
              rate: 8000,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "payment",
          voucherDate: fiscalDate(fyStart, 6, 24),
          referenceNumber: "PMT-1001",
          narration: "Partial payment to Kaveri Tech Supplies.",
          accountLines: [
            {
              accountId: partyAccountByPartyId.get(
                partyByName.get("Kaveri Tech Supplies")!
              )!,
              description: "Against BILL-0001",
              debitAmount: 180000,
              creditAmount: 0,
            },
          ],
          balancingAccountId: accountByCode.get("HDFC-BANK")!.id,
        },
        {
          voucherClass: "contra",
          voucherDate: fiscalDate(fyStart, 7, 1),
          referenceNumber: "CON-1001",
          narration: "Cash deposited into HDFC Bank.",
          accountLines: [
            {
              accountId: accountByCode.get("HDFC-BANK")!.id,
              description: "Cash deposit",
              debitAmount: 10000,
              creditAmount: 0,
            },
            {
              accountId: accountByCode.get("CASH")!.id,
              description: "Cash deposit",
              debitAmount: 0,
              creditAmount: 10000,
            },
          ],
        },
        {
          voucherClass: "sales",
          voucherDate: voucherDates.november,
          referenceNumber: "SO-1006",
          partyId: partyByName.get("Fusion Fabricators"),
          dueDate: formatDate(
            addDays(parseDateOnly(voucherDates.november), 30)
          ),
          narration: "Accessory and component sale with AMC service.",
          itemLines: [
            {
              itemId: itemByName.get("Mechanical Keyboard")!.id,
              description: "Mechanical Keyboard",
              quantity: 10,
              rate: 2100,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Wireless Mouse")!.id,
              description: "Wireless Mouse",
              quantity: 15,
              rate: 650,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("HDMI Cable 2m")!.id,
              description: "HDMI Cable 2m",
              quantity: 20,
              rate: 350,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "sales",
          voucherDate: fiscalDate(fyStart, 7, 28),
          referenceNumber: "SO-1007",
          partyId: partyByName.get("Greenfield Packaging Industries"),
          dueDate: formatDate(
            addDays(parseDateOnly(fiscalDate(fyStart, 7, 28)), 25)
          ),
          narration: "Raw material supply and AMC for plant controls.",
          itemLines: [
            {
              itemId: itemByName.get("Plastic Granules PP")!.id,
              description: "Plastic Granules PP",
              quantity: 180,
              rate: 118,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("USB-C Cable 1m")!.id,
              description: "USB-C Cable 1m",
              quantity: 30,
              rate: 220,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("AMC Support Plan")!.id,
              description: "AMC Support Plan",
              quantity: 1,
              rate: 12000,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "receipt",
          voucherDate: fiscalDate(fyStart, 8, 5),
          referenceNumber: "RCPT-1003",
          narration: "Receipt from Everest Healthcare Services.",
          accountLines: [
            {
              accountId: partyAccountByPartyId.get(
                partyByName.get("Everest Healthcare Services")!
              )!,
              description: "Against INV-0005",
              debitAmount: 0,
              creditAmount: 71980,
            },
          ],
          balancingAccountId: accountByCode.get("SBI-BANK")!.id,
        },
        {
          voucherClass: "payment",
          voucherDate: fiscalDate(fyStart, 8, 11),
          referenceNumber: "PMT-1002",
          narration: "Payment to Lotus Office Essentials.",
          accountLines: [
            {
              accountId: partyAccountByPartyId.get(
                partyByName.get("Lotus Office Essentials")!
              )!,
              description: "Against BILL-0002",
              debitAmount: 92236,
              creditAmount: 0,
            },
          ],
          balancingAccountId: accountByCode.get("SBI-BANK")!.id,
        },
        {
          voucherClass: "journal",
          voucherDate: fiscalDate(fyStart, 8, 31),
          referenceNumber: "JNL-1001",
          narration: "Salary provision for December payroll.",
          accountLines: [
            {
              accountId: accountByCode.get("SALARY-WAGES")!.id,
              description: "Salary provision",
              debitAmount: 85000,
              creditAmount: 0,
            },
            {
              accountId: accountByCode.get("SALARY-PAY")!.id,
              description: "Salary payable",
              debitAmount: 0,
              creditAmount: 85000,
            },
          ],
        },
        {
          voucherClass: "debit_note",
          voucherDate: voucherDates.december,
          referenceNumber: "DN-1001",
          partyId: partyByName.get("Lotus Office Essentials"),
          dueDate: formatDate(
            addDays(parseDateOnly(voucherDates.december), 21)
          ),
          narration: "Return of defective printer cartridges.",
          itemLines: [
            {
              itemId: itemByName.get("Printer Cartridge 88A")!.id,
              description: "Printer Cartridge 88A",
              quantity: 2,
              rate: 1400,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "contra",
          voucherDate: fiscalDate(fyStart, 9, 4),
          referenceNumber: "CON-1002",
          narration: "Transfer from HDFC Bank to SBI Bank.",
          accountLines: [
            {
              accountId: accountByCode.get("SBI-BANK")!.id,
              description: "Inter-bank transfer",
              debitAmount: 45000,
              creditAmount: 0,
            },
            {
              accountId: accountByCode.get("HDFC-BANK")!.id,
              description: "Inter-bank transfer",
              debitAmount: 0,
              creditAmount: 45000,
            },
          ],
        },
        {
          voucherClass: "sales",
          voucherDate: voucherDates.january,
          referenceNumber: "SO-1008",
          partyId: partyByName.get("Horizon Learning Hub"),
          dueDate: formatDate(addDays(parseDateOnly(voucherDates.january), 14)),
          narration: "Mixed goods and consulting invoice for classroom setup.",
          itemLines: [
            {
              itemId: itemByName.get("Laptop Pro 14")!.id,
              description: "Laptop Pro 14",
              quantity: 1,
              rate: 52000,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Whiteboard 4x3")!.id,
              description: "Whiteboard 4x3",
              quantity: 1,
              rate: 3200,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Consulting Fee")!.id,
              description: "Consulting Fee",
              quantity: 1,
              rate: 25000,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "payment",
          voucherDate: fiscalDate(fyStart, 9, 20),
          referenceNumber: "PMT-1003",
          narration: "Payment for rent and supplier settlement.",
          accountLines: [
            {
              accountId: partyAccountByPartyId.get(
                partyByName.get("Nexa Furniture House")!
              )!,
              description: "Against BILL-0004",
              debitAmount: 38500,
              creditAmount: 0,
            },
            {
              accountId: accountByCode.get("RENT-EXP")!.id,
              description: "January office rent",
              debitAmount: 25000,
              creditAmount: 0,
            },
          ],
          balancingAccountId: accountByCode.get("HDFC-BANK")!.id,
        },
        {
          voucherClass: "sales",
          voucherDate: fiscalDate(fyStart, 10, 8),
          referenceNumber: "SO-1009",
          partyId: partyByName.get("Indus Office Mart"),
          dueDate: formatDate(
            addDays(parseDateOnly(fiscalDate(fyStart, 10, 8)), 35)
          ),
          narration: "Large stationery dispatch to reseller.",
          itemLines: [
            {
              itemId: itemByName.get("A4 Copier Paper")!.id,
              description: "A4 Copier Paper",
              quantity: 90,
              rate: 235,
              taxRate: 12,
            },
            {
              itemId: itemByName.get("Heavy Duty Stapler")!.id,
              description: "Heavy Duty Stapler",
              quantity: 12,
              rate: 240,
              taxRate: 12,
            },
            {
              itemId: itemByName.get("Wireless Mouse")!.id,
              description: "Wireless Mouse",
              quantity: 18,
              rate: 650,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "credit_note",
          voucherDate: fiscalDate(fyStart, 10, 21),
          referenceNumber: "CN-1001",
          partyId: partyByName.get("Arya Retail Private Limited"),
          narration: "Customer return for damaged mouse units.",
          itemLines: [
            {
              itemId: itemByName.get("Wireless Mouse")!.id,
              description: "Wireless Mouse",
              quantity: 2,
              rate: 650,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "sales",
          voucherDate: fiscalDate(fyStart, 11, 6),
          referenceNumber: "SO-1010",
          partyId: partyByName.get("Jupiter Industrial Works"),
          dueDate: formatDate(
            addDays(parseDateOnly(fiscalDate(fyStart, 11, 6)), 40)
          ),
          narration: "March despatch for raw materials before year-end.",
          itemLines: [
            {
              itemId: itemByName.get("Steel Rod 12mm")!.id,
              description: "Steel Rod 12mm",
              quantity: 420,
              rate: 74,
              taxRate: 18,
            },
            {
              itemId: itemByName.get("Copper Wire Coil")!.id,
              description: "Copper Wire Coil",
              quantity: 750,
              rate: 58,
              taxRate: 18,
            },
          ],
        },
        {
          voucherClass: "credit_note",
          voucherDate: fiscalDate(fyStart, 11, 13),
          referenceNumber: "CN-1002",
          partyId: partyByName.get("Delta Workspace Solutions"),
          narration: "Return of one damaged desk lamp.",
          itemLines: [
            {
              itemId: itemByName.get("Desk Lamp LED")!.id,
              description: "Desk Lamp LED",
              quantity: 1,
              rate: 980,
              taxRate: 12,
            },
          ],
        },
        {
          voucherClass: "journal",
          voucherDate: voucherDates.march,
          referenceNumber: "JNL-1002",
          narration: "Year-end depreciation on office equipment.",
          accountLines: [
            {
              accountId: accountByCode.get("DEPR-EXP")!.id,
              description: "Depreciation for the year",
              debitAmount: 15000,
              creditAmount: 0,
            },
            {
              accountId: accountByCode.get("OFFICE-EQP")!.id,
              description: "Depreciation adjustment",
              debitAmount: 0,
              creditAmount: 15000,
            },
          ],
        },
      ]

      await startSeedStep(
        companyId,
        "vouchers",
        "Posting sample vouchers across the financial year.",
        `0 / ${vouchersToInsert.length} completed`
      )

      for (const [index, voucherInput] of vouchersToInsert.entries()) {
        await startSeedStep(
          companyId,
          "vouchers",
          "Posting sample vouchers across the financial year.",
          `${index + 1} / ${vouchersToInsert.length} in progress`
        )

        await insertVoucher(
          tx,
          companyId,
          userId,
          accountByCode,
          voucherTypeByClass,
          partyAccountByPartyId,
          itemById,
          voucherInput
        )
      }

      await completeSeedStep(
        companyId,
        "vouchers",
        "Posted all sample vouchers.",
        `${vouchersToInsert.length} / ${vouchersToInsert.length} completed`
      )

      await startSeedStep(companyId, "finalize", "Finalizing sample data seed.")

      await updateCompanySettings(companyId, (settings) => {
        const progress =
          getSampleDataSeedProgress(settings) ??
          createInitialSampleDataSeedProgress("completed")
        const timestamp = getIsoTimestamp()

        return {
          ...settings,
          sampleDataSeeded: true,
          sampleDataSeedProgress: {
            ...progress,
            status: "completed",
            message: "Sample data seeded successfully.",
            currentStepKey: "finalize",
            updatedAt: timestamp,
            completedAt: timestamp,
            steps: progress.steps.map((step) =>
              step.key === "finalize"
                ? { ...step, status: "done", detail: "Ready to use." }
                : step
            ),
          },
        }
      })

      return {
        ok: true,
        message: "Sample data seeded successfully.",
      }
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to seed sample data. Please try again."

    await failSeedProgress(companyId, message)

    return {
      ok: false,
      message,
    }
  }
}
