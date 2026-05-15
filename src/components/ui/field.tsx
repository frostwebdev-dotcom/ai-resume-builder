import * as React from "react";

import { Label } from "@/components/ui/label";
import { InputWithIcon } from "@/components/ui/input-with-icon";
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
        {(() => {
          const describedBy =
            [descriptionId, errorId, successId].filter(Boolean).join(" ") ||
            undefined;
          const injected = {
            id,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": describedBy,
          } as const;

          function injectIntoInputWithIcon(
            wrap: React.ReactElement<{ children?: React.ReactNode }>,
          ): React.ReactElement {
            const inner = wrap.props.children;
            if (!React.isValidElement(inner)) {
              return wrap;
            }
            const innerProps = (inner as React.ReactElement<Record<string, unknown>>).props;
            return React.cloneElement(wrap, {
              ...wrap.props,
              children: React.cloneElement(
                inner as React.ReactElement<{
                  id?: string;
                  "aria-invalid"?: boolean;
                  "aria-describedby"?: string;
                }>,
                {
                  ...innerProps,
                  ...injected,
                },
              ),
            });
          }

          // Single child: inject directly (preserves original behavior).
          if (React.isValidElement(children)) {
            if (children.type === InputWithIcon) {
              return injectIntoInputWithIcon(
                children as React.ReactElement<{ children?: React.ReactNode }>,
              );
            }
            return React.cloneElement(
              children as React.ReactElement<{
                id?: string;
                "aria-invalid"?: boolean;
                "aria-describedby"?: string;
              }>,
              injected,
            );
          }
          // Multiple children: inject onto the first valid element only
          // (useful when pairing an input with a helper like PasswordStrength).
          let hasInjected = false;
          return React.Children.map(children, (child) => {
            if (!hasInjected && React.isValidElement(child)) {
              hasInjected = true;
              if (child.type === InputWithIcon) {
                return injectIntoInputWithIcon(
                  child as React.ReactElement<{ children?: React.ReactNode }>,
                );
              }
              return React.cloneElement(
                child as React.ReactElement<{
                  id?: string;
                  "aria-invalid"?: boolean;
                  "aria-describedby"?: string;
                }>,
                injected,
              );
            }
            return child;
          });
        })()}
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-sm font-medium text-pretty text-destructive"
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
