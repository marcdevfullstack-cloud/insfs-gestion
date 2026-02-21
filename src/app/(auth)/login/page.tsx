"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Lock, Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";
import type { LoginResponse } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginForm = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { role: "Administrateur",  email: "admin@insfs.ci",        color: "#D4710A", bg: "#FFF8EF" },
  { role: "Scolarité",       email: "scolarite@insfs.ci",    color: "#14623A", bg: "#F0F9F4" },
  { role: "Comptabilité",    email: "comptabilite@insfs.ci", color: "#D4710A", bg: "#FFF8EF" },
];

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      const response = await api.post<LoginResponse>("/auth/login", data);
      saveAuth(response.data.token, response.data.user);
      setUser(response.data.user);
      router.push("/dashboard");
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      setServerError(e.response?.data?.message || "Identifiants incorrects. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;500;600&display=swap');`}</style>

      {/* ── LEFT: Hero panel (masqué sur mobile) ── */}
      <div className="hidden lg:flex flex-1 flex-col relative overflow-hidden">
        {/* Image de fond */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1523050854058-8df90110c8f1?w=1400&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay dégradé vert INSFS */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(150deg, rgba(20,98,58,0.93) 0%, rgba(10,50,25,0.88) 55%, rgba(0,0,0,0.72) 100%)",
          }}
        />

        {/* Contenu centré */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-14 text-white text-center">
          {/* Logo */}
          <div
            className="w-28 h-28 rounded-2xl overflow-hidden mb-8 shadow-2xl"
            style={{ border: "3px solid rgba(255,255,255,0.25)" }}
          >
            <Image
              src="/insfs-logo.jpg"
              alt="Logo INSFS"
              width={112}
              height={112}
              className="object-cover w-full h-full"
              priority
            />
          </div>

          {/* Nom */}
          <h1
            className="text-5xl font-bold mb-3 tracking-widest"
            style={{ fontFamily: "'Merriweather', Georgia, serif" }}
          >
            INSFS
          </h1>
          <p
            className="text-lg font-light opacity-90 mb-1"
            style={{ fontFamily: "'Merriweather', Georgia, serif" }}
          >
            Institut National de Formation Sociale
          </p>
          <p className="text-sm opacity-50 mb-12">Côte d&apos;Ivoire</p>

          {/* Encart tagline */}
          <div
            className="rounded-2xl px-8 py-5 max-w-xs"
            style={{
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <p className="text-sm leading-relaxed opacity-85">
              Plateforme de gestion des inscriptions, des paiements et des documents académiques.
            </p>
          </div>
        </div>

        {/* Bandes drapeau CI */}
        <div className="relative z-10 flex h-2">
          <div className="flex-1" style={{ background: "#F77F00" }} />
          <div className="flex-1 bg-white" />
          <div className="flex-1" style={{ background: "#009A44" }} />
        </div>
      </div>

      {/* ── RIGHT: Panneau formulaire ── */}
      <div
        className="w-full lg:w-[480px] flex flex-col min-h-screen overflow-y-auto"
        style={{ background: "#FDFBF8" }}
      >
        {/* Lien retour */}
        <div className="px-10 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: "#14623A" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au site
          </Link>
        </div>

        {/* Formulaire */}
        <div className="flex-1 flex flex-col justify-center px-10 py-8">
          {/* Titre */}
          <div className="mb-8">
            <h2
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "'Merriweather', Georgia, serif", color: "#1C2A3A" }}
            >
              Connexion
            </h2>
            <p className="text-sm" style={{ color: "#6B7A8D" }}>
              Accédez à votre espace de gestion INSFS
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Erreur serveur */}
            {serverError && (
              <div
                className="flex items-center gap-2.5 p-3.5 rounded-xl text-sm"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {serverError}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-semibold"
                style={{ color: "#1C2A3A" }}
              >
                Adresse email
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "#9CA3AF" }}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@insfs.ci"
                  autoComplete="email"
                  {...register("email")}
                  className="pl-10 h-12 rounded-xl text-sm border"
                  style={{
                    background: "#FFFFFF",
                    borderColor: errors.email ? "#EF4444" : "#E5E7EB",
                    color: "#1C2A3A",
                  }}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email.message}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-semibold"
                style={{ color: "#1C2A3A" }}
              >
                Mot de passe
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "#9CA3AF" }}
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  className="pl-10 pr-11 h-12 rounded-xl text-sm border"
                  style={{
                    background: "#FFFFFF",
                    borderColor: errors.password ? "#EF4444" : "#E5E7EB",
                    color: "#1C2A3A",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: "#9CA3AF" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs">{errors.password.message}</p>
              )}
            </div>

            {/* Bouton connexion */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 font-semibold text-white rounded-xl text-sm mt-1 border-0 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #D4710A 0%, #B85E08 100%)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          {/* Comptes démo */}
          <div className="mt-8 pt-6" style={{ borderTop: "1px solid #E9E4DC" }}>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: "#9CA3AF" }}
            >
              Comptes de démonstration
            </p>
            <div className="space-y-2.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => {
                    setValue("email", acc.email);
                    setValue("password", "insfs2026");
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.99]"
                  style={{
                    background: acc.bg,
                    border: `1px solid ${acc.color}25`,
                  }}
                >
                  <div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: "#1C2A3A" }}
                    >
                      {acc.role}
                    </div>
                    <div className="text-xs" style={{ color: "#6B7A8D" }}>
                      {acc.email}
                    </div>
                  </div>
                  <span
                    className="text-xs font-mono px-2.5 py-1 rounded-lg shrink-0"
                    style={{ background: acc.color + "18", color: acc.color }}
                  >
                    insfs2026
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 pb-8 text-center">
          <p className="text-xs" style={{ color: "#B0BAC9" }}>
            © 2026 INSFS — Ministère de la Femme, de la Famille et de l&apos;Enfant
          </p>
        </div>
      </div>
    </div>
  );
}
