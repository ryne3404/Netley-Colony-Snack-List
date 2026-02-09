import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertFamily } from "@shared/schema";

export function useFamilies() {
  return useQuery({
    queryKey: [api.families.list.path],
    queryFn: async () => {
      const res = await fetch(api.families.list.path);
      if (!res.ok) throw new Error("Failed to fetch families");
      return api.families.list.responses[200].parse(await res.json());
    },
  });
}

export function useFamily(id: number) {
  return useQuery({
    queryKey: [api.families.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.families.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch family");
      return api.families.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertFamily) => {
      const res = await fetch(api.families.create.path, {
        method: api.families.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create family");
      return api.families.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.families.list.path] });
    },
  });
}
