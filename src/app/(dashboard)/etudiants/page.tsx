"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import type { Student, PaginatedResponse } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";

const genderLabel: Record<string, string> = { M: "Masculin", F: "Féminin" };
const statusColors: Record<string, string> = {
  Fonctionnaire: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Boursier national": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Boursier étranger": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Non-boursier": "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function EtudiantsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const canCreate = user?.role === "ADMIN" || user?.role === "SCOLARITE";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["students", debouncedSearch, page],
    queryFn: () =>
      api
        .get<PaginatedResponse<Student>>("/students", {
          params: { q: debouncedSearch || undefined, page, per_page: 15 },
        })
        .then((r) => r.data),
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Étudiants</h1>
          <p className="text-slate-400 text-sm mt-1">
            {data ? `${data.total} étudiant${data.total !== 1 ? "s" : ""} au total` : "Chargement..."}
          </p>
        </div>
        {canCreate && (
          <Link href="/etudiants/nouveau">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Nouvel étudiant
            </Button>
          </Link>
        )}
      </div>

      {/* Recherche */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Rechercher par matricule, nom, prénom..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Liste des étudiants
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : isError ? (
            <div className="text-center py-16 text-red-400">
              Erreur lors du chargement des données.
            </div>
          ) : data?.data.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucun étudiant trouvé</p>
              {search && (
                <p className="text-sm mt-1">
                  Aucun résultat pour &quot;{search}&quot;
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-medium">Matricule</TableHead>
                  <TableHead className="text-slate-400 font-medium">Nom complet</TableHead>
                  <TableHead className="text-slate-400 font-medium">Genre</TableHead>
                  <TableHead className="text-slate-400 font-medium">Statut</TableHead>
                  <TableHead className="text-slate-400 font-medium">Mode d&apos;entrée</TableHead>
                  <TableHead className="text-slate-400 font-medium">Contact</TableHead>
                  <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((student) => (
                  <TableRow
                    key={student.id}
                    className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                  >
                    <TableCell>
                      <span className="font-mono text-sm text-blue-400 font-medium">
                        {student.matricule}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-white">
                        {student.last_name} {student.first_name}
                      </div>
                      {student.email && (
                        <div className="text-xs text-slate-500 mt-0.5">{student.email}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-300 text-sm">
                        {genderLabel[student.gender]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusColors[student.status_type] || ""}`}
                      >
                        {student.status_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-400 text-sm">{student.entry_mode}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-400 text-sm">{student.phone || "—"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/etudiants/${student.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white hover:bg-slate-700"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        {canCreate && (
                          <Link href={`/etudiants/${student.id}/modifier`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-white hover:bg-slate-700"
                            >
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
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            Page {data.current_page} sur {data.last_page} — {data.total} étudiants
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === data.last_page}
              className="border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}