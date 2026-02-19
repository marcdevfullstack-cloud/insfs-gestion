"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  School,
  X,
} from "lucide-react";
import type { Student, PaginatedResponse } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";

const genderLabel: Record<string, string> = { M: "Masculin", F: "Féminin" };

const statusColors: Record<string, string> = {
  Fonctionnaire: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "Boursier national": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Boursier étranger": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  "Non-boursier": "bg-muted text-muted-foreground border-border",
};

const schoolNames: Record<string, string> = {
  EES: "École des Éducateurs Spécialisés",
  EEP: "École des Éducateurs Préscolaires",
  EAS: "École des Assistants Sociaux",
  CPPE: "CPPE-PILOTE",
};

export default function EtudiantsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const schoolParam = searchParams.get("school");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { setPage(1); }, [debouncedSearch, schoolParam]);

  const canCreate = user?.role === "ADMIN" || user?.role === "SCOLARITE";

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
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Étudiants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data
              ? `${data.total} étudiant${data.total !== 1 ? "s" : ""}${schoolParam ? ` · ${schoolParam}` : ""}`
              : "Chargement..."}
          </p>
        </div>
        {canCreate && (
          <Link href="/etudiants/nouveau">
            <Button className="bg-green-700 hover:bg-green-800 text-white gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              Nouvel étudiant
            </Button>
          </Link>
        )}
      </div>

      {/* Filtre école actif */}
      {schoolParam && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 w-fit">
          <School className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">{schoolParam}</span>
          {schoolNames[schoolParam] && (
            <span className="text-sm text-green-600/70 dark:text-green-500/70">— {schoolNames[schoolParam]}</span>
          )}
          <Link href="/etudiants" className="ml-1">
            <button className="w-5 h-5 rounded-full flex items-center justify-center text-green-600 hover:bg-green-500/20 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      )}

      {/* Recherche */}
      <Card className="bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par matricule, nom, prénom..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-background border-border focus:border-primary placeholder:text-muted-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Liste des étudiants
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center py-16 text-red-500 text-sm">
              Erreur lors du chargement des données.
            </div>
          ) : data?.data.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aucun étudiant trouvé</p>
              {(search || schoolParam) && (
                <p className="text-sm mt-1 text-muted-foreground/70">
                  {search
                    ? `Aucun résultat pour "${search}"`
                    : `Aucun étudiant pour l'établissement ${schoolParam}`}
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Matricule</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Nom complet</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Genre</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Statut</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Mode d&apos;entrée</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Contact</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((student) => (
                  <TableRow
                    key={student.id}
                    className="border-border hover:bg-accent/50 transition-colors"
                  >
                    <TableCell>
                      <span className="font-mono text-sm text-primary font-semibold">
                        {student.matricule}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {student.last_name} {student.first_name}
                      </div>
                      {student.email && (
                        <div className="text-xs text-muted-foreground mt-0.5">{student.email}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {genderLabel[student.gender]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusColors[student.status_type] || ""}`}>
                        {student.status_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{student.entry_mode}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{student.phone || "—"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/etudiants/${student.id}`}>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        {canCreate && (
                          <Link href={`/etudiants/${student.id}/modifier`}>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.current_page} sur {data.last_page} — {data.total} étudiants</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === data.last_page}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
