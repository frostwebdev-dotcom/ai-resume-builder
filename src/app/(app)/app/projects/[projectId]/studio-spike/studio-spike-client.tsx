"use client";

import Link from "next/link";
import { useState } from "react";

import { GuestStudioEditor } from "@/components/resume-wizard/guest-studio-editor";
import { ROUTES } from "@/lib/constants";
import { createEmptyWizardState } from "@/lib/resume-wizard/defaults";
import { DEFAULT_RESUME_STYLE_V1 } from "@/lib/resume-preview/resume-style";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";

/**
 * Dev-only spike: mount GuestStudioEditor inside the authenticated app shell
 * with in-memory state only (no persistence to the project).
 */
export function StudioSpikeClient({
  projectId,
  projectTitle,
}: {
  projectId: string;
  projectTitle: string;
}) {
  const [content, setContent] = useState(createEmptyWizardState);
  const [templateSlug, setTemplateSlug] = useState<TemplateSlug>("denali");
  const [resumeStyle, setResumeStyle] = useState(DEFAULT_RESUME_STYLE_V1);

  const loginHref = `${ROUTES.auth.login}?next=${encodeURIComponent(ROUTES.app.projectBuild(projectId))}`;

  return (
    <div className="flex min-h-0 min-h-[50dvh] flex-1 flex-col gap-3">
      <div className="shrink-0 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
        <strong>Dev spike</strong> — studio editor in the app shell. Edits are{" "}
        <strong>not saved</strong> to this project. Remove the{" "}
        <code className="rounded bg-black/10 px-1 font-mono text-xs">studio-spike</code> folder to
        revert.{" "}
        <Link
          href={ROUTES.app.projectBuild(projectId)}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          Open real Draft
        </Link>
        .
      </div>
      <p className="text-muted-foreground shrink-0 text-sm">
        Project: <span className="font-medium text-foreground">{projectTitle}</span>
      </p>
      <div className="flex min-h-0 min-h-[min(640px,calc(100dvh-14rem))] flex-1 flex-col overflow-hidden rounded-lg border border-border/70 bg-white">
        <GuestStudioEditor
          content={content}
          onContentChange={setContent}
          templateSlug={templateSlug}
          onTemplateChange={setTemplateSlug}
          resumeStyle={resumeStyle}
          onResumeStyleChange={setResumeStyle}
          loginHref={loginHref}
        />
      </div>
    </div>
  );
}
