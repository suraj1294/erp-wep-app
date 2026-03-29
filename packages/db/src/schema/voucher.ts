import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  decimal,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { companies } from "./company"
import { user } from "./auth"
import { parties } from "./party"
import { accounts } from "./accounting"
import { items } from "./inventory"

export const voucherTypes = pgTable(
  "voucher_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 20 }).notNull(),
    prefix: varchar("prefix", { length: 10 }),
    suffix: varchar("suffix", { length: 10 }),
    numberingMethod: varchar("numbering_method", { length: 20 }).default(
      "automatic"
    ),
    startingNumber: integer("starting_number").default(1),
    currentNumber: integer("current_number").default(1),
    voucherClass: varchar("voucher_class", { length: 50 }).notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("voucher_types_company_code_unique").on(
      table.companyId,
      table.code
    ),
  ]
)

export const vouchers = pgTable(
  "vouchers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    voucherTypeId: uuid("voucher_type_id")
      .notNull()
      .references(() => voucherTypes.id),
    voucherNumber: varchar("voucher_number", { length: 50 }).notNull(),
    referenceNumber: varchar("reference_number", { length: 100 }),
    voucherDate: date("voucher_date").notNull(),
    partyId: uuid("party_id").references(() => parties.id),
    narration: text("narration"),
    totalAmount: decimal("total_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    status: varchar("status", { length: 20 }).default("active"),
    dueDate: date("due_date"),
    createdBy: text("created_by").references(() => user.id),
    approvedBy: text("approved_by").references(() => user.id),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("vouchers_company_type_number_unique").on(
      table.companyId,
      table.voucherTypeId,
      table.voucherNumber
    ),
    index("idx_vouchers_company_date").on(table.companyId, table.voucherDate),
  ]
)

export const voucherItems = pgTable(
  "voucher_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    voucherId: uuid("voucher_id")
      .notNull()
      .references(() => vouchers.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => accounts.id),
    itemId: uuid("item_id").references(() => items.id),
    description: text("description"),
    quantity: decimal("quantity", { precision: 12, scale: 3 }),
    rate: decimal("rate", { precision: 12, scale: 2 }),
    debitAmount: decimal("debit_amount", { precision: 15, scale: 2 }).default(
      "0"
    ),
    creditAmount: decimal("credit_amount", {
      precision: 15,
      scale: 2,
    }).default("0"),
    lineNumber: integer("line_number").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_voucher_items_voucher").on(table.voucherId),
    index("idx_voucher_items_account").on(table.accountId),
  ]
)

export const voucherTypesRelations = relations(
  voucherTypes,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [voucherTypes.companyId],
      references: [companies.id],
    }),
    vouchers: many(vouchers),
  })
)

export const vouchersRelations = relations(vouchers, ({ one, many }) => ({
  company: one(companies, {
    fields: [vouchers.companyId],
    references: [companies.id],
  }),
  voucherType: one(voucherTypes, {
    fields: [vouchers.voucherTypeId],
    references: [voucherTypes.id],
  }),
  party: one(parties, {
    fields: [vouchers.partyId],
    references: [parties.id],
  }),
  createdByUser: one(user, {
    fields: [vouchers.createdBy],
    references: [user.id],
    relationName: "voucherCreator",
  }),
  approvedByUser: one(user, {
    fields: [vouchers.approvedBy],
    references: [user.id],
    relationName: "voucherApprover",
  }),
  items: many(voucherItems),
}))

export const voucherItemsRelations = relations(voucherItems, ({ one }) => ({
  voucher: one(vouchers, {
    fields: [voucherItems.voucherId],
    references: [vouchers.id],
  }),
  account: one(accounts, {
    fields: [voucherItems.accountId],
    references: [accounts.id],
  }),
  item: one(items, {
    fields: [voucherItems.itemId],
    references: [items.id],
  }),
}))
