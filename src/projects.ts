import { useEffect, useState } from "react";

export type Project = {
  name: string;
  url: string;
  images: string[];
};

function isImageAddress(value: string) {
  try {
    return ["http:", "https:"].includes(
      new URL(value, "https://local.invalid/").protocol,
    );
  } catch {
    return false;
  }
}

function isProjectAddress(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function parseProjects(data: unknown): Project[] {
  if (!Array.isArray(data))
    throw new Error("Proje dosyası bir JSON listesi olmalı.");
  return data.map((entry: unknown, index) => {
    if (!entry || typeof entry !== "object")
      throw new Error(`${index + 1}. proje geçersiz.`);
    const project = entry as Record<string, unknown>;
    if (
      typeof project.name !== "string" ||
      !project.name.trim() ||
      typeof project.url !== "string" ||
      (project.url.trim() !== "" && !isProjectAddress(project.url.trim())) ||
      !Array.isArray(project.images) ||
      project.images.length === 0 ||
      !project.images.every(
        (image) =>
          typeof image === "string" &&
          image.trim() &&
          isImageAddress(image.trim()),
      )
    ) {
      throw new Error(
        `${index + 1}. projede name, url ve en az bir images adresi bulunmalı.`,
      );
    }
    return {
      name: project.name.trim(),
      url: project.url.trim(),
      images: project.images.map((image) => (image as string).trim()),
    };
  });
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}projects.json`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Proje dosyası okunamadı (${response.status}).`);
        return response.json() as Promise<unknown>;
      })
      .then(parseProjects)
      .then((data) => {
        if (!controller.signal.aborted) {
          const imageBase = new URL(
            import.meta.env.BASE_URL,
            window.location.origin,
          );
          setProjects(
            data.map((project) => ({
              ...project,
              images: project.images.map((image) => new URL(image, imageBase).href),
            })),
          );
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error ? cause.message : "Projeler yüklenemedi.",
        );
        setLoading(false);
      });
    return () => controller.abort();
  }, [request]);
  const reload = () => {
    setLoading(true);
    setError(null);
    setRequest((value) => value + 1);
  };
  return { projects, loading, error, reload };
}
