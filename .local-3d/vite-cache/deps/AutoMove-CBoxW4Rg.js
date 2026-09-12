//#region node_modules/simple-mind-map/src/utils/AutoMove.js
var AutoMove = class {
	constructor(mindMap) {
		this.mindMap = mindMap;
		this.autoMoveTimer = null;
	}
	onMove(x, y, callback = () => {}, handle = () => {}) {
		callback();
		let step = this.mindMap.opt.selectTranslateStep;
		let limit = this.mindMap.opt.selectTranslateLimit;
		let count = 0;
		if (x <= this.mindMap.elRect.left + limit) {
			handle("left", step);
			this.mindMap.view.translateX(step);
			count++;
		}
		if (x >= this.mindMap.elRect.right - limit) {
			handle("right", step);
			this.mindMap.view.translateX(-step);
			count++;
		}
		if (y <= this.mindMap.elRect.top + limit) {
			handle("top", step);
			this.mindMap.view.translateY(step);
			count++;
		}
		if (y >= this.mindMap.elRect.bottom - limit) {
			handle("bottom", step);
			this.mindMap.view.translateY(-step);
			count++;
		}
		if (count > 0) this.startAutoMove(x, y, callback, handle);
	}
	startAutoMove(x, y, callback, handle) {
		this.autoMoveTimer = setTimeout(() => {
			this.onMove(x, y, callback, handle);
		}, 20);
	}
	clearAutoMoveTimer() {
		clearTimeout(this.autoMoveTimer);
	}
};
//#endregion
export { AutoMove as t };
