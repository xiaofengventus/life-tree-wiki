"""PNG 渲染（需要 Pillow）：把同一次布局光栅化成图片。"""

from __future__ import annotations

import io
from typing import Optional

from .document import TreeDocument
from .layout import DEFAULT_LAYOUT, LayoutResult
from .measure import FontRegistry, make_measurer, platform_font_hint
from .runs import fold_triangle, label_center_y, label_origin_x, label_runs
from .theme import DEFAULT_THEME, Theme


def render_png(
    layout: LayoutResult,
    document: Optional[TreeDocument] = None,
    theme: Optional[Theme] = None,
    spec: Optional[dict] = None,
    scale: float = 2.0,
    fonts: Optional[FontRegistry] = None,
    allow_remote: bool = False,
) -> bytes:
    """把布局结果渲染成 PNG 字节流。

    ``scale=2`` 即二倍图，线条与文字更锐利。
    """
    try:
        from PIL import Image, ImageDraw
    except ImportError as error:
        raise ImportError(
            "渲染 PNG 需要 Pillow：pip install lifetree-render[png]"
        ) from error

    theme = theme or DEFAULT_THEME
    spec = spec or DEFAULT_LAYOUT
    registry = fonts or FontRegistry()
    if not registry.has_fonts():
        raise RuntimeError(
            "未找到可用字体，无法渲染文字。请在 lifetree.FontRegistry(overrides={...}) "
            "中指定字体文件路径。%s" % platform_font_hint()
        )

    measure = make_measurer(registry)
    scale = max(0.1, float(scale))
    width = int(round(layout.width * scale))
    height = int(round(layout.height * scale))

    image = Image.new("RGBA", (max(width, 1), max(height, 1)), _color(theme.background))
    draw = ImageDraw.Draw(image)

    # 1) 树枝
    half = theme.branch_width / 2
    for branch in layout.branches:
        color = branch.color or theme.branch
        if branch.direction == "h":
            box = (
                branch.x * scale,
                (branch.y - half) * scale,
                (branch.x + branch.length) * scale,
                (branch.y + half) * scale,
            )
        else:
            box = (
                (branch.x - half) * scale,
                branch.y * scale,
                (branch.x + half) * scale,
                (branch.y + branch.length) * scale,
            )
        draw.rectangle([round(value) for value in box], fill=_color(color))

    # 2) 缩略图
    for node in layout.nodes:
        if not node.image_box:
            continue
        box = node.image_box
        frame = _scaled_box(box.left, box.top, box.width, box.height, scale)
        draw.rounded_rectangle(
            frame,
            radius=round(4 * scale),
            fill=_color("#ffffff"),
            outline=_color(theme.image_border),
            width=max(1, round(scale)),
        )
        thumb = _load_image(node.image_url, document, allow_remote)
        if thumb is None:
            continue
        pad = theme.image_padding * scale
        inner_w = max(1, frame[2] - frame[0] - pad * 2)
        inner_h = max(1, frame[3] - frame[1] - pad * 2)
        thumb.thumbnail((inner_w, inner_h))
        left = frame[0] + (frame[2] - frame[0] - thumb.width) / 2
        top = frame[1] + (frame[3] - frame[1] - thumb.height) / 2
        image.paste(thumb, (round(left), round(top)), thumb)

    # 3) 收起三角 + 文字
    for node in layout.nodes:
        triangle = fold_triangle(node, spec)
        if triangle:
            draw.polygon(
                [(round(x * scale), round(y * scale)) for x, y in triangle],
                fill=_color(theme.fold),
            )

        runs = label_runs(node, theme, spec)
        if not runs:
            continue
        center_y = label_center_y(node, spec) * scale
        x = label_origin_x(node, spec) * scale
        for run in runs:
            x += run.dx * scale
            font = registry.font(run.kind, run.size * scale)
            if run.pill:
                pill_width = measure(run.text, run.size) * scale + 8 * scale
                pill_height = 13 * scale
                draw.rounded_rectangle(
                    [
                        round(x - 4 * scale),
                        round(center_y - pill_height / 2),
                        round(x - 4 * scale + pill_width),
                        round(center_y + pill_height / 2),
                    ],
                    radius=round(pill_height / 2),
                    fill=_color(theme.hidden_bg),
                )
            draw.text(
                (x, center_y + (run.dy) * scale),
                run.text,
                font=font,
                fill=_color(run.color),
                anchor="lm",
            )
            run_width = measure(
                run.text, run.size, italic="italic" in run.kind, bold="bold" in run.kind
            ) * scale
            x += run_width + (8 * scale if run.pill else 0)

    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="PNG", optimize=True)
    return buffer.getvalue()


def _scaled_box(left, top, width, height, scale):
    return (
        round(left * scale),
        round(top * scale),
        round((left + width) * scale),
        round((top + height) * scale),
    )


def _color(value: str):
    from PIL import ImageColor

    return ImageColor.getrgb(value)


def _load_image(url: str, document: Optional[TreeDocument], allow_remote: bool):
    from PIL import Image

    if not url:
        return None
    try:
        if url.startswith(("http://", "https://")):
            if not allow_remote:
                return None
            import urllib.request

            with urllib.request.urlopen(url, timeout=10) as response:  # noqa: S310
                data = response.read()
            return Image.open(io.BytesIO(data)).convert("RGBA")
        if url.startswith("data:"):
            return None
        path = document.resolve_asset(url) if document else None
        if path is None:
            return None
        return Image.open(path).convert("RGBA")
    except Exception:  # 单张图片失败不影响整棵树
        return None
