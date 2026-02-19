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
import { Badge } from "@/components/ui/badge";
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
  { id: "identite", label: "Identité", icon: User },
  { id: "statut", label: "Statut", icon: Briefcase },
  { id: "diplomes", label: "Diplômes", icon: BookOpen },
  { id: "recapitulatif", label: "Récapitulatif", icon: FileText },
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

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/etudiants">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nouvel étudiant</h1>
          <p className="text-slate-400 text-sm">Le matricule sera généré automatiquement</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isActive = currentStep === index;
          const isDone = currentStep > index || createdStudent !== null;
          return (
            <div key={section.id} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isDone
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : isActive
                    ? "bg-green-700/30 text-green-400 border border-green-700/50"
                    : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
              >
                <Icon className="w-3 h-3" />
                {section.label}
              </div>
              {index < sections.length - 1 && (
                <div className={`h-px flex-1 ${isDone ? "bg-emerald-500/30" : "bg-slate-700"}`} />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ÉTAPE 0 — Identité */}
        {currentStep === 0 && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <User className="w-4 h-4 text-green-400" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Nom de famille *</Label>
                  <Input
                    {...register("last_name")}
                    placeholder="KOUASSI"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                  {errors.last_name && <p className="text-red-400 text-xs">{errors.last_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Prénom(s) *</Label>
                  <Input
                    {...register("first_name")}
                    placeholder="Amani Pierre"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                  {errors.first_name && <p className="text-red-400 text-xs">{errors.first_name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Genre *</Label>
                  <Select onValueChange={(v) => setValue("gender", v as "M" | "F")}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="M" className="text-white">Masculin</SelectItem>
                      <SelectItem value="F" className="text-white">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-red-400 text-xs">{errors.gender.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Date de naissance *</Label>
                  <Input
                    type="date"
                    {...register("date_of_birth")}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                  {errors.date_of_birth && <p className="text-red-400 text-xs">{errors.date_of_birth.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Lieu de naissance *</Label>
                  <Input
                    {...register("place_of_birth")}
                    placeholder="Abidjan"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                  {errors.place_of_birth && <p className="text-red-400 text-xs">{errors.place_of_birth.message}</p>}
                </div>
              </div>

              <Separator className="bg-slate-700" />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Nationalité</Label>
                  <Input
                    {...register("nationality")}
                    placeholder="Ivoirienne"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Situation matrimoniale</Label>
                  <Select
                    defaultValue="Célibataire"
                    onValueChange={(v) => setValue("marital_status", v as StudentForm["marital_status"])}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {["Célibataire", "Marié(e)", "Veuf(ve)", "Divorcé(e)"].map((s) => (
                        <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Nom du père</Label>
                  <Input {...register("father_name")} className="bg-slate-700/50 border-slate-600 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Nom de la mère</Label>
                  <Input {...register("mother_name")} className="bg-slate-700/50 border-slate-600 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Téléphone</Label>
                  <Input {...register("phone")} placeholder="+225 07 00 00 00" className="bg-slate-700/50 border-slate-600 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Email</Label>
                  <Input type="email" {...register("email")} className="bg-slate-700/50 border-slate-600 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Enfants</Label>
                  <Input type="number" min={0} {...register("children_count")} className="bg-slate-700/50 border-slate-600 text-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300">Adresse postale</Label>
                <Textarea {...register("address")} className="bg-slate-700/50 border-slate-600 text-white resize-none" rows={2} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ÉTAPE 1 — Statut & Entrée */}
        {currentStep === 1 && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-orange-400" />
                Statut & Mode d&apos;entrée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Statut de l&apos;étudiant *</Label>
                  <Select
                    defaultValue="Non-boursier"
                    onValueChange={(v) => setValue("status_type", v as StudentForm["status_type"])}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {["Fonctionnaire", "Boursier national", "Boursier étranger", "Non-boursier"].map((s) => (
                        <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Mode d&apos;entrée *</Label>
                  <Select
                    defaultValue="Concours direct"
                    onValueChange={(v) => setValue("entry_mode", v as StudentForm["entry_mode"])}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {["Concours direct", "Analyse de dossier", "Concours professionnel"].map((m) => (
                        <SelectItem key={m} value={m} className="text-white">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {statusType === "Fonctionnaire" && (
                <>
                  <Separator className="bg-slate-700" />
                  <div>
                    <p className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                      <Badge variant="outline" className="border-orange-500/30 text-orange-400">Fonctionnaire</Badge>
                      Informations professionnelles
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-slate-300">N° matricule fonctionnaire</Label>
                        <Input {...register("matricule_fonctionnaire")} className="bg-slate-700/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-300">Emploi</Label>
                        <Input {...register("emploi")} className="bg-slate-700/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-300">Catégorie</Label>
                        <Input {...register("categorie")} className="bg-slate-700/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-300">Échelon</Label>
                        <Input {...register("echelon")} className="bg-slate-700/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-300">Classe</Label>
                        <Input {...register("classe")} className="bg-slate-700/50 border-slate-600 text-white" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ÉTAPE 2 — Diplômes */}
        {currentStep === 2 && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-400" />
                Diplômes & Qualifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                {[
                  { key: "diploma_cepe" as const, label: "CEPE" },
                  { key: "diploma_bepc" as const, label: "BEPC" },
                  { key: "diploma_bac" as const, label: "Baccalauréat" },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      {...register(key)}
                      className="w-4 h-4 rounded border-slate-500 accent-green-600"
                    />
                    <span className="text-slate-300 font-medium">{label}</span>
                  </label>
                ))}
              </div>

              {diplomaBac && (
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Série du Baccalauréat</Label>
                  <Input
                    {...register("diploma_bac_serie")}
                    placeholder="Ex: D, C, A1..."
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-slate-300">Autres diplômes</Label>
                <Textarea
                  {...register("other_diplomas")}
                  placeholder="Listez les autres diplômes obtenus..."
                  className="bg-slate-700/50 border-slate-600 text-white resize-none"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ÉTAPE 3 — Résultat */}
        {currentStep === 3 && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="py-10 text-center">
              {mutation.isPending && (
                <div className="space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-green-500 mx-auto" />
                  <p className="text-slate-400">Création de la fiche étudiant...</p>
                </div>
              )}
              {mutation.isSuccess && createdStudent && (
                <div className="space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Étudiant créé avec succès !</h2>
                    <p className="text-slate-400 mt-1">
                      {createdStudent.last_name} {createdStudent.first_name}
                    </p>
                  </div>
                  <div className="inline-block px-5 py-2.5 rounded-xl bg-green-700/20 border border-green-700/40">
                    <p className="text-xs text-slate-500 mb-1">Matricule INSFS</p>
                    <p className="text-xl font-mono font-bold text-green-400">
                      {createdStudent.matricule}
                    </p>
                  </div>

                  {/* ── Section photo ── */}
                  <div className="border border-slate-700 rounded-xl p-5 mt-2 text-left">
                    <p className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-4">
                      <Camera className="w-4 h-4 text-orange-400" />
                      Photo d&apos;identité
                      <span className="text-xs text-slate-500 font-normal">(recommandée pour les documents PDF)</span>
                    </p>

                    <div className="flex items-center gap-5">
                      {/* Aperçu photo */}
                      <div className="w-24 h-28 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden shrink-0 bg-slate-900/50">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <User className="w-8 h-8 text-slate-600 mx-auto" />
                            <p className="text-xs text-slate-600 mt-1">Aperçu</p>
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
                          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-green-700 hover:text-green-400 cursor-pointer transition-colors text-sm w-fit">
                            <ImagePlus className="w-4 h-4" />
                            Choisir une photo
                          </div>
                        </label>
                        <p className="text-xs text-slate-500">
                          JPEG ou PNG · 2 Mo max · Format portrait recommandé
                        </p>

                        {photoPreview && !photoUploaded && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={handlePhotoUpload}
                            disabled={photoUploading}
                            className="bg-green-700 hover:bg-green-800 text-white"
                          >
                            {photoUploading ? (
                              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Envoi...</>
                            ) : (
                              <><Camera className="w-3.5 h-3.5 mr-1.5" />Enregistrer la photo</>
                            )}
                          </Button>
                        )}

                        {photoUploaded && (
                          <div className="flex items-center gap-2 text-emerald-400 text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Photo enregistrée avec succès
                          </div>
                        )}

                        {photoError && (
                          <p className="text-red-400 text-xs">{photoError}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center mt-2">
                    <Link href="/etudiants">
                      <Button variant="outline" className="border-slate-700 text-slate-300">
                        Retour à la liste
                      </Button>
                    </Link>
                    <Link href={`/etudiants/${createdStudent.id}`}>
                      <Button className="bg-green-700 hover:bg-green-800 text-white">
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
                      className="border-slate-700 text-slate-300"
                    >
                      Nouvel étudiant
                    </Button>
                  </div>
                </div>
              )}
              {(mutation.isError || serverError) && (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Erreur lors de la création</h2>
                    <p className="text-slate-400 mt-1">{serverError}</p>
                  </div>
                  <Button
                    onClick={() => setCurrentStep(0)}
                    variant="outline"
                    className="border-slate-700 text-slate-300"
                  >
                    Recommencer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {currentStep < 3 && (
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 0}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>

            {currentStep < 2 ? (
              <Button
                type="button"
                onClick={goNext}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                Suivant
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-[#009A44] hover:bg-green-800 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Créer l&apos;étudiant
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
