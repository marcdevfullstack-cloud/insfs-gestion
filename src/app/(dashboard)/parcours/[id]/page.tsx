"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  GraduationCap,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  User,
} from "lucide-react";
import type { Student } from "@/types";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  EN_COURS: <Clock className="w-3.5 h-3.5 text-amber-400" />,
  VALIDE: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  ANNULE: <XCircle className="w-3.5 h-3.5 text-red-400" />,
};

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

function formatFcfa(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

export default function ParcoursPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: student, isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: () => api.get<Student>(`/students/${id}`).then((r) => r.data),
  });

  const handleDownloadFiche = async () => {
    try {
      const response = await api.get(`/documents/student-record/${id}`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `fiche_${student?.matricule ?? id}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert("Erreur lors de la génération du PDF.");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Chargement...</div>;
  }

  if (!student) {
    return <div className="p-8 text-center text-slate-400">Étudiant introuvable.</div>;
  }

  const sortedEnrollments = [...(student.enrollments ?? [])].sort(
    (a, b) =>
      new Date(b.enrollment_date).getTime() - new Date(a.enrollment_date).getTime()
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Parcours étudiant</h1>
        </div>
        <Button
          onClick={handleDownloadFiche}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:text-white"
        >
          <Download className="w-4 h-4 mr-2 text-purple-400" />
          Fiche de renseignements
        </Button>
      </div>

      {/* En-tête étudiant */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-5">
            {/* Photo ou avatar */}
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt="Photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">
                  {student.last_name} {student.first_name}
                </h2>
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
                  {student.matricule}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                <span>{student.gender === "M" ? "Masculin" : "Féminin"}</span>
                <span>·</span>
                <span>Né(e) le {formatDate(student.date_of_birth)}</span>
                <span>·</span>
                <span>{student.nationality}</span>
                <span>·</span>
                <span className="text-slate-300">{student.status_type}</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                {student.phone && (
                  <span className="text-slate-400">{student.phone}</span>
                )}
                {student.email && (
                  <span className="text-slate-400">{student.email}</span>
                )}
              </div>
            </div>

            <div className="text-right text-sm text-slate-400">
              <div className="text-lg font-bold text-white">
                {sortedEnrollments.length}
              </div>
              <div>inscription(s)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline des inscriptions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Historique des inscriptions
        </h2>

        {sortedEnrollments.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-8 text-center text-slate-400">
              Aucune inscription enregistrée.
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Ligne verticale de la timeline */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-700" />

            <div className="space-y-4">
              {sortedEnrollments.map((enrollment, idx) => {
                const totalPaid =
                  enrollment.payments?.reduce(
                    (sum, p) => sum + Number(p.amount),
                    0
                  ) ?? 0;

                return (
                  <div key={enrollment.id} className="relative pl-14">
                    {/* Pastille timeline */}
                    <div
                      className={`absolute left-3 top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${
                          enrollment.status === "VALIDE"
                            ? "bg-emerald-500/20 border-emerald-500"
                            : enrollment.status === "EN_COURS"
                            ? "bg-amber-500/20 border-amber-500"
                            : "bg-slate-700 border-slate-600"
                        }
                      `}
                    >
                      <GraduationCap className="w-3 h-3 text-slate-300" />
                    </div>

                    <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white">
                                {enrollment.academic_year?.label ?? "—"}
                              </span>
                              <Badge
                                variant="outline"
                                className="border-slate-600 text-slate-300 text-xs"
                              >
                                {enrollment.school?.code ?? "—"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs flex items-center gap-1 ${STATUS_COLORS[enrollment.status]}`}
                              >
                                {STATUS_ICONS[enrollment.status]}
                                {STATUS_LABELS[enrollment.status]}
                              </Badge>
                            </div>

                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div>
                                <div className="text-xs text-slate-500">Année d&apos;étude</div>
                                <div className="text-slate-300">
                                  {enrollment.year_of_study}e année
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">Qualité</div>
                                <div className="text-slate-300">
                                  {enrollment.quality}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">Date</div>
                                <div className="text-slate-300">
                                  {formatDate(enrollment.enrollment_date)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" /> Payé
                                </div>
                                <div
                                  className={
                                    totalPaid > 0 ? "text-emerald-400" : "text-slate-500"
                                  }
                                >
                                  {formatFcfa(totalPaid)}
                                </div>
                              </div>
                            </div>

                            {/* Paiements détaillés */}
                            {enrollment.payments && enrollment.payments.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {enrollment.payments.map((p) => (
                                  <span
                                    key={p.id}
                                    className="text-xs bg-slate-900/50 border border-slate-700/50 rounded px-2 py-0.5 text-slate-400"
                                  >
                                    T{p.installment_number}: {formatFcfa(Number(p.amount))}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <Link href={`/inscriptions/${enrollment.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-white shrink-0"
                            >
                              Détails
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
