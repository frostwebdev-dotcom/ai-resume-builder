"use client";

import { useTransition } from "react";
import Link from "next/link";
import { LogOut, Settings, Shield } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
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

export function UserMenu({ email, isAdmin, variant = "default" }: UserMenuProps) {
  const display = email.length > 28 ? `${email.slice(0, 26)}…` : email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          buttonVariants({ variant: "outline", size: variant === "icon" ? "icon-sm" : "sm" }),
          variant === "default" && "max-w-full justify-start gap-2",
          variant === "icon" && "shrink-0",
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
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-xs text-muted-foreground">Signed in as</span>
          <span className="block truncate text-sm font-medium text-foreground">{email}</span>
        </DropdownMenuLabel>
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
