import * as React from "react";

import { cn } from "@/lib/utils";

type InputWithIconProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Icon rendered in the left padding area. Typically a lucide icon. */
  leading?: React.ReactNode;
  /** Optional trailing slot (e.g. password show/hide toggle). */
  trailing?: React.ReactNode;
  /** The form control. Its left/right padding is adjusted to avoid overlap. */
  children: React.ReactNode;
};

/**
 * Wraps a form control so a leading icon and/or trailing control sit inside
 * the field's padding without overlapping the text at any breakpoint.
 *
 * The child element's className is merged with `pl-9 sm:pl-9` (when a leading
 * icon is present) and `pr-10 sm:pr-10` (when a trailing slot is present).
 * Explicit `sm:` variants are required because the base <Input> uses
 * `sm:px-2.5` which would otherwise override unqualified padding utilities.
 */
export function InputWithIcon({
  leading,
  trailing,
  className,
  children,
  ...props
}: InputWithIconProps) {
  const paddingClass = cn(
    leading && "pl-9 sm:pl-9",
    trailing && "pr-10 sm:pr-10",
  );

  const child = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<{ className?: string }>,
        {
          className: cn(
            (children as React.ReactElement<{ className?: string }>).props
              .className,
            paddingClass,
          ),
        },
      )
    : children;

  return (
    <div className={cn("relative flex items-stretch", className)} {...props}>
      {leading ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 z-10 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground [&_svg]:size-4"
        >
          {leading}
        </span>
      ) : null}
      {child}
      {trailing ? (
        <span className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2">
          {trailing}
        </span>
      ) : null}
    </div>
  );
}
