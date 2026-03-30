import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { user } from "./auth"

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  gstin: varchar("gstin", { length: 15 }),
  pan: varchar("pan", { length: 10 }),
  financialYearStart: date("financial_year_start").default("2024-04-01"),
  currency: varchar("currency", { length: 3 }).default("INR"),
  logoUrl: text("logo_url"),
  settings: jsonb("settings").default({}),
  isActive: boolean("is_active").default(true),
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [uniqueIndex("companies_slug_unique").on(table.slug)])

export const companyUsers = pgTable(
  "company_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("viewer"),
    permissions: jsonb("permissions").default({}),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [uniqueIndex("company_users_unique").on(table.companyId, table.userId)]
)

export const companiesRelations = relations(companies, ({ many, one }) => ({
  companyUsers: many(companyUsers),
  createdByUser: one(user, {
    fields: [companies.createdBy],
    references: [user.id],
  }),
}))

export const companyUsersRelations = relations(companyUsers, ({ one }) => ({
  company: one(companies, {
    fields: [companyUsers.companyId],
    references: [companies.id],
  }),
  user: one(user, {
    fields: [companyUsers.userId],
    references: [user.id],
  }),
}))
