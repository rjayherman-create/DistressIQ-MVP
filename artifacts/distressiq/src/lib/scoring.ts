import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const scorePill = (value: number) => {
  if (value >= 70) return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
  if (value >= 50) return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
  return 'bg-rose-500/15 text-rose-700 border-rose-500/30';
};

export const statusPill = (status: string) => {
  switch (status) {
    case 'Recovery Candidate':
      return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
    case 'Management Action Likely':
      return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
    default:
      return 'bg-rose-500/15 text-rose-700 border-rose-500/30';
  }
};
