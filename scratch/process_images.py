from rembg import remove
from PIL import Image
import os

images = [
    "public/assets/generated/animations/npc-girl-red/idle.png",
    "public/assets/generated/animations/npc-girl-black/idle.png",
    "public/assets/generated/animations/npc-girl-denim/idle.png",
    "public/assets/generated/animations/npc-girl-silver/idle.png"
]

for img_path in images:
    print(f"Processing {img_path}...")
    output_path = img_path.replace(".png", "_nobg.png")
    try:
        input_image = Image.open(img_path)
        output_image = remove(input_image)
        output_image.save(output_path)
        os.replace(output_path, img_path)
        print(f"Success: {img_path}")
    except Exception as e:
        print(f"Failed to process {img_path}: {e}")

print("Done processing images.")
