import React from "react";
import { CheckCircle2, XCircle, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBounceFactors, scorePill } from "@/lib/scoring";
import type { Stock } from "@workspace/api-client-react";

interface BounceScoreBreakdownProps {
  stock: Stock;
}

export function BounceScoreBreakdown({ stock }: BounceScoreBreakdownProps) {
  const factors = getBounceFactors(stock);
  const passedCount = factors.filter((f) => f.passed).length;

  return (
    <Card className="rounded-[2rem] shadow-sm border-slate-200/60">
      <CardHeader className="pt-6 px-6 pb-4">
        <CardTitle className="text-xl font-display font-bold">
          Bounce score breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-5">
        {/* Score display */}
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Bounce Score
            </p>
            <p className="mt-1 text-4xl font-bold text-slate-900 tabular-nums">
              {stock.bounceProbability}
              <span className="text-xl text-slate-400">%</span>
            </p>
          </div>
          <div
            className={`rounded-2xl px-4 py-2 text-sm font-bold ring-1 ${scorePill(stock.bounceProbability)}`}
          >
            {passedCount} / {factors.length} factors met
          </div>
        </div>

        {/* Factor list */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Why
          </p>
          {factors.map((factor) => (
            <div
              key={factor.label}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                factor.passed
                  ? "border-emerald-100 bg-emerald-50/50"
                  : "border-slate-100 bg-slate-50/50"
              }`}
            >
              {factor.passed ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-slate-300" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold leading-none ${
                    factor.passed ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {factor.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{factor.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Rule reminder */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3.5 flex items-start gap-3">
          <Brain className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <div>
            <p className="text-xs font-bold text-slate-700">
              Simple rule to remember
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              If a number affects money — AI cannot invent it. Every figure
              above is sourced directly from the stock record.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
