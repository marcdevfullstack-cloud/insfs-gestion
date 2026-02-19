"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
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
    href: "/parametres",
    label: "Paramètres",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
  SCOLARITE: "bg-green-500/10 text-green-400 border-green-500/20",
  COMPTABILITE: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  SCOLARITE: "Scolarité",
  COMPTABILITE: "Comptabilité",
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 border-r border-slate-700/50">
      {/* Logo INSFS — couleurs ivoiriennes */}
      <div className="p-5 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 overflow-hidden">
          {/* Bande ivoirienne : orange | blanc | vert */}
          <div className="w-full h-full flex">
            <div className="flex-1 bg-orange-500" />
            <div className="flex-1 bg-white flex items-center justify-center">
              <GraduationCap className="w-3 h-3 text-slate-800" />
            </div>
            <div className="flex-1 bg-green-700" />
          </div>
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-wide">INSFS</div>
          <div className="text-xs text-slate-500 leading-tight">Gestion des inscriptions</div>
        </div>
      </div>

      <Separator className="bg-slate-700/50" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-green-700 text-white shadow-lg shadow-green-700/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <Icon className="shrink-0" size={18} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bandeau tricolore discret */}
      <div className="flex h-0.5 mx-3">
        <div className="flex-1 bg-orange-500" />
        <div className="flex-1 bg-white/20" />
        <div className="flex-1 bg-green-700" />
      </div>

      <Separator className="bg-slate-700/50" />

      {/* User info + logout */}
      <div className="p-4 space-y-3">
        {user && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-slate-300">
                {user.full_name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.full_name}</div>
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
          onClick={handleLogout}
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
}
