// Only transform the known image CDN; other remote/local addresses stay intact.
export function projectImage(source: string, width: number) {
  try {
    const url = new URL(source);
    if (url.hostname !== "images.unsplash.com") return source;
    url.searchParams.set("w", String(width));
    url.searchParams.set("auto", "format");
    return url.href;
  } catch {
    return source;
  }
}

export function projectImageSet(source: string) {
  try {
    if (new URL(source).hostname !== "images.unsplash.com") return undefined;
  } catch {
    return undefined;
  }
  return [480, 768, 1024, 1400]
    .map((width) => `${projectImage(source, width)} ${width}w`)
    .join(", ");
}
