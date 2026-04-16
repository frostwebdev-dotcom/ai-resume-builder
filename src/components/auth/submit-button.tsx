"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  /** Set false to hide the trailing arrow icon in the idle state. */
  showArrow?: boolean;
};

export function SubmitButton({
  children,
  pendingLabel,
  className,
  showArrow = true,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="touch"
      className={cn(
        "w-full gap-2 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
        className,
      )}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        <>
          {children}
          {showArrow ? <ArrowRight className="size-4" aria-hidden /> : null}
        </>
      )}
    </Button>
  );
}
