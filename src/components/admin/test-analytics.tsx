"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Question } from "@/types/database";

type Props = {
    questions: Question[];
    attempts: any[];
    responses: any[];
};

export function TestAnalytics({ questions, attempts, responses }: Props) {
    const submittedAttempts = attempts.filter((a) => a.status === "submitted");

    // Score Distribution
    const scoreDistribution = useMemo(() => {
        if (submittedAttempts.length === 0) return [];
        const scores = submittedAttempts.map((a) => a.total_score || 0);
        const maxScore = Math.max(...submittedAttempts.map((a) => a.max_score || 1));

        // Create 5 buckets
        const buckets = [0, 0, 0, 0, 0];
        scores.forEach((s) => {
            const pct = (s / maxScore) * 100;
            const idx = Math.min(Math.floor(pct / 20), 4);
            buckets[idx]++;
        });
        return buckets;
    }, [submittedAttempts]);

    // Question Performance
    const questionStats = useMemo(() => {
        return questions.map((q) => {
            const qResponses = responses.filter((r) => r.question_id === q.id);
            const correctCount = qResponses.filter((r) => r.is_correct).length;
            const successRate = qResponses.length > 0 ? (correctCount / qResponses.length) * 100 : 0;
            return {
                id: q.id,
                text: q.question_text,
                successRate,
                total: qResponses.length,
            };
        }).sort((a, b) => a.successRate - b.successRate); // Hardest first
    }, [questions, responses]);

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Score Distribution</CardTitle>
                    <CardDescription>Percentage of students in each score range</CardDescription>
                </CardHeader>
                <CardContent className="h-[200px] flex items-end gap-2 px-6 pb-8">
                    {scoreDistribution.map((count, i) => {
                        const height = submittedAttempts.length > 0 ? (count / submittedAttempts.length) * 100 : 0;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-primary/20 rounded-t-sm relative group"
                                    style={{ height: `${Math.max(height, 2)}%` }}
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        {count}
                                    </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                    {i * 20}-{(i + 1) * 20}%
                                </span>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Question Difficulty</CardTitle>
                    <CardDescription>Questions with lowest success rates</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {questionStats.slice(0, 5).map((qs, i) => (
                            <div key={qs.id} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="truncate font-medium max-w-[200px]">Q. {qs.text}</span>
                                    <span className="text-muted-foreground">{qs.successRate.toFixed(0)}% correct</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${qs.successRate < 30 ? 'bg-destructive' : qs.successRate < 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                                        style={{ width: `${qs.successRate}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
