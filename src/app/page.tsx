import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users, BookOpen, CreditCard, FileText, Shield } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Gestion des étudiants",
    description: "Enregistrement, suivi et gestion complète des dossiers étudiants avec photo d'identité.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: BookOpen,
    title: "Inscriptions",
    description: "Suivi des inscriptions par école, année académique et statut, avec gestion multi-établissements.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: CreditCard,
    title: "Paiements & comptabilité",
    description: "Enregistrement des paiements en tranches, suivi du recouvrement et bilan financier.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: FileText,
    title: "Documents officiels",
    description: "Génération automatique des certificats d'inscription et fiches de renseignements avec QR code.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
];

const schools = [
  { code: "EES", name: "École des Éducateurs Spécialisés" },
  { code: "EEP", name: "École des Éducateurs de la Petite Enfance" },
  { code: "EAS", name: "École des Assistants Sociaux" },
  { code: "CPPE", name: "Centre de Perfectionnement pour Professionnels de l'Enfance" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-gray-200 shrink-0">
              <Image src="/insfs-logo.jpg" alt="INSFS" fill className="object-cover" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 tracking-wide">INSFS</div>
              <div className="text-xs text-gray-500 leading-none">Côte d&apos;Ivoire</div>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-medium transition-colors"
          >
            Connexion
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Drapeau CI */}
        <div className="flex justify-center mb-8">
          <div className="flex h-6 w-10 rounded overflow-hidden shadow-sm">
            <div className="flex-1 bg-orange-500" />
            <div className="flex-1 bg-white border-y border-gray-200" />
            <div className="flex-1 bg-green-700" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium mb-6">
          <Shield className="w-3.5 h-3.5" />
          Plateforme officielle de l&apos;INSFS
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4 leading-tight">
          Institut National de<br />
          <span className="text-green-700">Formation Sociale</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Plateforme de gestion des inscriptions, paiements et documents officiels
          pour les quatre établissements de l&apos;INSFS de Côte d&apos;Ivoire.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-medium transition-colors shadow-sm"
          >
            Accéder à la plateforme
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="text-sm text-gray-500">
            Réservé au personnel autorisé
          </div>
        </div>
      </section>

      {/* ── Séparateur tricolore ── */}
      <div className="max-w-6xl mx-auto px-6 mb-16">
        <div className="flex h-0.5 rounded-full overflow-hidden">
          <div className="flex-1 bg-orange-400" />
          <div className="flex-1 bg-gray-200" />
          <div className="flex-1 bg-green-600" />
        </div>
      </div>

      {/* ── Fonctionnalités ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fonctionnalités de la plateforme</h2>
          <p className="text-gray-500 text-sm">Un outil complet pour la gestion administrative</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="p-6 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white">
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Établissements ── */}
      <section className="bg-gray-50 border-y border-gray-200 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Les quatre établissements de l&apos;INSFS</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {schools.map((s) => (
              <div key={s.code} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-green-700 text-white text-sm font-bold mb-3">
                  {s.code}
                </div>
                <div className="text-sm text-gray-700 font-medium leading-snug">{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="max-w-6xl mx-auto px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="flex h-4 w-7 rounded overflow-hidden">
            <div className="flex-1 bg-orange-500" />
            <div className="flex-1 bg-white border-y border-gray-200" />
            <div className="flex-1 bg-green-700" />
          </div>
          <span className="text-xs text-gray-500">République de Côte d&apos;Ivoire</span>
        </div>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} INSFS — Institut National de Formation Sociale.
          Ministère de la Femme, de la Famille et de l&apos;Enfant.
        </p>
      </footer>

    </div>
  );
}
