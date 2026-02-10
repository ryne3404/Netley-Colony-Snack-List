import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useCategories, useDeleteCategory, useCreateCategory, useUpdateCategory } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Edit, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ManageCategories() {
  const { data: categories, isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string } | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const handleSave = async () => {
    if (!categoryName.trim()) return;
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, name: categoryName });
        toast({ title: "Category updated" });
      } else {
        await createMutation.mutateAsync({ name: categoryName });
        toast({ title: "Category created" });
      }
      setIsDialogOpen(false);
      setCategoryName("");
      setEditingCategory(null);
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen bg-muted/20">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Manage Categories</h1>
              <p className="text-muted-foreground mt-2">Organize your snacks by category.</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingCategory(null);
                setCategoryName("");
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    value={categoryName} 
                    onChange={(e) => setCategoryName(e.target.value)} 
                    placeholder="Category Name"
                  />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={2} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : categories?.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setEditingCategory(cat);
                          setCategoryName(cat.name);
                          setIsDialogOpen(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(cat.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
