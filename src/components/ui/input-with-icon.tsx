import * as React from "react";

import { cn } from "@/lib/utils";

type InputWithIconProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Icon in a dedicated column so text never sits under it (also avoids browser autofill overlap). */
  leading?: React.ReactNode;
  /** Optional trailing slot (e.g. password show/hide toggle). */
  trailing?: React.ReactNode;
  /** The form control (typically `<Input />`). When leading/trailing exist, border/ring move to this shell. */
  children: React.ReactNode;
};

/**
 * Leading/trailing icons in a **flex shell** with a borderless inner control — avoids
 * absolutely-positioned icons overlapping placeholder text or browser autofill UI.
 */
export function InputWithIcon({
  leading,
  trailing,
  className,
  children,
  ...props
}: InputWithIconProps) {
  const hasChrome = Boolean(leading || trailing);

  const innerClass = hasChrome
    ? cn(
        "min-h-0 min-w-0 flex-1 border-0 bg-transparent shadow-none outline-none ring-0",
        "focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none",
        "text-base md:text-sm",
        leading ? "rounded-none rounded-r-lg pl-1 pr-3.5 md:pr-3.5" : "rounded-none px-3.5",
        trailing && "pr-11",
      )
    : undefined;

  const child = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(
          (children as React.ReactElement<{ className?: string }>).props.className,
          innerClass,
        ),
      })
    : children;

  if (!hasChrome) {
    return <>{child}</>;
  }

  return (
    <div
      data-slot="input-with-icon"
      className={cn(
        "relative flex h-11 min-h-11 w-full min-w-0 max-w-full items-stretch rounded-lg border border-input bg-transparent transition-colors",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/45",
        "dark:bg-input/30",
        className,
      )}
      {...props}
    >
      {leading ? (
        <span
          aria-hidden
          className="pointer-events-none flex shrink-0 flex-col items-center justify-center border-0 bg-transparent pl-3.5 pr-1 text-muted-foreground [&_svg]:size-4"
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

InputWithIcon.displayName = "InputWithIcon";
