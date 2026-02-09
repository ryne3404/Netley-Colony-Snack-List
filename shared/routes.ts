import { z } from "zod";
import { insertCategorySchema, insertFamilySchema, insertSnackSchema, insertSelectionSchema, families, snacks, selections, categories } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  categories: {
    list: {
      method: "GET" as const,
      path: "/api/categories" as const,
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/categories" as const,
      input: insertCategorySchema,
      responses: {
        201: z.custom<typeof categories.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/categories/:id" as const,
      input: insertCategorySchema,
      responses: {
        200: z.custom<typeof categories.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/categories/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  families: {
    list: {
      method: "GET" as const,
      path: "/api/families" as const,
      responses: {
        200: z.array(z.custom<typeof families.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/families/:id" as const,
      responses: {
        200: z.custom<typeof families.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/families" as const,
      input: insertFamilySchema,
      responses: {
        201: z.custom<typeof families.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  snacks: {
    list: {
      method: "GET" as const,
      path: "/api/snacks" as const,
      responses: {
        200: z.array(z.custom<typeof snacks.$inferSelect & { category: typeof categories.$inferSelect | null }>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/snacks" as const,
      input: insertSnackSchema,
      responses: {
        201: z.custom<typeof snacks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/snacks/:id" as const,
      input: insertSnackSchema.partial(),
      responses: {
        200: z.custom<typeof snacks.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/snacks/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  selections: {
    listByFamily: {
      method: "GET" as const,
      path: "/api/selections/:familyId" as const,
      responses: {
        200: z.array(z.custom<typeof selections.$inferSelect & { snack: typeof snacks.$inferSelect }>()),
      },
    },
    update: {
      method: "POST" as const,
      path: "/api/selections" as const,
      input: z.object({
        familyId: z.number(),
        snackId: z.number(),
        quantity: z.number().min(0),
      }),
      responses: {
        200: z.custom<typeof selections.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  masterList: {
    get: {
      method: "GET" as const,
      path: "/api/master-list" as const,
      responses: {
        200: z.array(z.object({
          snackId: z.number(),
          snackName: z.string(),
          store: z.string().nullable(),
          totalQuantity: z.number(),
          totalPoints: z.number(),
        })),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
