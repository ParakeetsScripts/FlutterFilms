import type { CSSProperties } from "react";

type CssVarName = `--${string}`;

/** Typed inline custom properties, e.g. `style={cssVars({ "--i": index })}`. */
export function cssVars(vars: Partial<Record<CssVarName, string | number>>): CSSProperties {
  return vars as CSSProperties;
}
