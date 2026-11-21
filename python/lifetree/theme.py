"""配色与排版常量，与前端 ``LifeTreeDom.vue`` 的样式表保持一致。"""

from __future__ import annotations

from dataclasses import dataclass

from .measure import SANS_FONT_FAMILY, SERIF_FONT_FAMILY


@dataclass
class Theme:
    background: str = "#ffffff"
    text: str = "#1f2328"
    link: str = "#0645ad"
    branch: str = "#555555"
    citation: str = "#1683d8"
    age: str = "#8a919c"
    fold: str = "#7b838c"
    hidden_bg: str = "#eef1f4"
    hidden_text: str = "#6b7280"
    image_border: str = "#ced3d9"
    image_padding: int = 3
    branch_width: float = 1.5
    sans_family: str = SANS_FONT_FAMILY
    serif_family: str = SERIF_FONT_FAMILY


DEFAULT_THEME = Theme()
