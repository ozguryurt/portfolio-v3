import { useLayoutEffect, useRef, useState } from "react";
import type { Project } from "./projects";
import { useSite } from "./site";
import { projectImage, projectImageSet } from "./projectImages";

export function ProjectDialog({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const { copy, homePath } = useSite();
  const dialog = useRef<HTMLDialogElement>(null);
  const [activeImage, setActiveImage] = useState(0);
  const images = project.images.filter(
    (image, index, list) => list.indexOf(image) === index,
  );
  const image = images[activeImage] ?? images[0];
  const demoUrl = project.url;
  useLayoutEffect(() => {
    const element = dialog.current!;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="project-dialog"
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (images.length < 2) return;
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          setActiveImage(
            (index) =>
              (index + (event.key === "ArrowRight" ? 1 : images.length - 1)) %
              images.length,
          );
        }
      }}
    >
      <div className="dialog-content">
        <button
          className="dialog-close"
          onClick={onClose}
          aria-label={copy.closeDetails}
        >
          ✕
        </button>
        <div className="dialog-preview software-stage">
          <img
            src={image}
            srcSet={projectImageSet(image)}
            sizes="(max-width: 1000px) 95vw, 920px"
            decoding="async"
            alt={`${project.name} — ${copy.imageLabel} ${activeImage + 1}`}
            referrerPolicy="no-referrer"
            className="real-project-image"
          />
        </div>
        {images.length > 1 && (
          <div className="project-gallery" aria-label={copy.gallery}>
            {images.map((item, index) => (
              <button
                key={item}
                onClick={() => setActiveImage(index)}
                aria-label={`${copy.showImage} ${index + 1}`}
                aria-pressed={activeImage === index}
              >
                <img
                  src={projectImage(item, 160)}
                  decoding="async"
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
            <span aria-live="polite">
              {activeImage + 1} / {images.length}
            </span>
          </div>
        )}
        <div className="dialog-copy">
          <h2 id="dialog-title">{project.name}</h2>
          {demoUrl && (
            <a
              className="project-url"
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {demoUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
            </a>
          )}
          <div className="dialog-project-actions">
            <a
              className="text-link"
              href={`${homePath}#iletisim`}
              onClick={onClose}
            >
              {copy.discussProject} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </dialog>
  );
}
