import { F as getTopAncestorsFomNodeList, O as getNodeIndexInNodeList, Tt as CONSTANTS, ct as throttle, i as bfsWalk, st as sortNodeList } from "./utils-DKbIT76G.js";
import { t as Base } from "./Base-CBNqdkYU.js";
import { t as AutoMove } from "./AutoMove-CBoxW4Rg.js";
//#region node_modules/simple-mind-map/src/plugins/Drag.js
var Drag = class extends Base {
	constructor({ mindMap }) {
		super(mindMap.renderer);
		this.mindMap = mindMap;
		this.autoMove = new AutoMove(mindMap);
		this.reset();
		this.bindEvent();
	}
	reset() {
		this.isDragging = false;
		this.mousedownNode = null;
		this.beingDragNodeList = [];
		this.nodeList = [];
		this.overlapNode = null;
		this.prevNode = null;
		this.nextNode = null;
		this.drawTransform = null;
		this.clone = null;
		this.placeholder = null;
		this.placeholderWidth = 50;
		this.placeholderHeight = 10;
		this.placeHolderLine = null;
		this.placeHolderExtraLines = [];
		this.offsetX = 0;
		this.offsetY = 0;
		this.isMousedown = false;
		this.mouseDownX = 0;
		this.mouseDownY = 0;
		this.mouseMoveX = 0;
		this.mouseMoveY = 0;
		this.checkDragOffset = 10;
		this.minOffset = 10;
	}
	bindEvent() {
		this.onNodeMousedown = this.onNodeMousedown.bind(this);
		this.onMousemove = this.onMousemove.bind(this);
		this.onMouseup = this.onMouseup.bind(this);
		this.checkOverlapNode = throttle(this.checkOverlapNode, 300, this);
		this.mindMap.on("node_mousedown", this.onNodeMousedown);
		this.mindMap.on("mousemove", this.onMousemove);
		this.mindMap.on("node_mouseup", this.onMouseup);
		this.mindMap.on("mouseup", this.onMouseup);
	}
	unBindEvent() {
		this.mindMap.off("node_mousedown", this.onNodeMousedown);
		this.mindMap.off("mousemove", this.onMousemove);
		this.mindMap.off("node_mouseup", this.onMouseup);
		this.mindMap.off("mouseup", this.onMouseup);
	}
	onNodeMousedown(node, e) {
		if (this.mindMap.opt.readonly || e.which !== 1 || node.isGeneralization || node.isRoot) return;
		this.isMousedown = true;
		this.mousedownNode = node;
		const { x, y } = this.mindMap.toPos(e.clientX, e.clientY);
		this.mouseDownX = x;
		this.mouseDownY = y;
	}
	onMousemove(e) {
		if (this.mindMap.opt.readonly || !this.isMousedown) return;
		e.preventDefault();
		const { x, y } = this.mindMap.toPos(e.clientX, e.clientY);
		this.mouseMoveX = x;
		this.mouseMoveY = y;
		if (!this.isDragging && Math.abs(x - this.mouseDownX) <= this.checkDragOffset && Math.abs(y - this.mouseDownY) <= this.checkDragOffset) return;
		this.mindMap.emit("node_dragging", this.mousedownNode);
		this.handleStartMove();
		this.onMove(x, y, e);
	}
	async onMouseup(e) {
		if (!this.isMousedown) return;
		const { autoMoveWhenMouseInEdgeOnDrag, enableFreeDrag, beforeDragEnd } = this.mindMap.opt;
		if (autoMoveWhenMouseInEdgeOnDrag && this.mindMap.select) this.autoMove.clearAutoMoveTimer();
		this.isMousedown = false;
		this.beingDragNodeList.forEach((node) => {
			node.setOpacity(1);
			node.showChildren();
			node.endDrag();
		});
		this.removeCloneNode();
		let overlapNodeUid = this.overlapNode ? this.overlapNode.getData("uid") : "";
		let prevNodeUid = this.prevNode ? this.prevNode.getData("uid") : "";
		let nextNodeUid = this.nextNode ? this.nextNode.getData("uid") : "";
		if (this.isDragging && typeof beforeDragEnd === "function") {
			if (await beforeDragEnd({
				overlapNodeUid,
				prevNodeUid,
				nextNodeUid,
				beingDragNodeList: [...this.beingDragNodeList]
			})) {
				this.reset();
				return;
			}
		}
		if (this.overlapNode) {
			this.removeNodeActive(this.overlapNode);
			this.mindMap.execCommand("MOVE_NODE_TO", this.beingDragNodeList, this.overlapNode);
		} else if (this.prevNode) {
			this.removeNodeActive(this.prevNode);
			this.mindMap.execCommand("INSERT_AFTER", this.beingDragNodeList, this.prevNode);
		} else if (this.nextNode) {
			this.removeNodeActive(this.nextNode);
			this.mindMap.execCommand("INSERT_BEFORE", this.beingDragNodeList, this.nextNode);
		} else if (this.clone && enableFreeDrag && this.beingDragNodeList.length === 1) {
			let { x, y } = this.mindMap.toPos(e.clientX - this.offsetX, e.clientY - this.offsetY);
			let { scaleX, scaleY, translateX, translateY } = this.drawTransform;
			x = (x - translateX) / scaleX;
			y = (y - translateY) / scaleY;
			this.mousedownNode.left = x;
			this.mousedownNode.top = y;
			this.mousedownNode.customLeft = x;
			this.mousedownNode.customTop = y;
			this.mindMap.execCommand("SET_NODE_CUSTOM_POSITION", this.mousedownNode, x, y);
			this.mindMap.render();
		}
		if (this.isDragging) this.mindMap.emit("node_dragend", {
			overlapNodeUid,
			prevNodeUid,
			nextNodeUid
		});
		this.reset();
	}
	removeNodeActive(node) {
		if (node.getData("isActive")) this.mindMap.execCommand("SET_NODE_ACTIVE", node, false);
	}
	onMove(x, y, e) {
		if (!this.isMousedown || !this.isDragging) return;
		let { scaleX, scaleY, translateX, translateY } = this.drawTransform;
		let cloneNodeLeft = x - this.offsetX;
		let cloneNodeTop = y - this.offsetY;
		x = (cloneNodeLeft - translateX) / scaleX;
		y = (cloneNodeTop - translateY) / scaleY;
		let t = this.clone.transform();
		this.clone.translate(x - t.translateX, y - t.translateY);
		this.checkOverlapNode();
		this.drawTransform = this.mindMap.draw.transform();
		this.autoMove.clearAutoMoveTimer();
		this.autoMove.onMove(e.clientX, e.clientY);
	}
	async handleStartMove() {
		if (!this.isDragging) {
			let node = this.mousedownNode;
			this.drawTransform = this.mindMap.draw.transform();
			let { scaleX, scaleY, translateX, translateY } = this.drawTransform;
			this.offsetX = this.mouseDownX - (node.left * scaleX + translateX);
			this.offsetY = this.mouseDownY - (node.top * scaleY + translateY);
			if (node.getData("isActive")) this.beingDragNodeList = sortNodeList(getTopAncestorsFomNodeList(this.mindMap.renderer.activeNodeList.filter((item) => {
				return !item.isRoot && !item.isGeneralization;
			})));
			else this.beingDragNodeList = [node];
			const { beforeDragStart } = this.mindMap.opt;
			if (typeof beforeDragStart === "function") {
				if (await beforeDragStart([...this.beingDragNodeList])) return;
			}
			this.nodeTreeToList();
			this.createCloneNode();
			this.mindMap.execCommand("CLEAR_ACTIVE_NODE");
			this.isDragging = true;
		}
	}
	nodeTreeToList() {
		const list = [];
		bfsWalk(this.mindMap.renderer.root, (node) => {
			if (this.checkIsInBeingDragNodeList(node)) return;
			if (!list[node.layerIndex]) list[node.layerIndex] = [];
			list[node.layerIndex].push(node);
		});
		this.nodeList = list.reduceRight((res, cur) => {
			return [...res, ...cur];
		}, []);
	}
	createCloneNode() {
		if (!this.clone) {
			const { dragMultiNodeRectConfig, dragPlaceholderRectFill, dragPlaceholderLineConfig, dragOpacityConfig, handleDragCloneNode } = this.mindMap.opt;
			const { width: rectWidth, height: rectHeight, fill: rectFill } = dragMultiNodeRectConfig;
			const node = this.beingDragNodeList[0];
			const lineColor = node.style.merge("lineColor", true);
			if (this.beingDragNodeList.length > 1) {
				this.clone = this.mindMap.otherDraw.rect().size(rectWidth, rectHeight).radius(rectHeight / 2).fill({ color: rectFill || lineColor });
				this.offsetX = rectWidth / 2;
				this.offsetY = rectHeight / 2;
			} else {
				this.clone = node.group.clone();
				const expandEl = this.clone.findOne(".smm-expand-btn");
				if (expandEl) expandEl.remove();
				this.mindMap.otherDraw.add(this.clone);
				if (typeof handleDragCloneNode === "function") handleDragCloneNode(this.clone);
			}
			this.clone.opacity(dragOpacityConfig.cloneNodeOpacity);
			this.clone.css("z-index", 99999);
			this.placeholder = this.mindMap.otherDraw.rect().fill({ color: dragPlaceholderRectFill || lineColor }).radius(5);
			this.placeHolderLine = this.mindMap.otherDraw.path().stroke({
				color: dragPlaceholderLineConfig.color || lineColor,
				width: dragPlaceholderLineConfig.width
			}).fill({ color: "none" });
			this.beingDragNodeList.forEach((node) => {
				node.setOpacity(dragOpacityConfig.beingDragNodeOpacity);
				node.hideChildren();
				node.startDrag();
			});
		}
	}
	removeCloneNode() {
		if (!this.clone) return;
		this.clone.remove();
		this.placeholder.remove();
		this.placeHolderLine.remove();
		this.removeExtraLines();
	}
	removeExtraLines() {
		this.placeHolderExtraLines.forEach((item) => {
			item.remove();
		});
		this.placeHolderExtraLines = [];
	}
	checkOverlapNode() {
		if (!this.drawTransform || !this.placeholder) return;
		const { LOGICAL_STRUCTURE, LOGICAL_STRUCTURE_LEFT, MIND_MAP, ORGANIZATION_STRUCTURE, CATALOG_ORGANIZATION, TIMELINE, TIMELINE2, VERTICAL_TIMELINE, FISHBONE } = CONSTANTS.LAYOUT;
		this.overlapNode = null;
		this.prevNode = null;
		this.nextNode = null;
		this.placeholder.size(0, 0);
		this.placeHolderLine.hide();
		this.removeExtraLines();
		this.nodeList.forEach((node) => {
			if (node.getData("isActive")) this.mindMap.execCommand("SET_NODE_ACTIVE", node, false);
			if (this.overlapNode || this.prevNode && this.nextNode) return;
			switch (this.mindMap.opt.layout) {
				case LOGICAL_STRUCTURE:
				case LOGICAL_STRUCTURE_LEFT:
					this.handleLogicalStructure(node);
					break;
				case MIND_MAP:
					this.handleMindMap(node);
					break;
				case ORGANIZATION_STRUCTURE:
					this.handleOrganizationStructure(node);
					break;
				case CATALOG_ORGANIZATION:
					this.handleCatalogOrganization(node);
					break;
				case TIMELINE:
					this.handleTimeLine(node);
					break;
				case TIMELINE2:
					this.handleTimeLine2(node);
					break;
				case VERTICAL_TIMELINE:
					this.handleLogicalStructure(node);
					break;
				case FISHBONE:
					this.handleFishbone(node);
					break;
				default: this.handleLogicalStructure(node);
			}
		});
		if (this.overlapNode) this.handleOverlapNode();
	}
	handleOverlapNode() {
		const { LOGICAL_STRUCTURE, LOGICAL_STRUCTURE_LEFT, MIND_MAP, ORGANIZATION_STRUCTURE, CATALOG_ORGANIZATION, TIMELINE, TIMELINE2, VERTICAL_TIMELINE, FISHBONE } = CONSTANTS.LAYOUT;
		const { LEFT, TOP, RIGHT, BOTTOM } = CONSTANTS.LAYOUT_GROW_DIR;
		const layerIndex = this.overlapNode.layerIndex;
		const children = this.overlapNode.children;
		const marginX = this.mindMap.renderer.layout.getMarginX(layerIndex + 1);
		const marginY = this.mindMap.renderer.layout.getMarginY(layerIndex + 1);
		const halfPlaceholderWidth = this.placeholderWidth / 2;
		const halfPlaceholderHeight = this.placeholderHeight / 2;
		let dir = "";
		let x = "";
		let y = "";
		let rotate = false;
		let notRenderPlaceholder = false;
		if (children.length > 0) {
			const lastChild = children[children.length - 1];
			const lastNodeRect = this.getNodeRect(lastChild);
			dir = this.getNewChildNodeDir(lastChild);
			switch (this.mindMap.opt.layout) {
				case LOGICAL_STRUCTURE:
				case MIND_MAP:
					x = dir === LEFT ? lastNodeRect.originRight - this.placeholderWidth : lastNodeRect.originLeft;
					y = lastNodeRect.originBottom + this.minOffset - halfPlaceholderHeight;
					break;
				case LOGICAL_STRUCTURE_LEFT:
					x = lastNodeRect.originRight - this.placeholderWidth;
					y = lastNodeRect.originBottom + this.minOffset - halfPlaceholderHeight;
					break;
				case ORGANIZATION_STRUCTURE:
					rotate = true;
					x = lastNodeRect.originRight + this.minOffset - halfPlaceholderHeight;
					y = lastNodeRect.originTop;
					break;
				case CATALOG_ORGANIZATION:
					if (layerIndex === 0) {
						rotate = true;
						x = lastNodeRect.originRight + this.minOffset - halfPlaceholderHeight;
						y = lastNodeRect.originTop;
					} else {
						x = lastNodeRect.originLeft;
						y = lastNodeRect.originBottom + this.minOffset - halfPlaceholderHeight;
					}
					break;
				case TIMELINE:
					if (layerIndex === 0) {
						rotate = true;
						x = lastNodeRect.originRight + this.minOffset - halfPlaceholderHeight;
						y = lastNodeRect.originTop + lastNodeRect.originHeight / 2 - halfPlaceholderWidth;
					} else {
						x = lastNodeRect.originLeft;
						y = lastNodeRect.originBottom + this.minOffset - halfPlaceholderHeight;
					}
					break;
				case TIMELINE2:
					if (layerIndex === 0) {
						rotate = true;
						x = lastNodeRect.originRight + this.minOffset - halfPlaceholderHeight;
						y = lastNodeRect.originTop + lastNodeRect.originHeight / 2 - halfPlaceholderWidth;
					} else {
						x = lastNodeRect.originLeft;
						if (layerIndex === 1) y = dir === TOP ? lastNodeRect.originTop - this.placeholderHeight - this.minOffset + halfPlaceholderHeight : lastNodeRect.originBottom + this.minOffset - halfPlaceholderHeight;
						else y = lastNodeRect.originBottom + this.minOffset - halfPlaceholderHeight;
					}
					break;
				case VERTICAL_TIMELINE:
					if (layerIndex === 0) {
						x = lastNodeRect.originLeft + lastNodeRect.originWidth / 2 - halfPlaceholderWidth;
						y = lastNodeRect.originBottom + this.minOffset - halfPlaceholderHeight;
					} else {
						x = dir === RIGHT ? lastNodeRect.originLeft : lastNodeRect.originRight - this.placeholderWidth;
						y = lastNodeRect.originBottom + this.minOffset - halfPlaceholderHeight;
					}
					break;
				case FISHBONE:
					if (layerIndex <= 1) {
						notRenderPlaceholder = true;
						this.mindMap.execCommand("SET_NODE_ACTIVE", this.overlapNode, true);
					} else {
						x = lastNodeRect.originLeft;
						y = dir === TOP ? lastNodeRect.originBottom + this.minOffset - halfPlaceholderHeight : lastNodeRect.originTop - this.placeholderHeight - this.minOffset + halfPlaceholderHeight;
					}
					break;
				default:
			}
		} else {
			const nodeRect = this.getNodeRect(this.overlapNode);
			dir = this.getNewChildNodeDir(this.overlapNode);
			switch (this.mindMap.opt.layout) {
				case LOGICAL_STRUCTURE:
				case MIND_MAP:
					x = dir === RIGHT ? nodeRect.originRight + marginX : nodeRect.originLeft - this.placeholderWidth - marginX;
					y = nodeRect.originTop + (nodeRect.originHeight - this.placeholderHeight) / 2;
					break;
				case LOGICAL_STRUCTURE_LEFT:
					x = nodeRect.originLeft - this.placeholderWidth - marginX;
					y = nodeRect.originTop + (nodeRect.originHeight - this.placeholderHeight) / 2;
					break;
				case ORGANIZATION_STRUCTURE:
					rotate = true;
					x = nodeRect.originLeft + (nodeRect.originWidth - this.placeholderHeight) / 2;
					y = nodeRect.originBottom + marginX;
					break;
				case CATALOG_ORGANIZATION:
					if (layerIndex === 0) rotate = true;
					x = nodeRect.originLeft + nodeRect.originWidth * .5;
					y = nodeRect.originBottom + marginX;
					break;
				case TIMELINE:
					if (layerIndex === 0) rotate = true;
					x = nodeRect.originLeft + nodeRect.originWidth * .5;
					y = nodeRect.originBottom + marginY;
					break;
				case TIMELINE2:
					if (layerIndex === 0) rotate = true;
					x = nodeRect.originLeft + nodeRect.originWidth * .5;
					if (layerIndex === 1) y = dir === TOP ? nodeRect.originTop - this.placeholderHeight - marginX : nodeRect.originBottom + marginX;
					else y = nodeRect.originBottom + marginX;
					break;
				case VERTICAL_TIMELINE:
					if (layerIndex === 0) rotate = true;
					x = dir === RIGHT ? nodeRect.originRight + marginX : nodeRect.originLeft - this.placeholderWidth - marginX;
					y = nodeRect.originTop + nodeRect.originHeight / 2 - halfPlaceholderHeight;
					break;
				case FISHBONE:
					if (layerIndex <= 1) {
						notRenderPlaceholder = true;
						this.mindMap.execCommand("SET_NODE_ACTIVE", this.overlapNode, true);
					} else {
						x = nodeRect.originLeft + nodeRect.originWidth * .5;
						y = dir === BOTTOM ? nodeRect.originTop - this.placeholderHeight - this.minOffset + halfPlaceholderHeight : nodeRect.originBottom + this.minOffset - halfPlaceholderHeight;
					}
					break;
				default:
			}
		}
		if (!notRenderPlaceholder) this.setPlaceholderRect({
			x,
			y,
			dir,
			rotate
		});
	}
	getNewChildNodeDir(node) {
		const { LOGICAL_STRUCTURE, LOGICAL_STRUCTURE_LEFT, MIND_MAP, TIMELINE2, VERTICAL_TIMELINE, FISHBONE } = CONSTANTS.LAYOUT;
		switch (this.mindMap.opt.layout) {
			case LOGICAL_STRUCTURE: return CONSTANTS.LAYOUT_GROW_DIR.RIGHT;
			case LOGICAL_STRUCTURE_LEFT: return CONSTANTS.LAYOUT_GROW_DIR.LEFT;
			case MIND_MAP:
			case TIMELINE2:
			case VERTICAL_TIMELINE:
			case FISHBONE: return node.dir;
			default: return "";
		}
	}
	handleVerticalCheck(node, checkList, isReverse = false) {
		const { layout } = this.mindMap.opt;
		const { LAYOUT, LAYOUT_GROW_DIR } = CONSTANTS;
		const { VERTICAL_TIMELINE, FISHBONE } = LAYOUT;
		const { BOTTOM, LEFT } = LAYOUT_GROW_DIR;
		const mouseMoveX = this.mouseMoveX;
		const mouseMoveY = this.mouseMoveY;
		const nodeRect = this.getNodeRect(node);
		const dir = this.getNewChildNodeDir(node);
		const layerIndex = node.layerIndex;
		if (isReverse || layout === FISHBONE && dir === BOTTOM && layerIndex >= 3) checkList = checkList.reverse();
		let oneFourthHeight = nodeRect.originHeight / 4;
		let { prevBrotherOffset, nextBrotherOffset } = this.getNodeDistanceToSiblingNode(checkList, node, nodeRect, "v");
		if (nodeRect.left <= mouseMoveX && nodeRect.right >= mouseMoveX) {
			if (!this.overlapNode && !this.prevNode && !this.nextNode && !node.isRoot) {
				let checkIsPrevNode = nextBrotherOffset > 0 ? mouseMoveY > nodeRect.bottom && mouseMoveY <= nodeRect.bottom + nextBrotherOffset : mouseMoveY >= nodeRect.bottom - oneFourthHeight && mouseMoveY <= nodeRect.bottom;
				let checkIsNextNode = prevBrotherOffset > 0 ? mouseMoveY < nodeRect.top && mouseMoveY >= nodeRect.top - prevBrotherOffset : mouseMoveY >= nodeRect.top && mouseMoveY <= nodeRect.top + oneFourthHeight;
				const { scaleY } = this.drawTransform;
				let x = dir === LEFT ? nodeRect.originRight - this.placeholderWidth : nodeRect.originLeft;
				let notRenderLine = false;
				switch (layout) {
					case VERTICAL_TIMELINE:
						if (layerIndex === 1) x = nodeRect.originLeft + nodeRect.originWidth / 2 - this.placeholderWidth / 2;
						break;
					default:
				}
				if (checkIsPrevNode) {
					if (isReverse) this.nextNode = node;
					else this.prevNode = node;
					let y = nodeRect.originBottom + nextBrotherOffset / scaleY - this.placeholderHeight / 2;
					switch (layout) {
						case FISHBONE:
							if (layerIndex === 2) {
								notRenderLine = true;
								y = nodeRect.originBottom + this.minOffset - this.placeholderHeight / 2;
							}
							break;
						default:
					}
					this.setPlaceholderRect({
						x,
						y,
						dir,
						notRenderLine
					});
				} else if (checkIsNextNode) {
					if (isReverse) this.prevNode = node;
					else this.nextNode = node;
					let y = nodeRect.originTop - this.placeholderHeight - prevBrotherOffset / scaleY + this.placeholderHeight / 2;
					switch (layout) {
						case FISHBONE:
							if (layerIndex === 2) {
								notRenderLine = true;
								y = nodeRect.originTop - this.placeholderHeight - this.minOffset + this.placeholderHeight / 2;
							}
							break;
						default:
					}
					this.setPlaceholderRect({
						x,
						y,
						dir,
						notRenderLine
					});
				}
			}
			this.checkIsOverlap({
				node,
				dir: "v",
				prevBrotherOffset,
				nextBrotherOffset,
				size: oneFourthHeight,
				pos: mouseMoveY,
				nodeRect
			});
		}
	}
	handleHorizontalCheck(node, checkList) {
		const { layout } = this.mindMap.opt;
		const { LAYOUT } = CONSTANTS;
		const { FISHBONE, TIMELINE, TIMELINE2 } = LAYOUT;
		let mouseMoveX = this.mouseMoveX;
		let mouseMoveY = this.mouseMoveY;
		let nodeRect = this.getNodeRect(node);
		let oneFourthWidth = nodeRect.originWidth / 4;
		let { prevBrotherOffset, nextBrotherOffset } = this.getNodeDistanceToSiblingNode(checkList, node, nodeRect, "h");
		if (nodeRect.top <= mouseMoveY && nodeRect.bottom >= mouseMoveY) {
			if (!this.overlapNode && !this.prevNode && !this.nextNode && !node.isRoot) {
				let checkIsPrevNode = nextBrotherOffset > 0 ? mouseMoveX < nodeRect.right + nextBrotherOffset && mouseMoveX >= nodeRect.right : mouseMoveX <= nodeRect.right && mouseMoveX >= nodeRect.right - oneFourthWidth;
				let checkIsNextNode = prevBrotherOffset > 0 ? mouseMoveX > nodeRect.left - prevBrotherOffset && mouseMoveX <= nodeRect.left : mouseMoveX <= nodeRect.left + oneFourthWidth && mouseMoveX >= nodeRect.left;
				const { scaleX } = this.drawTransform;
				const layerIndex = node.layerIndex;
				let y = nodeRect.originTop;
				let notRenderLine = false;
				switch (layout) {
					case TIMELINE:
					case TIMELINE2:
						y = nodeRect.originTop + nodeRect.originHeight / 2 - this.placeholderWidth / 2;
						break;
					case FISHBONE:
						if (layerIndex === 1) {
							notRenderLine = true;
							y = nodeRect.originTop + nodeRect.originHeight / 2 - this.placeholderWidth / 2;
						}
						break;
					default:
				}
				if (checkIsPrevNode) {
					this.prevNode = node;
					this.setPlaceholderRect({
						x: nodeRect.originRight + nextBrotherOffset / scaleX - this.placeholderHeight / 2,
						y,
						rotate: true,
						notRenderLine
					});
				} else if (checkIsNextNode) {
					this.nextNode = node;
					this.setPlaceholderRect({
						x: nodeRect.originLeft - this.placeholderHeight - prevBrotherOffset / scaleX + this.placeholderHeight / 2,
						y,
						rotate: true,
						notRenderLine
					});
				}
			}
			this.checkIsOverlap({
				node,
				dir: "h",
				prevBrotherOffset,
				nextBrotherOffset,
				size: oneFourthWidth,
				pos: mouseMoveX,
				nodeRect
			});
		}
	}
	getNodeDistanceToSiblingNode(checkList, node, nodeRect, dir) {
		const { TOP, LEFT, BOTTOM, RIGHT } = CONSTANTS.LAYOUT_GROW_DIR;
		let { scaleX, scaleY } = this.drawTransform;
		let dir1 = dir === "v" ? TOP : LEFT;
		let dir2 = dir === "v" ? BOTTOM : RIGHT;
		let scale = dir === "v" ? scaleY : scaleX;
		let minOffset = this.minOffset * scale;
		let index = getNodeIndexInNodeList(node, checkList);
		let prevBrother = null;
		let nextBrother = null;
		if (index !== -1) {
			if (index - 1 >= 0) prevBrother = checkList[index - 1];
			if (index + 1 <= checkList.length - 1) nextBrother = checkList[index + 1];
		}
		let prevBrotherOffset = 0;
		if (prevBrother) {
			let prevNodeRect = this.getNodeRect(prevBrother);
			prevBrotherOffset = nodeRect[dir1] - prevNodeRect[dir2];
			prevBrotherOffset = prevBrotherOffset >= minOffset ? prevBrotherOffset / 2 : 0;
		} else prevBrotherOffset = minOffset;
		let nextBrotherOffset = 0;
		if (nextBrother) {
			nextBrotherOffset = this.getNodeRect(nextBrother)[dir1] - nodeRect[dir2];
			nextBrotherOffset = nextBrotherOffset >= minOffset ? nextBrotherOffset / 2 : 0;
		} else nextBrotherOffset = minOffset;
		return {
			prevBrother,
			prevBrotherOffset,
			nextBrother,
			nextBrotherOffset
		};
	}
	setPlaceholderRect({ x, y, dir, rotate, notRenderLine }) {
		let w = this.placeholderWidth;
		let h = this.placeholderHeight;
		if (rotate) {
			const tmp = w;
			w = h;
			h = tmp;
		}
		this.placeholder.size(w, h).move(x, y);
		if (notRenderLine) return;
		const { dragPlaceholderLineConfig } = this.mindMap.opt;
		let node = null;
		let parent = null;
		if (this.overlapNode) {
			node = this.overlapNode;
			parent = this.overlapNode;
		} else {
			node = this.prevNode || this.nextNode;
			parent = node.parent;
		}
		parent = parent.fakeClone();
		node = node.fakeClone();
		const tmpNode = this.beingDragNodeList[0].fakeClone();
		tmpNode.dir = dir;
		tmpNode.left = x;
		tmpNode.top = y;
		tmpNode.width = w;
		tmpNode.height = h;
		parent.children = [tmpNode];
		parent._lines = [];
		this.placeHolderLine.show();
		this.mindMap.renderer.layout.renderLine(parent, [this.placeHolderLine], (...args) => {}, node.style.getStyle("lineStyle", true));
		this.placeHolderExtraLines = [...parent._lines];
		this.placeHolderExtraLines.forEach((line) => {
			this.mindMap.otherDraw.add(line);
			line.stroke({
				color: dragPlaceholderLineConfig.color,
				width: dragPlaceholderLineConfig.width
			}).fill({ color: "none" });
		});
	}
	checkIsOverlap({ node, dir, prevBrotherOffset, nextBrotherOffset, size, pos, nodeRect }) {
		const { TOP, LEFT, BOTTOM, RIGHT } = CONSTANTS.LAYOUT_GROW_DIR;
		let dir1 = dir === "v" ? TOP : LEFT;
		let dir2 = dir === "v" ? BOTTOM : RIGHT;
		if (!this.overlapNode && !this.prevNode && !this.nextNode) {
			if (nodeRect[dir1] + (prevBrotherOffset > 0 ? 0 : size) <= pos && nodeRect[dir2] - (nextBrotherOffset > 0 ? 0 : size) >= pos) this.overlapNode = node;
		}
	}
	handleLogicalStructure(node) {
		const checkList = this.commonGetNodeCheckList(node);
		this.handleVerticalCheck(node, checkList);
	}
	handleMindMap(node) {
		const checkList = node.parent ? node.parent.children.filter((item) => {
			let sameDir = true;
			if (node.layerIndex === 1) sameDir = item.dir === node.dir;
			return sameDir && !this.checkIsInBeingDragNodeList(item);
		}) : [];
		this.handleVerticalCheck(node, checkList);
	}
	handleOrganizationStructure(node) {
		const checkList = this.commonGetNodeCheckList(node);
		this.handleHorizontalCheck(node, checkList);
	}
	handleCatalogOrganization(node) {
		const checkList = this.commonGetNodeCheckList(node);
		if (node.layerIndex === 1) this.handleHorizontalCheck(node, checkList);
		else this.handleVerticalCheck(node, checkList);
	}
	handleTimeLine(node) {
		let checkList = this.commonGetNodeCheckList(node);
		if (node.layerIndex === 1) this.handleHorizontalCheck(node, checkList);
		else this.handleVerticalCheck(node, checkList);
	}
	handleTimeLine2(node) {
		let checkList = this.commonGetNodeCheckList(node);
		if (node.layerIndex === 1) this.handleHorizontalCheck(node, checkList);
		else if (node.dir === CONSTANTS.LAYOUT_GROW_DIR.TOP && node.layerIndex === 2) this.handleVerticalCheck(node, checkList, true);
		else this.handleVerticalCheck(node, checkList);
	}
	handleFishbone(node) {
		let checkList = node.parent ? node.parent.children.filter((item) => {
			return item.layerIndex > 1 && !this.checkIsInBeingDragNodeList(item);
		}) : [];
		if (node.layerIndex === 1) this.handleHorizontalCheck(node, checkList);
		else if (node.dir === CONSTANTS.LAYOUT_GROW_DIR.TOP && node.layerIndex === 2) this.handleVerticalCheck(node, checkList, true);
		else this.handleVerticalCheck(node, checkList);
	}
	commonGetNodeCheckList(node) {
		return node.parent ? [...node.parent.children].filter((item) => {
			return !this.checkIsInBeingDragNodeList(item);
		}) : [];
	}
	getNodeRect(node) {
		let { scaleX, scaleY, translateX, translateY } = this.drawTransform;
		let { left, top, width, height } = node;
		let originWidth = width;
		let originHeight = height;
		let originLeft = left;
		let originTop = top;
		let originBottom = top + height;
		let originRight = left + width;
		let right = (left + width) * scaleX + translateX;
		let bottom = (top + height) * scaleY + translateY;
		left = left * scaleX + translateX;
		top = top * scaleY + translateY;
		return {
			left,
			top,
			right,
			bottom,
			originWidth,
			originHeight,
			originLeft,
			originTop,
			originBottom,
			originRight
		};
	}
	checkIsInBeingDragNodeList(node) {
		return !!this.beingDragNodeList.find((item) => {
			return item.uid === node.uid || item.isAncestor(node);
		});
	}
	beforePluginRemove() {
		this.unBindEvent();
	}
	beforePluginDestroy() {
		this.unBindEvent();
	}
};
Drag.instanceName = "drag";
//#endregion
export { Drag as default };
