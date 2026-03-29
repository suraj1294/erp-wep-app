import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { companies } from "./company"
import { accounts } from "./accounting"

export const parties = pgTable(
  "parties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => accounts.id),
    type: varchar("type", { length: 20 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }),
    contactPerson: varchar("contact_person", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    gstin: varchar("gstin", { length: 15 }),
    pan: varchar("pan", { length: 10 }),
    address: jsonb("address"),
    creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }).default(
      "0"
    ),
    creditDays: integer("credit_days").default(0),
    taxRegistration: jsonb("tax_registration").default({}),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_parties_company_type").on(table.companyId, table.type),
  ]
)

export const partiesRelations = relations(parties, ({ one }) => ({
  company: one(companies, {
    fields: [parties.companyId],
    references: [companies.id],
  }),
  account: one(accounts, {
    fields: [parties.accountId],
    references: [accounts.id],
  }),
}))
