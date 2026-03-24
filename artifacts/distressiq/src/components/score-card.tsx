import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";
import { scorePill } from "@/lib/scoring";

interface ScoreCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  note: string;
}

export function ScoreCard({ title, value, icon: Icon, note }: ScoreCardProps) {
  return (
    <Card className="rounded-3xl shadow-sm border-border/50 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
              <Badge variant="outline" className={`rounded-lg px-2.5 py-0.5 font-medium ${scorePill(value)}`}>
                {value >= 70 ? 'Strong' : value >= 50 ? 'Mixed' : 'Weak'}
              </Badge>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-100/80 p-3 ring-1 ring-slate-200/50">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
        </div>
        <Progress value={value} className="mt-4 h-2 bg-slate-100" />
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{note}</p>
      </CardContent>
    </Card>
  );
}
