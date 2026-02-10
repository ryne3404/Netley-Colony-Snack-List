import { create } from "zustand";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Category, InsertCategory } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: [api.categories.list.path],
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: InsertCategory) => {
      const res = await apiRequest(api.categories.create.method, api.categories.create.path, category);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.categories.list.path] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...category }: Partial<InsertCategory> & { id: number }) => {
      const res = await apiRequest(api.categories.update.method, buildUrl(api.categories.update.path, { id }), category);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.categories.list.path] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(api.categories.delete.method, buildUrl(api.categories.delete.path, { id }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.categories.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.snacks.list.path] });
    },
  });
}
