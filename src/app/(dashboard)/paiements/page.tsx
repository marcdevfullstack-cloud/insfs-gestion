"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Eye,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Loader2,
  TrendingUp,
} from "lucide-react";
import type { Payment, PaginatedResponse, Enrollment, School, AcademicYear } from "@/types";

function formatFcfa(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " M FCFA";
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

const STATUS_COLORS: Record<string, string> = {
  EN_COURS: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  VALIDE:   "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  ANNULE:   "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  EN_COURS: "En cours",
  VALIDE:   "Validée",
  ANNULE:   "Annulée",
};

export default function PaiementsPage() {
  const [page, setPage] = useState(1);
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  const { data: schools } = useQuery({
    queryKey: ["schools"],
    queryFn: () => api.get<School[]>("/schools").then((r) => r.data),
  });

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => api.get<AcademicYear[]>("/academic-years").then((r) => r.data),
  });

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["enrollments-payments", page, filterSchool, filterYear],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (filterSchool !== "all") params.set("school_id", filterSchool);
      if (filterYear !== "all") params.set("academic_year_id", filterYear);
      return api.get<PaginatedResponse<Enrollment>>(`/enrollments?${params}`).then((r) => r.data);
    },
  });

  const { data: allPayments } = useQuery({
    queryKey: ["all-payments-summary"],
    queryFn: () => api.get<Payment[]>("/payments").then((r) => r.data),
  });

  const totalCollected = allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const validatedCount = enrollments?.data.filter((e) => e.status === "VALIDE").length ?? 0;

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Paiements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Suivi financier des inscriptions</p>
        </div>

        {/* Stats rapides */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Total collecté</div>
              <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                {formatFcfa(totalCollected)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <TrendingUp className="w-4 h-4 text-primary shrink-0" />
            <div>
              <div className="text-xs text-primary/70">Validées</div>
              <div className="text-sm font-bold text-primary">{validatedCount} inscriptions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card className="bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={filterSchool} onValueChange={(v) => { setFilterSchool(v); setPage(1); }}>
              <SelectTrigger className="w-48 bg-background border-border">
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
              <SelectTrigger className="w-44 bg-background border-border">
                <SelectValue placeholder="Toutes les années" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les années</SelectItem>
                {academicYears?.map((y) => (
                  <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterSchool !== "all" || filterYear !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilterSchool("all"); setFilterYear("all"); setPage(1); }}
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
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            Inscriptions — suivi financier
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : enrollments?.data.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aucune inscription trouvée</p>
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
                        École / Année
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
                          <div className="font-medium text-foreground">
                            <Badge variant="outline" className="font-mono text-xs mr-1.5">
                              {enrollment.school?.code}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {enrollment.academic_year?.label}
                          </div>
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
                              Gérer
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
