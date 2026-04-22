"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { XIcon } from "lucide-react";
import { sanitizeNextPath } from "@/lib/auth/redirect";
import { ROUTES } from "@/lib/constants";

type AppLoginPanelContextValue = {
  /** Opens the sign-in panel sliding in from the right. */
  openLogin: (nextPath?: string) => void;
  closeLogin: () => void;
};

const AppLoginPanelContext = createContext<AppLoginPanelContextValue | null>(
  null,
);

export function useAppLoginPanel(): AppLoginPanelContextValue {
  const ctx = useContext(AppLoginPanelContext);
  if (!ctx) {
    throw new Error("useAppLoginPanel must be used within AppLoginPanelProvider");
  }
  return ctx;
}

type AppLoginPanelProviderProps = {
  children: ReactNode;
  /** When false, `openLogin` / `closeLogin` are no-ops and the sheet is not mounted. */
  guest: boolean;
};

export function AppLoginPanelProvider({
  children,
  guest,
}: AppLoginPanelProviderProps) {
  const [open, setOpen] = useState(false);
  const [nextPath, setNextPath] = useState<string>(ROUTES.app.root);
  const [formKey, setFormKey] = useState(0);

  const openLogin = useCallback(
    (next?: string) => {
      if (!guest) return;
      setNextPath(sanitizeNextPath(next));
      setFormKey((k) => k + 1);
      setOpen(true);
    },
    [guest],
  );

  const closeLogin = useCallback(() => {
    if (!guest) return;
    setOpen(false);
  }, [guest]);

  const value = useMemo<AppLoginPanelContextValue>(
    () => ({
      openLogin: guest ? openLogin : () => {},
      closeLogin: guest ? closeLogin : () => {},
    }),
    [guest, openLogin, closeLogin],
  );

  return (
    <AppLoginPanelContext.Provider value={value}>
      {children}
      {guest ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="right"
            showCloseButton={false}
            className="min-w-0 gap-0 overflow-hidden border-l border-zinc-200 bg-white p-0 shadow-[0_0_40px_rgba(0,0,0,0.12)] dark:border-zinc-800 dark:bg-zinc-950 data-[side=right]:w-1/3 data-[side=right]:max-w-none data-[side=right]:sm:max-w-none"
          >
            <SheetDescription className="sr-only">
              Sign in or create an account: email, name, then password or a one-time code, or use Google.
            </SheetDescription>
            <div className="relative flex h-14 shrink-0 items-center justify-center border-b border-white/10 bg-[#121212] pt-[max(0px,env(safe-area-inset-top,0px))]">
              <SheetTitle className="text-center text-base font-medium tracking-tight text-white">
                Account
              </SheetTitle>
              <SheetClose
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-3 top-1/2 size-9 -translate-y-1/2 rounded-full border border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  />
                }
              >
                <XIcon className="size-4" aria-hidden />
                <span className="sr-only">Close</span>
              </SheetClose>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-8 py-10 md:px-10">
              <LoginForm
                key={formKey}
                nextPath={nextPath}
                variant="panel"
                onPanelAuthSuccess={() => setOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </AppLoginPanelContext.Provider>
  );
}
