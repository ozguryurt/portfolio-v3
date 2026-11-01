import { createContext, useContext } from "react";
import type { Language, SiteRoute } from "./localeRouting";
import type { Translations } from "./translations";
export type SiteState = {
  route: SiteRoute;
  language: Language;
  copy: Translations;
  homePath: string;
  projectsPath: string;
  setLanguage: (language: Language) => void;
  restoreScroll: () => boolean;
};
export const SiteContext = createContext<SiteState | null>(null);
export function useSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error("SiteProvider is required.");
  return context;
}
