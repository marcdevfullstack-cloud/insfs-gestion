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
} from "lucide-react";
import type { PaginatedResponse, Enrollment, School, AcademicYear } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  EN_COURS: "En cours",
  VALIDE: "Validée",
  ANNULE: "Annulée",
};

const STATUS_COLORS: Record<string, string> = {
  EN_COURS: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  VALIDE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ANNULE: "bg-red-500/10 text-red-400 border-red-500/20",
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
      return api
        .get<PaginatedResponse<Enrollment>>(`/enrollments?${params}`)
        .then((r) => r.data);
    },
  });

  const canCreateEnrollment = user?.role === "ADMIN" || user?.role === "SCOLARITE";

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inscriptions</h1>
          <p className="text-slate-400 mt-1">
            {enrollments?.total ?? 0} inscription(s) au total
          </p>
        </div>
        {canCreateEnrollment && (
          <Link href="/etudiants">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Nouvelle inscription
            </Button>
          </Link>
        )}
      </div>

      {/* Filtres */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un étudiant..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-900 border-slate-600 text-white"
                />
              </div>
            </div>

            <Select value={filterSchool} onValueChange={(v) => { setFilterSchool(v); setPage(1); }}>
              <SelectTrigger className="w-44 bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="École" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Toutes les écoles</SelectItem>
                {schools?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setPage(1); }}>
              <SelectTrigger className="w-40 bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Toutes les années</SelectItem>
                {academicYears?.map((y) => (
                  <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="w-36 bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="EN_COURS">En cours</SelectItem>
                <SelectItem value="VALIDE">Validée</SelectItem>
                <SelectItem value="ANNULE">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            Liste des inscriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Chargement...</div>
          ) : enrollments?.data.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Aucune inscription trouvée.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Étudiant
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                        École
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Année
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Qualité
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Statut
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments?.data.map((enrollment) => (
                      <tr
                        key={enrollment.id}
                        className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">
                            {enrollment.student
                              ? `${enrollment.student.last_name} ${enrollment.student.first_name}`
                              : "—"}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {enrollment.student?.matricule}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className="border-slate-600 text-slate-300 font-normal"
                          >
                            {enrollment.school?.code ?? "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-sm">
                          {enrollment.academic_year?.label ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {QUALITY_LABELS[enrollment.quality] ?? enrollment.quality}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={STATUS_COLORS[enrollment.status]}
                          >
                            {STATUS_LABELS[enrollment.status] ?? enrollment.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/inscriptions/${enrollment.id}`}>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {enrollments && enrollments.last_page > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
                  <span className="text-sm text-slate-400">
                    {enrollments.from}–{enrollments.to} sur {enrollments.total}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="border-slate-700 text-slate-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === enrollments.last_page}
                      onClick={() => setPage((p) => p + 1)}
                      className="border-slate-700 text-slate-300"
                    >
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
