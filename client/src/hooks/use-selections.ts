import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useSelections(familyId: number) {
  return useQuery({
    queryKey: [api.selections.listByFamily.path, familyId],
    queryFn: async () => {
      const url = buildUrl(api.selections.listByFamily.path, { familyId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch selections");
      return api.selections.listByFamily.responses[200].parse(await res.json());
    },
    enabled: !!familyId,
  });
}

export function useUpdateSelection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ familyId, snackId, quantity }: { familyId: number; snackId: number; quantity: number }) => {
      const res = await fetch(api.selections.update.path, {
        method: api.selections.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, snackId, quantity }),
      });
      if (!res.ok) throw new Error("Failed to update selection");
      return api.selections.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.selections.listByFamily.path, variables.familyId] });
      // Also invalidate master list as totals changed
      queryClient.invalidateQueries({ queryKey: [api.masterList.get.path] });
    },
  });
}

export function useMasterList() {
  return useQuery({
    queryKey: [api.masterList.get.path],
    queryFn: async () => {
      const res = await fetch(api.masterList.get.path);
      if (!res.ok) throw new Error("Failed to fetch master list");
      return api.masterList.get.responses[200].parse(await res.json());
    },
  });
}
