import { Tt as CONSTANTS, i as bfsWalk } from "./utils-DKbIT76G.js";
//#region node_modules/simple-mind-map/src/plugins/KeyboardNavigation.js
var KeyboardNavigation = class {
	constructor(opt) {
		this.opt = opt;
		this.mindMap = opt.mindMap;
		this.addShortcut();
	}
	addShortcut() {
		this.onLeftKeyUp = this.onLeftKeyUp.bind(this);
		this.onUpKeyUp = this.onUpKeyUp.bind(this);
		this.onRightKeyUp = this.onRightKeyUp.bind(this);
		this.onDownKeyUp = this.onDownKeyUp.bind(this);
		this.mindMap.keyCommand.addShortcut(CONSTANTS.KEY_DIR.LEFT, this.onLeftKeyUp);
		this.mindMap.keyCommand.addShortcut(CONSTANTS.KEY_DIR.UP, this.onUpKeyUp);
		this.mindMap.keyCommand.addShortcut(CONSTANTS.KEY_DIR.RIGHT, this.onRightKeyUp);
		this.mindMap.keyCommand.addShortcut(CONSTANTS.KEY_DIR.DOWN, this.onDownKeyUp);
	}
	removeShortcut() {
		this.mindMap.keyCommand.removeShortcut(CONSTANTS.KEY_DIR.LEFT, this.onLeftKeyUp);
		this.mindMap.keyCommand.removeShortcut(CONSTANTS.KEY_DIR.UP, this.onUpKeyUp);
		this.mindMap.keyCommand.removeShortcut(CONSTANTS.KEY_DIR.RIGHT, this.onRightKeyUp);
		this.mindMap.keyCommand.removeShortcut(CONSTANTS.KEY_DIR.DOWN, this.onDownKeyUp);
	}
	onLeftKeyUp() {
		this.onKeyup(CONSTANTS.KEY_DIR.LEFT);
	}
	onUpKeyUp() {
		this.onKeyup(CONSTANTS.KEY_DIR.UP);
	}
	onRightKeyUp() {
		this.onKeyup(CONSTANTS.KEY_DIR.RIGHT);
	}
	onDownKeyUp() {
		this.onKeyup(CONSTANTS.KEY_DIR.DOWN);
	}
	onKeyup(dir) {
		if (this.mindMap.renderer.activeNodeList.length > 0) this.focus(dir);
		else {
			let root = this.mindMap.renderer.root;
			this.mindMap.execCommand("GO_TARGET_NODE", root);
		}
	}
	focus(dir) {
		let currentActiveNode = this.mindMap.renderer.activeNodeList[0];
		let currentActiveNodeRect = this.getNodeRect(currentActiveNode);
		let targetNode = null;
		let targetDis = Infinity;
		let checkNodeDis = (rect, node) => {
			let dis = this.getDistance(currentActiveNodeRect, rect);
			if (dis < targetDis) {
				targetNode = node;
				targetDis = dis;
			}
		};
		this.getFocusNodeByShadowAlgorithm({
			currentActiveNode,
			currentActiveNodeRect,
			dir,
			checkNodeDis
		});
		if (!targetNode) this.getFocusNodeByAreaAlgorithm({
			currentActiveNode,
			currentActiveNodeRect,
			dir,
			checkNodeDis
		});
		if (!targetNode) this.getFocusNodeBySimpleAlgorithm({
			currentActiveNode,
			currentActiveNodeRect,
			dir,
			checkNodeDis
		});
		if (targetNode) this.mindMap.execCommand("GO_TARGET_NODE", targetNode);
	}
	getFocusNodeBySimpleAlgorithm({ currentActiveNode, currentActiveNodeRect, dir, checkNodeDis }) {
		bfsWalk(this.mindMap.renderer.root, (node) => {
			if (node.uid === currentActiveNode.uid) return;
			let rect = this.getNodeRect(node);
			let { left, top, right, bottom } = rect;
			let match = false;
			if (dir === CONSTANTS.KEY_DIR.LEFT) match = right <= currentActiveNodeRect.left;
			else if (dir === CONSTANTS.KEY_DIR.RIGHT) match = left >= currentActiveNodeRect.right;
			else if (dir === CONSTANTS.KEY_DIR.UP) match = bottom <= currentActiveNodeRect.top;
			else if (dir === CONSTANTS.KEY_DIR.DOWN) match = top >= currentActiveNodeRect.bottom;
			if (match) checkNodeDis(rect, node);
		});
	}
	getFocusNodeByShadowAlgorithm({ currentActiveNode, currentActiveNodeRect, dir, checkNodeDis }) {
		bfsWalk(this.mindMap.renderer.root, (node) => {
			if (node.uid === currentActiveNode.uid) return;
			let rect = this.getNodeRect(node);
			let { left, top, right, bottom } = rect;
			let match = false;
			if (dir === CONSTANTS.KEY_DIR.LEFT) match = left < currentActiveNodeRect.left && top < currentActiveNodeRect.bottom && bottom > currentActiveNodeRect.top;
			else if (dir === CONSTANTS.KEY_DIR.RIGHT) match = right > currentActiveNodeRect.right && top < currentActiveNodeRect.bottom && bottom > currentActiveNodeRect.top;
			else if (dir === CONSTANTS.KEY_DIR.UP) match = top < currentActiveNodeRect.top && left < currentActiveNodeRect.right && right > currentActiveNodeRect.left;
			else if (dir === CONSTANTS.KEY_DIR.DOWN) match = bottom > currentActiveNodeRect.bottom && left < currentActiveNodeRect.right && right > currentActiveNodeRect.left;
			if (match) checkNodeDis(rect, node);
		});
	}
	getFocusNodeByAreaAlgorithm({ currentActiveNode, currentActiveNodeRect, dir, checkNodeDis }) {
		let cX = (currentActiveNodeRect.right + currentActiveNodeRect.left) / 2;
		let cY = (currentActiveNodeRect.bottom + currentActiveNodeRect.top) / 2;
		bfsWalk(this.mindMap.renderer.root, (node) => {
			if (node.uid === currentActiveNode.uid) return;
			let rect = this.getNodeRect(node);
			let { left, top, right, bottom } = rect;
			let ccX = (right + left) / 2;
			let ccY = (bottom + top) / 2;
			let offsetX = ccX - cX;
			let offsetY = ccY - cY;
			if (offsetX === 0 && offsetY === 0) return;
			let match = false;
			if (dir === CONSTANTS.KEY_DIR.LEFT) match = offsetX <= 0 && offsetX <= offsetY && offsetX <= -offsetY;
			else if (dir === CONSTANTS.KEY_DIR.RIGHT) match = offsetX > 0 && offsetX >= -offsetY && offsetX >= offsetY;
			else if (dir === CONSTANTS.KEY_DIR.UP) match = offsetY <= 0 && offsetY < offsetX && offsetY < -offsetX;
			else if (dir === CONSTANTS.KEY_DIR.DOWN) match = offsetY > 0 && -offsetY < offsetX && offsetY > offsetX;
			if (match) checkNodeDis(rect, node);
		});
	}
	getNodeRect(node) {
		let { scaleX, scaleY, translateX, translateY } = this.mindMap.draw.transform();
		let { left, top, width, height } = node;
		return {
			right: (left + width) * scaleX + translateX,
			bottom: (top + height) * scaleY + translateY,
			left: left * scaleX + translateX,
			top: top * scaleY + translateY
		};
	}
	getDistance(node1Rect, node2Rect) {
		let center1 = this.getCenter(node1Rect);
		let center2 = this.getCenter(node2Rect);
		return Math.sqrt(Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2));
	}
	getCenter({ left, right, top, bottom }) {
		return {
			x: (left + right) / 2,
			y: (top + bottom) / 2
		};
	}
	beforePluginRemove() {
		this.removeShortcut();
	}
	beforePluginDestroy() {
		this.removeShortcut();
	}
};
KeyboardNavigation.instanceName = "keyboardNavigation";
//#endregion
export { KeyboardNavigation as default };
