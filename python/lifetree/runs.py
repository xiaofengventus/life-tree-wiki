"""把布局节点翻译成「按顺序排列的文字片段」，供 SVG / PNG 渲染共用。"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

from .layout import DEFAULT_LAYOUT, LayoutNode
from .theme import DEFAULT_THEME, Theme

LINE_HEIGHT = DEFAULT_LAYOUT["LINE_HEIGHT"]


@dataclass
class TextRun:
    text: str
    kind: str  # sans | sans_bold | serif_italic | serif_bold_italic
    size: float
    color: str
    dx: float = 0.0  # 额外左间距（对应 CSS margin-left）
    dy: float = 0.0  # 相对行中心的垂直偏移，负数向上（对应 sup）
    pill: bool = False  # 是否画成圆角底色标签（收起后的 +N）


def label_center_y(node: LayoutNode, spec: dict = None) -> float:
    spec = spec or DEFAULT_LAYOUT
    return node.label_top + spec["LINE_HEIGHT"] / 2


def label_origin_x(node: LayoutNode, spec: dict = None) -> float:
    spec = spec or DEFAULT_LAYOUT
    return node.label_left + (spec["FOLD_TOGGLE_WIDTH"] if node.has_children else 0)


def label_runs(node: LayoutNode, theme: Theme = None, spec: dict = None) -> List[TextRun]:
    """按 DOM 顺序生成文字片段：名字 → 引文 → 年代 → 收起数量。"""
    theme = theme or DEFAULT_THEME
    spec = spec or DEFAULT_LAYOUT
    runs: List[TextRun] = []

    is_link = bool(node.content_links) and bool(
        isinstance(node.content_links[0], dict) and node.content_links[0].get("url")
    )
    text_color = theme.link if is_link else theme.text

    for segment in node.segments:
        if segment.latin:
            kind = "serif_bold_italic" if node.is_root else "serif_italic"
        else:
            kind = "sans_bold" if node.is_root else "sans"
        # 中文与拉丁名之间留一点空隙（前端靠字符宽度预留了同样的余量）
        gap = 3 if runs and (runs[-1].kind.startswith("serif") != kind.startswith("serif")) else 0
        runs.append(
            TextRun(
                text=segment.text,
                kind=kind,
                size=spec["ROOT_FONT_SIZE"] if node.is_root else spec["FONT_SIZE"],
                color=text_color,
                dx=gap,
            )
        )

    if node.citation_numbers:
        labels = ",".join(str(number) for number in node.citation_numbers)
        runs.append(
            TextRun(
                text="[%s]" % labels,
                kind="sans_bold",
                size=10,
                color=theme.citation,
                dx=2,
                dy=-4,
            )
        )

    if node.age:
        runs.append(TextRun(text=node.age, kind="sans", size=11, color=theme.age, dx=7))

    if node.collapsed and node.hidden_count:
        runs.append(
            TextRun(
                text="+%d" % node.hidden_count,
                kind="sans",
                size=10,
                color=theme.hidden_text,
                dx=4,
                dy=1,
                pill=True,
            )
        )

    return runs


def fold_triangle(
    node: LayoutNode, spec: dict = None
) -> List[Tuple[float, float]]:
    """收起/展开三角的三个顶点（收起朝右，展开朝下）。"""
    if not node.has_children:
        return []
    spec = spec or DEFAULT_LAYOUT
    x0 = node.label_left + 3
    cy = label_center_y(node, spec)
    if node.collapsed:
        return [(x0, cy - 4), (x0 + 4, cy), (x0, cy + 4)]
    return [(x0, cy - 5), (x0 + 8, cy - 5), (x0 + 4, cy - 1)]
