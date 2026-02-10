import { Sidebar } from "@/components/Sidebar";
import { useMasterList } from "@/hooks/use-selections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, ShoppingBag, CheckCircle2 } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function MasterList() {
  const { data: list, isLoading } = useMasterList();

  const totalItems = list?.reduce((sum, item) => sum + item.totalQuantity, 0) || 0;
  const totalPoints = list?.reduce((sum, item) => sum + item.totalPoints, 0) || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-screen bg-muted/20">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 overflow-y-auto print:ml-0 print:p-0">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div className="flex items-center justify-between print:hidden">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Master Shopping List</h1>
              <p className="text-muted-foreground mt-1">Aggregate list of all requested snacks across families.</p>
            </div>
            <Button onClick={handlePrint} className="bg-primary text-white shadow-lg shadow-primary/20">
              <Download className="w-4 h-4 mr-2" />
              Print / PDF
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 print:hidden">
            <Card className="bg-white border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Items to Buy</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full text-[#37d633] bg-[#ffffff]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Points Value</p>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border shadow-lg print:shadow-none print:border-none">
            <CardHeader className="border-b border-border/50 bg-muted/30 print:hidden">
              <CardTitle>Shopping List</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] print:hidden">Check</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead className="text-right">Total Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : list?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No selections made yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    list?.map((item) => (
                      <TableRow key={item.snackId} className="group hover:bg-muted/10">
                        <TableCell className="print:hidden">
                          <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                        </TableCell>
                        <TableCell className="font-medium text-lg text-foreground">
                          {item.snackName}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium">
                          {item.store || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-block px-3 py-1 bg-primary/10 text-primary font-bold rounded-lg text-lg min-w-[3rem] text-center">
                            {item.totalQuantity}
                          </span>
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
