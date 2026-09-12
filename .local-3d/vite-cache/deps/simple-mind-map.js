import { o as __toESM, t as __commonJSMin } from "./rolldown-runtime-D1cXj70v.js";
import { A as getNodeTreeBoundingRect, At as noneRichTextNodeLineHeight, C as formatDataToArray, D as getNodeDataIndex, Dt as cssContent, E as getDataFromClipboard, Et as ERROR_TYPES, F as getTopAncestorsFomNodeList, G as isUndef, J as mergeTheme, K as isWhite, L as getVisibleColorFromTheme, N as getStrWithBrFromHtml, O as getNodeIndexInNodeList, P as getTextFromHtml, Q as parseAddGeneralizationNodeList, R as handleGetSvgDataExtraContent, S as focusInput, Tt as CONSTANTS, U as isNodeNotNeedRenderData, V as htmlEscape, W as isSameObject, X as nextTick, _ as createUid, at as setDataToClipboard, b as degToRad, ct as throttle, d as checkSmmFormatData, dt as checkIsNodeSizeIndependenceConfig, et as removeFromParentNodeData, ft as default_default, g as createSmmFormatData, i as bfsWalk, it as selectAllInput, j as getObjectChangedProps, kt as layoutValueList, l as checkNodeListIsEqual, lt as transformTreeDataToObject, m as copyRenderTree, o as checkClipboardReadEnable, ot as simpleDeepClone, p as copyNodeTree, pt as lineStyleProps, q as loadImage, r as asyncRun, s as checkIsNodeStyleDataKey, st as sortNodeList, t as addDataToAppointNodes, u as checkNodeOuter, ut as walk, v as createUidForAppointNodes, w as formatGetNodeGeneralization, wt as require_cjs, xt as SVG, y as debounce, yt as Polygon, z as handleInputPasteText } from "./utils-DKbIT76G.js";
import { n as shapeList, r as Style, t as Base } from "./Base-CBNqdkYU.js";
//#region node_modules/simple-mind-map/src/core/view/View.js
var View = class {
	constructor(opt = {}) {
		this.opt = opt;
		this.mindMap = this.opt.mindMap;
		this.scale = 1;
		this.sx = 0;
		this.sy = 0;
		this.x = 0;
		this.y = 0;
		this.firstDrag = true;
		this.setTransformData(this.mindMap.opt.viewData);
		this.bind();
	}
	bind() {
		this.mindMap.keyCommand.addShortcut("Control+=", () => {
			this.enlarge();
		});
		this.mindMap.keyCommand.addShortcut("Control+-", () => {
			this.narrow();
		});
		this.mindMap.keyCommand.addShortcut("Control+i", () => {
			this.fit();
		});
		this.mindMap.event.on("mousedown", (e) => {
			const { isDisableDrag, mousedownEventPreventDefault } = this.mindMap.opt;
			if (isDisableDrag) return;
			if (mousedownEventPreventDefault) e.preventDefault();
			this.sx = this.x;
			this.sy = this.y;
		});
		this.mindMap.event.on("drag", (e, event) => {
			if (e.ctrlKey || e.metaKey || this.mindMap.opt.isDisableDrag) return;
			if (this.firstDrag) {
				this.firstDrag = false;
				if (this.mindMap.renderer.activeNodeList.length > 0) this.mindMap.execCommand("CLEAR_ACTIVE_NODE");
			}
			this.x = this.sx + event.mousemoveOffset.x;
			this.y = this.sy + event.mousemoveOffset.y;
			this.transform();
		});
		this.mindMap.event.on("mouseup", () => {
			this.firstDrag = true;
		});
		this.mindMap.event.on("mousewheel", (e, dirs, event, isTouchPad) => {
			const { customHandleMousewheel, mousewheelAction, mouseScaleCenterUseMousePosition, mousewheelMoveStep, mousewheelZoomActionReverse, disableMouseWheelZoom, translateRatio } = this.mindMap.opt;
			if (customHandleMousewheel && typeof customHandleMousewheel === "function") return customHandleMousewheel(e);
			if (mousewheelAction === CONSTANTS.MOUSE_WHEEL_ACTION.ZOOM || e.ctrlKey || e.metaKey) {
				if (disableMouseWheelZoom) return;
				const { x: clientX, y: clientY } = this.mindMap.toPos(e.clientX, e.clientY);
				const cx = mouseScaleCenterUseMousePosition ? clientX : void 0;
				const cy = mouseScaleCenterUseMousePosition ? clientY : void 0;
				if (isTouchPad && (dirs.includes(CONSTANTS.DIR.LEFT) || dirs.includes(CONSTANTS.DIR.RIGHT))) dirs = dirs.filter((dir) => {
					return ![CONSTANTS.DIR.LEFT, CONSTANTS.DIR.RIGHT].includes(dir);
				});
				switch (true) {
					case dirs.includes(CONSTANTS.DIR.UP || CONSTANTS.DIR.LEFT):
						mousewheelZoomActionReverse ? this.enlarge(cx, cy, isTouchPad) : this.narrow(cx, cy, isTouchPad);
						break;
					case dirs.includes(CONSTANTS.DIR.DOWN || CONSTANTS.DIR.RIGHT):
						mousewheelZoomActionReverse ? this.narrow(cx, cy, isTouchPad) : this.enlarge(cx, cy, isTouchPad);
						break;
				}
			} else {
				let stepX = 0;
				let stepY = 0;
				if (isTouchPad) {
					stepX = Math.abs(e.wheelDeltaX);
					stepY = Math.abs(e.wheelDeltaY);
				} else stepX = stepY = mousewheelMoveStep;
				let mx = 0;
				let my = 0;
				if (dirs.includes(CONSTANTS.DIR.DOWN)) my = -stepY;
				if (dirs.includes(CONSTANTS.DIR.UP)) my = stepY;
				if (dirs.includes(CONSTANTS.DIR.LEFT)) mx = stepX;
				if (dirs.includes(CONSTANTS.DIR.RIGHT)) mx = -stepX;
				this.translateXY(mx * translateRatio, my * translateRatio);
			}
		});
		this.mindMap.on("resize", () => {
			if (!this.checkNeedMindMapInCanvas()) return;
			this.transform();
		});
	}
	getTransformData() {
		return {
			transform: this.mindMap.draw.transform(),
			state: {
				scale: this.scale,
				x: this.x,
				y: this.y,
				sx: this.sx,
				sy: this.sy
			}
		};
	}
	setTransformData(viewData) {
		if (viewData) {
			Object.keys(viewData.state).forEach((prop) => {
				this[prop] = viewData.state[prop];
			});
			this.mindMap.draw.transform({ ...viewData.transform });
			this.mindMap.emit("view_data_change", this.getTransformData());
			this.emitEvent("scale");
			this.emitEvent("translate");
		}
	}
	translateXY(x, y) {
		if (x === 0 && y === 0) return;
		this.x += x;
		this.y += y;
		this.transform();
		this.emitEvent("translate");
	}
	translateX(step) {
		if (step === 0) return;
		this.x += step;
		this.transform();
		this.emitEvent("translate");
	}
	translateXTo(x) {
		this.x = x;
		this.transform();
		this.emitEvent("translate");
	}
	translateY(step) {
		if (step === 0) return;
		this.y += step;
		this.transform();
		this.emitEvent("translate");
	}
	translateYTo(y) {
		this.y = y;
		this.transform();
		this.emitEvent("translate");
	}
	transform() {
		try {
			this.limitMindMapInCanvas();
		} catch (error) {}
		this.mindMap.draw.transform({
			origin: [0, 0],
			scale: this.scale,
			translate: [this.x, this.y]
		});
		this.mindMap.emit("view_data_change", this.getTransformData());
	}
	reset() {
		const scaleChange = this.scale !== 1;
		const translateChange = this.x !== 0 || this.y !== 0;
		this.scale = 1;
		this.x = 0;
		this.y = 0;
		this.transform();
		if (scaleChange) this.emitEvent("scale");
		if (translateChange) this.emitEvent("translate");
	}
	narrow(cx, cy, isTouchPad) {
		let { scaleRatio, minZoomRatio } = this.mindMap.opt;
		scaleRatio = scaleRatio / (isTouchPad ? 5 : 1);
		const scale = Math.max(this.scale - scaleRatio, minZoomRatio / 100);
		this.scaleInCenter(scale, cx, cy);
		this.transform();
		this.emitEvent("scale");
	}
	enlarge(cx, cy, isTouchPad) {
		let { scaleRatio, maxZoomRatio } = this.mindMap.opt;
		scaleRatio = scaleRatio / (isTouchPad ? 5 : 1);
		let scale = 0;
		if (maxZoomRatio === -1) scale = this.scale + scaleRatio;
		else scale = Math.min(this.scale + scaleRatio, maxZoomRatio / 100);
		this.scaleInCenter(scale, cx, cy);
		this.transform();
		this.emitEvent("scale");
	}
	scaleInCenter(scale, cx, cy) {
		if (cx === void 0 || cy === void 0) {
			cx = this.mindMap.width / 2;
			cy = this.mindMap.height / 2;
		}
		const ratio = 1 - scale / this.scale;
		const dx = (cx - this.x) * ratio;
		const dy = (cy - this.y) * ratio;
		this.x += dx;
		this.y += dy;
		this.scale = scale;
	}
	setScale(scale, cx, cy) {
		if (cx !== void 0 && cy !== void 0) this.scaleInCenter(scale, cx, cy);
		else this.scale = scale;
		this.transform();
		this.emitEvent("scale");
	}
	fit(getRbox = () => {}, enlarge = false, fitPadding) {
		fitPadding = fitPadding === void 0 ? this.mindMap.opt.fitPadding : fitPadding;
		const draw = this.mindMap.draw;
		const origTransform = draw.transform();
		const rect = getRbox() || draw.rbox();
		const drawWidth = rect.width / origTransform.scaleX;
		const drawHeight = rect.height / origTransform.scaleY;
		const drawRatio = drawWidth / drawHeight;
		let { width: elWidth, height: elHeight } = this.mindMap.elRect;
		elWidth = elWidth - fitPadding * 2;
		elHeight = elHeight - fitPadding * 2;
		const elRatio = elWidth / elHeight;
		let newScale = 0;
		let flag = "";
		if (drawWidth <= elWidth && drawHeight <= elHeight && !enlarge) {
			newScale = 1;
			flag = 1;
		} else {
			let newWidth = 0;
			if (drawRatio > elRatio) {
				newWidth = elWidth;
				elWidth / drawRatio;
				flag = 2;
			} else {
				newWidth = elHeight * drawRatio;
				flag = 3;
			}
			newScale = newWidth / drawWidth;
		}
		this.setScale(newScale);
		const newRect = getRbox() || draw.rbox();
		newRect.x -= this.mindMap.elRect.left;
		newRect.y -= this.mindMap.elRect.top;
		let newX = 0;
		let newY = 0;
		if (flag === 1) {
			newX = -newRect.x + fitPadding + (elWidth - newRect.width) / 2;
			newY = -newRect.y + fitPadding + (elHeight - newRect.height) / 2;
		} else if (flag === 2) {
			newX = -newRect.x + fitPadding;
			newY = -newRect.y + fitPadding + (elHeight - newRect.height) / 2;
		} else if (flag === 3) {
			newX = -newRect.x + fitPadding + (elWidth - newRect.width) / 2;
			newY = -newRect.y + fitPadding;
		}
		this.translateXY(newX, newY);
	}
	checkNeedMindMapInCanvas() {
		if (this.mindMap.demonstrate && this.mindMap.demonstrate.isInDemonstrate) return false;
		const { isLimitMindMapInCanvasWhenHasScrollbar, isLimitMindMapInCanvas } = this.mindMap.opt;
		if (this.mindMap.scrollbar) return isLimitMindMapInCanvasWhenHasScrollbar;
		else return isLimitMindMapInCanvas;
	}
	limitMindMapInCanvas() {
		if (!this.checkNeedMindMapInCanvas()) return;
		let { scale, left, top, right, bottom } = this.getPositionLimit();
		const centerXChange = (this.mindMap.width - this.mindMap.initWidth) / 2 * scale;
		const centerYChange = (this.mindMap.height - this.mindMap.initHeight) / 2 * scale;
		const scaleRatio = this.scale / scale;
		left *= scaleRatio;
		right *= scaleRatio;
		top *= scaleRatio;
		bottom *= scaleRatio;
		const centerX = this.mindMap.width / 2;
		const centerY = this.mindMap.height / 2;
		const scaleOffset = this.scale - 1;
		left -= scaleOffset * centerX - centerXChange;
		right -= scaleOffset * centerX - centerXChange;
		top -= scaleOffset * centerY - centerYChange;
		bottom -= scaleOffset * centerY - centerYChange;
		if (this.x > left) this.x = left;
		if (this.x < right) this.x = right;
		if (this.y > top) this.y = top;
		if (this.y < bottom) this.y = bottom;
	}
	getPositionLimit() {
		const { scaleX, scaleY } = this.mindMap.draw.transform();
		const drawRect = this.mindMap.draw.rbox();
		const rootRect = this.mindMap.renderer.root.group.rbox();
		const rootCenterOffset = this.mindMap.renderer.layout.getRootCenterOffset(rootRect.width, rootRect.height);
		return {
			scale: scaleX,
			left: rootRect.x - drawRect.x - rootCenterOffset.x * scaleX,
			right: rootRect.x - drawRect.x2 - rootCenterOffset.x * scaleX,
			top: rootRect.y - drawRect.y - rootCenterOffset.y * scaleY,
			bottom: rootRect.y - drawRect.y2 - rootCenterOffset.y * scaleY
		};
	}
	emitEvent(type) {
		switch (type) {
			case "scale": this.mindMap.emit("scale", this.scale);
			case "translate": this.mindMap.emit("translate", this.x, this.y);
		}
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/core/event/Event.js
var import_eventemitter3 = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var has = Object.prototype.hasOwnProperty;
	var prefix = "~";
	/**
	* Constructor to create a storage for our `EE` objects.
	* An `Events` instance is a plain object whose properties are event names.
	*
	* @constructor
	* @private
	*/
	function Events() {}
	if (Object.create) {
		Events.prototype = Object.create(null);
		if (!new Events().__proto__) prefix = false;
	}
	/**
	* Representation of a single event listener.
	*
	* @param {Function} fn The listener function.
	* @param {*} context The context to invoke the listener with.
	* @param {Boolean} [once=false] Specify if the listener is a one-time listener.
	* @constructor
	* @private
	*/
	function EE(fn, context, once) {
		this.fn = fn;
		this.context = context;
		this.once = once || false;
	}
	/**
	* Add a listener for a given event.
	*
	* @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
	* @param {(String|Symbol)} event The event name.
	* @param {Function} fn The listener function.
	* @param {*} context The context to invoke the listener with.
	* @param {Boolean} once Specify if the listener is a one-time listener.
	* @returns {EventEmitter}
	* @private
	*/
	function addListener(emitter, event, fn, context, once) {
		if (typeof fn !== "function") throw new TypeError("The listener must be a function");
		var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
		if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
		else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
		else emitter._events[evt] = [emitter._events[evt], listener];
		return emitter;
	}
	/**
	* Clear event by name.
	*
	* @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
	* @param {(String|Symbol)} evt The Event name.
	* @private
	*/
	function clearEvent(emitter, evt) {
		if (--emitter._eventsCount === 0) emitter._events = new Events();
		else delete emitter._events[evt];
	}
	/**
	* Minimal `EventEmitter` interface that is molded against the Node.js
	* `EventEmitter` interface.
	*
	* @constructor
	* @public
	*/
	function EventEmitter() {
		this._events = new Events();
		this._eventsCount = 0;
	}
	/**
	* Return an array listing the events for which the emitter has registered
	* listeners.
	*
	* @returns {Array}
	* @public
	*/
	EventEmitter.prototype.eventNames = function eventNames() {
		var names = [], events, name;
		if (this._eventsCount === 0) return names;
		for (name in events = this._events) if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
		if (Object.getOwnPropertySymbols) return names.concat(Object.getOwnPropertySymbols(events));
		return names;
	};
	/**
	* Return the listeners registered for a given event.
	*
	* @param {(String|Symbol)} event The event name.
	* @returns {Array} The registered listeners.
	* @public
	*/
	EventEmitter.prototype.listeners = function listeners(event) {
		var evt = prefix ? prefix + event : event, handlers = this._events[evt];
		if (!handlers) return [];
		if (handlers.fn) return [handlers.fn];
		for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) ee[i] = handlers[i].fn;
		return ee;
	};
	/**
	* Return the number of listeners listening to a given event.
	*
	* @param {(String|Symbol)} event The event name.
	* @returns {Number} The number of listeners.
	* @public
	*/
	EventEmitter.prototype.listenerCount = function listenerCount(event) {
		var evt = prefix ? prefix + event : event, listeners = this._events[evt];
		if (!listeners) return 0;
		if (listeners.fn) return 1;
		return listeners.length;
	};
	/**
	* Calls each of the listeners registered for a given event.
	*
	* @param {(String|Symbol)} event The event name.
	* @returns {Boolean} `true` if the event had listeners, else `false`.
	* @public
	*/
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
		var evt = prefix ? prefix + event : event;
		if (!this._events[evt]) return false;
		var listeners = this._events[evt], len = arguments.length, args, i;
		if (listeners.fn) {
			if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
			switch (len) {
				case 1: return listeners.fn.call(listeners.context), true;
				case 2: return listeners.fn.call(listeners.context, a1), true;
				case 3: return listeners.fn.call(listeners.context, a1, a2), true;
				case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
				case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
				case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
			}
			for (i = 1, args = new Array(len - 1); i < len; i++) args[i - 1] = arguments[i];
			listeners.fn.apply(listeners.context, args);
		} else {
			var length = listeners.length, j;
			for (i = 0; i < length; i++) {
				if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
				switch (len) {
					case 1:
						listeners[i].fn.call(listeners[i].context);
						break;
					case 2:
						listeners[i].fn.call(listeners[i].context, a1);
						break;
					case 3:
						listeners[i].fn.call(listeners[i].context, a1, a2);
						break;
					case 4:
						listeners[i].fn.call(listeners[i].context, a1, a2, a3);
						break;
					default:
						if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) args[j - 1] = arguments[j];
						listeners[i].fn.apply(listeners[i].context, args);
				}
			}
		}
		return true;
	};
	/**
	* Add a listener for a given event.
	*
	* @param {(String|Symbol)} event The event name.
	* @param {Function} fn The listener function.
	* @param {*} [context=this] The context to invoke the listener with.
	* @returns {EventEmitter} `this`.
	* @public
	*/
	EventEmitter.prototype.on = function on(event, fn, context) {
		return addListener(this, event, fn, context, false);
	};
	/**
	* Add a one-time listener for a given event.
	*
	* @param {(String|Symbol)} event The event name.
	* @param {Function} fn The listener function.
	* @param {*} [context=this] The context to invoke the listener with.
	* @returns {EventEmitter} `this`.
	* @public
	*/
	EventEmitter.prototype.once = function once(event, fn, context) {
		return addListener(this, event, fn, context, true);
	};
	/**
	* Remove the listeners of a given event.
	*
	* @param {(String|Symbol)} event The event name.
	* @param {Function} fn Only remove the listeners that match this function.
	* @param {*} context Only remove the listeners that have this context.
	* @param {Boolean} once Only remove one-time listeners.
	* @returns {EventEmitter} `this`.
	* @public
	*/
	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
		var evt = prefix ? prefix + event : event;
		if (!this._events[evt]) return this;
		if (!fn) {
			clearEvent(this, evt);
			return this;
		}
		var listeners = this._events[evt];
		if (listeners.fn) {
			if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) clearEvent(this, evt);
		} else {
			for (var i = 0, events = [], length = listeners.length; i < length; i++) if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) events.push(listeners[i]);
			if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
			else clearEvent(this, evt);
		}
		return this;
	};
	/**
	* Remove all listeners, or those of the specified event.
	*
	* @param {(String|Symbol)} [event] The event name.
	* @returns {EventEmitter} `this`.
	* @public
	*/
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
		var evt;
		if (event) {
			evt = prefix ? prefix + event : event;
			if (this._events[evt]) clearEvent(this, evt);
		} else {
			this._events = new Events();
			this._eventsCount = 0;
		}
		return this;
	};
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;
	EventEmitter.prefixed = prefix;
	EventEmitter.EventEmitter = EventEmitter;
	if ("undefined" !== typeof module) module.exports = EventEmitter;
})))());
var Event = class extends import_eventemitter3.default {
	constructor(opt = {}) {
		super();
		this.opt = opt;
		this.mindMap = opt.mindMap;
		this.isLeftMousedown = false;
		this.isRightMousedown = false;
		this.isMiddleMousedown = false;
		this.mousedownPos = {
			x: 0,
			y: 0
		};
		this.mousemovePos = {
			x: 0,
			y: 0
		};
		this.mousemoveOffset = {
			x: 0,
			y: 0
		};
		this.bindFn();
		this.bind();
	}
	bindFn() {
		this.onBodyMousedown = this.onBodyMousedown.bind(this);
		this.onBodyClick = this.onBodyClick.bind(this);
		this.onDrawClick = this.onDrawClick.bind(this);
		this.onMousedown = this.onMousedown.bind(this);
		this.onMousemove = this.onMousemove.bind(this);
		this.onMouseup = this.onMouseup.bind(this);
		this.onNodeMouseup = this.onNodeMouseup.bind(this);
		this.onMousewheel = this.onMousewheel.bind(this);
		this.onContextmenu = this.onContextmenu.bind(this);
		this.onSvgMousedown = this.onSvgMousedown.bind(this);
		this.onKeyup = this.onKeyup.bind(this);
		this.onMouseenter = this.onMouseenter.bind(this);
		this.onMouseleave = this.onMouseleave.bind(this);
	}
	bind() {
		document.body.addEventListener("mousedown", this.onBodyMousedown);
		document.body.addEventListener("click", this.onBodyClick);
		this.mindMap.svg.on("click", this.onDrawClick);
		this.mindMap.el.addEventListener("mousedown", this.onMousedown);
		this.mindMap.svg.on("mousedown", this.onSvgMousedown);
		window.addEventListener("mousemove", this.onMousemove);
		window.addEventListener("mouseup", this.onMouseup);
		this.on("node_mouseup", this.onNodeMouseup);
		this.mindMap.el.addEventListener("wheel", this.onMousewheel);
		this.mindMap.svg.on("contextmenu", this.onContextmenu);
		this.mindMap.svg.on("mouseenter", this.onMouseenter);
		this.mindMap.svg.on("mouseleave", this.onMouseleave);
		window.addEventListener("keyup", this.onKeyup);
	}
	unbind() {
		document.body.removeEventListener("mousedown", this.onBodyMousedown);
		document.body.removeEventListener("click", this.onBodyClick);
		this.mindMap.svg.off("click", this.onDrawClick);
		this.mindMap.el.removeEventListener("mousedown", this.onMousedown);
		window.removeEventListener("mousemove", this.onMousemove);
		window.removeEventListener("mouseup", this.onMouseup);
		this.off("node_mouseup", this.onNodeMouseup);
		this.mindMap.el.removeEventListener("wheel", this.onMousewheel);
		this.mindMap.svg.off("contextmenu", this.onContextmenu);
		this.mindMap.svg.off("mouseenter", this.onMouseenter);
		this.mindMap.svg.off("mouseleave", this.onMouseleave);
		window.removeEventListener("keyup", this.onKeyup);
	}
	onDrawClick(e) {
		this.emit("draw_click", e);
	}
	onBodyMousedown(e) {
		this.emit("body_mousedown", e);
	}
	onBodyClick(e) {
		this.emit("body_click", e);
	}
	onSvgMousedown(e) {
		this.emit("svg_mousedown", e);
	}
	onMousedown(e) {
		if (e.which === 1) this.isLeftMousedown = true;
		else if (e.which === 3) this.isRightMousedown = true;
		else if (e.which === 2) this.isMiddleMousedown = true;
		this.mousedownPos.x = e.clientX;
		this.mousedownPos.y = e.clientY;
		this.emit("mousedown", e, this);
	}
	onMousemove(e) {
		let { useLeftKeySelectionRightKeyDrag } = this.mindMap.opt;
		this.mousemovePos.x = e.clientX;
		this.mousemovePos.y = e.clientY;
		this.mousemoveOffset.x = e.clientX - this.mousedownPos.x;
		this.mousemoveOffset.y = e.clientY - this.mousedownPos.y;
		this.emit("mousemove", e, this);
		if (this.isMiddleMousedown || (useLeftKeySelectionRightKeyDrag ? this.isRightMousedown : this.isLeftMousedown)) {
			e.preventDefault();
			this.emit("drag", e, this);
		}
	}
	onMouseup(e) {
		this.onNodeMouseup();
		this.emit("mouseup", e, this);
	}
	onNodeMouseup() {
		this.isLeftMousedown = false;
		this.isRightMousedown = false;
		this.isMiddleMousedown = false;
	}
	onMousewheel(e) {
		e.stopPropagation();
		e.preventDefault();
		const dirs = [];
		if (e.deltaY < 0) dirs.push(CONSTANTS.DIR.UP);
		if (e.deltaY > 0) dirs.push(CONSTANTS.DIR.DOWN);
		if (e.deltaX < 0) dirs.push(CONSTANTS.DIR.LEFT);
		if (e.deltaX > 0) dirs.push(CONSTANTS.DIR.RIGHT);
		let isTouchPad = false;
		const { customCheckIsTouchPad } = this.mindMap.opt;
		if (typeof customCheckIsTouchPad === "function") isTouchPad = customCheckIsTouchPad(e);
		else isTouchPad = Math.abs(e.deltaY) <= 10;
		this.emit("mousewheel", e, dirs, this, isTouchPad);
	}
	onContextmenu(e) {
		e.preventDefault();
		if (e.ctrlKey) return;
		this.emit("contextmenu", e);
	}
	onKeyup(e) {
		this.emit("keyup", e);
	}
	onMouseenter(e) {
		this.emit("svg_mouseenter", e);
	}
	onMouseleave(e) {
		this.emit("svg_mouseleave", e);
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/layouts/LogicalStructure.js
var import_cjs = /* @__PURE__ */ __toESM(require_cjs());
var LogicalStructure = class extends Base {
	constructor(opt = {}, layout) {
		super(opt);
		this.isUseLeft = layout === CONSTANTS.LAYOUT.LOGICAL_STRUCTURE_LEFT;
	}
	doLayout(callback) {
		asyncRun([
			() => {
				this.computedBaseValue();
			},
			() => {
				this.computedTopValue();
			},
			() => {
				this.adjustTopValue();
			},
			() => {
				callback(this.root);
			}
		]);
	}
	computedBaseValue() {
		let sortIndex = 0;
		walk(this.renderer.renderTree, null, (cur, parent, isRoot, layerIndex, index, ancestors) => {
			let newNode = this.createNode(cur, parent, isRoot, layerIndex, index, ancestors);
			newNode.sortIndex = sortIndex;
			sortIndex++;
			if (isRoot) this.setNodeCenter(newNode);
			else if (this.isUseLeft) newNode.left = parent._node.left - newNode.width - this.getMarginX(layerIndex);
			else newNode.left = parent._node.left + parent._node.width + this.getMarginX(layerIndex);
			if (!cur.data.expand) return true;
		}, (cur, parent, isRoot, layerIndex) => {
			let len = cur.data.expand === false ? 0 : cur._node.children.length;
			cur._node.childrenAreaHeight = len ? cur._node.children.reduce((h, item) => {
				return h + item.height;
			}, 0) + (len + 1) * this.getMarginY(layerIndex + 1) : 0;
			let generalizationNodeHeight = cur._node.checkHasGeneralization() ? cur._node._generalizationNodeHeight + this.getMarginY(layerIndex + 1) : 0;
			cur._node.childrenAreaHeight2 = Math.max(cur._node.childrenAreaHeight, generalizationNodeHeight);
		}, true, 0);
	}
	computedTopValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex) => {
			if (node.getData("expand") && node.children && node.children.length) {
				let marginY = this.getMarginY(layerIndex + 1);
				let totalTop = node.top + node.height / 2 - node.childrenAreaHeight / 2 + marginY;
				node.children.forEach((cur) => {
					cur.top = totalTop;
					totalTop += cur.height + marginY;
				});
			}
		}, null, true);
	}
	adjustTopValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex) => {
			if (!node.getData("expand")) return;
			let difference = node.childrenAreaHeight2 - this.getMarginY(layerIndex + 1) * 2 - node.height;
			if (difference > 0) this.updateBrothers(node, difference / 2);
		}, null, true);
	}
	updateBrothers(node, addHeight) {
		if (node.parent) {
			let childrenList = node.parent.children;
			let index = getNodeIndexInNodeList(node, childrenList);
			childrenList.forEach((item, _index) => {
				if (item.uid === node.uid || item.hasCustomPosition()) return;
				let _offset = 0;
				if (_index < index) _offset = -addHeight;
				else if (_index > index) _offset = addHeight;
				item.top += _offset;
				if (item.children && item.children.length) this.updateChildren(item.children, "top", _offset);
			});
			this.updateBrothers(node.parent, addHeight);
		}
	}
	renderLine(node, lines, style, lineStyle) {
		if (lineStyle === "curve") this.renderLineCurve(node, lines, style);
		else if (lineStyle === "direct") this.renderLineDirect(node, lines, style);
		else this.renderLineStraight(node, lines, style);
	}
	renderLineStraight(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { left, top, width, height, expandBtnSize } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		let s1 = (this.getMarginX(node.layerIndex + 1) - expandBtnSize) * .6;
		if (this.isUseLeft) s1 *= -1;
		let nodeUseLineStyle = this.mindMap.themeConfig.nodeUseLineStyle;
		node.children.forEach((item, index) => {
			let x1;
			if (this.isUseLeft) x1 = node.layerIndex === 0 ? left : left - expandBtnSize;
			else x1 = node.layerIndex === 0 ? left + width : left + width + expandBtnSize;
			let y1 = top + height / 2;
			let x2 = this.isUseLeft ? item.left + item.width : item.left;
			let y2 = item.top + item.height / 2;
			let nodeUseLineStyleOffset = nodeUseLineStyle ? item.width * (this.isUseLeft ? -1 : 1) : 0;
			y1 = nodeUseLineStyle && !node.isRoot ? y1 + height / 2 : y1;
			y2 = nodeUseLineStyle ? y2 + item.height / 2 : y2;
			let path = this.createFoldLine([
				[x1, y1],
				[x1 + s1, y1],
				[x1 + s1, y2],
				[x2 + nodeUseLineStyleOffset, y2]
			]);
			this.setLineStyle(style, lines[index], path, item);
		});
	}
	renderLineDirect(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { left, top, width, height, expandBtnSize } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		const { nodeUseLineStyle } = this.mindMap.themeConfig;
		node.children.forEach((item, index) => {
			if (node.layerIndex === 0) expandBtnSize = 0;
			let x1 = this.isUseLeft ? left - expandBtnSize : left + width + expandBtnSize;
			let y1 = top + height / 2;
			let x2 = this.isUseLeft ? item.left + item.width : item.left;
			let y2 = item.top + item.height / 2;
			y1 = nodeUseLineStyle && !node.isRoot ? y1 + height / 2 : y1;
			y2 = nodeUseLineStyle ? y2 + item.height / 2 : y2;
			let nodeUseLineStylePath = nodeUseLineStyle ? ` L ${this.isUseLeft ? item.left : item.left + item.width},${y2}` : "";
			let path = `M ${x1},${y1} L ${x2},${y2}` + nodeUseLineStylePath;
			this.setLineStyle(style, lines[index], path, item);
		});
	}
	renderLineCurve(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { left, top, width, height, expandBtnSize } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		const { nodeUseLineStyle, rootLineStartPositionKeepSameInCurve, rootLineKeepSameInCurve } = this.mindMap.themeConfig;
		node.children.forEach((item, index) => {
			if (node.layerIndex === 0) expandBtnSize = 0;
			let x1;
			if (this.isUseLeft) x1 = node.layerIndex === 0 && !rootLineStartPositionKeepSameInCurve ? left + width / 2 : left - expandBtnSize;
			else x1 = node.layerIndex === 0 && !rootLineStartPositionKeepSameInCurve ? left + width / 2 : left + width + expandBtnSize;
			let y1 = top + height / 2;
			let x2 = this.isUseLeft ? item.left + item.width : item.left;
			let y2 = item.top + item.height / 2;
			let path = "";
			y1 = nodeUseLineStyle && !node.isRoot ? y1 + height / 2 : y1;
			y2 = nodeUseLineStyle ? y2 + item.height / 2 : y2;
			let nodeUseLineStylePath;
			if (this.isUseLeft) nodeUseLineStylePath = nodeUseLineStyle ? ` L ${item.left},${y2}` : "";
			else nodeUseLineStylePath = nodeUseLineStyle ? ` L ${item.left + item.width},${y2}` : "";
			if (node.isRoot && !rootLineKeepSameInCurve) path = this.quadraticCurvePath(x1, y1, x2, y2) + nodeUseLineStylePath;
			else path = this.cubicBezierPath(x1, y1, x2, y2) + nodeUseLineStylePath;
			this.setLineStyle(style, lines[index], path, item);
		});
	}
	renderExpandBtn(node, btn) {
		let { width, height, expandBtnSize, layerIndex } = node;
		if (layerIndex === 0) expandBtnSize = 0;
		let { translateX, translateY } = btn.transform();
		let nodeUseLineStyleOffset = this.mindMap.themeConfig.nodeUseLineStyle ? height / 2 : 0;
		let _x = this.isUseLeft ? 0 - expandBtnSize : width;
		let _y = height / 2 + nodeUseLineStyleOffset;
		if (_x === translateX && _y === translateY) return;
		btn.translate(_x - translateX, _y - translateY);
	}
	renderGeneralization(list) {
		list.forEach((item) => {
			let { left, top, bottom, right, generalizationLineMargin, generalizationNodeMargin } = this.getNodeGeneralizationRenderBoundaries(item, "h");
			let x = this.isUseLeft ? left - generalizationLineMargin : right + generalizationLineMargin;
			let x1 = x;
			let y1 = top;
			let x2 = x;
			let y2 = bottom;
			let path = `M ${x1},${y1} Q ${x1 + (this.isUseLeft ? -20 : 20)},${y1 + (y2 - y1) / 2} ${x2},${y2}`;
			item.generalizationLine.plot(path);
			item.generalizationNode.left = x + (this.isUseLeft ? -generalizationNodeMargin : generalizationNodeMargin) - (this.isUseLeft ? item.generalizationNode.width : 0);
			item.generalizationNode.top = top + (bottom - top - item.generalizationNode.height) / 2;
		});
	}
	renderExpandBtnRect(rect, expandBtnSize, width, height) {
		if (this.isUseLeft) rect.size(expandBtnSize, height).x(-expandBtnSize).y(0);
		else rect.size(expandBtnSize, height).x(width).y(0);
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/layouts/MindMap.js
var MindMap$1 = class extends Base {
	constructor(opt = {}) {
		super(opt);
	}
	doLayout(callback) {
		asyncRun([
			() => {
				this.computedBaseValue();
			},
			() => {
				this.computedTopValue();
			},
			() => {
				this.adjustTopValue();
			},
			() => {
				callback(this.root);
			}
		]);
	}
	computedBaseValue() {
		walk(this.renderer.renderTree, null, (cur, parent, isRoot, layerIndex, index, ancestors) => {
			let newNode = this.createNode(cur, parent, isRoot, layerIndex, index, ancestors);
			if (isRoot) this.setNodeCenter(newNode);
			else {
				if (parent._node.dir) newNode.dir = parent._node.dir;
				else newNode.dir = newNode.getData("dir") || (index % 2 === 0 ? CONSTANTS.LAYOUT_GROW_DIR.RIGHT : CONSTANTS.LAYOUT_GROW_DIR.LEFT);
				newNode.left = newNode.dir === CONSTANTS.LAYOUT_GROW_DIR.RIGHT ? parent._node.left + parent._node.width + this.getMarginX(layerIndex) : parent._node.left - this.getMarginX(layerIndex) - newNode.width;
			}
			if (!cur.data.expand) return true;
		}, (cur, parent, isRoot, layerIndex) => {
			if (!cur.data.expand) {
				cur._node.leftChildrenAreaHeight = 0;
				cur._node.rightChildrenAreaHeight = 0;
				return;
			}
			let leftLen = 0;
			let rightLen = 0;
			let leftChildrenAreaHeight = 0;
			let rightChildrenAreaHeight = 0;
			cur._node.children.forEach((item) => {
				if (item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT) {
					leftLen++;
					leftChildrenAreaHeight += item.height;
				} else {
					rightLen++;
					rightChildrenAreaHeight += item.height;
				}
			});
			cur._node.leftChildrenAreaHeight = leftChildrenAreaHeight + (leftLen + 1) * this.getMarginY(layerIndex + 1);
			cur._node.rightChildrenAreaHeight = rightChildrenAreaHeight + (rightLen + 1) * this.getMarginY(layerIndex + 1);
			let generalizationNodeHeight = cur._node.checkHasGeneralization() ? cur._node._generalizationNodeHeight + this.getMarginY(layerIndex + 1) : 0;
			cur._node.leftChildrenAreaHeight2 = Math.max(cur._node.leftChildrenAreaHeight, generalizationNodeHeight);
			cur._node.rightChildrenAreaHeight2 = Math.max(cur._node.rightChildrenAreaHeight, generalizationNodeHeight);
		}, true, 0);
	}
	computedTopValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex) => {
			if (node.getData("expand") && node.children && node.children.length) {
				let marginY = this.getMarginY(layerIndex + 1);
				let baseTop = node.top + node.height / 2 + marginY;
				let leftTotalTop = baseTop - node.leftChildrenAreaHeight / 2;
				let rightTotalTop = baseTop - node.rightChildrenAreaHeight / 2;
				node.children.forEach((cur) => {
					if (cur.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT) {
						cur.top = leftTotalTop;
						leftTotalTop += cur.height + marginY;
					} else {
						cur.top = rightTotalTop;
						rightTotalTop += cur.height + marginY;
					}
				});
			}
		}, null, true);
	}
	adjustTopValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex) => {
			if (!node.getData("expand")) return;
			let base = this.getMarginY(layerIndex + 1) * 2 + node.height;
			let leftDifference = node.leftChildrenAreaHeight2 - base;
			let rightDifference = node.rightChildrenAreaHeight2 - base;
			if (leftDifference > 0 || rightDifference > 0) this.updateBrothers(node, leftDifference / 2, rightDifference / 2);
		}, null, true);
	}
	updateBrothers(node, leftAddHeight, rightAddHeight) {
		if (node.parent) {
			let childrenList = node.parent.children.filter((item) => {
				return item.dir === node.dir;
			});
			let index = getNodeIndexInNodeList(node, childrenList);
			childrenList.forEach((item, _index) => {
				if (item.hasCustomPosition()) return;
				let _offset = 0;
				let addHeight = item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT ? leftAddHeight : rightAddHeight;
				if (_index < index) _offset = -addHeight;
				else if (_index > index) _offset = addHeight;
				item.top += _offset;
				if (item.children && item.children.length) this.updateChildren(item.children, "top", _offset);
			});
			this.updateBrothers(node.parent, leftAddHeight, rightAddHeight);
		}
	}
	renderLine(node, lines, style, lineStyle) {
		if (lineStyle === "curve") this.renderLineCurve(node, lines, style);
		else if (lineStyle === "direct") this.renderLineDirect(node, lines, style);
		else this.renderLineStraight(node, lines, style);
	}
	renderLineStraight(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { left, top, width, height, expandBtnSize } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		let s1 = (this.getMarginX(node.layerIndex + 1) - expandBtnSize) * .6;
		let nodeUseLineStyle = this.mindMap.themeConfig.nodeUseLineStyle;
		node.children.forEach((item, index) => {
			let x1 = 0;
			let _s = 0;
			let nodeUseLineStyleOffset = nodeUseLineStyle ? item.width : 0;
			if (item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT) {
				_s = -s1;
				x1 = node.layerIndex === 0 ? left : left - expandBtnSize;
				nodeUseLineStyleOffset = -nodeUseLineStyleOffset;
			} else {
				_s = s1;
				x1 = node.layerIndex === 0 ? left + width : left + width + expandBtnSize;
			}
			let y1 = top + height / 2;
			let x2 = item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT ? item.left + item.width : item.left;
			let y2 = item.top + item.height / 2;
			y1 = nodeUseLineStyle && !node.isRoot ? y1 + height / 2 : y1;
			y2 = nodeUseLineStyle ? y2 + item.height / 2 : y2;
			let path = this.createFoldLine([
				[x1, y1],
				[x1 + _s, y1],
				[x1 + _s, y2],
				[x2 + nodeUseLineStyleOffset, y2]
			]);
			this.setLineStyle(style, lines[index], path, item);
		});
	}
	renderLineDirect(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { left, top, width, height, expandBtnSize } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		const { nodeUseLineStyle } = this.mindMap.themeConfig;
		node.children.forEach((item, index) => {
			if (node.layerIndex === 0) expandBtnSize = 0;
			let x1 = item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT ? left - expandBtnSize : left + width + expandBtnSize;
			let y1 = top + height / 2;
			let x2 = item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT ? item.left + item.width : item.left;
			let y2 = item.top + item.height / 2;
			y1 = nodeUseLineStyle && !node.isRoot ? y1 + height / 2 : y1;
			y2 = nodeUseLineStyle ? y2 + item.height / 2 : y2;
			let nodeUseLineStylePath = "";
			if (nodeUseLineStyle) if (item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT) nodeUseLineStylePath = ` L ${item.left},${y2}`;
			else nodeUseLineStylePath = ` L ${item.left + item.width},${y2}`;
			let path = `M ${x1},${y1} L ${x2},${y2}` + nodeUseLineStylePath;
			this.setLineStyle(style, lines[index], path, item);
		});
	}
	renderLineCurve(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { left, top, width, height, expandBtnSize } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		const { nodeUseLineStyle, rootLineKeepSameInCurve, rootLineStartPositionKeepSameInCurve } = this.mindMap.themeConfig;
		node.children.forEach((item, index) => {
			if (node.layerIndex === 0) expandBtnSize = 0;
			let x1 = node.layerIndex === 0 && !rootLineStartPositionKeepSameInCurve ? left + width / 2 : item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT ? left - expandBtnSize : left + width + expandBtnSize;
			let y1 = top + height / 2;
			let x2 = item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT ? item.left + item.width : item.left;
			let y2 = item.top + item.height / 2;
			let path = "";
			y1 = nodeUseLineStyle && !node.isRoot ? y1 + height / 2 : y1;
			y2 = nodeUseLineStyle ? y2 + item.height / 2 : y2;
			let nodeUseLineStylePath = "";
			if (nodeUseLineStyle) if (item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT) nodeUseLineStylePath = ` L ${item.left},${y2}`;
			else nodeUseLineStylePath = ` L ${item.left + item.width},${y2}`;
			if (node.isRoot && !rootLineKeepSameInCurve) path = this.quadraticCurvePath(x1, y1, x2, y2) + nodeUseLineStylePath;
			else path = this.cubicBezierPath(x1, y1, x2, y2) + nodeUseLineStylePath;
			this.setLineStyle(style, lines[index], path, item);
		});
	}
	renderExpandBtn(node, btn) {
		let { width, height, expandBtnSize } = node;
		let { translateX, translateY } = btn.transform();
		let nodeUseLineStyleOffset = this.mindMap.themeConfig.nodeUseLineStyle ? height / 2 : 0;
		let _x = node.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT ? 0 - expandBtnSize : width;
		let _y = height / 2 + nodeUseLineStyleOffset;
		if (_x === translateX && _y === translateY) return;
		let x = _x - translateX;
		let y = _y - translateY;
		btn.translate(x, y);
	}
	renderGeneralization(list) {
		list.forEach((item) => {
			let isLeft = item.node.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT;
			let { top, bottom, left, right, generalizationLineMargin, generalizationNodeMargin } = this.getNodeGeneralizationRenderBoundaries(item, "h");
			let x = isLeft ? left - generalizationLineMargin : right + generalizationLineMargin;
			let x1 = x;
			let y1 = top;
			let x2 = x;
			let y2 = bottom;
			let path = `M ${x1},${y1} Q ${x1 + (isLeft ? -20 : 20)},${y1 + (y2 - y1) / 2} ${x2},${y2}`;
			item.generalizationLine.plot(path);
			item.generalizationNode.left = x + (isLeft ? -generalizationNodeMargin : generalizationNodeMargin) - (isLeft ? item.generalizationNode.width : 0);
			item.generalizationNode.top = top + (bottom - top - item.generalizationNode.height) / 2;
		});
	}
	renderExpandBtnRect(rect, expandBtnSize, width, height, node) {
		if (node.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT) rect.size(expandBtnSize, height).x(-expandBtnSize).y(0);
		else rect.size(expandBtnSize, height).x(width).y(0);
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/layouts/CatalogOrganization.js
var CatalogOrganization = class extends Base {
	constructor(opt = {}) {
		super(opt);
	}
	doLayout(callback) {
		asyncRun([
			() => {
				this.computedBaseValue();
			},
			() => {
				this.computedLeftTopValue();
			},
			() => {
				this.adjustLeftTopValue();
			},
			() => {
				callback(this.root);
			}
		]);
	}
	computedBaseValue() {
		walk(this.renderer.renderTree, null, (cur, parent, isRoot, layerIndex, index, ancestors) => {
			let newNode = this.createNode(cur, parent, isRoot, layerIndex, index, ancestors);
			if (isRoot) this.setNodeCenter(newNode);
			else if (parent._node.isRoot) newNode.top = parent._node.top + parent._node.height + this.getMarginX(layerIndex);
			if (!cur.data.expand) return true;
		}, (cur, parent, isRoot, layerIndex) => {
			if (isRoot) {
				let len = cur.data.expand === false ? 0 : cur._node.children.length;
				cur._node.childrenAreaWidth = len ? cur._node.children.reduce((h, item) => {
					return h + item.width;
				}, 0) + (len + 1) * this.getMarginX(layerIndex + 1) : 0;
			}
		}, true, 0);
	}
	computedLeftTopValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex) => {
			if (node.getData("expand") && node.children && node.children.length) {
				let marginX = this.getMarginX(layerIndex + 1);
				let marginY = this.getMarginY(layerIndex + 1);
				if (isRoot) {
					let totalLeft = node.left + node.width / 2 - node.childrenAreaWidth / 2 + marginX;
					node.children.forEach((cur) => {
						cur.left = totalLeft;
						totalLeft += cur.width + marginX;
					});
				} else {
					let totalTop = node.top + this.getNodeHeightWithGeneralization(node) + marginY + (this.getNodeActChildrenLength(node) > 0 ? node.expandBtnSize : 0);
					node.children.forEach((cur) => {
						cur.left = node.left + node.width * .5;
						cur.top = totalTop;
						totalTop += this.getNodeHeightWithGeneralization(cur) + marginY + (this.getNodeActChildrenLength(cur) > 0 ? cur.expandBtnSize : 0);
					});
				}
			}
		}, null, true);
	}
	adjustLeftTopValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex) => {
			if (!node.getData("expand")) return;
			if (parent && parent.isRoot) {
				let difference = this.getNodeAreaWidth(node, true) - node.width;
				if (difference > 0) this.updateBrothersLeft(node, difference);
			}
			let len = node.children.length;
			if (parent && !parent.isRoot && len > 0) {
				let marginY = this.getMarginY(layerIndex + 1);
				let totalHeight = node.children.reduce((h, item) => {
					return h + this.getNodeHeightWithGeneralization(item) + (this.getNodeActChildrenLength(item) > 0 ? item.expandBtnSize : 0);
				}, 0) + len * marginY;
				this.updateBrothersTop(node, totalHeight);
			}
		}, (node, parent, isRoot) => {
			if (isRoot) {
				let { right, left } = this.getNodeBoundaries(node, "h");
				let childrenWidth = right - left;
				let offset = node.left - left - (childrenWidth - node.width) / 2;
				this.updateChildren(node.children, "left", offset);
			}
		}, true);
	}
	updateBrothersLeft(node, addWidth) {
		if (node.parent) {
			let childrenList = node.parent.children;
			let index = getNodeIndexInNodeList(node, childrenList);
			childrenList.forEach((item, _index) => {
				if (item.hasCustomPosition() || _index <= index) return;
				item.left += addWidth;
				if (item.children && item.children.length) this.updateChildren(item.children, "left", addWidth);
			});
			this.updateBrothersLeft(node.parent, addWidth);
		}
	}
	updateBrothersTop(node, addHeight) {
		if (node.parent && !node.parent.isRoot) {
			let childrenList = node.parent.children;
			let index = getNodeIndexInNodeList(node, childrenList);
			childrenList.forEach((item, _index) => {
				if (item.hasCustomPosition()) return;
				let _offset = 0;
				if (_index > index) _offset = addHeight;
				item.top += _offset;
				if (item.children && item.children.length) this.updateChildren(item.children, "top", _offset);
			});
			this.updateBrothersTop(node.parent, addHeight);
		}
	}
	renderLine(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { left, top, width, height, expandBtnSize } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		let len = node.children.length;
		let marginX = this.getMarginX(node.layerIndex + 1);
		if (node.isRoot) {
			let x1 = left + width / 2;
			let y1 = top + height;
			let s1 = marginX * .7;
			let minx = Infinity;
			let maxx = -Infinity;
			node.children.forEach((item, index) => {
				let x2 = item.left + item.width / 2;
				let y2 = item.top;
				if (x2 < minx) minx = x2;
				if (x2 > maxx) maxx = x2;
				let nodeUseLineStylePath = this.mindMap.themeConfig.nodeUseLineStyle ? ` L ${item.left},${y2} L ${item.left + item.width},${y2}` : "";
				let path = `M ${x2},${y1 + s1} L ${x2},${y1 + s1 > y2 ? y2 + item.height : y2}` + nodeUseLineStylePath;
				this.setLineStyle(style, lines[index], path, item);
			});
			minx = Math.min(minx, x1);
			maxx = Math.max(maxx, x1);
			let line1 = this.lineDraw.path();
			node.style.line(line1);
			line1.plot(this.transformPath(`M ${x1},${y1} L ${x1},${y1 + s1}`));
			node._lines.push(line1);
			style && style(line1, node);
			if (len > 0) {
				let lin2 = this.lineDraw.path();
				node.style.line(lin2);
				lin2.plot(this.transformPath(`M ${minx},${y1 + s1} L ${maxx},${y1 + s1}`));
				node._lines.push(lin2);
				style && style(lin2, node);
			}
		} else {
			let y1 = top + height;
			let maxy = -Infinity;
			let x2 = node.left + node.width * .3;
			node.children.forEach((item, index) => {
				let y2 = item.top + item.height / 2;
				if (y2 > maxy) maxy = y2;
				let path = "";
				let _left = item.left;
				let _isLeft = item.left + item.width < x2;
				let _isXCenter = false;
				if (_isLeft) _left = item.left + item.width;
				else if (item.left < x2 && item.left + item.width > x2) {
					_isXCenter = true;
					y2 = item.top;
					maxy = y2;
				}
				if (y2 > top && y2 < y1) path = `M ${_isLeft ? node.left : node.left + node.width},${y2} L ${_left},${y2}`;
				else if (y2 < y1) {
					if (_isXCenter) {
						y2 = item.top + item.height;
						_left = x2;
					}
					path = `M ${x2},${top} L ${x2},${y2} L ${_left},${y2}`;
				} else {
					if (_isXCenter) _left = x2;
					path = `M ${x2},${y2} L ${_left},${y2}`;
				}
				let nodeUseLineStylePath = this.mindMap.themeConfig.nodeUseLineStyle ? ` L ${_left},${y2 - item.height / 2} L ${_left},${y2 + item.height / 2}` : "";
				path += nodeUseLineStylePath;
				this.setLineStyle(style, lines[index], path, item);
			});
			if (len > 0) {
				let lin2 = this.lineDraw.path();
				expandBtnSize = len > 0 ? expandBtnSize : 0;
				node.style.line(lin2);
				if (maxy < y1 + expandBtnSize) lin2.hide();
				else {
					lin2.plot(this.transformPath(`M ${x2},${y1 + expandBtnSize} L ${x2},${maxy}`));
					lin2.show();
				}
				node._lines.push(lin2);
				style && style(lin2, node);
			}
		}
	}
	renderExpandBtn(node, btn) {
		let { width, height, expandBtnSize, isRoot } = node;
		if (!isRoot) {
			let { translateX, translateY } = btn.transform();
			btn.translate(width * .3 - expandBtnSize / 2 - translateX, height + expandBtnSize / 2 - translateY);
		}
	}
	renderGeneralization(list) {
		list.forEach((item) => {
			let { top, bottom, right, generalizationLineMargin, generalizationNodeMargin } = this.getNodeGeneralizationRenderBoundaries(item, "h");
			let x1 = right + generalizationLineMargin;
			let y1 = top;
			let x2 = right + generalizationLineMargin;
			let y2 = bottom;
			let path = `M ${x1},${y1} Q ${x1 + 20},${y1 + (y2 - y1) / 2} ${x2},${y2}`;
			item.generalizationLine.plot(this.transformPath(path));
			item.generalizationNode.left = right + generalizationNodeMargin;
			item.generalizationNode.top = top + (bottom - top - item.generalizationNode.height) / 2;
		});
	}
	renderExpandBtnRect(rect, expandBtnSize, width, height, node) {
		rect.size(width, expandBtnSize).x(0).y(height);
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/layouts/OrganizationStructure.js
var OrganizationStructure = class extends Base {
	constructor(opt = {}) {
		super(opt);
	}
	doLayout(callback) {
		asyncRun([
			() => {
				this.computedBaseValue();
			},
			() => {
				this.computedLeftValue();
			},
			() => {
				this.adjustLeftValue();
			},
			() => {
				callback(this.root);
			}
		]);
	}
	computedBaseValue() {
		walk(this.renderer.renderTree, null, (cur, parent, isRoot, layerIndex, index, ancestors) => {
			let newNode = this.createNode(cur, parent, isRoot, layerIndex, index, ancestors);
			if (isRoot) this.setNodeCenter(newNode);
			else newNode.top = parent._node.top + parent._node.height + this.getMarginX(layerIndex);
			if (!cur.data.expand) return true;
		}, (cur, parent, isRoot, layerIndex) => {
			let len = cur.data.expand === false ? 0 : cur._node.children.length;
			cur._node.childrenAreaWidth = len ? cur._node.children.reduce((h, item) => {
				return h + item.width;
			}, 0) + (len + 1) * this.getMarginY(layerIndex + 1) : 0;
			let generalizationNodeWidth = cur._node.checkHasGeneralization() ? cur._node._generalizationNodeWidth + this.getMarginY(layerIndex + 1) : 0;
			cur._node.childrenAreaWidth2 = Math.max(cur._node.childrenAreaWidth, generalizationNodeWidth);
		}, true, 0);
	}
	computedLeftValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex) => {
			if (node.getData("expand") && node.children && node.children.length) {
				let marginX = this.getMarginY(layerIndex + 1);
				let totalLeft = node.left + node.width / 2 - node.childrenAreaWidth / 2 + marginX;
				node.children.forEach((cur) => {
					cur.left = totalLeft;
					totalLeft += cur.width + marginX;
				});
			}
		}, null, true);
	}
	adjustLeftValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex) => {
			if (!node.getData("expand")) return;
			let difference = node.childrenAreaWidth2 - this.getMarginY(layerIndex + 1) * 2 - node.width;
			if (difference > 0) this.updateBrothers(node, difference / 2);
		}, null, true);
	}
	updateBrothers(node, addWidth) {
		if (node.parent) {
			let childrenList = node.parent.children;
			let index = getNodeIndexInNodeList(node, childrenList);
			childrenList.forEach((item, _index) => {
				if (item.hasCustomPosition()) return;
				let _offset = 0;
				if (_index < index) _offset = -addWidth;
				else if (_index > index) _offset = addWidth;
				item.left += _offset;
				if (item.children && item.children.length) this.updateChildren(item.children, "left", _offset);
			});
			this.updateBrothers(node.parent, addWidth);
		}
	}
	renderLine(node, lines, style, lineStyle) {
		if (lineStyle === "curve") this.renderLineCurve(node, lines, style);
		else if (lineStyle === "direct") this.renderLineDirect(node, lines, style);
		else this.renderLineStraight(node, lines, style);
	}
	renderLineCurve(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { left, top, width, height, expandBtnSize } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		const { nodeUseLineStyle, rootLineStartPositionKeepSameInCurve, rootLineKeepSameInCurve } = this.mindMap.themeConfig;
		node.children.forEach((item, index) => {
			if (node.layerIndex === 0) expandBtnSize = 0;
			let x1 = left + width / 2;
			let y1 = node.layerIndex === 0 && !rootLineStartPositionKeepSameInCurve ? top + height / 2 : top + height + expandBtnSize;
			let x2 = item.left + item.width / 2;
			let y2 = item.top;
			let path = "";
			let nodeUseLineStylePath = nodeUseLineStyle ? ` L ${item.left},${y2} L ${item.left + item.width},${y2}` : "";
			if (node.isRoot && !rootLineKeepSameInCurve) path = this.quadraticCurvePath(x1, y1, x2, y2, true) + nodeUseLineStylePath;
			else path = this.cubicBezierPath(x1, y1, x2, y2, true) + nodeUseLineStylePath;
			this.setLineStyle(style, lines[index], path, item);
		});
	}
	renderLineDirect(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { left, top, width, height } = node;
		const { nodeUseLineStyle } = this.mindMap.themeConfig;
		let x1 = left + width / 2;
		let y1 = top + height;
		node.children.forEach((item, index) => {
			let x2 = item.left + item.width / 2;
			let y2 = item.top;
			let nodeUseLineStylePath = nodeUseLineStyle ? ` L ${item.left},${y2} L ${item.left + item.width},${y2}` : "";
			let path = `M ${x1},${y1} L ${x2},${y2}` + nodeUseLineStylePath;
			this.setLineStyle(style, lines[index], path, item);
		});
	}
	renderLineStraight(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { left, top, width, height, expandBtnSize, isRoot } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		let x1 = left + width / 2;
		let y1 = top + height;
		let s1 = this.getMarginX(node.layerIndex + 1) * .7;
		let minx = Infinity;
		let maxx = -Infinity;
		let len = node.children.length;
		node.children.forEach((item, index) => {
			let x2 = item.left + item.width / 2;
			let y2 = y1 + s1 > item.top ? item.top + item.height : item.top;
			if (x2 < minx) minx = x2;
			if (x2 > maxx) maxx = x2;
			let nodeUseLineStylePath = this.mindMap.themeConfig.nodeUseLineStyle ? ` L ${item.left},${y2} L ${item.left + item.width},${y2}` : "";
			let path = `M ${x2},${y1 + s1} L ${x2},${y2}` + nodeUseLineStylePath;
			this.setLineStyle(style, lines[index], path, item);
		});
		minx = Math.min(x1, minx);
		maxx = Math.max(x1, maxx);
		let line1 = this.lineDraw.path();
		node.style.line(line1);
		expandBtnSize = len > 0 && !isRoot ? expandBtnSize : 0;
		line1.plot(this.transformPath(`M ${x1},${y1 + expandBtnSize} L ${x1},${y1 + s1}`));
		node._lines.push(line1);
		style && style(line1, node);
		if (len > 0) {
			let lin2 = this.lineDraw.path();
			node.style.line(lin2);
			lin2.plot(this.transformPath(`M ${minx},${y1 + s1} L ${maxx},${y1 + s1}`));
			node._lines.push(lin2);
			style && style(lin2, node);
		}
	}
	renderExpandBtn(node, btn) {
		let { width, height, expandBtnSize } = node;
		let { translateX, translateY } = btn.transform();
		btn.translate(width / 2 - expandBtnSize / 2 - translateX, height + expandBtnSize / 2 - translateY);
	}
	renderGeneralization(list) {
		list.forEach((item) => {
			let { bottom, left, right, generalizationLineMargin, generalizationNodeMargin } = this.getNodeGeneralizationRenderBoundaries(item, "v");
			let x1 = left;
			let y1 = bottom + generalizationLineMargin;
			let x2 = right;
			let y2 = bottom + generalizationLineMargin;
			let path = `M ${x1},${y1} Q ${x1 + (x2 - x1) / 2},${y1 + 20} ${x2},${y2}`;
			item.generalizationLine.plot(this.transformPath(path));
			item.generalizationNode.top = bottom + generalizationNodeMargin;
			item.generalizationNode.left = left + (right - left - item.generalizationNode.width) / 2;
		});
	}
	renderExpandBtnRect(rect, expandBtnSize, width, height, node) {
		rect.size(width, expandBtnSize).x(0).y(height);
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/layouts/Timeline.js
var Timeline = class extends Base {
	constructor(opt = {}, layout) {
		super(opt);
		this.layout = layout;
	}
	doLayout(callback) {
		asyncRun([
			() => {
				this.computedBaseValue();
			},
			() => {
				this.computedLeftTopValue();
			},
			() => {
				this.adjustLeftTopValue();
			},
			() => {
				callback(this.root);
			}
		]);
	}
	computedBaseValue() {
		walk(this.renderer.renderTree, null, (cur, parent, isRoot, layerIndex, index, ancestors) => {
			let newNode = this.createNode(cur, parent, isRoot, layerIndex, index, ancestors);
			if (isRoot) this.setNodeCenter(newNode);
			else {
				if (this.layout === CONSTANTS.LAYOUT.TIMELINE2) if (parent._node.dir) newNode.dir = parent._node.dir;
				else newNode.dir = index % 2 === 0 ? CONSTANTS.LAYOUT_GROW_DIR.BOTTOM : CONSTANTS.LAYOUT_GROW_DIR.TOP;
				else newNode.dir = "";
				if (parent._node.isRoot) newNode.top = parent._node.top + (cur._node.height > parent._node.height ? -(cur._node.height - parent._node.height) / 2 : (parent._node.height - cur._node.height) / 2);
			}
			if (!cur.data.expand) return true;
		}, null, true, 0);
	}
	computedLeftTopValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex, index) => {
			if (node.getData("expand") && node.children && node.children.length) {
				let marginX = this.getMarginX(layerIndex + 1);
				let marginY = this.getMarginY(layerIndex + 1);
				if (isRoot) {
					let totalLeft = node.left + node.width + marginX;
					node.children.forEach((cur) => {
						cur.left = totalLeft;
						totalLeft += cur.width + marginX;
					});
				} else {
					let totalTop = node.top + node.height + marginY + (this.getNodeActChildrenLength(node) > 0 ? node.expandBtnSize : 0);
					node.children.forEach((cur) => {
						cur.left = node.left + node.width * .5;
						cur.top = totalTop;
						totalTop += cur.height + marginY + (this.getNodeActChildrenLength(cur) > 0 ? cur.expandBtnSize : 0);
					});
				}
			}
		}, null, true);
	}
	adjustLeftTopValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex) => {
			if (!node.getData("expand")) return;
			if (node.isRoot) this.updateBrothersLeft(node);
			let len = node.children.length;
			if (parent && !parent.isRoot && len > 0) {
				let marginY = this.getMarginY(layerIndex + 1);
				let totalHeight = node.children.reduce((h, item) => {
					return h + item.height + (this.getNodeActChildrenLength(item) > 0 ? item.expandBtnSize : 0);
				}, 0) + len * marginY;
				this.updateBrothersTop(node, totalHeight);
			}
		}, (node, parent, isRoot, layerIndex) => {
			if (parent && parent.isRoot && node.dir === CONSTANTS.LAYOUT_GROW_DIR.TOP) node.children.forEach((item) => {
				let totalHeight = this.getNodeAreaHeight(item);
				let _top = item.top;
				item.top = node.top - (item.top - node.top) - totalHeight + node.height;
				this.updateChildren(item.children, "top", item.top - _top);
			});
		}, true);
	}
	getNodeAreaHeight(node) {
		let totalHeight = 0;
		let loop = (node) => {
			totalHeight += node.height + (this.getNodeActChildrenLength(node) > 0 ? node.expandBtnSize : 0) + this.getMarginY(node.layerIndex);
			if (node.children.length) node.children.forEach((item) => {
				loop(item);
			});
		};
		loop(node);
		return totalHeight;
	}
	updateBrothersLeft(node) {
		let childrenList = node.children;
		let totalAddWidth = 0;
		childrenList.forEach((item) => {
			item.left += totalAddWidth;
			if (item.children && item.children.length) this.updateChildren(item.children, "left", totalAddWidth);
			let { left, right } = this.getNodeBoundaries(item, "h");
			let difference = right - left - item.width;
			if (difference > 0) totalAddWidth += difference;
		});
	}
	updateBrothersTop(node, addHeight) {
		if (node.parent && !node.parent.isRoot) {
			let childrenList = node.parent.children;
			let index = getNodeIndexInNodeList(node, childrenList);
			childrenList.forEach((item, _index) => {
				if (item.hasCustomPosition()) return;
				let _offset = 0;
				if (_index > index) _offset = addHeight;
				item.top += _offset;
				if (item.children && item.children.length) this.updateChildren(item.children, "top", _offset);
			});
			this.updateBrothersTop(node.parent, addHeight);
		}
	}
	renderLine(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { left, top, width, height, expandBtnSize } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		let len = node.children.length;
		if (node.isRoot) {
			let prevBother = node;
			node.children.forEach((item, index) => {
				let x1 = prevBother.left + prevBother.width;
				let x2 = item.left;
				let y = node.top + node.height / 2;
				let path = `M ${x1},${y} L ${x2},${y}`;
				this.setLineStyle(style, lines[index], path, item);
				prevBother = item;
			});
		} else {
			let maxy = -Infinity;
			let miny = Infinity;
			let x = node.left + node.width * .3;
			node.children.forEach((item, index) => {
				let y = item.top + item.height / 2;
				if (y > maxy) maxy = y;
				if (y < miny) miny = y;
				let path = `M ${x},${y} L ${item.left},${y}`;
				this.setLineStyle(style, lines[index], path, item);
			});
			if (len > 0) {
				let line = this.lineDraw.path();
				expandBtnSize = len > 0 ? expandBtnSize : 0;
				if (node.parent && node.parent.isRoot && node.dir === CONSTANTS.LAYOUT_GROW_DIR.TOP) line.plot(this.transformPath(`M ${x},${top} L ${x},${miny}`));
				else line.plot(this.transformPath(`M ${x},${top + height + expandBtnSize} L ${x},${maxy}`));
				node.style.line(line);
				node._lines.push(line);
				style && style(line, node);
			}
		}
	}
	renderExpandBtn(node, btn) {
		let { width, height, expandBtnSize, isRoot } = node;
		if (!isRoot) {
			let { translateX, translateY } = btn.transform();
			if (node.parent && node.parent.isRoot && node.dir === CONSTANTS.LAYOUT_GROW_DIR.TOP) btn.translate(width * .3 - expandBtnSize / 2 - translateX, -expandBtnSize / 2 - translateY);
			else btn.translate(width * .3 - expandBtnSize / 2 - translateX, height + expandBtnSize / 2 - translateY);
		}
	}
	renderGeneralization(list) {
		list.forEach((item) => {
			let { top, bottom, right, generalizationLineMargin, generalizationNodeMargin } = this.getNodeGeneralizationRenderBoundaries(item, "h");
			let x1 = right + generalizationLineMargin;
			let y1 = top;
			let x2 = right + generalizationLineMargin;
			let y2 = bottom;
			let path = `M ${x1},${y1} Q ${x1 + 20},${y1 + (y2 - y1) / 2} ${x2},${y2}`;
			item.generalizationLine.plot(this.transformPath(path));
			item.generalizationNode.left = right + generalizationNodeMargin;
			item.generalizationNode.top = top + (bottom - top - item.generalizationNode.height) / 2;
		});
	}
	renderExpandBtnRect(rect, expandBtnSize, width, height, node) {
		if (this.layout === CONSTANTS.LAYOUT.TIMELINE) rect.size(width, expandBtnSize).x(0).y(height);
		else {
			let dir = "";
			if (node.dir === CONSTANTS.LAYOUT_GROW_DIR.TOP) dir = node.layerIndex === 1 ? CONSTANTS.LAYOUT_GROW_DIR.TOP : CONSTANTS.LAYOUT_GROW_DIR.BOTTOM;
			else dir = CONSTANTS.LAYOUT_GROW_DIR.BOTTOM;
			if (dir === CONSTANTS.LAYOUT_GROW_DIR.TOP) rect.size(width, expandBtnSize).x(0).y(-expandBtnSize);
			else rect.size(width, expandBtnSize).x(0).y(height);
		}
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/layouts/VerticalTimeline.js
var VerticalTimeline = class extends Base {
	constructor(opt = {}, layout) {
		super(opt);
		this.layout = layout;
	}
	doLayout(callback) {
		asyncRun([
			() => {
				this.computedBaseValue();
			},
			() => {
				this.computedTopValue();
			},
			() => {
				this.adjustLeftTopValue();
			},
			() => {
				callback(this.root);
			}
		]);
	}
	computedBaseValue() {
		walk(this.renderer.renderTree, null, (cur, parent, isRoot, layerIndex, index, ancestors) => {
			let newNode = this.createNode(cur, parent, isRoot, layerIndex, index, ancestors);
			if (isRoot) this.setNodeCenter(newNode);
			else {
				if (parent._node.dir) newNode.dir = parent._node.dir;
				else newNode.dir = index % 2 === 0 ? CONSTANTS.LAYOUT_GROW_DIR.RIGHT : CONSTANTS.LAYOUT_GROW_DIR.LEFT;
				if (parent._node.isRoot) newNode.left = parent._node.left + (cur._node.width > parent._node.width ? -(cur._node.width - parent._node.width) / 2 : (parent._node.width - cur._node.width) / 2);
				else newNode.left = newNode.dir === CONSTANTS.LAYOUT_GROW_DIR.RIGHT ? parent._node.left + parent._node.width + this.getMarginX(layerIndex) : parent._node.left - this.getMarginX(layerIndex) - newNode.width;
			}
			if (!cur.data.expand) return true;
		}, (cur, parent, isRoot, layerIndex) => {
			if (isRoot) return;
			let len = cur.data.expand === false ? 0 : cur._node.children.length;
			cur._node.childrenAreaHeight = len ? cur._node.children.reduce((h, item) => {
				return h + item.height;
			}, 0) + (len + 1) * this.getMarginY(layerIndex + 1) : 0;
		}, true, 0);
	}
	computedTopValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex, index) => {
			if (node.getData("expand") && node.children && node.children.length) {
				let marginY = this.getMarginY(layerIndex + 1);
				if (isRoot) {
					let totalTop = node.top + node.height + marginY;
					node.children.forEach((cur) => {
						cur.top = totalTop;
						totalTop += cur.height + marginY;
					});
				} else {
					let marginY = this.getMarginY(layerIndex + 1);
					let totalTop = node.top + node.height / 2 + marginY - node.childrenAreaHeight / 2;
					node.children.forEach((cur) => {
						cur.top = totalTop;
						totalTop += cur.height + marginY;
					});
				}
			}
		}, null, true);
	}
	adjustLeftTopValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex) => {
			if (!node.getData("expand")) return;
			if (isRoot) return;
			let base = this.getMarginY(layerIndex + 1) * 2 + node.height;
			let difference = node.childrenAreaHeight - base;
			if (difference > 0) this.updateBrothers(node, difference / 2);
		}, null, true);
	}
	updateBrothers(node, addHeight) {
		if (node.parent) {
			let childrenList = node.parent.children;
			let index = getNodeIndexInNodeList(node, childrenList);
			childrenList.forEach((item, _index) => {
				if (item.hasCustomPosition()) return;
				if (!node.parent.isRoot && item.uid === node.uid) return;
				let _offset = 0;
				if (node.parent.isRoot) if (_index < index) _offset = 0;
				else if (_index > index) _offset = addHeight * 2;
				else _offset = addHeight;
				else if (_index < index) _offset = -addHeight;
				else if (_index > index) _offset = addHeight;
				item.top += _offset;
				if (item.children && item.children.length) this.updateChildren(item.children, "top", _offset);
			});
			this.updateBrothers(node.parent, addHeight);
		}
	}
	updateBrothersTop(node, addHeight) {
		if (node.parent && !node.parent.isRoot) {
			let childrenList = node.parent.children;
			let index = getNodeIndexInNodeList(node, childrenList);
			childrenList.forEach((item, _index) => {
				if (item.hasCustomPosition()) return;
				let _offset = 0;
				if (_index > index) _offset = addHeight;
				item.top += _offset;
				if (item.children && item.children.length) this.updateChildren(item.children, "top", _offset);
			});
			this.updateBrothersTop(node.parent, addHeight);
		}
	}
	renderLine(node, lines, style, lineStyle) {
		if (lineStyle === "curve") this.renderLineCurve(node, lines, style);
		else if (lineStyle === "direct") this.renderLineDirect(node, lines, style);
		else this.renderLineStraight(node, lines, style);
	}
	renderLineStraight(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { expandBtnSize } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		if (node.isRoot) {
			let prevBother = node;
			node.children.forEach((item, index) => {
				let y1 = prevBother.top + prevBother.height;
				let y2 = item.top;
				let x = node.left + node.width / 2;
				let path = `M ${x},${y1} L ${x},${y2}`;
				this.setLineStyle(style, lines[index], path, item);
				prevBother = item;
			});
		} else if (node.dir === CONSTANTS.LAYOUT_GROW_DIR.RIGHT) {
			let nodeRight = node.left + node.width;
			let nodeYCenter = node.top + node.height / 2;
			let offset = (this.getMarginX(node.layerIndex + 1) - expandBtnSize) * .6;
			node.children.forEach((item, index) => {
				let itemLeft = item.left;
				let itemYCenter = item.top + item.height / 2;
				let path = this.createFoldLine([
					[nodeRight, nodeYCenter],
					[nodeRight + offset, nodeYCenter],
					[nodeRight + offset, itemYCenter],
					[itemLeft, itemYCenter]
				]);
				this.setLineStyle(style, lines[index], path, item);
			});
		} else {
			let nodeLeft = node.left;
			let nodeYCenter = node.top + node.height / 2;
			let offset = (this.getMarginX(node.layerIndex + 1) - expandBtnSize) * .6;
			node.children.forEach((item, index) => {
				let itemRight = item.left + item.width;
				let itemYCenter = item.top + item.height / 2;
				let path = this.createFoldLine([
					[nodeLeft, nodeYCenter],
					[nodeLeft - offset, nodeYCenter],
					[nodeLeft - offset, itemYCenter],
					[itemRight, itemYCenter]
				]);
				this.setLineStyle(style, lines[index], path, item);
			});
		}
	}
	renderLineDirect(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { left, top, width, height, expandBtnSize } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		node.children.forEach((item, index) => {
			if (node.isRoot) {
				let prevBother = node;
				node.children.forEach((item, index) => {
					let y1 = prevBother.top + prevBother.height;
					let y2 = item.top;
					let x = node.left + node.width / 2;
					let path = `M ${x},${y1} L ${x},${y2}`;
					this.setLineStyle(style, lines[index], path, item);
					prevBother = item;
				});
			} else {
				let path = `M ${item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT ? left - expandBtnSize : left + width + expandBtnSize},${top + height / 2} L ${item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT ? item.left + item.width : item.left},${item.top + item.height / 2}`;
				this.setLineStyle(style, lines[index], path, item);
			}
		});
	}
	renderLineCurve(node, lines, style) {
		if (node.children.length <= 0) return [];
		let { left, top, width, height, expandBtnSize } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		node.children.forEach((item, index) => {
			if (node.isRoot) {
				let prevBother = node;
				node.children.forEach((item, index) => {
					let y1 = prevBother.top + prevBother.height;
					let y2 = item.top;
					let x = node.left + node.width / 2;
					let path = `M ${x},${y1} L ${x},${y2}`;
					this.setLineStyle(style, lines[index], path, item);
					prevBother = item;
				});
			} else {
				let x1 = item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT ? left - expandBtnSize : left + width + expandBtnSize;
				let y1 = top + height / 2;
				let x2 = item.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT ? item.left + item.width : item.left;
				let y2 = item.top + item.height / 2;
				let path = this.cubicBezierPath(x1, y1, x2, y2);
				this.setLineStyle(style, lines[index], path, item);
			}
		});
	}
	renderExpandBtn(node, btn) {
		let { width, height, expandBtnSize, isRoot } = node;
		if (!isRoot) {
			let { translateX, translateY } = btn.transform();
			if (node.dir === CONSTANTS.LAYOUT_GROW_DIR.RIGHT) btn.translate(width - translateX, height / 2 - translateY);
			else btn.translate(-expandBtnSize - translateX, height / 2 - translateY);
		}
	}
	renderGeneralization(list) {
		list.forEach((item) => {
			let isLeft = item.node.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT;
			let { top, bottom, left, right, generalizationLineMargin, generalizationNodeMargin } = this.getNodeGeneralizationRenderBoundaries(item, "h");
			let x = isLeft ? left - generalizationLineMargin : right + generalizationLineMargin;
			let x1 = x;
			let y1 = top;
			let x2 = x;
			let y2 = bottom;
			let path = `M ${x1},${y1} Q ${x1 + (isLeft ? -20 : 20)},${y1 + (y2 - y1) / 2} ${x2},${y2}`;
			item.generalizationLine.plot(this.transformPath(path));
			item.generalizationNode.left = x + (isLeft ? -generalizationNodeMargin : generalizationNodeMargin) - (isLeft ? item.generalizationNode.width : 0);
			item.generalizationNode.top = top + (bottom - top - item.generalizationNode.height) / 2;
		});
	}
	renderExpandBtnRect(rect, expandBtnSize, width, height, node) {
		if (node.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT) rect.size(expandBtnSize, height).x(-expandBtnSize).y(0);
		else rect.size(expandBtnSize, height).x(width).y(0);
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/layouts/fishboneUtils.js
var fishboneUtils_default = {
	top: {
		renderExpandBtn({ node, btn, expandBtnSize, translateX, translateY, width, height }) {
			if (node.parent && node.parent.isRoot) btn.translate(width * .3 - expandBtnSize / 2 - translateX, -expandBtnSize / 2 - translateY);
			else btn.translate(width * .3 - expandBtnSize / 2 - translateX, height + expandBtnSize / 2 - translateY);
		},
		renderLine({ node, line, top, x, lineLength, height, expandBtnSize, maxy, ctx }) {
			if (node.parent && node.parent.isRoot) line.plot(ctx.transformPath(`M ${x},${top} L ${x + lineLength},${top - Math.tan(degToRad(ctx.mindMap.opt.fishboneDeg)) * lineLength}`));
			else line.plot(ctx.transformPath(`M ${x},${top + height + expandBtnSize} L ${x},${maxy}`));
		},
		computedLeftTopValue({ layerIndex, node, ctx }) {
			if (layerIndex >= 1 && node.children) {
				let marginY = ctx.getMarginY(layerIndex + 1);
				let startLeft = node.left + node.width * ctx.childIndent;
				let totalTop = node.top + node.height + (ctx.getNodeActChildrenLength(node) > 0 ? node.expandBtnSize : 0) + marginY;
				node.children.forEach((item) => {
					item.left = startLeft;
					item.top += totalTop;
					totalTop += item.height + (ctx.getNodeActChildrenLength(item) > 0 ? item.expandBtnSize : 0) + marginY;
				});
			}
		},
		adjustLeftTopValueBefore({ node, parent, ctx, layerIndex }) {
			let len = node.children.length;
			let marginY = ctx.getMarginY(layerIndex + 1);
			if (parent && !parent.isRoot && len > 0) {
				let totalHeight = node.children.reduce((h, item) => {
					return h + item.height + (ctx.getNodeActChildrenLength(item) > 0 ? item.expandBtnSize : 0) + marginY;
				}, 0);
				ctx.updateBrothersTop(node, totalHeight);
			}
		},
		adjustLeftTopValueAfter({ parent, node, ctx }) {
			if (parent && parent.isRoot) {
				let marginY = ctx.getMarginY(node.layerIndex + 1);
				let totalHeight = node.expandBtnSize + marginY;
				node.children.forEach((item) => {
					let nodeTotalHeight = ctx.getNodeAreaHeight(item);
					let _top = item.top;
					let _left = item.left;
					item.top = node.top - (item.top - node.top) - nodeTotalHeight + node.height;
					item.left = node.left + node.width * ctx.indent + (nodeTotalHeight + totalHeight) / Math.tan(degToRad(ctx.mindMap.opt.fishboneDeg));
					totalHeight += nodeTotalHeight;
					ctx.updateChildrenPro(item.children, {
						top: item.top - _top,
						left: item.left - _left
					});
				});
			}
		}
	},
	bottom: {
		renderExpandBtn({ node, btn, expandBtnSize, translateX, translateY, width, height }) {
			if (node.parent && node.parent.isRoot) btn.translate(width * .3 - expandBtnSize / 2 - translateX, height + expandBtnSize / 2 - translateY);
			else btn.translate(width * .3 - expandBtnSize / 2 - translateX, -expandBtnSize / 2 - translateY);
		},
		renderLine({ node, line, top, x, lineLength, height, miny, ctx }) {
			if (node.parent && node.parent.isRoot) line.plot(ctx.transformPath(`M ${x},${top + height} L ${x + lineLength},${top + height + Math.tan(degToRad(ctx.mindMap.opt.fishboneDeg)) * lineLength}`));
			else line.plot(ctx.transformPath(`M ${x},${top} L ${x},${miny}`));
		},
		computedLeftTopValue({ layerIndex, node, ctx }) {
			let marginY = ctx.getMarginY(layerIndex + 1);
			if (layerIndex === 1 && node.children) {
				let startLeft = node.left + node.width * ctx.childIndent;
				let totalTop = node.top + node.height + (ctx.getNodeActChildrenLength(node) > 0 ? node.expandBtnSize : 0) + marginY;
				node.children.forEach((item) => {
					item.left = startLeft;
					item.top = totalTop + (ctx.getNodeActChildrenLength(item) > 0 ? item.expandBtnSize : 0);
					totalTop += item.height + (ctx.getNodeActChildrenLength(item) > 0 ? item.expandBtnSize : 0) + marginY;
				});
			}
			if (layerIndex > 1 && node.children) {
				let startLeft = node.left + node.width * ctx.childIndent;
				let totalTop = node.top - (ctx.getNodeActChildrenLength(node) > 0 ? node.expandBtnSize : 0) - marginY;
				node.children.forEach((item) => {
					item.left = startLeft;
					item.top = totalTop - item.height;
					totalTop -= item.height + (ctx.getNodeActChildrenLength(item) > 0 ? item.expandBtnSize : 0) + marginY;
				});
			}
		},
		adjustLeftTopValueBefore({ node, ctx, layerIndex }) {
			let marginY = ctx.getMarginY(layerIndex + 1);
			let len = node.children.length;
			if (layerIndex > 2 && len > 0) {
				let totalHeight = node.children.reduce((h, item) => {
					return h + item.height + (ctx.getNodeActChildrenLength(item) > 0 ? item.expandBtnSize : 0) + marginY;
				}, 0);
				ctx.updateBrothersTop(node, -totalHeight);
			}
		},
		adjustLeftTopValueAfter({ parent, node, ctx }) {
			if (parent && parent.isRoot) {
				let marginY = ctx.getMarginY(node.layerIndex + 1);
				let totalHeight = 0;
				let totalHeight2 = node.expandBtnSize;
				node.children.forEach((item) => {
					let hasChildren = ctx.getNodeActChildrenLength(item) > 0;
					let nodeTotalHeight = ctx.getNodeAreaHeight(item);
					let offset = hasChildren ? nodeTotalHeight - item.height - (hasChildren ? item.expandBtnSize : 0) : 0;
					offset -= hasChildren ? marginY : 0;
					let _top = totalHeight + offset;
					let _left = item.left;
					item.top += _top;
					item.left = node.left + node.width * ctx.indent + (nodeTotalHeight + totalHeight2) / Math.tan(degToRad(ctx.mindMap.opt.fishboneDeg));
					totalHeight += offset;
					totalHeight2 += nodeTotalHeight;
					ctx.updateChildrenPro(item.children, {
						top: _top,
						left: item.left - _left
					});
				});
			}
		}
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/layouts/Fishbone.js
var Fishbone = class extends Base {
	constructor(opt = {}) {
		super(opt);
		this.indent = .3;
		this.childIndent = .5;
	}
	doLayout(callback) {
		asyncRun([
			() => {
				this.computedBaseValue();
			},
			() => {
				this.computedLeftTopValue();
			},
			() => {
				this.adjustLeftTopValue();
			},
			() => {
				callback(this.root);
			}
		]);
	}
	computedBaseValue() {
		walk(this.renderer.renderTree, null, (node, parent, isRoot, layerIndex, index, ancestors) => {
			let newNode = this.createNode(node, parent, isRoot, layerIndex, index, ancestors);
			if (isRoot) this.setNodeCenter(newNode);
			else {
				if (parent._node.dir) newNode.dir = parent._node.dir;
				else newNode.dir = index % 2 === 0 ? CONSTANTS.LAYOUT_GROW_DIR.TOP : CONSTANTS.LAYOUT_GROW_DIR.BOTTOM;
				if (parent._node.isRoot) {
					let marginY = this.getMarginY(layerIndex);
					if (this.checkIsTop(newNode)) newNode.top = parent._node.top - newNode.height - marginY;
					else newNode.top = parent._node.top + parent._node.height + marginY;
				}
			}
			if (!node.data.expand) return true;
		}, null, true, 0);
	}
	computedLeftTopValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex) => {
			if (node.isRoot) {
				let marginX = this.getMarginX(layerIndex + 1);
				let topTotalLeft = node.left + node.width + node.height + marginX;
				let bottomTotalLeft = node.left + node.width + node.height + marginX;
				node.children.forEach((item) => {
					if (this.checkIsTop(item)) {
						item.left = topTotalLeft;
						topTotalLeft += item.width + marginX;
					} else {
						item.left = bottomTotalLeft + 20;
						bottomTotalLeft += item.width + marginX;
					}
				});
			}
			let params = {
				layerIndex,
				node,
				ctx: this
			};
			if (this.checkIsTop(node)) fishboneUtils_default.top.computedLeftTopValue(params);
			else fishboneUtils_default.bottom.computedLeftTopValue(params);
		}, null, true);
	}
	adjustLeftTopValue() {
		walk(this.root, null, (node, parent, isRoot, layerIndex) => {
			if (!node.getData("expand")) return;
			let params = {
				node,
				parent,
				layerIndex,
				ctx: this
			};
			if (this.checkIsTop(node)) fishboneUtils_default.top.adjustLeftTopValueBefore(params);
			else fishboneUtils_default.bottom.adjustLeftTopValueBefore(params);
		}, (node, parent) => {
			let params = {
				parent,
				node,
				ctx: this
			};
			if (this.checkIsTop(node)) fishboneUtils_default.top.adjustLeftTopValueAfter(params);
			else fishboneUtils_default.bottom.adjustLeftTopValueAfter(params);
			if (node.isRoot) {
				let topTotalLeft = 0;
				let bottomTotalLeft = 0;
				node.children.forEach((item) => {
					if (this.checkIsTop(item)) {
						item.left += topTotalLeft;
						this.updateChildren(item.children, "left", topTotalLeft);
						let { left, right } = this.getNodeBoundaries(item, "h");
						topTotalLeft += right - left;
					} else {
						item.left += bottomTotalLeft;
						this.updateChildren(item.children, "left", bottomTotalLeft);
						let { left, right } = this.getNodeBoundaries(item, "h");
						bottomTotalLeft += right - left;
					}
				});
			}
		}, true);
	}
	getNodeAreaHeight(node) {
		let totalHeight = 0;
		let loop = (node) => {
			let marginY = this.getMarginY(node.layerIndex);
			totalHeight += node.height + (this.getNodeActChildrenLength(node) > 0 ? node.expandBtnSize : 0) + marginY;
			if (node.children.length) node.children.forEach((item) => {
				loop(item);
			});
		};
		loop(node);
		return totalHeight;
	}
	updateBrothersLeft(node) {
		let childrenList = node.children;
		let totalAddWidth = 0;
		childrenList.forEach((item) => {
			item.left += totalAddWidth;
			if (item.children && item.children.length) this.updateChildren(item.children, "left", totalAddWidth);
			let { left, right } = this.getNodeBoundaries(item, "h");
			let difference = right - left - item.width;
			if (difference > 0) totalAddWidth += difference;
		});
	}
	updateBrothersTop(node, addHeight) {
		if (node.parent && !node.parent.isRoot) {
			let childrenList = node.parent.children;
			let index = getNodeIndexInNodeList(node, childrenList);
			childrenList.forEach((item, _index) => {
				if (item.hasCustomPosition()) return;
				let _offset = 0;
				if (_index > index) _offset = addHeight;
				item.top += _offset;
				if (item.children && item.children.length) this.updateChildren(item.children, "top", _offset);
			});
			if (this.checkIsTop(node)) this.updateBrothersTop(node.parent, addHeight);
			else this.updateBrothersTop(node.parent, node.layerIndex === 3 ? 0 : addHeight);
		}
	}
	checkIsTop(node) {
		return node.dir === CONSTANTS.LAYOUT_GROW_DIR.TOP;
	}
	renderLine(node, lines, style) {
		if (node.layerIndex !== 1 && node.children.length <= 0) return [];
		let { top, height, expandBtnSize } = node;
		const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
		if (!alwaysShowExpandBtn || notShowExpandBtn) expandBtnSize = 0;
		let len = node.children.length;
		if (node.isRoot) {
			let maxx = -Infinity;
			node.children.forEach((item) => {
				if (item.left > maxx) maxx = item.left;
				let marginY = this.getMarginY(item.layerIndex);
				let nodeLineX = item.left;
				let offset = node.height / 2 + marginY;
				let offsetX = offset / Math.tan(degToRad(this.mindMap.opt.fishboneDeg));
				let line = this.lineDraw.path();
				if (this.checkIsTop(item)) line.plot(this.transformPath(`M ${nodeLineX - offsetX},${item.top + item.height + offset} L ${item.left},${item.top + item.height}`));
				else line.plot(this.transformPath(`M ${nodeLineX - offsetX},${item.top - offset} L ${nodeLineX},${item.top}`));
				node.style.line(line);
				node._lines.push(line);
				style && style(line, node);
			});
			let nodeHalfTop = node.top + node.height / 2;
			let offset = node.height / 2 + this.getMarginY(node.layerIndex + 1);
			let line = this.lineDraw.path();
			line.plot(this.transformPath(`M ${node.left + node.width},${nodeHalfTop} L ${maxx - offset / Math.tan(degToRad(this.mindMap.opt.fishboneDeg))},${nodeHalfTop}`));
			node.style.line(line);
			node._lines.push(line);
			style && style(line, node);
		} else {
			let maxy = -Infinity;
			let miny = Infinity;
			let maxx = -Infinity;
			let x = node.left + node.width * this.indent;
			node.children.forEach((item, index) => {
				if (item.left > maxx) maxx = item.left;
				let y = item.top + item.height / 2;
				if (y > maxy) maxy = y;
				if (y < miny) miny = y;
				if (node.layerIndex > 1) {
					let path = `M ${x},${y} L ${item.left},${y}`;
					this.setLineStyle(style, lines[index], path, item);
				}
			});
			if (len >= 0) {
				let line = this.lineDraw.path();
				expandBtnSize = len > 0 ? expandBtnSize : 0;
				let lineLength = maxx - node.left - node.width * this.indent;
				lineLength = Math.max(lineLength, 0);
				let params = {
					node,
					line,
					top,
					x,
					lineLength,
					height,
					expandBtnSize,
					maxy,
					miny,
					ctx: this
				};
				if (this.checkIsTop(node)) fishboneUtils_default.top.renderLine(params);
				else fishboneUtils_default.bottom.renderLine(params);
				node.style.line(line);
				node._lines.push(line);
				style && style(line, node);
			}
		}
	}
	renderExpandBtn(node, btn) {
		let { width, height, expandBtnSize, isRoot } = node;
		if (!isRoot) {
			let { translateX, translateY } = btn.transform();
			let params = {
				node,
				btn,
				expandBtnSize,
				translateX,
				translateY,
				width,
				height
			};
			if (this.checkIsTop(node)) fishboneUtils_default.top.renderExpandBtn(params);
			else fishboneUtils_default.bottom.renderExpandBtn(params);
		}
	}
	renderGeneralization(list) {
		list.forEach((item) => {
			let { top, bottom, right, generalizationLineMargin, generalizationNodeMargin } = this.getNodeGeneralizationRenderBoundaries(item, "h");
			let x1 = right + generalizationLineMargin;
			let y1 = top;
			let x2 = right + generalizationLineMargin;
			let y2 = bottom;
			let path = `M ${x1},${y1} Q ${x1 + 20},${y1 + (y2 - y1) / 2} ${x2},${y2}`;
			item.generalizationLine.plot(this.transformPath(path));
			item.generalizationNode.left = right + generalizationNodeMargin;
			item.generalizationNode.top = top + (bottom - top - item.generalizationNode.height) / 2;
		});
	}
	renderExpandBtnRect(rect, expandBtnSize, width, height, node) {
		let dir = "";
		if (node.dir === CONSTANTS.LAYOUT_GROW_DIR.TOP) dir = node.layerIndex === 1 ? CONSTANTS.LAYOUT_GROW_DIR.TOP : CONSTANTS.LAYOUT_GROW_DIR.BOTTOM;
		else dir = node.layerIndex === 1 ? CONSTANTS.LAYOUT_GROW_DIR.BOTTOM : CONSTANTS.LAYOUT_GROW_DIR.TOP;
		if (dir === CONSTANTS.LAYOUT_GROW_DIR.TOP) rect.size(width, expandBtnSize).x(0).y(-expandBtnSize);
		else rect.size(width, expandBtnSize).x(0).y(height);
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/core/render/TextEdit.js
var TextEdit = class {
	constructor(renderer) {
		this.renderer = renderer;
		this.mindMap = renderer.mindMap;
		this.currentNode = null;
		this.textEditNode = null;
		this.showTextEdit = false;
		this.cacheEditingText = "";
		this.hasBodyMousedown = false;
		this.textNodePaddingX = 5;
		this.textNodePaddingY = 3;
		this.isNeedUpdateTextEditNode = false;
		this.bindEvent();
	}
	bindEvent() {
		this.show = this.show.bind(this);
		this.onScale = this.onScale.bind(this);
		this.onKeydown = this.onKeydown.bind(this);
		this.mindMap.on("node_dblclick", (node, e, isInserting) => {
			this.show({
				node,
				e,
				isInserting
			});
		});
		this.mindMap.on("draw_click", () => {
			this.hideEditTextBox();
		});
		this.mindMap.on("body_mousedown", () => {
			this.hasBodyMousedown = true;
		});
		this.mindMap.on("body_click", () => {
			if (!this.hasBodyMousedown) return;
			this.hasBodyMousedown = false;
			if (this.mindMap.opt.isEndNodeTextEditOnClickOuter) this.hideEditTextBox();
		});
		this.mindMap.on("svg_mousedown", () => {
			this.hideEditTextBox();
		});
		this.mindMap.on("expand_btn_click", () => {
			this.hideEditTextBox();
		});
		this.mindMap.on("before_node_active", () => {
			this.hideEditTextBox();
		});
		this.mindMap.on("mousewheel", () => {
			if (this.mindMap.opt.mousewheelAction === CONSTANTS.MOUSE_WHEEL_ACTION.MOVE) this.hideEditTextBox();
		});
		this.mindMap.keyCommand.addShortcut("F2", () => {
			if (this.renderer.activeNodeList.length <= 0) return;
			this.show({ node: this.renderer.activeNodeList[0] });
		});
		this.mindMap.on("scale", this.onScale);
		if (this.mindMap.opt.enableAutoEnterTextEditWhenKeydown) window.addEventListener("keydown", this.onKeydown);
		this.mindMap.on("beforeDestroy", () => {
			this.unBindEvent();
		});
		this.mindMap.on("after_update_config", (opt, lastOpt) => {
			if (opt.openRealtimeRenderOnNodeTextEdit !== lastOpt.openRealtimeRenderOnNodeTextEdit) if (this.mindMap.richText) this.mindMap.richText.onOpenRealtimeRenderOnNodeTextEditConfigUpdate(opt.openRealtimeRenderOnNodeTextEdit);
			else this.onOpenRealtimeRenderOnNodeTextEditConfigUpdate(opt.openRealtimeRenderOnNodeTextEdit);
			if (opt.enableAutoEnterTextEditWhenKeydown !== lastOpt.enableAutoEnterTextEditWhenKeydown) window[opt.enableAutoEnterTextEditWhenKeydown ? "addEventListener" : "removeEventListener"]("keydown", this.onKeydown);
		});
		this.mindMap.on("afterExecCommand", () => {
			if (!this.isShowTextEdit()) return;
			this.isNeedUpdateTextEditNode = true;
		});
		this.mindMap.on("node_tree_render_end", () => {
			if (!this.isShowTextEdit()) return;
			if (this.isNeedUpdateTextEditNode) {
				this.isNeedUpdateTextEditNode = false;
				this.updateTextEditNode();
			}
		});
	}
	unBindEvent() {
		window.removeEventListener("keydown", this.onKeydown);
	}
	onKeydown(e) {
		if (e.target !== document.body) return;
		const activeNodeList = this.mindMap.renderer.activeNodeList;
		if (activeNodeList.length <= 0 || activeNodeList.length > 1) return;
		const node = activeNodeList[0];
		if (node && this.checkIsAutoEnterTextEditKey(e)) {
			e.preventDefault();
			this.show({
				node,
				e,
				isInserting: false,
				isFromKeyDown: true
			});
		}
	}
	checkIsAutoEnterTextEditKey(e) {
		const keyCode = e.keyCode;
		return (keyCode === 229 || keyCode >= 65 && keyCode <= 90 || keyCode >= 48 && keyCode <= 57) && !this.mindMap.keyCommand.hasCombinationKey(e);
	}
	registerTmpShortcut() {
		this.mindMap.keyCommand.addShortcut("Enter", () => {
			this.hideEditTextBox();
		});
		this.mindMap.keyCommand.addShortcut("Tab", () => {
			this.hideEditTextBox();
		});
	}
	isShowTextEdit() {
		if (this.mindMap.richText) return this.mindMap.richText.showTextEdit;
		return this.showTextEdit;
	}
	async show({ node, isInserting = false, isFromKeyDown = false, isFromScale = false }) {
		if (node.isUseCustomNodeContent()) return;
		if (this.getCurrentEditNode()) this.hideEditTextBox();
		const { beforeTextEdit, openRealtimeRenderOnNodeTextEdit } = this.mindMap.opt;
		if (typeof beforeTextEdit === "function") {
			let isShow = false;
			try {
				isShow = await beforeTextEdit(node, isInserting);
			} catch (error) {
				isShow = false;
				this.mindMap.opt.errorHandler(ERROR_TYPES.BEFORE_TEXT_EDIT_ERROR, error);
			}
			if (!isShow) return;
		}
		const { offsetLeft, offsetTop } = checkNodeOuter(this.mindMap, node);
		this.mindMap.view.translateXY(offsetLeft, offsetTop);
		const g = node._textData.node;
		if (openRealtimeRenderOnNodeTextEdit) g.show();
		const rect = g.node.getBoundingClientRect();
		if (openRealtimeRenderOnNodeTextEdit) g.hide();
		const params = {
			node,
			rect,
			isInserting,
			isFromKeyDown,
			isFromScale
		};
		if (this.mindMap.richText) {
			this.mindMap.richText.showEditText(params);
			return;
		}
		this.currentNode = node;
		this.showEditTextBox(params);
	}
	onOpenRealtimeRenderOnNodeTextEditConfigUpdate(openRealtimeRenderOnNodeTextEdit) {
		if (!this.textEditNode) return;
		this.textEditNode.style.background = openRealtimeRenderOnNodeTextEdit ? "transparent" : this.currentNode ? this.getBackground(this.currentNode) : "";
		this.textEditNode.style.boxShadow = openRealtimeRenderOnNodeTextEdit ? "none" : "0 0 20px rgba(0,0,0,.5)";
	}
	onScale() {
		const node = this.getCurrentEditNode();
		if (!node) return;
		if (this.mindMap.richText) {
			this.mindMap.richText.cacheEditingText = this.mindMap.richText.getEditText();
			this.mindMap.richText.showTextEdit = false;
		} else {
			this.cacheEditingText = this.getEditText();
			this.showTextEdit = false;
		}
		this.show({
			node,
			isFromScale: true
		});
	}
	showEditTextBox({ node, rect, isInserting, isFromKeyDown, isFromScale }) {
		if (this.showTextEdit) return;
		const { nodeTextEditZIndex, textAutoWrapWidth, selectTextOnEnterEditText, openRealtimeRenderOnNodeTextEdit, autoEmptyTextWhenKeydownEnterEdit } = this.mindMap.opt;
		if (!isFromScale) this.mindMap.emit("before_show_text_edit");
		this.registerTmpShortcut();
		if (!this.textEditNode) {
			this.textEditNode = document.createElement("div");
			this.textEditNode.classList.add(CONSTANTS.EDIT_NODE_CLASS.SMM_NODE_EDIT_WRAP);
			this.textEditNode.style.cssText = `
        position: fixed;
        box-sizing: border-box;
        ${openRealtimeRenderOnNodeTextEdit ? "" : `box-shadow: 0 0 20px rgba(0,0,0,.5);`}
        padding: ${this.textNodePaddingY}px ${this.textNodePaddingX}px;
        margin-left: -${this.textNodePaddingX}px;
        margin-top: -${this.textNodePaddingY}px;
        outline: none; 
        word-break: break-all;
        line-break: anywhere;
      `;
			this.textEditNode.setAttribute("contenteditable", true);
			this.textEditNode.addEventListener("keyup", (e) => {
				e.stopPropagation();
			});
			this.textEditNode.addEventListener("click", (e) => {
				e.stopPropagation();
			});
			this.textEditNode.addEventListener("mousedown", (e) => {
				e.stopPropagation();
			});
			this.textEditNode.addEventListener("keydown", (e) => {
				if (this.checkIsAutoEnterTextEditKey(e)) e.stopPropagation();
			});
			this.textEditNode.addEventListener("paste", (e) => {
				const { isSmm, data } = checkSmmFormatData(e.clipboardData.getData("text"));
				if (isSmm && data[0] && data[0].data) handleInputPasteText(e, getTextFromHtml(data[0].data.text));
				else handleInputPasteText(e);
				this.emitTextChangeEvent();
			});
			this.textEditNode.addEventListener("input", () => {
				this.emitTextChangeEvent();
			});
			(this.mindMap.opt.customInnerElsAppendTo || document.body).appendChild(this.textEditNode);
		}
		const scale = this.mindMap.view.scale;
		const fontSize = node.style.merge("fontSize");
		const textLines = (this.cacheEditingText || node.getData("text")).split(/\n/gim).map((item) => {
			return htmlEscape(item);
		});
		const isMultiLine = node._textData.node.attr("data-ismultiLine") === "true";
		node.style.domText(this.textEditNode, scale);
		if (!openRealtimeRenderOnNodeTextEdit) this.textEditNode.style.background = this.getBackground(node);
		this.textEditNode.style.zIndex = nodeTextEditZIndex;
		if (isFromKeyDown && autoEmptyTextWhenKeydownEnterEdit) this.textEditNode.innerHTML = "";
		else this.textEditNode.innerHTML = textLines.join("<br>");
		this.textEditNode.style.minWidth = rect.width + this.textNodePaddingX * 2 + "px";
		this.textEditNode.style.minHeight = rect.height + "px";
		this.textEditNode.style.left = Math.floor(rect.left) + "px";
		this.textEditNode.style.top = Math.floor(rect.top) + "px";
		this.textEditNode.style.display = "block";
		this.textEditNode.style.maxWidth = textAutoWrapWidth * scale + "px";
		if (isMultiLine) {
			this.textEditNode.style.lineHeight = noneRichTextNodeLineHeight;
			this.textEditNode.style.transform = `translateY(${(noneRichTextNodeLineHeight - 1) * fontSize / 2 * scale}px)`;
		} else this.textEditNode.style.lineHeight = "normal";
		this.showTextEdit = true;
		if (isInserting || selectTextOnEnterEditText && !isFromKeyDown) selectAllInput(this.textEditNode);
		else focusInput(this.textEditNode);
		this.cacheEditingText = "";
	}
	emitTextChangeEvent() {
		this.mindMap.emit("node_text_edit_change", {
			node: this.currentNode,
			text: this.getEditText(),
			richText: false
		});
	}
	updateTextEditNode() {
		if (this.mindMap.richText) {
			this.mindMap.richText.updateTextEditNode();
			return;
		}
		if (!this.showTextEdit || !this.currentNode) return;
		const rect = this.currentNode._textData.node.node.getBoundingClientRect();
		this.textEditNode.style.minWidth = rect.width + this.textNodePaddingX * 2 + "px";
		this.textEditNode.style.minHeight = rect.height + this.textNodePaddingY * 2 + "px";
		this.textEditNode.style.left = Math.floor(rect.left) + "px";
		this.textEditNode.style.top = Math.floor(rect.top) + "px";
	}
	getBackground(node) {
		if (node.style.merge("gradientStyle")) return `linear-gradient(to right, ${node.style.merge("startColor")}, ${node.style.merge("endColor")})`;
		else {
			const bgColor = node.style.merge("fillColor");
			const color = node.style.merge("color");
			return bgColor === "transparent" ? isWhite(color) ? getVisibleColorFromTheme(this.mindMap.themeConfig) : "#fff" : bgColor;
		}
	}
	removeTextEditEl() {
		if (this.mindMap.richText) {
			this.mindMap.richText.removeTextEditEl();
			return;
		}
		if (!this.textEditNode) return;
		(this.mindMap.opt.customInnerElsAppendTo || document.body).removeChild(this.textEditNode);
	}
	getEditText() {
		return getStrWithBrFromHtml(this.textEditNode.innerHTML);
	}
	hideEditTextBox() {
		if (this.mindMap.richText) return this.mindMap.richText.hideEditText();
		if (!this.showTextEdit) return;
		const currentNode = this.currentNode;
		const text = this.getEditText();
		this.currentNode = null;
		this.textEditNode.style.display = "none";
		this.textEditNode.innerHTML = "";
		this.textEditNode.style.fontFamily = "inherit";
		this.textEditNode.style.fontSize = "inherit";
		this.textEditNode.style.fontWeight = "normal";
		this.textEditNode.style.transform = "translateY(0)";
		this.showTextEdit = false;
		this.mindMap.execCommand("SET_NODE_TEXT", currentNode, text);
		this.mindMap.render();
		this.mindMap.emit("hide_text_edit", this.textEditNode, this.renderer.activeNodeList, currentNode);
	}
	getCurrentEditNode() {
		if (this.mindMap.richText) return this.mindMap.richText.node;
		return this.currentNode;
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/core/render/Render.js
var layouts = {
	[CONSTANTS.LAYOUT.LOGICAL_STRUCTURE]: LogicalStructure,
	[CONSTANTS.LAYOUT.LOGICAL_STRUCTURE_LEFT]: LogicalStructure,
	[CONSTANTS.LAYOUT.MIND_MAP]: MindMap$1,
	[CONSTANTS.LAYOUT.CATALOG_ORGANIZATION]: CatalogOrganization,
	[CONSTANTS.LAYOUT.ORGANIZATION_STRUCTURE]: OrganizationStructure,
	[CONSTANTS.LAYOUT.TIMELINE]: Timeline,
	[CONSTANTS.LAYOUT.TIMELINE2]: Timeline,
	[CONSTANTS.LAYOUT.VERTICAL_TIMELINE]: VerticalTimeline,
	[CONSTANTS.LAYOUT.FISHBONE]: Fishbone
};
var Render = class {
	constructor(opt = {}) {
		this.opt = opt;
		this.mindMap = opt.mindMap;
		this.themeConfig = this.mindMap.themeConfig;
		this.renderTree = this.mindMap.opt.data ? (0, import_cjs.default)({}, this.mindMap.opt.data) : null;
		this.reRender = false;
		this.isRendering = false;
		this.hasWaitRendering = false;
		this.waitRenderingParams = [];
		this.nodeCache = {};
		this.lastNodeCache = {};
		this.renderSource = "";
		this.activeNodeList = [];
		this.root = null;
		this.textEdit = new TextEdit(this);
		this.beingCopyData = null;
		this.highlightBoxNode = null;
		this.highlightBoxNodeStyle = null;
		this.lastActiveNodeList = [];
		this.setLayout();
		this.bindEvent();
		this.registerCommands();
		this.registerShortcutKeys();
	}
	setLayout() {
		const { layout } = this.mindMap.opt;
		this.layout = new (layouts[layout] ? layouts[layout] : layouts[CONSTANTS.LAYOUT.LOGICAL_STRUCTURE])(this, layout);
	}
	setData(data) {
		this.renderTree = data || null;
	}
	bindEvent() {
		const { openPerformance, performanceConfig, openRealtimeRenderOnNodeTextEdit } = this.mindMap.opt;
		this.mindMap.on("draw_click", (e) => {
			this.clearActiveNodeListOnDrawClick(e, "click");
		});
		this.mindMap.on("contextmenu", (e) => {
			this.clearActiveNodeListOnDrawClick(e, "contextmenu");
		});
		this.mindMap.svg.on("dblclick", () => {
			if (!this.mindMap.opt.enableDblclickBackToRootNode) return;
			this.setRootNodeCenter();
		});
		const onViewDataChange = throttle(() => {
			if (this.root) {
				this.mindMap.emit("node_tree_render_start");
				this.root.render(() => {
					this.mindMap.emit("node_tree_render_end");
				}, false, true);
			}
		}, performanceConfig.time);
		if (openPerformance) this.mindMap.on("view_data_change", onViewDataChange);
		this.onNodeTextEditChange = debounce(this.onNodeTextEditChange, 100, this);
		if (openRealtimeRenderOnNodeTextEdit) this.mindMap.on("node_text_edit_change", this.onNodeTextEditChange);
		this.mindMap.on("after_update_config", (opt, lastOpt) => {
			if (opt.openPerformance !== lastOpt.openPerformance) {
				this.mindMap[opt.openPerformance ? "on" : "off"]("view_data_change", onViewDataChange);
				this.forceLoadNode();
			}
			if (opt.openRealtimeRenderOnNodeTextEdit !== lastOpt.openRealtimeRenderOnNodeTextEdit) this.mindMap[opt.openRealtimeRenderOnNodeTextEdit ? "on" : "off"]("node_text_edit_change", this.onNodeTextEditChange);
		});
	}
	onNodeTextEditChange({ node, text }) {
		node._textData = node.createTextNode(text);
		const { width, height } = node.getNodeRect();
		node.width = width;
		node.height = height;
		node.layout();
		this.mindMap.render(() => {
			this.textEdit.updateTextEditNode();
		});
	}
	forceLoadNode(node) {
		node = node || this.root;
		if (node) {
			this.mindMap.emit("node_tree_render_start");
			node.render(() => {
				this.mindMap.emit("node_tree_render_end");
			}, true);
		}
	}
	registerCommands() {
		this.selectAll = this.selectAll.bind(this);
		this.mindMap.command.add("SELECT_ALL", this.selectAll);
		this.back = this.back.bind(this);
		this.mindMap.command.add("BACK", this.back);
		this.forward = this.forward.bind(this);
		this.mindMap.command.add("FORWARD", this.forward);
		this.insertNode = this.insertNode.bind(this);
		this.mindMap.command.add("INSERT_NODE", this.insertNode);
		this.insertMultiNode = this.insertMultiNode.bind(this);
		this.mindMap.command.add("INSERT_MULTI_NODE", this.insertMultiNode);
		this.insertChildNode = this.insertChildNode.bind(this);
		this.mindMap.command.add("INSERT_CHILD_NODE", this.insertChildNode);
		this.insertMultiChildNode = this.insertMultiChildNode.bind(this);
		this.mindMap.command.add("INSERT_MULTI_CHILD_NODE", this.insertMultiChildNode);
		this.insertParentNode = this.insertParentNode.bind(this);
		this.mindMap.command.add("INSERT_PARENT_NODE", this.insertParentNode);
		this.upNode = this.upNode.bind(this);
		this.mindMap.command.add("UP_NODE", this.upNode);
		this.downNode = this.downNode.bind(this);
		this.mindMap.command.add("DOWN_NODE", this.downNode);
		this.moveUpOneLevel = this.moveUpOneLevel.bind(this);
		this.mindMap.command.add("MOVE_UP_ONE_LEVEL", this.moveUpOneLevel);
		this.insertAfter = this.insertAfter.bind(this);
		this.mindMap.command.add("INSERT_AFTER", this.insertAfter);
		this.insertBefore = this.insertBefore.bind(this);
		this.mindMap.command.add("INSERT_BEFORE", this.insertBefore);
		this.moveNodeTo = this.moveNodeTo.bind(this);
		this.mindMap.command.add("MOVE_NODE_TO", this.moveNodeTo);
		this.removeNode = this.removeNode.bind(this);
		this.mindMap.command.add("REMOVE_NODE", this.removeNode);
		this.removeCurrentNode = this.removeCurrentNode.bind(this);
		this.mindMap.command.add("REMOVE_CURRENT_NODE", this.removeCurrentNode);
		this.pasteNode = this.pasteNode.bind(this);
		this.mindMap.command.add("PASTE_NODE", this.pasteNode);
		this.cutNode = this.cutNode.bind(this);
		this.mindMap.command.add("CUT_NODE", this.cutNode);
		this.setNodeStyle = this.setNodeStyle.bind(this);
		this.mindMap.command.add("SET_NODE_STYLE", this.setNodeStyle);
		this.setNodeStyles = this.setNodeStyles.bind(this);
		this.mindMap.command.add("SET_NODE_STYLES", this.setNodeStyles);
		this.setNodeActive = this.setNodeActive.bind(this);
		this.mindMap.command.add("SET_NODE_ACTIVE", this.setNodeActive);
		this.clearActiveNode = this.clearActiveNode.bind(this);
		this.mindMap.command.add("CLEAR_ACTIVE_NODE", this.clearActiveNode);
		this.setNodeExpand = this.setNodeExpand.bind(this);
		this.mindMap.command.add("SET_NODE_EXPAND", this.setNodeExpand);
		this.expandAllNode = this.expandAllNode.bind(this);
		this.mindMap.command.add("EXPAND_ALL", this.expandAllNode);
		this.unexpandAllNode = this.unexpandAllNode.bind(this);
		this.mindMap.command.add("UNEXPAND_ALL", this.unexpandAllNode);
		this.expandToLevel = this.expandToLevel.bind(this);
		this.mindMap.command.add("UNEXPAND_TO_LEVEL", this.expandToLevel);
		this.setNodeData = this.setNodeData.bind(this);
		this.mindMap.command.add("SET_NODE_DATA", this.setNodeData);
		this.setNodeText = this.setNodeText.bind(this);
		this.mindMap.command.add("SET_NODE_TEXT", this.setNodeText);
		this.setNodeImage = this.setNodeImage.bind(this);
		this.mindMap.command.add("SET_NODE_IMAGE", this.setNodeImage);
		this.setNodeIcon = this.setNodeIcon.bind(this);
		this.mindMap.command.add("SET_NODE_ICON", this.setNodeIcon);
		this.setNodeHyperlink = this.setNodeHyperlink.bind(this);
		this.mindMap.command.add("SET_NODE_HYPERLINK", this.setNodeHyperlink);
		this.setNodeNote = this.setNodeNote.bind(this);
		this.mindMap.command.add("SET_NODE_NOTE", this.setNodeNote);
		this.setNodeAttachment = this.setNodeAttachment.bind(this);
		this.mindMap.command.add("SET_NODE_ATTACHMENT", this.setNodeAttachment);
		this.setNodeTag = this.setNodeTag.bind(this);
		this.mindMap.command.add("SET_NODE_TAG", this.setNodeTag);
		this.insertFormula = this.insertFormula.bind(this);
		this.mindMap.command.add("INSERT_FORMULA", this.insertFormula);
		this.addGeneralization = this.addGeneralization.bind(this);
		this.mindMap.command.add("ADD_GENERALIZATION", this.addGeneralization);
		this.removeGeneralization = this.removeGeneralization.bind(this);
		this.mindMap.command.add("REMOVE_GENERALIZATION", this.removeGeneralization);
		this.setNodeCustomPosition = this.setNodeCustomPosition.bind(this);
		this.mindMap.command.add("SET_NODE_CUSTOM_POSITION", this.setNodeCustomPosition);
		this.resetLayout = this.resetLayout.bind(this);
		this.mindMap.command.add("RESET_LAYOUT", this.resetLayout);
		this.setNodeShape = this.setNodeShape.bind(this);
		this.mindMap.command.add("SET_NODE_SHAPE", this.setNodeShape);
		this.goTargetNode = this.goTargetNode.bind(this);
		this.mindMap.command.add("GO_TARGET_NODE", this.goTargetNode);
		this.removeCustomStyles = this.removeCustomStyles.bind(this);
		this.mindMap.command.add("REMOVE_CUSTOM_STYLES", this.removeCustomStyles);
		this.removeAllNodeCustomStyles = this.removeAllNodeCustomStyles.bind(this);
		this.mindMap.command.add("REMOVE_ALL_NODE_CUSTOM_STYLES", this.removeAllNodeCustomStyles);
	}
	registerShortcutKeys() {
		this.mindMap.keyCommand.addShortcut("Tab", () => {
			this.mindMap.execCommand("INSERT_CHILD_NODE");
		});
		this.mindMap.keyCommand.addShortcut("Insert", () => {
			this.mindMap.execCommand("INSERT_CHILD_NODE");
		});
		this.mindMap.keyCommand.addShortcut("Enter", () => {
			this.mindMap.execCommand("INSERT_NODE");
		});
		this.mindMap.keyCommand.addShortcut("Shift+Tab", () => {
			this.mindMap.execCommand("INSERT_PARENT_NODE");
		});
		this.mindMap.keyCommand.addShortcut("Control+g", () => {
			this.mindMap.execCommand("ADD_GENERALIZATION");
		});
		this.toggleActiveExpand = this.toggleActiveExpand.bind(this);
		this.mindMap.keyCommand.addShortcut("/", this.toggleActiveExpand);
		this.mindMap.keyCommand.addShortcut("Del|Backspace", () => {
			this.mindMap.execCommand("REMOVE_NODE");
		});
		this.mindMap.keyCommand.addShortcut("Shift+Backspace", () => {
			this.mindMap.execCommand("REMOVE_CURRENT_NODE");
		});
		this.mindMap.on("before_show_text_edit", () => {
			this.startTextEdit();
		});
		this.mindMap.on("hide_text_edit", () => {
			this.endTextEdit();
		});
		this.mindMap.keyCommand.addShortcut("Control+a", () => {
			this.mindMap.execCommand("SELECT_ALL");
		});
		this.mindMap.keyCommand.addShortcut("Control+l", () => {
			this.mindMap.execCommand("RESET_LAYOUT");
		});
		this.mindMap.keyCommand.addShortcut("Control+Up", () => {
			this.mindMap.execCommand("UP_NODE");
		});
		this.mindMap.keyCommand.addShortcut("Control+Down", () => {
			this.mindMap.execCommand("DOWN_NODE");
		});
		this.mindMap.keyCommand.addShortcut("Control+c", () => {
			this.copy();
		});
		this.mindMap.keyCommand.addShortcut("Control+x", () => {
			this.cut();
		});
		this.mindMap.keyCommand.addShortcut("Control+v", () => {
			this.paste();
		});
		this.mindMap.keyCommand.addShortcut("Control+Enter", () => {
			this.setRootNodeCenter();
		});
	}
	emitNodeActiveEvent(node = null, activeNodeList = [...this.activeNodeList]) {
		if (!!checkNodeListIsEqual(this.lastActiveNodeList, activeNodeList)) return;
		this.lastActiveNodeList = [...activeNodeList];
		this.mindMap.batchExecution.push("emitNodeActiveEvent", () => {
			this.mindMap.emit("node_active", node, activeNodeList);
		});
	}
	clearActiveNodeListOnDrawClick(e, eventType) {
		if (this.activeNodeList.length <= 0) return;
		let isTrueClick = true;
		const { useLeftKeySelectionRightKeyDrag } = this.mindMap.opt;
		if (eventType === "contextmenu" ? !useLeftKeySelectionRightKeyDrag : useLeftKeySelectionRightKeyDrag) {
			const mousedownPos = this.mindMap.event.mousedownPos;
			isTrueClick = Math.abs(e.clientX - mousedownPos.x) <= 5 && Math.abs(e.clientY - mousedownPos.y) <= 5;
		}
		if (isTrueClick) this.mindMap.execCommand("CLEAR_ACTIVE_NODE");
	}
	startTextEdit() {
		this.mindMap.keyCommand.save();
	}
	endTextEdit() {
		this.mindMap.keyCommand.restore();
	}
	clearCache() {
		this.layout.lru.clear();
		this.nodeCache = {};
		this.lastNodeCache = {};
	}
	render(callback = () => {}, source) {
		if (source === CONSTANTS.CHANGE_THEME) this.resetUnExpandNodeStyle();
		if (this.isRendering) {
			this.hasWaitRendering = true;
			this.waitRenderingParams = [callback, source];
			return;
		}
		this.isRendering = true;
		this.renderSource = source;
		this.lastNodeCache = this.nodeCache;
		this.nodeCache = {};
		if (this.reRender) this.clearActiveNodeList();
		if (!this.renderTree) {
			this.isRendering = false;
			this.mindMap.emit("node_tree_render_end");
			return;
		}
		this.mindMap.emit("node_tree_render_start");
		this.root = null;
		this.layout.doLayout((root) => {
			Object.keys(this.lastNodeCache).forEach((uid) => {
				if (!this.nodeCache[uid]) {
					this.removeNodeFromActiveList(this.lastNodeCache[uid]);
					this.emitNodeActiveEvent();
					this.lastNodeCache[uid].destroy();
				}
			});
			this.root = root;
			this.root.render(() => {
				this.isRendering = false;
				callback && callback();
				if (this.hasWaitRendering) {
					const params = this.waitRenderingParams;
					this.hasWaitRendering = false;
					this.waitRenderingParams = [];
					this.render(...params);
				} else {
					this.renderSource = "";
					if (this.reRender) this.reRender = false;
				}
				this.mindMap.emit("node_tree_render_end");
			});
		});
		this.emitNodeActiveEvent();
	}
	resetUnExpandNodeStyle() {
		if (!this.renderTree) return;
		walk(this.renderTree, null, (node) => {
			if (!node.data.expand) {
				walk(node, null, (node2) => {
					node2.data["needUpdate"] = true;
				});
				return true;
			}
		});
	}
	clearActiveNode() {
		if (this.activeNodeList.length <= 0) return;
		this.clearActiveNodeList();
		this.emitNodeActiveEvent(null, []);
	}
	clearActiveNodeList() {
		this.activeNodeList.forEach((item) => {
			this.mindMap.execCommand("SET_NODE_ACTIVE", item, false);
		});
		this.activeNodeList = [];
	}
	addNodeToActiveList(node, notEmitBeforeNodeActiveEvent = false) {
		if (this.mindMap.opt.onlyOneEnableActiveNodeOnCooperate && node.userList.length > 0) return;
		if (this.findActiveNodeIndex(node) === -1) {
			if (!notEmitBeforeNodeActiveEvent) this.mindMap.emit("before_node_active", node, this.activeNodeList);
			this.mindMap.execCommand("SET_NODE_ACTIVE", node, true);
			this.activeNodeList.push(node);
		}
	}
	removeNodeFromActiveList(node) {
		let index = this.findActiveNodeIndex(node);
		if (index === -1) return;
		this.mindMap.execCommand("SET_NODE_ACTIVE", node, false);
		this.activeNodeList.splice(index, 1);
	}
	activeMultiNode(nodeList = []) {
		nodeList.forEach((node) => {
			this.mindMap.emit("before_node_active", node, this.activeNodeList);
			this.addNodeToActiveList(node, true);
			this.emitNodeActiveEvent(node);
		});
	}
	cancelActiveMultiNode(nodeList = []) {
		nodeList.forEach((node) => {
			this.removeNodeFromActiveList(node);
			this.emitNodeActiveEvent(null);
		});
	}
	findActiveNodeIndex(node) {
		return getNodeIndexInNodeList(node, this.activeNodeList);
	}
	selectAll() {
		if (this.mindMap.opt.readonly) return;
		walk(this.root, null, (node) => {
			if (!node.getData("isActive")) this.addNodeToActiveList(node);
			if (node._generalizationList && node._generalizationList.length > 0) node._generalizationList.forEach((item) => {
				const gNode = item.generalizationNode;
				if (!gNode.getData("isActive")) this.addNodeToActiveList(gNode);
			});
		}, null, true, 0, 0);
		this.emitNodeActiveEvent();
	}
	back(step) {
		this.backForward("back", step);
	}
	forward(step) {
		this.backForward("forward", step);
	}
	backForward(type, step) {
		this.mindMap.execCommand("CLEAR_ACTIVE_NODE");
		const data = this.mindMap.command[type](step);
		if (data) {
			this.renderTree = data;
			this.mindMap.render();
		}
		this.mindMap.emit("data_change", data);
	}
	getNewNodeBehavior(openEdit = false, handleMultiNodes = false) {
		const { createNewNodeBehavior } = this.mindMap.opt;
		let focusNewNode = false;
		let inserting = false;
		switch (createNewNodeBehavior) {
			case CONSTANTS.CREATE_NEW_NODE_BEHAVIOR.DEFAULT:
				focusNewNode = handleMultiNodes || !openEdit;
				inserting = handleMultiNodes ? false : openEdit;
				break;
			case CONSTANTS.CREATE_NEW_NODE_BEHAVIOR.NOT_ACTIVE:
				focusNewNode = false;
				inserting = false;
				break;
			case CONSTANTS.CREATE_NEW_NODE_BEHAVIOR.ACTIVE_ONLY:
				focusNewNode = true;
				inserting = false;
				break;
			default: break;
		}
		return {
			focusNewNode,
			inserting
		};
	}
	insertNode(openEdit = true, appointNodes = [], appointData = null, appointChildren = []) {
		appointNodes = formatDataToArray(appointNodes);
		if (this.activeNodeList.length <= 0 && appointNodes.length <= 0) return;
		this.textEdit.hideEditTextBox();
		const { defaultInsertSecondLevelNodeText, defaultInsertBelowSecondLevelNodeText } = this.mindMap.opt;
		const list = appointNodes.length > 0 ? appointNodes : this.activeNodeList;
		const handleMultiNodes = list.length > 1;
		const isRichText = this.hasRichTextPlugin();
		const { focusNewNode, inserting } = this.getNewNodeBehavior(openEdit, handleMultiNodes);
		const params = {
			expand: true,
			richText: isRichText,
			isActive: focusNewNode
		};
		if (isRichText) params.resetRichText = true;
		appointChildren = addDataToAppointNodes(appointChildren, params);
		const alreadyIsRichText = appointData && appointData.richText;
		let createNewId = false;
		list.forEach((node) => {
			if (node.isGeneralization || node.isRoot) return;
			appointChildren = simpleDeepClone(appointChildren);
			const parent = node.parent;
			const text = node.layerIndex === 1 ? defaultInsertSecondLevelNodeText : defaultInsertBelowSecondLevelNodeText;
			const index = getNodeDataIndex(node);
			if (alreadyIsRichText && params.resetRichText) delete params.resetRichText;
			const newNodeData = {
				inserting,
				data: {
					text,
					...params,
					uid: createUid(),
					...appointData || {}
				},
				children: [...createUidForAppointNodes(appointChildren, createNewId)]
			};
			createNewId = true;
			parent.nodeData.children.splice(index + 1, 0, newNodeData);
		});
		if (focusNewNode) this.clearActiveNodeList();
		this.mindMap.render();
	}
	insertMultiNode(appointNodes, nodeList) {
		if (!nodeList || nodeList.length <= 0) return;
		appointNodes = formatDataToArray(appointNodes);
		if (this.activeNodeList.length <= 0 && appointNodes.length <= 0) return;
		this.textEdit.hideEditTextBox();
		const list = appointNodes.length > 0 ? appointNodes : this.activeNodeList;
		const isRichText = this.hasRichTextPlugin();
		const { focusNewNode } = this.getNewNodeBehavior(false, true);
		const params = {
			expand: true,
			richText: isRichText,
			isActive: focusNewNode
		};
		if (isRichText) params.resetRichText = true;
		nodeList = addDataToAppointNodes(nodeList, params);
		let createNewId = false;
		list.forEach((node) => {
			if (node.isGeneralization || node.isRoot) return;
			nodeList = simpleDeepClone(nodeList);
			const parent = node.parent;
			const index = getNodeDataIndex(node);
			const newNodeList = createUidForAppointNodes(nodeList, createNewId);
			createNewId = true;
			parent.nodeData.children.splice(index + 1, 0, ...newNodeList);
		});
		if (focusNewNode) this.clearActiveNodeList();
		this.mindMap.render();
	}
	insertChildNode(openEdit = true, appointNodes = [], appointData = null, appointChildren = []) {
		appointNodes = formatDataToArray(appointNodes);
		if (this.activeNodeList.length <= 0 && appointNodes.length <= 0) return;
		this.textEdit.hideEditTextBox();
		const { defaultInsertSecondLevelNodeText, defaultInsertBelowSecondLevelNodeText } = this.mindMap.opt;
		const list = appointNodes.length > 0 ? appointNodes : this.activeNodeList;
		const handleMultiNodes = list.length > 1;
		const isRichText = this.hasRichTextPlugin();
		const { focusNewNode, inserting } = this.getNewNodeBehavior(openEdit, handleMultiNodes);
		const params = {
			expand: true,
			richText: isRichText,
			isActive: focusNewNode
		};
		if (isRichText) params.resetRichText = true;
		appointChildren = addDataToAppointNodes(appointChildren, params);
		const alreadyIsRichText = appointData && appointData.richText;
		let createNewId = false;
		list.forEach((node) => {
			if (node.isGeneralization) return;
			appointChildren = simpleDeepClone(appointChildren);
			if (!node.nodeData.children) node.nodeData.children = [];
			const text = node.isRoot ? defaultInsertSecondLevelNodeText : defaultInsertBelowSecondLevelNodeText;
			if (alreadyIsRichText && params.resetRichText) delete params.resetRichText;
			const newNode = {
				inserting,
				data: {
					text,
					uid: createUid(),
					...params,
					...appointData || {}
				},
				children: [...createUidForAppointNodes(appointChildren, createNewId)]
			};
			createNewId = true;
			node.nodeData.children.push(newNode);
			node.setData({ expand: true });
		});
		if (focusNewNode) this.clearActiveNodeList();
		this.mindMap.render();
	}
	insertMultiChildNode(appointNodes, childList) {
		if (!childList || childList.length <= 0) return;
		appointNodes = formatDataToArray(appointNodes);
		if (this.activeNodeList.length <= 0 && appointNodes.length <= 0) return;
		this.textEdit.hideEditTextBox();
		const list = appointNodes.length > 0 ? appointNodes : this.activeNodeList;
		const isRichText = this.hasRichTextPlugin();
		const { focusNewNode } = this.getNewNodeBehavior(false, true);
		const params = {
			expand: true,
			richText: isRichText,
			isActive: focusNewNode
		};
		if (isRichText) params.resetRichText = true;
		childList = addDataToAppointNodes(childList, params);
		let createNewId = false;
		list.forEach((node) => {
			if (node.isGeneralization) return;
			childList = simpleDeepClone(childList);
			if (!node.nodeData.children) node.nodeData.children = [];
			childList = createUidForAppointNodes(childList, createNewId);
			createNewId = true;
			node.nodeData.children.push(...childList);
			node.setData({ expand: true });
		});
		if (focusNewNode) this.clearActiveNodeList();
		this.mindMap.render();
	}
	insertParentNode(openEdit = true, appointNodes, appointData) {
		appointNodes = formatDataToArray(appointNodes);
		if (this.activeNodeList.length <= 0 && appointNodes.length <= 0) return;
		this.textEdit.hideEditTextBox();
		const { defaultInsertSecondLevelNodeText, defaultInsertBelowSecondLevelNodeText } = this.mindMap.opt;
		const list = appointNodes.length > 0 ? appointNodes : this.activeNodeList;
		const handleMultiNodes = list.length > 1;
		const isRichText = this.hasRichTextPlugin();
		const { focusNewNode, inserting } = this.getNewNodeBehavior(openEdit, handleMultiNodes);
		const params = {
			expand: true,
			richText: isRichText,
			isActive: focusNewNode
		};
		if (isRichText) params.resetRichText = true;
		const alreadyIsRichText = appointData && appointData.richText;
		list.forEach((node) => {
			if (node.isGeneralization || node.isRoot) return;
			const text = node.layerIndex === 1 ? defaultInsertSecondLevelNodeText : defaultInsertBelowSecondLevelNodeText;
			if (alreadyIsRichText && params.resetRichText) delete params.resetRichText;
			const newNode = {
				inserting,
				data: {
					text,
					uid: createUid(),
					...params,
					...appointData || {}
				},
				children: [node.nodeData]
			};
			const parent = node.parent;
			const index = getNodeDataIndex(node);
			parent.nodeData.children.splice(index, 1, newNode);
		});
		if (focusNewNode) this.clearActiveNodeList();
		this.mindMap.render();
	}
	upNode(appointNode) {
		if (this.activeNodeList.length <= 0 && !appointNode) return;
		const node = (appointNode ? [appointNode] : this.activeNodeList)[0];
		if (node.isRoot) return;
		let parent = node.parent;
		let childList = parent.children;
		let index = getNodeIndexInNodeList(node, childList);
		if (index === -1 || index === 0) return;
		let insertIndex = index - 1;
		childList.splice(index, 1);
		childList.splice(insertIndex, 0, node);
		parent.nodeData.children.splice(index, 1);
		parent.nodeData.children.splice(insertIndex, 0, node.nodeData);
		this.mindMap.render();
	}
	downNode(appointNode) {
		if (this.activeNodeList.length <= 0 && !appointNode) return;
		const node = (appointNode ? [appointNode] : this.activeNodeList)[0];
		if (node.isRoot) return;
		let parent = node.parent;
		let childList = parent.children;
		let index = getNodeIndexInNodeList(node, childList);
		if (index === -1 || index === childList.length - 1) return;
		let insertIndex = index + 1;
		childList.splice(index, 1);
		childList.splice(insertIndex, 0, node);
		parent.nodeData.children.splice(index, 1);
		parent.nodeData.children.splice(insertIndex, 0, node.nodeData);
		this.mindMap.render();
	}
	moveUpOneLevel(node) {
		node = node || this.activeNodeList[0];
		if (!node || node.isRoot || node.layerIndex <= 1) return;
		const parent = node.parent;
		const grandpa = parent.parent;
		const index = getNodeIndexInNodeList(node, parent.children);
		const parentIndex = getNodeIndexInNodeList(parent, grandpa.children);
		parent.nodeData.children.splice(index, 1);
		grandpa.nodeData.children.splice(parentIndex + 1, 0, node.nodeData);
		this.mindMap.render();
	}
	_handleRemoveCustomStyles(nodeData) {
		let hasCustomStyles = false;
		Object.keys(nodeData).forEach((key) => {
			if (checkIsNodeStyleDataKey(key)) {
				hasCustomStyles = true;
				delete nodeData[key];
			}
		});
		if (this.hasRichTextPlugin()) {
			hasCustomStyles = true;
			nodeData.resetRichText = true;
		}
		return hasCustomStyles;
	}
	removeCustomStyles(node) {
		node = node || this.activeNodeList[0];
		if (!node) return;
		if (this._handleRemoveCustomStyles(node.getData())) this.reRenderNodeCheckChange(node);
	}
	removeAllNodeCustomStyles(appointNodes) {
		appointNodes = formatDataToArray(appointNodes);
		let hasCustomStyles = false;
		if (appointNodes.length > 0) appointNodes.forEach((node) => {
			if (this._handleRemoveCustomStyles(node.getData())) hasCustomStyles = true;
		});
		else {
			if (!this.renderTree) return;
			walk(this.renderTree, null, (node) => {
				if (this._handleRemoveCustomStyles(node.data)) hasCustomStyles = true;
				const generalizationList = formatGetNodeGeneralization(node.data);
				if (generalizationList.length > 0) generalizationList.forEach((generalizationData) => {
					if (this._handleRemoveCustomStyles(generalizationData)) hasCustomStyles = true;
				});
			});
		}
		if (hasCustomStyles) this.mindMap.reRender();
	}
	copy() {
		this.beingCopyData = this.copyNode();
		if (!this.beingCopyData) return;
		if (!this.mindMap.opt.disabledClipboard) setDataToClipboard(createSmmFormatData(this.beingCopyData));
	}
	cut() {
		this.mindMap.execCommand("CUT_NODE", (copyData) => {
			this.beingCopyData = copyData;
			if (!this.mindMap.opt.disabledClipboard) setDataToClipboard(createSmmFormatData(copyData));
		});
	}
	handlePaste(event) {
		const { disabledClipboard } = this.mindMap.opt;
		if (disabledClipboard) return;
		const clipboardData = event.clipboardData || event.originalEvent.clipboardData;
		const items = clipboardData.items;
		Array.from(items).forEach((item) => {
			if (item.type.indexOf("image") > -1) item.getAsFile();
			if (item.type.indexOf("text") > -1) clipboardData.getData("text");
		});
		this.paste();
	}
	async paste() {
		const { errorHandler, handleIsSplitByWrapOnPasteCreateNewNode, handleNodePasteImg, disabledClipboard, onlyPasteTextWhenHasImgAndText } = this.mindMap.opt;
		if (!disabledClipboard && checkClipboardReadEnable()) try {
			const res = await getDataFromClipboard();
			let text = res.text || "";
			let img = res.img || null;
			if (text) {
				let smmData = null;
				let useDefault = true;
				if (this.mindMap.opt.customHandleClipboardText) try {
					const res = await this.mindMap.opt.customHandleClipboardText(text);
					if (!isUndef(res)) {
						useDefault = false;
						const checkRes = checkSmmFormatData(res);
						if (checkRes.isSmm) smmData = checkRes.data;
						else text = checkRes.data;
					}
				} catch (error) {
					errorHandler(ERROR_TYPES.CUSTOM_HANDLE_CLIPBOARD_TEXT_ERROR, error);
				}
				if (useDefault) {
					const checkRes = checkSmmFormatData(text);
					if (checkRes.isSmm) smmData = checkRes.data;
					else text = checkRes.data;
				}
				if (smmData) this.mindMap.execCommand("INSERT_MULTI_CHILD_NODE", [], Array.isArray(smmData) ? smmData : [smmData]);
				else {
					if (this.hasRichTextPlugin()) text = htmlEscape(text);
					const textArr = text.split(/* @__PURE__ */ new RegExp("\r?\n|(?<!\n)\r", "g")).filter((item) => {
						return !!item;
					});
					if (textArr.length > 1 && handleIsSplitByWrapOnPasteCreateNewNode) handleIsSplitByWrapOnPasteCreateNewNode().then(() => {
						this.mindMap.execCommand("INSERT_MULTI_CHILD_NODE", [], textArr.map((item) => {
							return {
								data: { text: item },
								children: []
							};
						}));
					}).catch(() => {
						this.mindMap.execCommand("INSERT_CHILD_NODE", false, [], { text });
					});
					else this.mindMap.execCommand("INSERT_CHILD_NODE", false, [], { text });
				}
			}
			if (img && (!text || !onlyPasteTextWhenHasImgAndText)) try {
				let imgData = null;
				if (handleNodePasteImg && typeof handleNodePasteImg === "function") imgData = await handleNodePasteImg(img);
				else imgData = await loadImage(img);
				if (this.activeNodeList.length > 0) this.activeNodeList.forEach((node) => {
					this.mindMap.execCommand("SET_NODE_IMAGE", node, {
						url: imgData.url,
						title: "",
						width: imgData.size.width,
						height: imgData.size.height
					});
				});
			} catch (error) {
				errorHandler(ERROR_TYPES.LOAD_CLIPBOARD_IMAGE_ERROR, error);
			}
		} catch (error) {
			errorHandler(ERROR_TYPES.READ_CLIPBOARD_ERROR, error);
		}
		else if (this.beingCopyData) this.mindMap.execCommand("PASTE_NODE", this.beingCopyData);
	}
	insertBefore(node, exist) {
		this.insertTo(node, exist, "before");
	}
	insertAfter(node, exist) {
		this.insertTo(node, exist, "after");
	}
	insertTo(node, exist, dir = "before") {
		let nodeList = formatDataToArray(node);
		nodeList = nodeList.filter((item) => {
			return !item.isRoot;
		});
		if (dir === "after") nodeList.reverse();
		nodeList.forEach((item) => {
			let nodeParent = item.parent;
			let nodeBorthers = nodeParent.children;
			let nodeIndex = getNodeIndexInNodeList(item, nodeBorthers);
			if (nodeIndex === -1) return;
			nodeBorthers.splice(nodeIndex, 1);
			nodeParent.nodeData.children.splice(nodeIndex, 1);
			let existParent = exist.parent;
			let existBorthers = existParent.children;
			let existIndex = getNodeIndexInNodeList(exist, existBorthers);
			if (existIndex === -1) return;
			if (dir === "after") existIndex++;
			existBorthers.splice(existIndex, 0, item);
			existParent.nodeData.children.splice(existIndex, 0, item.nodeData);
		});
		this.mindMap.render();
	}
	removeNode(appointNodes = []) {
		appointNodes = formatDataToArray(appointNodes);
		if (this.activeNodeList.length <= 0 && appointNodes.length <= 0) return;
		let needActiveNode = null;
		let isAppointNodes = appointNodes.length > 0;
		let list = isAppointNodes ? appointNodes : this.activeNodeList;
		let root = list.find((node) => {
			return node.isRoot;
		});
		if (root) {
			this.clearActiveNodeList();
			root.children = [];
			root.nodeData.children = [];
		} else {
			needActiveNode = this.getNextActiveNode(list);
			for (let i = 0; i < list.length; i++) {
				const node = list[i];
				const currentEditNode = this.textEdit.getCurrentEditNode();
				if (currentEditNode && currentEditNode.getData("uid") === node.getData("uid")) this.textEdit.hideEditTextBox();
				if (isAppointNodes) list.splice(i, 1);
				if (node.isGeneralization) {
					this.deleteNodeGeneralization(node);
					this.removeNodeFromActiveList(node);
					i--;
				} else {
					this.removeNodeFromActiveList(node);
					removeFromParentNodeData(node);
					i--;
				}
			}
		}
		this.activeNodeList = [];
		if (needActiveNode) this.addNodeToActiveList(needActiveNode);
		this.emitNodeActiveEvent();
		this.mindMap.render();
	}
	deleteNodeGeneralization(node) {
		const targetNode = node.generalizationBelongNode;
		const index = targetNode.getGeneralizationNodeIndex(node);
		let generalization = targetNode.getData("generalization");
		if (Array.isArray(generalization)) generalization.splice(index, 1);
		else generalization = null;
		this.mindMap.execCommand("SET_NODE_DATA", targetNode, { generalization });
		this.closeHighlightNode();
	}
	removeCurrentNode(appointNodes = []) {
		appointNodes = formatDataToArray(appointNodes);
		if (this.activeNodeList.length <= 0 && appointNodes.length <= 0) return;
		let list = appointNodes.length > 0 ? appointNodes : this.activeNodeList;
		list = list.filter((node) => {
			return !node.isRoot;
		});
		let needActiveNode = this.getNextActiveNode(list);
		for (let i = 0; i < list.length; i++) {
			let node = list[i];
			if (node.isGeneralization) this.deleteNodeGeneralization(node);
			else {
				const parent = node.parent;
				const index = getNodeDataIndex(node);
				parent.nodeData.children.splice(index, 1, ...node.nodeData.children || []);
			}
		}
		this.activeNodeList = [];
		if (needActiveNode) this.addNodeToActiveList(needActiveNode);
		this.emitNodeActiveEvent();
		this.mindMap.render();
	}
	getNextActiveNode(deleteList) {
		if (deleteList.length !== 1) return null;
		if (this.findActiveNodeIndex(deleteList[0]) === -1) return null;
		let needActiveNode = null;
		if (this.activeNodeList.length === 1 && !this.activeNodeList[0].isGeneralization && this.mindMap.opt.deleteNodeActive) {
			const node = this.activeNodeList[0];
			const broList = node.parent.children;
			const nodeIndex = getNodeIndexInNodeList(node, broList);
			if (nodeIndex < broList.length - 1) needActiveNode = broList[nodeIndex + 1];
			else if (nodeIndex > 0) needActiveNode = broList[nodeIndex - 1];
			else needActiveNode = node.parent;
		}
		return needActiveNode;
	}
	copyNode() {
		if (this.activeNodeList.length <= 0) return null;
		let nodeList = getTopAncestorsFomNodeList(this.activeNodeList);
		nodeList = sortNodeList(nodeList);
		return nodeList.map((node) => {
			return copyNodeTree({}, node, true);
		});
	}
	cutNode(callback) {
		if (this.activeNodeList.length <= 0) return;
		let nodeList = getTopAncestorsFomNodeList(this.activeNodeList).filter((node) => {
			return !node.isRoot;
		});
		nodeList = sortNodeList(nodeList);
		const copyData = nodeList.map((node) => {
			return copyNodeTree({}, node, true);
		});
		nodeList.forEach((node) => {
			removeFromParentNodeData(node);
		});
		this.clearActiveNodeList();
		this.mindMap.render();
		if (callback && typeof callback === "function") callback(copyData);
	}
	moveNodeTo(node, toNode) {
		let nodeList = formatDataToArray(node);
		nodeList = nodeList.filter((item) => {
			return !item.isRoot;
		});
		nodeList.forEach((item) => {
			this.removeNodeFromActiveList(item);
			removeFromParentNodeData(item);
			toNode.setData({ expand: true });
			toNode.nodeData.children.push(item.nodeData);
		});
		this.emitNodeActiveEvent();
		this.mindMap.render();
	}
	pasteNode(data) {
		data = formatDataToArray(data);
		this.mindMap.execCommand("INSERT_MULTI_CHILD_NODE", [], data);
	}
	setNodeStyle(node, prop, value) {
		const data = { [prop]: value };
		this.setNodeDataRender(node, data);
		if (lineStyleProps.includes(prop)) (node.parent || node).renderLine(true);
	}
	setNodeStyles(node, style) {
		const data = { ...style };
		this.setNodeDataRender(node, data);
		let props = Object.keys(style);
		let hasLineStyleProps = false;
		props.forEach((key) => {
			if (lineStyleProps.includes(key)) hasLineStyleProps = true;
		});
		if (hasLineStyleProps) (node.parent || node).renderLine(true);
	}
	setNodeActive(node, active) {
		this.mindMap.execCommand("SET_NODE_DATA", node, { isActive: active });
		node.updateNodeByActive(active);
	}
	setNodeExpand(node, expand) {
		this.mindMap.execCommand("SET_NODE_DATA", node, { expand });
		this.mindMap.render();
	}
	expandAllNode(uid = "") {
		if (!this.renderTree) return;
		const _walk = (node, enableExpand) => {
			if (!enableExpand && node.data.uid === uid) enableExpand = true;
			if (enableExpand && !node.data.expand) node.data.expand = true;
			if (node.children && node.children.length > 0) node.children.forEach((child) => {
				_walk(child, enableExpand);
			});
		};
		_walk(this.renderTree, !uid);
		this.mindMap.render();
	}
	unexpandAllNode(isSetRootNodeCenter = true, uid = "") {
		if (!this.renderTree) return;
		const _walk = (node, isRoot, enableUnExpand) => {
			if (!enableUnExpand && node.data.uid === uid) enableUnExpand = true;
			if (enableUnExpand && !isRoot && node.children && node.children.length > 0) node.data.expand = false;
			if (node.children && node.children.length > 0) node.children.forEach((child) => {
				_walk(child, false, enableUnExpand);
			});
		};
		_walk(this.renderTree, true, !uid);
		this.mindMap.render(() => {
			if (isSetRootNodeCenter) this.setRootNodeCenter();
		});
	}
	expandToLevel(level) {
		if (!this.renderTree) return;
		walk(this.renderTree, null, (node, parent, isRoot, layerIndex) => {
			if (layerIndex < level) node.data.expand = true;
			else if (!isRoot && node.children && node.children.length > 0) node.data.expand = false;
		}, null, true, 0, 0);
		this.mindMap.render();
	}
	toggleActiveExpand() {
		this.activeNodeList.forEach((node) => {
			if (node.nodeData.children.length <= 0 || node.isRoot) return;
			this.toggleNodeExpand(node);
		});
	}
	toggleNodeExpand(node) {
		this.mindMap.execCommand("SET_NODE_EXPAND", node, !node.getData("expand"));
	}
	setNodeText(node, text, richText, resetRichText) {
		richText = richText === void 0 ? node.getData("richText") : richText;
		this.setNodeDataRender(node, {
			text,
			richText,
			resetRichText
		});
	}
	setNodeImage(node, data) {
		const { url, title, width, height, custom = false } = data || {
			url: "",
			title: "",
			width: 0,
			height: 0,
			custom: false
		};
		this.setNodeDataRender(node, {
			image: url,
			imageTitle: title || "",
			imageSize: {
				width,
				height,
				custom
			}
		});
	}
	setNodeIcon(node, icons) {
		this.setNodeDataRender(node, { icon: icons });
	}
	setNodeHyperlink(node, link, title = "") {
		this.setNodeDataRender(node, {
			hyperlink: link,
			hyperlinkTitle: title
		});
	}
	setNodeNote(node, note) {
		this.setNodeDataRender(node, { note });
	}
	setNodeAttachment(node, url, name = "") {
		this.setNodeDataRender(node, {
			attachmentUrl: url,
			attachmentName: name
		});
	}
	setNodeTag(node, tag) {
		this.setNodeDataRender(node, { tag });
	}
	insertFormula(formula, appointNodes = []) {
		if (!this.hasRichTextPlugin() || !this.mindMap.formula) return;
		appointNodes = formatDataToArray(appointNodes);
		(appointNodes.length > 0 ? appointNodes : this.activeNodeList).forEach((node) => {
			this.mindMap.formula.insertFormulaToNode(node, formula);
		});
	}
	addGeneralization(data, openEdit = true) {
		if (this.activeNodeList.length <= 0) return;
		const list = parseAddGeneralizationNodeList(this.activeNodeList.filter((node) => {
			return !node.isRoot && !node.isGeneralization && !node.checkHasSelfGeneralization();
		}));
		if (list.length <= 0) return;
		const isRichText = this.hasRichTextPlugin();
		const { focusNewNode, inserting } = this.getNewNodeBehavior(openEdit, list.length > 1);
		let needRender = false;
		const alreadyIsRichText = data && data.richText;
		list.forEach((item) => {
			const newData = {
				inserting,
				...data || { text: this.mindMap.opt.defaultGeneralizationText },
				range: item.range || null,
				uid: createUid(),
				richText: isRichText,
				isActive: focusNewNode
			};
			if (isRichText && !alreadyIsRichText) newData.resetRichText = isRichText;
			let generalization = item.node.getData("generalization");
			generalization = generalization ? Array.isArray(generalization) ? generalization : [generalization] : [];
			if (item.range) {
				if (!!generalization.find((item2) => {
					return item2.range && item2.range[0] === item.range[0] && item2.range[1] === item.range[1];
				})) return;
				generalization.push(newData);
			} else generalization.push(newData);
			needRender = true;
			this.mindMap.execCommand("SET_NODE_DATA", item.node, { generalization });
			item.node.setData({ expand: true });
		});
		if (!needRender) return;
		if (focusNewNode) this.clearActiveNodeList();
		this.mindMap.render(() => {
			this.mindMap.render();
		});
	}
	removeGeneralization() {
		if (this.activeNodeList.length <= 0) return;
		this.activeNodeList.forEach((node) => {
			if (!node.checkHasGeneralization()) return;
			this.mindMap.execCommand("SET_NODE_DATA", node, { generalization: null });
		});
		this.mindMap.render();
		this.closeHighlightNode();
	}
	setNodeCustomPosition(node, left = void 0, top = void 0) {
		[node].forEach((item) => {
			this.mindMap.execCommand("SET_NODE_DATA", item, {
				customLeft: left,
				customTop: top
			});
		});
	}
	resetLayout() {
		walk(this.root, null, (node) => {
			node.customLeft = void 0;
			node.customTop = void 0;
			this.mindMap.execCommand("SET_NODE_DATA", node, {
				customLeft: void 0,
				customTop: void 0
			});
			this.mindMap.render();
		}, null, true, 0, 0);
	}
	setNodeShape(node, shape) {
		if (!shape || !shapeList.includes(shape)) return;
		[node].forEach((item) => {
			this.setNodeStyle(item, "shape", shape);
		});
	}
	goTargetNode(node, callback = () => {}) {
		let uid = typeof node === "string" ? node : node.getData("uid");
		if (!uid) return;
		this.expandToNodeUid(uid, () => {
			let targetNode = this.findNodeByUid(uid);
			if (targetNode) {
				targetNode.active();
				this.moveNodeToCenter(targetNode);
				callback(targetNode);
			}
		});
	}
	setNodeData(node, data) {
		Object.keys(data).forEach((key) => {
			node.nodeData.data[key] = data[key];
		});
	}
	setNodeDataRender(node, data, notRender = false) {
		this.mindMap.execCommand("SET_NODE_DATA", node, data);
		if (isNodeNotNeedRenderData(data)) {
			this.mindMap.emit("node_tree_render_end");
			return;
		}
		this.reRenderNodeCheckChange(node, notRender);
	}
	reRenderNodeCheckChange(node, notRender) {
		if (node.reRender()) {
			if (!notRender) this.mindMap.render();
		} else this.mindMap.emit("node_tree_render_end");
	}
	moveNodeToCenter(node, resetScale) {
		let { resetScaleOnMoveNodeToCenter } = this.mindMap.opt;
		if (resetScale !== void 0) resetScaleOnMoveNodeToCenter = resetScale;
		let { transform, state } = this.mindMap.view.getTransformData();
		let { left, top, width, height } = node;
		if (!resetScaleOnMoveNodeToCenter) {
			left *= transform.scaleX;
			top *= transform.scaleY;
			width *= transform.scaleX;
			height *= transform.scaleY;
		}
		let halfWidth = this.mindMap.width / 2;
		let halfHeight = this.mindMap.height / 2;
		let nodeCenterX = left + width / 2;
		let nodeCenterY = top + height / 2;
		let targetX = halfWidth - state.x;
		let targetY = halfHeight - state.y;
		let offsetX = targetX - nodeCenterX;
		let offsetY = targetY - nodeCenterY;
		this.mindMap.view.translateX(offsetX);
		this.mindMap.view.translateY(offsetY);
		if (resetScaleOnMoveNodeToCenter) this.mindMap.view.setScale(1);
	}
	setRootNodeCenter() {
		this.moveNodeToCenter(this.root);
	}
	expandToNodeUid(uid, callback = () => {}) {
		if (!this.renderTree) {
			callback();
			return;
		}
		let parentsList = [];
		let isGeneralization = false;
		const cache = {};
		bfsWalk(this.renderTree, (node, parent) => {
			if (node.data.uid === uid) {
				parentsList = parent ? [...cache[parent.data.uid], parent] : [];
				return "stop";
			}
			formatGetNodeGeneralization(node.data).forEach((item) => {
				if (item.uid === uid) {
					parentsList = parent ? [
						...cache[parent.data.uid],
						parent,
						node
					] : [];
					isGeneralization = true;
				}
			});
			if (isGeneralization) return "stop";
			cache[node.data.uid] = parent ? [...cache[parent.data.uid], parent] : [];
		});
		let needRender = false;
		parentsList.forEach((node) => {
			if (!node.data.expand) {
				needRender = true;
				node.data.expand = true;
			}
		});
		if (isGeneralization) {
			const lastNode = parentsList[parentsList.length - 1];
			if (lastNode) walk(lastNode, null, (node) => {
				if (!node.data.expand) {
					needRender = true;
					node.data.expand = true;
				}
			});
		}
		if (needRender) this.mindMap.render(callback);
		else callback();
	}
	findNodeByUid(uid) {
		if (!this.root) return;
		let res = null;
		walk(this.root, null, (node) => {
			if (node.getData("uid") === uid) {
				res = node;
				return true;
			}
			let isGeneralization = false;
			(node._generalizationList || []).forEach((item) => {
				if (item.generalizationNode.getData("uid") === uid) {
					res = item.generalizationNode;
					isGeneralization = true;
				}
			});
			if (isGeneralization) return true;
		});
		return res;
	}
	highlightNode(node, range, style) {
		if (this.isRendering) return;
		style = {
			stroke: "rgb(94, 200, 248)",
			fill: "transparent",
			...style || {}
		};
		if (!this.highlightBoxNode) this.highlightBoxNode = new Polygon().stroke({ color: style.stroke || "transparent" }).fill({ color: style.fill || "transparent" });
		else if (this.highlightBoxNodeStyle) {
			if (this.highlightBoxNodeStyle.stroke !== style.stroke || this.highlightBoxNodeStyle.fill !== style.fill) this.highlightBoxNode.stroke({ color: style.stroke || "transparent" }).fill({ color: style.fill || "transparent" });
		}
		this.highlightBoxNodeStyle = { ...style };
		let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
		if (range) node.children.slice(range[0], range[1] + 1).forEach((child) => {
			if (child.left < minx) minx = child.left;
			if (child.top < miny) miny = child.top;
			const right = child.left + child.width;
			const bottom = child.top + child.height;
			if (right > maxx) maxx = right;
			if (bottom > maxy) maxy = bottom;
		});
		else {
			minx = node.left;
			miny = node.top;
			maxx = node.left + node.width;
			maxy = node.top + node.height;
		}
		this.highlightBoxNode.plot([
			[minx, miny],
			[maxx, miny],
			[maxx, maxy],
			[minx, maxy]
		]);
		this.mindMap.otherDraw.add(this.highlightBoxNode);
	}
	closeHighlightNode() {
		if (!this.highlightBoxNode) return;
		this.highlightBoxNode.remove();
	}
	hasRichTextPlugin() {
		return !!this.mindMap.richText;
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/theme/index.js
var theme_default = { default: default_default };
//#endregion
//#region node_modules/simple-mind-map/src/core/command/keyMap.js
var map = {
	Backspace: 8,
	Tab: 9,
	Enter: 13,
	Shift: 16,
	Control: 17,
	Alt: 18,
	CapsLock: 20,
	Esc: 27,
	Spacebar: 32,
	PageUp: 33,
	PageDown: 34,
	End: 35,
	Home: 36,
	Insert: 45,
	Left: 37,
	Up: 38,
	Right: 39,
	Down: 40,
	Del: 46,
	NumLock: 144,
	Cmd: 91,
	CmdFF: 224,
	F1: 112,
	F2: 113,
	F3: 114,
	F4: 115,
	F5: 116,
	F6: 117,
	F7: 118,
	F8: 119,
	F9: 120,
	F10: 121,
	F11: 122,
	F12: 123,
	"`": 192,
	"=": 187,
	"-": 189,
	"/": 191,
	".": 190
};
for (let i = 0; i <= 9; i++) map[i] = i + 48;
"abcdefghijklmnopqrstuvwxyz".split("").forEach((n, index) => {
	map[n] = index + 65;
});
var keyMap = map;
//#endregion
//#region node_modules/simple-mind-map/src/core/command/KeyCommand.js
var KeyCommand = class {
	constructor(opt) {
		this.opt = opt;
		this.mindMap = opt.mindMap;
		this.shortcutMap = {};
		this.shortcutMapCache = {};
		this.isPause = false;
		this.isInSvg = false;
		this.bindEvent();
	}
	extendKeyMap(key, code) {
		keyMap[key] = code;
	}
	removeKeyMap(key) {
		if (typeof keyMap[key] !== "undefined") delete keyMap[key];
	}
	pause() {
		this.isPause = true;
	}
	recovery() {
		this.isPause = false;
	}
	save() {
		if (Object.keys(this.shortcutMapCache).length > 0) return;
		this.shortcutMapCache = this.shortcutMap;
		this.shortcutMap = {};
	}
	restore() {
		if (Object.keys(this.shortcutMapCache).length <= 0) return;
		this.shortcutMap = this.shortcutMapCache;
		this.shortcutMapCache = {};
	}
	bindEvent() {
		this.onKeydown = this.onKeydown.bind(this);
		this.mindMap.on("svg_mouseenter", () => {
			this.isInSvg = true;
		});
		this.mindMap.on("svg_mouseleave", () => {
			if (this.mindMap.renderer.textEdit.isShowTextEdit()) return;
			if (this.mindMap.associativeLine && this.mindMap.associativeLine.showTextEdit) return;
			this.isInSvg = false;
		});
		window.addEventListener("keydown", this.onKeydown);
		this.mindMap.on("beforeDestroy", () => {
			this.unBindEvent();
		});
	}
	unBindEvent() {
		window.removeEventListener("keydown", this.onKeydown);
	}
	defaultEnableCheck(e) {
		const target = e.target;
		return target === document.body || target.classList.contains(CONSTANTS.EDIT_NODE_CLASS.SMM_NODE_EDIT_WRAP) || target.classList.contains(CONSTANTS.EDIT_NODE_CLASS.RICH_TEXT_EDIT_WRAP) || target.classList.contains(CONSTANTS.EDIT_NODE_CLASS.ASSOCIATIVE_LINE_TEXT_EDIT_WRAP);
	}
	onKeydown(e) {
		const { enableShortcutOnlyWhenMouseInSvg, beforeShortcutRun, customCheckEnableShortcut } = this.mindMap.opt;
		if (!(typeof customCheckEnableShortcut === "function" ? customCheckEnableShortcut : this.defaultEnableCheck)(e)) return;
		if (this.isPause || enableShortcutOnlyWhenMouseInSvg && !this.isInSvg) return;
		Object.keys(this.shortcutMap).forEach((key) => {
			if (this.checkKey(e, key)) {
				if (!this.checkKey(e, "Control+v")) {
					e.stopPropagation();
					e.preventDefault();
				}
				if (typeof beforeShortcutRun === "function") {
					if (beforeShortcutRun(key, [...this.mindMap.renderer.activeNodeList])) return;
				}
				this.shortcutMap[key].forEach((fn) => {
					fn();
				});
			}
		});
	}
	checkKey(e, key) {
		let o = this.getOriginEventCodeArr(e);
		let k = this.getKeyCodeArr(key);
		if (o.length !== k.length) return false;
		for (let i = 0; i < o.length; i++) {
			let index = k.findIndex((item) => {
				return item === o[i];
			});
			if (index === -1) return false;
			else k.splice(index, 1);
		}
		return true;
	}
	getOriginEventCodeArr(e) {
		let arr = [];
		if (e.ctrlKey || e.metaKey) arr.push(keyMap["Control"]);
		if (e.altKey) arr.push(keyMap["Alt"]);
		if (e.shiftKey) arr.push(keyMap["Shift"]);
		if (!arr.includes(e.keyCode)) arr.push(e.keyCode);
		return arr;
	}
	hasCombinationKey(e) {
		return e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;
	}
	getKeyCodeArr(key) {
		let keyArr = key.split(/\s*\+\s*/);
		let arr = [];
		keyArr.forEach((item) => {
			arr.push(keyMap[item]);
		});
		return arr;
	}
	/**
	* Enter
	* Tab | Insert
	* Shift + a
	*/
	addShortcut(key, fn) {
		key.split(/\s*\|\s*/).forEach((item) => {
			if (this.shortcutMap[item]) this.shortcutMap[item].push(fn);
			else this.shortcutMap[item] = [fn];
		});
	}
	removeShortcut(key, fn) {
		key.split(/\s*\|\s*/).forEach((item) => {
			if (this.shortcutMap[item]) if (fn) {
				let index = this.shortcutMap[item].findIndex((f) => {
					return f === fn;
				});
				if (index !== -1) this.shortcutMap[item].splice(index, 1);
			} else {
				this.shortcutMap[item] = [];
				delete this.shortcutMap[item];
			}
		});
	}
	getShortcutFn(key) {
		let res = [];
		key.split(/\s*\|\s*/).forEach((item) => {
			res = this.shortcutMap[item] || [];
		});
		return res;
	}
};
//#endregion
//#region node_modules/simple-mind-map/package.json
var version = "0.13.1-fix.2";
//#endregion
//#region node_modules/simple-mind-map/src/core/command/Command.js
var Command = class {
	constructor(opt = {}) {
		this.opt = opt;
		this.mindMap = opt.mindMap;
		this.commands = {};
		this.history = [];
		this.activeHistoryIndex = 0;
		this.registerShortcutKeys();
		this.originAddHistory = this.addHistory.bind(this);
		this.addHistory = throttle(this.addHistory, this.mindMap.opt.addHistoryTime, this);
		this.isPause = false;
	}
	pause() {
		this.isPause = true;
	}
	recovery() {
		this.isPause = false;
	}
	clearHistory() {
		this.history = [];
		this.activeHistoryIndex = 0;
		this.mindMap.emit("back_forward", 0, 0);
	}
	registerShortcutKeys() {
		this.mindMap.keyCommand.addShortcut("Control+z", () => {
			this.mindMap.execCommand("BACK");
		});
		this.mindMap.keyCommand.addShortcut("Control+y", () => {
			this.mindMap.execCommand("FORWARD");
		});
	}
	exec(name, ...args) {
		if (this.commands[name]) {
			this.commands[name].forEach((fn) => {
				fn(...args);
			});
			this.mindMap.emit("afterExecCommand", name, ...args);
			if ([
				"BACK",
				"FORWARD",
				"SET_NODE_ACTIVE",
				"CLEAR_ACTIVE_NODE"
			].includes(name)) return;
			this.addHistory();
		}
	}
	add(name, fn) {
		if (this.commands[name]) this.commands[name].push(fn);
		else this.commands[name] = [fn];
	}
	remove(name, fn) {
		if (!this.commands[name]) return;
		if (!fn) {
			this.commands[name] = [];
			delete this.commands[name];
		} else {
			let index = this.commands[name].find((item) => {
				return item === fn;
			});
			if (index !== -1) this.commands[name].splice(index, 1);
		}
	}
	addHistory() {
		if (this.mindMap.opt.readonly || this.isPause) return;
		const lastData = this.history.length > 0 ? this.history[this.activeHistoryIndex] : null;
		const data = this.getCopyData();
		if (lastData === data) return;
		if (lastData && JSON.stringify(lastData) === JSON.stringify(data)) return;
		this.emitDataUpdatesEvent(lastData, data);
		this.history = this.history.slice(0, this.activeHistoryIndex + 1);
		this.history.push(simpleDeepClone(data));
		if (this.history.length > this.mindMap.opt.maxHistoryCount) this.history.shift();
		this.activeHistoryIndex = this.history.length - 1;
		this.mindMap.emit("data_change", data);
		this.mindMap.emit("back_forward", this.activeHistoryIndex, this.history.length);
	}
	back(step = 1) {
		if (this.mindMap.opt.readonly) return;
		if (this.activeHistoryIndex - step >= 0) {
			const lastData = this.history[this.activeHistoryIndex];
			this.activeHistoryIndex -= step;
			this.mindMap.emit("back_forward", this.activeHistoryIndex, this.history.length);
			const data = simpleDeepClone(this.history[this.activeHistoryIndex]);
			this.emitDataUpdatesEvent(lastData, data);
			return data;
		}
	}
	forward(step = 1) {
		if (this.mindMap.opt.readonly) return;
		let len = this.history.length;
		if (this.activeHistoryIndex + step <= len - 1) {
			const lastData = this.history[this.activeHistoryIndex];
			this.activeHistoryIndex += step;
			this.mindMap.emit("back_forward", this.activeHistoryIndex, this.history.length);
			const data = simpleDeepClone(this.history[this.activeHistoryIndex]);
			this.emitDataUpdatesEvent(lastData, data);
			return data;
		}
	}
	getCopyData() {
		if (!this.mindMap.renderer.renderTree) return null;
		const res = copyRenderTree({}, this.mindMap.renderer.renderTree, true);
		res.smmVersion = version;
		return res;
	}
	removeDataUid(data) {
		data = simpleDeepClone(data);
		let walk = (root) => {
			delete root.data.uid;
			if (root.children && root.children.length > 0) root.children.forEach((item) => {
				walk(item);
			});
		};
		walk(data);
		return data;
	}
	emitDataUpdatesEvent(lastData, data) {
		try {
			const eventName = "data_change_detail";
			if (this.mindMap.event.listenerCount(eventName) > 0 && lastData && data) {
				const lastDataObj = simpleDeepClone(transformTreeDataToObject(lastData));
				const dataObj = simpleDeepClone(transformTreeDataToObject(data));
				const res = [];
				const walkReplace = (root, obj) => {
					if (root.children && root.children.length > 0) root.children.forEach((childUid, index) => {
						root.children[index] = typeof childUid === "string" ? obj[childUid] : obj[childUid.data.uid];
						walkReplace(root.children[index], obj);
					});
					return root;
				};
				Object.keys(dataObj).forEach((uid) => {
					if (!lastDataObj[uid]) res.push({
						action: "create",
						data: walkReplace(dataObj[uid], dataObj)
					});
					else if (!isSameObject(lastDataObj[uid], dataObj[uid])) res.push({
						action: "update",
						oldData: walkReplace(lastDataObj[uid], lastDataObj),
						data: walkReplace(dataObj[uid], dataObj)
					});
				});
				Object.keys(lastDataObj).forEach((uid) => {
					if (!dataObj[uid]) res.push({
						action: "delete",
						data: walkReplace(lastDataObj[uid], lastDataObj)
					});
				});
				this.mindMap.emit(eventName, res);
			}
		} catch (error) {
			this.mindMap.opt.errorHandler(ERROR_TYPES.DATA_CHANGE_DETAIL_EVENT_ERROR, error);
		}
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/utils/BatchExecution.js
var BatchExecution = class {
	constructor() {
		this.has = {};
		this.queue = [];
		this.nextTick = nextTick(this.flush, this);
	}
	push(name, fn) {
		if (this.has[name]) {
			this.replaceTask(name, fn);
			return;
		}
		this.has[name] = true;
		this.queue.push({
			name,
			fn
		});
		this.nextTick();
	}
	replaceTask(name, fn) {
		const index = this.queue.findIndex((item) => {
			return item.name === name;
		});
		if (index !== -1) this.queue[index] = {
			name,
			fn
		};
	}
	flush() {
		let fns = this.queue.slice(0);
		this.queue = [];
		fns.forEach(({ name, fn }) => {
			this.has[name] = false;
			fn();
		});
	}
};
//#endregion
//#region node_modules/simple-mind-map/src/constants/defaultOptions.js
var defaultOpt = {
	el: null,
	data: null,
	viewData: null,
	readonly: false,
	layout: CONSTANTS.LAYOUT.LOGICAL_STRUCTURE,
	fishboneDeg: 45,
	theme: "default",
	themeConfig: {},
	scaleRatio: .2,
	translateRatio: 1,
	minZoomRatio: 20,
	maxZoomRatio: 400,
	customCheckIsTouchPad: null,
	mouseScaleCenterUseMousePosition: true,
	maxTag: 5,
	expandBtnSize: 20,
	imgTextMargin: 5,
	textContentMargin: 2,
	customNoteContentShow: null,
	textAutoWrapWidth: 500,
	customHandleMousewheel: null,
	mousewheelAction: CONSTANTS.MOUSE_WHEEL_ACTION.MOVE,
	mousewheelMoveStep: 100,
	mousewheelZoomActionReverse: true,
	defaultInsertSecondLevelNodeText: "二级节点",
	defaultInsertBelowSecondLevelNodeText: "分支主题",
	expandBtnStyle: {
		color: "#808080",
		fill: "#fff",
		fontSize: 13,
		strokeColor: "#333333"
	},
	expandBtnIcon: {
		open: "",
		close: ""
	},
	expandBtnNumHandler: null,
	isShowExpandNum: true,
	enableShortcutOnlyWhenMouseInSvg: true,
	customCheckEnableShortcut: null,
	initRootNodePosition: null,
	nodeTextEditZIndex: 3e3,
	nodeNoteTooltipZIndex: 3e3,
	isEndNodeTextEditOnClickOuter: true,
	maxHistoryCount: 500,
	alwaysShowExpandBtn: false,
	notShowExpandBtn: false,
	iconList: [],
	maxNodeCacheCount: 1e3,
	fitPadding: 50,
	enableCtrlKeyNodeSelection: true,
	useLeftKeySelectionRightKeyDrag: false,
	beforeTextEdit: null,
	isUseCustomNodeContent: false,
	customCreateNodeContent: null,
	customInnerElsAppendTo: null,
	enableAutoEnterTextEditWhenKeydown: false,
	autoEmptyTextWhenKeydownEnterEdit: false,
	customHandleClipboardText: null,
	disableMouseWheelZoom: false,
	errorHandler: (code, error) => {
		console.error(code, error);
	},
	enableDblclickBackToRootNode: false,
	hoverRectColor: "rgb(94, 200, 248)",
	hoverRectPadding: 2,
	selectTextOnEnterEditText: false,
	deleteNodeActive: true,
	fit: false,
	tagsColorMap: {},
	cooperateStyle: {
		avatarSize: 22,
		fontSize: 12
	},
	onlyOneEnableActiveNodeOnCooperate: false,
	defaultGeneralizationText: "概要",
	handleIsSplitByWrapOnPasteCreateNewNode: null,
	addHistoryTime: 100,
	isDisableDrag: false,
	createNewNodeBehavior: CONSTANTS.CREATE_NEW_NODE_BEHAVIOR.DEFAULT,
	defaultNodeImage: "",
	isLimitMindMapInCanvas: false,
	handleNodePasteImg: null,
	customCreateNodePath: null,
	customCreateNodePolygon: null,
	customTransformNodeLinePath: null,
	beforeShortcutRun: null,
	resetScaleOnMoveNodeToCenter: false,
	createNodePrefixContent: null,
	createNodePostfixContent: null,
	disabledClipboard: false,
	customHyperlinkJump: null,
	openPerformance: false,
	performanceConfig: {
		time: 250,
		padding: 100,
		removeNodeWhenOutCanvas: true
	},
	emptyTextMeasureHeightText: "abc123我和你",
	openRealtimeRenderOnNodeTextEdit: false,
	mousedownEventPreventDefault: false,
	onlyPasteTextWhenHasImgAndText: true,
	enableDragModifyNodeWidth: true,
	minNodeTextModifyWidth: 20,
	maxNodeTextModifyWidth: -1,
	customHandleLine: null,
	addHistoryOnInit: true,
	noteIcon: {
		icon: "",
		style: {}
	},
	hyperlinkIcon: {
		icon: "",
		style: {}
	},
	attachmentIcon: {
		icon: "",
		style: {}
	},
	isShowCreateChildBtnIcon: true,
	quickCreateChildBtnIcon: {
		icon: "",
		style: {}
	},
	customQuickCreateChildBtnClick: null,
	addCustomContentToNode: null,
	enableInheritAncestorLineStyle: true,
	selectTranslateStep: 3,
	selectTranslateLimit: 20,
	enableFreeDrag: false,
	autoMoveWhenMouseInEdgeOnDrag: true,
	dragMultiNodeRectConfig: {
		width: 40,
		height: 20,
		fill: "rgb(94, 200, 248)"
	},
	dragPlaceholderRectFill: "rgb(94, 200, 248)",
	dragPlaceholderLineConfig: {
		color: "rgb(94, 200, 248)",
		width: 2
	},
	dragOpacityConfig: {
		cloneNodeOpacity: .5,
		beingDragNodeOpacity: .3
	},
	handleDragCloneNode: null,
	beforeDragEnd: null,
	beforeDragStart: null,
	watermarkConfig: {
		onlyExport: false,
		text: "",
		lineSpacing: 100,
		textSpacing: 100,
		angle: 30,
		textStyle: {
			color: "#999",
			opacity: .5,
			fontSize: 14
		},
		belowNode: false
	},
	exportPaddingX: 10,
	exportPaddingY: 10,
	resetCss: `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
  `,
	minExportImgCanvasScale: 2,
	addContentToHeader: null,
	addContentToFooter: null,
	handleBeingExportSvg: null,
	maxCanvasSize: 16384,
	defaultAssociativeLineText: "关联",
	associativeLineIsAlwaysAboveNode: true,
	associativeLineInitPointsPosition: {
		from: "",
		to: ""
	},
	enableAdjustAssociativeLinePoints: true,
	beforeAssociativeLineConnection: null,
	disableTouchZoom: false,
	minTouchZoomScale: 20,
	maxTouchZoomScale: -1,
	isLimitMindMapInCanvasWhenHasScrollbar: true,
	isOnlySearchCurrentRenderNodes: false,
	beforeCooperateUpdate: null,
	rainbowLinesConfig: {
		open: false,
		colorsList: []
	},
	demonstrateConfig: null,
	enableEditFormulaInRichTextEdit: true,
	katexFontPath: "https://unpkg.com/katex@0.16.11/dist/",
	getKatexOutputType: null,
	transformRichTextOnEnterEdit: null,
	beforeHideRichTextEdit: null,
	outerFramePaddingX: 10,
	outerFramePaddingY: 10,
	onlyPainterNodeCustomStyles: false,
	beforeDeleteNodeImg: null,
	imgResizeBtnSize: 25,
	minImgResizeWidth: 50,
	minImgResizeHeight: 50,
	maxImgResizeWidthInheritTheme: false,
	maxImgResizeWidth: Infinity,
	maxImgResizeHeight: Infinity,
	customDeleteBtnInnerHTML: "",
	customResizeBtnInnerHTML: ""
};
//#endregion
//#region node_modules/simple-mind-map/index.js
var MindMap = class MindMap {
	/**
	*
	* @param {defaultOpt} opt
	*/
	constructor(opt = {}) {
		MindMap.instanceCount++;
		this.opt = this.handleOpt((0, import_cjs.default)(defaultOpt, opt));
		this.opt.data = this.handleData(this.opt.data);
		this.el = this.opt.el;
		if (!this.el) throw new Error("缺少容器元素el");
		this.getElRectInfo();
		this.initWidth = this.width;
		this.initHeight = this.height;
		this.cssEl = null;
		this.cssTextMap = {};
		this.nodeInnerPrefixList = [];
		this.initContainer();
		this.initTheme();
		this.initCache();
		this.event = new Event({ mindMap: this });
		this.keyCommand = new KeyCommand({ mindMap: this });
		this.command = new Command({ mindMap: this });
		this.renderer = new Render({ mindMap: this });
		this.view = new View({ mindMap: this });
		this.batchExecution = new BatchExecution();
		MindMap.pluginList.forEach((plugin) => {
			this.initPlugin(plugin);
		});
		this.addCss();
		this.render(this.opt.fit ? () => this.view.fit() : () => {});
		if (this.opt.addHistoryOnInit && this.opt.data) this.command.addHistory();
	}
	handleOpt(opt) {
		if (!layoutValueList.includes(opt.layout)) opt.layout = CONSTANTS.LAYOUT.LOGICAL_STRUCTURE;
		opt.theme = opt.theme && theme_default[opt.theme] ? opt.theme : "default";
		return opt;
	}
	handleData(data) {
		if (isUndef(data) || Object.keys(data).length <= 0) return null;
		data = simpleDeepClone(data || {});
		if (data.data && !data.data.expand) data.data.expand = true;
		createUidForAppointNodes([data], false, null, true);
		return data;
	}
	initContainer() {
		const { associativeLineIsAlwaysAboveNode } = this.opt;
		this.el.classList.add("smm-mind-map-container");
		const createAssociativeLineDraw = () => {
			this.associativeLineDraw = this.draw.group();
			this.associativeLineDraw.addClass("smm-associative-line-container");
		};
		this.svg = SVG().addTo(this.el).size(this.width, this.height);
		this.draw = this.svg.group();
		this.draw.addClass("smm-container");
		this.lineDraw = this.draw.group();
		this.lineDraw.addClass("smm-line-container");
		if (!associativeLineIsAlwaysAboveNode) createAssociativeLineDraw();
		this.nodeDraw = this.draw.group();
		this.nodeDraw.addClass("smm-node-container");
		if (associativeLineIsAlwaysAboveNode) createAssociativeLineDraw();
		this.otherDraw = this.draw.group();
		this.otherDraw.addClass("smm-other-container");
	}
	clearDraw() {
		this.lineDraw.clear();
		this.associativeLineDraw.clear();
		this.nodeDraw.clear();
		this.otherDraw.clear();
	}
	appendCss(key, str) {
		this.cssTextMap[key] = str;
		this.removeCss();
		this.addCss();
	}
	removeAppendCss(key) {
		if (this.cssTextMap[key]) {
			delete this.cssTextMap[key];
			this.removeCss();
			this.addCss();
		}
	}
	joinCss() {
		return cssContent + Object.keys(this.cssTextMap).map((key) => {
			return this.cssTextMap[key];
		}).join("\n");
	}
	addCss() {
		this.cssEl = document.createElement("style");
		this.cssEl.type = "text/css";
		this.cssEl.innerHTML = this.joinCss();
		document.head.appendChild(this.cssEl);
	}
	removeCss() {
		if (this.cssEl) document.head.removeChild(this.cssEl);
	}
	render(callback, source = "") {
		this.batchExecution.push("render", () => {
			this.initTheme();
			this.renderer.render(callback, source);
		});
	}
	reRender(callback, source = "") {
		this.renderer.reRender = true;
		this.renderer.clearCache();
		this.clearDraw();
		this.render(callback, source);
	}
	getElRectInfo() {
		this.elRect = this.el.getBoundingClientRect();
		this.width = this.elRect.width;
		this.height = this.elRect.height;
		if (this.width <= 0 || this.height <= 0) throw new Error("容器元素el的宽高不能为0");
	}
	resize() {
		const oldWidth = this.width;
		const oldHeight = this.height;
		this.getElRectInfo();
		this.svg.size(this.width, this.height);
		if (oldWidth !== this.width || oldHeight !== this.height) if (this.demonstrate) {
			if (!this.demonstrate.isInDemonstrate) this.render();
		} else this.render();
		this.emit("resize");
	}
	on(event, fn) {
		this.event.on(event, fn);
	}
	emit(event, ...args) {
		this.event.emit(event, ...args);
	}
	off(event, fn) {
		this.event.off(event, fn);
	}
	initCache() {
		this.commonCaches = {
			measureCustomNodeContentSizeEl: null,
			measureRichtextNodeTextSizeEl: null
		};
	}
	initTheme() {
		this.themeConfig = mergeTheme(theme_default[this.opt.theme] || theme_default.default, this.opt.themeConfig);
		Style.setBackgroundStyle(this.el, this.themeConfig);
	}
	setTheme(theme, notRender = false) {
		this.execCommand("CLEAR_ACTIVE_NODE");
		this.opt.theme = theme;
		if (!notRender) this.render(null, CONSTANTS.CHANGE_THEME);
		this.emit("view_theme_change", theme);
	}
	getTheme() {
		return this.opt.theme;
	}
	setThemeConfig(config, notRender = false) {
		const changedConfig = getObjectChangedProps(this.themeConfig, config);
		this.opt.themeConfig = config;
		if (!notRender) {
			const res = checkIsNodeSizeIndependenceConfig(changedConfig);
			this.render(null, res ? "" : CONSTANTS.CHANGE_THEME);
		}
	}
	getCustomThemeConfig() {
		return this.opt.themeConfig;
	}
	getThemeConfig(prop) {
		return prop === void 0 ? this.themeConfig : this.themeConfig[prop];
	}
	getConfig(prop) {
		return prop === void 0 ? this.opt : this.opt[prop];
	}
	updateConfig(opt = {}) {
		this.emit("before_update_config", this.opt);
		const lastOpt = { ...this.opt };
		this.opt = this.handleOpt(import_cjs.default.all([
			defaultOpt,
			this.opt,
			opt
		]));
		this.emit("after_update_config", this.opt, lastOpt);
	}
	getLayout() {
		return this.opt.layout;
	}
	setLayout(layout, notRender = false) {
		if (!layoutValueList.includes(layout)) layout = CONSTANTS.LAYOUT.LOGICAL_STRUCTURE;
		this.opt.layout = layout;
		this.view.reset();
		this.renderer.setLayout();
		if (!notRender) this.render(null, CONSTANTS.CHANGE_LAYOUT);
		this.emit("layout_change", layout);
	}
	execCommand(...args) {
		this.command.exec(...args);
	}
	updateData(data) {
		data = this.handleData(data);
		this.emit("before_update_data", data);
		this.renderer.setData(data);
		this.render();
		this.command.addHistory();
		this.emit("update_data", data);
	}
	setData(data) {
		data = this.handleData(data);
		this.emit("before_set_data", data);
		this.opt.data = data;
		this.execCommand("CLEAR_ACTIVE_NODE");
		this.command.clearHistory();
		this.command.addHistory();
		this.renderer.setData(data);
		this.reRender(() => {}, CONSTANTS.SET_DATA);
		this.emit("set_data", data);
	}
	setFullData(data) {
		if (data.root) this.setData(data.root);
		if (data.layout) this.setLayout(data.layout);
		if (data.theme) {
			if (data.theme.template) this.setTheme(data.theme.template);
			if (data.theme.config) this.setThemeConfig(data.theme.config);
		}
		if (data.view) this.view.setTransformData(data.view);
	}
	getData(withConfig) {
		let nodeData = this.command.getCopyData();
		let data = {};
		if (withConfig) data = {
			layout: this.getLayout(),
			root: nodeData,
			theme: {
				template: this.getTheme(),
				config: this.getCustomThemeConfig()
			},
			view: this.view.getTransformData()
		};
		else data = nodeData;
		return simpleDeepClone(data);
	}
	async export(...args) {
		try {
			if (!this.doExport) throw new Error("请注册Export插件！");
			return await this.doExport.export(...args);
		} catch (error) {
			this.opt.errorHandler(ERROR_TYPES.EXPORT_ERROR, error);
		}
	}
	toPos(x, y) {
		return {
			x: x - this.elRect.left,
			y: y - this.elRect.top
		};
	}
	setMode(mode) {
		if (![CONSTANTS.MODE.READONLY, CONSTANTS.MODE.EDIT].includes(mode)) return;
		const isReadonly = mode === CONSTANTS.MODE.READONLY;
		if (isReadonly === this.opt.readonly) return;
		if (isReadonly) {
			if (this.renderer.textEdit.isShowTextEdit()) {
				this.renderer.textEdit.hideEditTextBox();
				this.command.originAddHistory();
			}
			this.execCommand("CLEAR_ACTIVE_NODE");
		}
		this.opt.readonly = isReadonly;
		if (!isReadonly && this.command.history.length <= 0) this.command.originAddHistory();
		this.emit("mode_change", mode);
	}
	getSvgData({ paddingX = 0, paddingY = 0, ignoreWatermark = false, addContentToHeader, addContentToFooter, node } = {}) {
		const { watermarkConfig, openPerformance } = this.opt;
		if (openPerformance) this.renderer.forceLoadNode(node);
		const { cssTextList, header, headerHeight, footer, footerHeight } = handleGetSvgDataExtraContent({
			addContentToHeader,
			addContentToFooter
		});
		const svg = this.svg;
		const draw = this.draw;
		const origWidth = svg.width();
		const origHeight = svg.height();
		const origTransform = draw.transform();
		const elRect = this.elRect;
		draw.scale(1 / origTransform.scaleX, 1 / origTransform.scaleY);
		const rect = draw.rbox();
		let clipData = null;
		if (node) clipData = getNodeTreeBoundingRect(node, rect.x, rect.y, paddingX, paddingY);
		const fixHeight = 0;
		rect.width += paddingX * 2;
		rect.height += paddingY * 2 + fixHeight + headerHeight + footerHeight;
		draw.translate(paddingX, paddingY);
		svg.size(rect.width, rect.height);
		draw.translate(-rect.x + elRect.left, -rect.y + elRect.top);
		let clone = svg.clone();
		const hasWatermark = this.watermark && this.watermark.hasWatermark();
		if (!ignoreWatermark && hasWatermark) {
			this.watermark.isInExport = true;
			const { onlyExport } = watermarkConfig;
			if (rect.width > origWidth || rect.height > origHeight) {
				this.width = rect.width;
				this.height = rect.height;
				this.watermark.onResize();
				clone = svg.clone();
				this.width = origWidth;
				this.height = origHeight;
				this.watermark.onResize();
			} else if (onlyExport) {
				this.watermark.onResize();
				clone = svg.clone();
			}
			if (onlyExport) this.watermark.clear();
			this.watermark.isInExport = false;
		}
		[this.joinCss(), ...cssTextList].forEach((s) => {
			clone.add(SVG(`<style>${s}</style>`));
		});
		if (header && headerHeight > 0) {
			clone.findOne(".smm-container").translate(0, headerHeight);
			header.width(rect.width);
			header.y(paddingY);
			clone.add(header, 0);
		}
		if (footer && footerHeight > 0) {
			footer.width(rect.width);
			footer.y(rect.height - paddingY - footerHeight);
			clone.add(footer);
		}
		const defs = svg.find("defs");
		const defs2 = clone.find("defs");
		defs.forEach((def, defIndex) => {
			const def2 = defs2[defIndex];
			if (!def2) return;
			const children = def.children();
			const children2 = def2.children();
			for (let i = 0; i < children.length; i++) {
				const child = children[i];
				const child2 = children2[i];
				if (child && child2) child2.attr("id", child.attr("id"));
			}
		});
		svg.size(origWidth, origHeight);
		draw.transform(origTransform);
		return {
			svg: clone,
			svgHTML: clone.svg(),
			clipData,
			rect: {
				...rect,
				ratio: rect.width / rect.height
			},
			origWidth,
			origHeight,
			scaleX: origTransform.scaleX,
			scaleY: origTransform.scaleY
		};
	}
	addPlugin(plugin, opt) {
		if (MindMap.hasPlugin(plugin) === -1) MindMap.usePlugin(plugin, opt);
		this.initPlugin(plugin);
	}
	removePlugin(plugin) {
		let index = MindMap.hasPlugin(plugin);
		if (index !== -1) {
			MindMap.pluginList.splice(index, 1);
			if (this[plugin.instanceName]) {
				if (this[plugin.instanceName].beforePluginRemove) this[plugin.instanceName].beforePluginRemove();
				delete this[plugin.instanceName];
			}
		}
	}
	initPlugin(plugin) {
		if (this[plugin.instanceName]) return;
		this[plugin.instanceName] = new plugin({
			mindMap: this,
			pluginOpt: plugin.pluginOpt
		});
	}
	destroy() {
		this.emit("beforeDestroy");
		this.renderer.textEdit.hideEditTextBox();
		this.renderer.textEdit.removeTextEditEl();
		[...MindMap.pluginList].forEach((plugin) => {
			if (this[plugin.instanceName] && this[plugin.instanceName].beforePluginDestroy) this[plugin.instanceName].beforePluginDestroy();
			this[plugin.instanceName] = null;
		});
		this.event.unbind();
		this.svg.remove();
		Style.removeBackgroundStyle(this.el);
		this.el.classList.remove("smm-mind-map-container");
		this.el.innerHTML = "";
		this.el = null;
		this.removeCss();
		MindMap.instanceCount--;
	}
};
MindMap.pluginList = [];
MindMap.usePlugin = (plugin, opt = {}) => {
	if (MindMap.hasPlugin(plugin) !== -1) return MindMap;
	plugin.pluginOpt = opt;
	MindMap.pluginList.push(plugin);
	return MindMap;
};
MindMap.hasPlugin = (plugin) => {
	return MindMap.pluginList.findIndex((item) => {
		return item === plugin;
	});
};
MindMap.instanceCount = 0;
MindMap.defineTheme = (name, config = {}) => {
	if (theme_default[name]) return /* @__PURE__ */ new Error("该主题名称已存在");
	theme_default[name] = mergeTheme(default_default, config);
};
MindMap.removeTheme = (name) => {
	if (theme_default[name]) theme_default[name] = null;
};
//#endregion
export { MindMap as default };
