"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, AlertCircle, Clock, Users, BookOpen, Sparkles, HelpCircle } from "lucide-react";
import { TestAnalytics } from "./test-analytics";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Question, Attempt, Response } from "@/types/database";

type Props = {
    test: any;
    questions: Question[];
    attempts: any[];
    responses: any[];
};

export function TestReportsClient({ test, questions, attempts, responses }: Props) {
    // Tab state: "summary" | "detailed" | "wrong"
    const [activeTab, setActiveTab] = useState<"summary" | "detailed" | "wrong">("summary");
    
    // Student search and selection states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
        attempts.map((a) => a.student_id)
    );

    // Expand/collapse states for question detail sections
    const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

    // Toggle question details
    const toggleQuestion = (id: string) => {
        setExpandedQuestions((prev) => ({ ...prev, id: !prev[id] }));
    };

    // Filter students shown in the selection sidebar
    const filteredStudentsList = useMemo(() => {
        return attempts.map((a) => ({
            id: a.student_id,
            name: a.student.full_name || "No name",
            email: a.student.email,
            status: a.status,
            score: a.total_score,
            maxScore: a.max_score,
        })).filter((s) => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [attempts, searchQuery]);

    // Selected attempts and responses
    const selectedAttempts = useMemo(() => {
        return attempts.filter((a) => selectedStudentIds.includes(a.student_id));
    }, [attempts, selectedStudentIds]);

    const selectedResponses = useMemo(() => {
        const attemptIds = selectedAttempts.map((a) => a.id);
        return responses.filter((r) => attemptIds.includes(r.attempt_id));
    }, [responses, selectedAttempts]);

    // 1st Report: Question detailed statistics
    const questionStats = useMemo(() => {
        return questions.map((q) => {
            const qResponses = selectedResponses.filter((r) => r.question_id === q.id);
            const correctResponses = qResponses.filter((r) => r.is_correct === true);
            const wrongResponses = qResponses.filter((r) => r.is_correct === false);
            const skippedResponses = qResponses.filter((r) => r.status === "unanswered" || r.status === "skipped");
            
            const totalAttempts = qResponses.length;
            const successRate = totalAttempts > 0 ? (correctResponses.length / totalAttempts) * 100 : 0;
            const avgTime = totalAttempts > 0 ? qResponses.reduce((acc, r) => acc + (r.time_spent_seconds || 0), 0) / totalAttempts : 0;

            return {
                question: q,
                totalAttempts,
                correctCount: correctResponses.length,
                wrongCount: wrongResponses.length,
                skippedCount: skippedResponses.length,
                successRate,
                avgTime,
            };
        });
    }, [questions, selectedResponses]);

    // 2nd Report: Filter questions where at least one student got it wrong
    const hardestQuestions = useMemo(() => {
        return questionStats.filter((qs) => qs.wrongCount > 0);
    }, [questionStats]);

    const handleSelectAll = () => {
        setSelectedStudentIds(attempts.map((a) => a.student_id));
    };

    const handleClearAll = () => {
        setSelectedStudentIds([]);
    };

    const formatResponseValue = (q: Question, r: Response) => {
        if (r.status === "unanswered" || r.status === "skipped") {
            return "Skipped / Unanswered";
        }
        if (q.type === "mcq") {
            return `Selected Option: ${r.selected_option || "—"}`;
        }
        if (q.type === "msq") {
            try {
                const parsed = JSON.parse(r.selected_option || "[]");
                return `Selected Options: ${Array.isArray(parsed) ? parsed.join(", ") : r.selected_option || "—"}`;
            } catch {
                return `Selected Option: ${r.selected_option || "—"}`;
            }
        }
        if (q.type === "numeric") {
            return `Entered Value: ${r.numeric_answer !== null ? r.numeric_answer : "—"}`;
        }
        return "—";
    };

    const formatCorrectAnswer = (q: Question) => {
        const ans = q.correct_answer as any;
        if (q.type === "mcq" || q.type === "msq") {
            return Array.isArray(ans?.options) ? ans.options.join(", ") : ans?.options || "—";
        }
        if (q.type === "numeric") {
            return `${ans?.value}${q.numeric_tolerance ? ` (± ${q.numeric_tolerance})` : ""}`;
        }
        return "—";
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Sidebar: Student Selector */}
            <div className="lg:col-span-1 bento-card p-4 space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-primary" />
                        Select Students ({selectedStudentIds.length})
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Filter the report data in real-time</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 text-xs bg-black/20 h-9"
                    />
                </div>

                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSelectAll}
                        className="flex-1 text-[10px] h-7 border-white/10 hover:bg-white/5 font-bold"
                    >
                        Select All
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleClearAll}
                        className="flex-1 text-[10px] h-7 border-red-500/10 text-destructive hover:bg-red-500/10 font-bold"
                    >
                        Clear All
                    </Button>
                </div>

                {attempts.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">No student attempts yet.</p>
                ) : (
                    <div className="max-h-[350px] overflow-y-auto space-y-1.5 scrollbar-thin border border-white/[0.04] rounded-lg p-2 bg-black/20">
                        {filteredStudentsList.map((student) => {
                            const isChecked = selectedStudentIds.includes(student.id);
                            return (
                                <label
                                    key={student.id}
                                    className={cn(
                                        "flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer select-none transition-colors",
                                        isChecked ? "bg-white/[0.03] text-foreground" : "text-muted-foreground hover:bg-white/[0.01]"
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        className="rounded border-white/20 bg-black/30 text-primary focus:ring-primary/20"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedStudentIds((prev) => [...prev, student.id]);
                                            } else {
                                                setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id));
                                            }
                                        }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold truncate">{student.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={cn(
                                                "text-[8px] px-1 py-0.2 rounded font-semibold tracking-tighter uppercase",
                                                student.status === "submitted" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                                            )}>
                                                {student.status}
                                            </span>
                                            {student.status === "submitted" && student.score !== null && (
                                                <span className="text-[9px] text-muted-foreground font-mono">
                                                    {student.score}/{student.maxScore}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                        {filteredStudentsList.length === 0 && (
                            <p className="text-[11px] text-muted-foreground text-center py-4">No matching students found.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
                
                {/* Reports Navigation Bar */}
                <div className="flex border-b border-white/[0.06] gap-1.5 pb-2">
                    <button
                        onClick={() => setActiveTab("summary")}
                        className={cn(
                            "px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200",
                            activeTab === "summary" 
                                ? "text-primary bg-primary/10" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        Summary Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab("detailed")}
                        className={cn(
                            "px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200",
                            activeTab === "detailed" 
                                ? "text-primary bg-primary/10" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        Detailed Question Report
                    </button>
                    <button
                        onClick={() => setActiveTab("wrong")}
                        className={cn(
                            "px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 relative",
                            activeTab === "wrong" 
                                ? "text-primary bg-primary/10" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        Focus Areas (Mistakes)
                        {hardestQuestions.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[8px] font-black h-4 px-1 rounded-full flex items-center justify-center animate-pulse">
                                {hardestQuestions.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Warning: No students selected banner */}
                {selectedStudentIds.length === 0 ? (
                    <Card className="border-dashed border-white/10 bg-white/[0.02]">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="h-10 w-10 text-muted-foreground/60 mb-3" />
                            <h3 className="font-bold text-base">No Students Selected</h3>
                            <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                                Please select one or multiple students from the left sidebar to generate and evaluate their performance reports.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Tab Content: Summary */}
                        {activeTab === "summary" && (
                            <div className="space-y-6">
                                <TestAnalytics
                                    questions={questions}
                                    attempts={selectedAttempts}
                                    responses={selectedResponses}
                                />
                                
                                <Card className="glass-strong">
                                    <CardHeader>
                                        <CardTitle className="text-base">Attempts ({selectedAttempts.length})</CardTitle>
                                        <CardDescription>Filtered performance listing</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs sm:text-sm">
                                                <thead>
                                                    <tr className="border-b border-white/[0.06] text-muted-foreground">
                                                        <th className="py-2.5 pr-2 font-medium">Student</th>
                                                        <th className="py-2.5 pr-2 font-medium">Status</th>
                                                        <th className="py-2.5 pr-2 font-medium">Score</th>
                                                        <th className="py-2.5 font-medium">Time Taken</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/[0.04]">
                                                    {selectedAttempts.map((a) => (
                                                        <tr key={a.id} className="hover:bg-white/[0.01]">
                                                            <td className="py-3 pr-2">
                                                                <p className="font-bold text-foreground">
                                                                    {a.student.full_name ?? a.student.email}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground font-mono">
                                                                    {a.student.email}
                                                                </p>
                                                            </td>
                                                            <td className="py-3 pr-2">
                                                                <Badge
                                                                    variant={a.status === "submitted" ? "success" : "warning"}
                                                                    className="h-5 text-[9px] uppercase tracking-tighter"
                                                                >
                                                                    {a.status}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-3 pr-2 font-bold font-mono text-primary">
                                                                {a.status === "submitted" && a.total_score !== null
                                                                    ? `${a.total_score} / ${a.max_score}`
                                                                    : "—"}
                                                            </td>
                                                            <td className="py-3 font-medium text-muted-foreground flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDuration(a.total_time_seconds)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Tab Content: Detailed Question Report */}
                        {activeTab === "detailed" && (
                            <div className="space-y-4">
                                {questionStats.map((qs, idx) => {
                                    const q = qs.question;
                                    const isExpanded = expandedQuestions[q.id] !== false; // expanded by default
                                    return (
                                        <Card key={q.id} className="overflow-hidden glass-strong">
                                            <CardHeader className="p-4 cursor-pointer hover:bg-white/[0.01] transition-colors select-none" onClick={() => toggleQuestion(q.id)}>
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="font-mono text-xs text-primary bg-primary/5 h-6">
                                                            Q {q.order_index + 1}
                                                        </Badge>
                                                        <Badge variant="secondary" className="capitalize text-[10px] h-5">
                                                            {q.type}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground font-semibold">
                                                            {q.marks} Mark{Number(q.marks) === 1 ? "" : "s"}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs font-bold font-mono">
                                                        <span className="text-green-400">
                                                            {qs.correctCount} Correct
                                                        </span>
                                                        <span className="text-red-400">
                                                            {qs.wrongCount} Wrong
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {qs.successRate.toFixed(0)}% Pass
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-3">
                                                    <p className="font-bold text-sm sm:text-base text-foreground line-clamp-2">
                                                        {q.question_text}
                                                    </p>
                                                </div>
                                            </CardHeader>
                                            
                                            {isExpanded && (
                                                <CardContent className="border-t border-white/[0.04] p-4 bg-black/10 space-y-4">
                                                    
                                                    {/* Metadata Summary */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                                        <div className="space-y-1.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                                            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Correct Answer</p>
                                                            <p className="font-mono font-bold text-primary">{formatCorrectAnswer(q)}</p>
                                                        </div>
                                                        <div className="space-y-1.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                                            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Timing Stats</p>
                                                            <p className="font-medium text-foreground flex items-center gap-1">
                                                                <Clock className="h-3.5 w-3.5 text-primary" />
                                                                Average spent: <strong className="text-foreground">{qs.avgTime.toFixed(1)}s</strong>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Selected Students Response List */}
                                                    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
                                                        <table className="w-full text-left text-xs">
                                                            <thead>
                                                                <tr className="bg-white/[0.02] border-b border-white/[0.06] text-muted-foreground">
                                                                    <th className="p-3 font-semibold">Student</th>
                                                                    <th className="p-3 font-semibold text-center">Correctness</th>
                                                                    <th className="p-3 font-semibold">Answer Provided</th>
                                                                    <th className="p-3 font-semibold text-right">Time Spent</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-white/[0.04]">
                                                                {selectedAttempts.map((attempt) => {
                                                                    const studentResponse = selectedResponses.find(
                                                                        (r) => r.attempt_id === attempt.id && r.question_id === q.id
                                                                    );
                                                                    
                                                                    return (
                                                                        <tr key={attempt.id} className="hover:bg-white/[0.01]">
                                                                            <td className="p-3">
                                                                                <p className="font-bold text-foreground">{attempt.student.full_name ?? attempt.student.email}</p>
                                                                                <p className="text-[10px] text-muted-foreground">{attempt.student.email}</p>
                                                                            </td>
                                                                            <td className="p-3 text-center">
                                                                                {!studentResponse ? (
                                                                                    <Badge variant="outline" className="text-muted-foreground bg-white/5 border-white/10 text-[9px] px-1.5">
                                                                                        No Attempt
                                                                                    </Badge>
                                                                                ) : studentResponse.status === "unanswered" || studentResponse.status === "skipped" ? (
                                                                                    <Badge variant="warning" className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 gap-1">
                                                                                        <AlertCircle className="h-2.5 w-2.5" />
                                                                                        Skipped
                                                                                    </Badge>
                                                                                ) : studentResponse.is_correct ? (
                                                                                    <Badge variant="success" className="bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] px-1.5 gap-1">
                                                                                        <CheckCircle className="h-2.5 w-2.5" />
                                                                                        Correct
                                                                                    </Badge>
                                                                                ) : (
                                                                                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] px-1.5 gap-1">
                                                                                        <XCircle className="h-2.5 w-2.5" />
                                                                                        Incorrect
                                                                                    </Badge>
                                                                                )}
                                                                            </td>
                                                                            <td className="p-3 font-mono text-foreground font-medium max-w-[150px] sm:max-w-[250px] truncate">
                                                                                {studentResponse ? formatResponseValue(q, studentResponse) : "—"}
                                                                            </td>
                                                                            <td className="p-3 text-right font-medium text-muted-foreground">
                                                                                {studentResponse && studentResponse.time_spent_seconds 
                                                                                    ? `${studentResponse.time_spent_seconds}s` 
                                                                                    : "—"}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </CardContent>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {/* Tab Content: Wrong Answers (Focus Areas) */}
                        {activeTab === "wrong" && (
                            <div className="space-y-4">
                                {hardestQuestions.length === 0 ? (
                                    <Card className="border-dashed border-green-500/20 bg-green-500/5">
                                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                            <Sparkles className="h-10 w-10 text-green-400 mb-3 animate-bounce" />
                                            <h3 className="font-bold text-base text-green-300">Perfect Score / Performance!</h3>
                                            <p className="text-xs text-green-400/80 max-w-sm mt-1">
                                                None of the selected students got any questions wrong. They answered every question correctly or haven&apos;t submitted wrong responses.
                                            </p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <>
                                        <div className="bg-destructive/10 border border-destructive/20 text-red-400 p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                                            <span>
                                                Below are the <strong>{hardestQuestions.length} Focus Areas</strong>. These represent questions that one or more selected students answered incorrectly.
                                            </span>
                                        </div>

                                        {hardestQuestions.map((qs) => {
                                            const q = qs.question;
                                            // Get list of attempts who answered this question wrong
                                            const incorrectStudentAttempts = selectedAttempts.filter((attempt) => {
                                                const resp = selectedResponses.find(
                                                    (r) => r.attempt_id === attempt.id && r.question_id === q.id
                                                );
                                                return resp && resp.is_correct === false;
                                            });

                                            return (
                                                <Card key={q.id} className="border-destructive/20 glass-strong">
                                                    <CardHeader className="p-4 border-b border-white/[0.04]">
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="font-mono text-xs text-destructive bg-destructive/10 border-destructive/20 h-6">
                                                                    Q {q.order_index + 1}
                                                                </Badge>
                                                                <Badge variant="secondary" className="capitalize text-[10px] h-5">
                                                                    {q.type}
                                                                </Badge>
                                                            </div>
                                                            <span className="text-xs font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">
                                                                {incorrectStudentAttempts.length} Student{incorrectStudentAttempts.length === 1 ? "" : "s"} got this wrong
                                                            </span>
                                                        </div>
                                                        <div className="mt-3">
                                                            <h3 className="font-bold text-sm sm:text-base text-foreground leading-relaxed">
                                                                {q.question_text}
                                                            </h3>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-4 space-y-4">
                                                        
                                                        {/* Correct answer reference */}
                                                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs">
                                                            <span className="font-bold text-muted-foreground mr-2">Expected Correct Answer:</span>
                                                            <span className="font-mono font-black text-primary">{formatCorrectAnswer(q)}</span>
                                                        </div>

                                                        {/* Detailed list of students who failed the question */}
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Incorrect Student Responses</p>
                                                            <div className="grid gap-2">
                                                                {incorrectStudentAttempts.map((attempt) => {
                                                                    const resp = selectedResponses.find(
                                                                        (r) => r.attempt_id === attempt.id && r.question_id === q.id
                                                                    );
                                                                    return (
                                                                        <div 
                                                                            key={attempt.id} 
                                                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs"
                                                                        >
                                                                            <div>
                                                                                <p className="font-bold text-foreground">{attempt.student.full_name ?? attempt.student.email}</p>
                                                                                <p className="text-[10px] text-muted-foreground">{attempt.student.email}</p>
                                                                            </div>
                                                                            <div className="flex items-center gap-4 font-mono font-semibold self-end sm:self-center">
                                                                                <span className="text-red-400">
                                                                                    {resp ? formatResponseValue(q, resp) : "—"}
                                                                                </span>
                                                                                <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                                                                                    <Clock className="h-3 w-3" />
                                                                                    Time spent: {resp?.time_spent_seconds ? `${resp.time_spent_seconds}s` : "—"}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
