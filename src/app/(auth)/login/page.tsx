"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, GraduationCap, Lock, Mail } from "lucide-react";
import type { LoginResponse } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      const response = await api.post<LoginResponse>("/auth/login", data);
      saveAuth(response.data.token, response.data.user);
      setUser(response.data.user);
      router.push("/dashboard");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setServerError(
        axiosError.response?.data?.message || "Identifiants incorrects. Veuillez réessayer."
      );
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #020805 0%, #060e08 30%, #071208 55%, #040c06 80%, #020805 100%)",
      }}
    >
      {/* ── Effets lumineux ivoiriens en arrière-plan ── */}
      {/* Lueur orange (haut-gauche) */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #F77F00 0%, transparent 70%)" }}
      />
      {/* Lueur verte (bas-droite) */}
      <div
        className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #009A44 0%, transparent 70%)" }}
      />
      {/* Lueur verte subtile (centre-haut) */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[40rem] h-48 opacity-8 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #009A44 0%, transparent 65%)" }}
      />

      {/* ── Bande drapeau verticale (gauche) ── */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 flex flex-col">
        <div className="flex-1 bg-[#F77F00]" />
        <div className="flex-1 bg-white/30" />
        <div className="flex-1 bg-[#009A44]" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* ── Logo ── */}
        <div className="text-center space-y-4">
          {/* Drapeau ivoirien miniature stylisé */}
          <div className="flex justify-center">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl shadow-2xl overflow-hidden"
              style={{ boxShadow: "0 0 40px rgba(0,154,68,0.3), 0 0 20px rgba(247,127,0,0.15)" }}
            >
              {/* Fond tricolore */}
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-[#F77F00]" />
                <div className="flex-1 bg-white/90" />
                <div className="flex-1 bg-[#009A44]" />
              </div>
              {/* Icône au centre */}
              <GraduationCap className="w-9 h-9 text-[#060e08] relative z-10 drop-shadow" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white tracking-wider">INSFS</h1>
            <p className="text-sm mt-1" style={{ color: "#009A44" }}>
              Institut National de Formation Sociale
            </p>
            <p className="text-xs text-slate-500 mt-1">Côte d&apos;Ivoire</p>
          </div>
        </div>

        {/* ── Formulaire ── */}
        <Card
          className="border shadow-2xl backdrop-blur-sm"
          style={{
            background: "rgba(13, 26, 16, 0.85)",
            borderColor: "rgba(0, 154, 68, 0.25)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,154,68,0.1)",
          }}
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl font-semibold">Connexion</CardTitle>
            <p className="text-sm" style={{ color: "rgba(200,220,205,0.7)" }}>
              Plateforme de gestion des inscriptions
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {serverError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#009A44]" />
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@insfs.ci"
                  autoComplete="email"
                  className="border text-white placeholder:text-slate-600 focus:border-[#009A44] focus:ring-[#009A44]/20"
                  style={{ background: "rgba(6,14,8,0.8)", borderColor: "rgba(0,154,68,0.3)" }}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-400 text-xs">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#009A44]" />
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="border text-white placeholder:text-slate-600 focus:border-[#009A44]"
                  style={{ background: "rgba(6,14,8,0.8)", borderColor: "rgba(0,154,68,0.3)" }}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-red-400 text-xs">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full font-semibold mt-2 transition-all"
                style={{ background: "#009A44" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#007A33")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#009A44")}
                disabled={isSubmitting}
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

            {/* ── Comptes de démonstration ── */}
            <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(0,154,68,0.2)" }}>
              <p className="text-xs text-center mb-3" style={{ color: "rgba(180,200,185,0.6)" }}>
                Comptes de démonstration
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { role: "Admin", email: "admin@insfs.ci", color: "#F77F00" },
                  { role: "Scolarité", email: "scolarite@insfs.ci", color: "#009A44" },
                  { role: "Compta", email: "comptabilite@insfs.ci", color: "#F77F00" },
                ].map((acc) => (
                  <div
                    key={acc.role}
                    className="text-center p-2 rounded-lg"
                    style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${acc.color}25` }}
                  >
                    <div className="font-semibold mb-0.5" style={{ color: acc.color }}>
                      {acc.role}
                    </div>
                    <div className="text-slate-500 truncate">{acc.email.split("@")[0]}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-center mt-2" style={{ color: "rgba(150,170,155,0.5)" }}>
                Mot de passe : insfs2026
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Footer ── */}
        <p className="text-center text-xs" style={{ color: "rgba(120,150,130,0.5)" }}>
          © 2026 INSFS — Ministère de la Femme, de la Famille et de l&apos;Enfant
        </p>
      </div>
    </div>
  );
}
