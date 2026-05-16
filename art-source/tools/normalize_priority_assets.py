from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
FRAME = 256


@dataclass
class StripSpec:
    source: Path
    output: Path
    frames: int
    target_height: int
    baseline: int
    bg: str
    source_note: str
    action: str
    character: str


def alpha_bounds(image: Image.Image, threshold: int = 8):
    alpha = image.getchannel("A")
    return alpha.point(lambda p: 255 if p > threshold else 0).getbbox()


def remove_green(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
      for x in range(rgba.width):
        r, g, b, a = pixels[x, y]
        if g > 150 and g > r * 1.45 and g > b * 1.45:
            pixels[x, y] = (r, g, b, 0)
    return rgba


def remove_checker(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
      for x in range(rgba.width):
        r, g, b, a = pixels[x, y]
        bright_neutral = abs(r - g) < 7 and abs(g - b) < 7 and r > 224
        if bright_neutral:
            pixels[x, y] = (r, g, b, 0)
    return rgba


def normalize_crop(crop: Image.Image, target_height: int, baseline: int) -> Image.Image:
    bounds = alpha_bounds(crop)
    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    if not bounds:
        return frame

    sprite = crop.crop(bounds)
    scale = min(target_height / sprite.height, (FRAME - 8) / sprite.width)
    new_size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
    sprite = sprite.resize(new_size, Image.Resampling.LANCZOS)

    x = round((FRAME - sprite.width) / 2)
    y = round(baseline - sprite.height)
    x = max(1, min(FRAME - sprite.width - 1, x))
    y = max(1, min(FRAME - sprite.height, y))
    frame.alpha_composite(sprite, (x, y))
    return frame


def split_columns(image: Image.Image, frames: int):
    step = image.width / frames
    for index in range(frames):
        left = round(index * step)
        right = round((index + 1) * step)
        yield image.crop((left, 0, right, image.height))


def build_strip(spec: StripSpec):
    source = Image.open(spec.source)
    source = remove_green(source) if spec.bg == "green" else remove_checker(source)
    frames = [normalize_crop(crop, spec.target_height, spec.baseline) for crop in split_columns(source, spec.frames)]
    strip = Image.new("RGBA", (FRAME * spec.frames, FRAME), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * FRAME, 0))
    spec.output.parent.mkdir(parents=True, exist_ok=True)
    strip.save(spec.output)
    return {
        "character": spec.character,
        "action": spec.action,
        "path": str(spec.output.relative_to(ROOT / "public")),
        "frameWidth": FRAME,
        "frameHeight": FRAME,
        "frameCount": spec.frames,
        "source": str(spec.source.relative_to(ROOT)),
        "sourceNote": spec.source_note
    }


def make_reverse_walk(source: Path, output: Path):
    strip = Image.open(source).convert("RGBA")
    frames = [strip.crop((i * FRAME, 0, (i + 1) * FRAME, FRAME)) for i in range(strip.width // FRAME)]
    frames = list(reversed(frames))
    out = Image.new("RGBA", (len(frames) * FRAME, FRAME), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        out.alpha_composite(frame, (index * FRAME, 0))
    output.parent.mkdir(parents=True, exist_ok=True)
    out.save(output)


def main():
    specs = [
        StripSpec(
            ROOT / "art-source/_imagegen_review/big-ink/lighting-joint-source.png",
            ROOT / "public/assets/generated/animations/big-ink/smoking-idle-v2.png",
            6,
            232,
            244,
            "checker",
            "Casey lighting/smoking source sheet, renormalized to preserve heavy silhouette and avoid idle warp.",
            "smoking-idle",
            "big-ink"
        ),
        StripSpec(
            ROOT / "art-source/_imagegen_review/soi-dog/walk-source.png",
            ROOT / "public/assets/generated/animations/soi-dog/walk-run-v2.png",
            6,
            154,
            224,
            "green",
            "Dang walk source sheet, scaled up about 30 percent with stable paw ground line.",
            "walk",
            "soi-dog"
        ),
        StripSpec(
            ROOT / "art-source/_imagegen_review/soi-dog/special-attack-source.png",
            ROOT / "public/assets/generated/animations/soi-dog/rush-attack-v2.png",
            6,
            156,
            224,
            "green",
            "Dang rush/special attack source sheet, scaled up and normalized for companion attack.",
            "special-attack",
            "soi-dog"
        )
    ]

    manifest_entries = [build_strip(spec) for spec in specs]
    make_reverse_walk(
        ROOT / "public/assets/generated/animations/soi-dog/walk-run-v2.png",
        ROOT / "public/assets/generated/animations/soi-dog/return-to-owner-v2.png"
    )
    manifest_entries.append({
        "character": "soi-dog",
        "action": "return-to-owner",
        "path": "assets/generated/animations/soi-dog/return-to-owner-v2.png",
        "frameWidth": FRAME,
        "frameHeight": FRAME,
        "frameCount": 6,
        "source": "public/assets/generated/animations/soi-dog/walk-run-v2.png",
        "sourceNote": "Reverse timing variant of Dang walk-run-v2 for return movement."
    })

    for variant in ("maroon", "cream", "teal"):
        src_dir = ROOT / f"art-source/_imagegen_review/indian-fighters/indian-fighter-{variant}"
        out_dir = ROOT / f"public/assets/generated/animations/indian-fighter-{variant}-v2"
        for action in ("idle", "walk", "attack", "hurt", "knockdown", "get-up"):
            src = src_dir / f"{action}.png"
            if not src.exists():
                continue
            out = out_dir / f"{action}.png"
            out.parent.mkdir(parents=True, exist_ok=True)
            Image.open(src).convert("RGBA").save(out)
            frame_count = Image.open(out).width // FRAME
            manifest_entries.append({
                "character": f"indian-fighter-{variant}",
                "action": action,
                "path": str(out.relative_to(ROOT / "public")),
                "frameWidth": FRAME,
                "frameHeight": FRAME,
                "frameCount": frame_count,
                "source": str(src.relative_to(ROOT)),
                "sourceNote": "Published v2 copy from user-provided Indian fighter sheet style; kept as fighter NPC runtime strip."
            })

    notes_path = ROOT / "art-source/priority-asset-inventory.json"
    notes_path.write_text(json.dumps({"generated": manifest_entries}, indent=2) + "\n")


if __name__ == "__main__":
    main()
