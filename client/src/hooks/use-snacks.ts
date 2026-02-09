import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertSnack } from "@shared/schema";

export function useSnacks() {
  return useQuery({
    queryKey: [api.snacks.list.path],
    queryFn: async () => {
      const res = await fetch(api.snacks.list.path);
      if (!res.ok) throw new Error("Failed to fetch snacks");
      return api.snacks.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSnack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSnack) => {
      // Coerce points to number just in case form sends string
      const payload = { ...data, points: Number(data.points) };
      const validated = api.snacks.create.input.parse(payload);
      
      const res = await fetch(api.snacks.create.path, {
        method: api.snacks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to create snack");
      return api.snacks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.snacks.list.path] });
    },
  });
}

export function useUpdateSnack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertSnack>) => {
      // Coerce points if present
      const payload = updates.points ? { ...updates, points: Number(updates.points) } : updates;
      const validated = api.snacks.update.input.parse(payload);
      
      const url = buildUrl(api.snacks.update.path, { id });
      const res = await fetch(url, {
        method: api.snacks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to update snack");
      return api.snacks.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.snacks.list.path] });
    },
  });
}

export function useDeleteSnack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.snacks.delete.path, { id });
      const res = await fetch(url, { method: api.snacks.delete.method });
      if (!res.ok) throw new Error("Failed to delete snack");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.snacks.list.path] });
    },
  });
}
