"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, ImagePlus, Loader2, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AVATAR_MAX_BYTES,
} from "@/lib/avatars/constants";
import {
  prepareResumePhoto,
  RESUME_PHOTO_INPUT_ACCEPT,
} from "@/lib/images/prepare-resume-photo";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import { getTemplateTheme, templateSupportsAvatar } from "@/lib/resume-preview/template-theme";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import {
  removeAvatarAction,
  uploadAvatarAction,
  type AvatarActionResult,
} from "@/services/projects/actions";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  templateSlug: TemplateSlug;
  /** Short-lived signed URL for the current avatar (or null if none). */
  avatarSignedUrl: string | null;
  resumeStyle: ResumeStyleV1;
  onResumeStyleChange: (next: ResumeStyleV1) => void;
  onAvatarChange: (next: { signedUrl: string | null }) => void;
};

/**
 * Avatar upload + display + removal, visible only on templates whose layout
 * family supports a photo. Also surfaces the per-project `includeAvatar`
 * toggle with a clear ATS warning — photos lower parse reliability for US/UK
 * applicant tracking systems.
 */
export function AvatarUploadPanel({
  projectId,
  templateSlug,
  avatarSignedUrl,
  resumeStyle,
  onResumeStyleChange,
  onAvatarChange,
}: Props) {
  const theme = getTemplateTheme(templateSlug);
  const supports = templateSupportsAvatar(theme);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const localBlobUrlRef = useRef<string | null>(null);
  const [serverPending, start] = useTransition();

  useEffect(() => {
    return () => {
      if (localBlobUrlRef.current) URL.revokeObjectURL(localBlobUrlRef.current);
    };
  }, []);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = serverPending || preparing;

  if (!supports) return null;

  const includeAvatar =
    resumeStyle.includeAvatar === null || resumeStyle.includeAvatar === undefined
      ? true
      : resumeStyle.includeAvatar;

  const onToggleInclude = (next: boolean) => {
    onResumeStyleChange({ ...resumeStyle, includeAvatar: next, v: 1 });
  };

  const onPick = () => {
    fileRef.current?.click();
  };

  const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    setError(null);

    let prepared: Awaited<ReturnType<typeof prepareResumePhoto>>;
    setPreparing(true);
    try {
      prepared = await prepareResumePhoto(file, {
        maxBytes: AVATAR_MAX_BYTES,
        maxDimension: 1200,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not use that photo.");
      setPreparing(false);
      return;
    }
    setPreparing(false);

    const fd = new FormData();
    fd.append("projectId", projectId);
    fd.append("file", prepared.file);

    start(async () => {
      const res: AvatarActionResult = await uploadAvatarAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Signed URL is refreshed on the server via revalidatePath; we pass the
      // same file back to the parent so the preview <img> switches immediately
      // without a round-trip. The server URL hydrates on next navigation.
      if (localBlobUrlRef.current) URL.revokeObjectURL(localBlobUrlRef.current);
      const localUrl = URL.createObjectURL(prepared.file);
      localBlobUrlRef.current = localUrl;
      onAvatarChange({ signedUrl: localUrl });
    });
  };

  const onRemove = () => {
    setError(null);
    start(async () => {
      const res = await removeAvatarAction({ projectId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onAvatarChange({ signedUrl: null });
    });
  };

  return (
    <section
      className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:p-5"
      aria-labelledby="avatar-panel-heading"
    >
      <div className="flex items-center gap-2">
        <span
          className="flex size-8 items-center justify-center rounded-lg bg-brand-muted text-brand ring-1 ring-brand/15"
          aria-hidden
        >
          <UserRound className="size-4" />
        </span>
        <h2 id="avatar-panel-heading" className="text-subhead text-foreground">
          Profile photo
        </h2>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div
          className={cn(
            "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-border bg-muted",
            !includeAvatar && "opacity-50",
          )}
          aria-hidden
        >
          {avatarSignedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSignedUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <UserRound className="size-8 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">
            Choose from your photo library or take a new picture. We resize it automatically.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={RESUME_PHOTO_INPUT_ACCEPT}
              onChange={onFileSelected}
              className="sr-only"
              aria-hidden
            />
            <Button
              type="button"
              size="sm"
              onClick={onPick}
              disabled={pending}
              className="gap-1.5"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="size-4" aria-hidden />
              )}
              {preparing ? "Preparing photo..." : avatarSignedUrl ? "Replace photo" : "Upload photo"}
            </Button>
            {avatarSignedUrl ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onRemove}
                disabled={pending}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Show photo on this resume</p>
          <p className="text-caption text-muted-foreground">
            Your upload is private until enabled and embedded in the export.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={includeAvatar}
          onClick={() => onToggleInclude(!includeAvatar)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
            includeAvatar ? "bg-brand" : "bg-muted-foreground/30",
          )}
        >
          <span
            className={cn(
              "inline-block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform",
              includeAvatar && "translate-x-[1.375rem]",
            )}
          />
        </button>
      </div>

      {includeAvatar ? (
        <Alert variant="warning">
          <AlertTriangle aria-hidden />
          <AlertTitle>ATS note — photos can reduce parse reliability</AlertTitle>
          <AlertDescription>
            In US and UK hiring pipelines, applicant tracking systems may flag or skip resumes
            with embedded photos. Photos are culturally expected in most EU, LATAM, and Asian
            markets. Keep this setting off for North American applications.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
