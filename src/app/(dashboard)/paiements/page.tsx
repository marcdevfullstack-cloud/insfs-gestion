"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";
import type { Payment, PaginatedResponse, Enrollment, School, AcademicYear } from "@/types";

function formatFcfa(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  FRAIS_INSCRIPTION: "Inscription",
  FRAIS_SCOLARITE: "Scolarité",
};

export default function PaiementsPage() {
  const { user } = useAuth();
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

  // Les paiements viennent à travers les inscriptions filtrées
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["enrollments-payments", page, filterSchool, filterYear],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (filterSchool !== "all") params.set("school_id", filterSchool);
      if (filterYear !== "all") params.set("academic_year_id", filterYear);
      return api
        .get<PaginatedResponse<Enrollment>>(`/enrollments?${params}`)
        .then((r) => r.data);
    },
  });

  // Stats globales (juste pour l'en-tête)
  const { data: allPayments } = useQuery({
    queryKey: ["all-payments-summary"],
    queryFn: () => api.get<Payment[]>("/payments").then((r) => r.data),
  });

  const totalCollected =
    allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Paiements</h1>
          <p className="text-slate-400 mt-1">
            Suivi des paiements par inscription
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
          <Banknote className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-xs text-emerald-400/70">Total collecté</div>
            <div className="text-sm font-bold text-emerald-400">
              {formatFcfa(totalCollected)}
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Select
              value={filterSchool}
              onValueChange={(v) => { setFilterSchool(v); setPage(1); }}
            >
              <SelectTrigger className="w-44 bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="Toutes les écoles" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Toutes les écoles</SelectItem>
                {schools?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterYear}
              onValueChange={(v) => { setFilterYear(v); setPage(1); }}
            >
              <SelectTrigger className="w-40 bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="Toutes les années" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Toutes les années</SelectItem>
                {academicYears?.map((y) => (
                  <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des inscriptions avec paiements */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-400" />
            Inscriptions — suivi financier
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Chargement...</div>
          ) : enrollments?.data.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Aucune inscription trouvée.
            </div>
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
                        École / Année
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
                          <div className="text-slate-300 text-sm">
                            {enrollment.school?.code}
                          </div>
                          <div className="text-xs text-slate-400">
                            {enrollment.academic_year?.label}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={
                              enrollment.status === "VALIDE"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : enrollment.status === "EN_COURS"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }
                          >
                            {enrollment.status === "EN_COURS"
                              ? "En cours"
                              : enrollment.status === "VALIDE"
                              ? "Validée"
                              : "Annulée"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/inscriptions/${enrollment.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-white"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Gérer
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
