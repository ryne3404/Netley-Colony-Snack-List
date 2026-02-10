import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSnackSchema, type InsertSnack, type Snack } from "@shared/schema";
import { useCreateSnack, useUpdateSnack } from "@/hooks/use-snacks";
import { useCategories } from "@/hooks/use-categories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";

interface SnackFormDialogProps {
  snack?: Snack; // If provided, edit mode
  trigger?: React.ReactNode;
}

export function SnackFormDialog({ snack, trigger }: SnackFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createMutation = useCreateSnack();
  const updateMutation = useUpdateSnack();
  const { data: categories } = useCategories();
  
  const isEditing = !!snack;
  
  const form = useForm<InsertSnack>({
    resolver: zodResolver(insertSnackSchema),
    defaultValues: snack ? {
      name: snack.name,
      store: snack.store || "",
      link: snack.link || "",
      imageUrl: snack.imageUrl || "",
      points: snack.points,
      categoryId: snack.categoryId || undefined,
    } : {
      name: "",
      store: "",
      link: "",
      imageUrl: "",
      points: 0,
      categoryId: undefined,
    },
  });

  // Keep form in sync when snack prop changes (for editing)
  useEffect(() => {
    if (snack) {
      form.reset({
        name: snack.name,
        store: snack.store || "",
        link: snack.link || "",
        imageUrl: snack.imageUrl || "",
        points: snack.points,
        categoryId: snack.categoryId || undefined,
      });
    }
  }, [snack, form]);

  const onSubmit = async (data: InsertSnack) => {
    try {
      if (isEditing && snack) {
        await updateMutation.mutateAsync({ id: snack.id, ...data });
        toast({ title: "Snack updated", description: `${data.name} has been updated.` });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: "Snack created", description: `${data.name} has been added.` });
        form.reset();
      }
      setOpen(false);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Add New Snack
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEditing ? "Edit Snack" : "Add New Snack"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} placeholder="e.g. Mixed Nuts" />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              onValueChange={(val) => form.setValue("categoryId", val ? parseInt(val) : undefined)}
              defaultValue={form.getValues("categoryId")?.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store">Store</Label>
              <Input id="store" {...form.register("store")} placeholder="Costco" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Points Cost</Label>
              <Input 
                id="points" 
                type="number" 
                {...form.register("points", { valueAsNumber: true })} 
              />
              {form.formState.errors.points && (
                <p className="text-destructive text-sm">{form.formState.errors.points.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input id="imageUrl" {...form.register("imageUrl")} placeholder="https://..." />
            <p className="text-xs text-muted-foreground">Leave empty to generate automatic placeholder</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Product Link (Optional)</Label>
            <Input id="link" {...form.register("link")} placeholder="https://..." />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-primary text-white">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Snack"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
