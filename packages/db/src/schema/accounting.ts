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
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { companies } from "./company"

export const accountGroups = pgTable(
  "account_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 20 }),
    parentId: uuid("parent_id"),
    accountType: varchar("account_type", { length: 50 }).notNull(),
    nature: varchar("nature", { length: 20 }).notNull(),
    level: integer("level").default(1),
    isSystem: boolean("is_system").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_account_groups_company").on(table.companyId),
  ]
)

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    groupId: uuid("group_id").references(() => accountGroups.id),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }),
    description: text("description"),
    openingBalance: decimal("opening_balance", {
      precision: 15,
      scale: 2,
    }).default("0"),
    currentBalance: decimal("current_balance", {
      precision: 15,
      scale: 2,
    }).default("0"),
    isSystem: boolean("is_system").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("accounts_company_code_unique").on(
      table.companyId,
      table.code
    ),
  ]
)

export const taxRates = pgTable("tax_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  taxType: varchar("tax_type", { length: 50 }),
  components: jsonb("components"),
  applicableFrom: date("applicable_from"),
  applicableTo: date("applicable_to"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
})

// Self-referential relation for account_groups
export const accountGroupsRelations = relations(
  accountGroups,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [accountGroups.companyId],
      references: [companies.id],
    }),
    parent: one(accountGroups, {
      fields: [accountGroups.parentId],
      references: [accountGroups.id],
      relationName: "parentChild",
    }),
    children: many(accountGroups, { relationName: "parentChild" }),
    accounts: many(accounts),
  })
)

export const accountsRelations = relations(accounts, ({ one }) => ({
  company: one(companies, {
    fields: [accounts.companyId],
    references: [companies.id],
  }),
  group: one(accountGroups, {
    fields: [accounts.groupId],
    references: [accountGroups.id],
  }),
}))

export const taxRatesRelations = relations(taxRates, ({ one }) => ({
  company: one(companies, {
    fields: [taxRates.companyId],
    references: [companies.id],
  }),
}))
