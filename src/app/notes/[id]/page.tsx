import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function parseInlineMarkdown(text: string) {
  let parsed = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  parsed = parsed.replace(/\*(.*?)\*/g, "<em>$1</em>");
  return parsed;
}

function parseMarkdownToHtml(md: string) {
  if (!md) return "";
  const lines = md.split("\n");
  let html = "";
  let inList = false;

  for (let line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("- ")) {
      if (!inList) {
        html += '<ul class="list-disc pl-5 my-2 space-y-1 text-sm">';
        inList = true;
      }
      const content = trimmed.substring(2);
      html += `<li>${parseInlineMarkdown(content)}</li>`;
      continue;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
    }

    if (trimmed.startsWith("### ")) {
      html += `<h3 class="text-base font-bold mt-4 mb-2 text-foreground">${parseInlineMarkdown(trimmed.substring(4))}</h3>`;
    } else if (trimmed.startsWith("## ")) {
      html += `<h2 class="text-lg font-bold mt-5 mb-2 border-b border-border pb-1 text-foreground">${parseInlineMarkdown(trimmed.substring(3))}</h2>`;
    } else if (trimmed.startsWith("# ")) {
      html += `<h1 class="text-xl font-extrabold mt-6 mb-3 border-b-2 border-border pb-2 text-foreground">${parseInlineMarkdown(trimmed.substring(2))}</h1>`;
    } else if (trimmed === "") {
      html += '<div class="h-2"></div>';
    } else {
      html += `<p class="my-2 text-sm leading-relaxed text-muted-foreground">${parseInlineMarkdown(trimmed)}</p>`;
    }
  }

  if (inList) {
    html += '</ul>';
  }

  return html;
}

export default async function NoteViewerPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: note, error } = await supabase
    .from("notes")
    .select(`
      *,
      profiles:created_by (
        full_name,
        email
      )
    `)
    .eq("id", id)
    .single();

  if (error || !note) {
    notFound();
  }

  const publicUrl = note.file_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/notes/${note.file_path}`
    : null;

  const isPdf = note.file_type === "pdf";
  const isHtml = note.file_type === "html";
  const isEmbeddable = isPdf || isHtml;

  return (
    <PageShell noPadding>
      <AppHeader
        title={note.title}
        subtitle="Study Material"
        homeHref="/dashboard"
      />
      <div className="mx-auto max-w-lg px-4 pb-20 pt-6 sm:max-w-2xl lg:max-w-4xl">
        <div className="mb-6 flex flex-col gap-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
              <Link href="/dashboard?tab=notes">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={isPdf ? "default" : isHtml ? "success" : "secondary"}>
                {note.file_type.toUpperCase()}
              </Badge>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {note.title}
            </h1>
            {note.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {note.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-muted-foreground/80 font-medium">
              {note.profiles?.full_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  By {note.profiles.full_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(note.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Viewer Screen */}
        <div className="bento-card overflow-hidden">
          <div className="p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" />
              Scrollable Viewer
            </h3>

            {isEmbeddable && publicUrl ? (
              <div className="relative w-full h-[70vh] border border-border rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden">
                <iframe
                  src={isPdf ? `${publicUrl}#toolbar=0&navpanes=0` : publicUrl}
                  className="w-full h-full border-0 bg-white"
                  title={note.title}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto border border-border rounded-lg p-6 bg-background/50 scrollbar-thin">
                <div 
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(note.content || "") }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
