"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  Calendar,
  DollarSign,
  Plus,
  Pencil,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { AcademicYear, FeeSchedule, School } from "@/types";

type Tab = "grille" | "annees";

type FeeFormData = {
  academic_year_id: string;
  school_id: string;
  student_status: string;
  fee_type: string;
  total_amount: number;
  max_installments: number;
};

const STATUS_OPTIONS = [
  "Fonctionnaire",
  "Boursier national",
  "Boursier étranger",
  "Non-boursier",
];

const FEE_TYPE_LABELS: Record<string, string> = {
  FRAIS_INSCRIPTION: "Frais d'inscription",
  FRAIS_SCOLARITE: "Frais de scolarité",
};

export default function ParametresPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("grille");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FeeSchedule | null>(null);
  const [filterYear, setFilterYear] = useState("");
  const [filterSchool, setFilterSchool] = useState("");

  // ── Queries ─────────────────────────────────────────────────
  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: () => api.get<School[]>("/schools").then((r) => r.data),
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => api.get<AcademicYear[]>("/academic-years").then((r) => r.data),
  });

  const { data: feeSchedules = [], isLoading: feesLoading } = useQuery({
    queryKey: ["fee-schedules", filterYear, filterSchool],
    queryFn: () =>
      api.get<FeeSchedule[]>("/fee-schedules", {
        params: {
          academic_year_id: filterYear || undefined,
          school_id: filterSchool || undefined,
        },
      }).then((r) => r.data),
  });

  // ── Mutations ────────────────────────────────────────────────
  const createFee = useMutation({
    mutationFn: (data: FeeFormData) => api.post("/fee-schedules", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-schedules"] }); setDialogOpen(false); },
  });

  const updateFee = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FeeFormData> }) =>
      api.put(`/fee-schedules/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-schedules"] }); setDialogOpen(false); },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FeeFormData>();

  const openCreate = () => {
    setEditTarget(null);
    reset({
      academic_year_id: academicYears.find((y) => y.is_current)?.id ?? "",
      school_id: "",
      student_status: "",
      fee_type: "",
      total_amount: 0,
      max_installments: 3,
    });
    setDialogOpen(true);
  };

  const openEdit = (fee: FeeSchedule) => {
    setEditTarget(fee);
    reset({
      total_amount: fee.total_amount,
      max_installments: fee.max_installments,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: FeeFormData) => {
    if (editTarget) {
      updateFee.mutate({
        id: editTarget.id,
        data: { total_amount: data.total_amount, max_installments: data.max_installments },
      });
    } else {
      createFee.mutate(data);
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Accès réservé aux administrateurs.
      </div>
    );
  }

  const currentYear = academicYears.find((y) => y.is_current);

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-primary" />
          Paramètres
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Administration de la plateforme INSFS
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit">
        {([
          { key: "grille", label: "Grille tarifaire", icon: DollarSign },
          { key: "annees", label: "Années académiques", icon: Calendar },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          ONGLET — Grille tarifaire
          ══════════════════════════════════════════════════════ */}
      {activeTab === "grille" && (
        <div className="space-y-5">
          {/* Filtres + action */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Toutes les années</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.label}</option>
              ))}
            </select>

            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Tous les établissements</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
              ))}
            </select>

            <div className="ml-auto">
              <Button onClick={openCreate} className="bg-green-700 hover:bg-green-800 text-white gap-2 shadow-sm">
                <Plus className="w-4 h-4" />
                Ajouter un tarif
              </Button>
            </div>
          </div>

          {/* Table */}
          <Card className="bg-card shadow-sm">
            <CardContent className="p-0">
              {feesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : feeSchedules.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">Aucun tarif configuré</p>
                  <p className="text-sm mt-1">Cliquez sur « Ajouter un tarif » pour commencer</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-5 py-3 text-muted-foreground font-medium">Établissement</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Année</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Statut étudiant</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Type</th>
                        <th className="text-right px-4 py-3 text-muted-foreground font-medium">Montant</th>
                        <th className="text-center px-4 py-3 text-muted-foreground font-medium">Tranches</th>
                        <th className="text-right px-4 py-3 text-muted-foreground font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeSchedules.map((fee) => (
                        <tr key={fee.id} className="border-b border-border hover:bg-accent/40 transition-colors">
                          <td className="px-5 py-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              {fee.school?.code ?? "—"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-foreground">{fee.academic_year?.label ?? "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{fee.student_status}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={fee.fee_type === "FRAIS_INSCRIPTION"
                                ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-xs"
                                : "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-xs"}
                            >
                              {FEE_TYPE_LABELS[fee.fee_type]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            {new Intl.NumberFormat("fr-FR").format(fee.total_amount)} FCFA
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground">
                            {fee.max_installments} tranche{fee.max_installments > 1 ? "s" : ""}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(fee)}
                              className="text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ONGLET — Années académiques
          ══════════════════════════════════════════════════════ */}
      {activeTab === "annees" && (
        <div className="space-y-4">
          {/* Résumé année courante */}
          {currentYear && (
            <Card className="bg-card shadow-sm border-l-4 border-l-green-600">
              <CardContent className="p-5 flex items-center gap-4 flex-wrap">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground text-lg">{currentYear.label}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Du {new Date(currentYear.start_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                    {" "}au{" "}
                    {new Date(currentYear.end_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                </div>
                <Badge className="bg-green-600/10 text-green-700 dark:text-green-400 border-green-600/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                  Année en cours
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Liste toutes les années */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Historique des années académiques
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {academicYears.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Aucune année académique trouvée.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {[...academicYears]
                    .sort((a, b) => b.label.localeCompare(a.label))
                    .map((year) => (
                      <div key={year.id} className="px-5 py-4 flex items-center gap-4 hover:bg-accent/30 transition-colors">
                        <div className={`p-2 rounded-lg ${year.is_current ? "bg-green-500/10" : "bg-muted"}`}>
                          {year.is_current
                            ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                            : <Clock className="w-4 h-4 text-muted-foreground" />
                          }
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{year.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(year.start_date).toLocaleDateString("fr-FR")}
                            {" → "}
                            {new Date(year.end_date).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                        {year.is_current ? (
                          <Badge className="bg-green-600/10 text-green-700 dark:text-green-400 border-green-600/20 text-xs">
                            En cours
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-xs">
                            Clôturée
                          </Badge>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          DIALOG — Créer / modifier un tarif
          ══════════════════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editTarget ? "Modifier le tarif" : "Nouveau tarif"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {!editTarget && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* Année académique */}
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Année académique</Label>
                    <select
                      {...register("academic_year_id", { required: true })}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Sélectionner</option>
                      {academicYears.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.label}{y.is_current ? " ★" : ""}
                        </option>
                      ))}
                    </select>
                    {errors.academic_year_id && <p className="text-xs text-destructive">Obligatoire</p>}
                  </div>

                  {/* École */}
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Établissement</Label>
                    <select
                      {...register("school_id", { required: true })}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Sélectionner</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>{s.code}</option>
                      ))}
                    </select>
                    {errors.school_id && <p className="text-xs text-destructive">Obligatoire</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Statut */}
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Statut étudiant</Label>
                    <select
                      {...register("student_status", { required: true })}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Sélectionner</option>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.student_status && <p className="text-xs text-destructive">Obligatoire</p>}
                  </div>

                  {/* Type de frais */}
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Type de frais</Label>
                    <select
                      {...register("fee_type", { required: true })}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Sélectionner</option>
                      <option value="FRAIS_INSCRIPTION">Frais d&apos;inscription</option>
                      <option value="FRAIS_SCOLARITE">Frais de scolarité</option>
                    </select>
                    {errors.fee_type && <p className="text-xs text-destructive">Obligatoire</p>}
                  </div>
                </div>
              </>
            )}

            {editTarget && (
              <div className="px-4 py-3 rounded-lg bg-muted text-sm text-muted-foreground space-y-0.5">
                <div><span className="font-medium text-foreground">{editTarget.school?.code}</span> · {editTarget.academic_year?.label}</div>
                <div>{editTarget.student_status} · {FEE_TYPE_LABELS[editTarget.fee_type]}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Montant */}
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Montant total (FCFA)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  {...register("total_amount", { required: true, min: 0, valueAsNumber: true })}
                  className="bg-background border-border text-foreground"
                  placeholder="150000"
                />
                {errors.total_amount && <p className="text-xs text-destructive">Montant invalide</p>}
              </div>

              {/* Tranches max */}
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Tranches maximum</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  {...register("max_installments", { required: true, min: 1, max: 12, valueAsNumber: true })}
                  className="bg-background border-border text-foreground"
                  placeholder="3"
                />
                {errors.max_installments && <p className="text-xs text-destructive">Entre 1 et 12</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createFee.isPending || updateFee.isPending}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                {(createFee.isPending || updateFee.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editTarget ? "Enregistrer" : "Créer le tarif"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
