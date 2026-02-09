import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFamilySchema, type InsertFamily } from "@shared/schema";
import { useCreateFamily } from "@/hooks/use-families";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface CreateFamilyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFamilyDialog({ open, onOpenChange }: CreateFamilyDialogProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createMutation = useCreateFamily();
  
  const form = useForm<InsertFamily>({
    resolver: zodResolver(insertFamilySchema),
    defaultValues: {
      name: "",
      pointsAllowed: 100,
    },
  });

  const onSubmit = async (data: InsertFamily) => {
    try {
      const newFamily = await createMutation.mutateAsync(data);
      toast({ title: "Family created", description: `${data.name} has been added.` });
      form.reset();
      onOpenChange(false);
      setLocation(`/family/${newFamily.id}`);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Something went wrong. Name might be taken.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">New Family Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Family Acronym</Label>
            <Input id="name" {...form.register("name")} placeholder="e.g. AEH" className="uppercase" />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pointsAllowed">Points Allowed</Label>
            <Input 
              id="pointsAllowed" 
              type="number" 
              {...form.register("pointsAllowed", { valueAsNumber: true })} 
            />
            {form.formState.errors.pointsAllowed && (
              <p className="text-destructive text-sm">{form.formState.errors.pointsAllowed.message}</p>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-primary text-white">
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Group
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
