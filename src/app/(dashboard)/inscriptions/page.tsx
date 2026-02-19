"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Loader2,
  Filter,
} from "lucide-react";
import type { PaginatedResponse, Enrollment, School, AcademicYear } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  EN_COURS: "En cours",
  VALIDE:   "Validée",
  ANNULE:   "Annulée",
};

const STATUS_COLORS: Record<string, string> = {
  EN_COURS: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  VALIDE:   "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  ANNULE:   "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const QUALITY_LABELS: Record<string, string> = {
  CD: "Concours Direct",
  CP: "Concours Prof.",
  FC: "Formation Continue",
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

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Inscriptions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {enrollments
              ? `${enrollments.total} inscription${enrollments.total !== 1 ? "s" : ""} au total`
              : "Chargement..."}
          </p>
        </div>
        {canCreate && (
          <Link href="/etudiants">
            <Button className="bg-green-700 hover:bg-green-800 text-white gap-2 shadow-sm">
              <PlusCircle className="w-4 h-4" />
              Nouvelle inscription
            </Button>
          </Link>
        )}
      </div>

      {/* Filtres */}
      <Card className="bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
              <Filter className="w-4 h-4" />
              Filtres
              {activeFilters > 0 && (
                <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                  {activeFilters}
                </Badge>
              )}
            </div>

            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un étudiant..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 bg-background border-border focus:border-primary"
              />
            </div>

            <Select value={filterSchool} onValueChange={(v) => { setFilterSchool(v); setPage(1); }}>
              <SelectTrigger className="w-44 bg-background border-border">
                <SelectValue placeholder="Toutes les écoles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les écoles</SelectItem>
                {schools?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setPage(1); }}>
              <SelectTrigger className="w-40 bg-background border-border">
                <SelectValue placeholder="Toutes les années" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les années</SelectItem>
                {academicYears?.map((y) => (
                  <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="w-36 bg-background border-border">
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="EN_COURS">En cours</SelectItem>
                <SelectItem value="VALIDE">Validée</SelectItem>
                <SelectItem value="ANNULE">Annulée</SelectItem>
              </SelectContent>
            </Select>

            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilterSchool("all"); setFilterYear("all"); setFilterStatus("all"); setPage(1); }}
                className="text-muted-foreground hover:text-foreground"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card className="bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            Liste des inscriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : enrollments?.data.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aucune inscription trouvée</p>
              <p className="text-sm mt-1 text-muted-foreground/70">
                {activeFilters > 0 ? "Essayez de modifier vos filtres" : "Aucune inscription dans le système"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Étudiant
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        École
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Année
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Qualité
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {enrollments?.data.map((enrollment) => (
                      <tr
                        key={enrollment.id}
                        className="hover:bg-accent/40 transition-colors group"
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-foreground">
                            {enrollment.student
                              ? `${enrollment.student.last_name} ${enrollment.student.first_name}`
                              : "—"}
                          </div>
                          <div className="text-xs text-primary font-mono mt-0.5">
                            {enrollment.student?.matricule}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant="outline" className="font-mono text-xs">
                            {enrollment.school?.code ?? "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-foreground">
                          {enrollment.academic_year?.label ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {QUALITY_LABELS[enrollment.quality] ?? enrollment.quality}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant="outline" className={STATUS_COLORS[enrollment.status]}>
                            {STATUS_LABELS[enrollment.status] ?? enrollment.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link href={`/inscriptions/${enrollment.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Eye className="w-4 h-4 mr-1.5" />
                              Voir
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {enrollments && enrollments.last_page > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    {enrollments.from}–{enrollments.to} sur {enrollments.total}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page === enrollments.last_page} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
