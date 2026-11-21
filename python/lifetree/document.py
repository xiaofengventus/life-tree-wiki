"""文档读取：把文件（JSON / YAML）解析成统一的树结构。

支持三种输入形态，都会归一化到 ``{"root": node}``：

1. 完整个性化文档：``{"title": "...", "root": {...}}``
2. 后端接口响应：``{"success": true, "tree": {"document": {"root": {...}}}}``
3. 裸节点：``{"data": {...}, "children": [...]}``
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional, Union
from urllib.parse import unquote

REMOTE_PREFIXES = ("http://", "https://", "data:", "blob:")


class DocumentError(ValueError):
    """文档格式不合法。"""


@dataclass
class TreeDocument:
    """一棵生命树文档。

    ``root`` 是树的根节点（``{"data": ..., "children": [...]}``），
    ``base_dir`` 用于把 ``/media/xxx.png`` 这类相对地址解析成本地文件。
    """

    root: Dict[str, Any]
    base_dir: Optional[Path] = None
    title: str = ""
    citations: list = field(default_factory=list)
    source: Optional[Path] = None

    # ---------- 构造 ----------
    @classmethod
    def from_file(cls, path: Union[str, Path]) -> "TreeDocument":
        """读取本地文件（.json / .yaml / .yml）。"""
        file_path = Path(path).expanduser()
        if not file_path.exists():
            raise FileNotFoundError("找不到文件：%s" % file_path)
        suffix = file_path.suffix.lower()
        text = file_path.read_text(encoding="utf-8-sig")
        if suffix in (".yaml", ".yml"):
            data = _read_yaml(text, file_path)
        else:
            try:
                data = json.loads(text)
            except json.JSONDecodeError as error:
                # .txt / 无后缀时尝试 YAML
                data = _read_yaml(text, file_path, original=error)
        document = cls.from_dict(data)
        document.base_dir = file_path.parent
        document.source = file_path
        return document

    @classmethod
    def from_dict(
        cls,
        data: Any,
        base_dir: Optional[Union[str, Path]] = None,
        title: Optional[str] = None,
    ) -> "TreeDocument":
        """从已经解析好的 dict 构造。"""
        root, inferred_title, citations = _normalize(data)
        return cls(
            root=root,
            base_dir=Path(base_dir) if base_dir else None,
            title=title if title is not None else inferred_title,
            citations=citations,
        )

    # ---------- 资源解析 ----------
    def resolve_asset(self, url: str) -> Optional[Path]:
        """把节点里的图片地址解析成本地文件路径；远程地址返回 None。"""
        if not url or url.startswith(REMOTE_PREFIXES):
            return None
        raw = unquote(str(url))
        candidate = Path(raw)
        if candidate.is_file():
            return candidate
        relative = raw.lstrip("/\\").replace("\\", "/")
        if self.base_dir:
            resolved = (self.base_dir / relative).resolve()
            if resolved.is_file():
                return resolved
            # 兼容文档放在子目录、图片在其上一级的情况
            parent = self.base_dir.parent / relative
            if parent.is_file():
                return parent
        return None


def _read_yaml(text: str, file_path: Path, original: Optional[Exception] = None):
    try:
        import yaml
    except ImportError:
        message = "读取 %s 需要 PyYAML：pip install lifetree-render[yaml]" % file_path
        if original is not None:
            raise DocumentError(message) from original
        raise DocumentError(message) from None
    try:
        return yaml.safe_load(text)
    except Exception as error:  # pragma: no cover - 取决于用户文件
        raise DocumentError("YAML 解析失败：%s" % error) from error


def _normalize(data: Any):
    if not isinstance(data, dict):
        raise DocumentError("文档根必须是 JSON 对象")
    if isinstance(data.get("root"), dict):
        return (
            data["root"],
            str(data.get("title") or data.get("name") or ""),
            list(data.get("citations") or []),
        )
    tree = data.get("tree")
    if isinstance(tree, dict) and isinstance(tree.get("document"), dict):
        return _normalize(tree["document"])
    if isinstance(data.get("document"), dict):
        return _normalize(data["document"])
    if "data" in data or "children" in data:
        return data, str(data.get("title") or ""), []
    raise DocumentError("文档里找不到 root / document / data 字段")


def load_document(path: Union[str, Path]) -> TreeDocument:
    """读取文件的快捷函数：``doc = lifetree.load_document("tree.json")``。"""
    return TreeDocument.from_file(path)
