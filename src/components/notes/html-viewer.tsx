"use client";

import { useEffect, useState, useRef } from "react";
import { ScrollText, Presentation, Maximize2, Minimize2, RefreshCw, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HtmlViewerProps {
  publicUrl: string;
  title: string;
}

export function HtmlViewer({ publicUrl, title }: HtmlViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"scroll" | "slideshow">("scroll");
  const [isSlideDeck, setIsSlideDeck] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function loadHtml() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(publicUrl);
        if (!res.ok) throw new Error("Failed to fetch HTML content");
        const text = await res.text();
        if (active) {
          setHtmlContent(text);
          // Check if the HTML content features slide/deck class configurations
          const hasSlides =
            text.includes('class="slide"') ||
            text.includes("class='slide'") ||
            text.includes('class="deck"') ||
            text.includes("class='deck'");
          setIsSlideDeck(hasSlides);
          // Default to scroll view if it's a slide deck to ensure readability
          setViewMode(hasSlides ? "scroll" : "slideshow");
        }
      } catch (err: any) {
        if (active) {
          console.error(err);
          setError(err.message || "Failed to load document view");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadHtml();

    return () => {
      active = false;
    };
  }, [publicUrl]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const getProcessedHtml = () => {
    if (!htmlContent) return "";
    if (viewMode === "scroll" && isSlideDeck) {
      const scrollStyle = `
<style id="scroll-override">
  /* Force custom scrollbars on iframe elements */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #020617;
  }
  ::-webkit-scrollbar-thumb {
    background: #1e293b;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #334155;
  }

  html, body {
    overflow: auto !important;
    overflow-y: auto !important;
    height: auto !important;
    max-height: none !important;
    background: #020617 !important;
  }
  .deck {
    display: flex !important;
    flex-direction: column !important;
    height: auto !important;
    width: 100% !important;
    max-width: 900px !important;
    position: relative !important;
    padding: 2rem 1rem !important;
    margin: 0 auto !important;
    box-sizing: border-box !important;
    gap: 2rem !important;
  }
  .slide {
    position: relative !important;
    inset: auto !important;
    display: flex !important;
    flex-direction: column !important;
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
    pointer-events: auto !important;
    height: auto !important;
    min-height: auto !important;
    margin-bottom: 0 !important;
    padding: 3rem 2rem !important;
    border-radius: 16px !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    background: linear-gradient(135deg, #0f172a, #020617) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4) !important;
    page-break-after: always !important;
    box-sizing: border-box !important;
  }
  .dots, #dots {
    display: none !important;
  }
  .content {
    max-width: 100% !important;
    margin: 0 auto !important;
  }
  @media (max-width: 640px) {
    .slide {
      padding: 1.5rem 1rem !important;
    }
  }
</style>
      `;
      // Replace </head> with our scrollStyle override
      if (htmlContent.includes("</head>")) {
        return htmlContent.replace("</head>", `${scrollStyle}</head>`);
      } else {
        return htmlContent + scrollStyle;
      }
    }
    return htmlContent;
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center border border-border rounded-xl bg-slate-50/50 dark:bg-slate-950/20 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-[shimmer_2s_infinite] pointer-events-none" />
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Preparing document viewer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-8 flex flex-col items-center justify-center border border-destructive/20 rounded-xl bg-destructive/5 dark:bg-destructive/10 text-center gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <h4 className="font-bold text-foreground">Failed to display document</h4>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-4 w-full">
      {/* Viewer Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card dark:bg-slate-900/50 p-3 rounded-xl border border-border/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {isSlideDeck ? (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-border/40">
              <Button
                variant={viewMode === "scroll" ? "secondary" : "ghost"}
                size="sm"
                className={`gap-1.5 px-3 py-1.5 h-8 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "scroll"
                    ? "bg-white dark:bg-slate-950 shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setViewMode("scroll")}
              >
                <ScrollText className="h-3.5 w-3.5 text-primary" />
                Scroll View
              </Button>
              <Button
                variant={viewMode === "slideshow" ? "secondary" : "ghost"}
                size="sm"
                className={`gap-1.5 px-3 py-1.5 h-8 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "slideshow"
                    ? "bg-white dark:bg-slate-950 shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setViewMode("slideshow")}
              >
                <Presentation className="h-3.5 w-3.5 text-emerald-500" />
                Slideshow
              </Button>
            </div>
          ) : (
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 pl-1">
              <ScrollText className="h-3.5 w-3.5 text-primary" />
              Document View Mode
            </span>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          {isSlideDeck && viewMode === "scroll" && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 bg-primary/5 dark:bg-primary/10 px-2.5 py-1 rounded-full border border-primary/10">
              <Info className="h-3 w-3 text-primary" />
              Scroll down to read all slides sequentially
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Document Frame */}
      <div
        className={`relative w-full border border-border/80 rounded-xl bg-slate-950 overflow-hidden shadow-lg transition-all ${
          isFullscreen ? "h-[calc(100vh-80px)]" : "h-[75vh]"
        }`}
      >
        <iframe
          srcDoc={getProcessedHtml()}
          className="w-full h-full border-0 bg-slate-950"
          title={title}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
