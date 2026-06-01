"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateAiQuestions } from "@/app/actions/ai";
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
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type Props = {
    testId: string;
};

export function AIQuestionGenerator({ testId }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [count, setCount] = useState(5);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleGenerate = async () => {
        setPending(true);
        setError(null);
        try {
            const res = await generateAiQuestions({ testId, prompt, count });
            if (!res.ok) {
                setError(res.error);
            } else {
                setSuccess(true);
                setTimeout(() => {
                    setOpen(false);
                    setSuccess(false);
                    setPrompt("");
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
                <Button variant="outline" size="sm" className="gap-2 border-violet-500/50 text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30">
                    <Sparkles className="h-4 w-4" />
                    AI Generate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-violet-500" />
                        AI Question Generator
                    </DialogTitle>
                    <DialogDescription>
                        Describe the topic or paste text to generate questions automatically.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="prompt">Topic or Content</Label>
                        <Textarea
                            id="prompt"
                            placeholder="e.g. 'Generate questions about photosynthesis' or paste a paragraph..."
                            className="h-[150px]"
                            value={prompt}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                            disabled={pending || success}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="count">Number of Questions</Label>
                        <Input
                            id="count"
                            type="number"
                            min={1}
                            max={20}
                            value={count}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCount(parseInt(e.target.value))}
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
                            <p>Questions generated and added!</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending || success}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={pending || success || !prompt.trim()}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        {pending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            "Generate Questions"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
