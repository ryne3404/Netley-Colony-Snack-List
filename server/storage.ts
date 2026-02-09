import { db } from "./db";
import {
  families, snacks, selections,
  type Family, type InsertFamily,
  type Snack, type InsertSnack,
  type Selection, type InsertSelection,
  type FamilyWithTotal
} from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";

export interface IStorage {
  // Families
  getFamilies(): Promise<FamilyWithTotal[]>;
  getFamily(id: number): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  
  // Snacks
  getSnacks(): Promise<Snack[]>;
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
  async getFamilies(): Promise<FamilyWithTotal[]> {
    // We want to calculate total points used for each family
    // This is a bit complex in one go with Drizzle's query builder without 'groupBy', 
    // but let's try a raw query or join.
    // For simplicity/speed in MVP, let's fetch all families and then their usage.
    // Or better, use a left join with aggregation.
    
    // Efficient way:
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
      totalPointsUsed: row.total_points_used as number
    }));
  }

  async getFamily(id: number): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family;
  }

  async createFamily(insertFamily: InsertFamily): Promise<Family> {
    const [family] = await db.insert(families).values(insertFamily).returning();
    return family;
  }

  async getSnacks(): Promise<Snack[]> {
    return await db.select().from(snacks).orderBy(snacks.name);
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
    await db.delete(selections).where(eq(selections.snackId, id)); // cascade manually if needed
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
    // Upsert logic
    // Check if exists
    const existing = await db.select().from(selections).where(
      and(
        eq(selections.familyId, insertSelection.familyId),
        eq(selections.snackId, insertSelection.snackId)
      )
    );

    if (existing.length > 0) {
      if (insertSelection.quantity === 0) {
         // Optionally delete if 0, but keeping it with 0 is fine too.
         // Let's keep it with 0 or delete.
         const [updated] = await db.update(selections)
           .set({ quantity: insertSelection.quantity })
           .where(eq(selections.id, existing[0].id))
           .returning();
         return updated;
      } else {
        const [updated] = await db.update(selections)
          .set({ quantity: insertSelection.quantity })
          .where(eq(selections.id, existing[0].id))
          .returning();
        return updated;
      }
    } else {
      if (insertSelection.quantity > 0) {
        const [created] = await db.insert(selections).values(insertSelection).returning();
        return created;
      }
      // If creating with 0, just return a dummy or create it with 0.
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
      for (const name of familyNames) {
        await this.createFamily({ name, pointsAllowed: 800 }); // Default points from screenshot roughly
      }
    }

    const existingSnacks = await this.getSnacks();
    if (existingSnacks.length === 0) {
      await this.createSnack({ name: "KS Sweet Mangos", points: 16, store: "Costco" });
      await this.createSnack({ name: "Organic Mangoes", points: 26, store: "Costco" });
      await this.createSnack({ name: "Medjool Dates", points: 12, store: "Superstore" });
      await this.createSnack({ name: "Dried Pineapple", points: 18, store: "Costco" });
      await this.createSnack({ name: "Raisins", points: 10, store: "Costco" });
      await this.createSnack({ name: "Frozen Mangoes", points: 13, store: "Costco" });
      await this.createSnack({ name: "Ocean Spray Craisins", points: 15, store: "Costco" });
      await this.createSnack({ name: "Mott's Fruitsations", points: 14, store: "Costco" });
      await this.createSnack({ name: "That's it Fruit Bars", points: 22, store: "Costco" });
      await this.createSnack({ name: "Pecans", points: 25, store: "Costco" });
    }
  }
}

export const storage = new DatabaseStorage();
