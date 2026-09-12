import { Ct as v4, M as getRectRelativePosition, N as getStrWithBrFromHtml, S as focusInput, St as Text, ct as throttle, i as bfsWalk, it as selectAllInput, ut as walk } from "./utils-DKbIT76G.js";
//#region node_modules/simple-mind-map/src/plugins/associativeLine/associativeLineUtils.js
var getAssociativeLineTargetIndex = (node, toNode) => {
	return node.getData("associativeLineTargets").findIndex((item) => {
		return item === toNode.getData("uid");
	});
};
var computeCubicBezierPathPoints = (x1, y1, x2, y2) => {
	const min = 5;
	let cx1 = x1 + (x2 - x1) / 2;
	let cy1 = y1;
	let cx2 = cx1;
	let cy2 = y2;
	if (Math.abs(x1 - x2) <= min) {
		cx1 = x1 + (y2 - y1) / 2;
		cx2 = cx1;
	}
	if (Math.abs(y1 - y2) <= min) {
		cx1 = x1;
		cy1 = y1 - (x2 - x1) / 2;
		cx2 = x2;
		cy2 = cy1;
	}
	return [{
		x: cx1,
		y: cy1
	}, {
		x: cx2,
		y: cy2
	}];
};
var joinCubicBezierPath = (startPoint, endPoint, point1, point2) => {
	return `M ${startPoint.x},${startPoint.y} C ${point1.x},${point1.y} ${point2.x},${point2.y} ${endPoint.x},${endPoint.y}`;
};
var getNodeRect = (node) => {
	let { left, top, width, height } = node;
	return {
		right: left + width,
		bottom: top + height,
		left,
		top,
		width,
		height
	};
};
var cubicBezierPath = (x1, y1, x2, y2) => {
	let points = computeCubicBezierPathPoints(x1, y1, x2, y2);
	return joinCubicBezierPath({
		x: x1,
		y: y1
	}, {
		x: x2,
		y: y2
	}, points[0], points[1]);
};
var calcPoint = (node, e) => {
	const { left, top, translateLeft, translateTop, width, height } = node;
	const clientX = e.clientX;
	const clientY = e.clientY;
	const centerX = translateLeft + width / 2;
	const centerY = translateTop + height / 2;
	const translateCenterX = left + width / 2;
	const translateCenterY = top + height / 2;
	const theta = Math.atan(height / width);
	const deltaX = clientX - centerX;
	const deltaY = centerY - clientY;
	const direction = Math.atan2(deltaY, deltaX);
	let x = left + width;
	let y = top + height;
	if (direction < theta && direction >= -theta) {
		const range = direction * (width / 2);
		if (direction < theta && direction >= 0) y = translateCenterY - range;
		else if (direction >= -theta && direction < 0) y = translateCenterY - range;
		return {
			x,
			y,
			dir: "right",
			range
		};
	} else if (direction >= theta && direction < Math.PI - theta) {
		y = top;
		let range = 0;
		if (direction < Math.PI / 2 - theta && direction >= theta) {
			const side = height / 2 / direction;
			range = -side;
			x = translateCenterX + side;
		} else if (direction >= Math.PI / 2 - theta && direction < Math.PI - theta) {
			const tanValue = (centerX - clientX) / (centerY - clientY);
			const side = height / 2 * tanValue;
			range = side;
			x = translateCenterX - side;
		}
		return {
			x,
			y,
			dir: "top",
			range
		};
	} else if (direction < -theta && direction >= theta - Math.PI) {
		let range = 0;
		if (direction >= theta - Math.PI / 2 && direction < -theta) {
			const side = height / 2 / direction;
			range = side;
			x = translateCenterX - side;
		} else if (direction < theta - Math.PI / 2 && direction >= theta - Math.PI) {
			const tanValue = (centerX - clientX) / (centerY - clientY);
			const side = height / 2 * tanValue;
			range = -side;
			x = translateCenterX + side;
		}
		return {
			x,
			y,
			dir: "bottom",
			range
		};
	}
	x = left;
	const range = (centerY - clientY) / (centerX - clientX) * (width / 2);
	if (direction >= -Math.PI && direction < theta - Math.PI) y = translateCenterY - range;
	else if (direction < Math.PI && direction >= Math.PI - theta) y = translateCenterY - range;
	return {
		x,
		y,
		dir: "left",
		range
	};
};
var getNodePoint = (node, dir = "right", range = 0, e = null) => {
	let { left, top, width, height } = node;
	if (e) return calcPoint(node, e);
	switch (dir) {
		case "left": return {
			x: left,
			y: top + height / 2 - range,
			dir
		};
		case "right": return {
			x: left + width,
			y: top + height / 2 - range,
			dir
		};
		case "top": return {
			x: left + width / 2 - range,
			y: top,
			dir
		};
		case "bottom": return {
			x: left + width / 2 - range,
			y: top + height,
			dir
		};
		default: break;
	}
};
var computeNodePoints = (fromNode, toNode) => {
	const fromRect = getNodeRect(fromNode);
	const toRect = getNodeRect(toNode);
	let fromDir = "";
	let toDir = "";
	switch (getRectRelativePosition({
		x: fromRect.left,
		y: fromRect.top,
		width: fromRect.width,
		height: fromRect.height
	}, {
		x: toRect.left,
		y: toRect.top,
		width: toRect.width,
		height: toRect.height
	})) {
		case "left-top":
			fromDir = "right";
			toDir = "top";
			break;
		case "right-top":
			fromDir = "left";
			toDir = "top";
			break;
		case "right-bottom":
			fromDir = "left";
			toDir = "bottom";
			break;
		case "left-bottom":
			fromDir = "right";
			toDir = "bottom";
			break;
		case "left":
			fromDir = "right";
			toDir = "left";
			break;
		case "right":
			fromDir = "left";
			toDir = "right";
			break;
		case "top":
			fromDir = "right";
			toDir = "right";
			break;
		case "bottom":
			fromDir = "left";
			toDir = "left";
			break;
		case "overlap":
			fromDir = "right";
			toDir = "right";
			break;
		default: break;
	}
	return [getNodePoint(fromNode, fromDir), getNodePoint(toNode, toDir)];
};
var getNodeLinePath = (startPoint, endPoint, node, toNode) => {
	let targetIndex = getAssociativeLineTargetIndex(node, toNode);
	let controlPoints = [];
	let associativeLineTargetControlOffsets = node.getData("associativeLineTargetControlOffsets");
	if (associativeLineTargetControlOffsets && associativeLineTargetControlOffsets[targetIndex]) {
		let offsets = associativeLineTargetControlOffsets[targetIndex];
		controlPoints = [{
			x: startPoint.x + offsets[0].x,
			y: startPoint.y + offsets[0].y
		}, {
			x: endPoint.x + offsets[1].x,
			y: endPoint.y + offsets[1].y
		}];
	} else controlPoints = computeCubicBezierPathPoints(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
	return {
		path: joinCubicBezierPath(startPoint, endPoint, controlPoints[0], controlPoints[1]),
		controlPoints
	};
};
var getDefaultControlPointOffsets = (startPoint, endPoint) => {
	let controlPoints = computeCubicBezierPathPoints(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
	return [{
		x: controlPoints[0].x - startPoint.x,
		y: controlPoints[0].y - startPoint.y
	}, {
		x: controlPoints[1].x - endPoint.x,
		y: controlPoints[1].y - endPoint.y
	}];
};
//#endregion
//#region node_modules/simple-mind-map/src/plugins/associativeLine/associativeLineControls.js
function createControlNodes(node, toNode) {
	let { associativeLineActiveColor } = this.getStyleConfig(node, toNode);
	this.controlLine1 = this.associativeLineDraw.line().stroke({
		color: associativeLineActiveColor,
		width: 2
	});
	this.controlLine2 = this.associativeLineDraw.line().stroke({
		color: associativeLineActiveColor,
		width: 2
	});
	this.controlPoint1 = this.createOneControlNode("controlPoint1", node, toNode);
	this.controlPoint2 = this.createOneControlNode("controlPoint2", node, toNode);
}
function createOneControlNode(pointKey, node, toNode) {
	let { associativeLineActiveColor } = this.getStyleConfig(node, toNode);
	return this.associativeLineDraw.circle(this.controlPointDiameter).stroke({ color: associativeLineActiveColor }).fill({ color: "#fff" }).click((e) => {
		e.stopPropagation();
	}).mousedown((e) => {
		this.onControlPointMousedown(e, pointKey);
	});
}
function onControlPointMousedown(e, pointKey) {
	e.stopPropagation();
	e.preventDefault();
	this.isControlPointMousedown = true;
	this.mousedownControlPointKey = pointKey;
}
function onControlPointMousemove(e) {
	if (!this.isControlPointMousedown || !this.mousedownControlPointKey || !this[this.mousedownControlPointKey]) return;
	e.stopPropagation();
	e.preventDefault();
	let radius = this.controlPointDiameter / 2;
	let { x, y } = this.getTransformedEventPos(e);
	this.controlPointMousemoveState.pos = {
		x,
		y
	};
	this[this.mousedownControlPointKey].x(x - radius).y(y - radius);
	let [, , , node, toNode] = this.activeLine;
	let targetIndex = getAssociativeLineTargetIndex(node, toNode);
	let { associativeLinePoint, associativeLineTargetControlOffsets } = node.getData();
	associativeLinePoint = associativeLinePoint || [];
	const nodePos = this.getNodePos(node);
	const toNodePos = this.getNodePos(toNode);
	let [startPoint, endPoint] = this.updateAllLinesPos(node, toNode, associativeLinePoint[targetIndex]);
	this.controlPointMousemoveState.startPoint = startPoint;
	this.controlPointMousemoveState.endPoint = endPoint;
	this.controlPointMousemoveState.targetIndex = targetIndex;
	let offsets = [];
	if (!associativeLineTargetControlOffsets) offsets = getDefaultControlPointOffsets(startPoint, endPoint);
	else offsets = associativeLineTargetControlOffsets[targetIndex];
	let point1 = null;
	let point2 = null;
	const { x: clientX, y: clientY } = this.mindMap.toPos(e.clientX, e.clientY);
	const _e = {
		clientX,
		clientY
	};
	if (this.mousedownControlPointKey === "controlPoint1") {
		startPoint = getNodePoint(nodePos, "", 0, _e);
		point1 = {
			x,
			y
		};
		point2 = {
			x: endPoint.x + offsets[1].x,
			y: endPoint.y + offsets[1].y
		};
		if (startPoint) {
			this.controlPointMousemoveState.startPoint = startPoint;
			this.controlLine1.plot(startPoint.x, startPoint.y, point1.x, point1.y);
		}
	} else {
		endPoint = getNodePoint(toNodePos, "", 0, _e);
		point1 = {
			x: startPoint.x + offsets[0].x,
			y: startPoint.y + offsets[0].y
		};
		point2 = {
			x,
			y
		};
		if (endPoint) {
			this.controlPointMousemoveState.endPoint = endPoint;
			this.controlLine2.plot(endPoint.x, endPoint.y, point2.x, point2.y);
		}
	}
	this.updataAassociativeLine(startPoint, endPoint, point1, point2, this.activeLine);
}
function updataAassociativeLine(startPoint, endPoint, point1, point2, activeLine) {
	const [path, clickPath, text] = activeLine;
	const pathStr = joinCubicBezierPath(startPoint, endPoint, point1, point2);
	path.plot(pathStr);
	clickPath.plot(pathStr);
	this.updateTextPos(path, text);
	this.updateTextEditBoxPos(text);
}
function onControlPointMouseup(e) {
	if (!this.isControlPointMousedown) return;
	e.stopPropagation();
	e.preventDefault();
	let { pos, startPoint, endPoint, targetIndex } = this.controlPointMousemoveState;
	let [, , , node] = this.activeLine;
	let offsetList = [];
	let { associativeLinePoint, associativeLineTargetControlOffsets } = node.getData();
	if (!associativeLinePoint) associativeLinePoint = [];
	associativeLinePoint[targetIndex] = associativeLinePoint[targetIndex] || {
		startPoint,
		endPoint
	};
	if (!associativeLineTargetControlOffsets) offsetList[targetIndex] = getDefaultControlPointOffsets(startPoint, endPoint);
	else offsetList = associativeLineTargetControlOffsets;
	let offset1 = null;
	let offset2 = null;
	if (this.mousedownControlPointKey === "controlPoint1") {
		offset1 = {
			x: pos.x - startPoint.x,
			y: pos.y - startPoint.y
		};
		offset2 = offsetList[targetIndex][1];
		associativeLinePoint[targetIndex].startPoint = startPoint;
	} else {
		offset1 = offsetList[targetIndex][0];
		offset2 = {
			x: pos.x - endPoint.x,
			y: pos.y - endPoint.y
		};
		associativeLinePoint[targetIndex].endPoint = endPoint;
	}
	offsetList[targetIndex] = [offset1, offset2];
	this.mindMap.execCommand("SET_NODE_DATA", node, {
		associativeLineTargetControlOffsets: offsetList,
		associativeLinePoint
	});
	this.isNotRenderAllLines = true;
	setTimeout(() => {
		this.resetControlPoint();
	}, 0);
}
function resetControlPoint() {
	this.isControlPointMousedown = false;
	this.mousedownControlPointKey = "";
	this.controlPointMousemoveState = {
		pos: null,
		startPoint: null,
		endPoint: null,
		targetIndex: ""
	};
}
function renderControls(startPoint, endPoint, point1, point2, node, toNode) {
	if (!this.mindMap.opt.enableAdjustAssociativeLinePoints) return;
	if (!this.controlLine1) this.createControlNodes(node, toNode);
	let radius = this.controlPointDiameter / 2;
	this.controlLine1.plot(startPoint.x, startPoint.y, point1.x, point1.y);
	this.controlLine2.plot(endPoint.x, endPoint.y, point2.x, point2.y);
	this.controlPoint1.x(point1.x - radius).y(point1.y - radius);
	this.controlPoint2.x(point2.x - radius).y(point2.y - radius);
}
function removeControls() {
	if (!this.controlLine1) return;
	[
		this.controlLine1,
		this.controlLine2,
		this.controlPoint1,
		this.controlPoint2
	].forEach((item) => {
		item.remove();
	});
	this.controlLine1 = null;
	this.controlLine2 = null;
	this.controlPoint1 = null;
	this.controlPoint2 = null;
}
function hideControls() {
	if (!this.controlLine1) return;
	[
		this.controlLine1,
		this.controlLine2,
		this.controlPoint1,
		this.controlPoint2
	].forEach((item) => {
		item.hide();
	});
}
function showControls() {
	if (!this.controlLine1) return;
	[
		this.controlLine1,
		this.controlLine2,
		this.controlPoint1,
		this.controlPoint2
	].forEach((item) => {
		item.show();
	});
}
var associativeLineControls_default = {
	createControlNodes,
	createOneControlNode,
	onControlPointMousedown,
	onControlPointMousemove,
	onControlPointMouseup,
	resetControlPoint,
	renderControls,
	removeControls,
	hideControls,
	showControls,
	updataAassociativeLine
};
//#endregion
//#region node_modules/simple-mind-map/src/plugins/associativeLine/associativeLineText.js
function createText(data) {
	let g = this.associativeLineDraw.group();
	const setActive = () => {
		if (!this.activeLine || this.activeLine[3] !== data.node || this.activeLine[4] !== data.toNode) this.setActiveLine({
			...data,
			text: g
		});
	};
	g.click((e) => {
		e.stopPropagation();
		setActive();
	});
	g.on("dblclick", (e) => {
		e.stopPropagation();
		setActive();
		if (!this.activeLine) return;
		this.showEditTextBox(g);
	});
	return g;
}
function showEditTextBox(g) {
	this.mindMap.emit("before_show_text_edit");
	this.mindMap.keyCommand.addShortcut("Enter", () => {
		this.hideEditTextBox();
	});
	if (!this.textEditNode) {
		this.textEditNode = document.createElement("div");
		this.textEditNode.className = "associative-line-text-edit-warp";
		this.textEditNode.style.cssText = `position:fixed;box-sizing: border-box;background-color:#fff;box-shadow: 0 0 20px rgba(0,0,0,.5);padding: 3px 5px;margin-left: -5px;margin-top: -3px;outline: none; word-break: break-all;`;
		this.textEditNode.setAttribute("contenteditable", true);
		this.textEditNode.addEventListener("keyup", (e) => {
			e.stopPropagation();
		});
		this.textEditNode.addEventListener("click", (e) => {
			e.stopPropagation();
		});
		(this.mindMap.opt.customInnerElsAppendTo || document.body).appendChild(this.textEditNode);
	}
	let [, , , node, toNode] = this.activeLine;
	let { associativeLineTextFontSize, associativeLineTextFontFamily, associativeLineTextLineHeight } = this.getStyleConfig(node, toNode);
	let { defaultAssociativeLineText, nodeTextEditZIndex } = this.mindMap.opt;
	let scale = this.mindMap.view.scale;
	let text = this.getText(node, toNode);
	let textLines = (text || defaultAssociativeLineText).split(/\n/gim);
	this.textEditNode.style.fontFamily = associativeLineTextFontFamily;
	this.textEditNode.style.fontSize = associativeLineTextFontSize * scale + "px";
	this.textEditNode.style.lineHeight = textLines.length > 1 ? associativeLineTextLineHeight : "normal";
	this.textEditNode.style.zIndex = nodeTextEditZIndex;
	this.textEditNode.innerHTML = textLines.join("<br>");
	this.textEditNode.style.display = "block";
	this.updateTextEditBoxPos(g);
	this.showTextEdit = true;
	if (text === "" || text === defaultAssociativeLineText) selectAllInput(this.textEditNode);
	else focusInput(this.textEditNode);
}
function removeTextEditEl() {
	if (!this.textEditNode) return;
	(this.mindMap.opt.customInnerElsAppendTo || document.body).removeChild(this.textEditNode);
}
function onScale() {
	this.hideEditTextBox();
}
function updateTextEditBoxPos(g) {
	let rect = g.node.getBoundingClientRect();
	if (this.textEditNode) {
		this.textEditNode.style.minWidth = `${rect.width + 10}px`;
		this.textEditNode.style.minHeight = `${rect.height + 6}px`;
		this.textEditNode.style.left = `${rect.left}px`;
		this.textEditNode.style.top = `${rect.top}px`;
	}
}
function hideEditTextBox() {
	if (!this.showTextEdit) return;
	let [path, , text, node, toNode] = this.activeLine;
	let str = getStrWithBrFromHtml(this.textEditNode.innerHTML);
	str = str === this.mindMap.opt.defaultAssociativeLineText ? "" : str;
	this.mindMap.execCommand("SET_NODE_DATA", node, { associativeLineText: {
		...node.getData("associativeLineText") || {},
		[toNode.getData("uid")]: str
	} });
	this.textEditNode.style.display = "none";
	this.textEditNode.innerHTML = "";
	this.showTextEdit = false;
	this.renderText(str, path, text, node, toNode);
	this.mindMap.emit("hide_text_edit");
}
function getText(node, toNode) {
	let obj = node.getData("associativeLineText");
	if (!obj) return "";
	return obj[toNode.getData("uid")] || "";
}
function renderText(str, path, text, node, toNode) {
	if (!str) return;
	let { associativeLineTextFontSize, associativeLineTextLineHeight } = this.getStyleConfig(node, toNode);
	text.clear();
	str.replace(/\n$/g, "").split(/\n/gim).forEach((item, index) => {
		if (item === "") item = "﻿";
		let textNode = new Text().text(item);
		textNode.y(associativeLineTextFontSize * associativeLineTextLineHeight * index);
		this.styleText(textNode, node, toNode);
		text.add(textNode);
	});
	updateTextPos(path, text);
}
function styleText(textNode, node, toNode) {
	let { associativeLineTextColor, associativeLineTextFontSize, associativeLineTextFontFamily } = this.getStyleConfig(node, toNode);
	textNode.fill({ color: associativeLineTextColor }).css({
		"font-family": associativeLineTextFontFamily,
		"font-size": associativeLineTextFontSize + "px"
	});
}
function updateTextPos(path, text) {
	let pathLength = path.length();
	let centerPoint = path.pointAt(pathLength / 2);
	let { width: textWidth, height: textHeight } = text.bbox();
	text.x(centerPoint.x - textWidth / 2);
	text.y(centerPoint.y - textHeight / 2);
}
var associativeLineText_default = {
	getText,
	createText,
	styleText,
	onScale,
	showEditTextBox,
	removeTextEditEl,
	hideEditTextBox,
	updateTextEditBoxPos,
	renderText,
	updateTextPos
};
//#endregion
//#region node_modules/simple-mind-map/src/plugins/AssociativeLine.js
var styleProps = [
	"associativeLineWidth",
	"associativeLineColor",
	"associativeLineActiveWidth",
	"associativeLineActiveColor",
	"associativeLineDasharray",
	"associativeLineTextColor",
	"associativeLineTextFontSize",
	"associativeLineTextLineHeight",
	"associativeLineTextFontFamily"
];
var AssociativeLine = class {
	constructor(opt = {}) {
		this.mindMap = opt.mindMap;
		this.associativeLineDraw = this.mindMap.associativeLineDraw;
		this.isNotRenderAllLines = false;
		this.lineList = [];
		this.activeLine = null;
		this.isCreatingLine = false;
		this.creatingStartNode = null;
		this.creatingLine = null;
		this.overlapNode = null;
		this.isNodeDragging = false;
		this.controlLine1 = null;
		this.controlLine2 = null;
		this.controlPoint1 = null;
		this.controlPoint2 = null;
		this.controlPointDiameter = 10;
		this.isControlPointMousedown = false;
		this.mousedownControlPointKey = "";
		this.controlPointMousemoveState = {
			pos: null,
			startPoint: null,
			endPoint: null,
			targetIndex: ""
		};
		this.checkOverlapNode = throttle(this.checkOverlapNode, 100, this);
		Object.keys(associativeLineControls_default).forEach((item) => {
			this[item] = associativeLineControls_default[item].bind(this);
		});
		Object.keys(associativeLineText_default).forEach((item) => {
			this[item] = associativeLineText_default[item].bind(this);
		});
		this.bindEvent();
	}
	bindEvent() {
		this.renderAllLines = this.renderAllLines.bind(this);
		this.onDrawClick = this.onDrawClick.bind(this);
		this.onNodeClick = this.onNodeClick.bind(this);
		this.removeLine = this.removeLine.bind(this);
		this.addLine = this.addLine.bind(this);
		this.onMousemove = this.onMousemove.bind(this);
		this.onNodeDragging = this.onNodeDragging.bind(this);
		this.onNodeDragend = this.onNodeDragend.bind(this);
		this.onControlPointMouseup = this.onControlPointMouseup.bind(this);
		this.onBeforeDestroy = this.onBeforeDestroy.bind(this);
		this.mindMap.on("node_tree_render_end", this.renderAllLines);
		this.mindMap.on("data_change", this.renderAllLines);
		this.mindMap.on("draw_click", this.onDrawClick);
		this.mindMap.on("node_click", this.onNodeClick);
		this.mindMap.on("contextmenu", this.onDrawClick);
		this.mindMap.keyCommand.addShortcut("Del|Backspace", this.removeLine);
		this.mindMap.command.add("ADD_ASSOCIATIVE_LINE", this.addLine);
		this.mindMap.on("mousemove", this.onMousemove);
		this.mindMap.on("node_dragging", this.onNodeDragging);
		this.mindMap.on("node_dragend", this.onNodeDragend);
		this.mindMap.on("mouseup", this.onControlPointMouseup);
		this.mindMap.on("scale", this.onScale);
		this.mindMap.on("beforeDestroy", this.onBeforeDestroy);
	}
	unBindEvent() {
		this.mindMap.off("node_tree_render_end", this.renderAllLines);
		this.mindMap.off("data_change", this.renderAllLines);
		this.mindMap.off("draw_click", this.onDrawClick);
		this.mindMap.off("node_click", this.onNodeClick);
		this.mindMap.off("contextmenu", this.onDrawClick);
		this.mindMap.keyCommand.removeShortcut("Del|Backspace", this.removeLine);
		this.mindMap.command.remove("ADD_ASSOCIATIVE_LINE", this.addLine);
		this.mindMap.off("mousemove", this.onMousemove);
		this.mindMap.off("node_dragging", this.onNodeDragging);
		this.mindMap.off("node_dragend", this.onNodeDragend);
		this.mindMap.off("mouseup", this.onControlPointMouseup);
		this.mindMap.off("scale", this.onScale);
		this.mindMap.off("beforeDestroy", this.onBeforeDestroy);
	}
	getStyleConfig(node, toNode) {
		let lineStyle = {};
		if (toNode) lineStyle = (node.getData("associativeLineStyle") || {})[toNode.getData("uid")] || {};
		const res = {};
		styleProps.forEach((prop) => {
			if (typeof lineStyle[prop] !== "undefined") res[prop] = lineStyle[prop];
			else res[prop] = node.getStyle(prop);
		});
		return res;
	}
	onBeforeDestroy() {
		this.hideEditTextBox();
		this.removeTextEditEl();
	}
	onDrawClick() {
		if (this.isCreatingLine) this.cancelCreateLine();
		if (!this.isControlPointMousedown) this.clearActiveLine();
	}
	onNodeClick(node) {
		if (this.isCreatingLine) this.completeCreateLine(node);
		else this.clearActiveLine();
	}
	createMarker(callback = () => {}) {
		return this.associativeLineDraw.marker(20, 20, (add) => {
			add.ref(12, 5);
			add.size(10, 10);
			add.attr("orient", "auto-start-reverse");
			callback(add.path("M0,0 L2,5 L0,10 L10,5 Z"));
		});
	}
	updateAllLinesPos(node, toNode, associativeLinePoint) {
		associativeLinePoint = associativeLinePoint || {};
		let [startPoint, endPoint] = computeNodePoints(node, toNode);
		let nodeRange = 0;
		let nodeDir = "";
		let toNodeRange = 0;
		let toNodeDir = "";
		if (associativeLinePoint.startPoint) {
			nodeRange = associativeLinePoint.startPoint.range || 0;
			nodeDir = associativeLinePoint.startPoint.dir || "right";
			startPoint = getNodePoint(node, nodeDir, nodeRange);
		}
		if (associativeLinePoint.endPoint) {
			toNodeRange = associativeLinePoint.endPoint.range || 0;
			toNodeDir = associativeLinePoint.endPoint.dir || "right";
			endPoint = getNodePoint(toNode, toNodeDir, toNodeRange);
		}
		return [startPoint, endPoint];
	}
	renderAllLines() {
		if (this.isNotRenderAllLines) {
			this.isNotRenderAllLines = false;
			return;
		}
		this.removeAllLines();
		this.removeControls();
		this.clearActiveLine();
		let tree = this.mindMap.renderer.root;
		if (!tree) return;
		let idToNode = /* @__PURE__ */ new Map();
		let nodeToIds = /* @__PURE__ */ new Map();
		walk(tree, null, (cur) => {
			if (!cur) return;
			let data = cur.getData();
			if (data.associativeLineTargets && data.associativeLineTargets.length > 0) nodeToIds.set(cur, data.associativeLineTargets);
			if (data.uid) idToNode.set(data.uid, cur);
		}, () => {}, true, 0);
		nodeToIds.forEach((ids, node) => {
			ids.forEach((uid, index) => {
				let toNode = idToNode.get(uid);
				if (!node || !toNode) return;
				const associativeLinePoint = (node.getData("associativeLinePoint") || [])[index];
				const [startPoint, endPoint] = this.updateAllLinesPos(node, toNode, associativeLinePoint);
				this.drawLine(startPoint, endPoint, node, toNode);
			});
		});
	}
	drawLine(startPoint, endPoint, node, toNode) {
		let { associativeLineWidth, associativeLineColor, associativeLineActiveWidth, associativeLineDasharray } = this.getStyleConfig(node, toNode);
		let markerPath = null;
		const marker = this.createMarker((p) => {
			markerPath = p;
		});
		markerPath.stroke({ color: associativeLineColor }).fill({ color: associativeLineColor });
		let { path: pathStr, controlPoints } = getNodeLinePath(startPoint, endPoint, node, toNode);
		let path = this.associativeLineDraw.path();
		path.stroke({
			width: associativeLineWidth,
			color: associativeLineColor,
			dasharray: associativeLineDasharray || [6, 4]
		}).fill({ color: "none" });
		path.plot(pathStr);
		path.marker("end", marker);
		let clickPath = this.associativeLineDraw.path();
		clickPath.stroke({
			width: associativeLineActiveWidth,
			color: "transparent"
		}).fill({ color: "none" });
		clickPath.plot(pathStr);
		let text = this.createText({
			path,
			clickPath,
			markerPath,
			node,
			toNode,
			startPoint,
			endPoint,
			controlPoints
		});
		clickPath.click((e) => {
			e.stopPropagation();
			this.setActiveLine({
				path,
				clickPath,
				markerPath,
				text,
				node,
				toNode,
				startPoint,
				endPoint,
				controlPoints
			});
		});
		clickPath.dblclick(() => {
			if (!this.activeLine) return;
			this.showEditTextBox(text);
		});
		this.renderText(this.getText(node, toNode), path, text, node, toNode);
		this.lineList.push([
			path,
			clickPath,
			text,
			node,
			toNode
		]);
	}
	updateActiveLineStyle() {
		if (!this.activeLine) return;
		this.isNotRenderAllLines = true;
		const [path, clickPath, text, node, toNode, markerPath] = this.activeLine;
		const { associativeLineWidth, associativeLineColor, associativeLineDasharray, associativeLineActiveWidth, associativeLineActiveColor, associativeLineTextColor, associativeLineTextFontFamily, associativeLineTextFontSize } = this.getStyleConfig(node, toNode);
		path.stroke({
			width: associativeLineWidth,
			color: associativeLineColor,
			dasharray: associativeLineDasharray || [6, 4]
		}).fill({ color: "none" });
		clickPath.stroke({
			width: associativeLineActiveWidth,
			color: associativeLineActiveColor
		}).fill({ color: "none" });
		markerPath.stroke({ color: associativeLineColor }).fill({ color: associativeLineColor });
		text.find("text").forEach((textNode) => {
			textNode.fill({ color: associativeLineTextColor }).css({
				"font-family": associativeLineTextFontFamily,
				"font-size": associativeLineTextFontSize + "px"
			});
		});
		if (this.controlLine1) this.controlLine1.stroke({ color: associativeLineActiveColor });
		if (this.controlLine2) this.controlLine2.stroke({ color: associativeLineActiveColor });
		if (this.controlPoint1) this.controlPoint1.stroke({ color: associativeLineActiveColor });
		if (this.controlPoint2) this.controlPoint2.stroke({ color: associativeLineActiveColor });
	}
	setActiveLine({ path, clickPath, markerPath, text, node, toNode, startPoint, endPoint, controlPoints }) {
		let { associativeLineActiveColor } = this.getStyleConfig(node, toNode);
		this.mindMap.execCommand("CLEAR_ACTIVE_NODE");
		this.clearActiveLine();
		this.activeLine = [
			path,
			clickPath,
			text,
			node,
			toNode,
			markerPath
		];
		clickPath.stroke({ color: associativeLineActiveColor });
		if (!this.getText(node, toNode)) this.renderText(this.mindMap.opt.defaultAssociativeLineText, path, text, node, toNode);
		this.renderControls(startPoint, endPoint, controlPoints[0], controlPoints[1], node, toNode);
		this.mindMap.emit("associative_line_click", path, clickPath, node, toNode);
		this.front();
	}
	removeAllLines() {
		this.lineList.forEach((line) => {
			line[0].remove();
			line[1].remove();
			line[2].remove();
		});
		this.lineList = [];
	}
	createLineFromActiveNode() {
		if (this.mindMap.renderer.activeNodeList.length <= 0) return;
		let node = this.mindMap.renderer.activeNodeList[0];
		this.createLine(node);
	}
	createLine(fromNode) {
		let { associativeLineWidth, associativeLineColor, associativeLineDasharray } = this.getStyleConfig(fromNode);
		if (this.isCreatingLine || !fromNode) return;
		this.front();
		this.isCreatingLine = true;
		this.creatingStartNode = fromNode;
		this.creatingLine = this.associativeLineDraw.path();
		this.creatingLine.stroke({
			width: associativeLineWidth,
			color: associativeLineColor,
			dasharray: associativeLineDasharray || [6, 4]
		}).fill({ color: "none" });
		let markerPath = null;
		const marker = this.createMarker((p) => {
			markerPath = p;
		});
		markerPath.stroke({ color: associativeLineColor }).fill({ color: associativeLineColor });
		this.creatingLine.marker("end", marker);
	}
	cancelCreateLine() {
		this.isCreatingLine = false;
		this.creatingStartNode = null;
		this.creatingLine.remove();
		this.creatingLine = null;
		this.overlapNode = null;
		this.back();
	}
	onMousemove(e) {
		this.onControlPointMousemove(e);
		this.updateCreatingLine(e);
	}
	updateCreatingLine(e) {
		if (!this.isCreatingLine) return;
		let { x, y } = this.getTransformedEventPos(e);
		let startPoint = getNodePoint(this.creatingStartNode);
		let offsetX = x > startPoint.x ? -10 : 10;
		let pathStr = cubicBezierPath(startPoint.x, startPoint.y, x + offsetX, y);
		this.creatingLine.plot(pathStr);
		this.checkOverlapNode(x, y);
	}
	getTransformedEventPos(e) {
		let { x, y } = this.mindMap.toPos(e.clientX, e.clientY);
		let { scaleX, scaleY, translateX, translateY } = this.mindMap.draw.transform();
		return {
			x: (x - translateX) / scaleX,
			y: (y - translateY) / scaleY
		};
	}
	getNodePos(node) {
		const { scaleX, scaleY, translateX, translateY } = this.mindMap.draw.transform();
		const { left, top, width, height } = node;
		return {
			left,
			top,
			translateLeft: left * scaleX + translateX,
			translateTop: top * scaleY + translateY,
			width,
			height
		};
	}
	checkOverlapNode(x, y) {
		this.overlapNode = null;
		bfsWalk(this.mindMap.renderer.root, (node) => {
			if (node.getData("isActive")) this.mindMap.execCommand("SET_NODE_ACTIVE", node, false);
			if (node.uid === this.creatingStartNode.uid || this.overlapNode) return;
			let { left, top, width, height } = node;
			let right = left + width;
			let bottom = top + height;
			if (x >= left && x <= right && y >= top && y <= bottom) this.overlapNode = node;
		});
		if (this.overlapNode && !this.overlapNode.getData("isActive")) this.mindMap.execCommand("SET_NODE_ACTIVE", this.overlapNode, true);
	}
	completeCreateLine(node) {
		if (this.creatingStartNode.uid === node.uid) return;
		const { beforeAssociativeLineConnection } = this.mindMap.opt;
		let stop = false;
		if (typeof beforeAssociativeLineConnection === "function") stop = beforeAssociativeLineConnection(node);
		if (stop) return;
		this.addLine(this.creatingStartNode, node);
		if (this.overlapNode && this.overlapNode.getData("isActive")) this.mindMap.execCommand("SET_NODE_ACTIVE", this.overlapNode, false);
		this.cancelCreateLine();
	}
	addLine(fromNode, toNode) {
		if (!fromNode || !toNode) return;
		let uid = toNode.getData("uid");
		if (!uid) {
			uid = v4();
			this.mindMap.execCommand("SET_NODE_DATA", toNode, { uid });
		}
		let list = fromNode.getData("associativeLineTargets") || [];
		if (list.some((item) => item === uid)) return;
		list.push(uid);
		let [startPoint, endPoint] = computeNodePoints(fromNode, toNode);
		let controlPoints = computeCubicBezierPathPoints(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
		const { associativeLineInitPointsPosition } = this.mindMap.opt;
		if (associativeLineInitPointsPosition) {
			const { from, to } = associativeLineInitPointsPosition;
			if (from) startPoint.dir = from;
			if (to) endPoint.dir = to;
		}
		let offsetList = fromNode.getData("associativeLineTargetControlOffsets") || [];
		offsetList[list.length - 1] = [{
			x: controlPoints[0].x - startPoint.x,
			y: controlPoints[0].y - startPoint.y
		}, {
			x: controlPoints[1].x - endPoint.x,
			y: controlPoints[1].y - endPoint.y
		}];
		let associativeLinePoint = fromNode.getData("associativeLinePoint") || [];
		associativeLinePoint[list.length - 1] = {
			startPoint,
			endPoint
		};
		this.mindMap.execCommand("SET_NODE_DATA", fromNode, {
			associativeLineTargets: list,
			associativeLineTargetControlOffsets: offsetList,
			associativeLinePoint
		});
	}
	removeLine() {
		if (!this.activeLine) return;
		let [, , , node, toNode] = this.activeLine;
		this.removeControls();
		let { associativeLineTargets, associativeLinePoint, associativeLineTargetControlOffsets, associativeLineText, associativeLineStyle } = node.getData();
		associativeLinePoint = associativeLinePoint || [];
		let targetIndex = getAssociativeLineTargetIndex(node, toNode);
		let newAssociativeLineText = {};
		if (associativeLineText) Object.keys(associativeLineText).forEach((item) => {
			if (item !== toNode.getData("uid")) newAssociativeLineText[item] = associativeLineText[item];
		});
		let newAssociativeLineStyle = {};
		if (associativeLineStyle) Object.keys(associativeLineStyle).forEach((item) => {
			if (item !== toNode.getData("uid")) newAssociativeLineStyle[item] = associativeLineStyle[item];
		});
		this.mindMap.execCommand("SET_NODE_DATA", node, {
			associativeLineTargets: associativeLineTargets.filter((_, index) => {
				return index !== targetIndex;
			}),
			associativeLinePoint: associativeLinePoint.filter((_, index) => {
				return index !== targetIndex;
			}),
			associativeLineTargetControlOffsets: associativeLineTargetControlOffsets ? associativeLineTargetControlOffsets.filter((_, index) => {
				return index !== targetIndex;
			}) : [],
			associativeLineText: newAssociativeLineText,
			associativeLineStyle: newAssociativeLineStyle
		});
	}
	clearActiveLine() {
		if (this.activeLine) {
			let [, clickPath, text, node, toNode] = this.activeLine;
			clickPath.stroke({ color: "transparent" });
			this.hideEditTextBox();
			if (!this.getText(node, toNode)) text.clear();
			this.activeLine = null;
			this.removeControls();
			this.back();
			this.mindMap.emit("associative_line_deactivate");
		}
	}
	onNodeDragging() {
		if (this.isNodeDragging) return;
		this.isNodeDragging = true;
		this.lineList.forEach((line) => {
			line[0].hide();
			line[1].hide();
			line[2].hide();
		});
		this.hideControls();
	}
	onNodeDragend() {
		if (!this.isNodeDragging) return;
		this.lineList.forEach((line) => {
			line[0].show();
			line[1].show();
			line[2].show();
		});
		this.showControls();
		this.isNodeDragging = false;
	}
	front() {
		if (this.mindMap.opt.associativeLineIsAlwaysAboveNode) return;
		this.associativeLineDraw.front();
	}
	back() {
		if (this.mindMap.opt.associativeLineIsAlwaysAboveNode) return;
		this.associativeLineDraw.back();
		this.associativeLineDraw.forward();
	}
	beforePluginRemove() {
		this.unBindEvent();
	}
	beforePluginDestroy() {
		this.unBindEvent();
	}
};
AssociativeLine.instanceName = "associativeLine";
//#endregion
export { AssociativeLine as default };
