"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Plus, UserRound } from "lucide-react";

import { UserMenu } from "@/components/auth/user-menu";
import type { AppShellUser } from "@/components/layout/app-shell";
import { useAppLoginPanel } from "@/components/layout/app-login-panel";
import { useSidebarVisibility } from "@/components/layout/sidebar-visibility";
import {
  DASHBOARD_NAV_DESKTOP,
  dashboardSidebarActive,
} from "@/components/projects/dashboard-workspace-grid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { NewResumeServerForm } from "@/components/projects/new-resume-server-form";

/** Horizontal padding for rail sections — same narrow vs expanded. */
const RAIL_PAD_X = "px-3";

const railLayoutTransition =
  "transition-[color,background-color,border-color,width,height,padding,border-radius,margin,gap,max-width] duration-200 ease-out";

const railNewShared = cn(
  "flex items-center justify-center gap-2 rounded-full border border-white/35 bg-transparent font-semibold text-white outline-none",
  railLayoutTransition,
  "hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40",
);

const sidebarNewGuestClass = cn(railNewShared, "w-full py-2.5 text-sm");

const sidebarNewSignedInClass = cn(
  railNewShared,
  "w-full py-2.5 text-sm disabled:pointer-events-none disabled:opacity-60",
);

/** Narrow rail: same footprint as compact “New” (icon-only chip). */
const railNarrowChip = cn(
  "mx-auto flex size-8 shrink-0 items-center justify-center gap-0 rounded-lg p-0",
  railLayoutTransition,
);

const railHomeLink = cn(
  "group flex min-w-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/40",
  railLayoutTransition,
  "text-white hover:bg-white/[0.06]",
);

const railLogoMark = cn(
  "flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold tracking-tight text-white ring-1 ring-white/15",
);

const railNavLink = cn(
  "relative flex min-h-10 items-center rounded-lg px-3 py-2.5 text-sm font-medium",
  railLayoutTransition,
);

const railNavIcon = "size-4 shrink-0 pointer-events-none";

const railFooter = cn("flex flex-col gap-2 border-t border-white/10 p-3");

const railLoginBtn = cn(
  "flex w-full items-center rounded-lg text-left text-sm font-medium text-zinc-400",
  railLayoutTransition,
  "hover:bg-white/[0.06] hover:text-zinc-100",
);

const sidebarControlBase = cn(
  "flex shrink-0 items-center rounded-lg border border-white/12 bg-white/[0.04] outline-none text-zinc-200",
  railLayoutTransition,
  "hover:border-white/18 hover:bg-white/[0.08] hover:text-white",
  "focus-visible:ring-2 focus-visible:ring-white/35",
);

const sidebarControlWide = cn(sidebarControlBase, "h-8 min-h-8 w-full gap-1.5 px-2 text-left text-[0.65rem] font-medium leading-tight");

const sidebarControlNarrow = cn(sidebarControlBase, "size-8 justify-center");

/** Collapsed-rail metaphor: frame, divider ~⅓ from left, three stacked nav dots. */
function SidebarControlGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-current opacity-90", className)}
      width="1em"
      height="1em"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <line
        x1="8"
        y1="5.25"
        x2="8"
        y2="18.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="5" cy="8.25" r="1.05" fill="currentColor" />
      <circle cx="5" cy="12" r="1.05" fill="currentColor" />
      <circle cx="5" cy="15.75" r="1.05" fill="currentColor" />
    </svg>
  );
}

/** Same glyph box in both modes (14px). */
const SIDEBAR_CONTROL_GLYPH_CLASS = "size-3.5";

function SidebarControlMenu({ narrowRail }: { narrowRail: boolean }) {
  const { mode, setMode } = useSidebarVisibility();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(narrowRail ? sidebarControlNarrow : sidebarControlWide)}
        aria-label="Sidebar control"
      >
        <SidebarControlGlyph className={SIDEBAR_CONTROL_GLYPH_CLASS} />
        {narrowRail ? (
          <span className="sr-only">Sidebar control</span>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate">Sidebar</span>
            <ChevronDown className="size-3 shrink-0 opacity-70" aria-hidden />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={narrowRail ? "right" : "top"}
        align="start"
        sideOffset={narrowRail ? 8 : 6}
        className={cn(
          "min-w-[13.5rem] border border-white/12 bg-[#252830] p-1 text-zinc-100 shadow-xl ring-1 ring-black/30",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
        )}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 text-[0.7rem] font-medium tracking-wide text-zinc-500">
            Sidebar control
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuRadioGroup
            value={mode}
            onValueChange={(value) => {
              if (value === "expanded" || value === "collapsed" || value === "expand-on-hover") {
                setMode(value);
              }
            }}
          >
            <DropdownMenuRadioItem
              value="expanded"
              className="cursor-pointer text-zinc-200 focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10"
            >
              Expanded
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="collapsed"
              className="cursor-pointer text-zinc-200 focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10"
            >
              Collapsed
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="expand-on-hover"
              className="cursor-pointer text-zinc-200 focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10"
            >
              Expand on hover
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Aligns account trigger with rail chrome (h-8, inverse outline). */
const userMenuRailTriggerClass = cn(
  "min-h-8 h-8 w-full rounded-lg border-white/25 bg-white/5 text-zinc-100",
  railLayoutTransition,
  "hover:bg-white/10 hover:text-white",
  "sm:min-h-8 sm:h-8",
);

const userMenuRailTriggerIconClass = cn(userMenuRailTriggerClass, railNarrowChip);

type AppSidebarProps = {
  user: AppShellUser | null;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const { mode, narrowRail, setRailHovered, setAccountMenuOpen } = useSidebarVisibility();
  const { openLogin } = useAppLoginPanel();

  const hoverExpand = mode === "expand-on-hover";
  const overlaysExpandedRail = hoverExpand && !narrowRail;

  return (
    <aside
      onMouseEnter={() => hoverExpand && setRailHovered(true)}
      onMouseLeave={() => hoverExpand && setRailHovered(false)}
      className={cn(
        "hidden md:flex",
        "fixed left-0 top-0 h-dvh max-h-dvh",
        "shrink-0 flex-col overflow-hidden",
        "bg-[#1c1f26] text-zinc-100 shadow-[4px_0_24px_rgba(0,0,0,0.12)]",
        "[scrollbar-gutter:stable]",
        "transition-[width,box-shadow] duration-200 ease-out",
        narrowRail ? "w-14" : "w-[15.5rem] lg:w-60",
        overlaysExpandedRail ? "z-30 shadow-[8px_0_40px_rgba(0,0,0,0.35)]" : "z-20",
      )}
      aria-label="Primary navigation"
    >
      <div
        className={cn("flex h-full min-w-0 flex-col", narrowRail ? "w-14" : "w-[15.5rem] lg:w-60")}
      >
        {/* Header: same height, padding, border, home affordances in both modes */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-white/10",
            RAIL_PAD_X,
            "pt-[max(0.25rem,env(safe-area-inset-top,0px))] pb-2",
            narrowRail ? "justify-center" : "justify-start",
          )}
        >
          <Link
            href={ROUTES.home}
            aria-label={`${APP_NAME} — home`}
            className={cn(
              railHomeLink,
              narrowRail ? "size-8 shrink-0 justify-center" : "min-w-0 flex-1 gap-2",
            )}
          >
            <span className={railLogoMark} aria-hidden>
              S
            </span>
            {narrowRail ? null : (
              <span className="line-clamp-2 min-w-0 text-left text-[0.7rem] font-semibold leading-snug tracking-tight text-white sm:text-xs">
                {APP_NAME}
              </span>
            )}
          </Link>
        </div>

        <div className={cn(RAIL_PAD_X, "pb-2 pt-2")}>
          {user ? (
            <NewResumeServerForm
              formClassName="w-full"
              buttonClassName={cn(
                sidebarNewSignedInClass,
                narrowRail && cn(railNarrowChip, "max-w-none rounded-lg border-white/35"),
              )}
              idleContent={
                narrowRail ? (
                  <span className="sr-only">New resume — create a draft in your account</span>
                ) : (
                  "New"
                )
              }
              pendingText={narrowRail ? "" : "Creating…"}
              aria-label="New resume — create a draft in your account"
            />
          ) : (
            <Link
              href={ROUTES.create}
              className={cn(
                sidebarNewGuestClass,
                narrowRail && cn(railNarrowChip, "border-white/35"),
              )}
              aria-label="New resume — open the builder"
            >
              <Plus className={railNavIcon} aria-hidden />
              {narrowRail ? null : "New"}
            </Link>
          )}
        </div>

        <nav
          className={cn(
            "flex flex-1 flex-col gap-0.5 overflow-y-auto overscroll-y-contain pb-3 pt-1",
            RAIL_PAD_X,
          )}
        >
          {DASHBOARD_NAV_DESKTOP.map(({ href, label, icon: Icon }) => {
            const active = dashboardSidebarActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                title={label}
                className={cn(
                  narrowRail ? railNarrowChip : railNavLink,
                  !narrowRail && "justify-start gap-3",
                  narrowRail && "min-h-0 text-sm font-medium",
                  active
                    ? "bg-white/12 text-white"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100",
                )}
              >
                <Icon
                  className={cn(railNavIcon, active ? "text-white" : "opacity-90")}
                  aria-hidden
                />
                {narrowRail ? (
                  <span className="sr-only">{label}</span>
                ) : (
                  <span>{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={railFooter}>
          <SidebarControlMenu narrowRail={narrowRail} />
          {user ? (
            <UserMenu
              email={user.email}
              isAdmin={user.isAdmin}
              tone="inverse"
              variant={narrowRail ? "icon" : "default"}
              triggerClassName={narrowRail ? userMenuRailTriggerIconClass : userMenuRailTriggerClass}
              onOpenChange={setAccountMenuOpen}
            />
          ) : (
            <button
              type="button"
              onClick={() => openLogin(ROUTES.app.root)}
              aria-label="Log in to your account"
              title="Log in"
              className={cn(
                railLoginBtn,
                narrowRail ? railNarrowChip : "gap-2.5 px-3 py-2.5",
              )}
            >
              <UserRound className={cn(railNavIcon, "opacity-90")} aria-hidden />
              {narrowRail ? null : "Log in"}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
