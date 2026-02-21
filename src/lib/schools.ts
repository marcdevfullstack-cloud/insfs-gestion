/**
 * Configuration centralisée des couleurs et labels par école INSFS.
 * Utilisé dans toutes les pages pour une cohérence visuelle complète.
 */

export interface SchoolConfig {
  name: string;
  shortName: string;
  icon: string;
  /** Badge coloré (fond + texte + border) */
  badge: string;
  /** Pastille de couleur */
  dot: string;
  /** Texte accent */
  accent: string;
  /** Fond accent léger */
  accentBg: string;
  /** Bordure gauche table row */
  rowBorder: string;
  /** Avatar initiales (fond + texte) */
  avatar: string;
  /** Carte dashboard (border-l-4) */
  cardBorder: string;
  /** Barre de progression distribution */
  barColor: string;
}

export const SCHOOL_CONFIG: Record<string, SchoolConfig> = {
  EES: {
    name: "École des Éducateurs Spécialisés",
    shortName: "Éduc. Spécialisés",
    icon: "🎓",
    badge:      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
    dot:        "bg-emerald-500",
    accent:     "text-emerald-600 dark:text-emerald-400",
    accentBg:   "bg-emerald-500/10",
    rowBorder:  "border-l-emerald-500",
    avatar:     "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
    cardBorder: "border-l-emerald-500",
    barColor:   "bg-emerald-500",
  },
  EEP: {
    name: "École des Éducateurs Préscolaires",
    shortName: "Éduc. Préscolaires",
    icon: "📚",
    badge:      "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800",
    dot:        "bg-sky-500",
    accent:     "text-sky-600 dark:text-sky-400",
    accentBg:   "bg-sky-500/10",
    rowBorder:  "border-l-sky-500",
    avatar:     "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300",
    cardBorder: "border-l-sky-500",
    barColor:   "bg-sky-500",
  },
  EAS: {
    name: "École des Assistants Sociaux",
    shortName: "Assistants Sociaux",
    icon: "🤝",
    badge:      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800",
    dot:        "bg-orange-500",
    accent:     "text-orange-600 dark:text-orange-400",
    accentBg:   "bg-orange-500/10",
    rowBorder:  "border-l-orange-500",
    avatar:     "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
    cardBorder: "border-l-orange-500",
    barColor:   "bg-orange-500",
  },
  CPPE: {
    name: "CPPE-PILOTE",
    shortName: "CPPE-Pilote",
    icon: "🏫",
    badge:      "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800",
    dot:        "bg-violet-500",
    accent:     "text-violet-600 dark:text-violet-400",
    accentBg:   "bg-violet-500/10",
    rowBorder:  "border-l-violet-500",
    avatar:     "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300",
    cardBorder: "border-l-violet-500",
    barColor:   "bg-violet-500",
  },
};

const DEFAULT_SCHOOL: SchoolConfig = {
  name: "École inconnue",
  shortName: "Inconnue",
  icon: "🏢",
  badge:      "bg-muted text-muted-foreground border border-border",
  dot:        "bg-muted-foreground",
  accent:     "text-muted-foreground",
  accentBg:   "bg-muted",
  rowBorder:  "border-l-border",
  avatar:     "bg-muted text-muted-foreground",
  cardBorder: "border-l-border",
  barColor:   "bg-muted-foreground",
};

export function getSchool(code?: string | null): SchoolConfig {
  if (!code) return DEFAULT_SCHOOL;
  return SCHOOL_CONFIG[code] ?? DEFAULT_SCHOOL;
}

/** Config des statuts étudiants */
export const STUDENT_STATUS_CONFIG: Record<string, { badge: string; avatar: string; dot: string }> = {
  Fonctionnaire: {
    badge:  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
    avatar: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    dot:    "bg-blue-500",
  },
  "Boursier national": {
    badge:  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
    avatar: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    dot:    "bg-emerald-500",
  },
  "Boursier étranger": {
    badge:  "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800",
    avatar: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
    dot:    "bg-violet-500",
  },
  "Non-boursier": {
    badge:  "bg-muted text-muted-foreground border border-border",
    avatar: "bg-muted text-muted-foreground",
    dot:    "bg-muted-foreground",
  },
};

export function getStudentStatus(status?: string | null) {
  const fallback = {
    badge: "bg-muted text-muted-foreground border border-border",
    avatar: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  };
  if (!status) return fallback;
  return STUDENT_STATUS_CONFIG[status] ?? fallback;
}
