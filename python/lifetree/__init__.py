"""lifetree —— 把生命树（cladogram）文档渲染成 PNG / SVG 的 Python 库。

最小示例::

    import lifetree

    tree = lifetree.LifeTree.from_file("tree.json")
    print(tree.width, tree.height)
    tree.save("tree.png")
"""

from .api import LifeTree, render_file
from .document import DocumentError, TreeDocument, load_document
from .layout import (
    DEFAULT_LAYOUT,
    Branch,
    LayoutNode,
    LayoutResult,
    Box,
    Segment,
    compute_layout,
    split_name_segments,
)
from .measure import (
    SANS_FONT_FAMILY,
    SERIF_FONT_FAMILY,
    FontRegistry,
    estimate_width,
    make_measurer,
)
from .theme import DEFAULT_THEME, Theme

__version__ = "0.1.0"

__all__ = [
    "LifeTree",
    "render_file",
    "load_document",
    "TreeDocument",
    "DocumentError",
    "compute_layout",
    "split_name_segments",
    "DEFAULT_LAYOUT",
    "LayoutResult",
    "LayoutNode",
    "Branch",
    "Box",
    "Segment",
    "Theme",
    "DEFAULT_THEME",
    "FontRegistry",
    "make_measurer",
    "estimate_width",
    "SANS_FONT_FAMILY",
    "SERIF_FONT_FAMILY",
    "__version__",
]
