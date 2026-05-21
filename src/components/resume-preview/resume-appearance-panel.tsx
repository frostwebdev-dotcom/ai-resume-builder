"use client";

import { Palette, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_RESUME_STYLE_V1,
  type ResumeStyleV1,
} from "@/lib/resume-preview/resume-style";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { cn } from "@/lib/utils";

type Props = {
  templateSlug: TemplateSlug;
  resumeStyle: ResumeStyleV1;
  onResumeStyleChange: (next: ResumeStyleV1) => void;
};

export function ResumeAppearancePanel({
  templateSlug,
  resumeStyle: style,
  onResumeStyleChange,
}: Props) {
  const theme = getTemplateTheme(templateSlug);

  const patch = (partial: Partial<ResumeStyleV1>) => {
    onResumeStyleChange({ ...style, ...partial, v: 1 });
  };

  const resetAll = () => {
    onResumeStyleChange(DEFAULT_RESUME_STYLE_V1);
  };

  const accentVal = style.accent ?? theme.accent;
  const accentStrongVal = style.accentStrong ?? theme.accentStrong;

  return (
    <section
      className="rounded-xl border border-border/70 bg-card p-4 shadow-soft sm:p-5"
      aria-labelledby="appearance-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border">
            <Palette className="size-4" aria-hidden />
          </span>
          <div>
            <h2 id="appearance-heading" className="text-subhead text-foreground">
              Appearance
            </h2>
            <p className="text-caption text-muted-foreground">
              For the safest result, we recommend keeping the default style.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={resetAll}>
          <RotateCcw className="size-3.5" aria-hidden />
          Reset to template
        </Button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="accent">Accent color</Label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="accent"
              type="color"
              value={accentVal}
              onChange={(e) => patch({ accent: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded border border-border bg-background p-0.5"
            />
            <Button type="button" variant="ghost" size="sm" className="text-caption" onClick={() => patch({ accent: null })}>
              Use template
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="accent-strong">Name / strong color</Label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="accent-strong"
              type="color"
              value={accentStrongVal}
              onChange={(e) => patch({ accentStrong: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded border border-border bg-background p-0.5"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-caption"
              onClick={() => patch({ accentStrong: null })}
            >
              Use template
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="font-family">Font</Label>
          <select
            id="font-family"
            className={cn(
              "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm",
              "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/45",
            )}
            value={style.fontFamily ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              patch({ fontFamily: v === "" ? null : (v as "sans" | "serif") });
            }}
          >
            <option value="">Match template</option>
            <option value="sans">Sans (Helvetica / system)</option>
            <option value="serif">Serif (Times / Georgia)</option>
          </select>
        </div>
      </div>

      <details className="mt-5 rounded-xl border border-border/70 bg-muted/20 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/45">
          Advanced appearance settings
        </summary>
        <p className="mt-2 text-caption text-muted-foreground">
          Fine-tune spacing and alignment only when you need to solve a specific layout issue.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="body-align">Body alignment</Label>
          <select
            id="body-align"
            className={cn(
              "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm",
              "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/45",
            )}
            value={style.bodyTextAlign ?? "left"}
            onChange={(e) => {
              const v = e.target.value as "left" | "center" | "justify";
              patch({ bodyTextAlign: v === "left" ? null : v });
            }}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="justify">Justify</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="header-align">Header alignment</Label>
          <select
            id="header-align"
            className={cn(
              "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm",
              "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/45",
            )}
            value={style.headerTextAlign ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              patch({
                headerTextAlign: v === "" ? null : (v as ResumeStyleV1["headerTextAlign"]),
              });
            }}
          >
            <option value="">Match template</option>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        <RangeRow
          id="line-height"
          label="Line height"
          min={1.15}
          max={1.75}
          step={0.05}
          value={style.lineHeight ?? 1.45}
          onChange={(n) => patch({ lineHeight: n })}
          onAuto={() => patch({ lineHeight: null })}
        />

        <RangeRow
          id="section-gap"
          label="Section spacing"
          min={0.75}
          max={1.4}
          step={0.05}
          value={style.sectionGapScale ?? 1}
          onChange={(n) => patch({ sectionGapScale: n })}
          onAuto={() => patch({ sectionGapScale: null })}
        />

        <RangeRow
          id="para-gap"
          label="Paragraph spacing"
          min={0.75}
          max={1.4}
          step={0.05}
          value={style.paragraphGapScale ?? 1}
          onChange={(n) => patch({ paragraphGapScale: n })}
          onAuto={() => patch({ paragraphGapScale: null })}
        />
        </div>
      </details>
    </section>
  );
}

function RangeRow({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
  onAuto,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
  onAuto: () => void;
}) {
  return (
    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-caption tabular-nums text-muted-foreground">{value.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full flex-1 cursor-pointer accent-brand"
        />
        <Button type="button" variant="ghost" size="sm" className="shrink-0 px-2 text-caption" onClick={onAuto}>
          Auto
        </Button>
      </div>
    </div>
  );
}
