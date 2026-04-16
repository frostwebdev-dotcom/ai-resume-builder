"use client";

import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { InputWithIcon } from "@/components/ui/input-with-icon";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  /** Hide the leading lock icon (e.g. for custom layouts). */
  hideLeadingIcon?: boolean;
};

export function PasswordInput({
  className,
  hideLeadingIcon,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <InputWithIcon
      leading={hideLeadingIcon ? undefined : <Lock />}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      }
    >
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={className}
      />
    </InputWithIcon>
  );
}
