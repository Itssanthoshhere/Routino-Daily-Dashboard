"use client";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

export function InvoicePreview({ url, name, contentType }: { url: string; name: string; contentType?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [rendering, setRendering] = useState(true);
  const image = contentType?.startsWith("image/");
  useEffect(() => {
    if (image) return;
    let cancelled = false;
    let task: import("pdfjs-dist").PDFDocumentLoadingTask | undefined;
    setPdf(null); setPage(1); setError(""); setRendering(true);
    void import("pdfjs-dist").then(async library => {
      if (cancelled) return;
      library.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      task = library.getDocument({ url, withCredentials: true, useSystemFonts: true });
      const document = await task.promise;
      if (!cancelled) setPdf(document);
    }).catch(() => { if (!cancelled) { setError("Preview could not load. You can still download the original file."); setRendering(false); } });
    return () => { cancelled = true; void task?.destroy(); };
  }, [url, image]);
  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let cancelled = false;
    let renderTask: import("pdfjs-dist").RenderTask | undefined;
    setRendering(true); setError("");
    void pdf.getPage(page).then(async documentPage => {
      if (cancelled || !canvas.current) return;
      const target = canvas.current;
      const width = Math.max(200, Math.min(1000, (target.parentElement?.clientWidth || 700) - 24));
      const base = documentPage.getViewport({ scale: 1 });
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = documentPage.getViewport({ scale: width / base.width * scale });
      target.width = Math.floor(viewport.width); target.height = Math.floor(viewport.height);
      target.style.width = `${width}px`; target.style.height = "auto";
      renderTask = documentPage.render({ canvas: target, viewport });
      await renderTask.promise;
      if (!cancelled) setRendering(false);
    }).catch(() => { if (!cancelled) { setError("This page could not render. Download the original to view it."); setRendering(false); } });
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [pdf, page]);
  if (image) return <>{error && <p role="alert" className="mt-3 text-red-700">{error}</p>}<img src={url} alt={name} className="mx-auto mt-4 max-h-[65vh] max-w-full rounded-lg object-contain" onError={() => setError("Image preview unavailable. Download the original file.")} /></>;
  return <div className="mt-4 overflow-hidden rounded-xl border border-line bg-[#f5f6f2]"><div className="flex items-center justify-between gap-3 border-b border-line bg-white p-3 text-xs"><button type="button" className="btn-theme rounded-lg border border-line px-3 py-1.5" disabled={!pdf || page === 1 || rendering} onClick={() => setPage(value => value - 1)}>Previous</button><span role="status">{pdf ? `Page ${page} of ${pdf.numPages}` : "Loading invoice…"}</span><button type="button" className="btn-theme rounded-lg border border-line px-3 py-1.5" disabled={!pdf || page === pdf.numPages || rendering} onClick={() => setPage(value => value + 1)}>Next</button></div>{error && <p role="alert" className="p-4 text-sm text-red-700">{error}</p>}<div className="max-h-[60vh] overflow-auto p-3" aria-busy={rendering}><canvas ref={canvas} role="img" aria-label={`${name}, page ${page}`} className="mx-auto max-w-full bg-white shadow-sm" /></div></div>;
}
