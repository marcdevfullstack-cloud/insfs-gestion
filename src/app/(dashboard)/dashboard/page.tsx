"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
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
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import type { AcademicYear, DashboardStats } from "@/types";

function formatFcfa(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " M FCFA";
  if (n >= 1_000) return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
  return n + " FCFA";
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
      accent: "text-green-600 dark:text-green-400",
      accentBg: "bg-green-500/10",
      border: "border-t-green-500",
      description: "Total enregistrés",
      href: "/etudiants",
    },
    {
      title: "Inscriptions",
      value: statsData?.enrollments.total ?? "—",
      icon: BookOpen,
      accent: "text-orange-500",
      accentBg: "bg-orange-500/10",
      border: "border-t-orange-500",
      description: `${statsData?.enrollments.en_cours ?? 0} en cours · ${statsData?.enrollments.valide ?? 0} validées`,
      href: "/inscriptions",
    },
    {
      title: "Année académique",
      value: currentYear?.label ?? "—",
      icon: Calendar,
      accent: "text-amber-600 dark:text-amber-400",
      accentBg: "bg-amber-500/10",
      border: "border-t-amber-500",
      description: currentYear?.is_current ? "Année en cours" : "Clôturée",
    },
    {
      title: "Établissements",
      value: 4,
      icon: School,
      accent: "text-primary",
      accentBg: "bg-primary/10",
      border: "border-t-primary",
      description: "EES, EEP, EAS, CPPE",
    },
  ];

  const financialStats = [
    {
      title: "Total collecté",
      value: statsData ? formatFcfa(statsData.payments.total_collected) : "—",
      icon: Banknote,
      accent: "text-emerald-600 dark:text-emerald-400",
      accentBg: "bg-emerald-500/10",
      description: "Tous paiements confondus",
    },
    {
      title: "Ce mois-ci",
      value: statsData ? formatFcfa(statsData.payments.collected_this_month) : "—",
      icon: CreditCard,
      accent: "text-green-600 dark:text-green-400",
      accentBg: "bg-green-500/10",
      description: new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    },
    {
      title: "Inscriptions validées",
      value: statsData?.enrollments.valide ?? "—",
      icon: CheckCircle,
      accent: "text-teal-600 dark:text-teal-400",
      accentBg: "bg-teal-500/10",
      description: `sur ${statsData?.enrollments.total ?? 0} inscriptions`,
    },
    {
      title: "Taux de recouvrement",
      value: statsData ? `${statsData.payments.recovery_rate}%` : "—",
      icon: BarChart3,
      accent: "text-orange-500",
      accentBg: "bg-orange-500/10",
      description: "Inscriptions validées / actives",
    },
  ];

  return (
    <div className="p-8 space-y-8">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-5 w-7 rounded overflow-hidden shrink-0 shadow-sm">
              <div className="flex-1 bg-orange-500" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Bonjour, {user?.full_name?.split(" ")[0]} 
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Institut National de Formation Sociale — Côte d&apos;Ivoire
          </p>
        </div>
        {currentYear && (
          <Badge className="bg-green-600/10 text-green-700 dark:text-green-400 border-green-600/20 font-normal px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
            {currentYear.label}
          </Badge>
        )}
      </div>

      {/* ── Stats générales ───────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Vue générale
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {primaryStats.map((stat) => {
            const Icon = stat.icon;
            const card = (
              <Card className={`border-t-4 ${stat.border} bg-card shadow-sm hover:shadow-md transition-shadow`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.accentBg}`}>
                    <Icon className={`w-4 h-4 ${stat.accent}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  {stat.href && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                      Voir tout <ArrowUpRight className="w-3 h-3" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
            return stat.href ? (
              <Link key={stat.title} href={stat.href}>{card}</Link>
            ) : (
              <div key={stat.title}>{card}</div>
            );
          })}
        </div>
      </section>

      {/* ── Stats financières ─────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Finances
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {financialStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.accentBg}`}>
                    <Icon className={`w-4 h-4 ${stat.accent}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-xl font-bold ${stat.accent}`}>{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Établissements ────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Établissements
          </p>
          <span className="text-xs text-muted-foreground">Cliquer pour voir les étudiants</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { code: "EES",  name: "École des Éducateurs Spécialisés",  accent: "border-l-green-600",  icon: "🎓" },
            { code: "EEP",  name: "École des Éducateurs Préscolaires", accent: "border-l-orange-500", icon: "📚" },
            { code: "EAS",  name: "École des Assistants Sociaux",      accent: "border-l-green-500",  icon: "🤝" },
            { code: "CPPE", name: "CPPE-PILOTE",                       accent: "border-l-orange-400", icon: "🏫" },
          ].map((school) => (
            <Link key={school.code} href={`/etudiants?school=${school.code}`}>
              <Card className={`bg-card shadow-sm border-l-4 ${school.accent} hover:shadow-md transition-all cursor-pointer group`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
                      {school.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs mb-1.5 font-medium">
                        {school.code}
                      </Badge>
                      <div className="text-sm font-medium text-foreground leading-snug">
                        {school.name}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Actions rapides ───────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Actions rapides
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/etudiants/nouveau">
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-medium transition-colors shadow-sm">
              <Users className="w-4 h-4" />
              Inscrire un étudiant
            </div>
          </Link>
          <Link href="/inscriptions">
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-card border border-border hover:bg-accent text-sm font-medium text-foreground transition-colors shadow-sm">
              <BookOpen className="w-4 h-4 text-orange-500" />
              Voir les inscriptions
            </div>
          </Link>
          <Link href="/etudiants">
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-card border border-border hover:bg-accent text-sm font-medium text-foreground transition-colors shadow-sm">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              Tous les étudiants
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
