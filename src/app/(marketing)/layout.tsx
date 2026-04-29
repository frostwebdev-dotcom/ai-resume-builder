import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip">
      <MarketingHeader />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip">{children}</div>
      <MarketingFooter />
    </div>
  );
}
