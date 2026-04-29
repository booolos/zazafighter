#!/usr/bin/env python3
"""Import an image-generated horizontal sprite strip into the game frame format.

The imagegen workflow produces large chroma-key sheets because that keeps
character identity more stable than frame-by-frame generation. This script
chops those sheets into equal cells, removes the chroma key, and normalizes
each frame into the fixed Phaser spritesheet format used by the registry.
"""

from __future__ import annotations

import argparse
import math
import shutil
from pathlib import Path

from PIL import Image


def parse_color(value: str) -> tuple[int, int, int]:
    raw = value.strip().lstrip("#")
    if len(raw) != 6:
        raise argparse.ArgumentTypeError("color must be #rrggbb")
    return tuple(int(raw[i : i + 2], 16) for i in (0, 2, 4))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Chop and normalize an imagegen sprite strip into runtime frames."
    )
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--frames", required=True, type=int)
    parser.add_argument("--frame-width", type=int, default=256)
    parser.add_argument("--frame-height", type=int, default=256)
    parser.add_argument("--split-mode", choices=["equal", "components"], default="equal")
    parser.add_argument("--key", type=parse_color, default="#00ff00")
    parser.add_argument("--key-threshold", type=float, default=82)
    parser.add_argument("--target-height", type=int, default=226)
    parser.add_argument("--target-width", type=int, default=230)
    parser.add_argument("--baseline", type=int, default=239)
    parser.add_argument("--x-offset", type=int, default=0)
    parser.add_argument("--y-offset", type=int, default=0)
    parser.add_argument("--review-copy", type=Path)
    parser.add_argument("--source-copy", type=Path)
    args = parser.parse_args()

    if args.frames <= 0:
        raise SystemExit("--frames must be > 0")

    source = Image.open(args.input).convert("RGBA")
    source_width, source_height = source.size
    output = Image.new("RGBA", (args.frames * args.frame_width, args.frame_height), (0, 0, 0, 0))
    coverage = []
    keyed_source = source.copy()
    remove_chroma_key(keyed_source, args.key, args.key_threshold)
    regions = component_regions(keyed_source, args.frames) if args.split_mode == "components" else None

    for frame_index in range(args.frames):
        if regions:
            x0, x1 = regions[frame_index]
            cell = keyed_source.crop((x0, 0, x1, source_height)).convert("RGBA")
        else:
            x0 = round(frame_index * source_width / args.frames)
            x1 = round((frame_index + 1) * source_width / args.frames)
            cell = source.crop((x0, 0, x1, source_height)).convert("RGBA")
            remove_chroma_key(cell, args.key, args.key_threshold)

        bbox = cell.getchannel("A").getbbox()
        if not bbox:
            coverage.append(0)
            continue

        subject = cell.crop(bbox)
        subject = trim_low_alpha(subject)
        bbox = subject.getchannel("A").getbbox()
        if not bbox:
            coverage.append(0)
            continue
        subject = subject.crop(bbox)

        subject_width, subject_height = subject.size
        scale = min(args.target_height / subject_height, args.target_width / subject_width)
        normalized_width = max(1, round(subject_width * scale))
        normalized_height = max(1, round(subject_height * scale))
        subject = subject.resize((normalized_width, normalized_height), Image.Resampling.LANCZOS)
        subject = trim_low_alpha(subject, threshold=12)

        px = frame_index * args.frame_width + (args.frame_width - subject.width) // 2 + args.x_offset
        py = args.baseline - subject.height + args.y_offset
        output.alpha_composite(subject, (px, py))
        coverage.append(count_alpha(subject))

    args.out.parent.mkdir(parents=True, exist_ok=True)
    output.save(args.out)

    if args.review_copy:
        args.review_copy.parent.mkdir(parents=True, exist_ok=True)
        output.save(args.review_copy)

    if args.source_copy:
        args.source_copy.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(args.input, args.source_copy)

    print(f"imported {args.out} {output.size[0]}x{output.size[1]}")
    print("alpha-pixels", ",".join(str(value) for value in coverage))


def remove_chroma_key(image: Image.Image, key: tuple[int, int, int], threshold: float) -> None:
    pixels = image.load()
    width, height = image.size
    kr, kg, kb = key

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue

            distance = math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2)
            green_dominant = g > 120 and g > r * 1.65 and g > b * 1.65
            close_to_key = distance < threshold and g > 150 and r < 115 and b < 115

            if close_to_key or green_dominant:
                pixels[x, y] = (0, 0, 0, 0)
            elif g > max(r, b) * 1.28 and g > 90:
                # Despill green antialiasing without killing dark costume greens.
                pixels[x, y] = (r, max(r, b, int(g * 0.62)), b, a)


def component_regions(image: Image.Image, frames: int) -> list[tuple[int, int]] | None:
    alpha = image.getchannel("A")
    width, height = image.size
    column_counts = []
    for x in range(width):
        count = 0
        for y in range(height):
            if alpha.getpixel((x, y)) > 8:
                count += 1
        column_counts.append(count)

    runs: list[list[int]] = []
    current: list[int] | None = None
    min_column_pixels = max(8, height // 80)
    for x, count in enumerate(column_counts):
        if count > min_column_pixels:
            if current is None:
                current = [x, x]
            else:
                current[1] = x
        elif current is not None:
            runs.append(current)
            current = None
    if current is not None:
        runs.append(current)

    merged: list[list[int]] = []
    for run in runs:
        if not merged:
            merged.append(run)
            continue
        gap = run[0] - merged[-1][1]
        if gap <= 18:
            merged[-1][1] = run[1]
        else:
            merged.append(run)

    runs = [run for run in merged if run[1] - run[0] >= 12]
    if len(runs) < frames:
        return None

    while len(runs) > frames:
        gaps = [(runs[i + 1][0] - runs[i][1], i) for i in range(len(runs) - 1)]
        _, index = min(gaps)
        runs[index][1] = runs[index + 1][1]
        del runs[index + 1]

    padding = 24
    return [(max(0, x0 - padding), min(width, x1 + padding + 1)) for x0, x1 in runs]


def trim_low_alpha(image: Image.Image, threshold: int = 8) -> Image.Image:
    pixels = image.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a < threshold:
                pixels[x, y] = (0, 0, 0, 0)
    return image


def count_alpha(image: Image.Image) -> int:
    alpha = image.getchannel("A")
    return sum(1 for value in alpha.getdata() if value > 8)


if __name__ == "__main__":
    main()
