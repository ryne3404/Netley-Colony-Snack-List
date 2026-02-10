import { Link, useLocation } from "wouter";
import { useFamilies } from "@/hooks/use-families";
import { 
  LayoutDashboard, 
  ShoppingBasket, 
  Users, 
  PlusCircle, 
  Settings,
  Tags
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { data: families } = useFamilies();

  const NavItem = ({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active?: boolean }) => (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group shadow-lg shadow-primary/25 font-medium text-[#ffffff] bg-[#ffffff]">
      <Icon className={cn("w-5 h-5", active ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="w-64 h-screen bg-muted/30 border-r border-border flex flex-col fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-display bg-gradient-to-r from-primary to-accent bg-clip-text font-normal text-[#820909]">Netley Colony Snacks
</h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium">Family Ordering System</p>
      </div>
      <div className="px-3 space-y-1">
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-2">Admin</p>
        <NavItem 
          href="/admin/master-list" 
          icon={ShoppingBasket} 
          label="Master List" 
          active={location === "/admin/master-list"} 
        />
        <NavItem 
          href="/admin/snacks" 
          icon={LayoutDashboard} 
          label="Manage Snacks" 
          active={location === "/admin/snacks"} 
        />
        <NavItem 
          href="/admin/categories" 
          icon={Tags} 
          label="Manage Categories" 
          active={location === "/admin/categories"} 
        />
      </div>
      <div className="px-3 mt-8 space-y-1 flex-1">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Families</p>
          <Link href="/admin/families/new" className="text-muted-foreground hover:text-primary transition-colors">
            <PlusCircle className="w-4 h-4" />
          </Link>
        </div>
        
        {families?.map((family) => (
          <NavItem
            key={family.id}
            href={`/family/${family.id}`}
            icon={Users}
            label={family.name}
            active={location === `/family/${family.id}`}
          />
        ))}

        {families?.length === 0 && (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center bg-muted/50 rounded-lg border border-dashed border-border">
            No families yet
          </div>
        )}
      </div>
      <div className="p-4 mt-auto border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
          <Settings className="w-4 h-4" />
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
