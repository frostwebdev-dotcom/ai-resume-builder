"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { ResumePreviewRenderer } from "@/components/resume-preview/resume-preview-renderer";
import { TemplateThumbnail } from "@/components/resume-preview/template-thumbnail";
import { mapWizardToPreviewDocument } from "@/lib/resume-preview/map-wizard-to-preview";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { createDemoWizardState } from "@/lib/resume-wizard/demo-wizard-state";
import { cn } from "@/lib/utils";

type Props = {
  slug: TemplateSlug;
  className?: string;
};

/**
 * Scaled-down real resume preview (shared demo content) for template cards and zoom.
 * Defers mounting until near the viewport to keep the catalog performant.
 */
type Fit = { scale: number; iw: number; ih: number };

export function TemplateCatalogLivePreview({ slug, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [mountLive, setMountLive] = useState(false);
  /** Cover scale + unscaled inner dimensions so the preview fills the A4 frame without a dead band below. */
  const [fit, setFit] = useState<Fit | null>(null);

  const document = useMemo(
    () => mapWizardToPreviewDocument(createDemoWizardState(), { avatarUrl: null }),
    [],
  );

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMountLive(true);
          io.disconnect();
        }
      },
      { rootMargin: "160px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!mountLive) return;
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;

    const update = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      const iw = inner.offsetWidth;
      const ih = inner.offsetHeight;
      if (iw > 0 && ih > 0 && w > 0 && h > 0) {
        setFit({ scale: Math.max(w / iw, h / ih), iw, ih });
      }
    };

    update();
    const ro = new ResizeObserver(() => {
      update();
    });
    ro.observe(host);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [mountLive, slug]);

  return (
    <div
      ref={hostRef}
      className={cn(
        "relative flex aspect-[210/297] w-full items-center justify-center overflow-hidden rounded-md bg-white text-neutral-900",
        className,
      )}
      aria-hidden
    >
      {!mountLive ? (
        <TemplateThumbnail slug={slug} className="absolute inset-0 h-full w-full rounded-none shadow-none ring-0" />
      ) : (
        <div
          className="relative shrink-0 will-change-transform"
          style={
            fit
              ? { width: fit.iw * fit.scale, height: fit.ih * fit.scale }
              : { width: "100%", aspectRatio: "210 / 297" }
          }
        >
          <div
            ref={innerRef}
            className="absolute left-0 top-0 box-border w-[210mm] max-w-none origin-top-left bg-white shadow-none print:hidden"
            style={{ transform: `scale(${fit?.scale ?? 0.18})` }}
          >
            <ResumePreviewRenderer document={document} templateSlug={slug} resumeStyle={null} />
          </div>
        </div>
      )}
    </div>
  );
}
