import { useParams } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { useFamily } from "@/hooks/use-families";
import { useSnacks } from "@/hooks/use-snacks";
import { useSelections, useUpdateSelection } from "@/hooks/use-selections";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCategories } from "@/hooks/use-categories";
import { Loader2, AlertCircle, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";

export default function FamilyDetail() {
  const params = useParams();
  const familyId = Number(params.id);
  const { data: family, isLoading: familyLoading } = useFamily(familyId);
  const { data: snacks, isLoading: snacksLoading } = useSnacks();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: selections, isLoading: selectionsLoading } = useSelections(familyId);
  const updateSelection = useUpdateSelection();
  const [search, setSearch] = useState("");

  // Merge snacks with selections to get quantities
  const snacksWithQuantities = useMemo(() => {
    if (!snacks) return [];
    return snacks.map(snack => {
      const selection = selections?.find(s => s.snackId === snack.id);
      return {
        ...snack,
        quantity: selection?.quantity || 0
      };
    });
  }, [snacks, selections]);

  // Group by category
  const groupedSnacks = useMemo(() => {
    const grouped: Record<string, typeof snacksWithQuantities> = {};
    
    // Sort snacks first by name
    const sorted = [...snacksWithQuantities].sort((a, b) => a.name.localeCompare(b.name));

    sorted.forEach(snack => {
      if (search && !snack.name.toLowerCase().includes(search.toLowerCase()) && !snack.store?.toLowerCase().includes(search.toLowerCase())) {
        return;
      }
      const categoryName = snack.category?.name || "Other";
      if (!grouped[categoryName]) grouped[categoryName] = [];
      grouped[categoryName].push(snack);
    });
    return grouped;
  }, [snacksWithQuantities, search]);

  // Calculate totals
  const totalPointsUsed = useMemo(() => {
    return snacksWithQuantities.reduce((sum, item) => sum + (item.points * item.quantity), 0);
  }, [snacksWithQuantities]);

  const pointsRemaining = (family?.pointsAllowed || 0) - totalPointsUsed;
  const progressValue = family?.pointsAllowed 
    ? Math.min((totalPointsUsed / family.pointsAllowed) * 100, 100) 
    : 0;
  
  const isOverLimit = pointsRemaining < 0;

  const handleQuantityChange = (snackId: number, newQuantity: number) => {
    if (newQuantity < 0) return;
    updateSelection.mutate({
      familyId,
      snackId,
      quantity: newQuantity
    });
  };

  if (familyLoading || snacksLoading || selectionsLoading || categoriesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!family) {
    return <div>Family not found</div>;
  }

  return (
    <div className="flex h-screen bg-muted/20">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
          
          {/* Header Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-2">
              <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg text-3xl text-[#820909] bg-[#ffffff1a]">{family.name}</span>
                <span>Selection List</span>
              </h1>
              <p className="text-muted-foreground text-lg">Select your snacks below. Points are calculated automatically.</p>
            </div>
            
            <Card className="p-6 border-primary/20 bg-gradient-to-br from-white to-primary/5 shadow-lg">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Points Used</p>
                  <p className={`text-3xl font-bold font-display ${isOverLimit ? 'text-destructive' : 'text-primary'}`}>
                    {totalPointsUsed} <span className="text-lg text-muted-foreground font-normal">/ {family.pointsAllowed}</span>
                  </p>
                </div>
                {isOverLimit && (
                  <div className="flex items-center text-destructive text-sm font-bold animate-pulse">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Over Limit!
                  </div>
                )}
              </div>
              <Progress 
                value={progressValue} 
                className={`h-3 ${isOverLimit ? 'bg-destructive/20 [&>div]:bg-destructive' : '[&>div]:bg-primary'}`} 
              />
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Filter snacks by name or store..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white border border-border shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-lg"
            />
          </div>

          {/* Snack Accordion */}
          <Accordion type="multiple" defaultValue={Object.keys(groupedSnacks)} className="space-y-4">
            {Object.entries(groupedSnacks).map(([categoryName, categorySnacks]) => (
              <AccordionItem key={categoryName} value={categoryName} className="border-none">
                <AccordionTrigger className="hover:no-underline bg-white px-6 py-4 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold font-display">{categoryName}</span>
                    <span className="text-sm text-muted-foreground font-normal">({categorySnacks.length} items)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                      {categorySnacks.map((snack) => (
                        <motion.div 
                          key={snack.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className={`
                            overflow-hidden border transition-all duration-300 h-full flex flex-col
                            ${snack.quantity > 0 
                              ? 'border-primary ring-2 ring-primary/10 shadow-lg shadow-primary/5 bg-primary/[0.02]' 
                              : 'border-border hover:border-primary/50 hover:shadow-md'
                            }
                          `}>
                            <div className="aspect-[4/3] bg-muted relative overflow-hidden group">
                              <img 
                                src={snack.imageUrl || `https://placehold.co/400x300/F3F4F6/6B7280?text=${snack.name.substring(0,2).toUpperCase()}`} 
                                alt={snack.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md">
                                {snack.points} pts
                              </div>
                              {snack.store && (
                                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded-md shadow-sm">
                                  {snack.store}
                                </div>
                              )}
                            </div>
                            
                            <div className="p-5 flex flex-col flex-1">
                              <div className="mb-4">
                                <h3 className="font-bold text-lg leading-tight mb-1">{snack.name}</h3>
                                {snack.link && (
                                  <a 
                                    href={snack.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline"
                                  >
                                    View Product Details
                                  </a>
                                )}
                              </div>

                              <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => handleQuantityChange(snack.id, snack.quantity - 1)}
                                    disabled={snack.quantity === 0}
                                  >
                                    -
                                  </Button>
                                  <Input 
                                    type="number" 
                                    value={snack.quantity} 
                                    onChange={(e) => handleQuantityChange(snack.id, parseInt(e.target.value) || 0)}
                                    className="w-12 h-8 text-center p-0 border-none bg-transparent font-bold focus:ring-0" 
                                  />
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => handleQuantityChange(snack.id, snack.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                                <div className="text-right">
                                  <span className={`text-sm font-bold ${snack.quantity > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {snack.quantity * snack.points} pts
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
