/**
 * Attributes that stop *other software* from drawing popups on top of our own
 * editors — the ones users see while typing a headline or profile description:
 *
 * - `writingsuggestions="false"` — Chrome 130+ / Safari 18+ inline writing
 *   suggestions and the "Help me write" bubble. Not in React's DOM types yet,
 *   which is why this object is loosely typed and spread into JSX.
 * - `autoComplete="off"` + `autoCorrect="off"` — browser autofill dropdown and
 *   autocorrect replacement bubbles.
 * - `data-1p-ignore` / `data-lpignore` / `data-bwignore` / `data-form-type` —
 *   1Password, LastPass, Bitwarden, Dashlane in-field icons and dropdowns.
 * - `data-gramm*` — Grammarly's floating overlay.
 *
 * Spellcheck is deliberately left on: red squiggles are worth keeping on a
 * resume. Only the popup-drawing behaviours are turned off.
 */
export const SUPPRESS_TEXT_ASSIST: Record<string, string> = {
  writingsuggestions: "false",
  autoComplete: "off",
  autoCorrect: "off",
  "data-1p-ignore": "true",
  "data-lpignore": "true",
  "data-bwignore": "true",
  "data-form-type": "other",
  "data-gramm": "false",
  "data-gramm_editor": "false",
  "data-enable-grammarly": "false",
};
