"""SVG 渲染：零依赖输出矢量图。"""

from __future__ import annotations

import base64
from typing import Optional
from xml.sax.saxutils import escape, quoteattr

from .document import TreeDocument
from .layout import DEFAULT_LAYOUT, LayoutResult
from .measure import default_measure
from .runs import fold_triangle, label_center_y, label_origin_x, label_runs
from .theme import DEFAULT_THEME, Theme

_MIME = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".svg": "image/svg+xml",
}


def render_svg(
    layout: LayoutResult,
    document: Optional[TreeDocument] = None,
    theme: Optional[Theme] = None,
    spec: Optional[dict] = None,
    scale: float = 1.0,
    embed_images: bool = True,
) -> str:
    """把布局结果渲染成 SVG 字符串。

    ``scale`` 只影响 ``width`` / ``height``，``viewBox`` 仍是逻辑坐标，
    因此放大后依旧是矢量清晰度。
    """
    theme = theme or DEFAULT_THEME
    spec = spec or DEFAULT_LAYOUT
    measure = default_measure()

    width = layout.width * scale
    height = layout.height * scale
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" '
        'viewBox="0 0 %s %s">' % (_num(width), _num(height), _num(layout.width), _num(layout.height)),
        '<rect x="0" y="0" width="%s" height="%s" fill=%s/>'
        % (_num(layout.width), _num(layout.height), quoteattr(theme.background)),
    ]

    # 树枝
    parts.append('<g id="lifetree-branches" fill=%s>' % quoteattr(theme.branch))
    half = theme.branch_width / 2
    for branch in layout.branches:
        if branch.direction == "h":
            x, y = branch.x, branch.y - half
            w, h = branch.length, theme.branch_width
        else:
            x, y = branch.x - half, branch.y
            w, h = theme.branch_width, branch.length
        fill = branch.color or None
        attr = " fill=%s" % quoteattr(fill) if fill else ""
        parts.append(
            '<rect x="%s" y="%s" width="%s" height="%s"%s/>'
            % (_num(x), _num(y), _num(w), _num(h), attr)
        )
    parts.append("</g>")

    parts.append('<g id="lifetree-nodes">')
    for node in layout.nodes:
        # 缩略图
        if node.image_box:
            href = _image_href(node.image_url, document, embed_images)
            box = node.image_box
            if href:
                parts.append(
                    '<g><rect x="%s" y="%s" width="%s" height="%s" rx="4" '
                    "fill=%s stroke=%s/>"
                    % (
                        _num(box.left),
                        _num(box.top),
                        _num(box.width),
                        _num(box.height),
                        quoteattr("#ffffff"),
                        quoteattr(theme.image_border),
                    )
                )
                pad = theme.image_padding
                parts.append(
                    '<image x="%s" y="%s" width="%s" height="%s" '
                    'preserveAspectRatio="xMidYMid meet" href=%s/>'
                    % (
                        _num(box.left + pad),
                        _num(box.top + pad),
                        _num(max(box.width - pad * 2, 1)),
                        _num(max(box.height - pad * 2, 1)),
                        quoteattr(href),
                    )
                )
                parts.append("</g>")

        # 收起/展开三角
        triangle = fold_triangle(node, spec)
        if triangle:
            points = " ".join("%s,%s" % (_num(x), _num(y)) for x, y in triangle)
            parts.append('<polygon points="%s" fill=%s/>' % (points, quoteattr(theme.fold)))

        # 文字
        runs = label_runs(node, theme, spec)
        if not runs:
            continue
        center_y = label_center_y(node, spec)
        x = label_origin_x(node, spec)
        for run in runs:
            x += run.dx
            baseline = center_y + run.size * 0.36 + run.dy
            family = theme.serif_family if run.kind.startswith("serif") else theme.sans_family
            weight = "700" if "bold" in run.kind else "400"
            style = ' font-style="italic"' if "italic" in run.kind else ""
            if run.pill:
                run_width = measure(run.text, run.size, italic=False, bold=False) + 8
                parts.append(
                    '<rect x="%s" y="%s" width="%s" height="13" rx="6.5" fill=%s/>'
                    % (_num(x - 4), _num(center_y - 6.5), _num(run_width), quoteattr(theme.hidden_bg))
                )
            parts.append(
                '<text x="%s" y="%s" font-family=%s font-size="%s" font-weight="%s"%s fill=%s>%s</text>'
                % (
                    _num(x),
                    _num(baseline),
                    quoteattr(family),
                    _num(run.size),
                    weight,
                    style,
                    quoteattr(run.color),
                    escape(run.text),
                )
            )
            run_width = measure(run.text, run.size, italic="italic" in run.kind, bold="bold" in run.kind)
            x += run_width + (8 if run.pill else 0)
    parts.append("</g>")
    parts.append("</svg>")
    return "\n".join(parts)


def _num(value: float) -> str:
    if isinstance(value, int):
        return str(value)
    rounded = round(float(value), 2)
    if rounded == int(rounded):
        return str(int(rounded))
    return ("%.2f" % rounded).rstrip("0").rstrip(".")


def _image_href(url: str, document: Optional[TreeDocument], embed: bool) -> str:
    if not url:
        return ""
    if url.startswith(("http://", "https://", "data:")):
        return url
    if not embed or document is None:
        return url
    path = document.resolve_asset(url)
    if path is None:
        return ""
    mime = _MIME.get(path.suffix.lower(), "application/octet-stream")
    try:
        payload = base64.b64encode(path.read_bytes()).decode("ascii")
    except OSError:
        return ""
    return "data:%s;base64,%s" % (mime, payload)
