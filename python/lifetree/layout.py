"""生命树布局。

移植自前端 ``src/utils/lifeTreeLayout.js``，保持同一套几何规则：

- 树枝全部是水平 / 垂直矩形；
- 内部节点的名字在树枝上方，叶节点的名字在树枝右侧；
- 名字 "中文 拉丁文名" 中拉丁部分用斜体衬线字体；
- 树枝长度随文字长度自适应，上下节点之间为图片预留高度。

与前端唯一的差异：浏览器用 canvas 量文字宽度，这里通过可替换的
``measure`` 回调测量（默认使用 Pillow，未安装时退化为字符宽度估算）。
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Callable, Iterable, List, Optional

# 与前端 LIFE_TREE_LAYOUT 保持一致的默认值
DEFAULT_LAYOUT = {
    "FONT_SIZE": 14,
    "ROOT_FONT_SIZE": 16,
    "LINE_HEIGHT": 22,
    "LABEL_GAP": 6,
    "ROW_HEIGHT": 30,
    "SIBLING_GAP": 8,
    "LEAF_BRANCH": 26,
    "BRANCH_END_PAD": 22,
    "IMAGE_MAX_WIDTH": 120,
    "IMAGE_MAX_HEIGHT": 90,
    "IMAGE_DEFAULT_ASPECT": 4 / 3,
    "IMAGE_GAP": 8,
    "LABEL_INDENT": 6,
    "FOLD_TOGGLE_WIDTH": 16,
    "MIN_BRANCH": 44,
    "MARGIN_X": 90,
    "MARGIN_Y": 70,
}

LATIN_TOKEN = re.compile(
    r"^[A-Za-z\u2020][A-Za-z\u00e0-\u00f6\u00f8-\u00ff\u0100-\u017f'\u2019\u00b7.\-]*(?:[ -][A-Za-z\u00e0-\u00f6\u00f8-\u00ff\u0100-\u017f'\u2019\u00b7.\-]+)*$"
)

Measure = Callable[..., float]


@dataclass
class Segment:
    """名字片段：拉丁片段用斜体，其余正常。"""

    text: str
    latin: bool = False


@dataclass
class Box:
    left: float
    top: float
    width: float
    height: float


@dataclass
class LayoutNode:
    id: str
    depth: int
    x: float
    kind: str  # "leaf" | "internal"
    segments: List[Segment]
    age: str
    label_left: float
    label_top: float
    label_width: float
    branch_y: float
    branch_length: float
    image_url: str
    image_box: Optional[Box]
    content_links: list
    citation_numbers: list
    is_root: bool
    has_children: bool
    collapsed: bool
    hidden_count: int

    @property
    def name(self) -> str:
        return " ".join(segment.text for segment in self.segments)


@dataclass
class Branch:
    id: str
    direction: str  # "h" | "v"
    x: float
    y: float
    length: float
    color: str = ""


@dataclass
class LayoutResult:
    nodes: List[LayoutNode] = field(default_factory=list)
    branches: List[Branch] = field(default_factory=list)
    width: int = 0
    height: int = 0


def split_name_segments(text: str) -> List[Segment]:
    """把 "中文 拉丁文名" 拆成正常 / 斜体两类片段。"""
    segments: List[Segment] = []
    for token in re.split(r"\s+", str(text or "").strip()):
        if not token:
            continue
        latin = bool(LATIN_TOKEN.match(token))
        if segments and segments[-1].latin == latin:
            segments[-1].text += " " + token
        else:
            segments.append(Segment(token, latin))
    return segments


def node_image(node: dict) -> str:
    """取节点的图片地址，兼容字符串与 {url} 两种写法。"""
    data = node.get("data") or {}
    image = data.get("image")
    if not image:
        return ""
    if isinstance(image, str):
        return image
    return (image or {}).get("url") or ""


def resolve_image_size(image_size: Optional[dict], spec: dict) -> tuple:
    """把图片等比缩放进 IMAGE_MAX_* 外接框，不裁剪、不变形。"""
    width = _as_float((image_size or {}).get("width"))
    height = _as_float((image_size or {}).get("height"))
    if width and height and width > 0 and height > 0:
        aspect = width / height
    else:
        aspect = spec["IMAGE_DEFAULT_ASPECT"]
    max_width = spec["IMAGE_MAX_WIDTH"]
    max_height = spec["IMAGE_MAX_HEIGHT"]
    box_width = max_width
    box_height = max_width / aspect
    if box_height > max_height:
        box_height = max_height
        box_width = max_height * aspect
    return round(box_width), round(box_height)


def count_descendants(node: dict) -> int:
    total = 0
    for child in node.get("children") or []:
        if not child:
            continue
        total += 1 + count_descendants(child)
    return total


def _as_float(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _measure_label(segments, age, citation_count, is_root, measure, spec) -> float:
    font_size = spec["ROOT_FONT_SIZE"] if is_root else spec["FONT_SIZE"]
    width = 0.0
    for segment in segments:
        width += measure(segment.text, font_size, italic=segment.latin, bold=is_root)
        if segment.latin:
            width += 2
    if age:
        width += measure(age, 11.0) + 10
    if citation_count:
        width += 20
    return width


def compute_layout(
    root: dict,
    collapsed: Optional[Iterable[str]] = None,
    measure: Optional[Measure] = None,
    spec: Optional[dict] = None,
) -> LayoutResult:
    """计算整棵树的布局。

    参数
    ----
    root:
        树的根节点 ``{"data": {...}, "children": [...]}``。
    collapsed:
        需要收起的节点 uid 集合（收起后只画该节点自身的名字与图片）。
    measure:
        ``measure(text, font_size, italic=False, bold=False) -> float``，
        默认使用 :mod:`lifetree.measure` 中的实现。
    spec:
        覆盖 :data:`DEFAULT_LAYOUT` 中任意尺寸常量。
    """
    if measure is None:
        from .measure import default_measure

        measure = default_measure()

    layout_spec = dict(DEFAULT_LAYOUT)
    if spec:
        layout_spec.update(spec)
    M = layout_spec

    collapsed_set = set(collapsed or ())
    result = LayoutResult()
    fallback_id = 0
    max_right = 0.0

    def layout_node(node: dict, depth: int, x: float, y_start: float):
        nonlocal fallback_id, max_right
        data = (node or {}).get("data") or {}
        is_root = depth == 0
        children = [child for child in ((node or {}).get("children") or []) if child]

        uid = data.get("uid")
        if uid:
            node_id = str(uid)
        else:
            node_id = "life-node-%d" % fallback_id
            fallback_id += 1

        segments = split_name_segments(data.get("text") or "")
        age = str(data.get("age") or "").strip()
        image_url = node_image(node or {})
        has_image = bool(image_url)
        image_size = resolve_image_size(data.get("imageSize"), M) if has_image else None
        content_links = data.get("contentLinks") or []
        citation_numbers = data.get("citationNumbers") or []
        has_children = len(children) > 0
        is_collapsed = has_children and node_id in collapsed_set

        label_width = _measure_label(
            segments,
            age,
            len(citation_numbers),
            is_root,
            measure,
            M,
        ) + (M["FOLD_TOGGLE_WIDTH"] if has_children else 0)

        if not has_children:
            band = max(M["ROW_HEIGHT"], (image_size[1] + 10) if has_image else 0)
            branch_y = y_start + band / 2
            label_left = x + M["LEAF_BRANCH"] + M["IMAGE_GAP"]
            image_box = None
            if has_image:
                image_box = Box(
                    left=label_left + label_width + M["IMAGE_GAP"],
                    top=branch_y - image_size[1] / 2,
                    width=image_size[0],
                    height=image_size[1],
                )
            result.nodes.append(
                LayoutNode(
                    id=node_id,
                    depth=depth,
                    x=x,
                    kind="leaf",
                    segments=segments,
                    age=age,
                    label_left=label_left,
                    label_top=branch_y - M["LINE_HEIGHT"] / 2,
                    label_width=label_width,
                    branch_y=branch_y,
                    branch_length=M["LEAF_BRANCH"],
                    image_url=image_url,
                    image_box=image_box,
                    content_links=content_links,
                    citation_numbers=citation_numbers,
                    is_root=is_root,
                    has_children=False,
                    collapsed=False,
                    hidden_count=0,
                )
            )
            result.branches.append(
                Branch(
                    id="%s-h" % node_id,
                    direction="h",
                    x=x,
                    y=branch_y,
                    length=M["LEAF_BRANCH"],
                )
            )
            right = (
                image_box.left + image_box.width
                if image_box
                else label_left + label_width
            )
            max_right = max(max_right, right)
            return branch_y, band

        has_label = bool(segments) or bool(age) or len(citation_numbers) > 0
        reserve = (M["LINE_HEIGHT"] + M["LABEL_GAP"] if has_label else 0) + (
            image_size[1] + M["LABEL_GAP"] if has_image else 0
        )
        branch_length = max(
            M["MIN_BRANCH"], M["LABEL_INDENT"] + label_width + M["BRANCH_END_PAD"]
        )
        label_left = x + M["LABEL_INDENT"]
        image_box = (
            Box(left=label_left, top=0.0, width=image_size[0], height=image_size[1])
            if has_image
            else None
        )

        if is_collapsed:
            band = reserve + M["ROW_HEIGHT"]
            branch_y = y_start + reserve + M["ROW_HEIGHT"] / 2
            label_top = branch_y - reserve
            if image_box:
                image_box.top = label_top + (
                    M["LINE_HEIGHT"] + M["LABEL_GAP"] if has_label else 0
                )
            result.nodes.append(
                LayoutNode(
                    id=node_id,
                    depth=depth,
                    x=x,
                    kind="internal",
                    segments=segments,
                    age=age,
                    label_left=label_left,
                    label_top=label_top,
                    label_width=label_width,
                    branch_y=branch_y,
                    branch_length=branch_length,
                    image_url=image_url,
                    image_box=image_box,
                    content_links=content_links,
                    citation_numbers=citation_numbers,
                    is_root=is_root,
                    has_children=True,
                    collapsed=True,
                    hidden_count=count_descendants(node or {}),
                )
            )
            result.branches.append(
                Branch(
                    id="%s-h" % node_id,
                    direction="h",
                    x=x,
                    y=branch_y,
                    length=branch_length,
                )
            )
            max_right = max(max_right, x + branch_length)
            if image_box:
                max_right = max(max_right, image_box.left + image_box.width)
            return branch_y, band

        cursor_y = y_start + reserve
        child_results = []
        for index, child in enumerate(children):
            child_result = layout_node(child, depth + 1, x + branch_length, cursor_y)
            child_results.append(child_result)
            cursor_y += child_result[1]
            if index < len(children) - 1:
                cursor_y += M["SIBLING_GAP"]

        first_y = child_results[0][0]
        last_y = child_results[-1][0]
        branch_y = (first_y + last_y) / 2
        label_top = branch_y - reserve
        if image_box:
            image_box.top = label_top + (
                M["LINE_HEIGHT"] + M["LABEL_GAP"] if has_label else 0
            )

        result.nodes.append(
            LayoutNode(
                id=node_id,
                depth=depth,
                x=x,
                kind="internal",
                segments=segments,
                age=age,
                label_left=label_left,
                label_top=label_top,
                label_width=label_width,
                branch_y=branch_y,
                branch_length=branch_length,
                image_url=image_url,
                image_box=image_box,
                content_links=content_links,
                citation_numbers=citation_numbers,
                is_root=is_root,
                has_children=True,
                collapsed=False,
                hidden_count=0,
            )
        )
        result.branches.append(
            Branch(
                id="%s-h" % node_id,
                direction="h",
                x=x,
                y=branch_y,
                length=branch_length,
            )
        )
        vertical_x = x + branch_length
        vertical_top = min(first_y, branch_y)
        vertical_bottom = max(last_y, branch_y)
        if vertical_bottom - vertical_top > 1.5:
            result.branches.append(
                Branch(
                    id="%s-v" % node_id,
                    direction="v",
                    x=vertical_x,
                    y=vertical_top,
                    length=vertical_bottom - vertical_top,
                )
            )

        max_right = max(max_right, x + branch_length)
        if image_box:
            max_right = max(max_right, image_box.left + image_box.width)
        return branch_y, cursor_y - y_start

    root_branch_y, root_band = layout_node(root or {}, 0, M["MARGIN_X"], M["MARGIN_Y"])
    result.width = int(_ceil(max_right + M["MARGIN_X"]))
    result.height = int(_ceil(root_band + M["MARGIN_Y"] * 2))
    return result


def _ceil(value: float) -> int:
    import math

    return int(math.ceil(value))
