export type Language = "tr" | "en";
export type Page = "home" | "projects";
export type SiteRoute = { language: Language; page: Page };
export const LANGUAGE_KEY = "portfolio-language";

export function isLanguage(value: unknown): value is Language {
  return value === "tr" || value === "en";
}

export function resolveRoute(
  pathname: string,
  saved: unknown,
  browserLanguages: readonly string[],
): SiteRoute {
  const parts = pathname.split("/").filter(Boolean);
  const explicit = isLanguage(parts[0]) ? (parts.shift() as Language) : null;
  const browserLanguage =
    browserLanguages
      .map((tag) => tag.toLowerCase().split("-")[0])
      .find(isLanguage) ?? "en";
  return {
    language: explicit ?? (isLanguage(saved) ? saved : browserLanguage),
    page:
      parts[0] === "projeler" || parts[0] === "projects" ? "projects" : "home",
  };
}

export function localizedPath(language: Language, page: Page): string {
  return `/${language}${page === "projects" ? (language === "tr" ? "/projeler" : "/projects") : ""}`;
}

export function isSitePath(pathname: string) {
  return /^\/(?:(?:tr|en)(?:\/(?:projects|projeler))?|projects|projeler)?\/?$/.test(
    pathname,
  );
}

export const BEFORE_LANGUAGE_CHANGE = "portfolio:before-language-change";

export function initializeSite(): SiteRoute {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(LANGUAGE_KEY);
  } catch {
    /* Storage may be unavailable. */
  }
  const route = resolveRoute(
    location.pathname,
    saved,
    navigator.languages ?? [navigator.language],
  );
  history.replaceState(
    history.state,
    "",
    localizedPath(route.language, route.page) + location.search + location.hash,
  );
  document.documentElement.lang = route.language;
  return route;
}
