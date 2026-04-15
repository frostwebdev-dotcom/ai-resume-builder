"use client";

import type { Dispatch, SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";

import { ensureEntryId } from "@/lib/resume-wizard/ids";
import type { TailoringCompareV1 } from "@/lib/job-target/types";
import type { WizardStepId } from "@/lib/resume-wizard/steps";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AdditionalAiPanel,
  ExperienceEntryAiPanel,
  SkillsAiPanel,
  SummaryAiPanel,
} from "@/components/resume-wizard/wizard-ai-panels";
import {
  ExperienceJobTailorSection,
  SkillsJobTailorSection,
  SummaryJobTailorSection,
} from "@/components/resume-wizard/job-tailor-sections";

type WizardStepFormProps = {
  projectId: string;
  stepId: WizardStepId;
  state: WizardStateV1;
  setState: Dispatch<SetStateAction<WizardStateV1>>;
  hasSavedJobTarget: boolean;
  tailoringCompare: TailoringCompareV1 | null;
  setTailoringCompare: Dispatch<SetStateAction<TailoringCompareV1 | null>>;
};

export function WizardStepForm({
  projectId,
  stepId,
  state,
  setState,
  hasSavedJobTarget,
  tailoringCompare,
  setTailoringCompare,
}: WizardStepFormProps) {
  switch (stepId) {
    case "personal":
      return <PersonalStep state={state} setState={setState} />;
    case "summary":
      return (
        <SummaryStep
          projectId={projectId}
          state={state}
          setState={setState}
          hasSavedJobTarget={hasSavedJobTarget}
          tailoringCompare={tailoringCompare}
          setTailoringCompare={setTailoringCompare}
        />
      );
    case "experience":
      return (
        <ExperienceStep
          projectId={projectId}
          state={state}
          setState={setState}
          hasSavedJobTarget={hasSavedJobTarget}
          tailoringCompare={tailoringCompare}
          setTailoringCompare={setTailoringCompare}
        />
      );
    case "education":
      return <EducationStep state={state} setState={setState} />;
    case "skills":
      return (
        <SkillsStep
          projectId={projectId}
          state={state}
          setState={setState}
          hasSavedJobTarget={hasSavedJobTarget}
          tailoringCompare={tailoringCompare}
          setTailoringCompare={setTailoringCompare}
        />
      );
    case "certifications":
      return <CertificationsStep state={state} setState={setState} />;
    case "projects":
      return <ProjectsStep state={state} setState={setState} />;
    case "additional":
      return (
        <AdditionalStep
          projectId={projectId}
          state={state}
          setState={setState}
        />
      );
    default:
      return null;
  }
}

function PersonalStep({
  state,
  setState,
}: {
  state: WizardStateV1;
  setState: WizardStepFormProps["setState"];
}) {
  const p = state.personal;
  return (
    <div className="space-y-6">
      <Field id="fullName" label="Full name" required>
        <Input
          name="fullName"
          value={p.fullName}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              personal: { ...s.personal, fullName: e.target.value },
            }))
          }
          autoComplete="name"
          className="min-h-11 text-base sm:min-h-10 sm:text-sm"
          placeholder="Alex Morgan"
        />
      </Field>
      <Field
        id="email"
        label="Email"
        required
        description="Used for your resume header and account contact."
      >
        <Input
          name="email"
          type="email"
          inputMode="email"
          value={p.email}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              personal: { ...s.personal, email: e.target.value },
            }))
          }
          autoComplete="email"
          className="min-h-11 text-base sm:min-h-10 sm:text-sm"
          placeholder="you@example.com"
        />
      </Field>
      <Field id="phone" label="Phone" description="Optional — include country code if relevant.">
        <Input
          name="phone"
          type="tel"
          inputMode="tel"
          value={p.phone}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              personal: { ...s.personal, phone: e.target.value },
            }))
          }
          autoComplete="tel"
          className="min-h-11 text-base sm:min-h-10 sm:text-sm"
          placeholder="+1 555 0100"
        />
      </Field>
      <Field id="location" label="Location" description="City and region, or Remote.">
        <Input
          name="location"
          value={p.location}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              personal: { ...s.personal, location: e.target.value },
            }))
          }
          className="min-h-11 text-base sm:min-h-10 sm:text-sm"
          placeholder="Berlin, DE · Remote"
        />
      </Field>
      <Field id="linkedIn" label="LinkedIn" description="Full profile URL, if you use LinkedIn.">
        <Input
          name="linkedIn"
          value={p.linkedIn}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              personal: { ...s.personal, linkedIn: e.target.value },
            }))
          }
          inputMode="url"
          className="min-h-11 text-base sm:min-h-10 sm:text-sm"
          placeholder="https://www.linkedin.com/in/yourprofile"
        />
      </Field>
      <Field id="website" label="Website / portfolio" description="Optional personal site or GitHub profile.">
        <Input
          name="website"
          value={p.website}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              personal: { ...s.personal, website: e.target.value },
            }))
          }
          inputMode="url"
          className="min-h-11 text-base sm:min-h-10 sm:text-sm"
          placeholder="https://"
        />
      </Field>
    </div>
  );
}

function SummaryStep({
  projectId,
  state,
  setState,
  hasSavedJobTarget,
  tailoringCompare,
  setTailoringCompare,
}: {
  projectId: string;
  state: WizardStateV1;
  setState: WizardStepFormProps["setState"];
  hasSavedJobTarget: boolean;
  tailoringCompare: TailoringCompareV1 | null;
  setTailoringCompare: WizardStepFormProps["setTailoringCompare"];
}) {
  return (
    <div className="space-y-6">
      <Field
        id="headline"
        label="Headline"
        description="One line under your name — role and focus."
      >
        <Input
          value={state.summary.headline}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              summary: { ...s.summary, headline: e.target.value },
            }))
          }
          className="min-h-11 text-base sm:min-h-10 sm:text-sm"
          placeholder="Product designer · Design systems · B2B SaaS"
        />
      </Field>
      <Field
        id="summary"
        label="Professional summary"
        description="3–5 sentences: strengths, scope, and what you are looking for next."
      >
        <Textarea
          value={state.summary.summary}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              summary: { ...s.summary, summary: e.target.value },
            }))
          }
          className="min-h-[10rem] text-base sm:min-h-32 sm:text-sm"
          placeholder="Write in first person. Focus on outcomes and scope — not buzzwords."
        />
      </Field>
      <SummaryAiPanel projectId={projectId} state={state} setState={setState} />
      <SummaryJobTailorSection
        projectId={projectId}
        state={state}
        setState={setState}
        hasSavedJobTarget={hasSavedJobTarget}
        tailoringCompare={tailoringCompare}
        setTailoringCompare={setTailoringCompare}
      />
    </div>
  );
}

function ExperienceStep({
  projectId,
  state,
  setState,
  hasSavedJobTarget,
  tailoringCompare,
  setTailoringCompare,
}: {
  projectId: string;
  state: WizardStateV1;
  setState: WizardStepFormProps["setState"];
  hasSavedJobTarget: boolean;
  tailoringCompare: TailoringCompareV1 | null;
  setTailoringCompare: WizardStepFormProps["setTailoringCompare"];
}) {
  const entries = state.experience.entries;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add each role separately. Expand a card to edit details — keeps long forms manageable on phones.
      </p>
      {entries.map((entry, index) => (
        <details
          key={entry.id}
          className="group rounded-xl border border-border bg-card ring-1 ring-foreground/5 open:shadow-sm"
          open={index === 0}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 text-left font-medium">
              {entry.title || entry.company ? (
                <>
                  <span className="block truncate">
                    {entry.title || "Role title"}
                    {entry.company ? ` · ${entry.company}` : ""}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {entry.startDate}
                    {entry.current ? " — Present" : entry.endDate ? ` — ${entry.endDate}` : ""}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">New position</span>
              )}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground group-open:hidden">Expand</span>
            <span className="hidden shrink-0 text-xs text-muted-foreground group-open:inline">Collapse</span>
          </summary>
          <div className="space-y-4 border-t border-border px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`job-title-${entry.id}`} label="Job title">
                <Input
                  value={entry.title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.experience.entries];
                      next[index] = { ...next[index], title: v };
                      return { ...s, experience: { entries: next } };
                    });
                  }}
                  className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                  placeholder="Senior Product Designer"
                />
              </Field>
              <Field id={`company-${entry.id}`} label="Company">
                <Input
                  value={entry.company}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.experience.entries];
                      next[index] = { ...next[index], company: v };
                      return { ...s, experience: { entries: next } };
                    });
                  }}
                  className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                />
              </Field>
            </div>
            <Field id={`loc-${entry.id}`} label="Location">
              <Input
                value={entry.location}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.experience.entries];
                    next[index] = { ...next[index], location: v };
                    return { ...s, experience: { entries: next } };
                  });
                }}
                className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                placeholder="Remote · London"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`start-${entry.id}`} label="Start">
                <Input
                  value={entry.startDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.experience.entries];
                      next[index] = { ...next[index], startDate: v };
                      return { ...s, experience: { entries: next } };
                    });
                  }}
                  className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                  placeholder="Jan 2022"
                />
              </Field>
              <Field id={`end-${entry.id}`} label="End">
                <Input
                  value={entry.endDate}
                  disabled={entry.current}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.experience.entries];
                      next[index] = { ...next[index], endDate: v };
                      return { ...s, experience: { entries: next } };
                    });
                  }}
                  className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                  placeholder="Dec 2024"
                />
              </Field>
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={entry.current}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setState((s) => {
                    const next = [...s.experience.entries];
                    next[index] = {
                      ...next[index],
                      current: checked,
                      endDate: checked ? "" : next[index].endDate,
                    };
                    return { ...s, experience: { entries: next } };
                  });
                }}
                className="size-5 rounded border border-input accent-primary"
              />
              I currently work here
            </label>
            <div className="space-y-3">
              <p className="text-label text-foreground">Highlights</p>
              <p className="text-caption -mt-1">One achievement per line — lead with impact.</p>
              {entry.highlights.map((line, hi) => (
                <Textarea
                  key={`${entry.id}-h-${hi}`}
                  value={line}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.experience.entries];
                      const highlights = [...next[index].highlights];
                      highlights[hi] = v;
                      next[index] = { ...next[index], highlights };
                      return { ...s, experience: { entries: next } };
                    });
                  }}
                  className="min-h-[4.5rem] text-base sm:text-sm"
                  placeholder="Shipped onboarding redesign — activation +12% in 6 weeks."
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() =>
                  setState((s) => {
                    const next = [...s.experience.entries];
                    const highlights = [...next[index].highlights, ""];
                    next[index] = { ...next[index], highlights };
                    return { ...s, experience: { entries: next } };
                  })
                }
              >
                <Plus className="size-4" aria-hidden />
                Add bullet
              </Button>
            </div>
            <ExperienceEntryAiPanel
              projectId={projectId}
              entry={entry}
              onApplyBullets={(bullets) =>
                setState((s) => {
                  const next = [...s.experience.entries];
                  next[index] = {
                    ...next[index],
                    highlights: bullets.length > 0 ? bullets : [""],
                  };
                  return { ...s, experience: { entries: next } };
                })
              }
            />
            <ExperienceJobTailorSection
              projectId={projectId}
              entry={entry}
              hasSavedJobTarget={hasSavedJobTarget}
              tailoringCompare={tailoringCompare}
              setTailoringCompare={setTailoringCompare}
              onApplyBullets={(bullets) =>
                setState((s) => {
                  const next = [...s.experience.entries];
                  next[index] = {
                    ...next[index],
                    highlights: bullets.length > 0 ? bullets : [""],
                  };
                  return { ...s, experience: { entries: next } };
                })
              }
            />
            {entries.length > 1 ? (
              <div className="flex justify-end border-t border-border pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      experience: {
                        entries: s.experience.entries.filter((_, i) => i !== index),
                      },
                    }))
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                  Remove role
                </Button>
              </div>
            ) : null}
          </div>
        </details>
      ))}
      <Button
        type="button"
        variant="outline"
        size="touch"
        className="w-full"
        onClick={() =>
          setState((s) => ({
            ...s,
            experience: {
              entries: [
                ...s.experience.entries,
                {
                  id: ensureEntryId(""),
                  company: "",
                  title: "",
                  location: "",
                  startDate: "",
                  endDate: "",
                  current: false,
                  highlights: [""],
                },
              ],
            },
          }))
        }
      >
        <Plus className="size-4" aria-hidden />
        Add another position
      </Button>
    </div>
  );
}

function EducationStep({
  state,
  setState,
}: {
  state: WizardStateV1;
  setState: WizardStepFormProps["setState"];
}) {
  const entries = state.education.entries;
  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <details
          key={entry.id}
          className="group rounded-xl border border-border bg-card ring-1 ring-foreground/5 open:shadow-sm"
          open={index === 0}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 text-left font-medium">
              {entry.school || entry.degree ? (
                <>
                  <span className="block truncate">
                    {entry.degree || "Degree"}
                    {entry.field ? `, ${entry.field}` : ""}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {entry.school}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">New education</span>
              )}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground group-open:hidden">Expand</span>
            <span className="hidden shrink-0 text-xs text-muted-foreground group-open:inline">Collapse</span>
          </summary>
          <div className="space-y-4 border-t border-border px-4 py-4">
            <Field id={`school-${entry.id}`} label="School / institution">
              <Input
                value={entry.school}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.education.entries];
                    next[index] = { ...next[index], school: v };
                    return { ...s, education: { entries: next } };
                  });
                }}
                className="min-h-11 text-base sm:min-h-10 sm:text-sm"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`degree-${entry.id}`} label="Degree">
                <Input
                  value={entry.degree}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.education.entries];
                      next[index] = { ...next[index], degree: v };
                      return { ...s, education: { entries: next } };
                    });
                  }}
                  className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                  placeholder="B.Sc."
                />
              </Field>
              <Field id={`field-${entry.id}`} label="Field of study">
                <Input
                  value={entry.field}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.education.entries];
                      next[index] = { ...next[index], field: v };
                      return { ...s, education: { entries: next } };
                    });
                  }}
                  className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`ed-start-${entry.id}`} label="Start">
                <Input
                  value={entry.startDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.education.entries];
                      next[index] = { ...next[index], startDate: v };
                      return { ...s, education: { entries: next } };
                    });
                  }}
                  className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                  placeholder="2018"
                />
              </Field>
              <Field id={`ed-end-${entry.id}`} label="End">
                <Input
                  value={entry.endDate}
                  disabled={entry.current}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => {
                      const next = [...s.education.entries];
                      next[index] = { ...next[index], endDate: v };
                      return { ...s, education: { entries: next } };
                    });
                  }}
                  className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                  placeholder="2022"
                />
              </Field>
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={entry.current}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setState((s) => {
                    const next = [...s.education.entries];
                    next[index] = {
                      ...next[index],
                      current: checked,
                      endDate: checked ? "" : next[index].endDate,
                    };
                    return { ...s, education: { entries: next } };
                  });
                }}
                className="size-5 rounded border border-input accent-primary"
              />
              I am still studying here
            </label>
            <Field id={`ed-details-${entry.id}`} label="Honors, coursework, GPA (optional)">
              <Textarea
                value={entry.details}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.education.entries];
                    next[index] = { ...next[index], details: v };
                    return { ...s, education: { entries: next } };
                  });
                }}
                className="min-h-[6rem] text-base sm:text-sm"
              />
            </Field>
            {entries.length > 1 ? (
              <div className="flex justify-end border-t border-border pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      education: {
                        entries: s.education.entries.filter((_, i) => i !== index),
                      },
                    }))
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                  Remove entry
                </Button>
              </div>
            ) : null}
          </div>
        </details>
      ))}
      <Button
        type="button"
        variant="outline"
        size="touch"
        className="w-full"
        onClick={() =>
          setState((s) => ({
            ...s,
            education: {
              entries: [
                ...s.education.entries,
                {
                  id: ensureEntryId(""),
                  school: "",
                  degree: "",
                  field: "",
                  startDate: "",
                  endDate: "",
                  current: false,
                  details: "",
                },
              ],
            },
          }))
        }
      >
        <Plus className="size-4" aria-hidden />
        Add education
      </Button>
    </div>
  );
}

function SkillsStep({
  projectId,
  state,
  setState,
  hasSavedJobTarget,
  tailoringCompare,
  setTailoringCompare,
}: {
  projectId: string;
  state: WizardStateV1;
  setState: WizardStepFormProps["setState"];
  hasSavedJobTarget: boolean;
  tailoringCompare: TailoringCompareV1 | null;
  setTailoringCompare: WizardStepFormProps["setTailoringCompare"];
}) {
  return (
    <div>
      <Field
        id="skills"
        label="Skills"
        description="One skill per line — tools, methods, and domains. Keep each line short."
      >
        <Textarea
          value={state.skills.lines}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              skills: { lines: e.target.value },
            }))
          }
          className="min-h-[14rem] font-mono text-base leading-relaxed sm:min-h-[12rem] sm:text-sm"
          placeholder={"Figma\nDesign systems\nStakeholder workshops\nSQL"}
        />
      </Field>
      <SkillsAiPanel
        projectId={projectId}
        lines={state.skills.lines}
        onApplyLines={(lines) =>
          setState((s) => ({ ...s, skills: { lines } }))
        }
      />
      <SkillsJobTailorSection
        projectId={projectId}
        lines={state.skills.lines}
        setLines={(lines) => setState((s) => ({ ...s, skills: { lines } }))}
        hasSavedJobTarget={hasSavedJobTarget}
        tailoringCompare={tailoringCompare}
        setTailoringCompare={setTailoringCompare}
      />
    </div>
  );
}

function CertificationsStep({
  state,
  setState,
}: {
  state: WizardStateV1;
  setState: WizardStepFormProps["setState"];
}) {
  const entries = state.certifications.entries;
  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`cert-name-${entry.id}`} label="Certification">
              <Input
                value={entry.name}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.certifications.entries];
                    next[index] = { ...next[index], name: v };
                    return { ...s, certifications: { entries: next } };
                  });
                }}
                className="min-h-11 text-base sm:min-h-10 sm:text-sm"
              />
            </Field>
            <Field id={`cert-issuer-${entry.id}`} label="Issuer">
              <Input
                value={entry.issuer}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.certifications.entries];
                    next[index] = { ...next[index], issuer: v };
                    return { ...s, certifications: { entries: next } };
                  });
                }}
                className="min-h-11 text-base sm:min-h-10 sm:text-sm"
              />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field id={`cert-issued-${entry.id}`} label="Issued">
              <Input
                value={entry.issued}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.certifications.entries];
                    next[index] = { ...next[index], issued: v };
                    return { ...s, certifications: { entries: next } };
                  });
                }}
                className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                placeholder="Apr 2024"
              />
            </Field>
            <Field id={`cert-exp-${entry.id}`} label="Expires (optional)">
              <Input
                value={entry.expires}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.certifications.entries];
                    next[index] = { ...next[index], expires: v };
                    return { ...s, certifications: { entries: next } };
                  });
                }}
                className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                placeholder="Apr 2027"
              />
            </Field>
          </div>
          {entries.length > 1 ? (
            <div className="mt-4 flex justify-end border-t border-border pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    certifications: {
                      entries: s.certifications.entries.filter((_, i) => i !== index),
                    },
                  }))
                }
              >
                <Trash2 className="size-4" aria-hidden />
                Remove
              </Button>
            </div>
          ) : null}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="touch"
        className="w-full"
        onClick={() =>
          setState((s) => ({
            ...s,
            certifications: {
              entries: [
                ...s.certifications.entries,
                {
                  id: ensureEntryId(""),
                  name: "",
                  issuer: "",
                  issued: "",
                  expires: "",
                },
              ],
            },
          }))
        }
      >
        <Plus className="size-4" aria-hidden />
        Add certification
      </Button>
    </div>
  );
}

function ProjectsStep({
  state,
  setState,
}: {
  state: WizardStateV1;
  setState: WizardStepFormProps["setState"];
}) {
  const entries = state.projects.entries;
  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <details
          key={entry.id}
          className="group rounded-xl border border-border bg-card ring-1 ring-foreground/5 open:shadow-sm"
          open={index === 0}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 truncate font-medium">
              {entry.name || "New project"}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground group-open:hidden">Expand</span>
            <span className="hidden shrink-0 text-xs text-muted-foreground group-open:inline">Collapse</span>
          </summary>
          <div className="space-y-4 border-t border-border px-4 py-4">
            <Field id={`proj-name-${entry.id}`} label="Project name">
              <Input
                value={entry.name}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.projects.entries];
                    next[index] = { ...next[index], name: v };
                    return { ...s, projects: { entries: next } };
                  });
                }}
                className="min-h-11 text-base sm:min-h-10 sm:text-sm"
              />
            </Field>
            <Field id={`proj-url-${entry.id}`} label="Link" description="Repository, demo, or case study URL.">
              <Input
                value={entry.url}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.projects.entries];
                    next[index] = { ...next[index], url: v };
                    return { ...s, projects: { entries: next } };
                  });
                }}
                inputMode="url"
                className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                placeholder="https://"
              />
            </Field>
            <Field id={`proj-tech-${entry.id}`} label="Technologies" description="Comma-separated or short list.">
              <Input
                value={entry.technologies}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.projects.entries];
                    next[index] = { ...next[index], technologies: v };
                    return { ...s, projects: { entries: next } };
                  });
                }}
                className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                placeholder="TypeScript, Next.js, Supabase"
              />
            </Field>
            <Field id={`proj-desc-${entry.id}`} label="Description">
              <Textarea
                value={entry.description}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => {
                    const next = [...s.projects.entries];
                    next[index] = { ...next[index], description: v };
                    return { ...s, projects: { entries: next } };
                  });
                }}
                className="min-h-[8rem] text-base sm:text-sm"
                placeholder="What you built, your role, and the outcome."
              />
            </Field>
            {entries.length > 1 ? (
              <div className="flex justify-end border-t border-border pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      projects: {
                        entries: s.projects.entries.filter((_, i) => i !== index),
                      },
                    }))
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                  Remove project
                </Button>
              </div>
            ) : null}
          </div>
        </details>
      ))}
      <Button
        type="button"
        variant="outline"
        size="touch"
        className="w-full"
        onClick={() =>
          setState((s) => ({
            ...s,
            projects: {
              entries: [
                ...s.projects.entries,
                {
                  id: ensureEntryId(""),
                  name: "",
                  url: "",
                  description: "",
                  technologies: "",
                },
              ],
            },
          }))
        }
      >
        <Plus className="size-4" aria-hidden />
        Add project
      </Button>
    </div>
  );
}

function AdditionalStep({
  projectId,
  state,
  setState,
}: {
  projectId: string;
  state: WizardStateV1;
  setState: WizardStepFormProps["setState"];
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Optional: languages, volunteering, awards, or anything else that strengthens your story.
      </p>
      <Field id="additional" label="Additional information">
        <Textarea
          value={state.additional.notes}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              additional: { notes: e.target.value },
            }))
          }
          className="min-h-[12rem] text-base sm:min-h-[10rem] sm:text-sm"
        />
      </Field>
      <AdditionalAiPanel
        projectId={projectId}
        text={state.additional.notes}
        onApply={(text) =>
          setState((s) => ({ ...s, additional: { notes: text } }))
        }
      />
    </div>
  );
}
