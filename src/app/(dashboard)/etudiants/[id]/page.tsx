"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import {
  ArrowLeft,
  Pencil,
  Loader2,
  User,
  BookOpen,
  Briefcase,
  History,
  PlusCircle,
  Eye,
  Camera,
  ImagePlus,
  Shield,
  ShieldOff,
  ShieldAlert,
} from "lucide-react";
import type { Student, School, AcademicYear, Enrollment } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const genderLabel: Record<string, string> = { M: "Masculin", F: "Féminin" };

const enrollmentSchema = z.object({
  school_id: z.string().min(1, "École requise"),
  academic_year_id: z.string().min(1, "Année académique requise"),
  year_of_study: z.coerce.number().int().min(1).max(3),
  quality: z.enum(["CD", "CP", "FC"]),
  cycle: z.string().optional(),
  enrollment_date: z.string().min(1, "Date d'inscription requise"),
});
type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

function InfoItem({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") return null;
  const displayValue = typeof value === "boolean" ? (value ? "Oui" : "Non") : String(value);
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground font-medium mt-0.5">{displayValue}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  EN_COURS: "border-amber-500/40 text-amber-600 dark:text-amber-400",
  VALIDE:   "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
  ANNULE:   "border-red-500/40 text-red-600 dark:text-red-400",
};
const STATUS_LABELS: Record<string, string> = {
  EN_COURS: "En cours",
  VALIDE: "Validée",
  ANNULE: "Annulée",
};

export default function EtudiantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const canEdit = isAdmin || user?.role === "SCOLARITE";

  const [inscriptionOpen, setInscriptionOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Block / unblock state
  const [blockOpen, setBlockOpen] = useState(false);
  const [unblockOpen, setUnblockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      quality: "CD",
      year_of_study: 1,
      enrollment_date: new Date().toISOString().slice(0, 10),
    },
  });

  const { data: student, isLoading, isError } = useQuery({
    queryKey: ["student", id],
    queryFn: () => api.get<Student>(`/students/${id}`).then((r) => r.data),
  });

  const { data: schools } = useQuery({
    queryKey: ["schools"],
    queryFn: () => api.get<School[]>("/schools").then((r) => r.data),
    enabled: inscriptionOpen,
  });

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => api.get<AcademicYear[]>("/academic-years").then((r) => r.data),
    enabled: inscriptionOpen,
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: (data: EnrollmentFormData) =>
      api.post<Enrollment>("/enrollments", { ...data, student_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      setInscriptionOpen(false);
      reset();
    },
  });

  const blockMutation = useMutation({
    mutationFn: () =>
      api.patch<Student>(`/students/${id}/block`, { block_reason: blockReason || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      setBlockOpen(false);
      setBlockReason("");
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => api.patch<Student>(`/students/${id}/unblock`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      setUnblockOpen(false);
    },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("La photo ne doit pas dépasser 2 Mo.");
      return;
    }
    setPhotoError(null);
    setPhotoUploaded(false);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    const file = photoInputRef.current?.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      await api.post(`/students/${id}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotoUploaded(true);
      setPhotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["student", id] });
    } catch {
      setPhotoError("Erreur lors de l'envoi de la photo.");
    } finally {
      setPhotoUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !student) {
    return <div className="p-8 text-center text-destructive">Étudiant introuvable.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">

      {/* ── Bannière blocage ── */}
      {student.is_blocked && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Étudiant bloqué</p>
            {student.block_reason && (
              <p className="text-xs mt-0.5 opacity-80">{student.block_reason}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/etudiants">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Retour
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">
                {student.last_name} {student.first_name}
              </h1>
              <span className="font-mono bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-lg text-sm font-semibold">
                {student.matricule}
              </span>
              {student.is_blocked && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <Shield className="w-3 h-3" />
                  Bloqué
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {genderLabel[student.gender]} · {student.nationality}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/parcours/${student.id}`}>
            <Button variant="outline" size="sm">
              <History className="w-3.5 h-3.5 mr-1.5" />
              Parcours
            </Button>
          </Link>

          {/* Bouton bloquer/débloquer (ADMIN uniquement) */}
          {isAdmin && (
            student.is_blocked ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnblockOpen(true)}
                className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                <ShieldOff className="w-3.5 h-3.5 mr-1.5" />
                Débloquer
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBlockOpen(true)}
                className="border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Bloquer
              </Button>
            )
          )}

          {canEdit && (
            <>
              <Button
                size="sm"
                onClick={() => setInscriptionOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Inscrire
              </Button>
              <Link href={`/etudiants/${student.id}/modifier`}>
                <Button variant="outline" size="sm">
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Modifier
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* ── Identité ── */}
        <Card className="col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground/80 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <InfoItem label="Date de naissance" value={student.date_of_birth} />
              <InfoItem label="Lieu de naissance" value={student.place_of_birth} />
              <InfoItem label="Nationalité" value={student.nationality} />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Nom du père" value={student.father_name} />
              <InfoItem label="Nom de la mère" value={student.mother_name} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <InfoItem label="Situation matrimoniale" value={student.marital_status} />
              <InfoItem label="Nombre d'enfants" value={student.children_count} />
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <InfoItem label="Téléphone" value={student.phone} />
              <InfoItem label="Email" value={student.email} />
              <InfoItem label="Adresse" value={student.address} />
            </div>
          </CardContent>
        </Card>

        {/* ── Photo + Statut ── */}
        <div className="space-y-4">
          {/* Photo */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground/80 flex items-center gap-2">
                <Camera className="w-4 h-4 text-orange-500" />
                Photo d&apos;identité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-center">
                <div className="w-28 h-32 rounded-xl border-2 border-border overflow-hidden bg-muted/30 flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                  ) : student.photo_url ? (
                    <img src={student.photo_url} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <User className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                      <p className="text-xs text-muted-foreground/50 mt-1">Aucune photo</p>
                    </div>
                  )}
                </div>
              </div>

              {canEdit && (
                <div className="space-y-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="student-photo-upload"
                  />
                  <label htmlFor="student-photo-upload" className="block">
                    <div className="flex items-center justify-center gap-2 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors text-xs">
                      <ImagePlus className="w-3.5 h-3.5" />
                      {student.photo_url ? "Changer la photo" : "Ajouter une photo"}
                    </div>
                  </label>
                  <p className="text-xs text-muted-foreground/50 text-center">JPEG/PNG · 2 Mo max</p>

                  {photoPreview && !photoUploaded && (
                    <Button
                      size="sm"
                      onClick={handlePhotoUpload}
                      disabled={photoUploading}
                      className="w-full text-xs"
                    >
                      {photoUploading ? (
                        <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Envoi...</>
                      ) : (
                        <><Camera className="w-3 h-3 mr-1.5" />Enregistrer</>
                      )}
                    </Button>
                  )}
                  {photoUploaded && (
                    <p className="text-emerald-500 text-xs text-center">Photo mise à jour ✓</p>
                  )}
                  {photoError && (
                    <p className="text-destructive text-xs text-center">{photoError}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statut */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base text-foreground/80 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-orange-500" />
                Statut
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {student.status_type}
                </Badge>
              </div>
              <InfoItem label="Mode d'entrée" value={student.entry_mode} />
              {student.status_type === "Fonctionnaire" && (
                <>
                  <Separator />
                  <InfoItem label="Matricule fonctionnaire" value={student.matricule_fonctionnaire} />
                  <InfoItem label="Emploi" value={student.emploi} />
                  <InfoItem label="Catégorie" value={student.categorie} />
                  <InfoItem label="Échelon" value={student.echelon} />
                  <InfoItem label="Classe" value={student.classe} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Diplômes ── */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base text-foreground/80 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Diplômes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {student.diploma_cepe && (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">CEPE</Badge>
            )}
            {student.diploma_bepc && (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">BEPC</Badge>
            )}
            {student.diploma_bac && (
              <Badge variant="outline" className="border-primary/30 text-primary">
                BAC{student.diploma_bac_serie ? ` série ${student.diploma_bac_serie}` : ""}
              </Badge>
            )}
            {!student.diploma_cepe && !student.diploma_bepc && !student.diploma_bac && (
              <p className="text-muted-foreground text-sm">Aucun diplôme renseigné</p>
            )}
          </div>
          {student.other_diplomas && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Autres diplômes</p>
              <p className="text-sm text-foreground mt-1">{student.other_diplomas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Inscriptions ── */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-foreground/80 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-orange-500" />
              Inscriptions ({student.enrollments?.length ?? 0})
            </CardTitle>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInscriptionOpen(true)}
                className="border-primary/40 text-primary hover:bg-primary/10"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Nouvelle inscription
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!student.enrollments || student.enrollments.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm mb-3">Aucune inscription pour cet étudiant.</p>
              {canEdit && (
                <Button onClick={() => setInscriptionOpen(true)}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Inscrire maintenant
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {student.enrollments.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {e.school?.name} — {e.academic_year?.label}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">Année {e.year_of_study}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={STATUS_COLORS[e.status]}>
                      {STATUS_LABELS[e.status] ?? e.status}
                    </Badge>
                    <Link href={`/inscriptions/${e.id}`}>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-7 px-2">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog: Inscription ── */}
      <Dialog open={inscriptionOpen} onOpenChange={setInscriptionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-primary" />
              Nouvelle inscription — {student.last_name} {student.first_name}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit((data) => createEnrollmentMutation.mutate(data))}
            className="space-y-4 mt-2"
          >
            {/* École */}
            <div>
              <Label>École *</Label>
              <Select
                value={watch("school_id") ?? ""}
                onValueChange={(v) => setValue("school_id", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner une école" />
                </SelectTrigger>
                <SelectContent>
                  {schools?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.school_id && (
                <p className="text-destructive text-xs mt-1">{errors.school_id.message}</p>
              )}
            </div>

            {/* Année académique */}
            <div>
              <Label>Année académique *</Label>
              <Select
                value={watch("academic_year_id") ?? ""}
                onValueChange={(v) => setValue("academic_year_id", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner une année" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.label}{y.is_current ? " (en cours)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.academic_year_id && (
                <p className="text-destructive text-xs mt-1">{errors.academic_year_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Année d'étude */}
              <div>
                <Label>Année d&apos;étude *</Label>
                <Select
                  value={String(watch("year_of_study") ?? "1")}
                  onValueChange={(v) => setValue("year_of_study", Number(v))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1ère année</SelectItem>
                    <SelectItem value="2">2ème année</SelectItem>
                    <SelectItem value="3">3ème année</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Qualité */}
              <div>
                <Label>Qualité *</Label>
                <Select
                  value={watch("quality") ?? "CD"}
                  onValueChange={(v) => setValue("quality", v as "CD" | "CP" | "FC")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CD">Concours Direct</SelectItem>
                    <SelectItem value="CP">Concours Professionnel</SelectItem>
                    <SelectItem value="FC">Formation Continue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date d'inscription */}
              <div>
                <Label>Date d&apos;inscription *</Label>
                <Input
                  {...register("enrollment_date")}
                  type="date"
                  className="mt-1"
                />
                {errors.enrollment_date && (
                  <p className="text-destructive text-xs mt-1">{errors.enrollment_date.message}</p>
                )}
              </div>

              {/* Cycle */}
              <div>
                <Label>Cycle (optionnel)</Label>
                <Input
                  {...register("cycle")}
                  placeholder="Ex: Licence, Master..."
                  className="mt-1"
                />
              </div>
            </div>

            {createEnrollmentMutation.isError && (
              <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded p-3">
                {(createEnrollmentMutation.error as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ?? "Une erreur s'est produite."}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setInscriptionOpen(false); reset(); }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createEnrollmentMutation.isPending}>
                {createEnrollmentMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Inscription...</>
                ) : "Inscrire"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Bloquer ── */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Shield className="w-5 h-5" />
              Bloquer l&apos;étudiant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Cet étudiant sera marqué comme bloqué. Il ne pourra plus accéder aux services tant que le blocage est actif.
            </p>
            <div>
              <Label>Motif du blocage (optionnel)</Label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Expulsion, impayés, dossier incomplet..."
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {blockMutation.isError && (
              <p className="text-destructive text-sm">
                {(blockMutation.error as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ?? "Une erreur s'est produite."}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setBlockOpen(false); setBlockReason(""); }}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={blockMutation.isPending}
              onClick={() => blockMutation.mutate()}
            >
              {blockMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Blocage...</>
              ) : "Confirmer le blocage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Débloquer ── */}
      <Dialog open={unblockOpen} onOpenChange={setUnblockOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldOff className="w-5 h-5" />
              Débloquer l&apos;étudiant
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Êtes-vous sûr de vouloir débloquer{" "}
              <strong>{student.last_name} {student.first_name}</strong> ?
              Le blocage et le motif seront effacés.
            </p>
            {student.block_reason && (
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                <span className="font-semibold">Motif actuel : </span>
                {student.block_reason}
              </div>
            )}
            {unblockMutation.isError && (
              <p className="text-destructive text-sm">
                {(unblockMutation.error as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ?? "Une erreur s'est produite."}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUnblockOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={unblockMutation.isPending}
              onClick={() => unblockMutation.mutate()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {unblockMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Déblocage...</>
              ) : "Débloquer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
