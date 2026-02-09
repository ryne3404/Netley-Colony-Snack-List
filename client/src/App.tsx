import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CreateFamilyDialog } from "@/components/CreateFamilyDialog";
import { useState } from "react";
import NotFound from "@/pages/not-found";

// Page Imports
import ManageSnacks from "@/pages/ManageSnacks";
import FamilyDetail from "@/pages/FamilyDetail";
import MasterList from "@/pages/MasterList";

function Router() {
  const [createFamilyOpen, setCreateFamilyOpen] = useState(false);

  // Helper component to handle the dialog state via URL
  const CreateFamilyRoute = () => {
    setCreateFamilyOpen(true);
    // Render nothing here, the dialog is global or handled below
    // But actually, we want to redirect back to master list if they cancel
    // This is a bit tricky with wouter without a layout component, 
    // so let's just handle it via the state passed to the dialog
    return <Redirect to="/admin/master-list" />;
  };

  return (
    <>
      <Switch>
        <Route path="/" component={() => <Redirect to="/admin/master-list" />} />
        
        {/* Admin Routes */}
        <Route path="/admin/snacks" component={ManageSnacks} />
        <Route path="/admin/master-list" component={MasterList} />
        
        {/* Helper route to trigger create dialog */}
        <Route path="/admin/families/new" component={CreateFamilyRoute} />

        {/* Family Routes */}
        <Route path="/family/:id" component={FamilyDetail} />

        {/* Fallback */}
        <Route component={NotFound} />
      </Switch>

      <CreateFamilyDialog 
        open={createFamilyOpen} 
        onOpenChange={setCreateFamilyOpen} 
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
