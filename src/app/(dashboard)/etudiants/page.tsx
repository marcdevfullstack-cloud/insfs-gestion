"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Search, Eye, Pencil, Loader2, Users,
  ChevronLeft, ChevronRight, X, Phone, Mail,
} from "lucide-react";
import type { Student, PaginatedResponse } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { getSchool, getStudentStatus, SCHOOL_CONFIG } from "@/lib/schools";
import { cn } from "@/lib/utils";

const ENTRY_MODE_SHORT: Record<string, string> = {
  "Concours direct":        "Conc. Direct",
  "Analyse de dossier":     "Dossier",
  "Concours professionnel": "Conc. Prof.",
};

function Avatar({ name, statusType }: { name: string; statusType: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  const { avatar } = getStudentStatus(statusType);
  return (
    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0", avatar)}>
      {initials}
    </div>
  );
}

export default function EtudiantsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const schoolParam = searchParams.get("school");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { setPage(1); }, [debouncedSearch, schoolParam]);

  const canCreate = user?.role === "ADMIN" || user?.role === "SCOLARITE";
  const school = getSchool(schoolParam);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["students", debouncedSearch, page, schoolParam],
    queryFn: () =>
      api.get<PaginatedResponse<Student>>("/students", {
        params: {
          q: debouncedSearch || undefined,
          page,
          per_page: 15,
          school_code: schoolParam || undefined,
        },
      }).then((r) => r.data),
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1 h-6 rounded-full bg-primary" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Étudiants</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-3">
            {data
              ? `${data.total} étudiant${data.total !== 1 ? "s" : ""}${schoolParam ? ` inscrits à ${schoolParam}` : " enregistrés"}`
              : "Chargement..."}
          </p>
        </div>
        {canCreate && (
          <Link href="/etudiants/nouveau">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm rounded-xl h-10 px-5">
              <Plus className="w-4 h-4" />
              Nouvel étudiant
            </Button>
          </Link>
        )}
      </div>

      {/* ── Filtre école actif ── */}
      {schoolParam && (
        <div className={cn(
          "inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-medium",
          school.accentBg, school.accent,
          "border-current/20"
        )}>
          <span className="text-base">{school.icon}</span>
          <span className="font-bold">{schoolParam}</span>
          <span className="opacity-70">— {school.name}</span>
          <Link href="/etudiants">
            <button className="ml-1 w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </Link>
        </div>
      )}

      {/* ── École pills rapides ── */}
      {!schoolParam && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(SCHOOL_CONFIG).map(([code, cfg]) => (
            <Link key={code} href={`/etudiants?school=${code}`}>
              <button className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105",
                cfg.badge
              )}>
                <span>{cfg.icon}</span>
                {code}
              </button>
            </Link>
          ))}
        </div>
      )}

      {/* ── Recherche ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher par matricule, nom, prénom..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10 pr-10 h-11 bg-card border-border focus:border-primary rounded-xl shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <Card className="bg-card shadow-sm rounded-2xl overflow-hidden border border-border">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement des étudiants...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-16 text-red-500 text-sm">
            Erreur lors du chargement des données.
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 opacity-30" />
            </div>
            <p className="font-semibold text-foreground">Aucun étudiant trouvé</p>
            <p className="text-sm mt-1">
              {search ? `Aucun résultat pour "${search}"` : "Aucun étudiant dans cette sélection"}
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Étudiant
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Matricule
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Mode d&apos;entrée
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.data.map((student) => {
                    const statusCfg = getStudentStatus(student.status_type);
                    const initials = `${student.last_name[0] ?? ""}${student.first_name[0] ?? ""}`.toUpperCase();
                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-accent/40 transition-colors group"
                      >
                        {/* Étudiant */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                              statusCfg.avatar
                            )}>
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {student.last_name} {student.first_name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {student.gender === "M" ? "♂ Masculin" : "♀ Féminin"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Matricule */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-mono font-semibold">
                            {student.matricule}
                          </span>
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusCfg.dot)} />
                            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-md", statusCfg.badge)}>
                              {student.status_type}
                            </span>
                          </div>
                        </td>

                        {/* Mode d'entrée */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-muted-foreground">
                            {ENTRY_MODE_SHORT[student.entry_mode] ?? student.entry_mode}
                          </span>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            {student.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3 shrink-0" />
                                {student.phone}
                              </div>
                            )}
                            {student.email && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[140px]">{student.email}</span>
                              </div>
                            )}
                            {!student.phone && !student.email && (
                              <span className="text-xs text-muted-foreground/50">—</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/etudiants/${student.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-xs gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Voir
                              </Button>
                            </Link>
                            {canCreate && (
                              <Link href={`/etudiants/${student.id}/modifier`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg text-xs gap-1.5"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Modifier
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.last_page > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/30">
                <span className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{data.from}–{data.to}</span> sur{" "}
                  <span className="font-medium text-foreground">{data.total}</span> étudiants
                </span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(data.last_page, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                        p === data.current_page
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  {data.last_page > 5 && (
                    <>
                      <span className="text-muted-foreground text-sm">...</span>
                      <button
                        onClick={() => setPage(data.last_page)}
                        className="w-8 h-8 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        {data.last_page}
                      </button>
                    </>
                  )}
                  <div className="flex gap-1 ml-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 1}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page === data.last_page}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
