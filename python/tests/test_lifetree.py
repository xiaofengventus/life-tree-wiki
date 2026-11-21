"""最小测试集：python -m unittest discover -s python/tests"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import lifetree  # noqa: E402
from lifetree.measure import estimate_width, pillow_available  # noqa: E402

EXAMPLE = ROOT / "examples" / "tree.json"


class DocumentTest(unittest.TestCase):
    def test_read_file(self):
        document = lifetree.load_document(EXAMPLE)
        self.assertEqual(document.title, "生命之树示例")
        self.assertEqual(document.root["data"]["uid"], "luca")
        self.assertEqual(document.source, EXAMPLE)

    def test_accepts_api_response_shape(self):
        raw = json.loads(EXAMPLE.read_text(encoding="utf-8"))
        document = lifetree.TreeDocument.from_dict({"success": True, "tree": {"document": raw}})
        self.assertEqual(document.root["data"]["text"], "露卡 LUCA")

    def test_accepts_bare_node(self):
        raw = json.loads(EXAMPLE.read_text(encoding="utf-8"))
        document = lifetree.TreeDocument.from_dict(raw["root"])
        self.assertEqual(document.title, "")

    def test_missing_file(self):
        with self.assertRaises(FileNotFoundError):
            lifetree.load_document(ROOT / "examples" / "not-exists.json")


class LayoutTest(unittest.TestCase):
    def setUp(self):
        self.measure = estimate_width
        self.tree = lifetree.LifeTree.from_file(EXAMPLE, measure=self.measure)

    def test_segments(self):
        segments = lifetree.split_name_segments("露卡 LUCA")
        self.assertEqual([(s.text, s.latin) for s in segments], [("露卡", False), ("LUCA", True)])

    def test_node_and_branch_counts(self):
        self.assertEqual(len(self.tree.layout.nodes), 11)
        self.assertGreaterEqual(len(self.tree.layout.branches), 11)

    def test_canvas_size(self):
        self.assertGreater(self.tree.width, 200)
        self.assertGreater(self.tree.height, 100)
        # 上下各留 MARGIN_Y，所以高度一定大于 2 倍边距
        self.assertGreater(self.tree.height, lifetree.DEFAULT_LAYOUT["MARGIN_Y"] * 2)

    def test_leaf_geometry(self):
        leaf = next(node for node in self.tree.layout.nodes if node.kind == "leaf")
        spec = lifetree.DEFAULT_LAYOUT
        self.assertAlmostEqual(leaf.label_left, leaf.x + spec["LEAF_BRANCH"] + spec["IMAGE_GAP"])
        self.assertAlmostEqual(leaf.label_top, leaf.branch_y - spec["LINE_HEIGHT"] / 2)

    def test_internal_label_above_branch(self):
        internal = next(
            node for node in self.tree.layout.nodes if node.kind == "internal" and node.has_children
        )
        self.assertLess(internal.label_top, internal.branch_y)

    def test_collapsed(self):
        tree = lifetree.LifeTree.from_file(EXAMPLE, collapsed=["bacteria"], measure=self.measure)
        node = next(item for item in tree.layout.nodes if item.id == "bacteria")
        self.assertTrue(node.collapsed)
        self.assertEqual(node.hidden_count, 2)
        # 收起后子节点不再参与布局
        self.assertNotIn("eurybacteria", [item.id for item in tree.layout.nodes])

    def test_relayout(self):
        before = len(self.tree.layout.nodes)
        self.tree.relayout(collapsed=["archaea"])
        self.assertLess(len(self.tree.layout.nodes), before)
        self.tree.relayout(collapsed=[])
        self.assertEqual(len(self.tree.layout.nodes), before)


class SvgTest(unittest.TestCase):
    def test_svg_output(self):
        svg = lifetree.render_file(EXAMPLE)
        self.assertTrue(svg.lstrip().startswith("<?xml"))
        self.assertIn("<svg", svg)
        self.assertIn('viewBox="0 0', svg)
        self.assertIn("露卡", svg)
        self.assertIn("LUCA", svg)
        self.assertIn('font-style="italic"', svg)
        self.assertIn("<polygon", svg)  # 收起三角
        self.assertNotIn("NaN", svg)

    def test_svg_scale(self):
        tree = lifetree.LifeTree.from_file(EXAMPLE)
        base = tree.to_svg(scale=1)
        doubled = tree.to_svg(scale=2)
        self.assertIn('width="%d"' % tree.width, base)
        self.assertIn('width="%d"' % (tree.width * 2), doubled)


@unittest.skipUnless(pillow_available(), "未安装 Pillow，跳过 PNG 测试")
class PngTest(unittest.TestCase):
    def test_png_bytes(self):
        tree = lifetree.LifeTree.from_file(EXAMPLE)
        payload = tree.to_png(scale=1)
        self.assertEqual(payload[:8], b"\x89PNG\r\n\x1a\n")
        self.assertGreater(len(payload), 1000)


if __name__ == "__main__":
    unittest.main()
