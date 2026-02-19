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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BalanceCard } from "@/components/payments/BalanceCard";
import {
  ArrowLeft, CreditCard, FileText, Download, Trash2,
  CheckCircle, Clock, XCircle, Plus, Loader2, Banknote,
} from "lucide-react";
import type { Enrollment, Payment, FeeSchedule } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  EN_COURS: {
    label: "En cours",
    icon: <Clock className="w-3.5 h-3.5" />,
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  VALIDE: {
    label: "Validée",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  ANNULE: {
    label: "Annulée",
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
};

const paymentSchema = z.object({
  payment_type:       z.enum(["FRAIS_INSCRIPTION", "FRAIS_SCOLARITE"]),
  amount:             z.coerce.number().positive("Montant requis"),
  payment_date:       z.string().min(1, "Date requise"),
  receipt_number:     z.string().min(1, "N° reçu requis"),
  installment_number: z.coerce.number().int().positive("N° tranche requis"),
  notes:              z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

function formatFcfa(n: number) { return new Intl.NumberFormat("fr-FR").format(n) + " FCFA"; }
function formatDate(d: string)  { return new Date(d).toLocaleDateString("fr-FR"); }

export default function EnrollmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  const canAddPayment = user?.role === "ADMIN" || user?.role === "COMPTABILITE";
  const canDeletePayment = user?.role === "ADMIN";

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_type: "FRAIS_SCOLARITE",
      installment_number: 1,
      payment_date: new Date().toISOString().slice(0, 10),
    },
  });

  const { data: enrollment, isLoading } = useQuery({
    queryKey: ["enrollment", id],
    queryFn: () => api.get<Enrollment & { total_paid: number }>(`/enrollments/${id}`).then((r) => r.data),
  });

  const { data: payments } = useQuery({
    queryKey: ["payments", id],
    queryFn: () => api.get<Payment[]>(`/payments?enrollment_id=${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: feeSchedules } = useQuery({
    queryKey: ["fee-schedules", enrollment?.school_id, enrollment?.academic_year_id],
    queryFn: () =>
      api.get<FeeSchedule[]>(`/fee-schedules?school_id=${enrollment!.school_id}&academic_year_id=${enrollment!.academic_year_id}`)
        .then((r) => r.data),
    enabled: !!enrollment?.school_id && !!enrollment?.academic_year_id,
  });

  const totalOwed  = feeSchedules?.filter((fs) => fs.student_status === enrollment?.student?.status_type)
    .reduce((sum, fs) => sum + Number(fs.total_amount), 0) ?? 0;
  const totalPaid  = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  const addPayment = useMutation({
    mutationFn: (data: PaymentFormData) => api.post<Payment>("/payments", { ...data, enrollment_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", id] });
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
      setPaymentDialogOpen(false);
      reset();
    },
  });

  const deletePayment = useMutation({
    mutationFn: (paymentId: string) => api.delete(`/payments/${paymentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", id] });
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
    },
  });

  const handleDownloadPDF = async (type: "certificate" | "student-record") => {
    setPdfLoading(type);
    try {
      const url = type === "certificate"
        ? `/documents/certificate/${id}`
        : `/documents/student-record/${enrollment?.student_id}`;
      const response = await api.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = type === "certificate"
        ? `certificat_${enrollment?.student?.matricule}.pdf`
        : `fiche_${enrollment?.student?.matricule}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setPdfLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!enrollment) {
    return <div className="p-8 text-center text-muted-foreground">Inscription introuvable.</div>;
  }

  const statusCfg = STATUS_CONFIG[enrollment.status];

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Détail de l&apos;inscription</h1>
          {enrollment.student && (
            <p className="text-muted-foreground text-sm mt-0.5">
              <span className="font-medium text-foreground">{enrollment.student.last_name} {enrollment.student.first_name}</span>
              {" — "}
              <span className="font-mono text-primary">{enrollment.student.matricule}</span>
            </p>
          )}
        </div>
        <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1.5 ${statusCfg.color}`}>
          {statusCfg.icon}
          {statusCfg.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Colonne principale ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Infos inscription */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">Informations d&apos;inscription</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  { label: "École",             value: `${enrollment.school?.name} (${enrollment.school?.code})` },
                  { label: "Année académique",   value: enrollment.academic_year?.label },
                  { label: "Année d'étude",      value: `${enrollment.year_of_study}e année` },
                  { label: "Qualité d'admission", value: { CD: "Concours Direct", CP: "Concours Prof.", FC: "Formation Continue" }[enrollment.quality] ?? enrollment.quality },
                  { label: "Date d'inscription",  value: formatDate(enrollment.enrollment_date) },
                  { label: "Statut étudiant",     value: enrollment.student?.status_type },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">{label}</dt>
                    <dd className="text-sm font-medium text-foreground">{value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Paiements */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  Paiements
                  {payments && payments.length > 0 && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs ml-1">
                      {payments.length}
                    </Badge>
                  )}
                </CardTitle>
                {canAddPayment && (
                  <Button size="sm" onClick={() => setPaymentDialogOpen(true)}
                    className="bg-green-700 hover:bg-green-800 text-white gap-1.5">
                    <Plus className="w-4 h-4" />
                    Enregistrer
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!payments || payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Banknote className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Aucun paiement enregistré.</p>
                  {canAddPayment && (
                    <Button size="sm" variant="outline" className="mt-3 gap-1.5"
                      onClick={() => setPaymentDialogOpen(true)}>
                      <Plus className="w-3.5 h-3.5" />
                      Premier paiement
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {payments.map((payment) => (
                    <div key={payment.id}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border border-border hover:bg-accent/50 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          T{payment.installment_number}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {formatFcfa(Number(payment.amount))}
                          </span>
                          <Badge variant="outline" className="text-xs font-normal">
                            {payment.payment_type === "FRAIS_INSCRIPTION" ? "Inscription" : "Scolarité"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{formatDate(payment.payment_date)}</span>
                          <span>·</span>
                          <span>Reçu #{payment.receipt_number}</span>
                          {payment.notes && <><span>·</span><span>{payment.notes}</span></>}
                        </div>
                      </div>
                      {canDeletePayment && (
                        <Button variant="ghost" size="sm"
                          onClick={() => { if (confirm("Annuler ce paiement ?")) deletePayment.mutate(payment.id); }}
                          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shrink-0">
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

        {/* ── Colonne latérale ── */}
        <div className="space-y-5">
          <BalanceCard totalPaid={totalPaid} totalOwed={totalOwed} />

          {/* Documents PDF */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Button variant="outline" className="w-full justify-start gap-2 h-10"
                onClick={() => handleDownloadPDF("certificate")}
                disabled={pdfLoading === "certificate"}>
                {pdfLoading === "certificate"
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4 text-primary" />}
                Certificat d&apos;inscription
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 h-10"
                onClick={() => handleDownloadPDF("student-record")}
                disabled={pdfLoading === "student-record"}>
                {pdfLoading === "student-record"
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4 text-muted-foreground" />}
                Fiche de renseignements
              </Button>
            </CardContent>
          </Card>

          {/* Tarifs applicables */}
          {feeSchedules && feeSchedules.filter((fs) => fs.student_status === enrollment.student?.status_type).length > 0 && (
            <Card className="bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Tarifs applicables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feeSchedules
                    .filter((fs) => fs.student_status === enrollment.student?.status_type)
                    .map((fs) => (
                      <div key={fs.id} className="flex justify-between items-center text-sm p-2.5 rounded-lg bg-muted/50">
                        <span className="text-muted-foreground">
                          {fs.fee_type === "FRAIS_INSCRIPTION" ? "Inscription" : "Scolarité"}
                        </span>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">{formatFcfa(Number(fs.total_amount))}</div>
                          <div className="text-xs text-muted-foreground">{fs.max_installments} tranche(s) max</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Dialog paiement ── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Enregistrer un paiement
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit((data) => addPayment.mutate(data))} className="space-y-4 mt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-foreground text-sm">Type de frais</Label>
                <Select value={watch("payment_type")}
                  onValueChange={(v) => setValue("payment_type", v as "FRAIS_INSCRIPTION" | "FRAIS_SCOLARITE")}>
                  <SelectTrigger className="mt-1.5 bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FRAIS_INSCRIPTION">Frais d&apos;inscription</SelectItem>
                    <SelectItem value="FRAIS_SCOLARITE">Frais de scolarité</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground text-sm">Montant (FCFA)</Label>
                <Input {...register("amount")} type="number" placeholder="50000"
                  className="mt-1.5 bg-background border-border" />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>

              <div>
                <Label className="text-foreground text-sm">N° tranche</Label>
                <Input {...register("installment_number")} type="number" min={1}
                  className="mt-1.5 bg-background border-border" />
                {errors.installment_number && <p className="text-red-500 text-xs mt-1">{errors.installment_number.message}</p>}
              </div>

              <div>
                <Label className="text-foreground text-sm">Date</Label>
                <Input {...register("payment_date")} type="date"
                  className="mt-1.5 bg-background border-border" />
                {errors.payment_date && <p className="text-red-500 text-xs mt-1">{errors.payment_date.message}</p>}
              </div>

              <div>
                <Label className="text-foreground text-sm">N° reçu</Label>
                <Input {...register("receipt_number")} placeholder="REC-2026-001"
                  className="mt-1.5 bg-background border-border" />
                {errors.receipt_number && <p className="text-red-500 text-xs mt-1">{errors.receipt_number.message}</p>}
              </div>

              <div className="col-span-2">
                <Label className="text-foreground text-sm">Notes (optionnel)</Label>
                <Textarea {...register("notes")} placeholder="Remarques..."
                  className="mt-1.5 bg-background border-border resize-none" rows={2} />
              </div>

              <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground px-3 py-2.5 rounded-lg bg-muted">
                <Banknote className="w-4 h-4 shrink-0" />
                Paiement en espèces uniquement
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline"
                onClick={() => { setPaymentDialogOpen(false); reset(); }}>
                Annuler
              </Button>
              <Button type="submit" disabled={addPayment.isPending}
                className="bg-green-700 hover:bg-green-800 text-white">
                {addPayment.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
