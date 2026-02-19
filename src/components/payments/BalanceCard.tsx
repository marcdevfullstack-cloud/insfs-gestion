"use client";

import { cn } from "@/lib/utils";

interface BalanceCardProps {
  totalPaid: number;
  totalOwed: number;
  className?: string;
}

function formatFcfa(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export function BalanceCard({ totalPaid, totalOwed, className }: BalanceCardProps) {
  const percentage = totalOwed > 0 ? Math.min(100, (totalPaid / totalOwed) * 100) : 0;
  const balance = Math.max(0, totalOwed - totalPaid);

  const barColor =
    percentage >= 100 ? "bg-emerald-500"
    : percentage >= 60  ? "bg-amber-500"
    : "bg-red-500";

  const accentColor =
    percentage >= 100
      ? "text-emerald-600 dark:text-emerald-400"
      : percentage >= 60
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  const statusLabel =
    percentage >= 100 ? "Soldé" : percentage >= 60 ? "Partiel" : "Insuffisant";

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">Suivi financier</span>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-xs font-medium", accentColor)}>{statusLabel}</span>
          <span className={cn("text-sm font-bold tabular-nums", accentColor)}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="w-full bg-muted rounded-full h-2.5 mb-4 overflow-hidden">
        <div
          className={cn("h-2.5 rounded-full transition-all duration-700", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-muted p-2.5">
          <div className="text-xs text-muted-foreground mb-0.5">Payé</div>
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 leading-tight">
            {formatFcfa(totalPaid)}
          </div>
        </div>
        <div className="rounded-lg bg-muted p-2.5">
          <div className="text-xs text-muted-foreground mb-0.5">Total dû</div>
          <div className="text-xs font-semibold text-foreground leading-tight">
            {formatFcfa(totalOwed)}
          </div>
        </div>
        <div className="rounded-lg bg-muted p-2.5">
          <div className="text-xs text-muted-foreground mb-0.5">Reste</div>
          <div className={cn(
            "text-xs font-semibold leading-tight",
            balance > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
          )}>
            {formatFcfa(balance)}
          </div>
        </div>
      </div>
    </div>
  );
}
