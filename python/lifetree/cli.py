"""命令行入口：``lifetree tree.json -o tree.png``。"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import List, Optional

from .api import LifeTree
from .measure import pillow_available


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="lifetree",
        description="把生命树文档（JSON / YAML）渲染成 PNG 或 SVG",
    )
    parser.add_argument("source", help="输入文件路径")
    parser.add_argument("-o", "--output", help="输出文件（.png / .svg），默认同名 .png")
    parser.add_argument("--scale", type=float, help="放大倍数，PNG 默认 2，SVG 默认 1")
    parser.add_argument(
        "--collapse",
        action="append",
        default=[],
        metavar="UID",
        help="收起指定节点，可重复传入",
    )
    parser.add_argument("--info", action="store_true", help="只打印布局信息，不出图")
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    tree = LifeTree.from_file(args.source, collapsed=args.collapse)

    if args.info:
        leaves = sum(1 for node in tree.layout.nodes if node.kind == "leaf")
        print("文件：%s" % Path(args.source).resolve())
        print("标题：%s" % (tree.document.title or "(无)"))
        print("节点：%d（叶节点 %d）" % (len(tree.layout.nodes), leaves))
        print("画布：%d × %d px" % (tree.width, tree.height))
        return 0

    output = Path(args.output) if args.output else Path(args.source).with_suffix(
        ".png" if pillow_available() else ".svg"
    )
    if output.suffix.lower() not in (".png", ".svg"):
        print("输出文件必须以 .png 或 .svg 结尾", file=sys.stderr)
        return 2
    tree.save(output, scale=args.scale)
    print("已生成 %s（%d × %d px）" % (output.resolve(), tree.width, tree.height))
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
