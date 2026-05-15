from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[3]
SOURCE_ROOT = ROOT / "art-source"
OUT_SOURCE = SOURCE_ROOT / "characters" / "big-ink"
OUT_FINAL = ROOT / "public" / "assets" / "generated" / "animations" / "big-ink-v2"
FRAME = 256
GROUND_Y = 239
CENTER_X = 128


def alpha_bbox(image):
    return image.getchannel("A").getbbox()


def split_strip(path, frames):
    strip = Image.open(path).convert("RGBA")
    frame_w = strip.width // frames
    return [
        strip.crop((index * frame_w, 0, (index + 1) * frame_w, strip.height))
        for index in range(frames)
    ]


def trim_to_alpha(frame):
    bbox = alpha_bbox(frame)
    if not bbox:
        return Image.new("RGBA", (1, 1))
    return frame.crop(bbox)


def body_bottom(frame):
    bbox = alpha_bbox(frame)
    return bbox[3] if bbox else frame.height


def normalize_frame(frame, scale=1.0, anchor_center=None, ground_y=GROUND_Y):
    bbox = alpha_bbox(frame)
    canvas = Image.new("RGBA", (FRAME, FRAME))
    if not bbox:
        return canvas

    crop = frame.crop(bbox)
    if scale != 1.0:
        size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
        crop = crop.resize(size, Image.Resampling.LANCZOS)

    if anchor_center is None:
        anchor_center = (bbox[0] + bbox[2]) / 2

    source_offset = anchor_center - bbox[0]
    if scale != 1.0:
        source_offset *= scale

    x = round(CENTER_X - source_offset)
    y = round(ground_y - crop.height)
    canvas.alpha_composite(crop, (x, y))
    return canvas


def normalize_strip(source_path, frames, out_name, scale=1.0, anchor="bbox", ground_y=GROUND_Y):
    source_frames = split_strip(source_path, frames)
    if anchor == "first":
        first_bbox = alpha_bbox(source_frames[0])
        anchor_center = (first_bbox[0] + first_bbox[2]) / 2
    else:
        anchor_center = None

    normalized = [
        normalize_frame(frame, scale=scale, anchor_center=anchor_center, ground_y=ground_y)
        for frame in source_frames
    ]
    write_strip(normalized, OUT_FINAL / out_name)
    write_frames(normalized, out_name.replace(".png", ""))
    write_preview(normalized, OUT_SOURCE / "previews" / out_name)
    return normalized


def write_strip(frames, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    strip = Image.new("RGBA", (FRAME * len(frames), FRAME))
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * FRAME, 0))
    strip.save(path)


def write_frames(frames, action):
    out_dir = OUT_SOURCE / "frames" / action
    out_dir.mkdir(parents=True, exist_ok=True)
    for index, frame in enumerate(frames, start=1):
        frame.save(out_dir / f"{index:02d}.png")


def write_preview(frames, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    margin = 12
    preview = Image.new("RGBA", (FRAME * len(frames), FRAME + margin), (18, 18, 18, 255))
    for index, frame in enumerate(frames):
        slot_x = index * FRAME
        preview.alpha_composite(frame, (slot_x, 0))
        for x in range(slot_x, slot_x + FRAME):
            preview.putpixel((x, GROUND_Y), (80, 210, 145, 255))
        preview.putpixel((slot_x + CENTER_X, GROUND_Y), (255, 80, 80, 255))
    preview.save(path)


def make_idle():
    # Start from the approved stable Casey idle and remove the remaining 1px foot jitter.
    source = SOURCE_ROOT / "_idle_stability_review" / "big-ink" / "idle-after.png"
    frames = split_strip(source, 4)
    normalized = []
    first_bbox = alpha_bbox(frames[0])
    center = (first_bbox[0] + first_bbox[2]) / 2

    for index, frame in enumerate(frames):
        stable = normalize_frame(frame, anchor_center=center, ground_y=GROUND_Y)
        # Add a restrained frame-specific shirt highlight shimmer so the loop reads as
        # breathing/weight shift without stretching Casey's silhouette or feet.
        if index in (1, 2):
            overlay = Image.new("RGBA", (FRAME, FRAME))
            chest = Image.new("RGBA", (46, 34), (18, 18, 18, 16 if index == 1 else 24))
            chest = chest.filter(ImageFilter.GaussianBlur(5))
            overlay.alpha_composite(chest, (112, 92))
            stable = Image.alpha_composite(stable, overlay)
        normalized.append(stable)

    write_strip(normalized, OUT_FINAL / "idle.png")
    write_frames(normalized, "idle")
    write_preview(normalized, OUT_SOURCE / "previews" / "idle.png")
    return normalized


def make_smoking_combo():
    # Lighting source has a larger character render, so scale it back to Casey's idle height.
    source = SOURCE_ROOT / "_imagegen_review" / "big-ink" / "lighting-joint-imported.png"
    return normalize_strip(source, 6, "smoking-light-joint.png", scale=0.895, anchor="first", ground_y=GROUND_Y)


def make_smoke_loop():
    source = SOURCE_ROOT / "_imagegen_review" / "big-ink" / "smoking-idle-pre-lighting-joint.png"
    return normalize_strip(source, 6, "smoking-idle.png", scale=1.0, anchor="first", ground_y=GROUND_Y)


def make_walk():
    source = SOURCE_ROOT / "_imagegen_review" / "big-ink" / "walk-imported.png"
    return normalize_strip(source, 6, "walk.png", scale=1.0, anchor="bbox", ground_y=GROUND_Y)


def copy_action(name, frames, source_name=None):
    source_name = source_name or name
    source = ROOT / "public" / "assets" / "generated" / "animations" / "big-ink" / f"{source_name}.png"
    return normalize_strip(source, frames, f"{name}.png", scale=1.0, anchor="bbox", ground_y=GROUND_Y)


def write_notes(actions):
    lines = [
        "# Casey / Big Ink v2 Animation Inventory",
        "",
        "Character id: `big-ink`",
        "Display name: Casey",
        "Frame size: 256x256 px",
        "Anchor: bottom-center, visual ground line at y=239",
        "Final strip folder: `public/assets/generated/animations/big-ink-v2/`",
        "",
        "| Action | Strip | Frames | Dimensions | Status | Notes |",
        "| --- | --- | ---: | --- | --- | --- |",
    ]
    for action in actions:
        strip = action["strip"]
        if strip == "-":
            strip_cell = "-"
            dimensions = "-"
        else:
            strip_path = OUT_FINAL / strip
            im = Image.open(strip_path)
            strip_cell = f"`{strip_path.relative_to(ROOT)}`"
            dimensions = f"{im.width}x{im.height}"
        lines.append(
            f"| {action['action']} | {strip_cell} | {action['frames']} | "
            f"{dimensions} | {action['status']} | {action['notes']} |"
        )
    lines.extend(
        [
            "",
            "Integration notes:",
            "- No gameplay code or public manifest was changed.",
            "- To integrate, point Casey's `big-ink` animation paths at `public/assets/generated/animations/big-ink-v2/` and update frame counts where needed.",
            "- `smoking-light-joint.png` is the publishable light-joint action strip; `smoking-idle.png` is the calmer loop once already smoking.",
            "- Preview sheets with a ground/anchor guide live in `art-source/characters/big-ink/previews/`.",
        ]
    )
    (OUT_SOURCE / "INVENTORY.md").write_text("\n".join(lines) + "\n")


def main():
    OUT_SOURCE.mkdir(parents=True, exist_ok=True)
    OUT_FINAL.mkdir(parents=True, exist_ok=True)

    make_idle()
    make_smoking_combo()
    make_smoke_loop()
    make_walk()

    write_notes(
        [
            {
                "action": "idle",
                "strip": "idle.png",
                "frames": 4,
                "status": "final",
                "notes": "True frame loop from stable Casey source; feet locked to a shared ground line, no scale or squash.",
            },
            {
                "action": "smoking-light-joint",
                "strip": "smoking-light-joint.png",
                "frames": 6,
                "status": "final",
                "notes": "Casey raises/lights/smokes a generic joint with small ember/smoke motion; no brand text or labels.",
            },
            {
                "action": "smoking-idle",
                "strip": "smoking-idle.png",
                "frames": 6,
                "status": "final",
                "notes": "Calm post-light smoke loop with stable feet/body and drifting smoke bubbles.",
            },
            {
                "action": "walk",
                "strip": "walk.png",
                "frames": 6,
                "status": "final",
                "notes": "Normalized walk strip from the best Big Ink source; stable bottom-center anchor.",
            },
            {
                "action": "attack",
                "strip": "-",
                "frames": 0,
                "status": "deferred",
                "notes": "Not shipped in v2; existing source needs dedicated cleanup rather than another placeholder.",
            },
            {
                "action": "hurt",
                "strip": "-",
                "frames": 0,
                "status": "deferred",
                "notes": "Not shipped in v2; existing source needs dedicated cleanup rather than another placeholder.",
            },
            {
                "action": "knockdown",
                "strip": "-",
                "frames": 0,
                "status": "deferred",
                "notes": "Not shipped in v2; existing source needs dedicated cleanup rather than another placeholder.",
            },
            {
                "action": "get-up",
                "strip": "-",
                "frames": 0,
                "status": "deferred",
                "notes": "Not shipped in v2; existing source needs dedicated cleanup rather than another placeholder.",
            },
            {
                "action": "victory",
                "strip": "-",
                "frames": 0,
                "status": "deferred",
                "notes": "Not shipped in v2; existing source needs dedicated cleanup rather than another placeholder.",
            },
            {
                "action": "rush",
                "strip": "-",
                "frames": 0,
                "status": "deferred",
                "notes": "Not shipped in v2; existing source needs dedicated cleanup rather than another placeholder.",
            },
        ]
    )


if __name__ == "__main__":
    main()
