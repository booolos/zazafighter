#!/usr/bin/env python3
"""Pack one-row chroma portrait sheets into fixed Zaza feet-check frames."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw


def parse_sequence(value: str) -> list[int]:
    frames = [int(part.strip()) for part in value.replace(";", ",").split(",") if part.strip()]
    if not frames:
        raise argparse.ArgumentTypeError("sequence must contain at least one frame index")
    return frames


def parse_cuts(value: str) -> list[int]:
    cuts = [int(part.strip()) for part in value.replace(";", ",").split(",") if part.strip()]
    if len(cuts) < 2:
        raise argparse.ArgumentTypeError("cuts must contain at least two x positions")
    if any(b <= a for a, b in zip(cuts, cuts[1:])):
        raise argparse.ArgumentTypeError("cuts must be strictly increasing")
    return cuts


def is_green(pixel: tuple[int, int, int], min_green: int, delta: int) -> bool:
    r, g, b = pixel
    return g >= min_green and g - r >= delta and g - b >= delta


def keyed_cell(cell: Image.Image, min_green: int, delta: int) -> tuple[Image.Image, tuple[int, int, int, int] | None]:
    rgb = cell.convert("RGB")
    rgba = rgb.convert("RGBA")
    px = rgb.load()
    out = rgba.load()
    xs: list[int] = []
    ys: list[int] = []
    for y in range(rgb.height):
        for x in range(rgb.width):
            if is_green(px[x, y], min_green, delta):
                out[x, y] = (0, 0, 0, 0)
            else:
                xs.append(x)
                ys.append(y)
    if not xs:
        return rgba, None
    return rgba, (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def checkerboard(size: tuple[int, int], cell: int = 32) -> Image.Image:
    image = Image.new("RGB", size, (27, 28, 34))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            color = (45, 47, 56) if ((x // cell) + (y // cell)) % 2 else (21, 22, 28)
            draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=color)
    return image


def save_preview(strip: Image.Image, frame_width: int, frame_height: int, out: Path) -> None:
    preview = checkerboard(strip.size)
    preview.paste(strip, (0, 0), strip)
    draw = ImageDraw.Draw(preview)
    frames = strip.width // frame_width
    for index in range(frames + 1):
        x = index * frame_width
        draw.line((x, 0, x, frame_height), fill=(0, 183, 255), width=2)
    for index in range(frames):
        draw.text((index * frame_width + 10, 10), str(index), fill=(255, 255, 255))
    preview.save(out)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--source-frames", type=int, default=8)
    parser.add_argument("--cuts", type=parse_cuts, help="Explicit x cuts for tight source rows, e.g. 14,293,...,2160")
    parser.add_argument("--sequence", type=parse_sequence, default=parse_sequence("0,1,2,3,4,5,5,6,7,7,1,0"))
    parser.add_argument("--frame-width", type=int, default=640)
    parser.add_argument("--frame-height", type=int, default=720)
    parser.add_argument("--target-subject-height", type=int, default=700)
    parser.add_argument("--min-green", type=int, default=130)
    parser.add_argument("--green-delta", type=int, default=42)
    parser.add_argument("--y-bias", type=int, default=0, help="Positive moves subject down after centering.")
    parser.add_argument("--preview", type=Path)
    parser.add_argument("--qa-json", type=Path)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGB")
    cuts = args.cuts
    if cuts is not None:
        if cuts[0] < 0 or cuts[-1] > source.width:
            raise SystemExit(f"cuts must stay inside source width 0..{source.width}")
        args.source_frames = len(cuts) - 1
    cell_width = source.width / args.source_frames
    keyed_frames: list[dict[str, object]] = []
    warnings: list[str] = []

    for source_index in range(args.source_frames):
        if cuts is None:
            x0 = int(round(source_index * cell_width))
            x1 = int(round((source_index + 1) * cell_width))
        else:
            x0 = cuts[source_index]
            x1 = cuts[source_index + 1]
        cell = source.crop((x0, 0, x1, source.height))
        keyed, bbox = keyed_cell(cell, args.min_green, args.green_delta)
        if bbox is None:
            warnings.append(f"source frame {source_index}: no non-green subject detected")
            crop = Image.new("RGBA", (1, 1), (0, 0, 0, 0))
            bbox = (0, 0, 1, 1)
        else:
            if bbox[0] <= 1 or bbox[2] >= cell.width - 1:
                warnings.append(f"source frame {source_index}: subject touches horizontal cell edge")
            crop = keyed.crop(bbox)
        keyed_frames.append({"cell": [x0, 0, x1, source.height], "bbox": bbox, "crop": crop})

    if any(index < 0 or index >= len(keyed_frames) for index in args.sequence):
        raise SystemExit(f"sequence indexes must be between 0 and {len(keyed_frames) - 1}")

    max_h = max(keyed_frames[index]["crop"].height for index in args.sequence)  # type: ignore[index, union-attr]
    scale = args.target_subject_height / max_h
    strip = Image.new("RGBA", (args.frame_width * len(args.sequence), args.frame_height), (0, 0, 0, 0))
    frame_qa = []

    for runtime_index, source_index in enumerate(args.sequence):
        crop: Image.Image = keyed_frames[source_index]["crop"]  # type: ignore[assignment]
        scaled = crop.resize(
            (max(1, round(crop.width * scale)), max(1, round(crop.height * scale))),
            Image.Resampling.LANCZOS,
        )
        dx = runtime_index * args.frame_width + (args.frame_width - scaled.width) // 2
        dy = (args.frame_height - scaled.height) // 2 + args.y_bias
        if dy < 0 or dy + scaled.height > args.frame_height:
            warnings.append(f"runtime frame {runtime_index}: scaled subject clips vertically")
        strip.alpha_composite(scaled, (dx, dy))
        frame_qa.append({
            "runtimeFrame": runtime_index,
            "sourceFrame": source_index,
            "sourceCell": keyed_frames[source_index]["cell"],
            "sourceBbox": list(keyed_frames[source_index]["bbox"]),  # type: ignore[arg-type]
            "packedBox": [dx - runtime_index * args.frame_width, dy, dx - runtime_index * args.frame_width + scaled.width, dy + scaled.height],
            "scaledSize": [scaled.width, scaled.height],
        })

    args.output.parent.mkdir(parents=True, exist_ok=True)
    strip.save(args.output)

    if args.preview:
        args.preview.parent.mkdir(parents=True, exist_ok=True)
        save_preview(strip, args.frame_width, args.frame_height, args.preview)

    if args.qa_json:
        args.qa_json.parent.mkdir(parents=True, exist_ok=True)
        args.qa_json.write_text(json.dumps({
            "input": str(args.input),
            "output": str(args.output),
            "sourceSize": [source.width, source.height],
            "sourceFrames": args.source_frames,
            "cuts": cuts,
            "sequence": args.sequence,
            "frameWidth": args.frame_width,
            "frameHeight": args.frame_height,
            "targetSubjectHeight": args.target_subject_height,
            "scale": scale,
            "warnings": warnings,
            "frames": frame_qa,
        }, indent=2) + "\n")

    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"- {warning}")
    print(f"wrote {args.output} ({strip.width}x{strip.height})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
