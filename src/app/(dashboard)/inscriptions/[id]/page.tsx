"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BalanceCard } from "@/components/payments/BalanceCard";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
} from "lucide-react";
import type { Enrollment, Payment, FeeSchedule } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  EN_COURS: <Clock className="w-4 h-4 text-amber-400" />,
  VALIDE: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  ANNULE: <XCircle className="w-4 h-4 text-red-400" />,
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

const paymentSchema = z.object({
  payment_type: z.enum(["FRAIS_INSCRIPTION", "FRAIS_SCOLARITE"]),
  amount: z.coerce.number().positive("Montant requis"),
  payment_date: z.string().min(1, "Date requise"),
  receipt_number: z.string().min(1, "N° reçu requis"),
  installment_number: z.coerce.number().int().positive("N° tranche requis"),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

function formatFcfa(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

export default function EnrollmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const canAddPayment =
    user?.role === "ADMIN" || user?.role === "COMPTABILITE";
  const canDeletePayment = user?.role === "ADMIN";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_type: "FRAIS_SCOLARITE",
      installment_number: 1,
      payment_date: new Date().toISOString().slice(0, 10),
    },
  });

  // Enrollment detail
  const { data: enrollment, isLoading } = useQuery({
    queryKey: ["enrollment", id],
    queryFn: () =>
      api.get<Enrollment & { total_paid: number }>(`/enrollments/${id}`).then((r) => r.data),
  });

  // Payments for this enrollment
  const { data: payments } = useQuery({
    queryKey: ["payments", id],
    queryFn: () =>
      api
        .get<Payment[]>(`/payments?enrollment_id=${id}`)
        .then((r) => r.data),
    enabled: !!id,
  });

  // Fee schedules for this enrollment
  const { data: feeSchedules } = useQuery({
    queryKey: ["fee-schedules", enrollment?.school_id, enrollment?.academic_year_id],
    queryFn: () =>
      api
        .get<FeeSchedule[]>(
          `/fee-schedules?school_id=${enrollment!.school_id}&academic_year_id=${enrollment!.academic_year_id}`
        )
        .then((r) => r.data),
    enabled: !!enrollment?.school_id && !!enrollment?.academic_year_id,
  });

  // Compute totals
  const totalOwed =
    feeSchedules
      ?.filter((fs) => fs.student_status === enrollment?.student?.status_type)
      .reduce((sum, fs) => sum + Number(fs.total_amount), 0) ?? 0;

  const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  // Add payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) =>
      api.post<Payment>("/payments", { ...data, enrollment_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", id] });
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
      setPaymentDialogOpen(false);
      reset();
    },
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => api.delete(`/payments/${paymentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", id] });
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
    },
  });

  const handleDownloadPDF = async (type: "certificate" | "student-record") => {
    try {
      const url =
        type === "certificate"
          ? `/documents/certificate/${id}`
          : `/documents/student-record/${enrollment?.student_id}`;
      const response = await api.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download =
        type === "certificate"
          ? `certificat_${enrollment?.student?.matricule}.pdf`
          : `fiche_${enrollment?.student?.matricule}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert("Erreur lors de la génération du PDF.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400">Chargement...</div>
    );
  }

  if (!enrollment) {
    return (
      <div className="p-8 text-center text-slate-400">Inscription introuvable.</div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white">
            Détail de l&apos;inscription
          </h1>
          {enrollment.student && (
            <p className="text-slate-400 mt-0.5">
              {enrollment.student.last_name} {enrollment.student.first_name} —{" "}
              {enrollment.student.matricule}
            </p>
          )}
        </div>
        <Badge
          variant="outline"
          className={`flex items-center gap-1.5 ${STATUS_COLORS[enrollment.status]}`}
        >
          {STATUS_ICONS[enrollment.status]}
          {STATUS_LABELS[enrollment.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-5">
          {/* Infos inscription */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Informations d&apos;inscription</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-slate-400 mb-1">École</dt>
                  <dd className="text-white font-medium">
                    {enrollment.school?.name} ({enrollment.school?.code})
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 mb-1">Année académique</dt>
                  <dd className="text-white font-medium">
                    {enrollment.academic_year?.label}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 mb-1">Année d&apos;étude</dt>
                  <dd className="text-white font-medium">
                    {enrollment.year_of_study}e année
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 mb-1">Qualité</dt>
                  <dd className="text-white font-medium">
                    {{ CD: "Concours Direct", CP: "Concours Prof.", FC: "Formation Continue" }[enrollment.quality] ?? enrollment.quality}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 mb-1">Date d&apos;inscription</dt>
                  <dd className="text-white font-medium">
                    {formatDate(enrollment.enrollment_date)}
                  </dd>
                </div>
                {enrollment.student && (
                  <div>
                    <dt className="text-xs text-slate-400 mb-1">Statut étudiant</dt>
                    <dd className="text-white font-medium">
                      {enrollment.student.status_type}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Paiements */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  Paiements
                </CardTitle>
                {canAddPayment && (
                  <Button
                    size="sm"
                    onClick={() => setPaymentDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Enregistrer
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!payments || payments.length === 0 ? (
                <p className="text-slate-400 text-sm py-4 text-center">
                  Aucun paiement enregistré.
                </p>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-emerald-400">
                            T{payment.installment_number}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {formatFcfa(Number(payment.amount))}
                          </div>
                          <div className="text-xs text-slate-400">
                            {payment.payment_type === "FRAIS_INSCRIPTION"
                              ? "Frais d'inscription"
                              : "Frais de scolarité"}{" "}
                            · {formatDate(payment.payment_date)} · Reçu #{payment.receipt_number}
                          </div>
                          {payment.notes && (
                            <div className="text-xs text-slate-500 mt-0.5">{payment.notes}</div>
                          )}
                        </div>
                      </div>
                      {canDeletePayment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Annuler ce paiement ?")) {
                              deletePaymentMutation.mutate(payment.id);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-5">
          {/* Suivi financier */}
          <BalanceCard totalPaid={totalPaid} totalOwed={totalOwed} />

          {/* Documents PDF */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-slate-600 text-slate-300 hover:text-white"
                onClick={() => handleDownloadPDF("certificate")}
              >
                <Download className="w-4 h-4 mr-2 text-blue-400" />
                Certificat d&apos;inscription
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-slate-600 text-slate-300 hover:text-white"
                onClick={() => handleDownloadPDF("student-record")}
              >
                <Download className="w-4 h-4 mr-2 text-purple-400" />
                Fiche de renseignements
              </Button>
            </CardContent>
          </Card>

          {/* Grille tarifaire applicable */}
          {feeSchedules && feeSchedules.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Tarifs applicables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {feeSchedules
                    .filter((fs) => fs.student_status === enrollment.student?.status_type)
                    .map((fs) => (
                      <div key={fs.id} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">
                          {fs.fee_type === "FRAIS_INSCRIPTION"
                            ? "Inscription"
                            : "Scolarité"}
                        </span>
                        <div className="text-right">
                          <div className="text-white font-medium">
                            {formatFcfa(Number(fs.total_amount))}
                          </div>
                          <div className="text-xs text-slate-500">
                            {fs.max_installments} tranche(s) max
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog paiement */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) => addPaymentMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-300">Type de frais</Label>
                <Select
                  value={watch("payment_type")}
                  onValueChange={(v) =>
                    setValue("payment_type", v as "FRAIS_INSCRIPTION" | "FRAIS_SCOLARITE")
                  }
                >
                  <SelectTrigger className="mt-1 bg-slate-900 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="FRAIS_INSCRIPTION">Frais d&apos;inscription</SelectItem>
                    <SelectItem value="FRAIS_SCOLARITE">Frais de scolarité</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Montant (FCFA)</Label>
                <Input
                  {...register("amount")}
                  type="number"
                  placeholder="Ex: 50000"
                  className="mt-1 bg-slate-900 border-slate-600 text-white"
                />
                {errors.amount && (
                  <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <Label className="text-slate-300">N° tranche</Label>
                <Input
                  {...register("installment_number")}
                  type="number"
                  min={1}
                  className="mt-1 bg-slate-900 border-slate-600 text-white"
                />
                {errors.installment_number && (
                  <p className="text-red-400 text-xs mt-1">{errors.installment_number.message}</p>
                )}
              </div>

              <div>
                <Label className="text-slate-300">Date</Label>
                <Input
                  {...register("payment_date")}
                  type="date"
                  className="mt-1 bg-slate-900 border-slate-600 text-white"
                />
                {errors.payment_date && (
                  <p className="text-red-400 text-xs mt-1">{errors.payment_date.message}</p>
                )}
              </div>

              <div>
                <Label className="text-slate-300">N° reçu</Label>
                <Input
                  {...register("receipt_number")}
                  placeholder="Ex: REC-2026-001"
                  className="mt-1 bg-slate-900 border-slate-600 text-white"
                />
                {errors.receipt_number && (
                  <p className="text-red-400 text-xs mt-1">{errors.receipt_number.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label className="text-slate-300">Notes (optionnel)</Label>
                <Textarea
                  {...register("notes")}
                  placeholder="Remarques..."
                  className="mt-1 bg-slate-900 border-slate-600 text-white resize-none"
                  rows={2}
                />
              </div>

              <div className="col-span-2 flex items-center gap-2 text-sm text-slate-400 bg-slate-900/50 rounded-lg p-2">
                <CreditCard className="w-4 h-4 text-slate-500 shrink-0" />
                Paiement en espèces uniquement
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setPaymentDialogOpen(false); reset(); }}
                className="text-slate-400 hover:text-white"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={addPaymentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {addPaymentMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
