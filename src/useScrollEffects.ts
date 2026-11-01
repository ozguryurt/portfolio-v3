import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { BEFORE_LANGUAGE_CHANGE } from "./localeRouting";
import { useSite } from "./site";

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create("reference-step", "0.22,1,0.36,1");
ScrollTrigger.config({ ignoreMobileResize: true });

// Values measured from the reference: native touch, default 0.1 Lenis lerp,
// one viewport-width of vertical travel per horizontal scene, and 1s scrub.
export function useScrollEffects(
  enabled: boolean,
  locked: boolean,
  sceneCount: number,
  catalogReady: boolean,
) {
  const { language, restoreScroll } = useSite();
  const lenisRef = useRef<Lenis | null>(null);
  const initialAnchorHandled = useRef(false);
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = enabled ? "on" : "off";
    if (!catalogReady) return;
    if (!enabled) {
      const navigateHash = () =>
        document
          .getElementById(window.location.hash.slice(1))
          ?.scrollIntoView({ behavior: "auto" });
      const frame = requestAnimationFrame(() => {
        if (restoreScroll()) return;
        const target = document.getElementById(window.location.hash.slice(1));
        if (target && !initialAnchorHandled.current) {
          target.scrollIntoView({ behavior: "auto" });
          initialAnchorHandled.current = true;
        }
      });
      window.addEventListener("hashchange", navigateHash);
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("hashchange", navigateHash);
      };
    }
    root.classList.add("has-scroll-motion");
    const lenis = new Lenis({ syncTouch: false });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    let marqueeRate = 1,
      marqueeDirection = 1;
    const marquee = document
      .querySelector(".marquee-track")
      ?.getAnimations()[0];
    lenis.on("scroll", ({ velocity, direction }) => {
      if (direction) marqueeDirection = direction;
      marqueeRate = Math.max(
        marqueeRate,
        1 + Math.min(3, Math.abs(velocity) / 10),
      );
    });
    const tick = (time: number) => {
      lenis.raf(time * 1000);
      marqueeRate += (1 - marqueeRate) * 0.05;
      if (marquee) marquee.playbackRate = marqueeRate * marqueeDirection;
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    const splits: SplitText[] = [];
    const ctx = gsap.context(() => {
      const headings = gsap.utils.toArray<HTMLElement>(
        ".section-heading h2, .expertise-intro h2",
      );
      headings.forEach((heading) => {
        splits.push(
          SplitText.create(heading, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 100,
                duration: 1.1,
                stagger: 0.08,
                ease: "expo.out",
                scrollTrigger: {
                  trigger: heading,
                  start: "top 90%",
                  once: true,
                },
              }),
          }),
        );
      });
      const generic = gsap.utils
        .toArray<HTMLElement>("[data-reveal]")
        .filter(
          (el) =>
            !el.matches(
              ".section-heading, .about-visual, .contact-title, .process-step, .service",
            ) &&
            !el.querySelector("h2") &&
            !el.matches("h2"),
        );
      ScrollTrigger.batch(generic, {
        start: "top 92%",
        once: true,
        onEnter: (elements) =>
          gsap.from(elements, {
            opacity: 0,
            y: 40,
            duration: 1,
            stagger: 0.08,
            ease: "expo.out",
            clearProps: "opacity,transform",
          }),
      });
      gsap.from(".contact-title", {
        y: 80,
        opacity: 0,
        duration: 1.4,
        ease: "expo.out",
        scrollTrigger: {
          trigger: ".contact-title",
          start: "top 88%",
          once: true,
        },
      });

      const viewport = document.querySelector<HTMLElement>(".scenes")!;
      const track = document.querySelector<HTMLElement>(".scenes-track")!;
      const scenes = gsap.utils.toArray<HTMLElement>(".scene");
      const sceneCounter = viewport.querySelector(".scenes-count b");
      const distance = () => viewport.clientWidth * (scenes.length - 1);
      let horizontal: gsap.core.Tween | undefined;
      if (scenes.length > 1) {
        horizontal = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            id: "project-scenes",
            trigger: viewport,
            pin: true,
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onToggle: (trigger) =>
              root.classList.toggle("in-scenes", trigger.isActive),
            onUpdate: (trigger) => {
              viewport.style.setProperty(
                "--scene-progress",
                `${trigger.progress}`,
              );
              if (sceneCounter) {
                const next = String(
                  Math.min(
                    scenes.length - 1,
                    Math.round(trigger.progress * (scenes.length - 1)),
                  ) + 1,
                ).padStart(2, "0");
                if (sceneCounter.textContent !== next)
                  sceneCounter.textContent = next;
              }
            },
          },
        });
      }
      scenes.forEach((scene, index) => {
        const trigger =
          index === 0 || !horizontal
            ? {
                trigger: index === 0 ? viewport : scene,
                start: "top 60%",
                once: true,
              }
            : {
                trigger: scene,
                containerAnimation: horizontal,
                start: "left 70%",
                once: true,
              };
        const entrance = gsap.timeline({
          scrollTrigger: trigger,
          defaults: { ease: "expo.out" },
        });
        entrance
          .fromTo(
            scene.querySelector(".scene-browser"),
            { clipPath: "inset(0% 100% 0% 0% round 14px)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 14px)",
              duration: 1.4,
              ease: "expo.inOut",
            },
            0,
          )
          .from(
            scene.querySelector(".scene-number"),
            { xPercent: 30, opacity: 0, duration: 1.6 },
            0.1,
          )
          .from(
            scene.querySelectorAll(
              ".scene-category, .scene-description, .project-tags, .scene-cta",
            ),
            {
              y: 30,
              opacity: 0,
              duration: 1,
              stagger: 0.07,
              clearProps: "transform,opacity",
            },
            0.35,
          );
        splits.push(
          SplitText.create(scene.querySelector(".scene-title")!, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) => {
              const tween = gsap.from(self.lines, {
                yPercent: 105,
                duration: 1.2,
                stagger: 0.08,
                ease: "expo.out",
              });
              entrance.add(tween, 0.2);
              return tween;
            },
          }),
        );
        if (index === 0 && horizontal)
          gsap.fromTo(
            scene,
            { "--beam": "-45%" },
            {
              "--beam": "45%",
              ease: "none",
              scrollTrigger: {
                trigger: viewport,
                start: "top top",
                end: () => `+=${viewport.clientWidth}`,
                scrub: true,
              },
            },
          );
        if (index > 0 && horizontal)
          gsap.fromTo(
            scene.querySelector(".scene-media"),
            { xPercent: 12 },
            {
              xPercent: -6,
              ease: "none",
              scrollTrigger: {
                trigger: scene,
                containerAnimation: horizontal,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            },
          );
      });

      const aboutTitle = document.querySelector<HTMLElement>(".about-copy h2")!;
      splits.push(
        SplitText.create(aboutTitle, {
          type: "chars,lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.chars, {
              yPercent: 115,
              duration: 1.2,
              stagger: 0.03,
              ease: "expo.out",
              scrollTrigger: {
                trigger: aboutTitle,
                start: "top 88%",
                once: true,
              },
            }),
        }),
      );
      const swash =
        document.querySelector<SVGPathElement>(".about-swash path")!;
      const length = swash.getTotalLength();
      gsap.fromTo(
        swash,
        { strokeDasharray: length, strokeDashoffset: length },
        {
          strokeDashoffset: 0,
          duration: 1.8,
          ease: "power2.inOut",
          delay: 0.5,
          scrollTrigger: { trigger: aboutTitle, start: "top 80%", once: true },
        },
      );
      const photo = document.querySelector(".about-image")!;
      gsap
        .timeline({
          scrollTrigger: { trigger: photo, start: "top 80%", once: true },
        })
        .fromTo(
          photo,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" },
        )
        .fromTo(
          photo.querySelector("img"),
          { scale: 1.2 },
          { scale: 1.02, duration: 2, ease: "expo.out" },
          0,
        )
        .fromTo(
          ".about-inset",
          { clipPath: "inset(0% 0% 100% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.inOut" },
          0.7,
        )
        .from(
          ".rotating-stamp",
          { scale: 0.6, opacity: 0, duration: 1, ease: "back.out(1.6)" },
          1.1,
        );
      gsap.to(".rotating-stamp > svg:first-child", {
        rotation: 360,
        transformOrigin: "50% 50%",
        ease: "none",
        scrollTrigger: {
          trigger: ".about-section",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.from(".service h3 button > span:nth-child(2)", {
        yPercent: 60,
        opacity: 0,
        duration: 1.2,
        stagger: 0.08,
        ease: "expo.out",
        clearProps: "transform,opacity",
        scrollTrigger: { trigger: ".services", start: "top 85%", once: true },
      });
      gsap.utils
        .toArray<HTMLElement>(".process-step")
        .forEach((step, index) => {
          ScrollTrigger.create({
            trigger: step,
            start: "top 60%",
            end: "bottom 60%",
            onToggle: (trigger) => {
              if (!trigger.isActive) return;
              document
                .querySelectorAll(".process-step")
                .forEach((el) =>
                  el.classList.toggle("is-current", el === step),
                );
              const counter = document.querySelector(".process-counter span")!;
              const next = String(index + 1).padStart(2, "0");
              if (counter.textContent === next) return;
              const outgoing = counter.cloneNode(true) as HTMLElement;
              outgoing.dataset.outgoing = "";
              counter.parentElement!.append(outgoing);
              gsap.set(outgoing, {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
              });
              gsap.to(outgoing, {
                yPercent: -100,
                opacity: 0,
                duration: 0.8,
                ease: "reference-step",
                onComplete: () => outgoing.remove(),
              });
              counter.textContent = next;
              gsap.fromTo(
                counter,
                { yPercent: 100, opacity: 0 },
                {
                  yPercent: 0,
                  opacity: 1,
                  duration: 0.8,
                  ease: "reference-step",
                  overwrite: true,
                },
              );
            },
          });
        });
      gsap.fromTo(
        ".footer-drawing tspan",
        { strokeDasharray: 1200, strokeDashoffset: 1200, fillOpacity: 0 },
        {
          strokeDashoffset: 0,
          fillOpacity: 1,
          duration: 1.6,
          stagger: 0.04,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: ".footer-wordmark",
            start: "top 92%",
            once: true,
          },
        },
      );
      gsap.to(".hero-image", {
        "--dissolve": 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to(".hero-image > img", {
        opacity: 0.3,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to(".hero-content", {
        y: -90,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "30% top",
          end: "bottom top",
          scrub: true,
        },
      });
    });
    const counters = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          counters.unobserve(entry.target);
          const counter = entry.target as HTMLElement;
          ctx.add(() => {
            const value = { count: 0 };
            gsap.to(value, {
              count: Number(counter.dataset.count),
              duration: 1.8,
              ease: "power3.out",
              onUpdate: () => {
                counter.textContent = String(Math.round(value.count));
              },
            });
          });
        }),
      { threshold: 0.6 },
    );
    document
      .querySelectorAll("[data-count]")
      .forEach((counter) => counters.observe(counter));
    const anchorClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      const href = link?.getAttribute("href");
      if (!href || href.length < 2) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      lenis.start();
      lenis.scrollTo(target, {
        offset: parseFloat(getComputedStyle(root).scrollPaddingTop || "0"),
      });
      if (!target.hasAttribute("tabindex"))
        target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };
    document.addEventListener("click", anchorClick);
    const navigateHash = () => {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target) {
        lenis.start();
        lenis.scrollTo(target, {
          offset: parseFloat(getComputedStyle(root).scrollPaddingTop || "0"),
        });
      }
    };
    window.addEventListener("hashchange", navigateHash);
    let disposed = false;
    document.fonts.ready.then(() => {
      if (disposed) return;
      ScrollTrigger.refresh();
      lenis.resize();
      if (restoreScroll()) {
        initialAnchorHandled.current = true;
        return;
      }
      const target = document.getElementById(window.location.hash.slice(1));
      if (target && !initialAnchorHandled.current) {
        lenis.scrollTo(target, {
          immediate: true,
          offset: parseFloat(getComputedStyle(root).scrollPaddingTop || "0"),
        });
        initialAnchorHandled.current = true;
      }
    });
    const images = [...document.images].filter((image) => !image.complete);
    let refreshFrame = 0;
    const refresh = () => {
      if (refreshFrame) return;
      refreshFrame = requestAnimationFrame(() => {
        refreshFrame = 0;
        if (disposed) return;
        ScrollTrigger.refresh();
        lenis.resize();
      });
    };
    images.forEach((image) => image.addEventListener("load", refresh));
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    lenis.resize();
    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(refreshFrame);
      counters.disconnect();
      document.removeEventListener("click", anchorClick);
      window.removeEventListener("hashchange", navigateHash);
      images.forEach((image) => image.removeEventListener("load", refresh));
      gsap.ticker.remove(tick);
      ctx.revert();
      document.querySelectorAll("[data-outgoing]").forEach((el) => el.remove());
      document
        .querySelectorAll<HTMLElement>("[data-count]")
        .forEach((counter) => {
          counter.textContent = counter.dataset.count ?? "";
        });
      splits.forEach((split) => split.revert());
      lenis.destroy();
      lenisRef.current = null;
      if (marquee) marquee.playbackRate = 1;
      root.classList.remove("has-scroll-motion", "in-scenes");
    };
    window.addEventListener(BEFORE_LANGUAGE_CHANGE, cleanup);
    return () => {
      window.removeEventListener(BEFORE_LANGUAGE_CHANGE, cleanup);
      cleanup();
    };
  }, [enabled, sceneCount, catalogReady, language, restoreScroll]);
  useLayoutEffect(() => {
    if (locked) lenisRef.current?.stop();
    else lenisRef.current?.start();
    document.documentElement.classList.toggle("menu-open", locked);
    const frame = requestAnimationFrame(() => {
      if (!locked && lenisRef.current) {
        ScrollTrigger.refresh();
        lenisRef.current.resize();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [locked, enabled, sceneCount, catalogReady]);
}
