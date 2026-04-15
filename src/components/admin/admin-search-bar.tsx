import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminSearchBarProps = {
  /** Current search path (e.g. ROUTES.admin.users) */
  actionPath: string;
  defaultQuery?: string;
  hiddenFields?: Record<string, string>;
  placeholder?: string;
};

export function AdminSearchBar({
  actionPath,
  defaultQuery = "",
  hiddenFields,
  placeholder = "Search…",
}: AdminSearchBarProps) {
  return (
    <form method="get" action={actionPath} className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
        : null}
      <input type="hidden" name="page" value="1" />
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder={placeholder}
          className="h-10 pl-9"
          autoComplete="off"
        />
      </div>
      <Button type="submit" variant="secondary" className="shrink-0 sm:w-auto">
        Apply
      </Button>
    </form>
  );
}
