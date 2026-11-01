import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  isLanguage,
  isSitePath,
  LANGUAGE_KEY,
  localizedPath,
  resolveRoute,
  BEFORE_LANGUAGE_CHANGE,
} from "./localeRouting";
import type { Language, SiteRoute } from "./localeRouting";
import { translations } from "./translations";
import { SiteContext, useSite } from "./site";
type ScrollPosition = { top: number; section?: string; offset?: number };

function captureScroll(): ScrollPosition {
  const section = [
    ...document.querySelectorAll<HTMLElement>("main section[id]"),
  ].find((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top <= innerHeight / 2 && rect.bottom > innerHeight / 2;
  });
  return {
    top: scrollY,
    section: section?.id,
    offset: section ? -section.getBoundingClientRect().top : undefined,
  };
}

export function SiteProvider({
  initialRoute,
  children,
}: {
  initialRoute: SiteRoute;
  children: ReactNode;
}) {
  const [route, setRoute] = useState(initialRoute);
  const current = useRef(route);
  const pendingScroll = useRef<ScrollPosition | null>(null);
  const restoreScroll = useCallback(() => {
    const position = pendingScroll.current;
    if (!position) return false;
    pendingScroll.current = null;
    const section = position.section
      ? document.getElementById(position.section)
      : null;
    const top = section
      ? scrollY + section.getBoundingClientRect().top + (position.offset ?? 0)
      : position.top;
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, Math.max(0, top));
    document.documentElement.style.scrollBehavior = previous;
    return true;
  }, []);

  const rememberPosition = () => {
    history.replaceState({ ...history.state, portfolioScroll: scrollY }, "");
  };
  const setLanguage = useCallback((language: Language) => {
    if (!isLanguage(language)) return;
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      /* Keep the in-memory preference. */
    }
    if (language === current.current.language) return;
    pendingScroll.current = captureScroll();
    rememberPosition();
    // SplitText wrappers must be reverted before React replaces their text.
    window.dispatchEvent(new Event(BEFORE_LANGUAGE_CHANGE));
    const next = { ...current.current, language };
    history.pushState(
      {},
      "",
      localizedPath(language, next.page) + location.search + location.hash,
    );
    current.current = next;
    setRoute(next);
  }, []);

  useEffect(() => {
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element).closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const raw = anchor.getAttribute("href")!;
      if (raw.startsWith("#")) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || !isSitePath(url.pathname)) return;
      event.preventDefault();
      const next = resolveRoute(url.pathname, current.current.language, []);
      const samePage =
        next.page === current.current.page &&
        next.language === current.current.language;
      rememberPosition();
      if (next.language !== current.current.language)
        window.dispatchEvent(new Event(BEFORE_LANGUAGE_CHANGE));
      pendingScroll.current = !samePage && !url.hash ? { top: 0 } : null;
      history.pushState(
        {},
        "",
        localizedPath(next.language, next.page) + url.search + url.hash,
      );
      if (samePage) {
        if (url.hash) window.dispatchEvent(new HashChangeEvent("hashchange"));
        else window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        current.current = next;
        setRoute(next);
      }
    };
    const pop = () => {
      const next = resolveRoute(
        location.pathname,
        current.current.language,
        [],
      );
      if (next.language !== current.current.language)
        window.dispatchEvent(new Event(BEFORE_LANGUAGE_CHANGE));
      const samePage =
        next.page === current.current.page &&
        next.language === current.current.language;
      pendingScroll.current = {
        top: Number(history.state?.portfolioScroll) || 0,
      };
      current.current = next;
      setRoute(next);
      if (samePage) {
        restoreScroll();
        if (location.hash)
          window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
    };
    document.addEventListener("click", navigate);
    window.addEventListener("popstate", pop);
    return () => {
      document.removeEventListener("click", navigate);
      window.removeEventListener("popstate", pop);
    };
  }, [restoreScroll]);

  const copy = translations[route.language];
  useLayoutEffect(() => {
    document.documentElement.lang = route.language;
    document.title =
      route.page === "projects" ? copy.archiveTitle : copy.metaTitle;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", copy.description);
  }, [route.language, route.page, copy]);
  return (
    <SiteContext.Provider
      value={{
        route,
        language: route.language,
        copy,
        homePath: localizedPath(route.language, "home"),
        projectsPath: localizedPath(route.language, "projects"),
        setLanguage,
        restoreScroll,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function LanguageSwitcher() {
  const { language, setLanguage, copy } = useSite();
  return (
    <div
      className="language-switcher"
      role="group"
      aria-label={copy.languageLabel}
    >
      <button
        type="button"
        lang="tr"
        aria-label="Türkçe"
        aria-pressed={language === "tr"}
        onClick={() => setLanguage("tr")}
      >
        TR
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        lang="en"
        aria-label="English"
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
    </div>
  );
}
