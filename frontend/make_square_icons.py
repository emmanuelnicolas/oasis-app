from pathlib import Path
from PIL import Image


def make_square(
    source_path: Path,
    output_path: Path,
    canvas_size: int = 1024,
    logo_ratio: float = 0.72,
) -> None:
    image = Image.open(source_path).convert("RGBA")

    max_logo_size = int(
        canvas_size * logo_ratio
    )

    image.thumbnail(
        (
            max_logo_size,
            max_logo_size,
        ),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new(
        "RGBA",
        (
            canvas_size,
            canvas_size,
        ),
        (255, 255, 255, 0),
    )

    x = (
        canvas_size - image.width
    ) // 2

    y = (
        canvas_size - image.height
    ) // 2

    canvas.paste(
        image,
        (
            x,
            y,
        ),
        image,
    )

    canvas.save(output_path)

    print(
        f"Créé : {output_path} "
        f"({canvas_size}x{canvas_size})"
    )


images_folder = Path(
    "assets/images"
)

make_square(
    images_folder / "icon.png",
    images_folder / "icon.png",
    logo_ratio=0.78,
)

make_square(
    images_folder / "adaptive-icon.png",
    images_folder / "adaptive-icon.png",
    logo_ratio=0.60,
)