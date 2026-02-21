"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";

const navItems = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    roles: ["ADMIN", "SCOLARITE", "COMPTABILITE"],
  },
  {
    href: "/etudiants",
    label: "Étudiants",
    icon: Users,
    roles: ["ADMIN", "SCOLARITE", "COMPTABILITE"],
  },
  {
    href: "/inscriptions",
    label: "Inscriptions",
    icon: BookOpen,
    roles: ["ADMIN", "SCOLARITE", "COMPTABILITE"],
  },
  {
    href: "/paiements",
    label: "Paiements",
    icon: CreditCard,
    roles: ["ADMIN", "COMPTABILITE"],
  },
  {
    href: "/documents",
    label: "Documents",
    icon: FileText,
    roles: ["ADMIN", "SCOLARITE", "COMPTABILITE"],
  },
  {
    href: "/parametres",
    label: "Paramètres",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-500 border-red-500/20",
  SCOLARITE: "bg-green-500/10 text-green-600 border-green-500/20",
  COMPTABILITE: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  SCOLARITE: "Scolarité",
  COMPTABILITE: "Comptabilité",
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      logout();
    }
  };

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar border-r border-sidebar-border">
      {/* Logo INSFS */}
      <div className="p-4 flex items-center gap-3">
        <div className="relative w-9 h-9 rounded-xl shrink-0 overflow-hidden shadow-sm border border-border">
          <Image src="/insfs-logo.jpg" alt="INSFS" fill className="object-cover" />
        </div>
        <div>
          <div className="text-sm font-bold text-sidebar-foreground tracking-wide">INSFS</div>
          <div className="text-xs text-muted-foreground leading-tight">Gestion des inscriptions</div>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-green-700 text-white shadow-sm"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="shrink-0" size={17} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bandeau tricolore */}
      <div className="flex h-px mx-3">
        <div className="flex-1 bg-orange-500" />
        <div className="flex-1 bg-sidebar-border" />
        <div className="flex-1 bg-green-700" />
      </div>

      <Separator className="bg-sidebar-border" />

      {/* User + actions */}
      <div className="p-4 space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-1 py-1.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {user.full_name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">{user.full_name}</div>
              <Badge
                variant="outline"
                className={cn("text-xs mt-0.5 font-normal", roleColors[user.role])}
              >
                {roleLabels[user.role]}
              </Badge>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent h-9"
        >
          {theme === "dark" ? (
            <><Sun className="w-4 h-4 mr-2" />Mode clair</>
          ) : (
            <><Moon className="w-4 h-4 mr-2" />Mode sombre</>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-9"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
}
