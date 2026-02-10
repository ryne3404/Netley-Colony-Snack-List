import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useSnacks, useDeleteSnack } from "@/hooks/use-snacks";
import { SnackFormDialog } from "@/components/SnackFormDialog";
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Edit, ExternalLink } from "lucide-react";

export default function ManageSnacks() {
  const { data: snacks, isLoading } = useSnacks();
  const deleteMutation = useDeleteSnack();
  const [search, setSearch] = useState("");

  const filteredSnacks = snacks?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.store?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-muted/20">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Manage Snacks</h1>
              <p className="text-muted-foreground mt-2">Add, edit or remove snacks from the catalog.</p>
            </div>
            <SnackFormDialog />
          </div>

          {/* Search */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search snacks..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          {/* Table Card */}
          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                    </TableRow>
                  ) : filteredSnacks?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No snacks found. Add one to get started!
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSnacks?.map((snack) => (
                      <TableRow key={snack.id} className="group hover:bg-muted/10">
                        <TableCell>
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
                            <img 
                              src={snack.imageUrl || `https://placehold.co/100x100/F3F4F6/6B7280?text=${snack.name.substring(0,2).toUpperCase()}`} 
                              alt={snack.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{snack.name}</TableCell>
                        <TableCell className="text-muted-foreground">{snack.store || "-"}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium text-[#820909] bg-[#fcfcfc1a]">
                            {snack.points} pts
                          </span>
                        </TableCell>
                        <TableCell>
                          {snack.link && (
                            <a 
                              href={snack.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <SnackFormDialog 
                              snack={snack} 
                              trigger={
                                <Button variant="ghost" size="icon" className="hover:text-primary hover:bg-primary/10">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              }
                            />
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will delete {snack.name} and remove it from all family lists. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => deleteMutation.mutate(snack.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
