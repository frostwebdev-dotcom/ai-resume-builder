"use client";

import { useTransition } from "react";
import Link from "next/link";
import { LogOut, Settings, Shield } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/constants";
import { signOutAction } from "@/services/auth/actions";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  email: string;
  isAdmin: boolean;
  variant?: "default" | "icon";
  /** Dark sidebar trigger (dashboard shell). */
  tone?: "default" | "inverse";
  /** Fires when the account dropdown opens or closes (e.g. expand-on-hover sidebar). */
  onOpenChange?: (open: boolean) => void;
  /** Merged onto the trigger after variants (e.g. app rail `h-8` alignment). */
  triggerClassName?: string;
};

function LogoutItem() {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
      className="cursor-pointer"
    >
      <LogOut className="size-4 opacity-70" aria-hidden />
      {pending ? "Signing out…" : "Log out"}
    </DropdownMenuItem>
  );
}

export function UserMenu({
  email,
  isAdmin,
  variant = "default",
  tone = "default",
  onOpenChange,
  triggerClassName,
}: UserMenuProps) {
  const display = email.length > 28 ? `${email.slice(0, 26)}…` : email;
  const inverse = tone === "inverse";

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          buttonVariants({ variant: "outline", size: variant === "icon" ? "icon-sm" : "sm" }),
          variant === "default" && "max-w-full justify-start gap-2",
          variant === "icon" && "shrink-0",
          inverse &&
            "border-white/25 bg-white/5 text-zinc-100 hover:bg-white/10 hover:text-white dark:border-white/25 dark:bg-white/5",
          triggerClassName,
        )}
        aria-label="Account menu"
      >
        {variant === "icon" ? (
          <span className="text-sm font-semibold" aria-hidden>
            {email.slice(0, 1).toUpperCase()}
          </span>
        ) : (
          <span className="truncate text-left text-sm font-normal">{display}</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-xs text-muted-foreground">Signed in as</span>
            <span className="block truncate text-sm font-medium text-foreground">{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={ROUTES.app.account} className="cursor-pointer" />}>
          <Settings className="size-4 opacity-70" aria-hidden />
          Account
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem render={<Link href={ROUTES.admin.root} className="cursor-pointer" />}>
            <Shield className="size-4 opacity-70" aria-hidden />
            Admin
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <LogoutItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
