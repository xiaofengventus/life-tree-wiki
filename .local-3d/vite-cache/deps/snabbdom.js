//#region node_modules/snabbdom/build/htmldomapi.js
function createElement(tagName, options) {
	return document.createElement(tagName, options);
}
function createElementNS(namespaceURI, qualifiedName, options) {
	return document.createElementNS(namespaceURI, qualifiedName, options);
}
function createDocumentFragment() {
	return parseFragment(document.createDocumentFragment());
}
function createTextNode(text) {
	return document.createTextNode(text);
}
function createComment(text) {
	return document.createComment(text);
}
function insertBefore(parentNode, newNode, referenceNode) {
	if (isDocumentFragment$1(parentNode)) {
		let node = parentNode;
		while (node && isDocumentFragment$1(node)) node = parseFragment(node).parent;
		parentNode = node !== null && node !== void 0 ? node : parentNode;
	}
	if (isDocumentFragment$1(newNode)) newNode = parseFragment(newNode, parentNode);
	if (referenceNode && isDocumentFragment$1(referenceNode)) referenceNode = parseFragment(referenceNode).firstChildNode;
	parentNode.insertBefore(newNode, referenceNode);
}
function removeChild(node, child) {
	node.removeChild(child);
}
function appendChild(node, child) {
	if (isDocumentFragment$1(child)) child = parseFragment(child, node);
	node.appendChild(child);
}
function parentNode(node) {
	if (isDocumentFragment$1(node)) {
		while (node && isDocumentFragment$1(node)) node = parseFragment(node).parent;
		return node !== null && node !== void 0 ? node : null;
	}
	return node.parentNode;
}
function nextSibling(node) {
	var _a;
	if (isDocumentFragment$1(node)) {
		const fragment = parseFragment(node);
		const parent = parentNode(fragment);
		if (parent && fragment.lastChildNode) {
			const children = Array.from(parent.childNodes);
			return (_a = children[children.indexOf(fragment.lastChildNode) + 1]) !== null && _a !== void 0 ? _a : null;
		}
		return null;
	}
	return node.nextSibling;
}
function tagName(elm) {
	return elm.tagName;
}
function setTextContent(node, text) {
	node.textContent = text;
}
function getTextContent(node) {
	return node.textContent;
}
function isElement$1(node) {
	return node.nodeType === 1;
}
function isText(node) {
	return node.nodeType === 3;
}
function isComment(node) {
	return node.nodeType === 8;
}
function isDocumentFragment$1(node) {
	return node.nodeType === 11;
}
function parseFragment(fragmentNode, parentNode) {
	var _a, _b, _c;
	const fragment = fragmentNode;
	(_a = fragment.parent) !== null && _a !== void 0 || (fragment.parent = parentNode !== null && parentNode !== void 0 ? parentNode : null);
	(_b = fragment.firstChildNode) !== null && _b !== void 0 || (fragment.firstChildNode = fragmentNode.firstChild);
	(_c = fragment.lastChildNode) !== null && _c !== void 0 || (fragment.lastChildNode = fragmentNode.lastChild);
	return fragment;
}
var htmlDomApi = {
	createElement,
	createElementNS,
	createTextNode,
	createDocumentFragment,
	createComment,
	insertBefore,
	removeChild,
	appendChild,
	parentNode,
	nextSibling,
	tagName,
	setTextContent,
	getTextContent,
	isElement: isElement$1,
	isText,
	isComment,
	isDocumentFragment: isDocumentFragment$1
};
//#endregion
//#region node_modules/snabbdom/build/vnode.js
function vnode(sel, data, children, text, elm) {
	return {
		sel,
		data,
		children,
		text,
		elm,
		key: data === void 0 ? void 0 : data.key
	};
}
//#endregion
//#region node_modules/snabbdom/build/is.js
var array = Array.isArray;
function primitive(s) {
	return typeof s === "string" || typeof s === "number" || s instanceof String || s instanceof Number;
}
//#endregion
//#region node_modules/snabbdom/build/init.js
var emptyNode = vnode("", {}, [], void 0, void 0);
function sameVnode(vnode1, vnode2) {
	var _a, _b;
	const isSameKey = vnode1.key === vnode2.key;
	const isSameIs = ((_a = vnode1.data) === null || _a === void 0 ? void 0 : _a.is) === ((_b = vnode2.data) === null || _b === void 0 ? void 0 : _b.is);
	const isSameSel = vnode1.sel === vnode2.sel;
	const isSameTextOrFragment = !vnode1.sel && vnode1.sel === vnode2.sel ? typeof vnode1.text === typeof vnode2.text : true;
	return isSameSel && isSameKey && isSameIs && isSameTextOrFragment;
}
/**
* @todo Remove this function when the document fragment is considered stable.
*/
function documentFragmentIsNotSupported() {
	throw new Error("The document fragment is not supported on this platform.");
}
function isElement(api, vnode) {
	return api.isElement(vnode);
}
function isDocumentFragment(api, vnode) {
	return api.isDocumentFragment(vnode);
}
function createKeyToOldIdx(children, beginIdx, endIdx) {
	var _a;
	const map = {};
	for (let i = beginIdx; i <= endIdx; ++i) {
		const key = (_a = children[i]) === null || _a === void 0 ? void 0 : _a.key;
		if (key !== void 0) map[key] = i;
	}
	return map;
}
var hooks = [
	"create",
	"update",
	"remove",
	"destroy",
	"pre",
	"post"
];
function init(modules, domApi, options) {
	const cbs = {
		create: [],
		update: [],
		remove: [],
		destroy: [],
		pre: [],
		post: []
	};
	const api = domApi !== void 0 ? domApi : htmlDomApi;
	for (const hook of hooks) for (const module of modules) {
		const currentHook = module[hook];
		if (currentHook !== void 0) cbs[hook].push(currentHook);
	}
	function emptyNodeAt(elm) {
		const id = elm.id ? "#" + elm.id : "";
		const classes = elm.getAttribute("class");
		const c = classes ? "." + classes.split(" ").join(".") : "";
		return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], void 0, elm);
	}
	function emptyDocumentFragmentAt(frag) {
		return vnode(void 0, {}, [], void 0, frag);
	}
	function createRmCb(childElm, listeners) {
		return function rmCb() {
			if (--listeners === 0) {
				const parent = api.parentNode(childElm);
				if (parent !== null) api.removeChild(parent, childElm);
			}
		};
	}
	function createElm(vnode, insertedVnodeQueue) {
		var _a, _b, _c, _d, _e;
		let i;
		const data = vnode.data;
		const hook = data === null || data === void 0 ? void 0 : data.hook;
		(_a = hook === null || hook === void 0 ? void 0 : hook.init) === null || _a === void 0 || _a.call(hook, vnode);
		const children = vnode.children;
		const sel = vnode.sel;
		if (sel === "!") {
			(_b = vnode.text) !== null && _b !== void 0 || (vnode.text = "");
			vnode.elm = api.createComment(vnode.text);
		} else if (sel === "") vnode.elm = api.createTextNode(vnode.text);
		else if (sel !== void 0) {
			const hashIdx = sel.indexOf("#");
			const dotIdx = sel.indexOf(".", hashIdx);
			const hash = hashIdx > 0 ? hashIdx : sel.length;
			const dot = dotIdx > 0 ? dotIdx : sel.length;
			const tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
			const ns = data === null || data === void 0 ? void 0 : data.ns;
			const elm = ns === void 0 ? api.createElement(tag, data) : api.createElementNS(ns, tag, data);
			vnode.elm = elm;
			if (hash < dot) elm.setAttribute("id", sel.slice(hash + 1, dot));
			if (dotIdx > 0) elm.setAttribute("class", sel.slice(dot + 1).replace(/\./g, " "));
			for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode);
			if (primitive(vnode.text) && (!array(children) || children.length === 0)) api.appendChild(elm, api.createTextNode(vnode.text));
			if (array(children)) for (i = 0; i < children.length; ++i) {
				const ch = children[i];
				if (ch != null) api.appendChild(elm, createElm(ch, insertedVnodeQueue));
			}
			if (hook !== void 0) {
				(_c = hook.create) === null || _c === void 0 || _c.call(hook, emptyNode, vnode);
				if (hook.insert !== void 0) insertedVnodeQueue.push(vnode);
			}
		} else if (((_d = options === null || options === void 0 ? void 0 : options.experimental) === null || _d === void 0 ? void 0 : _d.fragments) && vnode.children) {
			vnode.elm = ((_e = api.createDocumentFragment) !== null && _e !== void 0 ? _e : documentFragmentIsNotSupported)();
			for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode);
			for (i = 0; i < vnode.children.length; ++i) {
				const ch = vnode.children[i];
				if (ch != null) api.appendChild(vnode.elm, createElm(ch, insertedVnodeQueue));
			}
		} else vnode.elm = api.createTextNode(vnode.text);
		return vnode.elm;
	}
	function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
		for (; startIdx <= endIdx; ++startIdx) {
			const ch = vnodes[startIdx];
			if (ch != null) api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
		}
	}
	function invokeDestroyHook(vnode) {
		var _a, _b;
		const data = vnode.data;
		if (data !== void 0) {
			(_b = (_a = data === null || data === void 0 ? void 0 : data.hook) === null || _a === void 0 ? void 0 : _a.destroy) === null || _b === void 0 || _b.call(_a, vnode);
			for (let i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode);
			if (vnode.children !== void 0) for (let j = 0; j < vnode.children.length; ++j) {
				const child = vnode.children[j];
				if (child != null && typeof child !== "string") invokeDestroyHook(child);
			}
		}
	}
	function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
		var _a, _b;
		for (; startIdx <= endIdx; ++startIdx) {
			let listeners;
			const ch = vnodes[startIdx];
			if (ch != null) if (ch.sel !== void 0) {
				invokeDestroyHook(ch);
				listeners = cbs.remove.length + 1;
				const rm = createRmCb(ch.elm, listeners);
				for (let i = 0; i < cbs.remove.length; ++i) cbs.remove[i](ch, rm);
				const removeHook = (_b = (_a = ch === null || ch === void 0 ? void 0 : ch.data) === null || _a === void 0 ? void 0 : _a.hook) === null || _b === void 0 ? void 0 : _b.remove;
				if (removeHook !== void 0) removeHook(ch, rm);
				else rm();
			} else if (ch.children) {
				invokeDestroyHook(ch);
				removeVnodes(parentElm, ch.children, 0, ch.children.length - 1);
			} else api.removeChild(parentElm, ch.elm);
		}
	}
	function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
		let oldStartIdx = 0;
		let newStartIdx = 0;
		let oldEndIdx = oldCh.length - 1;
		let oldStartVnode = oldCh[0];
		let oldEndVnode = oldCh[oldEndIdx];
		let newEndIdx = newCh.length - 1;
		let newStartVnode = newCh[0];
		let newEndVnode = newCh[newEndIdx];
		let oldKeyToIdx;
		let idxInOld;
		let elmToMove;
		let before;
		while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) if (oldStartVnode == null) oldStartVnode = oldCh[++oldStartIdx];
		else if (oldEndVnode == null) oldEndVnode = oldCh[--oldEndIdx];
		else if (newStartVnode == null) newStartVnode = newCh[++newStartIdx];
		else if (newEndVnode == null) newEndVnode = newCh[--newEndIdx];
		else if (sameVnode(oldStartVnode, newStartVnode)) {
			patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
			oldStartVnode = oldCh[++oldStartIdx];
			newStartVnode = newCh[++newStartIdx];
		} else if (sameVnode(oldEndVnode, newEndVnode)) {
			patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
			oldEndVnode = oldCh[--oldEndIdx];
			newEndVnode = newCh[--newEndIdx];
		} else if (sameVnode(oldStartVnode, newEndVnode)) {
			patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
			api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
			oldStartVnode = oldCh[++oldStartIdx];
			newEndVnode = newCh[--newEndIdx];
		} else if (sameVnode(oldEndVnode, newStartVnode)) {
			patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
			api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
			oldEndVnode = oldCh[--oldEndIdx];
			newStartVnode = newCh[++newStartIdx];
		} else {
			if (oldKeyToIdx === void 0) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
			idxInOld = oldKeyToIdx[newStartVnode.key];
			if (idxInOld === void 0) {
				api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
				newStartVnode = newCh[++newStartIdx];
			} else if (oldKeyToIdx[newEndVnode.key] === void 0) {
				api.insertBefore(parentElm, createElm(newEndVnode, insertedVnodeQueue), api.nextSibling(oldEndVnode.elm));
				newEndVnode = newCh[--newEndIdx];
			} else {
				elmToMove = oldCh[idxInOld];
				if (elmToMove.sel !== newStartVnode.sel) api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
				else {
					patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
					oldCh[idxInOld] = void 0;
					api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
				}
				newStartVnode = newCh[++newStartIdx];
			}
		}
		if (newStartIdx <= newEndIdx) {
			before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
			addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
		}
		if (oldStartIdx <= oldEndIdx) removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
	}
	function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
		var _a, _b, _c, _d, _e, _f, _g, _h;
		const hook = (_a = vnode.data) === null || _a === void 0 ? void 0 : _a.hook;
		(_b = hook === null || hook === void 0 ? void 0 : hook.prepatch) === null || _b === void 0 || _b.call(hook, oldVnode, vnode);
		const elm = vnode.elm = oldVnode.elm;
		if (oldVnode === vnode) return;
		if (vnode.data !== void 0 || vnode.text !== void 0 && vnode.text !== oldVnode.text) {
			(_c = vnode.data) !== null && _c !== void 0 || (vnode.data = {});
			(_d = oldVnode.data) !== null && _d !== void 0 || (oldVnode.data = {});
			for (let i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
			(_g = (_f = (_e = vnode.data) === null || _e === void 0 ? void 0 : _e.hook) === null || _f === void 0 ? void 0 : _f.update) === null || _g === void 0 || _g.call(_f, oldVnode, vnode);
		}
		const oldCh = oldVnode.children;
		const ch = vnode.children;
		if (vnode.text === void 0) {
			if (oldCh !== void 0 && ch !== void 0) {
				if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue);
			} else if (ch !== void 0) {
				if (oldVnode.text !== void 0) api.setTextContent(elm, "");
				addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
			} else if (oldCh !== void 0) removeVnodes(elm, oldCh, 0, oldCh.length - 1);
			else if (oldVnode.text !== void 0) api.setTextContent(elm, "");
		} else if (oldVnode.text !== vnode.text) {
			if (oldCh !== void 0) removeVnodes(elm, oldCh, 0, oldCh.length - 1);
			api.setTextContent(elm, vnode.text);
		}
		(_h = hook === null || hook === void 0 ? void 0 : hook.postpatch) === null || _h === void 0 || _h.call(hook, oldVnode, vnode);
	}
	return function patch(oldVnode, vnode) {
		let i, elm, parent;
		const insertedVnodeQueue = [];
		for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();
		if (isElement(api, oldVnode)) oldVnode = emptyNodeAt(oldVnode);
		else if (isDocumentFragment(api, oldVnode)) oldVnode = emptyDocumentFragmentAt(oldVnode);
		if (sameVnode(oldVnode, vnode)) patchVnode(oldVnode, vnode, insertedVnodeQueue);
		else {
			elm = oldVnode.elm;
			parent = api.parentNode(elm);
			createElm(vnode, insertedVnodeQueue);
			if (parent !== null) {
				api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
				removeVnodes(parent, [oldVnode], 0, 0);
			}
		}
		for (i = 0; i < insertedVnodeQueue.length; ++i) insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
		for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
		return vnode;
	};
}
//#endregion
//#region node_modules/snabbdom/build/h.js
function addNS(data, children, sel) {
	data.ns = "http://www.w3.org/2000/svg";
	if (sel !== "foreignObject" && children !== void 0) for (let i = 0; i < children.length; ++i) {
		const child = children[i];
		if (typeof child === "string") continue;
		const childData = child.data;
		if (childData !== void 0) addNS(childData, child.children, child.sel);
	}
}
function h(sel, b, c) {
	let data = {};
	let children;
	let text;
	let i;
	if (c !== void 0) {
		if (b !== null) data = b;
		if (array(c)) children = c;
		else if (primitive(c)) text = c.toString();
		else if (c && c.sel) children = [c];
	} else if (b !== void 0 && b !== null) if (array(b)) children = b;
	else if (primitive(b)) text = b.toString();
	else if (b && b.sel) children = [b];
	else data = b;
	if (children !== void 0) {
		for (i = 0; i < children.length; ++i) if (primitive(children[i])) children[i] = vnode(void 0, void 0, void 0, children[i], void 0);
	}
	if (sel.startsWith("svg") && (sel.length === 3 || sel[3] === "." || sel[3] === "#")) addNS(data, children, sel);
	return vnode(sel, data, children, text, void 0);
}
/**
* @experimental
*/
function fragment(children) {
	let c;
	let text;
	if (array(children)) c = children;
	else if (primitive(c)) text = children;
	else if (c && c.sel) c = [children];
	if (c !== void 0) {
		for (let i = 0; i < c.length; ++i) if (primitive(c[i])) c[i] = vnode(void 0, void 0, void 0, c[i], void 0);
	}
	return vnode(void 0, {}, c, text, void 0);
}
//#endregion
//#region node_modules/snabbdom/build/thunk.js
function copyToThunk(vnode, thunk) {
	var _a;
	const ns = (_a = thunk.data) === null || _a === void 0 ? void 0 : _a.ns;
	vnode.data.fn = thunk.data.fn;
	vnode.data.args = thunk.data.args;
	thunk.data = vnode.data;
	thunk.children = vnode.children;
	thunk.text = vnode.text;
	thunk.elm = vnode.elm;
	if (ns) addNS(thunk.data, thunk.children, thunk.sel);
}
function init$1(thunk) {
	const cur = thunk.data;
	copyToThunk(cur.fn(...cur.args), thunk);
}
function prepatch(oldVnode, thunk) {
	let i;
	const old = oldVnode.data;
	const cur = thunk.data;
	const oldArgs = old.args;
	const args = cur.args;
	if (old.fn !== cur.fn || oldArgs.length !== args.length) {
		copyToThunk(cur.fn(...args), thunk);
		return;
	}
	for (i = 0; i < args.length; ++i) if (oldArgs[i] !== args[i]) {
		copyToThunk(cur.fn(...args), thunk);
		return;
	}
	copyToThunk(oldVnode, thunk);
}
var thunk = function thunk(sel, key, fn, args) {
	if (args === void 0) {
		args = fn;
		fn = key;
		key = void 0;
	}
	return h(sel, {
		key,
		hook: {
			init: init$1,
			prepatch
		},
		fn,
		args
	});
};
//#endregion
//#region node_modules/snabbdom/build/helpers/attachto.js
function pre(vnode, newVnode) {
	const attachData = vnode.data.attachData;
	newVnode.data.attachData.placeholder = attachData.placeholder;
	newVnode.data.attachData.real = attachData.real;
	vnode.elm = vnode.data.attachData.real;
}
function post(_, vnode) {
	vnode.elm = vnode.data.attachData.placeholder;
}
function destroy(vnode) {
	if (vnode.elm !== void 0) vnode.elm.parentNode.removeChild(vnode.elm);
	vnode.elm = vnode.data.attachData.real;
}
function create(_, vnode) {
	const real = vnode.elm;
	const attachData = vnode.data.attachData;
	const placeholder = document.createElement("span");
	vnode.elm = placeholder;
	attachData.target.appendChild(real);
	attachData.real = real;
	attachData.placeholder = placeholder;
}
function attachTo(target, vnode) {
	if (vnode.data === void 0) vnode.data = {};
	if (vnode.data.hook === void 0) vnode.data.hook = {};
	const data = vnode.data;
	const hook = vnode.data.hook;
	data.attachData = {
		target,
		placeholder: void 0,
		real: void 0
	};
	hook.create = create;
	hook.prepatch = pre;
	hook.postpatch = post;
	hook.destroy = destroy;
	return vnode;
}
//#endregion
//#region node_modules/snabbdom/build/tovnode.js
/**
* Transforms the given attribute name into a valid dataset property key
* according to https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset#name_conversion
*
* @param attributeName data- attribute name, must start with data-
*/
function datasetKey(attributeName) {
	return attributeName.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
}
function toVNode(node, domApi) {
	var _a;
	const api = domApi !== void 0 ? domApi : htmlDomApi;
	let text;
	if (api.isElement(node)) {
		const id = node.id ? "#" + node.id : "";
		const cn = (_a = node.getAttribute("class")) === null || _a === void 0 ? void 0 : _a.match(/[^\t\r\n\f ]+/g);
		const c = cn ? "." + cn.join(".") : "";
		const sel = api.tagName(node).toLowerCase() + id + c;
		const attrs = {};
		const dataset = {};
		const data = {};
		const children = [];
		let name;
		let i, n;
		const elmAttrs = node.attributes;
		const elmChildren = node.childNodes;
		for (i = 0, n = elmAttrs.length; i < n; i++) {
			name = elmAttrs[i].nodeName;
			if (name.startsWith("data-")) dataset[datasetKey(name)] = elmAttrs[i].nodeValue || "";
			else if (name !== "id" && name !== "class") attrs[name] = elmAttrs[i].nodeValue;
		}
		for (i = 0, n = elmChildren.length; i < n; i++) children.push(toVNode(elmChildren[i], domApi));
		if (Object.keys(attrs).length > 0) data.attrs = attrs;
		if (Object.keys(dataset).length > 0) data.dataset = dataset;
		if (sel.startsWith("svg") && (sel.length === 3 || sel[3] === "." || sel[3] === "#")) addNS(data, children, sel);
		return vnode(sel, data, children, void 0, node);
	} else if (api.isText(node)) {
		text = api.getTextContent(node);
		return vnode(void 0, void 0, void 0, text, node);
	} else if (api.isComment(node)) {
		text = api.getTextContent(node);
		return vnode("!", {}, [], text, node);
	} else return vnode("", {}, [], void 0, node);
}
//#endregion
//#region node_modules/snabbdom/build/modules/attributes.js
var xlinkNS = "http://www.w3.org/1999/xlink";
var xmlnsNS = "http://www.w3.org/2000/xmlns/";
var xmlNS = "http://www.w3.org/XML/1998/namespace";
var colonChar = 58;
var xChar = 120;
var mChar = 109;
function updateAttrs(oldVnode, vnode) {
	let key;
	const elm = vnode.elm;
	let oldAttrs = oldVnode.data.attrs;
	let attrs = vnode.data.attrs;
	if (!oldAttrs && !attrs) return;
	if (oldAttrs === attrs) return;
	oldAttrs = oldAttrs || {};
	attrs = attrs || {};
	for (key in attrs) {
		const cur = attrs[key];
		if (oldAttrs[key] !== cur) if (cur === true) elm.setAttribute(key, "");
		else if (cur === false) elm.removeAttribute(key);
		else if (key.charCodeAt(0) !== xChar) elm.setAttribute(key, cur);
		else if (key.charCodeAt(3) === colonChar) elm.setAttributeNS(xmlNS, key, cur);
		else if (key.charCodeAt(5) === colonChar) if (key.charCodeAt(1) === mChar) elm.setAttributeNS(xmlnsNS, key, cur);
		else elm.setAttributeNS(xlinkNS, key, cur);
		else elm.setAttribute(key, cur);
	}
	for (key in oldAttrs) if (!(key in attrs)) elm.removeAttribute(key);
}
var attributesModule = {
	create: updateAttrs,
	update: updateAttrs
};
//#endregion
//#region node_modules/snabbdom/build/modules/class.js
function updateClass(oldVnode, vnode) {
	let cur;
	let name;
	const elm = vnode.elm;
	let oldClass = oldVnode.data.class;
	let klass = vnode.data.class;
	if (!oldClass && !klass) return;
	if (oldClass === klass) return;
	oldClass = oldClass || {};
	klass = klass || {};
	for (name in oldClass) if (oldClass[name] && !Object.prototype.hasOwnProperty.call(klass, name)) elm.classList.remove(name);
	for (name in klass) {
		cur = klass[name];
		if (cur !== oldClass[name]) elm.classList[cur ? "add" : "remove"](name);
	}
}
var classModule = {
	create: updateClass,
	update: updateClass
};
//#endregion
//#region node_modules/snabbdom/build/modules/dataset.js
var CAPS_REGEX = /[A-Z]/g;
function updateDataset(oldVnode, vnode) {
	const elm = vnode.elm;
	let oldDataset = oldVnode.data.dataset;
	let dataset = vnode.data.dataset;
	let key;
	if (!oldDataset && !dataset) return;
	if (oldDataset === dataset) return;
	oldDataset = oldDataset || {};
	dataset = dataset || {};
	const d = elm.dataset;
	for (key in oldDataset) if (!(key in dataset)) if (d) {
		if (key in d) delete d[key];
	} else elm.removeAttribute("data-" + key.replace(CAPS_REGEX, "-$&").toLowerCase());
	for (key in dataset) if (oldDataset[key] !== dataset[key]) if (d) d[key] = dataset[key];
	else elm.setAttribute("data-" + key.replace(CAPS_REGEX, "-$&").toLowerCase(), dataset[key]);
}
var datasetModule = {
	create: updateDataset,
	update: updateDataset
};
//#endregion
//#region node_modules/snabbdom/build/modules/eventlisteners.js
function invokeHandler(handler, vnode, event) {
	if (typeof handler === "function") handler.call(vnode, event, vnode);
	else if (typeof handler === "object") for (let i = 0; i < handler.length; i++) invokeHandler(handler[i], vnode, event);
}
function handleEvent(event, vnode) {
	const name = event.type;
	const on = vnode.data.on;
	if (on && on[name]) invokeHandler(on[name], vnode, event);
}
function createListener() {
	return function handler(event) {
		handleEvent(event, handler.vnode);
	};
}
function updateEventListeners(oldVnode, vnode) {
	const oldOn = oldVnode.data.on;
	const oldListener = oldVnode.listener;
	const oldElm = oldVnode.elm;
	const on = vnode && vnode.data.on;
	const elm = vnode && vnode.elm;
	let name;
	if (oldOn === on) return;
	if (oldOn && oldListener) {
		if (!on) for (name in oldOn) oldElm.removeEventListener(name, oldListener, false);
		else for (name in oldOn) if (!on[name]) oldElm.removeEventListener(name, oldListener, false);
	}
	if (on) {
		const listener = vnode.listener = oldVnode.listener || createListener();
		listener.vnode = vnode;
		if (!oldOn) for (name in on) elm.addEventListener(name, listener, false);
		else for (name in on) if (!oldOn[name]) elm.addEventListener(name, listener, false);
	}
}
var eventListenersModule = {
	create: updateEventListeners,
	update: updateEventListeners,
	destroy: updateEventListeners
};
//#endregion
//#region node_modules/snabbdom/build/modules/props.js
function updateProps(oldVnode, vnode) {
	let key;
	let cur;
	let old;
	const elm = vnode.elm;
	let oldProps = oldVnode.data.props;
	let props = vnode.data.props;
	if (!oldProps && !props) return;
	if (oldProps === props) return;
	oldProps = oldProps || {};
	props = props || {};
	for (key in props) {
		cur = props[key];
		old = oldProps[key];
		if (old !== cur && (key !== "value" || elm[key] !== cur)) elm[key] = cur;
	}
}
var propsModule = {
	create: updateProps,
	update: updateProps
};
//#endregion
//#region node_modules/snabbdom/build/modules/style.js
var raf = typeof (window === null || window === void 0 ? void 0 : window.requestAnimationFrame) === "function" ? window.requestAnimationFrame.bind(window) : setTimeout;
var nextFrame = (fn) => {
	raf(() => {
		raf(fn);
	});
};
var reflowForced = false;
function setNextFrame(obj, prop, val) {
	nextFrame(() => {
		obj[prop] = val;
	});
}
function updateStyle(oldVnode, vnode) {
	let cur;
	let name;
	const elm = vnode.elm;
	let oldStyle = oldVnode.data.style;
	let style = vnode.data.style;
	if (!oldStyle && !style) return;
	if (oldStyle === style) return;
	oldStyle = oldStyle || {};
	style = style || {};
	const oldHasDel = "delayed" in oldStyle;
	for (name in oldStyle) if (!(name in style)) if (name[0] === "-" && name[1] === "-") elm.style.removeProperty(name);
	else elm.style[name] = "";
	for (name in style) {
		cur = style[name];
		if (name === "delayed" && style.delayed) for (const name2 in style.delayed) {
			cur = style.delayed[name2];
			if (!oldHasDel || cur !== oldStyle.delayed[name2]) setNextFrame(elm.style, name2, cur);
		}
		else if (name !== "remove" && cur !== oldStyle[name]) if (name[0] === "-" && name[1] === "-") elm.style.setProperty(name, cur);
		else elm.style[name] = cur;
	}
}
function applyDestroyStyle(vnode) {
	let style;
	let name;
	const elm = vnode.elm;
	const s = vnode.data.style;
	if (!s || !(style = s.destroy)) return;
	for (name in style) elm.style[name] = style[name];
}
function applyRemoveStyle(vnode, rm) {
	const s = vnode.data.style;
	if (!s || !s.remove) {
		rm();
		return;
	}
	if (!reflowForced) {
		vnode.elm.offsetLeft;
		reflowForced = true;
	}
	let name;
	const elm = vnode.elm;
	let i = 0;
	const style = s.remove;
	let amount = 0;
	const applied = [];
	for (name in style) {
		applied.push(name);
		elm.style[name] = style[name];
	}
	const props = getComputedStyle(elm)["transition-property"].split(", ");
	for (; i < props.length; ++i) if (applied.indexOf(props[i]) !== -1) amount++;
	elm.addEventListener("transitionend", (ev) => {
		if (ev.target === elm) --amount;
		if (amount === 0) rm();
	});
}
function forceReflow() {
	reflowForced = false;
}
var styleModule = {
	pre: forceReflow,
	create: updateStyle,
	update: updateStyle,
	destroy: applyDestroyStyle,
	remove: applyRemoveStyle
};
//#endregion
//#region node_modules/snabbdom/build/jsx.js
function Fragment(data, ...children) {
	const flatChildren = flattenAndFilter(children, []);
	if (flatChildren.length === 1 && !flatChildren[0].sel && flatChildren[0].text) return vnode(void 0, void 0, void 0, flatChildren[0].text, void 0);
	else return vnode(void 0, data !== null && data !== void 0 ? data : {}, flatChildren, void 0, void 0);
}
function flattenAndFilter(children, flattened) {
	for (const child of children) if (child !== void 0 && child !== null && child !== false && child !== "") if (Array.isArray(child)) flattenAndFilter(child, flattened);
	else if (typeof child === "string" || typeof child === "number" || typeof child === "boolean") flattened.push(vnode(void 0, void 0, void 0, String(child), void 0));
	else flattened.push(child);
	return flattened;
}
/**
* jsx/tsx compatible factory function
* see: https://www.typescriptlang.org/docs/handbook/jsx.html#factory-functions
*/
function jsx(tag, data, ...children) {
	const flatChildren = flattenAndFilter(children, []);
	if (typeof tag === "function") return tag(data, flatChildren);
	else if (flatChildren.length === 1 && !flatChildren[0].sel && flatChildren[0].text) return h(tag, data, flatChildren[0].text);
	else return h(tag, data, flatChildren);
}
//#endregion
export { Fragment, array, attachTo, attributesModule, classModule, datasetModule, eventListenersModule, fragment, h, htmlDomApi, init, jsx, primitive, propsModule, styleModule, thunk, toVNode, vnode };
