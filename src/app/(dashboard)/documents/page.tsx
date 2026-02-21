"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Download, Loader2, Search, X, BookOpen,
  CheckCircle, Clock, Filter,
} from "lucide-react";
import type { PaginatedResponse, Enrollment, School, AcademicYear } from "@/types";
import { getSchool, SCHOOL_CONFIG } from "@/lib/schools";
import { cn } from "@/lib/utils";

function formatDate(d: string) { return new Date(d).toLocaleDateString("fr-FR"); }

export default function DocumentsPage() {
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  const { data: schools } = useQuery({
    queryKey: ["schools"],
    queryFn: () => api.get<School[]>("/schools").then((r) => r.data),
  });

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => api.get<AcademicYear[]>("/academic-years").then((r) => r.data),
  });

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["enrollments-docs", page, filterSchool, filterYear],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), per_page: "15" });
      if (filterSchool !== "all") params.set("school_id", filterSchool);
      if (filterYear !== "all") params.set("academic_year_id", filterYear);
      return api.get<PaginatedResponse<Enrollment>>(`/enrollments?${params}`).then((r) => r.data);
    },
  });

  const activeFilters = [filterSchool, filterYear].filter((f) => f !== "all").length;

  // Filtrage client par recherche nom/matricule
  const filtered = search
    ? (enrollments?.data ?? []).filter((e) => {
        const q = search.toLowerCase();
        const name = `${e.student?.last_name ?? ""} ${e.student?.first_name ?? ""}`.toLowerCase();
        return name.includes(q) || (e.student?.matricule ?? "").toLowerCase().includes(q);
      })
    : (enrollments?.data ?? []);

  const handleDownload = async (type: "certificate" | "student-record", enrollment: Enrollment) => {
    const key = `${type}-${enrollment.id}`;
    setPdfLoading(key);
    try {
      const url = type === "certificate"
        ? `/documents/certificate/${enrollment.id}`
        : `/documents/student-record/${enrollment.student_id}`;
      const response = await api.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = type === "certificate"
        ? `certificat_${enrollment.student?.matricule}.pdf`
        : `fiche_${enrollment.student?.matricule}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setPdfLoading(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-1 h-6 rounded-full bg-violet-500" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Documents</h1>
        </div>
        <p className="text-sm text-muted-foreground pl-3">
          Génération des documents officiels par inscription
        </p>
      </div>

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
            placeholder="Rechercher par nom ou matricule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-background border-border rounded-lg"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
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
            variant="ghost" size="sm"
            onClick={() => { setFilterSchool("all"); setFilterYear("all"); setPage(1); }}
            className="h-9 px-3 text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* ── Légende ── */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5 text-primary" />
          <span>Certificat d&apos;inscription</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5 text-violet-500" />
          <span>Fiche de renseignements</span>
        </div>
      </div>

      {/* ── Table ── */}
      <Card className="bg-card shadow-sm rounded-2xl overflow-hidden border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Documents par inscription</span>
          {enrollments && (
            <span className="ml-auto text-xs text-muted-foreground">
              {enrollments.total} inscription{enrollments.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 opacity-30" />
            </div>
            <p className="font-semibold text-foreground">Aucune inscription trouvée</p>
            <p className="text-sm mt-1">{search ? `Aucun résultat pour "${search}"` : "Modifiez vos filtres"}</p>
          </div>
        ) : (
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
                    Année / Statut
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Télécharger
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((enrollment) => {
                  const schoolCode = enrollment.school?.code;
                  const schoolCfg = getSchool(schoolCode);
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

                      {/* Année / Statut */}
                      <td className="px-4 py-3.5">
                        <div className="text-sm text-foreground">{enrollment.academic_year?.label ?? "—"}</div>
                        <div className="mt-1">
                          {enrollment.status === "VALIDE" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-3 h-3" />
                              Validée
                            </span>
                          ) : enrollment.status === "EN_COURS" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                              <Clock className="w-3 h-3" />
                              En cours
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <BookOpen className="w-3 h-3" />
                              {enrollment.status}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(enrollment.enrollment_date)}
                        </div>
                      </td>

                      {/* Actions téléchargement */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload("certificate", enrollment)}
                            disabled={pdfLoading === `certificate-${enrollment.id}`}
                            className="h-8 px-3 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
                            title="Certificat d'inscription"
                          >
                            {pdfLoading === `certificate-${enrollment.id}`
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Download className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">Certificat</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload("student-record", enrollment)}
                            disabled={pdfLoading === `student-record-${enrollment.id}`}
                            className="h-8 px-3 text-xs gap-1.5 text-violet-600 border-violet-300/50 hover:bg-violet-500/10"
                            title="Fiche de renseignements"
                          >
                            {pdfLoading === `student-record-${enrollment.id}`
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Download className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">Fiche</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {enrollments && enrollments.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/30">
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{enrollments.from}–{enrollments.to}</span> sur{" "}
              <span className="font-medium text-foreground">{enrollments.total}</span>
            </span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="h-8 px-3 text-xs rounded-lg">
                Précédent
              </Button>
              <Button variant="outline" size="sm" disabled={page === enrollments.last_page} onClick={() => setPage((p) => p + 1)} className="h-8 px-3 text-xs rounded-lg">
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
