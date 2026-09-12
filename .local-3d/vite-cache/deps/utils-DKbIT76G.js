import { o as __toESM, t as __commonJSMin } from "./rolldown-runtime-D1cXj70v.js";
//#region node_modules/simple-mind-map/src/constants/constant.js
var CONSTANTS = {
	CHANGE_THEME: "changeTheme",
	CHANGE_LAYOUT: "changeLayout",
	SET_DATA: "setData",
	MODE: {
		READONLY: "readonly",
		EDIT: "edit"
	},
	LAYOUT: {
		LOGICAL_STRUCTURE: "logicalStructure",
		LOGICAL_STRUCTURE_LEFT: "logicalStructureLeft",
		MIND_MAP: "mindMap",
		ORGANIZATION_STRUCTURE: "organizationStructure",
		CATALOG_ORGANIZATION: "catalogOrganization",
		TIMELINE: "timeline",
		TIMELINE2: "timeline2",
		FISHBONE: "fishbone",
		VERTICAL_TIMELINE: "verticalTimeline"
	},
	DIR: {
		UP: "up",
		LEFT: "left",
		DOWN: "down",
		RIGHT: "right"
	},
	KEY_DIR: {
		LEFT: "Left",
		UP: "Up",
		RIGHT: "Right",
		DOWN: "Down"
	},
	SHAPE: {
		RECTANGLE: "rectangle",
		DIAMOND: "diamond",
		PARALLELOGRAM: "parallelogram",
		ROUNDED_RECTANGLE: "roundedRectangle",
		OCTAGONAL_RECTANGLE: "octagonalRectangle",
		OUTER_TRIANGULAR_RECTANGLE: "outerTriangularRectangle",
		INNER_TRIANGULAR_RECTANGLE: "innerTriangularRectangle",
		ELLIPSE: "ellipse",
		CIRCLE: "circle"
	},
	MOUSE_WHEEL_ACTION: {
		ZOOM: "zoom",
		MOVE: "move"
	},
	INIT_ROOT_NODE_POSITION: {
		LEFT: "left",
		TOP: "top",
		RIGHT: "right",
		BOTTOM: "bottom",
		CENTER: "center"
	},
	LAYOUT_GROW_DIR: {
		LEFT: "left",
		TOP: "top",
		RIGHT: "right",
		BOTTOM: "bottom"
	},
	PASTE_TYPE: {
		CLIP_BOARD: "clipBoard",
		CANVAS: "canvas"
	},
	SCROLL_BAR_DIR: {
		VERTICAL: "vertical",
		HORIZONTAL: "horizontal"
	},
	CREATE_NEW_NODE_BEHAVIOR: {
		DEFAULT: "default",
		NOT_ACTIVE: "notActive",
		ACTIVE_ONLY: "activeOnly"
	},
	TAG_PLACEMENT: {
		RIGHT: "right",
		BOTTOM: "bottom"
	},
	IMG_PLACEMENT: {
		LEFT: "left",
		TOP: "top",
		RIGHT: "right",
		BOTTOM: "bottom"
	},
	EDIT_NODE_CLASS: {
		SMM_NODE_EDIT_WRAP: "smm-node-edit-wrap",
		RICH_TEXT_EDIT_WRAP: "ql-editor",
		ASSOCIATIVE_LINE_TEXT_EDIT_WRAP: "associative-line-text-edit-warp"
	}
};
var initRootNodePositionMap = {
	[CONSTANTS.INIT_ROOT_NODE_POSITION.LEFT]: 0,
	[CONSTANTS.INIT_ROOT_NODE_POSITION.TOP]: 0,
	[CONSTANTS.INIT_ROOT_NODE_POSITION.RIGHT]: 1,
	[CONSTANTS.INIT_ROOT_NODE_POSITION.BOTTOM]: 1,
	[CONSTANTS.INIT_ROOT_NODE_POSITION.CENTER]: .5
};
CONSTANTS.LAYOUT.LOGICAL_STRUCTURE, CONSTANTS.LAYOUT.LOGICAL_STRUCTURE_LEFT, CONSTANTS.LAYOUT.MIND_MAP, CONSTANTS.LAYOUT.ORGANIZATION_STRUCTURE, CONSTANTS.LAYOUT.CATALOG_ORGANIZATION, CONSTANTS.LAYOUT.TIMELINE, CONSTANTS.LAYOUT.TIMELINE2, CONSTANTS.LAYOUT.VERTICAL_TIMELINE, CONSTANTS.LAYOUT.FISHBONE;
var layoutValueList = [
	CONSTANTS.LAYOUT.LOGICAL_STRUCTURE,
	CONSTANTS.LAYOUT.LOGICAL_STRUCTURE_LEFT,
	CONSTANTS.LAYOUT.MIND_MAP,
	CONSTANTS.LAYOUT.CATALOG_ORGANIZATION,
	CONSTANTS.LAYOUT.ORGANIZATION_STRUCTURE,
	CONSTANTS.LAYOUT.TIMELINE,
	CONSTANTS.LAYOUT.TIMELINE2,
	CONSTANTS.LAYOUT.VERTICAL_TIMELINE,
	CONSTANTS.LAYOUT.FISHBONE
];
var nodeDataNoStylePropList = [
	"text",
	"image",
	"imageTitle",
	"imageSize",
	"icon",
	"tag",
	"hyperlink",
	"hyperlinkTitle",
	"note",
	"expand",
	"isActive",
	"generalization",
	"richText",
	"resetRichText",
	"uid",
	"activeStyle",
	"associativeLineTargets",
	"associativeLineTargetControlOffsets",
	"associativeLinePoint",
	"associativeLineText",
	"attachmentUrl",
	"attachmentName",
	"notation",
	"outerFrame",
	"number",
	"range",
	"customLeft",
	"customTop",
	"customTextWidth",
	"checkbox",
	"dir",
	"needUpdate"
];
var ERROR_TYPES = {
	READ_CLIPBOARD_ERROR: "read_clipboard_error",
	PARSE_PASTE_DATA_ERROR: "parse_paste_data_error",
	CUSTOM_HANDLE_CLIPBOARD_TEXT_ERROR: "custom_handle_clipboard_text_error",
	LOAD_CLIPBOARD_IMAGE_ERROR: "load_clipboard_image_error",
	BEFORE_TEXT_EDIT_ERROR: "before_text_edit_error",
	EXPORT_ERROR: "export_error",
	EXPORT_LOAD_IMAGE_ERROR: "export_load_image_error",
	DATA_CHANGE_DETAIL_EVENT_ERROR: "data_change_detail_event_error"
};
var cssContent = `
  /* 鼠标hover和激活时渲染的矩形 */
  .smm-hover-node{
    display: none;
    opacity: 0.6;
    stroke-width: 1;
  }

  .smm-node:not(.smm-node-dragging):hover .smm-hover-node{
    display: block;
  }

  .smm-node.active .smm-hover-node, .smm-node-highlight .smm-hover-node{
    display: block;
    opacity: 1;
    stroke-width: 2;
  }

  .smm-text-node-wrap, .smm-expand-btn-text {
    user-select: none;
  }
`;
var selfCloseTagList = [
	"img",
	"br",
	"hr",
	"input",
	"link",
	"meta",
	"area"
];
var noneRichTextNodeLineHeight = 1.2;
var richTextSupportStyleList = [
	"fontFamily",
	"fontSize",
	"fontWeight",
	"fontStyle",
	"textDecoration",
	"color",
	"textAlign"
];
//#endregion
//#region node_modules/deepmerge/dist/cjs.js
var require_cjs = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isMergeableObject = function isMergeableObject(value) {
		return isNonNullObject(value) && !isSpecial(value);
	};
	function isNonNullObject(value) {
		return !!value && typeof value === "object";
	}
	function isSpecial(value) {
		var stringValue = Object.prototype.toString.call(value);
		return stringValue === "[object RegExp]" || stringValue === "[object Date]" || isReactElement(value);
	}
	var REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol.for ? Symbol.for("react.element") : 60103;
	function isReactElement(value) {
		return value.$$typeof === REACT_ELEMENT_TYPE;
	}
	function emptyTarget(val) {
		return Array.isArray(val) ? [] : {};
	}
	function cloneIfNecessary(value, optionsArgument) {
		return optionsArgument && optionsArgument.clone === true && isMergeableObject(value) ? deepmerge(emptyTarget(value), value, optionsArgument) : value;
	}
	function defaultArrayMerge(target, source, optionsArgument) {
		var destination = target.slice();
		source.forEach(function(e, i) {
			if (typeof destination[i] === "undefined") destination[i] = cloneIfNecessary(e, optionsArgument);
			else if (isMergeableObject(e)) destination[i] = deepmerge(target[i], e, optionsArgument);
			else if (target.indexOf(e) === -1) destination.push(cloneIfNecessary(e, optionsArgument));
		});
		return destination;
	}
	function mergeObject(target, source, optionsArgument) {
		var destination = {};
		if (isMergeableObject(target)) Object.keys(target).forEach(function(key) {
			destination[key] = cloneIfNecessary(target[key], optionsArgument);
		});
		Object.keys(source).forEach(function(key) {
			if (!isMergeableObject(source[key]) || !target[key]) destination[key] = cloneIfNecessary(source[key], optionsArgument);
			else destination[key] = deepmerge(target[key], source[key], optionsArgument);
		});
		return destination;
	}
	function deepmerge(target, source, optionsArgument) {
		var sourceIsArray = Array.isArray(source);
		var targetIsArray = Array.isArray(target);
		var options = optionsArgument || { arrayMerge: defaultArrayMerge };
		if (!(sourceIsArray === targetIsArray)) return cloneIfNecessary(source, optionsArgument);
		else if (sourceIsArray) return (options.arrayMerge || defaultArrayMerge)(target, source, optionsArgument);
		else return mergeObject(target, source, optionsArgument);
	}
	deepmerge.all = function deepmergeAll(array, optionsArgument) {
		if (!Array.isArray(array) || array.length < 2) throw new Error("first argument should be an array with at least two elements");
		return array.reduce(function(prev, next) {
			return deepmerge(prev, next, optionsArgument);
		});
	};
	module.exports = deepmerge;
}));
//#endregion
//#region node_modules/uuid/dist/esm-browser/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) byteToHex.push((i + 256).toString(16).slice(1));
function unsafeStringify(arr, offset = 0) {
	return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
//#endregion
//#region node_modules/uuid/dist/esm-browser/rng.js
var getRandomValues;
var rnds8 = /* @__PURE__ */ new Uint8Array(16);
function rng() {
	if (!getRandomValues) {
		if (typeof crypto === "undefined" || !crypto.getRandomValues) throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
		getRandomValues = crypto.getRandomValues.bind(crypto);
	}
	return getRandomValues(rnds8);
}
var native_default = { randomUUID: typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto) };
//#endregion
//#region node_modules/uuid/dist/esm-browser/v4.js
function v4(options, buf, offset) {
	if (native_default.randomUUID && !buf && !options) return native_default.randomUUID();
	options = options || {};
	const rnds = options.random ?? options.rng?.() ?? rng();
	if (rnds.length < 16) throw new Error("Random bytes length must be >= 16");
	rnds[6] = rnds[6] & 15 | 64;
	rnds[8] = rnds[8] & 63 | 128;
	if (buf) {
		offset = offset || 0;
		if (offset < 0 || offset + 16 > buf.length) throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
		for (let i = 0; i < 16; ++i) buf[offset + i] = rnds[i];
		return buf;
	}
	return unsafeStringify(rnds);
}
//#endregion
//#region node_modules/simple-mind-map/src/utils/mersenneTwister.js
/**
* @description 为了保证相同的内容每次生成的随机数都是一样的，我们可以使用一个伪随机数生成器（PRNG），并使用内容的哈希值作为种子。以下是一个使用Mersenne Twister算法的PRNG的实现：
*
* @param {*} seed
*/
function MersenneTwister(seed) {
	this.N = 624;
	this.M = 397;
	this.MATRIX_A = 2567483615;
	this.UPPER_MASK = 2147483648;
	this.LOWER_MASK = 2147483647;
	this.mt = new Array(this.N);
	this.mti = this.N + 1;
	this.init_genrand(seed);
}
MersenneTwister.prototype.init_genrand = function(s) {
	this.mt[0] = s >>> 0;
	for (this.mti = 1; this.mti < this.N; this.mti++) {
		s = this.mt[this.mti - 1] ^ this.mt[this.mti - 1] >>> 30;
		this.mt[this.mti] = (((s & 4294901760) >>> 16) * 1812433253 << 16) + (s & 65535) * 1812433253 + this.mti;
		this.mt[this.mti] >>>= 0;
	}
};
MersenneTwister.prototype.genrand_int32 = function() {
	var y;
	var mag01 = new Array(0, this.MATRIX_A);
	if (this.mti >= this.N) {
		var kk;
		if (this.mti == this.N + 1) this.init_genrand(5489);
		for (kk = 0; kk < this.N - this.M; kk++) {
			y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;
			this.mt[kk] = this.mt[kk + this.M] ^ y >>> 1 ^ mag01[y & 1];
		}
		for (; kk < this.N - 1; kk++) {
			y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;
			this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ y >>> 1 ^ mag01[y & 1];
		}
		y = this.mt[this.N - 1] & this.UPPER_MASK | this.mt[0] & this.LOWER_MASK;
		this.mt[this.N - 1] = this.mt[this.M - 1] ^ y >>> 1 ^ mag01[y & 1];
		this.mti = 0;
	}
	y = this.mt[this.mti++];
	y ^= y >>> 11;
	y ^= y << 7 & 2636928640;
	y ^= y << 15 & 4022730752;
	y ^= y >>> 18;
	return y >>> 0;
};
//#endregion
//#region node_modules/@svgdotjs/svg.js/dist/svg.esm.js
/*!
* @svgdotjs/svg.js - A lightweight library for manipulating and animating SVG.
* @version 3.2.0
* https://svgjs.dev/
*
* @copyright Wout Fierens <wout@mick-wout.com>
* @license MIT
*
* BUILT: Mon Jun 12 2023 10:34:51 GMT+0200 (Central European Summer Time)
*/
var methods$1 = {};
var names = [];
function registerMethods(name, m) {
	if (Array.isArray(name)) {
		for (const _name of name) registerMethods(_name, m);
		return;
	}
	if (typeof name === "object") {
		for (const _name in name) registerMethods(_name, name[_name]);
		return;
	}
	addMethodNames(Object.getOwnPropertyNames(m));
	methods$1[name] = Object.assign(methods$1[name] || {}, m);
}
function getMethodsFor(name) {
	return methods$1[name] || {};
}
function getMethodNames() {
	return [...new Set(names)];
}
function addMethodNames(_names) {
	names.push(..._names);
}
function map(array, block) {
	let i;
	const il = array.length;
	const result = [];
	for (i = 0; i < il; i++) result.push(block(array[i]));
	return result;
}
function filter(array, block) {
	let i;
	const il = array.length;
	const result = [];
	for (i = 0; i < il; i++) if (block(array[i])) result.push(array[i]);
	return result;
}
function radians(d) {
	return d % 360 * Math.PI / 180;
}
function camelCase(s) {
	return s.toLowerCase().replace(/-(.)/g, function(m, g) {
		return g.toUpperCase();
	});
}
function unCamelCase(s) {
	return s.replace(/([A-Z])/g, function(m, g) {
		return "-" + g.toLowerCase();
	});
}
function capitalize(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
function proportionalSize(element, width, height, box) {
	if (width == null || height == null) {
		box = box || element.bbox();
		if (width == null) width = box.width / box.height * height;
		else if (height == null) height = box.height / box.width * width;
	}
	return {
		width,
		height
	};
}
/**
* This function adds support for string origins.
* It searches for an origin in o.origin o.ox and o.originX.
* This way, origin: {x: 'center', y: 50} can be passed as well as ox: 'center', oy: 50
**/
function getOrigin(o, element) {
	const origin = o.origin;
	let ox = o.ox != null ? o.ox : o.originX != null ? o.originX : "center";
	let oy = o.oy != null ? o.oy : o.originY != null ? o.originY : "center";
	if (origin != null) [ox, oy] = Array.isArray(origin) ? origin : typeof origin === "object" ? [origin.x, origin.y] : [origin, origin];
	const condX = typeof ox === "string";
	const condY = typeof oy === "string";
	if (condX || condY) {
		const { height, width, x, y } = element.bbox();
		if (condX) ox = ox.includes("left") ? x : ox.includes("right") ? x + width : x + width / 2;
		if (condY) oy = oy.includes("top") ? y : oy.includes("bottom") ? y + height : y + height / 2;
	}
	return [ox, oy];
}
var svg = "http://www.w3.org/2000/svg";
var html = "http://www.w3.org/1999/xhtml";
var xmlns = "http://www.w3.org/2000/xmlns/";
var xlink = "http://www.w3.org/1999/xlink";
var svgjs = "http://svgjs.dev/svgjs";
var globals = {
	window: typeof window === "undefined" ? null : window,
	document: typeof document === "undefined" ? null : document
};
var Base = class {};
var elements = {};
var root = "___SYMBOL___ROOT___";
function create(name, ns = svg) {
	return globals.document.createElementNS(ns, name);
}
function makeInstance(element, isHTML = false) {
	if (element instanceof Base) return element;
	if (typeof element === "object") return adopter(element);
	if (element == null) return new elements[root]();
	if (typeof element === "string" && element.charAt(0) !== "<") return adopter(globals.document.querySelector(element));
	const wrapper = isHTML ? globals.document.createElement("div") : create("svg");
	wrapper.innerHTML = element;
	element = adopter(wrapper.firstChild);
	wrapper.removeChild(wrapper.firstChild);
	return element;
}
function nodeOrNew(name, node) {
	return node && node.ownerDocument && node instanceof node.ownerDocument.defaultView.Node ? node : create(name);
}
function adopt(node) {
	if (!node) return null;
	if (node.instance instanceof Base) return node.instance;
	if (node.nodeName === "#document-fragment") return new elements.Fragment(node);
	let className = capitalize(node.nodeName || "Dom");
	if (className === "LinearGradient" || className === "RadialGradient") className = "Gradient";
	else if (!elements[className]) className = "Dom";
	return new elements[className](node);
}
var adopter = adopt;
function register(element, name = element.name, asRoot = false) {
	elements[name] = element;
	if (asRoot) elements[root] = element;
	addMethodNames(Object.getOwnPropertyNames(element.prototype));
	return element;
}
function getClass(name) {
	return elements[name];
}
var did = 1e3;
function eid(name) {
	return "Svgjs" + capitalize(name) + did++;
}
function assignNewId(node) {
	for (let i = node.children.length - 1; i >= 0; i--) assignNewId(node.children[i]);
	if (node.id) {
		node.id = eid(node.nodeName);
		return node;
	}
	return node;
}
function extend(modules, methods) {
	let key, i;
	modules = Array.isArray(modules) ? modules : [modules];
	for (i = modules.length - 1; i >= 0; i--) for (key in methods) modules[i].prototype[key] = methods[key];
}
function wrapWithAttrCheck(fn) {
	return function(...args) {
		const o = args[args.length - 1];
		if (o && o.constructor === Object && !(o instanceof Array)) return fn.apply(this, args.slice(0, -1)).attr(o);
		else return fn.apply(this, args);
	};
}
function siblings() {
	return this.parent().children();
}
function position() {
	return this.parent().index(this);
}
function next() {
	return this.siblings()[this.position() + 1];
}
function prev() {
	return this.siblings()[this.position() - 1];
}
function forward() {
	const i = this.position();
	this.parent().add(this.remove(), i + 1);
	return this;
}
function backward() {
	const i = this.position();
	this.parent().add(this.remove(), i ? i - 1 : 0);
	return this;
}
function front() {
	this.parent().add(this.remove());
	return this;
}
function back() {
	this.parent().add(this.remove(), 0);
	return this;
}
function before(element) {
	element = makeInstance(element);
	element.remove();
	const i = this.position();
	this.parent().add(element, i);
	return this;
}
function after(element) {
	element = makeInstance(element);
	element.remove();
	const i = this.position();
	this.parent().add(element, i + 1);
	return this;
}
function insertBefore(element) {
	element = makeInstance(element);
	element.before(this);
	return this;
}
function insertAfter(element) {
	element = makeInstance(element);
	element.after(this);
	return this;
}
registerMethods("Dom", {
	siblings,
	position,
	next,
	prev,
	forward,
	backward,
	front,
	back,
	before,
	after,
	insertBefore,
	insertAfter
});
var numberAndUnit = /^([+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?)([a-z%]*)$/i;
var hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
var rgb = /rgb\((\d+),(\d+),(\d+)\)/;
var reference = /(#[a-z_][a-z0-9\-_]*)/i;
var transforms = /\)\s*,?\s*/;
var whitespace = /\s/g;
var isHex = /^#[a-f0-9]{3}$|^#[a-f0-9]{6}$/i;
var isRgb = /^rgb\(/;
var isBlank = /^(\s+)?$/;
var isNumber = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
var isImage = /\.(jpg|jpeg|png|gif|svg)(\?[^=]+.*)?/i;
var delimiter = /[\s,]+/;
var isPathLetter = /[MLHVCSQTAZ]/i;
function classes() {
	const attr = this.attr("class");
	return attr == null ? [] : attr.trim().split(delimiter);
}
function hasClass(name) {
	return this.classes().indexOf(name) !== -1;
}
function addClass(name) {
	if (!this.hasClass(name)) {
		const array = this.classes();
		array.push(name);
		this.attr("class", array.join(" "));
	}
	return this;
}
function removeClass(name) {
	if (this.hasClass(name)) this.attr("class", this.classes().filter(function(c) {
		return c !== name;
	}).join(" "));
	return this;
}
function toggleClass(name) {
	return this.hasClass(name) ? this.removeClass(name) : this.addClass(name);
}
registerMethods("Dom", {
	classes,
	hasClass,
	addClass,
	removeClass,
	toggleClass
});
function css(style, val) {
	const ret = {};
	if (arguments.length === 0) {
		this.node.style.cssText.split(/\s*;\s*/).filter(function(el) {
			return !!el.length;
		}).forEach(function(el) {
			const t = el.split(/\s*:\s*/);
			ret[t[0]] = t[1];
		});
		return ret;
	}
	if (arguments.length < 2) {
		if (Array.isArray(style)) {
			for (const name of style) {
				const cased = camelCase(name);
				ret[name] = this.node.style[cased];
			}
			return ret;
		}
		if (typeof style === "string") return this.node.style[camelCase(style)];
		if (typeof style === "object") for (const name in style) this.node.style[camelCase(name)] = style[name] == null || isBlank.test(style[name]) ? "" : style[name];
	}
	if (arguments.length === 2) this.node.style[camelCase(style)] = val == null || isBlank.test(val) ? "" : val;
	return this;
}
function show() {
	return this.css("display", "");
}
function hide() {
	return this.css("display", "none");
}
function visible() {
	return this.css("display") !== "none";
}
registerMethods("Dom", {
	css,
	show,
	hide,
	visible
});
function data(a, v, r) {
	if (a == null) return this.data(map(filter(this.node.attributes, (el) => el.nodeName.indexOf("data-") === 0), (el) => el.nodeName.slice(5)));
	else if (a instanceof Array) {
		const data = {};
		for (const key of a) data[key] = this.data(key);
		return data;
	} else if (typeof a === "object") for (v in a) this.data(v, a[v]);
	else if (arguments.length < 2) try {
		return JSON.parse(this.attr("data-" + a));
	} catch (e) {
		return this.attr("data-" + a);
	}
	else this.attr("data-" + a, v === null ? null : r === true || typeof v === "string" || typeof v === "number" ? v : JSON.stringify(v));
	return this;
}
registerMethods("Dom", { data });
function remember(k, v) {
	if (typeof arguments[0] === "object") for (const key in k) this.remember(key, k[key]);
	else if (arguments.length === 1) return this.memory()[k];
	else this.memory()[k] = v;
	return this;
}
function forget() {
	if (arguments.length === 0) this._memory = {};
	else for (let i = arguments.length - 1; i >= 0; i--) delete this.memory()[arguments[i]];
	return this;
}
function memory() {
	return this._memory = this._memory || {};
}
registerMethods("Dom", {
	remember,
	forget,
	memory
});
function sixDigitHex(hex) {
	return hex.length === 4 ? [
		"#",
		hex.substring(1, 2),
		hex.substring(1, 2),
		hex.substring(2, 3),
		hex.substring(2, 3),
		hex.substring(3, 4),
		hex.substring(3, 4)
	].join("") : hex;
}
function componentHex(component) {
	const hex = Math.max(0, Math.min(255, Math.round(component))).toString(16);
	return hex.length === 1 ? "0" + hex : hex;
}
function is(object, space) {
	for (let i = space.length; i--;) if (object[space[i]] == null) return false;
	return true;
}
function getParameters(a, b) {
	const params = is(a, "rgb") ? {
		_a: a.r,
		_b: a.g,
		_c: a.b,
		_d: 0,
		space: "rgb"
	} : is(a, "xyz") ? {
		_a: a.x,
		_b: a.y,
		_c: a.z,
		_d: 0,
		space: "xyz"
	} : is(a, "hsl") ? {
		_a: a.h,
		_b: a.s,
		_c: a.l,
		_d: 0,
		space: "hsl"
	} : is(a, "lab") ? {
		_a: a.l,
		_b: a.a,
		_c: a.b,
		_d: 0,
		space: "lab"
	} : is(a, "lch") ? {
		_a: a.l,
		_b: a.c,
		_c: a.h,
		_d: 0,
		space: "lch"
	} : is(a, "cmyk") ? {
		_a: a.c,
		_b: a.m,
		_c: a.y,
		_d: a.k,
		space: "cmyk"
	} : {
		_a: 0,
		_b: 0,
		_c: 0,
		space: "rgb"
	};
	params.space = b || params.space;
	return params;
}
function cieSpace(space) {
	if (space === "lab" || space === "xyz" || space === "lch") return true;
	else return false;
}
function hueToRgb(p, q, t) {
	if (t < 0) t += 1;
	if (t > 1) t -= 1;
	if (t < 1 / 6) return p + (q - p) * 6 * t;
	if (t < 1 / 2) return q;
	if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
	return p;
}
var Color = class Color {
	constructor(...inputs) {
		this.init(...inputs);
	}
	static isColor(color) {
		return color && (color instanceof Color || this.isRgb(color) || this.test(color));
	}
	static isRgb(color) {
		return color && typeof color.r === "number" && typeof color.g === "number" && typeof color.b === "number";
	}
	static random(mode = "vibrant", t, u) {
		const { random, round, sin, PI: pi } = Math;
		if (mode === "vibrant") {
			const l = 24 * random() + 57;
			const c = 38 * random() + 45;
			const h = 360 * random();
			return new Color(l, c, h, "lch");
		} else if (mode === "sine") {
			t = t == null ? random() : t;
			const r = round(80 * sin(2 * pi * t / .5 + .01) + 150);
			const g = round(50 * sin(2 * pi * t / .5 + 4.6) + 200);
			const b = round(100 * sin(2 * pi * t / .5 + 2.3) + 150);
			return new Color(r, g, b);
		} else if (mode === "pastel") {
			const l = 8 * random() + 86;
			const c = 17 * random() + 9;
			const h = 360 * random();
			return new Color(l, c, h, "lch");
		} else if (mode === "dark") {
			const l = 10 + 10 * random();
			const c = 50 * random() + 86;
			const h = 360 * random();
			return new Color(l, c, h, "lch");
		} else if (mode === "rgb") {
			const r = 255 * random();
			const g = 255 * random();
			const b = 255 * random();
			return new Color(r, g, b);
		} else if (mode === "lab") {
			const l = 100 * random();
			const a = 256 * random() - 128;
			const b = 256 * random() - 128;
			return new Color(l, a, b, "lab");
		} else if (mode === "grey") {
			const grey = 255 * random();
			return new Color(grey, grey, grey);
		} else throw new Error("Unsupported random color mode");
	}
	static test(color) {
		return typeof color === "string" && (isHex.test(color) || isRgb.test(color));
	}
	cmyk() {
		const { _a, _b, _c } = this.rgb();
		const [r, g, b] = [
			_a,
			_b,
			_c
		].map((v) => v / 255);
		const k = Math.min(1 - r, 1 - g, 1 - b);
		if (k === 1) return new Color(0, 0, 0, 1, "cmyk");
		const c = (1 - r - k) / (1 - k);
		const m = (1 - g - k) / (1 - k);
		const y = (1 - b - k) / (1 - k);
		return new Color(c, m, y, k, "cmyk");
	}
	hsl() {
		const { _a, _b, _c } = this.rgb();
		const [r, g, b] = [
			_a,
			_b,
			_c
		].map((v) => v / 255);
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const l = (max + min) / 2;
		const isGrey = max === min;
		const delta = max - min;
		const s = isGrey ? 0 : l > .5 ? delta / (2 - max - min) : delta / (max + min);
		const h = isGrey ? 0 : max === r ? ((g - b) / delta + (g < b ? 6 : 0)) / 6 : max === g ? ((b - r) / delta + 2) / 6 : max === b ? ((r - g) / delta + 4) / 6 : 0;
		return new Color(360 * h, 100 * s, 100 * l, "hsl");
	}
	init(a = 0, b = 0, c = 0, d = 0, space = "rgb") {
		a = !a ? 0 : a;
		if (this.space) for (const component in this.space) delete this[this.space[component]];
		if (typeof a === "number") {
			space = typeof d === "string" ? d : space;
			d = typeof d === "string" ? 0 : d;
			Object.assign(this, {
				_a: a,
				_b: b,
				_c: c,
				_d: d,
				space
			});
		} else if (a instanceof Array) {
			this.space = b || (typeof a[3] === "string" ? a[3] : a[4]) || "rgb";
			Object.assign(this, {
				_a: a[0],
				_b: a[1],
				_c: a[2],
				_d: a[3] || 0
			});
		} else if (a instanceof Object) {
			const values = getParameters(a, b);
			Object.assign(this, values);
		} else if (typeof a === "string") if (isRgb.test(a)) {
			const noWhitespace = a.replace(whitespace, "");
			const [_a, _b, _c] = rgb.exec(noWhitespace).slice(1, 4).map((v) => parseInt(v));
			Object.assign(this, {
				_a,
				_b,
				_c,
				_d: 0,
				space: "rgb"
			});
		} else if (isHex.test(a)) {
			const hexParse = (v) => parseInt(v, 16);
			const [, _a, _b, _c] = hex.exec(sixDigitHex(a)).map(hexParse);
			Object.assign(this, {
				_a,
				_b,
				_c,
				_d: 0,
				space: "rgb"
			});
		} else throw Error("Unsupported string format, can't construct Color");
		const { _a, _b, _c, _d } = this;
		const components = this.space === "rgb" ? {
			r: _a,
			g: _b,
			b: _c
		} : this.space === "xyz" ? {
			x: _a,
			y: _b,
			z: _c
		} : this.space === "hsl" ? {
			h: _a,
			s: _b,
			l: _c
		} : this.space === "lab" ? {
			l: _a,
			a: _b,
			b: _c
		} : this.space === "lch" ? {
			l: _a,
			c: _b,
			h: _c
		} : this.space === "cmyk" ? {
			c: _a,
			m: _b,
			y: _c,
			k: _d
		} : {};
		Object.assign(this, components);
	}
	lab() {
		const { x, y, z } = this.xyz();
		const l = 116 * y - 16;
		const a = 500 * (x - y);
		const b = 200 * (y - z);
		return new Color(l, a, b, "lab");
	}
	lch() {
		const { l, a, b } = this.lab();
		const c = Math.sqrt(a ** 2 + b ** 2);
		let h = 180 * Math.atan2(b, a) / Math.PI;
		if (h < 0) {
			h *= -1;
			h = 360 - h;
		}
		return new Color(l, c, h, "lch");
	}
	rgb() {
		if (this.space === "rgb") return this;
		else if (cieSpace(this.space)) {
			let { x, y, z } = this;
			if (this.space === "lab" || this.space === "lch") {
				let { l, a, b } = this;
				if (this.space === "lch") {
					const { c, h } = this;
					const dToR = Math.PI / 180;
					a = c * Math.cos(dToR * h);
					b = c * Math.sin(dToR * h);
				}
				const yL = (l + 16) / 116;
				const xL = a / 500 + yL;
				const zL = yL - b / 200;
				const ct = 16 / 116;
				const mx = .008856;
				const nm = 7.787;
				x = .95047 * (xL ** 3 > mx ? xL ** 3 : (xL - ct) / nm);
				y = 1 * (yL ** 3 > mx ? yL ** 3 : (yL - ct) / nm);
				z = 1.08883 * (zL ** 3 > mx ? zL ** 3 : (zL - ct) / nm);
			}
			const rU = x * 3.2406 + y * -1.5372 + z * -.4986;
			const gU = x * -.9689 + y * 1.8758 + z * .0415;
			const bU = x * .0557 + y * -.204 + z * 1.057;
			const pow = Math.pow;
			const bd = .0031308;
			const r = rU > bd ? 1.055 * pow(rU, 1 / 2.4) - .055 : 12.92 * rU;
			const g = gU > bd ? 1.055 * pow(gU, 1 / 2.4) - .055 : 12.92 * gU;
			const b = bU > bd ? 1.055 * pow(bU, 1 / 2.4) - .055 : 12.92 * bU;
			return new Color(255 * r, 255 * g, 255 * b);
		} else if (this.space === "hsl") {
			let { h, s, l } = this;
			h /= 360;
			s /= 100;
			l /= 100;
			if (s === 0) {
				l *= 255;
				return new Color(l, l, l);
			}
			const q = l < .5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			const r = 255 * hueToRgb(p, q, h + 1 / 3);
			const g = 255 * hueToRgb(p, q, h);
			const b = 255 * hueToRgb(p, q, h - 1 / 3);
			return new Color(r, g, b);
		} else if (this.space === "cmyk") {
			const { c, m, y, k } = this;
			const r = 255 * (1 - Math.min(1, c * (1 - k) + k));
			const g = 255 * (1 - Math.min(1, m * (1 - k) + k));
			const b = 255 * (1 - Math.min(1, y * (1 - k) + k));
			return new Color(r, g, b);
		} else return this;
	}
	toArray() {
		const { _a, _b, _c, _d, space } = this;
		return [
			_a,
			_b,
			_c,
			_d,
			space
		];
	}
	toHex() {
		const [r, g, b] = this._clamped().map(componentHex);
		return `#${r}${g}${b}`;
	}
	toRgb() {
		const [rV, gV, bV] = this._clamped();
		return `rgb(${rV},${gV},${bV})`;
	}
	toString() {
		return this.toHex();
	}
	xyz() {
		const { _a: r255, _b: g255, _c: b255 } = this.rgb();
		const [r, g, b] = [
			r255,
			g255,
			b255
		].map((v) => v / 255);
		const rL = r > .04045 ? Math.pow((r + .055) / 1.055, 2.4) : r / 12.92;
		const gL = g > .04045 ? Math.pow((g + .055) / 1.055, 2.4) : g / 12.92;
		const bL = b > .04045 ? Math.pow((b + .055) / 1.055, 2.4) : b / 12.92;
		const xU = (rL * .4124 + gL * .3576 + bL * .1805) / .95047;
		const yU = (rL * .2126 + gL * .7152 + bL * .0722) / 1;
		const zU = (rL * .0193 + gL * .1192 + bL * .9505) / 1.08883;
		const x = xU > .008856 ? Math.pow(xU, 1 / 3) : 7.787 * xU + 16 / 116;
		const y = yU > .008856 ? Math.pow(yU, 1 / 3) : 7.787 * yU + 16 / 116;
		const z = zU > .008856 ? Math.pow(zU, 1 / 3) : 7.787 * zU + 16 / 116;
		return new Color(x, y, z, "xyz");
	}
	_clamped() {
		const { _a, _b, _c } = this.rgb();
		const { max, min, round } = Math;
		const format = (v) => max(0, min(round(v), 255));
		return [
			_a,
			_b,
			_c
		].map(format);
	}
};
var Point = class Point {
	constructor(...args) {
		this.init(...args);
	}
	clone() {
		return new Point(this);
	}
	init(x, y) {
		const base = {
			x: 0,
			y: 0
		};
		const source = Array.isArray(x) ? {
			x: x[0],
			y: x[1]
		} : typeof x === "object" ? {
			x: x.x,
			y: x.y
		} : {
			x,
			y
		};
		this.x = source.x == null ? base.x : source.x;
		this.y = source.y == null ? base.y : source.y;
		return this;
	}
	toArray() {
		return [this.x, this.y];
	}
	transform(m) {
		return this.clone().transformO(m);
	}
	transformO(m) {
		if (!Matrix.isMatrixLike(m)) m = new Matrix(m);
		const { x, y } = this;
		this.x = m.a * x + m.c * y + m.e;
		this.y = m.b * x + m.d * y + m.f;
		return this;
	}
};
function point(x, y) {
	return new Point(x, y).transformO(this.screenCTM().inverseO());
}
function closeEnough(a, b, threshold) {
	return Math.abs(b - a) < (threshold || 1e-6);
}
var Matrix = class Matrix {
	constructor(...args) {
		this.init(...args);
	}
	static formatTransforms(o) {
		const flipBoth = o.flip === "both" || o.flip === true;
		const flipX = o.flip && (flipBoth || o.flip === "x") ? -1 : 1;
		const flipY = o.flip && (flipBoth || o.flip === "y") ? -1 : 1;
		const skewX = o.skew && o.skew.length ? o.skew[0] : isFinite(o.skew) ? o.skew : isFinite(o.skewX) ? o.skewX : 0;
		const skewY = o.skew && o.skew.length ? o.skew[1] : isFinite(o.skew) ? o.skew : isFinite(o.skewY) ? o.skewY : 0;
		const scaleX = o.scale && o.scale.length ? o.scale[0] * flipX : isFinite(o.scale) ? o.scale * flipX : isFinite(o.scaleX) ? o.scaleX * flipX : flipX;
		const scaleY = o.scale && o.scale.length ? o.scale[1] * flipY : isFinite(o.scale) ? o.scale * flipY : isFinite(o.scaleY) ? o.scaleY * flipY : flipY;
		const shear = o.shear || 0;
		const theta = o.rotate || o.theta || 0;
		const origin = new Point(o.origin || o.around || o.ox || o.originX, o.oy || o.originY);
		const ox = origin.x;
		const oy = origin.y;
		const position = new Point(o.position || o.px || o.positionX || NaN, o.py || o.positionY || NaN);
		const px = position.x;
		const py = position.y;
		const translate = new Point(o.translate || o.tx || o.translateX, o.ty || o.translateY);
		const tx = translate.x;
		const ty = translate.y;
		const relative = new Point(o.relative || o.rx || o.relativeX, o.ry || o.relativeY);
		return {
			scaleX,
			scaleY,
			skewX,
			skewY,
			shear,
			theta,
			rx: relative.x,
			ry: relative.y,
			tx,
			ty,
			ox,
			oy,
			px,
			py
		};
	}
	static fromArray(a) {
		return {
			a: a[0],
			b: a[1],
			c: a[2],
			d: a[3],
			e: a[4],
			f: a[5]
		};
	}
	static isMatrixLike(o) {
		return o.a != null || o.b != null || o.c != null || o.d != null || o.e != null || o.f != null;
	}
	static matrixMultiply(l, r, o) {
		const a = l.a * r.a + l.c * r.b;
		const b = l.b * r.a + l.d * r.b;
		const c = l.a * r.c + l.c * r.d;
		const d = l.b * r.c + l.d * r.d;
		const e = l.e + l.a * r.e + l.c * r.f;
		const f = l.f + l.b * r.e + l.d * r.f;
		o.a = a;
		o.b = b;
		o.c = c;
		o.d = d;
		o.e = e;
		o.f = f;
		return o;
	}
	around(cx, cy, matrix) {
		return this.clone().aroundO(cx, cy, matrix);
	}
	aroundO(cx, cy, matrix) {
		const dx = cx || 0;
		const dy = cy || 0;
		return this.translateO(-dx, -dy).lmultiplyO(matrix).translateO(dx, dy);
	}
	clone() {
		return new Matrix(this);
	}
	decompose(cx = 0, cy = 0) {
		const a = this.a;
		const b = this.b;
		const c = this.c;
		const d = this.d;
		const e = this.e;
		const f = this.f;
		const determinant = a * d - b * c;
		const ccw = determinant > 0 ? 1 : -1;
		const sx = ccw * Math.sqrt(a * a + b * b);
		const thetaRad = Math.atan2(ccw * b, ccw * a);
		const theta = 180 / Math.PI * thetaRad;
		const ct = Math.cos(thetaRad);
		const st = Math.sin(thetaRad);
		const lam = (a * c + b * d) / determinant;
		const sy = c * sx / (lam * a - b) || d * sx / (lam * b + a);
		return {
			scaleX: sx,
			scaleY: sy,
			shear: lam,
			rotate: theta,
			translateX: e - cx + cx * ct * sx + cy * (lam * ct * sx - st * sy),
			translateY: f - cy + cx * st * sx + cy * (lam * st * sx + ct * sy),
			originX: cx,
			originY: cy,
			a: this.a,
			b: this.b,
			c: this.c,
			d: this.d,
			e: this.e,
			f: this.f
		};
	}
	equals(other) {
		if (other === this) return true;
		const comp = new Matrix(other);
		return closeEnough(this.a, comp.a) && closeEnough(this.b, comp.b) && closeEnough(this.c, comp.c) && closeEnough(this.d, comp.d) && closeEnough(this.e, comp.e) && closeEnough(this.f, comp.f);
	}
	flip(axis, around) {
		return this.clone().flipO(axis, around);
	}
	flipO(axis, around) {
		return axis === "x" ? this.scaleO(-1, 1, around, 0) : axis === "y" ? this.scaleO(1, -1, 0, around) : this.scaleO(-1, -1, axis, around || axis);
	}
	init(source) {
		const base = Matrix.fromArray([
			1,
			0,
			0,
			1,
			0,
			0
		]);
		source = source instanceof Element ? source.matrixify() : typeof source === "string" ? Matrix.fromArray(source.split(delimiter).map(parseFloat)) : Array.isArray(source) ? Matrix.fromArray(source) : typeof source === "object" && Matrix.isMatrixLike(source) ? source : typeof source === "object" ? new Matrix().transform(source) : arguments.length === 6 ? Matrix.fromArray([].slice.call(arguments)) : base;
		this.a = source.a != null ? source.a : base.a;
		this.b = source.b != null ? source.b : base.b;
		this.c = source.c != null ? source.c : base.c;
		this.d = source.d != null ? source.d : base.d;
		this.e = source.e != null ? source.e : base.e;
		this.f = source.f != null ? source.f : base.f;
		return this;
	}
	inverse() {
		return this.clone().inverseO();
	}
	inverseO() {
		const a = this.a;
		const b = this.b;
		const c = this.c;
		const d = this.d;
		const e = this.e;
		const f = this.f;
		const det = a * d - b * c;
		if (!det) throw new Error("Cannot invert " + this);
		const na = d / det;
		const nb = -b / det;
		const nc = -c / det;
		const nd = a / det;
		const ne = -(na * e + nc * f);
		const nf = -(nb * e + nd * f);
		this.a = na;
		this.b = nb;
		this.c = nc;
		this.d = nd;
		this.e = ne;
		this.f = nf;
		return this;
	}
	lmultiply(matrix) {
		return this.clone().lmultiplyO(matrix);
	}
	lmultiplyO(matrix) {
		const r = this;
		const l = matrix instanceof Matrix ? matrix : new Matrix(matrix);
		return Matrix.matrixMultiply(l, r, this);
	}
	multiply(matrix) {
		return this.clone().multiplyO(matrix);
	}
	multiplyO(matrix) {
		const l = this;
		const r = matrix instanceof Matrix ? matrix : new Matrix(matrix);
		return Matrix.matrixMultiply(l, r, this);
	}
	rotate(r, cx, cy) {
		return this.clone().rotateO(r, cx, cy);
	}
	rotateO(r, cx = 0, cy = 0) {
		r = radians(r);
		const cos = Math.cos(r);
		const sin = Math.sin(r);
		const { a, b, c, d, e, f } = this;
		this.a = a * cos - b * sin;
		this.b = b * cos + a * sin;
		this.c = c * cos - d * sin;
		this.d = d * cos + c * sin;
		this.e = e * cos - f * sin + cy * sin - cx * cos + cx;
		this.f = f * cos + e * sin - cx * sin - cy * cos + cy;
		return this;
	}
	scale(x, y, cx, cy) {
		return this.clone().scaleO(...arguments);
	}
	scaleO(x, y = x, cx = 0, cy = 0) {
		if (arguments.length === 3) {
			cy = cx;
			cx = y;
			y = x;
		}
		const { a, b, c, d, e, f } = this;
		this.a = a * x;
		this.b = b * y;
		this.c = c * x;
		this.d = d * y;
		this.e = e * x - cx * x + cx;
		this.f = f * y - cy * y + cy;
		return this;
	}
	shear(a, cx, cy) {
		return this.clone().shearO(a, cx, cy);
	}
	shearO(lx, cx = 0, cy = 0) {
		const { a, b, c, d, e, f } = this;
		this.a = a + b * lx;
		this.c = c + d * lx;
		this.e = e + f * lx - cy * lx;
		return this;
	}
	skew(x, y, cx, cy) {
		return this.clone().skewO(...arguments);
	}
	skewO(x, y = x, cx = 0, cy = 0) {
		if (arguments.length === 3) {
			cy = cx;
			cx = y;
			y = x;
		}
		x = radians(x);
		y = radians(y);
		const lx = Math.tan(x);
		const ly = Math.tan(y);
		const { a, b, c, d, e, f } = this;
		this.a = a + b * lx;
		this.b = b + a * ly;
		this.c = c + d * lx;
		this.d = d + c * ly;
		this.e = e + f * lx - cy * lx;
		this.f = f + e * ly - cx * ly;
		return this;
	}
	skewX(x, cx, cy) {
		return this.skew(x, 0, cx, cy);
	}
	skewY(y, cx, cy) {
		return this.skew(0, y, cx, cy);
	}
	toArray() {
		return [
			this.a,
			this.b,
			this.c,
			this.d,
			this.e,
			this.f
		];
	}
	toString() {
		return "matrix(" + this.a + "," + this.b + "," + this.c + "," + this.d + "," + this.e + "," + this.f + ")";
	}
	transform(o) {
		if (Matrix.isMatrixLike(o)) return new Matrix(o).multiplyO(this);
		const t = Matrix.formatTransforms(o);
		const current = this;
		const { x: ox, y: oy } = new Point(t.ox, t.oy).transform(current);
		const transformer = new Matrix().translateO(t.rx, t.ry).lmultiplyO(current).translateO(-ox, -oy).scaleO(t.scaleX, t.scaleY).skewO(t.skewX, t.skewY).shearO(t.shear).rotateO(t.theta).translateO(ox, oy);
		if (isFinite(t.px) || isFinite(t.py)) {
			const origin = new Point(ox, oy).transform(transformer);
			const dx = isFinite(t.px) ? t.px - origin.x : 0;
			const dy = isFinite(t.py) ? t.py - origin.y : 0;
			transformer.translateO(dx, dy);
		}
		transformer.translateO(t.tx, t.ty);
		return transformer;
	}
	translate(x, y) {
		return this.clone().translateO(x, y);
	}
	translateO(x, y) {
		this.e += x || 0;
		this.f += y || 0;
		return this;
	}
	valueOf() {
		return {
			a: this.a,
			b: this.b,
			c: this.c,
			d: this.d,
			e: this.e,
			f: this.f
		};
	}
};
function ctm() {
	return new Matrix(this.node.getCTM());
}
function screenCTM() {
	if (typeof this.isRoot === "function" && !this.isRoot()) {
		const rect = this.rect(1, 1);
		const m = rect.node.getScreenCTM();
		rect.remove();
		return new Matrix(m);
	}
	return new Matrix(this.node.getScreenCTM());
}
register(Matrix, "Matrix");
function parser() {
	if (!parser.nodes) {
		const svg = makeInstance().size(2, 0);
		svg.node.style.cssText = [
			"opacity: 0",
			"position: absolute",
			"left: -100%",
			"top: -100%",
			"overflow: hidden"
		].join(";");
		svg.attr("focusable", "false");
		svg.attr("aria-hidden", "true");
		parser.nodes = {
			svg,
			path: svg.path().node
		};
	}
	if (!parser.nodes.svg.node.parentNode) {
		const b = globals.document.body || globals.document.documentElement;
		parser.nodes.svg.addTo(b);
	}
	return parser.nodes;
}
function isNulledBox(box) {
	return !box.width && !box.height && !box.x && !box.y;
}
function domContains(node) {
	return node === globals.document || (globals.document.documentElement.contains || function(node) {
		while (node.parentNode) node = node.parentNode;
		return node === globals.document;
	}).call(globals.document.documentElement, node);
}
var Box = class Box {
	constructor(...args) {
		this.init(...args);
	}
	addOffset() {
		this.x += globals.window.pageXOffset;
		this.y += globals.window.pageYOffset;
		return new Box(this);
	}
	init(source) {
		source = typeof source === "string" ? source.split(delimiter).map(parseFloat) : Array.isArray(source) ? source : typeof source === "object" ? [
			source.left != null ? source.left : source.x,
			source.top != null ? source.top : source.y,
			source.width,
			source.height
		] : arguments.length === 4 ? [].slice.call(arguments) : [
			0,
			0,
			0,
			0
		];
		this.x = source[0] || 0;
		this.y = source[1] || 0;
		this.width = this.w = source[2] || 0;
		this.height = this.h = source[3] || 0;
		this.x2 = this.x + this.w;
		this.y2 = this.y + this.h;
		this.cx = this.x + this.w / 2;
		this.cy = this.y + this.h / 2;
		return this;
	}
	isNulled() {
		return isNulledBox(this);
	}
	merge(box) {
		const x = Math.min(this.x, box.x);
		const y = Math.min(this.y, box.y);
		const width = Math.max(this.x + this.width, box.x + box.width) - x;
		const height = Math.max(this.y + this.height, box.y + box.height) - y;
		return new Box(x, y, width, height);
	}
	toArray() {
		return [
			this.x,
			this.y,
			this.width,
			this.height
		];
	}
	toString() {
		return this.x + " " + this.y + " " + this.width + " " + this.height;
	}
	transform(m) {
		if (!(m instanceof Matrix)) m = new Matrix(m);
		let xMin = Infinity;
		let xMax = -Infinity;
		let yMin = Infinity;
		let yMax = -Infinity;
		[
			new Point(this.x, this.y),
			new Point(this.x2, this.y),
			new Point(this.x, this.y2),
			new Point(this.x2, this.y2)
		].forEach(function(p) {
			p = p.transform(m);
			xMin = Math.min(xMin, p.x);
			xMax = Math.max(xMax, p.x);
			yMin = Math.min(yMin, p.y);
			yMax = Math.max(yMax, p.y);
		});
		return new Box(xMin, yMin, xMax - xMin, yMax - yMin);
	}
};
function getBox(el, getBBoxFn, retry) {
	let box;
	try {
		box = getBBoxFn(el.node);
		if (isNulledBox(box) && !domContains(el.node)) throw new Error("Element not in the dom");
	} catch (e) {
		box = retry(el);
	}
	return box;
}
function bbox() {
	const getBBox = (node) => node.getBBox();
	const retry = (el) => {
		try {
			const clone = el.clone().addTo(parser().svg).show();
			const box = clone.node.getBBox();
			clone.remove();
			return box;
		} catch (e) {
			throw new Error(`Getting bbox of element "${el.node.nodeName}" is not possible: ${e.toString()}`);
		}
	};
	return new Box(getBox(this, getBBox, retry));
}
function rbox(el) {
	const getRBox = (node) => node.getBoundingClientRect();
	const retry = (el) => {
		throw new Error(`Getting rbox of element "${el.node.nodeName}" is not possible`);
	};
	const rbox = new Box(getBox(this, getRBox, retry));
	if (el) return rbox.transform(el.screenCTM().inverseO());
	return rbox.addOffset();
}
function inside(x, y) {
	const box = this.bbox();
	return x > box.x && y > box.y && x < box.x + box.width && y < box.y + box.height;
}
registerMethods({ viewbox: {
	viewbox(x, y, width, height) {
		if (x == null) return new Box(this.attr("viewBox"));
		return this.attr("viewBox", new Box(x, y, width, height));
	},
	zoom(level, point) {
		let { width, height } = this.attr(["width", "height"]);
		if (!width && !height || typeof width === "string" || typeof height === "string") {
			width = this.node.clientWidth;
			height = this.node.clientHeight;
		}
		if (!width || !height) throw new Error("Impossible to get absolute width and height. Please provide an absolute width and height attribute on the zooming element");
		const v = this.viewbox();
		const zoomX = width / v.width;
		const zoomY = height / v.height;
		const zoom = Math.min(zoomX, zoomY);
		if (level == null) return zoom;
		let zoomAmount = zoom / level;
		if (zoomAmount === Infinity) zoomAmount = Number.MAX_SAFE_INTEGER / 100;
		point = point || new Point(width / 2 / zoomX + v.x, height / 2 / zoomY + v.y);
		const box = new Box(v).transform(new Matrix({
			scale: zoomAmount,
			origin: point
		}));
		return this.viewbox(box);
	}
} });
register(Box, "Box");
var List = class extends Array {
	constructor(arr = [], ...args) {
		super(arr, ...args);
		if (typeof arr === "number") return this;
		this.length = 0;
		this.push(...arr);
	}
};
extend([List], {
	each(fnOrMethodName, ...args) {
		if (typeof fnOrMethodName === "function") return this.map((el, i, arr) => {
			return fnOrMethodName.call(el, el, i, arr);
		});
		else return this.map((el) => {
			return el[fnOrMethodName](...args);
		});
	},
	toArray() {
		return Array.prototype.concat.apply([], this);
	}
});
var reserved = [
	"toArray",
	"constructor",
	"each"
];
List.extend = function(methods) {
	methods = methods.reduce((obj, name) => {
		if (reserved.includes(name)) return obj;
		if (name[0] === "_") return obj;
		obj[name] = function(...attrs) {
			return this.each(name, ...attrs);
		};
		return obj;
	}, {});
	extend([List], methods);
};
function baseFind(query, parent) {
	return new List(map((parent || globals.document).querySelectorAll(query), function(node) {
		return adopt(node);
	}));
}
function find(query) {
	return baseFind(query, this.node);
}
function findOne(query) {
	return adopt(this.node.querySelector(query));
}
var listenerId = 0;
var windowEvents = {};
function getEvents(instance) {
	let n = instance.getEventHolder();
	if (n === globals.window) n = windowEvents;
	if (!n.events) n.events = {};
	return n.events;
}
function getEventTarget(instance) {
	return instance.getEventTarget();
}
function clearEvents(instance) {
	let n = instance.getEventHolder();
	if (n === globals.window) n = windowEvents;
	if (n.events) n.events = {};
}
function on(node, events, listener, binding, options) {
	const l = listener.bind(binding || node);
	const instance = makeInstance(node);
	const bag = getEvents(instance);
	const n = getEventTarget(instance);
	events = Array.isArray(events) ? events : events.split(delimiter);
	if (!listener._svgjsListenerId) listener._svgjsListenerId = ++listenerId;
	events.forEach(function(event) {
		const ev = event.split(".")[0];
		const ns = event.split(".")[1] || "*";
		bag[ev] = bag[ev] || {};
		bag[ev][ns] = bag[ev][ns] || {};
		bag[ev][ns][listener._svgjsListenerId] = l;
		n.addEventListener(ev, l, options || false);
	});
}
function off(node, events, listener, options) {
	const instance = makeInstance(node);
	const bag = getEvents(instance);
	const n = getEventTarget(instance);
	if (typeof listener === "function") {
		listener = listener._svgjsListenerId;
		if (!listener) return;
	}
	events = Array.isArray(events) ? events : (events || "").split(delimiter);
	events.forEach(function(event) {
		const ev = event && event.split(".")[0];
		const ns = event && event.split(".")[1];
		let namespace, l;
		if (listener) {
			if (bag[ev] && bag[ev][ns || "*"]) {
				n.removeEventListener(ev, bag[ev][ns || "*"][listener], options || false);
				delete bag[ev][ns || "*"][listener];
			}
		} else if (ev && ns) {
			if (bag[ev] && bag[ev][ns]) {
				for (l in bag[ev][ns]) off(n, [ev, ns].join("."), l);
				delete bag[ev][ns];
			}
		} else if (ns) {
			for (event in bag) for (namespace in bag[event]) if (ns === namespace) off(n, [event, ns].join("."));
		} else if (ev) {
			if (bag[ev]) {
				for (namespace in bag[ev]) off(n, [ev, namespace].join("."));
				delete bag[ev];
			}
		} else {
			for (event in bag) off(n, event);
			clearEvents(instance);
		}
	});
}
function dispatch(node, event, data, options) {
	const n = getEventTarget(node);
	if (event instanceof globals.window.Event) n.dispatchEvent(event);
	else {
		event = new globals.window.CustomEvent(event, {
			detail: data,
			cancelable: true,
			...options
		});
		n.dispatchEvent(event);
	}
	return event;
}
var EventTarget = class extends Base {
	addEventListener() {}
	dispatch(event, data, options) {
		return dispatch(this, event, data, options);
	}
	dispatchEvent(event) {
		const bag = this.getEventHolder().events;
		if (!bag) return true;
		const events = bag[event.type];
		for (const i in events) for (const j in events[i]) events[i][j](event);
		return !event.defaultPrevented;
	}
	fire(event, data, options) {
		this.dispatch(event, data, options);
		return this;
	}
	getEventHolder() {
		return this;
	}
	getEventTarget() {
		return this;
	}
	off(event, listener, options) {
		off(this, event, listener, options);
		return this;
	}
	on(event, listener, binding, options) {
		on(this, event, listener, binding, options);
		return this;
	}
	removeEventListener() {}
};
register(EventTarget, "EventTarget");
function noop() {}
var timeline = {
	duration: 400,
	ease: ">",
	delay: 0
};
var attrs = {
	"fill-opacity": 1,
	"stroke-opacity": 1,
	"stroke-width": 0,
	"stroke-linejoin": "miter",
	"stroke-linecap": "butt",
	fill: "#000000",
	stroke: "#000000",
	opacity: 1,
	x: 0,
	y: 0,
	cx: 0,
	cy: 0,
	width: 0,
	height: 0,
	r: 0,
	rx: 0,
	ry: 0,
	offset: 0,
	"stop-opacity": 1,
	"stop-color": "#000000",
	"text-anchor": "start"
};
var SVGArray = class extends Array {
	constructor(...args) {
		super(...args);
		this.init(...args);
	}
	clone() {
		return new this.constructor(this);
	}
	init(arr) {
		if (typeof arr === "number") return this;
		this.length = 0;
		this.push(...this.parse(arr));
		return this;
	}
	parse(array = []) {
		if (array instanceof Array) return array;
		return array.trim().split(delimiter).map(parseFloat);
	}
	toArray() {
		return Array.prototype.concat.apply([], this);
	}
	toSet() {
		return new Set(this);
	}
	toString() {
		return this.join(" ");
	}
	valueOf() {
		const ret = [];
		ret.push(...this);
		return ret;
	}
};
var SVGNumber = class SVGNumber {
	constructor(...args) {
		this.init(...args);
	}
	convert(unit) {
		return new SVGNumber(this.value, unit);
	}
	divide(number) {
		number = new SVGNumber(number);
		return new SVGNumber(this / number, this.unit || number.unit);
	}
	init(value, unit) {
		unit = Array.isArray(value) ? value[1] : unit;
		value = Array.isArray(value) ? value[0] : value;
		this.value = 0;
		this.unit = unit || "";
		if (typeof value === "number") this.value = isNaN(value) ? 0 : !isFinite(value) ? value < 0 ? -34e37 : 34e37 : value;
		else if (typeof value === "string") {
			unit = value.match(numberAndUnit);
			if (unit) {
				this.value = parseFloat(unit[1]);
				if (unit[5] === "%") this.value /= 100;
				else if (unit[5] === "s") this.value *= 1e3;
				this.unit = unit[5];
			}
		} else if (value instanceof SVGNumber) {
			this.value = value.valueOf();
			this.unit = value.unit;
		}
		return this;
	}
	minus(number) {
		number = new SVGNumber(number);
		return new SVGNumber(this - number, this.unit || number.unit);
	}
	plus(number) {
		number = new SVGNumber(number);
		return new SVGNumber(this + number, this.unit || number.unit);
	}
	times(number) {
		number = new SVGNumber(number);
		return new SVGNumber(this * number, this.unit || number.unit);
	}
	toArray() {
		return [this.value, this.unit];
	}
	toJSON() {
		return this.toString();
	}
	toString() {
		return (this.unit === "%" ? ~~(this.value * 1e8) / 1e6 : this.unit === "s" ? this.value / 1e3 : this.value) + this.unit;
	}
	valueOf() {
		return this.value;
	}
};
var hooks = [];
function registerAttrHook(fn) {
	hooks.push(fn);
}
function attr(attr, val, ns) {
	if (attr == null) {
		attr = {};
		val = this.node.attributes;
		for (const node of val) attr[node.nodeName] = isNumber.test(node.nodeValue) ? parseFloat(node.nodeValue) : node.nodeValue;
		return attr;
	} else if (attr instanceof Array) return attr.reduce((last, curr) => {
		last[curr] = this.attr(curr);
		return last;
	}, {});
	else if (typeof attr === "object" && attr.constructor === Object) for (val in attr) this.attr(val, attr[val]);
	else if (val === null) this.node.removeAttribute(attr);
	else if (val == null) {
		val = this.node.getAttribute(attr);
		return val == null ? attrs[attr] : isNumber.test(val) ? parseFloat(val) : val;
	} else {
		val = hooks.reduce((_val, hook) => {
			return hook(attr, _val, this);
		}, val);
		if (typeof val === "number") val = new SVGNumber(val);
		else if (Color.isColor(val)) val = new Color(val);
		else if (val.constructor === Array) val = new SVGArray(val);
		if (attr === "leading") {
			if (this.leading) this.leading(val);
		} else typeof ns === "string" ? this.node.setAttributeNS(ns, attr, val.toString()) : this.node.setAttribute(attr, val.toString());
		if (this.rebuild && (attr === "font-size" || attr === "x")) this.rebuild();
	}
	return this;
}
var Dom = class Dom extends EventTarget {
	constructor(node, attrs) {
		super();
		this.node = node;
		this.type = node.nodeName;
		if (attrs && node !== attrs) this.attr(attrs);
	}
	add(element, i) {
		element = makeInstance(element);
		if (element.removeNamespace && this.node instanceof globals.window.SVGElement) element.removeNamespace();
		if (i == null) this.node.appendChild(element.node);
		else if (element.node !== this.node.childNodes[i]) this.node.insertBefore(element.node, this.node.childNodes[i]);
		return this;
	}
	addTo(parent, i) {
		return makeInstance(parent).put(this, i);
	}
	children() {
		return new List(map(this.node.children, function(node) {
			return adopt(node);
		}));
	}
	clear() {
		while (this.node.hasChildNodes()) this.node.removeChild(this.node.lastChild);
		return this;
	}
	clone(deep = true, assignNewIds = true) {
		this.writeDataToDom();
		let nodeClone = this.node.cloneNode(deep);
		if (assignNewIds) nodeClone = assignNewId(nodeClone);
		return new this.constructor(nodeClone);
	}
	each(block, deep) {
		const children = this.children();
		let i, il;
		for (i = 0, il = children.length; i < il; i++) {
			block.apply(children[i], [i, children]);
			if (deep) children[i].each(block, deep);
		}
		return this;
	}
	element(nodeName, attrs) {
		return this.put(new Dom(create(nodeName), attrs));
	}
	first() {
		return adopt(this.node.firstChild);
	}
	get(i) {
		return adopt(this.node.childNodes[i]);
	}
	getEventHolder() {
		return this.node;
	}
	getEventTarget() {
		return this.node;
	}
	has(element) {
		return this.index(element) >= 0;
	}
	html(htmlOrFn, outerHTML) {
		return this.xml(htmlOrFn, outerHTML, html);
	}
	id(id) {
		if (typeof id === "undefined" && !this.node.id) this.node.id = eid(this.type);
		return this.attr("id", id);
	}
	index(element) {
		return [].slice.call(this.node.childNodes).indexOf(element.node);
	}
	last() {
		return adopt(this.node.lastChild);
	}
	matches(selector) {
		const el = this.node;
		const matcher = el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector || null;
		return matcher && matcher.call(el, selector);
	}
	parent(type) {
		let parent = this;
		if (!parent.node.parentNode) return null;
		parent = adopt(parent.node.parentNode);
		if (!type) return parent;
		do
			if (typeof type === "string" ? parent.matches(type) : parent instanceof type) return parent;
		while (parent = adopt(parent.node.parentNode));
		return parent;
	}
	put(element, i) {
		element = makeInstance(element);
		this.add(element, i);
		return element;
	}
	putIn(parent, i) {
		return makeInstance(parent).add(this, i);
	}
	remove() {
		if (this.parent()) this.parent().removeElement(this);
		return this;
	}
	removeElement(element) {
		this.node.removeChild(element.node);
		return this;
	}
	replace(element) {
		element = makeInstance(element);
		if (this.node.parentNode) this.node.parentNode.replaceChild(element.node, this.node);
		return element;
	}
	round(precision = 2, map = null) {
		const factor = 10 ** precision;
		const attrs = this.attr(map);
		for (const i in attrs) if (typeof attrs[i] === "number") attrs[i] = Math.round(attrs[i] * factor) / factor;
		this.attr(attrs);
		return this;
	}
	svg(svgOrFn, outerSVG) {
		return this.xml(svgOrFn, outerSVG, svg);
	}
	toString() {
		return this.id();
	}
	words(text) {
		this.node.textContent = text;
		return this;
	}
	wrap(node) {
		const parent = this.parent();
		if (!parent) return this.addTo(node);
		const position = parent.index(this);
		return parent.put(node, position).put(this);
	}
	writeDataToDom() {
		this.each(function() {
			this.writeDataToDom();
		});
		return this;
	}
	xml(xmlOrFn, outerXML, ns) {
		if (typeof xmlOrFn === "boolean") {
			ns = outerXML;
			outerXML = xmlOrFn;
			xmlOrFn = null;
		}
		if (xmlOrFn == null || typeof xmlOrFn === "function") {
			outerXML = outerXML == null ? true : outerXML;
			this.writeDataToDom();
			let current = this;
			if (xmlOrFn != null) {
				current = adopt(current.node.cloneNode(true));
				if (outerXML) {
					const result = xmlOrFn(current);
					current = result || current;
					if (result === false) return "";
				}
				current.each(function() {
					const result = xmlOrFn(this);
					const _this = result || this;
					if (result === false) this.remove();
					else if (result && this !== _this) this.replace(_this);
				}, true);
			}
			return outerXML ? current.node.outerHTML : current.node.innerHTML;
		}
		outerXML = outerXML == null ? false : outerXML;
		const well = create("wrapper", ns);
		const fragment = globals.document.createDocumentFragment();
		well.innerHTML = xmlOrFn;
		for (let len = well.children.length; len--;) fragment.appendChild(well.firstElementChild);
		const parent = this.parent();
		return outerXML ? this.replace(fragment) && parent : this.add(fragment);
	}
};
extend(Dom, {
	attr,
	find,
	findOne
});
register(Dom, "Dom");
var Element = class extends Dom {
	constructor(node, attrs) {
		super(node, attrs);
		this.dom = {};
		this.node.instance = this;
		if (node.hasAttribute("svgjs:data")) this.setData(JSON.parse(node.getAttribute("svgjs:data")) || {});
	}
	center(x, y) {
		return this.cx(x).cy(y);
	}
	cx(x) {
		return x == null ? this.x() + this.width() / 2 : this.x(x - this.width() / 2);
	}
	cy(y) {
		return y == null ? this.y() + this.height() / 2 : this.y(y - this.height() / 2);
	}
	defs() {
		const root = this.root();
		return root && root.defs();
	}
	dmove(x, y) {
		return this.dx(x).dy(y);
	}
	dx(x = 0) {
		return this.x(new SVGNumber(x).plus(this.x()));
	}
	dy(y = 0) {
		return this.y(new SVGNumber(y).plus(this.y()));
	}
	getEventHolder() {
		return this;
	}
	height(height) {
		return this.attr("height", height);
	}
	move(x, y) {
		return this.x(x).y(y);
	}
	parents(until = this.root()) {
		const isSelector = typeof until === "string";
		if (!isSelector) until = makeInstance(until);
		const parents = new List();
		let parent = this;
		while ((parent = parent.parent()) && parent.node !== globals.document && parent.nodeName !== "#document-fragment") {
			parents.push(parent);
			if (!isSelector && parent.node === until.node) break;
			if (isSelector && parent.matches(until)) break;
			if (parent.node === this.root().node) return null;
		}
		return parents;
	}
	reference(attr) {
		attr = this.attr(attr);
		if (!attr) return null;
		const m = (attr + "").match(reference);
		return m ? makeInstance(m[1]) : null;
	}
	root() {
		const p = this.parent(getClass(root));
		return p && p.root();
	}
	setData(o) {
		this.dom = o;
		return this;
	}
	size(width, height) {
		const p = proportionalSize(this, width, height);
		return this.width(new SVGNumber(p.width)).height(new SVGNumber(p.height));
	}
	width(width) {
		return this.attr("width", width);
	}
	writeDataToDom() {
		this.node.removeAttribute("svgjs:data");
		if (Object.keys(this.dom).length) this.node.setAttribute("svgjs:data", JSON.stringify(this.dom));
		return super.writeDataToDom();
	}
	x(x) {
		return this.attr("x", x);
	}
	y(y) {
		return this.attr("y", y);
	}
};
extend(Element, {
	bbox,
	rbox,
	inside,
	point,
	ctm,
	screenCTM
});
register(Element, "Element");
var sugar = {
	stroke: [
		"color",
		"width",
		"opacity",
		"linecap",
		"linejoin",
		"miterlimit",
		"dasharray",
		"dashoffset"
	],
	fill: [
		"color",
		"opacity",
		"rule"
	],
	prefix: function(t, a) {
		return a === "color" ? t : t + "-" + a;
	}
};
["fill", "stroke"].forEach(function(m) {
	const extension = {};
	let i;
	extension[m] = function(o) {
		if (typeof o === "undefined") return this.attr(m);
		if (typeof o === "string" || o instanceof Color || Color.isRgb(o) || o instanceof Element) this.attr(m, o);
		else for (i = sugar[m].length - 1; i >= 0; i--) if (o[sugar[m][i]] != null) this.attr(sugar.prefix(m, sugar[m][i]), o[sugar[m][i]]);
		return this;
	};
	registerMethods(["Element", "Runner"], extension);
});
registerMethods(["Element", "Runner"], {
	matrix: function(mat, b, c, d, e, f) {
		if (mat == null) return new Matrix(this);
		return this.attr("transform", new Matrix(mat, b, c, d, e, f));
	},
	rotate: function(angle, cx, cy) {
		return this.transform({
			rotate: angle,
			ox: cx,
			oy: cy
		}, true);
	},
	skew: function(x, y, cx, cy) {
		return arguments.length === 1 || arguments.length === 3 ? this.transform({
			skew: x,
			ox: y,
			oy: cx
		}, true) : this.transform({
			skew: [x, y],
			ox: cx,
			oy: cy
		}, true);
	},
	shear: function(lam, cx, cy) {
		return this.transform({
			shear: lam,
			ox: cx,
			oy: cy
		}, true);
	},
	scale: function(x, y, cx, cy) {
		return arguments.length === 1 || arguments.length === 3 ? this.transform({
			scale: x,
			ox: y,
			oy: cx
		}, true) : this.transform({
			scale: [x, y],
			ox: cx,
			oy: cy
		}, true);
	},
	translate: function(x, y) {
		return this.transform({ translate: [x, y] }, true);
	},
	relative: function(x, y) {
		return this.transform({ relative: [x, y] }, true);
	},
	flip: function(direction = "both", origin = "center") {
		if ("xybothtrue".indexOf(direction) === -1) {
			origin = direction;
			direction = "both";
		}
		return this.transform({
			flip: direction,
			origin
		}, true);
	},
	opacity: function(value) {
		return this.attr("opacity", value);
	}
});
registerMethods("radius", { radius: function(x, y = x) {
	return (this._element || this).type === "radialGradient" ? this.attr("r", new SVGNumber(x)) : this.rx(x).ry(y);
} });
registerMethods("Path", {
	length: function() {
		return this.node.getTotalLength();
	},
	pointAt: function(length) {
		return new Point(this.node.getPointAtLength(length));
	}
});
registerMethods(["Element", "Runner"], { font: function(a, v) {
	if (typeof a === "object") {
		for (v in a) this.font(v, a[v]);
		return this;
	}
	return a === "leading" ? this.leading(v) : a === "anchor" ? this.attr("text-anchor", v) : a === "size" || a === "family" || a === "weight" || a === "stretch" || a === "variant" || a === "style" ? this.attr("font-" + a, v) : this.attr(a, v);
} });
registerMethods("Element", [
	"click",
	"dblclick",
	"mousedown",
	"mouseup",
	"mouseover",
	"mouseout",
	"mousemove",
	"mouseenter",
	"mouseleave",
	"touchstart",
	"touchmove",
	"touchleave",
	"touchend",
	"touchcancel"
].reduce(function(last, event) {
	const fn = function(f) {
		if (f === null) this.off(event);
		else this.on(event, f);
		return this;
	};
	last[event] = fn;
	return last;
}, {}));
function untransform() {
	return this.attr("transform", null);
}
function matrixify() {
	return (this.attr("transform") || "").split(transforms).slice(0, -1).map(function(str) {
		const kv = str.trim().split("(");
		return [kv[0], kv[1].split(delimiter).map(function(str) {
			return parseFloat(str);
		})];
	}).reverse().reduce(function(matrix, transform) {
		if (transform[0] === "matrix") return matrix.lmultiply(Matrix.fromArray(transform[1]));
		return matrix[transform[0]].apply(matrix, transform[1]);
	}, new Matrix());
}
function toParent(parent, i) {
	if (this === parent) return this;
	const ctm = this.screenCTM();
	const pCtm = parent.screenCTM().inverse();
	this.addTo(parent, i).untransform().transform(pCtm.multiply(ctm));
	return this;
}
function toRoot(i) {
	return this.toParent(this.root(), i);
}
function transform(o, relative) {
	if (o == null || typeof o === "string") {
		const decomposed = new Matrix(this).decompose();
		return o == null ? decomposed : decomposed[o];
	}
	if (!Matrix.isMatrixLike(o)) o = {
		...o,
		origin: getOrigin(o, this)
	};
	const result = new Matrix(relative === true ? this : relative || false).transform(o);
	return this.attr("transform", result);
}
registerMethods("Element", {
	untransform,
	matrixify,
	toParent,
	toRoot,
	transform
});
var Container = class Container extends Element {
	flatten(parent = this, index) {
		this.each(function() {
			if (this instanceof Container) return this.flatten().ungroup();
		});
		return this;
	}
	ungroup(parent = this.parent(), index = parent.index(this)) {
		index = index === -1 ? parent.children().length : index;
		this.each(function(i, children) {
			return children[children.length - i - 1].toParent(parent, index);
		});
		return this.remove();
	}
};
register(Container, "Container");
var Defs = class extends Container {
	constructor(node, attrs = node) {
		super(nodeOrNew("defs", node), attrs);
	}
	flatten() {
		return this;
	}
	ungroup() {
		return this;
	}
};
register(Defs, "Defs");
var Shape = class extends Element {};
register(Shape, "Shape");
function rx(rx) {
	return this.attr("rx", rx);
}
function ry(ry) {
	return this.attr("ry", ry);
}
function x$3(x) {
	return x == null ? this.cx() - this.rx() : this.cx(x + this.rx());
}
function y$3(y) {
	return y == null ? this.cy() - this.ry() : this.cy(y + this.ry());
}
function cx$1(x) {
	return this.attr("cx", x);
}
function cy$1(y) {
	return this.attr("cy", y);
}
function width$2(width) {
	return width == null ? this.rx() * 2 : this.rx(new SVGNumber(width).divide(2));
}
function height$2(height) {
	return height == null ? this.ry() * 2 : this.ry(new SVGNumber(height).divide(2));
}
var circled = {
	__proto__: null,
	rx,
	ry,
	x: x$3,
	y: y$3,
	cx: cx$1,
	cy: cy$1,
	width: width$2,
	height: height$2
};
var Ellipse = class extends Shape {
	constructor(node, attrs = node) {
		super(nodeOrNew("ellipse", node), attrs);
	}
	size(width, height) {
		const p = proportionalSize(this, width, height);
		return this.rx(new SVGNumber(p.width).divide(2)).ry(new SVGNumber(p.height).divide(2));
	}
};
extend(Ellipse, circled);
registerMethods("Container", { ellipse: wrapWithAttrCheck(function(width = 0, height = width) {
	return this.put(new Ellipse()).size(width, height).move(0, 0);
}) });
register(Ellipse, "Ellipse");
var Fragment = class extends Dom {
	constructor(node = globals.document.createDocumentFragment()) {
		super(node);
	}
	xml(xmlOrFn, outerXML, ns) {
		if (typeof xmlOrFn === "boolean") {
			ns = outerXML;
			outerXML = xmlOrFn;
			xmlOrFn = null;
		}
		if (xmlOrFn == null || typeof xmlOrFn === "function") {
			const wrapper = new Dom(create("wrapper", ns));
			wrapper.add(this.node.cloneNode(true));
			return wrapper.xml(false, ns);
		}
		return super.xml(xmlOrFn, false, ns);
	}
};
register(Fragment, "Fragment");
function from(x, y) {
	return (this._element || this).type === "radialGradient" ? this.attr({
		fx: new SVGNumber(x),
		fy: new SVGNumber(y)
	}) : this.attr({
		x1: new SVGNumber(x),
		y1: new SVGNumber(y)
	});
}
function to(x, y) {
	return (this._element || this).type === "radialGradient" ? this.attr({
		cx: new SVGNumber(x),
		cy: new SVGNumber(y)
	}) : this.attr({
		x2: new SVGNumber(x),
		y2: new SVGNumber(y)
	});
}
var gradiented = {
	__proto__: null,
	from,
	to
};
var Gradient = class extends Container {
	constructor(type, attrs) {
		super(nodeOrNew(type + "Gradient", typeof type === "string" ? null : type), attrs);
	}
	attr(a, b, c) {
		if (a === "transform") a = "gradientTransform";
		return super.attr(a, b, c);
	}
	bbox() {
		return new Box();
	}
	targets() {
		return baseFind("svg [fill*=" + this.id() + "]");
	}
	toString() {
		return this.url();
	}
	update(block) {
		this.clear();
		if (typeof block === "function") block.call(this, this);
		return this;
	}
	url() {
		return "url(#" + this.id() + ")";
	}
};
extend(Gradient, gradiented);
registerMethods({
	Container: { gradient(...args) {
		return this.defs().gradient(...args);
	} },
	Defs: { gradient: wrapWithAttrCheck(function(type, block) {
		return this.put(new Gradient(type)).update(block);
	}) }
});
register(Gradient, "Gradient");
var Pattern = class extends Container {
	constructor(node, attrs = node) {
		super(nodeOrNew("pattern", node), attrs);
	}
	attr(a, b, c) {
		if (a === "transform") a = "patternTransform";
		return super.attr(a, b, c);
	}
	bbox() {
		return new Box();
	}
	targets() {
		return baseFind("svg [fill*=" + this.id() + "]");
	}
	toString() {
		return this.url();
	}
	update(block) {
		this.clear();
		if (typeof block === "function") block.call(this, this);
		return this;
	}
	url() {
		return "url(#" + this.id() + ")";
	}
};
registerMethods({
	Container: { pattern(...args) {
		return this.defs().pattern(...args);
	} },
	Defs: { pattern: wrapWithAttrCheck(function(width, height, block) {
		return this.put(new Pattern()).update(block).attr({
			x: 0,
			y: 0,
			width,
			height,
			patternUnits: "userSpaceOnUse"
		});
	}) }
});
register(Pattern, "Pattern");
var Image$1 = class extends Shape {
	constructor(node, attrs = node) {
		super(nodeOrNew("image", node), attrs);
	}
	load(url, callback) {
		if (!url) return this;
		const img = new globals.window.Image();
		on(img, "load", function(e) {
			const p = this.parent(Pattern);
			if (this.width() === 0 && this.height() === 0) this.size(img.width, img.height);
			if (p instanceof Pattern) {
				if (p.width() === 0 && p.height() === 0) p.size(this.width(), this.height());
			}
			if (typeof callback === "function") callback.call(this, e);
		}, this);
		on(img, "load error", function() {
			off(img);
		});
		return this.attr("href", img.src = url, xlink);
	}
};
registerAttrHook(function(attr, val, _this) {
	if (attr === "fill" || attr === "stroke") {
		if (isImage.test(val)) val = _this.root().defs().image(val);
	}
	if (val instanceof Image$1) val = _this.root().defs().pattern(0, 0, (pattern) => {
		pattern.add(val);
	});
	return val;
});
registerMethods({ Container: { image: wrapWithAttrCheck(function(source, callback) {
	return this.put(new Image$1()).size(0, 0).load(source, callback);
}) } });
register(Image$1, "Image");
var PointArray = class extends SVGArray {
	bbox() {
		let maxX = -Infinity;
		let maxY = -Infinity;
		let minX = Infinity;
		let minY = Infinity;
		this.forEach(function(el) {
			maxX = Math.max(el[0], maxX);
			maxY = Math.max(el[1], maxY);
			minX = Math.min(el[0], minX);
			minY = Math.min(el[1], minY);
		});
		return new Box(minX, minY, maxX - minX, maxY - minY);
	}
	move(x, y) {
		const box = this.bbox();
		x -= box.x;
		y -= box.y;
		if (!isNaN(x) && !isNaN(y)) for (let i = this.length - 1; i >= 0; i--) this[i] = [this[i][0] + x, this[i][1] + y];
		return this;
	}
	parse(array = [0, 0]) {
		const points = [];
		if (array instanceof Array) array = Array.prototype.concat.apply([], array);
		else array = array.trim().split(delimiter).map(parseFloat);
		if (array.length % 2 !== 0) array.pop();
		for (let i = 0, len = array.length; i < len; i = i + 2) points.push([array[i], array[i + 1]]);
		return points;
	}
	size(width, height) {
		let i;
		const box = this.bbox();
		for (i = this.length - 1; i >= 0; i--) {
			if (box.width) this[i][0] = (this[i][0] - box.x) * width / box.width + box.x;
			if (box.height) this[i][1] = (this[i][1] - box.y) * height / box.height + box.y;
		}
		return this;
	}
	toLine() {
		return {
			x1: this[0][0],
			y1: this[0][1],
			x2: this[1][0],
			y2: this[1][1]
		};
	}
	toString() {
		const array = [];
		for (let i = 0, il = this.length; i < il; i++) array.push(this[i].join(","));
		return array.join(" ");
	}
	transform(m) {
		return this.clone().transformO(m);
	}
	transformO(m) {
		if (!Matrix.isMatrixLike(m)) m = new Matrix(m);
		for (let i = this.length; i--;) {
			const [x, y] = this[i];
			this[i][0] = m.a * x + m.c * y + m.e;
			this[i][1] = m.b * x + m.d * y + m.f;
		}
		return this;
	}
};
var MorphArray = PointArray;
function x$2(x) {
	return x == null ? this.bbox().x : this.move(x, this.bbox().y);
}
function y$2(y) {
	return y == null ? this.bbox().y : this.move(this.bbox().x, y);
}
function width$1(width) {
	const b = this.bbox();
	return width == null ? b.width : this.size(width, b.height);
}
function height$1(height) {
	const b = this.bbox();
	return height == null ? b.height : this.size(b.width, height);
}
var pointed = {
	__proto__: null,
	MorphArray,
	x: x$2,
	y: y$2,
	width: width$1,
	height: height$1
};
var Line = class extends Shape {
	constructor(node, attrs = node) {
		super(nodeOrNew("line", node), attrs);
	}
	array() {
		return new PointArray([[this.attr("x1"), this.attr("y1")], [this.attr("x2"), this.attr("y2")]]);
	}
	move(x, y) {
		return this.attr(this.array().move(x, y).toLine());
	}
	plot(x1, y1, x2, y2) {
		if (x1 == null) return this.array();
		else if (typeof y1 !== "undefined") x1 = {
			x1,
			y1,
			x2,
			y2
		};
		else x1 = new PointArray(x1).toLine();
		return this.attr(x1);
	}
	size(width, height) {
		const p = proportionalSize(this, width, height);
		return this.attr(this.array().size(p.width, p.height).toLine());
	}
};
extend(Line, pointed);
registerMethods({ Container: { line: wrapWithAttrCheck(function(...args) {
	return Line.prototype.plot.apply(this.put(new Line()), args[0] != null ? args : [
		0,
		0,
		0,
		0
	]);
}) } });
register(Line, "Line");
var Marker = class extends Container {
	constructor(node, attrs = node) {
		super(nodeOrNew("marker", node), attrs);
	}
	height(height) {
		return this.attr("markerHeight", height);
	}
	orient(orient) {
		return this.attr("orient", orient);
	}
	ref(x, y) {
		return this.attr("refX", x).attr("refY", y);
	}
	toString() {
		return "url(#" + this.id() + ")";
	}
	update(block) {
		this.clear();
		if (typeof block === "function") block.call(this, this);
		return this;
	}
	width(width) {
		return this.attr("markerWidth", width);
	}
};
registerMethods({
	Container: { marker(...args) {
		return this.defs().marker(...args);
	} },
	Defs: { marker: wrapWithAttrCheck(function(width, height, block) {
		return this.put(new Marker()).size(width, height).ref(width / 2, height / 2).viewbox(0, 0, width, height).attr("orient", "auto").update(block);
	}) },
	marker: { marker(marker, width, height, block) {
		let attr = ["marker"];
		if (marker !== "all") attr.push(marker);
		attr = attr.join("-");
		marker = arguments[1] instanceof Marker ? arguments[1] : this.defs().marker(width, height, block);
		return this.attr(attr, marker);
	} }
});
register(Marker, "Marker");
/***
Base Class
==========
The base stepper class that will be
***/
function makeSetterGetter(k, f) {
	return function(v) {
		if (v == null) return this[k];
		this[k] = v;
		if (f) f.call(this);
		return this;
	};
}
var easing = {
	"-": function(pos) {
		return pos;
	},
	"<>": function(pos) {
		return -Math.cos(pos * Math.PI) / 2 + .5;
	},
	">": function(pos) {
		return Math.sin(pos * Math.PI / 2);
	},
	"<": function(pos) {
		return -Math.cos(pos * Math.PI / 2) + 1;
	},
	bezier: function(x1, y1, x2, y2) {
		return function(t) {
			if (t < 0) if (x1 > 0) return y1 / x1 * t;
			else if (x2 > 0) return y2 / x2 * t;
			else return 0;
			else if (t > 1) if (x2 < 1) return (1 - y2) / (1 - x2) * t + (y2 - x2) / (1 - x2);
			else if (x1 < 1) return (1 - y1) / (1 - x1) * t + (y1 - x1) / (1 - x1);
			else return 1;
			else return 3 * t * (1 - t) ** 2 * y1 + 3 * t ** 2 * (1 - t) * y2 + t ** 3;
		};
	},
	steps: function(steps, stepPosition = "end") {
		stepPosition = stepPosition.split("-").reverse()[0];
		let jumps = steps;
		if (stepPosition === "none") --jumps;
		else if (stepPosition === "both") ++jumps;
		return (t, beforeFlag = false) => {
			let step = Math.floor(t * steps);
			const jumping = t * step % 1 === 0;
			if (stepPosition === "start" || stepPosition === "both") ++step;
			if (beforeFlag && jumping) --step;
			if (t >= 0 && step < 0) step = 0;
			if (t <= 1 && step > jumps) step = jumps;
			return step / jumps;
		};
	}
};
var Stepper = class {
	done() {
		return false;
	}
};
/***
Easing Functions
================
***/
var Ease = class extends Stepper {
	constructor(fn = timeline.ease) {
		super();
		this.ease = easing[fn] || fn;
	}
	step(from, to, pos) {
		if (typeof from !== "number") return pos < 1 ? from : to;
		return from + (to - from) * this.ease(pos);
	}
};
/***
Controller Types
================
***/
var Controller = class extends Stepper {
	constructor(fn) {
		super();
		this.stepper = fn;
	}
	done(c) {
		return c.done;
	}
	step(current, target, dt, c) {
		return this.stepper(current, target, dt, c);
	}
};
function recalculate() {
	const duration = (this._duration || 500) / 1e3;
	const overshoot = this._overshoot || 0;
	const eps = 1e-10;
	const pi = Math.PI;
	const os = Math.log(overshoot / 100 + eps);
	const zeta = -os / Math.sqrt(pi * pi + os * os);
	const wn = 3.9 / (zeta * duration);
	this.d = 2 * zeta * wn;
	this.k = wn * wn;
}
var Spring = class extends Controller {
	constructor(duration = 500, overshoot = 0) {
		super();
		this.duration(duration).overshoot(overshoot);
	}
	step(current, target, dt, c) {
		if (typeof current === "string") return current;
		c.done = dt === Infinity;
		if (dt === Infinity) return target;
		if (dt === 0) return current;
		if (dt > 100) dt = 16;
		dt /= 1e3;
		const velocity = c.velocity || 0;
		const acceleration = -this.d * velocity - this.k * (current - target);
		const newPosition = current + velocity * dt + acceleration * dt * dt / 2;
		c.velocity = velocity + acceleration * dt;
		c.done = Math.abs(target - newPosition) + Math.abs(velocity) < .002;
		return c.done ? target : newPosition;
	}
};
extend(Spring, {
	duration: makeSetterGetter("_duration", recalculate),
	overshoot: makeSetterGetter("_overshoot", recalculate)
});
var PID = class extends Controller {
	constructor(p = .1, i = .01, d = 0, windup = 1e3) {
		super();
		this.p(p).i(i).d(d).windup(windup);
	}
	step(current, target, dt, c) {
		if (typeof current === "string") return current;
		c.done = dt === Infinity;
		if (dt === Infinity) return target;
		if (dt === 0) return current;
		const p = target - current;
		let i = (c.integral || 0) + p * dt;
		const d = (p - (c.error || 0)) / dt;
		const windup = this._windup;
		if (windup !== false) i = Math.max(-windup, Math.min(i, windup));
		c.error = p;
		c.integral = i;
		c.done = Math.abs(p) < .001;
		return c.done ? target : current + (this.P * p + this.I * i + this.D * d);
	}
};
extend(PID, {
	windup: makeSetterGetter("_windup"),
	p: makeSetterGetter("P"),
	i: makeSetterGetter("I"),
	d: makeSetterGetter("D")
});
var segmentParameters = {
	M: 2,
	L: 2,
	H: 1,
	V: 1,
	C: 6,
	S: 4,
	Q: 4,
	T: 2,
	A: 7,
	Z: 0
};
var pathHandlers = {
	M: function(c, p, p0) {
		p.x = p0.x = c[0];
		p.y = p0.y = c[1];
		return [
			"M",
			p.x,
			p.y
		];
	},
	L: function(c, p) {
		p.x = c[0];
		p.y = c[1];
		return [
			"L",
			c[0],
			c[1]
		];
	},
	H: function(c, p) {
		p.x = c[0];
		return ["H", c[0]];
	},
	V: function(c, p) {
		p.y = c[0];
		return ["V", c[0]];
	},
	C: function(c, p) {
		p.x = c[4];
		p.y = c[5];
		return [
			"C",
			c[0],
			c[1],
			c[2],
			c[3],
			c[4],
			c[5]
		];
	},
	S: function(c, p) {
		p.x = c[2];
		p.y = c[3];
		return [
			"S",
			c[0],
			c[1],
			c[2],
			c[3]
		];
	},
	Q: function(c, p) {
		p.x = c[2];
		p.y = c[3];
		return [
			"Q",
			c[0],
			c[1],
			c[2],
			c[3]
		];
	},
	T: function(c, p) {
		p.x = c[0];
		p.y = c[1];
		return [
			"T",
			c[0],
			c[1]
		];
	},
	Z: function(c, p, p0) {
		p.x = p0.x;
		p.y = p0.y;
		return ["Z"];
	},
	A: function(c, p) {
		p.x = c[5];
		p.y = c[6];
		return [
			"A",
			c[0],
			c[1],
			c[2],
			c[3],
			c[4],
			c[5],
			c[6]
		];
	}
};
var mlhvqtcsaz = "mlhvqtcsaz".split("");
for (let i = 0, il = mlhvqtcsaz.length; i < il; ++i) pathHandlers[mlhvqtcsaz[i]] = function(i) {
	return function(c, p, p0) {
		if (i === "H") c[0] = c[0] + p.x;
		else if (i === "V") c[0] = c[0] + p.y;
		else if (i === "A") {
			c[5] = c[5] + p.x;
			c[6] = c[6] + p.y;
		} else for (let j = 0, jl = c.length; j < jl; ++j) c[j] = c[j] + (j % 2 ? p.y : p.x);
		return pathHandlers[i](c, p, p0);
	};
}(mlhvqtcsaz[i].toUpperCase());
function makeAbsolut(parser) {
	return pathHandlers[parser.segment[0]](parser.segment.slice(1), parser.p, parser.p0);
}
function segmentComplete(parser) {
	return parser.segment.length && parser.segment.length - 1 === segmentParameters[parser.segment[0].toUpperCase()];
}
function startNewSegment(parser, token) {
	parser.inNumber && finalizeNumber(parser, false);
	const pathLetter = isPathLetter.test(token);
	if (pathLetter) parser.segment = [token];
	else {
		const lastCommand = parser.lastCommand;
		const small = lastCommand.toLowerCase();
		parser.segment = [small === "m" ? lastCommand === small ? "l" : "L" : lastCommand];
	}
	parser.inSegment = true;
	parser.lastCommand = parser.segment[0];
	return pathLetter;
}
function finalizeNumber(parser, inNumber) {
	if (!parser.inNumber) throw new Error("Parser Error");
	parser.number && parser.segment.push(parseFloat(parser.number));
	parser.inNumber = inNumber;
	parser.number = "";
	parser.pointSeen = false;
	parser.hasExponent = false;
	if (segmentComplete(parser)) finalizeSegment(parser);
}
function finalizeSegment(parser) {
	parser.inSegment = false;
	if (parser.absolute) parser.segment = makeAbsolut(parser);
	parser.segments.push(parser.segment);
}
function isArcFlag(parser) {
	if (!parser.segment.length) return false;
	const isArc = parser.segment[0].toUpperCase() === "A";
	const length = parser.segment.length;
	return isArc && (length === 4 || length === 5);
}
function isExponential(parser) {
	return parser.lastToken.toUpperCase() === "E";
}
function pathParser(d, toAbsolute = true) {
	let index = 0;
	let token = "";
	const parser = {
		segment: [],
		inNumber: false,
		number: "",
		lastToken: "",
		inSegment: false,
		segments: [],
		pointSeen: false,
		hasExponent: false,
		absolute: toAbsolute,
		p0: new Point(),
		p: new Point()
	};
	while (parser.lastToken = token, token = d.charAt(index++)) {
		if (!parser.inSegment) {
			if (startNewSegment(parser, token)) continue;
		}
		if (token === ".") {
			if (parser.pointSeen || parser.hasExponent) {
				finalizeNumber(parser, false);
				--index;
				continue;
			}
			parser.inNumber = true;
			parser.pointSeen = true;
			parser.number += token;
			continue;
		}
		if (!isNaN(parseInt(token))) {
			if (parser.number === "0" || isArcFlag(parser)) {
				parser.inNumber = true;
				parser.number = token;
				finalizeNumber(parser, true);
				continue;
			}
			parser.inNumber = true;
			parser.number += token;
			continue;
		}
		if (token === " " || token === ",") {
			if (parser.inNumber) finalizeNumber(parser, false);
			continue;
		}
		if (token === "-") {
			if (parser.inNumber && !isExponential(parser)) {
				finalizeNumber(parser, false);
				--index;
				continue;
			}
			parser.number += token;
			parser.inNumber = true;
			continue;
		}
		if (token.toUpperCase() === "E") {
			parser.number += token;
			parser.hasExponent = true;
			continue;
		}
		if (isPathLetter.test(token)) {
			if (parser.inNumber) finalizeNumber(parser, false);
			else if (!segmentComplete(parser)) throw new Error("parser Error");
			else finalizeSegment(parser);
			--index;
		}
	}
	if (parser.inNumber) finalizeNumber(parser, false);
	if (parser.inSegment && segmentComplete(parser)) finalizeSegment(parser);
	return parser.segments;
}
function arrayToString(a) {
	let s = "";
	for (let i = 0, il = a.length; i < il; i++) {
		s += a[i][0];
		if (a[i][1] != null) {
			s += a[i][1];
			if (a[i][2] != null) {
				s += " ";
				s += a[i][2];
				if (a[i][3] != null) {
					s += " ";
					s += a[i][3];
					s += " ";
					s += a[i][4];
					if (a[i][5] != null) {
						s += " ";
						s += a[i][5];
						s += " ";
						s += a[i][6];
						if (a[i][7] != null) {
							s += " ";
							s += a[i][7];
						}
					}
				}
			}
		}
	}
	return s + " ";
}
var PathArray = class extends SVGArray {
	bbox() {
		parser().path.setAttribute("d", this.toString());
		return new Box(parser.nodes.path.getBBox());
	}
	move(x, y) {
		const box = this.bbox();
		x -= box.x;
		y -= box.y;
		if (!isNaN(x) && !isNaN(y)) for (let l, i = this.length - 1; i >= 0; i--) {
			l = this[i][0];
			if (l === "M" || l === "L" || l === "T") {
				this[i][1] += x;
				this[i][2] += y;
			} else if (l === "H") this[i][1] += x;
			else if (l === "V") this[i][1] += y;
			else if (l === "C" || l === "S" || l === "Q") {
				this[i][1] += x;
				this[i][2] += y;
				this[i][3] += x;
				this[i][4] += y;
				if (l === "C") {
					this[i][5] += x;
					this[i][6] += y;
				}
			} else if (l === "A") {
				this[i][6] += x;
				this[i][7] += y;
			}
		}
		return this;
	}
	parse(d = "M0 0") {
		if (Array.isArray(d)) d = Array.prototype.concat.apply([], d).toString();
		return pathParser(d);
	}
	size(width, height) {
		const box = this.bbox();
		let i, l;
		box.width = box.width === 0 ? 1 : box.width;
		box.height = box.height === 0 ? 1 : box.height;
		for (i = this.length - 1; i >= 0; i--) {
			l = this[i][0];
			if (l === "M" || l === "L" || l === "T") {
				this[i][1] = (this[i][1] - box.x) * width / box.width + box.x;
				this[i][2] = (this[i][2] - box.y) * height / box.height + box.y;
			} else if (l === "H") this[i][1] = (this[i][1] - box.x) * width / box.width + box.x;
			else if (l === "V") this[i][1] = (this[i][1] - box.y) * height / box.height + box.y;
			else if (l === "C" || l === "S" || l === "Q") {
				this[i][1] = (this[i][1] - box.x) * width / box.width + box.x;
				this[i][2] = (this[i][2] - box.y) * height / box.height + box.y;
				this[i][3] = (this[i][3] - box.x) * width / box.width + box.x;
				this[i][4] = (this[i][4] - box.y) * height / box.height + box.y;
				if (l === "C") {
					this[i][5] = (this[i][5] - box.x) * width / box.width + box.x;
					this[i][6] = (this[i][6] - box.y) * height / box.height + box.y;
				}
			} else if (l === "A") {
				this[i][1] = this[i][1] * width / box.width;
				this[i][2] = this[i][2] * height / box.height;
				this[i][6] = (this[i][6] - box.x) * width / box.width + box.x;
				this[i][7] = (this[i][7] - box.y) * height / box.height + box.y;
			}
		}
		return this;
	}
	toString() {
		return arrayToString(this);
	}
};
var getClassForType = (value) => {
	const type = typeof value;
	if (type === "number") return SVGNumber;
	else if (type === "string") if (Color.isColor(value)) return Color;
	else if (delimiter.test(value)) return isPathLetter.test(value) ? PathArray : SVGArray;
	else if (numberAndUnit.test(value)) return SVGNumber;
	else return NonMorphable;
	else if (morphableTypes.indexOf(value.constructor) > -1) return value.constructor;
	else if (Array.isArray(value)) return SVGArray;
	else if (type === "object") return ObjectBag;
	else return NonMorphable;
};
var Morphable = class {
	constructor(stepper) {
		this._stepper = stepper || new Ease("-");
		this._from = null;
		this._to = null;
		this._type = null;
		this._context = null;
		this._morphObj = null;
	}
	at(pos) {
		return this._morphObj.morph(this._from, this._to, pos, this._stepper, this._context);
	}
	done() {
		return this._context.map(this._stepper.done).reduce(function(last, curr) {
			return last && curr;
		}, true);
	}
	from(val) {
		if (val == null) return this._from;
		this._from = this._set(val);
		return this;
	}
	stepper(stepper) {
		if (stepper == null) return this._stepper;
		this._stepper = stepper;
		return this;
	}
	to(val) {
		if (val == null) return this._to;
		this._to = this._set(val);
		return this;
	}
	type(type) {
		if (type == null) return this._type;
		this._type = type;
		return this;
	}
	_set(value) {
		if (!this._type) this.type(getClassForType(value));
		let result = new this._type(value);
		if (this._type === Color) result = this._to ? result[this._to[4]]() : this._from ? result[this._from[4]]() : result;
		if (this._type === ObjectBag) result = this._to ? result.align(this._to) : this._from ? result.align(this._from) : result;
		result = result.toConsumable();
		this._morphObj = this._morphObj || new this._type();
		this._context = this._context || Array.apply(null, Array(result.length)).map(Object).map(function(o) {
			o.done = true;
			return o;
		});
		return result;
	}
};
var NonMorphable = class {
	constructor(...args) {
		this.init(...args);
	}
	init(val) {
		val = Array.isArray(val) ? val[0] : val;
		this.value = val;
		return this;
	}
	toArray() {
		return [this.value];
	}
	valueOf() {
		return this.value;
	}
};
var TransformBag = class TransformBag {
	constructor(...args) {
		this.init(...args);
	}
	init(obj) {
		if (Array.isArray(obj)) obj = {
			scaleX: obj[0],
			scaleY: obj[1],
			shear: obj[2],
			rotate: obj[3],
			translateX: obj[4],
			translateY: obj[5],
			originX: obj[6],
			originY: obj[7]
		};
		Object.assign(this, TransformBag.defaults, obj);
		return this;
	}
	toArray() {
		const v = this;
		return [
			v.scaleX,
			v.scaleY,
			v.shear,
			v.rotate,
			v.translateX,
			v.translateY,
			v.originX,
			v.originY
		];
	}
};
TransformBag.defaults = {
	scaleX: 1,
	scaleY: 1,
	shear: 0,
	rotate: 0,
	translateX: 0,
	translateY: 0,
	originX: 0,
	originY: 0
};
var sortByKey = (a, b) => {
	return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
};
var ObjectBag = class {
	constructor(...args) {
		this.init(...args);
	}
	align(other) {
		const values = this.values;
		for (let i = 0, il = values.length; i < il; ++i) {
			if (values[i + 1] === other[i + 1]) {
				if (values[i + 1] === Color && other[i + 7] !== values[i + 7]) {
					const space = other[i + 7];
					const color = new Color(this.values.splice(i + 3, 5))[space]().toArray();
					this.values.splice(i + 3, 0, ...color);
				}
				i += values[i + 2] + 2;
				continue;
			}
			if (!other[i + 1]) return this;
			const defaultObject = new other[i + 1]().toArray();
			const toDelete = values[i + 2] + 3;
			values.splice(i, toDelete, other[i], other[i + 1], other[i + 2], ...defaultObject);
			i += values[i + 2] + 2;
		}
		return this;
	}
	init(objOrArr) {
		this.values = [];
		if (Array.isArray(objOrArr)) {
			this.values = objOrArr.slice();
			return;
		}
		objOrArr = objOrArr || {};
		const entries = [];
		for (const i in objOrArr) {
			const Type = getClassForType(objOrArr[i]);
			const val = new Type(objOrArr[i]).toArray();
			entries.push([
				i,
				Type,
				val.length,
				...val
			]);
		}
		entries.sort(sortByKey);
		this.values = entries.reduce((last, curr) => last.concat(curr), []);
		return this;
	}
	toArray() {
		return this.values;
	}
	valueOf() {
		const obj = {};
		const arr = this.values;
		while (arr.length) {
			const key = arr.shift();
			const Type = arr.shift();
			const num = arr.shift();
			obj[key] = new Type(arr.splice(0, num));
		}
		return obj;
	}
};
var morphableTypes = [
	NonMorphable,
	TransformBag,
	ObjectBag
];
function registerMorphableType(type = []) {
	morphableTypes.push(...[].concat(type));
}
function makeMorphable() {
	extend(morphableTypes, {
		to(val) {
			return new Morphable().type(this.constructor).from(this.toArray()).to(val);
		},
		fromArray(arr) {
			this.init(arr);
			return this;
		},
		toConsumable() {
			return this.toArray();
		},
		morph(from, to, pos, stepper, context) {
			const mapper = function(i, index) {
				return stepper.step(i, to[index], pos, context[index], context);
			};
			return this.fromArray(from.map(mapper));
		}
	});
}
var Path = class extends Shape {
	constructor(node, attrs = node) {
		super(nodeOrNew("path", node), attrs);
	}
	array() {
		return this._array || (this._array = new PathArray(this.attr("d")));
	}
	clear() {
		delete this._array;
		return this;
	}
	height(height) {
		return height == null ? this.bbox().height : this.size(this.bbox().width, height);
	}
	move(x, y) {
		return this.attr("d", this.array().move(x, y));
	}
	plot(d) {
		return d == null ? this.array() : this.clear().attr("d", typeof d === "string" ? d : this._array = new PathArray(d));
	}
	size(width, height) {
		const p = proportionalSize(this, width, height);
		return this.attr("d", this.array().size(p.width, p.height));
	}
	width(width) {
		return width == null ? this.bbox().width : this.size(width, this.bbox().height);
	}
	x(x) {
		return x == null ? this.bbox().x : this.move(x, this.bbox().y);
	}
	y(y) {
		return y == null ? this.bbox().y : this.move(this.bbox().x, y);
	}
};
Path.prototype.MorphArray = PathArray;
registerMethods({ Container: { path: wrapWithAttrCheck(function(d) {
	return this.put(new Path()).plot(d || new PathArray());
}) } });
register(Path, "Path");
function array() {
	return this._array || (this._array = new PointArray(this.attr("points")));
}
function clear() {
	delete this._array;
	return this;
}
function move$2(x, y) {
	return this.attr("points", this.array().move(x, y));
}
function plot(p) {
	return p == null ? this.array() : this.clear().attr("points", typeof p === "string" ? p : this._array = new PointArray(p));
}
function size$1(width, height) {
	const p = proportionalSize(this, width, height);
	return this.attr("points", this.array().size(p.width, p.height));
}
var poly = {
	__proto__: null,
	array,
	clear,
	move: move$2,
	plot,
	size: size$1
};
var Polygon = class extends Shape {
	constructor(node, attrs = node) {
		super(nodeOrNew("polygon", node), attrs);
	}
};
registerMethods({ Container: { polygon: wrapWithAttrCheck(function(p) {
	return this.put(new Polygon()).plot(p || new PointArray());
}) } });
extend(Polygon, pointed);
extend(Polygon, poly);
register(Polygon, "Polygon");
var Polyline = class extends Shape {
	constructor(node, attrs = node) {
		super(nodeOrNew("polyline", node), attrs);
	}
};
registerMethods({ Container: { polyline: wrapWithAttrCheck(function(p) {
	return this.put(new Polyline()).plot(p || new PointArray());
}) } });
extend(Polyline, pointed);
extend(Polyline, poly);
register(Polyline, "Polyline");
var Rect = class extends Shape {
	constructor(node, attrs = node) {
		super(nodeOrNew("rect", node), attrs);
	}
};
extend(Rect, {
	rx,
	ry
});
registerMethods({ Container: { rect: wrapWithAttrCheck(function(width, height) {
	return this.put(new Rect()).size(width, height);
}) } });
register(Rect, "Rect");
var Queue = class {
	constructor() {
		this._first = null;
		this._last = null;
	}
	first() {
		return this._first && this._first.value;
	}
	last() {
		return this._last && this._last.value;
	}
	push(value) {
		const item = typeof value.next !== "undefined" ? value : {
			value,
			next: null,
			prev: null
		};
		if (this._last) {
			item.prev = this._last;
			this._last.next = item;
			this._last = item;
		} else {
			this._last = item;
			this._first = item;
		}
		return item;
	}
	remove(item) {
		if (item.prev) item.prev.next = item.next;
		if (item.next) item.next.prev = item.prev;
		if (item === this._last) this._last = item.prev;
		if (item === this._first) this._first = item.next;
		item.prev = null;
		item.next = null;
	}
	shift() {
		const remove = this._first;
		if (!remove) return null;
		this._first = remove.next;
		if (this._first) this._first.prev = null;
		this._last = this._first ? this._last : null;
		return remove.value;
	}
};
var Animator = {
	nextDraw: null,
	frames: new Queue(),
	timeouts: new Queue(),
	immediates: new Queue(),
	timer: () => globals.window.performance || globals.window.Date,
	transforms: [],
	frame(fn) {
		const node = Animator.frames.push({ run: fn });
		if (Animator.nextDraw === null) Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw);
		return node;
	},
	timeout(fn, delay) {
		delay = delay || 0;
		const time = Animator.timer().now() + delay;
		const node = Animator.timeouts.push({
			run: fn,
			time
		});
		if (Animator.nextDraw === null) Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw);
		return node;
	},
	immediate(fn) {
		const node = Animator.immediates.push(fn);
		if (Animator.nextDraw === null) Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw);
		return node;
	},
	cancelFrame(node) {
		node != null && Animator.frames.remove(node);
	},
	clearTimeout(node) {
		node != null && Animator.timeouts.remove(node);
	},
	cancelImmediate(node) {
		node != null && Animator.immediates.remove(node);
	},
	_draw(now) {
		let nextTimeout = null;
		const lastTimeout = Animator.timeouts.last();
		while (nextTimeout = Animator.timeouts.shift()) {
			if (now >= nextTimeout.time) nextTimeout.run();
			else Animator.timeouts.push(nextTimeout);
			if (nextTimeout === lastTimeout) break;
		}
		let nextFrame = null;
		const lastFrame = Animator.frames.last();
		while (nextFrame !== lastFrame && (nextFrame = Animator.frames.shift())) nextFrame.run(now);
		let nextImmediate = null;
		while (nextImmediate = Animator.immediates.shift()) nextImmediate();
		Animator.nextDraw = Animator.timeouts.first() || Animator.frames.first() ? globals.window.requestAnimationFrame(Animator._draw) : null;
	}
};
var makeSchedule = function(runnerInfo) {
	const start = runnerInfo.start;
	const duration = runnerInfo.runner.duration();
	return {
		start,
		duration,
		end: start + duration,
		runner: runnerInfo.runner
	};
};
var defaultSource = function() {
	const w = globals.window;
	return (w.performance || w.Date).now();
};
var Timeline = class extends EventTarget {
	constructor(timeSource = defaultSource) {
		super();
		this._timeSource = timeSource;
		this._startTime = 0;
		this._speed = 1;
		this._persist = 0;
		this._nextFrame = null;
		this._paused = true;
		this._runners = [];
		this._runnerIds = [];
		this._lastRunnerId = -1;
		this._time = 0;
		this._lastSourceTime = 0;
		this._lastStepTime = 0;
		this._step = this._stepFn.bind(this, false);
		this._stepImmediate = this._stepFn.bind(this, true);
	}
	active() {
		return !!this._nextFrame;
	}
	finish() {
		this.time(this.getEndTimeOfTimeline() + 1);
		return this.pause();
	}
	getEndTime() {
		const lastRunnerInfo = this.getLastRunnerInfo();
		const lastDuration = lastRunnerInfo ? lastRunnerInfo.runner.duration() : 0;
		return (lastRunnerInfo ? lastRunnerInfo.start : this._time) + lastDuration;
	}
	getEndTimeOfTimeline() {
		const endTimes = this._runners.map((i) => i.start + i.runner.duration());
		return Math.max(0, ...endTimes);
	}
	getLastRunnerInfo() {
		return this.getRunnerInfoById(this._lastRunnerId);
	}
	getRunnerInfoById(id) {
		return this._runners[this._runnerIds.indexOf(id)] || null;
	}
	pause() {
		this._paused = true;
		return this._continue();
	}
	persist(dtOrForever) {
		if (dtOrForever == null) return this._persist;
		this._persist = dtOrForever;
		return this;
	}
	play() {
		this._paused = false;
		return this.updateTime()._continue();
	}
	reverse(yes) {
		const currentSpeed = this.speed();
		if (yes == null) return this.speed(-currentSpeed);
		const positive = Math.abs(currentSpeed);
		return this.speed(yes ? -positive : positive);
	}
	schedule(runner, delay, when) {
		if (runner == null) return this._runners.map(makeSchedule);
		let absoluteStartTime = 0;
		const endTime = this.getEndTime();
		delay = delay || 0;
		if (when == null || when === "last" || when === "after") absoluteStartTime = endTime;
		else if (when === "absolute" || when === "start") {
			absoluteStartTime = delay;
			delay = 0;
		} else if (when === "now") absoluteStartTime = this._time;
		else if (when === "relative") {
			const runnerInfo = this.getRunnerInfoById(runner.id);
			if (runnerInfo) {
				absoluteStartTime = runnerInfo.start + delay;
				delay = 0;
			}
		} else if (when === "with-last") {
			const lastRunnerInfo = this.getLastRunnerInfo();
			absoluteStartTime = lastRunnerInfo ? lastRunnerInfo.start : this._time;
		} else throw new Error("Invalid value for the \"when\" parameter");
		runner.unschedule();
		runner.timeline(this);
		const persist = runner.persist();
		const runnerInfo = {
			persist: persist === null ? this._persist : persist,
			start: absoluteStartTime + delay,
			runner
		};
		this._lastRunnerId = runner.id;
		this._runners.push(runnerInfo);
		this._runners.sort((a, b) => a.start - b.start);
		this._runnerIds = this._runners.map((info) => info.runner.id);
		this.updateTime()._continue();
		return this;
	}
	seek(dt) {
		return this.time(this._time + dt);
	}
	source(fn) {
		if (fn == null) return this._timeSource;
		this._timeSource = fn;
		return this;
	}
	speed(speed) {
		if (speed == null) return this._speed;
		this._speed = speed;
		return this;
	}
	stop() {
		this.time(0);
		return this.pause();
	}
	time(time) {
		if (time == null) return this._time;
		this._time = time;
		return this._continue(true);
	}
	unschedule(runner) {
		const index = this._runnerIds.indexOf(runner.id);
		if (index < 0) return this;
		this._runners.splice(index, 1);
		this._runnerIds.splice(index, 1);
		runner.timeline(null);
		return this;
	}
	updateTime() {
		if (!this.active()) this._lastSourceTime = this._timeSource();
		return this;
	}
	_continue(immediateStep = false) {
		Animator.cancelFrame(this._nextFrame);
		this._nextFrame = null;
		if (immediateStep) return this._stepImmediate();
		if (this._paused) return this;
		this._nextFrame = Animator.frame(this._step);
		return this;
	}
	_stepFn(immediateStep = false) {
		const time = this._timeSource();
		let dtSource = time - this._lastSourceTime;
		if (immediateStep) dtSource = 0;
		const dtTime = this._speed * dtSource + (this._time - this._lastStepTime);
		this._lastSourceTime = time;
		if (!immediateStep) {
			this._time += dtTime;
			this._time = this._time < 0 ? 0 : this._time;
		}
		this._lastStepTime = this._time;
		this.fire("time", this._time);
		for (let k = this._runners.length; k--;) {
			const runnerInfo = this._runners[k];
			const runner = runnerInfo.runner;
			if (this._time - runnerInfo.start <= 0) runner.reset();
		}
		let runnersLeft = false;
		for (let i = 0, len = this._runners.length; i < len; i++) {
			const runnerInfo = this._runners[i];
			const runner = runnerInfo.runner;
			let dt = dtTime;
			const dtToStart = this._time - runnerInfo.start;
			if (dtToStart <= 0) {
				runnersLeft = true;
				continue;
			} else if (dtToStart < dt) dt = dtToStart;
			if (!runner.active()) continue;
			if (!runner.step(dt).done) runnersLeft = true;
			else if (runnerInfo.persist !== true) {
				if (runner.duration() - runner.time() + this._time + runnerInfo.persist < this._time) {
					runner.unschedule();
					--i;
					--len;
				}
			}
		}
		if (runnersLeft && !(this._speed < 0 && this._time === 0) || this._runnerIds.length && this._speed < 0 && this._time > 0) this._continue();
		else {
			this.pause();
			this.fire("finished");
		}
		return this;
	}
};
registerMethods({ Element: { timeline: function(timeline) {
	if (timeline == null) {
		this._timeline = this._timeline || new Timeline();
		return this._timeline;
	} else {
		this._timeline = timeline;
		return this;
	}
} } });
var Runner = class Runner extends EventTarget {
	constructor(options) {
		super();
		this.id = Runner.id++;
		options = options == null ? timeline.duration : options;
		options = typeof options === "function" ? new Controller(options) : options;
		this._element = null;
		this._timeline = null;
		this.done = false;
		this._queue = [];
		this._duration = typeof options === "number" && options;
		this._isDeclarative = options instanceof Controller;
		this._stepper = this._isDeclarative ? options : new Ease();
		this._history = {};
		this.enabled = true;
		this._time = 0;
		this._lastTime = 0;
		this._reseted = true;
		this.transforms = new Matrix();
		this.transformId = 1;
		this._haveReversed = false;
		this._reverse = false;
		this._loopsDone = 0;
		this._swing = false;
		this._wait = 0;
		this._times = 1;
		this._frameId = null;
		this._persist = this._isDeclarative ? true : null;
	}
	static sanitise(duration, delay, when) {
		let times = 1;
		let swing = false;
		let wait = 0;
		duration = duration || timeline.duration;
		delay = delay || timeline.delay;
		when = when || "last";
		if (typeof duration === "object" && !(duration instanceof Stepper)) {
			delay = duration.delay || delay;
			when = duration.when || when;
			swing = duration.swing || swing;
			times = duration.times || times;
			wait = duration.wait || wait;
			duration = duration.duration || timeline.duration;
		}
		return {
			duration,
			delay,
			swing,
			times,
			wait,
			when
		};
	}
	active(enabled) {
		if (enabled == null) return this.enabled;
		this.enabled = enabled;
		return this;
	}
	addTransform(transform, index) {
		this.transforms.lmultiplyO(transform);
		return this;
	}
	after(fn) {
		return this.on("finished", fn);
	}
	animate(duration, delay, when) {
		const o = Runner.sanitise(duration, delay, when);
		const runner = new Runner(o.duration);
		if (this._timeline) runner.timeline(this._timeline);
		if (this._element) runner.element(this._element);
		return runner.loop(o).schedule(o.delay, o.when);
	}
	clearTransform() {
		this.transforms = new Matrix();
		return this;
	}
	clearTransformsFromQueue() {
		if (!this.done || !this._timeline || !this._timeline._runnerIds.includes(this.id)) this._queue = this._queue.filter((item) => {
			return !item.isTransform;
		});
	}
	delay(delay) {
		return this.animate(0, delay);
	}
	duration() {
		return this._times * (this._wait + this._duration) - this._wait;
	}
	during(fn) {
		return this.queue(null, fn);
	}
	ease(fn) {
		this._stepper = new Ease(fn);
		return this;
	}
	element(element) {
		if (element == null) return this._element;
		this._element = element;
		element._prepareRunner();
		return this;
	}
	finish() {
		return this.step(Infinity);
	}
	loop(times, swing, wait) {
		if (typeof times === "object") {
			swing = times.swing;
			wait = times.wait;
			times = times.times;
		}
		this._times = times || Infinity;
		this._swing = swing || false;
		this._wait = wait || 0;
		if (this._times === true) this._times = Infinity;
		return this;
	}
	loops(p) {
		const loopDuration = this._duration + this._wait;
		if (p == null) {
			const loopsDone = Math.floor(this._time / loopDuration);
			const position = (this._time - loopsDone * loopDuration) / this._duration;
			return Math.min(loopsDone + position, this._times);
		}
		const whole = Math.floor(p);
		const partial = p % 1;
		const time = loopDuration * whole + this._duration * partial;
		return this.time(time);
	}
	persist(dtOrForever) {
		if (dtOrForever == null) return this._persist;
		this._persist = dtOrForever;
		return this;
	}
	position(p) {
		const x = this._time;
		const d = this._duration;
		const w = this._wait;
		const t = this._times;
		const s = this._swing;
		const r = this._reverse;
		let position;
		if (p == null) {
			const f = function(x) {
				const swinging = s * Math.floor(x % (2 * (w + d)) / (w + d));
				const backwards = swinging && !r || !swinging && r;
				const uncliped = Math.pow(-1, backwards) * (x % (w + d)) / d + backwards;
				return Math.max(Math.min(uncliped, 1), 0);
			};
			const endTime = t * (w + d) - w;
			position = x <= 0 ? Math.round(f(1e-5)) : x < endTime ? f(x) : Math.round(f(endTime - 1e-5));
			return position;
		}
		const loopsDone = Math.floor(this.loops());
		const swingForward = s && loopsDone % 2 === 0;
		position = loopsDone + (swingForward && !r || r && swingForward ? p : 1 - p);
		return this.loops(position);
	}
	progress(p) {
		if (p == null) return Math.min(1, this._time / this.duration());
		return this.time(p * this.duration());
	}
	queue(initFn, runFn, retargetFn, isTransform) {
		this._queue.push({
			initialiser: initFn || noop,
			runner: runFn || noop,
			retarget: retargetFn,
			isTransform,
			initialised: false,
			finished: false
		});
		this.timeline() && this.timeline()._continue();
		return this;
	}
	reset() {
		if (this._reseted) return this;
		this.time(0);
		this._reseted = true;
		return this;
	}
	reverse(reverse) {
		this._reverse = reverse == null ? !this._reverse : reverse;
		return this;
	}
	schedule(timeline, delay, when) {
		if (!(timeline instanceof Timeline)) {
			when = delay;
			delay = timeline;
			timeline = this.timeline();
		}
		if (!timeline) throw Error("Runner cannot be scheduled without timeline");
		timeline.schedule(this, delay, when);
		return this;
	}
	step(dt) {
		if (!this.enabled) return this;
		dt = dt == null ? 16 : dt;
		this._time += dt;
		const position = this.position();
		const running = this._lastPosition !== position && this._time >= 0;
		this._lastPosition = position;
		const duration = this.duration();
		const justStarted = this._lastTime <= 0 && this._time > 0;
		const justFinished = this._lastTime < duration && this._time >= duration;
		this._lastTime = this._time;
		if (justStarted) this.fire("start", this);
		const declarative = this._isDeclarative;
		this.done = !declarative && !justFinished && this._time >= duration;
		this._reseted = false;
		let converged = false;
		if (running || declarative) {
			this._initialise(running);
			this.transforms = new Matrix();
			converged = this._run(declarative ? dt : position);
			this.fire("step", this);
		}
		this.done = this.done || converged && declarative;
		if (justFinished) this.fire("finished", this);
		return this;
	}
	time(time) {
		if (time == null) return this._time;
		const dt = time - this._time;
		this.step(dt);
		return this;
	}
	timeline(timeline) {
		if (typeof timeline === "undefined") return this._timeline;
		this._timeline = timeline;
		return this;
	}
	unschedule() {
		const timeline = this.timeline();
		timeline && timeline.unschedule(this);
		return this;
	}
	_initialise(running) {
		if (!running && !this._isDeclarative) return;
		for (let i = 0, len = this._queue.length; i < len; ++i) {
			const current = this._queue[i];
			const needsIt = this._isDeclarative || !current.initialised && running;
			running = !current.finished;
			if (needsIt && running) {
				current.initialiser.call(this);
				current.initialised = true;
			}
		}
	}
	_rememberMorpher(method, morpher) {
		this._history[method] = {
			morpher,
			caller: this._queue[this._queue.length - 1]
		};
		if (this._isDeclarative) {
			const timeline = this.timeline();
			timeline && timeline.play();
		}
	}
	_run(positionOrDt) {
		let allfinished = true;
		for (let i = 0, len = this._queue.length; i < len; ++i) {
			const current = this._queue[i];
			const converged = current.runner.call(this, positionOrDt);
			current.finished = current.finished || converged === true;
			allfinished = allfinished && current.finished;
		}
		return allfinished;
	}
	_tryRetarget(method, target, extra) {
		if (this._history[method]) {
			if (!this._history[method].caller.initialised) {
				const index = this._queue.indexOf(this._history[method].caller);
				this._queue.splice(index, 1);
				return false;
			}
			if (this._history[method].caller.retarget) this._history[method].caller.retarget.call(this, target, extra);
			else this._history[method].morpher.to(target);
			this._history[method].caller.finished = false;
			const timeline = this.timeline();
			timeline && timeline.play();
			return true;
		}
		return false;
	}
};
Runner.id = 0;
var FakeRunner = class {
	constructor(transforms = new Matrix(), id = -1, done = true) {
		this.transforms = transforms;
		this.id = id;
		this.done = done;
	}
	clearTransformsFromQueue() {}
};
extend([Runner, FakeRunner], { mergeWith(runner) {
	return new FakeRunner(runner.transforms.lmultiply(this.transforms), runner.id);
} });
var lmultiply = (last, curr) => last.lmultiplyO(curr);
var getRunnerTransform = (runner) => runner.transforms;
function mergeTransforms() {
	const netTransform = this._transformationRunners.runners.map(getRunnerTransform).reduce(lmultiply, new Matrix());
	this.transform(netTransform);
	this._transformationRunners.merge();
	if (this._transformationRunners.length() === 1) this._frameId = null;
}
var RunnerArray = class {
	constructor() {
		this.runners = [];
		this.ids = [];
	}
	add(runner) {
		if (this.runners.includes(runner)) return;
		const id = runner.id + 1;
		this.runners.push(runner);
		this.ids.push(id);
		return this;
	}
	clearBefore(id) {
		const deleteCnt = this.ids.indexOf(id + 1) || 1;
		this.ids.splice(0, deleteCnt, 0);
		this.runners.splice(0, deleteCnt, new FakeRunner()).forEach((r) => r.clearTransformsFromQueue());
		return this;
	}
	edit(id, newRunner) {
		const index = this.ids.indexOf(id + 1);
		this.ids.splice(index, 1, id + 1);
		this.runners.splice(index, 1, newRunner);
		return this;
	}
	getByID(id) {
		return this.runners[this.ids.indexOf(id + 1)];
	}
	length() {
		return this.ids.length;
	}
	merge() {
		let lastRunner = null;
		for (let i = 0; i < this.runners.length; ++i) {
			const runner = this.runners[i];
			if (lastRunner && runner.done && lastRunner.done && (!runner._timeline || !runner._timeline._runnerIds.includes(runner.id)) && (!lastRunner._timeline || !lastRunner._timeline._runnerIds.includes(lastRunner.id))) {
				this.remove(runner.id);
				const newRunner = runner.mergeWith(lastRunner);
				this.edit(lastRunner.id, newRunner);
				lastRunner = newRunner;
				--i;
			} else lastRunner = runner;
		}
		return this;
	}
	remove(id) {
		const index = this.ids.indexOf(id + 1);
		this.ids.splice(index, 1);
		this.runners.splice(index, 1);
		return this;
	}
};
registerMethods({ Element: {
	animate(duration, delay, when) {
		const o = Runner.sanitise(duration, delay, when);
		const timeline = this.timeline();
		return new Runner(o.duration).loop(o).element(this).timeline(timeline.play()).schedule(o.delay, o.when);
	},
	delay(by, when) {
		return this.animate(0, by, when);
	},
	_clearTransformRunnersBefore(currentRunner) {
		this._transformationRunners.clearBefore(currentRunner.id);
	},
	_currentTransform(current) {
		return this._transformationRunners.runners.filter((runner) => runner.id <= current.id).map(getRunnerTransform).reduce(lmultiply, new Matrix());
	},
	_addRunner(runner) {
		this._transformationRunners.add(runner);
		Animator.cancelImmediate(this._frameId);
		this._frameId = Animator.immediate(mergeTransforms.bind(this));
	},
	_prepareRunner() {
		if (this._frameId == null) this._transformationRunners = new RunnerArray().add(new FakeRunner(new Matrix(this)));
	}
} });
var difference = (a, b) => a.filter((x) => !b.includes(x));
extend(Runner, {
	attr(a, v) {
		return this.styleAttr("attr", a, v);
	},
	css(s, v) {
		return this.styleAttr("css", s, v);
	},
	styleAttr(type, nameOrAttrs, val) {
		if (typeof nameOrAttrs === "string") return this.styleAttr(type, { [nameOrAttrs]: val });
		let attrs = nameOrAttrs;
		if (this._tryRetarget(type, attrs)) return this;
		let morpher = new Morphable(this._stepper).to(attrs);
		let keys = Object.keys(attrs);
		this.queue(function() {
			morpher = morpher.from(this.element()[type](keys));
		}, function(pos) {
			this.element()[type](morpher.at(pos).valueOf());
			return morpher.done();
		}, function(newToAttrs) {
			const newKeys = Object.keys(newToAttrs);
			const differences = difference(newKeys, keys);
			if (differences.length) {
				const addedFromAttrs = this.element()[type](differences);
				const oldFromAttrs = new ObjectBag(morpher.from()).valueOf();
				Object.assign(oldFromAttrs, addedFromAttrs);
				morpher.from(oldFromAttrs);
			}
			const oldToAttrs = new ObjectBag(morpher.to()).valueOf();
			Object.assign(oldToAttrs, newToAttrs);
			morpher.to(oldToAttrs);
			keys = newKeys;
			attrs = newToAttrs;
		});
		this._rememberMorpher(type, morpher);
		return this;
	},
	zoom(level, point) {
		if (this._tryRetarget("zoom", level, point)) return this;
		let morpher = new Morphable(this._stepper).to(new SVGNumber(level));
		this.queue(function() {
			morpher = morpher.from(this.element().zoom());
		}, function(pos) {
			this.element().zoom(morpher.at(pos), point);
			return morpher.done();
		}, function(newLevel, newPoint) {
			point = newPoint;
			morpher.to(newLevel);
		});
		this._rememberMorpher("zoom", morpher);
		return this;
	},
	/**
	** absolute transformations
	**/
	transform(transforms, relative, affine) {
		relative = transforms.relative || relative;
		if (this._isDeclarative && !relative && this._tryRetarget("transform", transforms)) return this;
		const isMatrix = Matrix.isMatrixLike(transforms);
		affine = transforms.affine != null ? transforms.affine : affine != null ? affine : !isMatrix;
		const morpher = new Morphable(this._stepper).type(affine ? TransformBag : Matrix);
		let origin;
		let element;
		let current;
		let currentAngle;
		let startTransform;
		function setup() {
			element = element || this.element();
			origin = origin || getOrigin(transforms, element);
			startTransform = new Matrix(relative ? void 0 : element);
			element._addRunner(this);
			if (!relative) element._clearTransformRunnersBefore(this);
		}
		function run(pos) {
			if (!relative) this.clearTransform();
			const { x, y } = new Point(origin).transform(element._currentTransform(this));
			let target = new Matrix({
				...transforms,
				origin: [x, y]
			});
			let start = this._isDeclarative && current ? current : startTransform;
			if (affine) {
				target = target.decompose(x, y);
				start = start.decompose(x, y);
				const rTarget = target.rotate;
				const rCurrent = start.rotate;
				const possibilities = [
					rTarget - 360,
					rTarget,
					rTarget + 360
				];
				const distances = possibilities.map((a) => Math.abs(a - rCurrent));
				const shortest = Math.min(...distances);
				const index = distances.indexOf(shortest);
				target.rotate = possibilities[index];
			}
			if (relative) {
				if (!isMatrix) target.rotate = transforms.rotate || 0;
				if (this._isDeclarative && currentAngle) start.rotate = currentAngle;
			}
			morpher.from(start);
			morpher.to(target);
			const affineParameters = morpher.at(pos);
			currentAngle = affineParameters.rotate;
			current = new Matrix(affineParameters);
			this.addTransform(current);
			element._addRunner(this);
			return morpher.done();
		}
		function retarget(newTransforms) {
			if ((newTransforms.origin || "center").toString() !== (transforms.origin || "center").toString()) origin = getOrigin(newTransforms, element);
			transforms = {
				...newTransforms,
				origin
			};
		}
		this.queue(setup, run, retarget, true);
		this._isDeclarative && this._rememberMorpher("transform", morpher);
		return this;
	},
	x(x, relative) {
		return this._queueNumber("x", x);
	},
	y(y) {
		return this._queueNumber("y", y);
	},
	dx(x = 0) {
		return this._queueNumberDelta("x", x);
	},
	dy(y = 0) {
		return this._queueNumberDelta("y", y);
	},
	dmove(x, y) {
		return this.dx(x).dy(y);
	},
	_queueNumberDelta(method, to) {
		to = new SVGNumber(to);
		if (this._tryRetarget(method, to)) return this;
		const morpher = new Morphable(this._stepper).to(to);
		let from = null;
		this.queue(function() {
			from = this.element()[method]();
			morpher.from(from);
			morpher.to(from + to);
		}, function(pos) {
			this.element()[method](morpher.at(pos));
			return morpher.done();
		}, function(newTo) {
			morpher.to(from + new SVGNumber(newTo));
		});
		this._rememberMorpher(method, morpher);
		return this;
	},
	_queueObject(method, to) {
		if (this._tryRetarget(method, to)) return this;
		const morpher = new Morphable(this._stepper).to(to);
		this.queue(function() {
			morpher.from(this.element()[method]());
		}, function(pos) {
			this.element()[method](morpher.at(pos));
			return morpher.done();
		});
		this._rememberMorpher(method, morpher);
		return this;
	},
	_queueNumber(method, value) {
		return this._queueObject(method, new SVGNumber(value));
	},
	cx(x) {
		return this._queueNumber("cx", x);
	},
	cy(y) {
		return this._queueNumber("cy", y);
	},
	move(x, y) {
		return this.x(x).y(y);
	},
	center(x, y) {
		return this.cx(x).cy(y);
	},
	size(width, height) {
		let box;
		if (!width || !height) box = this._element.bbox();
		if (!width) width = box.width / box.height * height;
		if (!height) height = box.height / box.width * width;
		return this.width(width).height(height);
	},
	width(width) {
		return this._queueNumber("width", width);
	},
	height(height) {
		return this._queueNumber("height", height);
	},
	plot(a, b, c, d) {
		if (arguments.length === 4) return this.plot([
			a,
			b,
			c,
			d
		]);
		if (this._tryRetarget("plot", a)) return this;
		const morpher = new Morphable(this._stepper).type(this._element.MorphArray).to(a);
		this.queue(function() {
			morpher.from(this._element.array());
		}, function(pos) {
			this._element.plot(morpher.at(pos));
			return morpher.done();
		});
		this._rememberMorpher("plot", morpher);
		return this;
	},
	leading(value) {
		return this._queueNumber("leading", value);
	},
	viewbox(x, y, width, height) {
		return this._queueObject("viewbox", new Box(x, y, width, height));
	},
	update(o) {
		if (typeof o !== "object") return this.update({
			offset: arguments[0],
			color: arguments[1],
			opacity: arguments[2]
		});
		if (o.opacity != null) this.attr("stop-opacity", o.opacity);
		if (o.color != null) this.attr("stop-color", o.color);
		if (o.offset != null) this.attr("offset", o.offset);
		return this;
	}
});
extend(Runner, {
	rx,
	ry,
	from,
	to
});
register(Runner, "Runner");
var Svg = class extends Container {
	constructor(node, attrs = node) {
		super(nodeOrNew("svg", node), attrs);
		this.namespace();
	}
	defs() {
		if (!this.isRoot()) return this.root().defs();
		return adopt(this.node.querySelector("defs")) || this.put(new Defs());
	}
	isRoot() {
		return !this.node.parentNode || !(this.node.parentNode instanceof globals.window.SVGElement) && this.node.parentNode.nodeName !== "#document-fragment";
	}
	namespace() {
		if (!this.isRoot()) return this.root().namespace();
		return this.attr({
			xmlns: svg,
			version: "1.1"
		}).attr("xmlns:xlink", xlink, xmlns).attr("xmlns:svgjs", svgjs, xmlns);
	}
	removeNamespace() {
		return this.attr({
			xmlns: null,
			version: null
		}).attr("xmlns:xlink", null, xmlns).attr("xmlns:svgjs", null, xmlns);
	}
	root() {
		if (this.isRoot()) return this;
		return super.root();
	}
};
registerMethods({ Container: { nested: wrapWithAttrCheck(function() {
	return this.put(new Svg());
}) } });
register(Svg, "Svg", true);
var Symbol$1 = class extends Container {
	constructor(node, attrs = node) {
		super(nodeOrNew("symbol", node), attrs);
	}
};
registerMethods({ Container: { symbol: wrapWithAttrCheck(function() {
	return this.put(new Symbol$1());
}) } });
register(Symbol$1, "Symbol");
function plain(text) {
	if (this._build === false) this.clear();
	this.node.appendChild(globals.document.createTextNode(text));
	return this;
}
function length() {
	return this.node.getComputedTextLength();
}
function x$1(x, box = this.bbox()) {
	if (x == null) return box.x;
	return this.attr("x", this.attr("x") + x - box.x);
}
function y$1(y, box = this.bbox()) {
	if (y == null) return box.y;
	return this.attr("y", this.attr("y") + y - box.y);
}
function move$1(x, y, box = this.bbox()) {
	return this.x(x, box).y(y, box);
}
function cx(x, box = this.bbox()) {
	if (x == null) return box.cx;
	return this.attr("x", this.attr("x") + x - box.cx);
}
function cy(y, box = this.bbox()) {
	if (y == null) return box.cy;
	return this.attr("y", this.attr("y") + y - box.cy);
}
function center(x, y, box = this.bbox()) {
	return this.cx(x, box).cy(y, box);
}
function ax(x) {
	return this.attr("x", x);
}
function ay(y) {
	return this.attr("y", y);
}
function amove(x, y) {
	return this.ax(x).ay(y);
}
function build(build) {
	this._build = !!build;
	return this;
}
var textable = {
	__proto__: null,
	plain,
	length,
	x: x$1,
	y: y$1,
	move: move$1,
	cx,
	cy,
	center,
	ax,
	ay,
	amove,
	build
};
var Text = class extends Shape {
	constructor(node, attrs = node) {
		super(nodeOrNew("text", node), attrs);
		this.dom.leading = new SVGNumber(1.3);
		this._rebuild = true;
		this._build = false;
	}
	leading(value) {
		if (value == null) return this.dom.leading;
		this.dom.leading = new SVGNumber(value);
		return this.rebuild();
	}
	rebuild(rebuild) {
		if (typeof rebuild === "boolean") this._rebuild = rebuild;
		if (this._rebuild) {
			const self = this;
			let blankLineOffset = 0;
			const leading = this.dom.leading;
			this.each(function(i) {
				const fontSize = globals.window.getComputedStyle(this.node).getPropertyValue("font-size");
				const dy = leading * new SVGNumber(fontSize);
				if (this.dom.newLined) {
					this.attr("x", self.attr("x"));
					if (this.text() === "\n") blankLineOffset += dy;
					else {
						this.attr("dy", i ? dy + blankLineOffset : 0);
						blankLineOffset = 0;
					}
				}
			});
			this.fire("rebuild");
		}
		return this;
	}
	setData(o) {
		this.dom = o;
		this.dom.leading = new SVGNumber(o.leading || 1.3);
		return this;
	}
	text(text) {
		if (text === void 0) {
			const children = this.node.childNodes;
			let firstLine = 0;
			text = "";
			for (let i = 0, len = children.length; i < len; ++i) {
				if (children[i].nodeName === "textPath") {
					if (i === 0) firstLine = 1;
					continue;
				}
				if (i !== firstLine && children[i].nodeType !== 3 && adopt(children[i]).dom.newLined === true) text += "\n";
				text += children[i].textContent;
			}
			return text;
		}
		this.clear().build(true);
		if (typeof text === "function") text.call(this, this);
		else {
			text = (text + "").split("\n");
			for (let j = 0, jl = text.length; j < jl; j++) this.newLine(text[j]);
		}
		return this.build(false).rebuild();
	}
};
extend(Text, textable);
registerMethods({ Container: {
	text: wrapWithAttrCheck(function(text = "") {
		return this.put(new Text()).text(text);
	}),
	plain: wrapWithAttrCheck(function(text = "") {
		return this.put(new Text()).plain(text);
	})
} });
register(Text, "Text");
var Tspan = class extends Shape {
	constructor(node, attrs = node) {
		super(nodeOrNew("tspan", node), attrs);
		this._build = false;
	}
	dx(dx) {
		return this.attr("dx", dx);
	}
	dy(dy) {
		return this.attr("dy", dy);
	}
	newLine() {
		this.dom.newLined = true;
		const text = this.parent();
		if (!(text instanceof Text)) return this;
		const i = text.index(this);
		const fontSize = globals.window.getComputedStyle(this.node).getPropertyValue("font-size");
		const dy = text.dom.leading * new SVGNumber(fontSize);
		return this.dy(i ? dy : 0).attr("x", text.x());
	}
	text(text) {
		if (text == null) return this.node.textContent + (this.dom.newLined ? "\n" : "");
		if (typeof text === "function") {
			this.clear().build(true);
			text.call(this, this);
			this.build(false);
		} else this.plain(text);
		return this;
	}
};
extend(Tspan, textable);
registerMethods({
	Tspan: { tspan: wrapWithAttrCheck(function(text = "") {
		const tspan = new Tspan();
		if (!this._build) this.clear();
		return this.put(tspan).text(text);
	}) },
	Text: { newLine: function(text = "") {
		return this.tspan(text).newLine();
	} }
});
register(Tspan, "Tspan");
var Circle = class extends Shape {
	constructor(node, attrs = node) {
		super(nodeOrNew("circle", node), attrs);
	}
	radius(r) {
		return this.attr("r", r);
	}
	rx(rx) {
		return this.attr("r", rx);
	}
	ry(ry) {
		return this.rx(ry);
	}
	size(size) {
		return this.radius(new SVGNumber(size).divide(2));
	}
};
extend(Circle, {
	x: x$3,
	y: y$3,
	cx: cx$1,
	cy: cy$1,
	width: width$2,
	height: height$2
});
registerMethods({ Container: { circle: wrapWithAttrCheck(function(size = 0) {
	return this.put(new Circle()).size(size).move(0, 0);
}) } });
register(Circle, "Circle");
var ClipPath = class extends Container {
	constructor(node, attrs = node) {
		super(nodeOrNew("clipPath", node), attrs);
	}
	remove() {
		this.targets().forEach(function(el) {
			el.unclip();
		});
		return super.remove();
	}
	targets() {
		return baseFind("svg [clip-path*=" + this.id() + "]");
	}
};
registerMethods({
	Container: { clip: wrapWithAttrCheck(function() {
		return this.defs().put(new ClipPath());
	}) },
	Element: {
		clipper() {
			return this.reference("clip-path");
		},
		clipWith(element) {
			const clipper = element instanceof ClipPath ? element : this.parent().clip().add(element);
			return this.attr("clip-path", "url(#" + clipper.id() + ")");
		},
		unclip() {
			return this.attr("clip-path", null);
		}
	}
});
register(ClipPath, "ClipPath");
var ForeignObject = class extends Element {
	constructor(node, attrs = node) {
		super(nodeOrNew("foreignObject", node), attrs);
	}
};
registerMethods({ Container: { foreignObject: wrapWithAttrCheck(function(width, height) {
	return this.put(new ForeignObject()).size(width, height);
}) } });
register(ForeignObject, "ForeignObject");
function dmove(dx, dy) {
	this.children().forEach((child, i) => {
		let bbox;
		try {
			bbox = child.bbox();
		} catch (e) {
			return;
		}
		const m = new Matrix(child);
		const matrix = m.translate(dx, dy).transform(m.inverse());
		const p = new Point(bbox.x, bbox.y).transform(matrix);
		child.move(p.x, p.y);
	});
	return this;
}
function dx(dx) {
	return this.dmove(dx, 0);
}
function dy(dy) {
	return this.dmove(0, dy);
}
function height(height, box = this.bbox()) {
	if (height == null) return box.height;
	return this.size(box.width, height, box);
}
function move(x = 0, y = 0, box = this.bbox()) {
	const dx = x - box.x;
	const dy = y - box.y;
	return this.dmove(dx, dy);
}
function size(width, height, box = this.bbox()) {
	const p = proportionalSize(this, width, height, box);
	const scaleX = p.width / box.width;
	const scaleY = p.height / box.height;
	this.children().forEach((child, i) => {
		const o = new Point(box).transform(new Matrix(child).inverse());
		child.scale(scaleX, scaleY, o.x, o.y);
	});
	return this;
}
function width(width, box = this.bbox()) {
	if (width == null) return box.width;
	return this.size(width, box.height, box);
}
function x(x, box = this.bbox()) {
	if (x == null) return box.x;
	return this.move(x, box.y, box);
}
function y(y, box = this.bbox()) {
	if (y == null) return box.y;
	return this.move(box.x, y, box);
}
var containerGeometry = {
	__proto__: null,
	dmove,
	dx,
	dy,
	height,
	move,
	size,
	width,
	x,
	y
};
var G = class extends Container {
	constructor(node, attrs = node) {
		super(nodeOrNew("g", node), attrs);
	}
};
extend(G, containerGeometry);
registerMethods({ Container: { group: wrapWithAttrCheck(function() {
	return this.put(new G());
}) } });
register(G, "G");
var A = class extends Container {
	constructor(node, attrs = node) {
		super(nodeOrNew("a", node), attrs);
	}
	target(target) {
		return this.attr("target", target);
	}
	to(url) {
		return this.attr("href", url, xlink);
	}
};
extend(A, containerGeometry);
registerMethods({
	Container: { link: wrapWithAttrCheck(function(url) {
		return this.put(new A()).to(url);
	}) },
	Element: {
		unlink() {
			const link = this.linker();
			if (!link) return this;
			const parent = link.parent();
			if (!parent) return this.remove();
			const index = parent.index(link);
			parent.add(this, index);
			link.remove();
			return this;
		},
		linkTo(url) {
			let link = this.linker();
			if (!link) {
				link = new A();
				this.wrap(link);
			}
			if (typeof url === "function") url.call(link, link);
			else link.to(url);
			return this;
		},
		linker() {
			const link = this.parent();
			if (link && link.node.nodeName.toLowerCase() === "a") return link;
			return null;
		}
	}
});
register(A, "A");
var Mask = class extends Container {
	constructor(node, attrs = node) {
		super(nodeOrNew("mask", node), attrs);
	}
	remove() {
		this.targets().forEach(function(el) {
			el.unmask();
		});
		return super.remove();
	}
	targets() {
		return baseFind("svg [mask*=" + this.id() + "]");
	}
};
registerMethods({
	Container: { mask: wrapWithAttrCheck(function() {
		return this.defs().put(new Mask());
	}) },
	Element: {
		masker() {
			return this.reference("mask");
		},
		maskWith(element) {
			const masker = element instanceof Mask ? element : this.parent().mask().add(element);
			return this.attr("mask", "url(#" + masker.id() + ")");
		},
		unmask() {
			return this.attr("mask", null);
		}
	}
});
register(Mask, "Mask");
var Stop = class extends Element {
	constructor(node, attrs = node) {
		super(nodeOrNew("stop", node), attrs);
	}
	update(o) {
		if (typeof o === "number" || o instanceof SVGNumber) o = {
			offset: arguments[0],
			color: arguments[1],
			opacity: arguments[2]
		};
		if (o.opacity != null) this.attr("stop-opacity", o.opacity);
		if (o.color != null) this.attr("stop-color", o.color);
		if (o.offset != null) this.attr("offset", new SVGNumber(o.offset));
		return this;
	}
};
registerMethods({ Gradient: { stop: function(offset, color, opacity) {
	return this.put(new Stop()).update(offset, color, opacity);
} } });
register(Stop, "Stop");
function cssRule(selector, rule) {
	if (!selector) return "";
	if (!rule) return selector;
	let ret = selector + "{";
	for (const i in rule) ret += unCamelCase(i) + ":" + rule[i] + ";";
	ret += "}";
	return ret;
}
var Style = class extends Element {
	constructor(node, attrs = node) {
		super(nodeOrNew("style", node), attrs);
	}
	addText(w = "") {
		this.node.textContent += w;
		return this;
	}
	font(name, src, params = {}) {
		return this.rule("@font-face", {
			fontFamily: name,
			src,
			...params
		});
	}
	rule(selector, obj) {
		return this.addText(cssRule(selector, obj));
	}
};
registerMethods("Dom", {
	style(selector, obj) {
		return this.put(new Style()).rule(selector, obj);
	},
	fontface(name, src, params) {
		return this.put(new Style()).font(name, src, params);
	}
});
register(Style, "Style");
var TextPath = class extends Text {
	constructor(node, attrs = node) {
		super(nodeOrNew("textPath", node), attrs);
	}
	array() {
		const track = this.track();
		return track ? track.array() : null;
	}
	plot(d) {
		const track = this.track();
		let pathArray = null;
		if (track) pathArray = track.plot(d);
		return d == null ? pathArray : this;
	}
	track() {
		return this.reference("href");
	}
};
registerMethods({
	Container: { textPath: wrapWithAttrCheck(function(text, path) {
		if (!(text instanceof Text)) text = this.text(text);
		return text.path(path);
	}) },
	Text: {
		path: wrapWithAttrCheck(function(track, importNodes = true) {
			const textPath = new TextPath();
			if (!(track instanceof Path)) track = this.defs().path(track);
			textPath.attr("href", "#" + track, xlink);
			let node;
			if (importNodes) while (node = this.node.firstChild) textPath.node.appendChild(node);
			return this.put(textPath);
		}),
		textPath() {
			return this.findOne("textPath");
		}
	},
	Path: {
		text: wrapWithAttrCheck(function(text) {
			if (!(text instanceof Text)) text = new Text().addTo(this.parent()).text(text);
			return text.path(this);
		}),
		targets() {
			return baseFind("svg textPath").filter((node) => {
				return (node.attr("href") || "").includes(this.id());
			});
		}
	}
});
TextPath.prototype.MorphArray = PathArray;
register(TextPath, "TextPath");
var Use = class extends Shape {
	constructor(node, attrs = node) {
		super(nodeOrNew("use", node), attrs);
	}
	use(element, file) {
		return this.attr("href", (file || "") + "#" + element, xlink);
	}
};
registerMethods({ Container: { use: wrapWithAttrCheck(function(element, file) {
	return this.put(new Use()).use(element, file);
}) } });
register(Use, "Use");
var SVG = makeInstance;
extend([
	Svg,
	Symbol$1,
	Image$1,
	Pattern,
	Marker
], getMethodsFor("viewbox"));
extend([
	Line,
	Polyline,
	Polygon,
	Path
], getMethodsFor("marker"));
extend(Text, getMethodsFor("Text"));
extend(Path, getMethodsFor("Path"));
extend(Defs, getMethodsFor("Defs"));
extend([Text, Tspan], getMethodsFor("Tspan"));
extend([
	Rect,
	Ellipse,
	Gradient,
	Runner
], getMethodsFor("radius"));
extend(EventTarget, getMethodsFor("EventTarget"));
extend(Dom, getMethodsFor("Dom"));
extend(Element, getMethodsFor("Element"));
extend(Shape, getMethodsFor("Shape"));
extend([Container, Fragment], getMethodsFor("Container"));
extend(Gradient, getMethodsFor("Gradient"));
extend(Runner, getMethodsFor("Runner"));
List.extend(getMethodNames());
registerMorphableType([
	SVGNumber,
	Color,
	Box,
	Matrix,
	SVGArray,
	PointArray,
	PathArray,
	Point
]);
makeMorphable();
//#endregion
//#region node_modules/simple-mind-map/src/theme/default.js
var import_cjs = /* @__PURE__ */ __toESM(require_cjs());
var default_default = {
	paddingX: 15,
	paddingY: 5,
	imgMaxWidth: 200,
	imgMaxHeight: 100,
	iconSize: 20,
	lineWidth: 1,
	lineColor: "#549688",
	lineDasharray: "none",
	lineFlow: false,
	lineFlowDuration: 1,
	lineFlowForward: true,
	lineStyle: "straight",
	rootLineKeepSameInCurve: true,
	rootLineStartPositionKeepSameInCurve: false,
	lineRadius: 5,
	showLineMarker: false,
	generalizationLineWidth: 1,
	generalizationLineColor: "#549688",
	generalizationLineMargin: 0,
	generalizationNodeMargin: 20,
	associativeLineWidth: 2,
	associativeLineColor: "rgb(51, 51, 51)",
	associativeLineActiveWidth: 8,
	associativeLineActiveColor: "rgba(2, 167, 240, 1)",
	associativeLineDasharray: [6, 4],
	associativeLineTextColor: "rgb(51, 51, 51)",
	associativeLineTextFontSize: 14,
	associativeLineTextLineHeight: 1.2,
	associativeLineTextFontFamily: "微软雅黑, Microsoft YaHei",
	backgroundColor: "#fafafa",
	backgroundImage: "none",
	backgroundRepeat: "no-repeat",
	backgroundPosition: "center center",
	backgroundSize: "cover",
	nodeUseLineStyle: false,
	root: {
		shape: "rectangle",
		fillColor: "#549688",
		fontFamily: "微软雅黑, Microsoft YaHei",
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
		fontStyle: "normal",
		borderColor: "transparent",
		borderWidth: 0,
		borderDasharray: "none",
		borderRadius: 5,
		textDecoration: "none",
		gradientStyle: false,
		startColor: "#549688",
		endColor: "#fff",
		startDir: [0, 0],
		endDir: [1, 0],
		lineMarkerDir: "end",
		hoverRectColor: "",
		hoverRectRadius: 5,
		textAlign: "left",
		imgPlacement: "top",
		tagPlacement: "right"
	},
	second: {
		shape: "rectangle",
		marginX: 100,
		marginY: 40,
		fillColor: "#fff",
		fontFamily: "微软雅黑, Microsoft YaHei",
		color: "#565656",
		fontSize: 16,
		fontWeight: "normal",
		fontStyle: "normal",
		borderColor: "#549688",
		borderWidth: 1,
		borderDasharray: "none",
		borderRadius: 5,
		textDecoration: "none",
		gradientStyle: false,
		startColor: "#549688",
		endColor: "#fff",
		startDir: [0, 0],
		endDir: [1, 0],
		lineMarkerDir: "end",
		hoverRectColor: "",
		hoverRectRadius: 5,
		textAlign: "left",
		imgPlacement: "top",
		tagPlacement: "right"
	},
	node: {
		shape: "rectangle",
		marginX: 50,
		marginY: 0,
		fillColor: "transparent",
		fontFamily: "微软雅黑, Microsoft YaHei",
		color: "#6a6d6c",
		fontSize: 14,
		fontWeight: "normal",
		fontStyle: "normal",
		borderColor: "transparent",
		borderWidth: 0,
		borderRadius: 5,
		borderDasharray: "none",
		textDecoration: "none",
		gradientStyle: false,
		startColor: "#549688",
		endColor: "#fff",
		startDir: [0, 0],
		endDir: [1, 0],
		lineMarkerDir: "end",
		hoverRectColor: "",
		hoverRectRadius: 5,
		textAlign: "left",
		imgPlacement: "top",
		tagPlacement: "right"
	},
	generalization: {
		shape: "rectangle",
		marginX: 100,
		marginY: 40,
		fillColor: "#fff",
		fontFamily: "微软雅黑, Microsoft YaHei",
		color: "#565656",
		fontSize: 16,
		fontWeight: "normal",
		fontStyle: "normal",
		borderColor: "#549688",
		borderWidth: 1,
		borderDasharray: "none",
		borderRadius: 5,
		textDecoration: "none",
		gradientStyle: false,
		startColor: "#549688",
		endColor: "#fff",
		startDir: [0, 0],
		endDir: [1, 0],
		hoverRectColor: "",
		hoverRectRadius: 5,
		textAlign: "left",
		imgPlacement: "top",
		tagPlacement: "right"
	}
};
var nodeSizeIndependenceList = [
	"lineWidth",
	"lineColor",
	"lineDasharray",
	"lineStyle",
	"generalizationLineWidth",
	"generalizationLineColor",
	"associativeLineWidth",
	"associativeLineColor",
	"associativeLineActiveWidth",
	"associativeLineActiveColor",
	"associativeLineTextColor",
	"associativeLineTextFontSize",
	"associativeLineTextLineHeight",
	"associativeLineTextFontFamily",
	"backgroundColor",
	"backgroundImage",
	"backgroundRepeat",
	"backgroundPosition",
	"backgroundSize",
	"rootLineKeepSameInCurve",
	"rootLineStartPositionKeepSameInCurve",
	"showLineMarker",
	"lineRadius",
	"hoverRectColor",
	"hoverRectRadius",
	"lineFlow",
	"lineFlowDuration",
	"lineFlowForward",
	"textAlign"
];
var checkIsNodeSizeIndependenceConfig = (config) => {
	let keys = Object.keys(config);
	for (let i = 0; i < keys.length; i++) if (!nodeSizeIndependenceList.find((item) => {
		return item === keys[i];
	})) return false;
	return true;
};
var lineStyleProps = [
	"lineColor",
	"lineDasharray",
	"lineWidth",
	"lineMarkerDir",
	"lineFlow",
	"lineFlowDuration",
	"lineFlowForward"
];
//#endregion
//#region node_modules/simple-mind-map/src/utils/index.js
var walk = (root, parent, beforeCallback, afterCallback, isRoot, layerIndex = 0, index = 0, ancestors = []) => {
	let stop = false;
	if (beforeCallback) stop = beforeCallback(root, parent, isRoot, layerIndex, index, ancestors);
	if (!stop && root.children && root.children.length > 0) {
		let _layerIndex = layerIndex + 1;
		root.children.forEach((node, nodeIndex) => {
			walk(node, root, beforeCallback, afterCallback, false, _layerIndex, nodeIndex, [...ancestors, root]);
		});
	}
	afterCallback && afterCallback(root, parent, isRoot, layerIndex, index, ancestors);
};
var bfsWalk = (root, callback) => {
	let stack = [root];
	let isStop = false;
	if (callback(root, null) === "stop") isStop = true;
	while (stack.length) {
		if (isStop) break;
		let cur = stack.shift();
		if (cur.children && cur.children.length) cur.children.forEach((item) => {
			if (isStop) return;
			stack.push(item);
			if (callback(item, cur) === "stop") isStop = true;
		});
	}
};
var resizeImgSize = (width, height, maxWidth, maxHeight) => {
	let nRatio = width / height;
	let arr = [];
	if (maxWidth && maxHeight) if (width <= maxWidth && height <= maxHeight) arr = [width, height];
	else if (nRatio > maxWidth / maxHeight) arr = [maxWidth, maxWidth / nRatio];
	else arr = [nRatio * maxHeight, maxHeight];
	else if (maxWidth) if (width <= maxWidth) arr = [width, height];
	else arr = [maxWidth, maxWidth / nRatio];
	else if (maxHeight) if (height <= maxHeight) arr = [width, height];
	else arr = [nRatio * maxHeight, maxHeight];
	return arr;
};
var getStrWithBrFromHtml = (str) => {
	str = str.replace(/<br>/gim, "\n");
	let el = document.createElement("div");
	el.innerHTML = str;
	str = el.textContent;
	return str;
};
var simpleDeepClone = (data) => {
	try {
		return JSON.parse(JSON.stringify(data));
	} catch (error) {
		return null;
	}
};
var copyRenderTree = (tree, root, removeActiveState = false) => {
	tree.data = simpleDeepClone(root.data);
	if (removeActiveState) {
		tree.data.isActive = false;
		formatGetNodeGeneralization(tree.data).forEach((item) => {
			item.isActive = false;
		});
	}
	tree.children = [];
	if (root.children && root.children.length > 0) root.children.forEach((item, index) => {
		tree.children[index] = copyRenderTree({}, item, removeActiveState);
	});
	Object.keys(root).forEach((key) => {
		if (!["data", "children"].includes(key) && !/^_/.test(key)) tree[key] = root[key];
	});
	return tree;
};
var copyNodeTree = (tree, root, removeActiveState = false, removeId = true) => {
	const rootData = root.nodeData ? root.nodeData : root;
	tree.data = simpleDeepClone(rootData.data);
	if (removeId) delete tree.data.uid;
	else if (!tree.data.uid) tree.data.uid = createUid();
	if (removeActiveState) tree.data.isActive = false;
	tree.children = [];
	if (root.children && root.children.length > 0) root.children.forEach((item, index) => {
		tree.children[index] = copyNodeTree({}, item, removeActiveState, removeId);
	});
	else if (root.nodeData && root.nodeData.children && root.nodeData.children.length > 0) root.nodeData.children.forEach((item, index) => {
		tree.children[index] = copyNodeTree({}, item, removeActiveState, removeId);
	});
	Object.keys(rootData).forEach((key) => {
		if (!["data", "children"].includes(key) && !/^_/.test(key)) tree[key] = rootData[key];
	});
	return tree;
};
var imgToDataUrl = (src, returnBlob = false) => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.setAttribute("crossOrigin", "anonymous");
		img.onload = () => {
			try {
				let canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
				canvas.getContext("2d").drawImage(img, 0, 0, img.width, img.height);
				if (returnBlob) canvas.toBlob((blob) => {
					resolve(blob);
				});
				else resolve(canvas.toDataURL());
			} catch (e) {
				reject(e);
			}
		};
		img.onerror = (e) => {
			reject(e);
		};
		img.src = src;
	});
};
var downloadFile = (file, fileName) => {
	let a = document.createElement("a");
	a.href = file;
	a.download = fileName;
	a.click();
};
var throttle = (fn, time = 300, ctx) => {
	let timer = null;
	return (...args) => {
		if (timer) return;
		timer = setTimeout(() => {
			fn.call(ctx, ...args);
			timer = null;
		}, time);
	};
};
var debounce = (fn, wait = 300, ctx) => {
	let timeout = null;
	return (...args) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			timeout = null;
			fn.apply(ctx, args);
		}, wait);
	};
};
var asyncRun = (taskList, callback = () => {}) => {
	let index = 0;
	let len = taskList.length;
	if (len <= 0) return callback();
	let loop = () => {
		if (index >= len) {
			callback();
			return;
		}
		taskList[index]();
		setTimeout(() => {
			index++;
			loop();
		}, 0);
	};
	loop();
};
var degToRad = (deg) => {
	return deg * (Math.PI / 180);
};
var camelCaseToHyphen = (str) => {
	return str.replace(/([a-z])([A-Z])/g, (...args) => {
		return args[1] + "-" + args[2].toLowerCase();
	});
};
var nextTick = function(fn, ctx) {
	let pending = false;
	let timerFunc = null;
	let handle = () => {
		pending = false;
		ctx ? fn.call(ctx) : fn();
	};
	if (typeof MutationObserver !== "undefined") {
		let counter = 1;
		let observer = new MutationObserver(handle);
		let textNode = document.createTextNode(counter);
		observer.observe(textNode, { characterData: true });
		timerFunc = function() {
			counter = (counter + 1) % 2;
			textNode.data = counter;
		};
	} else timerFunc = setTimeout;
	return function() {
		if (pending) return;
		pending = true;
		timerFunc(handle, 0);
	};
};
var checkNodeOuter = (mindMap, node, offsetX = 0, offsetY = 0) => {
	let elRect = mindMap.elRect;
	let { scaleX, scaleY, translateX, translateY } = mindMap.draw.transform();
	let { left, top, width, height } = node;
	let right = (left + width) * scaleX + translateX;
	let bottom = (top + height) * scaleY + translateY;
	left = left * scaleX + translateX;
	top = top * scaleY + translateY;
	let offsetLeft = 0;
	let offsetTop = 0;
	if (left < 0 + offsetX) offsetLeft = -left + offsetX;
	if (right > elRect.width - offsetX) offsetLeft = -(right - elRect.width) - offsetX;
	if (top < 0 + offsetY) offsetTop = -top + offsetY;
	if (bottom > elRect.height - offsetY) offsetTop = -(bottom - elRect.height) - offsetY;
	return {
		isOuter: offsetLeft !== 0 || offsetTop !== 0,
		offsetLeft,
		offsetTop
	};
};
var getTextFromHtmlEl = null;
var getTextFromHtml = (html) => {
	if (!getTextFromHtmlEl) getTextFromHtmlEl = document.createElement("div");
	getTextFromHtmlEl.innerHTML = html;
	return getTextFromHtmlEl.textContent;
};
var readBlob = (blob) => {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.onload = (evt) => {
			resolve(evt.target.result);
		};
		reader.onerror = (err) => {
			reject(err);
		};
		reader.readAsDataURL(blob);
	});
};
var getImageSize = (src) => {
	return new Promise((resolve) => {
		let img = new Image();
		img.src = src;
		img.onload = () => {
			resolve({
				width: img.width,
				height: img.height
			});
		};
		img.onerror = () => {
			resolve({
				width: 0,
				height: 0
			});
		};
	});
};
var createUid = () => {
	return v4();
};
var loadImage = (imgFile) => {
	return new Promise((resolve, reject) => {
		let fr = new FileReader();
		fr.readAsDataURL(imgFile);
		fr.onload = async (e) => {
			let url = e.target.result;
			resolve({
				url,
				size: await getImageSize(url)
			});
		};
		fr.onerror = (error) => {
			reject(error);
		};
	});
};
var removeHTMLEntities = (str) => {
	[["&nbsp;", "&#160;"]].forEach((item) => {
		str = str.replace(new RegExp(item[0], "g"), item[1]);
	});
	return str;
};
var getType = (data) => {
	return Object.prototype.toString.call(data).slice(8, -1);
};
var isUndef = (data) => {
	return data === null || data === void 0 || data === "";
};
var checkIsRichTextEl = null;
var checkIsRichText = (str) => {
	if (!checkIsRichTextEl) checkIsRichTextEl = document.createElement("div");
	checkIsRichTextEl.innerHTML = str;
	for (let c = checkIsRichTextEl.childNodes, i = c.length; i--;) if (c[i].nodeType == 1) return true;
	return false;
};
var isWhite = (color) => {
	color = String(color).replace(/\s+/g, "");
	return [
		"#fff",
		"#ffffff",
		"#FFF",
		"#FFFFFF",
		"rgb(255,255,255)"
	].includes(color) || /rgba\(255,255,255,[^)]+\)/.test(color);
};
var isTransparent = (color) => {
	color = String(color).replace(/\s+/g, "");
	return ["", "transparent"].includes(color) || /rgba\(\d+,\d+,\d+,0\)/.test(color);
};
var getVisibleColorFromTheme = (themeConfig) => {
	let { lineColor, root, second, node } = themeConfig;
	let list = [
		lineColor,
		root.fillColor,
		root.color,
		second.fillColor,
		second.color,
		node.fillColor,
		node.color,
		root.borderColor,
		second.borderColor,
		node.borderColor
	];
	for (let i = 0; i < list.length; i++) {
		let color = list[i];
		if (!isTransparent(color) && !isWhite(color)) return color;
	}
};
var removeFormulaTags = (node) => {
	const walk = (root) => {
		root.childNodes.forEach((node) => {
			if (node.nodeType === 1) if (node.classList.contains("ql-formula")) node.parentNode.removeChild(node);
			else walk(node);
		});
	};
	walk(node);
};
var nodeRichTextToTextWithWrapEl = null;
var nodeRichTextToTextWithWrap = (html) => {
	if (!nodeRichTextToTextWithWrapEl) nodeRichTextToTextWithWrapEl = document.createElement("div");
	nodeRichTextToTextWithWrapEl.innerHTML = html;
	const childNodes = nodeRichTextToTextWithWrapEl.childNodes;
	let res = "";
	for (let i = 0; i < childNodes.length; i++) {
		const node = childNodes[i];
		if (node.nodeType === 1) {
			removeFormulaTags(node);
			if (node.tagName.toLowerCase() === "p") res += node.textContent + "\n";
			else res += node.textContent;
		} else if (node.nodeType === 3) res += node.nodeValue;
	}
	return res.replace(/\n$/, "");
};
var removeRichTextStyesEl = null;
var removeRichTextStyes = (html) => {
	if (!removeRichTextStyesEl) removeRichTextStyesEl = document.createElement("div");
	removeRichTextStyesEl.innerHTML = html;
	const formulaList = removeRichTextStyesEl.querySelectorAll(".ql-formula");
	Array.from(formulaList).forEach((el) => {
		const placeholder = document.createTextNode("$smmformula$");
		el.parentNode.replaceChild(placeholder, el);
	});
	const childNodes = removeRichTextStyesEl.childNodes;
	let list = [];
	for (let i = 0; i < childNodes.length; i++) {
		const node = childNodes[i];
		if (node.nodeType === 1) list.push(node.textContent);
		else if (node.nodeType === 3) list.push(node.nodeValue);
	}
	html = list.map((item) => {
		return `<p><span>${htmlEscape(item)}</span></p>`;
	}).join("");
	if (formulaList.length > 0) {
		html = html.replace(/\$smmformula\$/g, "<span class=\"smmformula\"></span>");
		removeRichTextStyesEl.innerHTML = html;
		const els = removeRichTextStyesEl.querySelectorAll(".smmformula");
		Array.from(els).forEach((el, index) => {
			el.parentNode.replaceChild(formulaList[index], el);
		});
		html = removeRichTextStyesEl.innerHTML;
	}
	return html;
};
var getObjectChangedProps = (oldObject, newObject) => {
	const res = {};
	Object.keys(newObject).forEach((prop) => {
		const oldVal = oldObject[prop];
		const newVal = newObject[prop];
		if (getType(oldVal) !== getType(newVal)) {
			res[prop] = newVal;
			return;
		}
		if (getType(oldVal) === "Object") {
			if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
				res[prop] = newVal;
				return;
			}
		} else if (oldVal !== newVal) {
			res[prop] = newVal;
			return;
		}
	});
	return res;
};
var checkIsNodeStyleDataKey = (key) => {
	if (/^_/.test(key)) return false;
	if (!nodeDataNoStylePropList.includes(key)) return true;
	return false;
};
var isNodeNotNeedRenderData = (config) => {
	const list = [...lineStyleProps];
	const keys = Object.keys(config);
	for (let i = 0; i < keys.length; i++) if (!list.includes(keys[i])) return false;
	return true;
};
var mergerIconList = (list) => {
	return list.reduce((result, item) => {
		const existingItem = result.find((x) => x.type === item.type);
		if (existingItem) item.list.forEach((newObj) => {
			const existingObj = existingItem.list.find((x) => x.name === newObj.name);
			if (existingObj) existingObj.icon = newObj.icon;
			else existingItem.list.push(newObj);
		});
		else result.push({ ...item });
		return result;
	}, []);
};
var getTopAncestorsFomNodeList = (list) => {
	let res = [];
	list.forEach((node) => {
		if (!list.find((item) => {
			return item.uid !== node.uid && item.isAncestor(node);
		})) res.push(node);
	});
	return res;
};
var parseAddGeneralizationNodeList = (list) => {
	const cache = {};
	const uidToParent = {};
	list.forEach((node) => {
		const parent = node.parent;
		if (parent) {
			const pUid = parent.uid;
			uidToParent[pUid] = parent;
			const data = {
				node,
				index: node.getIndexInBrothers()
			};
			if (cache[pUid]) {
				if (!cache[pUid].find((item) => {
					return item.index === data.index;
				})) cache[pUid].push(data);
			} else cache[pUid] = [data];
		}
	});
	const res = [];
	Object.keys(cache).forEach((uid) => {
		if (cache[uid].length > 1) {
			const rangeList = cache[uid].map((item) => {
				return item.index;
			}).sort((a, b) => {
				return a - b;
			});
			res.push({
				node: uidToParent[uid],
				range: [rangeList[0], rangeList[rangeList.length - 1]]
			});
		} else res.push({ node: cache[uid][0].node });
	});
	return res;
};
var checkTwoRectIsOverlap = (minx1, maxx1, miny1, maxy1, minx2, maxx2, miny2, maxy2) => {
	return maxx1 > minx2 && maxx2 > minx1 && maxy1 > miny2 && maxy2 > miny1;
};
var focusInput = (el) => {
	let selection = window.getSelection();
	let range = document.createRange();
	range.selectNodeContents(el);
	range.collapse();
	selection.removeAllRanges();
	selection.addRange(range);
};
var selectAllInput = (el) => {
	let selection = window.getSelection();
	let range = document.createRange();
	range.selectNodeContents(el);
	selection.removeAllRanges();
	selection.addRange(range);
};
var addDataToAppointNodes = (appointNodes, data = {}) => {
	data = { ...data };
	if (data && data.richText && data.resetRichText) delete data.resetRichText;
	const walk = (list) => {
		list.forEach((node) => {
			node.data = {
				...node.data,
				...data
			};
			if (node.children && node.children.length > 0) walk(node.children);
		});
	};
	walk(appointNodes);
	return appointNodes;
};
var createUidForAppointNodes = (appointNodes, createNewId = false, handle = null, handleGeneralization = false) => {
	const walk = (list) => {
		list.forEach((node) => {
			if (!node.data) node.data = {};
			if (createNewId || isUndef(node.data.uid)) node.data.uid = createUid();
			if (handleGeneralization) formatGetNodeGeneralization(node.data).forEach((gNode) => {
				if (createNewId || isUndef(gNode.uid)) gNode.uid = createUid();
			});
			handle && handle(node);
			if (node.children && node.children.length > 0) walk(node.children);
		});
	};
	walk(appointNodes);
	return appointNodes;
};
var formatDataToArray = (data) => {
	if (!data) return [];
	return Array.isArray(data) ? data : [data];
};
var getNodeDataIndex = (node) => {
	return node.parent ? node.parent.nodeData.children.findIndex((item) => {
		return item.data.uid === node.uid;
	}) : 0;
};
var getNodeIndexInNodeList = (node, nodeList) => {
	return nodeList.findIndex((item) => {
		return item.uid === node.uid;
	});
};
var generateColorByContent = (str) => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
	return "hsla(" + new MersenneTwister(hash).genrand_int32() % 360 + ", 50%, 50%, 1)";
};
var htmlEscape = (str) => {
	[
		["&", "&amp;"],
		["<", "&lt;"],
		[">", "&gt;"]
	].forEach((item) => {
		str = str.replace(new RegExp(item[0], "g"), item[1]);
	});
	return str;
};
var isSameObject = (a, b) => {
	const type = getType(a);
	if (type !== getType(b)) return false;
	if (type === "Object") {
		const keysa = Object.keys(a);
		const keysb = Object.keys(b);
		if (keysa.length !== keysb.length) return false;
		for (let i = 0; i < keysa.length; i++) {
			const key = keysa[i];
			if (!keysb.includes(key)) return false;
			if (!isSameObject(a[key], b[key])) return false;
		}
		return true;
	} else if (type === "Array") {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) {
			const itema = a[i];
			const itemb = b[i];
			if (getType(itema) !== getType(itemb)) return false;
			if (!isSameObject(itema, itemb)) return false;
		}
		return true;
	} else return a === b;
};
var checkClipboardReadEnable = () => {
	return navigator.clipboard && typeof navigator.clipboard.read === "function";
};
var setDataToClipboard = (data) => {
	if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(JSON.stringify(data));
};
var getDataFromClipboard = async () => {
	let text = null;
	let img = null;
	if (checkClipboardReadEnable()) {
		const items = await navigator.clipboard.read();
		if (items && items.length > 0) {
			for (const clipboardItem of items) for (const type of clipboardItem.types) if (/^image\//.test(type)) img = await clipboardItem.getType(type);
			else if (type === "text/plain") text = await (await clipboardItem.getType(type)).text();
		}
	}
	return {
		text,
		img
	};
};
var removeFromParentNodeData = (node) => {
	if (!node || !node.parent) return;
	const index = getNodeDataIndex(node);
	if (index === -1) return;
	node.parent.nodeData.children.splice(index, 1);
};
var handleSelfCloseTags = (str) => {
	selfCloseTagList.forEach((tagName) => {
		str = str.replace(new RegExp(`<${tagName}([^>]*)>`, "g"), `<${tagName} $1 />`);
	});
	return str;
};
var checkNodeListIsEqual = (list1, list2) => {
	if (list1.length !== list2.length) return false;
	for (let i = 0; i < list1.length; i++) if (!list2.find((item) => {
		return item.uid === list1[i].uid;
	})) return false;
	return true;
};
var createSmmFormatData = (data) => {
	return {
		simpleMindMap: true,
		data
	};
};
var checkSmmFormatData = (data) => {
	let smmData = null;
	if (typeof data === "string") try {
		const parsedData = JSON.parse(data);
		if (typeof parsedData === "object" && parsedData.simpleMindMap) smmData = parsedData.data;
	} catch (error) {}
	else if (typeof data === "object" && data.simpleMindMap) smmData = data.data;
	const isSmm = !!smmData;
	return {
		isSmm,
		data: isSmm ? smmData : String(data)
	};
};
var handleInputPasteText = (e, text) => {
	e.preventDefault();
	const selection = window.getSelection();
	if (!selection.rangeCount) return;
	selection.deleteFromDocument();
	text = text || e.clipboardData.getData("text");
	text = htmlEscape(text);
	text = getTextFromHtml(text);
	const textArr = text.split(/\n/g);
	const fragment = document.createDocumentFragment();
	textArr.forEach((item, index) => {
		const node = document.createTextNode(item);
		fragment.appendChild(node);
		if (index < textArr.length - 1) {
			const br = document.createElement("br");
			fragment.appendChild(br);
		}
	});
	selection.getRangeAt(0).insertNode(fragment);
	selection.collapseToEnd();
};
var transformTreeDataToObject = (data) => {
	const res = {};
	const walk = (root, parent) => {
		const uid = root.data.uid;
		if (parent) parent.children.push(uid);
		res[uid] = {
			isRoot: !parent,
			data: { ...root.data },
			children: []
		};
		if (root.children && root.children.length > 0) root.children.forEach((item) => {
			walk(item, res[uid]);
		});
	};
	walk(data, null);
	return res;
};
var getTwoPointDistance = (x1, y1, x2, y2) => {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};
var getRectRelativePosition = (rect1, rect2) => {
	const rect1CenterX = rect1.x + rect1.width / 2;
	const rect1CenterY = rect1.y + rect1.height / 2;
	const rect2CenterX = rect2.x + rect2.width / 2;
	const rect2CenterY = rect2.y + rect2.height / 2;
	if (rect1CenterX < rect2CenterX && rect1CenterY < rect2CenterY) return "left-top";
	else if (rect1CenterX > rect2CenterX && rect1CenterY < rect2CenterY) return "right-top";
	else if (rect1CenterX > rect2CenterX && rect1CenterY > rect2CenterY) return "right-bottom";
	else if (rect1CenterX < rect2CenterX && rect1CenterY > rect2CenterY) return "left-bottom";
	else if (rect1CenterX < rect2CenterX && rect1CenterY === rect2CenterY) return "left";
	else if (rect1CenterX > rect2CenterX && rect1CenterY === rect2CenterY) return "right";
	else if (rect1CenterX === rect2CenterX && rect1CenterY < rect2CenterY) return "top";
	else if (rect1CenterX === rect2CenterX && rect1CenterY > rect2CenterY) return "bottom";
	else return "overlap";
};
var handleGetSvgDataExtraContent = ({ addContentToHeader, addContentToFooter }) => {
	const cssTextList = [];
	let header = null;
	let headerHeight = 0;
	let footer = null;
	let footerHeight = 0;
	const handle = (fn, callback) => {
		if (typeof fn === "function") {
			const res = fn();
			if (!res) return;
			const { el, cssText, height } = res;
			if (el instanceof HTMLElement) {
				addXmlns(el);
				callback(createForeignObjectNode({
					el,
					height
				}), height);
			}
			if (cssText) cssTextList.push(cssText);
		}
	};
	handle(addContentToHeader, (foreignObject, height) => {
		header = foreignObject;
		headerHeight = height;
	});
	handle(addContentToFooter, (foreignObject, height) => {
		footer = foreignObject;
		footerHeight = height;
	});
	return {
		cssTextList,
		header,
		headerHeight,
		footer,
		footerHeight
	};
};
var getNodeTreeBoundingRect = (node, x = 0, y = 0, paddingX = 0, paddingY = 0, excludeSelf = false, excludeGeneralization = false) => {
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;
	const walk = (root, isRoot) => {
		if (!(isRoot && excludeSelf) && root.group) try {
			const { x, y, width, height } = root.group.findOne(".smm-node-shape").rbox();
			if (x < minX) minX = x;
			if (x + width > maxX) maxX = x + width;
			if (y < minY) minY = y;
			if (y + height > maxY) maxY = y + height;
		} catch (e) {}
		if (!excludeGeneralization && root._generalizationList.length > 0) root._generalizationList.forEach((item) => {
			walk(item.generalizationNode);
		});
		if (root.children) root.children.forEach((item) => {
			walk(item);
		});
	};
	walk(node, true);
	minX = minX - x + paddingX;
	minY = minY - y + paddingY;
	maxX = maxX - x + paddingX;
	maxY = maxY - y + paddingY;
	return {
		left: minX,
		top: minY,
		width: maxX - minX,
		height: maxY - minY
	};
};
var getOnfullscreEnevt = () => {
	if (document.documentElement.requestFullScreen) return "fullscreenchange";
	else if (document.documentElement.webkitRequestFullScreen) return "webkitfullscreenchange";
	else if (document.documentElement.mozRequestFullScreen) return "mozfullscreenchange";
	else if (document.documentElement.msRequestFullscreen) return "msfullscreenchange";
};
getOnfullscreEnevt();
var createForeignObjectNode = ({ el, width, height }) => {
	const foreignObject = new ForeignObject();
	if (width !== void 0) foreignObject.width(width);
	if (height !== void 0) foreignObject.height(height);
	foreignObject.add(el);
	return foreignObject;
};
var formatGetNodeGeneralization = (data) => {
	const generalization = data.generalization;
	if (generalization) return Array.isArray(generalization) ? generalization : [generalization];
	else return [];
};
var addXmlns = (el) => {
	el.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
};
var sortNodeList = (nodeList) => {
	nodeList = [...nodeList];
	nodeList.sort((a, b) => {
		return a.sortIndex - b.sortIndex;
	});
	return nodeList;
};
var mergeTheme = (dest, source) => {
	return (0, import_cjs.default)(dest, source, { arrayMerge: (destinationArray, sourceArray) => {
		return sourceArray;
	} });
};
var getNodeRichTextStyles = (node) => {
	const res = {};
	richTextSupportStyleList.forEach((prop) => {
		let value = node.style.merge(prop);
		if (prop === "fontSize") value = value + "px";
		res[prop] = value;
	});
	return res;
};
//#endregion
export { readBlob as $, getNodeTreeBoundingRect as A, noneRichTextNodeLineHeight as At, handleSelfCloseTags as B, formatDataToArray as C, v4 as Ct, getNodeDataIndex as D, cssContent as Dt, getDataFromClipboard as E, ERROR_TYPES as Et, getTopAncestorsFomNodeList as F, isUndef as G, imgToDataUrl as H, getTwoPointDistance as I, mergeTheme as J, isWhite as K, getVisibleColorFromTheme as L, getRectRelativePosition as M, getStrWithBrFromHtml as N, getNodeIndexInNodeList as O, initRootNodePositionMap as Ot, getTextFromHtml as P, parseAddGeneralizationNodeList as Q, handleGetSvgDataExtraContent as R, focusInput as S, Text as St, generateColorByContent as T, CONSTANTS as Tt, isNodeNotNeedRenderData as U, htmlEscape as V, isSameObject as W, nextTick as X, mergerIconList as Y, nodeRichTextToTextWithWrap as Z, createUid as _, Image$1 as _t, camelCaseToHyphen as a, setDataToClipboard as at, degToRad as b, Rect as bt, checkIsRichText as c, throttle as ct, checkSmmFormatData as d, checkIsNodeSizeIndependenceConfig as dt, removeFromParentNodeData as et, checkTwoRectIsOverlap as f, default_default as ft, createSmmFormatData as g, G as gt, createForeignObjectNode as h, Circle as ht, bfsWalk as i, selectAllInput as it, getObjectChangedProps as j, getNodeRichTextStyles as k, layoutValueList as kt, checkNodeListIsEqual as l, transformTreeDataToObject as lt, copyRenderTree as m, A as mt, addXmlns as n, removeRichTextStyes as nt, checkClipboardReadEnable as o, simpleDeepClone as ot, copyNodeTree as p, lineStyleProps as pt, loadImage as q, asyncRun as r, resizeImgSize as rt, checkIsNodeStyleDataKey as s, sortNodeList as st, addDataToAppointNodes as t, removeHTMLEntities as tt, checkNodeOuter as u, walk as ut, createUidForAppointNodes as v, Path as vt, formatGetNodeGeneralization as w, require_cjs as wt, downloadFile as x, SVG as xt, debounce as y, Polygon as yt, handleInputPasteText as z };
