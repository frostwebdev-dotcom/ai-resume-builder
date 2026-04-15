import { FileText } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { StickyBottomBar } from "@/components/layout/sticky-bottom-bar";
import { StyleGuideDialogDemo } from "@/components/design-system";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StepIndicator } from "@/components/ui/step-indicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Design system",
  description: "AI Resume Builder UI tokens, components, and responsive patterns.",
};

export default function StyleGuidePage() {
  return (
    <div className="flex flex-1 flex-col gap-16 py-12 sm:gap-20 sm:py-16">
      <PageContainer>
        <SectionHeader
          level="page"
          title="Design system"
          description="Minimal, trustworthy SaaS UI: strong type hierarchy, generous spacing, 44px touch targets on mobile, and no decorative noise. Use these tokens and components for a consistent product."
        />
      </PageContainer>

      <PageContainer className="space-y-6">
        <SectionHeader
          title="Typography"
          description="Utility classes scale from comfortable phone reading to crisp desktop headlines."
        />
        <div className="grid gap-6 rounded-xl border border-border bg-card p-6 sm:p-8">
          <p className="text-display">Display — hero headline</p>
          <p className="text-headline">Section headline</p>
          <p className="text-subhead">Subhead for emphasis</p>
          <p className="text-body">
            Body text for paragraphs. Line height is relaxed for long reading on small screens.
          </p>
          <p className="text-body-muted">
            Muted body for secondary explanations and supporting copy.
          </p>
          <p className="text-caption">Caption / helper text</p>
          <p className="text-label">Form label style</p>
        </div>
      </PageContainer>

      <PageContainer className="space-y-6">
        <SectionHeader
          title="Color tokens"
          description="Neutral base with subtle blue-gray cast for professionalism. Semantic success, warning, and info sit beside destructive."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Primary", className: "bg-primary text-primary-foreground" },
            { label: "Muted", className: "bg-muted text-muted-foreground" },
            { label: "Success", className: "bg-success text-success-foreground" },
            { label: "Destructive", className: "bg-destructive text-white" },
          ].map((swatch) => (
            <div
              key={swatch.label}
              className={cn(
                "flex min-h-[5rem] items-end rounded-lg p-4 text-sm font-medium",
                swatch.className,
              )}
            >
              {swatch.label}
            </div>
          ))}
        </div>
      </PageContainer>

      <PageContainer className="space-y-6">
        <SectionHeader title="Buttons" description="Default size is touch-friendly on mobile; use touch for primary CTAs." />
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap gap-3">
            <Button type="button">Primary</Button>
            <Button type="button" variant="secondary">
              Secondary
            </Button>
            <Button type="button" variant="outline">
              Outline
            </Button>
            <Button type="button" variant="ghost">
              Ghost
            </Button>
            <Button type="button" variant="success">
              Success
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" size="touch">
              Touch CTA
            </Button>
            <Button type="button" size="lg">
              Large
            </Button>
            <Button type="button" size="sm">
              Small
            </Button>
          </div>
          <a href="#examples" className={cn(buttonVariants({ variant: "link" }))}>
            Text link styled as button
          </a>
        </div>
      </PageContainer>

      <PageContainer className="space-y-6">
        <SectionHeader
          title="Forms"
          description="Labels stay visible; fields use 44px minimum height on mobile; validation text is explicit."
        />
        <div className="grid max-w-lg gap-8 rounded-xl border border-border bg-card p-6 sm:p-8">
          <Field
            id="sg-name"
            label="Full name"
            description="As it should appear on your resume."
            required
            error="Please enter your name."
          >
            <Input autoComplete="name" />
          </Field>
          <Field
            id="sg-email"
            label="Email"
            success="We will only use this for your account."
          >
            <Input type="email" autoComplete="email" />
          </Field>
          <div className="space-y-2">
            <Label htmlFor="sg-role" className="text-label">
              Target role
            </Label>
            <Select>
              <SelectTrigger id="sg-role" size="default" aria-label="Target role">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eng">Software engineer</SelectItem>
                <SelectItem value="pm">Product manager</SelectItem>
                <SelectItem value="design">Designer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field id="sg-summary" label="Professional summary" required>
            <Textarea rows={4} placeholder="Write 2–3 concise sentences." />
          </Field>
        </div>
      </PageContainer>

      <PageContainer className="space-y-6">
        <SectionHeader title="Cards" />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Resume draft</CardTitle>
              <CardDescription>Last edited just now</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body-muted text-pretty">
                Cards use quiet borders and soft backgrounds — no heavy shadows or gradients.
              </p>
            </CardContent>
            <CardFooter>
              <Button type="button" variant="secondary" className="w-full sm:w-auto">
                Open
              </Button>
            </CardFooter>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Compact card</CardTitle>
              <CardDescription>Smaller padding for dense layouts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-caption">Use sparingly on mobile.</p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      <PageContainer className="space-y-6">
        <SectionHeader
          title="Steps"
          description="Horizontal flow that wraps on narrow screens."
        />
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <StepIndicator
            currentStepId="edit"
            steps={[
              { id: "start", label: "Start" },
              { id: "edit", label: "Edit" },
              { id: "review", label: "Review" },
              { id: "export", label: "Export" },
            ]}
          />
        </div>
      </PageContainer>

      <PageContainer className="space-y-6">
        <SectionHeader title="Loading & empty" />
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-label">Skeleton</p>
            <div className="space-y-3 rounded-xl border border-border p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-label">Empty state</p>
            <EmptyState
              icon={<FileText />}
              title="No resume yet"
              description="Start from a template or paste your experience. Preview stays free until you export."
              action={
                <Button type="button" size="touch" className="w-full">
                  Create resume
                </Button>
              }
            />
          </div>
        </div>
      </PageContainer>

      <PageContainer className="space-y-6">
        <SectionHeader title="Feedback" />
        <div className="grid gap-4">
          <FeedbackBanner
            tone="success"
            title="Payment received"
            description="You can download your PDF from the export screen."
          />
          <FeedbackBanner
            tone="error"
            title="Could not save"
            description="Check your connection and try again."
          />
          <FeedbackBanner
            tone="warning"
            title="Approaching limit"
            description="Free preview includes one active draft."
          />
          <FeedbackBanner tone="info" title="Tip" description="Short bullets read better on mobile." />
        </div>
      </PageContainer>

      <PageContainer className="space-y-6">
        <SectionHeader title="Inline alert (default)" />
        <Alert>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>
            Alerts use the same spacing scale as the rest of the system.
          </AlertDescription>
        </Alert>
      </PageContainer>

      <PageContainer className="space-y-6">
        <SectionHeader
          title="Responsive dialog"
          description="Sheet on small screens; dialog on md+."
        />
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <StyleGuideDialogDemo />
        </div>
      </PageContainer>

      <PageContainer className="space-y-6">
        <SectionHeader
          title="Mobile sticky bar"
          description="Fixed bottom actions with safe-area padding — resize the viewport or open on a phone to see behavior."
        />
        <div className="relative min-h-[11rem] overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <p className="text-caption mb-24 max-w-prose">
            The bar below mimics the mobile checkout / export pattern. Content pages should add
            bottom padding so text is not hidden behind it.
          </p>
          <StickyBottomBar>
            <Button type="button" size="touch" className="w-full">
              Save & continue
            </Button>
          </StickyBottomBar>
        </div>
      </PageContainer>

      <PageContainer className="space-y-6">
        <SectionHeader
          title="Layout: marketing vs app"
          description="Marketing uses a simple top bar. The authenticated app uses a desktop sidebar and a bottom tab bar on mobile (see /app)."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-label mb-2">Marketing</p>
            <p className="text-body-muted text-pretty">
              Top navigation with large tap targets and minimal chrome. Primary conversion is “Open
              app”.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-label mb-2">App</p>
            <p className="text-body-muted text-pretty">
              Sidebar on md+; sticky mobile header + bottom navigation with safe-area insets. Main
              content uses extra bottom padding on small screens.
            </p>
          </div>
        </div>
        <Separator className="my-2" />
        <p className="text-caption max-w-prose">
          Resize the browser across breakpoints to see typography scale, button sizes, and the
          responsive dialog switch.
        </p>
      </PageContainer>
    </div>
  );
}
