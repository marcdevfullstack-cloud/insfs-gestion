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
    percentage >= 100
      ? "bg-emerald-500"
      : percentage >= 60
      ? "bg-amber-500"
      : "bg-red-500";

  const textColor =
    percentage >= 100
      ? "text-emerald-400"
      : percentage >= 60
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className={cn("rounded-lg border border-slate-700/50 bg-slate-800/50 p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">Suivi financier</span>
        <span className={cn("text-sm font-bold", textColor)}>{percentage.toFixed(0)}%</span>
      </div>

      {/* Barre de progression */}
      <div className="w-full bg-slate-700 rounded-full h-2.5 mb-3 overflow-hidden">
        <div
          className={cn("h-2.5 rounded-full transition-all duration-500", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-slate-500 mb-0.5">Payé</div>
          <div className="text-sm font-semibold text-emerald-400">
            {formatFcfa(totalPaid)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-0.5">Total dû</div>
          <div className="text-sm font-semibold text-white">
            {formatFcfa(totalOwed)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-0.5">Reste</div>
          <div className={cn("text-sm font-semibold", balance > 0 ? "text-red-400" : "text-emerald-400")}>
            {formatFcfa(balance)}
          </div>
        </div>
      </div>
    </div>
  );
}
