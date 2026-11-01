import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import "./App.css";
import { useScrollEffects } from "./useScrollEffects";
import "./scroll-effects.css";
import { HeroPortrait } from "./HeroPortrait";
import { useProjects } from "./projects";
import type { Project } from "./projects";
import { projectImageSet } from "./projectImages";
import { ProjectDialog } from "./ProjectDialog";
import "./ContactLinks.css";
import "./ProjectsPage.css";
import { LanguageSwitcher } from "./SiteContext";
import { useSite } from "./site";

// Contact details. Project entries below are illustrative concepts.
const currentYear = new Date().getFullYear();
const profile = {
  name: "Özgür",
  surname: "Yurt",
  email: "ozgurryurtt@gmail.com",
  github: "https://github.com/ozguryurt",
  linkedin: "https://tr.linkedin.com/in/ozguryurt",
};
const portrait = "https://i.imgur.com/HoYXvZl.png";
function Arrow({ diagonal = true }: { diagonal?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
function Star({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M40 0v80M0 40h80M12 12l56 56M12 68l56-56"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function App() {
  const { copy, projectsPath, language } = useSite();
  const nav = copy.navigation;
  const services = copy.services;
  const { projects, loading, error, reload } = useProjects();
  const featuredProjects = projects.slice(0, 3);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("anasayfa");
  const [service, setService] = useState<number | null>(0);
  const [selected, setSelected] = useState<Project | null>(null);
  const [motion, setMotion] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstMenuLink = useRef<HTMLAnchorElement>(null);
  useScrollEffects(
    motion,
    menuOpen || selected !== null,
    featuredProjects.length,
    !loading,
  );
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setMotion(!preference.matches);
    preference.addEventListener("change", updateMotion);
    return () => preference.removeEventListener("change", updateMotion);
  }, []);
  useEffect(() => {
    const sections = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        }),
      { rootMargin: "-20% 0px -50% 0px" },
    );
    document
      .querySelectorAll("main > section[id]")
      .forEach((el) => sections.observe(el));
    let frame = 0;
    let previousScroll = window.scrollY;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        document.documentElement.style.setProperty(
          "--progress",
          `${max > 0 ? (scrollY / max) * 100 : 0}%`,
        );
        const header = document.querySelector(".site-header");
        header?.classList.toggle("is-scrolled", scrollY > 40);
        header?.classList.toggle(
          "is-hidden",
          scrollY > previousScroll &&
            scrollY > 500 &&
            !document.documentElement.classList.contains("menu-open"),
        );
        previousScroll = scrollY;
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      sections.disconnect();
      window.removeEventListener("scroll", update);
      cancelAnimationFrame(frame);
    };
  }, []);
  useEffect(() => {
    document.body.style.overflow = menuOpen || selected ? "hidden" : "";
    if (menuOpen) firstMenuLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
      if (e.key === "Tab" && menuOpen) {
        const links =
          document.querySelectorAll<HTMLAnchorElement>("#mobile-menu a");
        const first = links[0],
          last = links[links.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          menuButton.current?.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          menuButton.current?.focus();
        } else if (
          e.shiftKey &&
          document.activeElement === menuButton.current
        ) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          document.activeElement === menuButton.current
        ) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, selected]);
  const tilt = (e: PointerEvent<HTMLButtonElement>) => {
    if (!motion || e.pointerType !== "mouse") return;
    const b = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty(
      "--rx",
      `${-(e.clientY - b.top - b.height / 2) / 100}deg`,
    );
    e.currentTarget.style.setProperty(
      "--ry",
      `${(e.clientX - b.left - b.width / 2) / 100}deg`,
    );
  };
  return (
    <>
      <a className="skip-link" href="#icerik">
        {copy.skip}
      </a>
      <div className="scroll-progress" aria-hidden="true" />
      <header className="site-header">
        <a href="#anasayfa" className="monogram" aria-label={copy.homeLabel}>
          ö<span>y.</span>
        </a>
        <nav className="desktop-nav" aria-label={copy.mainMenu}>
          {nav.map(([label, id]) => (
            <a
              key={id}
              href={`#${id}`}
              className={active === id ? "active" : ""}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <LanguageSwitcher />
          <a className="button button-small" href="#iletisim">
            {copy.workTogether} <Arrow />
          </a>
          <button
            ref={menuButton}
            className={`menu-toggle ${menuOpen ? "open" : ""}`}
            aria-label={menuOpen ? copy.menuClose : copy.menuOpen}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      <div
        id="mobile-menu"
        className={`menu-overlay ${menuOpen ? "open" : ""}`}
        inert={!menuOpen}
      >
        <span className="eyebrow">{copy.explore}</span>
        <nav aria-label={copy.mobileMenu}>
          {nav.map(([label, id], i) => (
            <a
              ref={i === 0 ? firstMenuLink : undefined}
              key={id}
              href={`#${id}`}
              onClick={() => setMenuOpen(false)}
            >
              <sup>0{i + 1}</sup>
              {label}
              <Arrow />
            </a>
          ))}
        </nav>
        <a className="menu-email" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
      </div>
      <main id="icerik" inert={menuOpen}>
        <section id="anasayfa" className="hero">
          <div className="hero-image">
            <img
              src={portrait}
              referrerPolicy="no-referrer"
              alt="Özgür Yurt"
              fetchPriority="high"
            />
            <HeroPortrait src={portrait} motion={motion} />
            <div className="hero-image-shade" />
          </div>
          <div className="hero-grid" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="hero-content">
            <div className="hero-kicker">
              <span className="live-dot" /> {copy.heroKicker}
            </div>
            <h1>
              <span className="hero-line">{copy.heroFirst}</span>
              <span className="hero-line hero-second">
                <em>{copy.heroSecond}</em>
                <span className="gold-dot">✳</span>
              </span>
            </h1>
            <div className="hero-description">
              <span className="tiny-line" />
              <p>
                {copy.heroLead[0]}
                <br />
                {copy.heroLead[1]}
              </p>
            </div>
            <a href="#projeler" className="button hero-cta">
              {copy.selectedWork} <Arrow />
            </a>
          </div>
          <div className="portrait-caption">
            <span>
              {profile.name} {profile.surname}
            </span>
            <span>{copy.role}</span>
          </div>
          <div className="hero-bottom">
            <a href="#projeler" className="scroll-cue">
              <span className="scroll-line" /> {copy.scroll}
            </a>
            <p>
              {copy.platforms}
              <br />
              <span>{copy.endToEnd}</span>
            </p>
            <a className="availability" href="#iletisim">
              <span className="live-dot" />
              <div>
                {copy.available}
                <span>{copy.availableLead}</span>
              </div>
              <Arrow />
            </a>
          </div>
          <span className="hero-side-note">{copy.location}</span>
        </section>
        <div className="marquee" aria-label={copy.marqueeLabel}>
          <div className="marquee-track">
            {[0, 1].map((i) => (
              <div key={i} aria-hidden={i === 1}>
                {copy.marquee[0]} <Star />
                <em>{copy.marquee[1]}</em>
                <Star />
                {copy.marquee[2]} <Star />
                <em>{copy.marquee[3]}</em>
                <Star />
              </div>
            ))}
          </div>
        </div>
        <section id="projeler" className="work-section section-space">
          <div className="container">
            <div className="section-top" data-reveal>
              <span className="eyebrow">
                <span /> {copy.worksEyebrow}
              </span>
              <span className="small-note">{copy.platformCaps}</span>
            </div>
            <div className="section-heading" data-reveal>
              <h2 key={language}>
                {copy.worksTitle[0]}
                <br />
                <em>{copy.worksTitle[1]}</em>
              </h2>
              <div>
                <p>
                  {copy.worksLead[0]}
                  <br />
                  {copy.worksLead[1]}
                </p>
                <a className="text-link all-projects-link" href={projectsPath}>
                  {copy.allProjects} <Arrow />
                </a>
              </div>
            </div>
          </div>
          <div
            className={`scenes ${featuredProjects.length === 0 ? "scenes-pending" : ""}`}
            aria-label={copy.sceneLabel}
            aria-busy={loading}
          >
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
            {!loading && !error && projects.length === 0 && (
              <p className="catalog-message">{copy.empty}</p>
            )}
            <div className="scenes-track">
              {featuredProjects.map((p, index) => (
                <article
                  key={`${p.name}-${index}`}
                  className={`scene ${["forma", "aeon", "marea"][index % 3]}`}
                >
                  <div className="scene-light" aria-hidden="true" />
                  <div className="scene-inner container">
                    <div className="scene-meta">
                      <span className="scene-number" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="scene-category">
                        {copy.selectedProject}
                      </span>
                      <h3 className="scene-title">{p.name}</h3>
                      {p.url && (
                        <a
                          className="project-url scene-description"
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {p.url.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
                        </a>
                      )}
                      <button
                        className="button scene-cta"
                        onClick={() => setSelected(p)}
                      >
                        {copy.inspectProject} <Arrow />
                      </button>
                    </div>
                    <div className="scene-media">
                      <div className="scene-browser">
                        <div className="browser-bar" aria-hidden="true">
                          <i /><i /><i />
                        </div>
                        <button
                          className="project-visual real-project-stage"
                          aria-label={`${p.name} — ${copy.openDetails}`}
                          onClick={() => setSelected(p)}
                          onPointerMove={tilt}
                          onPointerLeave={(e) => {
                            e.currentTarget.style.setProperty("--rx", "0deg");
                            e.currentTarget.style.setProperty("--ry", "0deg");
                          }}
                        >
                          <img
                            src={p.images[0]}
                            srcSet={projectImageSet(p.images[0])}
                            sizes="(max-width: 900px) 90vw, 55vw"
                            decoding="async"
                            alt={`${p.name} — ${copy.projectImage}`}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="project-image-overlay" />
                          <span className="project-open">
                            {copy.discoverProject}
                            <Arrow />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="scenes-hud container" aria-hidden="true">
              <span className="scenes-count">
                <b>01</b> / {String(featuredProjects.length).padStart(2, "0")}
              </span>
              <span className="scenes-bar">
                <i />
              </span>
            </div>
          </div>
        </section>
        <div className="all-projects-banner container" data-reveal>
          <div>
            <span className="eyebrow">{copy.moreWork}</span>
            <p>{copy.moreWorkLead}</p>
          </div>
          <a href={projectsPath} className="button">
            {copy.allProjects} <Arrow />
          </a>
        </div>
        <section id="hakkimda" className="about-section section-space">
          <div className="container about-layout">
            <div className="about-visual" data-reveal>
              <div className="about-image">
                <img
                  src={portrait}
                  referrerPolicy="no-referrer"
                  alt={copy.portrait}
                  loading="lazy"
                />
              </div>
              <div className="about-inset">
                <img
                  src={portrait}
                  referrerPolicy="no-referrer"
                  alt=""
                  loading="lazy"
                />
              </div>
              <span className="image-label">{copy.personBehindCode}</span>
              <div className="rotating-stamp" aria-hidden="true">
                <svg viewBox="0 0 160 160">
                  <defs>
                    <path
                      id="circle"
                      d="M80,80 m-58,0 a58,58 0 1,1 116,0 a58,58 0 1,1 -116,0"
                    />
                  </defs>
                  <text>
                    <textPath href="#circle">{copy.stamp}</textPath>
                  </text>
                </svg>
                <Star />
              </div>
            </div>
            <div className="about-copy">
              <span className="eyebrow" data-reveal>
                <span /> {copy.aboutEyebrow}
              </span>
              <h2 key={language} data-reveal>
                {copy.hello}
                <br />
                {copy.im} <em>{profile.name}.</em>
                <span className="gold-dot">✳</span>
              </h2>
              <svg
                className="about-swash"
                viewBox="0 0 320 100"
                aria-hidden="true"
              >
                <path d="M8 84C90 80 218 8 245 15S171 96 155 81 243 47 312 35" />
              </svg>
              <p className="about-lead" data-reveal>
                {copy.aboutLead[0]}
                <br />
                {copy.aboutLead[1]}
              </p>
              <p data-reveal>{copy.aboutText}</p>
              <dl className="about-stats" data-reveal>
                {[
                  [copy.stats[0], projects.length],
                  [copy.stats[1], 3],
                  [copy.stats[2], 4],
                ].map(([label, count]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>
                      <span data-count={count}>{count}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="about-values" data-reveal>
                {copy.values.map((t, i) => (
                  <div key={t}>
                    <span>0{i + 1}</span>
                    {t}
                  </div>
                ))}
              </div>
              <a href="#iletisim" className="text-link" data-reveal>
                {copy.meet} <Arrow />
              </a>
            </div>
          </div>
        </section>
        <section id="uzmanlik" className="expertise-section section-space">
          <div className="container">
            <div className="section-top" data-reveal>
              <span className="eyebrow">
                <span /> {copy.expertiseEyebrow}
              </span>
              <Star className="section-star" />
            </div>
            <div className="expertise-layout">
              <div className="expertise-intro" data-reveal>
                <h2 key={language}>
                  {copy.expertiseTitle[0]}
                  <br />
                  <em>{copy.expertiseTitle[1]}</em>
                </h2>
                <p>
                  {copy.expertiseLead[0]}
                  <br />
                  {copy.expertiseLead[1]}
                </p>
                <span className="capability-note">{copy.capability}</span>
              </div>
              <div className="services">
                {services.map((s, i) => (
                  <div
                    className={`service ${service === i ? "expanded" : ""}`}
                    key={s.title}
                    data-reveal
                  >
                    <h3>
                      <button
                        aria-expanded={service === i}
                        aria-controls={`service-${i}`}
                        onClick={() => setService(service === i ? null : i)}
                      >
                        <span className="service-number">0{i + 1}</span>
                        <span>{s.title}</span>
                        <span className="plus">+</span>
                      </button>
                    </h3>
                    <div
                      className="service-body"
                      id={`service-${i}`}
                      inert={service !== i}
                    >
                      <div>
                        <p>{s.text}</p>
                        <div className="service-tags">
                          {s.tags.map((t) => (
                            <span key={t}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="process-section section-space">
          <div className="container process-layout">
            <div className="process-aside">
              <span className="eyebrow" data-reveal>
                <span /> {copy.processEyebrow}
              </span>
              <div className="section-heading" data-reveal>
                <h2 key={language}>
                  {copy.processTitle[0]}
                  <br />
                  <em>{copy.processTitle[1]}</em>
                </h2>
                <p>
                  {copy.processLead[0]}
                  <br />
                  {copy.processLead[1]}
                </p>
              </div>
              <div className="process-counter" aria-hidden="true">
                <span>01</span>
              </div>
            </div>
            <div className="process-grid">
              {copy.steps.map(([title, text], i) => (
                <div
                  className="process-step"
                  key={title}
                  data-reveal
                  style={{ "--delay": `${i * 100}ms` } as CSSProperties}
                >
                  <span className="step-top">
                    <span>0{i + 1}</span>
                    <Arrow diagonal={false} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="iletisim" className="contact-section section-space">
          <div className="container">
            <div className="contact-top" data-reveal>
              <span className="eyebrow">
                <span className="live-dot" /> {copy.contactAvailable}
              </span>
              <span className="small-note">{copy.contactNote}</span>
            </div>
            <h2 key={language} className="contact-title" data-reveal>
              {copy.contactTitle[0]}
              <br />
              <em>{copy.contactTitle[1]}</em>
              <Star />
            </h2>
            <div className="contact-grid">
              <div className="contact-info" data-reveal>
                <p>
                  {copy.contactLead[0]}
                  <br />
                  {copy.contactLead[1]}
                </p>
                <span className="contact-location">{copy.remote}</span>
              </div>
              <div className="contact-links" data-reveal>
                <a className="contact-link" href={`mailto:${profile.email}`}>
                  <span className="contact-link-icon" aria-hidden="true">
                    @
                  </span>
                  <span className="contact-link-copy">
                    <span>{copy.email}</span>
                    <strong>{profile.email}</strong>
                  </span>
                  <Arrow />
                </a>
                <a
                  className="contact-link"
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="contact-link-icon" aria-hidden="true">
                    GH
                  </span>
                  <span className="contact-link-copy">
                    <span>GITHUB</span>
                    <strong>github.com/ozguryurt</strong>
                  </span>
                  <Arrow />
                </a>
                <a
                  className="contact-link"
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span
                    className="contact-link-icon contact-link-icon--linkedin"
                    aria-hidden="true"
                  >
                    in
                  </span>
                  <span className="contact-link-copy">
                    <span>LINKEDIN</span>
                    <strong>linkedin.com/in/ozguryurt</strong>
                  </span>
                  <Arrow />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer" inert={menuOpen}>
        <div className="container">
          <div className="footer-main">
            <a
              href="#anasayfa"
              className="footer-wordmark"
              aria-label={copy.homeLabel}
            >
              <svg
                className="footer-drawing"
                viewBox="0 0 950 160"
                aria-hidden="true"
              >
                <text x="0" y="130" xmlSpace="preserve">
                  {Array.from("özgür yurt").map((char, i) => (
                    <tspan key={i}>{char}</tspan>
                  ))}
                </text>
              </svg>
            </a>
            <a
              href="#anasayfa"
              className="back-top"
              aria-label={copy.backTopLabel}
            >
              <Arrow />
              <span>{copy.backTop}</span>
            </a>
          </div>
          <div className="footer-bottom">
            <span>
              © {currentYear} ÖZGÜR YURT · {copy.developer}
            </span>
          </div>
        </div>
      </footer>
      {selected && (
        <ProjectDialog project={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
export default App;
