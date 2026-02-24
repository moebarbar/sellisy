import { neonTheme } from "./neon-theme";
import { silkTheme } from "./silk-theme";
import { auroraTheme } from "./aurora-theme";
import { emberTheme } from "./ember-theme";
import { frostTheme } from "./frost-theme";
import { midnightTheme } from "./midnight-theme";
import type { StorefrontTheme } from "../theme-types";

export const themes: Record<string, StorefrontTheme> = {
  neon: neonTheme,
  silk: silkTheme,
  aurora: auroraTheme,
  ember: emberTheme,
  frost: frostTheme,
  midnight: midnightTheme,
};

export function getTheme(key: string): StorefrontTheme | undefined {
  return themes[key];
}

export { neonTheme, silkTheme, auroraTheme, emberTheme, frostTheme, midnightTheme };
