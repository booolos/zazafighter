#!/usr/bin/env python3
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from statistics import median
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent

ANIMATION_DIR = ROOT / "public/assets/generated/animations"
FEET_DIR = ROOT / "public/assets/generated/interactions/feet-check"
SOURCE_DIR = ROOT / "public/assets/generated/source-sheets"

CHARACTER_PREFIXES = (
    "soi-six-hd-",
    "soi-six-thai-",
    "soi-six-ruby",
    "soi-six-nina",
    "npc-girl-",
)

COMMON_FRAME_WIDTHS = (512, 384, 320, 256, 192, 128)
SHEET_BG = (245, 244, 240, 255)
PANEL_BG = (255, 255, 255, 255)
INK = (31, 36, 42, 255)
MUTED = (92, 99, 108, 255)
GRID = (213, 211, 204, 255)
WARN = (210, 79, 58, 255)
OK = (52, 122, 86, 255)
BASELINE = (51, 120, 190, 255)


@dataclass
class SpriteAsset:
    kind: str
    character: str
    action: str
    path: Path
    width: int
    height: int
    frame_width: int
    frames: int
    has_transparency: bool
    frame_boxes: list[tuple[int, int, int, int] | None]

    @property
    def med_visible_height(self) -> int:
        heights = [box[3] - box[1] for box in self.frame_boxes if box]
        return round(median(heights)) if heights else 0

    @property
    def med_visible_width(self) -> int:
        widths = [box[2] - box[0] for box in self.frame_boxes if box]
        return round(median(widths)) if widths else 0

    @property
    def edge_touch_count(self) -> int:
        touches = 0
        for box in self.frame_boxes:
            if not box:
                continue
            left, top, right, bottom = box
            if left <= 2 or top <= 2 or right >= self.frame_width - 2 or bottom >= self.height - 2:
                touches += 1
        return touches

    @property
    def flags(self) -> list[str]:
        flags: list[str] = []
        if not self.has_transparency:
            return flags
        if self.edge_touch_count:
            flags.append(f"edge {self.edge_touch_count}/{self.frames}")
        if self.med_visible_height and self.med_visible_height < self.height * 0.55:
            flags.append("small")
        if self.med_visible_width and self.med_visible_width > self.frame_width * 0.90:
            flags.append("wide/crop?")
        return flags


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            pass
    return ImageFont.load_default()


FONT_12 = font(12)
FONT_13 = font(13)
FONT_14 = font(14)
FONT_16 = font(16, bold=True)
FONT_22 = font(22, bold=True)


def alpha_box(image: Image.Image) -> tuple[int, int, int, int] | None:
    if image.mode != "RGBA":
        image = image.convert("RGBA")
    return image.getchannel("A").getbbox()


def guess_frame_width(width: int, height: int, path: Path) -> int:
    if "source-sheets" in path.parts:
        return height if width % height == 0 else width
    for candidate in COMMON_FRAME_WIDTHS:
        if width % candidate == 0 and width // candidate <= 24:
            return candidate
    if width % height == 0 and width // height <= 24:
        return height
    return width


def analyze(kind: str, character: str, action: str, path: Path) -> SpriteAsset:
    with Image.open(path) as source:
        image = source.convert("RGBA")
    width, height = image.size
    frame_width = guess_frame_width(width, height, path)
    frames = max(1, width // frame_width)
    has_transparency = image.getchannel("A").getextrema()[0] < 255
    boxes = []
    for index in range(frames):
        frame = image.crop((index * frame_width, 0, (index + 1) * frame_width, height))
        boxes.append(alpha_box(frame) if has_transparency else None)
    return SpriteAsset(kind, character, action, path, width, height, frame_width, frames, has_transparency, boxes)


def collect_assets() -> tuple[list[SpriteAsset], list[SpriteAsset], list[SpriteAsset]]:
    animations: list[SpriteAsset] = []
    for character_dir in sorted(ANIMATION_DIR.iterdir()):
        if not character_dir.is_dir() or not character_dir.name.startswith(CHARACTER_PREFIXES):
            continue
        for path in sorted(character_dir.glob("*.png")):
            animations.append(analyze("animation", character_dir.name, path.stem, path))

    feet: list[SpriteAsset] = []
    for path in sorted(FEET_DIR.glob("soi-six-*.png")):
        character = path.stem.replace("-heels-strip", "").replace("-face", "")
        action = "heels-strip" if "heels-strip" in path.stem else "face"
        feet.append(analyze("feet-check", character, action, path))

    sources: list[SpriteAsset] = []
    for path in sorted(SOURCE_DIR.glob("soi-six*.png")) + sorted((SOURCE_DIR / "soi-six-runners-v1-rows").glob("*.png")):
        sources.append(analyze("source-sheet", path.stem, "source", path))
    return animations, feet, sources


def text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, fill=INK, fnt=FONT_13) -> None:
    draw.text(xy, value, fill=fill, font=fnt)


def fit_label(value: str, max_chars: int) -> str:
    return value if len(value) <= max_chars else value[: max_chars - 1] + "..."


def checker(size: tuple[int, int], cell: int = 16) -> Image.Image:
    image = Image.new("RGBA", size, (232, 231, 226, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(248, 247, 243, 255))
    return image


def first_frame(asset: SpriteAsset) -> Image.Image:
    with Image.open(asset.path) as source:
        image = source.convert("RGBA")
    return image.crop((0, 0, asset.frame_width, asset.height))


def whole_strip(asset: SpriteAsset) -> Image.Image:
    with Image.open(asset.path) as source:
        return source.convert("RGBA")


def draw_asset_tile(draw: ImageDraw.ImageDraw, asset: SpriteAsset, x: int, y: int, w: int, h: int) -> None:
    flags = asset.flags
    outline = WARN if flags else GRID
    draw.rounded_rectangle((x, y, x + w, y + h), radius=6, fill=PANEL_BG, outline=outline, width=2)
    text(draw, (x + 10, y + 8), fit_label(f"{asset.character} / {asset.action}", 40), fnt=FONT_14)
    metric = f"{asset.width}x{asset.height}  frames:{asset.frames}  visible:{asset.med_visible_width}x{asset.med_visible_height}"
    text(draw, (x + 10, y + 27), metric, fill=MUTED, fnt=FONT_12)
    if flags:
        text(draw, (x + 10, y + h - 20), ", ".join(flags), fill=WARN, fnt=FONT_12)
    elif not asset.has_transparency:
        text(draw, (x + 10, y + h - 20), "opaque: visual check", fill=MUTED, fnt=FONT_12)
    else:
        text(draw, (x + 10, y + h - 20), "ok", fill=OK, fnt=FONT_12)


def paste_centered(canvas: Image.Image, sprite: Image.Image, box: tuple[int, int, int, int], scale: float = 1.0) -> None:
    x0, y0, x1, y1 = box
    if scale != 1:
        sprite = sprite.resize((max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale))), Image.Resampling.NEAREST)
    x = x0 + (x1 - x0 - sprite.width) // 2
    y = y0 + (y1 - y0 - sprite.height) // 2
    bg = checker((x1 - x0, y1 - y0), 12)
    canvas.alpha_composite(bg, (x0, y0))
    canvas.alpha_composite(sprite, (x, y))
    draw = ImageDraw.Draw(canvas)
    draw.line((x0, y1 - 18, x1, y1 - 18), fill=BASELINE, width=1)


def make_character_scale_sheet(assets: list[SpriteAsset]) -> None:
    priority = ("idle", "walk", "run", "talk", "panic", "react", "cheer")
    by_char: dict[str, dict[str, SpriteAsset]] = {}
    for asset in assets:
        by_char.setdefault(asset.character, {})[asset.action] = asset

    chars = sorted(by_char)
    cols = 2
    tile_w, tile_h = 620, 270
    pad, header = 24, 74
    rows = (len(chars) + cols - 1) // cols
    sheet = Image.new("RGBA", (pad * 2 + cols * tile_w + (cols - 1) * 18, header + rows * tile_h + (rows - 1) * 18 + pad), SHEET_BG)
    draw = ImageDraw.Draw(sheet)
    text(draw, (pad, 20), "Soi Six Sprite Scale Review", fnt=FONT_22)
    text(draw, (pad, 48), "First frame per action, native pixel scale, alpha bounds used for small/crop warnings.", fill=MUTED, fnt=FONT_13)

    for i, character in enumerate(chars):
        col, row = i % cols, i // cols
        x = pad + col * (tile_w + 18)
        y = header + row * (tile_h + 18)
        draw.rounded_rectangle((x, y, x + tile_w, y + tile_h), radius=6, fill=PANEL_BG, outline=GRID)
        text(draw, (x + 12, y + 10), character, fnt=FONT_16)
        actions = [name for name in priority if name in by_char[character]]
        cell_w = (tile_w - 28) // max(1, len(actions[:4]))
        for j, action in enumerate(actions[:4]):
            asset = by_char[character][action]
            fx = x + 14 + j * cell_w
            fy = y + 42
            frame = first_frame(asset)
            max_h, max_w = 170, cell_w - 12
            scale = min(1.0, max_w / frame.width, max_h / frame.height)
            paste_centered(sheet, frame, (fx, fy, fx + cell_w - 10, fy + max_h), scale)
            text(draw, (fx, fy + max_h + 8), action, fnt=FONT_13)
            text(draw, (fx, fy + max_h + 25), f"vis {asset.med_visible_width}x{asset.med_visible_height}", fill=MUTED, fnt=FONT_12)
            if asset.flags:
                text(draw, (fx, fy + max_h + 42), ", ".join(asset.flags), fill=WARN, fnt=FONT_12)
    sheet.convert("RGB").save(OUT / "sprite-scale-contact-sheet.png", quality=95)


def make_strip_sheet(assets: list[SpriteAsset], output: str, title: str, thumb_w: int = 420) -> None:
    tile_w, tile_h = 560, 168
    cols = 2
    pad, header = 24, 76
    rows = (len(assets) + cols - 1) // cols
    sheet = Image.new("RGBA", (pad * 2 + cols * tile_w + (cols - 1) * 18, header + rows * tile_h + (rows - 1) * 18 + pad), SHEET_BG)
    draw = ImageDraw.Draw(sheet)
    text(draw, (pad, 20), title, fnt=FONT_22)
    text(draw, (pad, 48), "Full strips scaled to fit; red borders/labels indicate alpha edge touches or unusually small visible bounds.", fill=MUTED, fnt=FONT_13)
    for i, asset in enumerate(assets):
        col, row = i % cols, i // cols
        x = pad + col * (tile_w + 18)
        y = header + row * (tile_h + 18)
        draw_asset_tile(draw, asset, x, y, tile_w, tile_h)
        strip = whole_strip(asset)
        max_w, max_h = thumb_w, 86
        scale = min(max_w / strip.width, max_h / strip.height)
        scaled = strip.resize((max(1, round(strip.width * scale)), max(1, round(strip.height * scale))), Image.Resampling.NEAREST)
        bx, by = x + 10, y + 52
        bg = checker((max_w, max_h), 10)
        sheet.alpha_composite(bg, (bx, by))
        sheet.alpha_composite(scaled, (bx + (max_w - scaled.width) // 2, by + (max_h - scaled.height) // 2))
        draw.rectangle((bx, by, bx + max_w, by + max_h), outline=GRID)
    sheet.convert("RGB").save(OUT / output, quality=95)


def make_feet_frame_sheet(assets: list[SpriteAsset]) -> None:
    strip_assets = [asset for asset in assets if asset.action == "heels-strip"]
    cols = 2
    tile_w, tile_h = 640, 340
    pad, header = 24, 76
    rows = (len(strip_assets) + cols - 1) // cols
    sheet = Image.new("RGBA", (pad * 2 + cols * tile_w + (cols - 1) * 18, header + rows * tile_h + (rows - 1) * 18 + pad), SHEET_BG)
    draw = ImageDraw.Draw(sheet)
    text(draw, (pad, 20), "Feet-Check Frame Strip Review", fnt=FONT_22)
    text(draw, (pad, 48), "Each heels-strip frame is shown separately at equal scale for quick crop/size comparison.", fill=MUTED, fnt=FONT_13)
    for i, asset in enumerate(strip_assets):
        col, row = i % cols, i // cols
        x = pad + col * (tile_w + 18)
        y = header + row * (tile_h + 18)
        draw_asset_tile(draw, asset, x, y, tile_w, tile_h)
        strip = whole_strip(asset)
        frames = [strip.crop((n * asset.frame_width, 0, (n + 1) * asset.frame_width, asset.height)) for n in range(asset.frames)]
        cell_w, cell_h = 116, 206
        for j, frame in enumerate(frames[:10]):
            fx = x + 14 + (j % 5) * (cell_w + 8)
            fy = y + 58 + (j // 5) * (cell_h + 8)
            scale = min((cell_w - 8) / frame.width, (cell_h - 26) / frame.height)
            paste_centered(sheet, frame, (fx, fy, fx + cell_w, fy + cell_h - 18), scale)
            text(draw, (fx + 4, fy + cell_h - 15), f"f{j + 1}", fill=MUTED, fnt=FONT_12)
    sheet.convert("RGB").save(OUT / "feet-check-frame-contact-sheet.png", quality=95)


def make_summary_markdown(animations: list[SpriteAsset], feet: list[SpriteAsset], sources: list[SpriteAsset]) -> None:
    all_assets = animations + feet + sources
    flagged = [asset for asset in all_assets if asset.flags]

    def rel(path: Path) -> str:
        return path.relative_to(ROOT).as_posix()

    lines = [
        "# Soi Six Scale Review - 2026-05-15",
        "",
        "Local contact-sheet report for current Soi Six girl animation sprites, source sheets, and feet-check strips.",
        "",
        "Generated artifacts:",
        "",
        "- `sprite-scale-contact-sheet.png` - first-frame, native-scale character/action overview.",
        "- `animation-strip-contact-sheet.png` - full animation strip thumbnails with metrics.",
        "- `feet-check-strip-contact-sheet.png` - full feet-check and face strip thumbnails.",
        "- `feet-check-frame-contact-sheet.png` - feet-check frames split out at equal scale.",
        "- `source-sheet-contact-sheet.png` - generated Soi Six source sheets.",
        "",
        "Heuristic flags:",
        "",
        "- `edge n/m`: alpha touches within 2 px of a frame edge on `n` of `m` frames; worth checking for cropping.",
        "- `small`: median alpha height is under 55% of frame height; worth checking for undersized art.",
        "- `wide/crop?`: median alpha width is over 90% of frame width; often signals side cropping.",
        "- Opaque PNGs are marked `opaque: visual check` on the contact sheets because alpha bounds cannot isolate the subject.",
        "",
        f"Scanned `{len(animations)}` animation strips, `{len(feet)}` feet-check/face images, and `{len(sources)}` source sheets.",
        "",
        "## Flagged Assets",
        "",
    ]
    if flagged:
        lines.extend(["| Asset | Kind | Frames | Frame | Visible median | Flags |", "| --- | --- | ---: | --- | --- | --- |"])
        for asset in sorted(flagged, key=lambda item: (item.kind, item.character, item.action)):
            lines.append(
                f"| `{rel(asset.path)}` | {asset.kind} | {asset.frames} | {asset.frame_width}x{asset.height} | "
                f"{asset.med_visible_width}x{asset.med_visible_height} | {', '.join(asset.flags)} |"
            )
    else:
        lines.append("No heuristic flags found.")
    lines.extend(["", "## Full Metrics", ""])
    lines.extend(["| Asset | Kind | Frames | Frame | Alpha | Visible median | Edge touches |", "| --- | --- | ---: | --- | --- | --- | ---: |"])
    for asset in sorted(all_assets, key=lambda item: (item.kind, item.character, item.action)):
        alpha = "transparent" if asset.has_transparency else "opaque"
        visible = f"{asset.med_visible_width}x{asset.med_visible_height}" if asset.has_transparency else "n/a"
        lines.append(
            f"| `{rel(asset.path)}` | {asset.kind} | {asset.frames} | {asset.frame_width}x{asset.height} | "
            f"{alpha} | {visible} | {asset.edge_touch_count} |"
        )
    (OUT / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    animations, feet, sources = collect_assets()
    make_character_scale_sheet(animations)
    make_strip_sheet(animations, "animation-strip-contact-sheet.png", "Soi Six Animation Strip Review", thumb_w=430)
    make_strip_sheet(feet, "feet-check-strip-contact-sheet.png", "Soi Six Feet-Check Strip Review", thumb_w=430)
    make_feet_frame_sheet(feet)
    make_strip_sheet(sources, "source-sheet-contact-sheet.png", "Soi Six Source Sheet Review", thumb_w=430)
    make_summary_markdown(animations, feet, sources)
    print(f"Wrote report to {OUT}")


if __name__ == "__main__":
    main()
