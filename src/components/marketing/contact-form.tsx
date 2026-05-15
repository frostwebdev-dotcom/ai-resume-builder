"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { submitContactFormAction } from "@/services/contact/actions";
import { CONTACT_TOPIC_LABELS, type ContactTopic } from "@/validation/contact";
import { cn } from "@/lib/utils";

const TOPICS = Object.entries(CONTACT_TOPIC_LABELS) as [ContactTopic, string][];

export function ContactForm({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const raw = {
      name: fd.get("name"),
      email: fd.get("email"),
      topic: fd.get("topic"),
      message: fd.get("message"),
      company: fd.get("company") ?? "",
    };

    setMessage(null);
    setError(null);
    setFieldErrors(undefined);

    startTransition(async () => {
      const res = await submitContactFormAction(raw);
      if (res.ok) {
        setMessage(res.message);
        form.reset();
        return;
      }
      setError(res.error);
      setFieldErrors(res.fieldErrors);
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn("space-y-4 text-left", className)}
      noValidate
    >
      <p className="text-sm font-medium text-foreground">Send us a message</p>
      <p className="text-sm text-muted-foreground">
        We will email you a short confirmation when your message is received. You can still use{" "}
        <span className="font-medium text-foreground">Email us directly</span> on the right if you
        prefer.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="contact-name" className="text-sm font-medium text-foreground">
            Name <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={120}
            className="flex h-11 min-h-11 w-full min-w-0 max-w-full rounded-lg border border-input bg-background px-3.5 text-base shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Ada Lovelace"
          />
          {fieldErrors?.name?.[0] ? (
            <p className="text-xs font-medium text-destructive">{fieldErrors.name[0]}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="contact-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="flex h-11 min-h-11 w-full min-w-0 max-w-full rounded-lg border border-input bg-background px-3.5 text-base shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="you@example.com"
          />
          {fieldErrors?.email?.[0] ? (
            <p className="text-xs font-medium text-destructive">{fieldErrors.email[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-topic" className="text-sm font-medium text-foreground">
          Topic
        </label>
        <select
          id="contact-topic"
          name="topic"
          required
          className="flex h-11 min-h-11 w-full min-w-0 max-w-full rounded-lg border border-input bg-background px-3.5 text-base shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue="product"
        >
          {TOPICS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {fieldErrors?.topic?.[0] ? (
          <p className="text-xs font-medium text-destructive">{fieldErrors.topic[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-message" className="text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          minLength={20}
          maxLength={5000}
          className="min-h-[120px] w-full min-w-0 max-w-full resize-y rounded-lg border border-input bg-background px-3.5 py-2.5 text-base shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Tell us what you need — a few sentences helps us respond faster."
        />
        {fieldErrors?.message?.[0] ? (
          <p className="text-xs font-medium text-destructive">{fieldErrors.message[0]}</p>
        ) : null}
      </div>

      {/* Honeypot — leave hidden; bots often fill every field */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm font-medium text-success" role="status">
          {message}
        </p>
      ) : null}

      <Button type="submit" size="touch" className="w-full sm:w-auto" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </form>
  );
}
