"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CreditCard, Eye, ChevronLeft, ChevronRight, Banknote,
  Loader2, TrendingUp, X, CheckCircle, Clock, BarChart3, Printer,
} from "lucide-react";
import type { Payment, PaginatedResponse, Enrollment, School, AcademicYear } from "@/types";
import { getSchool, SCHOOL_CONFIG } from "@/lib/schools";
import { cn } from "@/lib/utils";

function formatFcfa(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " M FCFA";
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  EN_COURS: {
    label: "En cours",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  },
  VALIDE: {
    label: "Validée",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
  },
  ANNULE: {
    label: "Annulée",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800",
  },
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
  const enCoursCount = enrollments?.data.filter((e) => e.status === "EN_COURS").length ?? 0;
  const activeFilters = [filterSchool, filterYear].filter((f) => f !== "all").length;

  const handlePrint = () => {
    if (!enrollments?.data) return;
    const rows = enrollments.data.map((e, i) => `
      <tr>
        <td>${(page - 1) * 20 + i + 1}</td>
        <td>${e.student ? `${e.student.last_name} ${e.student.first_name}` : "—"}</td>
        <td>${e.student?.matricule ?? "—"}</td>
        <td>${e.school?.code ?? "—"}</td>
        <td>${e.academic_year?.label ?? "—"}</td>
        <td>${STATUS_CONFIG[e.status]?.label ?? e.status}</td>
        <td>${e.total_paid !== undefined ? new Intl.NumberFormat("fr-FR").format(e.total_paid) + " FCFA" : "—"}</td>
      </tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Suivi Paiements</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;color:#111}h1{font-size:16px;margin-bottom:4px}p{color:#666;margin-bottom:12px}
    table{width:100%;border-collapse:collapse}th{background:#f5f5f5;font-weight:600;text-align:left;padding:6px 10px;border-bottom:2px solid #ddd;font-size:11px;text-transform:uppercase}
    td{padding:6px 10px;border-bottom:1px solid #eee}tr:nth-child(even) td{background:#fafafa}
    @media print{body{margin:12mm}}</style></head>
    <body><h1>Suivi Financier — INSFS</h1>
    <p>Imprimé le ${new Date().toLocaleDateString("fr-FR")} · ${enrollments.total} inscription(s)</p>
    <table><thead><tr><th>#</th><th>Étudiant</th><th>Matricule</th><th>École</th><th>Année</th><th>Statut</th><th>Payé</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`;
    const w = window.open("", "_blank", "width=900,height=650");
    w?.document.write(html);
    w?.document.close();
    setTimeout(() => w?.print(), 400);
  };

  const statCards = [
    {
      label: "Total collecté",
      value: formatFcfa(totalCollected),
      icon: Banknote,
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-t-emerald-500",
    },
    {
      label: "Inscriptions validées",
      value: String(validatedCount),
      icon: CheckCircle,
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-t-primary",
    },
    {
      label: "En cours",
      value: String(enCoursCount),
      icon: Clock,
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-t-amber-500",
    },
    {
      label: "Paiements enregistrés",
      value: String(allPayments?.length ?? 0),
      icon: BarChart3,
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-t-blue-500",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-1 h-6 rounded-full bg-emerald-500" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Paiements</h1>
        </div>
        <p className="text-sm text-muted-foreground pl-3">Suivi financier des inscriptions</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={cn("bg-card shadow-sm border-t-4 rounded-2xl", s.border)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                  <div className={cn("p-1.5 rounded-lg", s.bg)}>
                    <Icon className={cn("w-3.5 h-3.5", s.text)} />
                  </div>
                </div>
                <div className={cn("text-xl font-bold", s.text)}>{s.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterSchool} onValueChange={(v) => { setFilterSchool(v); setPage(1); }}>
          <SelectTrigger className="w-48 h-9 bg-background border-border rounded-lg text-sm">
            <SelectValue placeholder="Toutes les écoles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les écoles</SelectItem>
            {schools?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="flex items-center gap-1.5">
                  <span>{SCHOOL_CONFIG[s.code]?.icon ?? "🏢"}</span>
                  {s.code} — {s.name}
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
            onClick={() => { setFilterSchool("all"); setFilterYear("all"); setPage(1); }}
            className="h-9 px-3 text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* ── Table ── */}
      <Card className="bg-card shadow-sm rounded-2xl overflow-hidden border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Inscriptions — suivi financier</span>
          {enrollments && (
            <span className="text-xs text-muted-foreground">
              {enrollments.total} inscription{enrollments.total !== 1 ? "s" : ""}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={!enrollments?.data?.length}
            className="ml-auto h-8 px-3 gap-1.5 rounded-lg text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimer
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : enrollments?.data.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 opacity-30" />
            </div>
            <p className="font-semibold text-foreground">Aucune inscription trouvée</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">
                      #
                    </th>
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
                      Statut
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrollments?.data.map((enrollment, idx) => {
                    const schoolCode = enrollment.school?.code;
                    const schoolCfg = getSchool(schoolCode);
                    const statusCfg = STATUS_CONFIG[enrollment.status];
                    const initials = enrollment.student
                      ? `${enrollment.student.last_name[0] ?? ""}${enrollment.student.first_name[0] ?? ""}`.toUpperCase()
                      : "??";
                    const rowNumber = (page - 1) * 20 + idx + 1;

                    return (
                      <tr
                        key={enrollment.id}
                        className={cn(
                          "hover:bg-accent/40 transition-colors group border-l-4",
                          schoolCfg.rowBorder
                        )}
                      >
                        {/* Numéro */}
                        <td className="px-4 py-3.5 text-xs text-muted-foreground/60 font-mono w-10">
                          {rowNumber}
                        </td>
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
                          <span className="text-sm text-foreground">{enrollment.academic_year?.label ?? "—"}</span>
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-3.5">
                          {statusCfg ? (
                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", statusCfg.badge)}>
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
