"""对外主入口：``LifeTree``。"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Callable, Iterable, Optional, Union

from .document import TreeDocument, load_document
from .layout import DEFAULT_LAYOUT, LayoutResult, compute_layout
from .measure import FontRegistry, default_measure
from .png import render_png
from .svg import render_svg
from .theme import DEFAULT_THEME, Theme

PathLike = Union[str, Path]


class LifeTree:
    """一棵可渲染的生命树。

    典型用法::

        import lifetree

        tree = lifetree.LifeTree.from_file("tree.json")
        tree.save("tree.png")          # 按扩展名自动选择格式
        svg = tree.to_svg()

    也可以一步到位::

        lifetree.render_file("tree.json", "tree.png", scale=2)
    """

    def __init__(
        self,
        document: TreeDocument,
        collapsed: Optional[Iterable[str]] = None,
        spec: Optional[dict] = None,
        measure: Optional[Callable[..., float]] = None,
        theme: Optional[Theme] = None,
    ):
        self.document = document
        self.theme = theme or DEFAULT_THEME
        self.spec = dict(DEFAULT_LAYOUT)
        if spec:
            self.spec.update(spec)
        self.measure = measure or default_measure()
        self.collapsed = set(collapsed or ())
        self.layout: LayoutResult = compute_layout(
            document.root,
            collapsed=self.collapsed,
            measure=self.measure,
            spec=self.spec,
        )

    # ---------- 构造 ----------
    @classmethod
    def from_file(cls, path: PathLike, **kwargs) -> "LifeTree":
        """读取文件构造（.json / .yaml / .yml）。"""
        return cls(load_document(path), **kwargs)

    @classmethod
    def from_dict(cls, data: Any, **kwargs) -> "LifeTree":
        """从 dict 构造，支持文档、接口响应、裸节点三种形态。"""
        document_kwargs = {}
        for key in ("base_dir", "title"):
            if key in kwargs:
                document_kwargs[key] = kwargs.pop(key)
        return cls(TreeDocument.from_dict(data, **document_kwargs), **kwargs)

    # ---------- 渲染 ----------
    def to_svg(self, scale: float = 1.0, embed_images: bool = True) -> str:
        """渲染为 SVG 字符串（零依赖，矢量）。"""
        return render_svg(
            self.layout,
            document=self.document,
            theme=self.theme,
            spec=self.spec,
            scale=scale,
            embed_images=embed_images,
        )

    def to_png(
        self,
        scale: float = 2.0,
        fonts: Optional[FontRegistry] = None,
        allow_remote: bool = False,
    ) -> bytes:
        """渲染为 PNG 字节流（需要 Pillow）。"""
        return render_png(
            self.layout,
            document=self.document,
            theme=self.theme,
            spec=self.spec,
            scale=scale,
            fonts=fonts,
            allow_remote=allow_remote,
        )

    def save(
        self,
        path: PathLike,
        scale: Optional[float] = None,
        embed_images: bool = True,
        fonts: Optional[FontRegistry] = None,
        allow_remote: bool = False,
    ) -> Path:
        """按扩展名保存为 .svg 或 .png。"""
        target = Path(path).expanduser()
        suffix = target.suffix.lower()
        target.parent.mkdir(parents=True, exist_ok=True)
        if suffix == ".svg":
            target.write_text(self.to_svg(scale=scale or 1.0, embed_images=embed_images), encoding="utf-8")
        elif suffix == ".png":
            target.write_bytes(
                self.to_png(scale=scale or 2.0, fonts=fonts, allow_remote=allow_remote)
            )
        else:
            raise ValueError("只支持保存为 .svg 或 .png，收到：%s" % (suffix or "无扩展名"))
        return target

    # ---------- 其它 ----------
    @property
    def width(self) -> int:
        return self.layout.width

    @property
    def height(self) -> int:
        return self.layout.height

    def relayout(self, collapsed: Optional[Iterable[str]] = None) -> LayoutResult:
        """更换收起集合后重新计算布局。"""
        if collapsed is not None:
            self.collapsed = set(collapsed)
        self.layout = compute_layout(
            self.document.root,
            collapsed=self.collapsed,
            measure=self.measure,
            spec=self.spec,
        )
        return self.layout


def render_file(
    source: PathLike,
    target: Optional[PathLike] = None,
    scale: Optional[float] = None,
    collapsed: Optional[Iterable[str]] = None,
    spec: Optional[dict] = None,
    theme: Optional[Theme] = None,
    fonts: Optional[FontRegistry] = None,
) -> Union[Path, str]:
    """一步渲染：读文件 → 出图。

    返回写入的文件路径；省略 ``target`` 时直接返回 SVG 字符串。
    """
    tree = LifeTree.from_file(source, collapsed=collapsed, spec=spec, theme=theme)
    if target is None:
        return tree.to_svg(scale=scale or 1.0)
    suffix = Path(target).suffix.lower()
    if suffix == ".svg":
        tree.save(target, scale=scale)
        return Path(target)
    return tree.save(target, scale=scale, fonts=fonts)
