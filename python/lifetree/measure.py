"""文字宽度测量。

浏览器里前端用 canvas 的 ``measureText`` 量文字，Python 侧有两条路径：

1. 安装了 Pillow 且有可用字体：用真实字体度量（``getlength``），最接近浏览器；
2. 没有 Pillow / 找不到字体：按字符类别估算宽度，保证库在零依赖下也能用。

两种方式对外的签名一致：
``measure(text, size, italic=False, bold=False) -> float``
"""

from __future__ import annotations

import os
import sys
from typing import Callable, Dict, List, Optional

_SANS_CANDIDATES = [
    "C:/Windows/Fonts/msyh.ttc",
    "C:/Windows/Fonts/msyh.ttf",
    "C:/Windows/Fonts/simhei.ttf",
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/STHeiti Light.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]

_SANS_BOLD_CANDIDATES = [
    "C:/Windows/Fonts/msyhbd.ttc",
    "C:/Windows/Fonts/msyhbd.ttf",
    "/System/Library/Fonts/PingFang.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]

_SERIF_ITALIC_CANDIDATES = [
    "C:/Windows/Fonts/georgiai.ttf",
    "/System/Library/Fonts/Supplemental/Georgia Italic.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf",
]

_SERIF_BOLD_ITALIC_CANDIDATES = [
    "C:/Windows/Fonts/georgiaz.ttf",
    "/System/Library/Fonts/Supplemental/Georgia Bold Italic.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-BoldItalic.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-BoldItalic.ttf",
]

# 与前端一致的字体族，供 SVG 使用
SANS_FONT_FAMILY = '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif'
SERIF_FONT_FAMILY = 'Georgia, "Times New Roman", serif'


def _first_existing(paths: List[str]) -> Optional[str]:
    for path in paths:
        if os.path.exists(path):
            return path
    return None


class FontRegistry:
    """管理 sans / sans_bold / serif_italic / serif_bold_italic 四种字体。"""

    KINDS = ("sans", "sans_bold", "serif_italic", "serif_bold_italic")

    def __init__(self, overrides: Optional[Dict[str, str]] = None):
        overrides = overrides or {}
        self.paths: Dict[str, Optional[str]] = {
            "sans": overrides.get("sans") or _first_existing(_SANS_CANDIDATES),
            "sans_bold": overrides.get("sans_bold")
            or _first_existing(_SANS_BOLD_CANDIDATES),
            "serif_italic": overrides.get("serif_italic")
            or _first_existing(_SERIF_ITALIC_CANDIDATES),
            "serif_bold_italic": overrides.get("serif_bold_italic")
            or _first_existing(_SERIF_BOLD_ITALIC_CANDIDATES),
        }
        # 缺失的字体回退到 sans（保证中文有字形）
        for kind in ("sans_bold", "serif_italic", "serif_bold_italic"):
            if not self.paths[kind]:
                self.paths[kind] = self.paths["sans"]
        self._cache: Dict[tuple, object] = {}

    def has_fonts(self) -> bool:
        return bool(self.paths.get("sans"))

    def font(self, kind: str, size: float):
        """取 Pillow 字体对象（按 kind + 实际像素尺寸缓存）。"""
        from PIL import ImageFont  # 延迟导入，核心功能不依赖 Pillow

        path = self.paths.get(kind) or self.paths.get("sans")
        if not path:
            raise RuntimeError("未找到可用字体，请通过 FontRegistry(overrides=...) 指定字体文件")
        pixel_size = max(1, int(round(size)))
        key = (path, pixel_size)
        if key not in self._cache:
            index = 0
            if path.lower().endswith(".ttc"):
                index = 0
            self._cache[key] = ImageFont.truetype(path, pixel_size, index=index)
        return self._cache[key]


def _char_factor(char: str) -> float:
    code = ord(char)
    if char == " ":
        return 0.28
    if code >= 0x2E80:  # 中日韩文字与全角符号，按一个字宽估算
        return 1.0
    if char in "il.,:;'|!`":
        return 0.30
    if char in "mwMW@":
        return 0.86
    if char.isupper():
        return 0.66
    if char.isdigit():
        return 0.56
    if char in "()[]{}/\\-+*=<>~^_\"%&$#?":
        return 0.52
    return 0.54


def estimate_width(text: str, size: float, italic: bool = False, bold: bool = False) -> float:
    """无字体时的宽度估算（按字符类别累加）。"""
    total = sum(_char_factor(char) for char in str(text))
    if bold:
        total *= 1.03
    if italic:
        total *= 0.98
    return total * size


def make_measurer(registry: Optional[FontRegistry] = None) -> Callable[..., float]:
    """返回一个带缓存的测量函数，Pillow 不可用时退化为估算。"""
    try:
        import PIL  # noqa: F401
    except ImportError:
        return estimate_width

    fonts = registry or FontRegistry()
    if not fonts.has_fonts():
        return estimate_width

    cache: Dict[tuple, float] = {}

    def measure(text: str, size: float, italic: bool = False, bold: bool = False) -> float:
        text = str(text)
        if not text:
            return 0.0
        kind = (
            "serif_bold_italic"
            if italic and bold
            else "serif_italic"
            if italic
            else "sans_bold"
            if bold
            else "sans"
        )
        key = (kind, int(round(size)), text)
        if key not in cache:
            cache[key] = float(fonts.font(kind, size).getlength(text))
        return cache[key]

    return measure


_default_measure: Optional[Callable[..., float]] = None


def default_measure() -> Callable[..., float]:
    """进程内共享的默认测量函数。"""
    global _default_measure
    if _default_measure is None:
        _default_measure = make_measurer()
    return _default_measure


def pillow_available() -> bool:
    try:
        import PIL  # noqa: F401
    except ImportError:
        return False
    return True


def platform_font_hint() -> str:
    if sys.platform.startswith("win"):
        return "Windows 通常自带 C:/Windows/Fonts/msyh.ttc 与 georgiai.ttf"
    if sys.platform == "darwin":
        return "macOS 通常自带 /System/Library/Fonts/PingFang.ttc"
    return "Linux 可安装 fonts-noto-cjk 或 fonts-wqy-microhei"
