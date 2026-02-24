import { neonTheme } from "./neon-theme";
import { silkTheme } from "./silk-theme";
import type { StorefrontTheme } from "../theme-types";

export const themes: Record<string, StorefrontTheme> = {
  neon: neonTheme,
  silk: silkTheme,
};

export function getTheme(key: string): StorefrontTheme | undefined {
  return themes[key];
}

export { neonTheme, silkTheme };
