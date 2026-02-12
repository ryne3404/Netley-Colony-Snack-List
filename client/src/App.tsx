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
import ManageCategories from "@/pages/ManageCategories";
import FamilyDetail from "@/pages/FamilyDetail";
import MasterList from "@/pages/MasterList";
import LoginPage from "@/pages/LoginPage";

function Router() {
  const [createFamilyOpen, setCreateFamilyOpen] = useState(false);

  // Simple auth check
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route component={() => <Redirect to="/login" />} />
      </Switch>
    );
  }

  // Helper component to handle the dialog state via URL
  const CreateFamilyRoute = () => {
    setCreateFamilyOpen(true);
    return <Redirect to="/admin/master-list" />;
  };

  return (
    <>
      <Switch>
        <Route path="/login" component={() => <Redirect to={user.role === 'admin' ? "/admin/master-list" : `/family/${user.id}`} />} />
        <Route path="/" component={() => <Redirect to={user.role === 'admin' ? "/admin/master-list" : `/family/${user.id}`} />} />
        
        {/* Admin Routes */}
        <Route path="/admin/snacks">
          {user.role === 'admin' ? <ManageSnacks /> : <Redirect to={`/family/${user.id}`} />}
        </Route>
        <Route path="/admin/categories">
          {user.role === 'admin' ? <ManageCategories /> : <Redirect to={`/family/${user.id}`} />}
        </Route>
        <Route path="/admin/master-list">
          {user.role === 'admin' ? <MasterList /> : <Redirect to={`/family/${user.id}`} />}
        </Route>
        
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
