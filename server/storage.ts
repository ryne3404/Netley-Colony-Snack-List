import { db } from "./db";
import {
  families, snacks, selections, categories,
  type Family, type InsertFamily,
  type Snack, type InsertSnack,
  type Selection, type InsertSelection,
  type FamilyWithTotal, type Category, type InsertCategory
} from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<void>;

  // Families
  getFamilies(): Promise<(Family & { totalPointsUsed: number })[]>;
  getFamily(id: number): Promise<Family | undefined>;
  getFamilyByName(name: string): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  
  // Snacks
  getSnacks(): Promise<(Snack & { category: Category | null })[]>;
  getSnack(id: number): Promise<Snack | undefined>;
  createSnack(snack: InsertSnack): Promise<Snack>;
  updateSnack(id: number, snack: Partial<InsertSnack>): Promise<Snack | undefined>;
  deleteSnack(id: number): Promise<void>;
  
  // Selections
  getSelections(familyId: number): Promise<(Selection & { snack: Snack })[]>;
  updateSelection(selection: InsertSelection): Promise<Selection>;
  
  // Master List
  getMasterList(): Promise<{
    snackId: number;
    snackName: string;
    store: string | null;
    totalQuantity: number;
    totalPoints: number;
  }[]>;
  
  // Seed Helper
  seed(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: number, update: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db.update(categories).set(update).where(eq(categories.id, id)).returning();
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.update(snacks).set({ categoryId: null }).where(eq(snacks.categoryId, id));
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getFamilies(): Promise<(Family & { totalPointsUsed: number })[]> {
    const rows = await db.execute(sql`
      SELECT f.*, COALESCE(SUM(sel.quantity * s.points), 0)::int as total_points_used
      FROM families f
      LEFT JOIN selections sel ON f.id = sel.family_id
      LEFT JOIN snacks s ON sel.snack_id = s.id
      GROUP BY f.id
      ORDER BY f.name ASC
    `);
    
    return rows.rows.map(row => ({
      id: row.id as number,
      name: row.name as string,
      pointsAllowed: row.points_allowed as number,
      accessCode: row.access_code as string,
      role: row.role as string,
      totalPointsUsed: row.total_points_used as number
    }));
  }

  async getFamilyByName(name: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.name, name));
    return family;
  }

  async getFamily(id: number): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family;
  }

  async createFamily(insertFamily: InsertFamily): Promise<Family> {
    const [family] = await db.insert(families).values(insertFamily).returning();
    return family;
  }

  async getSnacks(): Promise<(Snack & { category: Category | null })[]> {
    const rows = await db.select({
      snack: snacks,
      category: categories
    })
    .from(snacks)
    .leftJoin(categories, eq(snacks.categoryId, categories.id))
    .orderBy(snacks.name);

    return rows.map(r => ({
      ...r.snack,
      category: r.category
    }));
  }
  
  async getSnack(id: number): Promise<Snack | undefined> {
    const [snack] = await db.select().from(snacks).where(eq(snacks.id, id));
    return snack;
  }

  async createSnack(insertSnack: InsertSnack): Promise<Snack> {
    const [snack] = await db.insert(snacks).values(insertSnack).returning();
    return snack;
  }

  async updateSnack(id: number, update: Partial<InsertSnack>): Promise<Snack | undefined> {
    const [snack] = await db.update(snacks).set(update).where(eq(snacks.id, id)).returning();
    return snack;
  }

  async deleteSnack(id: number): Promise<void> {
    await db.delete(selections).where(eq(selections.snackId, id));
    await db.delete(snacks).where(eq(snacks.id, id));
  }

  async getSelections(familyId: number): Promise<(Selection & { snack: Snack })[]> {
    const rows = await db.select({
      selection: selections,
      snack: snacks
    })
    .from(selections)
    .innerJoin(snacks, eq(selections.snackId, snacks.id))
    .where(eq(selections.familyId, familyId));
    
    return rows.map(r => ({
      ...r.selection,
      snack: r.snack
    }));
  }

  async updateSelection(insertSelection: InsertSelection): Promise<Selection> {
    const existing = await db.select().from(selections).where(
      and(
        eq(selections.familyId, insertSelection.familyId),
        eq(selections.snackId, insertSelection.snackId)
      )
    );

    if (existing.length > 0) {
      const [updated] = await db.update(selections)
        .set({ quantity: insertSelection.quantity })
        .where(eq(selections.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(selections).values(insertSelection).returning();
      return created;
    }
  }

  async getMasterList(): Promise<{
    snackId: number;
    snackName: string;
    store: string | null;
    totalQuantity: number;
    totalPoints: number;
  }[]> {
    const rows = await db.execute(sql`
      SELECT 
        s.id as snack_id, 
        s.name as snack_name, 
        s.store, 
        SUM(sel.quantity)::int as total_quantity,
        SUM(sel.quantity * s.points)::int as total_points
      FROM selections sel
      JOIN snacks s ON sel.snack_id = s.id
      WHERE sel.quantity > 0
      GROUP BY s.id, s.name, s.store
      ORDER BY s.name ASC
    `);

    return rows.rows.map(row => ({
      snackId: row.snack_id as number,
      snackName: row.snack_name as string,
      store: row.store as string | null,
      totalQuantity: row.total_quantity as number,
      totalPoints: row.total_points as number
    }));
  }

  async seed(): Promise<void> {
    const familyNames = [
      "AEH", "ASH", "CCH", "CKH", "CTH", "DBH", "EBW", "ERH", "HAH", "HJS", 
      "HLW", "HSM", "JAH", "JDH", "JDK", "JGK", "JTH", "JNH", "JSH", "JuDH", 
      "KLK", "LEH", "MJH", "MMH", "PAUL", "RAW", "RDH", "RKH", "SMH", "TEH", 
      "TSK", "VWW", "WLH", "ZKK"
    ];

    const existingFamilies = await this.getFamilies();
    if (existingFamilies.length === 0) {
      // Create Admin account
      await this.createFamily({ 
        name: "Admin", 
        pointsAllowed: 0, 
        accessCode: "password123", 
        role: "admin" 
      });

      for (const name of familyNames) {
        await this.createFamily({ name, pointsAllowed: 800 });
      }
    }

    const categoriesList = [
      "Fruit/fruit snacks", "Nuts/Nutty treats", "Dairy", "Gum", "Chocolates",
      "Crackers", "Chips", "Costco Big Bags", "Other", "Beverages", "Bars",
      "Gummies and candy", "Granola Bars", "Cookies"
    ];

    const existingCats = await this.getCategories();
    if (existingCats.length === 0) {
      for (const name of categoriesList) {
        await this.createCategory({ name });
      }
    }

    const allCats = await this.getCategories();
    const catMap = Object.fromEntries(allCats.map(c => [c.name, c.id]));

    const existingSnacks = await this.getSnacks();
    if (existingSnacks.length === 0) {
      const snacksData = [
        // Fruit/fruit snacks
        { name: "Figs", points: 20, store: null, category: "Fruit/fruit snacks" },
        { name: "KS sweet Mangos", points: 16, store: "Freshco", category: "Fruit/fruit snacks" },
        { name: "Organic Mangoes", points: 26, store: null, category: "Fruit/fruit snacks" },
        { name: "Medjool Dates", points: 12, store: null, category: "Fruit/fruit snacks" },
        { name: "Dried Pineapple", points: 18, store: null, category: "Fruit/fruit snacks" },
        { name: "Raisins", points: 10, store: "Costco 907 g bag", category: "Fruit/fruit snacks" },
        { name: "Frozen Mangoes", points: 13, store: "Costco 2 kg", category: "Fruit/fruit snacks" },
        { name: "Ocean spray Craisins", points: 15, store: "Costco 1.8 kg", category: "Fruit/fruit snacks" },
        { name: "Nutty Fruity Ginger Chunks", points: 8, store: null, category: "Fruit/fruit snacks" },
        { name: "Fruit source", points: 22, store: null, category: "Fruit/fruit snacks" },
        { name: "Kashi Organic fruit bars", points: 19, store: null, category: "Fruit/fruit snacks" },
        { name: "Mott's Fruitsations", points: 14, store: null, category: "Fruit/fruit snacks" },
        { name: "That's it fruit bars", points: 22, store: "Costco 24 bars", category: "Fruit/fruit snacks" },
        
        // Chips
        { name: "Popcorners sweet and salty", points: 5, store: null, category: "Chips" },
        { name: "Kettle cooked Jalapeno Cheddar", points: 4, store: null, category: "Chips" },
        { name: "Kettle cooked sour cream and dill", points: 4, store: null, category: "Chips" },
        { name: "Kettle cooked Mesquite BBQ", points: 4, store: null, category: "Chips" },
        { name: "Old Dutch Ripple", points: 4, store: null, category: "Chips" },
        { name: "Old Dutch sourcream and onion", points: 4, store: null, category: "Chips" },
        { name: "Old Dutch BBQ", points: 4, store: null, category: "Chips" },
        { name: "Old Dutch All dressed", points: 4, store: null, category: "Chips" },
        { name: "Old Dutch Ketchup", points: 4, store: null, category: "Chips" },
        { name: "Old Dutch Cheddar and Sourcream", points: 4, store: null, category: "Chips" },
        { name: "Old Dutch Popcorn Twists", points: 4, store: null, category: "Chips" },
        { name: "Cheese Pleasers", points: 4, store: null, category: "Chips" },
        { name: "Old Dutch Crunchies", points: 4, store: null, category: "Chips" },
        { name: "Ruffles Original", points: 5, store: null, category: "Chips" },
        { name: "Ruffles Cheddar and sourcream", points: 5, store: null, category: "Chips" },
        { name: "Ruffles Smokehouse BBQ", points: 5, store: null, category: "Chips" },
        { name: "Ruffles Jalapeno Ranch", points: 5, store: null, category: "Chips" },
        { name: "Ruffles Sourcream and Onion", points: 5, store: null, category: "Chips" },
        { name: "Ruffles sea salt", points: 5, store: null, category: "Chips" },
        { name: "Ruffles All dressed", points: 5, store: null, category: "Chips" },
        { name: "Takis nacho", points: 5, store: null, category: "Chips" },
        { name: "Ms Vickies Spicy Dill", points: 5, store: null, category: "Chips" },
        { name: "Ms Vickies sweet chili and sourcream", points: 5, store: null, category: "Chips" },
        { name: "Ms Vickies Black pepper", points: 5, store: null, category: "Chips" },
        { name: "Ms Vickies sweet and Spicy Ketchup", points: 5, store: null, category: "Chips" },

        // Costco Big Bags
        { name: "Munchies", points: 9, store: "Costco", category: "Costco Big Bags" },
        { name: "Doritoes", points: 8.50, store: "Costco", category: "Costco Big Bags" },
        { name: "Veggie Straws", points: 8, store: "Costco", category: "Costco Big Bags" },
        { name: "Tortilla Rounds", points: 7.50, store: "Costco", category: "Costco Big Bags" },
        { name: "Chicago Mix", points: 8.50, store: "Costco", category: "Costco Big Bags" },
        { name: "Sun chips", points: 8.50, store: "Costco", category: "Costco Big Bags" },
        { name: "KS Kettle brand Krinkle cut sea salt", points: 8.50, store: "Costco", category: "Costco Big Bags" },
        { name: "Pretzel bags", points: 8, store: "Costco", category: "Costco Big Bags" },
        { name: "Prawn chips", points: 14, store: "Costco", category: "Costco Big Bags" },
        { name: "KS corn chips", points: 6, store: "Costco", category: "Costco Big Bags" },
        { name: "Hardbite Mango Habanero", points: 8.50, store: "Costco", category: "Costco Big Bags" },
        { name: "Cedarvalley Pita chips", points: 12, store: "Costco", category: "Costco Big Bags" },
        { name: "Ruffles Regular", points: 8, store: "Costco", category: "Costco Big Bags" },
        { name: "Pork rinds", points: 12, store: "Costco", category: "Costco Big Bags" },
        { name: "Turtle chips", points: 8.50, store: "Costco", category: "Costco Big Bags" },
        
        // Bars
        { name: "Aero", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Aero Mint", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Dairy Milk", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Mirage", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Big Turk", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Coffee Crisp", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Crunchie", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Wunderbar", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Hershey Cookies and Creme", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Twix", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Mars", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Toblerone", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Kitkat", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Hershey Milk Chocolate", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Hershey Whole Almonds", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Rolo", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Twirl", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Caramilk", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Oh Henry", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Snickers", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Mr Big", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Eatmore", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Reese", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Three Muskateer", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Smarties", points: 1, store: "Dollarama", category: "Bars" },
        { name: "M&M's", points: 1, store: "Dollarama", category: "Bars" },
        { name: "M&M's Peanut", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Island Bar Coconut", points: 1, store: "Dollarama", category: "Bars" },
        { name: "Skor", points: 1, store: "Dollarama", category: "Bars" }
      ];

      for (const s of snacksData) {
        await this.createSnack({
          name: s.name,
          points: Math.round(Number(s.points)),
          store: s.store,
          categoryId: catMap[s.category] || null
        });
      }
    }
  }
}

export const storage = new DatabaseStorage();
