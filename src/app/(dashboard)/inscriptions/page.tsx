"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BookOpen, Search, Eye, ChevronLeft, ChevronRight,
  PlusCircle, Loader2, Filter, X, CheckCircle, Clock, XCircle,
} from "lucide-react";
import type { PaginatedResponse, Enrollment, School, AcademicYear } from "@/types";
import { getSchool, SCHOOL_CONFIG } from "@/lib/schools";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; badge: string }> = {
  EN_COURS: {
    label: "En cours",
    icon: <Clock className="w-3 h-3" />,
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  },
  VALIDE: {
    label: "Validée",
    icon: <CheckCircle className="w-3 h-3" />,
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
  },
  ANNULE: {
    label: "Annulée",
    icon: <XCircle className="w-3 h-3" />,
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800",
  },
};

const QUALITY_CONFIG: Record<string, { label: string; badge: string }> = {
  CD: {
    label: "Concours Direct",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  },
  CP: {
    label: "Conc. Professionnel",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800",
  },
  FC: {
    label: "Formation Continue",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
  },
};

export default function InscriptionsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: schools } = useQuery({
    queryKey: ["schools"],
    queryFn: () => api.get<School[]>("/schools").then((r) => r.data),
  });

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => api.get<AcademicYear[]>("/academic-years").then((r) => r.data),
  });

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["enrollments", page, filterSchool, filterYear, filterStatus],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), per_page: "15" });
      if (filterSchool !== "all") params.set("school_id", filterSchool);
      if (filterYear !== "all") params.set("academic_year_id", filterYear);
      if (filterStatus !== "all") params.set("status", filterStatus);
      return api.get<PaginatedResponse<Enrollment>>(`/enrollments?${params}`).then((r) => r.data);
    },
  });

  const canCreate = user?.role === "ADMIN" || user?.role === "SCOLARITE";
  const activeFilters = [filterSchool, filterYear, filterStatus].filter((f) => f !== "all").length;

  const statusCounts = {
    EN_COURS: enrollments?.data.filter((e) => e.status === "EN_COURS").length ?? 0,
    VALIDE:   enrollments?.data.filter((e) => e.status === "VALIDE").length ?? 0,
    ANNULE:   enrollments?.data.filter((e) => e.status === "ANNULE").length ?? 0,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1 h-6 rounded-full bg-orange-500" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Inscriptions</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-3">
            {enrollments
              ? `${enrollments.total} inscription${enrollments.total !== 1 ? "s" : ""} au total`
              : "Chargement..."}
          </p>
        </div>
        {canCreate && (
          <Link href="/etudiants">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm rounded-xl h-10 px-5">
              <PlusCircle className="w-4 h-4" />
              Nouvelle inscription
            </Button>
          </Link>
        )}
      </div>

      {/* ── Status pills summary ── */}
      {enrollments && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setFilterStatus(filterStatus === key ? "all" : key); setPage(1); }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                filterStatus === key
                  ? cfg.badge + " ring-2 ring-offset-1 ring-current/30"
                  : "bg-muted text-muted-foreground border-border hover:border-muted-foreground/30"
              )}
            >
              {cfg.icon}
              {cfg.label}
              <span className={cn(
                "ml-0.5 px-1.5 py-0.5 rounded text-xs font-bold",
                filterStatus === key ? "bg-white/30 dark:bg-black/20" : "bg-background"
              )}>
                {statusCounts[key as keyof typeof statusCounts]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Filtres ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
          <Filter className="w-4 h-4" />
          <span>Filtres</span>
          {activeFilters > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {activeFilters}
            </span>
          )}
        </div>

        {/* Recherche */}
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un étudiant..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-9 text-sm bg-background border-border rounded-lg"
          />
        </div>

        <Select value={filterSchool} onValueChange={(v) => { setFilterSchool(v); setPage(1); }}>
          <SelectTrigger className="w-44 h-9 bg-background border-border rounded-lg text-sm">
            <SelectValue placeholder="Toutes les écoles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les écoles</SelectItem>
            {schools?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="flex items-center gap-1.5">
                  <span>{SCHOOL_CONFIG[s.code]?.icon ?? "🏢"}</span>
                  {s.code}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9 bg-background border-border rounded-lg text-sm">
            <SelectValue placeholder="Toutes les années" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les années</SelectItem>
            {academicYears?.map((y) => (
              <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterSchool("all"); setFilterYear("all"); setFilterStatus("all"); setPage(1); }}
            className="h-9 px-3 text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* ── Table ── */}
      <Card className="bg-card shadow-sm rounded-2xl overflow-hidden border border-border">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement des inscriptions...</p>
          </div>
        ) : enrollments?.data.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 opacity-30" />
            </div>
            <p className="font-semibold text-foreground">Aucune inscription trouvée</p>
            <p className="text-sm mt-1">
              {activeFilters > 0 ? "Essayez de modifier vos filtres" : "Aucune inscription dans le système"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Étudiant
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      École
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Année
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Qualité
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrollments?.data.map((enrollment) => {
                    const schoolCode = enrollment.school?.code;
                    const schoolCfg = getSchool(schoolCode);
                    const statusCfg = STATUS_CONFIG[enrollment.status];
                    const qualityCfg = QUALITY_CONFIG[enrollment.quality];
                    const initials = enrollment.student
                      ? `${enrollment.student.last_name[0] ?? ""}${enrollment.student.first_name[0] ?? ""}`.toUpperCase()
                      : "??";

                    return (
                      <tr
                        key={enrollment.id}
                        className={cn(
                          "hover:bg-accent/40 transition-colors group border-l-4",
                          schoolCfg.rowBorder
                        )}
                      >
                        {/* Étudiant */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                              schoolCfg.avatar
                            )}>
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {enrollment.student
                                  ? `${enrollment.student.last_name} ${enrollment.student.first_name}`
                                  : "—"}
                              </div>
                              <div className="text-xs font-mono text-primary/80 mt-0.5">
                                {enrollment.student?.matricule}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* École */}
                        <td className="px-4 py-3.5">
                          {schoolCode ? (
                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold", schoolCfg.badge)}>
                              <span>{schoolCfg.icon}</span>
                              {schoolCode}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Année */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-foreground">
                            {enrollment.academic_year?.label ?? "—"}
                          </span>
                        </td>

                        {/* Qualité */}
                        <td className="px-4 py-3.5">
                          {qualityCfg ? (
                            <span className={cn("inline-flex px-2 py-0.5 rounded text-xs font-medium", qualityCfg.badge)}>
                              {enrollment.quality}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">{enrollment.quality}</span>
                          )}
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-3.5">
                          {statusCfg ? (
                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", statusCfg.badge)}>
                              {statusCfg.icon}
                              {statusCfg.label}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">{enrollment.status}</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3.5 text-right">
                          <Link href={`/inscriptions/${enrollment.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Gérer
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {enrollments && enrollments.last_page > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/30">
                <span className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{enrollments.from}–{enrollments.to}</span> sur{" "}
                  <span className="font-medium text-foreground">{enrollments.total}</span>
                </span>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="h-8 w-8 p-0 rounded-lg">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page === enrollments.last_page} onClick={() => setPage((p) => p + 1)} className="h-8 w-8 p-0 rounded-lg">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
