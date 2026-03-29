import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { companies } from "./company"

export const unitsOfMeasure = pgTable("units_of_measure", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 20 }),
  decimalPlaces: integer("decimal_places").default(2),
  isBaseUnit: boolean("is_base_unit").default(false),
  conversionFactor: decimal("conversion_factor", {
    precision: 10,
    scale: 4,
  }).default("1"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
})

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    brand: varchar("brand", { length: 100 }),
    unitId: uuid("unit_id").references(() => unitsOfMeasure.id),
    itemType: varchar("item_type", { length: 20 }).default("goods"),
    hsnCode: varchar("hsn_code", { length: 20 }),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
    purchaseRate: decimal("purchase_rate", { precision: 12, scale: 2 }),
    salesRate: decimal("sales_rate", { precision: 12, scale: 2 }),
    mrp: decimal("mrp", { precision: 12, scale: 2 }),
    minimumStock: decimal("minimum_stock", { precision: 10, scale: 2 }).default(
      "0"
    ),
    maximumStock: decimal("maximum_stock", { precision: 10, scale: 2 }),
    reorderLevel: decimal("reorder_level", { precision: 10, scale: 2 }),
    currentStock: decimal("current_stock", {
      precision: 12,
      scale: 3,
    }).default("0"),
    stockValue: decimal("stock_value", { precision: 15, scale: 2 }).default(
      "0"
    ),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("items_company_code_unique").on(table.companyId, table.code),
    index("idx_items_company_active").on(table.companyId, table.isActive),
  ]
)

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  address: text("address"),
  contactPerson: varchar("contact_person", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
})

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id),
    voucherId: uuid("voucher_id"),
    movementType: varchar("movement_type", { length: 20 }),
    quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
    rate: decimal("rate", { precision: 12, scale: 2 }),
    value: decimal("value", { precision: 15, scale: 2 }),
    balanceQuantity: decimal("balance_quantity", { precision: 12, scale: 3 }),
    balanceValue: decimal("balance_value", { precision: 15, scale: 2 }),
    locationId: uuid("location_id").references(() => locations.id),
    batchNumber: varchar("batch_number", { length: 100 }),
    expiryDate: date("expiry_date"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_stock_movements_item_date").on(table.itemId, table.createdAt),
  ]
)

export const unitsOfMeasureRelations = relations(
  unitsOfMeasure,
  ({ one }) => ({
    company: one(companies, {
      fields: [unitsOfMeasure.companyId],
      references: [companies.id],
    }),
  })
)

export const itemsRelations = relations(items, ({ one }) => ({
  company: one(companies, {
    fields: [items.companyId],
    references: [companies.id],
  }),
  unit: one(unitsOfMeasure, {
    fields: [items.unitId],
    references: [unitsOfMeasure.id],
  }),
}))

export const locationsRelations = relations(locations, ({ one }) => ({
  company: one(companies, {
    fields: [locations.companyId],
    references: [companies.id],
  }),
}))

export const stockMovementsRelations = relations(
  stockMovements,
  ({ one }) => ({
    company: one(companies, {
      fields: [stockMovements.companyId],
      references: [companies.id],
    }),
    item: one(items, {
      fields: [stockMovements.itemId],
      references: [items.id],
    }),
    location: one(locations, {
      fields: [stockMovements.locationId],
      references: [locations.id],
    }),
  })
)
