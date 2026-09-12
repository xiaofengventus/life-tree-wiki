import { At as noneRichTextNodeLineHeight, G as isUndef, Ot as initRootNodePositionMap, St as Text, T as generateColorByContent, Tt as CONSTANTS, Y as mergerIconList, _ as createUid, _t as Image$1, a as camelCaseToHyphen, bt as Rect, c as checkIsRichText, gt as G, h as createForeignObjectNode, ht as Circle, k as getNodeRichTextStyles, mt as A, n as addXmlns, nt as removeRichTextStyes, p as copyNodeTree, rt as resizeImgSize, s as checkIsNodeStyleDataKey, vt as Path, xt as SVG, yt as Polygon } from "./utils-DKbIT76G.js";
//#region node_modules/simple-mind-map/src/core/render/node/Style.js
var backgroundStyleProps = [
	"backgroundColor",
	"backgroundImage",
	"backgroundRepeat",
	"backgroundPosition",
	"backgroundSize"
];
var Style = class Style {
	static setBackgroundStyle(el, themeConfig) {
		if (!el) return;
		if (!Style.cacheStyle) {
			Style.cacheStyle = {};
			let style = window.getComputedStyle(el);
			backgroundStyleProps.forEach((prop) => {
				Style.cacheStyle[prop] = style[prop];
			});
		}
		let { backgroundColor, backgroundImage, backgroundRepeat, backgroundPosition, backgroundSize } = themeConfig;
		el.style.backgroundColor = backgroundColor;
		if (backgroundImage && backgroundImage !== "none") {
			el.style.backgroundImage = `url(${backgroundImage})`;
			el.style.backgroundRepeat = backgroundRepeat;
			el.style.backgroundPosition = backgroundPosition;
			el.style.backgroundSize = backgroundSize;
		} else el.style.backgroundImage = "none";
	}
	static removeBackgroundStyle(el) {
		if (!Style.cacheStyle) return;
		backgroundStyleProps.forEach((prop) => {
			el.style[prop] = Style.cacheStyle[prop];
		});
		Style.cacheStyle = null;
	}
	constructor(ctx) {
		this.ctx = ctx;
		this._markerPath = null;
		this._marker = null;
		this._gradient = null;
	}
	merge(prop, root) {
		let themeConfig = this.ctx.mindMap.themeConfig;
		let defaultConfig = null;
		let useRoot = false;
		if (root) {
			useRoot = true;
			defaultConfig = themeConfig;
		} else if (this.ctx.isGeneralization) defaultConfig = themeConfig.generalization;
		else if (this.ctx.layerIndex === 0) defaultConfig = themeConfig.root;
		else if (this.ctx.layerIndex === 1) defaultConfig = themeConfig.second;
		else defaultConfig = themeConfig.node;
		let value = "";
		if (this.getSelfStyle(prop) !== void 0) value = this.getSelfStyle(prop);
		else if (defaultConfig[prop] !== void 0) value = defaultConfig[prop];
		else value = themeConfig[prop];
		if (!useRoot) this.addToEffectiveStyles({ [prop]: value });
		return value;
	}
	getStyle(prop, root) {
		return this.merge(prop, root);
	}
	getSelfStyle(prop) {
		return this.ctx.getData(prop);
	}
	addToEffectiveStyles(styles) {
		this.ctx.effectiveStyles = {
			...this.ctx.effectiveStyles,
			...styles
		};
	}
	rect(node) {
		this.shape(node);
		node.radius(this.merge("borderRadius"));
	}
	shape(node) {
		const styles = {
			gradientStyle: this.merge("gradientStyle"),
			startColor: this.merge("startColor"),
			endColor: this.merge("endColor"),
			startDir: this.merge("startDir"),
			endDir: this.merge("endDir"),
			fillColor: this.merge("fillColor"),
			borderColor: this.merge("borderColor"),
			borderWidth: this.merge("borderWidth"),
			borderDasharray: this.merge("borderDasharray")
		};
		if (styles.gradientStyle) {
			if (!this._gradient) this._gradient = this.ctx.nodeDraw.gradient("linear");
			this._gradient.update((add) => {
				add.stop(0, styles.startColor);
				add.stop(1, styles.endColor);
			});
			this._gradient.from(...styles.startDir).to(...styles.endDir);
			node.fill(this._gradient);
		} else node.fill({ color: styles.fillColor });
		node.stroke({
			color: styles.borderColor,
			width: styles.borderWidth,
			dasharray: styles.borderDasharray
		});
	}
	text(node) {
		const styles = {
			color: this.merge("color"),
			fontFamily: this.merge("fontFamily"),
			fontSize: this.merge("fontSize"),
			fontWeight: this.merge("fontWeight"),
			fontStyle: this.merge("fontStyle"),
			textDecoration: this.merge("textDecoration")
		};
		node.fill({ color: styles.color }).css({
			"font-family": styles.fontFamily,
			"font-size": styles.fontSize + "px",
			"font-weight": styles.fontWeight,
			"font-style": styles.fontStyle,
			"text-decoration": styles.textDecoration
		});
	}
	domText(node, fontSizeScale = 1) {
		const styles = {
			color: this.merge("color"),
			fontFamily: this.merge("fontFamily"),
			fontSize: this.merge("fontSize"),
			fontWeight: this.merge("fontWeight"),
			fontStyle: this.merge("fontStyle"),
			textDecoration: this.merge("textDecoration"),
			textAlign: this.merge("textAlign")
		};
		node.style.color = styles.color;
		node.style.textDecoration = styles.textDecoration;
		node.style.fontFamily = styles.fontFamily;
		node.style.fontSize = styles.fontSize * fontSizeScale + "px";
		node.style.fontWeight = styles.fontWeight || "normal";
		node.style.fontStyle = styles.fontStyle;
		node.style.textAlign = styles.textAlign;
	}
	tagText(node, style) {
		node.fill({ color: "#fff" }).css({ "font-size": style.fontSize + "px" });
	}
	tagRect(node, style) {
		node.fill({ color: style.fill });
		if (style.radius) node.radius(style.radius);
	}
	iconNode(node, color) {
		node.attr({ fill: color || this.merge("color") });
	}
	line(line, { width, color, dasharray } = {}, enableMarker, childNode) {
		const { customHandleLine } = this.ctx.mindMap.opt;
		if (typeof customHandleLine === "function") customHandleLine(this.ctx, line, {
			width,
			color,
			dasharray
		});
		line.stroke({
			color,
			dasharray,
			width
		}).fill({ color: "none" });
		if (enableMarker) {
			const showMarker = this.merge("showLineMarker", true);
			const childNodeStyle = childNode.style;
			if (showMarker) {
				childNodeStyle._marker = childNodeStyle._marker || childNodeStyle.createMarker();
				childNodeStyle._markerPath.stroke({ color }).fill({ color });
				line.attr("marker-start", "");
				line.attr("marker-end", "");
				const dir = childNodeStyle.merge("lineMarkerDir");
				line.marker(dir, childNodeStyle._marker);
			} else if (childNodeStyle._marker) {
				line.attr("marker-start", "");
				line.attr("marker-end", "");
				childNodeStyle._marker.remove();
				childNodeStyle._marker = null;
			}
		}
	}
	createMarker() {
		return this.ctx.lineDraw.marker(20, 20, (add) => {
			add.ref(8, 5);
			add.size(20, 20);
			add.attr("markerUnits", "userSpaceOnUse");
			add.attr("orient", "auto-start-reverse");
			this._markerPath = add.path("M0,0 L2,5 L0,10 L10,5 Z");
		});
	}
	generalizationLine(node) {
		node.stroke({
			width: this.merge("generalizationLineWidth", true),
			color: this.merge("generalizationLineColor", true)
		}).fill({ color: "none" });
	}
	iconBtn(node, node2, fillNode) {
		let { color, fill, fontSize, fontColor } = this.ctx.mindMap.opt.expandBtnStyle || {
			color: "#808080",
			fill: "#fff",
			fontSize: 12,
			strokeColor: "#333333",
			fontColor: "#333333"
		};
		node.fill({ color });
		node2.fill({ color });
		fillNode.fill({ color: fill });
		if (this.ctx.mindMap.opt.isShowExpandNum) node.attr({
			"font-size": fontSize + "px",
			"font-color": fontColor
		});
	}
	hasCustomStyle() {
		let res = false;
		Object.keys(this.ctx.getData()).forEach((item) => {
			if (checkIsNodeStyleDataKey(item)) res = true;
		});
		return res;
	}
	getCustomStyle() {
		const customStyle = {};
		Object.keys(this.ctx.getData()).forEach((item) => {
			if (checkIsNodeStyleDataKey(item)) customStyle[item] = this.ctx.getData(item);
		});
		return customStyle;
	}
	hoverNode(node) {
		const hoverRectColor = this.merge("hoverRectColor") || this.ctx.mindMap.opt.hoverRectColor;
		const hoverRectRadius = this.merge("hoverRectRadius");
		node.radius(hoverRectRadius).fill("none").stroke({ color: hoverRectColor });
	}
	onRemove() {
		if (this._marker) {
			this._marker.remove();
			this._marker = null;
		}
		if (this._markerPath) {
			this._markerPath.remove();
			this._markerPath = null;
		}
		if (this._gradient) {
			this._gradient.remove();
			this._gradient = null;
		}
	}
};
Style.cacheStyle = null;
//#endregion
//#region node_modules/simple-mind-map/src/core/render/node/Shape.js
var Shape = class {
	constructor(node) {
		this.node = node;
		this.mindMap = node.mindMap;
	}
	getShapePadding(width, height, paddingX, paddingY) {
		const shape = this.node.getShape();
		const defaultPaddingX = 15;
		const defaultPaddingY = 5;
		const actWidth = width + paddingX * 2;
		const actHeight = height + paddingY * 2;
		const actOffset = Math.abs(actWidth - actHeight);
		switch (shape) {
			case CONSTANTS.SHAPE.ROUNDED_RECTANGLE: return {
				paddingX: height > width ? (height - width) / 2 : 0,
				paddingY: 0
			};
			case CONSTANTS.SHAPE.DIAMOND: return {
				paddingX: width / 2,
				paddingY: height / 2
			};
			case CONSTANTS.SHAPE.PARALLELOGRAM: return {
				paddingX: paddingX <= 0 ? defaultPaddingX : 0,
				paddingY: 0
			};
			case CONSTANTS.SHAPE.OUTER_TRIANGULAR_RECTANGLE: return {
				paddingX: paddingX <= 0 ? defaultPaddingX : 0,
				paddingY: 0
			};
			case CONSTANTS.SHAPE.INNER_TRIANGULAR_RECTANGLE: return {
				paddingX: paddingX <= 0 ? defaultPaddingX : 0,
				paddingY: 0
			};
			case CONSTANTS.SHAPE.ELLIPSE: return {
				paddingX: paddingX <= 0 ? defaultPaddingX : 0,
				paddingY: paddingY <= 0 ? defaultPaddingY : 0
			};
			case CONSTANTS.SHAPE.CIRCLE: return {
				paddingX: actHeight > actWidth ? actOffset / 2 : 0,
				paddingY: actHeight < actWidth ? actOffset / 2 : 0
			};
			default: return {
				paddingX: 0,
				paddingY: 0
			};
		}
	}
	createShape() {
		const shape = this.node.getShape();
		let node = null;
		if (shape === CONSTANTS.SHAPE.RECTANGLE) node = this.createRect();
		else if (shape === CONSTANTS.SHAPE.DIAMOND) node = this.createDiamond();
		else if (shape === CONSTANTS.SHAPE.PARALLELOGRAM) node = this.createParallelogram();
		else if (shape === CONSTANTS.SHAPE.ROUNDED_RECTANGLE) node = this.createRoundedRectangle();
		else if (shape === CONSTANTS.SHAPE.OCTAGONAL_RECTANGLE) node = this.createOctagonalRectangle();
		else if (shape === CONSTANTS.SHAPE.OUTER_TRIANGULAR_RECTANGLE) node = this.createOuterTriangularRectangle();
		else if (shape === CONSTANTS.SHAPE.INNER_TRIANGULAR_RECTANGLE) node = this.createInnerTriangularRectangle();
		else if (shape === CONSTANTS.SHAPE.ELLIPSE) node = this.createEllipse();
		else if (shape === CONSTANTS.SHAPE.CIRCLE) node = this.createCircle();
		return node;
	}
	getNodeSize() {
		const borderWidth = this.node.getBorderWidth();
		let { width, height } = this.node;
		width -= borderWidth;
		height -= borderWidth;
		return {
			width,
			height
		};
	}
	createPath(pathStr) {
		const { customCreateNodePath } = this.mindMap.opt;
		if (customCreateNodePath) return SVG(customCreateNodePath(pathStr));
		return new Path().plot(pathStr);
	}
	createPolygon(points) {
		const { customCreateNodePolygon } = this.mindMap.opt;
		if (customCreateNodePolygon) return SVG(customCreateNodePolygon(points));
		return new Polygon().plot(points);
	}
	createRect() {
		let { width, height } = this.getNodeSize();
		let borderRadius = this.node.style.merge("borderRadius");
		const pathStr = `
      M${borderRadius},0
      L${width - borderRadius},0
      C${width - borderRadius},0 ${width},0 ${width},${borderRadius}
      L${width},${height - borderRadius}
      C${width},${height - borderRadius} ${width},${height} ${width - borderRadius},${height}
      L${borderRadius},${height}
      C${borderRadius},${height} 0,${height} 0,${height - borderRadius}
      L0,${borderRadius}
      C0,${borderRadius} 0,0 ${borderRadius},0
      Z
    `;
		return this.createPath(pathStr);
	}
	createDiamond() {
		let { width, height } = this.getNodeSize();
		let halfWidth = width / 2;
		let halfHeight = height / 2;
		const points = [
			[halfWidth, 0],
			[width, halfHeight],
			[halfWidth, height],
			[0, halfHeight]
		];
		return this.createPolygon(points);
	}
	createParallelogram() {
		let { paddingX } = this.node.getPaddingVale();
		paddingX = paddingX || this.node.shapePadding.paddingX;
		let { width, height } = this.getNodeSize();
		const points = [
			[paddingX, 0],
			[width, 0],
			[width - paddingX, height],
			[0, height]
		];
		return this.createPolygon(points);
	}
	createRoundedRectangle() {
		let { width, height } = this.getNodeSize();
		let halfHeight = height / 2;
		const pathStr = `
      M${halfHeight},0
      L${width - halfHeight},0
      A${height / 2},${height / 2} 0 0,1 ${width - halfHeight},${height} 
      L${halfHeight},${height}
      A${height / 2},${height / 2} 0 0,1 ${halfHeight},0
    `;
		return this.createPath(pathStr);
	}
	createOctagonalRectangle() {
		let w = 5;
		let { width, height } = this.getNodeSize();
		const points = [
			[0, w],
			[w, 0],
			[width - w, 0],
			[width, w],
			[width, height - w],
			[width - w, height],
			[w, height],
			[0, height - w]
		];
		return this.createPolygon(points);
	}
	createOuterTriangularRectangle() {
		let { paddingX } = this.node.getPaddingVale();
		paddingX = paddingX || this.node.shapePadding.paddingX;
		let { width, height } = this.getNodeSize();
		const points = [
			[paddingX, 0],
			[width - paddingX, 0],
			[width, height / 2],
			[width - paddingX, height],
			[paddingX, height],
			[0, height / 2]
		];
		return this.createPolygon(points);
	}
	createInnerTriangularRectangle() {
		let { paddingX } = this.node.getPaddingVale();
		paddingX = paddingX || this.node.shapePadding.paddingX;
		let { width, height } = this.getNodeSize();
		const points = [
			[0, 0],
			[width, 0],
			[width - paddingX / 2, height / 2],
			[width, height],
			[0, height],
			[paddingX / 2, height / 2]
		];
		return this.createPolygon(points);
	}
	createEllipse() {
		let { width, height } = this.getNodeSize();
		let halfWidth = width / 2;
		let halfHeight = height / 2;
		const pathStr = `
      M${halfWidth},0
      A${halfWidth},${halfHeight} 0 0,1 ${halfWidth},${height} 
      M${halfWidth},${height} 
      A${halfWidth},${halfHeight} 0 0,1 ${halfWidth},0 
    `;
		return this.createPath(pathStr);
	}
	createCircle() {
		let { width, height } = this.getNodeSize();
		let halfWidth = width / 2;
		let halfHeight = height / 2;
		const pathStr = `
      M${halfWidth},0
      A${halfWidth},${halfHeight} 0 0,1 ${halfWidth},${height} 
      M${halfWidth},${height} 
      A${halfWidth},${halfHeight} 0 0,1 ${halfWidth},0 
    `;
		return this.createPath(pathStr);
	}
};
var shapeList = [
	CONSTANTS.SHAPE.RECTANGLE,
	CONSTANTS.SHAPE.DIAMOND,
	CONSTANTS.SHAPE.PARALLELOGRAM,
	CONSTANTS.SHAPE.ROUNDED_RECTANGLE,
	CONSTANTS.SHAPE.OCTAGONAL_RECTANGLE,
	CONSTANTS.SHAPE.OUTER_TRIANGULAR_RECTANGLE,
	CONSTANTS.SHAPE.INNER_TRIANGULAR_RECTANGLE,
	CONSTANTS.SHAPE.ELLIPSE,
	CONSTANTS.SHAPE.CIRCLE
];
//#endregion
//#region node_modules/simple-mind-map/src/core/render/node/nodeGeneralization.js
function formatGetGeneralization() {
	const data = this.getData("generalization");
	return Array.isArray(data) ? data : data ? [data] : [];
}
function checkHasGeneralization() {
	return this.formatGetGeneralization().length > 0;
}
function checkHasSelfGeneralization() {
	return !!this.formatGetGeneralization().find((item) => {
		return !item.range || item.range.length <= 0;
	});
}
function getGeneralizationNodeIndex(node) {
	return this._generalizationList.findIndex((item) => {
		return item.generalizationNode.uid === node.uid;
	});
}
function createGeneralizationNode() {
	if (this.isGeneralization || !this.checkHasGeneralization()) return;
	let maxWidth = 0;
	let maxHeight = 0;
	this.formatGetGeneralization().forEach((item, index) => {
		let cur = this._generalizationList[index];
		if (!cur) cur = this._generalizationList[index] = {};
		cur.node = this;
		cur.range = item.range;
		if (!cur.generalizationLine) cur.generalizationLine = this.lineDraw.path();
		if (!cur.generalizationNode) cur.generalizationNode = new MindMapNode({
			data: {
				inserting: item.inserting,
				data: item
			},
			uid: createUid(),
			renderer: this.renderer,
			mindMap: this.mindMap,
			isGeneralization: true
		});
		delete item.inserting;
		cur.generalizationNode.generalizationBelongNode = this;
		if (cur.generalizationNode.width > maxWidth) maxWidth = cur.generalizationNode.width;
		if (cur.generalizationNode.height > maxHeight) maxHeight = cur.generalizationNode.height;
		if (item.isActive) this.renderer.addNodeToActiveList(cur.generalizationNode);
	});
	this._generalizationNodeWidth = maxWidth;
	this._generalizationNodeHeight = maxHeight;
}
function updateGeneralization() {
	if (this.isGeneralization) return;
	this.removeGeneralization();
	this.createGeneralizationNode();
}
function renderGeneralization(forceRender) {
	if (this.isGeneralization) return;
	this.updateGeneralizationData();
	const list = this.formatGetGeneralization();
	if (list.length <= 0 || this.getData("expand") === false) {
		this.removeGeneralization();
		return;
	}
	if (list.length !== this._generalizationList.length) this.removeGeneralization();
	this.createGeneralizationNode();
	this.renderer.layout.renderGeneralization(this._generalizationList);
	this._generalizationList.forEach((item) => {
		this.style.generalizationLine(item.generalizationLine);
		item.generalizationNode.render(() => {}, forceRender);
	});
}
function updateGeneralizationData() {
	const childrenLength = this.getChildrenLength();
	const list = this.formatGetGeneralization();
	const newList = [];
	list.forEach((item) => {
		if (!item.range) {
			newList.push(item);
			return;
		}
		if (item.range.length > 0 && item.range[0] <= childrenLength - 1 && item.range[1] <= childrenLength - 1) newList.push(item);
	});
	if (newList.length !== list.length) this.setData({ generalization: newList });
}
function removeGeneralization() {
	if (this.isGeneralization) return;
	this._generalizationList.forEach((item) => {
		item.generalizationNode.style.onRemove();
		if (item.generalizationLine) {
			item.generalizationLine.remove();
			item.generalizationLine = null;
		}
		if (item.generalizationNode) {
			this.renderer.removeNodeFromActiveList(item.generalizationNode);
			item.generalizationNode.remove();
			item.generalizationNode = null;
		}
	});
	this._generalizationList = [];
	if (this.generalizationBelongNode) this.nodeDraw.find(".generalization_" + this.generalizationBelongNode.uid).remove();
}
function hideGeneralization() {
	if (this.isGeneralization) return;
	this._generalizationList.forEach((item) => {
		if (item.generalizationLine) item.generalizationLine.hide();
		if (item.generalizationNode) item.generalizationNode.hide();
	});
}
function showGeneralization() {
	if (this.isGeneralization) return;
	this._generalizationList.forEach((item) => {
		if (item.generalizationLine) item.generalizationLine.show();
		if (item.generalizationNode) item.generalizationNode.show();
	});
}
function setGeneralizationOpacity(val) {
	this._generalizationList.forEach((item) => {
		item.generalizationLine.opacity(val);
		item.generalizationNode.group.opacity(val);
	});
}
function handleGeneralizationMouseenter() {
	const belongNode = this.generalizationBelongNode;
	const generalizationData = belongNode.formatGetGeneralization()[belongNode.getGeneralizationNodeIndex(this)];
	const color = this.getStyle("hoverRectColor") || this.mindMap.opt.hoverRectColor;
	const style = color ? { stroke: color } : null;
	if (Array.isArray(generalizationData.range) && generalizationData.range.length > 0) this.mindMap.renderer.highlightNode(belongNode, generalizationData.range, style);
	else this.mindMap.renderer.highlightNode(belongNode, null, style);
}
function handleGeneralizationMouseleave() {
	this.mindMap.renderer.closeHighlightNode();
}
var nodeGeneralization_default = {
	formatGetGeneralization,
	checkHasGeneralization,
	checkHasSelfGeneralization,
	getGeneralizationNodeIndex,
	createGeneralizationNode,
	updateGeneralization,
	updateGeneralizationData,
	renderGeneralization,
	removeGeneralization,
	hideGeneralization,
	showGeneralization,
	setGeneralizationOpacity,
	handleGeneralizationMouseenter,
	handleGeneralizationMouseleave
};
var btns_default = {
	open: `<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200"><path d="M475.136 327.168v147.968h-147.968v74.24h147.968v147.968h74.24v-147.968h147.968v-74.24h-147.968v-147.968h-74.24z m36.864-222.208c225.28 0 407.04 181.76 407.04 407.04s-181.76 407.04-407.04 407.04-407.04-181.76-407.04-407.04 181.76-407.04 407.04-407.04z m0-74.24c-265.216 0-480.768 215.552-480.768 480.768s215.552 480.768 480.768 480.768 480.768-215.552 480.768-480.768-215.552-480.768-480.768-480.768z"></path></svg>`,
	close: `<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200"><path d="M512 105.472c225.28 0 407.04 181.76 407.04 407.04s-181.76 407.04-407.04 407.04-407.04-181.76-407.04-407.04 181.76-407.04 407.04-407.04z m0-74.24c-265.216 0-480.768 215.552-480.768 480.768s215.552 480.768 480.768 480.768 480.768-215.552 480.768-480.768-215.552-480.768-480.768-480.768z"></path><path d="M252.928 474.624h518.144v74.24h-518.144z"></path></svg>`,
	remove: `<svg width="14px" height="14px" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200"><path fill="#ffffff" d="M512 105.472c225.28 0 407.04 181.76 407.04 407.04s-181.76 407.04-407.04 407.04-407.04-181.76-407.04-407.04 181.76-407.04 407.04-407.04z m0-74.24c-265.216 0-480.768 215.552-480.768 480.768s215.552 480.768 480.768 480.768 480.768-215.552 480.768-480.768-215.552-480.768-480.768-480.768z"></path><path fill="#ffffff" d="M252.928 474.624h518.144v74.24h-518.144z"></path></svg>`,
	imgAdjust: `<svg width="12px" height="12px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path fill="#ffffff" d="M1008.128 614.4a25.6 25.6 0 0 0-27.648 5.632l-142.848 142.848L259.072 186.88 401.92 43.52A25.6 25.6 0 0 0 384 0h-358.4a25.6 25.6 0 0 0-25.6 25.6v358.4a25.6 25.6 0 0 0 43.52 17.92l143.36-142.848 578.048 578.048-142.848 142.848a25.6 25.6 0 0 0 17.92 43.52h358.4a25.6 25.6 0 0 0 25.6-25.6v-358.4a25.6 25.6 0 0 0-15.872-25.088z"  /></svg>`,
	quickCreateChild: `<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M514.048 62.464q93.184 0 175.616 35.328t143.872 96.768 96.768 143.872 35.328 175.616q0 94.208-35.328 176.128t-96.768 143.36-143.872 96.768-175.616 35.328q-94.208 0-176.64-35.328t-143.872-96.768-96.768-143.36-35.328-176.128q0-93.184 35.328-175.616t96.768-143.872 143.872-96.768 176.64-35.328zM772.096 576.512q26.624 0 45.056-18.944t18.432-45.568-18.432-45.056-45.056-18.432l-192.512 0 0-192.512q0-26.624-18.944-45.568t-45.568-18.944-45.056 18.944-18.432 45.568l0 192.512-192.512 0q-26.624 0-45.056 18.432t-18.432 45.056 18.432 45.568 45.056 18.944l192.512 0 0 191.488q0 26.624 18.432 45.568t45.056 18.944 45.568-18.944 18.944-45.568l0-191.488 192.512 0z"></path></svg>`
};
//#endregion
//#region node_modules/simple-mind-map/src/core/render/node/nodeExpandBtn.js
function createExpandNodeContent() {
	if (this._openExpandNode) return;
	const { expandBtnSize, expandBtnIcon, isShowExpandNum } = this.mindMap.opt;
	let { close, open } = expandBtnIcon || {};
	if (isShowExpandNum) {
		this._openExpandNode = new Text();
		this._openExpandNode.addClass("smm-expand-btn-text");
		this._openExpandNode.attr({
			"text-anchor": "middle",
			"dominant-baseline": "middle",
			x: expandBtnSize / 2,
			y: 2
		});
	} else {
		this._openExpandNode = SVG(open || btns_default.open).size(expandBtnSize, expandBtnSize);
		this._openExpandNode.x(0).y(-expandBtnSize / 2);
	}
	this._closeExpandNode = SVG(close || btns_default.close).size(expandBtnSize, expandBtnSize);
	this._closeExpandNode.x(0).y(-expandBtnSize / 2);
	this._fillExpandNode = new Circle().size(expandBtnSize);
	this._fillExpandNode.x(0).y(-expandBtnSize / 2);
	this.style.iconBtn(this._openExpandNode, this._closeExpandNode, this._fillExpandNode);
}
function sumNode(data = []) {
	return data.reduce((total, cur) => total + this.sumNode(cur.children || []), data.length);
}
function updateExpandBtnNode() {
	let { expand } = this.getData();
	if (expand === this._lastExpandBtnType) return;
	if (this._expandBtn) this._expandBtn.clear();
	this.createExpandNodeContent();
	let node;
	if (expand === false) {
		node = this._openExpandNode;
		this._lastExpandBtnType = false;
	} else {
		node = this._closeExpandNode;
		this._lastExpandBtnType = true;
	}
	if (this._expandBtn) {
		let { isShowExpandNum, expandBtnStyle, expandBtnNumHandler } = this.mindMap.opt;
		if (isShowExpandNum) if (!expand) {
			this._fillExpandNode.stroke({ color: expandBtnStyle.strokeColor });
			let count = this.sumNode(this.nodeData.children || []);
			if (typeof expandBtnNumHandler === "function") {
				const res = expandBtnNumHandler(count, this);
				if (!isUndef(res)) count = res;
			}
			node.text(String(count));
		} else this._fillExpandNode.stroke("none");
		this._expandBtn.add(this._fillExpandNode).add(node);
	}
}
function updateExpandBtnPos() {
	if (!this._expandBtn) return;
	this.renderer.layout.renderExpandBtn(this, this._expandBtn);
}
function renderExpandBtn() {
	if (this.getChildrenLength() <= 0 || this.isRoot) return;
	if (this._expandBtn) this.group.add(this._expandBtn);
	else {
		this._expandBtn = new G();
		this._expandBtn.on("mouseover", (e) => {
			e.stopPropagation();
			this._expandBtn.css({ cursor: "pointer" });
		});
		this._expandBtn.on("mouseout", (e) => {
			e.stopPropagation();
			this._expandBtn.css({ cursor: "auto" });
		});
		this._expandBtn.on("click", (e) => {
			e.stopPropagation();
			this.mindMap.execCommand("SET_NODE_EXPAND", this, !this.getData("expand"));
			this.mindMap.emit("expand_btn_click", this);
		});
		this._expandBtn.on("dblclick", (e) => {
			e.stopPropagation();
		});
		this._expandBtn.addClass("smm-expand-btn");
		this.group.add(this._expandBtn);
	}
	this._showExpandBtn = true;
	this.updateExpandBtnNode();
	this.updateExpandBtnPos();
}
function removeExpandBtn() {
	if (this._expandBtn && this._showExpandBtn) {
		this._expandBtn.remove();
		this._showExpandBtn = false;
	}
}
function showExpandBtn() {
	const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
	if (alwaysShowExpandBtn || notShowExpandBtn) return;
	setTimeout(() => {
		this.renderExpandBtn();
	}, 0);
}
function hideExpandBtn() {
	const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
	if (alwaysShowExpandBtn || this._isMouseenter || notShowExpandBtn) return;
	let { isActive, expand } = this.getData();
	if (!isActive && expand) setTimeout(() => {
		this.removeExpandBtn();
	}, 0);
}
var nodeExpandBtn_default = {
	createExpandNodeContent,
	updateExpandBtnNode,
	updateExpandBtnPos,
	renderExpandBtn,
	removeExpandBtn,
	showExpandBtn,
	hideExpandBtn,
	sumNode
};
//#endregion
//#region node_modules/simple-mind-map/src/core/render/node/nodeCommandWraps.js
function setData(data = {}) {
	this.mindMap.execCommand("SET_NODE_DATA", this, data);
}
function setText(text, richText, resetRichText) {
	this.mindMap.execCommand("SET_NODE_TEXT", this, text, richText, resetRichText);
}
function setImage(imgData) {
	this.mindMap.execCommand("SET_NODE_IMAGE", this, imgData);
}
function setIcon(icons) {
	this.mindMap.execCommand("SET_NODE_ICON", this, icons);
}
function setHyperlink(link, title) {
	this.mindMap.execCommand("SET_NODE_HYPERLINK", this, link, title);
}
function setNote(note) {
	this.mindMap.execCommand("SET_NODE_NOTE", this, note);
}
function setAttachment(url, name) {
	this.mindMap.execCommand("SET_NODE_ATTACHMENT", this, url, name);
}
function setTag(tag) {
	this.mindMap.execCommand("SET_NODE_TAG", this, tag);
}
function setShape(shape) {
	this.mindMap.execCommand("SET_NODE_SHAPE", this, shape);
}
function setStyle(prop, value) {
	this.mindMap.execCommand("SET_NODE_STYLE", this, prop, value);
}
function setStyles(style) {
	this.mindMap.execCommand("SET_NODE_STYLES", this, style);
}
var nodeCommandWraps_default = {
	setData,
	setText,
	setImage,
	setIcon,
	setHyperlink,
	setNote,
	setAttachment,
	setTag,
	setShape,
	setStyle,
	setStyles
};
//#endregion
//#region node_modules/simple-mind-map/src/svg/icons.js
var hyperlink = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 1024 1024\" ><path d=\"M435.484444 251.733333v68.892445L295.822222 320.682667a168.504889 168.504889 0 0 0-2.844444 336.952889h142.506666v68.892444H295.822222a237.397333 237.397333 0 0 1 0-474.794667h139.662222z m248.945778 0a237.397333 237.397333 0 0 1 0 474.851556H544.654222v-69.006222l139.776 0.056889a168.504889 168.504889 0 0 0 2.844445-336.952889H544.597333V251.676444h139.776z m-25.827555 203.946667a34.474667 34.474667 0 0 1 0 68.892444H321.649778a34.474667 34.474667 0 0 1 0-68.892444h336.952889z\" ></path></svg>";
var note = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 1024 1024\" ><path d=\"M152.768 985.984 152.768 49.856l434.56 0 66.816 0 234.048 267.392 0 66.816 0 601.92L152.768 985.984 152.768 985.984zM654.144 193.088l0 124.16 108.736 0L654.144 193.088 654.144 193.088zM821.312 384.064l-167.168 0L587.328 384.064 587.328 317.312 587.328 116.736 219.584 116.736 219.584 919.04l601.728 0L821.312 384.064 821.312 384.064zM386.688 517.888 319.808 517.888 319.808 450.944l66.816 0L386.624 517.888 386.688 517.888zM386.688 651.584 319.808 651.584 319.808 584.704l66.816 0L386.624 651.584 386.688 651.584zM386.688 785.344 319.808 785.344l0-66.88 66.816 0L386.624 785.344 386.688 785.344zM721.024 517.888 453.632 517.888 453.632 450.944l267.392 0L721.024 517.888 721.024 517.888zM654.144 651.584 453.632 651.584 453.632 584.704l200.512 0L654.144 651.584 654.144 651.584zM620.672 785.344l-167.04 0 0-66.88 167.04 0L620.672 785.344 620.672 785.344z\" ></path></svg>";
var attachment = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 1024 1024\" width=\"128\" height=\"128\"><path d=\"M516.373333 375.978667l136.576-136.576a147.797333 147.797333 0 0 1 208.853334-0.021334 147.690667 147.690667 0 0 1-0.042667 208.832l-204.8 204.778667v0.021333l-153.621333 153.6c-85.973333 85.973333-225.28 85.973333-311.253334 0.021334-85.994667-85.973333-85.973333-225.216 0.149334-311.36L431.146667 256.362667a21.333333 21.333333 0 0 0-30.165334-30.165334L162.069333 465.066667c-102.805333 102.826667-102.826667 269.056-0.149333 371.733333 102.613333 102.613333 268.970667 102.613333 371.584 0l153.6-153.642667h0.021333l0.021334-0.021333 204.778666-204.778667c74.325333-74.325333 74.346667-194.858667 0.021334-269.184-74.24-74.24-194.88-74.24-269.162667 0.042667l-136.576 136.554667-187.626667 187.626666a117.845333 117.845333 0 0 0-0.106666 166.826667 118.037333 118.037333 0 0 0 166.826666-0.106667l255.850667-255.829333a21.333333 21.333333 0 0 0-30.165333-30.165333L435.136 669.973333a75.370667 75.370667 0 0 1-106.496 0.106667 75.178667 75.178667 0 0 1 0.128-106.496l187.605333-187.605333z\" ></path></svg>";
var nodeIconList = [
	{
		name: "优先级图标",
		type: "priority",
		list: [
			{
				name: "1",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512.042667 1024C229.248 1024 0 794.794667 0 511.957333 0 229.205333 229.248 0 512.042667 0 794.752 0 1024 229.205333 1024 511.957333 1024 794.794667 794.752 1024 512.042667 1024z" fill="#E93B30"></path><path d="M580.309333 256h-75.52c-10.666667 29.824-30.165333 55.765333-58.709333 78.165333-28.416 22.314667-54.869333 37.418667-79.146667 45.397334v84.608a320 320 0 0 0 120.234667-70.698667v352.085333H580.266667V256z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "2",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M511.957333 1024C229.248 1024 0 794.752 0 512S229.248 0 511.957333 0C794.752 0 1024 229.248 1024 512s-229.248 512-512.042667 512z" fill="#FA8D2E"></path><path d="M667.946667 658.602667h-185.301334c4.864-8.533333 11.178667-17.066667 19.072-25.984 7.808-8.874667 26.453333-26.837333 55.936-53.888 29.525333-27.008 49.877333-47.786667 61.226667-62.165334 16.981333-21.717333 29.44-42.453333 37.290667-62.293333 7.808-19.84 11.776-40.746667 11.776-62.677333 0-38.570667-13.738667-70.741333-41.088-96.725334C599.466667 268.928 561.706667 256 513.834667 256c-43.690667 0-80.128 11.136-109.354667 33.578667-29.098667 22.4-46.506667 59.306667-52.010667 110.805333l93.184 9.301333c1.792-27.349333 8.405333-46.890667 19.754667-58.624 11.434667-11.776 26.837333-17.664 46.165333-17.664 19.541333 0 34.858667 5.589333 45.909334 16.768 11.136 11.264 16.682667 27.221333 16.682666 48.042667 0 18.858667-6.4 37.930667-19.242666 57.258667-9.472 14.037333-35.157333 40.533333-77.098667 79.872-52.096 48.554667-87.04 87.509333-104.704 116.821333A226.688 226.688 0 0 0 341.333333 745.429333h326.613334v-86.826666z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "3",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.752 0 512 0z" fill="#2E66FA"></path><path d="M627.754667 731.733333c-29.354667 25.088-66.901333 37.632-112.725334 37.632-44.928 0-81.792-11.52-110.592-34.773333-33.066667-26.538667-49.877333-64.469333-50.304-114.133333h92.16c0.426667 21.76 7.552 38.314667 21.333334 49.664 12.288 10.88 28.117333 16.341333 47.402666 16.341333 20.309333 0 36.778667-6.101333 49.322667-18.432 12.544-12.330667 18.773333-29.568 18.773333-51.797333 0-21.290667-6.229333-38.186667-18.773333-50.773334-12.544-12.501333-29.866667-18.773333-52.138667-18.773333h-13.525333v-80.042667H512c42.112 0 63.274667-21.034667 63.274667-63.146666 0-20.309333-5.888-36.096-17.706667-47.445334a60.757333 60.757333 0 0 0-43.818667-17.066666c-17.493333 0-32 5.504-43.434666 16.298666-11.562667 10.88-17.792 25.728-18.773334 44.714667H359.68c0.981333-43.946667 16.042667-78.976 45.397333-104.96 29.354667-25.941333 65.706667-39.04 109.226667-39.04 44.928 0 81.792 13.525333 110.592 40.490667 28.8 26.922667 43.306667 61.610667 43.306667 104.149333 0 48.213333-19.413333 82.688-58.154667 103.552 43.52 23.125333 65.28 61.44 65.28 114.858667 0 48.128-15.957333 85.76-47.573333 112.682666z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "4",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512.042667 1024C229.248 1024 0 794.794667 0 512.042667 0 229.205333 229.248 0 512.042667 0 794.752 0 1024 229.205333 1024 512.042667 1024 794.794667 794.752 1024 512.042667 1024z" fill="#6D768D"></path><path d="M600.96 256v309.802667h60.117333v81.536h-60.16v98.218666h-90.154666v-98.218666H311.466667v-81.237334L522.666667 256h78.293333zM510.72 399.104l-112.042667 166.698667h112.042667V399.104z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "5",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512.042667 1024C229.248 1024 0 794.794667 0 512.042667 0 229.205333 229.248 0 512.042667 0 794.752 0 1024 229.205333 1024 512.042667 1024 794.794667 794.752 1024 512.042667 1024z" fill="#6D768D"></path><path d="M470.912 343.552h175.786667V256H400.256l-47.786667 253.952 75.434667 10.837333c21.205333-23.552 45.269333-35.413333 72.021333-35.413333 21.546667 0 38.997333 7.509333 52.437334 22.4 13.312 15.018667 20.053333 37.418667 20.053333 67.328 0 31.872-6.741333 55.765333-20.181333 71.552-13.397333 15.872-29.866667 23.765333-49.237334 23.765333-17.066667 0-32.085333-6.186667-45.013333-18.432-13.013333-12.373333-20.821333-29.013333-23.466667-50.133333L341.333333 611.498667c5.546667 40.874667 22.485333 73.429333 50.730667 97.621333 28.330667 24.32 64.938667 36.437333 109.866667 36.437333 56.149333 0 100.053333-21.546667 131.754666-64.554666a176.64 176.64 0 0 0 34.816-107.52c0-48.042667-14.378667-87.210667-43.221333-117.333334-28.8-30.208-63.957333-45.312-105.514667-45.312-21.674667 0-42.922667 5.248-63.829333 15.616l14.976-82.901333z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "6",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 1024C229.248 1024 0 794.794667 0 512.042667 0 229.205333 229.248 0 512 0c282.88 0 512 229.205333 512 512.042667C1024 794.794667 794.88 1024 512 1024z" fill="#6D768D"></path><path d="M519.210667 256c36.992 0 67.626667 10.368 91.776 31.189333 24.192 20.821333 39.68 51.029333 46.293333 90.709334l-90.197333 9.984c-2.176-18.56-7.978667-32.298667-17.28-41.173334-9.258667-8.874667-21.418667-13.226667-36.224-13.226666-19.754667 0-36.437333 8.789333-50.048 26.453333-13.696 17.664-22.314667 54.613333-25.856 110.549333 23.296-27.52 52.138667-41.258667 86.656-41.258666 38.997333 0 72.362667 14.805333 100.181333 44.544 27.733333 29.696 41.685333 68.010667 41.685333 114.858666 0 49.877333-14.634667 89.856-43.818666 119.936-29.226667 30.208-66.730667 45.226667-112.554667 45.226667-49.066667 0-89.429333-19.072-121.130667-57.344C357.12 658.218667 341.333333 595.541333 341.333333 508.416c0-89.344 16.469333-153.813333 49.493334-193.194667C423.722667 275.754667 466.56 256 519.168 256z m-9.472 241.834667c-17.962667 0-33.066667 6.997333-45.525334 21.12-12.330667 14.037333-18.56 34.858667-18.56 62.293333 0 30.421333 6.912 53.76 20.906667 70.4 13.952 16.469333 29.866667 24.746667 47.786667 24.746667 17.28 0 31.701333-6.826667 43.178666-20.309334 11.52-13.525333 17.237333-35.669333 17.237334-66.56 0-31.658667-6.186667-54.869333-18.517334-69.546666a58.197333 58.197333 0 0 0-46.506666-22.144z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "7",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512.042667 1024C229.248 1024 0 794.752 0 512S229.248 0 512.042667 0C794.752 0 1024 229.248 1024 512s-229.248 512-511.957333 512z" fill="#6D768D"></path><path d="M673.024 273.066667H354.133333v86.869333h212.224a691.2 691.2 0 0 0-104.746666 187.989333c-26.026667 70.101333-39.978667 138.88-41.429334 206.293334h89.6c-0.298667-42.922667 6.698667-91.776 21.034667-146.474667a654.72 654.72 0 0 1 62.08-154.965333c27.136-48.554667 53.888-85.76 80.128-111.701334V273.066667z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "8",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 1024C229.248 1024 0 794.752 0 512S229.248 0 512 0s512 229.248 512 512-229.248 512-512 512z" fill="#6D768D"></path><path d="M512.426667 256c46.208 0 82.048 11.861333 107.605333 35.541333 25.6 23.68 38.314667 53.674667 38.314667 89.898667 0 22.613333-5.802667 42.666667-17.578667 60.330667a111.445333 111.445333 0 0 1-49.450667 40.277333c26.965333 10.837333 47.36 26.752 61.312 47.658667 13.994667 20.906667 21.034667 45.013333 21.034667 72.362666 0 45.098667-14.336 81.834667-42.965333 109.952-28.586667 28.245333-66.602667 42.368-114.090667 42.368-44.245333 0-81.066667-11.648-110.464-34.986666-34.645333-27.52-52.010667-65.28-52.010667-113.365334 0-26.368 6.528-50.645333 19.626667-72.746666 13.056-22.144 33.578667-39.210667 61.696-51.242667-24.064-10.154667-41.557333-24.192-52.48-41.941333a109.824 109.824 0 0 1-16.512-58.666667c0-36.224 12.757333-66.218667 37.973333-89.898667 25.386667-23.68 61.354667-35.541333 108.032-35.541333z m1.28 265.429333c-22.784 0-39.722667 7.978667-50.901334 23.893334-11.136 15.786667-16.64 33.066667-16.64 51.498666 0 25.984 6.485333 46.208 19.712 60.714667 13.098667 14.506667 29.525333 21.802667 49.152 21.802667 19.242667 0 35.157333-6.997333 47.786667-20.992 12.629333-13.909333 18.858667-34.048 18.858667-60.416 0-23.082667-6.314667-41.557333-19.2-55.466667a63.274667 63.274667 0 0 0-48.725334-21.034667z m-0.341334-191.488c-17.792 0-32 5.333333-42.581333 16-10.538667 10.666667-15.872 24.746667-15.872 42.325334 0 18.645333 5.248 33.152 15.701333 43.648 10.453333 10.453333 24.362667 15.658667 41.770667 15.658666 17.664 0 31.658667-5.290667 42.24-15.872 10.538667-10.581333 15.872-25.173333 15.872-43.818666 0-17.493333-5.248-31.573333-15.701333-42.154667s-24.277333-15.786667-41.429334-15.786667z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "9",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 1024C229.248 1024 0 794.794667 0 512.042667 0 229.333333 229.248 0 512 0c282.88 0 512 229.333333 512 512.042667C1024 794.794667 794.88 1024 512 1024z" fill="#6D768D"></path><path d="M497.28 256c49.365333 0 89.856 19.157333 121.429333 57.429333 31.701333 38.229333 47.488 101.205333 47.488 188.842667 0 89.173333-16.384 153.386667-49.365333 192.853333-32.853333 39.594667-75.605333 59.264-128.426667 59.264-37.888 0-68.608-10.154667-91.989333-30.506666s-38.4-50.816-45.013333-91.306667l90.112-9.984c2.261333 18.474667 8.021333 32.085333 17.28 41.088 9.173333 8.874667 21.418667 13.312 36.608 13.312 19.2 0 35.541333-8.874667 48.981333-26.752 13.44-17.749333 22.016-54.613333 25.770667-110.549333-23.466667 27.264-52.821333 40.874667-88.064 40.874666-38.314667 0-71.253333-14.72-99.114667-44.330666C355.242667 506.709333 341.333333 468.224 341.333333 420.864c0-49.493333 14.592-89.258667 43.946667-119.466667C414.549333 271.104 451.925333 256 497.237333 256z m-4.352 77.482667c-17.237333 0-31.658667 6.826667-43.008 20.437333-11.477333 13.653333-17.194667 35.84-17.194667 66.816 0 31.402667 6.229333 54.485333 18.645334 69.205333 12.458667 14.72 27.946667 22.101333 46.592 22.101334 18.005333 0 33.066667-7.082667 45.44-21.205334 12.330667-14.208 18.432-35.029333 18.432-62.506666 0-29.994667-6.912-53.376-20.821334-69.973334-13.824-16.597333-29.866667-24.874667-48.085333-24.874666z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "10",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512.042667 1024C229.248 1024 0 794.794667 0 511.957333 0 229.205333 229.248 0 512.042667 0 794.752 0 1024 229.205333 1024 511.957333 1024 794.794667 794.752 1024 512.042667 1024z" fill="#6D768D"></path><path d="M619.946667 273.066667c46.976 0 83.754667 16.042667 110.250666 48.042666 31.573333 37.973333 47.36 100.864 47.36 188.672 0 87.722667-15.829333 150.698667-47.658666 189.056-26.325333 31.616-62.976 47.36-109.952 47.36-47.274667 0-85.418667-17.237333-114.346667-51.968-28.885333-34.602667-43.392-96.426667-43.392-185.386666 0-87.168 15.872-150.016 47.701333-188.416 26.282667-31.488 62.933333-47.36 110.037334-47.36z m-207.488 12.8v452.266666H325.504V411.690667A299.904 299.904 0 0 1 213.333333 476.373333V398.933333c22.656-7.296 47.36-21.12 73.856-41.514666 26.624-20.522667 44.842667-44.288 54.784-71.552h70.485334z m207.488 60.842666c-11.306667 0-21.461333 3.413333-30.336 10.24-8.874667 6.826667-15.786667 19.157333-20.693334 36.864-6.4 22.997333-9.642667 61.653333-9.642666 115.968 0 54.442667 2.944 91.733333 8.661333 112.128 5.802667 20.352 13.098667 33.877333 21.845333 40.618667 8.789333 6.741333 18.858667 10.154667 30.165334 10.154667 11.349333 0 21.376-3.498667 30.250666-10.325334 8.874667-6.826667 15.786667-19.157333 20.693334-36.778666 6.4-22.826667 9.642667-61.354667 9.642666-115.797334 0-54.314667-2.858667-91.648-8.661333-112.042666-5.802667-20.352-13.013333-33.962667-21.76-40.789334a47.616 47.616 0 0 0-30.165333-10.24z" fill="#FFFFFF"></path></svg>`
			}
		]
	},
	{
		name: "进度图标",
		type: "progress",
		list: [
			{
				name: "1",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.752 0 512 0z" fill="#12BB37"></path><path d="M512 928c-229.76 0-416-186.24-416-416S282.24 96 512 96V512l294.144-294.144A414.72 414.72 0 0 1 928 512c0 229.76-186.24 416-416 416z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "2",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.752 0 512 0z" fill="#12BB37"></path><path d="M512 928c-229.76 0-416-186.24-416-416S282.24 96 512 96V512h416c0 229.76-186.24 416-416 416z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "3",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.752 0 512 0z" fill="#12BB37"></path><path d="M512 928c-229.76 0-416-186.24-416-416S282.24 96 512 96V512l294.144 294.144A414.72 414.72 0 0 1 512 928z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "4",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.752 0 512 0z" fill="#12BB37"></path><path d="M512 928c-229.76 0-416-186.24-416-416S282.24 96 512 96v832z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "5",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.752 0 512 0z" fill="#12BB37"></path><path d="M512 512l-294.144 294.144A414.72 414.72 0 0 1 96 512c0-229.76 186.24-416 416-416V512z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "6",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.752 0 512 0z" fill="#12BB37"></path><path d="M512 512H96c0-229.76 186.24-416 416-416V512z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "7",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.752 0 512 0z" fill="#12BB37"></path><path d="M512 512L217.856 217.856A414.72 414.72 0 0 1 512 96V512z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "8",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M0 512c0 282.752 229.248 512 512 512s512-229.248 512-512S794.752 0 512 0 0 229.248 0 512z" fill="#12BB37"></path><path d="M716.629333 341.333333h-51.328a35.072 35.072 0 0 0-28.330666 14.293334l-171.989334 233.984-77.909333-106.026667a35.2 35.2 0 0 0-28.330667-14.293333H307.413333c-7.082667 0-11.264 7.936-7.082666 13.653333l136.32 185.472a35.2 35.2 0 0 0 56.533333 0l230.4-313.429333a8.533333 8.533333 0 0 0-6.954667-13.653334z" fill="#FFFFFF"></path></svg>`
			}
		]
	},
	{
		name: "表情图标",
		type: "expression",
		list: [
			{
				name: "1",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1026 1024"><path d="M1.097856 1.097642h1021.804717v1021.804716H1.097856z" fill="#F09495" ></path><path d="M1024.000214 1024H0.000214V0h1024v1024z m-1021.804716-2.195284h1019.609433V2.195284H2.195498v1019.609432z" fill="#FFFFFF" ></path><path d="M234.695985 335.179887m-27.341259 0a27.341259 27.341259 0 1 0 54.682518 0 27.341259 27.341259 0 1 0-54.682518 0Z" fill="#040000" ></path><path d="M234.695985 363.519002c-15.666342 0-28.339115-12.772559-28.339115-28.339115 0-15.666342 12.772559-28.339115 28.339115-28.339115s28.339115 12.772559 28.339115 28.339115c0.099786 15.666342-12.672773 28.339115-28.339115 28.339115z m0-54.582732c-14.468914 0-26.243617 11.774703-26.243617 26.243617s11.774703 26.243617 26.243617 26.243617 26.243617-11.774703 26.243617-26.243617-11.774703-26.243617-26.243617-26.243617z" fill="#FFFFFF" ></path><path d="M776.232528 335.179887m-27.341259 0a27.341259 27.341259 0 1 0 54.682518 0 27.341259 27.341259 0 1 0-54.682518 0Z" fill="#040000" ></path><path d="M776.232528 363.519002c-15.666342 0-28.339115-12.772559-28.339115-28.339115 0-15.666342 12.772559-28.339115 28.339115-28.339115 15.666342 0 28.339115 12.772559 28.339115 28.339115 0 15.666342-12.772559 28.339115-28.339115 28.339115z m0-54.582732c-14.468914 0-26.243617 11.774703-26.243617 26.243617s11.774703 26.243617 26.243617 26.243617 26.243617-11.774703 26.243617-26.243617c-0.099786-14.468914-11.874488-26.243617-26.243617-26.243617z" fill="#FFFFFF" ></path><path d="M512.000214 671.656987c-52.58702 0-105.872539-17.961411-105.872539-52.387449S459.413194 566.882089 512.000214 566.882089s105.872539 17.961411 105.87254 52.387449S564.587234 671.656987 512.000214 671.656987z m0-74.240499c-21.952836 0-43.207172 3.592282-58.2748 9.77899-13.870201 5.68778-17.06334 11.275775-17.06334 12.07406s3.19314 6.386279 17.06334 12.07406c15.067628 6.186708 36.321965 9.77899 58.2748 9.77899s43.207172-3.592282 58.274801-9.77899c13.870201-5.68778 17.06334-11.275775 17.06334-12.07406s-3.19314-6.386279-17.06334-12.07406c-15.067628-6.286494-36.321965-9.77899-58.274801-9.77899z" fill="#040000" ></path></svg>`
			},
			{
				name: "2",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M0 0h1024v1024H0z" fill="#E6A6C9" ></path><path d="M315.1 368.1c-23.9 0-43.3-19.4-43.3-43.3s19.4-43.3 43.3-43.3 43.3 19.4 43.3 43.3-19.4 43.3-43.3 43.3z m0-74.7c-17.3 0-31.3 14.1-31.3 31.3 0 17.3 14.1 31.3 31.3 31.3 17.3 0 31.3-14.1 31.3-31.3 0-17.2-14-31.3-31.3-31.3zM738.7 368.1c-23.9 0-43.3-19.4-43.3-43.3s19.4-43.3 43.3-43.3 43.3 19.4 43.3 43.3-19.4 43.3-43.3 43.3z m0-74.7c-17.3 0-31.3 14.1-31.3 31.3 0 17.3 14.1 31.3 31.3 31.3 17.3 0 31.3-14.1 31.3-31.3 0-17.2-14-31.3-31.3-31.3zM293.5 698.8l-14.5-1.3c0.1-0.6 1.5-14.6 15.1-27.9 17.2-16.7 45-24.8 82.7-24 4.9-0.1 10.9-10.5 16.1-19.6 8.4-14.7 19-33.1 37.9-34.3 19.4-1.2 42.2 16.4 71.5 55.4 9.9 5.2 16.5 11.2 21.8 16.1 8.4 7.7 13.1 11.9 25.1 10.8 14.9-1.4 38.9-11.1 77.5-31.4 26.8-28.4 56.4-41.4 83.5-36.6 27.9 4.9 50.6 27.6 67.5 67.5l-13.4 5.7c-14.7-34.5-34.3-54.9-56.7-58.8-22.3-3.9-47.6 7.8-71.2 33.1l-0.8 0.9-1.1 0.6c-85.6 45.1-99.4 38-120.2 19.1-5.5-5-11.2-10.2-20.1-14.7l-1.5-0.8-1-1.4c-32.2-43.2-50.4-51.6-60-51-11.1 0.7-18.8 14-26.2 27-7.6 13.2-15.4 26.9-28.8 26.9h-0.2c-78.4-1.6-83 38.3-83 38.7z" fill="#040000" ></path></svg>`
			},
			{
				name: "3",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1026 1024" ><path d="M1.1 1.097642h1021.804716v1021.804716H1.1z" fill="#F7E983" ></path><path d="M1024.002358 1024H0.002358V0h1024v1024z m-1021.804716-2.195284h1019.609433V2.195284H2.197642v1019.609432z" fill="#FFFFFF" ></path><path d="M329.174412 344.491728a38.118106 10.277919 57.6 1 0 17.355867-11.014369 38.118106 10.277919 57.6 1 0-17.355867 11.014369Z" fill="#040000" ></path><path d="M644.769475 355.956059a11.175989 36.321965 30 1 0 36.321965-62.911488 11.175989 36.321965 30 1 0-36.321965 62.911488Z" fill="#040000" ></path><path d="M569.678445 671.158059c-26.343403 0-51.190021-5.288638-70.049503-14.967843-20.755408-10.577275-32.230754-25.445332-32.230755-41.710388 0-16.265056 11.475346-31.133112 32.230755-41.710387 18.859482-9.579419 43.805886-14.967843 70.049503-14.967843s51.190021 5.288638 70.049503 14.967843c20.755408 10.577275 32.230754 25.445332 32.230754 41.710387 0 16.265056-11.475346 31.133112-32.230754 41.710388-18.859482 9.679205-43.805886 14.967843-70.049503 14.967843z m0-95.095693c-49.693237 0-84.318846 20.356266-84.318846 38.517248s34.625609 38.517248 84.318846 38.517248 84.318846-20.356266 84.318846-38.517248-34.725395-38.517248-84.318846-38.517248z" fill="#040000" ></path></svg>`
			},
			{
				name: "4",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1026 1024" ><path d="M1.1 1.097642h1021.804716v1021.804716H1.1z" fill="#A6D9E2" ></path><path d="M1024.002358 1024H0.002358V0h1024v1024z m-1021.804716-2.195284h1019.609433V2.195284H2.197642v1019.609432z" fill="#FFFFFF" ></path><path d="M376.194134 348.950302m-23.44962 0a23.44962 23.44962 0 1 0 46.89924 0 23.44962 23.44962 0 1 0-46.89924 0Z" fill="#040000" ></path><path d="M629.150672 348.950302m-24.647047 0a24.647047 24.647047 0 1 0 49.294095 0 24.647047 24.647047 0 1 0-49.294095 0Z" fill="#040000" ></path><path d="M397.847613 603.503411c13.471058 8.282206 28.738258 14.468914 43.7061 19.458195 29.835899 9.978562 62.266225 14.169558 93.299551 7.483921 21.054765-4.490353 40.213604-14.369129 56.778016-28.039758 6.785422-5.587995-2.893783-15.167414-9.579419-9.579419-46.999026 38.916391-112.258819 31.033327-163.847983 6.086922-4.590138-2.195284-9.080491-4.490353-13.371272-7.184564-7.583707-4.590138-14.468914 7.184564-6.984993 11.774703z" fill="#040000" ></path><path d="M627.753674 534.052621c-31.033327 24.048334-58.474371 68.253362-37.419607 106.970182 10.577275 19.35841 29.835899 32.629897 48.795167 42.708244 7.982849 4.190996 15.067628-7.883064 7.084779-12.07406-25.245761-13.271487-53.485091-35.324108-49.094524-66.557006 2.793997-20.156695 15.766127-37.319821 29.736114-51.190022 3.392711-3.392711 6.984993-6.785422 10.776847-9.77899 2.993569-2.295069 2.394855-7.483921 0-9.878776-2.893783-3.19314-6.885208-2.49464-9.878776-0.199572z" fill="#040000" ></path></svg>`
			},
			{
				name: "5",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1026 1024" ><path d="M1.1 1.097642h1021.804716v1021.804716H1.1z" fill="#AD6F59" ></path><path d="M1024.002358 1024H0.002358V0h1024v1024z m-1021.804716-2.195284h1019.609433V2.195284H2.197642v1019.609432z" fill="#FFFFFF" ></path><path d="M411.829832 330.730879a38.118106 10.277919 57.6 1 0 17.355867-11.014368 38.118106 10.277919 57.6 1 0-17.355867 11.014368Z" fill="#040000" ></path><path d="M480.669675 609.989476c11.774703-25.844475 27.740401-51.788735 44.60417-73.342429 13.770415-17.462483 29.237186-33.92711 47.897096-44.803742 17.262912-10.078347 35.324108-13.67063 54.283376-6.58585 11.974274 4.390567 23.948548 14.468914 33.128825 24.547261 14.369129 15.865913 25.145975 34.625609 34.725394 53.684662 4.290782 8.581563 17.262912 0.997856 12.972131-7.583707-15.167414-30.334828-35.224323-63.763009-66.157864-80.327421-21.054765-11.37556-44.504385-11.475346-66.157864-1.895927-21.054765 9.280062-38.617034 25.644904-53.485091 42.907815-14.468914 16.863769-27.041902 35.324108-38.217891 54.582733-5.887351 10.178133-11.674917 20.555837-16.464627 31.232898-1.696355 3.692068-0.997856 7.982849 2.694212 10.277918 3.19314 1.895927 8.581563 0.898071 10.178133-2.694211z" fill="#040000" ></path><path d="M663.863649 338.091735a14.468914 33.727538 30 1 0 33.727538-58.417811 14.468914 33.727538 30 1 0-33.727538 58.417811Z" fill="#040000" ></path></svg>`
			},
			{
				name: "6",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M762.9 77.4H261.1L10.2 512l250.9 434.6h501.8L1013.8 512z" fill="#83CEE3" ></path><path d="M369 375.8m-34.6 0a34.6 34.6 0 1 0 69.2 0 34.6 34.6 0 1 0-69.2 0Z" fill="#040000" ></path><path d="M369 411.7c-19.8 0-36-16.1-36-36s16.1-36 36-36 36 16.1 36 36-16.1 36-36 36z m0-69.1c-18.3 0-33.2 14.9-33.2 33.2S350.7 409 369 409s33.2-14.9 33.2-33.2-14.9-33.2-33.2-33.2z" fill="#FFFFFF" ></path><path d="M672.2 333.6c-15.1 7.6-30.2 15.6-44.3 25-5.9 3.9-17 10.4-14.6 19.1 1.8 6.5 12 11.2 17.3 14.3 15.7 9.3 32.1 17.6 48.3 25.9 8.6 4.4 16.2-8.5 7.6-13-14.1-7.3-28.3-14.5-42.1-22.3-3.9-2.2-7.9-4.5-11.7-6.9-1.2-0.8-2.4-1.5-3.5-2.4-0.6-0.4-1.1-0.8-1.6-1.2 2.2 1.7-0.3-0.3-0.3-0.3-0.9 0.1-1.5-3.2-0.2 0.5 0.9 2.4 1.1 3.8 0.3 5.8 0.6-1.5-0.9 0.8-0.1 0 0.5-0.5 1-1.1 1.6-1.6 0.5-0.5 1-0.9 1.6-1.3 0.6-0.5 0 0 1.2-0.9 1.7-1.3 3.5-2.5 5.3-3.6 8.4-5.5 17.2-10.4 26-15.2 5.6-3 11.2-6 16.8-8.9 8.6-4.4 1-17.3-7.6-13zM578.2 720.9c-12.5-96.7-33.3-154.7-55.6-155.6-8.8 3.9-22.3 17.5-37.7 60.1-10.8 29.8-18.4 62.2-23 81.6-1.2 5.1-2.1 9.1-2.9 11.8l-9.3-2.4c0.7-2.6 1.6-6.6 2.8-11.6 14.9-63 36-136.8 67.5-148.8l0.8-0.3h0.8c18.2-0.4 33.2 19.5 45.8 60.8 10.2 33.3 16.7 74.6 20.5 103.3l-9.7 1.1z" fill="#040000" ></path></svg>`
			},
			{
				name: "7",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M762.9 77.4H261.1L10.2 512l250.9 434.6h501.8L1013.8 512z" fill="#8CC66D" ></path><path d="M375.778679 404.47473a14.5 33.8 30 1 0 33.8-58.543317 14.5 33.8 30 1 0-33.8 58.543317Z" fill="#040000" ></path><path d="M627.220263 374.211388a43.1 11.6 57.6 1 0 19.588408-12.431182 43.1 11.6 57.6 1 0-19.588408 12.431182Z" fill="#040000" ></path><path d="M451.1 548.5c17.6-9.3 63.9-30 105.3-16.2 17 20.3 32.7 98.8 28.8 138.1-27.5 10.2-82.5 10.2-106.1 5.8-8.3-10.5-32.7-81.8-35.3-114.6-0.4-5.5 2.5-10.6 7.3-13.1z" fill="#040000" ></path></svg>`
			},
			{
				name: "8",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M762.9 77.4H261.1L10.2 512l250.9 434.6h501.8L1013.8 512z" fill="#5A74B8" ></path><path d="M357.7 400m-34.6 0a34.6 34.6 0 1 0 69.2 0 34.6 34.6 0 1 0-69.2 0Z" fill="#040000" ></path><path d="M357.7 436c-19.8 0-36-16.1-36-36s16.1-36 36-36 36 16.1 36 36-16.2 36-36 36z m0-69.2c-18.3 0-33.2 14.9-33.2 33.2s14.9 33.2 33.2 33.2 33.2-14.9 33.2-33.2-14.9-33.2-33.2-33.2z" fill="#FFFFFF" ></path><path d="M676 400m-34.6 0a34.6 34.6 0 1 0 69.2 0 34.6 34.6 0 1 0-69.2 0Z" fill="#040000" ></path><path d="M676 436c-19.8 0-36-16.1-36-36s16.1-36 36-36 36 16.1 36 36-16.2 36-36 36z m0-69.2c-18.3 0-33.2 14.9-33.2 33.2s14.9 33.2 33.2 33.2c18.3 0 33.2-14.9 33.2-33.2s-14.9-33.2-33.2-33.2z" fill="#FFFFFF" ></path><path d="M347.6 684.1c0.3-0.9 0.6-1.7 0.9-2.6 0.2-0.5 1.4-3.2 0.3-0.8 0.6-1.4 1.3-2.9 2-4.3 3.2-6.3 6-10.7 10.9-15.3 4.3-4 10.8-7.5 17.1-6.1 3.9 0.9 7.9 4.9 11.1 7.2 3.1 2.2 6.3 4.5 9.7 6.2 7.5 3.8 15.3 4.4 23.4 1.9 4.7-1.5 9.2-3.6 13.6-5.9 5-2.6 10.7-5 14.2-9.5 4.5-5.7 6.1-8.5 11.4-14.1 1-1 2-2 3.1-3 0.2-0.2 2.2-1.7 0.6-0.5 0.6-0.4 1.2-0.9 1.8-1.3 1-0.6 2.1-1.3 3.2-1.7-2 0.8 0.2 0 0.6-0.1 2.3-0.7-0.3-0.2 1.2-0.3 2.8-0.1 3.6 0 5.5 1 3.8 1.9 6.6 4.7 9.5 7.8 4.5 5 7.5 11.1 11.7 16.2 1.8 2.2 3.7 4.3 5.4 6.5 8.1 10.3 17.7 22.2 32.2 22 8.8-0.1 16.6-5.2 22.6-11.2 4.2-4.1 7.7-8.9 11-13.7 2.9-4.2 4.6-9.9 6.2-13.5 3.2-7.1 7.2-13.1 13-18.1 4.8-4.2 11.1-6.5 16.7-5.3 10.5 2.4 17.2 12.1 23.1 20.2 4.7 6.5 9.8 13 16 18.2 7.8 6.4 17.1 11.4 27.5 11.1 14.1-0.4 25.5-9.5 34.2-19.9 3-3.6 3.6-8.8 0-12.4-3.1-3.1-9.4-3.7-12.4 0-6.3 7.6-14.7 15.9-24.9 14.7-2.2-0.3-5.3-1.5-7.9-3.1-3.5-2.1-6.1-4.4-9.1-7.5-4.9-5.1-6.8-8.1-10.9-13.8-7.3-10.1-16.1-19.6-28.2-23.7-18.5-6.3-35.7 5.6-46 20.1-2.4 3.3-4.4 6.9-6.1 10.6-1.8 3.9-2.7 8.5-5.2 11.9-3.1 4.4-6.2 8.8-10.2 12.5-3 2.8-5.7 4.4-8.6 5.1-0.4 0.1-1.7 0.1 0.1 0h-2.2c2.1 0.1 0 0-0.5-0.1-0.7-0.2-1.4-0.4-2-0.6 1.8 0.7-1.8-1.1-2.4-1.5l-1.2-0.9c1.5 1.2-0.9-0.9-1.2-1.1-4.7-4.3-8.4-9.5-12.3-14.4-10.9-13.6-20.9-34-41-34.9-14.2-0.6-24.5 10.6-32.4 20.8-1.2 1.6-2.5 3.2-3.7 4.8-1.5 1.9 1.1-1.4-0.4 0.5-0.4 0.5-0.8 1.2-1.3 1.6-1.7 1.4-4.6 2.6-6.6 3.6-2.9 1.6-5.9 3.2-9 4.5-1.6 0.7-3.4 1.2-5.1 1.7-2.2 0.6-0.7 0.5-2.8 0.4-2.8 0-3.9-0.4-6.6-1.9-3.9-2.2-7.5-4.9-11.1-7.5-5.6-4-10-6.9-17-7.5-10.5-0.9-20.3 3.2-28.2 9.9-9.4 8.1-16.4 20.2-20.1 32-3.6 11.2 13.3 15.8 16.8 5.1z" fill="#040000" ></path></svg>`
			},
			{
				name: "9",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M762.9 77.4H261.1L10.2 512l250.9 434.6h501.8L1013.8 512z" fill="#F0884F" ></path><path d="M287.2 382c6.4 2.3 11.6-3.7 15.4-7.9 5.1-5.5 10.2-11 16-15.9 0.8-0.7 1.7-1.4 2.5-2.1 1.2-0.9-1.7 1.3 0.2-0.2l1.2-0.9c2.1-1.5 4.3-2.9 6.5-4.3 2-1.2 4-2.2 6.1-3.2 0.6-0.3 1.2-0.6 1.9-0.9-0.3 0.2-1.5 0.6 0.2-0.1 1.3-0.5 2.6-1 4-1.5 11.2-3.7 21.8-4 33.4-1.1 19.5 4.9 36.4 17 51.2 30.2 8.6 7.7 21.4-5 12.7-12.7-25.2-22.6-57.1-42.1-92.2-36.2-20.4 3.4-37.7 16.1-51.6 30.9-2.3 2.4-4.5 5-6.8 7.4-0.7 0.7-1.9 1.5-2.4 2.4-0.5 0.8 2.3-1.5 0.8-0.7 1.3-0.7 3.9-1.4 5.8-0.7-11.1-3.7-15.8 13.7-4.9 17.5zM598 382c6.4 2.3 11.6-3.7 15.4-7.9 5.1-5.5 10.2-11 16-15.9 0.8-0.7 1.7-1.4 2.5-2.1 1.2-0.9-1.7 1.3 0.2-0.2l1.2-0.9c2.1-1.5 4.3-2.9 6.5-4.3 2-1.2 4-2.2 6.1-3.2 0.6-0.3 1.2-0.6 1.9-0.9-0.3 0.2-1.5 0.6 0.2-0.1 1.3-0.5 2.6-1 4-1.5 11.2-3.7 21.8-4 33.4-1.1 19.5 4.9 36.4 17 51.2 30.2 8.6 7.7 21.4-5 12.7-12.7-25.2-22.6-57.1-42.1-92.2-36.2-20.4 3.4-37.7 16.1-51.6 30.9-2.3 2.4-4.5 5-6.8 7.4-0.7 0.7-1.9 1.5-2.4 2.4-0.5 0.8 2.3-1.5 0.8-0.7 1.3-0.7 3.9-1.4 5.8-0.7-11.1-3.7-15.8 13.7-4.9 17.5zM505.9 527.1c3.4 0.7 6.8 1.7 10.2 2.8 6.7 2.2 10.4 3.5 16.6 7.7 1.6 1.1-0.5-0.5 0.6 0.5 0.6 0.5 1.1 1.1 1.7 1.6 1.5 1.4-0.1-0.4 0.5 0.6 0.4 0.6 0.7 1.2 1 1.8-1-2 0.1 0 0 0.5 0.1-2-0.1 0-0.1 0-0.1 0.8 0 0.7 0.1-0.5-0.1 0.4-0.1 0.7-0.3 1.1-0.6 1 0.7-0.9-0.4 1-1.6 2.5-4.6 5.4-8.1 7.8-6.8 4.6-14.4 8.2-22 11.4-7 3-7.4 11.9 0 14.8 7.4 2.8 15 5.3 22.4 8.1 3.1 1.1 4.2 1.5 6.9 2.9 1.1 0.6 2.1 1.2 3.2 1.8 1.2 0.8-0.7-0.5 0.1 0 0.4 0.3 0.8 0.7 1.1 1.1 0.6 0.8-1.1-1.2-0.2-0.2 0.8 0.9-0.3-1.4-0.1-0.2 0.1 0.9 0.2-1.9 0-0.9-0.1 0.5-0.8 1.8 0 0.2-0.2 0.5-0.5 1-0.8 1.4-0.3 0.3-0.9 1.3-0.3 0.5-0.5 0.7-1.1 1.3-1.7 1.9-6.9 7.3-15.9 12.8-24.4 18.1-8.3 5.3-0.6 18.5 7.7 13.2 9.9-6.3 20.9-12.8 28.6-21.8 4.8-5.5 8.1-12.9 4.2-19.9-3.4-6-10.5-8.9-16.6-11.4-8.6-3.5-17.5-6.2-26.2-9.5v14.8c14.4-6.1 47.2-18.8 41.2-40.3-3.5-12.9-19.4-18.9-30.8-22.6-3.4-1.1-6.9-2.1-10.5-2.9-9.1-2.2-13.3 12.5-3.6 14.6z" fill="#040000" ></path></svg>`
			},
			{
				name: "10",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M762.9 77.4H261.1L10.2 512l250.9 434.6h501.8L1013.8 512z" fill="#F6F180" ></path><path d="M342.9 400.6m-29.5 0a29.5 29.5 0 1 0 59 0 29.5 29.5 0 1 0-59 0Z" fill="#040000" ></path><path d="M342.9 431.3c-16.9 0-30.7-13.8-30.7-30.7s13.8-30.7 30.7-30.7 30.7 13.8 30.7 30.7-13.7 30.7-30.7 30.7z m0-59c-15.6 0-28.3 12.7-28.3 28.3s12.7 28.3 28.3 28.3 28.3-12.7 28.3-28.3-12.6-28.3-28.3-28.3z" fill="#FFFFFF" ></path><path d="M702 400.6m-29.5 0a29.5 29.5 0 1 0 59 0 29.5 29.5 0 1 0-59 0Z" fill="#040000" ></path><path d="M702 431.3c-16.9 0-30.7-13.8-30.7-30.7s13.8-30.7 30.7-30.7 30.7 13.8 30.7 30.7-13.8 30.7-30.7 30.7z m0-59c-15.6 0-28.3 12.7-28.3 28.3s12.7 28.3 28.3 28.3 28.3-12.7 28.3-28.3-12.7-28.3-28.3-28.3z" fill="#FFFFFF" ></path><path d="M358.7 519.9c20 22 45.5 40.4 71.3 54.8 51.2 28.5 111.7 39.9 168 19.5 44.3-16.1 80.7-47.8 110.2-83.9 3-3.7 3.6-8.9 0-12.5-3.1-3.1-9.5-3.7-12.5 0-25.5 31.4-56.2 59.7-93.7 76-27.1 11.7-56.6 15.7-85.8 12.2-24.7-2.9-49.5-11.8-71.5-23.4-18.7-9.8-36.6-22.2-51.1-34.3-7.8-6.5-15.5-13.3-22.4-20.9-7.7-8.5-20.1 4.1-12.5 12.5z" ></path></svg>`
			},
			{
				name: "11",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M48.2 844.9c-68.5-210.6 186-782.1 409.1-795.4 6.3-0.4 12.5 0.2 18.6 1.6C665.1 94.6 985.4 515 987.1 821.3c0.1 20-12.9 37.9-22.4 43.1-162.7 89.8-605.8 179.7-884.4 30.9-15-7.9-24.2-26.1-32.1-50.4z" fill="#F0884F" ></path><path d="M401 352.1m-52.4 0a52.4 52.4 0 1 0 104.8 0 52.4 52.4 0 1 0-104.8 0Z" fill="#FFFFFF" ></path><path d="M408.7 329m-29.3 0a29.3 29.3 0 1 0 58.6 0 29.3 29.3 0 1 0-58.6 0Z" fill="#040000" ></path><path d="M527.5 352.1m-52.4 0a52.4 52.4 0 1 0 104.8 0 52.4 52.4 0 1 0-104.8 0Z" fill="#FFFFFF" ></path><path d="M527.5 329m-29.3 0a29.3 29.3 0 1 0 58.6 0 29.3 29.3 0 1 0-58.6 0Z" fill="#040000" ></path><path d="M450.7 517c1.1-8.2 3.2-16.4 6.1-24.1 0.1-0.3 1-2.5 0.5-1.4s0.3-0.7 0.5-1c0.7-1.4 1.4-2.8 2.2-4.1 0.4-0.8 2.8-3.9 1.3-2.1 0.8-1 1.7-1.9 2.6-2.8 1-1-1.5 1 0.1 0 0.5-0.3 1-0.6 1.5-0.8-1.3 0.7-1.2 0.3 0 0.1 1.9-0.3-1.8 0.3 0.1 0 1.2-0.2 1.5 0.3 0-0.1 0.6 0.2 1.3 0.3 1.9 0.5 0.3 0.1-1.3-0.7 0.2 0.1 0.8 0.5 1.6 0.9 2.4 1.4 1.4 1 0-0.1 1.4 1.1 0.9 0.8 1.8 1.7 2.6 2.6 1.8 1.9 3.5 3.9 5 6.1 5.1 7.1 9.3 14.8 13.2 22.6 3.5 6.9 13.7 4.7 15.8-2.1 2.6-8.7 4.8-17.4 7.4-26.1 0.9-3.2 1.9-6.4 3.2-9.4-0.7 1.6 0.8-1.6 1.2-2.2l0.9-1.5c0.7-1.2-1.4 0.7 0.1-0.1 1.7-0.9-1.2 0.3-0.3 0.1 0.8-0.2 1-1.2 0.3-0.3-0.6 0.8 0.6 0-0.5 0.2-2 0.3 2.4 0.5-1.1 0 0.5 0.1 1.2 0.2 1.6 0.4-1.1-0.8-0.8-0.4 0.2 0.2 0.7 0.4 3.4 2.3 2.7 1.8 8.9 7.1 15.9 16.9 22.5 26 2.8 3.8 7.5 5.6 11.8 3.1 3.7-2.2 5.9-8 3.1-11.8-8.2-11.1-16.6-23-27.7-31.4-6.3-4.7-14.5-7.6-21.7-3-6.7 4.2-9.6 12.5-11.9 19.6-3.2 9.9-5.5 20-8.6 29.9 5.3-0.7 10.5-1.4 15.8-2.1-7.8-15.5-24.8-50.1-48-41.7-14.1 5.1-19.7 23-22.9 36.2-0.9 3.8-1.8 7.7-2.3 11.6-0.6 4.6 1.1 9.3 6 10.6 4.2 1 10.2-1.5 10.8-6.1z" fill="#040000" ></path></svg>`
			},
			{
				name: "12",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M485.538528 993.072489a362.00362 481.804818 3.149 1 0 52.933731-962.15464 362.00362 481.804818 3.149 1 0-52.933731 962.15464Z" fill="#AADCF0" ></path><path d="M688.2 334.1c-15.1 7.6-30.2 15.6-44.3 25-5.9 3.9-17 10.4-14.6 19.1 1.8 6.5 12 11.2 17.3 14.3 15.7 9.3 32.1 17.6 48.3 25.9 8.6 4.4 16.2-8.5 7.6-13-14.1-7.3-28.3-14.5-42.1-22.3-3.9-2.2-7.9-4.5-11.7-6.9-1.2-0.8-2.4-1.5-3.5-2.4-0.6-0.4-1.1-0.8-1.6-1.2 2.2 1.7-0.3-0.3-0.3-0.3-0.9 0.1-1.5-3.2-0.2 0.5 0.9 2.4 1.1 3.8 0.3 5.8 0.6-1.5-0.9 0.8-0.1 0 0.5-0.5 1-1.1 1.6-1.6 0.5-0.5 1-0.9 1.6-1.3 0.6-0.5 0 0 1.2-0.9 1.7-1.3 3.5-2.5 5.3-3.6 8.4-5.5 17.2-10.4 26-15.2 5.6-3 11.2-6 16.8-8.9 8.6-4.4 1-17.4-7.6-13zM375.8 347c13.4 6.8 26.7 14 39.5 21.9 1.8 1.2 3.7 2.3 5.5 3.5 0.9 0.6 1.7 1.2 2.6 1.8 0.9 0.6 1.9 1.4 1.6 1.1 1.1 0.9 2.1 1.9 3.1 2.8 1.2 1 0-0.3 0.1 0 0-0.2-0.8-2.4-0.3-4.1 1.5-5.5 2.3-2.7 0.8-2-0.4 0.2-0.9 0.8-1.3 1.1 1.7-1.4-1.6 1.1-2.3 1.6-3.4 2.3-6.9 4.4-10.4 6.4-14.9 8.6-30.3 16.4-45.6 24.3-8.6 4.4-1 17.4 7.6 13 15-7.7 30.1-15.4 44.8-23.8 6.2-3.6 13.8-7.3 18.7-12.7 7.6-8.3-3.8-16.6-9.9-20.9-8.7-6.1-18-11.3-27.3-16.4-6.5-3.6-13-7.1-19.6-10.4-8.6-4.5-16.3 8.5-7.6 12.8zM412.8 570.9c13.5 7.7 28.5 13.3 43.3 17.9 29.8 9.2 61.7 13.1 92.6 7.3 20.6-3.9 40-12.5 56.6-25.2 2.8-2.2 4.3-5.6 2.3-9-1.6-2.8-6.2-4.5-9-2.3-48.3 36.9-113.3 30-165.6 6.7-4.6-2.1-9.2-4.2-13.7-6.7-7.3-4.2-13.9 7.2-6.5 11.3z" fill="#040000" ></path><path d="M644.6 505.2c-30.1 21.5-60.6 62.5-39.1 99.8 10.7 18.6 30.3 30.9 49.1 40.1 7.8 3.8 14.6-7.9 6.8-11.7-23.6-11.5-53.7-31.4-49.4-60.9 2.8-18.9 15.8-34.6 29.5-47.2 2.5-2.3 5.1-4.6 7.8-6.7 0.5-0.4 0.9-0.7 1.4-1.1-0.4 0.3-1.2 0.9-0.1 0.1l0.9-0.6c6.9-5.1 0.2-16.8-6.9-11.8z" fill="#040000" ></path></svg>`
			},
			{
				name: "13",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M235.1 76.9c75.6-26.5 297.3-90.1 514.2-16.6 16.3 5.5 29.8 17.4 37.1 33 57.5 122.4 127.1 602.1 62.1 785.6a62.58 62.58 0 0 1-32.5 35.8c-109.5 51.8-428.1 136.7-609.3 37.2-14.4-7.9-25-21.3-29.7-37.1-41.9-140.6-37-627.7 19.1-798 6.1-18.7 20.5-33.4 39-39.9z" fill="#F9DABD" ></path><path d="M392.2 360.2m-35.2 0a35.2 35.2 0 1 0 70.4 0 35.2 35.2 0 1 0-70.4 0Z" fill="#040000" ></path><path d="M618.6 360.2m-35.2 0a35.2 35.2 0 1 0 70.4 0 35.2 35.2 0 1 0-70.4 0Z" fill="#040000" ></path><path d="M512 562.6c-36 0-65.3-29.3-65.3-65.3S476 432 512 432s65.3 29.3 65.3 65.3-29.3 65.3-65.3 65.3z m0-122.9c-31.7 0-57.6 25.8-57.6 57.6s25.8 57.6 57.6 57.6c31.7 0 57.6-25.8 57.6-57.6s-25.9-57.6-57.6-57.6z" fill="#040000" ></path></svg>`
			},
			{
				name: "14",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M178.1 971.5c38.1 15.9 98.7 26.6 171.3-12.3 3.7-2 8.4-1.6 11.6 1.1 43.3 35.9 123.3 80.8 236 10.9 3.8-2.4 8.7-2.4 12.6-0.2 41.8 23.9 191.6 58.2 246.6 14.2 4.4-3.5 9.1-6.6 14.5-8.5C1065 909.5 678.2-652 194.3 351c-37.5 77.8-38.4 94.1-71.9 211.3-27.6 96.3-29.1 231.3 1.4 348.1 7.2 27.3 27.3 49.9 54.3 61.1z" fill="#ABAAAA" ></path><path d="M468.9 349H418c-6.1 0-11.1-5-11.1-11.1V336c0-6.1 5-11.1 11.1-11.1h50.9c6.1 0 11.1 5 11.1 11.1v1.9c0 6.1-5 11.1-11.1 11.1zM643 471.9H390c-6.6 0-12-5.4-12-12s5.4-12 12-12h253c6.6 0 12 5.4 12 12s-5.4 12-12 12zM609 349h-61.2c-6 0-11-4.9-11-11v-2.1c0-6 4.9-11 11-11H609c6 0 11 4.9 11 11v2.1c0 6.1-4.9 11-11 11z" fill="#040000" ></path></svg>`
			},
			{
				name: "15",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M673.1 318.7c3.7-17.5 5.6-35.7 5.6-54.4 0-137.9-105.5-249.7-235.6-249.7S207.4 126.4 207.4 264.3c0 55.4 17.1 106.7 45.9 148.1-55.2 63.3-88.6 145.9-88.6 236.3 0 199.2 162.1 360.6 362.1 360.6 200 0 362.1-161.5 362.1-360.6 0.1-147.3-88.7-274-215.8-330z" fill="#4F8A54" ></path><path d="M392 246.2m-47.1 0a47.1 47.1 0 1 0 94.2 0 47.1 47.1 0 1 0-94.2 0Z" fill="#FFFFFF" ></path><path d="M386 252.8m-26.4 0a26.4 26.4 0 1 0 52.8 0 26.4 26.4 0 1 0-52.8 0Z" fill="#040000" ></path><path d="M505.6 246.2m-47.1 0a47.1 47.1 0 1 0 94.2 0 47.1 47.1 0 1 0-94.2 0Z" fill="#FFFFFF" ></path><path d="M501.4 252.8m-26.4 0a26.4 26.4 0 1 0 52.8 0 26.4 26.4 0 1 0-52.8 0Z" fill="#040000" ></path><path d="M474.3 364.8h-50.9c-6.1 0-11.1-5-11.1-11.1v-1.9c0-6.1 5-11.1 11.1-11.1h50.9c6.1 0 11.1 5 11.1 11.1v1.9c0 6.2-5 11.1-11.1 11.1z" fill="#040000" ></path></svg>`
			},
			{
				name: "16",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M246.4 227.6c-166.9 101.1-461.9 344 87 564.1 1.5 0.6 2.9 1.1 4.4 1.6 80.7 27.7 392.8 165.4 641-198.1 40-58.6 38.5-136.2-3.7-193.3C892 289.5 727 201.1 429.1 182.7c-64.1-4-127.8 11.6-182.7 44.9z" fill="#CF92BE" ></path><path d="M617.1 393.4c-17.4 8.8-34.9 18.1-51.2 28.9-6.9 4.6-20.3 12.3-17.4 22.6 1.2 4.3 5.6 7 9 9.5 3.7 2.7 7.6 5 11.5 7.3 18.2 10.8 37.1 20.3 55.9 30 10 5.1 18.9-10 8.8-15.1-16.4-8.4-32.9-16.9-49-26-4.5-2.6-9.1-5.2-13.5-8l-4.5-3c-0.7-0.5-1.3-1-2-1.5 1.6 1.2 0.7 0.4-0.2-0.2-1.3-0.9-0.3-0.9-0.5-0.3 0.2 0.2 0.4 0.5 0.6 0.7 1 1.9 1.3 3.7 0.8 5.7 0.1-0.6 0.7-1.4-0.6 1.3 0.7-1.5-0.1 0-0.2 0.1 0.6-0.6 1.2-1.3 1.9-1.9l1.8-1.5c1.8-1.6-0.6 0.3 1.2-0.9 2-1.5 4.1-2.9 6.2-4.3 10-6.5 20.4-12.4 30.9-18 6.5-3.5 13.1-7 19.7-10.4 9.6-5 0.8-20.1-9.2-15zM323.1 408.5c15.9 8.1 31.7 16.5 46.8 26 2.2 1.4 4.3 2.8 6.5 4.2 1 0.7 1.9 1.3 2.8 2 0.5 0.3 1 0.7 1.4 1.1-1.1-0.9-0.3-0.3 0.3 0.3 1.1 1 2.2 2.2 3.3 3.1 1.4 1.1-1-1.7-0.1-0.1-0.6-1.1-0.9-4.1 0.3-6.7 2.2-4.8 0.7 0.1 0-0.5 0 0-1.1 0.9-1.3 1 2.3-1.9 0 0-0.5 0.4-0.8 0.5-1.5 1.1-2.3 1.6-4 2.7-8.1 5.1-12.3 7.5-17.3 10-35.1 19.1-52.8 28.2-10 5.1-1.2 20.2 8.8 15.1 17.5-9 35-17.9 52-27.7 7.3-4.2 15.9-8.6 21.8-14.7 9.3-9.7-4.3-19.7-11.5-24.7-10.1-7.1-20.9-13.1-31.7-19-7.6-4.2-15.2-8.2-22.9-12.1-9.7-5.2-18.6 9.9-8.6 15zM513 592.1c-12.2 0-24.6-1.4-36.3-4.3-8-2-13.9-8.2-15.4-16.2s1.7-15.8 8.4-20.5c23.2-16.3 60.5-31.9 106.2-13 6.4 2.6 11 8.3 12.3 15.1 1.3 6.7-0.8 13.6-5.7 18.3-13.5 13.1-40.9 20.6-69.5 20.6z m-37.4-32.5c-3.4 2.4-4.9 6.2-4.2 10.2 0.8 4.1 3.6 7.1 7.7 8.1 39.1 9.7 81.2 0.7 96.1-13.7 2.4-2.3 3.4-5.6 2.7-8.9-0.7-3.4-2.9-6.2-6.1-7.5-41.2-17.2-75.1-3.1-96.2 11.8z" fill="#040000" ></path></svg>`
			},
			{
				name: "17",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M1008.6 465.7c0-124.9-95.5-226.2-213.4-226.2-12 0-23.8 1.1-35.2 3.1v-3.1c0-124.9-95.5-226.2-213.4-226.2S333.4 114.6 333.4 239.5c0 2.4 0 4.8 0.1 7.2-17.1-4.7-35-7.2-53.4-7.2-117.8 0-213.4 101.3-213.4 226.2 0 92.1 51.9 171.3 126.3 206.6-13.7 29.9-21.4 63.4-21.4 98.8 0 124.9 95.5 226.2 213.4 226.2 68.8 0 130-34.5 169-88.1 39 53.6 100.2 88.1 169 88.1 117.8 0 213.4-101.3 213.4-226.2 0-41.2-10.4-79.9-28.6-113.1 60.5-39.9 100.8-111.1 100.8-192.3z" fill="#8CC66D" ></path><path d="M437.8 400.7m-24.7 0a24.7 24.7 0 1 0 49.4 0 24.7 24.7 0 1 0-49.4 0Z" fill="#040000" ></path><path d="M649.7 400.7m-24.7 0a24.7 24.7 0 1 0 49.4 0 24.7 24.7 0 1 0-49.4 0Z" fill="#040000" ></path><path d="M527.3 625.9c6.3-14.2 13.1-28.3 17.9-43 6.2-19 8.3-38.6 10.5-58.3l2.1-19.2c0.7-6.2-9-6.1-9.7 0-1.7 16.3-2.8 32.8-5.7 48.9-4.2 23.7-13.8 45-23.5 66.7-2.5 5.6 5.9 10.5 8.4 4.9z" fill="#252525" ></path><path d="M447.7 522.3c20.3-0.1 40.6-0.2 61-0.4l96.6-0.6c7.5 0 14.9-0.1 22.4-0.1 16.6-0.1 16.7-25.9 0-25.8-20.3 0.1-40.6 0.2-61 0.4l-96.6 0.6c-7.5 0-14.9 0.1-22.4 0.1-16.6 0.1-16.7 25.9 0 25.8z" fill="#040000" ></path><path d="M495.4 508.2c-10.3 3.8-9.2 20.9-9.2 29.5 0.1 16 2.1 32.3 6.1 47.8 3.5 13.7 8.7 29.9 20.6 38.7 12.9 9.5 27.6 2.1 37.6-7.9 10.2-10.3 17.8-23 24.7-35.6 11.6-21.3 20.9-43.8 29.7-66.4 3-7.8-9.5-11.1-12.5-3.4-7.4 19.1-15.3 38.1-24.7 56.4-5.9 11.5-12.2 23-20.3 33.1-2.8 3.5-5.8 6.9-9.2 9.8-1.9 1.7-1.4 1.3-3.3 2.5-1.3 0.8-2.6 1.6-3.9 2.2-0.7 0.3 1-0.2-0.8 0.3-0.6 0.2-1.2 0.3-1.8 0.5-1.1 0.3-1.2 0.2-0.5 0.1-0.6 0-1.3 0-1.9 0.1-2.2 0.1 0.6 0.5-1.8-0.2l-1.8-0.6c1.5 0.5 0.2 0.1-0.5-0.3-0.8-0.5-2.9-2.1-1.7-1.1-1-0.9-2-1.7-2.8-2.7-0.4-0.5-0.9-1-1.3-1.5 0.4 0.5 0.1 0.2-0.5-0.7-0.8-1.3-1.7-2.5-2.4-3.9-0.7-1.3-1.4-2.5-2-3.8-0.4-0.8-0.8-1.6-1.1-2.4-0.1-0.2-0.5-1.1 0 0l-0.6-1.5a86.8 86.8 0 0 1-3.3-9.8c-4.4-14.9-6.2-27.9-6.8-42.8-0.3-6.6-0.3-13.1 0.4-19.7 0.2-1.5-0.3 1.5 0.1-0.5l0.3-1.8c0.2-0.9 0.5-1.8 0.7-2.8 0.4-1.9-0.7 1.1 0.3-0.7 0.5-1-1.3 1.2-0.3 0.5-0.3 0.3-1.1 0.8-2 1.1 7.7-2.9 4.3-15.4-3.5-12.5z" fill="#040000" ></path></svg>`
			},
			{
				name: "18",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M75.4 739.8c-78.7-134.4-194-455.7 401.4-579.6 9.8-2 19.2-6.2 29.2-7.5C656.8 133 947.3 205 1000.1 578.4c42.6 223.8 29.7 392.1-822 233.6-43.1-8-80.6-34.4-102.7-72.2z" fill="#F09495" ></path><path d="M704.6 875.4c-129 0-301.8-20.5-526.6-62.3-43.5-8.1-81.2-34.6-103.5-72.7-19.3-32.9-44.8-84.3-57.1-142.5-13.9-65.1-8.8-125.3 15.1-179.2 54.3-122.3 203.7-209.6 444-259.6 4.1-0.9 8.3-2.1 12.3-3.4 5.5-1.7 11.1-3.4 16.9-4.2 29-3.8 75.7-5.9 133.8 5.7 54.5 10.9 105.3 31 150.8 59.9C843.7 251 888.2 296 922.7 351c39.7 63.1 66.1 139.6 78.5 227.3 8.1 42.4 15.2 87.3 12.5 127.9-2.8 42.6-16.4 75.5-41.5 100.7-42.5 42.7-120.3 65-237.8 68.1-9.6 0.2-19.6 0.4-29.8 0.4zM76.3 739.3c22 37.6 59.2 63.7 102.1 71.7 242.5 45.1 424.4 65.3 556.1 61.9 116.9-3.1 194.1-25.2 236.3-67.5 55.4-55.6 44.4-142.5 28.3-226.7C976 415.8 903.4 291.5 789.2 219c-124-78.7-248.1-69.9-283.2-65.3-5.6 0.7-11.2 2.4-16.6 4.1-4.1 1.2-8.3 2.5-12.5 3.4C237.3 211.1 88.5 298 34.5 419.6c-54.6 122.8 2.8 253 41.8 319.7z" fill="#FFFFFF" ></path><path d="M424.1 442.5m-24.7 0a24.7 24.7 0 1 0 49.4 0 24.7 24.7 0 1 0-49.4 0Z" fill="#040000" ></path><path d="M635.9 442.5m-24.7 0a24.7 24.7 0 1 0 49.4 0 24.7 24.7 0 1 0-49.4 0Z" fill="#040000" ></path><path d="M426.2 543.3c17.1 7.9 36.6 26 25.5 46.1-6.9 12.5-19.8 21.2-31.7 28.4-4.5 2.7-0.4 9.8 4.1 7.1 17.4-10.5 41.6-27.6 39-51.1-1.6-14-12.4-24.8-23.5-32.3-3-2-6.1-3.9-9.3-5.4-4.8-2.1-8.9 5-4.1 7.2zM629.5 535.4c-21.8 11.7-40.6 37-25.7 61.3 8.2 13.4 22.2 22.7 35.7 30.3 4.7 2.7 8.9-4.6 4.2-7.2-15.5-8.7-39.9-23.9-36.9-45.2 1.6-11.4 10.7-20.7 19.6-27.2 2.4-1.7 4.8-3.4 7.4-4.8 4.7-2.5 0.4-9.8-4.3-7.2z" fill="#040000" ></path><path d="M457.2 584.6c25.6 25.6 66.7 41 101.8 28.3 18.2-6.6 33.2-19.1 45.5-33.8 4.2-5.1-3-12.4-7.3-7.3-18.5 22-43.3 38.1-73 35-18.6-1.9-36.2-10.8-50.9-22-2.9-2.2-6.1-4.8-8.8-7.5-4.7-4.7-12 2.6-7.3 7.3z" fill="#040000" ></path></svg>`
			},
			{
				name: "19",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M915.9 510.5c8.4-19 13.1-39.8 13.1-61.7 0-90-78.9-162.9-176.2-162.9-3.2 0-6.3 0.1-9.5 0.2v-0.2c0-94.8-116.2-171.6-259.6-171.6S224 191.2 224 286v2c-96.2 0-174.1 72-174.1 160.9 0 38 14.3 73 38.2 100.5-41.8 29.4-68.8 75.9-68.8 128.2 0 88.9 78 160.9 174.1 160.9 17.1 0 33.6-2.3 49.3-6.5 28.9 46.1 88.7 77.7 157.6 77.7 49.4 0 94-16.2 126-42.3 32 26.1 76.6 42.3 126 42.3 77.3 0 143-39.7 166.7-95 3.1 0.2 6.3 0.2 9.5 0.2 97.3 0 176.2-72.9 176.2-162.9 0-60.6-35.7-113.4-88.8-141.5z" fill="#5A74B8" ></path><path d="M357.6 449.5a46.6 73.2 0 1 0 93.2 0 46.6 73.2 0 1 0-93.2 0Z" fill="#FEFEFD" ></path><path d="M357.5 449.5a25.1 39.4 0 1 0 50.2 0 25.1 39.4 0 1 0-50.2 0Z" fill="#040000" ></path><path d="M531.3 449.5a46.6 73.2 0 1 0 93.2 0 46.6 73.2 0 1 0-93.2 0Z" fill="#FEFEFD" ></path><path d="M531.2 449.5a25.1 39.4 0 1 0 50.2 0 25.1 39.4 0 1 0-50.2 0Z" fill="#040000" ></path><path d="M426.7 574.6c20.9 29.9 59.7 52.2 96.2 38.6 19.2-7.2 34.7-21.2 47.6-36.9 2.8-3.5 3.4-8.3 0-11.7-2.9-2.9-8.9-3.5-11.7 0-16.5 20.2-40.9 40.9-68.1 35.5-17.3-3.4-31-13.2-42.9-25.9-2-2.2-3.9-4.4-5.8-6.7-1.6-1.9 1.1 1.5-0.4-0.6-0.2-0.2-0.3-0.5-0.5-0.7-6.2-8.7-20.6-0.4-14.4 8.4z" fill="#040000" ></path></svg>`
			},
			{
				name: "20",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024" ><path d="M792.8 301.4c-8.2 0-16.2 0.4-24.2 1.3-12.3-81.8-129.2-145.9-271.8-145.9-137.1 0-250.5 59.3-269.9 136.6C105.3 295.5 7.4 391.2 7.4 508.9c0 119.1 100.2 215.6 223.7 215.6 5.3 0 10.6-0.2 15.8-0.5 14.4 80.5 130.4 143.2 271.3 143.2 135.9 0 248.6-58.3 269.4-134.6 1.7 0 3.4 0.1 5.1 0.1 123.6 0 223.7-96.5 223.7-215.6s-100-215.7-223.6-215.7z" fill="#F6CD50" ></path><path d="M435.9 431.5m-52.2 0a52.2 52.2 0 1 0 104.4 0 52.2 52.2 0 1 0-104.4 0Z" fill="#FAFAFA" ></path><path d="M588.1 431.5m-52.2 0a52.2 52.2 0 1 0 104.4 0 52.2 52.2 0 1 0-104.4 0Z" fill="#FAFAFA" ></path><path d="M435.9 431.5m-27.8 0a27.8 27.8 0 1 0 55.6 0 27.8 27.8 0 1 0-55.6 0Z" fill="#040000" ></path><path d="M601.9 407.4c-5.7 2.9-11.3 5.9-16.9 9-6.8 3.8-15.3 7.8-20.5 13.8-5.6 6.5 1.6 11.1 6.7 14.4 11.2 7.1 23.3 13 35.1 19 5.7 2.9 10.8-5.7 5.1-8.6-10.9-5.6-21.9-11.1-32.4-17.4-2.4-1.4-4.6-3.1-7-4.6 1 0.6-0.4-0.4-0.4-0.4-1.9-0.3-0.5 4.2 0.5 4.1-0.1 0-0.6 0.3 0.3-0.3 0.5-0.3 1-0.9 1.5-1.3 9.7-7.9 21.9-13.5 33.1-19.2 5.7-2.7 0.6-11.4-5.1-8.5zM406.6 547.6c11.5 14.4 27 26.7 42.7 36.3 32.2 19.8 71.2 27.2 107.6 15.4 29.5-9.6 54.6-29.1 75.5-51.6 10.8-11.6-6.6-29.1-17.5-17.5-9.4 10.1-19.5 19.7-30.8 27.7-4.6 3.2-9.3 6.2-14.2 8.9-5 2.8-9.9 5.1-14.1 6.7-4.6 1.7-9.3 3.2-14.1 4.4-2.2 0.5-4.4 1-6.6 1.4-1 0.2-2 0.3-2.9 0.5 2.6-0.4-2.1 0.2-2.5 0.3-4.1 0.4-8.3 0.5-12.5 0.4-2.2-0.1-4.4-0.2-6.6-0.4-1.1-0.1-2.2-0.2-3.2-0.3-1.5-0.2-1.4-0.2 0.1 0l-2.1-0.3c-7.8-1.3-15.4-3.4-22.8-6.2-0.9-0.4-1.8-0.7-2.8-1.1-3.1-1.2 2.3 1.1-0.7-0.3-1.5-0.7-2.9-1.3-4.4-2-3.7-1.8-7.2-3.7-10.8-5.8-5.7-3.4-11.1-7.1-16.4-11.1 3 2.3-1.1-0.9-1.8-1.5-1.1-0.9-2.1-1.7-3.1-2.6-2.1-1.8-4.2-3.7-6.3-5.6-4.4-4.1-8.7-8.4-12.4-13.1-4.2-5.2-13.1-4.3-17.5 0-5 5.1-4 12.2 0.2 17.4z" fill="#040000" ></path></svg>`
			}
		]
	},
	{
		name: "标记图标",
		type: "sign",
		list: [
			{
				name: "1",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M809.728 429.696a18.901333 18.901333 0 0 0-15.274667-12.885333l-183.466666-26.624-81.92-166.272a18.901333 18.901333 0 0 0-34.005334 0l-81.92 166.272-183.594666 26.624a19.029333 19.029333 0 0 0-10.496 32.298666l132.693333 129.536-31.274667 182.741334a18.816 18.816 0 0 0 27.477334 19.84l164.138666-86.186667 164.096 86.058667a18.773333 18.773333 0 1 0 27.434667-19.84l-31.36-182.741334 132.693333-129.408a18.901333 18.901333 0 0 0 4.778667-19.413333z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "2",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M644.565333 306.901333c32.128 0 65.834667-5.76 101.077334-17.237333a17.066667 17.066667 0 0 1 22.357333 16.213333v328.32c-1.109333 0.768 10.325333 27.093333-99.370667 19.84-109.653333-7.210667-181.76-45.098667-246.869333-45.098666-65.152 0-49.322667 2.688-74.154667 8.405333v168.064a24.746667 24.746667 0 0 1-24.490666 25.258667 22.528 22.528 0 0 1-17.28-7.253334 24.149333 24.149333 0 0 1-7.168-18.005333V281.258667C299.776 280.490667 328.106667 256 421.76 256s164.437333 50.901333 222.805333 50.901333z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "3",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M524.074667 225.408l274.517333 274.517333a17.066667 17.066667 0 0 1 0 24.149334l-274.517333 274.517333a17.066667 17.066667 0 0 1-24.149334 0l-274.517333-274.517333a17.066667 17.066667 0 0 1 0-24.149334l274.517333-274.517333a17.066667 17.066667 0 0 1 24.149334 0z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "4",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M317.866667 300.8h388.266666c9.386667 0 17.066667 7.68 17.066667 17.066667v388.266666a17.066667 17.066667 0 0 1-17.066667 17.066667h-388.266666a17.066667 17.066667 0 0 1-17.066667-17.066667v-388.266666c0-9.386667 7.68-17.066667 17.066667-17.066667z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "5",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M498.346667 279.082667L248.789333 701.44a15.829333 15.829333 0 0 0 13.653334 23.893333h499.114666a15.829333 15.829333 0 0 0 13.653334-23.893333l-249.6-422.357333a15.829333 15.829333 0 0 0-27.264 0z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "6",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M497.749333 798.549333l-31.445333-28.501333C313.941333 631.722667 213.333333 540.501333 213.333333 428.8a160.981333 160.981333 0 0 1 162.730667-162.730667c51.498667 0 100.906667 23.978667 133.12 61.696a177.536 177.536 0 0 1 133.162667-61.696 160.981333 160.981333 0 0 1 162.730666 162.730667c0 111.701333-100.608 202.965333-252.970666 341.333333l-31.445334 28.458667a17.066667 17.066667 0 0 1-22.912 0z" fill="#FFFFFF"></path><path d="M634.538667 487.808L555.050667 426.24 507.306667 256a201.002667 201.002667 0 0 0-23.594667 20.394667l-0.256-0.256L525.653333 426.666667l-133.290666 59.946666a14.08 14.08 0 0 0-8.021334 15.957334l28.757334 126.378666a14.208 14.208 0 0 0 27.733333-6.229333l-26.24-115.114667 126.037333-56.704 76.416 59.136a14.250667 14.250667 0 0 0 19.968-2.474666 14.08 14.08 0 0 0-2.474666-19.797334z" fill="#6D768D"></path></svg>`
			},
			{
				name: "7",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M497.749333 798.549333l-31.445333-28.501333C313.941333 631.722667 213.333333 540.501333 213.333333 428.8a160.981333 160.981333 0 0 1 162.730667-162.730667c51.498667 0 100.906667 23.978667 133.12 61.696a177.536 177.536 0 0 1 133.162667-61.696 160.981333 160.981333 0 0 1 162.730666 162.730667c0 111.701333-100.608 202.965333-252.970666 341.333333l-31.445334 28.458667a17.066667 17.066667 0 0 1-22.912 0z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "8",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M374.656 273.194667c5.973333 4.48 12.117333 9.6 18.346667 15.36 6.272 5.717333 11.904 12.373333 16.896 19.84 2.517333 4.010667 5.504 8.490667 9.002666 13.482666a529.493333 529.493333 0 0 1 20.266667 32.213334h155.221333a169.813333 169.813333 0 0 0 9.770667-15.744c2.474667-4.48 5.248-8.96 8.234667-13.482667a460.842667 460.842667 0 0 1 23.253333-31.829333c4.992-6.229333 12.245333-12.373333 21.76-18.346667a34.261333 34.261333 0 0 0 10.112-9.728 31.274667 31.274667 0 0 0 5.248-11.989333 18.56 18.56 0 0 0-1.536-11.605334 17.664 17.664 0 0 0-10.112-8.618666c-4.48-1.493333-8.362667-2.005333-11.605333-1.493334a46.933333 46.933333 0 0 0-9.770667 2.602667c-3.242667 1.28-6.613333 2.645333-10.112 4.138667a32.426667 32.426667 0 0 1-12.757333 2.261333 26.026667 26.026667 0 0 1-12.373334-2.645333 45.653333 45.653333 0 0 1-8.96-6.357334l-8.661333-7.850666a30.336 30.336 0 0 0-11.989333-6.4c-9.984-3.968-18.005333-4.693333-24.021334-2.218667-5.973333 2.474667-11.946667 6.485333-17.962666 11.946667a88.618667 88.618667 0 0 1-11.989334 10.496 7.338667 7.338667 0 0 1-3.754666 1.493333 46.165333 46.165333 0 0 1-8.277334-5.205333 71.808 71.808 0 0 1-7.125333-4.906667 37.973333 37.973333 0 0 1-6.4-6.357333c-3.968-3.968-9.941333-6.613333-17.92-7.850667a31.061333 31.061333 0 0 0-21.76 4.138667c-8.533333 5.461333-14.506667 10.069333-18.048 13.824a29.354667 29.354667 0 0 1-15.744 7.893333 23.978667 23.978667 0 0 1-13.098667-0.768 987.733333 987.733333 0 0 0-14.634666-4.48 80.725333 80.725333 0 0 0-14.250667-2.986667 16.768 16.768 0 0 0-11.989333 2.986667c-6.997333 5.461333-9.258667 12.074667-6.741334 19.84a34.56 34.56 0 0 0 13.482667 18.346667z" fill="#FFFFFF"></path><path d="M780.757333 545.152a219.306667 219.306667 0 0 0-19.882666-65.536 224.981333 224.981333 0 0 0-33.365334-49.792 430.336 430.336 0 0 0-37.12-37.12c-14.506667-11.946667-27.264-23.296-38.272-34.048a544.512 544.512 0 0 1-27.733333-28.842667 305.28 305.28 0 0 1-22.485333-26.197333h-168.746667c-6.485333 8.490667-13.994667 17.493333-22.485333 26.965333a360.96 360.96 0 0 1-26.24 28.074667c-10.538667 10.24-22.272 21.12-35.285334 32.597333a305.493333 305.493333 0 0 0-41.6 44.16 250.026667 250.026667 0 0 0-49.493333 117.589334 216.106667 216.106667 0 0 0 1.877333 70.4 220.586667 220.586667 0 0 0 75.349334 126.549333c21.248 18.005333 47.146667 32.597333 77.653333 43.818667 30.464 11.264 65.493333 16.853333 104.96 16.853333 38.528 0 72.874667-4.864 103.125333-14.592a265.045333 265.045333 0 0 0 78.378667-39.338667c21.973333-16.469333 39.594667-35.797333 52.864-58.026666 13.226667-22.186667 22.101333-45.824 26.624-70.784 4.992-30.421333 5.632-58.026667 1.877333-82.773334z" fill="#FFFFFF"></path><path d="M593.322667 647.509333a20.48 20.48 0 0 1-11.861334 3.2h-50.133333v14.165334c0 4.266667-1.792 8.362667-5.376 12.373333a15.914667 15.914667 0 0 1-13.952 5.333333 24.917333 24.917333 0 0 1-14.336-3.882666c-3.84-2.602667-5.973333-7.210667-6.4-13.824v-14.165334h-48.725333a17.792 17.792 0 0 1-11.818667-3.882666 10.24 10.24 0 0 1-3.968-9.6c0-4.266667 1.578667-7.68 4.693333-10.24a16.768 16.768 0 0 1 11.093334-3.925334h48.682666v-24.789333h-48.682666a15.573333 15.573333 0 0 1-11.52-4.266667 13.525333 13.525333 0 0 1-4.266667-9.941333 15.36 15.36 0 0 1 4.693333-10.624 14.72 14.72 0 0 1 11.093334-4.949333h48.682666l0.725334-14.890667a1053.568 1053.568 0 0 1-40.832-42.538667l-10.752-9.898666a41.216 41.216 0 0 1-6.442667-11.690667c-1.92-4.992-0.938667-10.069333 2.858667-15.274667a13.653333 13.653333 0 0 1 15.786666-3.84c6.186667 2.090667 11.221333 4.821333 15.018667 8.106667 1.92 2.389333 5.248 5.888 10.026667 10.666667l15.061333 14.848 19.328 19.157333 22.186667-20.565333a987.605333 987.605333 0 0 1 29.397333-25.514667 21.162667 21.162667 0 0 1 14.293333-5.674667c5.290667 0 9.557333 2.133333 12.928 6.4 6.186667 7.082667 3.84 15.36-7.168 24.789334a179.072 179.072 0 0 0-12.885333 12.373333c-5.76 5.973333-11.52 11.733333-17.194667 17.408-6.698667 7.082667-14.08 14.378667-22.186666 21.973333v13.44h46.506666c6.698667 0 11.605333 1.536 14.72 4.608a14.165333 14.165333 0 0 1 4.650667 10.282667c0 4.266667-1.450667 7.936-4.309333 11.008-2.858667 3.029333-7.637333 4.352-14.336 3.84l-46.506667 0.768-0.768 24.064h45.866667c13.354667 0 20.053333 4.992 20.053333 14.933333 0.469333 4.693333-0.853333 8.106667-3.925333 10.24z" fill="#6D768D"></path></svg>`
			},
			{
				name: "9",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M512 213.333333l234.666667 341.333334h-128v213.333333h-213.333334v-213.333333h-128L512 213.333333z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "10",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M533.333333 810.666667L298.666667 469.333333h128V256h213.333333v213.333333h128l-234.666667 341.333334z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "11",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M213.333333 533.333333L554.666667 298.666667v128h213.333333v213.333333h-213.333333v128l-341.333334-234.666667z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "12",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M810.666667 533.333333L469.333333 768v-128H256v-213.333333h213.333333V298.666667l341.333334 234.666666z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "13",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M0 512c0 282.752 229.248 512 512 512s512-229.248 512-512S794.752 0 512 0 0 229.248 0 512z" fill="#6D768D"></path><path d="M571.349333 508.586667l162.389334-162.346667a44.330667 44.330667 0 1 0-62.72-62.72l-162.389334 162.389333-162.517333-162.389333a44.330667 44.330667 0 1 0-62.72 62.72l162.389333 162.389333-162.389333 162.474667a44.330667 44.330667 0 1 0 62.72 62.72l162.389333-162.346667 162.389334 162.389334a44.330667 44.330667 0 1 0 62.72-62.72l-162.261334-162.56z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "14",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 0C233.386667 0 0 225.877333 0 512s225.877333 512 512 512 512-225.877333 512-512S790.613333 0 512 0z" fill="#6D768D"></path><path d="M726.144 311.210667l-277.333333 305.066666-124.8-124.8c-13.866667-13.866667-41.6-13.866667-55.466667 0-13.866667 13.866667-13.866667 41.6 0 55.466667l159.445333 152.533333c13.866667 13.866667 41.6 13.866667 55.466667 0l305.066667-332.8c13.866667-13.866667 13.866667-41.6 0-55.466666-20.778667-13.866667-48.512-13.866667-62.378667 0z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "15",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M541.952 755.626667a40.618667 40.618667 0 0 1-29.824 12.373333 41.344 41.344 0 0 1-30.122667-12.373333 40.106667 40.106667 0 0 1-12.672-30.122667c0-11.605333 4.096-21.845333 12.672-30.122667a40.405333 40.405333 0 0 1 30.122667-12.714666c11.605333 0 21.546667 4.138667 29.824 12.714666a40.32 40.32 0 0 1 12.714667 30.122667c0 11.861333-4.096 21.76-12.714667 30.122667zM450.986667 241.28A77.866667 77.866667 0 0 1 512.256 213.333333c24.874667 0 45.354667 8.917333 61.354667 27.946667 15.488 18.432 23.722667 41.685333 23.722666 69.674667 0 23.765333-33.152 200.533333-44.672 329.045333h-80.128C463.146667 511.402667 426.666667 334.677333 426.666667 310.954667c0-27.392 8.277333-50.645333 24.32-69.674667z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "16",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.794667 0 512 0z" fill="#6D768D"></path><path d="M490.666667 682.666667a64 64 0 1 1 0 128 64 64 0 0 1 0-128z m13.994666-490.752c61.397333 0 112.341333 14.634667 153.002667 43.946666 40.533333 29.269333 60.885333 72.618667 60.885333 130.133334 0 35.242667-12.373333 64.938667-29.952 89.045333-10.282667 14.677333-33.664 33.408-62.890666 56.192l-32.426667 22.357333c-15.701333 12.202667-29.696 26.453333-34.858667 42.666667-1.706667 5.546667-3.072 14.677333-3.968 24.533333-0.426667 4.949333-4.864 15.018667-15.232 15.018667h-83.328c-13.568 0-15.957333-10.581333-15.744-15.786667 1.493333-34.005333 4.608-64.213333 18.474667-80.469333 28.074667-32.896 91.904-73.813333 91.904-73.813333a104.106667 104.106667 0 0 0 23.552-24.021334c10.837333-14.933333 19.797333-31.317333 19.797333-49.237333 0-20.565333-6.016-39.338667-18.090666-56.32-12.032-16.938667-34.090667-25.386667-66.005334-25.386667-31.445333 0-53.76 10.410667-66.901333 31.274667-9.685333 15.445333-15.786667 29.610667-18.346667 45.013333-0.853333 5.461333-4.394667 16.981333-16.042666 16.981334H327.210667c-17.322667 0-21.12-11.221333-20.650667-16.64 6.272-68.138667 32.896-114.688 80-144.597334 32-20.565333 71.381333-30.890667 118.101333-30.890666z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "17",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M336.256 410.026667H253.312a40.021333 40.021333 0 0 0-39.850667 43.264l23.296 278.101333c1.706667 20.693333 19.072 36.608 39.850667 36.608h59.648c11.050667 0 20.010667-8.96 20.010667-19.968v-318.037333a19.968 19.968 0 0 0-20.010667-19.968z m434.432 0h-178.944C653.312 182.314667 548.949333 170.666667 548.949333 170.666667c-44.288 0-35.114667 34.986667-38.442666 40.832 0 84.48-68.010667 155.093333-101.034667 184.362666a39.552 39.552 0 0 0-13.226667 29.653334v322.56c0 11.008 8.96 19.925333 20.010667 19.925333h233.728c30.378667 0 58.154667-17.152 71.68-44.373333 18.176-36.736 40.448-90.112 54.656-133.973334 13.781333-42.410667 26.24-94.976 33.578667-131.968a39.850667 39.850667 0 0 0-39.253334-47.658666z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "18",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M796.16 413.909333c-31.146667-0.298667-115.626667-0.085333-146.858667-0.085333h-158.464c8.533333-7.68 15.914667-14.506667 23.594667-20.906667 29.781333-24.874667 25.813333-71.082667-14.208-88.874666-22.954667-10.24-44.970667-5.632-64 11.52-34.944 31.274667-69.632 62.677333-104.277333 93.994666a15.488 15.488 0 0 1-11.178667 4.437334c-11.221333-0.085333-26.88-0.128-46.933333-0.170667a17.066667 17.066667 0 0 0-17.109334 17.066667L256 719.701333a17.066667 17.066667 0 0 0 17.066667 17.152l49.578666-0.085333c3.968 0 7.466667 0.768 10.88 2.602667 15.829333 8.832 31.701333 17.493333 47.616 26.24a18.133333 18.133333 0 0 0 9.301334 2.346666h168.405333c6.186667 0 11.946667-0.981333 17.834667-2.56 29.44-7.253333 40.021333-30.293333 38.528-52.565333-0.768-9.728-4.266667-18.346667-9.984-26.24 19.626667-5.76 35.114667-16.213333 42.112-36.096 7.125333-20.394667 1.621333-38.4-12.672-53.333333 28.16-19.754667 34.858667-44.672 18.645333-75.648h140.458667c6.570667 0 13.013333-0.597333 19.370666-2.645334 31.957333-9.813333 48.810667-42.88 35.626667-71.552-10.154667-22.186667-28.629333-33.152-52.608-33.450666z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "19",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M270.506667 413.909333c31.146667-0.298667 115.626667-0.085333 146.858666-0.085333h158.464c-8.533333-7.68-15.914667-14.506667-23.594666-20.906667-29.781333-24.874667-25.813333-71.082667 14.208-88.874666 22.954667-10.24 44.970667-5.632 64 11.52 34.944 31.274667 69.632 62.677333 104.277333 93.994666 3.413333 2.986667 6.528 4.437333 11.178667 4.437334 11.221333-0.085333 26.88-0.128 46.933333-0.170667a17.066667 17.066667 0 0 1 17.109333 17.066667l0.682667 288.853333a17.066667 17.066667 0 0 1-17.066667 17.152l-49.578666-0.085333a22.101333 22.101333 0 0 0-10.88 2.602666c-15.829333 8.832-31.701333 17.493333-47.616 26.24a18.133333 18.133333 0 0 1-9.301334 2.346667h-168.405333a68.693333 68.693333 0 0 1-17.834667-2.56c-29.44-7.253333-40.021333-30.293333-38.528-52.565333 0.768-9.728 4.266667-18.346667 9.984-26.24-19.626667-5.76-35.114667-16.213333-42.112-36.096-7.125333-20.394667-1.621333-38.4 12.672-53.333334-28.16-19.754667-34.858667-44.672-18.645333-75.648H272.853333c-6.570667 0-13.013333-0.597333-19.370666-2.645333-31.957333-9.813333-48.810667-42.88-35.626667-71.552 10.154667-22.186667 28.629333-33.152 52.608-33.450667z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "20",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M667.733333 480.128H400v-111.36a97.706667 97.706667 0 0 1 97.621333-97.621333 97.706667 97.706667 0 0 1 97.578667 97.621333 28.885333 28.885333 0 0 0 57.813333 0A155.605333 155.605333 0 0 0 497.621333 213.333333a155.605333 155.605333 0 0 0-155.392 155.434667v111.36h-14.677333A28.885333 28.885333 0 0 0 298.666667 509.013333v292.010667a28.885333 28.885333 0 0 0 28.885333 28.885333h340.138667a28.885333 28.885333 0 0 0 28.928-28.885333V509.013333a28.885333 28.885333 0 0 0-28.928-28.885333z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "21",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M400.042667 437.461333v-111.36a97.706667 97.706667 0 0 1 97.621333-97.621333 97.706667 97.706667 0 0 1 97.578667 97.621333 28.885333 28.885333 0 0 0 57.813333 0A155.605333 155.605333 0 0 0 497.621333 170.666667a155.605333 155.605333 0 0 0-155.392 155.434666v111.36h-14.677333A28.885333 28.885333 0 0 0 298.666667 466.346667v292.010666a28.885333 28.885333 0 0 0 28.885333 28.885334h340.138667a28.885333 28.885333 0 0 0 28.928-28.885334V466.346667a28.885333 28.885333 0 0 0-28.928-28.885334H400.042667z" fill="#FFFFFF"></path><path d="M595.242667 437.461333v-111.36a97.706667 97.706667 0 0 0-97.621334-97.621333 97.706667 97.706667 0 0 0-97.578666 97.621333 28.885333 28.885333 0 0 1-57.813334 0A155.605333 155.605333 0 0 1 497.621333 170.666667a155.605333 155.605333 0 0 1 155.434667 155.434666v111.36h14.634667c16 0 28.928 12.928 28.928 28.885334v292.010666a28.885333 28.885333 0 0 1-28.928 28.885334H327.552A28.885333 28.885333 0 0 1 298.666667 758.357333V466.346667c0-15.957333 12.928-28.885333 28.885333-28.885334h267.690667z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "22",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M511.999787 512.000213m-511.999787 0a511.999787 511.999787 0 1 0 1023.999573 0 511.999787 511.999787 0 1 0-1023.999573 0Z" fill="#6D768D"></path><path d="M381.354508 364.586941c0 54.015977 29.013321 103.935957 75.946635 130.986613a152.53327 152.53327 0 0 0 151.935936 0 151.12527 151.12527 0 0 0 75.946636-130.986613A151.594604 151.594604 0 0 0 533.333111 213.333671a151.594604 151.594604 0 0 0-151.89327 151.25327zM660.479725 498.901552a185.258589 185.258589 0 0 1-127.146614 50.346646c-49.066646 0-93.866628-19.199992-127.06128-50.346646C317.141201 544.853533 255.999893 637.440161 255.999893 744.106783c0 13.183995 10.709329 23.850657 23.978657 23.850657h506.709122a23.893323 23.893323 0 0 0 23.978657-23.893323c0-106.538622-61.098641-199.25325-150.186604-245.205232z" fill="#FFFFFF"></path></svg>`
			},
			{
				name: "23",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#6D768D"></path><path d="M445.610667 401.578667a129.322667 129.322667 0 1 0 258.645333 0 129.322667 129.322667 0 0 0-258.645333 0z m237.568 114.901333a157.354667 157.354667 0 0 1-216.362667 0 236.373333 236.373333 0 0 0-127.957333 209.706667c0 11.264 9.130667 20.394667 20.394666 20.394666h431.402667a20.394667 20.394667 0 0 0 20.394667-20.394666 236.373333 236.373333 0 0 0-127.872-209.706667zM409.813333 401.578667c0-40.362667 14.592-77.397333 38.698667-106.112a112.725333 112.725333 0 0 0-29.013333-3.925334 112.64 112.64 0 0 0-112.426667 112.469334 112.64 112.64 0 0 0 144.853333 107.648 164.693333 164.693333 0 0 1-42.112-110.08z m-18.602666 136.704a136.533333 136.533333 0 0 1-65.706667-34.474667 205.44 205.44 0 0 0-111.232 182.4c0 9.813333 7.936 17.706667 17.706667 17.706667H303.36a273.621333 273.621333 0 0 1 87.893333-165.632z" fill="#FFFFFF"></path></svg>`
			}
		]
	}
];
var getNodeIconListIcon = (name, extendIconList = []) => {
	let arr = name.split("_");
	let typeData = mergerIconList([...nodeIconList, ...extendIconList]).find((item) => {
		return item.type === arr[0];
	});
	if (typeData) {
		let typeName = typeData.list.find((item) => {
			return item.name === arr[1];
		});
		if (typeName) return typeName.icon;
		return "";
	} else return "";
};
var icons_default = {
	hyperlink,
	note,
	attachment,
	nodeIconList,
	getNodeIconListIcon
};
//#endregion
//#region node_modules/simple-mind-map/src/core/render/node/nodeCreateContents.js
var measureText = (text, style) => {
	const g = new G();
	const node = new Text().text(text);
	style.text(node);
	g.add(node);
	return g.bbox();
};
var defaultTagStyle = {
	radius: 3,
	fontSize: 12,
	fill: "",
	height: 20,
	paddingX: 8
};
function createImgNode() {
	const img = this.getData("image");
	if (!img) return;
	const imgSize = this.getImgShowSize();
	const node = new Image$1().load(img).size(...imgSize);
	const { defaultNodeImage } = this.mindMap.opt;
	if (defaultNodeImage) {
		const imgEl = new Image();
		imgEl.onerror = () => {
			node.load(defaultNodeImage);
		};
		imgEl.src = img;
	}
	if (this.getData("imageTitle")) node.attr("title", this.getData("imageTitle"));
	node.on("click", (e) => {
		this.mindMap.emit("node_img_click", this, node, e);
	});
	node.on("dblclick", (e) => {
		this.mindMap.emit("node_img_dblclick", this, e, node);
	});
	node.on("mouseenter", (e) => {
		this.mindMap.emit("node_img_mouseenter", this, node, e);
	});
	node.on("mouseleave", (e) => {
		this.mindMap.emit("node_img_mouseleave", this, node, e);
	});
	node.on("mousemove", (e) => {
		this.mindMap.emit("node_img_mousemove", this, node, e);
	});
	return {
		node,
		width: imgSize[0],
		height: imgSize[1]
	};
}
function getImgShowSize() {
	const { custom, width, height } = this.getData("imageSize");
	if (custom) return [width, height];
	return resizeImgSize(width, height, this.mindMap.themeConfig.imgMaxWidth, this.mindMap.themeConfig.imgMaxHeight);
}
function createIconNode() {
	let _data = this.getData();
	if (!_data.icon || _data.icon.length <= 0) return [];
	let iconSize = this.mindMap.themeConfig.iconSize;
	return _data.icon.map((item) => {
		let src = icons_default.getNodeIconListIcon(item, this.mindMap.opt.iconList || []);
		let node = null;
		if (/^<svg/.test(src)) node = SVG(src);
		else node = new Image$1().load(src);
		node.size(iconSize, iconSize);
		node.on("click", (e) => {
			this.mindMap.emit("node_icon_click", this, item, e, node);
		});
		node.on("mouseenter", (e) => {
			this.mindMap.emit("node_icon_mouseenter", this, item, e, node);
		});
		node.on("mouseleave", (e) => {
			this.mindMap.emit("node_icon_mouseleave", this, item, e, node);
		});
		return {
			node,
			width: iconSize,
			height: iconSize
		};
	});
}
function createRichTextNode(specifyText) {
	const hasCustomWidth = this.hasCustomWidth();
	let text = typeof specifyText === "string" ? specifyText : this.getData("text");
	let { textAutoWrapWidth, emptyTextMeasureHeightText } = this.mindMap.opt;
	textAutoWrapWidth = hasCustomWidth ? this.customTextWidth : textAutoWrapWidth;
	const g = new G();
	let recoverText = false;
	if (this.getData("resetRichText")) {
		delete this.nodeData.data.resetRichText;
		recoverText = true;
	}
	if (recoverText && !isUndef(text)) {
		if (checkIsRichText(text)) text = removeRichTextStyes(text);
		else text = `<p>${text}</p>`;
		this.setData({ text });
	}
	const nodeTextStyleList = [];
	const nodeRichTextStyles = getNodeRichTextStyles(this);
	Object.keys(nodeRichTextStyles).forEach((prop) => {
		nodeTextStyleList.push([prop, nodeRichTextStyles[prop]]);
	});
	if (!this.mindMap.commonCaches.measureRichtextNodeTextSizeEl) {
		this.mindMap.commonCaches.measureRichtextNodeTextSizeEl = document.createElement("div");
		this.mindMap.commonCaches.measureRichtextNodeTextSizeEl.style.position = "fixed";
		this.mindMap.commonCaches.measureRichtextNodeTextSizeEl.style.left = "-999999px";
		this.mindMap.el.appendChild(this.mindMap.commonCaches.measureRichtextNodeTextSizeEl);
	}
	const div = this.mindMap.commonCaches.measureRichtextNodeTextSizeEl;
	nodeTextStyleList.forEach(([prop, value]) => {
		div.style[prop] = value;
	});
	div.style.lineHeight = 1.2;
	const html = `<div>${text}</div>`;
	div.innerHTML = html;
	const el = div.children[0];
	el.classList.add("smm-richtext-node-wrap");
	addXmlns(el);
	el.style.maxWidth = textAutoWrapWidth + "px";
	if (hasCustomWidth) el.style.width = this.customTextWidth + "px";
	else el.style.width = "";
	let { width, height } = el.getBoundingClientRect();
	if (height <= 0) {
		div.innerHTML = `<p>${emptyTextMeasureHeightText}</p>`;
		let elTmp = div.children[0];
		elTmp.classList.add("smm-richtext-node-wrap");
		height = elTmp.getBoundingClientRect().height;
		div.innerHTML = html;
	}
	width = Math.min(Math.ceil(width) + 1, textAutoWrapWidth);
	height = Math.ceil(height);
	g.attr("data-width", width);
	g.attr("data-height", height);
	const foreignObject = createForeignObjectNode({
		el: div.children[0],
		width,
		height
	});
	const foreignObjectStyle = { "line-height": 1.2 };
	nodeTextStyleList.forEach(([prop, value]) => {
		foreignObjectStyle[camelCaseToHyphen(prop)] = value;
	});
	foreignObject.css(foreignObjectStyle);
	g.add(foreignObject);
	return {
		node: g,
		nodeContent: foreignObject,
		width,
		height
	};
}
function createTextNode(specifyText) {
	if (this.getData("needUpdate")) delete this.nodeData.data.needUpdate;
	if (this.getData("richText")) return this.createRichTextNode(specifyText);
	const text = typeof specifyText === "string" ? specifyText : this.getData("text");
	if (this.getData("resetRichText")) delete this.nodeData.data.resetRichText;
	const g = new G();
	const fontSize = this.getStyle("fontSize", false);
	const textAlign = this.getStyle("textAlign", false);
	let textArr = [];
	if (!isUndef(text)) textArr = String(text).split(/\n/gim);
	const { textAutoWrapWidth: maxWidth, emptyTextMeasureHeightText } = this.mindMap.opt;
	let isMultiLine = textArr.length > 1;
	textArr.forEach((item, index) => {
		let arr = item.split("");
		let lines = [];
		let line = [];
		while (arr.length) {
			let str = arr.shift();
			if (measureText([...line, str].join(""), this.style).width <= maxWidth) line.push(str);
			else {
				lines.push(line.join(""));
				line = [str];
			}
		}
		if (line.length > 0) lines.push(line.join(""));
		if (lines.length > 1) isMultiLine = true;
		textArr[index] = lines.join("\n");
	});
	textArr = textArr.join("\n").replace(/\n$/g, "").split(/\n/gim);
	textArr.forEach((item, index) => {
		if (item === "") item = "﻿";
		const node = new Text().text(item);
		node.addClass("smm-text-node-wrap");
		node.attr("text-anchor", {
			left: "start",
			center: "middle",
			right: "end"
		}[textAlign] || "start");
		this.style.text(node);
		node.y(fontSize * noneRichTextNodeLineHeight * index + (noneRichTextNodeLineHeight - 1) * fontSize / 2);
		g.add(node);
	});
	let { width, height } = g.bbox();
	if (height <= 0) {
		const tmpNode = new Text().text(emptyTextMeasureHeightText);
		this.style.text(tmpNode);
		height = tmpNode.bbox().height;
	}
	width = Math.min(Math.ceil(width), maxWidth);
	height = Math.ceil(height);
	g.attr("data-width", width);
	g.attr("data-height", height);
	g.attr("data-ismultiLine", isMultiLine || textArr.length > 1);
	return {
		node: g,
		width,
		height
	};
}
function createHyperlinkNode() {
	const { hyperlink, hyperlinkTitle } = this.getData();
	if (!hyperlink) return;
	const { customHyperlinkJump, hyperlinkIcon } = this.mindMap.opt;
	const { icon, style } = hyperlinkIcon;
	const iconSize = this.getNodeIconSize("hyperlinkIcon");
	const node = new SVG().size(iconSize, iconSize);
	const a = new A().to(hyperlink).target("_blank");
	a.node.addEventListener("click", (e) => {
		if (typeof customHyperlinkJump === "function") {
			e.preventDefault();
			customHyperlinkJump(hyperlink, this);
		}
	});
	if (hyperlinkTitle) node.add(SVG(`<title>${hyperlinkTitle}</title>`));
	a.rect(iconSize, iconSize).fill({ color: "transparent" });
	const iconNode = SVG(icon || icons_default.hyperlink).size(iconSize, iconSize);
	this.style.iconNode(iconNode, style.color);
	a.add(iconNode);
	node.add(a);
	return {
		node,
		width: iconSize,
		height: iconSize
	};
}
function createTagNode() {
	const tagData = this.getData("tag");
	if (!tagData || tagData.length <= 0) return [];
	let { maxTag, tagsColorMap } = this.mindMap.opt;
	tagsColorMap = tagsColorMap || {};
	const nodes = [];
	tagData.slice(0, maxTag).forEach((item, index) => {
		let str = "";
		let style = { ...defaultTagStyle };
		if (typeof item === "string") str = item;
		else {
			str = item.text;
			style = {
				...defaultTagStyle,
				...item.style
			};
		}
		const hasCustomWidth = typeof style.width !== "undefined";
		const tag = new G();
		tag.on("click", () => {
			this.mindMap.emit("node_tag_click", this, item, index, tag);
		});
		const text = new Text().text(str);
		this.style.tagText(text, style);
		const { width: textWidth, height: textHeight } = text.bbox();
		const rectWidth = hasCustomWidth ? style.width : textWidth + style.paddingX * 2;
		const maxWidth = hasCustomWidth ? Math.max(rectWidth, textWidth) : rectWidth;
		const maxHeight = Math.max(style.height, textHeight);
		if (hasCustomWidth) text.x((maxWidth - textWidth) / 2);
		else text.x(hasCustomWidth ? 0 : style.paddingX);
		text.cy(-maxHeight / 2);
		const rect = new Rect().size(rectWidth, style.height).cy(-maxHeight / 2);
		if (hasCustomWidth) rect.x((maxWidth - rectWidth) / 2);
		this.style.tagRect(rect, {
			...style,
			fill: style.fill || tagsColorMap[text.node.textContent] || generateColorByContent(text.node.textContent)
		});
		tag.add(rect).add(text);
		nodes.push({
			node: tag,
			width: maxWidth,
			height: maxHeight
		});
	});
	return nodes;
}
function createNoteNode() {
	if (!this.getData("note")) return null;
	const { icon, style } = this.mindMap.opt.noteIcon;
	const iconSize = this.getNodeIconSize("noteIcon");
	const node = new SVG().attr("cursor", "pointer").addClass("smm-node-note").size(iconSize, iconSize);
	node.add(new Rect().size(iconSize, iconSize).fill({ color: "transparent" }));
	const iconNode = SVG(icon || icons_default.note).size(iconSize, iconSize);
	this.style.iconNode(iconNode, style.color);
	node.add(iconNode);
	if (!this.mindMap.opt.customNoteContentShow) {
		if (!this.noteEl) {
			this.noteEl = document.createElement("div");
			this.noteEl.style.cssText = `
          position: fixed;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgb(0 0 0 / 10%);
          display: none;
          background-color: #fff;
          z-index: ${this.mindMap.opt.nodeNoteTooltipZIndex}
      `;
			(this.mindMap.opt.customInnerElsAppendTo || document.body).appendChild(this.noteEl);
		}
		this.noteEl.innerText = this.getData("note");
	}
	node.on("mouseover", () => {
		const { left, top } = this.getNoteContentPosition();
		if (!this.mindMap.opt.customNoteContentShow) {
			this.noteEl.style.left = left + "px";
			this.noteEl.style.top = top + "px";
			this.noteEl.style.display = "block";
		} else this.mindMap.opt.customNoteContentShow.show(this.getData("note"), left, top, this);
	});
	node.on("mouseout", () => {
		if (!this.mindMap.opt.customNoteContentShow) this.noteEl.style.display = "none";
		else this.mindMap.opt.customNoteContentShow.hide();
	});
	node.on("click", (e) => {
		this.mindMap.emit("node_note_click", this, e, node);
	});
	node.on("dblclick", (e) => {
		this.mindMap.emit("node_note_dblclick", this, e, node);
	});
	return {
		node,
		width: iconSize,
		height: iconSize
	};
}
function createAttachmentNode() {
	const { attachmentUrl, attachmentName } = this.getData();
	if (!attachmentUrl) return;
	const iconSize = this.getNodeIconSize("attachmentIcon");
	const { icon, style } = this.mindMap.opt.attachmentIcon;
	const node = new SVG().attr("cursor", "pointer").size(iconSize, iconSize);
	if (attachmentName) node.add(SVG(`<title>${attachmentName}</title>`));
	node.add(new Rect().size(iconSize, iconSize).fill({ color: "transparent" }));
	const iconNode = SVG(icon || icons_default.attachment).size(iconSize, iconSize);
	this.style.iconNode(iconNode, style.color);
	node.add(iconNode);
	node.on("click", (e) => {
		this.mindMap.emit("node_attachmentClick", this, e, node);
	});
	node.on("contextmenu", (e) => {
		this.mindMap.emit("node_attachmentContextmenu", this, e, node);
	});
	return {
		node,
		width: iconSize,
		height: iconSize
	};
}
function getNodeIconSize(prop) {
	const { style } = this.mindMap.opt[prop];
	return isUndef(style.size) ? this.mindMap.themeConfig.iconSize : style.size;
}
function getNoteContentPosition() {
	const iconSize = this.getNodeIconSize("noteIcon");
	const { scaleY } = this.mindMap.view.getTransformData().transform;
	const iconSizeAddScale = iconSize * scaleY;
	let { left, top } = this._noteData.node.node.getBoundingClientRect();
	top += iconSizeAddScale;
	return {
		left,
		top
	};
}
function measureCustomNodeContentSize(content) {
	if (!this.mindMap.commonCaches.measureCustomNodeContentSizeEl) {
		this.mindMap.commonCaches.measureCustomNodeContentSizeEl = document.createElement("div");
		this.mindMap.commonCaches.measureCustomNodeContentSizeEl.style.cssText = `
      position: fixed;
      left: -99999px;
      top: -99999px;
    `;
		this.mindMap.el.appendChild(this.mindMap.commonCaches.measureCustomNodeContentSizeEl);
	}
	this.mindMap.commonCaches.measureCustomNodeContentSizeEl.innerHTML = "";
	this.mindMap.commonCaches.measureCustomNodeContentSizeEl.appendChild(content);
	let rect = this.mindMap.commonCaches.measureCustomNodeContentSizeEl.getBoundingClientRect();
	return {
		width: rect.width,
		height: rect.height
	};
}
function isUseCustomNodeContent() {
	return !!this._customNodeContent;
}
var nodeCreateContents_default = {
	createImgNode,
	getImgShowSize,
	createIconNode,
	createRichTextNode,
	createTextNode,
	createHyperlinkNode,
	createTagNode,
	createNoteNode,
	createAttachmentNode,
	getNoteContentPosition,
	getNodeIconSize,
	measureCustomNodeContentSize,
	isUseCustomNodeContent
};
//#endregion
//#region node_modules/simple-mind-map/src/core/render/node/nodeExpandBtnPlaceholderRect.js
function renderExpandBtnPlaceholderRect() {
	if (this.getChildrenLength() <= 0 || this.isRoot) return;
	const { alwaysShowExpandBtn, notShowExpandBtn, expandBtnSize } = this.mindMap.opt;
	if (!alwaysShowExpandBtn && !notShowExpandBtn) {
		let { width, height } = this;
		if (!this._unVisibleRectRegionNode) {
			this._unVisibleRectRegionNode = new Rect();
			this._unVisibleRectRegionNode.fill({ color: "transparent" });
		}
		this.group.add(this._unVisibleRectRegionNode);
		this.renderer.layout.renderExpandBtnRect(this._unVisibleRectRegionNode, expandBtnSize, width, height, this);
	}
}
function clearExpandBtnPlaceholderRect() {
	if (!this._unVisibleRectRegionNode) return;
	this._unVisibleRectRegionNode.remove();
	this._unVisibleRectRegionNode = null;
}
function updateExpandBtnPlaceholderRect() {
	if (this.needRerenderExpandBtnPlaceholderRect) {
		this.needRerenderExpandBtnPlaceholderRect = false;
		this.renderExpandBtnPlaceholderRect();
	}
	if (this.getChildrenLength() > 0) {
		if (!this._unVisibleRectRegionNode) this.renderExpandBtnPlaceholderRect();
	} else if (this._unVisibleRectRegionNode) this.clearExpandBtnPlaceholderRect();
}
var nodeExpandBtnPlaceholderRect_default = {
	renderExpandBtnPlaceholderRect,
	clearExpandBtnPlaceholderRect,
	updateExpandBtnPlaceholderRect
};
//#endregion
//#region node_modules/simple-mind-map/src/core/render/node/nodeModifyWidth.js
function initDragHandle() {
	if (!this.checkEnableDragModifyNodeWidth()) return;
	this._dragHandleNodes = null;
	this.dragHandleWidth = 4;
	this.dragHandleMousedownX = 0;
	this.isDragHandleMousedown = false;
	this.dragHandleIndex = 0;
	this.dragHandleMousedownCustomTextWidth = 0;
	this.dragHandleMousedownBodyCursor = "";
	this.dragHandleMousedownLeft = 0;
	this.onDragMousemoveHandle = this.onDragMousemoveHandle.bind(this);
	window.addEventListener("mousemove", this.onDragMousemoveHandle);
	this.onDragMouseupHandle = this.onDragMouseupHandle.bind(this);
	window.addEventListener("mouseup", this.onDragMouseupHandle);
	this.mindMap.on("node_mouseup", this.onDragMouseupHandle);
}
function onDragMousemoveHandle(e) {
	if (!this.isDragHandleMousedown) return;
	e.stopPropagation();
	e.preventDefault();
	let { minNodeTextModifyWidth, maxNodeTextModifyWidth, isUseCustomNodeContent, customCreateNodeContent } = this.mindMap.opt;
	const useCustomContent = isUseCustomNodeContent && customCreateNodeContent && this._customNodeContent;
	document.body.style.cursor = "ew-resize";
	this.group.css({ cursor: "ew-resize" });
	const { scaleX } = this.mindMap.draw.transform();
	const ox = e.clientX - this.dragHandleMousedownX;
	let newWidth = this.dragHandleMousedownCustomTextWidth + (this.dragHandleIndex === 0 ? -ox : ox) / scaleX;
	newWidth = Math.max(newWidth, minNodeTextModifyWidth);
	if (maxNodeTextModifyWidth !== -1) newWidth = Math.min(newWidth, maxNodeTextModifyWidth);
	if (!useCustomContent && this.getData("image")) {
		const imgSize = this.getImgShowSize();
		if (this._rectInfo.textContentWidth - this.customTextWidth + newWidth <= imgSize[0]) newWidth = imgSize[0] + this.customTextWidth - this._rectInfo.textContentWidth;
	}
	this.customTextWidth = newWidth;
	if (this.dragHandleIndex === 0) this.left = this.dragHandleMousedownLeft + ox / scaleX;
	this.reRender(useCustomContent ? [] : ["text"], { ignoreUpdateCustomTextWidth: true });
}
function onDragMouseupHandle() {
	if (!this.isDragHandleMousedown) return;
	document.body.style.cursor = this.dragHandleMousedownBodyCursor;
	this.group.css({ cursor: "default" });
	this.isDragHandleMousedown = false;
	this.dragHandleMousedownX = 0;
	this.dragHandleIndex = 0;
	this.dragHandleMousedownCustomTextWidth = 0;
	this.setData({ customTextWidth: this.customTextWidth });
	this.mindMap.render();
	this.mindMap.emit("dragModifyNodeWidthEnd", this);
}
function createDragHandleNode() {
	const list = [new Rect(), new Rect()];
	list.forEach((node, index) => {
		node.size(this.dragHandleWidth, this.height).fill({ color: "transparent" }).css({ cursor: "ew-resize" });
		node.on("mousedown", (e) => {
			e.stopPropagation();
			e.preventDefault();
			this.dragHandleMousedownX = e.clientX;
			this.dragHandleIndex = index;
			this.dragHandleMousedownCustomTextWidth = this.customTextWidth === void 0 ? this._textData ? this._textData.width : this.width : this.customTextWidth;
			this.dragHandleMousedownBodyCursor = document.body.style.cursor;
			this.dragHandleMousedownLeft = this.left;
			this.isDragHandleMousedown = true;
		});
	});
	return list;
}
function updateDragHandle() {
	if (!this.checkEnableDragModifyNodeWidth()) return;
	if (!this._dragHandleNodes) this._dragHandleNodes = this.createDragHandleNode();
	if (this.getData("isActive")) {
		this._dragHandleNodes.forEach((node) => {
			node.height(this.height);
			this.group.add(node);
		});
		this._dragHandleNodes[1].x(this.width - this.dragHandleWidth);
	} else this._dragHandleNodes.forEach((node) => {
		node.remove();
	});
}
var nodeModifyWidth_default = {
	initDragHandle,
	onDragMousemoveHandle,
	onDragMouseupHandle,
	createDragHandleNode,
	updateDragHandle
};
//#endregion
//#region node_modules/simple-mind-map/src/core/render/node/nodeCooperate.js
function createUserListNode() {
	if (!this.mindMap.cooperate) return;
	this._userListGroup = new G();
	this.group.add(this._userListGroup);
}
function createTextAvatar(item) {
	const { avatarSize, fontSize } = this.mindMap.opt.cooperateStyle;
	const g = new G();
	const str = item.isMore ? item.name : String(item.name)[0];
	const circle = new Circle().size(avatarSize, avatarSize);
	circle.fill({ color: item.color || generateColorByContent(str) });
	const text = new Text().text(str).fill({ color: "#fff" }).css({ "font-size": fontSize + "px" }).dx(-fontSize / 2).dy((avatarSize - fontSize) / 2);
	g.add(circle).add(text);
	return g;
}
function createImageAvatar(item) {
	const { avatarSize } = this.mindMap.opt.cooperateStyle;
	return new Image$1().load(item.avatar).size(avatarSize, avatarSize);
}
function updateUserListNode() {
	if (!this._userListGroup) return;
	const { avatarSize } = this.mindMap.opt.cooperateStyle;
	this._userListGroup.clear();
	const length = this.userList.length;
	const maxShowCount = Math.floor(this.width / avatarSize);
	const list = [];
	if (length > maxShowCount) list.push(...this.userList.slice(0, maxShowCount - 1), {
		isMore: true,
		name: "+" + (length - maxShowCount + 1)
	});
	else list.push(...this.userList);
	list.forEach((item, index) => {
		let node = null;
		if (item.avatar) node = this.createImageAvatar(item);
		else node = this.createTextAvatar(item);
		node.on("click", (e) => {
			this.mindMap.emit("node_cooperate_avatar_click", item, this, node, e);
		});
		node.on("mouseenter", (e) => {
			this.mindMap.emit("node_cooperate_avatar_mouseenter", item, this, node, e);
		});
		node.on("mouseleave", (e) => {
			this.mindMap.emit("node_cooperate_avatar_mouseleave", item, this, node, e);
		});
		node.x(index * avatarSize).cy(-avatarSize / 2);
		this._userListGroup.add(node);
	});
}
function addUser(userInfo) {
	if (this.userList.find((item) => {
		return item.id == userInfo.id;
	})) return;
	this.userList.push(userInfo);
	this.updateUserListNode();
}
function removeUser(userInfo) {
	const index = this.userList.findIndex((item) => {
		return item.id == userInfo.id;
	});
	if (index === -1) return;
	this.userList.splice(index, 1);
	this.updateUserListNode();
}
function emptyUser() {
	this.userList = [];
	this.updateUserListNode();
}
var nodeCooperate_default = {
	createUserListNode,
	updateUserListNode,
	createTextAvatar,
	createImageAvatar,
	addUser,
	removeUser,
	emptyUser
};
//#endregion
//#region node_modules/simple-mind-map/src/core/render/node/quickCreateChildBtn.js
function initQuickCreateChildBtn() {
	if (this.isGeneralization) return;
	this._quickCreateChildBtn = null;
	this._showQuickCreateChildBtn = false;
}
function showQuickCreateChildBtn() {
	if (this.isGeneralization || this.getChildrenLength() > 0) return;
	if (this._quickCreateChildBtn) this.group.add(this._quickCreateChildBtn);
	else {
		const { quickCreateChildBtnIcon, expandBtnStyle, expandBtnSize } = this.mindMap.opt;
		const { icon, style } = quickCreateChildBtnIcon;
		let { color, fill } = expandBtnStyle || {
			color: "#808080",
			fill: "#fff"
		};
		color = style.color || color;
		const iconNode = SVG(icon || btns_default.quickCreateChild).size(expandBtnSize, expandBtnSize);
		iconNode.css({ cursor: "pointer" });
		iconNode.x(0).y(-expandBtnSize / 2);
		this.style.iconNode(iconNode, color);
		const fillNode = new Circle().size(expandBtnSize);
		fillNode.x(0).y(-expandBtnSize / 2);
		fillNode.fill({ color: fill }).css({ cursor: "pointer" });
		this._quickCreateChildBtn = new G();
		this._quickCreateChildBtn.add(fillNode).add(iconNode);
		this._quickCreateChildBtn.on("click", (e) => {
			e.stopPropagation();
			this.mindMap.emit("quick_create_btn_click", this);
			const { customQuickCreateChildBtnClick } = this.mindMap.opt;
			if (typeof customQuickCreateChildBtnClick === "function") {
				customQuickCreateChildBtnClick(this);
				return;
			}
			this.mindMap.execCommand("INSERT_CHILD_NODE", true, [this]);
		});
		this._quickCreateChildBtn.on("dblclick", (e) => {
			e.stopPropagation();
		});
		this._quickCreateChildBtn.addClass("smm-quick-create-child-btn");
		this.group.add(this._quickCreateChildBtn);
	}
	this._showQuickCreateChildBtn = true;
	this.renderer.layout.renderExpandBtn(this, this._quickCreateChildBtn);
}
function removeQuickCreateChildBtn() {
	if (this.isGeneralization) return;
	if (this._quickCreateChildBtn && this._showQuickCreateChildBtn) {
		this._quickCreateChildBtn.remove();
		this._showQuickCreateChildBtn = false;
	}
}
function hideQuickCreateChildBtn() {
	if (this.isGeneralization) return;
	const { isActive } = this.getData();
	if (!isActive) this.removeQuickCreateChildBtn();
}
var quickCreateChildBtn_default = {
	initQuickCreateChildBtn,
	showQuickCreateChildBtn,
	removeQuickCreateChildBtn,
	hideQuickCreateChildBtn
};
//#endregion
//#region node_modules/simple-mind-map/src/core/render/node/nodeLayout.js
function getImgTextMarin(dir, imgWidth, textWidth, imgHeight, textHeight) {
	const { imgTextMargin } = this.mindMap.opt;
	if (dir === "v") return imgHeight > 0 && textHeight > 0 ? imgTextMargin : 0;
	else return imgWidth > 0 && textWidth > 0 ? imgTextMargin : 0;
}
function getTagContentSize(space) {
	let maxTagHeight = 0;
	let width = this._tagData.reduce((sum, cur) => {
		maxTagHeight = Math.max(maxTagHeight, cur.height);
		return sum += cur.width;
	}, 0);
	width += (this._tagData.length - 1) * space;
	return {
		width,
		height: maxTagHeight
	};
}
function getNodeRect() {
	if (this.isUseCustomNodeContent()) {
		const rect = this.measureCustomNodeContentSize(this._customNodeContent);
		return {
			width: this.hasCustomWidth() ? this.customTextWidth : rect.width,
			height: rect.height
		};
	}
	const { TAG_PLACEMENT, IMG_PLACEMENT } = CONSTANTS;
	const { textContentMargin } = this.mindMap.opt;
	const tagIsBottom = (this.getStyle("tagPlacement") || TAG_PLACEMENT.RIGHT) === TAG_PLACEMENT.BOTTOM;
	const imgPlacement = this.getStyle("imgPlacement") || IMG_PLACEMENT.TOP;
	let imgContentWidth = 0;
	let imgContentHeight = 0;
	let textContentWidth = 0;
	let textContentHeight = 0;
	let tagContentWidth = 0;
	let tagContentHeight = 0;
	let spaceCount = 0;
	if (this._imgData) {
		imgContentWidth = this._imgData.width;
		imgContentHeight = this._imgData.height;
	}
	this.mindMap.nodeInnerPrefixList.forEach((item) => {
		const itemData = this[`_${item.name}Data`];
		if (itemData) {
			textContentWidth += itemData.width;
			textContentHeight = Math.max(textContentHeight, itemData.height);
			spaceCount++;
		}
	});
	if (this._prefixData) {
		textContentWidth += this._prefixData.width;
		textContentHeight = Math.max(textContentHeight, this._prefixData.height);
		spaceCount++;
	}
	if (this._iconData.length > 0) {
		textContentWidth += this._iconData.reduce((sum, cur) => {
			textContentHeight = Math.max(textContentHeight, cur.height);
			return sum += cur.width;
		}, 0) + (this._iconData.length - 1) * textContentMargin;
		spaceCount++;
	}
	if (this._textData) {
		textContentWidth += this._textData.width;
		textContentHeight = Math.max(textContentHeight, this._textData.height);
		spaceCount++;
	}
	if (this._hyperlinkData) {
		textContentWidth += this._hyperlinkData.width;
		textContentHeight = Math.max(textContentHeight, this._hyperlinkData.height);
		spaceCount++;
	}
	if (this._tagData.length > 0) {
		const { width: totalTagWidth, height: maxTagHeight } = this.getTagContentSize(textContentMargin);
		if (tagIsBottom) {
			tagContentWidth = totalTagWidth;
			tagContentHeight = maxTagHeight;
		} else {
			textContentWidth += totalTagWidth;
			textContentHeight = Math.max(textContentHeight, maxTagHeight);
			spaceCount++;
		}
	}
	if (this._noteData) {
		textContentWidth += this._noteData.width;
		textContentHeight = Math.max(textContentHeight, this._noteData.height);
		spaceCount++;
	}
	if (this._attachmentData) {
		textContentWidth += this._attachmentData.width;
		textContentHeight = Math.max(textContentHeight, this._attachmentData.height);
		spaceCount++;
	}
	if (this._postfixData) {
		textContentWidth += this._postfixData.width;
		textContentHeight = Math.max(textContentHeight, this._postfixData.height);
		spaceCount++;
	}
	textContentWidth += (spaceCount - 1) * textContentMargin;
	if (tagIsBottom && textContentWidth > 0 && tagContentHeight > 0) {
		this._rectInfo.textContentWidthWithoutTag = textContentWidth;
		textContentWidth = Math.max(textContentWidth, tagContentWidth);
		textContentHeight = textContentHeight + textContentMargin + tagContentHeight;
	}
	this._rectInfo.textContentWidth = textContentWidth;
	this._rectInfo.textContentHeight = textContentHeight;
	let _width = 0;
	let _height = 0;
	if ([IMG_PLACEMENT.TOP, IMG_PLACEMENT.BOTTOM].includes(imgPlacement)) {
		_width = Math.max(imgContentWidth, textContentWidth);
		_height = imgContentHeight + textContentHeight + this.getImgTextMarin("v", 0, 0, imgContentHeight, textContentHeight);
	} else {
		_width = imgContentWidth + textContentWidth + this.getImgTextMarin("h", imgContentWidth, textContentWidth);
		_height = Math.max(imgContentHeight, textContentHeight);
	}
	const { paddingX, paddingY } = this.getPaddingVale();
	const { paddingX: shapePaddingX, paddingY: shapePaddingY } = this.shapeInstance.getShapePadding(_width, _height, paddingX, paddingY);
	this.shapePadding.paddingX = shapePaddingX;
	this.shapePadding.paddingY = shapePaddingY;
	const borderWidth = this.getBorderWidth();
	return {
		width: _width + paddingX * 2 + shapePaddingX * 2 + borderWidth,
		height: _height + paddingY * 2 + shapePaddingY * 2 + borderWidth
	};
}
function layout() {
	if (!this.group) return;
	this.group.clear();
	const { hoverRectPadding, openRealtimeRenderOnNodeTextEdit, textContentMargin, addCustomContentToNode } = this.mindMap.opt;
	const { width, height } = this;
	let { paddingX, paddingY } = this.getPaddingVale();
	const halfBorderWidth = this.getBorderWidth() / 2;
	paddingX += this.shapePadding.paddingX + halfBorderWidth;
	paddingY += this.shapePadding.paddingY + halfBorderWidth;
	this.shapeNode = this.shapeInstance.createShape();
	this.shapeNode.addClass("smm-node-shape");
	this.shapeNode.translate(halfBorderWidth, halfBorderWidth);
	this.style.shape(this.shapeNode);
	this.group.add(this.shapeNode);
	this.renderExpandBtnPlaceholderRect();
	if (this.createUserListNode) this.createUserListNode();
	if (this.isGeneralization && this.generalizationBelongNode) this.group.addClass("generalization_" + this.generalizationBelongNode.uid);
	const addHoverNode = () => {
		this.hoverNode = new Rect().size(width + hoverRectPadding * 2, height + hoverRectPadding * 2).x(-hoverRectPadding).y(-hoverRectPadding);
		this.hoverNode.addClass("smm-hover-node");
		this.style.hoverNode(this.hoverNode, width, height);
		this.group.add(this.hoverNode);
	};
	if (this.isUseCustomNodeContent()) {
		const foreignObject = createForeignObjectNode({
			el: this._customNodeContent,
			width,
			height
		});
		this.group.add(foreignObject);
		addHoverNode();
		return;
	}
	const { IMG_PLACEMENT, TAG_PLACEMENT } = CONSTANTS;
	const imgPlacement = this.getStyle("imgPlacement") || IMG_PLACEMENT.TOP;
	const tagIsBottom = (this.getStyle("tagPlacement") || TAG_PLACEMENT.RIGHT) === TAG_PLACEMENT.BOTTOM;
	let { textContentWidth, textContentHeight, textContentWidthWithoutTag } = this._rectInfo;
	const textContentHeightWithTag = textContentHeight;
	let totalTagWidth = 0;
	let maxTagHeight = 0;
	const hasTagContent = this._tagData && this._tagData.length > 0;
	if (hasTagContent) {
		const res = this.getTagContentSize(textContentMargin);
		totalTagWidth = res.width;
		maxTagHeight = res.height;
		if (tagIsBottom) textContentHeight -= maxTagHeight + textContentMargin;
	}
	let imgWidth = 0;
	let imgHeight = 0;
	if (this._imgData) {
		imgWidth = this._imgData.width;
		imgHeight = this._imgData.height;
		this.group.add(this._imgData.node);
		switch (imgPlacement) {
			case IMG_PLACEMENT.TOP:
				this._imgData.node.cx(width / 2).y(paddingY);
				break;
			case IMG_PLACEMENT.BOTTOM:
				this._imgData.node.cx(width / 2).y(height - paddingY - imgHeight);
				break;
			case IMG_PLACEMENT.LEFT:
				this._imgData.node.x(paddingX).cy(height / 2);
				break;
			case IMG_PLACEMENT.RIGHT:
				this._imgData.node.x(width - paddingX - imgWidth).cy(height / 2);
				break;
			default: break;
		}
	}
	let textContentNested = new G();
	let textContentOffsetX = 0;
	if (hasTagContent && tagIsBottom) textContentOffsetX = textContentWidthWithoutTag < textContentWidth ? (textContentWidth - textContentWidthWithoutTag) / 2 : 0;
	this.mindMap.nodeInnerPrefixList.forEach((item) => {
		const itemData = this[`_${item.name}Data`];
		if (itemData) {
			itemData.node.x(textContentOffsetX).y((textContentHeight - itemData.height) / 2);
			textContentNested.add(itemData.node);
			textContentOffsetX += itemData.width + textContentMargin;
		}
	});
	if (this._prefixData) {
		const foreignObject = createForeignObjectNode({
			el: this._prefixData.el,
			width: this._prefixData.width,
			height: this._prefixData.height
		});
		foreignObject.x(textContentOffsetX).y((textContentHeight - this._prefixData.height) / 2);
		textContentNested.add(foreignObject);
		textContentOffsetX += this._prefixData.width + textContentMargin;
	}
	let iconNested = new G();
	if (this._iconData && this._iconData.length > 0) {
		let iconLeft = 0;
		this._iconData.forEach((item) => {
			item.node.x(textContentOffsetX + iconLeft).y((textContentHeight - item.height) / 2);
			iconNested.add(item.node);
			iconLeft += item.width + textContentMargin;
		});
		textContentNested.add(iconNested);
		textContentOffsetX += iconLeft;
	}
	if (this._textData) {
		const oldX = this._textData.node.attr("data-offsetx") || 0;
		this._textData.node.attr("data-offsetx", textContentOffsetX);
		(this._textData.nodeContent || this._textData.node).x(-oldX).x(textContentOffsetX).y((textContentHeight - this._textData.height) / 2);
		if (openRealtimeRenderOnNodeTextEdit) this._textData.node.opacity(this.mindMap.renderer.textEdit.getCurrentEditNode() === this ? 0 : 1);
		textContentNested.add(this._textData.node);
		textContentOffsetX += this._textData.width + textContentMargin;
	}
	if (this._hyperlinkData) {
		this._hyperlinkData.node.x(textContentOffsetX).y((textContentHeight - this._hyperlinkData.height) / 2);
		textContentNested.add(this._hyperlinkData.node);
		textContentOffsetX += this._hyperlinkData.width + textContentMargin;
	}
	let tagNested = new G();
	if (hasTagContent) if (tagIsBottom) {
		let tagLeft = 0;
		this._tagData.forEach((item) => {
			item.node.x(tagLeft).y((maxTagHeight - item.height) / 2);
			tagNested.add(item.node);
			tagLeft += item.width + textContentMargin;
		});
		tagNested.x((textContentWidth - totalTagWidth) / 2).y(textContentHeightWithTag - maxTagHeight);
		textContentNested.add(tagNested);
	} else {
		let tagLeft = 0;
		this._tagData.forEach((item) => {
			item.node.x(textContentOffsetX + tagLeft).y((textContentHeight - item.height) / 2);
			tagNested.add(item.node);
			tagLeft += item.width + textContentMargin;
		});
		textContentNested.add(tagNested);
		textContentOffsetX += tagLeft;
	}
	if (this._noteData) {
		this._noteData.node.x(textContentOffsetX).y((textContentHeight - this._noteData.height) / 2);
		textContentNested.add(this._noteData.node);
		textContentOffsetX += this._noteData.width + textContentMargin;
	}
	if (this._attachmentData) {
		this._attachmentData.node.x(textContentOffsetX).y((textContentHeight - this._attachmentData.height) / 2);
		textContentNested.add(this._attachmentData.node);
		textContentOffsetX += this._attachmentData.width + textContentMargin;
	}
	if (this._postfixData) {
		const foreignObject = createForeignObjectNode({
			el: this._postfixData.el,
			width: this._postfixData.width,
			height: this._postfixData.height
		});
		foreignObject.x(textContentOffsetX).y((textContentHeight - this._postfixData.height) / 2);
		textContentNested.add(foreignObject);
		textContentOffsetX += this._postfixData.width;
	}
	this.group.add(textContentNested);
	const { width: bboxWidth, height: bboxHeight } = textContentNested.bbox();
	let translateX = 0;
	let translateY = 0;
	switch (imgPlacement) {
		case IMG_PLACEMENT.TOP:
			translateX = width / 2 - bboxWidth / 2;
			translateY = paddingY + imgHeight + this.getImgTextMarin("v", 0, 0, imgHeight, textContentHeightWithTag);
			break;
		case IMG_PLACEMENT.BOTTOM:
			translateX = width / 2 - bboxWidth / 2;
			translateY = paddingY;
			break;
		case IMG_PLACEMENT.LEFT:
			translateX = imgWidth + paddingX + this.getImgTextMarin("h", imgWidth, textContentWidth);
			translateY = height / 2 - bboxHeight / 2;
			break;
		case IMG_PLACEMENT.RIGHT:
			translateX = paddingX;
			translateY = height / 2 - bboxHeight / 2;
			break;
	}
	textContentNested.translate(translateX, translateY);
	addHoverNode();
	if (this._customContentAddToNodeAdd && this._customContentAddToNodeAdd.el) {
		const foreignObject = createForeignObjectNode(this._customContentAddToNodeAdd);
		this.group.add(foreignObject);
		if (addCustomContentToNode && typeof addCustomContentToNode.handle === "function") addCustomContentToNode.handle({
			content: this._customContentAddToNodeAdd,
			element: foreignObject,
			node: this
		});
	}
	this.mindMap.emit("node_layout_end", this);
}
var nodeLayout_default = {
	getImgTextMarin,
	getTagContentSize,
	getNodeRect,
	layout
};
//#endregion
//#region node_modules/simple-mind-map/src/core/render/node/MindMapNode.js
var MindMapNode = class MindMapNode {
	constructor(opt = {}) {
		this.opt = opt;
		this.nodeData = this.handleData(opt.data || {});
		this.nodeDataSnapshot = "";
		this.uid = opt.uid;
		this.mindMap = opt.mindMap;
		this.renderer = opt.renderer;
		this.draw = this.mindMap.draw;
		this.nodeDraw = this.mindMap.nodeDraw;
		this.lineDraw = this.mindMap.lineDraw;
		this.style = new Style(this);
		this.effectiveStyles = {};
		this.shapeInstance = new Shape(this);
		this.shapePadding = {
			paddingX: 0,
			paddingY: 0
		};
		this.isRoot = opt.isRoot === void 0 ? false : opt.isRoot;
		this.isGeneralization = opt.isGeneralization === void 0 ? false : opt.isGeneralization;
		this.generalizationBelongNode = null;
		this.layerIndex = opt.layerIndex === void 0 ? 0 : opt.layerIndex;
		this.width = opt.width || 0;
		this.height = opt.height || 0;
		this.customTextWidth = opt.data.data.customTextWidth || void 0;
		this._left = opt.left || 0;
		this._top = opt.top || 0;
		this.customLeft = opt.data.data.customLeft || void 0;
		this.customTop = opt.data.data.customTop || void 0;
		this.isDrag = false;
		this.parent = opt.parent || null;
		this.children = opt.children || [];
		this.userList = [];
		this.group = null;
		this.shapeNode = null;
		this.hoverNode = null;
		this._customNodeContent = null;
		this._imgData = null;
		this._iconData = null;
		this._textData = null;
		this._hyperlinkData = null;
		this._tagData = null;
		this._noteData = null;
		this.noteEl = null;
		this.noteContentIsShow = false;
		this._attachmentData = null;
		this._prefixData = null;
		this._postfixData = null;
		this._expandBtn = null;
		this._lastExpandBtnType = null;
		this._showExpandBtn = false;
		this._openExpandNode = null;
		this._closeExpandNode = null;
		this._fillExpandNode = null;
		this._userListGroup = null;
		this._lines = [];
		this._generalizationList = [];
		this._unVisibleRectRegionNode = null;
		this._isMouseenter = false;
		this._customContentAddToNodeAdd = null;
		this._rectInfo = {
			textContentWidth: 0,
			textContentHeight: 0,
			textContentWidthWithoutTag: 0
		};
		this._generalizationNodeWidth = 0;
		this._generalizationNodeHeight = 0;
		this.expandBtnSize = this.mindMap.opt.expandBtnSize;
		this.isMultipleChoice = false;
		this.needLayout = false;
		this.isHide = false;
		const proto = Object.getPrototypeOf(this);
		if (!proto.bindEvent) {
			Object.keys(nodeLayout_default).forEach((item) => {
				proto[item] = nodeLayout_default[item];
			});
			Object.keys(nodeGeneralization_default).forEach((item) => {
				proto[item] = nodeGeneralization_default[item];
			});
			Object.keys(nodeExpandBtn_default).forEach((item) => {
				proto[item] = nodeExpandBtn_default[item];
			});
			Object.keys(nodeExpandBtnPlaceholderRect_default).forEach((item) => {
				proto[item] = nodeExpandBtnPlaceholderRect_default[item];
			});
			Object.keys(nodeCommandWraps_default).forEach((item) => {
				proto[item] = nodeCommandWraps_default[item];
			});
			Object.keys(nodeCreateContents_default).forEach((item) => {
				proto[item] = nodeCreateContents_default[item];
			});
			if (this.mindMap.cooperate) Object.keys(nodeCooperate_default).forEach((item) => {
				proto[item] = nodeCooperate_default[item];
			});
			Object.keys(nodeModifyWidth_default).forEach((item) => {
				proto[item] = nodeModifyWidth_default[item];
			});
			if (this.mindMap.opt.isShowCreateChildBtnIcon) {
				Object.keys(quickCreateChildBtn_default).forEach((item) => {
					proto[item] = quickCreateChildBtn_default[item];
				});
				this.initQuickCreateChildBtn();
			}
			proto.bindEvent = true;
		}
		this.getSize();
		this.updateGeneralization();
		this.initDragHandle();
	}
	get left() {
		return this.customLeft || this._left;
	}
	set left(val) {
		this._left = val;
	}
	get top() {
		return this.customTop || this._top;
	}
	set top(val) {
		this._top = val;
	}
	reset() {
		this.children = [];
		this.parent = null;
		this.isRoot = false;
		this.layerIndex = 0;
		this.left = 0;
		this.top = 0;
	}
	resetWhenDelete() {
		this._isMouseenter = false;
	}
	handleData(data) {
		data.data.expand = data.data.expand === false ? false : true;
		data.data.isActive = data.data.isActive === true ? true : false;
		data.children = data.children || [];
		return data;
	}
	createNodeData(recreateTypes) {
		const { isUseCustomNodeContent, customCreateNodeContent, createNodePrefixContent, createNodePostfixContent, addCustomContentToNode } = this.mindMap.opt;
		const typeList = [
			"custom",
			"image",
			"icon",
			"text",
			"hyperlink",
			"tag",
			"note",
			"attachment",
			"prefix",
			"postfix",
			...this.mindMap.nodeInnerPrefixList.map((item) => {
				return item.name;
			})
		];
		const createTypes = {};
		if (Array.isArray(recreateTypes)) typeList.forEach((item) => {
			if (recreateTypes.includes(item)) createTypes[item] = true;
		});
		else typeList.forEach((item) => {
			createTypes[item] = true;
		});
		if (isUseCustomNodeContent && customCreateNodeContent && createTypes.custom) this._customNodeContent = customCreateNodeContent(this);
		if (this._customNodeContent) {
			addXmlns(this._customNodeContent);
			return;
		}
		if (createTypes.image) this._imgData = this.createImgNode();
		if (createTypes.icon) this._iconData = this.createIconNode();
		if (createTypes.text) this._textData = this.createTextNode();
		if (createTypes.hyperlink) this._hyperlinkData = this.createHyperlinkNode();
		if (createTypes.tag) this._tagData = this.createTagNode();
		if (createTypes.note) this._noteData = this.createNoteNode();
		if (createTypes.attachment) this._attachmentData = this.createAttachmentNode();
		this.mindMap.nodeInnerPrefixList.forEach((item) => {
			if (createTypes[item.name]) this[`_${item.name}Data`] = item.createContent(this);
		});
		if (createTypes.prefix) {
			this._prefixData = createNodePrefixContent ? createNodePrefixContent(this) : null;
			if (this._prefixData && this._prefixData.el) addXmlns(this._prefixData.el);
		}
		if (createTypes.postfix) {
			this._postfixData = createNodePostfixContent ? createNodePostfixContent(this) : null;
			if (this._postfixData && this._postfixData.el) addXmlns(this._postfixData.el);
		}
		if (addCustomContentToNode && typeof addCustomContentToNode.create === "function") {
			this._customContentAddToNodeAdd = addCustomContentToNode.create(this);
			if (this._customContentAddToNodeAdd && this._customContentAddToNodeAdd.el) addXmlns(this._customContentAddToNodeAdd.el);
		}
	}
	getSize(recreateTypes, opt = {}) {
		if (!(opt.ignoreUpdateCustomTextWidth || false)) this.customTextWidth = this.getData("customTextWidth") || void 0;
		this.customLeft = this.getData("customLeft") || void 0;
		this.customTop = this.getData("customTop") || void 0;
		this.createNodeData(recreateTypes);
		const { width, height } = this.getNodeRect();
		const changed = this.width !== width || this.height !== height;
		this.width = width;
		this.height = height;
		return changed;
	}
	bindGroupEvent() {
		this.group.on("click", (e) => {
			this.mindMap.emit("node_click", this, e);
			if (this.isMultipleChoice) {
				e.stopPropagation();
				this.isMultipleChoice = false;
				return;
			}
			if (this.mindMap.opt.onlyOneEnableActiveNodeOnCooperate && this.userList.length > 0) return;
			this.active(e);
		});
		this.group.on("mousedown", (e) => {
			const { readonly, enableCtrlKeyNodeSelection, useLeftKeySelectionRightKeyDrag, mousedownEventPreventDefault } = this.mindMap.opt;
			if (mousedownEventPreventDefault) e.preventDefault();
			if (!readonly) {
				if (this.isRoot) {
					if (e.which === 3 && !useLeftKeySelectionRightKeyDrag) e.stopPropagation();
				} else if (e.which !== 2) e.stopPropagation();
			}
			if (!readonly && (e.ctrlKey || e.metaKey) && enableCtrlKeyNodeSelection) {
				this.isMultipleChoice = true;
				const isActive = this.getData("isActive");
				if (!isActive) this.mindMap.emit("before_node_active", this, this.renderer.activeNodeList);
				this.mindMap.renderer[isActive ? "removeNodeFromActiveList" : "addNodeToActiveList"](this, true);
				this.renderer.emitNodeActiveEvent(isActive ? null : this);
			}
			this.mindMap.emit("node_mousedown", this, e);
		});
		this.group.on("mouseup", (e) => {
			if (!this.isRoot && e.which !== 2 && !this.mindMap.opt.readonly) e.stopPropagation();
			this.mindMap.emit("node_mouseup", this, e);
		});
		this.group.on("mouseenter", (e) => {
			if (this.isDrag) return;
			this._isMouseenter = true;
			this.showExpandBtn();
			if (this.isGeneralization) this.handleGeneralizationMouseenter();
			this.mindMap.emit("node_mouseenter", this, e);
		});
		this.group.on("mouseleave", (e) => {
			if (!this._isMouseenter) return;
			this._isMouseenter = false;
			this.hideExpandBtn();
			if (this.isGeneralization) this.handleGeneralizationMouseleave();
			this.mindMap.emit("node_mouseleave", this, e);
		});
		this.group.on("dblclick", (e) => {
			const { readonly, onlyOneEnableActiveNodeOnCooperate } = this.mindMap.opt;
			if (readonly || e.ctrlKey || e.metaKey) return;
			e.stopPropagation();
			if (onlyOneEnableActiveNodeOnCooperate && this.userList.length > 0) return;
			this.mindMap.emit("node_dblclick", this, e);
		});
		this.group.on("contextmenu", (e) => {
			const { readonly, useLeftKeySelectionRightKeyDrag } = this.mindMap.opt;
			if (readonly || e.ctrlKey) return;
			e.stopPropagation();
			e.preventDefault();
			if (this.mindMap.select && !useLeftKeySelectionRightKeyDrag && this.mindMap.select.hasSelectRange()) return;
			if (!(this.getData("isActive") && this.renderer.activeNodeList.length === 1)) {
				this.renderer.clearActiveNodeList();
				this.active(e);
			}
			this.mindMap.emit("node_contextmenu", e, this);
		});
	}
	active(e) {
		if (this.mindMap.opt.readonly) return;
		e && e.stopPropagation();
		if (this.getData("isActive")) return;
		this.mindMap.emit("before_node_active", this, this.renderer.activeNodeList);
		this.renderer.clearActiveNodeList();
		this.renderer.addNodeToActiveList(this, true);
		this.renderer.emitNodeActiveEvent(this);
	}
	deactivate() {
		this.mindMap.renderer.removeNodeFromActiveList(this);
		this.mindMap.renderer.emitNodeActiveEvent();
	}
	update(forceRender) {
		if (!this.group) return;
		this.updateNodeActiveClass();
		const { alwaysShowExpandBtn, notShowExpandBtn, isShowCreateChildBtnIcon } = this.mindMap.opt;
		const childrenLength = this.getChildrenLength();
		if (!notShowExpandBtn) if (alwaysShowExpandBtn) if (this._expandBtn && childrenLength <= 0) this.removeExpandBtn();
		else this.renderExpandBtn();
		else {
			const { isActive, expand } = this.getData();
			if (childrenLength <= 0) this.removeExpandBtn();
			else if (expand && !isActive && !this._isMouseenter) this.hideExpandBtn();
			else this.showExpandBtn();
		}
		if (isShowCreateChildBtnIcon) if (childrenLength > 0) this.removeQuickCreateChildBtn();
		else {
			const { isActive } = this.getData();
			if (isActive) this.showQuickCreateChildBtn();
			else this.hideQuickCreateChildBtn();
		}
		this.updateDragHandle();
		this.renderGeneralization(forceRender);
		if (this.updateUserListNode) this.updateUserListNode();
		const t = this.group.transform();
		this.nodeDataSnapshot = JSON.stringify(this.getData());
		if (this.left !== t.translateX || this.top !== t.translateY) this.group.translate(this.left - t.translateX, this.top - t.translateY);
	}
	getNodePosInClient(_left, _top) {
		const { scaleX, scaleY, translateX, translateY } = this.mindMap.draw.transform();
		return {
			left: _left * scaleX + translateX,
			top: _top * scaleY + translateY
		};
	}
	checkIsInClient(padding = 0) {
		const { left: nx, top: ny } = this.getNodePosInClient(this.left, this.top);
		return nx + this.width > 0 - padding && ny + this.height > 0 - padding && nx < this.mindMap.width + padding && ny < this.mindMap.height + padding;
	}
	reRender(recreateTypes, opt) {
		const sizeChange = this.getSize(recreateTypes, opt);
		this.layout();
		this.update();
		return sizeChange;
	}
	updateNodeActiveClass() {
		if (!this.group) return;
		const isActive = this.getData("isActive");
		this.group[isActive ? "addClass" : "removeClass"]("active");
	}
	updateNodeByActive(active) {
		if (this.group) {
			const { isShowCreateChildBtnIcon } = this.mindMap.opt;
			if (active) {
				this.showExpandBtn();
				if (isShowCreateChildBtnIcon) this.showQuickCreateChildBtn();
			} else {
				this.hideExpandBtn();
				if (isShowCreateChildBtnIcon) this.hideQuickCreateChildBtn();
			}
			this.updateNodeActiveClass();
			this.updateDragHandle();
		}
	}
	render(callback = () => {}, forceRender = false, async = false) {
		this.renderLine();
		const { openPerformance, performanceConfig } = this.mindMap.opt;
		if (forceRender || !openPerformance || this.checkIsInClient(performanceConfig.padding) || this.isRoot) if (!this.group) {
			this.group = new G();
			this.group.addClass("smm-node");
			this.group.css({ cursor: "default" });
			this.bindGroupEvent();
			this.nodeDraw.add(this.group);
			this.layout();
			this.update(forceRender);
		} else {
			if (!this.nodeDraw.has(this.group)) this.nodeDraw.add(this.group);
			if (this.needLayout) {
				this.needLayout = false;
				this.layout();
			}
			this.updateExpandBtnPlaceholderRect();
			this.update(forceRender);
		}
		else if (openPerformance && performanceConfig.removeNodeWhenOutCanvas) this.removeSelf();
		if (this.children && this.children.length && this.getData("expand") !== false) {
			let index = 0;
			this.children.forEach((item) => {
				const renderChild = () => {
					item.render(() => {
						index++;
						if (index >= this.children.length) callback();
					}, forceRender, async);
				};
				if (async) setTimeout(renderChild, 0);
				else renderChild();
			});
		} else callback();
		if (this.nodeData.inserting) {
			delete this.nodeData.inserting;
			this.active();
			this.mindMap.emit("node_dblclick", this, null, true);
		}
	}
	removeSelf() {
		if (!this.group) return;
		this.group.remove();
		this.removeGeneralization();
	}
	remove() {
		if (!this.group) return;
		this.group.remove();
		this.removeGeneralization();
		this.removeLine();
		if (this.children && this.children.length) this.children.forEach((item) => {
			item.remove();
		});
	}
	destroy() {
		this.removeLine();
		if (this.parent) this.parent.removeLine();
		if (!this.group) return;
		if (this.emptyUser) this.emptyUser();
		this.resetWhenDelete();
		this.group.remove();
		this.removeGeneralization();
		this.group = null;
		this.style.onRemove();
	}
	hide() {
		if (this.group) this.group.hide();
		this.hideGeneralization();
		if (this.parent) {
			const index = this.parent.children.indexOf(this);
			this.parent._lines[index] && this.parent._lines[index].hide();
			this._lines.forEach((item) => {
				item.hide();
			});
		}
		if (this.children && this.children.length) this.children.forEach((item) => {
			item.hide();
		});
	}
	show() {
		if (!this.group) return;
		this.group.show();
		this.showGeneralization();
		if (this.parent) {
			const index = this.parent.children.indexOf(this);
			this.parent._lines[index] && this.parent._lines[index].show();
			this._lines.forEach((item) => {
				item.show();
			});
		}
		if (this.children && this.children.length) this.children.forEach((item) => {
			item.show();
		});
	}
	setOpacity(val) {
		if (this.group) this.group.opacity(val);
		this._lines.forEach((line) => {
			line.opacity(val);
		});
		this.children.forEach((item) => {
			item.setOpacity(val);
		});
		this.setGeneralizationOpacity(val);
	}
	hideChildren() {
		this._lines.forEach((item) => {
			item.hide();
		});
		if (this.children && this.children.length) this.children.forEach((item) => {
			item.hide();
		});
	}
	showChildren() {
		this._lines.forEach((item) => {
			item.show();
		});
		if (this.children && this.children.length) this.children.forEach((item) => {
			item.show();
		});
	}
	startDrag() {
		this.isDrag = true;
		if (this.group) this.group.addClass("smm-node-dragging");
	}
	endDrag() {
		this.isDrag = false;
		if (this.group) this.group.removeClass("smm-node-dragging");
	}
	renderLine(deep = false) {
		if (this.getData("expand") === false) return;
		let childrenLen = this.getChildrenLength();
		if (this.mindMap.opt.layout === CONSTANTS.LAYOUT.FISHBONE && (this.isRoot || this.layerIndex === 1)) childrenLen = 0;
		if (childrenLen > this._lines.length) new Array(childrenLen - this._lines.length).fill(0).forEach(() => {
			this._lines.push(this.lineDraw.path());
		});
		else if (childrenLen < this._lines.length) {
			this._lines.slice(childrenLen).forEach((line) => {
				line.remove();
			});
			this._lines = this._lines.slice(0, childrenLen);
		}
		this.renderer.layout.renderLine(this, this._lines, (...args) => {
			this.styleLine(...args);
		}, this.style.getStyle("lineStyle", true));
		if (deep && this.children && this.children.length > 0) this.children.forEach((item) => {
			item.renderLine(deep);
		});
	}
	getShape() {
		return this.mindMap.themeConfig.nodeUseLineStyle ? CONSTANTS.SHAPE.RECTANGLE : this.style.getStyle("shape", false, false);
	}
	hasCustomPosition() {
		return this.customLeft !== void 0 && this.customTop !== void 0;
	}
	ancestorHasCustomPosition() {
		let node = this;
		while (node) {
			if (node.hasCustomPosition()) return true;
			node = node.parent;
		}
		return false;
	}
	ancestorHasGeneralization() {
		let node = this.parent;
		while (node) {
			if (node.checkHasGeneralization()) return true;
			node = node.parent;
		}
		return false;
	}
	addChildren(node) {
		this.children.push(node);
	}
	styleLine(line, childNode, enableMarker) {
		const { enableInheritAncestorLineStyle } = this.mindMap.opt;
		const getName = enableInheritAncestorLineStyle ? "getSelfInhertStyle" : "getSelfStyle";
		const width = childNode[getName]("lineWidth") || childNode.getStyle("lineWidth", true);
		const color = childNode[getName]("lineColor") || this.getRainbowLineColor(childNode) || childNode.getStyle("lineColor", true);
		const dasharray = childNode[getName]("lineDasharray") || childNode.getStyle("lineDasharray", true);
		this.style.line(line, {
			width,
			color,
			dasharray
		}, enableMarker, childNode);
	}
	getRainbowLineColor(node) {
		return this.mindMap.rainbowLines ? this.mindMap.rainbowLines.getNodeColor(node) : "";
	}
	removeLine() {
		this._lines.forEach((line) => {
			line.remove();
		});
		this._lines = [];
	}
	isAncestor(node) {
		if (this.uid === node.uid) return false;
		let parent = node.parent;
		while (parent) {
			if (this.uid === parent.uid) return true;
			parent = parent.parent;
		}
		return false;
	}
	isParent(node) {
		if (this.uid === node.uid) return false;
		const parent = node.parent;
		if (parent && this.uid === parent.uid) return true;
		return false;
	}
	isBrother(node) {
		if (!this.parent || this.uid === node.uid) return false;
		return this.parent.children.find((item) => {
			return item.uid === node.uid;
		});
	}
	getIndexInBrothers() {
		return this.parent && this.parent.children ? this.parent.children.findIndex((item) => {
			return item.uid === this.uid;
		}) : -1;
	}
	getPaddingVale() {
		return {
			paddingX: this.getStyle("paddingX"),
			paddingY: this.getStyle("paddingY")
		};
	}
	getStyle(prop, root) {
		const v = this.style.merge(prop, root);
		return v === void 0 ? "" : v;
	}
	getSelfStyle(prop) {
		return this.style.getSelfStyle(prop);
	}
	getParentSelfStyle(prop) {
		if (this.parent) return this.parent.getSelfStyle(prop) || this.parent.getParentSelfStyle(prop);
		return null;
	}
	getSelfInhertStyle(prop) {
		return this.getSelfStyle(prop) || this.getParentSelfStyle(prop);
	}
	getBorderWidth() {
		return this.style.merge("borderWidth", false) || 0;
	}
	getData(key) {
		return key ? this.nodeData.data[key] : this.nodeData.data;
	}
	getPureData(removeActiveState = true, removeId = false) {
		return copyNodeTree({}, this, removeActiveState, removeId);
	}
	getAncestorNodes() {
		const list = [];
		let parent = this.parent;
		while (parent) {
			list.unshift(parent);
			parent = parent.parent;
		}
		return list;
	}
	hasCustomStyle() {
		return this.style.hasCustomStyle();
	}
	getRect() {
		return this.group ? this.group.rbox() : null;
	}
	getRectInSvg() {
		const { scaleX, scaleY, translateX, translateY } = this.mindMap.draw.transform();
		let { left, top, width, height } = this;
		const right = (left + width) * scaleX + translateX;
		const bottom = (top + height) * scaleY + translateY;
		left = left * scaleX + translateX;
		top = top * scaleY + translateY;
		return {
			left,
			right,
			top,
			bottom,
			width: width * scaleX,
			height: height * scaleY
		};
	}
	highlight() {
		if (this.group) this.group.addClass("smm-node-highlight");
	}
	closeHighlight() {
		if (this.group) this.group.removeClass("smm-node-highlight");
	}
	fakeClone() {
		const newNode = new MindMapNode({
			...this.opt,
			uid: createUid()
		});
		Object.keys(this).forEach((item) => {
			newNode[item] = this[item];
		});
		return newNode;
	}
	createSvgTextNode(text = "") {
		return new Text().text(text);
	}
	getSvgObjects() {
		return {
			SVG,
			G,
			Rect
		};
	}
	checkEnableDragModifyNodeWidth() {
		const { enableDragModifyNodeWidth, isUseCustomNodeContent, customCreateNodeContent } = this.mindMap.opt;
		return enableDragModifyNodeWidth && (this.mindMap.richText || isUseCustomNodeContent && customCreateNodeContent);
	}
	hasCustomWidth() {
		return this.checkEnableDragModifyNodeWidth() && this.customTextWidth !== void 0;
	}
	getChildrenLength() {
		return this.nodeData.children ? this.nodeData.children.length : 0;
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/utils/Lru.js
var Lru = class {
	constructor(max) {
		this.max = max || 1e3;
		this.size = 0;
		this.pool = /* @__PURE__ */ new Map();
	}
	add(key, value) {
		if (!this.has(key) && this.size >= this.max) return false;
		this.delete(key);
		this.pool.set(key, value);
		this.size++;
		return true;
	}
	delete(key) {
		if (this.pool.has(key)) {
			this.pool.delete(key);
			this.size--;
		}
	}
	has(key) {
		return this.pool.has(key);
	}
	get(key) {
		if (this.pool.has(key)) return this.pool.get(key);
	}
	clear() {
		this.size = 0;
		this.pool = /* @__PURE__ */ new Map();
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/layouts/Base.js
var Base = class {
	constructor(renderer) {
		this.renderer = renderer;
		this.mindMap = renderer.mindMap;
		this.draw = this.mindMap.draw;
		this.lineDraw = this.mindMap.lineDraw;
		this.root = null;
		this.lru = new Lru(this.mindMap.opt.maxNodeCacheCount);
		this.rootNodeCenterOffset = null;
	}
	doLayout() {
		throw new Error("【computed】方法为必要方法，需要子类进行重写！");
	}
	renderLine() {
		throw new Error("【renderLine】方法为必要方法，需要子类进行重写！");
	}
	renderExpandBtn() {
		throw new Error("【renderExpandBtn】方法为必要方法，需要子类进行重写！");
	}
	renderGeneralization() {}
	cacheNode(uid, node) {
		this.renderer.nodeCache[uid] = node;
		this.lru.add(uid, node);
	}
	checkIsNeedResizeSources() {
		return [CONSTANTS.CHANGE_THEME].includes(this.renderer.renderSource);
	}
	checkIsLayerTypeChange(oldIndex, newIndex) {
		if (oldIndex >= 2 && newIndex >= 2) return false;
		if (oldIndex >= 2 && newIndex < 2) return true;
		if (oldIndex < 2 && newIndex >= 2) return true;
	}
	checkIsLayoutChangeRerenderExpandBtnPlaceholderRect(node) {
		if (this.renderer.renderSource === CONSTANTS.CHANGE_LAYOUT) node.needRerenderExpandBtnPlaceholderRect = true;
	}
	checkIsNodeDataChange(lastData, curData) {
		if (lastData) {
			lastData = typeof lastData === "string" ? JSON.parse(lastData) : lastData;
			lastData.isActive = curData.isActive;
			lastData.expand = curData.expand;
			lastData = JSON.stringify(lastData);
		}
		return lastData !== JSON.stringify(curData);
	}
	createNode(data, parent, isRoot, layerIndex, index, ancestors) {
		const nodeInnerPrefixData = {};
		this.mindMap.nodeInnerPrefixList.forEach((item) => {
			if (item.createNodeData) {
				const [key, value] = item.createNodeData({
					data,
					parent,
					ancestors,
					layerIndex,
					index
				});
				nodeInnerPrefixData[key] = value;
			}
		});
		const uid = data.data.uid;
		let newNode = null;
		if (data && data._node && !this.renderer.reRender) {
			newNode = data._node;
			const isLayerTypeChange = this.checkIsLayerTypeChange(newNode.layerIndex, layerIndex);
			newNode.reset();
			newNode.layerIndex = layerIndex;
			if (isRoot) newNode.isRoot = true;
			else newNode.parent = parent._node;
			this.cacheNode(data._node.uid, newNode);
			this.checkIsLayoutChangeRerenderExpandBtnPlaceholderRect(newNode);
			let isNodeInnerPrefixChange = false;
			this.mindMap.nodeInnerPrefixList.forEach((item) => {
				if (item.updateNodeData) {
					const isChange = item.updateNodeData(newNode, nodeInnerPrefixData);
					if (isChange) isNodeInnerPrefixChange = isChange;
				}
			});
			const isResizeSource = this.checkIsNeedResizeSources();
			const isNodeDataChange = this.checkIsNodeDataChange(data._node.nodeDataSnapshot, data.data);
			if (isResizeSource || isNodeDataChange || isLayerTypeChange || newNode.getData("resetRichText") || newNode.getData("needUpdate") || isNodeInnerPrefixChange) {
				newNode.getSize();
				newNode.needLayout = true;
			}
			this.checkGetGeneralizationChange(newNode, isResizeSource);
		} else if ((this.lru.has(uid) || this.renderer.lastNodeCache[uid]) && !this.renderer.reRender) {
			newNode = this.lru.get(uid) || this.renderer.lastNodeCache[uid];
			const lastData = JSON.stringify(newNode.getData());
			const isLayerTypeChange = this.checkIsLayerTypeChange(newNode.layerIndex, layerIndex);
			newNode.reset();
			newNode.nodeData = newNode.handleData(data || {});
			newNode.layerIndex = layerIndex;
			if (isRoot) newNode.isRoot = true;
			else newNode.parent = parent._node;
			this.cacheNode(uid, newNode);
			this.checkIsLayoutChangeRerenderExpandBtnPlaceholderRect(newNode);
			data._node = newNode;
			const isResizeSource = this.checkIsNeedResizeSources();
			const isNodeDataChange = this.checkIsNodeDataChange(lastData, data.data);
			let isNodeInnerPrefixChange = false;
			this.mindMap.nodeInnerPrefixList.forEach((item) => {
				if (item.updateNodeData) {
					const isChange = item.updateNodeData(newNode, nodeInnerPrefixData);
					if (isChange) isNodeInnerPrefixChange = isChange;
				}
			});
			if (isResizeSource || isNodeDataChange || isLayerTypeChange || newNode.getData("resetRichText") || newNode.getData("needUpdate") || isNodeInnerPrefixChange) {
				newNode.getSize();
				newNode.needLayout = true;
			}
			this.checkGetGeneralizationChange(newNode, isResizeSource);
		} else {
			const newUid = uid || createUid();
			newNode = new MindMapNode({
				data,
				uid: newUid,
				renderer: this.renderer,
				mindMap: this.mindMap,
				draw: this.draw,
				layerIndex,
				isRoot,
				parent: !isRoot ? parent._node : null,
				...nodeInnerPrefixData
			});
			data.data.uid = newUid;
			this.cacheNode(newUid, newNode);
			data._node = newNode;
		}
		if (data.data.isActive) this.renderer.addNodeToActiveList(newNode);
		if (this.mindMap.renderer.findActiveNodeIndex(newNode) !== -1) newNode.setData({ isActive: true });
		if (isRoot) this.root = newNode;
		else parent._node.addChildren(newNode);
		return newNode;
	}
	checkGetGeneralizationChange(node, isResizeSource) {
		const generalizationList = node.getData("generalization");
		if (generalizationList && node._generalizationList && node._generalizationList.length > 0) node._generalizationList.forEach((item, index) => {
			const gNode = item.generalizationNode;
			const oldData = gNode.getData();
			const newData = generalizationList[index];
			if (isResizeSource || newData && JSON.stringify(oldData) !== JSON.stringify(newData)) {
				if (newData) gNode.nodeData.data = newData;
				gNode.getSize();
				gNode.needLayout = true;
			}
		});
	}
	formatPosition(value, size, nodeSize) {
		if (typeof value === "number") return value;
		else if (initRootNodePositionMap[value] !== void 0) return size * initRootNodePositionMap[value];
		else if (/^\d\d*%$/.test(value)) return Number.parseFloat(value) / 100 * size;
		else return (size - nodeSize) / 2;
	}
	formatInitRootNodePosition(pos) {
		const { CENTER } = CONSTANTS.INIT_ROOT_NODE_POSITION;
		if (!pos || !Array.isArray(pos) || pos.length < 2) pos = [CENTER, CENTER];
		return pos;
	}
	setNodeCenter(node, position) {
		let { initRootNodePosition } = this.mindMap.opt;
		initRootNodePosition = this.formatInitRootNodePosition(position || initRootNodePosition);
		node.left = this.formatPosition(initRootNodePosition[0], this.mindMap.width, node.width);
		node.top = this.formatPosition(initRootNodePosition[1], this.mindMap.height, node.height);
	}
	getRootCenterOffset(width, height) {
		if (this.rootNodeCenterOffset) return this.rootNodeCenterOffset;
		let { initRootNodePosition } = this.mindMap.opt;
		const { CENTER } = CONSTANTS.INIT_ROOT_NODE_POSITION;
		initRootNodePosition = this.formatInitRootNodePosition(initRootNodePosition);
		if (initRootNodePosition[0] === CENTER && initRootNodePosition[1] === CENTER) this.rootNodeCenterOffset = {
			x: 0,
			y: 0
		};
		else {
			const tmpNode = {
				width,
				height
			};
			const tmpNode2 = {
				width,
				height
			};
			this.setNodeCenter(tmpNode, [CENTER, CENTER]);
			this.setNodeCenter(tmpNode2);
			this.rootNodeCenterOffset = {
				x: tmpNode2.left - tmpNode.left,
				y: tmpNode2.top - tmpNode.top
			};
		}
		return this.rootNodeCenterOffset;
	}
	updateChildren(children, prop, offset) {
		children.forEach((item) => {
			item[prop] += offset;
			if (item.children && item.children.length && !item.hasCustomPosition()) this.updateChildren(item.children, prop, offset);
		});
	}
	updateChildrenPro(children, props) {
		children.forEach((item) => {
			Object.keys(props).forEach((prop) => {
				item[prop] += props[prop];
			});
			if (item.children && item.children.length && !item.hasCustomPosition()) this.updateChildrenPro(item.children, props);
		});
	}
	getNodeAreaWidth(node, withGeneralization = false) {
		let widthArr = [];
		let totalGeneralizationNodeWidth = 0;
		let loop = (node, width) => {
			if (withGeneralization && node.checkHasGeneralization()) totalGeneralizationNodeWidth += node._generalizationNodeWidth;
			if (node.children.length) {
				width += node.width / 2;
				node.children.forEach((item) => {
					loop(item, width);
				});
			} else {
				width += node.width;
				widthArr.push(width);
			}
		};
		loop(node, 0);
		return Math.max(...widthArr) + totalGeneralizationNodeWidth;
	}
	quadraticCurvePath(x1, y1, x2, y2, v = false) {
		let cx, cy;
		if (v) {
			cx = x1 + (x2 - x1) * .8;
			cy = y1 + (y2 - y1) * .2;
		} else {
			cx = x1 + (x2 - x1) * .2;
			cy = y1 + (y2 - y1) * .8;
		}
		return `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`;
	}
	cubicBezierPath(x1, y1, x2, y2, v = false) {
		let cx1, cy1, cx2, cy2;
		if (v) {
			cx1 = x1;
			cy1 = y1 + (y2 - y1) / 2;
			cx2 = x2;
			cy2 = cy1;
		} else {
			cx1 = x1 + (x2 - x1) / 2;
			cy1 = y1;
			cx2 = cx1;
			cy2 = y2;
		}
		return `M ${x1},${y1} C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
	}
	computeNewPoint(a, b, radius = 0) {
		if (a[0] === b[0]) if (b[1] > a[1]) return [b[0], b[1] - radius];
		else return [b[0], b[1] + radius];
		else if (a[1] === b[1]) if (b[0] > a[0]) return [b[0] - radius, b[1]];
		else return [b[0] + radius, b[1]];
	}
	createFoldLine(list) {
		const { lineRadius } = this.mindMap.themeConfig;
		const len = list.length;
		let path = "";
		let radiusPath = "";
		if (len >= 3 && lineRadius > 0) {
			const start = list[len - 3];
			const center = list[len - 2];
			const end = list[len - 1];
			if (!(start[0].toFixed(0) === center[0].toFixed(0) && center[0].toFixed(0) === end[0].toFixed(0) || start[1].toFixed(0) === center[1].toFixed(0) && center[1].toFixed(0) === end[1].toFixed(0))) {
				const cStart = this.computeNewPoint(start, center, lineRadius);
				const cEnd = this.computeNewPoint(end, center, lineRadius);
				radiusPath = `Q ${center[0]},${center[1]} ${cEnd[0]},${cEnd[1]}`;
				list.splice(len - 2, 1, cStart, radiusPath);
			}
		}
		list.forEach((item, index) => {
			if (typeof item === "string") path += item;
			else {
				const [x, y] = item;
				if (index === 0) path += `M ${x},${y}`;
				else path += `L ${x},${y}`;
			}
		});
		return path;
	}
	getMarginX(layerIndex) {
		const { themeConfig, opt } = this.mindMap;
		const { second, node } = themeConfig;
		const hoverRectPadding = opt.hoverRectPadding * 2;
		return layerIndex === 1 ? second.marginX + hoverRectPadding : node.marginX + hoverRectPadding;
	}
	getMarginY(layerIndex) {
		const { themeConfig, opt } = this.mindMap;
		const { second, node } = themeConfig;
		const hoverRectPadding = opt.hoverRectPadding * 2;
		return layerIndex === 1 ? second.marginY + hoverRectPadding : node.marginY + hoverRectPadding;
	}
	getNodeWidthWithGeneralization(node) {
		return Math.max(node.width, node.checkHasGeneralization() ? node._generalizationNodeWidth : 0);
	}
	getNodeHeightWithGeneralization(node) {
		return Math.max(node.height, node.checkHasGeneralization() ? node._generalizationNodeHeight : 0);
	}
	/**
	* dir：生长方向，h（水平）、v（垂直）
	* isLeft：是否向左生长
	*/
	getNodeBoundaries(node, dir) {
		let { generalizationLineMargin, generalizationNodeMargin } = this.mindMap.themeConfig;
		let walk = (root) => {
			let _left = Infinity;
			let _right = -Infinity;
			let _top = Infinity;
			let _bottom = -Infinity;
			if (root.children && root.children.length > 0) root.children.forEach((child) => {
				let { left, right, top, bottom } = walk(child);
				let generalizationWidth = child.checkHasGeneralization() && child.getData("expand") ? child._generalizationNodeWidth + generalizationNodeMargin : 0;
				let generalizationHeight = child.checkHasGeneralization() && child.getData("expand") ? child._generalizationNodeHeight + generalizationNodeMargin : 0;
				if (left - (dir === "h" ? generalizationWidth : 0) < _left) _left = left - (dir === "h" ? generalizationWidth : 0);
				if (right + (dir === "h" ? generalizationWidth : 0) > _right) _right = right + (dir === "h" ? generalizationWidth : 0);
				if (top < _top) _top = top;
				if (bottom + (dir === "v" ? generalizationHeight : 0) > _bottom) _bottom = bottom + (dir === "v" ? generalizationHeight : 0);
			});
			let cur = {
				left: root.left,
				right: root.left + root.width,
				top: root.top,
				bottom: root.top + root.height
			};
			return {
				left: cur.left < _left ? cur.left : _left,
				right: cur.right > _right ? cur.right : _right,
				top: cur.top < _top ? cur.top : _top,
				bottom: cur.bottom > _bottom ? cur.bottom : _bottom
			};
		};
		let { left, right, top, bottom } = walk(node);
		return {
			left,
			right,
			top,
			bottom,
			generalizationLineMargin,
			generalizationNodeMargin
		};
	}
	getChildrenBoundaries(node, dir, startIndex = 0, endIndex) {
		let { generalizationLineMargin, generalizationNodeMargin } = this.mindMap.themeConfig;
		const children = node.children.slice(startIndex, endIndex + 1);
		let left = Infinity;
		let right = -Infinity;
		let top = Infinity;
		let bottom = -Infinity;
		children.forEach((item) => {
			const cur = this.getNodeBoundaries(item, dir);
			left = cur.left < left ? cur.left : left;
			right = cur.right > right ? cur.right : right;
			top = cur.top < top ? cur.top : top;
			bottom = cur.bottom > bottom ? cur.bottom : bottom;
		});
		return {
			left,
			right,
			top,
			bottom,
			generalizationLineMargin,
			generalizationNodeMargin
		};
	}
	getNodeGeneralizationRenderBoundaries(item, dir) {
		let res = null;
		if (item.range) res = this.getChildrenBoundaries(item.node, dir, item.range[0], item.range[1]);
		else res = this.getNodeBoundaries(item.node, dir);
		return res;
	}
	getNodeActChildrenLength(node) {
		return node.nodeData.children && node.nodeData.children.length;
	}
	setLineStyle(style, line, path, childNode) {
		line.plot(this.transformPath(path));
		style && style(line, childNode, true);
	}
	transformPath(path) {
		const { customTransformNodeLinePath } = this.mindMap.opt;
		if (customTransformNodeLinePath) return customTransformNodeLinePath(path);
		else return path;
	}
};
//#endregion
export { shapeList as n, Style as r, Base as t };
