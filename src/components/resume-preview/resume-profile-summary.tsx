import {
  looksLikeProfileHtml,
  sanitizeProfileDescriptionHtml,
} from "@/lib/profile-description-html";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
};

/**
 * Renders profile / summary body: sanitized HTML when present, otherwise plain text.
 */
export function ResumeProfileSummary({ text, className }: Props) {
  if (looksLikeProfileHtml(text)) {
    const html = sanitizeProfileDescriptionHtml(text);
    return (
      <div
        className={cn(
          "text-neutral-800 [&_a]:font-medium [&_a]:text-[#2268d7] [&_a]:underline [&_em]:italic [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_strong]:font-semibold [&_u]:underline [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <p className={cn("whitespace-pre-wrap text-neutral-800", className)}>{text}</p>;
}
