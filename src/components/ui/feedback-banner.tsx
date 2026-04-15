import * as React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type FeedbackTone = "success" | "error" | "warning" | "info";

type FeedbackBannerProps = {
  tone: FeedbackTone;
  title: string;
  description?: string;
  className?: string;
};

const icons: Record<FeedbackTone, React.ReactNode> = {
  success: <CheckCircle2 aria-hidden />,
  error: <AlertCircle aria-hidden />,
  warning: <AlertTriangle aria-hidden />,
  info: <Info aria-hidden />,
};

const variants: Record<
  FeedbackTone,
  "success" | "destructive" | "warning" | "info"
> = {
  success: "success",
  error: "destructive",
  warning: "warning",
  info: "info",
};

/**
 * Inline page-level success / error / warning / info feedback (non-modal).
 */
export function FeedbackBanner({
  tone,
  title,
  description,
  className,
}: FeedbackBannerProps) {
  return (
    <Alert variant={variants[tone]} className={cn("items-start", className)}>
      {icons[tone]}
      <div className="min-w-0 space-y-1">
        <AlertTitle className="text-base sm:text-sm">{title}</AlertTitle>
        {description ? (
          <AlertDescription className="text-base sm:text-sm">
            {description}
          </AlertDescription>
        ) : null}
      </div>
    </Alert>
  );
}
