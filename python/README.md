# lifetree-render

把「生命时序」里的生命树（cladogram）渲染逻辑抽成一个独立的 Python 库：
读取树文档 → 计算布局 → 输出 **SVG** 或 **PNG**。不依赖浏览器、不依赖前端构建产物。

布局规则与前端 `src/utils/lifeTreeLayout.js` 完全一致：

- 树枝都是水平 / 垂直矩形；
- 内部节点名字在树枝上方，叶节点名字在树枝右侧；
- `露卡 LUCA` 这种「中文 + 拉丁名」的写法，拉丁部分自动用斜体衬线字体；
- 树枝长度随文字长度自适应，节点之间按图片高度预留空间，不互相挤压。

## 安装

```bash
pip install lifetree-render          # 只要 SVG 时零依赖
pip install "lifetree-render[png]"   # 需要 PNG 时加装 Pillow
```

别人拿到 wheel 或源码目录后，三选一即可：

```bash
pip install lifetree_render-0.1.0-py3-none-any.whl   # 分发 wheel
pip install "lifetree-render[png]"                   # 从 PyPI（发布后）
pip install -e "path/to/python[png]"                 # 本地源码可编辑安装
```

装好后在任意目录都能直接 `import lifetree`。

> 本目录（`python/`）自带 `pyproject.toml`，可以直接作为独立仓库的根目录发布。

## 发布成第三方包

已内置打包配置，`python/` 下执行：

```bash
python -m build                 # 产出 dist/*.whl 与 dist/*.tar.gz
python -m twine upload dist/*   # 上传到 PyPI（需先配置 token）
```

之后任何人都能 `pip install lifetree-render` 并 `import lifetree`。

## 快速开始

```python
import lifetree

# 1. 读取文件（JSON / YAML 都行）
tree = lifetree.LifeTree.from_file("tree.json")
print(tree.width, tree.height)      # 布局后的画布尺寸

# 2. 出图
tree.save("tree.png")               # 按扩展名自动选格式
tree.save("tree.svg", scale=1)

# 一步到位
lifetree.render_file("tree.json", "tree.png", scale=2)
```

直接要字节流 / 字符串：

```python
svg_text = tree.to_svg()            # str
png_bytes = tree.to_png(scale=3)    # bytes
```

## 读取文件的接口

| 接口                                       | 说明                                                           |
| ------------------------------------------ | -------------------------------------------------------------- |
| `lifetree.load_document(path)`             | 只读文件，得到 `TreeDocument`（`root` / `title` / `base_dir`） |
| `lifetree.LifeTree.from_file(path, ...)`   | 读文件并完成布局，最常用                                       |
| `lifetree.LifeTree.from_dict(data, ...)`   | 直接吃 dict / 接口返回的 JSON                                  |
| `lifetree.render_file(src, dst, ...)`      | 读文件 + 出图一步完成                                          |
| `python -m lifetree tree.json -o tree.png` | 命令行方式                                                     |

`from_dict` 支持三种输入形态，会自动归一化：

1. 文档：`{"title": "...", "root": {...}}`
2. 后端接口响应：`{"success": true, "tree": {"document": {"root": {...}}}}`
3. 裸节点：`{"data": {...}, "children": [...]}`

文件可以是 `.json`，也可以是 `.yaml` / `.yml`（需 `pip install "lifetree-render[yaml]"`）。

## 节点数据格式

与前端一致，每个节点是 `{"data": ..., "children": [...]}`：

| 字段                   | 类型              | 说明                                      |
| ---------------------- | ----------------- | ----------------------------------------- |
| `data.uid`             | str               | 节点唯一 id，用于收起与定位；缺省自动编号 |
| `data.text`            | str               | 显示名，`中文 拉丁名` 会被自动分段排版    |
| `data.age`             | str               | 名字后面的年代，灰色小字                  |
| `data.image`           | str \| `{url}`    | 缩略图地址                                |
| `data.imageSize`       | `{width, height}` | 缩略图原始尺寸，用于等比缩放              |
| `data.contentLinks`    | list              | 有 `url` 时名字显示为链接色               |
| `data.citationNumbers` | list[int]         | 名字右上角的 `[1,2]` 引文标注             |

## 常用参数

```python
tree = lifetree.LifeTree.from_file(
    "tree.json",
    collapsed=["bacteria"],   # 收起指定节点（只画它自己和 +N）
    spec={"FONT_SIZE": 16},   # 覆盖任意尺寸常量，见 lifetree.DEFAULT_LAYOUT
)

tree.save("tree.png", scale=2)          # 2 倍图
tree.to_svg(embed_images=True)          # 把本地图片内联成 base64
```

- `scale`：只放大输出尺寸，SVG 仍是矢量，PNG 建议 2~3。
- `fonts=lifetree.FontRegistry(overrides={"sans": "/path/NotoSansSC.ttf"})`：指定字体文件（Linux 上无中文字体时常用）。
- `allow_remote=True`：PNG 渲染时允许下载 `http(s)` 图片，默认关闭。

## 图片路径

`/media/xxx.png`、`images/a.jpg` 这类相对地址会相对 **文档所在目录** 解析；
找不到的图片会被跳过，不影响整棵树出图。远程地址在 SVG 中会保留为链接。

## 命令行

```bash
python -m lifetree tree.json -o tree.png --scale 2
python -m lifetree tree.json --info                 # 只打印节点数与画布尺寸
python -m lifetree tree.json -o tree.svg --collapse bacteria
```

## 依赖与字体

| 功能      | 依赖   |
| --------- | ------ |
| SVG       | 无     |
| PNG       | Pillow |
| YAML 输入 | PyYAML |

文字宽度测量优先用 Pillow + 系统字体（Windows 的 `msyh.ttc` / `georgiai.ttf`、macOS 的 `PingFang`、
Linux 的 `Noto Sans CJK`）；没有 Pillow 时按字符类别估算，SVG 仍可正常输出，
只是树枝长度会略有差异。

## 测试

```bash
python -m unittest discover -s python/tests -v
```
