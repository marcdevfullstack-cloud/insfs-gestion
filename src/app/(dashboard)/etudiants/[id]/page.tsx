"use client";

import { useState } from "react";
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
} from "lucide-react";
import type { Student, School, AcademicYear, Enrollment } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef } from "react";

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
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-white font-medium mt-0.5">{displayValue}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  EN_COURS: "border-amber-500/30 text-amber-400",
  VALIDE: "border-emerald-500/30 text-emerald-400",
  ANNULE: "border-red-500/30 text-red-400",
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
  const canEdit = user?.role === "ADMIN" || user?.role === "SCOLARITE";
  const [inscriptionOpen, setInscriptionOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

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
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="p-8 text-center text-red-400">Étudiant introuvable.</div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/etudiants">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Retour
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {student.last_name} {student.first_name}
              </h1>
              <span className="font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-lg text-sm font-semibold">
                {student.matricule}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              {genderLabel[student.gender]} · {student.nationality}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/parcours/${student.id}`}>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-700">
              <History className="w-3.5 h-3.5 mr-1.5" />
              Parcours
            </Button>
          </Link>
          {canEdit && (
            <>
              <Button
                size="sm"
                onClick={() => setInscriptionOpen(true)}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Inscrire
              </Button>
              <Link href={`/etudiants/${student.id}/modifier`}>
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-700">
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Modifier
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Identité */}
        <Card className="col-span-2 bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-base text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-green-400" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <InfoItem label="Date de naissance" value={student.date_of_birth} />
              <InfoItem label="Lieu de naissance" value={student.place_of_birth} />
              <InfoItem label="Nationalité" value={student.nationality} />
            </div>
            <Separator className="bg-slate-700" />
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Nom du père" value={student.father_name} />
              <InfoItem label="Nom de la mère" value={student.mother_name} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <InfoItem label="Situation matrimoniale" value={student.marital_status} />
              <InfoItem label="Nombre d'enfants" value={student.children_count} />
            </div>
            <Separator className="bg-slate-700" />
            <div className="grid grid-cols-3 gap-4">
              <InfoItem label="Téléphone" value={student.phone} />
              <InfoItem label="Email" value={student.email} />
              <InfoItem label="Adresse" value={student.address} />
            </div>
          </CardContent>
        </Card>

        {/* Photo + Statut */}
        <div className="space-y-4">
        {/* Photo d'identité */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-300 flex items-center gap-2">
              <Camera className="w-4 h-4 text-orange-400" />
              Photo d&apos;identité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Affichage photo */}
            <div className="flex justify-center">
              <div className="w-28 h-32 rounded-xl border-2 border-slate-600 overflow-hidden bg-slate-900/50 flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : student.photo_url ? (
                  <img src={student.photo_url} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <User className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-600 mt-1">Aucune photo</p>
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
                  <div className="flex items-center justify-center gap-2 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:border-green-700 hover:text-green-400 cursor-pointer transition-colors text-xs">
                    <ImagePlus className="w-3.5 h-3.5" />
                    {student.photo_url ? "Changer la photo" : "Ajouter une photo"}
                  </div>
                </label>
                <p className="text-xs text-slate-600 text-center">JPEG/PNG · 2 Mo max</p>

                {photoPreview && !photoUploaded && (
                  <Button
                    size="sm"
                    onClick={handlePhotoUpload}
                    disabled={photoUploading}
                    className="w-full bg-green-700 hover:bg-green-800 text-white text-xs"
                  >
                    {photoUploading ? (
                      <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Envoi...</>
                    ) : (
                      <><Camera className="w-3 h-3 mr-1.5" />Enregistrer</>
                    )}
                  </Button>
                )}

                {photoUploaded && (
                  <p className="text-emerald-400 text-xs text-center">Photo mise à jour ✓</p>
                )}
                {photoError && (
                  <p className="text-red-400 text-xs text-center">{photoError}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statut */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-base text-slate-300 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-orange-400" />
              Statut
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Type</p>
              <Badge variant="outline" className="mt-1 text-xs border-slate-600 text-slate-300">
                {student.status_type}
              </Badge>
            </div>
            <InfoItem label="Mode d'entrée" value={student.entry_mode} />
            {student.status_type === "Fonctionnaire" && (
              <>
                <Separator className="bg-slate-700" />
                <InfoItem label="Matricule fonctionnaire" value={student.matricule_fonctionnaire} />
                <InfoItem label="Emploi" value={student.emploi} />
                <InfoItem label="Catégorie" value={student.categorie} />
                <InfoItem label="Échelon" value={student.echelon} />
                <InfoItem label="Classe" value={student.classe} />
              </>
            )}
          </CardContent>
        </Card>
        </div>{/* fin space-y-4 photo+statut */}
      </div>

      {/* Diplômes */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-base text-slate-300 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-green-400" />
            Diplômes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {student.diploma_cepe && (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">CEPE</Badge>
            )}
            {student.diploma_bepc && (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">BEPC</Badge>
            )}
            {student.diploma_bac && (
              <Badge variant="outline" className="border-green-500/30 text-green-400">
                BAC{student.diploma_bac_serie ? ` série ${student.diploma_bac_serie}` : ""}
              </Badge>
            )}
            {!student.diploma_cepe && !student.diploma_bepc && !student.diploma_bac && (
              <p className="text-slate-500 text-sm">Aucun diplôme renseigné</p>
            )}
          </div>
          {student.other_diplomas && (
            <div className="mt-3">
              <p className="text-xs text-slate-500">Autres diplômes</p>
              <p className="text-sm text-slate-300 mt-1">{student.other_diplomas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inscriptions */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-orange-400" />
              Inscriptions ({student.enrollments?.length ?? 0})
            </CardTitle>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInscriptionOpen(true)}
                className="border-green-700/50 text-green-400 hover:bg-green-700/20"
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
              <p className="text-slate-500 text-sm mb-3">Aucune inscription pour cet étudiant.</p>
              {canEdit && (
                <Button
                  onClick={() => setInscriptionOpen(true)}
                  className="bg-green-700 hover:bg-green-800 text-white"
                >
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
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-700"
                >
                  <div>
                    <span className="text-sm font-medium text-white">
                      {e.school?.name} — {e.academic_year?.label}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">Année {e.year_of_study}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={STATUS_COLORS[e.status]}>
                      {STATUS_LABELS[e.status] ?? e.status}
                    </Badge>
                    <Link href={`/inscriptions/${e.id}`}>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-7 px-2">
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

      {/* Dialog d'inscription */}
      <Dialog open={inscriptionOpen} onOpenChange={setInscriptionOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-green-400" />
              Nouvelle inscription — {student.last_name} {student.first_name}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit((data) => createEnrollmentMutation.mutate(data))}
            className="space-y-4 mt-2"
          >
            {/* École */}
            <div>
              <Label className="text-slate-300">École *</Label>
              <Select
                value={watch("school_id") ?? ""}
                onValueChange={(v) => setValue("school_id", v)}
              >
                <SelectTrigger className="mt-1 bg-slate-900 border-slate-600 text-white">
                  <SelectValue placeholder="Sélectionner une école" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {schools?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.school_id && (
                <p className="text-red-400 text-xs mt-1">{errors.school_id.message}</p>
              )}
            </div>

            {/* Année académique */}
            <div>
              <Label className="text-slate-300">Année académique *</Label>
              <Select
                value={watch("academic_year_id") ?? ""}
                onValueChange={(v) => setValue("academic_year_id", v)}
              >
                <SelectTrigger className="mt-1 bg-slate-900 border-slate-600 text-white">
                  <SelectValue placeholder="Sélectionner une année" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {academicYears?.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.label}{y.is_current ? " (en cours)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.academic_year_id && (
                <p className="text-red-400 text-xs mt-1">{errors.academic_year_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Année d'étude */}
              <div>
                <Label className="text-slate-300">Année d&apos;étude *</Label>
                <Select
                  value={String(watch("year_of_study") ?? "1")}
                  onValueChange={(v) => setValue("year_of_study", Number(v))}
                >
                  <SelectTrigger className="mt-1 bg-slate-900 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="1">1ère année</SelectItem>
                    <SelectItem value="2">2ème année</SelectItem>
                    <SelectItem value="3">3ème année</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Qualité */}
              <div>
                <Label className="text-slate-300">Qualité *</Label>
                <Select
                  value={watch("quality") ?? "CD"}
                  onValueChange={(v) => setValue("quality", v as "CD" | "CP" | "FC")}
                >
                  <SelectTrigger className="mt-1 bg-slate-900 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
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
                <Label className="text-slate-300">Date d&apos;inscription *</Label>
                <Input
                  {...register("enrollment_date")}
                  type="date"
                  className="mt-1 bg-slate-900 border-slate-600 text-white"
                />
                {errors.enrollment_date && (
                  <p className="text-red-400 text-xs mt-1">{errors.enrollment_date.message}</p>
                )}
              </div>

              {/* Cycle (optionnel) */}
              <div>
                <Label className="text-slate-300">Cycle (optionnel)</Label>
                <Input
                  {...register("cycle")}
                  placeholder="Ex: Licence, Master..."
                  className="mt-1 bg-slate-900 border-slate-600 text-white"
                />
              </div>
            </div>

            {createEnrollmentMutation.isError && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded p-3">
                {(createEnrollmentMutation.error as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ?? "Une erreur s'est produite."}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setInscriptionOpen(false); reset(); }}
                className="text-slate-400 hover:text-white"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createEnrollmentMutation.isPending}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                {createEnrollmentMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Inscription...</>
                ) : (
                  "Inscrire"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
