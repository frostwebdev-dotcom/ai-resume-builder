import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = {
  id: string;
  label: string;
  description?: string;
  error?: string;
  success?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
};

/**
 * Form field with always-visible label, helper text, and validation messages.
 */
export function Field({
  id,
  label,
  description,
  error,
  success,
  children,
  className,
  required,
}: FieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const successId = success ? `${id}-success` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label
        htmlFor={id}
        className="text-label peer gap-0"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      {description ? (
        <p id={descriptionId} className="text-caption -mt-0.5">
          {description}
        </p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        {React.isValidElement(children)
          ? React.cloneElement(
              children as React.ReactElement<{
                id?: string;
                "aria-invalid"?: boolean;
                "aria-describedby"?: string;
              }>,
              {
                id,
                "aria-invalid": error ? true : undefined,
                "aria-describedby":
                  [descriptionId, errorId, successId].filter(Boolean).join(" ") ||
                  undefined,
              },
            )
          : children}
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-sm font-medium text-destructive"
          >
            {error}
          </p>
        ) : null}
        {success && !error ? (
          <p id={successId} className="text-sm font-medium text-success">
            {success}
          </p>
        ) : null}
      </div>
    </div>
  );
}
