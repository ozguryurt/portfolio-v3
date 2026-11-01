"""
public/images altındaki PNG/JPG/JPEG dosyalarını WebP’ye ve 640px önizlemelere dönüştüren script:

python scripts/convert_images_to_webp.py

Özgün görseller korunur, mevcut çıktılar varsayılan olarak atlanır. Yeniden oluşturmak için --overwrite kullanabilirsiniz.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_IMAGE_DIR = PROJECT_ROOT / "public" / "images"
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def convert_image(
    ffmpeg: str,
    source: Path,
    quality: int,
    thumbnail_quality: int,
    max_size: int,
    thumbnail_size: int,
) -> None:
    full_output = source.with_suffix(".webp")
    thumbnail_output = source.with_name(f"{source.stem}.thumb.webp")
    filter_graph = (
        "[0:v]split=2[full][small];"
        f"[full]scale=w='min(iw,{max_size})':h='min(ih,{max_size})':"
        "force_original_aspect_ratio=decrease[fullout];"
        f"[small]scale=w='min(iw,{thumbnail_size})':h='min(ih,{thumbnail_size})':"
        "force_original_aspect_ratio=decrease[thumbout]"
    )

    subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source),
            "-filter_complex",
            filter_graph,
            "-map",
            "[fullout]",
            "-frames:v",
            "1",
            "-c:v",
            "libwebp",
            "-quality",
            str(quality),
            str(full_output),
            "-map",
            "[thumbout]",
            "-frames:v",
            "1",
            "-c:v",
            "libwebp",
            "-quality",
            str(thumbnail_quality),
            str(thumbnail_output),
        ],
        check=True,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--directory",
        type=Path,
        default=DEFAULT_IMAGE_DIR,
        help="Image directory to scan recursively (default: public/images)",
    )
    parser.add_argument("--quality", type=int, default=82, help="Full-size WebP quality (0-100)")
    parser.add_argument(
        "--thumbnail-quality",
        type=int,
        default=78,
        help="Thumbnail WebP quality (0-100)",
    )
    parser.add_argument("--max-size", type=int, default=1600, help="Maximum full-size edge in pixels")
    parser.add_argument(
        "--thumbnail-size",
        type=int,
        default=640,
        help="Maximum thumbnail edge in pixels",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Regenerate variants even if either output already exists",
    )
    args = parser.parse_args()

    if not 0 <= args.quality <= 100 or not 0 <= args.thumbnail_quality <= 100:
        parser.error("quality values must be between 0 and 100")
    if args.max_size < 1 or args.thumbnail_size < 1:
        parser.error("image dimensions must be greater than zero")

    image_dir = args.directory.resolve()
    if not image_dir.is_dir():
        parser.error(f"image directory does not exist: {image_dir}")

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        print("Error: FFmpeg was not found on PATH. Install FFmpeg with libwebp support.", file=sys.stderr)
        return 1

    sources = sorted(
        path
        for path in image_dir.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )
    converted = 0
    skipped = 0

    for source in sources:
        outputs = (
            source.with_suffix(".webp"),
            source.with_name(f"{source.stem}.thumb.webp"),
        )
        if not args.overwrite and any(path.exists() for path in outputs):
            skipped += 1
            continue

        try:
            convert_image(
                ffmpeg,
                source,
                args.quality,
                args.thumbnail_quality,
                args.max_size,
                args.thumbnail_size,
            )
        except subprocess.CalledProcessError as error:
            print(f"Failed to convert {source}: FFmpeg exited with {error.returncode}", file=sys.stderr)
            return error.returncode or 1

        converted += 1
        print(f"Converted: {source.relative_to(image_dir)}")

    print(f"Done. Converted {converted} image(s); skipped {skipped} existing variant(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
