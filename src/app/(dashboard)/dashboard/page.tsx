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
  Banknote,
  CreditCard,
  CheckCircle,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import type { AcademicYear, DashboardStats } from "@/types";
import { SCHOOL_CONFIG } from "@/lib/schools";
import { cn } from "@/lib/utils";

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

  // Distribution par école : calcul du max pour les barres
  const bySchool = statsData?.enrollments.by_school ?? [];
  const maxSchoolCount = Math.max(...bySchool.map((s) => s.count), 1);

  return (
    <div className="p-8 space-y-8">

      {/* ── Header ─────────────────────────────────────────────── */}
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
            Institut National de Formation Sociale — Côte d&apos;Ivoire - Accueil
          </p>
        </div>
        {currentYear && (
          <Badge className="bg-green-600/10 text-green-700 dark:text-green-400 border-green-600/20 font-normal px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
            {currentYear.label}
          </Badge>
        )}
      </div>

      {/* ── Stats générales ─────────────────────────────────────── */}
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

      {/* ── Stats financières ────────────────────────────────────── */}
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

      {/* ── Distribution par école + Top impayés ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Distribution par école */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Répartition par école
          </p>
          <Card className="bg-card shadow-sm">
            <CardContent className="p-5 space-y-4">
              {bySchool.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
              ) : (
                bySchool.map((s) => {
                  const cfg = SCHOOL_CONFIG[s.school_code];
                  if (!cfg) return null;
                  const pct = Math.round((s.count / maxSchoolCount) * 100);
                  return (
                    <Link key={s.school_code} href={`/etudiants?school=${s.school_code}`}>
                      <div className="group cursor-pointer">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{cfg.icon}</span>
                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded", cfg.badge)}>
                              {s.school_code}
                            </span>
                            <span className="text-xs text-muted-foreground hidden sm:inline">{cfg.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {s.count}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all group-hover:opacity-80", cfg.barColor ?? "bg-primary")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>

        {/* Top 5 inscriptions en cours */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Inscriptions EN COURS récentes
          </p>
          <Card className="bg-card shadow-sm">
            <CardContent className="p-0">
              {!statsData?.top_unpaid || statsData.top_unpaid.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 opacity-20" />
                  <p className="text-sm">Aucune inscription en cours</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {statsData.top_unpaid.map((item) => {
                    const cfg = item.school_code ? SCHOOL_CONFIG[item.school_code] : null;
                    const initials = item.student
                      ? `${item.student.last_name[0] ?? ""}${item.student.first_name[0] ?? ""}`.toUpperCase()
                      : "?";
                    return (
                      <Link key={item.id} href={`/inscriptions/${item.id}`}>
                        <div className={cn(
                          "flex items-center gap-3 px-5 py-3.5 hover:bg-accent/40 transition-colors border-l-4 group",
                          cfg?.rowBorder ?? "border-l-muted"
                        )}>
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            cfg?.avatar ?? "bg-muted text-muted-foreground"
                          )}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-foreground truncate">
                              {item.student
                                ? `${item.student.last_name} ${item.student.first_name}`
                                : "—"}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              {item.school_code && (
                                <span className={cn("font-bold", cfg?.accent)}>{item.school_code}</span>
                              )}
                              {item.school_code && item.academic_year && <span>·</span>}
                              <span>{item.academic_year ?? "—"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                              <AlertCircle className="w-3 h-3" />
                              En cours
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
              <div className="px-5 py-3 border-t border-border">
                <Link href="/inscriptions?status=EN_COURS">
                  <span className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                    Voir toutes les inscriptions en cours
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* ── Établissements ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Établissements
          </p>
          <span className="text-xs text-muted-foreground">Cliquer pour voir les étudiants</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Object.entries(SCHOOL_CONFIG).map(([code, cfg]) => (
            <Link key={code} href={`/etudiants?school=${code}`}>
              <Card className={`bg-card shadow-sm border-l-4 ${cfg.cardBorder} hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-0.5`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${cfg.accentBg}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mb-1.5 ${cfg.badge}`}>
                        {code}
                      </span>
                      <div className="text-sm font-medium text-foreground leading-snug">
                        {cfg.name}
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-all mt-1 shrink-0 ${cfg.accent}`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Actions rapides ──────────────────────────────────────── */}
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
          <Link href="/documents">
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-card border border-border hover:bg-accent text-sm font-medium text-foreground transition-colors shadow-sm">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              Documents PDF
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
