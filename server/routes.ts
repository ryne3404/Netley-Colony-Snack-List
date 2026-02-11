import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth
  app.post("/api/login", async (req, res) => {
    const { name, accessCode } = req.body;
    const family = await storage.getFamilyByName(name);
    if (!family || family.accessCode !== accessCode) {
      return res.status(401).json({ message: "Invalid acronym or code" });
    }
    res.json(family);
  });

  // Categories
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post(api.categories.create.path, async (req, res) => {
    try {
      const input = api.categories.create.input.parse(req.body);
      const category = await storage.createCategory(input);
      res.status(201).json(category);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.categories.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.categories.update.input.parse(req.body);
      const category = await storage.updateCategory(id, input);
      if (!category) return res.status(404).json({ message: "Category not found" });
      res.json(category);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.categories.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteCategory(id);
    res.status(204).send();
  });

  // Families
  app.get(api.families.list.path, async (req, res) => {
    const families = await storage.getFamilies();
    res.json(families);
  });

  app.get(api.families.get.path, async (req, res) => {
    const family = await storage.getFamily(Number(req.params.id));
    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }
    res.json(family);
  });

  app.post(api.families.create.path, async (req, res) => {
    try {
      const input = api.families.create.input.parse(req.body);
      const family = await storage.createFamily(input);
      res.status(201).json(family);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Snacks
  app.get(api.snacks.list.path, async (req, res) => {
    const snacks = await storage.getSnacks();
    res.json(snacks);
  });

  app.post(api.snacks.create.path, async (req, res) => {
    try {
      const input = api.snacks.create.input.parse(req.body);
      const snack = await storage.createSnack(input);
      res.status(201).json(snack);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.snacks.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.snacks.update.input.parse(req.body);
      const snack = await storage.updateSnack(id, input);
      if (!snack) return res.status(404).json({ message: "Snack not found" });
      res.json(snack);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.snacks.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteSnack(id);
    res.status(204).send();
  });

  // Selections
  app.get(api.selections.listByFamily.path, async (req, res) => {
    const selections = await storage.getSelections(Number(req.params.familyId));
    res.json(selections);
  });

  app.post(api.selections.update.path, async (req, res) => {
    try {
      const input = api.selections.update.input.parse(req.body);
      const selection = await storage.updateSelection(input);
      res.json(selection);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Master List
  app.get(api.masterList.get.path, async (req, res) => {
    const list = await storage.getMasterList();
    res.json(list);
  });

  // Seed
  await storage.seed();

  return httpServer;
}
