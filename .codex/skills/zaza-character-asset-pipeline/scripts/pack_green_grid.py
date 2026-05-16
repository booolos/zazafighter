#!/usr/bin/env python3
"""Pack selected cells from a chroma-key source grid into exact runtime frames."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageChops, ImageDraw


def parse_color(value: str) -> tuple[int, int, int]:
    value = value.strip()
    if value.startswith("#") and len(value) == 7:
        return tuple(int(value[i : i + 2], 16) for i in (1, 3, 5))  # type: ignore[return-value]
    parts = [int(part.strip()) for part in value.split(",")]
    if len(parts) != 3 or any(part < 0 or part > 255 for part in parts):
        raise argparse.ArgumentTypeError("color must be #rrggbb or r,g,b")
    return tuple(parts)  # type: ignore[return-value]


def parse_cell(value: str) -> tuple[int, int]:
    parts = value.split(",")
    if len(parts) != 2:
        raise argparse.ArgumentTypeError("cell must be row,col")
    return int(parts[0]), int(parts[1])


def bbox_from_key(image: Image.Image, key: tuple[int, int, int], threshold: int) -> tuple[int, int, int, int] | None:
    rgb = image.convert("RGB")
    # Distance-from-key mask. This is intentionally simple and deterministic.
    px = rgb.load()
    mask = Image.new("L", rgb.size, 0)
    mp = mask.load()
    threshold_sq = threshold * threshold
    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b = px[x, y]
            dist_sq = (r - key[0]) ** 2 + (g - key[1]) ** 2 + (b - key[2]) ** 2
            if dist_sq > threshold_sq:
                mp[x, y] = 255
    return mask.getbbox()


def keyed_rgba(image: Image.Image, key: tuple[int, int, int], threshold: int) -> Image.Image:
    rgb = image.convert("RGB")
    alpha = Image.new("L", rgb.size, 0)
    px = rgb.load()
    ap = alpha.load()
    threshold_sq = threshold * threshold
    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b = px[x, y]
            dist_sq = (r - key[0]) ** 2 + (g - key[1]) ** 2 + (b - key[2]) ** 2
            if dist_sq > threshold_sq:
                ap[x, y] = 255
    rgba = rgb.convert("RGBA")
    rgba.putalpha(alpha)
    return rgba


def checkerboard(size: tuple[int, int], cell: int = 32) -> Image.Image:
    image = Image.new("RGB", size, (34, 34, 38))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            color = (48, 48, 54) if ((x // cell) + (y // cell)) % 2 else (28, 28, 32)
            draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=color)
    return image


def make_preview(strip: Image.Image, frames: int, frame_size: int, out: Path) -> None:
    bg = checkerboard(strip.size)
    bg.paste(strip, (0, 0), strip)
    draw = ImageDraw.Draw(bg)
    for i in range(frames + 1):
        x = i * frame_size
        draw.line((x, 0, x, frame_size), fill=(0, 180, 255), width=2)
    for i in range(frames):
        draw.text((i * frame_size + 8, 8), str(i), fill=(255, 255, 255))
    bg.save(out)


def split_cells(specs: Iterable[str]) -> list[tuple[int, int]]:
    cells: list[tuple[int, int]] = []
    for spec in specs:
        for part in spec.replace(";", " ").split():
            cells.append(parse_cell(part))
    return cells


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--rows", required=True, type=int)
    parser.add_argument("--cols", required=True, type=int)
    parser.add_argument("--cells", required=True, nargs="+", help="Cells as row,col. May be space or semicolon separated.")
    parser.add_argument("--frame-size", type=int, default=512)
    parser.add_argument("--padding", type=int, default=34)
    parser.add_argument("--key", type=parse_color, default=(0, 255, 0))
    parser.add_argument("--threshold", type=int, default=52)
    parser.add_argument("--anchor", choices=("center", "bottom"), default="bottom")
    parser.add_argument("--scale-mult", type=float, default=1.0)
    parser.add_argument("--preview", type=Path)
    parser.add_argument("--qa-json", type=Path)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGB")
    cell_w = source.width / args.cols
    cell_h = source.height / args.rows
    cells = split_cells(args.cells)
    if not cells:
        raise SystemExit("No cells provided")

    crops = []
    warnings: list[str] = []
    max_w = 1
    max_h = 1
    for index, (row, col) in enumerate(cells):
        if row < 0 or row >= args.rows or col < 0 or col >= args.cols:
            raise SystemExit(f"Cell {row},{col} is outside a {args.rows}x{args.cols} grid")
        box = (
            int(round(col * cell_w)),
            int(round(row * cell_h)),
            int(round((col + 1) * cell_w)),
            int(round((row + 1) * cell_h)),
        )
        cell = source.crop(box)
        bbox = bbox_from_key(cell, args.key, args.threshold)
        if bbox is None:
            warnings.append(f"frame {index} cell {row},{col}: no non-key subject detected")
            crop = Image.new("RGBA", (1, 1), (0, 0, 0, 0))
            bbox = (0, 0, 1, 1)
        else:
            margin = 2
            if bbox[0] <= margin or bbox[1] <= margin or bbox[2] >= cell.width - margin or bbox[3] >= cell.height - margin:
                warnings.append(f"frame {index} cell {row},{col}: subject touches cell edge")
            crop = keyed_rgba(cell, args.key, args.threshold).crop(bbox)
        max_w = max(max_w, crop.width)
        max_h = max(max_h, crop.height)
        crops.append({"row": row, "col": col, "bbox": bbox, "crop": crop})

    available = args.frame_size - args.padding * 2
    common_scale = min(available / max_w, available / max_h) * args.scale_mult
    common_scale = max(0.01, common_scale)
    strip = Image.new("RGBA", (args.frame_size * len(cells), args.frame_size), (0, 0, 0, 0))
    qa_frames = []

    for index, entry in enumerate(crops):
        crop: Image.Image = entry["crop"]
        scaled_w = max(1, int(round(crop.width * common_scale)))
        scaled_h = max(1, int(round(crop.height * common_scale)))
        resized = crop.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
        dx = index * args.frame_size + (args.frame_size - scaled_w) // 2
        if args.anchor == "bottom":
            dy = args.frame_size - args.padding - scaled_h
        else:
            dy = (args.frame_size - scaled_h) // 2
        if dy < 0:
            warnings.append(f"frame {index}: scaled subject exceeds frame height")
            dy = 0
        strip.alpha_composite(resized, (dx, dy))
        qa_frames.append({
            "frame": index,
            "sourceCell": [entry["row"], entry["col"]],
            "sourceBbox": list(entry["bbox"]),
            "packedBox": [dx - index * args.frame_size, dy, dx - index * args.frame_size + scaled_w, dy + scaled_h],
            "scaledSize": [scaled_w, scaled_h],
        })

    args.output.parent.mkdir(parents=True, exist_ok=True)
    strip.save(args.output)
    if args.preview:
        args.preview.parent.mkdir(parents=True, exist_ok=True)
        make_preview(strip, len(cells), args.frame_size, args.preview)
    if args.qa_json:
        args.qa_json.parent.mkdir(parents=True, exist_ok=True)
        args.qa_json.write_text(json.dumps({
            "input": str(args.input),
            "output": str(args.output),
            "sourceSize": [source.width, source.height],
            "grid": [args.rows, args.cols],
            "frameSize": args.frame_size,
            "frames": len(cells),
            "commonScale": common_scale,
            "anchor": args.anchor,
            "warnings": warnings,
            "frameQa": qa_frames,
        }, indent=2) + "\n")

    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"- {warning}")
    print(f"wrote {args.output} ({strip.width}x{strip.height})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
