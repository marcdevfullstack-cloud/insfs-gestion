"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  School,
  TrendingUp,
  Calendar,
  GraduationCap,
  Banknote,
  CreditCard,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import type { AcademicYear, DashboardStats } from "@/types";

function formatFcfa(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " M FCFA";
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: statsData } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<DashboardStats>("/dashboard/stats").then((r) => r.data),
  });

  const { data: currentYear } = useQuery({
    queryKey: ["current-year"],
    queryFn: () => api.get<AcademicYear>("/academic-years/current").then((r) => r.data),
  });

  const primaryStats = [
    {
      title: "Étudiants",
      value: statsData?.students.total ?? "—",
      icon: Users,
      color: "text-green-400",
      bg: "bg-green-500/10",
      description: "Total dans le système",
    },
    {
      title: "Inscriptions",
      value: statsData?.enrollments.total ?? "—",
      icon: BookOpen,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      description: `${statsData?.enrollments.en_cours ?? 0} en cours · ${statsData?.enrollments.valide ?? 0} validées`,
    },
    {
      title: "Année académique",
      value: currentYear?.label ?? "—",
      icon: Calendar,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      description: currentYear?.is_current ? "En cours" : "Clôturée",
    },
    {
      title: "Établissements",
      value: 4,
      icon: School,
      color: "text-slate-300",
      bg: "bg-slate-700/50",
      description: "EES, EEP, EAS, CPPE",
    },
  ];

  const financialStats = [
    {
      title: "Total collecté",
      value: statsData ? formatFcfa(statsData.payments.total_collected) : "—",
      icon: Banknote,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      description: "Tous paiements confondus",
    },
    {
      title: "Ce mois-ci",
      value: statsData ? formatFcfa(statsData.payments.collected_this_month) : "—",
      icon: CreditCard,
      color: "text-green-400",
      bg: "bg-green-500/10",
      description: new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    },
    {
      title: "Validées",
      value: statsData?.enrollments.valide ?? "—",
      icon: CheckCircle,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      description: `sur ${statsData?.enrollments.total ?? 0} inscriptions`,
    },
    {
      title: "Taux de recouvrement",
      value: statsData ? `${statsData.payments.recovery_rate}%` : "—",
      icon: BarChart3,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      description: "Inscriptions validées / actives",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header avec bandeau ivoirien */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          {/* Mini drapeau Côte d'Ivoire */}
          <div className="flex h-5 w-7 rounded overflow-hidden shrink-0">
            <div className="flex-1 bg-orange-500" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-green-700" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Bonjour, {user?.full_name?.split(" ")[0]}
          </h1>
        </div>
        <p className="text-slate-400 mt-1">
          Institut National de Formation Sociale — Côte d&apos;Ivoire
        </p>
      </div>

      {/* Stats générales */}
      <div>
        <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">
          Vue générale
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {primaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 transition-colors"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Stats financières */}
      <div>
        <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">
          Finances
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {financialStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 transition-colors"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Établissements */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Établissements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { code: "EES", name: "École des Éducateurs Spécialisés",    color: "border-l-green-600" },
            { code: "EEP", name: "École des Éducateurs Préscolaires",   color: "border-l-orange-500" },
            { code: "EAS", name: "École des Assistants Sociaux",        color: "border-l-green-500" },
            { code: "CPPE", name: "CPPE-PILOTE",                        color: "border-l-orange-400" },
          ].map((school) => (
            <Card
              key={school.code}
              className={`bg-slate-800/50 border-slate-700/50 border-l-4 ${school.color} hover:bg-slate-800 transition-colors`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-700">
                    <GraduationCap className="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <Badge variant="outline" className="text-xs mb-2 border-slate-600 text-slate-400">
                      {school.code}
                    </Badge>
                    <div className="text-sm font-medium text-white leading-tight">
                      {school.name}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Actions rapides</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/etudiants/nouveau">
            <Card className="bg-green-700 border-green-600 hover:bg-green-800 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Inscrire un étudiant</span>
              </CardContent>
            </Card>
          </a>
          <a href="/inscriptions">
            <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-slate-300">Voir les inscriptions</span>
              </CardContent>
            </Card>
          </a>
          <a href="/etudiants">
            <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">Tous les étudiants</span>
              </CardContent>
            </Card>
          </a>
        </div>
      </div>
    </div>
  );
}
