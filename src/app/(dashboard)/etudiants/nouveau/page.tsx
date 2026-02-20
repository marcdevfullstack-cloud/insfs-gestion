"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  User,
  BookOpen,
  Briefcase,
  FileText,
  Camera,
  ImagePlus,
} from "lucide-react";
import Link from "next/link";
import type { Student } from "@/types";
import { cn } from "@/lib/utils";

const studentSchema = z.object({
  last_name: z.string().min(1, "Nom requis"),
  first_name: z.string().min(1, "Prénom requis"),
  gender: z.enum(["M", "F"], { required_error: "Genre requis" }),
  date_of_birth: z.string().min(1, "Date de naissance requise"),
  place_of_birth: z.string().min(1, "Lieu de naissance requis"),
  nationality: z.string().optional(),
  father_name: z.string().optional(),
  mother_name: z.string().optional(),
  marital_status: z.enum(["Célibataire", "Marié(e)", "Veuf(ve)", "Divorcé(e)"]).optional(),
  children_count: z.coerce.number().min(0).optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  address: z.string().optional(),
  status_type: z.enum(["Fonctionnaire", "Boursier national", "Boursier étranger", "Non-boursier"]),
  matricule_fonctionnaire: z.string().optional(),
  emploi: z.string().optional(),
  echelon: z.string().optional(),
  categorie: z.string().optional(),
  classe: z.string().optional(),
  entry_mode: z.enum(["Concours direct", "Analyse de dossier", "Concours professionnel"]),
  diploma_cepe: z.boolean().optional(),
  diploma_bepc: z.boolean().optional(),
  diploma_bac: z.boolean().optional(),
  diploma_bac_serie: z.string().optional(),
  other_diplomas: z.string().optional(),
});

type StudentForm = z.infer<typeof studentSchema>;

const sections = [
  { id: "identite",      label: "Identité",      icon: User },
  { id: "statut",        label: "Statut",         icon: Briefcase },
  { id: "diplomes",      label: "Diplômes",       icon: BookOpen },
  { id: "recapitulatif", label: "Récapitulatif",  icon: FileText },
];

export default function NouvelEtudiantPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      nationality: "Ivoirienne",
      marital_status: "Célibataire",
      children_count: 0,
      status_type: "Non-boursier",
      entry_mode: "Concours direct",
      diploma_cepe: false,
      diploma_bepc: false,
      diploma_bac: false,
    },
  });

  const statusType = watch("status_type");
  const diplomaBac = watch("diploma_bac");

  const mutation = useMutation({
    mutationFn: (data: StudentForm) =>
      api.post<Student>("/students", data).then((r) => r.data),
    onSuccess: (student) => {
      setCreatedStudent(student);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setServerError(
        axiosError.response?.data?.message || "Une erreur est survenue lors de la création."
      );
    },
  });

  const stepFields: Record<number, (keyof StudentForm)[]> = {
    0: ["last_name", "first_name", "gender", "date_of_birth", "place_of_birth"],
    1: ["status_type", "entry_mode"],
    2: [],
  };

  const goNext = async () => {
    const fields = stepFields[currentStep];
    const valid = await trigger(fields);
    if (valid) setCurrentStep((s) => s + 1);
  };

  const onSubmit = (data: StudentForm) => {
    setServerError(null);
    mutation.mutate(data);
    setCurrentStep(3);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("La photo ne doit pas dépasser 2 Mo.");
      return;
    }
    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    const file = photoInputRef.current?.files?.[0];
    if (!file || !createdStudent) return;
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      await api.post(`/students/${createdStudent.id}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotoUploaded(true);
      queryClient.invalidateQueries({ queryKey: ["student", createdStudent.id] });
    } catch {
      setPhotoError("Erreur lors de l'envoi de la photo.");
    } finally {
      setPhotoUploading(false);
    }
  };

  /* ── Classe partagée pour tous les inputs ── */
  const inputCls = "bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary";
  const labelCls = "text-sm font-medium text-foreground";

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link href="/etudiants">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 rounded-full bg-primary" />
            <h1 className="text-xl font-bold text-foreground">Nouvel étudiant</h1>
          </div>
          <p className="text-muted-foreground text-sm pl-3">Le matricule sera généré automatiquement</p>
        </div>
      </div>

      {/* ── Stepper ── */}
      <div className="flex items-center gap-2">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isActive = currentStep === index;
          const isDone = currentStep > index || createdStudent !== null;
          return (
            <div key={section.id} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap",
                isDone
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : isActive
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted text-muted-foreground border-border"
              )}>
                <Icon className="w-3 h-3 shrink-0" />
                {section.label}
              </div>
              {index < sections.length - 1 && (
                <div className={cn(
                  "h-px flex-1",
                  isDone ? "bg-emerald-500/40" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>

        {/* ══════════════════════════════
            ÉTAPE 0 — Identité
        ══════════════════════════════ */}
        {currentStep === 0 && (
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Nom de famille <span className="text-red-500">*</span></Label>
                  <Input
                    {...register("last_name")}
                    placeholder="KOUASSI"
                    className={inputCls}
                  />
                  {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Prénom(s) <span className="text-red-500">*</span></Label>
                  <Input
                    {...register("first_name")}
                    placeholder="Amani Pierre"
                    className={inputCls}
                  />
                  {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Genre <span className="text-red-500">*</span></Label>
                  <Select onValueChange={(v) => setValue("gender", v as "M" | "F")}>
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-red-500 text-xs">{errors.gender.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Date de naissance <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    {...register("date_of_birth")}
                    className={inputCls}
                  />
                  {errors.date_of_birth && <p className="text-red-500 text-xs">{errors.date_of_birth.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Lieu de naissance <span className="text-red-500">*</span></Label>
                  <Input
                    {...register("place_of_birth")}
                    placeholder="Abidjan"
                    className={inputCls}
                  />
                  {errors.place_of_birth && <p className="text-red-500 text-xs">{errors.place_of_birth.message}</p>}
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Nationalité</Label>
                  <Input {...register("nationality")} placeholder="Ivoirienne" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Situation matrimoniale</Label>
                  <Select
                    defaultValue="Célibataire"
                    onValueChange={(v) => setValue("marital_status", v as StudentForm["marital_status"])}
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {["Célibataire", "Marié(e)", "Veuf(ve)", "Divorcé(e)"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Nom du père</Label>
                  <Input {...register("father_name")} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Nom de la mère</Label>
                  <Input {...register("mother_name")} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Téléphone</Label>
                  <Input {...register("phone")} placeholder="+225 07 00 00 00" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Email</Label>
                  <Input type="email" {...register("email")} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Enfants</Label>
                  <Input type="number" min={0} {...register("children_count")} className={inputCls} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>Adresse postale</Label>
                <Textarea {...register("address")} className={cn(inputCls, "resize-none")} rows={2} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════
            ÉTAPE 1 — Statut & Entrée
        ══════════════════════════════ */}
        {currentStep === 1 && (
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-orange-500" />
                </div>
                Statut &amp; Mode d&apos;entrée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Statut de l&apos;étudiant <span className="text-red-500">*</span></Label>
                  <Select
                    defaultValue="Non-boursier"
                    onValueChange={(v) => setValue("status_type", v as StudentForm["status_type"])}
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {["Fonctionnaire", "Boursier national", "Boursier étranger", "Non-boursier"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Mode d&apos;entrée <span className="text-red-500">*</span></Label>
                  <Select
                    defaultValue="Concours direct"
                    onValueChange={(v) => setValue("entry_mode", v as StudentForm["entry_mode"])}
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {["Concours direct", "Analyse de dossier", "Concours professionnel"].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {statusType === "Fonctionnaire" && (
                <>
                  <Separator className="bg-border" />
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-500/20">
                        Fonctionnaire
                      </span>
                      <span className="text-sm text-muted-foreground">Informations professionnelles</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>N° matricule fonctionnaire</Label>
                        <Input {...register("matricule_fonctionnaire")} className={inputCls} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Emploi</Label>
                        <Input {...register("emploi")} className={inputCls} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Catégorie</Label>
                        <Input {...register("categorie")} className={inputCls} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Échelon</Label>
                        <Input {...register("echelon")} className={inputCls} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Classe</Label>
                        <Input {...register("classe")} className={inputCls} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════
            ÉTAPE 2 — Diplômes
        ══════════════════════════════ */}
        {currentStep === 2 && (
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                Diplômes &amp; Qualifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                {[
                  { key: "diploma_cepe" as const, label: "CEPE", desc: "Certificat d'Études Primaires Élémentaires" },
                  { key: "diploma_bepc" as const, label: "BEPC", desc: "Brevet d'Études du Premier Cycle" },
                  { key: "diploma_bac" as const, label: "Baccalauréat", desc: "Diplôme de fin d'études secondaires" },
                ].map(({ key, label, desc }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border border-border cursor-pointer hover:bg-accent hover:border-primary/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      {...register(key)}
                      className="w-4 h-4 rounded border-border accent-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">{label}</span>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {diplomaBac && (
                <div className="space-y-1.5">
                  <Label className={labelCls}>Série du Baccalauréat</Label>
                  <Input
                    {...register("diploma_bac_serie")}
                    placeholder="Ex: D, C, A1..."
                    className={inputCls}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className={labelCls}>Autres diplômes</Label>
                <Textarea
                  {...register("other_diplomas")}
                  placeholder="Listez les autres diplômes obtenus..."
                  className={cn(inputCls, "resize-none")}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════
            ÉTAPE 3 — Résultat
        ══════════════════════════════ */}
        {currentStep === 3 && (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="py-10 text-center">

              {/* Chargement */}
              {mutation.isPending && (
                <div className="space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground">Création de la fiche étudiant...</p>
                </div>
              )}

              {/* Succès */}
              {mutation.isSuccess && createdStudent && (
                <div className="space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Étudiant créé avec succès !</h2>
                    <p className="text-muted-foreground mt-1">
                      {createdStudent.last_name} {createdStudent.first_name}
                    </p>
                  </div>
                  <div className="inline-block px-5 py-3 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Matricule INSFS</p>
                    <p className="text-xl font-mono font-bold text-primary">
                      {createdStudent.matricule}
                    </p>
                  </div>

                  {/* Section photo */}
                  <div className="border border-border rounded-xl p-5 mt-2 text-left bg-muted/30">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-4">
                      <Camera className="w-4 h-4 text-orange-500" />
                      Photo d&apos;identité
                      <span className="text-xs text-muted-foreground font-normal">(recommandée pour les documents PDF)</span>
                    </p>

                    <div className="flex items-center gap-5">
                      {/* Aperçu photo */}
                      <div className="w-24 h-28 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden shrink-0 bg-muted">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <User className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                            <p className="text-xs text-muted-foreground/50 mt-1">Aperçu</p>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={handlePhotoSelect}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label htmlFor="photo-upload">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors text-sm">
                            <ImagePlus className="w-4 h-4" />
                            Choisir une photo
                          </div>
                        </label>
                        <p className="text-xs text-muted-foreground">
                          JPEG ou PNG · 2 Mo max · Format portrait recommandé
                        </p>

                        {photoPreview && !photoUploaded && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={handlePhotoUpload}
                            disabled={photoUploading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            {photoUploading ? (
                              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Envoi...</>
                            ) : (
                              <><Camera className="w-3.5 h-3.5 mr-1.5" />Enregistrer la photo</>
                            )}
                          </Button>
                        )}

                        {photoUploaded && (
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Photo enregistrée avec succès
                          </div>
                        )}

                        {photoError && (
                          <p className="text-red-500 text-xs">{photoError}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center mt-2">
                    <Link href="/etudiants">
                      <Button variant="outline" className="border-border text-foreground">
                        Retour à la liste
                      </Button>
                    </Link>
                    <Link href={`/etudiants/${createdStudent.id}`}>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Voir la fiche
                      </Button>
                    </Link>
                    <Button
                      onClick={() => {
                        setCurrentStep(0);
                        setCreatedStudent(null);
                        setPhotoPreview(null);
                        setPhotoUploaded(false);
                        setPhotoError(null);
                        mutation.reset();
                      }}
                      variant="outline"
                      className="border-border text-foreground"
                    >
                      Nouvel étudiant
                    </Button>
                  </div>
                </div>
              )}

              {/* Erreur */}
              {(mutation.isError || serverError) && (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Erreur lors de la création</h2>
                    <p className="text-muted-foreground mt-1">{serverError}</p>
                  </div>
                  <Button
                    onClick={() => setCurrentStep(0)}
                    variant="outline"
                    className="border-border text-foreground"
                  >
                    Recommencer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Navigation ── */}
        {currentStep < 3 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 0}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Précédent
            </Button>

            {currentStep < 2 ? (
              <Button
                type="button"
                onClick={goNext}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
              >
                Suivant
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Créer l&apos;étudiant
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
