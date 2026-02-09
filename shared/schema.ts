import { pgTable, text, serial, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Families table (e.g., AEH, ASH, etc.)
export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // The acronym
  pointsAllowed: integer("points_allowed").notNull().default(0),
});

// Snacks table
export const snacks = pgTable("snacks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  store: text("store"), // Costco, Superstore, etc.
  link: text("link"),
  points: integer("points").notNull().default(0),
  imageUrl: text("image_url"),
  categoryId: integer("category_id").references(() => categories.id),
});

// Selections table (Pivot table for Family <-> Snack with Quantity)
export const selections = pgTable("selections", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  snackId: integer("snack_id").notNull().references(() => snacks.id),
  quantity: integer("quantity").notNull().default(0),
}, (t) => ({
  uniqueSelection: unique().on(t.familyId, t.snackId),
}));

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  snacks: many(snacks),
}));

export const familiesRelations = relations(families, ({ many }) => ({
  selections: many(selections),
}));

export const snacksRelations = relations(snacks, ({ one, many }) => ({
  category: one(categories, {
    fields: [snacks.categoryId],
    references: [categories.id],
  }),
  selections: many(selections),
}));

export const selectionsRelations = relations(selections, ({ one }) => ({
  family: one(families, {
    fields: [selections.familyId],
    references: [families.id],
  }),
  snack: one(snacks, {
    fields: [selections.snackId],
    references: [snacks.id],
  }),
}));

// Schemas
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertFamilySchema = createInsertSchema(families).omit({ id: true });
export const insertSnackSchema = createInsertSchema(snacks).omit({ id: true });
export const insertSelectionSchema = createInsertSchema(selections).omit({ id: true });

// Types
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;

export type Snack = typeof snacks.$inferSelect;
export type InsertSnack = z.infer<typeof insertSnackSchema>;

export type Selection = typeof selections.$inferSelect;
export type InsertSelection = z.infer<typeof insertSelectionSchema>;

// Custom Types for API Responses
export type FamilyWithTotal = Family & { totalPointsUsed: number };
export type SnackWithSelection = Snack & { quantity: number; selectionId?: number };
