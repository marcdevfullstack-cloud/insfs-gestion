"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";
import type { LoginResponse } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginForm = z.infer<typeof loginSchema>;

const demoAccounts = [
  { role: "Admin",     email: "admin@insfs.ci",       color: "#F77F00" },
  { role: "Scolarité", email: "scolarite@insfs.ci",   color: "#009A44" },
  { role: "Compta",    email: "comptabilite@insfs.ci", color: "#F77F00" },
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
    <div
      className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{
        background: "linear-gradient(150deg, #020805 0%, #061008 35%, #071408 65%, #030a05 100%)",
      }}
    >
      {/* Lueurs arrière-plan */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(247,127,0,0.12) 0%, transparent 65%)" }} />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,154,68,0.12) 0%, transparent 65%)" }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,154,68,0.4), transparent)" }} />

      {/* Bande drapeau verticale gauche */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 flex flex-col">
        <div className="flex-1 bg-[#F77F00]" />
        <div className="flex-1 bg-white/20" />
        <div className="flex-1 bg-[#009A44]" />
      </div>

      <div className="w-full max-w-sm relative z-10 space-y-7">

        {/* ── Logo INSFS ── */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10"
              style={{ boxShadow: "0 0 50px rgba(0,154,68,0.25), 0 0 25px rgba(247,127,0,0.12)" }}>
              <Image
                src="/insfs-logo.jpg"
                alt="Logo INSFS"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-widest">INSFS</h1>
            <p className="text-sm mt-1 font-medium" style={{ color: "#009A44" }}>
              Institut National de Formation Sociale
            </p>
            <p className="text-xs text-white/30 mt-1">Côte d&apos;Ivoire</p>
          </div>
        </div>

        {/* ── Carte formulaire ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(11, 22, 14, 0.88)",
            border: "1px solid rgba(0,154,68,0.2)",
            boxShadow: "0 30px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div className="px-6 pt-6 pb-1">
            <h2 className="text-xl font-semibold text-white">Connexion</h2>
            <p className="text-sm text-white/40 mt-0.5">Plateforme de gestion des inscriptions</p>
          </div>

          <div className="px-6 pb-6 pt-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl text-sm"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-red-300">{serverError}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/70 text-sm flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#009A44]" />
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@insfs.ci"
                  autoComplete="email"
                  {...register("email")}
                  className="h-11 text-white placeholder:text-white/20 rounded-xl"
                  style={{
                    background: "rgba(6,14,8,0.9)",
                    border: "1px solid rgba(0,154,68,0.25)",
                  }}
                />
                {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
              </div>

              {/* Mot de passe */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/70 text-sm flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#009A44]" />
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                    className="h-11 text-white placeholder:text-white/20 rounded-xl pr-11"
                    style={{
                      background: "rgba(6,14,8,0.9)",
                      border: "1px solid rgba(0,154,68,0.25)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
              </div>

              {/* Bouton connexion */}
              <Button
                type="submit"
                className="w-full h-11 font-semibold text-white rounded-xl mt-2 transition-all duration-200"
                style={{ background: "linear-gradient(135deg, #009A44, #007A33)" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connexion...</>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            {/* Comptes démo */}
            <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(0,154,68,0.15)" }}>
              <p className="text-xs text-center text-white/25 mb-3">Comptes de démonstration</p>
              <div className="grid grid-cols-3 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => setValue("email", acc.email)}
                    className="text-center px-2 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: "rgba(0,0,0,0.35)",
                      border: `1px solid ${acc.color}20`,
                    }}
                  >
                    <div className="text-xs font-semibold mb-0.5" style={{ color: acc.color }}>
                      {acc.role}
                    </div>
                    <div className="text-xs text-white/25 truncate">
                      {acc.email.split("@")[0]}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-center mt-3 text-white/20">
                Mot de passe : <span className="text-white/40 font-mono">insfs2026</span>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/20">
          © 2026 INSFS — Ministère de la Femme, de la Famille et de l&apos;Enfant
        </p>
      </div>
    </div>
  );
}
