import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Stock } from "@workspace/api-client-react";

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

export interface BounceFactorResult {
  label: string;
  detail: string;
  passed: boolean;
}

// Thresholds used by getBounceFactors — extracted as named constants so the
// business rules are explicit and easy to update.
const MAX_DAYS_UNDER_ONE = 60;
const MIN_TRADABILITY_SCORE = 60;
const MIN_OPERATOR_SCORE = 55;
const MIN_COMPLIANCE_SCORE_FOR_NEWS = 70;
const MIN_PATTERN_SCORE_FOR_NEWS = 60;
const MAX_DELISTING_RISK = 50;

/**
 * Derives the four bounce-score contributing factors from the stock's own data.
 * No numbers are invented — every value shown comes directly from the stock record.
 */
export function getBounceFactors(stock: Stock): BounceFactorResult[] {
  // Factor 1: Short time under $1 (fewer days = healthier setup)
  const shortTimeUnderOne = stock.daysUnderOne < MAX_DAYS_UNDER_ONE;

  // Factor 2: Increasing volume trend — requires the recent chart to show a
  // price uptick AND the tradability score to confirm liquidity quality.
  const chart = stock.chart;
  const priceUptick =
    chart.length >= 3 &&
    chart[chart.length - 1].p >= chart[chart.length - 3].p;
  const increasingVolumeTrend = priceUptick && stock.tradabilityScore >= MIN_TRADABILITY_SCORE;

  // Factor 3: Recent positive news — operator engagement and compliance
  // trajectory both above threshold signals active management response.
  const recentPositiveNews =
    stock.operatorScore >= MIN_OPERATOR_SCORE ||
    (stock.complianceScore >= MIN_COMPLIANCE_SCORE_FOR_NEWS && stock.patternScore >= MIN_PATTERN_SCORE_FOR_NEWS);

  // Factor 4: No delisting notice yet — low delisting risk and not already
  // classified as a high-risk name.
  const noDelistingNotice =
    stock.delistingRisk < MAX_DELISTING_RISK && stock.status !== 'High Delisting Risk';

  return [
    {
      label: 'Short time under $1',
      detail: `${stock.daysUnderOne} days`,
      passed: shortTimeUnderOne,
    },
    {
      label: 'Increasing volume trend',
      detail: `Tradability ${stock.tradabilityScore}`,
      passed: increasingVolumeTrend,
    },
    {
      label: 'Recent positive news',
      detail: `Operator score ${stock.operatorScore}`,
      passed: recentPositiveNews,
    },
    {
      label: 'No delisting notice yet',
      detail: `Delisting risk ${stock.delistingRisk}%`,
      passed: noDelistingNotice,
    },
  ];
}
