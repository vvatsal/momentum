"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBulkQuestions } from "@/app/actions/test";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from "lucide-react";

type Props = {
    testId: string;
};

export function BulkUploadDialog({ testId }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [csvText, setCsvText] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const parseCSV = (text: string) => {
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) throw new Error("CSV must have a header and at least one data row.");

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const dataRows = lines.slice(1);

        return dataRows.map((row, index) => {
            // Simple CSV split (doesn't handle quoted commas, but good for a start)
            // For a more robust solution, we'd use a library or a better regex
            const values = row.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
            const obj: any = {};
            headers.forEach((h, i) => {
                obj[h] = values[i];
            });

            const type = obj.type?.toLowerCase();
            if (type !== "mcq" && type !== "numeric") {
                throw new Error(`Row ${index + 2}: Invalid type "${type}". Must be "mcq" or "numeric".`);
            }

            const base = {
                type,
                question_text: obj.question || obj.question_text,
                marks: parseFloat(obj.marks || "1"),
                explanation: obj.explanation || null,
            };

            if (!base.question_text) throw new Error(`Row ${index + 2}: Question text is missing.`);

            if (type === "mcq") {
                const options = (obj.options || "").split("|").map((o: string) => o.trim()).filter(Boolean);
                if (options.length < 2) throw new Error(`Row ${index + 2}: MCQ must have at least 2 options separated by "|".`);
                return {
                    ...base,
                    type: "mcq" as const,
                    options,
                    correct_option: obj.correct_answer || obj.correct_option,
                };
            } else {
                return {
                    ...base,
                    type: "numeric" as const,
                    correct_value: parseFloat(obj.correct_answer || obj.correct_value),
                    numeric_tolerance: obj.tolerance || obj.numeric_tolerance ? parseFloat(obj.tolerance || obj.numeric_tolerance) : null,
                };
            }
        });
    };

    const handleUpload = async () => {
        setPending(true);
        setError(null);
        try {
            const questions = parseCSV(csvText);
            const res = await saveBulkQuestions({ testId, questions });
            if (!res.ok) {
                setError(res.error);
            } else {
                setSuccess(true);
                setTimeout(() => {
                    setOpen(false);
                    setSuccess(false);
                    setCsvText("");
                    router.refresh();
                }, 1500);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setPending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <FileUp className="h-4 w-4" />
                    Bulk Upload
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Bulk Upload Questions</DialogTitle>
                    <DialogDescription>
                        Paste your CSV data below. Use the following format:
                        <code className="mt-2 block rounded bg-muted p-2 text-[10px] leading-tight">
                            type,question,marks,options,correct_answer,explanation,tolerance<br />
                            mcq,&quot;What is 2+2?&quot;,1,&quot;4|5|6&quot;,4,&quot;Basic math&quot;,<br />
                            numeric,&quot;Value of pi?&quot;,1,,3.14,&quot;Constant&quot;,0.01
                        </code>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="csv">CSV Data</Label>
                        <Textarea
                            id="csv"
                            placeholder='type,question,marks,options,correct_answer,explanation,tolerance...'
                            className="h-[200px] font-mono text-xs"
                            value={csvText}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCsvText(e.target.value)}
                            disabled={pending || success}
                        />
                    </div>
                    {error && (
                        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <p>{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <p>Questions uploaded successfully!</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending || success}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={pending || success || !csvText.trim()}>
                        {pending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Upload Questions"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
