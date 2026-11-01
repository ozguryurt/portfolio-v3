import { useLayoutEffect, useRef, useState } from "react";
import { useProjects } from "./projects";
import type { Project } from "./projects";
import { projectImageSet } from "./projectImages";
import { ProjectDialog } from "./ProjectDialog";
import "./App.css";
import "./ProjectsPage.css";
import { LanguageSwitcher } from "./SiteContext";
import { useSite } from "./site";

const PAGE_SIZE = 9;
const year = new Date().getFullYear();

export default function ProjectsPage() {
  const { copy, language, homePath, projectsPath, restoreScroll } = useSite();
  const { projects, loading, error, reload } = useProjects();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Project | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const visibleProjects = projects.slice(0, visibleCount);
  const hasMore = visibleCount < projects.length;
  useLayoutEffect(() => {
    if (loading) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) restoreScroll();
    });
    return () => {
      cancelled = true;
    };
  }, [language, loading, restoreScroll]);
  const showMore = () => {
    const nextIndex = visibleProjects.length;
    setVisibleCount((count) => count + PAGE_SIZE);
    requestAnimationFrame(() => {
      grid.current
        ?.querySelectorAll<HTMLButtonElement>(".archive-cover")
        [nextIndex]?.focus({ preventScroll: true });
    });
  };
  return (
    <div className="projects-page">
      <a className="skip-link" href="#proje-listesi">
        {copy.skipProjects}
      </a>
      <header className="archive-header container">
        <a className="monogram" href={homePath} aria-label={copy.homeLabel}>
          ö<span>y.</span>
        </a>
        <nav aria-label={copy.mainMenu}>
          {copy.navigation.map(([label, id]) => (
            <a
              key={id}
              href={id === "projeler" ? projectsPath : `${homePath}#${id}`}
              aria-current={id === "projeler" ? "page" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="archive-header-actions">
          <LanguageSwitcher />
          <a className="archive-contact" href={`${homePath}#iletisim`}>
            {copy.workTogether} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>
      <main className="archive-main container">
        <div className="archive-intro">
          <div>
            <span className="eyebrow">
              <span /> {copy.archiveEyebrow}
            </span>
            <h1>
              {copy.archiveHeading[0]}
              <br />
              <em>{copy.archiveHeading[1]}</em>
            </h1>
          </div>
          <div className="archive-intro-copy">
            <span className="archive-count">
              {String(projects.length).padStart(2, "0")} {copy.projectUnit}
            </span>
            <p>
              {copy.archiveLead[0]}
              <br />
              {copy.archiveLead[1]}
            </p>
            <a className="text-link" href={homePath}>
              {copy.backHome} <span aria-hidden="true">↖</span>
            </a>
          </div>
        </div>
        <div className="archive-list-heading" id="proje-listesi">
          <h2>
            {copy.allProjectsTitle}
            <span>{String(projects.length).padStart(2, "0")}</span>
          </h2>
          <span>{copy.discoverNote}</span>
        </div>
        {loading && (
          <p className="catalog-message" role="status">
            {copy.loading}
          </p>
        )}
        {error && (
          <div className="catalog-message" role="alert">
            <p>{copy.loadError}</p>
            <button className="text-link" onClick={reload}>
              {copy.retry} ↗
            </button>
          </div>
        )}
        <div className="archive-grid" ref={grid} aria-busy={loading}>
          {visibleProjects.map((project, index) => (
            <article className="archive-card" key={`${project.name}-${index}`}>
              <button
                className="archive-cover"
                onClick={() => setSelected(project)}
                aria-label={`${project.name} — ${copy.openDetails}`}
              >
                <img
                  src={project.images[0]}
                  srcSet={projectImageSet(project.images[0])}
                  sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw"
                  alt={`${project.name} — ${copy.projectImage}`}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="real-project-image"
                />
                <span className="archive-cover-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="archive-cover-arrow" aria-hidden="true">
                  ↗
                </span>
              </button>
              <h3>
                <button onClick={() => setSelected(project)}>
                  {project.name}
                </button>
              </h3>
              {project.url && (
                <a
                  className="project-url"
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {project.url.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
                </a>
              )}
              <div className="archive-card-actions">
                <button onClick={() => setSelected(project)}>
                  {copy.details} <span aria-hidden="true">↗</span>
                </button>
              </div>
            </article>
          ))}
        </div>
        {!loading && !error && projects.length === 0 && (
          <p className="archive-empty">{copy.empty}</p>
        )}
        <div className="archive-pagination" hidden={loading || error !== null}>
          <span role="status" aria-live="polite">
            {visibleProjects.length} / {projects.length} {copy.shown}
          </span>
          {hasMore && (
            <button className="button" onClick={showMore}>
              {copy.showMore} <span aria-hidden="true">＋</span>
            </button>
          )}
        </div>
        <div className="archive-end">
          <span className="eyebrow">{copy.nextProject}</span>
          <h2>
            {copy.contactTitle[0]} <em>{copy.contactTitle[1]}</em>
          </h2>
          <a className="button" href={`${homePath}#iletisim`}>
            {copy.contactCta} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </main>
      <footer className="archive-footer container">
        <a href={homePath}>Özgür Yurt</a>
        <span>
          © {year} · {copy.developer}
        </span>
        <a
          href="https://github.com/ozguryurt"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>
      </footer>
      {selected && (
        <ProjectDialog
          key={selected.name}
          project={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
