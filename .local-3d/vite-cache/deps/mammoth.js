import { a as __toCommonJS, n as __esmMin, r as __exportAll, t as __commonJSMin } from "./rolldown-runtime-D1cXj70v.js";
import { t as require_jszip_min } from "./jszip.js";
//#region node_modules/underscore/modules/_setup.js
var VERSION, root, ArrayProto, ObjProto, SymbolProto, push, slice, toString, hasOwnProperty, supportsArrayBuffer, supportsDataView, nativeIsArray, nativeKeys, nativeCreate, nativeIsView, _isNaN, _isFinite, hasEnumBug, nonEnumerableProps, MAX_ARRAY_INDEX;
var init__setup = __esmMin((() => {
	VERSION = "1.13.8";
	root = typeof self == "object" && self.self === self && self || typeof global == "object" && global.global === global && global || Function("return this")() || {};
	ArrayProto = Array.prototype;
	ObjProto = Object.prototype;
	SymbolProto = typeof Symbol !== "undefined" ? Symbol.prototype : null;
	push = ArrayProto.push;
	slice = ArrayProto.slice;
	toString = ObjProto.toString;
	hasOwnProperty = ObjProto.hasOwnProperty;
	supportsArrayBuffer = typeof ArrayBuffer !== "undefined";
	supportsDataView = typeof DataView !== "undefined";
	nativeIsArray = Array.isArray;
	nativeKeys = Object.keys;
	nativeCreate = Object.create;
	nativeIsView = supportsArrayBuffer && ArrayBuffer.isView;
	_isNaN = isNaN;
	_isFinite = isFinite;
	hasEnumBug = !{ toString: null }.propertyIsEnumerable("toString");
	nonEnumerableProps = [
		"valueOf",
		"isPrototypeOf",
		"toString",
		"propertyIsEnumerable",
		"hasOwnProperty",
		"toLocaleString"
	];
	MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
}));
//#endregion
//#region node_modules/underscore/modules/restArguments.js
function restArguments(func, startIndex) {
	startIndex = startIndex == null ? func.length - 1 : +startIndex;
	return function() {
		var length = Math.max(arguments.length - startIndex, 0), rest = Array(length), index = 0;
		for (; index < length; index++) rest[index] = arguments[index + startIndex];
		switch (startIndex) {
			case 0: return func.call(this, rest);
			case 1: return func.call(this, arguments[0], rest);
			case 2: return func.call(this, arguments[0], arguments[1], rest);
		}
		var args = Array(startIndex + 1);
		for (index = 0; index < startIndex; index++) args[index] = arguments[index];
		args[startIndex] = rest;
		return func.apply(this, args);
	};
}
var init_restArguments = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/isObject.js
function isObject(obj) {
	var type = typeof obj;
	return type === "function" || type === "object" && !!obj;
}
var init_isObject = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/isNull.js
function isNull(obj) {
	return obj === null;
}
var init_isNull = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/isUndefined.js
function isUndefined(obj) {
	return obj === void 0;
}
var init_isUndefined = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/isBoolean.js
function isBoolean(obj) {
	return obj === true || obj === false || toString.call(obj) === "[object Boolean]";
}
var init_isBoolean = __esmMin((() => {
	init__setup();
}));
//#endregion
//#region node_modules/underscore/modules/isElement.js
function isElement(obj) {
	return !!(obj && obj.nodeType === 1);
}
var init_isElement = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/_tagTester.js
function tagTester(name) {
	var tag = "[object " + name + "]";
	return function(obj) {
		return toString.call(obj) === tag;
	};
}
var init__tagTester = __esmMin((() => {
	init__setup();
}));
//#endregion
//#region node_modules/underscore/modules/isString.js
var isString_default;
var init_isString = __esmMin((() => {
	init__tagTester();
	isString_default = tagTester("String");
}));
//#endregion
//#region node_modules/underscore/modules/isNumber.js
var isNumber_default;
var init_isNumber = __esmMin((() => {
	init__tagTester();
	isNumber_default = tagTester("Number");
}));
//#endregion
//#region node_modules/underscore/modules/isDate.js
var isDate_default;
var init_isDate = __esmMin((() => {
	init__tagTester();
	isDate_default = tagTester("Date");
}));
//#endregion
//#region node_modules/underscore/modules/isRegExp.js
var isRegExp_default;
var init_isRegExp = __esmMin((() => {
	init__tagTester();
	isRegExp_default = tagTester("RegExp");
}));
//#endregion
//#region node_modules/underscore/modules/isError.js
var isError_default;
var init_isError = __esmMin((() => {
	init__tagTester();
	isError_default = tagTester("Error");
}));
//#endregion
//#region node_modules/underscore/modules/isSymbol.js
var isSymbol_default;
var init_isSymbol = __esmMin((() => {
	init__tagTester();
	isSymbol_default = tagTester("Symbol");
}));
//#endregion
//#region node_modules/underscore/modules/isArrayBuffer.js
var isArrayBuffer_default;
var init_isArrayBuffer = __esmMin((() => {
	init__tagTester();
	isArrayBuffer_default = tagTester("ArrayBuffer");
}));
//#endregion
//#region node_modules/underscore/modules/isFunction.js
var isFunction, nodelist, isFunction_default;
var init_isFunction = __esmMin((() => {
	init__tagTester();
	init__setup();
	isFunction = tagTester("Function");
	nodelist = root.document && root.document.childNodes;
	if (typeof /./ != "function" && typeof Int8Array != "object" && typeof nodelist != "function") isFunction = function(obj) {
		return typeof obj == "function" || false;
	};
	isFunction_default = isFunction;
}));
//#endregion
//#region node_modules/underscore/modules/_hasObjectTag.js
var _hasObjectTag_default;
var init__hasObjectTag = __esmMin((() => {
	init__tagTester();
	_hasObjectTag_default = tagTester("Object");
}));
//#endregion
//#region node_modules/underscore/modules/_stringTagBug.js
var hasDataViewBug, isIE11;
var init__stringTagBug = __esmMin((() => {
	init__setup();
	init__hasObjectTag();
	hasDataViewBug = supportsDataView && (!/\[native code\]/.test(String(DataView)) || _hasObjectTag_default(/* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8))));
	isIE11 = typeof Map !== "undefined" && _hasObjectTag_default(/* @__PURE__ */ new Map());
}));
//#endregion
//#region node_modules/underscore/modules/isDataView.js
function alternateIsDataView(obj) {
	return obj != null && isFunction_default(obj.getInt8) && isArrayBuffer_default(obj.buffer);
}
var isDataView, isDataView_default;
var init_isDataView = __esmMin((() => {
	init__tagTester();
	init_isFunction();
	init_isArrayBuffer();
	init__stringTagBug();
	isDataView = tagTester("DataView");
	isDataView_default = hasDataViewBug ? alternateIsDataView : isDataView;
}));
//#endregion
//#region node_modules/underscore/modules/isArray.js
var isArray_default;
var init_isArray = __esmMin((() => {
	init__setup();
	init__tagTester();
	isArray_default = nativeIsArray || tagTester("Array");
}));
//#endregion
//#region node_modules/underscore/modules/_has.js
function has$1(obj, key) {
	return obj != null && hasOwnProperty.call(obj, key);
}
var init__has = __esmMin((() => {
	init__setup();
}));
//#endregion
//#region node_modules/underscore/modules/isArguments.js
var isArguments, isArguments_default;
var init_isArguments = __esmMin((() => {
	init__tagTester();
	init__has();
	isArguments = tagTester("Arguments");
	(function() {
		if (!isArguments(arguments)) isArguments = function(obj) {
			return has$1(obj, "callee");
		};
	})();
	isArguments_default = isArguments;
}));
//#endregion
//#region node_modules/underscore/modules/isFinite.js
function isFinite$1(obj) {
	return !isSymbol_default(obj) && _isFinite(obj) && !isNaN(parseFloat(obj));
}
var init_isFinite = __esmMin((() => {
	init__setup();
	init_isSymbol();
}));
//#endregion
//#region node_modules/underscore/modules/isNaN.js
function isNaN$1(obj) {
	return isNumber_default(obj) && _isNaN(obj);
}
var init_isNaN = __esmMin((() => {
	init__setup();
	init_isNumber();
}));
//#endregion
//#region node_modules/underscore/modules/constant.js
function constant(value) {
	return function() {
		return value;
	};
}
var init_constant = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/_createSizePropertyCheck.js
function createSizePropertyCheck(getSizeProperty) {
	return function(collection) {
		var sizeProperty = getSizeProperty(collection);
		return typeof sizeProperty == "number" && sizeProperty >= 0 && sizeProperty <= MAX_ARRAY_INDEX;
	};
}
var init__createSizePropertyCheck = __esmMin((() => {
	init__setup();
}));
//#endregion
//#region node_modules/underscore/modules/_shallowProperty.js
function shallowProperty(key) {
	return function(obj) {
		return obj == null ? void 0 : obj[key];
	};
}
var init__shallowProperty = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/_getByteLength.js
var _getByteLength_default;
var init__getByteLength = __esmMin((() => {
	init__shallowProperty();
	_getByteLength_default = shallowProperty("byteLength");
}));
//#endregion
//#region node_modules/underscore/modules/_isBufferLike.js
var _isBufferLike_default;
var init__isBufferLike = __esmMin((() => {
	init__createSizePropertyCheck();
	init__getByteLength();
	_isBufferLike_default = createSizePropertyCheck(_getByteLength_default);
}));
//#endregion
//#region node_modules/underscore/modules/isTypedArray.js
function isTypedArray(obj) {
	return nativeIsView ? nativeIsView(obj) && !isDataView_default(obj) : _isBufferLike_default(obj) && typedArrayPattern.test(toString.call(obj));
}
var typedArrayPattern, isTypedArray_default;
var init_isTypedArray = __esmMin((() => {
	init__setup();
	init_isDataView();
	init_constant();
	init__isBufferLike();
	typedArrayPattern = /\[object ((I|Ui)nt(8|16|32)|Float(32|64)|Uint8Clamped|Big(I|Ui)nt64)Array\]/;
	isTypedArray_default = supportsArrayBuffer ? isTypedArray : constant(false);
}));
//#endregion
//#region node_modules/underscore/modules/_getLength.js
var _getLength_default;
var init__getLength = __esmMin((() => {
	init__shallowProperty();
	_getLength_default = shallowProperty("length");
}));
//#endregion
//#region node_modules/underscore/modules/_collectNonEnumProps.js
function emulatedSet(keys) {
	var hash = {};
	for (var l = keys.length, i = 0; i < l; ++i) hash[keys[i]] = true;
	return {
		contains: function(key) {
			return hash[key] === true;
		},
		push: function(key) {
			hash[key] = true;
			return keys.push(key);
		}
	};
}
function collectNonEnumProps(obj, keys) {
	keys = emulatedSet(keys);
	var nonEnumIdx = nonEnumerableProps.length;
	var constructor = obj.constructor;
	var proto = isFunction_default(constructor) && constructor.prototype || ObjProto;
	var prop = "constructor";
	if (has$1(obj, prop) && !keys.contains(prop)) keys.push(prop);
	while (nonEnumIdx--) {
		prop = nonEnumerableProps[nonEnumIdx];
		if (prop in obj && obj[prop] !== proto[prop] && !keys.contains(prop)) keys.push(prop);
	}
}
var init__collectNonEnumProps = __esmMin((() => {
	init__setup();
	init_isFunction();
	init__has();
}));
//#endregion
//#region node_modules/underscore/modules/keys.js
function keys(obj) {
	if (!isObject(obj)) return [];
	if (nativeKeys) return nativeKeys(obj);
	var keys = [];
	for (var key in obj) if (has$1(obj, key)) keys.push(key);
	if (hasEnumBug) collectNonEnumProps(obj, keys);
	return keys;
}
var init_keys = __esmMin((() => {
	init_isObject();
	init__setup();
	init__has();
	init__collectNonEnumProps();
}));
//#endregion
//#region node_modules/underscore/modules/isEmpty.js
function isEmpty(obj) {
	if (obj == null) return true;
	var length = _getLength_default(obj);
	if (typeof length == "number" && (isArray_default(obj) || isString_default(obj) || isArguments_default(obj))) return length === 0;
	return _getLength_default(keys(obj)) === 0;
}
var init_isEmpty = __esmMin((() => {
	init__getLength();
	init_isArray();
	init_isString();
	init_isArguments();
	init_keys();
}));
//#endregion
//#region node_modules/underscore/modules/isMatch.js
function isMatch(object, attrs) {
	var _keys = keys(attrs), length = _keys.length;
	if (object == null) return !length;
	var obj = Object(object);
	for (var i = 0; i < length; i++) {
		var key = _keys[i];
		if (attrs[key] !== obj[key] || !(key in obj)) return false;
	}
	return true;
}
var init_isMatch = __esmMin((() => {
	init_keys();
}));
//#endregion
//#region node_modules/underscore/modules/underscore.js
function _$1(obj) {
	if (obj instanceof _$1) return obj;
	if (!(this instanceof _$1)) return new _$1(obj);
	this._wrapped = obj;
}
var init_underscore = __esmMin((() => {
	init__setup();
	_$1.VERSION = VERSION;
	_$1.prototype.value = function() {
		return this._wrapped;
	};
	_$1.prototype.valueOf = _$1.prototype.toJSON = _$1.prototype.value;
	_$1.prototype.toString = function() {
		return String(this._wrapped);
	};
}));
//#endregion
//#region node_modules/underscore/modules/_toBufferView.js
function toBufferView(bufferSource) {
	return new Uint8Array(bufferSource.buffer || bufferSource, bufferSource.byteOffset || 0, _getByteLength_default(bufferSource));
}
var init__toBufferView = __esmMin((() => {
	init__getByteLength();
}));
//#endregion
//#region node_modules/underscore/modules/isEqual.js
function isEqual(a, b) {
	var todo = [{
		a,
		b
	}];
	var aStack = [], bStack = [];
	while (todo.length) {
		var frame = todo.pop();
		if (frame === true) {
			aStack.pop();
			bStack.pop();
			continue;
		}
		a = frame.a;
		b = frame.b;
		if (a === b) {
			if (a !== 0 || 1 / a === 1 / b) continue;
			return false;
		}
		if (a == null || b == null) return false;
		if (a !== a) {
			if (b !== b) continue;
			return false;
		}
		var type = typeof a;
		if (type !== "function" && type !== "object" && typeof b != "object") return false;
		if (a instanceof _$1) a = a._wrapped;
		if (b instanceof _$1) b = b._wrapped;
		var className = toString.call(a);
		if (className !== toString.call(b)) return false;
		if (hasDataViewBug && className == "[object Object]" && isDataView_default(a)) {
			if (!isDataView_default(b)) return false;
			className = tagDataView;
		}
		switch (className) {
			case "[object RegExp]":
			case "[object String]":
				if ("" + a === "" + b) continue;
				return false;
			case "[object Number]":
				todo.push({
					a: +a,
					b: +b
				});
				continue;
			case "[object Date]":
			case "[object Boolean]":
				if (+a === +b) continue;
				return false;
			case "[object Symbol]":
				if (SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b)) continue;
				return false;
			case "[object ArrayBuffer]":
			case tagDataView:
				todo.push({
					a: toBufferView(a),
					b: toBufferView(b)
				});
				continue;
		}
		var areArrays = className === "[object Array]";
		if (!areArrays && isTypedArray_default(a)) {
			if (_getByteLength_default(a) !== _getByteLength_default(b)) return false;
			if (a.buffer === b.buffer && a.byteOffset === b.byteOffset) continue;
			areArrays = true;
		}
		if (!areArrays) {
			if (typeof a != "object" || typeof b != "object") return false;
			var aCtor = a.constructor, bCtor = b.constructor;
			if (aCtor !== bCtor && !(isFunction_default(aCtor) && aCtor instanceof aCtor && isFunction_default(bCtor) && bCtor instanceof bCtor) && "constructor" in a && "constructor" in b) return false;
		}
		var length = aStack.length;
		while (length--) if (aStack[length] === a) {
			if (bStack[length] === b) break;
			return false;
		}
		if (length >= 0) continue;
		aStack.push(a);
		bStack.push(b);
		todo.push(true);
		if (areArrays) {
			length = a.length;
			if (length !== b.length) return false;
			while (length--) todo.push({
				a: a[length],
				b: b[length]
			});
		} else {
			var _keys = keys(a), key;
			length = _keys.length;
			if (keys(b).length !== length) return false;
			while (length--) {
				key = _keys[length];
				if (!has$1(b, key)) return false;
				todo.push({
					a: a[key],
					b: b[key]
				});
			}
		}
	}
	return true;
}
var tagDataView;
var init_isEqual = __esmMin((() => {
	init_underscore();
	init__setup();
	init__getByteLength();
	init_isTypedArray();
	init_isFunction();
	init__stringTagBug();
	init_isDataView();
	init_keys();
	init__has();
	init__toBufferView();
	tagDataView = "[object DataView]";
}));
//#endregion
//#region node_modules/underscore/modules/allKeys.js
function allKeys(obj) {
	if (!isObject(obj)) return [];
	var keys = [];
	for (var key in obj) keys.push(key);
	if (hasEnumBug) collectNonEnumProps(obj, keys);
	return keys;
}
var init_allKeys = __esmMin((() => {
	init_isObject();
	init__setup();
	init__collectNonEnumProps();
}));
//#endregion
//#region node_modules/underscore/modules/_methodFingerprint.js
function ie11fingerprint(methods) {
	var length = _getLength_default(methods);
	return function(obj) {
		if (obj == null) return false;
		if (_getLength_default(allKeys(obj))) return false;
		for (var i = 0; i < length; i++) if (!isFunction_default(obj[methods[i]])) return false;
		return methods !== weakMapMethods || !isFunction_default(obj[forEachName]);
	};
}
var forEachName, hasName, commonInit, mapTail, mapMethods, weakMapMethods, setMethods;
var init__methodFingerprint = __esmMin((() => {
	init__getLength();
	init_isFunction();
	init_allKeys();
	forEachName = "forEach";
	hasName = "has";
	commonInit = ["clear", "delete"];
	mapTail = [
		"get",
		hasName,
		"set"
	];
	mapMethods = commonInit.concat(forEachName, mapTail);
	weakMapMethods = commonInit.concat(mapTail);
	setMethods = ["add"].concat(commonInit, forEachName, hasName);
}));
//#endregion
//#region node_modules/underscore/modules/isMap.js
var isMap_default;
var init_isMap = __esmMin((() => {
	init__tagTester();
	init__stringTagBug();
	init__methodFingerprint();
	isMap_default = isIE11 ? ie11fingerprint(mapMethods) : tagTester("Map");
}));
//#endregion
//#region node_modules/underscore/modules/isWeakMap.js
var isWeakMap_default;
var init_isWeakMap = __esmMin((() => {
	init__tagTester();
	init__stringTagBug();
	init__methodFingerprint();
	isWeakMap_default = isIE11 ? ie11fingerprint(weakMapMethods) : tagTester("WeakMap");
}));
//#endregion
//#region node_modules/underscore/modules/isSet.js
var isSet_default;
var init_isSet = __esmMin((() => {
	init__tagTester();
	init__stringTagBug();
	init__methodFingerprint();
	isSet_default = isIE11 ? ie11fingerprint(setMethods) : tagTester("Set");
}));
//#endregion
//#region node_modules/underscore/modules/isWeakSet.js
var isWeakSet_default;
var init_isWeakSet = __esmMin((() => {
	init__tagTester();
	isWeakSet_default = tagTester("WeakSet");
}));
//#endregion
//#region node_modules/underscore/modules/values.js
function values(obj) {
	var _keys = keys(obj);
	var length = _keys.length;
	var values = Array(length);
	for (var i = 0; i < length; i++) values[i] = obj[_keys[i]];
	return values;
}
var init_values = __esmMin((() => {
	init_keys();
}));
//#endregion
//#region node_modules/underscore/modules/pairs.js
function pairs(obj) {
	var _keys = keys(obj);
	var length = _keys.length;
	var pairs = Array(length);
	for (var i = 0; i < length; i++) pairs[i] = [_keys[i], obj[_keys[i]]];
	return pairs;
}
var init_pairs = __esmMin((() => {
	init_keys();
}));
//#endregion
//#region node_modules/underscore/modules/invert.js
function invert(obj) {
	var result = {};
	var _keys = keys(obj);
	for (var i = 0, length = _keys.length; i < length; i++) result[obj[_keys[i]]] = _keys[i];
	return result;
}
var init_invert = __esmMin((() => {
	init_keys();
}));
//#endregion
//#region node_modules/underscore/modules/functions.js
function functions(obj) {
	var names = [];
	for (var key in obj) if (isFunction_default(obj[key])) names.push(key);
	return names.sort();
}
var init_functions = __esmMin((() => {
	init_isFunction();
}));
//#endregion
//#region node_modules/underscore/modules/_createAssigner.js
function createAssigner(keysFunc, defaults) {
	return function(obj) {
		var length = arguments.length;
		if (defaults) obj = Object(obj);
		if (length < 2 || obj == null) return obj;
		for (var index = 1; index < length; index++) {
			var source = arguments[index], keys = keysFunc(source), l = keys.length;
			for (var i = 0; i < l; i++) {
				var key = keys[i];
				if (!defaults || obj[key] === void 0) obj[key] = source[key];
			}
		}
		return obj;
	};
}
var init__createAssigner = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/extend.js
var extend_default;
var init_extend = __esmMin((() => {
	init__createAssigner();
	init_allKeys();
	extend_default = createAssigner(allKeys);
}));
//#endregion
//#region node_modules/underscore/modules/extendOwn.js
var extendOwn_default;
var init_extendOwn = __esmMin((() => {
	init__createAssigner();
	init_keys();
	extendOwn_default = createAssigner(keys);
}));
//#endregion
//#region node_modules/underscore/modules/defaults.js
var defaults_default;
var init_defaults = __esmMin((() => {
	init__createAssigner();
	init_allKeys();
	defaults_default = createAssigner(allKeys, true);
}));
//#endregion
//#region node_modules/underscore/modules/_baseCreate.js
function ctor() {
	return function() {};
}
function baseCreate(prototype) {
	if (!isObject(prototype)) return {};
	if (nativeCreate) return nativeCreate(prototype);
	var Ctor = ctor();
	Ctor.prototype = prototype;
	var result = new Ctor();
	Ctor.prototype = null;
	return result;
}
var init__baseCreate = __esmMin((() => {
	init_isObject();
	init__setup();
}));
//#endregion
//#region node_modules/underscore/modules/create.js
function create(prototype, props) {
	var result = baseCreate(prototype);
	if (props) extendOwn_default(result, props);
	return result;
}
var init_create = __esmMin((() => {
	init__baseCreate();
	init_extendOwn();
}));
//#endregion
//#region node_modules/underscore/modules/clone.js
function clone(obj) {
	if (!isObject(obj)) return obj;
	return isArray_default(obj) ? obj.slice() : extend_default({}, obj);
}
var init_clone = __esmMin((() => {
	init_isObject();
	init_isArray();
	init_extend();
}));
//#endregion
//#region node_modules/underscore/modules/tap.js
function tap(obj, interceptor) {
	interceptor(obj);
	return obj;
}
var init_tap = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/toPath.js
function toPath$1(path) {
	return isArray_default(path) ? path : [path];
}
var init_toPath = __esmMin((() => {
	init_underscore();
	init_isArray();
	_$1.toPath = toPath$1;
}));
//#endregion
//#region node_modules/underscore/modules/_toPath.js
function toPath(path) {
	return _$1.toPath(path);
}
var init__toPath = __esmMin((() => {
	init_underscore();
	init_toPath();
}));
//#endregion
//#region node_modules/underscore/modules/_deepGet.js
function deepGet(obj, path) {
	var length = path.length;
	for (var i = 0; i < length; i++) {
		if (obj == null) return void 0;
		obj = obj[path[i]];
	}
	return length ? obj : void 0;
}
var init__deepGet = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/get.js
function get(object, path, defaultValue) {
	var value = deepGet(object, toPath(path));
	return isUndefined(value) ? defaultValue : value;
}
var init_get = __esmMin((() => {
	init__toPath();
	init__deepGet();
	init_isUndefined();
}));
//#endregion
//#region node_modules/underscore/modules/has.js
function has(obj, path) {
	path = toPath(path);
	var length = path.length;
	for (var i = 0; i < length; i++) {
		var key = path[i];
		if (!has$1(obj, key)) return false;
		obj = obj[key];
	}
	return !!length;
}
var init_has = __esmMin((() => {
	init__has();
	init__toPath();
}));
//#endregion
//#region node_modules/underscore/modules/identity.js
function identity(value) {
	return value;
}
var init_identity = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/matcher.js
function matcher(attrs) {
	attrs = extendOwn_default({}, attrs);
	return function(obj) {
		return isMatch(obj, attrs);
	};
}
var init_matcher = __esmMin((() => {
	init_extendOwn();
	init_isMatch();
}));
//#endregion
//#region node_modules/underscore/modules/property.js
function property(path) {
	path = toPath(path);
	return function(obj) {
		return deepGet(obj, path);
	};
}
var init_property = __esmMin((() => {
	init__deepGet();
	init__toPath();
}));
//#endregion
//#region node_modules/underscore/modules/_optimizeCb.js
function optimizeCb(func, context, argCount) {
	if (context === void 0) return func;
	switch (argCount == null ? 3 : argCount) {
		case 1: return function(value) {
			return func.call(context, value);
		};
		case 3: return function(value, index, collection) {
			return func.call(context, value, index, collection);
		};
		case 4: return function(accumulator, value, index, collection) {
			return func.call(context, accumulator, value, index, collection);
		};
	}
	return function() {
		return func.apply(context, arguments);
	};
}
var init__optimizeCb = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/_baseIteratee.js
function baseIteratee(value, context, argCount) {
	if (value == null) return identity;
	if (isFunction_default(value)) return optimizeCb(value, context, argCount);
	if (isObject(value) && !isArray_default(value)) return matcher(value);
	return property(value);
}
var init__baseIteratee = __esmMin((() => {
	init_identity();
	init_isFunction();
	init_isObject();
	init_isArray();
	init_matcher();
	init_property();
	init__optimizeCb();
}));
//#endregion
//#region node_modules/underscore/modules/iteratee.js
function iteratee(value, context) {
	return baseIteratee(value, context, Infinity);
}
var init_iteratee = __esmMin((() => {
	init_underscore();
	init__baseIteratee();
	_$1.iteratee = iteratee;
}));
//#endregion
//#region node_modules/underscore/modules/_cb.js
function cb(value, context, argCount) {
	if (_$1.iteratee !== iteratee) return _$1.iteratee(value, context);
	return baseIteratee(value, context, argCount);
}
var init__cb = __esmMin((() => {
	init_underscore();
	init__baseIteratee();
	init_iteratee();
}));
//#endregion
//#region node_modules/underscore/modules/mapObject.js
function mapObject(obj, iteratee, context) {
	iteratee = cb(iteratee, context);
	var _keys = keys(obj), length = _keys.length, results = {};
	for (var index = 0; index < length; index++) {
		var currentKey = _keys[index];
		results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
	}
	return results;
}
var init_mapObject = __esmMin((() => {
	init__cb();
	init_keys();
}));
//#endregion
//#region node_modules/underscore/modules/noop.js
function noop() {}
var init_noop = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/propertyOf.js
function propertyOf(obj) {
	if (obj == null) return noop;
	return function(path) {
		return get(obj, path);
	};
}
var init_propertyOf = __esmMin((() => {
	init_noop();
	init_get();
}));
//#endregion
//#region node_modules/underscore/modules/times.js
function times(n, iteratee, context) {
	var accum = Array(Math.max(0, n));
	iteratee = optimizeCb(iteratee, context, 1);
	for (var i = 0; i < n; i++) accum[i] = iteratee(i);
	return accum;
}
var init_times = __esmMin((() => {
	init__optimizeCb();
}));
//#endregion
//#region node_modules/underscore/modules/random.js
function random(min, max) {
	if (max == null) {
		max = min;
		min = 0;
	}
	return min + Math.floor(Math.random() * (max - min + 1));
}
var init_random = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/now.js
var now_default;
var init_now = __esmMin((() => {
	now_default = Date.now || function() {
		return (/* @__PURE__ */ new Date()).getTime();
	};
}));
//#endregion
//#region node_modules/underscore/modules/_createEscaper.js
function createEscaper(map) {
	var escaper = function(match) {
		return map[match];
	};
	var source = "(?:" + keys(map).join("|") + ")";
	var testRegexp = RegExp(source);
	var replaceRegexp = RegExp(source, "g");
	return function(string) {
		string = string == null ? "" : "" + string;
		return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
	};
}
var init__createEscaper = __esmMin((() => {
	init_keys();
}));
//#endregion
//#region node_modules/underscore/modules/_escapeMap.js
var _escapeMap_default;
var init__escapeMap = __esmMin((() => {
	_escapeMap_default = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#x27;",
		"`": "&#x60;"
	};
}));
//#endregion
//#region node_modules/underscore/modules/escape.js
var escape_default;
var init_escape = __esmMin((() => {
	init__createEscaper();
	init__escapeMap();
	escape_default = createEscaper(_escapeMap_default);
}));
//#endregion
//#region node_modules/underscore/modules/_unescapeMap.js
var _unescapeMap_default;
var init__unescapeMap = __esmMin((() => {
	init_invert();
	init__escapeMap();
	_unescapeMap_default = invert(_escapeMap_default);
}));
//#endregion
//#region node_modules/underscore/modules/unescape.js
var unescape_default;
var init_unescape = __esmMin((() => {
	init__createEscaper();
	init__unescapeMap();
	unescape_default = createEscaper(_unescapeMap_default);
}));
//#endregion
//#region node_modules/underscore/modules/templateSettings.js
var templateSettings_default;
var init_templateSettings = __esmMin((() => {
	init_underscore();
	templateSettings_default = _$1.templateSettings = {
		evaluate: /<%([\s\S]+?)%>/g,
		interpolate: /<%=([\s\S]+?)%>/g,
		escape: /<%-([\s\S]+?)%>/g
	};
}));
//#endregion
//#region node_modules/underscore/modules/template.js
function escapeChar(match) {
	return "\\" + escapes[match];
}
function template(text, settings, oldSettings) {
	if (!settings && oldSettings) settings = oldSettings;
	settings = defaults_default({}, settings, _$1.templateSettings);
	var matcher = RegExp([
		(settings.escape || noMatch).source,
		(settings.interpolate || noMatch).source,
		(settings.evaluate || noMatch).source
	].join("|") + "|$", "g");
	var index = 0;
	var source = "__p+='";
	text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
		source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
		index = offset + match.length;
		if (escape) source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
		else if (interpolate) source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
		else if (evaluate) source += "';\n" + evaluate + "\n__p+='";
		return match;
	});
	source += "';\n";
	var argument = settings.variable;
	if (argument) {
		if (!bareIdentifier.test(argument)) throw new Error("variable is not a bare identifier: " + argument);
	} else {
		source = "with(obj||{}){\n" + source + "}\n";
		argument = "obj";
	}
	source = "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";
	var render;
	try {
		render = new Function(argument, "_", source);
	} catch (e) {
		e.source = source;
		throw e;
	}
	var template = function(data) {
		return render.call(this, data, _$1);
	};
	template.source = "function(" + argument + "){\n" + source + "}";
	return template;
}
var noMatch, escapes, escapeRegExp, bareIdentifier;
var init_template = __esmMin((() => {
	init_defaults();
	init_underscore();
	init_templateSettings();
	noMatch = /(.)^/;
	escapes = {
		"'": "'",
		"\\": "\\",
		"\r": "r",
		"\n": "n",
		"\u2028": "u2028",
		"\u2029": "u2029"
	};
	escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;
	bareIdentifier = /^\s*(\w|\$)+\s*$/;
}));
//#endregion
//#region node_modules/underscore/modules/result.js
function result(obj, path, fallback) {
	path = toPath(path);
	var length = path.length;
	if (!length) return isFunction_default(fallback) ? fallback.call(obj) : fallback;
	for (var i = 0; i < length; i++) {
		var prop = obj == null ? void 0 : obj[path[i]];
		if (prop === void 0) {
			prop = fallback;
			i = length;
		}
		obj = isFunction_default(prop) ? prop.call(obj) : prop;
	}
	return obj;
}
var init_result = __esmMin((() => {
	init_isFunction();
	init__toPath();
}));
//#endregion
//#region node_modules/underscore/modules/uniqueId.js
function uniqueId(prefix) {
	var id = ++idCounter + "";
	return prefix ? prefix + id : id;
}
var idCounter;
var init_uniqueId = __esmMin((() => {
	idCounter = 0;
}));
//#endregion
//#region node_modules/underscore/modules/chain.js
function chain(obj) {
	var instance = _$1(obj);
	instance._chain = true;
	return instance;
}
var init_chain = __esmMin((() => {
	init_underscore();
}));
//#endregion
//#region node_modules/underscore/modules/_executeBound.js
function executeBound(sourceFunc, boundFunc, context, callingContext, args) {
	if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
	var self = baseCreate(sourceFunc.prototype);
	var result = sourceFunc.apply(self, args);
	if (isObject(result)) return result;
	return self;
}
var init__executeBound = __esmMin((() => {
	init__baseCreate();
	init_isObject();
}));
//#endregion
//#region node_modules/underscore/modules/partial.js
var partial;
var init_partial = __esmMin((() => {
	init_restArguments();
	init__executeBound();
	init_underscore();
	partial = restArguments(function(func, boundArgs) {
		var placeholder = partial.placeholder;
		var bound = function() {
			var position = 0, length = boundArgs.length;
			var args = Array(length);
			for (var i = 0; i < length; i++) args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
			while (position < arguments.length) args.push(arguments[position++]);
			return executeBound(func, bound, this, this, args);
		};
		return bound;
	});
	partial.placeholder = _$1;
}));
//#endregion
//#region node_modules/underscore/modules/bind.js
var bind_default;
var init_bind = __esmMin((() => {
	init_restArguments();
	init_isFunction();
	init__executeBound();
	bind_default = restArguments(function(func, context, args) {
		if (!isFunction_default(func)) throw new TypeError("Bind must be called on a function");
		var bound = restArguments(function(callArgs) {
			return executeBound(func, bound, context, this, args.concat(callArgs));
		});
		return bound;
	});
}));
//#endregion
//#region node_modules/underscore/modules/_isArrayLike.js
var _isArrayLike_default;
var init__isArrayLike = __esmMin((() => {
	init__createSizePropertyCheck();
	init__getLength();
	_isArrayLike_default = createSizePropertyCheck(_getLength_default);
}));
//#endregion
//#region node_modules/underscore/modules/_flatten.js
function flatten$1(input, depth, strict) {
	if (!depth && depth !== 0) depth = Infinity;
	var output = [], idx = 0, i = 0, length = _getLength_default(input) || 0, stack = [];
	while (true) {
		if (i >= length) {
			if (!stack.length) break;
			var frame = stack.pop();
			i = frame.i;
			input = frame.v;
			length = _getLength_default(input);
			continue;
		}
		var value = input[i++];
		if (stack.length >= depth) output[idx++] = value;
		else if (_isArrayLike_default(value) && (isArray_default(value) || isArguments_default(value))) {
			stack.push({
				i,
				v: input
			});
			i = 0;
			input = value;
			length = _getLength_default(input);
		} else if (!strict) output[idx++] = value;
	}
	return output;
}
var init__flatten = __esmMin((() => {
	init__getLength();
	init__isArrayLike();
	init_isArray();
	init_isArguments();
}));
//#endregion
//#region node_modules/underscore/modules/bindAll.js
var bindAll_default;
var init_bindAll = __esmMin((() => {
	init_restArguments();
	init__flatten();
	init_bind();
	bindAll_default = restArguments(function(obj, keys) {
		keys = flatten$1(keys, false, false);
		var index = keys.length;
		if (index < 1) throw new Error("bindAll must be passed function names");
		while (index--) {
			var key = keys[index];
			obj[key] = bind_default(obj[key], obj);
		}
		return obj;
	});
}));
//#endregion
//#region node_modules/underscore/modules/memoize.js
function memoize(func, hasher) {
	var memoize = function(key) {
		var cache = memoize.cache;
		var address = "" + (hasher ? hasher.apply(this, arguments) : key);
		if (!has$1(cache, address)) cache[address] = func.apply(this, arguments);
		return cache[address];
	};
	memoize.cache = {};
	return memoize;
}
var init_memoize = __esmMin((() => {
	init__has();
}));
//#endregion
//#region node_modules/underscore/modules/delay.js
var delay_default;
var init_delay = __esmMin((() => {
	init_restArguments();
	delay_default = restArguments(function(func, wait, args) {
		return setTimeout(function() {
			return func.apply(null, args);
		}, wait);
	});
}));
//#endregion
//#region node_modules/underscore/modules/defer.js
var defer_default;
var init_defer = __esmMin((() => {
	init_partial();
	init_delay();
	init_underscore();
	defer_default = partial(delay_default, _$1, 1);
}));
//#endregion
//#region node_modules/underscore/modules/throttle.js
function throttle(func, wait, options) {
	var timeout, context, args, result;
	var previous = 0;
	if (!options) options = {};
	var later = function() {
		previous = options.leading === false ? 0 : now_default();
		timeout = null;
		result = func.apply(context, args);
		if (!timeout) context = args = null;
	};
	var throttled = function() {
		var _now = now_default();
		if (!previous && options.leading === false) previous = _now;
		var remaining = wait - (_now - previous);
		context = this;
		args = arguments;
		if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			previous = _now;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		} else if (!timeout && options.trailing !== false) timeout = setTimeout(later, remaining);
		return result;
	};
	throttled.cancel = function() {
		clearTimeout(timeout);
		previous = 0;
		timeout = context = args = null;
	};
	return throttled;
}
var init_throttle = __esmMin((() => {
	init_now();
}));
//#endregion
//#region node_modules/underscore/modules/debounce.js
function debounce(func, wait, immediate) {
	var timeout, previous, args, result, context;
	var later = function() {
		var passed = now_default() - previous;
		if (wait > passed) timeout = setTimeout(later, wait - passed);
		else {
			timeout = null;
			if (!immediate) result = func.apply(context, args);
			if (!timeout) args = context = null;
		}
	};
	var debounced = restArguments(function(_args) {
		context = this;
		args = _args;
		previous = now_default();
		if (!timeout) {
			timeout = setTimeout(later, wait);
			if (immediate) result = func.apply(context, args);
		}
		return result;
	});
	debounced.cancel = function() {
		clearTimeout(timeout);
		timeout = args = context = null;
	};
	return debounced;
}
var init_debounce = __esmMin((() => {
	init_restArguments();
	init_now();
}));
//#endregion
//#region node_modules/underscore/modules/wrap.js
function wrap(func, wrapper) {
	return partial(wrapper, func);
}
var init_wrap = __esmMin((() => {
	init_partial();
}));
//#endregion
//#region node_modules/underscore/modules/negate.js
function negate(predicate) {
	return function() {
		return !predicate.apply(this, arguments);
	};
}
var init_negate = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/compose.js
function compose() {
	var args = arguments;
	var start = args.length - 1;
	return function() {
		var i = start;
		var result = args[start].apply(this, arguments);
		while (i--) result = args[i].call(this, result);
		return result;
	};
}
var init_compose = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/after.js
function after(times, func) {
	return function() {
		if (--times < 1) return func.apply(this, arguments);
	};
}
var init_after = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/before.js
function before(times, func) {
	var memo;
	return function() {
		if (--times > 0) memo = func.apply(this, arguments);
		if (times <= 1) func = null;
		return memo;
	};
}
var init_before = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/once.js
var once_default;
var init_once = __esmMin((() => {
	init_partial();
	init_before();
	once_default = partial(before, 2);
}));
//#endregion
//#region node_modules/underscore/modules/findKey.js
function findKey(obj, predicate, context) {
	predicate = cb(predicate, context);
	var _keys = keys(obj), key;
	for (var i = 0, length = _keys.length; i < length; i++) {
		key = _keys[i];
		if (predicate(obj[key], key, obj)) return key;
	}
}
var init_findKey = __esmMin((() => {
	init__cb();
	init_keys();
}));
//#endregion
//#region node_modules/underscore/modules/_createPredicateIndexFinder.js
function createPredicateIndexFinder(dir) {
	return function(array, predicate, context) {
		predicate = cb(predicate, context);
		var length = _getLength_default(array);
		var index = dir > 0 ? 0 : length - 1;
		for (; index >= 0 && index < length; index += dir) if (predicate(array[index], index, array)) return index;
		return -1;
	};
}
var init__createPredicateIndexFinder = __esmMin((() => {
	init__cb();
	init__getLength();
}));
//#endregion
//#region node_modules/underscore/modules/findIndex.js
var findIndex_default;
var init_findIndex = __esmMin((() => {
	init__createPredicateIndexFinder();
	findIndex_default = createPredicateIndexFinder(1);
}));
//#endregion
//#region node_modules/underscore/modules/findLastIndex.js
var findLastIndex_default;
var init_findLastIndex = __esmMin((() => {
	init__createPredicateIndexFinder();
	findLastIndex_default = createPredicateIndexFinder(-1);
}));
//#endregion
//#region node_modules/underscore/modules/sortedIndex.js
function sortedIndex(array, obj, iteratee, context) {
	iteratee = cb(iteratee, context, 1);
	var value = iteratee(obj);
	var low = 0, high = _getLength_default(array);
	while (low < high) {
		var mid = Math.floor((low + high) / 2);
		if (iteratee(array[mid]) < value) low = mid + 1;
		else high = mid;
	}
	return low;
}
var init_sortedIndex = __esmMin((() => {
	init__cb();
	init__getLength();
}));
//#endregion
//#region node_modules/underscore/modules/_createIndexFinder.js
function createIndexFinder(dir, predicateFind, sortedIndex) {
	return function(array, item, idx) {
		var i = 0, length = _getLength_default(array);
		if (typeof idx == "number") if (dir > 0) i = idx >= 0 ? idx : Math.max(idx + length, i);
		else length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
		else if (sortedIndex && idx && length) {
			idx = sortedIndex(array, item);
			return array[idx] === item ? idx : -1;
		}
		if (item !== item) {
			idx = predicateFind(slice.call(array, i, length), isNaN$1);
			return idx >= 0 ? idx + i : -1;
		}
		for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) if (array[idx] === item) return idx;
		return -1;
	};
}
var init__createIndexFinder = __esmMin((() => {
	init__getLength();
	init__setup();
	init_isNaN();
}));
//#endregion
//#region node_modules/underscore/modules/indexOf.js
var indexOf_default;
var init_indexOf = __esmMin((() => {
	init_sortedIndex();
	init_findIndex();
	init__createIndexFinder();
	indexOf_default = createIndexFinder(1, findIndex_default, sortedIndex);
}));
//#endregion
//#region node_modules/underscore/modules/lastIndexOf.js
var lastIndexOf_default;
var init_lastIndexOf = __esmMin((() => {
	init_findLastIndex();
	init__createIndexFinder();
	lastIndexOf_default = createIndexFinder(-1, findLastIndex_default);
}));
//#endregion
//#region node_modules/underscore/modules/find.js
function find(obj, predicate, context) {
	var key = (_isArrayLike_default(obj) ? findIndex_default : findKey)(obj, predicate, context);
	if (key !== void 0 && key !== -1) return obj[key];
}
var init_find = __esmMin((() => {
	init__isArrayLike();
	init_findIndex();
	init_findKey();
}));
//#endregion
//#region node_modules/underscore/modules/findWhere.js
function findWhere(obj, attrs) {
	return find(obj, matcher(attrs));
}
var init_findWhere = __esmMin((() => {
	init_find();
	init_matcher();
}));
//#endregion
//#region node_modules/underscore/modules/each.js
function each(obj, iteratee, context) {
	iteratee = optimizeCb(iteratee, context);
	var i, length;
	if (_isArrayLike_default(obj)) for (i = 0, length = obj.length; i < length; i++) iteratee(obj[i], i, obj);
	else {
		var _keys = keys(obj);
		for (i = 0, length = _keys.length; i < length; i++) iteratee(obj[_keys[i]], _keys[i], obj);
	}
	return obj;
}
var init_each = __esmMin((() => {
	init__optimizeCb();
	init__isArrayLike();
	init_keys();
}));
//#endregion
//#region node_modules/underscore/modules/map.js
function map(obj, iteratee, context) {
	iteratee = cb(iteratee, context);
	var _keys = !_isArrayLike_default(obj) && keys(obj), length = (_keys || obj).length, results = Array(length);
	for (var index = 0; index < length; index++) {
		var currentKey = _keys ? _keys[index] : index;
		results[index] = iteratee(obj[currentKey], currentKey, obj);
	}
	return results;
}
var init_map = __esmMin((() => {
	init__cb();
	init__isArrayLike();
	init_keys();
}));
//#endregion
//#region node_modules/underscore/modules/_createReduce.js
function createReduce(dir) {
	var reducer = function(obj, iteratee, memo, initial) {
		var _keys = !_isArrayLike_default(obj) && keys(obj), length = (_keys || obj).length, index = dir > 0 ? 0 : length - 1;
		if (!initial) {
			memo = obj[_keys ? _keys[index] : index];
			index += dir;
		}
		for (; index >= 0 && index < length; index += dir) {
			var currentKey = _keys ? _keys[index] : index;
			memo = iteratee(memo, obj[currentKey], currentKey, obj);
		}
		return memo;
	};
	return function(obj, iteratee, memo, context) {
		var initial = arguments.length >= 3;
		return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
	};
}
var init__createReduce = __esmMin((() => {
	init__isArrayLike();
	init_keys();
	init__optimizeCb();
}));
//#endregion
//#region node_modules/underscore/modules/reduce.js
var reduce_default;
var init_reduce = __esmMin((() => {
	init__createReduce();
	reduce_default = createReduce(1);
}));
//#endregion
//#region node_modules/underscore/modules/reduceRight.js
var reduceRight_default;
var init_reduceRight = __esmMin((() => {
	init__createReduce();
	reduceRight_default = createReduce(-1);
}));
//#endregion
//#region node_modules/underscore/modules/filter.js
function filter(obj, predicate, context) {
	var results = [];
	predicate = cb(predicate, context);
	each(obj, function(value, index, list) {
		if (predicate(value, index, list)) results.push(value);
	});
	return results;
}
var init_filter = __esmMin((() => {
	init__cb();
	init_each();
}));
//#endregion
//#region node_modules/underscore/modules/reject.js
function reject(obj, predicate, context) {
	return filter(obj, negate(cb(predicate)), context);
}
var init_reject = __esmMin((() => {
	init_filter();
	init_negate();
	init__cb();
}));
//#endregion
//#region node_modules/underscore/modules/every.js
function every(obj, predicate, context) {
	predicate = cb(predicate, context);
	var _keys = !_isArrayLike_default(obj) && keys(obj), length = (_keys || obj).length;
	for (var index = 0; index < length; index++) {
		var currentKey = _keys ? _keys[index] : index;
		if (!predicate(obj[currentKey], currentKey, obj)) return false;
	}
	return true;
}
var init_every = __esmMin((() => {
	init__cb();
	init__isArrayLike();
	init_keys();
}));
//#endregion
//#region node_modules/underscore/modules/some.js
function some(obj, predicate, context) {
	predicate = cb(predicate, context);
	var _keys = !_isArrayLike_default(obj) && keys(obj), length = (_keys || obj).length;
	for (var index = 0; index < length; index++) {
		var currentKey = _keys ? _keys[index] : index;
		if (predicate(obj[currentKey], currentKey, obj)) return true;
	}
	return false;
}
var init_some = __esmMin((() => {
	init__cb();
	init__isArrayLike();
	init_keys();
}));
//#endregion
//#region node_modules/underscore/modules/contains.js
function contains(obj, item, fromIndex, guard) {
	if (!_isArrayLike_default(obj)) obj = values(obj);
	if (typeof fromIndex != "number" || guard) fromIndex = 0;
	return indexOf_default(obj, item, fromIndex) >= 0;
}
var init_contains = __esmMin((() => {
	init__isArrayLike();
	init_values();
	init_indexOf();
}));
//#endregion
//#region node_modules/underscore/modules/invoke.js
var invoke_default;
var init_invoke = __esmMin((() => {
	init_restArguments();
	init_isFunction();
	init_map();
	init__deepGet();
	init__toPath();
	invoke_default = restArguments(function(obj, path, args) {
		var contextPath, func;
		if (isFunction_default(path)) func = path;
		else {
			path = toPath(path);
			contextPath = path.slice(0, -1);
			path = path[path.length - 1];
		}
		return map(obj, function(context) {
			var method = func;
			if (!method) {
				if (contextPath && contextPath.length) context = deepGet(context, contextPath);
				if (context == null) return void 0;
				method = context[path];
			}
			return method == null ? method : method.apply(context, args);
		});
	});
}));
//#endregion
//#region node_modules/underscore/modules/pluck.js
function pluck(obj, key) {
	return map(obj, property(key));
}
var init_pluck = __esmMin((() => {
	init_map();
	init_property();
}));
//#endregion
//#region node_modules/underscore/modules/where.js
function where(obj, attrs) {
	return filter(obj, matcher(attrs));
}
var init_where = __esmMin((() => {
	init_filter();
	init_matcher();
}));
//#endregion
//#region node_modules/underscore/modules/max.js
function max(obj, iteratee, context) {
	var result = -Infinity, lastComputed = -Infinity, value, computed;
	if (iteratee == null || typeof iteratee == "number" && typeof obj[0] != "object" && obj != null) {
		obj = _isArrayLike_default(obj) ? obj : values(obj);
		for (var i = 0, length = obj.length; i < length; i++) {
			value = obj[i];
			if (value != null && value > result) result = value;
		}
	} else {
		iteratee = cb(iteratee, context);
		each(obj, function(v, index, list) {
			computed = iteratee(v, index, list);
			if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
				result = v;
				lastComputed = computed;
			}
		});
	}
	return result;
}
var init_max = __esmMin((() => {
	init__isArrayLike();
	init_values();
	init__cb();
	init_each();
}));
//#endregion
//#region node_modules/underscore/modules/min.js
function min(obj, iteratee, context) {
	var result = Infinity, lastComputed = Infinity, value, computed;
	if (iteratee == null || typeof iteratee == "number" && typeof obj[0] != "object" && obj != null) {
		obj = _isArrayLike_default(obj) ? obj : values(obj);
		for (var i = 0, length = obj.length; i < length; i++) {
			value = obj[i];
			if (value != null && value < result) result = value;
		}
	} else {
		iteratee = cb(iteratee, context);
		each(obj, function(v, index, list) {
			computed = iteratee(v, index, list);
			if (computed < lastComputed || computed === Infinity && result === Infinity) {
				result = v;
				lastComputed = computed;
			}
		});
	}
	return result;
}
var init_min = __esmMin((() => {
	init__isArrayLike();
	init_values();
	init__cb();
	init_each();
}));
//#endregion
//#region node_modules/underscore/modules/toArray.js
function toArray(obj) {
	if (!obj) return [];
	if (isArray_default(obj)) return slice.call(obj);
	if (isString_default(obj)) return obj.match(reStrSymbol);
	if (_isArrayLike_default(obj)) return map(obj, identity);
	return values(obj);
}
var reStrSymbol;
var init_toArray = __esmMin((() => {
	init_isArray();
	init__setup();
	init_isString();
	init__isArrayLike();
	init_map();
	init_identity();
	init_values();
	reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
}));
//#endregion
//#region node_modules/underscore/modules/sample.js
function sample(obj, n, guard) {
	if (n == null || guard) {
		if (!_isArrayLike_default(obj)) obj = values(obj);
		return obj[random(obj.length - 1)];
	}
	var sample = toArray(obj);
	var length = _getLength_default(sample);
	n = Math.max(Math.min(n, length), 0);
	var last = length - 1;
	for (var index = 0; index < n; index++) {
		var rand = random(index, last);
		var temp = sample[index];
		sample[index] = sample[rand];
		sample[rand] = temp;
	}
	return sample.slice(0, n);
}
var init_sample = __esmMin((() => {
	init__isArrayLike();
	init_values();
	init__getLength();
	init_random();
	init_toArray();
}));
//#endregion
//#region node_modules/underscore/modules/shuffle.js
function shuffle(obj) {
	return sample(obj, Infinity);
}
var init_shuffle = __esmMin((() => {
	init_sample();
}));
//#endregion
//#region node_modules/underscore/modules/sortBy.js
function sortBy(obj, iteratee, context) {
	var index = 0;
	iteratee = cb(iteratee, context);
	return pluck(map(obj, function(value, key, list) {
		return {
			value,
			index: index++,
			criteria: iteratee(value, key, list)
		};
	}).sort(function(left, right) {
		var a = left.criteria;
		var b = right.criteria;
		if (a !== b) {
			if (a > b || a === void 0) return 1;
			if (a < b || b === void 0) return -1;
		}
		return left.index - right.index;
	}), "value");
}
var init_sortBy = __esmMin((() => {
	init__cb();
	init_pluck();
	init_map();
}));
//#endregion
//#region node_modules/underscore/modules/_group.js
function group(behavior, partition) {
	return function(obj, iteratee, context) {
		var result = partition ? [[], []] : {};
		iteratee = cb(iteratee, context);
		each(obj, function(value, index) {
			behavior(result, value, iteratee(value, index, obj));
		});
		return result;
	};
}
var init__group = __esmMin((() => {
	init__cb();
	init_each();
}));
//#endregion
//#region node_modules/underscore/modules/groupBy.js
var groupBy_default;
var init_groupBy = __esmMin((() => {
	init__group();
	init__has();
	groupBy_default = group(function(result, value, key) {
		if (has$1(result, key)) result[key].push(value);
		else result[key] = [value];
	});
}));
//#endregion
//#region node_modules/underscore/modules/indexBy.js
var indexBy_default;
var init_indexBy = __esmMin((() => {
	init__group();
	indexBy_default = group(function(result, value, key) {
		result[key] = value;
	});
}));
//#endregion
//#region node_modules/underscore/modules/countBy.js
var countBy_default;
var init_countBy = __esmMin((() => {
	init__group();
	init__has();
	countBy_default = group(function(result, value, key) {
		if (has$1(result, key)) result[key]++;
		else result[key] = 1;
	});
}));
//#endregion
//#region node_modules/underscore/modules/partition.js
var partition_default;
var init_partition = __esmMin((() => {
	init__group();
	partition_default = group(function(result, value, pass) {
		result[pass ? 0 : 1].push(value);
	}, true);
}));
//#endregion
//#region node_modules/underscore/modules/size.js
function size(obj) {
	if (obj == null) return 0;
	return _isArrayLike_default(obj) ? obj.length : keys(obj).length;
}
var init_size = __esmMin((() => {
	init__isArrayLike();
	init_keys();
}));
//#endregion
//#region node_modules/underscore/modules/_keyInObj.js
function keyInObj(value, key, obj) {
	return key in obj;
}
var init__keyInObj = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/pick.js
var pick_default;
var init_pick = __esmMin((() => {
	init_restArguments();
	init_isFunction();
	init__optimizeCb();
	init_allKeys();
	init__keyInObj();
	init__flatten();
	pick_default = restArguments(function(obj, keys) {
		var result = {}, iteratee = keys[0];
		if (obj == null) return result;
		if (isFunction_default(iteratee)) {
			if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
			keys = allKeys(obj);
		} else {
			iteratee = keyInObj;
			keys = flatten$1(keys, false, false);
			obj = Object(obj);
		}
		for (var i = 0, length = keys.length; i < length; i++) {
			var key = keys[i];
			var value = obj[key];
			if (iteratee(value, key, obj)) result[key] = value;
		}
		return result;
	});
}));
//#endregion
//#region node_modules/underscore/modules/omit.js
var omit_default;
var init_omit = __esmMin((() => {
	init_restArguments();
	init_isFunction();
	init_negate();
	init_map();
	init__flatten();
	init_contains();
	init_pick();
	omit_default = restArguments(function(obj, keys) {
		var iteratee = keys[0], context;
		if (isFunction_default(iteratee)) {
			iteratee = negate(iteratee);
			if (keys.length > 1) context = keys[1];
		} else {
			keys = map(flatten$1(keys, false, false), String);
			iteratee = function(value, key) {
				return !contains(keys, key);
			};
		}
		return pick_default(obj, iteratee, context);
	});
}));
//#endregion
//#region node_modules/underscore/modules/initial.js
function initial(array, n, guard) {
	return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
}
var init_initial = __esmMin((() => {
	init__setup();
}));
//#endregion
//#region node_modules/underscore/modules/first.js
function first(array, n, guard) {
	if (array == null || array.length < 1) return n == null || guard ? void 0 : [];
	if (n == null || guard) return array[0];
	return initial(array, array.length - n);
}
var init_first = __esmMin((() => {
	init_initial();
}));
//#endregion
//#region node_modules/underscore/modules/rest.js
function rest(array, n, guard) {
	return slice.call(array, n == null || guard ? 1 : n);
}
var init_rest = __esmMin((() => {
	init__setup();
}));
//#endregion
//#region node_modules/underscore/modules/last.js
function last(array, n, guard) {
	if (array == null || array.length < 1) return n == null || guard ? void 0 : [];
	if (n == null || guard) return array[array.length - 1];
	return rest(array, Math.max(0, array.length - n));
}
var init_last = __esmMin((() => {
	init_rest();
}));
//#endregion
//#region node_modules/underscore/modules/compact.js
function compact(array) {
	return filter(array, Boolean);
}
var init_compact = __esmMin((() => {
	init_filter();
}));
//#endregion
//#region node_modules/underscore/modules/flatten.js
function flatten(array, depth) {
	return flatten$1(array, depth, false);
}
var init_flatten = __esmMin((() => {
	init__flatten();
}));
//#endregion
//#region node_modules/underscore/modules/difference.js
var difference_default;
var init_difference = __esmMin((() => {
	init_restArguments();
	init__flatten();
	init_filter();
	init_contains();
	difference_default = restArguments(function(array, rest) {
		rest = flatten$1(rest, true, true);
		return filter(array, function(value) {
			return !contains(rest, value);
		});
	});
}));
//#endregion
//#region node_modules/underscore/modules/without.js
var without_default;
var init_without = __esmMin((() => {
	init_restArguments();
	init_difference();
	without_default = restArguments(function(array, otherArrays) {
		return difference_default(array, otherArrays);
	});
}));
//#endregion
//#region node_modules/underscore/modules/uniq.js
function uniq(array, isSorted, iteratee, context) {
	if (!isBoolean(isSorted)) {
		context = iteratee;
		iteratee = isSorted;
		isSorted = false;
	}
	if (iteratee != null) iteratee = cb(iteratee, context);
	var result = [];
	var seen = [];
	for (var i = 0, length = _getLength_default(array); i < length; i++) {
		var value = array[i], computed = iteratee ? iteratee(value, i, array) : value;
		if (isSorted && !iteratee) {
			if (!i || seen !== computed) result.push(value);
			seen = computed;
		} else if (iteratee) {
			if (!contains(seen, computed)) {
				seen.push(computed);
				result.push(value);
			}
		} else if (!contains(result, value)) result.push(value);
	}
	return result;
}
var init_uniq = __esmMin((() => {
	init_isBoolean();
	init__cb();
	init__getLength();
	init_contains();
}));
//#endregion
//#region node_modules/underscore/modules/union.js
var union_default;
var init_union = __esmMin((() => {
	init_restArguments();
	init_uniq();
	init__flatten();
	union_default = restArguments(function(arrays) {
		return uniq(flatten$1(arrays, true, true));
	});
}));
//#endregion
//#region node_modules/underscore/modules/intersection.js
function intersection(array) {
	var result = [];
	var argsLength = arguments.length;
	for (var i = 0, length = _getLength_default(array); i < length; i++) {
		var item = array[i];
		if (contains(result, item)) continue;
		var j;
		for (j = 1; j < argsLength; j++) if (!contains(arguments[j], item)) break;
		if (j === argsLength) result.push(item);
	}
	return result;
}
var init_intersection = __esmMin((() => {
	init__getLength();
	init_contains();
}));
//#endregion
//#region node_modules/underscore/modules/unzip.js
function unzip(array) {
	var length = array && max(array, _getLength_default).length || 0;
	var result = Array(length);
	for (var index = 0; index < length; index++) result[index] = pluck(array, index);
	return result;
}
var init_unzip = __esmMin((() => {
	init_max();
	init__getLength();
	init_pluck();
}));
//#endregion
//#region node_modules/underscore/modules/zip.js
var zip_default;
var init_zip = __esmMin((() => {
	init_restArguments();
	init_unzip();
	zip_default = restArguments(unzip);
}));
//#endregion
//#region node_modules/underscore/modules/object.js
function object(list, values) {
	var result = {};
	for (var i = 0, length = _getLength_default(list); i < length; i++) if (values) result[list[i]] = values[i];
	else result[list[i][0]] = list[i][1];
	return result;
}
var init_object = __esmMin((() => {
	init__getLength();
}));
//#endregion
//#region node_modules/underscore/modules/range.js
function range(start, stop, step) {
	if (stop == null) {
		stop = start || 0;
		start = 0;
	}
	if (!step) step = stop < start ? -1 : 1;
	var length = Math.max(Math.ceil((stop - start) / step), 0);
	var range = Array(length);
	for (var idx = 0; idx < length; idx++, start += step) range[idx] = start;
	return range;
}
var init_range = __esmMin((() => {}));
//#endregion
//#region node_modules/underscore/modules/chunk.js
function chunk(array, count) {
	if (count == null || count < 1) return [];
	var result = [];
	var i = 0, length = array.length;
	while (i < length) result.push(slice.call(array, i, i += count));
	return result;
}
var init_chunk = __esmMin((() => {
	init__setup();
}));
//#endregion
//#region node_modules/underscore/modules/_chainResult.js
function chainResult(instance, obj) {
	return instance._chain ? _$1(obj).chain() : obj;
}
var init__chainResult = __esmMin((() => {
	init_underscore();
}));
//#endregion
//#region node_modules/underscore/modules/mixin.js
function mixin(obj) {
	each(functions(obj), function(name) {
		var func = _$1[name] = obj[name];
		_$1.prototype[name] = function() {
			var args = [this._wrapped];
			push.apply(args, arguments);
			return chainResult(this, func.apply(_$1, args));
		};
	});
	return _$1;
}
var init_mixin = __esmMin((() => {
	init_underscore();
	init_each();
	init_functions();
	init__setup();
	init__chainResult();
}));
//#endregion
//#region node_modules/underscore/modules/underscore-array-methods.js
var underscore_array_methods_default;
var init_underscore_array_methods = __esmMin((() => {
	init_underscore();
	init_each();
	init__setup();
	init__chainResult();
	each([
		"pop",
		"push",
		"reverse",
		"shift",
		"sort",
		"splice",
		"unshift"
	], function(name) {
		var method = ArrayProto[name];
		_$1.prototype[name] = function() {
			var obj = this._wrapped;
			if (obj != null) {
				method.apply(obj, arguments);
				if ((name === "shift" || name === "splice") && obj.length === 0) delete obj[0];
			}
			return chainResult(this, obj);
		};
	});
	each([
		"concat",
		"join",
		"slice"
	], function(name) {
		var method = ArrayProto[name];
		_$1.prototype[name] = function() {
			var obj = this._wrapped;
			if (obj != null) obj = method.apply(obj, arguments);
			return chainResult(this, obj);
		};
	});
	underscore_array_methods_default = _$1;
}));
//#endregion
//#region node_modules/underscore/modules/index.js
var modules_exports = /* @__PURE__ */ __exportAll({
	VERSION: () => VERSION,
	after: () => after,
	all: () => every,
	allKeys: () => allKeys,
	any: () => some,
	assign: () => extendOwn_default,
	before: () => before,
	bind: () => bind_default,
	bindAll: () => bindAll_default,
	chain: () => chain,
	chunk: () => chunk,
	clone: () => clone,
	collect: () => map,
	compact: () => compact,
	compose: () => compose,
	constant: () => constant,
	contains: () => contains,
	countBy: () => countBy_default,
	create: () => create,
	debounce: () => debounce,
	default: () => underscore_array_methods_default,
	defaults: () => defaults_default,
	defer: () => defer_default,
	delay: () => delay_default,
	detect: () => find,
	difference: () => difference_default,
	drop: () => rest,
	each: () => each,
	escape: () => escape_default,
	every: () => every,
	extend: () => extend_default,
	extendOwn: () => extendOwn_default,
	filter: () => filter,
	find: () => find,
	findIndex: () => findIndex_default,
	findKey: () => findKey,
	findLastIndex: () => findLastIndex_default,
	findWhere: () => findWhere,
	first: () => first,
	flatten: () => flatten,
	foldl: () => reduce_default,
	foldr: () => reduceRight_default,
	forEach: () => each,
	functions: () => functions,
	get: () => get,
	groupBy: () => groupBy_default,
	has: () => has,
	head: () => first,
	identity: () => identity,
	include: () => contains,
	includes: () => contains,
	indexBy: () => indexBy_default,
	indexOf: () => indexOf_default,
	initial: () => initial,
	inject: () => reduce_default,
	intersection: () => intersection,
	invert: () => invert,
	invoke: () => invoke_default,
	isArguments: () => isArguments_default,
	isArray: () => isArray_default,
	isArrayBuffer: () => isArrayBuffer_default,
	isBoolean: () => isBoolean,
	isDataView: () => isDataView_default,
	isDate: () => isDate_default,
	isElement: () => isElement,
	isEmpty: () => isEmpty,
	isEqual: () => isEqual,
	isError: () => isError_default,
	isFinite: () => isFinite$1,
	isFunction: () => isFunction_default,
	isMap: () => isMap_default,
	isMatch: () => isMatch,
	isNaN: () => isNaN$1,
	isNull: () => isNull,
	isNumber: () => isNumber_default,
	isObject: () => isObject,
	isRegExp: () => isRegExp_default,
	isSet: () => isSet_default,
	isString: () => isString_default,
	isSymbol: () => isSymbol_default,
	isTypedArray: () => isTypedArray_default,
	isUndefined: () => isUndefined,
	isWeakMap: () => isWeakMap_default,
	isWeakSet: () => isWeakSet_default,
	iteratee: () => iteratee,
	keys: () => keys,
	last: () => last,
	lastIndexOf: () => lastIndexOf_default,
	map: () => map,
	mapObject: () => mapObject,
	matcher: () => matcher,
	matches: () => matcher,
	max: () => max,
	memoize: () => memoize,
	methods: () => functions,
	min: () => min,
	mixin: () => mixin,
	negate: () => negate,
	noop: () => noop,
	now: () => now_default,
	object: () => object,
	omit: () => omit_default,
	once: () => once_default,
	pairs: () => pairs,
	partial: () => partial,
	partition: () => partition_default,
	pick: () => pick_default,
	pluck: () => pluck,
	property: () => property,
	propertyOf: () => propertyOf,
	random: () => random,
	range: () => range,
	reduce: () => reduce_default,
	reduceRight: () => reduceRight_default,
	reject: () => reject,
	rest: () => rest,
	restArguments: () => restArguments,
	result: () => result,
	sample: () => sample,
	select: () => filter,
	shuffle: () => shuffle,
	size: () => size,
	some: () => some,
	sortBy: () => sortBy,
	sortedIndex: () => sortedIndex,
	tail: () => rest,
	take: () => first,
	tap: () => tap,
	template: () => template,
	templateSettings: () => templateSettings_default,
	throttle: () => throttle,
	times: () => times,
	toArray: () => toArray,
	toPath: () => toPath$1,
	transpose: () => unzip,
	unescape: () => unescape_default,
	union: () => union_default,
	uniq: () => uniq,
	unique: () => uniq,
	uniqueId: () => uniqueId,
	unzip: () => unzip,
	values: () => values,
	where: () => where,
	without: () => without_default,
	wrap: () => wrap,
	zip: () => zip_default
});
var init_modules = __esmMin((() => {
	init__setup();
	init_restArguments();
	init_isObject();
	init_isNull();
	init_isUndefined();
	init_isBoolean();
	init_isElement();
	init_isString();
	init_isNumber();
	init_isDate();
	init_isRegExp();
	init_isError();
	init_isSymbol();
	init_isArrayBuffer();
	init_isDataView();
	init_isArray();
	init_isFunction();
	init_isArguments();
	init_isFinite();
	init_isNaN();
	init_isTypedArray();
	init_isEmpty();
	init_isMatch();
	init_isEqual();
	init_isMap();
	init_isWeakMap();
	init_isSet();
	init_isWeakSet();
	init_keys();
	init_allKeys();
	init_values();
	init_pairs();
	init_invert();
	init_functions();
	init_extend();
	init_extendOwn();
	init_defaults();
	init_create();
	init_clone();
	init_tap();
	init_get();
	init_has();
	init_mapObject();
	init_identity();
	init_constant();
	init_noop();
	init_toPath();
	init_property();
	init_propertyOf();
	init_matcher();
	init_times();
	init_random();
	init_now();
	init_escape();
	init_unescape();
	init_templateSettings();
	init_template();
	init_result();
	init_uniqueId();
	init_chain();
	init_iteratee();
	init_partial();
	init_bind();
	init_bindAll();
	init_memoize();
	init_delay();
	init_defer();
	init_throttle();
	init_debounce();
	init_wrap();
	init_negate();
	init_compose();
	init_after();
	init_before();
	init_once();
	init_findKey();
	init_findIndex();
	init_findLastIndex();
	init_sortedIndex();
	init_indexOf();
	init_lastIndexOf();
	init_find();
	init_findWhere();
	init_each();
	init_map();
	init_reduce();
	init_reduceRight();
	init_filter();
	init_reject();
	init_every();
	init_some();
	init_contains();
	init_invoke();
	init_pluck();
	init_where();
	init_max();
	init_min();
	init_shuffle();
	init_sample();
	init_sortBy();
	init_groupBy();
	init_indexBy();
	init_countBy();
	init_partition();
	init_toArray();
	init_size();
	init_pick();
	init_omit();
	init_first();
	init_initial();
	init_last();
	init_rest();
	init_compact();
	init_flatten();
	init_without();
	init_uniq();
	init_union();
	init_intersection();
	init_difference();
	init_unzip();
	init_zip();
	init_object();
	init_range();
	init_chunk();
	init_mixin();
	init_underscore_array_methods();
}));
//#endregion
//#region node_modules/underscore/modules/index-default.js
var _;
var init_index_default = __esmMin((() => {
	init_modules();
	_ = mixin(modules_exports);
	_._ = _;
}));
//#endregion
//#region node_modules/underscore/modules/index-all.js
var index_all_exports = /* @__PURE__ */ __exportAll({
	VERSION: () => VERSION,
	after: () => after,
	all: () => every,
	allKeys: () => allKeys,
	any: () => some,
	assign: () => extendOwn_default,
	before: () => before,
	bind: () => bind_default,
	bindAll: () => bindAll_default,
	chain: () => chain,
	chunk: () => chunk,
	clone: () => clone,
	collect: () => map,
	compact: () => compact,
	compose: () => compose,
	constant: () => constant,
	contains: () => contains,
	countBy: () => countBy_default,
	create: () => create,
	debounce: () => debounce,
	default: () => _,
	defaults: () => defaults_default,
	defer: () => defer_default,
	delay: () => delay_default,
	detect: () => find,
	difference: () => difference_default,
	drop: () => rest,
	each: () => each,
	escape: () => escape_default,
	every: () => every,
	extend: () => extend_default,
	extendOwn: () => extendOwn_default,
	filter: () => filter,
	find: () => find,
	findIndex: () => findIndex_default,
	findKey: () => findKey,
	findLastIndex: () => findLastIndex_default,
	findWhere: () => findWhere,
	first: () => first,
	flatten: () => flatten,
	foldl: () => reduce_default,
	foldr: () => reduceRight_default,
	forEach: () => each,
	functions: () => functions,
	get: () => get,
	groupBy: () => groupBy_default,
	has: () => has,
	head: () => first,
	identity: () => identity,
	include: () => contains,
	includes: () => contains,
	indexBy: () => indexBy_default,
	indexOf: () => indexOf_default,
	initial: () => initial,
	inject: () => reduce_default,
	intersection: () => intersection,
	invert: () => invert,
	invoke: () => invoke_default,
	isArguments: () => isArguments_default,
	isArray: () => isArray_default,
	isArrayBuffer: () => isArrayBuffer_default,
	isBoolean: () => isBoolean,
	isDataView: () => isDataView_default,
	isDate: () => isDate_default,
	isElement: () => isElement,
	isEmpty: () => isEmpty,
	isEqual: () => isEqual,
	isError: () => isError_default,
	isFinite: () => isFinite$1,
	isFunction: () => isFunction_default,
	isMap: () => isMap_default,
	isMatch: () => isMatch,
	isNaN: () => isNaN$1,
	isNull: () => isNull,
	isNumber: () => isNumber_default,
	isObject: () => isObject,
	isRegExp: () => isRegExp_default,
	isSet: () => isSet_default,
	isString: () => isString_default,
	isSymbol: () => isSymbol_default,
	isTypedArray: () => isTypedArray_default,
	isUndefined: () => isUndefined,
	isWeakMap: () => isWeakMap_default,
	isWeakSet: () => isWeakSet_default,
	iteratee: () => iteratee,
	keys: () => keys,
	last: () => last,
	lastIndexOf: () => lastIndexOf_default,
	map: () => map,
	mapObject: () => mapObject,
	matcher: () => matcher,
	matches: () => matcher,
	max: () => max,
	memoize: () => memoize,
	methods: () => functions,
	min: () => min,
	mixin: () => mixin,
	negate: () => negate,
	noop: () => noop,
	now: () => now_default,
	object: () => object,
	omit: () => omit_default,
	once: () => once_default,
	pairs: () => pairs,
	partial: () => partial,
	partition: () => partition_default,
	pick: () => pick_default,
	pluck: () => pluck,
	property: () => property,
	propertyOf: () => propertyOf,
	random: () => random,
	range: () => range,
	reduce: () => reduce_default,
	reduceRight: () => reduceRight_default,
	reject: () => reject,
	rest: () => rest,
	restArguments: () => restArguments,
	result: () => result,
	sample: () => sample,
	select: () => filter,
	shuffle: () => shuffle,
	size: () => size,
	some: () => some,
	sortBy: () => sortBy,
	sortedIndex: () => sortedIndex,
	tail: () => rest,
	take: () => first,
	tap: () => tap,
	template: () => template,
	templateSettings: () => templateSettings_default,
	throttle: () => throttle,
	times: () => times,
	toArray: () => toArray,
	toPath: () => toPath$1,
	transpose: () => unzip,
	unescape: () => unescape_default,
	union: () => union_default,
	uniq: () => uniq,
	unique: () => uniq,
	uniqueId: () => uniqueId,
	unzip: () => unzip,
	values: () => values,
	where: () => where,
	without: () => without_default,
	wrap: () => wrap,
	zip: () => zip_default
});
var init_index_all = __esmMin((() => {
	init_index_default();
	init_modules();
}));
//#endregion
//#region node_modules/bluebird/js/release/es5.js
var require_es5 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isES5 = (function() {
		"use strict";
		return this === void 0;
	})();
	if (isES5) module.exports = {
		freeze: Object.freeze,
		defineProperty: Object.defineProperty,
		getDescriptor: Object.getOwnPropertyDescriptor,
		keys: Object.keys,
		names: Object.getOwnPropertyNames,
		getPrototypeOf: Object.getPrototypeOf,
		isArray: Array.isArray,
		isES5,
		propertyIsWritable: function(obj, prop) {
			var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
			return !!(!descriptor || descriptor.writable || descriptor.set);
		}
	};
	else {
		var has = {}.hasOwnProperty;
		var str = {}.toString;
		var proto = {}.constructor.prototype;
		var ObjectKeys = function(o) {
			var ret = [];
			for (var key in o) if (has.call(o, key)) ret.push(key);
			return ret;
		};
		var ObjectGetDescriptor = function(o, key) {
			return { value: o[key] };
		};
		var ObjectDefineProperty = function(o, key, desc) {
			o[key] = desc.value;
			return o;
		};
		var ObjectFreeze = function(obj) {
			return obj;
		};
		var ObjectGetPrototypeOf = function(obj) {
			try {
				return Object(obj).constructor.prototype;
			} catch (e) {
				return proto;
			}
		};
		var ArrayIsArray = function(obj) {
			try {
				return str.call(obj) === "[object Array]";
			} catch (e) {
				return false;
			}
		};
		module.exports = {
			isArray: ArrayIsArray,
			keys: ObjectKeys,
			names: ObjectKeys,
			defineProperty: ObjectDefineProperty,
			getDescriptor: ObjectGetDescriptor,
			freeze: ObjectFreeze,
			getPrototypeOf: ObjectGetPrototypeOf,
			isES5,
			propertyIsWritable: function() {
				return true;
			}
		};
	}
}));
//#endregion
//#region node_modules/bluebird/js/release/util.js
var require_util = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var es5 = require_es5();
	var canEvaluate = typeof navigator == "undefined";
	var errorObj = { e: {} };
	var tryCatchTarget;
	var globalObject = typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : exports !== void 0 ? exports : null;
	function tryCatcher() {
		try {
			var target = tryCatchTarget;
			tryCatchTarget = null;
			return target.apply(this, arguments);
		} catch (e) {
			errorObj.e = e;
			return errorObj;
		}
	}
	function tryCatch(fn) {
		tryCatchTarget = fn;
		return tryCatcher;
	}
	var inherits = function(Child, Parent) {
		var hasProp = {}.hasOwnProperty;
		function T() {
			this.constructor = Child;
			this.constructor$ = Parent;
			for (var propertyName in Parent.prototype) if (hasProp.call(Parent.prototype, propertyName) && propertyName.charAt(propertyName.length - 1) !== "$") this[propertyName + "$"] = Parent.prototype[propertyName];
		}
		T.prototype = Parent.prototype;
		Child.prototype = new T();
		return Child.prototype;
	};
	function isPrimitive(val) {
		return val == null || val === true || val === false || typeof val === "string" || typeof val === "number";
	}
	function isObject(value) {
		return typeof value === "function" || typeof value === "object" && value !== null;
	}
	function maybeWrapAsError(maybeError) {
		if (!isPrimitive(maybeError)) return maybeError;
		return new Error(safeToString(maybeError));
	}
	function withAppended(target, appendee) {
		var len = target.length;
		var ret = new Array(len + 1);
		var i;
		for (i = 0; i < len; ++i) ret[i] = target[i];
		ret[i] = appendee;
		return ret;
	}
	function getDataPropertyOrDefault(obj, key, defaultValue) {
		if (es5.isES5) {
			var desc = Object.getOwnPropertyDescriptor(obj, key);
			if (desc != null) return desc.get == null && desc.set == null ? desc.value : defaultValue;
		} else return {}.hasOwnProperty.call(obj, key) ? obj[key] : void 0;
	}
	function notEnumerableProp(obj, name, value) {
		if (isPrimitive(obj)) return obj;
		var descriptor = {
			value,
			configurable: true,
			enumerable: false,
			writable: true
		};
		es5.defineProperty(obj, name, descriptor);
		return obj;
	}
	function thrower(r) {
		throw r;
	}
	var inheritedDataKeys = (function() {
		var excludedPrototypes = [
			Array.prototype,
			Object.prototype,
			Function.prototype
		];
		var isExcludedProto = function(val) {
			for (var i = 0; i < excludedPrototypes.length; ++i) if (excludedPrototypes[i] === val) return true;
			return false;
		};
		if (es5.isES5) {
			var getKeys = Object.getOwnPropertyNames;
			return function(obj) {
				var ret = [];
				var visitedKeys = Object.create(null);
				while (obj != null && !isExcludedProto(obj)) {
					var keys;
					try {
						keys = getKeys(obj);
					} catch (e) {
						return ret;
					}
					for (var i = 0; i < keys.length; ++i) {
						var key = keys[i];
						if (visitedKeys[key]) continue;
						visitedKeys[key] = true;
						var desc = Object.getOwnPropertyDescriptor(obj, key);
						if (desc != null && desc.get == null && desc.set == null) ret.push(key);
					}
					obj = es5.getPrototypeOf(obj);
				}
				return ret;
			};
		} else {
			var hasProp = {}.hasOwnProperty;
			return function(obj) {
				if (isExcludedProto(obj)) return [];
				var ret = [];
				enumeration: for (var key in obj) if (hasProp.call(obj, key)) ret.push(key);
				else {
					for (var i = 0; i < excludedPrototypes.length; ++i) if (hasProp.call(excludedPrototypes[i], key)) continue enumeration;
					ret.push(key);
				}
				return ret;
			};
		}
	})();
	var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
	function isClass(fn) {
		try {
			if (typeof fn === "function") {
				var keys = es5.names(fn.prototype);
				var hasMethods = es5.isES5 && keys.length > 1;
				var hasMethodsOtherThanConstructor = keys.length > 0 && !(keys.length === 1 && keys[0] === "constructor");
				var hasThisAssignmentAndStaticMethods = thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;
				if (hasMethods || hasMethodsOtherThanConstructor || hasThisAssignmentAndStaticMethods) return true;
			}
			return false;
		} catch (e) {
			return false;
		}
	}
	function toFastProperties(obj) {
		function FakeConstructor() {}
		FakeConstructor.prototype = obj;
		var l = 8;
		while (l--) new FakeConstructor();
		return obj;
	}
	var rident = /^[a-z$_][a-z$_0-9]*$/i;
	function isIdentifier(str) {
		return rident.test(str);
	}
	function filledRange(count, prefix, suffix) {
		var ret = new Array(count);
		for (var i = 0; i < count; ++i) ret[i] = prefix + i + suffix;
		return ret;
	}
	function safeToString(obj) {
		try {
			return obj + "";
		} catch (e) {
			return "[no string representation]";
		}
	}
	function isError(obj) {
		return obj !== null && typeof obj === "object" && typeof obj.message === "string" && typeof obj.name === "string";
	}
	function markAsOriginatingFromRejection(e) {
		try {
			notEnumerableProp(e, "isOperational", true);
		} catch (ignore) {}
	}
	function originatesFromRejection(e) {
		if (e == null) return false;
		return e instanceof Error["__BluebirdErrorTypes__"].OperationalError || e["isOperational"] === true;
	}
	function canAttachTrace(obj) {
		return isError(obj) && es5.propertyIsWritable(obj, "stack");
	}
	var ensureErrorObject = (function() {
		if (!("stack" in /* @__PURE__ */ new Error())) return function(value) {
			if (canAttachTrace(value)) return value;
			try {
				throw new Error(safeToString(value));
			} catch (err) {
				return err;
			}
		};
		else return function(value) {
			if (canAttachTrace(value)) return value;
			return new Error(safeToString(value));
		};
	})();
	function classString(obj) {
		return {}.toString.call(obj);
	}
	function copyDescriptors(from, to, filter) {
		var keys = es5.names(from);
		for (var i = 0; i < keys.length; ++i) {
			var key = keys[i];
			if (filter(key)) try {
				es5.defineProperty(to, key, es5.getDescriptor(from, key));
			} catch (ignore) {}
		}
	}
	var asArray = function(v) {
		if (es5.isArray(v)) return v;
		return null;
	};
	if (typeof Symbol !== "undefined" && Symbol.iterator) {
		var ArrayFrom = typeof Array.from === "function" ? function(v) {
			return Array.from(v);
		} : function(v) {
			var ret = [];
			var it = v[Symbol.iterator]();
			var itResult;
			while (!(itResult = it.next()).done) ret.push(itResult.value);
			return ret;
		};
		asArray = function(v) {
			if (es5.isArray(v)) return v;
			else if (v != null && typeof v[Symbol.iterator] === "function") return ArrayFrom(v);
			return null;
		};
	}
	var isNode = typeof process !== "undefined" && classString(process).toLowerCase() === "[object process]";
	var hasEnvVariables = typeof process !== "undefined" && typeof process.env !== "undefined";
	function env(key) {
		return hasEnvVariables ? process.env[key] : void 0;
	}
	function getNativePromise() {
		if (typeof Promise === "function") try {
			var promise = new Promise(function() {});
			if ({}.toString.call(promise) === "[object Promise]") return Promise;
		} catch (e) {}
	}
	function domainBind(self, cb) {
		return self.bind(cb);
	}
	var ret = {
		isClass,
		isIdentifier,
		inheritedDataKeys,
		getDataPropertyOrDefault,
		thrower,
		isArray: es5.isArray,
		asArray,
		notEnumerableProp,
		isPrimitive,
		isObject,
		isError,
		canEvaluate,
		errorObj,
		tryCatch,
		inherits,
		withAppended,
		maybeWrapAsError,
		toFastProperties,
		filledRange,
		toString: safeToString,
		canAttachTrace,
		ensureErrorObject,
		originatesFromRejection,
		markAsOriginatingFromRejection,
		classString,
		copyDescriptors,
		hasDevTools: typeof chrome !== "undefined" && chrome && typeof chrome.loadTimes === "function",
		isNode,
		hasEnvVariables,
		env,
		global: globalObject,
		getNativePromise,
		domainBind
	};
	ret.isRecentNode = ret.isNode && (function() {
		var version = process.versions.node.split(".").map(Number);
		return version[0] === 0 && version[1] > 10 || version[0] > 0;
	})();
	if (ret.isNode) ret.toFastProperties(process);
	try {
		throw new Error();
	} catch (e) {
		ret.lastLineError = e;
	}
	module.exports = ret;
}));
//#endregion
//#region node_modules/bluebird/js/release/schedule.js
var require_schedule = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util = require_util();
	var schedule;
	var noAsyncScheduler = function() {
		throw new Error("No async scheduler available\n\n    See http://goo.gl/MqrFmX\n");
	};
	var NativePromise = util.getNativePromise();
	if (util.isNode && typeof MutationObserver === "undefined") {
		var GlobalSetImmediate = global.setImmediate;
		var ProcessNextTick = process.nextTick;
		schedule = util.isRecentNode ? function(fn) {
			GlobalSetImmediate.call(global, fn);
		} : function(fn) {
			ProcessNextTick.call(process, fn);
		};
	} else if (typeof NativePromise === "function" && typeof NativePromise.resolve === "function") {
		var nativePromise = NativePromise.resolve();
		schedule = function(fn) {
			nativePromise.then(fn);
		};
	} else if (typeof MutationObserver !== "undefined" && !(typeof window !== "undefined" && window.navigator && (window.navigator.standalone || window.cordova))) schedule = (function() {
		var div = document.createElement("div");
		var opts = { attributes: true };
		var toggleScheduled = false;
		var div2 = document.createElement("div");
		new MutationObserver(function() {
			div.classList.toggle("foo");
			toggleScheduled = false;
		}).observe(div2, opts);
		var scheduleToggle = function() {
			if (toggleScheduled) return;
			toggleScheduled = true;
			div2.classList.toggle("foo");
		};
		return function schedule(fn) {
			var o = new MutationObserver(function() {
				o.disconnect();
				fn();
			});
			o.observe(div, opts);
			scheduleToggle();
		};
	})();
	else if (typeof setImmediate !== "undefined") schedule = function(fn) {
		setImmediate(fn);
	};
	else if (typeof setTimeout !== "undefined") schedule = function(fn) {
		setTimeout(fn, 0);
	};
	else schedule = noAsyncScheduler;
	module.exports = schedule;
}));
//#endregion
//#region node_modules/bluebird/js/release/queue.js
var require_queue = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function arrayMove(src, srcIndex, dst, dstIndex, len) {
		for (var j = 0; j < len; ++j) {
			dst[j + dstIndex] = src[j + srcIndex];
			src[j + srcIndex] = void 0;
		}
	}
	function Queue(capacity) {
		this._capacity = capacity;
		this._length = 0;
		this._front = 0;
	}
	Queue.prototype._willBeOverCapacity = function(size) {
		return this._capacity < size;
	};
	Queue.prototype._pushOne = function(arg) {
		var length = this.length();
		this._checkCapacity(length + 1);
		var i = this._front + length & this._capacity - 1;
		this[i] = arg;
		this._length = length + 1;
	};
	Queue.prototype.push = function(fn, receiver, arg) {
		var length = this.length() + 3;
		if (this._willBeOverCapacity(length)) {
			this._pushOne(fn);
			this._pushOne(receiver);
			this._pushOne(arg);
			return;
		}
		var j = this._front + length - 3;
		this._checkCapacity(length);
		var wrapMask = this._capacity - 1;
		this[j + 0 & wrapMask] = fn;
		this[j + 1 & wrapMask] = receiver;
		this[j + 2 & wrapMask] = arg;
		this._length = length;
	};
	Queue.prototype.shift = function() {
		var front = this._front, ret = this[front];
		this[front] = void 0;
		this._front = front + 1 & this._capacity - 1;
		this._length--;
		return ret;
	};
	Queue.prototype.length = function() {
		return this._length;
	};
	Queue.prototype._checkCapacity = function(size) {
		if (this._capacity < size) this._resizeTo(this._capacity << 1);
	};
	Queue.prototype._resizeTo = function(capacity) {
		var oldCapacity = this._capacity;
		this._capacity = capacity;
		var moveItemsCount = this._front + this._length & oldCapacity - 1;
		arrayMove(this, 0, this, oldCapacity, moveItemsCount);
	};
	module.exports = Queue;
}));
//#endregion
//#region node_modules/bluebird/js/release/async.js
var require_async = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var firstLineError;
	try {
		throw new Error();
	} catch (e) {
		firstLineError = e;
	}
	var schedule = require_schedule();
	var Queue = require_queue();
	var util = require_util();
	function Async() {
		this._customScheduler = false;
		this._isTickUsed = false;
		this._lateQueue = new Queue(16);
		this._normalQueue = new Queue(16);
		this._haveDrainedQueues = false;
		this._trampolineEnabled = true;
		var self = this;
		this.drainQueues = function() {
			self._drainQueues();
		};
		this._schedule = schedule;
	}
	Async.prototype.setScheduler = function(fn) {
		var prev = this._schedule;
		this._schedule = fn;
		this._customScheduler = true;
		return prev;
	};
	Async.prototype.hasCustomScheduler = function() {
		return this._customScheduler;
	};
	Async.prototype.enableTrampoline = function() {
		this._trampolineEnabled = true;
	};
	Async.prototype.disableTrampolineIfNecessary = function() {
		if (util.hasDevTools) this._trampolineEnabled = false;
	};
	Async.prototype.haveItemsQueued = function() {
		return this._isTickUsed || this._haveDrainedQueues;
	};
	Async.prototype.fatalError = function(e, isNode) {
		if (isNode) {
			process.stderr.write("Fatal " + (e instanceof Error ? e.stack : e) + "\n");
			process.exit(2);
		} else this.throwLater(e);
	};
	Async.prototype.throwLater = function(fn, arg) {
		if (arguments.length === 1) {
			arg = fn;
			fn = function() {
				throw arg;
			};
		}
		if (typeof setTimeout !== "undefined") setTimeout(function() {
			fn(arg);
		}, 0);
		else try {
			this._schedule(function() {
				fn(arg);
			});
		} catch (e) {
			throw new Error("No async scheduler available\n\n    See http://goo.gl/MqrFmX\n");
		}
	};
	function AsyncInvokeLater(fn, receiver, arg) {
		this._lateQueue.push(fn, receiver, arg);
		this._queueTick();
	}
	function AsyncInvoke(fn, receiver, arg) {
		this._normalQueue.push(fn, receiver, arg);
		this._queueTick();
	}
	function AsyncSettlePromises(promise) {
		this._normalQueue._pushOne(promise);
		this._queueTick();
	}
	if (!util.hasDevTools) {
		Async.prototype.invokeLater = AsyncInvokeLater;
		Async.prototype.invoke = AsyncInvoke;
		Async.prototype.settlePromises = AsyncSettlePromises;
	} else {
		Async.prototype.invokeLater = function(fn, receiver, arg) {
			if (this._trampolineEnabled) AsyncInvokeLater.call(this, fn, receiver, arg);
			else this._schedule(function() {
				setTimeout(function() {
					fn.call(receiver, arg);
				}, 100);
			});
		};
		Async.prototype.invoke = function(fn, receiver, arg) {
			if (this._trampolineEnabled) AsyncInvoke.call(this, fn, receiver, arg);
			else this._schedule(function() {
				fn.call(receiver, arg);
			});
		};
		Async.prototype.settlePromises = function(promise) {
			if (this._trampolineEnabled) AsyncSettlePromises.call(this, promise);
			else this._schedule(function() {
				promise._settlePromises();
			});
		};
	}
	Async.prototype._drainQueue = function(queue) {
		while (queue.length() > 0) {
			var fn = queue.shift();
			if (typeof fn !== "function") {
				fn._settlePromises();
				continue;
			}
			var receiver = queue.shift();
			var arg = queue.shift();
			fn.call(receiver, arg);
		}
	};
	Async.prototype._drainQueues = function() {
		this._drainQueue(this._normalQueue);
		this._reset();
		this._haveDrainedQueues = true;
		this._drainQueue(this._lateQueue);
	};
	Async.prototype._queueTick = function() {
		if (!this._isTickUsed) {
			this._isTickUsed = true;
			this._schedule(this.drainQueues);
		}
	};
	Async.prototype._reset = function() {
		this._isTickUsed = false;
	};
	module.exports = Async;
	module.exports.firstLineError = firstLineError;
}));
//#endregion
//#region node_modules/bluebird/js/release/errors.js
var require_errors$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var es5 = require_es5();
	var Objectfreeze = es5.freeze;
	var util = require_util();
	var inherits = util.inherits;
	var notEnumerableProp = util.notEnumerableProp;
	function subError(nameProperty, defaultMessage) {
		function SubError(message) {
			if (!(this instanceof SubError)) return new SubError(message);
			notEnumerableProp(this, "message", typeof message === "string" ? message : defaultMessage);
			notEnumerableProp(this, "name", nameProperty);
			if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
			else Error.call(this);
		}
		inherits(SubError, Error);
		return SubError;
	}
	var _TypeError;
	var _RangeError;
	var Warning = subError("Warning", "warning");
	var CancellationError = subError("CancellationError", "cancellation error");
	var TimeoutError = subError("TimeoutError", "timeout error");
	var AggregateError = subError("AggregateError", "aggregate error");
	try {
		_TypeError = TypeError;
		_RangeError = RangeError;
	} catch (e) {
		_TypeError = subError("TypeError", "type error");
		_RangeError = subError("RangeError", "range error");
	}
	var methods = "join pop push shift unshift slice filter forEach some every map indexOf lastIndexOf reduce reduceRight sort reverse".split(" ");
	for (var i = 0; i < methods.length; ++i) if (typeof Array.prototype[methods[i]] === "function") AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
	es5.defineProperty(AggregateError.prototype, "length", {
		value: 0,
		configurable: false,
		writable: true,
		enumerable: true
	});
	AggregateError.prototype["isOperational"] = true;
	var level = 0;
	AggregateError.prototype.toString = function() {
		var indent = Array(level * 4 + 1).join(" ");
		var ret = "\n" + indent + "AggregateError of:\n";
		level++;
		indent = Array(level * 4 + 1).join(" ");
		for (var i = 0; i < this.length; ++i) {
			var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
			var lines = str.split("\n");
			for (var j = 0; j < lines.length; ++j) lines[j] = indent + lines[j];
			str = lines.join("\n");
			ret += str + "\n";
		}
		level--;
		return ret;
	};
	function OperationalError(message) {
		if (!(this instanceof OperationalError)) return new OperationalError(message);
		notEnumerableProp(this, "name", "OperationalError");
		notEnumerableProp(this, "message", message);
		this.cause = message;
		this["isOperational"] = true;
		if (message instanceof Error) {
			notEnumerableProp(this, "message", message.message);
			notEnumerableProp(this, "stack", message.stack);
		} else if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
	}
	inherits(OperationalError, Error);
	var errorTypes = Error["__BluebirdErrorTypes__"];
	if (!errorTypes) {
		errorTypes = Objectfreeze({
			CancellationError,
			TimeoutError,
			OperationalError,
			RejectionError: OperationalError,
			AggregateError
		});
		es5.defineProperty(Error, "__BluebirdErrorTypes__", {
			value: errorTypes,
			writable: false,
			enumerable: false,
			configurable: false
		});
	}
	module.exports = {
		Error,
		TypeError: _TypeError,
		RangeError: _RangeError,
		CancellationError: errorTypes.CancellationError,
		OperationalError: errorTypes.OperationalError,
		TimeoutError: errorTypes.TimeoutError,
		AggregateError: errorTypes.AggregateError,
		Warning
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/thenables.js
var require_thenables = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, INTERNAL) {
		var util = require_util();
		var errorObj = util.errorObj;
		var isObject = util.isObject;
		function tryConvertToPromise(obj, context) {
			if (isObject(obj)) {
				if (obj instanceof Promise) return obj;
				var then = getThen(obj);
				if (then === errorObj) {
					if (context) context._pushContext();
					var ret = Promise.reject(then.e);
					if (context) context._popContext();
					return ret;
				} else if (typeof then === "function") {
					if (isAnyBluebirdPromise(obj)) {
						var ret = new Promise(INTERNAL);
						obj._then(ret._fulfill, ret._reject, void 0, ret, null);
						return ret;
					}
					return doThenable(obj, then, context);
				}
			}
			return obj;
		}
		function doGetThen(obj) {
			return obj.then;
		}
		function getThen(obj) {
			try {
				return doGetThen(obj);
			} catch (e) {
				errorObj.e = e;
				return errorObj;
			}
		}
		var hasProp = {}.hasOwnProperty;
		function isAnyBluebirdPromise(obj) {
			try {
				return hasProp.call(obj, "_promise0");
			} catch (e) {
				return false;
			}
		}
		function doThenable(x, then, context) {
			var promise = new Promise(INTERNAL);
			var ret = promise;
			if (context) context._pushContext();
			promise._captureStackTrace();
			if (context) context._popContext();
			var synchronous = true;
			var result = util.tryCatch(then).call(x, resolve, reject);
			synchronous = false;
			if (promise && result === errorObj) {
				promise._rejectCallback(result.e, true, true);
				promise = null;
			}
			function resolve(value) {
				if (!promise) return;
				promise._resolveCallback(value);
				promise = null;
			}
			function reject(reason) {
				if (!promise) return;
				promise._rejectCallback(reason, synchronous, true);
				promise = null;
			}
			return ret;
		}
		return tryConvertToPromise;
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/promise_array.js
var require_promise_array = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, INTERNAL, tryConvertToPromise, apiRejection, Proxyable) {
		var util = require_util();
		util.isArray;
		function toResolutionValue(val) {
			switch (val) {
				case -2: return [];
				case -3: return {};
			}
		}
		function PromiseArray(values) {
			var promise = this._promise = new Promise(INTERNAL);
			if (values instanceof Promise) promise._propagateFrom(values, 3);
			promise._setOnCancel(this);
			this._values = values;
			this._length = 0;
			this._totalResolved = 0;
			this._init(void 0, -2);
		}
		util.inherits(PromiseArray, Proxyable);
		PromiseArray.prototype.length = function() {
			return this._length;
		};
		PromiseArray.prototype.promise = function() {
			return this._promise;
		};
		PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
			var values = tryConvertToPromise(this._values, this._promise);
			if (values instanceof Promise) {
				values = values._target();
				var bitField = values._bitField;
				this._values = values;
				if ((bitField & 50397184) === 0) {
					this._promise._setAsyncGuaranteed();
					return values._then(init, this._reject, void 0, this, resolveValueIfEmpty);
				} else if ((bitField & 33554432) !== 0) values = values._value();
				else if ((bitField & 16777216) !== 0) return this._reject(values._reason());
				else return this._cancel();
			}
			values = util.asArray(values);
			if (values === null) {
				var err = apiRejection("expecting an array or an iterable object but got " + util.classString(values)).reason();
				this._promise._rejectCallback(err, false);
				return;
			}
			if (values.length === 0) {
				if (resolveValueIfEmpty === -5) this._resolveEmptyArray();
				else this._resolve(toResolutionValue(resolveValueIfEmpty));
				return;
			}
			this._iterate(values);
		};
		PromiseArray.prototype._iterate = function(values) {
			var len = this.getActualLength(values.length);
			this._length = len;
			this._values = this.shouldCopyValues() ? new Array(len) : this._values;
			var result = this._promise;
			var isResolved = false;
			var bitField = null;
			for (var i = 0; i < len; ++i) {
				var maybePromise = tryConvertToPromise(values[i], result);
				if (maybePromise instanceof Promise) {
					maybePromise = maybePromise._target();
					bitField = maybePromise._bitField;
				} else bitField = null;
				if (isResolved) {
					if (bitField !== null) maybePromise.suppressUnhandledRejections();
				} else if (bitField !== null) if ((bitField & 50397184) === 0) {
					maybePromise._proxy(this, i);
					this._values[i] = maybePromise;
				} else if ((bitField & 33554432) !== 0) isResolved = this._promiseFulfilled(maybePromise._value(), i);
				else if ((bitField & 16777216) !== 0) isResolved = this._promiseRejected(maybePromise._reason(), i);
				else isResolved = this._promiseCancelled(i);
				else isResolved = this._promiseFulfilled(maybePromise, i);
			}
			if (!isResolved) result._setAsyncGuaranteed();
		};
		PromiseArray.prototype._isResolved = function() {
			return this._values === null;
		};
		PromiseArray.prototype._resolve = function(value) {
			this._values = null;
			this._promise._fulfill(value);
		};
		PromiseArray.prototype._cancel = function() {
			if (this._isResolved() || !this._promise._isCancellable()) return;
			this._values = null;
			this._promise._cancel();
		};
		PromiseArray.prototype._reject = function(reason) {
			this._values = null;
			this._promise._rejectCallback(reason, false);
		};
		PromiseArray.prototype._promiseFulfilled = function(value, index) {
			this._values[index] = value;
			if (++this._totalResolved >= this._length) {
				this._resolve(this._values);
				return true;
			}
			return false;
		};
		PromiseArray.prototype._promiseCancelled = function() {
			this._cancel();
			return true;
		};
		PromiseArray.prototype._promiseRejected = function(reason) {
			this._totalResolved++;
			this._reject(reason);
			return true;
		};
		PromiseArray.prototype._resultCancelled = function() {
			if (this._isResolved()) return;
			var values = this._values;
			this._cancel();
			if (values instanceof Promise) values.cancel();
			else for (var i = 0; i < values.length; ++i) if (values[i] instanceof Promise) values[i].cancel();
		};
		PromiseArray.prototype.shouldCopyValues = function() {
			return true;
		};
		PromiseArray.prototype.getActualLength = function(len) {
			return len;
		};
		return PromiseArray;
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/context.js
var require_context = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise) {
		var longStackTraces = false;
		var contextStack = [];
		Promise.prototype._promiseCreated = function() {};
		Promise.prototype._pushContext = function() {};
		Promise.prototype._popContext = function() {
			return null;
		};
		Promise._peekContext = Promise.prototype._peekContext = function() {};
		function Context() {
			this._trace = new Context.CapturedTrace(peekContext());
		}
		Context.prototype._pushContext = function() {
			if (this._trace !== void 0) {
				this._trace._promiseCreated = null;
				contextStack.push(this._trace);
			}
		};
		Context.prototype._popContext = function() {
			if (this._trace !== void 0) {
				var trace = contextStack.pop();
				var ret = trace._promiseCreated;
				trace._promiseCreated = null;
				return ret;
			}
			return null;
		};
		function createContext() {
			if (longStackTraces) return new Context();
		}
		function peekContext() {
			var lastIndex = contextStack.length - 1;
			if (lastIndex >= 0) return contextStack[lastIndex];
		}
		Context.CapturedTrace = null;
		Context.create = createContext;
		Context.deactivateLongStackTraces = function() {};
		Context.activateLongStackTraces = function() {
			var Promise_pushContext = Promise.prototype._pushContext;
			var Promise_popContext = Promise.prototype._popContext;
			var Promise_PeekContext = Promise._peekContext;
			var Promise_peekContext = Promise.prototype._peekContext;
			var Promise_promiseCreated = Promise.prototype._promiseCreated;
			Context.deactivateLongStackTraces = function() {
				Promise.prototype._pushContext = Promise_pushContext;
				Promise.prototype._popContext = Promise_popContext;
				Promise._peekContext = Promise_PeekContext;
				Promise.prototype._peekContext = Promise_peekContext;
				Promise.prototype._promiseCreated = Promise_promiseCreated;
				longStackTraces = false;
			};
			longStackTraces = true;
			Promise.prototype._pushContext = Context.prototype._pushContext;
			Promise.prototype._popContext = Context.prototype._popContext;
			Promise._peekContext = Promise.prototype._peekContext = peekContext;
			Promise.prototype._promiseCreated = function() {
				var ctx = this._peekContext();
				if (ctx && ctx._promiseCreated == null) ctx._promiseCreated = this;
			};
		};
		return Context;
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/debuggability.js
var require_debuggability = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, Context) {
		var getDomain = Promise._getDomain;
		var async = Promise._async;
		var Warning = require_errors$1().Warning;
		var util = require_util();
		var canAttachTrace = util.canAttachTrace;
		var unhandledRejectionHandled;
		var possiblyUnhandledRejection;
		var bluebirdFramePattern = /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/;
		var nodeFramePattern = /\((?:timers\.js):\d+:\d+\)/;
		var parseLinePattern = /[\/<\(](.+?):(\d+):(\d+)\)?\s*$/;
		var stackFramePattern = null;
		var formatStack = null;
		var indentStackFrames = false;
		var printWarning;
		var debugging = !!(util.env("BLUEBIRD_DEBUG") != 0 && (util.env("BLUEBIRD_DEBUG") || util.env("NODE_ENV") === "development"));
		var warnings = !!(util.env("BLUEBIRD_WARNINGS") != 0 && (debugging || util.env("BLUEBIRD_WARNINGS")));
		var longStackTraces = !!(util.env("BLUEBIRD_LONG_STACK_TRACES") != 0 && (debugging || util.env("BLUEBIRD_LONG_STACK_TRACES")));
		var wForgottenReturn = util.env("BLUEBIRD_W_FORGOTTEN_RETURN") != 0 && (warnings || !!util.env("BLUEBIRD_W_FORGOTTEN_RETURN"));
		Promise.prototype.suppressUnhandledRejections = function() {
			var target = this._target();
			target._bitField = target._bitField & -1048577 | 524288;
		};
		Promise.prototype._ensurePossibleRejectionHandled = function() {
			if ((this._bitField & 524288) !== 0) return;
			this._setRejectionIsUnhandled();
			async.invokeLater(this._notifyUnhandledRejection, this, void 0);
		};
		Promise.prototype._notifyUnhandledRejectionIsHandled = function() {
			fireRejectionEvent("rejectionHandled", unhandledRejectionHandled, void 0, this);
		};
		Promise.prototype._setReturnedNonUndefined = function() {
			this._bitField = this._bitField | 268435456;
		};
		Promise.prototype._returnedNonUndefined = function() {
			return (this._bitField & 268435456) !== 0;
		};
		Promise.prototype._notifyUnhandledRejection = function() {
			if (this._isRejectionUnhandled()) {
				var reason = this._settledValue();
				this._setUnhandledRejectionIsNotified();
				fireRejectionEvent("unhandledRejection", possiblyUnhandledRejection, reason, this);
			}
		};
		Promise.prototype._setUnhandledRejectionIsNotified = function() {
			this._bitField = this._bitField | 262144;
		};
		Promise.prototype._unsetUnhandledRejectionIsNotified = function() {
			this._bitField = this._bitField & -262145;
		};
		Promise.prototype._isUnhandledRejectionNotified = function() {
			return (this._bitField & 262144) > 0;
		};
		Promise.prototype._setRejectionIsUnhandled = function() {
			this._bitField = this._bitField | 1048576;
		};
		Promise.prototype._unsetRejectionIsUnhandled = function() {
			this._bitField = this._bitField & -1048577;
			if (this._isUnhandledRejectionNotified()) {
				this._unsetUnhandledRejectionIsNotified();
				this._notifyUnhandledRejectionIsHandled();
			}
		};
		Promise.prototype._isRejectionUnhandled = function() {
			return (this._bitField & 1048576) > 0;
		};
		Promise.prototype._warn = function(message, shouldUseOwnTrace, promise) {
			return warn(message, shouldUseOwnTrace, promise || this);
		};
		Promise.onPossiblyUnhandledRejection = function(fn) {
			var domain = getDomain();
			possiblyUnhandledRejection = typeof fn === "function" ? domain === null ? fn : util.domainBind(domain, fn) : void 0;
		};
		Promise.onUnhandledRejectionHandled = function(fn) {
			var domain = getDomain();
			unhandledRejectionHandled = typeof fn === "function" ? domain === null ? fn : util.domainBind(domain, fn) : void 0;
		};
		var disableLongStackTraces = function() {};
		Promise.longStackTraces = function() {
			if (async.haveItemsQueued() && !config.longStackTraces) throw new Error("cannot enable long stack traces after promises have been created\n\n    See http://goo.gl/MqrFmX\n");
			if (!config.longStackTraces && longStackTracesIsSupported()) {
				var Promise_captureStackTrace = Promise.prototype._captureStackTrace;
				var Promise_attachExtraTrace = Promise.prototype._attachExtraTrace;
				config.longStackTraces = true;
				disableLongStackTraces = function() {
					if (async.haveItemsQueued() && !config.longStackTraces) throw new Error("cannot enable long stack traces after promises have been created\n\n    See http://goo.gl/MqrFmX\n");
					Promise.prototype._captureStackTrace = Promise_captureStackTrace;
					Promise.prototype._attachExtraTrace = Promise_attachExtraTrace;
					Context.deactivateLongStackTraces();
					async.enableTrampoline();
					config.longStackTraces = false;
				};
				Promise.prototype._captureStackTrace = longStackTracesCaptureStackTrace;
				Promise.prototype._attachExtraTrace = longStackTracesAttachExtraTrace;
				Context.activateLongStackTraces();
				async.disableTrampolineIfNecessary();
			}
		};
		Promise.hasLongStackTraces = function() {
			return config.longStackTraces && longStackTracesIsSupported();
		};
		var fireDomEvent = (function() {
			try {
				if (typeof CustomEvent === "function") {
					var event = new CustomEvent("CustomEvent");
					util.global.dispatchEvent(event);
					return function(name, event) {
						var domEvent = new CustomEvent(name.toLowerCase(), {
							detail: event,
							cancelable: true
						});
						return !util.global.dispatchEvent(domEvent);
					};
				} else if (typeof Event === "function") {
					var event = new Event("CustomEvent");
					util.global.dispatchEvent(event);
					return function(name, event) {
						var domEvent = new Event(name.toLowerCase(), { cancelable: true });
						domEvent.detail = event;
						return !util.global.dispatchEvent(domEvent);
					};
				} else {
					var event = document.createEvent("CustomEvent");
					event.initCustomEvent("testingtheevent", false, true, {});
					util.global.dispatchEvent(event);
					return function(name, event) {
						var domEvent = document.createEvent("CustomEvent");
						domEvent.initCustomEvent(name.toLowerCase(), false, true, event);
						return !util.global.dispatchEvent(domEvent);
					};
				}
			} catch (e) {}
			return function() {
				return false;
			};
		})();
		var fireGlobalEvent = (function() {
			if (util.isNode) return function() {
				return process.emit.apply(process, arguments);
			};
			else {
				if (!util.global) return function() {
					return false;
				};
				return function(name) {
					var methodName = "on" + name.toLowerCase();
					var method = util.global[methodName];
					if (!method) return false;
					method.apply(util.global, [].slice.call(arguments, 1));
					return true;
				};
			}
		})();
		function generatePromiseLifecycleEventObject(name, promise) {
			return { promise };
		}
		var eventToObjectGenerator = {
			promiseCreated: generatePromiseLifecycleEventObject,
			promiseFulfilled: generatePromiseLifecycleEventObject,
			promiseRejected: generatePromiseLifecycleEventObject,
			promiseResolved: generatePromiseLifecycleEventObject,
			promiseCancelled: generatePromiseLifecycleEventObject,
			promiseChained: function(name, promise, child) {
				return {
					promise,
					child
				};
			},
			warning: function(name, warning) {
				return { warning };
			},
			unhandledRejection: function(name, reason, promise) {
				return {
					reason,
					promise
				};
			},
			rejectionHandled: generatePromiseLifecycleEventObject
		};
		var activeFireEvent = function(name) {
			var globalEventFired = false;
			try {
				globalEventFired = fireGlobalEvent.apply(null, arguments);
			} catch (e) {
				async.throwLater(e);
				globalEventFired = true;
			}
			var domEventFired = false;
			try {
				domEventFired = fireDomEvent(name, eventToObjectGenerator[name].apply(null, arguments));
			} catch (e) {
				async.throwLater(e);
				domEventFired = true;
			}
			return domEventFired || globalEventFired;
		};
		Promise.config = function(opts) {
			opts = Object(opts);
			if ("longStackTraces" in opts) {
				if (opts.longStackTraces) Promise.longStackTraces();
				else if (!opts.longStackTraces && Promise.hasLongStackTraces()) disableLongStackTraces();
			}
			if ("warnings" in opts) {
				var warningsOption = opts.warnings;
				config.warnings = !!warningsOption;
				wForgottenReturn = config.warnings;
				if (util.isObject(warningsOption)) {
					if ("wForgottenReturn" in warningsOption) wForgottenReturn = !!warningsOption.wForgottenReturn;
				}
			}
			if ("cancellation" in opts && opts.cancellation && !config.cancellation) {
				if (async.haveItemsQueued()) throw new Error("cannot enable cancellation after promises are in use");
				Promise.prototype._clearCancellationData = cancellationClearCancellationData;
				Promise.prototype._propagateFrom = cancellationPropagateFrom;
				Promise.prototype._onCancel = cancellationOnCancel;
				Promise.prototype._setOnCancel = cancellationSetOnCancel;
				Promise.prototype._attachCancellationCallback = cancellationAttachCancellationCallback;
				Promise.prototype._execute = cancellationExecute;
				propagateFromFunction = cancellationPropagateFrom;
				config.cancellation = true;
			}
			if ("monitoring" in opts) {
				if (opts.monitoring && !config.monitoring) {
					config.monitoring = true;
					Promise.prototype._fireEvent = activeFireEvent;
				} else if (!opts.monitoring && config.monitoring) {
					config.monitoring = false;
					Promise.prototype._fireEvent = defaultFireEvent;
				}
			}
			return Promise;
		};
		function defaultFireEvent() {
			return false;
		}
		Promise.prototype._fireEvent = defaultFireEvent;
		Promise.prototype._execute = function(executor, resolve, reject) {
			try {
				executor(resolve, reject);
			} catch (e) {
				return e;
			}
		};
		Promise.prototype._onCancel = function() {};
		Promise.prototype._setOnCancel = function(handler) {};
		Promise.prototype._attachCancellationCallback = function(onCancel) {};
		Promise.prototype._captureStackTrace = function() {};
		Promise.prototype._attachExtraTrace = function() {};
		Promise.prototype._clearCancellationData = function() {};
		Promise.prototype._propagateFrom = function(parent, flags) {};
		function cancellationExecute(executor, resolve, reject) {
			var promise = this;
			try {
				executor(resolve, reject, function(onCancel) {
					if (typeof onCancel !== "function") throw new TypeError("onCancel must be a function, got: " + util.toString(onCancel));
					promise._attachCancellationCallback(onCancel);
				});
			} catch (e) {
				return e;
			}
		}
		function cancellationAttachCancellationCallback(onCancel) {
			if (!this._isCancellable()) return this;
			var previousOnCancel = this._onCancel();
			if (previousOnCancel !== void 0) if (util.isArray(previousOnCancel)) previousOnCancel.push(onCancel);
			else this._setOnCancel([previousOnCancel, onCancel]);
			else this._setOnCancel(onCancel);
		}
		function cancellationOnCancel() {
			return this._onCancelField;
		}
		function cancellationSetOnCancel(onCancel) {
			this._onCancelField = onCancel;
		}
		function cancellationClearCancellationData() {
			this._cancellationParent = void 0;
			this._onCancelField = void 0;
		}
		function cancellationPropagateFrom(parent, flags) {
			if ((flags & 1) !== 0) {
				this._cancellationParent = parent;
				var branchesRemainingToCancel = parent._branchesRemainingToCancel;
				if (branchesRemainingToCancel === void 0) branchesRemainingToCancel = 0;
				parent._branchesRemainingToCancel = branchesRemainingToCancel + 1;
			}
			if ((flags & 2) !== 0 && parent._isBound()) this._setBoundTo(parent._boundTo);
		}
		function bindingPropagateFrom(parent, flags) {
			if ((flags & 2) !== 0 && parent._isBound()) this._setBoundTo(parent._boundTo);
		}
		var propagateFromFunction = bindingPropagateFrom;
		function boundValueFunction() {
			var ret = this._boundTo;
			if (ret !== void 0) {
				if (ret instanceof Promise) if (ret.isFulfilled()) return ret.value();
				else return;
			}
			return ret;
		}
		function longStackTracesCaptureStackTrace() {
			this._trace = new CapturedTrace(this._peekContext());
		}
		function longStackTracesAttachExtraTrace(error, ignoreSelf) {
			if (canAttachTrace(error)) {
				var trace = this._trace;
				if (trace !== void 0) {
					if (ignoreSelf) trace = trace._parent;
				}
				if (trace !== void 0) trace.attachExtraTrace(error);
				else if (!error.__stackCleaned__) {
					var parsed = parseStackAndMessage(error);
					util.notEnumerableProp(error, "stack", parsed.message + "\n" + parsed.stack.join("\n"));
					util.notEnumerableProp(error, "__stackCleaned__", true);
				}
			}
		}
		function checkForgottenReturns(returnValue, promiseCreated, name, promise, parent) {
			if (returnValue === void 0 && promiseCreated !== null && wForgottenReturn) {
				if (parent !== void 0 && parent._returnedNonUndefined()) return;
				if ((promise._bitField & 65535) === 0) return;
				if (name) name = name + " ";
				var handlerLine = "";
				var creatorLine = "";
				if (promiseCreated._trace) {
					var traceLines = promiseCreated._trace.stack.split("\n");
					var stack = cleanStack(traceLines);
					for (var i = stack.length - 1; i >= 0; --i) {
						var line = stack[i];
						if (!nodeFramePattern.test(line)) {
							var lineMatches = line.match(parseLinePattern);
							if (lineMatches) handlerLine = "at " + lineMatches[1] + ":" + lineMatches[2] + ":" + lineMatches[3] + " ";
							break;
						}
					}
					if (stack.length > 0) {
						var firstUserLine = stack[0];
						for (var i = 0; i < traceLines.length; ++i) if (traceLines[i] === firstUserLine) {
							if (i > 0) creatorLine = "\n" + traceLines[i - 1];
							break;
						}
					}
				}
				var msg = "a promise was created in a " + name + "handler " + handlerLine + "but was not returned from it, see http://goo.gl/rRqMUw" + creatorLine;
				promise._warn(msg, true, promiseCreated);
			}
		}
		function deprecated(name, replacement) {
			var message = name + " is deprecated and will be removed in a future version.";
			if (replacement) message += " Use " + replacement + " instead.";
			return warn(message);
		}
		function warn(message, shouldUseOwnTrace, promise) {
			if (!config.warnings) return;
			var warning = new Warning(message);
			var ctx;
			if (shouldUseOwnTrace) promise._attachExtraTrace(warning);
			else if (config.longStackTraces && (ctx = Promise._peekContext())) ctx.attachExtraTrace(warning);
			else {
				var parsed = parseStackAndMessage(warning);
				warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
			}
			if (!activeFireEvent("warning", warning)) formatAndLogError(warning, "", true);
		}
		function reconstructStack(message, stacks) {
			for (var i = 0; i < stacks.length - 1; ++i) {
				stacks[i].push("From previous event:");
				stacks[i] = stacks[i].join("\n");
			}
			if (i < stacks.length) stacks[i] = stacks[i].join("\n");
			return message + "\n" + stacks.join("\n");
		}
		function removeDuplicateOrEmptyJumps(stacks) {
			for (var i = 0; i < stacks.length; ++i) if (stacks[i].length === 0 || i + 1 < stacks.length && stacks[i][0] === stacks[i + 1][0]) {
				stacks.splice(i, 1);
				i--;
			}
		}
		function removeCommonRoots(stacks) {
			var current = stacks[0];
			for (var i = 1; i < stacks.length; ++i) {
				var prev = stacks[i];
				var currentLastIndex = current.length - 1;
				var currentLastLine = current[currentLastIndex];
				var commonRootMeetPoint = -1;
				for (var j = prev.length - 1; j >= 0; --j) if (prev[j] === currentLastLine) {
					commonRootMeetPoint = j;
					break;
				}
				for (var j = commonRootMeetPoint; j >= 0; --j) {
					var line = prev[j];
					if (current[currentLastIndex] === line) {
						current.pop();
						currentLastIndex--;
					} else break;
				}
				current = prev;
			}
		}
		function cleanStack(stack) {
			var ret = [];
			for (var i = 0; i < stack.length; ++i) {
				var line = stack[i];
				var isTraceLine = "    (No stack trace)" === line || stackFramePattern.test(line);
				var isInternalFrame = isTraceLine && shouldIgnore(line);
				if (isTraceLine && !isInternalFrame) {
					if (indentStackFrames && line.charAt(0) !== " ") line = "    " + line;
					ret.push(line);
				}
			}
			return ret;
		}
		function stackFramesAsArray(error) {
			var stack = error.stack.replace(/\s+$/g, "").split("\n");
			for (var i = 0; i < stack.length; ++i) {
				var line = stack[i];
				if ("    (No stack trace)" === line || stackFramePattern.test(line)) break;
			}
			if (i > 0 && error.name != "SyntaxError") stack = stack.slice(i);
			return stack;
		}
		function parseStackAndMessage(error) {
			var stack = error.stack;
			var message = error.toString();
			stack = typeof stack === "string" && stack.length > 0 ? stackFramesAsArray(error) : ["    (No stack trace)"];
			return {
				message,
				stack: error.name == "SyntaxError" ? stack : cleanStack(stack)
			};
		}
		function formatAndLogError(error, title, isSoft) {
			if (typeof console !== "undefined") {
				var message;
				if (util.isObject(error)) {
					var stack = error.stack;
					message = title + formatStack(stack, error);
				} else message = title + String(error);
				if (typeof printWarning === "function") printWarning(message, isSoft);
				else if (typeof console.log === "function" || typeof console.log === "object") console.log(message);
			}
		}
		function fireRejectionEvent(name, localHandler, reason, promise) {
			var localEventFired = false;
			try {
				if (typeof localHandler === "function") {
					localEventFired = true;
					if (name === "rejectionHandled") localHandler(promise);
					else localHandler(reason, promise);
				}
			} catch (e) {
				async.throwLater(e);
			}
			if (name === "unhandledRejection") {
				if (!activeFireEvent(name, reason, promise) && !localEventFired) formatAndLogError(reason, "Unhandled rejection ");
			} else activeFireEvent(name, promise);
		}
		function formatNonError(obj) {
			var str;
			if (typeof obj === "function") str = "[function " + (obj.name || "anonymous") + "]";
			else {
				str = obj && typeof obj.toString === "function" ? obj.toString() : util.toString(obj);
				if (/\[object [a-zA-Z0-9$_]+\]/.test(str)) try {
					str = JSON.stringify(obj);
				} catch (e) {}
				if (str.length === 0) str = "(empty array)";
			}
			return "(<" + snip(str) + ">, no stack trace)";
		}
		function snip(str) {
			var maxChars = 41;
			if (str.length < maxChars) return str;
			return str.substr(0, maxChars - 3) + "...";
		}
		function longStackTracesIsSupported() {
			return typeof captureStackTrace === "function";
		}
		var shouldIgnore = function() {
			return false;
		};
		var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
		function parseLineInfo(line) {
			var matches = line.match(parseLineInfoRegex);
			if (matches) return {
				fileName: matches[1],
				line: parseInt(matches[2], 10)
			};
		}
		function setBounds(firstLineError, lastLineError) {
			if (!longStackTracesIsSupported()) return;
			var firstStackLines = firstLineError.stack.split("\n");
			var lastStackLines = lastLineError.stack.split("\n");
			var firstIndex = -1;
			var lastIndex = -1;
			var firstFileName;
			var lastFileName;
			for (var i = 0; i < firstStackLines.length; ++i) {
				var result = parseLineInfo(firstStackLines[i]);
				if (result) {
					firstFileName = result.fileName;
					firstIndex = result.line;
					break;
				}
			}
			for (var i = 0; i < lastStackLines.length; ++i) {
				var result = parseLineInfo(lastStackLines[i]);
				if (result) {
					lastFileName = result.fileName;
					lastIndex = result.line;
					break;
				}
			}
			if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName || firstFileName !== lastFileName || firstIndex >= lastIndex) return;
			shouldIgnore = function(line) {
				if (bluebirdFramePattern.test(line)) return true;
				var info = parseLineInfo(line);
				if (info) {
					if (info.fileName === firstFileName && firstIndex <= info.line && info.line <= lastIndex) return true;
				}
				return false;
			};
		}
		function CapturedTrace(parent) {
			this._parent = parent;
			this._promisesCreated = 0;
			var length = this._length = 1 + (parent === void 0 ? 0 : parent._length);
			captureStackTrace(this, CapturedTrace);
			if (length > 32) this.uncycle();
		}
		util.inherits(CapturedTrace, Error);
		Context.CapturedTrace = CapturedTrace;
		CapturedTrace.prototype.uncycle = function() {
			var length = this._length;
			if (length < 2) return;
			var nodes = [];
			var stackToIndex = {};
			for (var i = 0, node = this; node !== void 0; ++i) {
				nodes.push(node);
				node = node._parent;
			}
			length = this._length = i;
			for (var i = length - 1; i >= 0; --i) {
				var stack = nodes[i].stack;
				if (stackToIndex[stack] === void 0) stackToIndex[stack] = i;
			}
			for (var i = 0; i < length; ++i) {
				var index = stackToIndex[nodes[i].stack];
				if (index !== void 0 && index !== i) {
					if (index > 0) {
						nodes[index - 1]._parent = void 0;
						nodes[index - 1]._length = 1;
					}
					nodes[i]._parent = void 0;
					nodes[i]._length = 1;
					var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;
					if (index < length - 1) {
						cycleEdgeNode._parent = nodes[index + 1];
						cycleEdgeNode._parent.uncycle();
						cycleEdgeNode._length = cycleEdgeNode._parent._length + 1;
					} else {
						cycleEdgeNode._parent = void 0;
						cycleEdgeNode._length = 1;
					}
					var currentChildLength = cycleEdgeNode._length + 1;
					for (var j = i - 2; j >= 0; --j) {
						nodes[j]._length = currentChildLength;
						currentChildLength++;
					}
					return;
				}
			}
		};
		CapturedTrace.prototype.attachExtraTrace = function(error) {
			if (error.__stackCleaned__) return;
			this.uncycle();
			var parsed = parseStackAndMessage(error);
			var message = parsed.message;
			var stacks = [parsed.stack];
			var trace = this;
			while (trace !== void 0) {
				stacks.push(cleanStack(trace.stack.split("\n")));
				trace = trace._parent;
			}
			removeCommonRoots(stacks);
			removeDuplicateOrEmptyJumps(stacks);
			util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
			util.notEnumerableProp(error, "__stackCleaned__", true);
		};
		var captureStackTrace = (function stackDetection() {
			var v8stackFramePattern = /^\s*at\s*/;
			var v8stackFormatter = function(stack, error) {
				if (typeof stack === "string") return stack;
				if (error.name !== void 0 && error.message !== void 0) return error.toString();
				return formatNonError(error);
			};
			if (typeof Error.stackTraceLimit === "number" && typeof Error.captureStackTrace === "function") {
				Error.stackTraceLimit += 6;
				stackFramePattern = v8stackFramePattern;
				formatStack = v8stackFormatter;
				var captureStackTrace = Error.captureStackTrace;
				shouldIgnore = function(line) {
					return bluebirdFramePattern.test(line);
				};
				return function(receiver, ignoreUntil) {
					Error.stackTraceLimit += 6;
					captureStackTrace(receiver, ignoreUntil);
					Error.stackTraceLimit -= 6;
				};
			}
			var err = /* @__PURE__ */ new Error();
			if (typeof err.stack === "string" && err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
				stackFramePattern = /@/;
				formatStack = v8stackFormatter;
				indentStackFrames = true;
				return function captureStackTrace(o) {
					o.stack = (/* @__PURE__ */ new Error()).stack;
				};
			}
			var hasStackAfterThrow;
			try {
				throw new Error();
			} catch (e) {
				hasStackAfterThrow = "stack" in e;
			}
			if (!("stack" in err) && hasStackAfterThrow && typeof Error.stackTraceLimit === "number") {
				stackFramePattern = v8stackFramePattern;
				formatStack = v8stackFormatter;
				return function captureStackTrace(o) {
					Error.stackTraceLimit += 6;
					try {
						throw new Error();
					} catch (e) {
						o.stack = e.stack;
					}
					Error.stackTraceLimit -= 6;
				};
			}
			formatStack = function(stack, error) {
				if (typeof stack === "string") return stack;
				if ((typeof error === "object" || typeof error === "function") && error.name !== void 0 && error.message !== void 0) return error.toString();
				return formatNonError(error);
			};
			return null;
		})([]);
		if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
			printWarning = function(message) {
				console.warn(message);
			};
			if (util.isNode && process.stderr.isTTY) printWarning = function(message, isSoft) {
				console.warn((isSoft ? "\x1B[33m" : "\x1B[31m") + message + "\x1B[0m\n");
			};
			else if (!util.isNode && typeof (/* @__PURE__ */ new Error()).stack === "string") printWarning = function(message, isSoft) {
				console.warn("%c" + message, isSoft ? "color: darkorange" : "color: red");
			};
		}
		var config = {
			warnings,
			longStackTraces: false,
			cancellation: false,
			monitoring: false
		};
		if (longStackTraces) Promise.longStackTraces();
		return {
			longStackTraces: function() {
				return config.longStackTraces;
			},
			warnings: function() {
				return config.warnings;
			},
			cancellation: function() {
				return config.cancellation;
			},
			monitoring: function() {
				return config.monitoring;
			},
			propagateFromFunction: function() {
				return propagateFromFunction;
			},
			boundValueFunction: function() {
				return boundValueFunction;
			},
			checkForgottenReturns,
			setBounds,
			warn,
			deprecated,
			CapturedTrace,
			fireDomEvent,
			fireGlobalEvent
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/finally.js
var require_finally = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, tryConvertToPromise) {
		var util = require_util();
		var CancellationError = Promise.CancellationError;
		var errorObj = util.errorObj;
		function PassThroughHandlerContext(promise, type, handler) {
			this.promise = promise;
			this.type = type;
			this.handler = handler;
			this.called = false;
			this.cancelPromise = null;
		}
		PassThroughHandlerContext.prototype.isFinallyHandler = function() {
			return this.type === 0;
		};
		function FinallyHandlerCancelReaction(finallyHandler) {
			this.finallyHandler = finallyHandler;
		}
		FinallyHandlerCancelReaction.prototype._resultCancelled = function() {
			checkCancel(this.finallyHandler);
		};
		function checkCancel(ctx, reason) {
			if (ctx.cancelPromise != null) {
				if (arguments.length > 1) ctx.cancelPromise._reject(reason);
				else ctx.cancelPromise._cancel();
				ctx.cancelPromise = null;
				return true;
			}
			return false;
		}
		function succeed() {
			return finallyHandler.call(this, this.promise._target()._settledValue());
		}
		function fail(reason) {
			if (checkCancel(this, reason)) return;
			errorObj.e = reason;
			return errorObj;
		}
		function finallyHandler(reasonOrValue) {
			var promise = this.promise;
			var handler = this.handler;
			if (!this.called) {
				this.called = true;
				var ret = this.isFinallyHandler() ? handler.call(promise._boundValue()) : handler.call(promise._boundValue(), reasonOrValue);
				if (ret !== void 0) {
					promise._setReturnedNonUndefined();
					var maybePromise = tryConvertToPromise(ret, promise);
					if (maybePromise instanceof Promise) {
						if (this.cancelPromise != null) {
							if (maybePromise._isCancelled()) {
								var reason = new CancellationError("late cancellation observer");
								promise._attachExtraTrace(reason);
								errorObj.e = reason;
								return errorObj;
							} else if (maybePromise.isPending()) maybePromise._attachCancellationCallback(new FinallyHandlerCancelReaction(this));
						}
						return maybePromise._then(succeed, fail, void 0, this, void 0);
					}
				}
			}
			if (promise.isRejected()) {
				checkCancel(this);
				errorObj.e = reasonOrValue;
				return errorObj;
			} else {
				checkCancel(this);
				return reasonOrValue;
			}
		}
		Promise.prototype._passThrough = function(handler, type, success, fail) {
			if (typeof handler !== "function") return this.then();
			return this._then(success, fail, void 0, new PassThroughHandlerContext(this, type, handler), void 0);
		};
		Promise.prototype.lastly = Promise.prototype["finally"] = function(handler) {
			return this._passThrough(handler, 0, finallyHandler, finallyHandler);
		};
		Promise.prototype.tap = function(handler) {
			return this._passThrough(handler, 1, finallyHandler);
		};
		return PassThroughHandlerContext;
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/catch_filter.js
var require_catch_filter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(NEXT_FILTER) {
		var util = require_util();
		var getKeys = require_es5().keys;
		var tryCatch = util.tryCatch;
		var errorObj = util.errorObj;
		function catchFilter(instances, cb, promise) {
			return function(e) {
				var boundTo = promise._boundValue();
				predicateLoop: for (var i = 0; i < instances.length; ++i) {
					var item = instances[i];
					if (item === Error || item != null && item.prototype instanceof Error) {
						if (e instanceof item) return tryCatch(cb).call(boundTo, e);
					} else if (typeof item === "function") {
						var matchesPredicate = tryCatch(item).call(boundTo, e);
						if (matchesPredicate === errorObj) return matchesPredicate;
						else if (matchesPredicate) return tryCatch(cb).call(boundTo, e);
					} else if (util.isObject(e)) {
						var keys = getKeys(item);
						for (var j = 0; j < keys.length; ++j) {
							var key = keys[j];
							if (item[key] != e[key]) continue predicateLoop;
						}
						return tryCatch(cb).call(boundTo, e);
					}
				}
				return NEXT_FILTER;
			};
		}
		return catchFilter;
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/nodeback.js
var require_nodeback = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util = require_util();
	var maybeWrapAsError = util.maybeWrapAsError;
	var OperationalError = require_errors$1().OperationalError;
	var es5 = require_es5();
	function isUntypedError(obj) {
		return obj instanceof Error && es5.getPrototypeOf(obj) === Error.prototype;
	}
	var rErrorKey = /^(?:name|message|stack|cause)$/;
	function wrapAsOperationalError(obj) {
		var ret;
		if (isUntypedError(obj)) {
			ret = new OperationalError(obj);
			ret.name = obj.name;
			ret.message = obj.message;
			ret.stack = obj.stack;
			var keys = es5.keys(obj);
			for (var i = 0; i < keys.length; ++i) {
				var key = keys[i];
				if (!rErrorKey.test(key)) ret[key] = obj[key];
			}
			return ret;
		}
		util.markAsOriginatingFromRejection(obj);
		return obj;
	}
	function nodebackForPromise(promise, multiArgs) {
		return function(err, value) {
			if (promise === null) return;
			if (err) {
				var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
				promise._attachExtraTrace(wrapped);
				promise._reject(wrapped);
			} else if (!multiArgs) promise._fulfill(value);
			else {
				var $_len = arguments.length;
				var args = new Array(Math.max($_len - 1, 0));
				for (var $_i = 1; $_i < $_len; ++$_i) args[$_i - 1] = arguments[$_i];
				promise._fulfill(args);
			}
			promise = null;
		};
	}
	module.exports = nodebackForPromise;
}));
//#endregion
//#region node_modules/bluebird/js/release/method.js
var require_method = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, INTERNAL, tryConvertToPromise, apiRejection, debug) {
		var util = require_util();
		var tryCatch = util.tryCatch;
		Promise.method = function(fn) {
			if (typeof fn !== "function") throw new Promise.TypeError("expecting a function but got " + util.classString(fn));
			return function() {
				var ret = new Promise(INTERNAL);
				ret._captureStackTrace();
				ret._pushContext();
				var value = tryCatch(fn).apply(this, arguments);
				var promiseCreated = ret._popContext();
				debug.checkForgottenReturns(value, promiseCreated, "Promise.method", ret);
				ret._resolveFromSyncValue(value);
				return ret;
			};
		};
		Promise.attempt = Promise["try"] = function(fn) {
			if (typeof fn !== "function") return apiRejection("expecting a function but got " + util.classString(fn));
			var ret = new Promise(INTERNAL);
			ret._captureStackTrace();
			ret._pushContext();
			var value;
			if (arguments.length > 1) {
				debug.deprecated("calling Promise.try with more than 1 argument");
				var arg = arguments[1];
				var ctx = arguments[2];
				value = util.isArray(arg) ? tryCatch(fn).apply(ctx, arg) : tryCatch(fn).call(ctx, arg);
			} else value = tryCatch(fn)();
			var promiseCreated = ret._popContext();
			debug.checkForgottenReturns(value, promiseCreated, "Promise.try", ret);
			ret._resolveFromSyncValue(value);
			return ret;
		};
		Promise.prototype._resolveFromSyncValue = function(value) {
			if (value === util.errorObj) this._rejectCallback(value.e, false);
			else this._resolveCallback(value, true);
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/bind.js
var require_bind = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, INTERNAL, tryConvertToPromise, debug) {
		var calledBind = false;
		var rejectThis = function(_, e) {
			this._reject(e);
		};
		var targetRejected = function(e, context) {
			context.promiseRejectionQueued = true;
			context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
		};
		var bindingResolved = function(thisArg, context) {
			if ((this._bitField & 50397184) === 0) this._resolveCallback(context.target);
		};
		var bindingRejected = function(e, context) {
			if (!context.promiseRejectionQueued) this._reject(e);
		};
		Promise.prototype.bind = function(thisArg) {
			if (!calledBind) {
				calledBind = true;
				Promise.prototype._propagateFrom = debug.propagateFromFunction();
				Promise.prototype._boundValue = debug.boundValueFunction();
			}
			var maybePromise = tryConvertToPromise(thisArg);
			var ret = new Promise(INTERNAL);
			ret._propagateFrom(this, 1);
			var target = this._target();
			ret._setBoundTo(maybePromise);
			if (maybePromise instanceof Promise) {
				var context = {
					promiseRejectionQueued: false,
					promise: ret,
					target,
					bindingPromise: maybePromise
				};
				target._then(INTERNAL, targetRejected, void 0, ret, context);
				maybePromise._then(bindingResolved, bindingRejected, void 0, ret, context);
				ret._setOnCancel(maybePromise);
			} else ret._resolveCallback(target);
			return ret;
		};
		Promise.prototype._setBoundTo = function(obj) {
			if (obj !== void 0) {
				this._bitField = this._bitField | 2097152;
				this._boundTo = obj;
			} else this._bitField = this._bitField & -2097153;
		};
		Promise.prototype._isBound = function() {
			return (this._bitField & 2097152) === 2097152;
		};
		Promise.bind = function(thisArg, value) {
			return Promise.resolve(value).bind(thisArg);
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/cancel.js
var require_cancel = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, PromiseArray, apiRejection, debug) {
		var util = require_util();
		var tryCatch = util.tryCatch;
		var errorObj = util.errorObj;
		var async = Promise._async;
		Promise.prototype["break"] = Promise.prototype.cancel = function() {
			if (!debug.cancellation()) return this._warn("cancellation is disabled");
			var promise = this;
			var child = promise;
			while (promise._isCancellable()) {
				if (!promise._cancelBy(child)) {
					if (child._isFollowing()) child._followee().cancel();
					else child._cancelBranched();
					break;
				}
				var parent = promise._cancellationParent;
				if (parent == null || !parent._isCancellable()) {
					if (promise._isFollowing()) promise._followee().cancel();
					else promise._cancelBranched();
					break;
				} else {
					if (promise._isFollowing()) promise._followee().cancel();
					promise._setWillBeCancelled();
					child = promise;
					promise = parent;
				}
			}
		};
		Promise.prototype._branchHasCancelled = function() {
			this._branchesRemainingToCancel--;
		};
		Promise.prototype._enoughBranchesHaveCancelled = function() {
			return this._branchesRemainingToCancel === void 0 || this._branchesRemainingToCancel <= 0;
		};
		Promise.prototype._cancelBy = function(canceller) {
			if (canceller === this) {
				this._branchesRemainingToCancel = 0;
				this._invokeOnCancel();
				return true;
			} else {
				this._branchHasCancelled();
				if (this._enoughBranchesHaveCancelled()) {
					this._invokeOnCancel();
					return true;
				}
			}
			return false;
		};
		Promise.prototype._cancelBranched = function() {
			if (this._enoughBranchesHaveCancelled()) this._cancel();
		};
		Promise.prototype._cancel = function() {
			if (!this._isCancellable()) return;
			this._setCancelled();
			async.invoke(this._cancelPromises, this, void 0);
		};
		Promise.prototype._cancelPromises = function() {
			if (this._length() > 0) this._settlePromises();
		};
		Promise.prototype._unsetOnCancel = function() {
			this._onCancelField = void 0;
		};
		Promise.prototype._isCancellable = function() {
			return this.isPending() && !this._isCancelled();
		};
		Promise.prototype.isCancellable = function() {
			return this.isPending() && !this.isCancelled();
		};
		Promise.prototype._doInvokeOnCancel = function(onCancelCallback, internalOnly) {
			if (util.isArray(onCancelCallback)) for (var i = 0; i < onCancelCallback.length; ++i) this._doInvokeOnCancel(onCancelCallback[i], internalOnly);
			else if (onCancelCallback !== void 0) if (typeof onCancelCallback === "function") {
				if (!internalOnly) {
					var e = tryCatch(onCancelCallback).call(this._boundValue());
					if (e === errorObj) {
						this._attachExtraTrace(e.e);
						async.throwLater(e.e);
					}
				}
			} else onCancelCallback._resultCancelled(this);
		};
		Promise.prototype._invokeOnCancel = function() {
			var onCancelCallback = this._onCancel();
			this._unsetOnCancel();
			async.invoke(this._doInvokeOnCancel, this, onCancelCallback);
		};
		Promise.prototype._invokeInternalOnCancel = function() {
			if (this._isCancellable()) {
				this._doInvokeOnCancel(this._onCancel(), true);
				this._unsetOnCancel();
			}
		};
		Promise.prototype._resultCancelled = function() {
			this.cancel();
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/direct_resolve.js
var require_direct_resolve = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise) {
		function returner() {
			return this.value;
		}
		function thrower() {
			throw this.reason;
		}
		Promise.prototype["return"] = Promise.prototype.thenReturn = function(value) {
			if (value instanceof Promise) value.suppressUnhandledRejections();
			return this._then(returner, void 0, void 0, { value }, void 0);
		};
		Promise.prototype["throw"] = Promise.prototype.thenThrow = function(reason) {
			return this._then(thrower, void 0, void 0, { reason }, void 0);
		};
		Promise.prototype.catchThrow = function(reason) {
			if (arguments.length <= 1) return this._then(void 0, thrower, void 0, { reason }, void 0);
			else {
				var _reason = arguments[1];
				var handler = function() {
					throw _reason;
				};
				return this.caught(reason, handler);
			}
		};
		Promise.prototype.catchReturn = function(value) {
			if (arguments.length <= 1) {
				if (value instanceof Promise) value.suppressUnhandledRejections();
				return this._then(void 0, returner, void 0, { value }, void 0);
			} else {
				var _value = arguments[1];
				if (_value instanceof Promise) _value.suppressUnhandledRejections();
				var handler = function() {
					return _value;
				};
				return this.caught(value, handler);
			}
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/synchronous_inspection.js
var require_synchronous_inspection = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise) {
		function PromiseInspection(promise) {
			if (promise !== void 0) {
				promise = promise._target();
				this._bitField = promise._bitField;
				this._settledValueField = promise._isFateSealed() ? promise._settledValue() : void 0;
			} else {
				this._bitField = 0;
				this._settledValueField = void 0;
			}
		}
		PromiseInspection.prototype._settledValue = function() {
			return this._settledValueField;
		};
		var value = PromiseInspection.prototype.value = function() {
			if (!this.isFulfilled()) throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\n\n    See http://goo.gl/MqrFmX\n");
			return this._settledValue();
		};
		var reason = PromiseInspection.prototype.error = PromiseInspection.prototype.reason = function() {
			if (!this.isRejected()) throw new TypeError("cannot get rejection reason of a non-rejected promise\n\n    See http://goo.gl/MqrFmX\n");
			return this._settledValue();
		};
		var isFulfilled = PromiseInspection.prototype.isFulfilled = function() {
			return (this._bitField & 33554432) !== 0;
		};
		var isRejected = PromiseInspection.prototype.isRejected = function() {
			return (this._bitField & 16777216) !== 0;
		};
		var isPending = PromiseInspection.prototype.isPending = function() {
			return (this._bitField & 50397184) === 0;
		};
		var isResolved = PromiseInspection.prototype.isResolved = function() {
			return (this._bitField & 50331648) !== 0;
		};
		PromiseInspection.prototype.isCancelled = function() {
			return (this._bitField & 8454144) !== 0;
		};
		Promise.prototype.__isCancelled = function() {
			return (this._bitField & 65536) === 65536;
		};
		Promise.prototype._isCancelled = function() {
			return this._target().__isCancelled();
		};
		Promise.prototype.isCancelled = function() {
			return (this._target()._bitField & 8454144) !== 0;
		};
		Promise.prototype.isPending = function() {
			return isPending.call(this._target());
		};
		Promise.prototype.isRejected = function() {
			return isRejected.call(this._target());
		};
		Promise.prototype.isFulfilled = function() {
			return isFulfilled.call(this._target());
		};
		Promise.prototype.isResolved = function() {
			return isResolved.call(this._target());
		};
		Promise.prototype.value = function() {
			return value.call(this._target());
		};
		Promise.prototype.reason = function() {
			var target = this._target();
			target._unsetRejectionIsUnhandled();
			return reason.call(target);
		};
		Promise.prototype._value = function() {
			return this._settledValue();
		};
		Promise.prototype._reason = function() {
			this._unsetRejectionIsUnhandled();
			return this._settledValue();
		};
		Promise.PromiseInspection = PromiseInspection;
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/join.js
var require_join = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, PromiseArray, tryConvertToPromise, INTERNAL, async, getDomain) {
		var util = require_util();
		var canEvaluate = util.canEvaluate;
		var tryCatch = util.tryCatch;
		var errorObj = util.errorObj;
		var reject;
		if (canEvaluate) {
			var thenCallback = function(i) {
				return new Function("value", "holder", "                             \n            'use strict';                                                    \n            holder.pIndex = value;                                           \n            holder.checkFulfillment(this);                                   \n            ".replace(/Index/g, i));
			};
			var promiseSetter = function(i) {
				return new Function("promise", "holder", "                           \n            'use strict';                                                    \n            holder.pIndex = promise;                                         \n            ".replace(/Index/g, i));
			};
			var generateHolderClass = function(total) {
				var props = new Array(total);
				for (var i = 0; i < props.length; ++i) props[i] = "this.p" + (i + 1);
				var assignment = props.join(" = ") + " = null;";
				var cancellationCode = "var promise;\n" + props.map(function(prop) {
					return "                                                         \n                promise = " + prop + ";                                      \n                if (promise instanceof Promise) {                            \n                    promise.cancel();                                        \n                }                                                            \n            ";
				}).join("\n");
				var passedArguments = props.join(", ");
				var name = "Holder$" + total;
				var code = "return function(tryCatch, errorObj, Promise, async) {    \n            'use strict';                                                    \n            function [TheName](fn) {                                         \n                [TheProperties]                                              \n                this.fn = fn;                                                \n                this.asyncNeeded = true;                                     \n                this.now = 0;                                                \n            }                                                                \n                                                                             \n            [TheName].prototype._callFunction = function(promise) {          \n                promise._pushContext();                                      \n                var ret = tryCatch(this.fn)([ThePassedArguments]);           \n                promise._popContext();                                       \n                if (ret === errorObj) {                                      \n                    promise._rejectCallback(ret.e, false);                   \n                } else {                                                     \n                    promise._resolveCallback(ret);                           \n                }                                                            \n            };                                                               \n                                                                             \n            [TheName].prototype.checkFulfillment = function(promise) {       \n                var now = ++this.now;                                        \n                if (now === [TheTotal]) {                                    \n                    if (this.asyncNeeded) {                                  \n                        async.invoke(this._callFunction, this, promise);     \n                    } else {                                                 \n                        this._callFunction(promise);                         \n                    }                                                        \n                                                                             \n                }                                                            \n            };                                                               \n                                                                             \n            [TheName].prototype._resultCancelled = function() {              \n                [CancellationCode]                                           \n            };                                                               \n                                                                             \n            return [TheName];                                                \n        }(tryCatch, errorObj, Promise, async);                               \n        ";
				code = code.replace(/\[TheName\]/g, name).replace(/\[TheTotal\]/g, total).replace(/\[ThePassedArguments\]/g, passedArguments).replace(/\[TheProperties\]/g, assignment).replace(/\[CancellationCode\]/g, cancellationCode);
				return new Function("tryCatch", "errorObj", "Promise", "async", code)(tryCatch, errorObj, Promise, async);
			};
			var holderClasses = [];
			var thenCallbacks = [];
			var promiseSetters = [];
			for (var i = 0; i < 8; ++i) {
				holderClasses.push(generateHolderClass(i + 1));
				thenCallbacks.push(thenCallback(i + 1));
				promiseSetters.push(promiseSetter(i + 1));
			}
			reject = function(reason) {
				this._reject(reason);
			};
		}
		Promise.join = function() {
			var last = arguments.length - 1;
			var fn;
			if (last > 0 && typeof arguments[last] === "function") {
				fn = arguments[last];
				if (last <= 8 && canEvaluate) {
					var ret = new Promise(INTERNAL);
					ret._captureStackTrace();
					var HolderClass = holderClasses[last - 1];
					var holder = new HolderClass(fn);
					var callbacks = thenCallbacks;
					for (var i = 0; i < last; ++i) {
						var maybePromise = tryConvertToPromise(arguments[i], ret);
						if (maybePromise instanceof Promise) {
							maybePromise = maybePromise._target();
							var bitField = maybePromise._bitField;
							if ((bitField & 50397184) === 0) {
								maybePromise._then(callbacks[i], reject, void 0, ret, holder);
								promiseSetters[i](maybePromise, holder);
								holder.asyncNeeded = false;
							} else if ((bitField & 33554432) !== 0) callbacks[i].call(ret, maybePromise._value(), holder);
							else if ((bitField & 16777216) !== 0) ret._reject(maybePromise._reason());
							else ret._cancel();
						} else callbacks[i].call(ret, maybePromise, holder);
					}
					if (!ret._isFateSealed()) {
						if (holder.asyncNeeded) {
							var domain = getDomain();
							if (domain !== null) holder.fn = util.domainBind(domain, holder.fn);
						}
						ret._setAsyncGuaranteed();
						ret._setOnCancel(holder);
					}
					return ret;
				}
			}
			var $_len = arguments.length;
			var args = new Array($_len);
			for (var $_i = 0; $_i < $_len; ++$_i) args[$_i] = arguments[$_i];
			if (fn) args.pop();
			var ret = new PromiseArray(args).promise();
			return fn !== void 0 ? ret.spread(fn) : ret;
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/map.js
var require_map = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug) {
		var getDomain = Promise._getDomain;
		var util = require_util();
		var tryCatch = util.tryCatch;
		var errorObj = util.errorObj;
		var async = Promise._async;
		function MappingPromiseArray(promises, fn, limit, _filter) {
			this.constructor$(promises);
			this._promise._captureStackTrace();
			var domain = getDomain();
			this._callback = domain === null ? fn : util.domainBind(domain, fn);
			this._preservedValues = _filter === INTERNAL ? new Array(this.length()) : null;
			this._limit = limit;
			this._inFlight = 0;
			this._queue = [];
			async.invoke(this._asyncInit, this, void 0);
		}
		util.inherits(MappingPromiseArray, PromiseArray);
		MappingPromiseArray.prototype._asyncInit = function() {
			this._init$(void 0, -2);
		};
		MappingPromiseArray.prototype._init = function() {};
		MappingPromiseArray.prototype._promiseFulfilled = function(value, index) {
			var values = this._values;
			var length = this.length();
			var preservedValues = this._preservedValues;
			var limit = this._limit;
			if (index < 0) {
				index = index * -1 - 1;
				values[index] = value;
				if (limit >= 1) {
					this._inFlight--;
					this._drainQueue();
					if (this._isResolved()) return true;
				}
			} else {
				if (limit >= 1 && this._inFlight >= limit) {
					values[index] = value;
					this._queue.push(index);
					return false;
				}
				if (preservedValues !== null) preservedValues[index] = value;
				var promise = this._promise;
				var callback = this._callback;
				var receiver = promise._boundValue();
				promise._pushContext();
				var ret = tryCatch(callback).call(receiver, value, index, length);
				var promiseCreated = promise._popContext();
				debug.checkForgottenReturns(ret, promiseCreated, preservedValues !== null ? "Promise.filter" : "Promise.map", promise);
				if (ret === errorObj) {
					this._reject(ret.e);
					return true;
				}
				var maybePromise = tryConvertToPromise(ret, this._promise);
				if (maybePromise instanceof Promise) {
					maybePromise = maybePromise._target();
					var bitField = maybePromise._bitField;
					if ((bitField & 50397184) === 0) {
						if (limit >= 1) this._inFlight++;
						values[index] = maybePromise;
						maybePromise._proxy(this, (index + 1) * -1);
						return false;
					} else if ((bitField & 33554432) !== 0) ret = maybePromise._value();
					else if ((bitField & 16777216) !== 0) {
						this._reject(maybePromise._reason());
						return true;
					} else {
						this._cancel();
						return true;
					}
				}
				values[index] = ret;
			}
			if (++this._totalResolved >= length) {
				if (preservedValues !== null) this._filter(values, preservedValues);
				else this._resolve(values);
				return true;
			}
			return false;
		};
		MappingPromiseArray.prototype._drainQueue = function() {
			var queue = this._queue;
			var limit = this._limit;
			var values = this._values;
			while (queue.length > 0 && this._inFlight < limit) {
				if (this._isResolved()) return;
				var index = queue.pop();
				this._promiseFulfilled(values[index], index);
			}
		};
		MappingPromiseArray.prototype._filter = function(booleans, values) {
			var len = values.length;
			var ret = new Array(len);
			var j = 0;
			for (var i = 0; i < len; ++i) if (booleans[i]) ret[j++] = values[i];
			ret.length = j;
			this._resolve(ret);
		};
		MappingPromiseArray.prototype.preservedValues = function() {
			return this._preservedValues;
		};
		function map(promises, fn, options, _filter) {
			if (typeof fn !== "function") return apiRejection("expecting a function but got " + util.classString(fn));
			var limit = 0;
			if (options !== void 0) if (typeof options === "object" && options !== null) {
				if (typeof options.concurrency !== "number") return Promise.reject(/* @__PURE__ */ new TypeError("'concurrency' must be a number but it is " + util.classString(options.concurrency)));
				limit = options.concurrency;
			} else return Promise.reject(/* @__PURE__ */ new TypeError("options argument must be an object but it is " + util.classString(options)));
			limit = typeof limit === "number" && isFinite(limit) && limit >= 1 ? limit : 0;
			return new MappingPromiseArray(promises, fn, limit, _filter).promise();
		}
		Promise.prototype.map = function(fn, options) {
			return map(this, fn, options, null);
		};
		Promise.map = function(promises, fn, options, _filter) {
			return map(promises, fn, options, _filter);
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/call_get.js
var require_call_get = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var cr = Object.create;
	if (cr) {
		var callerCache = cr(null);
		var getterCache = cr(null);
		callerCache[" size"] = getterCache[" size"] = 0;
	}
	module.exports = function(Promise) {
		var util = require_util();
		var canEvaluate = util.canEvaluate;
		var isIdentifier = util.isIdentifier;
		var getMethodCaller;
		var getGetter;
		var makeMethodCaller = function(methodName) {
			return new Function("ensureMethod", "                                    \n        return function(obj) {                                               \n            'use strict'                                                     \n            var len = this.length;                                           \n            ensureMethod(obj, 'methodName');                                 \n            switch(len) {                                                    \n                case 1: return obj.methodName(this[0]);                      \n                case 2: return obj.methodName(this[0], this[1]);             \n                case 3: return obj.methodName(this[0], this[1], this[2]);    \n                case 0: return obj.methodName();                             \n                default:                                                     \n                    return obj.methodName.apply(obj, this);                  \n            }                                                                \n        };                                                                   \n        ".replace(/methodName/g, methodName))(ensureMethod);
		};
		var makeGetter = function(propertyName) {
			return new Function("obj", "                                             \n        'use strict';                                                        \n        return obj.propertyName;                                             \n        ".replace("propertyName", propertyName));
		};
		var getCompiled = function(name, compiler, cache) {
			var ret = cache[name];
			if (typeof ret !== "function") {
				if (!isIdentifier(name)) return null;
				ret = compiler(name);
				cache[name] = ret;
				cache[" size"]++;
				if (cache[" size"] > 512) {
					var keys = Object.keys(cache);
					for (var i = 0; i < 256; ++i) delete cache[keys[i]];
					cache[" size"] = keys.length - 256;
				}
			}
			return ret;
		};
		getMethodCaller = function(name) {
			return getCompiled(name, makeMethodCaller, callerCache);
		};
		getGetter = function(name) {
			return getCompiled(name, makeGetter, getterCache);
		};
		function ensureMethod(obj, methodName) {
			var fn;
			if (obj != null) fn = obj[methodName];
			if (typeof fn !== "function") {
				var message = "Object " + util.classString(obj) + " has no method '" + util.toString(methodName) + "'";
				throw new Promise.TypeError(message);
			}
			return fn;
		}
		function caller(obj) {
			return ensureMethod(obj, this.pop()).apply(obj, this);
		}
		Promise.prototype.call = function(methodName) {
			var $_len = arguments.length;
			var args = new Array(Math.max($_len - 1, 0));
			for (var $_i = 1; $_i < $_len; ++$_i) args[$_i - 1] = arguments[$_i];
			if (canEvaluate) {
				var maybeCaller = getMethodCaller(methodName);
				if (maybeCaller !== null) return this._then(maybeCaller, void 0, void 0, args, void 0);
			}
			args.push(methodName);
			return this._then(caller, void 0, void 0, args, void 0);
		};
		function namedGetter(obj) {
			return obj[this];
		}
		function indexedGetter(obj) {
			var index = +this;
			if (index < 0) index = Math.max(0, index + obj.length);
			return obj[index];
		}
		Promise.prototype.get = function(propertyName) {
			var isIndex = typeof propertyName === "number";
			var getter;
			if (!isIndex) if (canEvaluate) {
				var maybeGetter = getGetter(propertyName);
				getter = maybeGetter !== null ? maybeGetter : namedGetter;
			} else getter = namedGetter;
			else getter = indexedGetter;
			return this._then(getter, void 0, void 0, propertyName, void 0);
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/using.js
var require_using = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug) {
		var util = require_util();
		var TypeError = require_errors$1().TypeError;
		var inherits = require_util().inherits;
		var errorObj = util.errorObj;
		var tryCatch = util.tryCatch;
		var NULL = {};
		function thrower(e) {
			setTimeout(function() {
				throw e;
			}, 0);
		}
		function castPreservingDisposable(thenable) {
			var maybePromise = tryConvertToPromise(thenable);
			if (maybePromise !== thenable && typeof thenable._isDisposable === "function" && typeof thenable._getDisposer === "function" && thenable._isDisposable()) maybePromise._setDisposable(thenable._getDisposer());
			return maybePromise;
		}
		function dispose(resources, inspection) {
			var i = 0;
			var len = resources.length;
			var ret = new Promise(INTERNAL);
			function iterator() {
				if (i >= len) return ret._fulfill();
				var maybePromise = castPreservingDisposable(resources[i++]);
				if (maybePromise instanceof Promise && maybePromise._isDisposable()) {
					try {
						maybePromise = tryConvertToPromise(maybePromise._getDisposer().tryDispose(inspection), resources.promise);
					} catch (e) {
						return thrower(e);
					}
					if (maybePromise instanceof Promise) return maybePromise._then(iterator, thrower, null, null, null);
				}
				iterator();
			}
			iterator();
			return ret;
		}
		function Disposer(data, promise, context) {
			this._data = data;
			this._promise = promise;
			this._context = context;
		}
		Disposer.prototype.data = function() {
			return this._data;
		};
		Disposer.prototype.promise = function() {
			return this._promise;
		};
		Disposer.prototype.resource = function() {
			if (this.promise().isFulfilled()) return this.promise().value();
			return NULL;
		};
		Disposer.prototype.tryDispose = function(inspection) {
			var resource = this.resource();
			var context = this._context;
			if (context !== void 0) context._pushContext();
			var ret = resource !== NULL ? this.doDispose(resource, inspection) : null;
			if (context !== void 0) context._popContext();
			this._promise._unsetDisposable();
			this._data = null;
			return ret;
		};
		Disposer.isDisposer = function(d) {
			return d != null && typeof d.resource === "function" && typeof d.tryDispose === "function";
		};
		function FunctionDisposer(fn, promise, context) {
			this.constructor$(fn, promise, context);
		}
		inherits(FunctionDisposer, Disposer);
		FunctionDisposer.prototype.doDispose = function(resource, inspection) {
			return this.data().call(resource, resource, inspection);
		};
		function maybeUnwrapDisposer(value) {
			if (Disposer.isDisposer(value)) {
				this.resources[this.index]._setDisposable(value);
				return value.promise();
			}
			return value;
		}
		function ResourceList(length) {
			this.length = length;
			this.promise = null;
			this[length - 1] = null;
		}
		ResourceList.prototype._resultCancelled = function() {
			var len = this.length;
			for (var i = 0; i < len; ++i) {
				var item = this[i];
				if (item instanceof Promise) item.cancel();
			}
		};
		Promise.using = function() {
			var len = arguments.length;
			if (len < 2) return apiRejection("you must pass at least 2 arguments to Promise.using");
			var fn = arguments[len - 1];
			if (typeof fn !== "function") return apiRejection("expecting a function but got " + util.classString(fn));
			var input;
			var spreadArgs = true;
			if (len === 2 && Array.isArray(arguments[0])) {
				input = arguments[0];
				len = input.length;
				spreadArgs = false;
			} else {
				input = arguments;
				len--;
			}
			var resources = new ResourceList(len);
			for (var i = 0; i < len; ++i) {
				var resource = input[i];
				if (Disposer.isDisposer(resource)) {
					var disposer = resource;
					resource = resource.promise();
					resource._setDisposable(disposer);
				} else {
					var maybePromise = tryConvertToPromise(resource);
					if (maybePromise instanceof Promise) resource = maybePromise._then(maybeUnwrapDisposer, null, null, {
						resources,
						index: i
					}, void 0);
				}
				resources[i] = resource;
			}
			var reflectedResources = new Array(resources.length);
			for (var i = 0; i < reflectedResources.length; ++i) reflectedResources[i] = Promise.resolve(resources[i]).reflect();
			var resultPromise = Promise.all(reflectedResources).then(function(inspections) {
				for (var i = 0; i < inspections.length; ++i) {
					var inspection = inspections[i];
					if (inspection.isRejected()) {
						errorObj.e = inspection.error();
						return errorObj;
					} else if (!inspection.isFulfilled()) {
						resultPromise.cancel();
						return;
					}
					inspections[i] = inspection.value();
				}
				promise._pushContext();
				fn = tryCatch(fn);
				var ret = spreadArgs ? fn.apply(void 0, inspections) : fn(inspections);
				var promiseCreated = promise._popContext();
				debug.checkForgottenReturns(ret, promiseCreated, "Promise.using", promise);
				return ret;
			});
			var promise = resultPromise.lastly(function() {
				return dispose(resources, new Promise.PromiseInspection(resultPromise));
			});
			resources.promise = promise;
			promise._setOnCancel(resources);
			return promise;
		};
		Promise.prototype._setDisposable = function(disposer) {
			this._bitField = this._bitField | 131072;
			this._disposer = disposer;
		};
		Promise.prototype._isDisposable = function() {
			return (this._bitField & 131072) > 0;
		};
		Promise.prototype._getDisposer = function() {
			return this._disposer;
		};
		Promise.prototype._unsetDisposable = function() {
			this._bitField = this._bitField & -131073;
			this._disposer = void 0;
		};
		Promise.prototype.disposer = function(fn) {
			if (typeof fn === "function") return new FunctionDisposer(fn, this, createContext());
			throw new TypeError();
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/timers.js
var require_timers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, INTERNAL, debug) {
		var util = require_util();
		var TimeoutError = Promise.TimeoutError;
		function HandleWrapper(handle) {
			this.handle = handle;
		}
		HandleWrapper.prototype._resultCancelled = function() {
			clearTimeout(this.handle);
		};
		var afterValue = function(value) {
			return delay(+this).thenReturn(value);
		};
		var delay = Promise.delay = function(ms, value) {
			var ret;
			var handle;
			if (value !== void 0) {
				ret = Promise.resolve(value)._then(afterValue, null, null, ms, void 0);
				if (debug.cancellation() && value instanceof Promise) ret._setOnCancel(value);
			} else {
				ret = new Promise(INTERNAL);
				handle = setTimeout(function() {
					ret._fulfill();
				}, +ms);
				if (debug.cancellation()) ret._setOnCancel(new HandleWrapper(handle));
				ret._captureStackTrace();
			}
			ret._setAsyncGuaranteed();
			return ret;
		};
		Promise.prototype.delay = function(ms) {
			return delay(ms, this);
		};
		var afterTimeout = function(promise, message, parent) {
			var err;
			if (typeof message !== "string") if (message instanceof Error) err = message;
			else err = new TimeoutError("operation timed out");
			else err = new TimeoutError(message);
			util.markAsOriginatingFromRejection(err);
			promise._attachExtraTrace(err);
			promise._reject(err);
			if (parent != null) parent.cancel();
		};
		function successClear(value) {
			clearTimeout(this.handle);
			return value;
		}
		function failureClear(reason) {
			clearTimeout(this.handle);
			throw reason;
		}
		Promise.prototype.timeout = function(ms, message) {
			ms = +ms;
			var ret, parent;
			var handleWrapper = new HandleWrapper(setTimeout(function timeoutTimeout() {
				if (ret.isPending()) afterTimeout(ret, message, parent);
			}, ms));
			if (debug.cancellation()) {
				parent = this.then();
				ret = parent._then(successClear, failureClear, void 0, handleWrapper, void 0);
				ret._setOnCancel(handleWrapper);
			} else ret = this._then(successClear, failureClear, void 0, handleWrapper, void 0);
			return ret;
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/generators.js
var require_generators = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug) {
		var TypeError = require_errors$1().TypeError;
		var util = require_util();
		var errorObj = util.errorObj;
		var tryCatch = util.tryCatch;
		var yieldHandlers = [];
		function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
			for (var i = 0; i < yieldHandlers.length; ++i) {
				traceParent._pushContext();
				var result = tryCatch(yieldHandlers[i])(value);
				traceParent._popContext();
				if (result === errorObj) {
					traceParent._pushContext();
					var ret = Promise.reject(errorObj.e);
					traceParent._popContext();
					return ret;
				}
				var maybePromise = tryConvertToPromise(result, traceParent);
				if (maybePromise instanceof Promise) return maybePromise;
			}
			return null;
		}
		function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
			if (debug.cancellation()) {
				var internal = new Promise(INTERNAL);
				var _finallyPromise = this._finallyPromise = new Promise(INTERNAL);
				this._promise = internal.lastly(function() {
					return _finallyPromise;
				});
				internal._captureStackTrace();
				internal._setOnCancel(this);
			} else (this._promise = new Promise(INTERNAL))._captureStackTrace();
			this._stack = stack;
			this._generatorFunction = generatorFunction;
			this._receiver = receiver;
			this._generator = void 0;
			this._yieldHandlers = typeof yieldHandler === "function" ? [yieldHandler].concat(yieldHandlers) : yieldHandlers;
			this._yieldedPromise = null;
			this._cancellationPhase = false;
		}
		util.inherits(PromiseSpawn, Proxyable);
		PromiseSpawn.prototype._isResolved = function() {
			return this._promise === null;
		};
		PromiseSpawn.prototype._cleanup = function() {
			this._promise = this._generator = null;
			if (debug.cancellation() && this._finallyPromise !== null) {
				this._finallyPromise._fulfill();
				this._finallyPromise = null;
			}
		};
		PromiseSpawn.prototype._promiseCancelled = function() {
			if (this._isResolved()) return;
			var implementsReturn = typeof this._generator["return"] !== "undefined";
			var result;
			if (!implementsReturn) {
				var reason = new Promise.CancellationError("generator .return() sentinel");
				Promise.coroutine.returnSentinel = reason;
				this._promise._attachExtraTrace(reason);
				this._promise._pushContext();
				result = tryCatch(this._generator["throw"]).call(this._generator, reason);
				this._promise._popContext();
			} else {
				this._promise._pushContext();
				result = tryCatch(this._generator["return"]).call(this._generator, void 0);
				this._promise._popContext();
			}
			this._cancellationPhase = true;
			this._yieldedPromise = null;
			this._continue(result);
		};
		PromiseSpawn.prototype._promiseFulfilled = function(value) {
			this._yieldedPromise = null;
			this._promise._pushContext();
			var result = tryCatch(this._generator.next).call(this._generator, value);
			this._promise._popContext();
			this._continue(result);
		};
		PromiseSpawn.prototype._promiseRejected = function(reason) {
			this._yieldedPromise = null;
			this._promise._attachExtraTrace(reason);
			this._promise._pushContext();
			var result = tryCatch(this._generator["throw"]).call(this._generator, reason);
			this._promise._popContext();
			this._continue(result);
		};
		PromiseSpawn.prototype._resultCancelled = function() {
			if (this._yieldedPromise instanceof Promise) {
				var promise = this._yieldedPromise;
				this._yieldedPromise = null;
				promise.cancel();
			}
		};
		PromiseSpawn.prototype.promise = function() {
			return this._promise;
		};
		PromiseSpawn.prototype._run = function() {
			this._generator = this._generatorFunction.call(this._receiver);
			this._receiver = this._generatorFunction = void 0;
			this._promiseFulfilled(void 0);
		};
		PromiseSpawn.prototype._continue = function(result) {
			var promise = this._promise;
			if (result === errorObj) {
				this._cleanup();
				if (this._cancellationPhase) return promise.cancel();
				else return promise._rejectCallback(result.e, false);
			}
			var value = result.value;
			if (result.done === true) {
				this._cleanup();
				if (this._cancellationPhase) return promise.cancel();
				else return promise._resolveCallback(value);
			} else {
				var maybePromise = tryConvertToPromise(value, this._promise);
				if (!(maybePromise instanceof Promise)) {
					maybePromise = promiseFromYieldHandler(maybePromise, this._yieldHandlers, this._promise);
					if (maybePromise === null) {
						this._promiseRejected(new TypeError("A value %s was yielded that could not be treated as a promise\n\n    See http://goo.gl/MqrFmX\n\n".replace("%s", value) + "From coroutine:\n" + this._stack.split("\n").slice(1, -7).join("\n")));
						return;
					}
				}
				maybePromise = maybePromise._target();
				var bitField = maybePromise._bitField;
				if ((bitField & 50397184) === 0) {
					this._yieldedPromise = maybePromise;
					maybePromise._proxy(this, null);
				} else if ((bitField & 33554432) !== 0) Promise._async.invoke(this._promiseFulfilled, this, maybePromise._value());
				else if ((bitField & 16777216) !== 0) Promise._async.invoke(this._promiseRejected, this, maybePromise._reason());
				else this._promiseCancelled();
			}
		};
		Promise.coroutine = function(generatorFunction, options) {
			if (typeof generatorFunction !== "function") throw new TypeError("generatorFunction must be a function\n\n    See http://goo.gl/MqrFmX\n");
			var yieldHandler = Object(options).yieldHandler;
			var PromiseSpawn$ = PromiseSpawn;
			var stack = (/* @__PURE__ */ new Error()).stack;
			return function() {
				var generator = generatorFunction.apply(this, arguments);
				var spawn = new PromiseSpawn$(void 0, void 0, yieldHandler, stack);
				var ret = spawn.promise();
				spawn._generator = generator;
				spawn._promiseFulfilled(void 0);
				return ret;
			};
		};
		Promise.coroutine.addYieldHandler = function(fn) {
			if (typeof fn !== "function") throw new TypeError("expecting a function but got " + util.classString(fn));
			yieldHandlers.push(fn);
		};
		Promise.spawn = function(generatorFunction) {
			debug.deprecated("Promise.spawn()", "Promise.coroutine()");
			if (typeof generatorFunction !== "function") return apiRejection("generatorFunction must be a function\n\n    See http://goo.gl/MqrFmX\n");
			var spawn = new PromiseSpawn(generatorFunction, this);
			var ret = spawn.promise();
			spawn._run(Promise.spawn);
			return ret;
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/nodeify.js
var require_nodeify = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise) {
		var util = require_util();
		var async = Promise._async;
		var tryCatch = util.tryCatch;
		var errorObj = util.errorObj;
		function spreadAdapter(val, nodeback) {
			var promise = this;
			if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
			var ret = tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
			if (ret === errorObj) async.throwLater(ret.e);
		}
		function successAdapter(val, nodeback) {
			var receiver = this._boundValue();
			var ret = val === void 0 ? tryCatch(nodeback).call(receiver, null) : tryCatch(nodeback).call(receiver, null, val);
			if (ret === errorObj) async.throwLater(ret.e);
		}
		function errorAdapter(reason, nodeback) {
			var promise = this;
			if (!reason) {
				var newReason = /* @__PURE__ */ new Error(reason + "");
				newReason.cause = reason;
				reason = newReason;
			}
			var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
			if (ret === errorObj) async.throwLater(ret.e);
		}
		Promise.prototype.asCallback = Promise.prototype.nodeify = function(nodeback, options) {
			if (typeof nodeback == "function") {
				var adapter = successAdapter;
				if (options !== void 0 && Object(options).spread) adapter = spreadAdapter;
				this._then(adapter, errorAdapter, void 0, this, nodeback);
			}
			return this;
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/promisify.js
var require_promisify = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, INTERNAL) {
		var THIS = {};
		var util = require_util();
		var nodebackForPromise = require_nodeback();
		var withAppended = util.withAppended;
		var maybeWrapAsError = util.maybeWrapAsError;
		var canEvaluate = util.canEvaluate;
		var TypeError = require_errors$1().TypeError;
		var defaultSuffix = "Async";
		var defaultPromisified = { __isPromisified__: true };
		var noCopyPropsPattern = new RegExp("^(?:" + [
			"arity",
			"length",
			"name",
			"arguments",
			"caller",
			"callee",
			"prototype",
			"__isPromisified__"
		].join("|") + ")$");
		var defaultFilter = function(name) {
			return util.isIdentifier(name) && name.charAt(0) !== "_" && name !== "constructor";
		};
		function propsFilter(key) {
			return !noCopyPropsPattern.test(key);
		}
		function isPromisified(fn) {
			try {
				return fn.__isPromisified__ === true;
			} catch (e) {
				return false;
			}
		}
		function hasPromisified(obj, key, suffix) {
			var val = util.getDataPropertyOrDefault(obj, key + suffix, defaultPromisified);
			return val ? isPromisified(val) : false;
		}
		function checkValid(ret, suffix, suffixRegexp) {
			for (var i = 0; i < ret.length; i += 2) {
				var key = ret[i];
				if (suffixRegexp.test(key)) {
					var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
					for (var j = 0; j < ret.length; j += 2) if (ret[j] === keyWithoutAsyncSuffix) throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\n\n    See http://goo.gl/MqrFmX\n".replace("%s", suffix));
				}
			}
		}
		function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
			var keys = util.inheritedDataKeys(obj);
			var ret = [];
			for (var i = 0; i < keys.length; ++i) {
				var key = keys[i];
				var value = obj[key];
				var passesDefaultFilter = filter === defaultFilter ? true : defaultFilter(key, value, obj);
				if (typeof value === "function" && !isPromisified(value) && !hasPromisified(obj, key, suffix) && filter(key, value, obj, passesDefaultFilter)) ret.push(key, value);
			}
			checkValid(ret, suffix, suffixRegexp);
			return ret;
		}
		var escapeIdentRegex = function(str) {
			return str.replace(/([$])/, "\\$");
		};
		var makeNodePromisifiedEval;
		var switchCaseArgumentOrder = function(likelyArgumentCount) {
			var ret = [likelyArgumentCount];
			var min = Math.max(0, likelyArgumentCount - 1 - 3);
			for (var i = likelyArgumentCount - 1; i >= min; --i) ret.push(i);
			for (var i = likelyArgumentCount + 1; i <= 3; ++i) ret.push(i);
			return ret;
		};
		var argumentSequence = function(argumentCount) {
			return util.filledRange(argumentCount, "_arg", "");
		};
		var parameterDeclaration = function(parameterCount) {
			return util.filledRange(Math.max(parameterCount, 3), "_arg", "");
		};
		var parameterCount = function(fn) {
			if (typeof fn.length === "number") return Math.max(Math.min(fn.length, 1024), 0);
			return 0;
		};
		makeNodePromisifiedEval = function(callback, receiver, originalName, fn, _, multiArgs) {
			var newParameterCount = Math.max(0, parameterCount(fn) - 1);
			var argumentOrder = switchCaseArgumentOrder(newParameterCount);
			var shouldProxyThis = typeof callback === "string" || receiver === THIS;
			function generateCallForArgumentCount(count) {
				var args = argumentSequence(count).join(", ");
				var comma = count > 0 ? ", " : "";
				var ret;
				if (shouldProxyThis) ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
				else ret = receiver === void 0 ? "ret = callback({{args}}, nodeback); break;\n" : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
				return ret.replace("{{args}}", args).replace(", ", comma);
			}
			function generateArgumentSwitchCase() {
				var ret = "";
				for (var i = 0; i < argumentOrder.length; ++i) ret += "case " + argumentOrder[i] + ":" + generateCallForArgumentCount(argumentOrder[i]);
				ret += "                                                             \n        default:                                                             \n            var args = new Array(len + 1);                                   \n            var i = 0;                                                       \n            for (var i = 0; i < len; ++i) {                                  \n               args[i] = arguments[i];                                       \n            }                                                                \n            args[i] = nodeback;                                              \n            [CodeForCall]                                                    \n            break;                                                           \n        ".replace("[CodeForCall]", shouldProxyThis ? "ret = callback.apply(this, args);\n" : "ret = callback.apply(receiver, args);\n");
				return ret;
			}
			var getFunctionCode = typeof callback === "string" ? "this != null ? this['" + callback + "'] : fn" : "fn";
			var body = "'use strict';                                                \n        var ret = function (Parameters) {                                    \n            'use strict';                                                    \n            var len = arguments.length;                                      \n            var promise = new Promise(INTERNAL);                             \n            promise._captureStackTrace();                                    \n            var nodeback = nodebackForPromise(promise, " + multiArgs + ");   \n            var ret;                                                         \n            var callback = tryCatch([GetFunctionCode]);                      \n            switch(len) {                                                    \n                [CodeForSwitchCase]                                          \n            }                                                                \n            if (ret === errorObj) {                                          \n                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n            }                                                                \n            if (!promise._isFateSealed()) promise._setAsyncGuaranteed();     \n            return promise;                                                  \n        };                                                                   \n        notEnumerableProp(ret, '__isPromisified__', true);                   \n        return ret;                                                          \n    ".replace("[CodeForSwitchCase]", generateArgumentSwitchCase()).replace("[GetFunctionCode]", getFunctionCode);
			body = body.replace("Parameters", parameterDeclaration(newParameterCount));
			return new Function("Promise", "fn", "receiver", "withAppended", "maybeWrapAsError", "nodebackForPromise", "tryCatch", "errorObj", "notEnumerableProp", "INTERNAL", body)(Promise, fn, receiver, withAppended, maybeWrapAsError, nodebackForPromise, util.tryCatch, util.errorObj, util.notEnumerableProp, INTERNAL);
		};
		function makeNodePromisifiedClosure(callback, receiver, _, fn, __, multiArgs) {
			var defaultThis = (function() {
				return this;
			})();
			var method = callback;
			if (typeof method === "string") callback = fn;
			function promisified() {
				var _receiver = receiver;
				if (receiver === THIS) _receiver = this;
				var promise = new Promise(INTERNAL);
				promise._captureStackTrace();
				var cb = typeof method === "string" && this !== defaultThis ? this[method] : callback;
				var fn = nodebackForPromise(promise, multiArgs);
				try {
					cb.apply(_receiver, withAppended(arguments, fn));
				} catch (e) {
					promise._rejectCallback(maybeWrapAsError(e), true, true);
				}
				if (!promise._isFateSealed()) promise._setAsyncGuaranteed();
				return promise;
			}
			util.notEnumerableProp(promisified, "__isPromisified__", true);
			return promisified;
		}
		var makeNodePromisified = canEvaluate ? makeNodePromisifiedEval : makeNodePromisifiedClosure;
		function promisifyAll(obj, suffix, filter, promisifier, multiArgs) {
			var methods = promisifiableMethods(obj, suffix, new RegExp(escapeIdentRegex(suffix) + "$"), filter);
			for (var i = 0, len = methods.length; i < len; i += 2) {
				var key = methods[i];
				var fn = methods[i + 1];
				var promisifiedKey = key + suffix;
				if (promisifier === makeNodePromisified) obj[promisifiedKey] = makeNodePromisified(key, THIS, key, fn, suffix, multiArgs);
				else {
					var promisified = promisifier(fn, function() {
						return makeNodePromisified(key, THIS, key, fn, suffix, multiArgs);
					});
					util.notEnumerableProp(promisified, "__isPromisified__", true);
					obj[promisifiedKey] = promisified;
				}
			}
			util.toFastProperties(obj);
			return obj;
		}
		function promisify(callback, receiver, multiArgs) {
			return makeNodePromisified(callback, receiver, void 0, callback, null, multiArgs);
		}
		Promise.promisify = function(fn, options) {
			if (typeof fn !== "function") throw new TypeError("expecting a function but got " + util.classString(fn));
			if (isPromisified(fn)) return fn;
			options = Object(options);
			var ret = promisify(fn, options.context === void 0 ? THIS : options.context, !!options.multiArgs);
			util.copyDescriptors(fn, ret, propsFilter);
			return ret;
		};
		Promise.promisifyAll = function(target, options) {
			if (typeof target !== "function" && typeof target !== "object") throw new TypeError("the target of promisifyAll must be an object or a function\n\n    See http://goo.gl/MqrFmX\n");
			options = Object(options);
			var multiArgs = !!options.multiArgs;
			var suffix = options.suffix;
			if (typeof suffix !== "string") suffix = defaultSuffix;
			var filter = options.filter;
			if (typeof filter !== "function") filter = defaultFilter;
			var promisifier = options.promisifier;
			if (typeof promisifier !== "function") promisifier = makeNodePromisified;
			if (!util.isIdentifier(suffix)) throw new RangeError("suffix must be a valid identifier\n\n    See http://goo.gl/MqrFmX\n");
			var keys = util.inheritedDataKeys(target);
			for (var i = 0; i < keys.length; ++i) {
				var value = target[keys[i]];
				if (keys[i] !== "constructor" && util.isClass(value)) {
					promisifyAll(value.prototype, suffix, filter, promisifier, multiArgs);
					promisifyAll(value, suffix, filter, promisifier, multiArgs);
				}
			}
			return promisifyAll(target, suffix, filter, promisifier, multiArgs);
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/props.js
var require_props = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, PromiseArray, tryConvertToPromise, apiRejection) {
		var util = require_util();
		var isObject = util.isObject;
		var es5 = require_es5();
		var Es6Map;
		if (typeof Map === "function") Es6Map = Map;
		var mapToEntries = (function() {
			var index = 0;
			var size = 0;
			function extractEntry(value, key) {
				this[index] = value;
				this[index + size] = key;
				index++;
			}
			return function mapToEntries(map) {
				size = map.size;
				index = 0;
				var ret = new Array(map.size * 2);
				map.forEach(extractEntry, ret);
				return ret;
			};
		})();
		var entriesToMap = function(entries) {
			var ret = new Es6Map();
			var length = entries.length / 2 | 0;
			for (var i = 0; i < length; ++i) {
				var key = entries[length + i];
				var value = entries[i];
				ret.set(key, value);
			}
			return ret;
		};
		function PropertiesPromiseArray(obj) {
			var isMap = false;
			var entries;
			if (Es6Map !== void 0 && obj instanceof Es6Map) {
				entries = mapToEntries(obj);
				isMap = true;
			} else {
				var keys = es5.keys(obj);
				var len = keys.length;
				entries = new Array(len * 2);
				for (var i = 0; i < len; ++i) {
					var key = keys[i];
					entries[i] = obj[key];
					entries[i + len] = key;
				}
			}
			this.constructor$(entries);
			this._isMap = isMap;
			this._init$(void 0, -3);
		}
		util.inherits(PropertiesPromiseArray, PromiseArray);
		PropertiesPromiseArray.prototype._init = function() {};
		PropertiesPromiseArray.prototype._promiseFulfilled = function(value, index) {
			this._values[index] = value;
			if (++this._totalResolved >= this._length) {
				var val;
				if (this._isMap) val = entriesToMap(this._values);
				else {
					val = {};
					var keyOffset = this.length();
					for (var i = 0, len = this.length(); i < len; ++i) val[this._values[i + keyOffset]] = this._values[i];
				}
				this._resolve(val);
				return true;
			}
			return false;
		};
		PropertiesPromiseArray.prototype.shouldCopyValues = function() {
			return false;
		};
		PropertiesPromiseArray.prototype.getActualLength = function(len) {
			return len >> 1;
		};
		function props(promises) {
			var ret;
			var castValue = tryConvertToPromise(promises);
			if (!isObject(castValue)) return apiRejection("cannot await properties of a non-object\n\n    See http://goo.gl/MqrFmX\n");
			else if (castValue instanceof Promise) ret = castValue._then(Promise.props, void 0, void 0, void 0, void 0);
			else ret = new PropertiesPromiseArray(castValue).promise();
			if (castValue instanceof Promise) ret._propagateFrom(castValue, 2);
			return ret;
		}
		Promise.prototype.props = function() {
			return props(this);
		};
		Promise.props = function(promises) {
			return props(promises);
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/race.js
var require_race = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, INTERNAL, tryConvertToPromise, apiRejection) {
		var util = require_util();
		var raceLater = function(promise) {
			return promise.then(function(array) {
				return race(array, promise);
			});
		};
		function race(promises, parent) {
			var maybePromise = tryConvertToPromise(promises);
			if (maybePromise instanceof Promise) return raceLater(maybePromise);
			else {
				promises = util.asArray(promises);
				if (promises === null) return apiRejection("expecting an array or an iterable object but got " + util.classString(promises));
			}
			var ret = new Promise(INTERNAL);
			if (parent !== void 0) ret._propagateFrom(parent, 3);
			var fulfill = ret._fulfill;
			var reject = ret._reject;
			for (var i = 0, len = promises.length; i < len; ++i) {
				var val = promises[i];
				if (val === void 0 && !(i in promises)) continue;
				Promise.cast(val)._then(fulfill, reject, void 0, ret, null);
			}
			return ret;
		}
		Promise.race = function(promises) {
			return race(promises, void 0);
		};
		Promise.prototype.race = function() {
			return race(this, void 0);
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/reduce.js
var require_reduce = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug) {
		var getDomain = Promise._getDomain;
		var util = require_util();
		var tryCatch = util.tryCatch;
		function ReductionPromiseArray(promises, fn, initialValue, _each) {
			this.constructor$(promises);
			var domain = getDomain();
			this._fn = domain === null ? fn : util.domainBind(domain, fn);
			if (initialValue !== void 0) {
				initialValue = Promise.resolve(initialValue);
				initialValue._attachCancellationCallback(this);
			}
			this._initialValue = initialValue;
			this._currentCancellable = null;
			if (_each === INTERNAL) this._eachValues = Array(this._length);
			else if (_each === 0) this._eachValues = null;
			else this._eachValues = void 0;
			this._promise._captureStackTrace();
			this._init$(void 0, -5);
		}
		util.inherits(ReductionPromiseArray, PromiseArray);
		ReductionPromiseArray.prototype._gotAccum = function(accum) {
			if (this._eachValues !== void 0 && this._eachValues !== null && accum !== INTERNAL) this._eachValues.push(accum);
		};
		ReductionPromiseArray.prototype._eachComplete = function(value) {
			if (this._eachValues !== null) this._eachValues.push(value);
			return this._eachValues;
		};
		ReductionPromiseArray.prototype._init = function() {};
		ReductionPromiseArray.prototype._resolveEmptyArray = function() {
			this._resolve(this._eachValues !== void 0 ? this._eachValues : this._initialValue);
		};
		ReductionPromiseArray.prototype.shouldCopyValues = function() {
			return false;
		};
		ReductionPromiseArray.prototype._resolve = function(value) {
			this._promise._resolveCallback(value);
			this._values = null;
		};
		ReductionPromiseArray.prototype._resultCancelled = function(sender) {
			if (sender === this._initialValue) return this._cancel();
			if (this._isResolved()) return;
			this._resultCancelled$();
			if (this._currentCancellable instanceof Promise) this._currentCancellable.cancel();
			if (this._initialValue instanceof Promise) this._initialValue.cancel();
		};
		ReductionPromiseArray.prototype._iterate = function(values) {
			this._values = values;
			var value;
			var i;
			var length = values.length;
			if (this._initialValue !== void 0) {
				value = this._initialValue;
				i = 0;
			} else {
				value = Promise.resolve(values[0]);
				i = 1;
			}
			this._currentCancellable = value;
			if (!value.isRejected()) for (; i < length; ++i) {
				var ctx = {
					accum: null,
					value: values[i],
					index: i,
					length,
					array: this
				};
				value = value._then(gotAccum, void 0, void 0, ctx, void 0);
			}
			if (this._eachValues !== void 0) value = value._then(this._eachComplete, void 0, void 0, this, void 0);
			value._then(completed, completed, void 0, value, this);
		};
		Promise.prototype.reduce = function(fn, initialValue) {
			return reduce(this, fn, initialValue, null);
		};
		Promise.reduce = function(promises, fn, initialValue, _each) {
			return reduce(promises, fn, initialValue, _each);
		};
		function completed(valueOrReason, array) {
			if (this.isFulfilled()) array._resolve(valueOrReason);
			else array._reject(valueOrReason);
		}
		function reduce(promises, fn, initialValue, _each) {
			if (typeof fn !== "function") return apiRejection("expecting a function but got " + util.classString(fn));
			return new ReductionPromiseArray(promises, fn, initialValue, _each).promise();
		}
		function gotAccum(accum) {
			this.accum = accum;
			this.array._gotAccum(accum);
			var value = tryConvertToPromise(this.value, this.array._promise);
			if (value instanceof Promise) {
				this.array._currentCancellable = value;
				return value._then(gotValue, void 0, void 0, this, void 0);
			} else return gotValue.call(this, value);
		}
		function gotValue(value) {
			var array = this.array;
			var promise = array._promise;
			var fn = tryCatch(array._fn);
			promise._pushContext();
			var ret;
			if (array._eachValues !== void 0) ret = fn.call(promise._boundValue(), value, this.index, this.length);
			else ret = fn.call(promise._boundValue(), this.accum, value, this.index, this.length);
			if (ret instanceof Promise) array._currentCancellable = ret;
			var promiseCreated = promise._popContext();
			debug.checkForgottenReturns(ret, promiseCreated, array._eachValues !== void 0 ? "Promise.each" : "Promise.reduce", promise);
			return ret;
		}
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/settle.js
var require_settle = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, PromiseArray, debug) {
		var PromiseInspection = Promise.PromiseInspection;
		var util = require_util();
		function SettledPromiseArray(values) {
			this.constructor$(values);
		}
		util.inherits(SettledPromiseArray, PromiseArray);
		SettledPromiseArray.prototype._promiseResolved = function(index, inspection) {
			this._values[index] = inspection;
			if (++this._totalResolved >= this._length) {
				this._resolve(this._values);
				return true;
			}
			return false;
		};
		SettledPromiseArray.prototype._promiseFulfilled = function(value, index) {
			var ret = new PromiseInspection();
			ret._bitField = 33554432;
			ret._settledValueField = value;
			return this._promiseResolved(index, ret);
		};
		SettledPromiseArray.prototype._promiseRejected = function(reason, index) {
			var ret = new PromiseInspection();
			ret._bitField = 16777216;
			ret._settledValueField = reason;
			return this._promiseResolved(index, ret);
		};
		Promise.settle = function(promises) {
			debug.deprecated(".settle()", ".reflect()");
			return new SettledPromiseArray(promises).promise();
		};
		Promise.prototype.settle = function() {
			return Promise.settle(this);
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/some.js
var require_some = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, PromiseArray, apiRejection) {
		var util = require_util();
		var RangeError = require_errors$1().RangeError;
		var AggregateError = require_errors$1().AggregateError;
		var isArray = util.isArray;
		var CANCELLATION = {};
		function SomePromiseArray(values) {
			this.constructor$(values);
			this._howMany = 0;
			this._unwrap = false;
			this._initialized = false;
		}
		util.inherits(SomePromiseArray, PromiseArray);
		SomePromiseArray.prototype._init = function() {
			if (!this._initialized) return;
			if (this._howMany === 0) {
				this._resolve([]);
				return;
			}
			this._init$(void 0, -5);
			var isArrayResolved = isArray(this._values);
			if (!this._isResolved() && isArrayResolved && this._howMany > this._canPossiblyFulfill()) this._reject(this._getRangeError(this.length()));
		};
		SomePromiseArray.prototype.init = function() {
			this._initialized = true;
			this._init();
		};
		SomePromiseArray.prototype.setUnwrap = function() {
			this._unwrap = true;
		};
		SomePromiseArray.prototype.howMany = function() {
			return this._howMany;
		};
		SomePromiseArray.prototype.setHowMany = function(count) {
			this._howMany = count;
		};
		SomePromiseArray.prototype._promiseFulfilled = function(value) {
			this._addFulfilled(value);
			if (this._fulfilled() === this.howMany()) {
				this._values.length = this.howMany();
				if (this.howMany() === 1 && this._unwrap) this._resolve(this._values[0]);
				else this._resolve(this._values);
				return true;
			}
			return false;
		};
		SomePromiseArray.prototype._promiseRejected = function(reason) {
			this._addRejected(reason);
			return this._checkOutcome();
		};
		SomePromiseArray.prototype._promiseCancelled = function() {
			if (this._values instanceof Promise || this._values == null) return this._cancel();
			this._addRejected(CANCELLATION);
			return this._checkOutcome();
		};
		SomePromiseArray.prototype._checkOutcome = function() {
			if (this.howMany() > this._canPossiblyFulfill()) {
				var e = new AggregateError();
				for (var i = this.length(); i < this._values.length; ++i) if (this._values[i] !== CANCELLATION) e.push(this._values[i]);
				if (e.length > 0) this._reject(e);
				else this._cancel();
				return true;
			}
			return false;
		};
		SomePromiseArray.prototype._fulfilled = function() {
			return this._totalResolved;
		};
		SomePromiseArray.prototype._rejected = function() {
			return this._values.length - this.length();
		};
		SomePromiseArray.prototype._addRejected = function(reason) {
			this._values.push(reason);
		};
		SomePromiseArray.prototype._addFulfilled = function(value) {
			this._values[this._totalResolved++] = value;
		};
		SomePromiseArray.prototype._canPossiblyFulfill = function() {
			return this.length() - this._rejected();
		};
		SomePromiseArray.prototype._getRangeError = function(count) {
			return new RangeError("Input array must contain at least " + this._howMany + " items but contains only " + count + " items");
		};
		SomePromiseArray.prototype._resolveEmptyArray = function() {
			this._reject(this._getRangeError(0));
		};
		function some(promises, howMany) {
			if ((howMany | 0) !== howMany || howMany < 0) return apiRejection("expecting a positive integer\n\n    See http://goo.gl/MqrFmX\n");
			var ret = new SomePromiseArray(promises);
			var promise = ret.promise();
			ret.setHowMany(howMany);
			ret.init();
			return promise;
		}
		Promise.some = function(promises, howMany) {
			return some(promises, howMany);
		};
		Promise.prototype.some = function(howMany) {
			return some(this, howMany);
		};
		Promise._SomePromiseArray = SomePromiseArray;
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/filter.js
var require_filter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, INTERNAL) {
		var PromiseMap = Promise.map;
		Promise.prototype.filter = function(fn, options) {
			return PromiseMap(this, fn, options, INTERNAL);
		};
		Promise.filter = function(promises, fn, options) {
			return PromiseMap(promises, fn, options, INTERNAL);
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/each.js
var require_each = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise, INTERNAL) {
		var PromiseReduce = Promise.reduce;
		var PromiseAll = Promise.all;
		function promiseAllThis() {
			return PromiseAll(this);
		}
		function PromiseMapSeries(promises, fn) {
			return PromiseReduce(promises, fn, INTERNAL, INTERNAL);
		}
		Promise.prototype.each = function(fn) {
			return PromiseReduce(this, fn, INTERNAL, 0)._then(promiseAllThis, void 0, void 0, this, void 0);
		};
		Promise.prototype.mapSeries = function(fn) {
			return PromiseReduce(this, fn, INTERNAL, INTERNAL);
		};
		Promise.each = function(promises, fn) {
			return PromiseReduce(promises, fn, INTERNAL, 0)._then(promiseAllThis, void 0, void 0, promises, void 0);
		};
		Promise.mapSeries = PromiseMapSeries;
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/any.js
var require_any = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(Promise) {
		var SomePromiseArray = Promise._SomePromiseArray;
		function any(promises) {
			var ret = new SomePromiseArray(promises);
			var promise = ret.promise();
			ret.setHowMany(1);
			ret.setUnwrap();
			ret.init();
			return promise;
		}
		Promise.any = function(promises) {
			return any(promises);
		};
		Promise.prototype.any = function() {
			return any(this);
		};
	};
}));
//#endregion
//#region node_modules/bluebird/js/release/promise.js
var require_promise = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function() {
		var makeSelfResolutionError = function() {
			return new TypeError("circular promise resolution chain\n\n    See http://goo.gl/MqrFmX\n");
		};
		var reflectHandler = function() {
			return new Promise.PromiseInspection(this._target());
		};
		var apiRejection = function(msg) {
			return Promise.reject(new TypeError(msg));
		};
		function Proxyable() {}
		var UNDEFINED_BINDING = {};
		var util = require_util();
		var getDomain;
		if (util.isNode) getDomain = function() {
			var ret = process.domain;
			if (ret === void 0) ret = null;
			return ret;
		};
		else getDomain = function() {
			return null;
		};
		util.notEnumerableProp(Promise, "_getDomain", getDomain);
		var es5 = require_es5();
		var Async = require_async();
		var async = new Async();
		es5.defineProperty(Promise, "_async", { value: async });
		var errors = require_errors$1();
		var TypeError = Promise.TypeError = errors.TypeError;
		Promise.RangeError = errors.RangeError;
		var CancellationError = Promise.CancellationError = errors.CancellationError;
		Promise.TimeoutError = errors.TimeoutError;
		Promise.OperationalError = errors.OperationalError;
		Promise.RejectionError = errors.OperationalError;
		Promise.AggregateError = errors.AggregateError;
		var INTERNAL = function() {};
		var APPLY = {};
		var NEXT_FILTER = {};
		var tryConvertToPromise = require_thenables()(Promise, INTERNAL);
		var PromiseArray = require_promise_array()(Promise, INTERNAL, tryConvertToPromise, apiRejection, Proxyable);
		var Context = require_context()(Promise);
		var createContext = Context.create;
		var debug = require_debuggability()(Promise, Context);
		debug.CapturedTrace;
		var PassThroughHandlerContext = require_finally()(Promise, tryConvertToPromise);
		var catchFilter = require_catch_filter()(NEXT_FILTER);
		var nodebackForPromise = require_nodeback();
		var errorObj = util.errorObj;
		var tryCatch = util.tryCatch;
		function check(self, executor) {
			if (typeof executor !== "function") throw new TypeError("expecting a function but got " + util.classString(executor));
			if (self.constructor !== Promise) throw new TypeError("the promise constructor cannot be invoked directly\n\n    See http://goo.gl/MqrFmX\n");
		}
		function Promise(executor) {
			this._bitField = 0;
			this._fulfillmentHandler0 = void 0;
			this._rejectionHandler0 = void 0;
			this._promise0 = void 0;
			this._receiver0 = void 0;
			if (executor !== INTERNAL) {
				check(this, executor);
				this._resolveFromExecutor(executor);
			}
			this._promiseCreated();
			this._fireEvent("promiseCreated", this);
		}
		Promise.prototype.toString = function() {
			return "[object Promise]";
		};
		Promise.prototype.caught = Promise.prototype["catch"] = function(fn) {
			var len = arguments.length;
			if (len > 1) {
				var catchInstances = new Array(len - 1), j = 0, i;
				for (i = 0; i < len - 1; ++i) {
					var item = arguments[i];
					if (util.isObject(item)) catchInstances[j++] = item;
					else return apiRejection("expecting an object but got A catch statement predicate " + util.classString(item));
				}
				catchInstances.length = j;
				fn = arguments[i];
				return this.then(void 0, catchFilter(catchInstances, fn, this));
			}
			return this.then(void 0, fn);
		};
		Promise.prototype.reflect = function() {
			return this._then(reflectHandler, reflectHandler, void 0, this, void 0);
		};
		Promise.prototype.then = function(didFulfill, didReject) {
			if (debug.warnings() && arguments.length > 0 && typeof didFulfill !== "function" && typeof didReject !== "function") {
				var msg = ".then() only accepts functions but was passed: " + util.classString(didFulfill);
				if (arguments.length > 1) msg += ", " + util.classString(didReject);
				this._warn(msg);
			}
			return this._then(didFulfill, didReject, void 0, void 0, void 0);
		};
		Promise.prototype.done = function(didFulfill, didReject) {
			this._then(didFulfill, didReject, void 0, void 0, void 0)._setIsFinal();
		};
		Promise.prototype.spread = function(fn) {
			if (typeof fn !== "function") return apiRejection("expecting a function but got " + util.classString(fn));
			return this.all()._then(fn, void 0, void 0, APPLY, void 0);
		};
		Promise.prototype.toJSON = function() {
			var ret = {
				isFulfilled: false,
				isRejected: false,
				fulfillmentValue: void 0,
				rejectionReason: void 0
			};
			if (this.isFulfilled()) {
				ret.fulfillmentValue = this.value();
				ret.isFulfilled = true;
			} else if (this.isRejected()) {
				ret.rejectionReason = this.reason();
				ret.isRejected = true;
			}
			return ret;
		};
		Promise.prototype.all = function() {
			if (arguments.length > 0) this._warn(".all() was passed arguments but it does not take any");
			return new PromiseArray(this).promise();
		};
		Promise.prototype.error = function(fn) {
			return this.caught(util.originatesFromRejection, fn);
		};
		Promise.getNewLibraryCopy = module.exports;
		Promise.is = function(val) {
			return val instanceof Promise;
		};
		Promise.fromNode = Promise.fromCallback = function(fn) {
			var ret = new Promise(INTERNAL);
			ret._captureStackTrace();
			var multiArgs = arguments.length > 1 ? !!Object(arguments[1]).multiArgs : false;
			var result = tryCatch(fn)(nodebackForPromise(ret, multiArgs));
			if (result === errorObj) ret._rejectCallback(result.e, true);
			if (!ret._isFateSealed()) ret._setAsyncGuaranteed();
			return ret;
		};
		Promise.all = function(promises) {
			return new PromiseArray(promises).promise();
		};
		Promise.cast = function(obj) {
			var ret = tryConvertToPromise(obj);
			if (!(ret instanceof Promise)) {
				ret = new Promise(INTERNAL);
				ret._captureStackTrace();
				ret._setFulfilled();
				ret._rejectionHandler0 = obj;
			}
			return ret;
		};
		Promise.resolve = Promise.fulfilled = Promise.cast;
		Promise.reject = Promise.rejected = function(reason) {
			var ret = new Promise(INTERNAL);
			ret._captureStackTrace();
			ret._rejectCallback(reason, true);
			return ret;
		};
		Promise.setScheduler = function(fn) {
			if (typeof fn !== "function") throw new TypeError("expecting a function but got " + util.classString(fn));
			return async.setScheduler(fn);
		};
		Promise.prototype._then = function(didFulfill, didReject, _, receiver, internalData) {
			var haveInternalData = internalData !== void 0;
			var promise = haveInternalData ? internalData : new Promise(INTERNAL);
			var target = this._target();
			var bitField = target._bitField;
			if (!haveInternalData) {
				promise._propagateFrom(this, 3);
				promise._captureStackTrace();
				if (receiver === void 0 && (this._bitField & 2097152) !== 0) if (!((bitField & 50397184) === 0)) receiver = this._boundValue();
				else receiver = target === this ? void 0 : this._boundTo;
				this._fireEvent("promiseChained", this, promise);
			}
			var domain = getDomain();
			if (!((bitField & 50397184) === 0)) {
				var handler, value, settler = target._settlePromiseCtx;
				if ((bitField & 33554432) !== 0) {
					value = target._rejectionHandler0;
					handler = didFulfill;
				} else if ((bitField & 16777216) !== 0) {
					value = target._fulfillmentHandler0;
					handler = didReject;
					target._unsetRejectionIsUnhandled();
				} else {
					settler = target._settlePromiseLateCancellationObserver;
					value = new CancellationError("late cancellation observer");
					target._attachExtraTrace(value);
					handler = didReject;
				}
				async.invoke(settler, target, {
					handler: domain === null ? handler : typeof handler === "function" && util.domainBind(domain, handler),
					promise,
					receiver,
					value
				});
			} else target._addCallbacks(didFulfill, didReject, promise, receiver, domain);
			return promise;
		};
		Promise.prototype._length = function() {
			return this._bitField & 65535;
		};
		Promise.prototype._isFateSealed = function() {
			return (this._bitField & 117506048) !== 0;
		};
		Promise.prototype._isFollowing = function() {
			return (this._bitField & 67108864) === 67108864;
		};
		Promise.prototype._setLength = function(len) {
			this._bitField = this._bitField & -65536 | len & 65535;
		};
		Promise.prototype._setFulfilled = function() {
			this._bitField = this._bitField | 33554432;
			this._fireEvent("promiseFulfilled", this);
		};
		Promise.prototype._setRejected = function() {
			this._bitField = this._bitField | 16777216;
			this._fireEvent("promiseRejected", this);
		};
		Promise.prototype._setFollowing = function() {
			this._bitField = this._bitField | 67108864;
			this._fireEvent("promiseResolved", this);
		};
		Promise.prototype._setIsFinal = function() {
			this._bitField = this._bitField | 4194304;
		};
		Promise.prototype._isFinal = function() {
			return (this._bitField & 4194304) > 0;
		};
		Promise.prototype._unsetCancelled = function() {
			this._bitField = this._bitField & -65537;
		};
		Promise.prototype._setCancelled = function() {
			this._bitField = this._bitField | 65536;
			this._fireEvent("promiseCancelled", this);
		};
		Promise.prototype._setWillBeCancelled = function() {
			this._bitField = this._bitField | 8388608;
		};
		Promise.prototype._setAsyncGuaranteed = function() {
			if (async.hasCustomScheduler()) return;
			this._bitField = this._bitField | 134217728;
		};
		Promise.prototype._receiverAt = function(index) {
			var ret = index === 0 ? this._receiver0 : this[index * 4 - 4 + 3];
			if (ret === UNDEFINED_BINDING) return;
			else if (ret === void 0 && this._isBound()) return this._boundValue();
			return ret;
		};
		Promise.prototype._promiseAt = function(index) {
			return this[index * 4 - 4 + 2];
		};
		Promise.prototype._fulfillmentHandlerAt = function(index) {
			return this[index * 4 - 4 + 0];
		};
		Promise.prototype._rejectionHandlerAt = function(index) {
			return this[index * 4 - 4 + 1];
		};
		Promise.prototype._boundValue = function() {};
		Promise.prototype._migrateCallback0 = function(follower) {
			follower._bitField;
			var fulfill = follower._fulfillmentHandler0;
			var reject = follower._rejectionHandler0;
			var promise = follower._promise0;
			var receiver = follower._receiverAt(0);
			if (receiver === void 0) receiver = UNDEFINED_BINDING;
			this._addCallbacks(fulfill, reject, promise, receiver, null);
		};
		Promise.prototype._migrateCallbackAt = function(follower, index) {
			var fulfill = follower._fulfillmentHandlerAt(index);
			var reject = follower._rejectionHandlerAt(index);
			var promise = follower._promiseAt(index);
			var receiver = follower._receiverAt(index);
			if (receiver === void 0) receiver = UNDEFINED_BINDING;
			this._addCallbacks(fulfill, reject, promise, receiver, null);
		};
		Promise.prototype._addCallbacks = function(fulfill, reject, promise, receiver, domain) {
			var index = this._length();
			if (index >= 65531) {
				index = 0;
				this._setLength(0);
			}
			if (index === 0) {
				this._promise0 = promise;
				this._receiver0 = receiver;
				if (typeof fulfill === "function") this._fulfillmentHandler0 = domain === null ? fulfill : util.domainBind(domain, fulfill);
				if (typeof reject === "function") this._rejectionHandler0 = domain === null ? reject : util.domainBind(domain, reject);
			} else {
				var base = index * 4 - 4;
				this[base + 2] = promise;
				this[base + 3] = receiver;
				if (typeof fulfill === "function") this[base + 0] = domain === null ? fulfill : util.domainBind(domain, fulfill);
				if (typeof reject === "function") this[base + 1] = domain === null ? reject : util.domainBind(domain, reject);
			}
			this._setLength(index + 1);
			return index;
		};
		Promise.prototype._proxy = function(proxyable, arg) {
			this._addCallbacks(void 0, void 0, arg, proxyable, null);
		};
		Promise.prototype._resolveCallback = function(value, shouldBind) {
			if ((this._bitField & 117506048) !== 0) return;
			if (value === this) return this._rejectCallback(makeSelfResolutionError(), false);
			var maybePromise = tryConvertToPromise(value, this);
			if (!(maybePromise instanceof Promise)) return this._fulfill(value);
			if (shouldBind) this._propagateFrom(maybePromise, 2);
			var promise = maybePromise._target();
			if (promise === this) {
				this._reject(makeSelfResolutionError());
				return;
			}
			var bitField = promise._bitField;
			if ((bitField & 50397184) === 0) {
				var len = this._length();
				if (len > 0) promise._migrateCallback0(this);
				for (var i = 1; i < len; ++i) promise._migrateCallbackAt(this, i);
				this._setFollowing();
				this._setLength(0);
				this._setFollowee(promise);
			} else if ((bitField & 33554432) !== 0) this._fulfill(promise._value());
			else if ((bitField & 16777216) !== 0) this._reject(promise._reason());
			else {
				var reason = new CancellationError("late cancellation observer");
				promise._attachExtraTrace(reason);
				this._reject(reason);
			}
		};
		Promise.prototype._rejectCallback = function(reason, synchronous, ignoreNonErrorWarnings) {
			var trace = util.ensureErrorObject(reason);
			var hasStack = trace === reason;
			if (!hasStack && !ignoreNonErrorWarnings && debug.warnings()) {
				var message = "a promise was rejected with a non-error: " + util.classString(reason);
				this._warn(message, true);
			}
			this._attachExtraTrace(trace, synchronous ? hasStack : false);
			this._reject(reason);
		};
		Promise.prototype._resolveFromExecutor = function(executor) {
			var promise = this;
			this._captureStackTrace();
			this._pushContext();
			var synchronous = true;
			var r = this._execute(executor, function(value) {
				promise._resolveCallback(value);
			}, function(reason) {
				promise._rejectCallback(reason, synchronous);
			});
			synchronous = false;
			this._popContext();
			if (r !== void 0) promise._rejectCallback(r, true);
		};
		Promise.prototype._settlePromiseFromHandler = function(handler, receiver, value, promise) {
			var bitField = promise._bitField;
			if ((bitField & 65536) !== 0) return;
			promise._pushContext();
			var x;
			if (receiver === APPLY) if (!value || typeof value.length !== "number") {
				x = errorObj;
				x.e = new TypeError("cannot .spread() a non-array: " + util.classString(value));
			} else x = tryCatch(handler).apply(this._boundValue(), value);
			else x = tryCatch(handler).call(receiver, value);
			var promiseCreated = promise._popContext();
			bitField = promise._bitField;
			if ((bitField & 65536) !== 0) return;
			if (x === NEXT_FILTER) promise._reject(value);
			else if (x === errorObj) promise._rejectCallback(x.e, false);
			else {
				debug.checkForgottenReturns(x, promiseCreated, "", promise, this);
				promise._resolveCallback(x);
			}
		};
		Promise.prototype._target = function() {
			var ret = this;
			while (ret._isFollowing()) ret = ret._followee();
			return ret;
		};
		Promise.prototype._followee = function() {
			return this._rejectionHandler0;
		};
		Promise.prototype._setFollowee = function(promise) {
			this._rejectionHandler0 = promise;
		};
		Promise.prototype._settlePromise = function(promise, handler, receiver, value) {
			var isPromise = promise instanceof Promise;
			var bitField = this._bitField;
			var asyncGuaranteed = (bitField & 134217728) !== 0;
			if ((bitField & 65536) !== 0) {
				if (isPromise) promise._invokeInternalOnCancel();
				if (receiver instanceof PassThroughHandlerContext && receiver.isFinallyHandler()) {
					receiver.cancelPromise = promise;
					if (tryCatch(handler).call(receiver, value) === errorObj) promise._reject(errorObj.e);
				} else if (handler === reflectHandler) promise._fulfill(reflectHandler.call(receiver));
				else if (receiver instanceof Proxyable) receiver._promiseCancelled(promise);
				else if (isPromise || promise instanceof PromiseArray) promise._cancel();
				else receiver.cancel();
			} else if (typeof handler === "function") if (!isPromise) handler.call(receiver, value, promise);
			else {
				if (asyncGuaranteed) promise._setAsyncGuaranteed();
				this._settlePromiseFromHandler(handler, receiver, value, promise);
			}
			else if (receiver instanceof Proxyable) {
				if (!receiver._isResolved()) if ((bitField & 33554432) !== 0) receiver._promiseFulfilled(value, promise);
				else receiver._promiseRejected(value, promise);
			} else if (isPromise) {
				if (asyncGuaranteed) promise._setAsyncGuaranteed();
				if ((bitField & 33554432) !== 0) promise._fulfill(value);
				else promise._reject(value);
			}
		};
		Promise.prototype._settlePromiseLateCancellationObserver = function(ctx) {
			var handler = ctx.handler;
			var promise = ctx.promise;
			var receiver = ctx.receiver;
			var value = ctx.value;
			if (typeof handler === "function") if (!(promise instanceof Promise)) handler.call(receiver, value, promise);
			else this._settlePromiseFromHandler(handler, receiver, value, promise);
			else if (promise instanceof Promise) promise._reject(value);
		};
		Promise.prototype._settlePromiseCtx = function(ctx) {
			this._settlePromise(ctx.promise, ctx.handler, ctx.receiver, ctx.value);
		};
		Promise.prototype._settlePromise0 = function(handler, value, bitField) {
			var promise = this._promise0;
			var receiver = this._receiverAt(0);
			this._promise0 = void 0;
			this._receiver0 = void 0;
			this._settlePromise(promise, handler, receiver, value);
		};
		Promise.prototype._clearCallbackDataAtIndex = function(index) {
			var base = index * 4 - 4;
			this[base + 2] = this[base + 3] = this[base + 0] = this[base + 1] = void 0;
		};
		Promise.prototype._fulfill = function(value) {
			var bitField = this._bitField;
			if ((bitField & 117506048) >>> 16) return;
			if (value === this) {
				var err = makeSelfResolutionError();
				this._attachExtraTrace(err);
				return this._reject(err);
			}
			this._setFulfilled();
			this._rejectionHandler0 = value;
			if ((bitField & 65535) > 0) if ((bitField & 134217728) !== 0) this._settlePromises();
			else async.settlePromises(this);
		};
		Promise.prototype._reject = function(reason) {
			var bitField = this._bitField;
			if ((bitField & 117506048) >>> 16) return;
			this._setRejected();
			this._fulfillmentHandler0 = reason;
			if (this._isFinal()) return async.fatalError(reason, util.isNode);
			if ((bitField & 65535) > 0) async.settlePromises(this);
			else this._ensurePossibleRejectionHandled();
		};
		Promise.prototype._fulfillPromises = function(len, value) {
			for (var i = 1; i < len; i++) {
				var handler = this._fulfillmentHandlerAt(i);
				var promise = this._promiseAt(i);
				var receiver = this._receiverAt(i);
				this._clearCallbackDataAtIndex(i);
				this._settlePromise(promise, handler, receiver, value);
			}
		};
		Promise.prototype._rejectPromises = function(len, reason) {
			for (var i = 1; i < len; i++) {
				var handler = this._rejectionHandlerAt(i);
				var promise = this._promiseAt(i);
				var receiver = this._receiverAt(i);
				this._clearCallbackDataAtIndex(i);
				this._settlePromise(promise, handler, receiver, reason);
			}
		};
		Promise.prototype._settlePromises = function() {
			var bitField = this._bitField;
			var len = bitField & 65535;
			if (len > 0) {
				if ((bitField & 16842752) !== 0) {
					var reason = this._fulfillmentHandler0;
					this._settlePromise0(this._rejectionHandler0, reason, bitField);
					this._rejectPromises(len, reason);
				} else {
					var value = this._rejectionHandler0;
					this._settlePromise0(this._fulfillmentHandler0, value, bitField);
					this._fulfillPromises(len, value);
				}
				this._setLength(0);
			}
			this._clearCancellationData();
		};
		Promise.prototype._settledValue = function() {
			var bitField = this._bitField;
			if ((bitField & 33554432) !== 0) return this._rejectionHandler0;
			else if ((bitField & 16777216) !== 0) return this._fulfillmentHandler0;
		};
		function deferResolve(v) {
			this.promise._resolveCallback(v);
		}
		function deferReject(v) {
			this.promise._rejectCallback(v, false);
		}
		Promise.defer = Promise.pending = function() {
			debug.deprecated("Promise.defer", "new Promise");
			return {
				promise: new Promise(INTERNAL),
				resolve: deferResolve,
				reject: deferReject
			};
		};
		util.notEnumerableProp(Promise, "_makeSelfResolutionError", makeSelfResolutionError);
		require_method()(Promise, INTERNAL, tryConvertToPromise, apiRejection, debug);
		require_bind()(Promise, INTERNAL, tryConvertToPromise, debug);
		require_cancel()(Promise, PromiseArray, apiRejection, debug);
		require_direct_resolve()(Promise);
		require_synchronous_inspection()(Promise);
		require_join()(Promise, PromiseArray, tryConvertToPromise, INTERNAL, async, getDomain);
		Promise.Promise = Promise;
		Promise.version = "3.4.7";
		require_map()(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
		require_call_get()(Promise);
		require_using()(Promise, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug);
		require_timers()(Promise, INTERNAL, debug);
		require_generators()(Promise, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug);
		require_nodeify()(Promise);
		require_promisify()(Promise, INTERNAL);
		require_props()(Promise, PromiseArray, tryConvertToPromise, apiRejection);
		require_race()(Promise, INTERNAL, tryConvertToPromise, apiRejection);
		require_reduce()(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
		require_settle()(Promise, PromiseArray, debug);
		require_some()(Promise, PromiseArray, apiRejection);
		require_filter()(Promise, INTERNAL);
		require_each()(Promise, INTERNAL);
		require_any()(Promise);
		util.toFastProperties(Promise);
		util.toFastProperties(Promise.prototype);
		function fillTypes(value) {
			var p = new Promise(INTERNAL);
			p._fulfillmentHandler0 = value;
			p._rejectionHandler0 = value;
			p._promise0 = value;
			p._receiver0 = value;
		}
		fillTypes({ a: 1 });
		fillTypes({ b: 2 });
		fillTypes({ c: 3 });
		fillTypes(1);
		fillTypes(function() {});
		fillTypes(void 0);
		fillTypes(false);
		fillTypes(new Promise(INTERNAL));
		debug.setBounds(Async.firstLineError, util.lastLineError);
		return Promise;
	};
}));
//#endregion
//#region node_modules/mammoth/lib/promises.js
var require_promises = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var bluebird = require_promise()();
	exports.defer = defer;
	exports.when = bluebird.resolve;
	exports.resolve = bluebird.resolve;
	exports.all = bluebird.all;
	exports.props = bluebird.props;
	exports.reject = bluebird.reject;
	exports.promisify = bluebird.promisify;
	exports.mapSeries = bluebird.mapSeries;
	exports.attempt = bluebird.attempt;
	exports.nfcall = function(func) {
		var args = Array.prototype.slice.call(arguments, 1);
		return bluebird.promisify(func).apply(null, args);
	};
	bluebird.prototype.fail = bluebird.prototype.caught;
	bluebird.prototype.also = function(func) {
		return this.then(function(value) {
			var returnValue = _.extend({}, value, func(value));
			return bluebird.props(returnValue);
		});
	};
	function defer() {
		var resolve;
		var reject;
		var promise = new bluebird.Promise(function(resolveArg, rejectArg) {
			resolve = resolveArg;
			reject = rejectArg;
		});
		return {
			resolve,
			reject,
			promise
		};
	}
}));
//#endregion
//#region node_modules/mammoth/lib/documents.js
var require_documents = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var types = exports.types = {
		document: "document",
		paragraph: "paragraph",
		run: "run",
		text: "text",
		tab: "tab",
		checkbox: "checkbox",
		hyperlink: "hyperlink",
		noteReference: "noteReference",
		image: "image",
		note: "note",
		commentReference: "commentReference",
		comment: "comment",
		table: "table",
		tableRow: "tableRow",
		tableCell: "tableCell",
		"break": "break",
		bookmarkStart: "bookmarkStart"
	};
	function Document(children, options) {
		options = options || {};
		return {
			type: types.document,
			children,
			notes: options.notes || new Notes({}),
			comments: options.comments || []
		};
	}
	function Paragraph(children, properties) {
		properties = properties || {};
		var indent = properties.indent || {};
		return {
			type: types.paragraph,
			children,
			styleId: properties.styleId || null,
			styleName: properties.styleName || null,
			numbering: properties.numbering || null,
			alignment: properties.alignment || null,
			indent: {
				start: indent.start || null,
				end: indent.end || null,
				firstLine: indent.firstLine || null,
				hanging: indent.hanging || null
			}
		};
	}
	function Run(children, properties) {
		properties = properties || {};
		return {
			type: types.run,
			children,
			styleId: properties.styleId || null,
			styleName: properties.styleName || null,
			isBold: !!properties.isBold,
			isUnderline: !!properties.isUnderline,
			isItalic: !!properties.isItalic,
			isStrikethrough: !!properties.isStrikethrough,
			isAllCaps: !!properties.isAllCaps,
			isSmallCaps: !!properties.isSmallCaps,
			verticalAlignment: properties.verticalAlignment || verticalAlignment.baseline,
			font: properties.font || null,
			fontSize: properties.fontSize || null,
			highlight: properties.highlight || null
		};
	}
	var verticalAlignment = {
		baseline: "baseline",
		superscript: "superscript",
		subscript: "subscript"
	};
	function Text(value) {
		return {
			type: types.text,
			value
		};
	}
	function Tab() {
		return { type: types.tab };
	}
	function Checkbox(options) {
		return {
			type: types.checkbox,
			checked: options.checked
		};
	}
	function Hyperlink(children, options) {
		return {
			type: types.hyperlink,
			children,
			href: options.href,
			anchor: options.anchor,
			targetFrame: options.targetFrame
		};
	}
	function NoteReference(options) {
		return {
			type: types.noteReference,
			noteType: options.noteType,
			noteId: options.noteId
		};
	}
	function Notes(notes) {
		this._notes = _.indexBy(notes, function(note) {
			return noteKey(note.noteType, note.noteId);
		});
	}
	Notes.prototype.resolve = function(reference) {
		return this.findNoteByKey(noteKey(reference.noteType, reference.noteId));
	};
	Notes.prototype.findNoteByKey = function(key) {
		return this._notes[key] || null;
	};
	function Note(options) {
		return {
			type: types.note,
			noteType: options.noteType,
			noteId: options.noteId,
			body: options.body
		};
	}
	function commentReference(options) {
		return {
			type: types.commentReference,
			commentId: options.commentId
		};
	}
	function comment(options) {
		return {
			type: types.comment,
			commentId: options.commentId,
			body: options.body,
			authorName: options.authorName,
			authorInitials: options.authorInitials
		};
	}
	function noteKey(noteType, id) {
		return noteType + "-" + id;
	}
	function Image(options) {
		return {
			type: types.image,
			read: function(encoding) {
				if (encoding) return options.readImage(encoding);
				else return options.readImage().then(function(arrayBuffer) {
					return Buffer.from(arrayBuffer);
				});
			},
			readAsArrayBuffer: function() {
				return options.readImage();
			},
			readAsBase64String: function() {
				return options.readImage("base64");
			},
			readAsBuffer: function() {
				return options.readImage().then(function(arrayBuffer) {
					return Buffer.from(arrayBuffer);
				});
			},
			altText: options.altText,
			contentType: options.contentType
		};
	}
	function Table(children, properties) {
		properties = properties || {};
		return {
			type: types.table,
			children,
			styleId: properties.styleId || null,
			styleName: properties.styleName || null
		};
	}
	function TableRow(children, options) {
		options = options || {};
		return {
			type: types.tableRow,
			children,
			isHeader: options.isHeader || false
		};
	}
	function TableCell(children, options) {
		options = options || {};
		return {
			type: types.tableCell,
			children,
			colSpan: options.colSpan == null ? 1 : options.colSpan,
			rowSpan: options.rowSpan == null ? 1 : options.rowSpan
		};
	}
	function Break(breakType) {
		return {
			type: types["break"],
			breakType
		};
	}
	function BookmarkStart(options) {
		return {
			type: types.bookmarkStart,
			name: options.name
		};
	}
	exports.document = exports.Document = Document;
	exports.paragraph = exports.Paragraph = Paragraph;
	exports.run = exports.Run = Run;
	exports.text = exports.Text = Text;
	exports.tab = exports.Tab = Tab;
	exports.checkbox = exports.Checkbox = Checkbox;
	exports.Hyperlink = Hyperlink;
	exports.noteReference = exports.NoteReference = NoteReference;
	exports.Notes = Notes;
	exports.Note = Note;
	exports.commentReference = commentReference;
	exports.comment = comment;
	exports.Image = Image;
	exports.Table = Table;
	exports.TableRow = TableRow;
	exports.TableCell = TableCell;
	exports.lineBreak = Break("line");
	exports.pageBreak = Break("page");
	exports.columnBreak = Break("column");
	exports.BookmarkStart = BookmarkStart;
	exports.verticalAlignment = verticalAlignment;
}));
//#endregion
//#region node_modules/mammoth/lib/results.js
var require_results = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	exports.Result = Result;
	exports.success = success;
	exports.warning = warning;
	exports.error = error;
	function Result(value, messages) {
		this.value = value;
		this.messages = messages || [];
	}
	Result.prototype.map = function(func) {
		return new Result(func(this.value), this.messages);
	};
	Result.prototype.flatMap = function(func) {
		var funcResult = func(this.value);
		return new Result(funcResult.value, combineMessages([this, funcResult]));
	};
	Result.prototype.flatMapThen = function(func) {
		var that = this;
		return func(this.value).then(function(otherResult) {
			return new Result(otherResult.value, combineMessages([that, otherResult]));
		});
	};
	Result.combine = function(results) {
		return new Result(_.flatten(_.pluck(results, "value")), combineMessages(results));
	};
	function success(value) {
		return new Result(value, []);
	}
	function warning(message) {
		return {
			type: "warning",
			message
		};
	}
	function error(exception) {
		return {
			type: "error",
			message: exception.message,
			error: exception
		};
	}
	function combineMessages(results) {
		var messages = [];
		_.flatten(_.pluck(results, "messages"), true).forEach(function(message) {
			if (!containsMessage(messages, message)) messages.push(message);
		});
		return messages;
	}
	function containsMessage(messages, message) {
		return _.find(messages, isSameMessage.bind(null, message)) !== void 0;
	}
	function isSameMessage(first, second) {
		return first.type === second.type && first.message === second.message;
	}
}));
//#endregion
//#region node_modules/base64-js/index.js
var require_base64_js = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.byteLength = byteLength;
	exports.toByteArray = toByteArray;
	exports.fromByteArray = fromByteArray;
	var lookup = [];
	var revLookup = [];
	var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
	var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	for (var i = 0, len = code.length; i < len; ++i) {
		lookup[i] = code[i];
		revLookup[code.charCodeAt(i)] = i;
	}
	revLookup["-".charCodeAt(0)] = 62;
	revLookup["_".charCodeAt(0)] = 63;
	function getLens(b64) {
		var len = b64.length;
		if (len % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
		var validLen = b64.indexOf("=");
		if (validLen === -1) validLen = len;
		var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
		return [validLen, placeHoldersLen];
	}
	function byteLength(b64) {
		var lens = getLens(b64);
		var validLen = lens[0];
		var placeHoldersLen = lens[1];
		return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
	}
	function _byteLength(b64, validLen, placeHoldersLen) {
		return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
	}
	function toByteArray(b64) {
		var tmp;
		var lens = getLens(b64);
		var validLen = lens[0];
		var placeHoldersLen = lens[1];
		var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
		var curByte = 0;
		var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
		var i;
		for (i = 0; i < len; i += 4) {
			tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
			arr[curByte++] = tmp >> 16 & 255;
			arr[curByte++] = tmp >> 8 & 255;
			arr[curByte++] = tmp & 255;
		}
		if (placeHoldersLen === 2) {
			tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
			arr[curByte++] = tmp & 255;
		}
		if (placeHoldersLen === 1) {
			tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
			arr[curByte++] = tmp >> 8 & 255;
			arr[curByte++] = tmp & 255;
		}
		return arr;
	}
	function tripletToBase64(num) {
		return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
	}
	function encodeChunk(uint8, start, end) {
		var tmp;
		var output = [];
		for (var i = start; i < end; i += 3) {
			tmp = (uint8[i] << 16 & 16711680) + (uint8[i + 1] << 8 & 65280) + (uint8[i + 2] & 255);
			output.push(tripletToBase64(tmp));
		}
		return output.join("");
	}
	function fromByteArray(uint8) {
		var tmp;
		var len = uint8.length;
		var extraBytes = len % 3;
		var parts = [];
		var maxChunkLength = 16383;
		for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
		if (extraBytes === 1) {
			tmp = uint8[len - 1];
			parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "==");
		} else if (extraBytes === 2) {
			tmp = (uint8[len - 2] << 8) + uint8[len - 1];
			parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "=");
		}
		return parts.join("");
	}
}));
//#endregion
//#region node_modules/mammoth/lib/zipfile.js
var require_zipfile = /* @__PURE__ */ __commonJSMin(((exports) => {
	var base64js = require_base64_js();
	var JSZip = require_jszip_min();
	exports.openArrayBuffer = openArrayBuffer;
	exports.splitPath = splitPath;
	exports.joinPath = joinPath;
	function openArrayBuffer(arrayBuffer) {
		return JSZip.loadAsync(arrayBuffer).then(function(zipFile) {
			function exists(name) {
				return zipFile.file(name) !== null;
			}
			function read(name, encoding) {
				return zipFile.file(name).async("uint8array").then(function(array) {
					if (encoding === "base64") return base64js.fromByteArray(array);
					else if (encoding) return new TextDecoder(encoding).decode(array);
					else return array;
				});
			}
			function write(name, contents) {
				zipFile.file(name, contents);
			}
			function toArrayBuffer() {
				return zipFile.generateAsync({ type: "arraybuffer" });
			}
			return {
				exists,
				read,
				write,
				toArrayBuffer
			};
		});
	}
	function splitPath(path) {
		var lastIndex = path.lastIndexOf("/");
		if (lastIndex === -1) return {
			dirname: "",
			basename: path
		};
		else return {
			dirname: path.substring(0, lastIndex),
			basename: path.substring(lastIndex + 1)
		};
	}
	function joinPath() {
		var nonEmptyPaths = Array.prototype.filter.call(arguments, function(path) {
			return path;
		});
		var relevantPaths = [];
		nonEmptyPaths.forEach(function(path) {
			if (/^\//.test(path)) relevantPaths = [path];
			else relevantPaths.push(path);
		});
		return relevantPaths.join("/");
	}
}));
//#endregion
//#region node_modules/mammoth/lib/xml/nodes.js
var require_nodes = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	exports.Element = Element;
	exports.element = function(name, attributes, children) {
		return new Element(name, attributes, children);
	};
	exports.text = function(value) {
		return {
			type: "text",
			value
		};
	};
	var emptyElement = exports.emptyElement = {
		first: function() {
			return null;
		},
		firstOrEmpty: function() {
			return emptyElement;
		},
		attributes: {},
		children: []
	};
	function Element(name, attributes, children) {
		this.type = "element";
		this.name = name;
		this.attributes = attributes || {};
		this.children = children || [];
	}
	Element.prototype.first = function(name) {
		return _.find(this.children, function(child) {
			return child.name === name;
		});
	};
	Element.prototype.firstOrEmpty = function(name) {
		return this.first(name) || emptyElement;
	};
	Element.prototype.getElementsByTagName = function(name) {
		return toElementList(_.filter(this.children, function(child) {
			return child.name === name;
		}));
	};
	Element.prototype.text = function() {
		if (this.children.length === 0) return "";
		else if (this.children.length !== 1 || this.children[0].type !== "text") throw new Error("Not implemented");
		return this.children[0].value;
	};
	var elementListPrototype = { getElementsByTagName: function(name) {
		return toElementList(_.flatten(this.map(function(element) {
			return element.getElementsByTagName(name);
		}, true)));
	} };
	function toElementList(array) {
		return _.extend(array, elementListPrototype);
	}
}));
//#endregion
//#region node_modules/@xmldom/xmldom/lib/conventions.js
var require_conventions = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Ponyfill for `Array.prototype.find` which is only available in ES6 runtimes.
	*
	* Works with anything that has a `length` property and index access properties, including NodeList.
	*
	* @template {unknown} T
	* @param {Array<T> | ({length:number, [number]: T})} list
	* @param {function (item: T, index: number, list:Array<T> | ({length:number, [number]: T})):boolean} predicate
	* @param {Partial<Pick<ArrayConstructor['prototype'], 'find'>>?} ac `Array.prototype` by default,
	* 				allows injecting a custom implementation in tests
	* @returns {T | undefined}
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
	* @see https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.find
	*/
	function find(list, predicate, ac) {
		if (ac === void 0) ac = Array.prototype;
		if (list && typeof ac.find === "function") return ac.find.call(list, predicate);
		for (var i = 0; i < list.length; i++) if (Object.prototype.hasOwnProperty.call(list, i)) {
			var item = list[i];
			if (predicate.call(void 0, item, i, list)) return item;
		}
	}
	/**
	* "Shallow freezes" an object to render it immutable.
	* Uses `Object.freeze` if available,
	* otherwise the immutability is only in the type.
	*
	* Is used to create "enum like" objects.
	*
	* @template T
	* @param {T} object the object to freeze
	* @param {Pick<ObjectConstructor, 'freeze'> = Object} oc `Object` by default,
	* 				allows to inject custom object constructor for tests
	* @returns {Readonly<T>}
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
	*/
	function freeze(object, oc) {
		if (oc === void 0) oc = Object;
		return oc && typeof oc.freeze === "function" ? oc.freeze(object) : object;
	}
	/**
	* Since we can not rely on `Object.assign` we provide a simplified version
	* that is sufficient for our needs.
	*
	* @param {Object} target
	* @param {Object | null | undefined} source
	*
	* @returns {Object} target
	* @throws TypeError if target is not an object
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
	* @see https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-object.assign
	*/
	function assign(target, source) {
		if (target === null || typeof target !== "object") throw new TypeError("target is not an object");
		for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
		return target;
	}
	/**
	* All mime types that are allowed as input to `DOMParser.parseFromString`
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString#Argument02 MDN
	* @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#domparsersupportedtype WHATWG HTML Spec
	* @see DOMParser.prototype.parseFromString
	*/
	var MIME_TYPE = freeze({
		/**
		* `text/html`, the only mime type that triggers treating an XML document as HTML.
		*
		* @see DOMParser.SupportedType.isHTML
		* @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
		* @see https://en.wikipedia.org/wiki/HTML Wikipedia
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
		* @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring WHATWG HTML Spec
		*/
		HTML: "text/html",
		/**
		* Helper method to check a mime type if it indicates an HTML document
		*
		* @param {string} [value]
		* @returns {boolean}
		*
		* @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
		* @see https://en.wikipedia.org/wiki/HTML Wikipedia
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
		* @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring 	 */
		isHTML: function(value) {
			return value === MIME_TYPE.HTML;
		},
		/**
		* `application/xml`, the standard mime type for XML documents.
		*
		* @see https://www.iana.org/assignments/media-types/application/xml IANA MimeType registration
		* @see https://tools.ietf.org/html/rfc7303#section-9.1 RFC 7303
		* @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
		*/
		XML_APPLICATION: "application/xml",
		/**
		* `text/html`, an alias for `application/xml`.
		*
		* @see https://tools.ietf.org/html/rfc7303#section-9.2 RFC 7303
		* @see https://www.iana.org/assignments/media-types/text/xml IANA MimeType registration
		* @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
		*/
		XML_TEXT: "text/xml",
		/**
		* `application/xhtml+xml`, indicates an XML document that has the default HTML namespace,
		* but is parsed as an XML document.
		*
		* @see https://www.iana.org/assignments/media-types/application/xhtml+xml IANA MimeType registration
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument WHATWG DOM Spec
		* @see https://en.wikipedia.org/wiki/XHTML Wikipedia
		*/
		XML_XHTML_APPLICATION: "application/xhtml+xml",
		/**
		* `image/svg+xml`,
		*
		* @see https://www.iana.org/assignments/media-types/image/svg+xml IANA MimeType registration
		* @see https://www.w3.org/TR/SVG11/ W3C SVG 1.1
		* @see https://en.wikipedia.org/wiki/Scalable_Vector_Graphics Wikipedia
		*/
		XML_SVG_IMAGE: "image/svg+xml"
	});
	/**
	* Namespaces that are used in this code base.
	*
	* @see http://www.w3.org/TR/REC-xml-names
	*/
	var NAMESPACE = freeze({
		/**
		* The XHTML namespace.
		*
		* @see http://www.w3.org/1999/xhtml
		*/
		HTML: "http://www.w3.org/1999/xhtml",
		/**
		* Checks if `uri` equals `NAMESPACE.HTML`.
		*
		* @param {string} [uri]
		*
		* @see NAMESPACE.HTML
		*/
		isHTML: function(uri) {
			return uri === NAMESPACE.HTML;
		},
		/**
		* The SVG namespace.
		*
		* @see http://www.w3.org/2000/svg
		*/
		SVG: "http://www.w3.org/2000/svg",
		/**
		* The `xml:` namespace.
		*
		* @see http://www.w3.org/XML/1998/namespace
		*/
		XML: "http://www.w3.org/XML/1998/namespace",
		/**
		* The `xmlns:` namespace
		*
		* @see https://www.w3.org/2000/xmlns/
		*/
		XMLNS: "http://www.w3.org/2000/xmlns/"
	});
	var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
	var nameChar = new RegExp("[\\-\\.0-9" + nameStartChar.source.slice(1, -1) + "\\u00B7\\u0300-\\u036F\\u203F-\\u2040]");
	var tagNamePattern = new RegExp("^" + nameStartChar.source + nameChar.source + "*(?::" + nameStartChar.source + nameChar.source + "*)?$");
	exports.assign = assign;
	exports.find = find;
	exports.freeze = freeze;
	exports.MIME_TYPE = MIME_TYPE;
	exports.NAMESPACE = NAMESPACE;
	exports.nameStartChar = nameStartChar;
	exports.nameChar = nameChar;
	exports.tagNamePattern = tagNamePattern;
}));
//#endregion
//#region node_modules/@xmldom/xmldom/lib/dom.js
var require_dom = /* @__PURE__ */ __commonJSMin(((exports) => {
	var conventions = require_conventions();
	var find = conventions.find;
	var NAMESPACE = conventions.NAMESPACE;
	var tagNamePattern = conventions.tagNamePattern;
	/**
	* A prerequisite for `[].filter`, to drop elements that are empty
	* @param {string} input
	* @returns {boolean}
	*/
	function notEmptyString(input) {
		return input !== "";
	}
	/**
	* @see https://infra.spec.whatwg.org/#split-on-ascii-whitespace
	* @see https://infra.spec.whatwg.org/#ascii-whitespace
	*
	* @param {string} input
	* @returns {string[]} (can be empty)
	*/
	function splitOnASCIIWhitespace(input) {
		return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
	}
	/**
	* Adds element as a key to current if it is not already present.
	*
	* @param {Record<string, boolean | undefined>} current
	* @param {string} element
	* @returns {Record<string, boolean | undefined>}
	*/
	function orderedSetReducer(current, element) {
		if (!current.hasOwnProperty(element)) current[element] = true;
		return current;
	}
	/**
	* @see https://infra.spec.whatwg.org/#ordered-set
	* @param {string} input
	* @returns {string[]}
	*/
	function toOrderedSet(input) {
		if (!input) return [];
		var list = splitOnASCIIWhitespace(input);
		return Object.keys(list.reduce(orderedSetReducer, {}));
	}
	/**
	* Uses `list.indexOf` to implement something like `Array.prototype.includes`,
	* which we can not rely on being available.
	*
	* @param {any[]} list
	* @returns {function(any): boolean}
	*/
	function arrayIncludes(list) {
		return function(element) {
			return list && list.indexOf(element) !== -1;
		};
	}
	function copy(src, dest) {
		for (var p in src) if (Object.prototype.hasOwnProperty.call(src, p)) dest[p] = src[p];
	}
	/**
	^\w+\.prototype\.([_\w]+)\s*=\s*((?:.*\{\s*?[\r\n][\s\S]*?^})|\S.*?(?=[;\r\n]));?
	^\w+\.prototype\.([_\w]+)\s*=\s*(\S.*?(?=[;\r\n]));?
	*/
	function _extends(Class, Super) {
		var pt = Class.prototype;
		if (!(pt instanceof Super)) {
			function t() {}
			t.prototype = Super.prototype;
			t = new t();
			copy(pt, t);
			Class.prototype = pt = t;
		}
		if (pt.constructor != Class) {
			if (typeof Class != "function") console.error("unknown Class:" + Class);
			pt.constructor = Class;
		}
	}
	var NodeType = {};
	var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
	var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
	var TEXT_NODE = NodeType.TEXT_NODE = 3;
	var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
	var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
	var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
	var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
	var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
	var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
	var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
	var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
	var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
	var ExceptionCode = {};
	var ExceptionMessage = {};
	ExceptionCode.INDEX_SIZE_ERR = (ExceptionMessage[1] = "Index size error", 1);
	ExceptionCode.DOMSTRING_SIZE_ERR = (ExceptionMessage[2] = "DOMString size error", 2);
	var HIERARCHY_REQUEST_ERR = ExceptionCode.HIERARCHY_REQUEST_ERR = (ExceptionMessage[3] = "Hierarchy request error", 3);
	ExceptionCode.WRONG_DOCUMENT_ERR = (ExceptionMessage[4] = "Wrong document", 4);
	var INVALID_CHARACTER_ERR = ExceptionCode.INVALID_CHARACTER_ERR = (ExceptionMessage[5] = "Invalid character", 5);
	ExceptionCode.NO_DATA_ALLOWED_ERR = (ExceptionMessage[6] = "No data allowed", 6);
	ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = (ExceptionMessage[7] = "No modification allowed", 7);
	var NOT_FOUND_ERR = ExceptionCode.NOT_FOUND_ERR = (ExceptionMessage[8] = "Not found", 8);
	ExceptionCode.NOT_SUPPORTED_ERR = (ExceptionMessage[9] = "Not supported", 9);
	var INUSE_ATTRIBUTE_ERR = ExceptionCode.INUSE_ATTRIBUTE_ERR = (ExceptionMessage[10] = "Attribute in use", 10);
	var INVALID_STATE_ERR = ExceptionCode.INVALID_STATE_ERR = (ExceptionMessage[11] = "Invalid state", 11);
	ExceptionCode.SYNTAX_ERR = (ExceptionMessage[12] = "Syntax error", 12);
	ExceptionCode.INVALID_MODIFICATION_ERR = (ExceptionMessage[13] = "Invalid modification", 13);
	ExceptionCode.NAMESPACE_ERR = (ExceptionMessage[14] = "Invalid namespace", 14);
	ExceptionCode.INVALID_ACCESS_ERR = (ExceptionMessage[15] = "Invalid access", 15);
	/**
	* DOM Level 2
	* Object DOMException
	* @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
	* @see http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
	*/
	function DOMException(code, message) {
		if (message instanceof Error) var error = message;
		else {
			error = this;
			Error.call(this, ExceptionMessage[code]);
			this.message = ExceptionMessage[code];
			if (Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
		}
		error.code = code;
		if (message) this.message = this.message + ": " + message;
		return error;
	}
	DOMException.prototype = Error.prototype;
	copy(ExceptionCode, DOMException);
	/**
	* @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
	* The NodeList interface provides the abstraction of an ordered collection of nodes, without defining or constraining how this collection is implemented. NodeList objects in the DOM are live.
	* The items in the NodeList are accessible via an integral index, starting from 0.
	*/
	function NodeList() {}
	NodeList.prototype = {
		/**
		* The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
		* @standard level1
		*/
		length: 0,
		/**
		* Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
		* @standard level1
		* @param index  unsigned long
		*   Index into the collection.
		* @return Node
		* 	The node at the indexth position in the NodeList, or null if that is not a valid index.
		*/
		item: function(index) {
			return index >= 0 && index < this.length ? this[index] : null;
		},
		toString: function(isHTML, nodeFilter, options) {
			var requireWellFormed = !!options && !!options.requireWellFormed;
			for (var buf = [], i = 0; i < this.length; i++) serializeToString(this[i], buf, isHTML, nodeFilter, null, requireWellFormed);
			return buf.join("");
		},
		/**
		* @private
		* @param {function (Node):boolean} predicate
		* @returns {Node[]}
		*/
		filter: function(predicate) {
			return Array.prototype.filter.call(this, predicate);
		},
		/**
		* @private
		* @param {Node} item
		* @returns {number}
		*/
		indexOf: function(item) {
			return Array.prototype.indexOf.call(this, item);
		}
	};
	function LiveNodeList(node, refresh) {
		this._node = node;
		this._refresh = refresh;
		_updateLiveList(this);
	}
	function _updateLiveList(list) {
		var inc = list._node._inc || list._node.ownerDocument._inc;
		if (list._inc !== inc) {
			var ls = list._refresh(list._node);
			__set__(list, "length", ls.length);
			if (!list.$$length || ls.length < list.$$length) {
				for (var i = ls.length; i in list; i++) if (Object.prototype.hasOwnProperty.call(list, i)) delete list[i];
			}
			copy(ls, list);
			list._inc = inc;
		}
	}
	LiveNodeList.prototype.item = function(i) {
		_updateLiveList(this);
		return this[i] || null;
	};
	_extends(LiveNodeList, NodeList);
	/**
	* Objects implementing the NamedNodeMap interface are used
	* to represent collections of nodes that can be accessed by name.
	* Note that NamedNodeMap does not inherit from NodeList;
	* NamedNodeMaps are not maintained in any particular order.
	* Objects contained in an object implementing NamedNodeMap may also be accessed by an ordinal index,
	* but this is simply to allow convenient enumeration of the contents of a NamedNodeMap,
	* and does not imply that the DOM specifies an order to these Nodes.
	* NamedNodeMap objects in the DOM are live.
	* used for attributes or DocumentType entities
	*/
	function NamedNodeMap() {}
	function _findNodeIndex(list, node) {
		var i = list.length;
		while (i--) if (list[i] === node) return i;
	}
	function _addNamedNode(el, list, newAttr, oldAttr) {
		if (oldAttr) list[_findNodeIndex(list, oldAttr)] = newAttr;
		else list[list.length++] = newAttr;
		if (el) {
			newAttr.ownerElement = el;
			var doc = el.ownerDocument;
			if (doc) {
				oldAttr && _onRemoveAttribute(doc, el, oldAttr);
				_onAddAttribute(doc, el, newAttr);
			}
		}
	}
	function _removeNamedNode(el, list, attr) {
		var i = _findNodeIndex(list, attr);
		if (i >= 0) {
			var lastIndex = list.length - 1;
			while (i < lastIndex) list[i] = list[++i];
			list.length = lastIndex;
			if (el) {
				var doc = el.ownerDocument;
				if (doc) {
					_onRemoveAttribute(doc, el, attr);
					attr.ownerElement = null;
				}
			}
		} else throw new DOMException(NOT_FOUND_ERR, /* @__PURE__ */ new Error(el.tagName + "@" + attr));
	}
	NamedNodeMap.prototype = {
		length: 0,
		item: NodeList.prototype.item,
		getNamedItem: function(key) {
			var i = this.length;
			while (i--) {
				var attr = this[i];
				if (attr.nodeName == key) return attr;
			}
		},
		setNamedItem: function(attr) {
			var el = attr.ownerElement;
			if (el && el != this._ownerElement) throw new DOMException(INUSE_ATTRIBUTE_ERR);
			var oldAttr = this.getNamedItem(attr.nodeName);
			_addNamedNode(this._ownerElement, this, attr, oldAttr);
			return oldAttr;
		},
		setNamedItemNS: function(attr) {
			var el = attr.ownerElement, oldAttr;
			if (el && el != this._ownerElement) throw new DOMException(INUSE_ATTRIBUTE_ERR);
			oldAttr = this.getNamedItemNS(attr.namespaceURI, attr.localName);
			_addNamedNode(this._ownerElement, this, attr, oldAttr);
			return oldAttr;
		},
		removeNamedItem: function(key) {
			var attr = this.getNamedItem(key);
			_removeNamedNode(this._ownerElement, this, attr);
			return attr;
		},
		removeNamedItemNS: function(namespaceURI, localName) {
			var attr = this.getNamedItemNS(namespaceURI, localName);
			_removeNamedNode(this._ownerElement, this, attr);
			return attr;
		},
		getNamedItemNS: function(namespaceURI, localName) {
			var i = this.length;
			while (i--) {
				var node = this[i];
				if (node.localName == localName && node.namespaceURI == namespaceURI) return node;
			}
			return null;
		}
	};
	/**
	* The DOMImplementation interface represents an object providing methods
	* which are not dependent on any particular document.
	* Such an object is returned by the `Document.implementation` property.
	*
	* __The individual methods describe the differences compared to the specs.__
	*
	* @constructor
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation MDN
	* @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-102161490 DOM Level 1 Core (Initial)
	* @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-102161490 DOM Level 2 Core
	* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-102161490 DOM Level 3 Core
	* @see https://dom.spec.whatwg.org/#domimplementation DOM Living Standard
	*/
	function DOMImplementation() {}
	DOMImplementation.prototype = {
		/**
		* The DOMImplementation.hasFeature() method returns a Boolean flag indicating if a given feature is supported.
		* The different implementations fairly diverged in what kind of features were reported.
		* The latest version of the spec settled to force this method to always return true, where the functionality was accurate and in use.
		*
		* @deprecated It is deprecated and modern browsers return true in all cases.
		*
		* @param {string} feature
		* @param {string} [version]
		* @returns {boolean} always true
		*
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/hasFeature MDN
		* @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-5CED94D7 DOM Level 1 Core
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-hasfeature DOM Living Standard
		*/
		hasFeature: function(feature, version) {
			return true;
		},
		/**
		* Creates an XML Document object of the specified type with its document element.
		*
		* __It behaves slightly different from the description in the living standard__:
		* - There is no interface/class `XMLDocument`, it returns a `Document` instance.
		* - `contentType`, `encoding`, `mode`, `origin`, `url` fields are currently not declared.
		* - this implementation is not validating names or qualified names
		*   (when parsing XML strings, the SAX parser takes care of that)
		*
		* @param {string|null} namespaceURI
		* @param {string} qualifiedName
		* @param {DocumentType=null} doctype
		* @returns {Document}
		*
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocument MDN
		* @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocument DOM Level 2 Core (initial)
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument  DOM Level 2 Core
		*
		* @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
		* @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
		* @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
		*/
		createDocument: function(namespaceURI, qualifiedName, doctype) {
			var doc = new Document();
			doc.implementation = this;
			doc.childNodes = new NodeList();
			doc.doctype = doctype || null;
			if (doctype) doc.appendChild(doctype);
			if (qualifiedName) {
				var root = doc.createElementNS(namespaceURI, qualifiedName);
				doc.appendChild(root);
			}
			return doc;
		},
		/**
		* Returns a doctype, with the given `qualifiedName`, `publicId`, and `systemId`.
		*
		* __This implementation differs from the specification:__
		* - this implementation is not validating names or qualified names
		*   (when parsing XML strings, the SAX parser takes care of that)
		*
		* Note: `internalSubset` can only be introduced via a direct property write to `node.internalSubset` after creation.
		* Creation-time validation of `publicId`, `systemId` is not enforced.
		* The serializer-level check covers all mutation vectors, including direct property writes.
		* `internalSubset` is only serialized as `[ ... ]` when both `publicId` and `systemId` are
		* absent (empty or `'.'`) — if either external identifier is present, `internalSubset` is
		* silently omitted from the serialized output.
		*
		* @param {string} qualifiedName
		* @param {string} [publicId]
		* The external subset public identifier. Stored verbatim including surrounding quotes.
		* When serialized with `requireWellFormed: true` (via the 4th-parameter options object),
		* throws `DOMException` with code `INVALID_STATE_ERR` if the value is non-empty and does
		* not match the XML `PubidLiteral` production (W3C DOM Parsing §3.2.1.3; XML 1.0 [12]).
		* @param {string} [systemId]
		* The external subset system identifier. Stored verbatim including surrounding quotes.
		* When serialized with `requireWellFormed: true`, throws `DOMException` with code
		* `INVALID_STATE_ERR` if the value is non-empty and does not match the XML `SystemLiteral`
		* production (W3C DOM Parsing §3.2.1.3; XML 1.0 [11]).
		* @returns {DocumentType} which can either be used with `DOMImplementation.createDocument` upon document creation
		* 				  or can be put into the document via methods like `Node.insertBefore()` or `Node.replaceChild()`
		*
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocumentType MDN
		* @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocType DOM Level 2 Core
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocumenttype DOM Living Standard
		*
		* @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
		* @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
		* @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
		*/
		createDocumentType: function(qualifiedName, publicId, systemId) {
			var node = new DocumentType();
			node.name = qualifiedName;
			node.nodeName = qualifiedName;
			node.publicId = publicId || "";
			node.systemId = systemId || "";
			return node;
		}
	};
	/**
	* @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-1950641247
	*/
	function Node() {}
	Node.prototype = {
		firstChild: null,
		lastChild: null,
		previousSibling: null,
		nextSibling: null,
		attributes: null,
		parentNode: null,
		childNodes: null,
		ownerDocument: null,
		nodeValue: null,
		namespaceURI: null,
		prefix: null,
		localName: null,
		insertBefore: function(newChild, refChild) {
			return _insertBefore(this, newChild, refChild);
		},
		replaceChild: function(newChild, oldChild) {
			_insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
			if (oldChild) this.removeChild(oldChild);
		},
		removeChild: function(oldChild) {
			return _removeChild(this, oldChild);
		},
		appendChild: function(newChild) {
			return this.insertBefore(newChild, null);
		},
		hasChildNodes: function() {
			return this.firstChild != null;
		},
		cloneNode: function(deep) {
			return cloneNode(this.ownerDocument || this, this, deep);
		},
		/**
		* Puts the specified node and all of its subtree into a "normalized" form. In a normalized
		* subtree, no text nodes in the subtree are empty and there are no adjacent text nodes.
		*
		* Specifically, this method merges any adjacent text nodes (i.e., nodes for which `nodeType`
		* is `TEXT_NODE`) into a single node with the combined data. It also removes any empty text
		* nodes.
		*
		* This method iteratively traverses all child nodes to normalize all descendant nodes within
		* the subtree.
		*
		* @throws {DOMException}
		* May throw a DOMException if operations within removeChild or appendData (which are
		* potentially invoked in this method) do not meet their specific constraints.
		* @see {@link Node.removeChild}
		* @see {@link CharacterData.appendData}
		* @see ../docs/walk-dom.md.
		*/
		normalize: function() {
			walkDOM(this, null, { enter: function(node) {
				var child = node.firstChild;
				while (child) {
					var next = child.nextSibling;
					if (next !== null && next.nodeType === TEXT_NODE && child.nodeType === TEXT_NODE) {
						node.removeChild(next);
						child.appendData(next.data);
					} else child = next;
				}
				return true;
			} });
		},
		isSupported: function(feature, version) {
			return this.ownerDocument.implementation.hasFeature(feature, version);
		},
		hasAttributes: function() {
			return this.attributes.length > 0;
		},
		/**
		* Look up the prefix associated to the given namespace URI, starting from this node.
		* **The default namespace declarations are ignored by this method.**
		* See Namespace Prefix Lookup for details on the algorithm used by this method.
		*
		* _Note: The implementation seems to be incomplete when compared to the algorithm described in the specs._
		*
		* @param {string | null} namespaceURI
		* @returns {string | null}
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
		* @see https://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
		* @see https://dom.spec.whatwg.org/#dom-node-lookupprefix
		* @see https://github.com/xmldom/xmldom/issues/322
		*/
		lookupPrefix: function(namespaceURI) {
			var el = this;
			while (el) {
				var map = el._nsMap;
				if (map) {
					for (var n in map) if (Object.prototype.hasOwnProperty.call(map, n) && map[n] === namespaceURI) return n;
				}
				el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
			}
			return null;
		},
		lookupNamespaceURI: function(prefix) {
			var el = this;
			while (el) {
				var map = el._nsMap;
				if (map) {
					if (Object.prototype.hasOwnProperty.call(map, prefix)) return map[prefix];
				}
				el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
			}
			return null;
		},
		isDefaultNamespace: function(namespaceURI) {
			return this.lookupPrefix(namespaceURI) == null;
		}
	};
	function _xmlEncoder(c) {
		return c == "<" && "&lt;" || c == ">" && "&gt;" || c == "&" && "&amp;" || c == "\"" && "&quot;" || "&#" + c.charCodeAt() + ";";
	}
	copy(NodeType, Node);
	copy(NodeType, Node.prototype);
	/**
	* @param {Node} node
	* Root of the subtree to visit.
	* @param {function(Node): boolean} callback
	* Called for each node in depth-first pre-order. Return a truthy value to stop traversal early.
	* @return {boolean} `true` if traversal was aborted by the callback, `false` otherwise.
	*/
	function _visitNode(node, callback) {
		return walkDOM(node, null, { enter: function(n) {
			return callback(n) ? walkDOM.STOP : true;
		} }) === walkDOM.STOP;
	}
	/**
	* Depth-first pre/post-order DOM tree walker.
	*
	* Visits every node in the subtree rooted at `node`. For each node:
	*
	* 1. Calls `callbacks.enter(node, context)` before descending into the node's children. The
	* return value becomes the `context` passed to each child's `enter` call and to the matching
	* `exit` call.
	* 2. If `enter` returns `null` or `undefined`, the node's children are skipped;
	* sibling traversal continues normally.
	* 3. If `enter` returns `walkDOM.STOP`, the entire traversal is aborted immediately — no
	* further `enter` or `exit` calls are made.
	* 4. `lastChild` and `previousSibling` are read **after** `enter` returns, so `enter` may
	* safely modify the node's own child list before the walker descends. Modifying siblings of
	* the current node or any other part of the tree produces unpredictable results: nodes already
	* queued on the stack are visited regardless of DOM changes, and newly inserted nodes outside
	* the current child list are never visited.
	* 5. Calls `callbacks.exit(node, context)` (if provided) after all of a node's children have
	* been visited, passing the same `context` that `enter`
	* returned for that node.
	*
	* This implementation uses an explicit stack and does not recurse — it is safe on arbitrarily
	* deep trees.
	*
	* @param {Node} node
	* Root of the subtree to walk.
	* @param {*} context
	* Initial context value passed to the root node's `enter`.
	* @param {{ enter: function(Node, *): *, exit?: function(Node, *): void }} callbacks
	* @returns {void | walkDOM.STOP}
	* @see ../docs/walk-dom.md.
	*/
	function walkDOM(node, context, callbacks) {
		var stack = [{
			node,
			context,
			phase: walkDOM.ENTER
		}];
		while (stack.length > 0) {
			var frame = stack.pop();
			if (frame.phase === walkDOM.ENTER) {
				var childContext = callbacks.enter(frame.node, frame.context);
				if (childContext === walkDOM.STOP) return walkDOM.STOP;
				stack.push({
					node: frame.node,
					context: childContext,
					phase: walkDOM.EXIT
				});
				if (childContext === null || childContext === void 0) continue;
				var child = frame.node.lastChild;
				while (child) {
					stack.push({
						node: child,
						context: childContext,
						phase: walkDOM.ENTER
					});
					child = child.previousSibling;
				}
			} else if (callbacks.exit) callbacks.exit(frame.node, frame.context);
		}
	}
	/**
	* Sentinel value returned from a `walkDOM` `enter` callback to abort the entire traversal
	* immediately.
	*
	* @type {symbol}
	*/
	walkDOM.STOP = Symbol("walkDOM.STOP");
	/**
	* Phase constant for a stack frame that has not yet been visited.
	* The `enter` callback is called and children are scheduled.
	*
	* @type {number}
	*/
	walkDOM.ENTER = 0;
	/**
	* Phase constant for a stack frame whose subtree has been fully visited.
	* The `exit` callback is called.
	*
	* @type {number}
	*/
	walkDOM.EXIT = 1;
	function Document() {
		this.ownerDocument = this;
	}
	function _onAddAttribute(doc, el, newAttr) {
		doc && doc._inc++;
		if (newAttr.namespaceURI === NAMESPACE.XMLNS) el._nsMap[newAttr.prefix ? newAttr.localName : ""] = newAttr.value;
	}
	function _onRemoveAttribute(doc, el, newAttr, remove) {
		doc && doc._inc++;
		if (newAttr.namespaceURI === NAMESPACE.XMLNS) delete el._nsMap[newAttr.prefix ? newAttr.localName : ""];
	}
	/**
	* Updates `el.childNodes`, updating the indexed items and it's `length`.
	* Passing `newChild` means it will be appended.
	* Otherwise it's assumed that an item has been removed,
	* and `el.firstNode` and it's `.nextSibling` are used
	* to walk the current list of child nodes.
	*
	* @param {Document} doc
	* @param {Node} el
	* @param {Node} [newChild]
	* @private
	*/
	function _onUpdateChild(doc, el, newChild) {
		if (doc && doc._inc) {
			doc._inc++;
			var cs = el.childNodes;
			if (newChild) cs[cs.length++] = newChild;
			else {
				var child = el.firstChild;
				var i = 0;
				while (child) {
					cs[i++] = child;
					child = child.nextSibling;
				}
				cs.length = i;
				delete cs[cs.length];
			}
		}
	}
	/**
	* Removes the connections between `parentNode` and `child`
	* and any existing `child.previousSibling` or `child.nextSibling`.
	*
	* @see https://github.com/xmldom/xmldom/issues/135
	* @see https://github.com/xmldom/xmldom/issues/145
	*
	* @param {Node} parentNode
	* @param {Node} child
	* @returns {Node} the child that was removed.
	* @private
	*/
	function _removeChild(parentNode, child) {
		var previous = child.previousSibling;
		var next = child.nextSibling;
		if (previous) previous.nextSibling = next;
		else parentNode.firstChild = next;
		if (next) next.previousSibling = previous;
		else parentNode.lastChild = previous;
		child.parentNode = null;
		child.previousSibling = null;
		child.nextSibling = null;
		_onUpdateChild(parentNode.ownerDocument, parentNode);
		return child;
	}
	/**
	* Returns `true` if `node` can be a parent for insertion.
	* @param {Node} node
	* @returns {boolean}
	*/
	function hasValidParentNodeType(node) {
		return node && (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE);
	}
	/**
	* Returns `true` if `node` can be inserted according to it's `nodeType`.
	* @param {Node} node
	* @returns {boolean}
	*/
	function hasInsertableNodeType(node) {
		return node && (isElementNode(node) || isTextNode(node) || isDocTypeNode(node) || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.PROCESSING_INSTRUCTION_NODE);
	}
	/**
	* Returns true if `node` is a DOCTYPE node
	* @param {Node} node
	* @returns {boolean}
	*/
	function isDocTypeNode(node) {
		return node && node.nodeType === Node.DOCUMENT_TYPE_NODE;
	}
	/**
	* Returns true if the node is an element
	* @param {Node} node
	* @returns {boolean}
	*/
	function isElementNode(node) {
		return node && node.nodeType === Node.ELEMENT_NODE;
	}
	/**
	* Returns true if `node` is a text node
	* @param {Node} node
	* @returns {boolean}
	*/
	function isTextNode(node) {
		return node && node.nodeType === Node.TEXT_NODE;
	}
	/**
	* Check if en element node can be inserted before `child`, or at the end if child is falsy,
	* according to the presence and position of a doctype node on the same level.
	*
	* @param {Document} doc The document node
	* @param {Node} child the node that would become the nextSibling if the element would be inserted
	* @returns {boolean} `true` if an element can be inserted before child
	* @private
	* https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	*/
	function isElementInsertionPossible(doc, child) {
		var parentChildNodes = doc.childNodes || [];
		if (find(parentChildNodes, isElementNode) || isDocTypeNode(child)) return false;
		var docTypeNode = find(parentChildNodes, isDocTypeNode);
		return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
	}
	/**
	* Check if en element node can be inserted before `child`, or at the end if child is falsy,
	* according to the presence and position of a doctype node on the same level.
	*
	* @param {Node} doc The document node
	* @param {Node} child the node that would become the nextSibling if the element would be inserted
	* @returns {boolean} `true` if an element can be inserted before child
	* @private
	* https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	*/
	function isElementReplacementPossible(doc, child) {
		var parentChildNodes = doc.childNodes || [];
		function hasElementChildThatIsNotChild(node) {
			return isElementNode(node) && node !== child;
		}
		if (find(parentChildNodes, hasElementChildThatIsNotChild)) return false;
		var docTypeNode = find(parentChildNodes, isDocTypeNode);
		return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
	}
	/**
	* @private
	* Steps 1-5 of the checks before inserting and before replacing a child are the same.
	*
	* @param {Node} parent the parent node to insert `node` into
	* @param {Node} node the node to insert
	* @param {Node=} child the node that should become the `nextSibling` of `node`
	* @returns {Node}
	* @throws DOMException for several node combinations that would create a DOM that is not well-formed.
	* @throws DOMException if `child` is provided but is not a child of `parent`.
	* @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	* @see https://dom.spec.whatwg.org/#concept-node-replace
	*/
	function assertPreInsertionValidity1to5(parent, node, child) {
		if (!hasValidParentNodeType(parent)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Unexpected parent node type " + parent.nodeType);
		if (child && child.parentNode !== parent) throw new DOMException(NOT_FOUND_ERR, "child not in parent");
		if (!hasInsertableNodeType(node) || isDocTypeNode(node) && parent.nodeType !== Node.DOCUMENT_NODE) throw new DOMException(HIERARCHY_REQUEST_ERR, "Unexpected node type " + node.nodeType + " for parent node type " + parent.nodeType);
	}
	/**
	* @private
	* Step 6 of the checks before inserting and before replacing a child are different.
	*
	* @param {Document} parent the parent node to insert `node` into
	* @param {Node} node the node to insert
	* @param {Node | undefined} child the node that should become the `nextSibling` of `node`
	* @returns {Node}
	* @throws DOMException for several node combinations that would create a DOM that is not well-formed.
	* @throws DOMException if `child` is provided but is not a child of `parent`.
	* @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	* @see https://dom.spec.whatwg.org/#concept-node-replace
	*/
	function assertPreInsertionValidityInDocument(parent, node, child) {
		var parentChildNodes = parent.childNodes || [];
		var nodeChildNodes = node.childNodes || [];
		if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
			var nodeChildElements = nodeChildNodes.filter(isElementNode);
			if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) throw new DOMException(HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
			if (nodeChildElements.length === 1 && !isElementInsertionPossible(parent, child)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
		}
		if (isElementNode(node)) {
			if (!isElementInsertionPossible(parent, child)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
		}
		if (isDocTypeNode(node)) {
			if (find(parentChildNodes, isDocTypeNode)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
			var parentElementChild = find(parentChildNodes, isElementNode);
			if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
			if (!child && parentElementChild) throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can not be appended since element is present");
		}
	}
	/**
	* @private
	* Step 6 of the checks before inserting and before replacing a child are different.
	*
	* @param {Document} parent the parent node to insert `node` into
	* @param {Node} node the node to insert
	* @param {Node | undefined} child the node that should become the `nextSibling` of `node`
	* @returns {Node}
	* @throws DOMException for several node combinations that would create a DOM that is not well-formed.
	* @throws DOMException if `child` is provided but is not a child of `parent`.
	* @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	* @see https://dom.spec.whatwg.org/#concept-node-replace
	*/
	function assertPreReplacementValidityInDocument(parent, node, child) {
		var parentChildNodes = parent.childNodes || [];
		var nodeChildNodes = node.childNodes || [];
		if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
			var nodeChildElements = nodeChildNodes.filter(isElementNode);
			if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) throw new DOMException(HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
			if (nodeChildElements.length === 1 && !isElementReplacementPossible(parent, child)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
		}
		if (isElementNode(node)) {
			if (!isElementReplacementPossible(parent, child)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
		}
		if (isDocTypeNode(node)) {
			function hasDoctypeChildThatIsNotChild(node) {
				return isDocTypeNode(node) && node !== child;
			}
			if (find(parentChildNodes, hasDoctypeChildThatIsNotChild)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
			var parentElementChild = find(parentChildNodes, isElementNode);
			if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
		}
	}
	/**
	* @private
	* @param {Node} parent the parent node to insert `node` into
	* @param {Node} node the node to insert
	* @param {Node=} child the node that should become the `nextSibling` of `node`
	* @returns {Node}
	* @throws DOMException for several node combinations that would create a DOM that is not well-formed.
	* @throws DOMException if `child` is provided but is not a child of `parent`.
	* @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	*/
	function _insertBefore(parent, node, child, _inDocumentAssertion) {
		assertPreInsertionValidity1to5(parent, node, child);
		if (parent.nodeType === Node.DOCUMENT_NODE) (_inDocumentAssertion || assertPreInsertionValidityInDocument)(parent, node, child);
		var cp = node.parentNode;
		if (cp) cp.removeChild(node);
		if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
			var newFirst = node.firstChild;
			if (newFirst == null) return node;
			var newLast = node.lastChild;
		} else newFirst = newLast = node;
		var pre = child ? child.previousSibling : parent.lastChild;
		newFirst.previousSibling = pre;
		newLast.nextSibling = child;
		if (pre) pre.nextSibling = newFirst;
		else parent.firstChild = newFirst;
		if (child == null) parent.lastChild = newLast;
		else child.previousSibling = newLast;
		do {
			newFirst.parentNode = parent;
			var targetDoc = parent.ownerDocument || parent;
			_updateOwnerDocument(newFirst, targetDoc);
		} while (newFirst !== newLast && (newFirst = newFirst.nextSibling));
		_onUpdateChild(parent.ownerDocument || parent, parent);
		if (node.nodeType == DOCUMENT_FRAGMENT_NODE) node.firstChild = node.lastChild = null;
		return node;
	}
	/**
	* Recursively updates the ownerDocument property for a node and all its descendants
	* @param {Node} node
	* @param {Document} newOwnerDocument
	* @private
	*/
	function _updateOwnerDocument(node, newOwnerDocument) {
		if (node.ownerDocument === newOwnerDocument) return;
		node.ownerDocument = newOwnerDocument;
		if (node.nodeType === ELEMENT_NODE && node.attributes) for (var i = 0; i < node.attributes.length; i++) {
			var attr = node.attributes.item(i);
			if (attr) attr.ownerDocument = newOwnerDocument;
		}
		var child = node.firstChild;
		while (child) {
			_updateOwnerDocument(child, newOwnerDocument);
			child = child.nextSibling;
		}
	}
	/**
	* Appends `newChild` to `parentNode`.
	* If `newChild` is already connected to a `parentNode` it is first removed from it.
	*
	* @see https://github.com/xmldom/xmldom/issues/135
	* @see https://github.com/xmldom/xmldom/issues/145
	* @param {Node} parentNode
	* @param {Node} newChild
	* @returns {Node}
	* @private
	*/
	function _appendSingleChild(parentNode, newChild) {
		if (newChild.parentNode) newChild.parentNode.removeChild(newChild);
		newChild.parentNode = parentNode;
		newChild.previousSibling = parentNode.lastChild;
		newChild.nextSibling = null;
		if (newChild.previousSibling) newChild.previousSibling.nextSibling = newChild;
		else parentNode.firstChild = newChild;
		parentNode.lastChild = newChild;
		_onUpdateChild(parentNode.ownerDocument, parentNode, newChild);
		_updateOwnerDocument(newChild, parentNode.ownerDocument || parentNode);
		return newChild;
	}
	Document.prototype = {
		nodeName: "#document",
		nodeType: DOCUMENT_NODE,
		/**
		* The DocumentType node of the document.
		*
		* @readonly
		* @type DocumentType
		*/
		doctype: null,
		documentElement: null,
		_inc: 1,
		insertBefore: function(newChild, refChild) {
			if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
				var child = newChild.firstChild;
				while (child) {
					var next = child.nextSibling;
					this.insertBefore(child, refChild);
					child = next;
				}
				return newChild;
			}
			_insertBefore(this, newChild, refChild);
			_updateOwnerDocument(newChild, this);
			if (this.documentElement === null && newChild.nodeType === ELEMENT_NODE) this.documentElement = newChild;
			return newChild;
		},
		removeChild: function(oldChild) {
			if (this.documentElement == oldChild) this.documentElement = null;
			return _removeChild(this, oldChild);
		},
		replaceChild: function(newChild, oldChild) {
			_insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
			_updateOwnerDocument(newChild, this);
			if (oldChild) this.removeChild(oldChild);
			if (isElementNode(newChild)) this.documentElement = newChild;
		},
		importNode: function(importedNode, deep) {
			return importNode(this, importedNode, deep);
		},
		getElementById: function(id) {
			var rtv = null;
			_visitNode(this.documentElement, function(node) {
				if (node.nodeType == ELEMENT_NODE) {
					if (node.getAttribute("id") == id) {
						rtv = node;
						return true;
					}
				}
			});
			return rtv;
		},
		/**
		* The `getElementsByClassName` method of `Document` interface returns an array-like object
		* of all child elements which have **all** of the given class name(s).
		*
		* Returns an empty list if `classeNames` is an empty string or only contains HTML white space characters.
		*
		*
		* Warning: This is a live LiveNodeList.
		* Changes in the DOM will reflect in the array as the changes occur.
		* If an element selected by this array no longer qualifies for the selector,
		* it will automatically be removed. Be aware of this for iteration purposes.
		*
		* @param {string} classNames is a string representing the class name(s) to match; multiple class names are separated by (ASCII-)whitespace
		*
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName
		* @see https://dom.spec.whatwg.org/#concept-getelementsbyclassname
		*/
		getElementsByClassName: function(classNames) {
			var classNamesSet = toOrderedSet(classNames);
			return new LiveNodeList(this, function(base) {
				var ls = [];
				if (classNamesSet.length > 0) _visitNode(base.documentElement, function(node) {
					if (node !== base && node.nodeType === ELEMENT_NODE) {
						var nodeClassNames = node.getAttribute("class");
						if (nodeClassNames) {
							var matches = classNames === nodeClassNames;
							if (!matches) {
								var nodeClassNamesSet = toOrderedSet(nodeClassNames);
								matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
							}
							if (matches) ls.push(node);
						}
					}
				});
				return ls;
			});
		},
		createElement: function(tagName) {
			var node = new Element();
			node.ownerDocument = this;
			node.nodeName = tagName;
			node.tagName = tagName;
			node.localName = tagName;
			node.childNodes = new NodeList();
			var attrs = node.attributes = new NamedNodeMap();
			attrs._ownerElement = node;
			return node;
		},
		createDocumentFragment: function() {
			var node = new DocumentFragment();
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			return node;
		},
		createTextNode: function(data) {
			var node = new Text();
			node.ownerDocument = this;
			node.appendData(data);
			return node;
		},
		createComment: function(data) {
			var node = new Comment();
			node.ownerDocument = this;
			node.appendData(data);
			return node;
		},
		/**
		* Returns a new CDATASection node whose data is `data`.
		*
		* __This implementation differs from the specification:__
		* - calling this method on an HTML document does not throw `NotSupportedError`.
		*
		* @param {string} data
		* @returns {CDATASection}
		* @throws DOMException with code `INVALID_CHARACTER_ERR` if `data` contains `"]]>"`.
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createCDATASection
		* @see https://dom.spec.whatwg.org/#dom-document-createcdatasection
		*/
		createCDATASection: function(data) {
			if (data.indexOf("]]>") !== -1) throw new DOMException(INVALID_CHARACTER_ERR, "data contains \"]]>\"");
			var node = new CDATASection();
			node.ownerDocument = this;
			node.appendData(data);
			return node;
		},
		/**
		* Returns a ProcessingInstruction node whose target is target and data is data.
		*
		* __This implementation differs from the specification:__
		* - it does not do any input validation on the arguments and doesn't throw "InvalidCharacterError".
		*
		* Note: When the resulting document is serialized with `requireWellFormed: true`, the
		* serializer throws with code `INVALID_STATE_ERR` if `.data` contains `?>` (W3C DOM Parsing
		* §3.2.1.7). Without that option the data is emitted verbatim.
		*
		* @param {string} target
		* @param {string} data
		* @returns {ProcessingInstruction}
		* @see https://developer.mozilla.org/docs/Web/API/Document/createProcessingInstruction
		* @see https://dom.spec.whatwg.org/#dom-document-createprocessinginstruction
		* @see https://www.w3.org/TR/DOM-Parsing/#dfn-concept-serialize-xml §3.2.1.7
		*/
		createProcessingInstruction: function(target, data) {
			var node = new ProcessingInstruction();
			node.ownerDocument = this;
			node.tagName = node.nodeName = node.target = target;
			node.nodeValue = node.data = data;
			return node;
		},
		createAttribute: function(name) {
			var node = new Attr();
			node.ownerDocument = this;
			node.name = name;
			node.nodeName = name;
			node.localName = name;
			node.specified = true;
			return node;
		},
		createEntityReference: function(name) {
			var node = new EntityReference();
			node.ownerDocument = this;
			node.nodeName = name;
			return node;
		},
		createElementNS: function(namespaceURI, qualifiedName) {
			var node = new Element();
			var pl = qualifiedName.split(":");
			var attrs = node.attributes = new NamedNodeMap();
			node.childNodes = new NodeList();
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.tagName = qualifiedName;
			node.namespaceURI = namespaceURI;
			if (pl.length == 2) {
				node.prefix = pl[0];
				node.localName = pl[1];
			} else node.localName = qualifiedName;
			attrs._ownerElement = node;
			return node;
		},
		createAttributeNS: function(namespaceURI, qualifiedName) {
			var node = new Attr();
			var pl = qualifiedName.split(":");
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.name = qualifiedName;
			node.namespaceURI = namespaceURI;
			node.specified = true;
			if (pl.length == 2) {
				node.prefix = pl[0];
				node.localName = pl[1];
			} else node.localName = qualifiedName;
			return node;
		}
	};
	_extends(Document, Node);
	function Element() {
		this._nsMap = {};
	}
	Element.prototype = {
		nodeType: ELEMENT_NODE,
		hasAttribute: function(name) {
			return this.getAttributeNode(name) != null;
		},
		getAttribute: function(name) {
			var attr = this.getAttributeNode(name);
			return attr && attr.value || "";
		},
		getAttributeNode: function(name) {
			return this.attributes.getNamedItem(name);
		},
		setAttribute: function(name, value) {
			var attr = this.ownerDocument.createAttribute(name);
			attr.value = attr.nodeValue = "" + value;
			this.setAttributeNode(attr);
		},
		removeAttribute: function(name) {
			var attr = this.getAttributeNode(name);
			attr && this.removeAttributeNode(attr);
		},
		appendChild: function(newChild) {
			if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) return this.insertBefore(newChild, null);
			else return _appendSingleChild(this, newChild);
		},
		setAttributeNode: function(newAttr) {
			return this.attributes.setNamedItem(newAttr);
		},
		setAttributeNodeNS: function(newAttr) {
			return this.attributes.setNamedItemNS(newAttr);
		},
		removeAttributeNode: function(oldAttr) {
			return this.attributes.removeNamedItem(oldAttr.nodeName);
		},
		removeAttributeNS: function(namespaceURI, localName) {
			var old = this.getAttributeNodeNS(namespaceURI, localName);
			old && this.removeAttributeNode(old);
		},
		hasAttributeNS: function(namespaceURI, localName) {
			return this.getAttributeNodeNS(namespaceURI, localName) != null;
		},
		getAttributeNS: function(namespaceURI, localName) {
			var attr = this.getAttributeNodeNS(namespaceURI, localName);
			return attr && attr.value || "";
		},
		setAttributeNS: function(namespaceURI, qualifiedName, value) {
			var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
			attr.value = attr.nodeValue = "" + value;
			this.setAttributeNode(attr);
		},
		getAttributeNodeNS: function(namespaceURI, localName) {
			return this.attributes.getNamedItemNS(namespaceURI, localName);
		},
		getElementsByTagName: function(tagName) {
			return new LiveNodeList(this, function(base) {
				var ls = [];
				_visitNode(base, function(node) {
					if (node !== base && node.nodeType == ELEMENT_NODE && (tagName === "*" || node.tagName == tagName)) ls.push(node);
				});
				return ls;
			});
		},
		getElementsByTagNameNS: function(namespaceURI, localName) {
			return new LiveNodeList(this, function(base) {
				var ls = [];
				_visitNode(base, function(node) {
					if (node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === "*" || node.namespaceURI === namespaceURI) && (localName === "*" || node.localName == localName)) ls.push(node);
				});
				return ls;
			});
		}
	};
	Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
	Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
	_extends(Element, Node);
	function Attr() {}
	Attr.prototype.nodeType = ATTRIBUTE_NODE;
	_extends(Attr, Node);
	function CharacterData() {}
	CharacterData.prototype = {
		data: "",
		substringData: function(offset, count) {
			return this.data.substring(offset, offset + count);
		},
		appendData: function(text) {
			text = this.data + text;
			this.nodeValue = this.data = text;
			this.length = text.length;
		},
		insertData: function(offset, text) {
			this.replaceData(offset, 0, text);
		},
		appendChild: function(newChild) {
			throw new Error(ExceptionMessage[HIERARCHY_REQUEST_ERR]);
		},
		deleteData: function(offset, count) {
			this.replaceData(offset, count, "");
		},
		replaceData: function(offset, count, text) {
			var start = this.data.substring(0, offset);
			var end = this.data.substring(offset + count);
			text = start + text + end;
			this.nodeValue = this.data = text;
			this.length = text.length;
		}
	};
	_extends(CharacterData, Node);
	function Text() {}
	Text.prototype = {
		nodeName: "#text",
		nodeType: TEXT_NODE,
		splitText: function(offset) {
			var text = this.data;
			var newText = text.substring(offset);
			text = text.substring(0, offset);
			this.data = this.nodeValue = text;
			this.length = text.length;
			var newNode = this.ownerDocument.createTextNode(newText);
			if (this.parentNode) this.parentNode.insertBefore(newNode, this.nextSibling);
			return newNode;
		}
	};
	_extends(Text, CharacterData);
	function Comment() {}
	Comment.prototype = {
		nodeName: "#comment",
		nodeType: COMMENT_NODE
	};
	_extends(Comment, CharacterData);
	function CDATASection() {}
	CDATASection.prototype = {
		nodeName: "#cdata-section",
		nodeType: CDATA_SECTION_NODE
	};
	_extends(CDATASection, CharacterData);
	/**
	* Represents a DocumentType node (the `<!DOCTYPE ...>` declaration).
	*
	* `publicId`, `systemId`, and `internalSubset` are plain own-property assignments.
	* xmldom does not enforce the `readonly` constraint declared by the WHATWG DOM spec —
	* direct property writes succeed silently. Values are serialized verbatim when
	* `requireWellFormed` is false (the default). When the serializer is invoked with
	* `requireWellFormed: true` (via the 4th-parameter options object), it validates each
	* field and throws `DOMException` with code `INVALID_STATE_ERR` on invalid values.
	*
	* @class
	* @see https://developer.mozilla.org/en-US/docs/Web/API/DocumentType MDN
	*/
	function DocumentType() {}
	DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
	_extends(DocumentType, Node);
	function Notation() {}
	Notation.prototype.nodeType = NOTATION_NODE;
	_extends(Notation, Node);
	function Entity() {}
	Entity.prototype.nodeType = ENTITY_NODE;
	_extends(Entity, Node);
	function EntityReference() {}
	EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
	_extends(EntityReference, Node);
	function DocumentFragment() {}
	DocumentFragment.prototype.nodeName = "#document-fragment";
	DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;
	_extends(DocumentFragment, Node);
	function ProcessingInstruction() {}
	ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
	_extends(ProcessingInstruction, Node);
	function XMLSerializer() {}
	/**
	* Returns the result of serializing `node` to XML.
	*
	* When `options.requireWellFormed` is `true`, the serializer throws for content that would
	* produce ill-formed XML.
	*
	* __This implementation differs from the specification:__
	* - CDATASection nodes whose data contains `]]>` are serialized by splitting the section
	*   at each `]]>` occurrence (following W3C DOM Level 3 Core `split-cdata-sections`
	*   default behaviour) unless `requireWellFormed` is `true`.
	* - when `requireWellFormed` is `true`, `DOMException` with code `INVALID_STATE_ERR`
	*   is only thrown to prevent injection vectors, not for all the spec mandated checks.
	*
	* @param {Node} node
	* @param {boolean} [isHtml]
	* @param {function} [nodeFilter]
	* @param {Object} [options]
	* @param {boolean} [options.requireWellFormed=false]
	* When `true`, throws for content that would produce ill-formed XML.
	* @returns {string}
	* @throws {DOMException}
	* With code `INVALID_STATE_ERR` when `requireWellFormed` is `true` and:
	* - an Element's qualified name (including any namespace prefix) is not a valid XML QName,
	* - an attribute's qualified name (including a synthesized `xmlns:` namespace declaration) is
	*   not a valid XML QName,
	* - a CDATASection node's data contains `"]]>"`,
	* - a Comment node's data contains `"-->"` (bare `"--"` does not throw on this branch),
	* - a ProcessingInstruction's data contains `"?>"`,
	* - a DocumentType's `publicId` is non-empty and does not match the XML `PubidLiteral`
	*   production,
	* - a DocumentType's `systemId` is non-empty and does not match the XML `SystemLiteral`
	*   production, or
	* - a DocumentType's `internalSubset` contains `"]>"`.
	* Note: xmldom does not enforce `readonly` on DocumentType fields — direct property
	* writes succeed and are covered by the serializer-level checks above.
	* @see https://html.spec.whatwg.org/#dom-xmlserializer-serializetostring
	* @see https://w3c.github.io/DOM-Parsing/#xml-serialization
	* @see https://github.com/w3c/DOM-Parsing/issues/84
	*/
	XMLSerializer.prototype.serializeToString = function(node, isHtml, nodeFilter, options) {
		return nodeSerializeToString.call(node, isHtml, nodeFilter, options);
	};
	Node.prototype.toString = nodeSerializeToString;
	function nodeSerializeToString(isHtml, nodeFilter, options) {
		var requireWellFormed = !!options && !!options.requireWellFormed;
		var buf = [];
		var refNode = this.nodeType == 9 && this.documentElement || this;
		var prefix = refNode.prefix;
		var uri = refNode.namespaceURI;
		if (uri && prefix == null) {
			var prefix = refNode.lookupPrefix(uri);
			if (prefix == null) var visibleNamespaces = [{
				namespace: uri,
				prefix: null
			}];
		}
		serializeToString(this, buf, isHtml, nodeFilter, visibleNamespaces, requireWellFormed);
		return buf.join("");
	}
	function needNamespaceDefine(node, isHTML, visibleNamespaces) {
		var prefix = node.prefix || "";
		var uri = node.namespaceURI;
		if (!uri) return false;
		if (prefix === "xml" && uri === NAMESPACE.XML || uri === NAMESPACE.XMLNS) return false;
		var i = visibleNamespaces.length;
		while (i--) {
			var ns = visibleNamespaces[i];
			if (ns.prefix === prefix) return ns.namespace !== uri;
		}
		return true;
	}
	/**
	* Well-formed constraint: No < in Attribute Values
	* > The replacement text of any entity referred to directly or indirectly
	* > in an attribute value must not contain a <.
	* @see https://www.w3.org/TR/xml11/#CleanAttrVals
	* @see https://www.w3.org/TR/xml11/#NT-AttValue
	*
	* Literal whitespace other than space that appear in attribute values
	* are serialized as their entity references, so they will be preserved.
	* (In contrast to whitespace literals in the input which are normalized to spaces)
	* @see https://www.w3.org/TR/xml11/#AVNormalize
	* @see https://w3c.github.io/DOM-Parsing/#serializing-an-element-s-attributes
	*/
	function addSerializedAttribute(buf, qualifiedName, value, requireWellFormed) {
		if (requireWellFormed && !tagNamePattern.test(qualifiedName)) throw new DOMException(INVALID_STATE_ERR, "The attribute name \"" + qualifiedName + "\" is not a valid XML QName");
		buf.push(" ", qualifiedName, "=\"", value.replace(/[<>&"\t\n\r]/g, _xmlEncoder), "\"");
	}
	function serializeToString(node, buf, isHTML, nodeFilter, visibleNamespaces, requireWellFormed) {
		if (!visibleNamespaces) visibleNamespaces = [];
		walkDOM(node, {
			ns: visibleNamespaces,
			isHTML
		}, {
			enter: function(n, ctx) {
				var ns = ctx.ns;
				var html = ctx.isHTML;
				if (nodeFilter) {
					n = nodeFilter(n);
					if (n) {
						if (typeof n == "string") {
							buf.push(n);
							return null;
						}
					} else return null;
				}
				switch (n.nodeType) {
					case ELEMENT_NODE:
						var attrs = n.attributes;
						var len = attrs.length;
						var nodeName = n.tagName;
						html = NAMESPACE.isHTML(n.namespaceURI) || html;
						var prefixedNodeName = nodeName;
						if (!html && !n.prefix && n.namespaceURI) {
							var defaultNS;
							for (var ai = 0; ai < attrs.length; ai++) if (attrs.item(ai).name === "xmlns") {
								defaultNS = attrs.item(ai).value;
								break;
							}
							if (!defaultNS) for (var nsi = ns.length - 1; nsi >= 0; nsi--) {
								var nsEntry = ns[nsi];
								if (nsEntry.prefix === "" && nsEntry.namespace === n.namespaceURI) {
									defaultNS = nsEntry.namespace;
									break;
								}
							}
							if (defaultNS !== n.namespaceURI) for (var nsi = ns.length - 1; nsi >= 0; nsi--) {
								var nsEntry = ns[nsi];
								if (nsEntry.namespace === n.namespaceURI) {
									if (nsEntry.prefix) prefixedNodeName = nsEntry.prefix + ":" + nodeName;
									break;
								}
							}
						}
						if (requireWellFormed && !tagNamePattern.test(prefixedNodeName)) throw new DOMException(INVALID_STATE_ERR, "The element name \"" + prefixedNodeName + "\" is not a valid XML QName");
						buf.push("<", prefixedNodeName);
						var childNs = ns.slice();
						for (var i = 0; i < len; i++) {
							var attr = attrs.item(i);
							if (attr.prefix == "xmlns") childNs.push({
								prefix: attr.localName,
								namespace: attr.value
							});
							else if (attr.nodeName == "xmlns") childNs.push({
								prefix: "",
								namespace: attr.value
							});
						}
						for (var i = 0; i < len; i++) {
							var attr = attrs.item(i);
							if (needNamespaceDefine(attr, html, childNs)) {
								var attrPrefix = attr.prefix || "";
								var uri = attr.namespaceURI;
								addSerializedAttribute(buf, attrPrefix ? "xmlns:" + attrPrefix : "xmlns", uri, requireWellFormed);
								childNs.push({
									prefix: attrPrefix,
									namespace: uri
								});
							}
							var filteredAttr = nodeFilter ? nodeFilter(attr) : attr;
							if (filteredAttr) if (typeof filteredAttr === "string") buf.push(filteredAttr);
							else addSerializedAttribute(buf, filteredAttr.name, filteredAttr.value, requireWellFormed);
						}
						if (nodeName === prefixedNodeName && needNamespaceDefine(n, html, childNs)) {
							var nodePrefix = n.prefix || "";
							var uri = n.namespaceURI;
							addSerializedAttribute(buf, nodePrefix ? "xmlns:" + nodePrefix : "xmlns", uri, requireWellFormed);
							childNs.push({
								prefix: nodePrefix,
								namespace: uri
							});
						}
						var child = n.firstChild;
						if (child || html && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)) {
							buf.push(">");
							if (html && /^script$/i.test(nodeName)) {
								while (child) {
									if (child.data) buf.push(child.data);
									else serializeToString(child, buf, html, nodeFilter, childNs.slice(), requireWellFormed);
									child = child.nextSibling;
								}
								buf.push("</", nodeName, ">");
								return null;
							}
							return {
								ns: childNs,
								isHTML: html,
								tag: prefixedNodeName
							};
						} else {
							buf.push("/>");
							return null;
						}
					case DOCUMENT_NODE:
					case DOCUMENT_FRAGMENT_NODE: return {
						ns: ns.slice(),
						isHTML: html,
						tag: null
					};
					case ATTRIBUTE_NODE:
						addSerializedAttribute(buf, n.name, n.value, requireWellFormed);
						return null;
					case TEXT_NODE:
						/**
						* The ampersand character (&) and the left angle bracket (<) must not appear in their literal form,
						* except when used as markup delimiters, or within a comment, a processing instruction, or a CDATA section.
						* If they are needed elsewhere, they must be escaped using either numeric character references or the strings
						* `&amp;` and `&lt;` respectively.
						* The right angle bracket (>) may be represented using the string " &gt; ", and must, for compatibility,
						* be escaped using either `&gt;` or a character reference when it appears in the string `]]>` in content,
						* when that string is not marking the end of a CDATA section.
						*
						* In the content of elements, character data is any string of characters
						* which does not contain the start-delimiter of any markup
						* and does not include the CDATA-section-close delimiter, `]]>`.
						*
						* @see https://www.w3.org/TR/xml/#NT-CharData
						* @see https://w3c.github.io/DOM-Parsing/#xml-serializing-a-text-node
						*/
						buf.push(n.data.replace(/[<&>]/g, _xmlEncoder));
						return null;
					case CDATA_SECTION_NODE:
						if (requireWellFormed && n.data.indexOf("]]>") !== -1) throw new DOMException(INVALID_STATE_ERR, "The CDATASection data contains \"]]>\"");
						buf.push("<![CDATA[", n.data.replace(/]]>/g, "]]]]><![CDATA[>"), "]]>");
						return null;
					case COMMENT_NODE:
						if (requireWellFormed && n.data.indexOf("-->") !== -1) throw new DOMException(INVALID_STATE_ERR, "The comment node data contains \"-->\"");
						buf.push("<!--", n.data, "-->");
						return null;
					case DOCUMENT_TYPE_NODE:
						if (requireWellFormed) {
							if (n.publicId && !/^("[\x20\r\na-zA-Z0-9\-()+,.\/:=?;!*#@$_%']*"|'[\x20\r\na-zA-Z0-9\-()+,.\/:=?;!*#@$_%'"]*')$/.test(n.publicId)) throw new DOMException(INVALID_STATE_ERR, "DocumentType publicId is not a valid PubidLiteral");
							if (n.systemId && !/^("[^"]*"|'[^']*')$/.test(n.systemId)) throw new DOMException(INVALID_STATE_ERR, "DocumentType systemId is not a valid SystemLiteral");
							if (n.internalSubset && n.internalSubset.indexOf("]>") !== -1) throw new DOMException(INVALID_STATE_ERR, "DocumentType internalSubset contains \"]>\"");
						}
						var pubid = n.publicId;
						var sysid = n.systemId;
						buf.push("<!DOCTYPE ", n.name);
						if (pubid) {
							buf.push(" PUBLIC ", pubid);
							if (sysid && sysid != ".") buf.push(" ", sysid);
							buf.push(">");
						} else if (sysid && sysid != ".") buf.push(" SYSTEM ", sysid, ">");
						else {
							var sub = n.internalSubset;
							if (sub) buf.push(" [", sub, "]");
							buf.push(">");
						}
						return null;
					case PROCESSING_INSTRUCTION_NODE:
						if (requireWellFormed && n.data.indexOf("?>") !== -1) throw new DOMException(INVALID_STATE_ERR, "The ProcessingInstruction data contains \"?>\"");
						buf.push("<?", n.target, " ", n.data, "?>");
						return null;
					case ENTITY_REFERENCE_NODE:
						buf.push("&", n.nodeName, ";");
						return null;
					default:
						buf.push("??", n.nodeName);
						return null;
				}
			},
			exit: function(n, childCtx) {
				if (childCtx && childCtx.tag) buf.push("</", childCtx.tag, ">");
			}
		});
	}
	/**
	* Imports a node from a different document into `doc`, creating a new copy.
	* Delegates to {@link walkDOM} for traversal. Each node in the subtree is shallow-cloned,
	* stamped with `doc` as its `ownerDocument`, and detached (`parentNode` set to `null`).
	* Children are imported recursively when `deep` is `true`; for {@link Attr} nodes `deep` is
	* always forced to `true`
	* because an attribute's value lives in a child text node.
	*
	* @param {Document} doc
	* The document that will own the imported node.
	* @param {Node} node
	* The node to import.
	* @param {boolean} deep
	* If `true`, descendants are imported recursively.
	* @returns {Node}
	* The newly imported node, now owned by `doc`.
	*/
	function importNode(doc, node, deep) {
		var destRoot;
		walkDOM(node, null, { enter: function(srcNode, destParent) {
			var destNode = srcNode.cloneNode(false);
			destNode.ownerDocument = doc;
			destNode.parentNode = null;
			if (destParent === null) destRoot = destNode;
			else destParent.appendChild(destNode);
			return srcNode.nodeType === ATTRIBUTE_NODE || deep ? destNode : null;
		} });
		return destRoot;
	}
	function cloneNode(doc, node, deep) {
		var destRoot;
		walkDOM(node, null, { enter: function(srcNode, destParent) {
			var destNode = new srcNode.constructor();
			for (var n in srcNode) if (Object.prototype.hasOwnProperty.call(srcNode, n)) {
				var v = srcNode[n];
				if (typeof v != "object") {
					if (v != destNode[n]) destNode[n] = v;
				}
			}
			if (srcNode.childNodes) destNode.childNodes = new NodeList();
			destNode.ownerDocument = doc;
			var shouldDeep = deep;
			switch (destNode.nodeType) {
				case ELEMENT_NODE:
					var attrs = srcNode.attributes;
					var attrs2 = destNode.attributes = new NamedNodeMap();
					var len = attrs.length;
					attrs2._ownerElement = destNode;
					for (var i = 0; i < len; i++) destNode.setAttributeNode(cloneNode(doc, attrs.item(i), true));
					break;
				case ATTRIBUTE_NODE: shouldDeep = true;
			}
			if (destParent !== null) destParent.appendChild(destNode);
			else destRoot = destNode;
			return shouldDeep ? destNode : null;
		} });
		return destRoot;
	}
	function __set__(object, key, value) {
		object[key] = value;
	}
	try {
		if (Object.defineProperty) {
			Object.defineProperty(LiveNodeList.prototype, "length", { get: function() {
				_updateLiveList(this);
				return this.$$length;
			} });
			/**
			* The text content of this node and its descendants.
			*
			* Setting `textContent` on an element or document fragment replaces all child nodes with a
			* single text node; on other nodes it sets `data`, `value`, and `nodeValue` directly.
			*
			* @type {string | null}
			* @see {@link https://dom.spec.whatwg.org/#dom-node-textcontent}
			*/
			Object.defineProperty(Node.prototype, "textContent", {
				get: function() {
					if (this.nodeType === ELEMENT_NODE || this.nodeType === DOCUMENT_FRAGMENT_NODE) {
						var buf = [];
						walkDOM(this, null, { enter: function(n) {
							if (n.nodeType === ELEMENT_NODE || n.nodeType === DOCUMENT_FRAGMENT_NODE) return true;
							if (n.nodeType === PROCESSING_INSTRUCTION_NODE || n.nodeType === COMMENT_NODE) return null;
							buf.push(n.nodeValue);
						} });
						return buf.join("");
					}
					return this.nodeValue;
				},
				set: function(data) {
					switch (this.nodeType) {
						case ELEMENT_NODE:
						case DOCUMENT_FRAGMENT_NODE:
							while (this.firstChild) this.removeChild(this.firstChild);
							if (data || String(data)) this.appendChild(this.ownerDocument.createTextNode(data));
							break;
						default:
							this.data = data;
							this.value = data;
							this.nodeValue = data;
					}
				}
			});
			__set__ = function(object, key, value) {
				object["$$" + key] = value;
			};
		}
	} catch (e) {}
	exports.DocumentType = DocumentType;
	exports.DOMException = DOMException;
	exports.DOMImplementation = DOMImplementation;
	exports.Element = Element;
	exports.Node = Node;
	exports.NodeList = NodeList;
	exports.walkDOM = walkDOM;
	exports.XMLSerializer = XMLSerializer;
}));
//#endregion
//#region node_modules/@xmldom/xmldom/lib/entities.js
var require_entities = /* @__PURE__ */ __commonJSMin(((exports) => {
	var freeze = require_conventions().freeze;
	/**
	* The entities that are predefined in every XML document.
	*
	* @see https://www.w3.org/TR/2006/REC-xml11-20060816/#sec-predefined-ent W3C XML 1.1
	* @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-predefined-ent W3C XML 1.0
	* @see https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references#Predefined_entities_in_XML Wikipedia
	*/
	exports.XML_ENTITIES = freeze({
		amp: "&",
		apos: "'",
		gt: ">",
		lt: "<",
		quot: "\""
	});
	/**
	* A map of all entities that are detected in an HTML document.
	* They contain all entries from `XML_ENTITIES`.
	*
	* @see XML_ENTITIES
	* @see DOMParser.parseFromString
	* @see DOMImplementation.prototype.createHTMLDocument
	* @see https://html.spec.whatwg.org/#named-character-references WHATWG HTML(5) Spec
	* @see https://html.spec.whatwg.org/entities.json JSON
	* @see https://www.w3.org/TR/xml-entity-names/ W3C XML Entity Names
	* @see https://www.w3.org/TR/html4/sgml/entities.html W3C HTML4/SGML
	* @see https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references#Character_entity_references_in_HTML Wikipedia (HTML)
	* @see https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references#Entities_representing_special_characters_in_XHTML Wikpedia (XHTML)
	*/
	exports.HTML_ENTITIES = freeze({
		Aacute: "Á",
		aacute: "á",
		Abreve: "Ă",
		abreve: "ă",
		ac: "∾",
		acd: "∿",
		acE: "∾̳",
		Acirc: "Â",
		acirc: "â",
		acute: "´",
		Acy: "А",
		acy: "а",
		AElig: "Æ",
		aelig: "æ",
		af: "⁡",
		Afr: "𝔄",
		afr: "𝔞",
		Agrave: "À",
		agrave: "à",
		alefsym: "ℵ",
		aleph: "ℵ",
		Alpha: "Α",
		alpha: "α",
		Amacr: "Ā",
		amacr: "ā",
		amalg: "⨿",
		AMP: "&",
		amp: "&",
		And: "⩓",
		and: "∧",
		andand: "⩕",
		andd: "⩜",
		andslope: "⩘",
		andv: "⩚",
		ang: "∠",
		ange: "⦤",
		angle: "∠",
		angmsd: "∡",
		angmsdaa: "⦨",
		angmsdab: "⦩",
		angmsdac: "⦪",
		angmsdad: "⦫",
		angmsdae: "⦬",
		angmsdaf: "⦭",
		angmsdag: "⦮",
		angmsdah: "⦯",
		angrt: "∟",
		angrtvb: "⊾",
		angrtvbd: "⦝",
		angsph: "∢",
		angst: "Å",
		angzarr: "⍼",
		Aogon: "Ą",
		aogon: "ą",
		Aopf: "𝔸",
		aopf: "𝕒",
		ap: "≈",
		apacir: "⩯",
		apE: "⩰",
		ape: "≊",
		apid: "≋",
		apos: "'",
		ApplyFunction: "⁡",
		approx: "≈",
		approxeq: "≊",
		Aring: "Å",
		aring: "å",
		Ascr: "𝒜",
		ascr: "𝒶",
		Assign: "≔",
		ast: "*",
		asymp: "≈",
		asympeq: "≍",
		Atilde: "Ã",
		atilde: "ã",
		Auml: "Ä",
		auml: "ä",
		awconint: "∳",
		awint: "⨑",
		backcong: "≌",
		backepsilon: "϶",
		backprime: "‵",
		backsim: "∽",
		backsimeq: "⋍",
		Backslash: "∖",
		Barv: "⫧",
		barvee: "⊽",
		Barwed: "⌆",
		barwed: "⌅",
		barwedge: "⌅",
		bbrk: "⎵",
		bbrktbrk: "⎶",
		bcong: "≌",
		Bcy: "Б",
		bcy: "б",
		bdquo: "„",
		becaus: "∵",
		Because: "∵",
		because: "∵",
		bemptyv: "⦰",
		bepsi: "϶",
		bernou: "ℬ",
		Bernoullis: "ℬ",
		Beta: "Β",
		beta: "β",
		beth: "ℶ",
		between: "≬",
		Bfr: "𝔅",
		bfr: "𝔟",
		bigcap: "⋂",
		bigcirc: "◯",
		bigcup: "⋃",
		bigodot: "⨀",
		bigoplus: "⨁",
		bigotimes: "⨂",
		bigsqcup: "⨆",
		bigstar: "★",
		bigtriangledown: "▽",
		bigtriangleup: "△",
		biguplus: "⨄",
		bigvee: "⋁",
		bigwedge: "⋀",
		bkarow: "⤍",
		blacklozenge: "⧫",
		blacksquare: "▪",
		blacktriangle: "▴",
		blacktriangledown: "▾",
		blacktriangleleft: "◂",
		blacktriangleright: "▸",
		blank: "␣",
		blk12: "▒",
		blk14: "░",
		blk34: "▓",
		block: "█",
		bne: "=⃥",
		bnequiv: "≡⃥",
		bNot: "⫭",
		bnot: "⌐",
		Bopf: "𝔹",
		bopf: "𝕓",
		bot: "⊥",
		bottom: "⊥",
		bowtie: "⋈",
		boxbox: "⧉",
		boxDL: "╗",
		boxDl: "╖",
		boxdL: "╕",
		boxdl: "┐",
		boxDR: "╔",
		boxDr: "╓",
		boxdR: "╒",
		boxdr: "┌",
		boxH: "═",
		boxh: "─",
		boxHD: "╦",
		boxHd: "╤",
		boxhD: "╥",
		boxhd: "┬",
		boxHU: "╩",
		boxHu: "╧",
		boxhU: "╨",
		boxhu: "┴",
		boxminus: "⊟",
		boxplus: "⊞",
		boxtimes: "⊠",
		boxUL: "╝",
		boxUl: "╜",
		boxuL: "╛",
		boxul: "┘",
		boxUR: "╚",
		boxUr: "╙",
		boxuR: "╘",
		boxur: "└",
		boxV: "║",
		boxv: "│",
		boxVH: "╬",
		boxVh: "╫",
		boxvH: "╪",
		boxvh: "┼",
		boxVL: "╣",
		boxVl: "╢",
		boxvL: "╡",
		boxvl: "┤",
		boxVR: "╠",
		boxVr: "╟",
		boxvR: "╞",
		boxvr: "├",
		bprime: "‵",
		Breve: "˘",
		breve: "˘",
		brvbar: "¦",
		Bscr: "ℬ",
		bscr: "𝒷",
		bsemi: "⁏",
		bsim: "∽",
		bsime: "⋍",
		bsol: "\\",
		bsolb: "⧅",
		bsolhsub: "⟈",
		bull: "•",
		bullet: "•",
		bump: "≎",
		bumpE: "⪮",
		bumpe: "≏",
		Bumpeq: "≎",
		bumpeq: "≏",
		Cacute: "Ć",
		cacute: "ć",
		Cap: "⋒",
		cap: "∩",
		capand: "⩄",
		capbrcup: "⩉",
		capcap: "⩋",
		capcup: "⩇",
		capdot: "⩀",
		CapitalDifferentialD: "ⅅ",
		caps: "∩︀",
		caret: "⁁",
		caron: "ˇ",
		Cayleys: "ℭ",
		ccaps: "⩍",
		Ccaron: "Č",
		ccaron: "č",
		Ccedil: "Ç",
		ccedil: "ç",
		Ccirc: "Ĉ",
		ccirc: "ĉ",
		Cconint: "∰",
		ccups: "⩌",
		ccupssm: "⩐",
		Cdot: "Ċ",
		cdot: "ċ",
		cedil: "¸",
		Cedilla: "¸",
		cemptyv: "⦲",
		cent: "¢",
		CenterDot: "·",
		centerdot: "·",
		Cfr: "ℭ",
		cfr: "𝔠",
		CHcy: "Ч",
		chcy: "ч",
		check: "✓",
		checkmark: "✓",
		Chi: "Χ",
		chi: "χ",
		cir: "○",
		circ: "ˆ",
		circeq: "≗",
		circlearrowleft: "↺",
		circlearrowright: "↻",
		circledast: "⊛",
		circledcirc: "⊚",
		circleddash: "⊝",
		CircleDot: "⊙",
		circledR: "®",
		circledS: "Ⓢ",
		CircleMinus: "⊖",
		CirclePlus: "⊕",
		CircleTimes: "⊗",
		cirE: "⧃",
		cire: "≗",
		cirfnint: "⨐",
		cirmid: "⫯",
		cirscir: "⧂",
		ClockwiseContourIntegral: "∲",
		CloseCurlyDoubleQuote: "”",
		CloseCurlyQuote: "’",
		clubs: "♣",
		clubsuit: "♣",
		Colon: "∷",
		colon: ":",
		Colone: "⩴",
		colone: "≔",
		coloneq: "≔",
		comma: ",",
		commat: "@",
		comp: "∁",
		compfn: "∘",
		complement: "∁",
		complexes: "ℂ",
		cong: "≅",
		congdot: "⩭",
		Congruent: "≡",
		Conint: "∯",
		conint: "∮",
		ContourIntegral: "∮",
		Copf: "ℂ",
		copf: "𝕔",
		coprod: "∐",
		Coproduct: "∐",
		COPY: "©",
		copy: "©",
		copysr: "℗",
		CounterClockwiseContourIntegral: "∳",
		crarr: "↵",
		Cross: "⨯",
		cross: "✗",
		Cscr: "𝒞",
		cscr: "𝒸",
		csub: "⫏",
		csube: "⫑",
		csup: "⫐",
		csupe: "⫒",
		ctdot: "⋯",
		cudarrl: "⤸",
		cudarrr: "⤵",
		cuepr: "⋞",
		cuesc: "⋟",
		cularr: "↶",
		cularrp: "⤽",
		Cup: "⋓",
		cup: "∪",
		cupbrcap: "⩈",
		CupCap: "≍",
		cupcap: "⩆",
		cupcup: "⩊",
		cupdot: "⊍",
		cupor: "⩅",
		cups: "∪︀",
		curarr: "↷",
		curarrm: "⤼",
		curlyeqprec: "⋞",
		curlyeqsucc: "⋟",
		curlyvee: "⋎",
		curlywedge: "⋏",
		curren: "¤",
		curvearrowleft: "↶",
		curvearrowright: "↷",
		cuvee: "⋎",
		cuwed: "⋏",
		cwconint: "∲",
		cwint: "∱",
		cylcty: "⌭",
		Dagger: "‡",
		dagger: "†",
		daleth: "ℸ",
		Darr: "↡",
		dArr: "⇓",
		darr: "↓",
		dash: "‐",
		Dashv: "⫤",
		dashv: "⊣",
		dbkarow: "⤏",
		dblac: "˝",
		Dcaron: "Ď",
		dcaron: "ď",
		Dcy: "Д",
		dcy: "д",
		DD: "ⅅ",
		dd: "ⅆ",
		ddagger: "‡",
		ddarr: "⇊",
		DDotrahd: "⤑",
		ddotseq: "⩷",
		deg: "°",
		Del: "∇",
		Delta: "Δ",
		delta: "δ",
		demptyv: "⦱",
		dfisht: "⥿",
		Dfr: "𝔇",
		dfr: "𝔡",
		dHar: "⥥",
		dharl: "⇃",
		dharr: "⇂",
		DiacriticalAcute: "´",
		DiacriticalDot: "˙",
		DiacriticalDoubleAcute: "˝",
		DiacriticalGrave: "`",
		DiacriticalTilde: "˜",
		diam: "⋄",
		Diamond: "⋄",
		diamond: "⋄",
		diamondsuit: "♦",
		diams: "♦",
		die: "¨",
		DifferentialD: "ⅆ",
		digamma: "ϝ",
		disin: "⋲",
		div: "÷",
		divide: "÷",
		divideontimes: "⋇",
		divonx: "⋇",
		DJcy: "Ђ",
		djcy: "ђ",
		dlcorn: "⌞",
		dlcrop: "⌍",
		dollar: "$",
		Dopf: "𝔻",
		dopf: "𝕕",
		Dot: "¨",
		dot: "˙",
		DotDot: "⃜",
		doteq: "≐",
		doteqdot: "≑",
		DotEqual: "≐",
		dotminus: "∸",
		dotplus: "∔",
		dotsquare: "⊡",
		doublebarwedge: "⌆",
		DoubleContourIntegral: "∯",
		DoubleDot: "¨",
		DoubleDownArrow: "⇓",
		DoubleLeftArrow: "⇐",
		DoubleLeftRightArrow: "⇔",
		DoubleLeftTee: "⫤",
		DoubleLongLeftArrow: "⟸",
		DoubleLongLeftRightArrow: "⟺",
		DoubleLongRightArrow: "⟹",
		DoubleRightArrow: "⇒",
		DoubleRightTee: "⊨",
		DoubleUpArrow: "⇑",
		DoubleUpDownArrow: "⇕",
		DoubleVerticalBar: "∥",
		DownArrow: "↓",
		Downarrow: "⇓",
		downarrow: "↓",
		DownArrowBar: "⤓",
		DownArrowUpArrow: "⇵",
		DownBreve: "̑",
		downdownarrows: "⇊",
		downharpoonleft: "⇃",
		downharpoonright: "⇂",
		DownLeftRightVector: "⥐",
		DownLeftTeeVector: "⥞",
		DownLeftVector: "↽",
		DownLeftVectorBar: "⥖",
		DownRightTeeVector: "⥟",
		DownRightVector: "⇁",
		DownRightVectorBar: "⥗",
		DownTee: "⊤",
		DownTeeArrow: "↧",
		drbkarow: "⤐",
		drcorn: "⌟",
		drcrop: "⌌",
		Dscr: "𝒟",
		dscr: "𝒹",
		DScy: "Ѕ",
		dscy: "ѕ",
		dsol: "⧶",
		Dstrok: "Đ",
		dstrok: "đ",
		dtdot: "⋱",
		dtri: "▿",
		dtrif: "▾",
		duarr: "⇵",
		duhar: "⥯",
		dwangle: "⦦",
		DZcy: "Џ",
		dzcy: "џ",
		dzigrarr: "⟿",
		Eacute: "É",
		eacute: "é",
		easter: "⩮",
		Ecaron: "Ě",
		ecaron: "ě",
		ecir: "≖",
		Ecirc: "Ê",
		ecirc: "ê",
		ecolon: "≕",
		Ecy: "Э",
		ecy: "э",
		eDDot: "⩷",
		Edot: "Ė",
		eDot: "≑",
		edot: "ė",
		ee: "ⅇ",
		efDot: "≒",
		Efr: "𝔈",
		efr: "𝔢",
		eg: "⪚",
		Egrave: "È",
		egrave: "è",
		egs: "⪖",
		egsdot: "⪘",
		el: "⪙",
		Element: "∈",
		elinters: "⏧",
		ell: "ℓ",
		els: "⪕",
		elsdot: "⪗",
		Emacr: "Ē",
		emacr: "ē",
		empty: "∅",
		emptyset: "∅",
		EmptySmallSquare: "◻",
		emptyv: "∅",
		EmptyVerySmallSquare: "▫",
		emsp: " ",
		emsp13: " ",
		emsp14: " ",
		ENG: "Ŋ",
		eng: "ŋ",
		ensp: " ",
		Eogon: "Ę",
		eogon: "ę",
		Eopf: "𝔼",
		eopf: "𝕖",
		epar: "⋕",
		eparsl: "⧣",
		eplus: "⩱",
		epsi: "ε",
		Epsilon: "Ε",
		epsilon: "ε",
		epsiv: "ϵ",
		eqcirc: "≖",
		eqcolon: "≕",
		eqsim: "≂",
		eqslantgtr: "⪖",
		eqslantless: "⪕",
		Equal: "⩵",
		equals: "=",
		EqualTilde: "≂",
		equest: "≟",
		Equilibrium: "⇌",
		equiv: "≡",
		equivDD: "⩸",
		eqvparsl: "⧥",
		erarr: "⥱",
		erDot: "≓",
		Escr: "ℰ",
		escr: "ℯ",
		esdot: "≐",
		Esim: "⩳",
		esim: "≂",
		Eta: "Η",
		eta: "η",
		ETH: "Ð",
		eth: "ð",
		Euml: "Ë",
		euml: "ë",
		euro: "€",
		excl: "!",
		exist: "∃",
		Exists: "∃",
		expectation: "ℰ",
		ExponentialE: "ⅇ",
		exponentiale: "ⅇ",
		fallingdotseq: "≒",
		Fcy: "Ф",
		fcy: "ф",
		female: "♀",
		ffilig: "ﬃ",
		fflig: "ﬀ",
		ffllig: "ﬄ",
		Ffr: "𝔉",
		ffr: "𝔣",
		filig: "ﬁ",
		FilledSmallSquare: "◼",
		FilledVerySmallSquare: "▪",
		fjlig: "fj",
		flat: "♭",
		fllig: "ﬂ",
		fltns: "▱",
		fnof: "ƒ",
		Fopf: "𝔽",
		fopf: "𝕗",
		ForAll: "∀",
		forall: "∀",
		fork: "⋔",
		forkv: "⫙",
		Fouriertrf: "ℱ",
		fpartint: "⨍",
		frac12: "½",
		frac13: "⅓",
		frac14: "¼",
		frac15: "⅕",
		frac16: "⅙",
		frac18: "⅛",
		frac23: "⅔",
		frac25: "⅖",
		frac34: "¾",
		frac35: "⅗",
		frac38: "⅜",
		frac45: "⅘",
		frac56: "⅚",
		frac58: "⅝",
		frac78: "⅞",
		frasl: "⁄",
		frown: "⌢",
		Fscr: "ℱ",
		fscr: "𝒻",
		gacute: "ǵ",
		Gamma: "Γ",
		gamma: "γ",
		Gammad: "Ϝ",
		gammad: "ϝ",
		gap: "⪆",
		Gbreve: "Ğ",
		gbreve: "ğ",
		Gcedil: "Ģ",
		Gcirc: "Ĝ",
		gcirc: "ĝ",
		Gcy: "Г",
		gcy: "г",
		Gdot: "Ġ",
		gdot: "ġ",
		gE: "≧",
		ge: "≥",
		gEl: "⪌",
		gel: "⋛",
		geq: "≥",
		geqq: "≧",
		geqslant: "⩾",
		ges: "⩾",
		gescc: "⪩",
		gesdot: "⪀",
		gesdoto: "⪂",
		gesdotol: "⪄",
		gesl: "⋛︀",
		gesles: "⪔",
		Gfr: "𝔊",
		gfr: "𝔤",
		Gg: "⋙",
		gg: "≫",
		ggg: "⋙",
		gimel: "ℷ",
		GJcy: "Ѓ",
		gjcy: "ѓ",
		gl: "≷",
		gla: "⪥",
		glE: "⪒",
		glj: "⪤",
		gnap: "⪊",
		gnapprox: "⪊",
		gnE: "≩",
		gne: "⪈",
		gneq: "⪈",
		gneqq: "≩",
		gnsim: "⋧",
		Gopf: "𝔾",
		gopf: "𝕘",
		grave: "`",
		GreaterEqual: "≥",
		GreaterEqualLess: "⋛",
		GreaterFullEqual: "≧",
		GreaterGreater: "⪢",
		GreaterLess: "≷",
		GreaterSlantEqual: "⩾",
		GreaterTilde: "≳",
		Gscr: "𝒢",
		gscr: "ℊ",
		gsim: "≳",
		gsime: "⪎",
		gsiml: "⪐",
		Gt: "≫",
		GT: ">",
		gt: ">",
		gtcc: "⪧",
		gtcir: "⩺",
		gtdot: "⋗",
		gtlPar: "⦕",
		gtquest: "⩼",
		gtrapprox: "⪆",
		gtrarr: "⥸",
		gtrdot: "⋗",
		gtreqless: "⋛",
		gtreqqless: "⪌",
		gtrless: "≷",
		gtrsim: "≳",
		gvertneqq: "≩︀",
		gvnE: "≩︀",
		Hacek: "ˇ",
		hairsp: " ",
		half: "½",
		hamilt: "ℋ",
		HARDcy: "Ъ",
		hardcy: "ъ",
		hArr: "⇔",
		harr: "↔",
		harrcir: "⥈",
		harrw: "↭",
		Hat: "^",
		hbar: "ℏ",
		Hcirc: "Ĥ",
		hcirc: "ĥ",
		hearts: "♥",
		heartsuit: "♥",
		hellip: "…",
		hercon: "⊹",
		Hfr: "ℌ",
		hfr: "𝔥",
		HilbertSpace: "ℋ",
		hksearow: "⤥",
		hkswarow: "⤦",
		hoarr: "⇿",
		homtht: "∻",
		hookleftarrow: "↩",
		hookrightarrow: "↪",
		Hopf: "ℍ",
		hopf: "𝕙",
		horbar: "―",
		HorizontalLine: "─",
		Hscr: "ℋ",
		hscr: "𝒽",
		hslash: "ℏ",
		Hstrok: "Ħ",
		hstrok: "ħ",
		HumpDownHump: "≎",
		HumpEqual: "≏",
		hybull: "⁃",
		hyphen: "‐",
		Iacute: "Í",
		iacute: "í",
		ic: "⁣",
		Icirc: "Î",
		icirc: "î",
		Icy: "И",
		icy: "и",
		Idot: "İ",
		IEcy: "Е",
		iecy: "е",
		iexcl: "¡",
		iff: "⇔",
		Ifr: "ℑ",
		ifr: "𝔦",
		Igrave: "Ì",
		igrave: "ì",
		ii: "ⅈ",
		iiiint: "⨌",
		iiint: "∭",
		iinfin: "⧜",
		iiota: "℩",
		IJlig: "Ĳ",
		ijlig: "ĳ",
		Im: "ℑ",
		Imacr: "Ī",
		imacr: "ī",
		image: "ℑ",
		ImaginaryI: "ⅈ",
		imagline: "ℐ",
		imagpart: "ℑ",
		imath: "ı",
		imof: "⊷",
		imped: "Ƶ",
		Implies: "⇒",
		in: "∈",
		incare: "℅",
		infin: "∞",
		infintie: "⧝",
		inodot: "ı",
		Int: "∬",
		int: "∫",
		intcal: "⊺",
		integers: "ℤ",
		Integral: "∫",
		intercal: "⊺",
		Intersection: "⋂",
		intlarhk: "⨗",
		intprod: "⨼",
		InvisibleComma: "⁣",
		InvisibleTimes: "⁢",
		IOcy: "Ё",
		iocy: "ё",
		Iogon: "Į",
		iogon: "į",
		Iopf: "𝕀",
		iopf: "𝕚",
		Iota: "Ι",
		iota: "ι",
		iprod: "⨼",
		iquest: "¿",
		Iscr: "ℐ",
		iscr: "𝒾",
		isin: "∈",
		isindot: "⋵",
		isinE: "⋹",
		isins: "⋴",
		isinsv: "⋳",
		isinv: "∈",
		it: "⁢",
		Itilde: "Ĩ",
		itilde: "ĩ",
		Iukcy: "І",
		iukcy: "і",
		Iuml: "Ï",
		iuml: "ï",
		Jcirc: "Ĵ",
		jcirc: "ĵ",
		Jcy: "Й",
		jcy: "й",
		Jfr: "𝔍",
		jfr: "𝔧",
		jmath: "ȷ",
		Jopf: "𝕁",
		jopf: "𝕛",
		Jscr: "𝒥",
		jscr: "𝒿",
		Jsercy: "Ј",
		jsercy: "ј",
		Jukcy: "Є",
		jukcy: "є",
		Kappa: "Κ",
		kappa: "κ",
		kappav: "ϰ",
		Kcedil: "Ķ",
		kcedil: "ķ",
		Kcy: "К",
		kcy: "к",
		Kfr: "𝔎",
		kfr: "𝔨",
		kgreen: "ĸ",
		KHcy: "Х",
		khcy: "х",
		KJcy: "Ќ",
		kjcy: "ќ",
		Kopf: "𝕂",
		kopf: "𝕜",
		Kscr: "𝒦",
		kscr: "𝓀",
		lAarr: "⇚",
		Lacute: "Ĺ",
		lacute: "ĺ",
		laemptyv: "⦴",
		lagran: "ℒ",
		Lambda: "Λ",
		lambda: "λ",
		Lang: "⟪",
		lang: "⟨",
		langd: "⦑",
		langle: "⟨",
		lap: "⪅",
		Laplacetrf: "ℒ",
		laquo: "«",
		Larr: "↞",
		lArr: "⇐",
		larr: "←",
		larrb: "⇤",
		larrbfs: "⤟",
		larrfs: "⤝",
		larrhk: "↩",
		larrlp: "↫",
		larrpl: "⤹",
		larrsim: "⥳",
		larrtl: "↢",
		lat: "⪫",
		lAtail: "⤛",
		latail: "⤙",
		late: "⪭",
		lates: "⪭︀",
		lBarr: "⤎",
		lbarr: "⤌",
		lbbrk: "❲",
		lbrace: "{",
		lbrack: "[",
		lbrke: "⦋",
		lbrksld: "⦏",
		lbrkslu: "⦍",
		Lcaron: "Ľ",
		lcaron: "ľ",
		Lcedil: "Ļ",
		lcedil: "ļ",
		lceil: "⌈",
		lcub: "{",
		Lcy: "Л",
		lcy: "л",
		ldca: "⤶",
		ldquo: "“",
		ldquor: "„",
		ldrdhar: "⥧",
		ldrushar: "⥋",
		ldsh: "↲",
		lE: "≦",
		le: "≤",
		LeftAngleBracket: "⟨",
		LeftArrow: "←",
		Leftarrow: "⇐",
		leftarrow: "←",
		LeftArrowBar: "⇤",
		LeftArrowRightArrow: "⇆",
		leftarrowtail: "↢",
		LeftCeiling: "⌈",
		LeftDoubleBracket: "⟦",
		LeftDownTeeVector: "⥡",
		LeftDownVector: "⇃",
		LeftDownVectorBar: "⥙",
		LeftFloor: "⌊",
		leftharpoondown: "↽",
		leftharpoonup: "↼",
		leftleftarrows: "⇇",
		LeftRightArrow: "↔",
		Leftrightarrow: "⇔",
		leftrightarrow: "↔",
		leftrightarrows: "⇆",
		leftrightharpoons: "⇋",
		leftrightsquigarrow: "↭",
		LeftRightVector: "⥎",
		LeftTee: "⊣",
		LeftTeeArrow: "↤",
		LeftTeeVector: "⥚",
		leftthreetimes: "⋋",
		LeftTriangle: "⊲",
		LeftTriangleBar: "⧏",
		LeftTriangleEqual: "⊴",
		LeftUpDownVector: "⥑",
		LeftUpTeeVector: "⥠",
		LeftUpVector: "↿",
		LeftUpVectorBar: "⥘",
		LeftVector: "↼",
		LeftVectorBar: "⥒",
		lEg: "⪋",
		leg: "⋚",
		leq: "≤",
		leqq: "≦",
		leqslant: "⩽",
		les: "⩽",
		lescc: "⪨",
		lesdot: "⩿",
		lesdoto: "⪁",
		lesdotor: "⪃",
		lesg: "⋚︀",
		lesges: "⪓",
		lessapprox: "⪅",
		lessdot: "⋖",
		lesseqgtr: "⋚",
		lesseqqgtr: "⪋",
		LessEqualGreater: "⋚",
		LessFullEqual: "≦",
		LessGreater: "≶",
		lessgtr: "≶",
		LessLess: "⪡",
		lesssim: "≲",
		LessSlantEqual: "⩽",
		LessTilde: "≲",
		lfisht: "⥼",
		lfloor: "⌊",
		Lfr: "𝔏",
		lfr: "𝔩",
		lg: "≶",
		lgE: "⪑",
		lHar: "⥢",
		lhard: "↽",
		lharu: "↼",
		lharul: "⥪",
		lhblk: "▄",
		LJcy: "Љ",
		ljcy: "љ",
		Ll: "⋘",
		ll: "≪",
		llarr: "⇇",
		llcorner: "⌞",
		Lleftarrow: "⇚",
		llhard: "⥫",
		lltri: "◺",
		Lmidot: "Ŀ",
		lmidot: "ŀ",
		lmoust: "⎰",
		lmoustache: "⎰",
		lnap: "⪉",
		lnapprox: "⪉",
		lnE: "≨",
		lne: "⪇",
		lneq: "⪇",
		lneqq: "≨",
		lnsim: "⋦",
		loang: "⟬",
		loarr: "⇽",
		lobrk: "⟦",
		LongLeftArrow: "⟵",
		Longleftarrow: "⟸",
		longleftarrow: "⟵",
		LongLeftRightArrow: "⟷",
		Longleftrightarrow: "⟺",
		longleftrightarrow: "⟷",
		longmapsto: "⟼",
		LongRightArrow: "⟶",
		Longrightarrow: "⟹",
		longrightarrow: "⟶",
		looparrowleft: "↫",
		looparrowright: "↬",
		lopar: "⦅",
		Lopf: "𝕃",
		lopf: "𝕝",
		loplus: "⨭",
		lotimes: "⨴",
		lowast: "∗",
		lowbar: "_",
		LowerLeftArrow: "↙",
		LowerRightArrow: "↘",
		loz: "◊",
		lozenge: "◊",
		lozf: "⧫",
		lpar: "(",
		lparlt: "⦓",
		lrarr: "⇆",
		lrcorner: "⌟",
		lrhar: "⇋",
		lrhard: "⥭",
		lrm: "‎",
		lrtri: "⊿",
		lsaquo: "‹",
		Lscr: "ℒ",
		lscr: "𝓁",
		Lsh: "↰",
		lsh: "↰",
		lsim: "≲",
		lsime: "⪍",
		lsimg: "⪏",
		lsqb: "[",
		lsquo: "‘",
		lsquor: "‚",
		Lstrok: "Ł",
		lstrok: "ł",
		Lt: "≪",
		LT: "<",
		lt: "<",
		ltcc: "⪦",
		ltcir: "⩹",
		ltdot: "⋖",
		lthree: "⋋",
		ltimes: "⋉",
		ltlarr: "⥶",
		ltquest: "⩻",
		ltri: "◃",
		ltrie: "⊴",
		ltrif: "◂",
		ltrPar: "⦖",
		lurdshar: "⥊",
		luruhar: "⥦",
		lvertneqq: "≨︀",
		lvnE: "≨︀",
		macr: "¯",
		male: "♂",
		malt: "✠",
		maltese: "✠",
		Map: "⤅",
		map: "↦",
		mapsto: "↦",
		mapstodown: "↧",
		mapstoleft: "↤",
		mapstoup: "↥",
		marker: "▮",
		mcomma: "⨩",
		Mcy: "М",
		mcy: "м",
		mdash: "—",
		mDDot: "∺",
		measuredangle: "∡",
		MediumSpace: " ",
		Mellintrf: "ℳ",
		Mfr: "𝔐",
		mfr: "𝔪",
		mho: "℧",
		micro: "µ",
		mid: "∣",
		midast: "*",
		midcir: "⫰",
		middot: "·",
		minus: "−",
		minusb: "⊟",
		minusd: "∸",
		minusdu: "⨪",
		MinusPlus: "∓",
		mlcp: "⫛",
		mldr: "…",
		mnplus: "∓",
		models: "⊧",
		Mopf: "𝕄",
		mopf: "𝕞",
		mp: "∓",
		Mscr: "ℳ",
		mscr: "𝓂",
		mstpos: "∾",
		Mu: "Μ",
		mu: "μ",
		multimap: "⊸",
		mumap: "⊸",
		nabla: "∇",
		Nacute: "Ń",
		nacute: "ń",
		nang: "∠⃒",
		nap: "≉",
		napE: "⩰̸",
		napid: "≋̸",
		napos: "ŉ",
		napprox: "≉",
		natur: "♮",
		natural: "♮",
		naturals: "ℕ",
		nbsp: "\xA0",
		nbump: "≎̸",
		nbumpe: "≏̸",
		ncap: "⩃",
		Ncaron: "Ň",
		ncaron: "ň",
		Ncedil: "Ņ",
		ncedil: "ņ",
		ncong: "≇",
		ncongdot: "⩭̸",
		ncup: "⩂",
		Ncy: "Н",
		ncy: "н",
		ndash: "–",
		ne: "≠",
		nearhk: "⤤",
		neArr: "⇗",
		nearr: "↗",
		nearrow: "↗",
		nedot: "≐̸",
		NegativeMediumSpace: "​",
		NegativeThickSpace: "​",
		NegativeThinSpace: "​",
		NegativeVeryThinSpace: "​",
		nequiv: "≢",
		nesear: "⤨",
		nesim: "≂̸",
		NestedGreaterGreater: "≫",
		NestedLessLess: "≪",
		NewLine: "\n",
		nexist: "∄",
		nexists: "∄",
		Nfr: "𝔑",
		nfr: "𝔫",
		ngE: "≧̸",
		nge: "≱",
		ngeq: "≱",
		ngeqq: "≧̸",
		ngeqslant: "⩾̸",
		nges: "⩾̸",
		nGg: "⋙̸",
		ngsim: "≵",
		nGt: "≫⃒",
		ngt: "≯",
		ngtr: "≯",
		nGtv: "≫̸",
		nhArr: "⇎",
		nharr: "↮",
		nhpar: "⫲",
		ni: "∋",
		nis: "⋼",
		nisd: "⋺",
		niv: "∋",
		NJcy: "Њ",
		njcy: "њ",
		nlArr: "⇍",
		nlarr: "↚",
		nldr: "‥",
		nlE: "≦̸",
		nle: "≰",
		nLeftarrow: "⇍",
		nleftarrow: "↚",
		nLeftrightarrow: "⇎",
		nleftrightarrow: "↮",
		nleq: "≰",
		nleqq: "≦̸",
		nleqslant: "⩽̸",
		nles: "⩽̸",
		nless: "≮",
		nLl: "⋘̸",
		nlsim: "≴",
		nLt: "≪⃒",
		nlt: "≮",
		nltri: "⋪",
		nltrie: "⋬",
		nLtv: "≪̸",
		nmid: "∤",
		NoBreak: "⁠",
		NonBreakingSpace: "\xA0",
		Nopf: "ℕ",
		nopf: "𝕟",
		Not: "⫬",
		not: "¬",
		NotCongruent: "≢",
		NotCupCap: "≭",
		NotDoubleVerticalBar: "∦",
		NotElement: "∉",
		NotEqual: "≠",
		NotEqualTilde: "≂̸",
		NotExists: "∄",
		NotGreater: "≯",
		NotGreaterEqual: "≱",
		NotGreaterFullEqual: "≧̸",
		NotGreaterGreater: "≫̸",
		NotGreaterLess: "≹",
		NotGreaterSlantEqual: "⩾̸",
		NotGreaterTilde: "≵",
		NotHumpDownHump: "≎̸",
		NotHumpEqual: "≏̸",
		notin: "∉",
		notindot: "⋵̸",
		notinE: "⋹̸",
		notinva: "∉",
		notinvb: "⋷",
		notinvc: "⋶",
		NotLeftTriangle: "⋪",
		NotLeftTriangleBar: "⧏̸",
		NotLeftTriangleEqual: "⋬",
		NotLess: "≮",
		NotLessEqual: "≰",
		NotLessGreater: "≸",
		NotLessLess: "≪̸",
		NotLessSlantEqual: "⩽̸",
		NotLessTilde: "≴",
		NotNestedGreaterGreater: "⪢̸",
		NotNestedLessLess: "⪡̸",
		notni: "∌",
		notniva: "∌",
		notnivb: "⋾",
		notnivc: "⋽",
		NotPrecedes: "⊀",
		NotPrecedesEqual: "⪯̸",
		NotPrecedesSlantEqual: "⋠",
		NotReverseElement: "∌",
		NotRightTriangle: "⋫",
		NotRightTriangleBar: "⧐̸",
		NotRightTriangleEqual: "⋭",
		NotSquareSubset: "⊏̸",
		NotSquareSubsetEqual: "⋢",
		NotSquareSuperset: "⊐̸",
		NotSquareSupersetEqual: "⋣",
		NotSubset: "⊂⃒",
		NotSubsetEqual: "⊈",
		NotSucceeds: "⊁",
		NotSucceedsEqual: "⪰̸",
		NotSucceedsSlantEqual: "⋡",
		NotSucceedsTilde: "≿̸",
		NotSuperset: "⊃⃒",
		NotSupersetEqual: "⊉",
		NotTilde: "≁",
		NotTildeEqual: "≄",
		NotTildeFullEqual: "≇",
		NotTildeTilde: "≉",
		NotVerticalBar: "∤",
		npar: "∦",
		nparallel: "∦",
		nparsl: "⫽⃥",
		npart: "∂̸",
		npolint: "⨔",
		npr: "⊀",
		nprcue: "⋠",
		npre: "⪯̸",
		nprec: "⊀",
		npreceq: "⪯̸",
		nrArr: "⇏",
		nrarr: "↛",
		nrarrc: "⤳̸",
		nrarrw: "↝̸",
		nRightarrow: "⇏",
		nrightarrow: "↛",
		nrtri: "⋫",
		nrtrie: "⋭",
		nsc: "⊁",
		nsccue: "⋡",
		nsce: "⪰̸",
		Nscr: "𝒩",
		nscr: "𝓃",
		nshortmid: "∤",
		nshortparallel: "∦",
		nsim: "≁",
		nsime: "≄",
		nsimeq: "≄",
		nsmid: "∤",
		nspar: "∦",
		nsqsube: "⋢",
		nsqsupe: "⋣",
		nsub: "⊄",
		nsubE: "⫅̸",
		nsube: "⊈",
		nsubset: "⊂⃒",
		nsubseteq: "⊈",
		nsubseteqq: "⫅̸",
		nsucc: "⊁",
		nsucceq: "⪰̸",
		nsup: "⊅",
		nsupE: "⫆̸",
		nsupe: "⊉",
		nsupset: "⊃⃒",
		nsupseteq: "⊉",
		nsupseteqq: "⫆̸",
		ntgl: "≹",
		Ntilde: "Ñ",
		ntilde: "ñ",
		ntlg: "≸",
		ntriangleleft: "⋪",
		ntrianglelefteq: "⋬",
		ntriangleright: "⋫",
		ntrianglerighteq: "⋭",
		Nu: "Ν",
		nu: "ν",
		num: "#",
		numero: "№",
		numsp: " ",
		nvap: "≍⃒",
		nVDash: "⊯",
		nVdash: "⊮",
		nvDash: "⊭",
		nvdash: "⊬",
		nvge: "≥⃒",
		nvgt: ">⃒",
		nvHarr: "⤄",
		nvinfin: "⧞",
		nvlArr: "⤂",
		nvle: "≤⃒",
		nvlt: "<⃒",
		nvltrie: "⊴⃒",
		nvrArr: "⤃",
		nvrtrie: "⊵⃒",
		nvsim: "∼⃒",
		nwarhk: "⤣",
		nwArr: "⇖",
		nwarr: "↖",
		nwarrow: "↖",
		nwnear: "⤧",
		Oacute: "Ó",
		oacute: "ó",
		oast: "⊛",
		ocir: "⊚",
		Ocirc: "Ô",
		ocirc: "ô",
		Ocy: "О",
		ocy: "о",
		odash: "⊝",
		Odblac: "Ő",
		odblac: "ő",
		odiv: "⨸",
		odot: "⊙",
		odsold: "⦼",
		OElig: "Œ",
		oelig: "œ",
		ofcir: "⦿",
		Ofr: "𝔒",
		ofr: "𝔬",
		ogon: "˛",
		Ograve: "Ò",
		ograve: "ò",
		ogt: "⧁",
		ohbar: "⦵",
		ohm: "Ω",
		oint: "∮",
		olarr: "↺",
		olcir: "⦾",
		olcross: "⦻",
		oline: "‾",
		olt: "⧀",
		Omacr: "Ō",
		omacr: "ō",
		Omega: "Ω",
		omega: "ω",
		Omicron: "Ο",
		omicron: "ο",
		omid: "⦶",
		ominus: "⊖",
		Oopf: "𝕆",
		oopf: "𝕠",
		opar: "⦷",
		OpenCurlyDoubleQuote: "“",
		OpenCurlyQuote: "‘",
		operp: "⦹",
		oplus: "⊕",
		Or: "⩔",
		or: "∨",
		orarr: "↻",
		ord: "⩝",
		order: "ℴ",
		orderof: "ℴ",
		ordf: "ª",
		ordm: "º",
		origof: "⊶",
		oror: "⩖",
		orslope: "⩗",
		orv: "⩛",
		oS: "Ⓢ",
		Oscr: "𝒪",
		oscr: "ℴ",
		Oslash: "Ø",
		oslash: "ø",
		osol: "⊘",
		Otilde: "Õ",
		otilde: "õ",
		Otimes: "⨷",
		otimes: "⊗",
		otimesas: "⨶",
		Ouml: "Ö",
		ouml: "ö",
		ovbar: "⌽",
		OverBar: "‾",
		OverBrace: "⏞",
		OverBracket: "⎴",
		OverParenthesis: "⏜",
		par: "∥",
		para: "¶",
		parallel: "∥",
		parsim: "⫳",
		parsl: "⫽",
		part: "∂",
		PartialD: "∂",
		Pcy: "П",
		pcy: "п",
		percnt: "%",
		period: ".",
		permil: "‰",
		perp: "⊥",
		pertenk: "‱",
		Pfr: "𝔓",
		pfr: "𝔭",
		Phi: "Φ",
		phi: "φ",
		phiv: "ϕ",
		phmmat: "ℳ",
		phone: "☎",
		Pi: "Π",
		pi: "π",
		pitchfork: "⋔",
		piv: "ϖ",
		planck: "ℏ",
		planckh: "ℎ",
		plankv: "ℏ",
		plus: "+",
		plusacir: "⨣",
		plusb: "⊞",
		pluscir: "⨢",
		plusdo: "∔",
		plusdu: "⨥",
		pluse: "⩲",
		PlusMinus: "±",
		plusmn: "±",
		plussim: "⨦",
		plustwo: "⨧",
		pm: "±",
		Poincareplane: "ℌ",
		pointint: "⨕",
		Popf: "ℙ",
		popf: "𝕡",
		pound: "£",
		Pr: "⪻",
		pr: "≺",
		prap: "⪷",
		prcue: "≼",
		prE: "⪳",
		pre: "⪯",
		prec: "≺",
		precapprox: "⪷",
		preccurlyeq: "≼",
		Precedes: "≺",
		PrecedesEqual: "⪯",
		PrecedesSlantEqual: "≼",
		PrecedesTilde: "≾",
		preceq: "⪯",
		precnapprox: "⪹",
		precneqq: "⪵",
		precnsim: "⋨",
		precsim: "≾",
		Prime: "″",
		prime: "′",
		primes: "ℙ",
		prnap: "⪹",
		prnE: "⪵",
		prnsim: "⋨",
		prod: "∏",
		Product: "∏",
		profalar: "⌮",
		profline: "⌒",
		profsurf: "⌓",
		prop: "∝",
		Proportion: "∷",
		Proportional: "∝",
		propto: "∝",
		prsim: "≾",
		prurel: "⊰",
		Pscr: "𝒫",
		pscr: "𝓅",
		Psi: "Ψ",
		psi: "ψ",
		puncsp: " ",
		Qfr: "𝔔",
		qfr: "𝔮",
		qint: "⨌",
		Qopf: "ℚ",
		qopf: "𝕢",
		qprime: "⁗",
		Qscr: "𝒬",
		qscr: "𝓆",
		quaternions: "ℍ",
		quatint: "⨖",
		quest: "?",
		questeq: "≟",
		QUOT: "\"",
		quot: "\"",
		rAarr: "⇛",
		race: "∽̱",
		Racute: "Ŕ",
		racute: "ŕ",
		radic: "√",
		raemptyv: "⦳",
		Rang: "⟫",
		rang: "⟩",
		rangd: "⦒",
		range: "⦥",
		rangle: "⟩",
		raquo: "»",
		Rarr: "↠",
		rArr: "⇒",
		rarr: "→",
		rarrap: "⥵",
		rarrb: "⇥",
		rarrbfs: "⤠",
		rarrc: "⤳",
		rarrfs: "⤞",
		rarrhk: "↪",
		rarrlp: "↬",
		rarrpl: "⥅",
		rarrsim: "⥴",
		Rarrtl: "⤖",
		rarrtl: "↣",
		rarrw: "↝",
		rAtail: "⤜",
		ratail: "⤚",
		ratio: "∶",
		rationals: "ℚ",
		RBarr: "⤐",
		rBarr: "⤏",
		rbarr: "⤍",
		rbbrk: "❳",
		rbrace: "}",
		rbrack: "]",
		rbrke: "⦌",
		rbrksld: "⦎",
		rbrkslu: "⦐",
		Rcaron: "Ř",
		rcaron: "ř",
		Rcedil: "Ŗ",
		rcedil: "ŗ",
		rceil: "⌉",
		rcub: "}",
		Rcy: "Р",
		rcy: "р",
		rdca: "⤷",
		rdldhar: "⥩",
		rdquo: "”",
		rdquor: "”",
		rdsh: "↳",
		Re: "ℜ",
		real: "ℜ",
		realine: "ℛ",
		realpart: "ℜ",
		reals: "ℝ",
		rect: "▭",
		REG: "®",
		reg: "®",
		ReverseElement: "∋",
		ReverseEquilibrium: "⇋",
		ReverseUpEquilibrium: "⥯",
		rfisht: "⥽",
		rfloor: "⌋",
		Rfr: "ℜ",
		rfr: "𝔯",
		rHar: "⥤",
		rhard: "⇁",
		rharu: "⇀",
		rharul: "⥬",
		Rho: "Ρ",
		rho: "ρ",
		rhov: "ϱ",
		RightAngleBracket: "⟩",
		RightArrow: "→",
		Rightarrow: "⇒",
		rightarrow: "→",
		RightArrowBar: "⇥",
		RightArrowLeftArrow: "⇄",
		rightarrowtail: "↣",
		RightCeiling: "⌉",
		RightDoubleBracket: "⟧",
		RightDownTeeVector: "⥝",
		RightDownVector: "⇂",
		RightDownVectorBar: "⥕",
		RightFloor: "⌋",
		rightharpoondown: "⇁",
		rightharpoonup: "⇀",
		rightleftarrows: "⇄",
		rightleftharpoons: "⇌",
		rightrightarrows: "⇉",
		rightsquigarrow: "↝",
		RightTee: "⊢",
		RightTeeArrow: "↦",
		RightTeeVector: "⥛",
		rightthreetimes: "⋌",
		RightTriangle: "⊳",
		RightTriangleBar: "⧐",
		RightTriangleEqual: "⊵",
		RightUpDownVector: "⥏",
		RightUpTeeVector: "⥜",
		RightUpVector: "↾",
		RightUpVectorBar: "⥔",
		RightVector: "⇀",
		RightVectorBar: "⥓",
		ring: "˚",
		risingdotseq: "≓",
		rlarr: "⇄",
		rlhar: "⇌",
		rlm: "‏",
		rmoust: "⎱",
		rmoustache: "⎱",
		rnmid: "⫮",
		roang: "⟭",
		roarr: "⇾",
		robrk: "⟧",
		ropar: "⦆",
		Ropf: "ℝ",
		ropf: "𝕣",
		roplus: "⨮",
		rotimes: "⨵",
		RoundImplies: "⥰",
		rpar: ")",
		rpargt: "⦔",
		rppolint: "⨒",
		rrarr: "⇉",
		Rrightarrow: "⇛",
		rsaquo: "›",
		Rscr: "ℛ",
		rscr: "𝓇",
		Rsh: "↱",
		rsh: "↱",
		rsqb: "]",
		rsquo: "’",
		rsquor: "’",
		rthree: "⋌",
		rtimes: "⋊",
		rtri: "▹",
		rtrie: "⊵",
		rtrif: "▸",
		rtriltri: "⧎",
		RuleDelayed: "⧴",
		ruluhar: "⥨",
		rx: "℞",
		Sacute: "Ś",
		sacute: "ś",
		sbquo: "‚",
		Sc: "⪼",
		sc: "≻",
		scap: "⪸",
		Scaron: "Š",
		scaron: "š",
		sccue: "≽",
		scE: "⪴",
		sce: "⪰",
		Scedil: "Ş",
		scedil: "ş",
		Scirc: "Ŝ",
		scirc: "ŝ",
		scnap: "⪺",
		scnE: "⪶",
		scnsim: "⋩",
		scpolint: "⨓",
		scsim: "≿",
		Scy: "С",
		scy: "с",
		sdot: "⋅",
		sdotb: "⊡",
		sdote: "⩦",
		searhk: "⤥",
		seArr: "⇘",
		searr: "↘",
		searrow: "↘",
		sect: "§",
		semi: ";",
		seswar: "⤩",
		setminus: "∖",
		setmn: "∖",
		sext: "✶",
		Sfr: "𝔖",
		sfr: "𝔰",
		sfrown: "⌢",
		sharp: "♯",
		SHCHcy: "Щ",
		shchcy: "щ",
		SHcy: "Ш",
		shcy: "ш",
		ShortDownArrow: "↓",
		ShortLeftArrow: "←",
		shortmid: "∣",
		shortparallel: "∥",
		ShortRightArrow: "→",
		ShortUpArrow: "↑",
		shy: "­",
		Sigma: "Σ",
		sigma: "σ",
		sigmaf: "ς",
		sigmav: "ς",
		sim: "∼",
		simdot: "⩪",
		sime: "≃",
		simeq: "≃",
		simg: "⪞",
		simgE: "⪠",
		siml: "⪝",
		simlE: "⪟",
		simne: "≆",
		simplus: "⨤",
		simrarr: "⥲",
		slarr: "←",
		SmallCircle: "∘",
		smallsetminus: "∖",
		smashp: "⨳",
		smeparsl: "⧤",
		smid: "∣",
		smile: "⌣",
		smt: "⪪",
		smte: "⪬",
		smtes: "⪬︀",
		SOFTcy: "Ь",
		softcy: "ь",
		sol: "/",
		solb: "⧄",
		solbar: "⌿",
		Sopf: "𝕊",
		sopf: "𝕤",
		spades: "♠",
		spadesuit: "♠",
		spar: "∥",
		sqcap: "⊓",
		sqcaps: "⊓︀",
		sqcup: "⊔",
		sqcups: "⊔︀",
		Sqrt: "√",
		sqsub: "⊏",
		sqsube: "⊑",
		sqsubset: "⊏",
		sqsubseteq: "⊑",
		sqsup: "⊐",
		sqsupe: "⊒",
		sqsupset: "⊐",
		sqsupseteq: "⊒",
		squ: "□",
		Square: "□",
		square: "□",
		SquareIntersection: "⊓",
		SquareSubset: "⊏",
		SquareSubsetEqual: "⊑",
		SquareSuperset: "⊐",
		SquareSupersetEqual: "⊒",
		SquareUnion: "⊔",
		squarf: "▪",
		squf: "▪",
		srarr: "→",
		Sscr: "𝒮",
		sscr: "𝓈",
		ssetmn: "∖",
		ssmile: "⌣",
		sstarf: "⋆",
		Star: "⋆",
		star: "☆",
		starf: "★",
		straightepsilon: "ϵ",
		straightphi: "ϕ",
		strns: "¯",
		Sub: "⋐",
		sub: "⊂",
		subdot: "⪽",
		subE: "⫅",
		sube: "⊆",
		subedot: "⫃",
		submult: "⫁",
		subnE: "⫋",
		subne: "⊊",
		subplus: "⪿",
		subrarr: "⥹",
		Subset: "⋐",
		subset: "⊂",
		subseteq: "⊆",
		subseteqq: "⫅",
		SubsetEqual: "⊆",
		subsetneq: "⊊",
		subsetneqq: "⫋",
		subsim: "⫇",
		subsub: "⫕",
		subsup: "⫓",
		succ: "≻",
		succapprox: "⪸",
		succcurlyeq: "≽",
		Succeeds: "≻",
		SucceedsEqual: "⪰",
		SucceedsSlantEqual: "≽",
		SucceedsTilde: "≿",
		succeq: "⪰",
		succnapprox: "⪺",
		succneqq: "⪶",
		succnsim: "⋩",
		succsim: "≿",
		SuchThat: "∋",
		Sum: "∑",
		sum: "∑",
		sung: "♪",
		Sup: "⋑",
		sup: "⊃",
		sup1: "¹",
		sup2: "²",
		sup3: "³",
		supdot: "⪾",
		supdsub: "⫘",
		supE: "⫆",
		supe: "⊇",
		supedot: "⫄",
		Superset: "⊃",
		SupersetEqual: "⊇",
		suphsol: "⟉",
		suphsub: "⫗",
		suplarr: "⥻",
		supmult: "⫂",
		supnE: "⫌",
		supne: "⊋",
		supplus: "⫀",
		Supset: "⋑",
		supset: "⊃",
		supseteq: "⊇",
		supseteqq: "⫆",
		supsetneq: "⊋",
		supsetneqq: "⫌",
		supsim: "⫈",
		supsub: "⫔",
		supsup: "⫖",
		swarhk: "⤦",
		swArr: "⇙",
		swarr: "↙",
		swarrow: "↙",
		swnwar: "⤪",
		szlig: "ß",
		Tab: "	",
		target: "⌖",
		Tau: "Τ",
		tau: "τ",
		tbrk: "⎴",
		Tcaron: "Ť",
		tcaron: "ť",
		Tcedil: "Ţ",
		tcedil: "ţ",
		Tcy: "Т",
		tcy: "т",
		tdot: "⃛",
		telrec: "⌕",
		Tfr: "𝔗",
		tfr: "𝔱",
		there4: "∴",
		Therefore: "∴",
		therefore: "∴",
		Theta: "Θ",
		theta: "θ",
		thetasym: "ϑ",
		thetav: "ϑ",
		thickapprox: "≈",
		thicksim: "∼",
		ThickSpace: "  ",
		thinsp: " ",
		ThinSpace: " ",
		thkap: "≈",
		thksim: "∼",
		THORN: "Þ",
		thorn: "þ",
		Tilde: "∼",
		tilde: "˜",
		TildeEqual: "≃",
		TildeFullEqual: "≅",
		TildeTilde: "≈",
		times: "×",
		timesb: "⊠",
		timesbar: "⨱",
		timesd: "⨰",
		tint: "∭",
		toea: "⤨",
		top: "⊤",
		topbot: "⌶",
		topcir: "⫱",
		Topf: "𝕋",
		topf: "𝕥",
		topfork: "⫚",
		tosa: "⤩",
		tprime: "‴",
		TRADE: "™",
		trade: "™",
		triangle: "▵",
		triangledown: "▿",
		triangleleft: "◃",
		trianglelefteq: "⊴",
		triangleq: "≜",
		triangleright: "▹",
		trianglerighteq: "⊵",
		tridot: "◬",
		trie: "≜",
		triminus: "⨺",
		TripleDot: "⃛",
		triplus: "⨹",
		trisb: "⧍",
		tritime: "⨻",
		trpezium: "⏢",
		Tscr: "𝒯",
		tscr: "𝓉",
		TScy: "Ц",
		tscy: "ц",
		TSHcy: "Ћ",
		tshcy: "ћ",
		Tstrok: "Ŧ",
		tstrok: "ŧ",
		twixt: "≬",
		twoheadleftarrow: "↞",
		twoheadrightarrow: "↠",
		Uacute: "Ú",
		uacute: "ú",
		Uarr: "↟",
		uArr: "⇑",
		uarr: "↑",
		Uarrocir: "⥉",
		Ubrcy: "Ў",
		ubrcy: "ў",
		Ubreve: "Ŭ",
		ubreve: "ŭ",
		Ucirc: "Û",
		ucirc: "û",
		Ucy: "У",
		ucy: "у",
		udarr: "⇅",
		Udblac: "Ű",
		udblac: "ű",
		udhar: "⥮",
		ufisht: "⥾",
		Ufr: "𝔘",
		ufr: "𝔲",
		Ugrave: "Ù",
		ugrave: "ù",
		uHar: "⥣",
		uharl: "↿",
		uharr: "↾",
		uhblk: "▀",
		ulcorn: "⌜",
		ulcorner: "⌜",
		ulcrop: "⌏",
		ultri: "◸",
		Umacr: "Ū",
		umacr: "ū",
		uml: "¨",
		UnderBar: "_",
		UnderBrace: "⏟",
		UnderBracket: "⎵",
		UnderParenthesis: "⏝",
		Union: "⋃",
		UnionPlus: "⊎",
		Uogon: "Ų",
		uogon: "ų",
		Uopf: "𝕌",
		uopf: "𝕦",
		UpArrow: "↑",
		Uparrow: "⇑",
		uparrow: "↑",
		UpArrowBar: "⤒",
		UpArrowDownArrow: "⇅",
		UpDownArrow: "↕",
		Updownarrow: "⇕",
		updownarrow: "↕",
		UpEquilibrium: "⥮",
		upharpoonleft: "↿",
		upharpoonright: "↾",
		uplus: "⊎",
		UpperLeftArrow: "↖",
		UpperRightArrow: "↗",
		Upsi: "ϒ",
		upsi: "υ",
		upsih: "ϒ",
		Upsilon: "Υ",
		upsilon: "υ",
		UpTee: "⊥",
		UpTeeArrow: "↥",
		upuparrows: "⇈",
		urcorn: "⌝",
		urcorner: "⌝",
		urcrop: "⌎",
		Uring: "Ů",
		uring: "ů",
		urtri: "◹",
		Uscr: "𝒰",
		uscr: "𝓊",
		utdot: "⋰",
		Utilde: "Ũ",
		utilde: "ũ",
		utri: "▵",
		utrif: "▴",
		uuarr: "⇈",
		Uuml: "Ü",
		uuml: "ü",
		uwangle: "⦧",
		vangrt: "⦜",
		varepsilon: "ϵ",
		varkappa: "ϰ",
		varnothing: "∅",
		varphi: "ϕ",
		varpi: "ϖ",
		varpropto: "∝",
		vArr: "⇕",
		varr: "↕",
		varrho: "ϱ",
		varsigma: "ς",
		varsubsetneq: "⊊︀",
		varsubsetneqq: "⫋︀",
		varsupsetneq: "⊋︀",
		varsupsetneqq: "⫌︀",
		vartheta: "ϑ",
		vartriangleleft: "⊲",
		vartriangleright: "⊳",
		Vbar: "⫫",
		vBar: "⫨",
		vBarv: "⫩",
		Vcy: "В",
		vcy: "в",
		VDash: "⊫",
		Vdash: "⊩",
		vDash: "⊨",
		vdash: "⊢",
		Vdashl: "⫦",
		Vee: "⋁",
		vee: "∨",
		veebar: "⊻",
		veeeq: "≚",
		vellip: "⋮",
		Verbar: "‖",
		verbar: "|",
		Vert: "‖",
		vert: "|",
		VerticalBar: "∣",
		VerticalLine: "|",
		VerticalSeparator: "❘",
		VerticalTilde: "≀",
		VeryThinSpace: " ",
		Vfr: "𝔙",
		vfr: "𝔳",
		vltri: "⊲",
		vnsub: "⊂⃒",
		vnsup: "⊃⃒",
		Vopf: "𝕍",
		vopf: "𝕧",
		vprop: "∝",
		vrtri: "⊳",
		Vscr: "𝒱",
		vscr: "𝓋",
		vsubnE: "⫋︀",
		vsubne: "⊊︀",
		vsupnE: "⫌︀",
		vsupne: "⊋︀",
		Vvdash: "⊪",
		vzigzag: "⦚",
		Wcirc: "Ŵ",
		wcirc: "ŵ",
		wedbar: "⩟",
		Wedge: "⋀",
		wedge: "∧",
		wedgeq: "≙",
		weierp: "℘",
		Wfr: "𝔚",
		wfr: "𝔴",
		Wopf: "𝕎",
		wopf: "𝕨",
		wp: "℘",
		wr: "≀",
		wreath: "≀",
		Wscr: "𝒲",
		wscr: "𝓌",
		xcap: "⋂",
		xcirc: "◯",
		xcup: "⋃",
		xdtri: "▽",
		Xfr: "𝔛",
		xfr: "𝔵",
		xhArr: "⟺",
		xharr: "⟷",
		Xi: "Ξ",
		xi: "ξ",
		xlArr: "⟸",
		xlarr: "⟵",
		xmap: "⟼",
		xnis: "⋻",
		xodot: "⨀",
		Xopf: "𝕏",
		xopf: "𝕩",
		xoplus: "⨁",
		xotime: "⨂",
		xrArr: "⟹",
		xrarr: "⟶",
		Xscr: "𝒳",
		xscr: "𝓍",
		xsqcup: "⨆",
		xuplus: "⨄",
		xutri: "△",
		xvee: "⋁",
		xwedge: "⋀",
		Yacute: "Ý",
		yacute: "ý",
		YAcy: "Я",
		yacy: "я",
		Ycirc: "Ŷ",
		ycirc: "ŷ",
		Ycy: "Ы",
		ycy: "ы",
		yen: "¥",
		Yfr: "𝔜",
		yfr: "𝔶",
		YIcy: "Ї",
		yicy: "ї",
		Yopf: "𝕐",
		yopf: "𝕪",
		Yscr: "𝒴",
		yscr: "𝓎",
		YUcy: "Ю",
		yucy: "ю",
		Yuml: "Ÿ",
		yuml: "ÿ",
		Zacute: "Ź",
		zacute: "ź",
		Zcaron: "Ž",
		zcaron: "ž",
		Zcy: "З",
		zcy: "з",
		Zdot: "Ż",
		zdot: "ż",
		zeetrf: "ℨ",
		ZeroWidthSpace: "​",
		Zeta: "Ζ",
		zeta: "ζ",
		Zfr: "ℨ",
		zfr: "𝔷",
		ZHcy: "Ж",
		zhcy: "ж",
		zigrarr: "⇝",
		Zopf: "ℤ",
		zopf: "𝕫",
		Zscr: "𝒵",
		zscr: "𝓏",
		zwj: "‍",
		zwnj: "‌"
	});
	/**
	* @deprecated use `HTML_ENTITIES` instead
	* @see HTML_ENTITIES
	*/
	exports.entityMap = exports.HTML_ENTITIES;
}));
//#endregion
//#region node_modules/@xmldom/xmldom/lib/sax.js
var require_sax = /* @__PURE__ */ __commonJSMin(((exports) => {
	var NAMESPACE = require_conventions().NAMESPACE;
	var tagNamePattern = require_conventions().tagNamePattern;
	var S_TAG = 0;
	var S_ATTR = 1;
	var S_ATTR_SPACE = 2;
	var S_EQ = 3;
	var S_ATTR_NOQUOT_VALUE = 4;
	var S_ATTR_END = 5;
	var S_TAG_SPACE = 6;
	var S_TAG_CLOSE = 7;
	/**
	* Creates an error that will not be caught by XMLReader aka the SAX parser.
	*
	* @param {string} message
	* @param {any?} locator Optional, can provide details about the location in the source
	* @constructor
	*/
	function ParseError(message, locator) {
		this.message = message;
		this.locator = locator;
		if (Error.captureStackTrace) Error.captureStackTrace(this, ParseError);
	}
	ParseError.prototype = /* @__PURE__ */ new Error();
	ParseError.prototype.name = ParseError.name;
	function XMLReader() {}
	XMLReader.prototype = { parse: function(source, defaultNSMap, entityMap) {
		var domBuilder = this.domBuilder;
		domBuilder.startDocument();
		_copy(defaultNSMap, defaultNSMap = {});
		parse(source, defaultNSMap, entityMap, domBuilder, this.errorHandler);
		domBuilder.endDocument();
	} };
	function parse(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
		function fixedFromCharCode(code) {
			if (code > 65535) {
				code -= 65536;
				var surrogate1 = 55296 + (code >> 10), surrogate2 = 56320 + (code & 1023);
				return String.fromCharCode(surrogate1, surrogate2);
			} else return String.fromCharCode(code);
		}
		function entityReplacer(a) {
			var k = a.slice(1, -1);
			if (Object.hasOwnProperty.call(entityMap, k)) return entityMap[k];
			else if (k.charAt(0) === "#") return fixedFromCharCode(parseInt(k.substr(1).replace("x", "0x")));
			else {
				errorHandler.error("entity not found:" + a);
				return a;
			}
		}
		function appendText(end) {
			if (end > start) {
				var xt = source.substring(start, end).replace(/&#?\w+;/g, entityReplacer);
				locator && position(start);
				domBuilder.characters(xt, 0, end - start);
				start = end;
			}
		}
		function position(p, m) {
			while (p >= lineEnd && (m = linePattern.exec(source))) {
				lineStart = m.index;
				lineEnd = lineStart + m[0].length;
				locator.lineNumber++;
			}
			locator.columnNumber = p - lineStart + 1;
		}
		var lineStart = 0;
		var lineEnd = 0;
		var linePattern = /.*(?:\r\n?|\n)|.*$/g;
		var locator = domBuilder.locator;
		var parseStack = [{ currentNSMap: defaultNSMapCopy }];
		var closeMap = {};
		var start = 0;
		while (true) {
			try {
				var tagStart = source.indexOf("<", start);
				if (tagStart < 0) {
					if (!source.substr(start).match(/^\s*$/)) {
						var doc = domBuilder.doc;
						var text = doc.createTextNode(source.substr(start));
						doc.appendChild(text);
						domBuilder.currentElement = text;
					}
					return;
				}
				if (tagStart > start) appendText(tagStart);
				switch (source.charAt(tagStart + 1)) {
					case "/":
						var end = source.indexOf(">", tagStart + 3);
						var tagName = source.substring(tagStart + 2, end).replace(/[ \t\n\r]+$/g, "");
						var config = parseStack.pop();
						if (end < 0) {
							tagName = source.substring(tagStart + 2).replace(/[\s<].*/, "");
							errorHandler.error("end tag name: " + tagName + " is not complete:" + config.tagName);
							end = tagStart + 1 + tagName.length;
						} else if (tagName.match(/\s</)) {
							tagName = tagName.replace(/[\s<].*/, "");
							errorHandler.error("end tag name: " + tagName + " maybe not complete");
							end = tagStart + 1 + tagName.length;
						}
						var localNSMap = config.localNSMap;
						var endMatch = config.tagName == tagName;
						if (endMatch || config.tagName && config.tagName.toLowerCase() == tagName.toLowerCase()) {
							domBuilder.endElement(config.uri, config.localName, tagName);
							if (localNSMap) {
								for (var prefix in localNSMap) if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) domBuilder.endPrefixMapping(prefix);
							}
							if (!endMatch) errorHandler.fatalError("end tag name: " + tagName + " is not match the current start tagName:" + config.tagName);
						} else parseStack.push(config);
						end++;
						break;
					case "?":
						locator && position(tagStart);
						end = parseInstruction(source, tagStart, domBuilder);
						break;
					case "!":
						locator && position(tagStart);
						end = parseDCC(source, tagStart, domBuilder, errorHandler);
						break;
					default:
						locator && position(tagStart);
						var el = new ElementAttributes();
						var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
						var end = parseElementStartPart(source, tagStart, el, currentNSMap, entityReplacer, errorHandler);
						var len = el.length;
						if (!el.closed && fixSelfClosed(source, end, el.tagName, closeMap)) {
							el.closed = true;
							if (!entityMap.nbsp) errorHandler.warning("unclosed xml attribute");
						}
						if (locator && len) {
							var locator2 = copyLocator(locator, {});
							for (var i = 0; i < len; i++) {
								var a = el[i];
								position(a.offset);
								a.locator = copyLocator(locator, {});
							}
							domBuilder.locator = locator2;
							if (appendElement(el, domBuilder, currentNSMap)) parseStack.push(el);
							domBuilder.locator = locator;
						} else if (appendElement(el, domBuilder, currentNSMap)) parseStack.push(el);
						if (NAMESPACE.isHTML(el.uri) && !el.closed) end = parseHtmlSpecialContent(source, end, el.tagName, entityReplacer, domBuilder);
						else end++;
				}
			} catch (e) {
				if (e instanceof ParseError) throw e;
				errorHandler.error("element parse error: " + e);
				end = -1;
			}
			if (end > start) start = end;
			else appendText(Math.max(tagStart, start) + 1);
		}
	}
	function copyLocator(f, t) {
		t.lineNumber = f.lineNumber;
		t.columnNumber = f.columnNumber;
		return t;
	}
	/**
	* @see #appendElement(source,elStartEnd,el,selfClosed,entityReplacer,domBuilder,parseStack);
	* @return end of the elementStartPart(end of elementEndPart for selfClosed el)
	*/
	function parseElementStartPart(source, start, el, currentNSMap, entityReplacer, errorHandler) {
		/**
		* @param {string} qname
		* @param {string} value
		* @param {number} startIndex
		*/
		function addAttribute(qname, value, startIndex) {
			if (el.attributeNames.hasOwnProperty(qname)) errorHandler.fatalError("Attribute " + qname + " redefined");
			el.addValue(qname, value.replace(/[\t\n\r]/g, " ").replace(/&#?\w+;/g, entityReplacer), startIndex);
		}
		var attrName;
		var value;
		var p = ++start;
		var s = S_TAG;
		while (true) {
			var c = source.charAt(p);
			switch (c) {
				case "=":
					if (s === S_ATTR) {
						attrName = source.slice(start, p);
						s = S_EQ;
					} else if (s === S_ATTR_SPACE) s = S_EQ;
					else throw new Error("attribute equal must after attrName");
					break;
				case "'":
				case "\"":
					if (s === S_EQ || s === S_ATTR) {
						if (s === S_ATTR) {
							errorHandler.warning("attribute value must after \"=\"");
							attrName = source.slice(start, p);
						}
						start = p + 1;
						p = source.indexOf(c, start);
						if (p > 0) {
							value = source.slice(start, p);
							addAttribute(attrName, value, start - 1);
							s = S_ATTR_END;
						} else throw new Error("attribute value no end '" + c + "' match");
					} else if (s == S_ATTR_NOQUOT_VALUE) {
						value = source.slice(start, p);
						addAttribute(attrName, value, start);
						errorHandler.warning("attribute \"" + attrName + "\" missed start quot(" + c + ")!!");
						start = p + 1;
						s = S_ATTR_END;
					} else throw new Error("attribute value must after \"=\"");
					break;
				case "/":
					switch (s) {
						case S_TAG: el.setTagName(source.slice(start, p));
						case S_ATTR_END:
						case S_TAG_SPACE:
						case S_TAG_CLOSE:
							s = S_TAG_CLOSE;
							el.closed = true;
						case S_ATTR_NOQUOT_VALUE:
						case S_ATTR: break;
						case S_ATTR_SPACE:
							el.closed = true;
							break;
						default: throw new Error("attribute invalid close char('/')");
					}
					break;
				case "":
					errorHandler.error("unexpected end of input");
					if (s == S_TAG) el.setTagName(source.slice(start, p));
					return p;
				case ">":
					switch (s) {
						case S_TAG: el.setTagName(source.slice(start, p));
						case S_ATTR_END:
						case S_TAG_SPACE:
						case S_TAG_CLOSE: break;
						case S_ATTR_NOQUOT_VALUE:
						case S_ATTR:
							value = source.slice(start, p);
							if (value.slice(-1) === "/") {
								el.closed = true;
								value = value.slice(0, -1);
							}
						case S_ATTR_SPACE:
							if (s === S_ATTR_SPACE) value = attrName;
							if (s == S_ATTR_NOQUOT_VALUE) {
								errorHandler.warning("attribute \"" + value + "\" missed quot(\")!");
								addAttribute(attrName, value, start);
							} else {
								if (!NAMESPACE.isHTML(currentNSMap[""]) || !value.match(/^(?:disabled|checked|selected)$/i)) errorHandler.warning("attribute \"" + value + "\" missed value!! \"" + value + "\" instead!!");
								addAttribute(value, value, start);
							}
							break;
						case S_EQ: throw new Error("attribute value missed!!");
					}
					return p;
				case "": c = " ";
				default: if (c <= " ") switch (s) {
					case S_TAG:
						el.setTagName(source.slice(start, p));
						s = S_TAG_SPACE;
						break;
					case S_ATTR:
						attrName = source.slice(start, p);
						s = S_ATTR_SPACE;
						break;
					case S_ATTR_NOQUOT_VALUE:
						var value = source.slice(start, p);
						errorHandler.warning("attribute \"" + value + "\" missed quot(\")!!");
						addAttribute(attrName, value, start);
					case S_ATTR_END:
						s = S_TAG_SPACE;
						break;
				}
				else switch (s) {
					case S_ATTR_SPACE:
						el.tagName;
						if (!NAMESPACE.isHTML(currentNSMap[""]) || !attrName.match(/^(?:disabled|checked|selected)$/i)) errorHandler.warning("attribute \"" + attrName + "\" missed value!! \"" + attrName + "\" instead2!!");
						addAttribute(attrName, attrName, start);
						start = p;
						s = S_ATTR;
						break;
					case S_ATTR_END: errorHandler.warning("attribute space is required\"" + attrName + "\"!!");
					case S_TAG_SPACE:
						s = S_ATTR;
						start = p;
						break;
					case S_EQ:
						s = S_ATTR_NOQUOT_VALUE;
						start = p;
						break;
					case S_TAG_CLOSE: throw new Error("elements closed character '/' and '>' must be connected to");
				}
			}
			p++;
		}
	}
	/**
	* @return true if has new namespace define
	*/
	function appendElement(el, domBuilder, currentNSMap) {
		var tagName = el.tagName;
		var localNSMap = null;
		var i = el.length;
		while (i--) {
			var a = el[i];
			var qName = a.qName;
			var value = a.value;
			var nsp = qName.indexOf(":");
			if (nsp > 0) {
				var prefix = a.prefix = qName.slice(0, nsp);
				var localName = qName.slice(nsp + 1);
				var nsPrefix = prefix === "xmlns" && localName;
			} else {
				localName = qName;
				prefix = null;
				nsPrefix = qName === "xmlns" && "";
			}
			a.localName = localName;
			if (nsPrefix !== false) {
				if (localNSMap == null) {
					localNSMap = {};
					_copy(currentNSMap, currentNSMap = {});
				}
				currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
				a.uri = NAMESPACE.XMLNS;
				domBuilder.startPrefixMapping(nsPrefix, value);
			}
		}
		var i = el.length;
		while (i--) {
			a = el[i];
			var prefix = a.prefix;
			if (prefix) {
				if (prefix === "xml") a.uri = NAMESPACE.XML;
				if (prefix !== "xmlns") a.uri = currentNSMap[prefix || ""];
			}
		}
		var nsp = tagName.indexOf(":");
		if (nsp > 0) {
			prefix = el.prefix = tagName.slice(0, nsp);
			localName = el.localName = tagName.slice(nsp + 1);
		} else {
			prefix = null;
			localName = el.localName = tagName;
		}
		var ns = el.uri = currentNSMap[prefix || ""];
		domBuilder.startElement(ns, localName, tagName, el);
		if (el.closed) {
			domBuilder.endElement(ns, localName, tagName);
			if (localNSMap) {
				for (prefix in localNSMap) if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) domBuilder.endPrefixMapping(prefix);
			}
		} else {
			el.currentNSMap = currentNSMap;
			el.localNSMap = localNSMap;
			return true;
		}
	}
	function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
		if (/^(?:script|textarea)$/i.test(tagName)) {
			var elEndStart = source.indexOf("</" + tagName + ">", elStartEnd);
			var text = source.substring(elStartEnd + 1, elEndStart);
			if (/[&<]/.test(text)) {
				if (/^script$/i.test(tagName)) {
					domBuilder.characters(text, 0, text.length);
					return elEndStart;
				}
				text = text.replace(/&#?\w+;/g, entityReplacer);
				domBuilder.characters(text, 0, text.length);
				return elEndStart;
			}
		}
		return elStartEnd + 1;
	}
	function fixSelfClosed(source, elStartEnd, tagName, closeMap) {
		var pos = closeMap[tagName];
		if (pos == null) {
			pos = source.lastIndexOf("</" + tagName + ">");
			if (pos < elStartEnd) pos = source.lastIndexOf("</" + tagName);
			closeMap[tagName] = pos;
		}
		return pos < elStartEnd;
	}
	function _copy(source, target) {
		for (var n in source) if (Object.prototype.hasOwnProperty.call(source, n)) target[n] = source[n];
	}
	function parseDCC(source, start, domBuilder, errorHandler) {
		switch (source.charAt(start + 2)) {
			case "-": if (source.charAt(start + 3) === "-") {
				var end = source.indexOf("-->", start + 4);
				if (end > start) {
					domBuilder.comment(source, start + 4, end - start - 4);
					return end + 3;
				} else {
					errorHandler.error("Unclosed comment");
					return -1;
				}
			} else return -1;
			default:
				if (source.substr(start + 3, 6) == "CDATA[") {
					var end = source.indexOf("]]>", start + 9);
					domBuilder.startCDATA();
					domBuilder.characters(source, start + 9, end - start - 9);
					domBuilder.endCDATA();
					return end + 3;
				}
				var matchs = split(source, start);
				var len = matchs.length;
				if (len > 1 && /!doctype/i.test(matchs[0][0])) {
					var name = matchs[1][0];
					var pubid = false;
					var sysid = false;
					if (len > 3) {
						if (/^public$/i.test(matchs[2][0])) {
							pubid = matchs[3][0];
							sysid = len > 4 && matchs[4][0];
						} else if (/^system$/i.test(matchs[2][0])) sysid = matchs[3][0];
					}
					var lastMatch = matchs[len - 1];
					domBuilder.startDTD(name, pubid, sysid);
					domBuilder.endDTD();
					return lastMatch.index + lastMatch[0].length;
				}
		}
		return -1;
	}
	function parseInstruction(source, start, domBuilder) {
		var end = source.indexOf("?>", start);
		if (end) {
			var match = source.substring(start, end).match(/^<\?(\S*)\s*([\s\S]*?)$/);
			if (match) {
				match[0].length;
				domBuilder.processingInstruction(match[1], match[2]);
				return end + 2;
			} else return -1;
		}
		return -1;
	}
	function ElementAttributes() {
		this.attributeNames = {};
	}
	ElementAttributes.prototype = {
		setTagName: function(tagName) {
			if (!tagNamePattern.test(tagName)) throw new Error("invalid tagName:" + tagName);
			this.tagName = tagName;
		},
		addValue: function(qName, value, offset) {
			if (!tagNamePattern.test(qName)) throw new Error("invalid attribute:" + qName);
			this.attributeNames[qName] = this.length;
			this[this.length++] = {
				qName,
				value,
				offset
			};
		},
		length: 0,
		getLocalName: function(i) {
			return this[i].localName;
		},
		getLocator: function(i) {
			return this[i].locator;
		},
		getQName: function(i) {
			return this[i].qName;
		},
		getURI: function(i) {
			return this[i].uri;
		},
		getValue: function(i) {
			return this[i].value;
		}
	};
	function split(source, start) {
		var match;
		var buf = [];
		var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
		reg.lastIndex = start;
		reg.exec(source);
		while (match = reg.exec(source)) {
			buf.push(match);
			if (match[1]) return buf;
		}
	}
	exports.XMLReader = XMLReader;
	exports.ParseError = ParseError;
}));
//#endregion
//#region node_modules/@xmldom/xmldom/lib/dom-parser.js
var require_dom_parser = /* @__PURE__ */ __commonJSMin(((exports) => {
	var conventions = require_conventions();
	var dom = require_dom();
	var entities = require_entities();
	var sax = require_sax();
	var DOMImplementation = dom.DOMImplementation;
	var NAMESPACE = conventions.NAMESPACE;
	var ParseError = sax.ParseError;
	var XMLReader = sax.XMLReader;
	/**
	* Normalizes line ending according to https://www.w3.org/TR/xml11/#sec-line-ends:
	*
	* > XML parsed entities are often stored in computer files which,
	* > for editing convenience, are organized into lines.
	* > These lines are typically separated by some combination
	* > of the characters CARRIAGE RETURN (#xD) and LINE FEED (#xA).
	* >
	* > To simplify the tasks of applications, the XML processor must behave
	* > as if it normalized all line breaks in external parsed entities (including the document entity)
	* > on input, before parsing, by translating all of the following to a single #xA character:
	* >
	* > 1. the two-character sequence #xD #xA
	* > 2. the two-character sequence #xD #x85
	* > 3. the single character #x85
	* > 4. the single character #x2028
	* > 5. any #xD character that is not immediately followed by #xA or #x85.
	*
	* @param {string} input
	* @returns {string}
	*/
	function normalizeLineEndings(input) {
		return input.replace(/\r[\n\u0085]/g, "\n").replace(/[\r\u0085\u2028]/g, "\n");
	}
	/**
	* @typedef Locator
	* @property {number} [columnNumber]
	* @property {number} [lineNumber]
	*/
	/**
	* @typedef DOMParserOptions
	* @property {DOMHandler} [domBuilder]
	* @property {Function} [errorHandler]
	* @property {(string) => string} [normalizeLineEndings] used to replace line endings before parsing
	* 						defaults to `normalizeLineEndings`
	* @property {Locator} [locator]
	* @property {Record<string, string>} [xmlns]
	*
	* @see normalizeLineEndings
	*/
	/**
	* The DOMParser interface provides the ability to parse XML or HTML source code
	* from a string into a DOM `Document`.
	*
	* _xmldom is different from the spec in that it allows an `options` parameter,
	* to override the default behavior._
	*
	* @param {DOMParserOptions} [options]
	* @constructor
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
	* @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-parsing-and-serialization
	*/
	function DOMParser(options) {
		this.options = options || { locator: {} };
	}
	DOMParser.prototype.parseFromString = function(source, mimeType) {
		var options = this.options;
		var sax = new XMLReader();
		var domBuilder = options.domBuilder || new DOMHandler();
		var errorHandler = options.errorHandler;
		var locator = options.locator;
		var defaultNSMap = options.xmlns || {};
		var isHTML = /\/x?html?$/.test(mimeType);
		var entityMap = isHTML ? entities.HTML_ENTITIES : entities.XML_ENTITIES;
		if (locator) domBuilder.setDocumentLocator(locator);
		sax.errorHandler = buildErrorHandler(errorHandler, domBuilder, locator);
		sax.domBuilder = options.domBuilder || domBuilder;
		if (isHTML) defaultNSMap[""] = NAMESPACE.HTML;
		defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
		var normalize = options.normalizeLineEndings || normalizeLineEndings;
		if (source && typeof source === "string") sax.parse(normalize(source), defaultNSMap, entityMap);
		else sax.errorHandler.error("invalid doc source");
		return domBuilder.doc;
	};
	function buildErrorHandler(errorImpl, domBuilder, locator) {
		if (!errorImpl) {
			if (domBuilder instanceof DOMHandler) return domBuilder;
			errorImpl = domBuilder;
		}
		var errorHandler = {};
		var isCallback = errorImpl instanceof Function;
		locator = locator || {};
		function build(key) {
			var fn = errorImpl[key];
			if (!fn && isCallback) fn = errorImpl.length == 2 ? function(msg) {
				errorImpl(key, msg);
			} : errorImpl;
			errorHandler[key] = fn && function(msg) {
				fn("[xmldom " + key + "]	" + msg + _locator(locator));
			} || function() {};
		}
		build("warning");
		build("error");
		build("fatalError");
		return errorHandler;
	}
	/**
	* +ContentHandler+ErrorHandler
	* +LexicalHandler+EntityResolver2
	* -DeclHandler-DTDHandler
	*
	* DefaultHandler:EntityResolver, DTDHandler, ContentHandler, ErrorHandler
	* DefaultHandler2:DefaultHandler,LexicalHandler, DeclHandler, EntityResolver2
	* @link http://www.saxproject.org/apidoc/org/xml/sax/helpers/DefaultHandler.html
	*/
	function DOMHandler() {
		this.cdata = false;
	}
	function position(locator, node) {
		node.lineNumber = locator.lineNumber;
		node.columnNumber = locator.columnNumber;
	}
	/**
	* @see org.xml.sax.ContentHandler#startDocument
	* @link http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
	*/
	DOMHandler.prototype = {
		startDocument: function() {
			this.doc = new DOMImplementation().createDocument(null, null, null);
			if (this.locator) this.doc.documentURI = this.locator.systemId;
		},
		startElement: function(namespaceURI, localName, qName, attrs) {
			var doc = this.doc;
			var el = doc.createElementNS(namespaceURI, qName || localName);
			var len = attrs.length;
			appendElement(this, el);
			this.currentElement = el;
			this.locator && position(this.locator, el);
			for (var i = 0; i < len; i++) {
				var namespaceURI = attrs.getURI(i);
				var value = attrs.getValue(i);
				var qName = attrs.getQName(i);
				var attr = doc.createAttributeNS(namespaceURI, qName);
				this.locator && position(attrs.getLocator(i), attr);
				attr.value = attr.nodeValue = value;
				el.setAttributeNode(attr);
			}
		},
		endElement: function(namespaceURI, localName, qName) {
			var current = this.currentElement;
			current.tagName;
			this.currentElement = current.parentNode;
		},
		startPrefixMapping: function(prefix, uri) {},
		endPrefixMapping: function(prefix) {},
		processingInstruction: function(target, data) {
			var ins = this.doc.createProcessingInstruction(target, data);
			this.locator && position(this.locator, ins);
			appendElement(this, ins);
		},
		ignorableWhitespace: function(ch, start, length) {},
		characters: function(chars, start, length) {
			chars = _toString.apply(this, arguments);
			if (chars) {
				if (this.cdata) var charNode = this.doc.createCDATASection(chars);
				else var charNode = this.doc.createTextNode(chars);
				if (this.currentElement) this.currentElement.appendChild(charNode);
				else if (/^\s*$/.test(chars)) this.doc.appendChild(charNode);
				this.locator && position(this.locator, charNode);
			}
		},
		skippedEntity: function(name) {},
		endDocument: function() {
			this.doc.normalize();
		},
		setDocumentLocator: function(locator) {
			if (this.locator = locator) locator.lineNumber = 0;
		},
		comment: function(chars, start, length) {
			chars = _toString.apply(this, arguments);
			var comm = this.doc.createComment(chars);
			this.locator && position(this.locator, comm);
			appendElement(this, comm);
		},
		startCDATA: function() {
			this.cdata = true;
		},
		endCDATA: function() {
			this.cdata = false;
		},
		startDTD: function(name, publicId, systemId) {
			var impl = this.doc.implementation;
			if (impl && impl.createDocumentType) {
				var dt = impl.createDocumentType(name, publicId, systemId);
				this.locator && position(this.locator, dt);
				appendElement(this, dt);
				this.doc.doctype = dt;
			}
		},
		/**
		* @see org.xml.sax.ErrorHandler
		* @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
		*/
		warning: function(error) {
			console.warn("[xmldom warning]	" + error, _locator(this.locator));
		},
		error: function(error) {
			console.error("[xmldom error]	" + error, _locator(this.locator));
		},
		fatalError: function(error) {
			throw new ParseError(error, this.locator);
		}
	};
	function _locator(l) {
		if (l) return "\n@" + (l.systemId || "") + "#[line:" + l.lineNumber + ",col:" + l.columnNumber + "]";
	}
	function _toString(chars, start, length) {
		if (typeof chars == "string") return chars.substr(start, length);
		else {
			if (chars.length >= start + length || start) return new java.lang.String(chars, start, length) + "";
			return chars;
		}
	}
	"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(key) {
		DOMHandler.prototype[key] = function() {
			return null;
		};
	});
	function appendElement(hander, node) {
		if (!hander.currentElement) hander.doc.appendChild(node);
		else hander.currentElement.appendChild(node);
	}
	exports.__DOMHandler = DOMHandler;
	exports.normalizeLineEndings = normalizeLineEndings;
	exports.DOMParser = DOMParser;
}));
//#endregion
//#region node_modules/@xmldom/xmldom/lib/index.js
var require_lib$2 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var dom = require_dom();
	exports.DOMImplementation = dom.DOMImplementation;
	exports.XMLSerializer = dom.XMLSerializer;
	exports.DOMParser = require_dom_parser().DOMParser;
}));
//#endregion
//#region node_modules/mammoth/lib/xml/xmldom.js
var require_xmldom = /* @__PURE__ */ __commonJSMin(((exports) => {
	var xmldom = require_lib$2();
	var dom = require_dom();
	function parseFromString(string) {
		var error = null;
		var document = new xmldom.DOMParser({ errorHandler: function(level, message) {
			error = {
				level,
				message
			};
		} }).parseFromString(string);
		if (error === null) return document;
		else throw new Error(error.level + ": " + error.message);
	}
	exports.parseFromString = parseFromString;
	exports.Node = dom.Node;
}));
//#endregion
//#region node_modules/mammoth/lib/xml/reader.js
var require_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	var promises = require_promises();
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var xmldom = require_xmldom();
	var nodes = require_nodes();
	var Element = nodes.Element;
	exports.readString = readString;
	var Node = xmldom.Node;
	function readString(xmlString, namespaceMap) {
		namespaceMap = namespaceMap || {};
		try {
			var document = xmldom.parseFromString(xmlString, "text/xml");
		} catch (error) {
			return promises.reject(error);
		}
		if (document.documentElement.tagName === "parsererror") return promises.resolve(new Error(document.documentElement.textContent));
		function convertNode(node) {
			switch (node.nodeType) {
				case Node.ELEMENT_NODE: return convertElement(node);
				case Node.TEXT_NODE: return nodes.text(node.nodeValue);
			}
		}
		function convertElement(element) {
			var convertedName = convertName(element);
			var convertedChildren = [];
			_.forEach(element.childNodes, function(childNode) {
				var convertedNode = convertNode(childNode);
				if (convertedNode) convertedChildren.push(convertedNode);
			});
			var convertedAttributes = {};
			_.forEach(element.attributes, function(attribute) {
				convertedAttributes[convertName(attribute)] = attribute.value;
			});
			return new Element(convertedName, convertedAttributes, convertedChildren);
		}
		function convertName(node) {
			if (node.namespaceURI) {
				var mappedPrefix = namespaceMap[node.namespaceURI];
				var prefix;
				if (mappedPrefix) prefix = mappedPrefix + ":";
				else prefix = "{" + node.namespaceURI + "}";
				return prefix + node.localName;
			} else return node.localName;
		}
		return promises.resolve(convertNode(document.documentElement));
	}
}));
//#endregion
//#region node_modules/xmlbuilder/lib/Utility.js
var require_Utility = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var assign, getValue, isArray, isEmpty, isFunction, isObject, isPlainObject, slice = [].slice, hasProp = {}.hasOwnProperty;
		assign = function() {
			var i, key, len, source, sources, target = arguments[0];
			sources = 2 <= arguments.length ? slice.call(arguments, 1) : [];
			if (isFunction(Object.assign)) Object.assign.apply(null, arguments);
			else for (i = 0, len = sources.length; i < len; i++) {
				source = sources[i];
				if (source != null) for (key in source) {
					if (!hasProp.call(source, key)) continue;
					target[key] = source[key];
				}
			}
			return target;
		};
		isFunction = function(val) {
			return !!val && Object.prototype.toString.call(val) === "[object Function]";
		};
		isObject = function(val) {
			var ref;
			return !!val && ((ref = typeof val) === "function" || ref === "object");
		};
		isArray = function(val) {
			if (isFunction(Array.isArray)) return Array.isArray(val);
			else return Object.prototype.toString.call(val) === "[object Array]";
		};
		isEmpty = function(val) {
			var key;
			if (isArray(val)) return !val.length;
			else {
				for (key in val) {
					if (!hasProp.call(val, key)) continue;
					return false;
				}
				return true;
			}
		};
		isPlainObject = function(val) {
			var ctor, proto;
			return isObject(val) && (proto = Object.getPrototypeOf(val)) && (ctor = proto.constructor) && typeof ctor === "function" && ctor instanceof ctor && Function.prototype.toString.call(ctor) === Function.prototype.toString.call(Object);
		};
		getValue = function(obj) {
			if (isFunction(obj.valueOf)) return obj.valueOf();
			else return obj;
		};
		module.exports.assign = assign;
		module.exports.isFunction = isFunction;
		module.exports.isObject = isObject;
		module.exports.isArray = isArray;
		module.exports.isEmpty = isEmpty;
		module.exports.isPlainObject = isPlainObject;
		module.exports.getValue = getValue;
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLAttribute.js
var require_XMLAttribute = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		module.exports = (function() {
			function XMLAttribute(parent, name, value) {
				this.options = parent.options;
				this.stringify = parent.stringify;
				this.parent = parent;
				if (name == null) throw new Error("Missing attribute name. " + this.debugInfo(name));
				if (value == null) throw new Error("Missing attribute value. " + this.debugInfo(name));
				this.name = this.stringify.attName(name);
				this.value = this.stringify.attValue(value);
			}
			XMLAttribute.prototype.clone = function() {
				return Object.create(this);
			};
			XMLAttribute.prototype.toString = function(options) {
				return this.options.writer.set(options).attribute(this);
			};
			XMLAttribute.prototype.debugInfo = function(name) {
				name = name || this.name;
				if (name == null) return "parent: <" + this.parent.name + ">";
				else return "attribute: {" + name + "}, parent: <" + this.parent.name + ">";
			};
			return XMLAttribute;
		})();
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLElement.js
var require_XMLElement = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLAttribute, XMLNode, getValue, isFunction, isObject, ref, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		ref = require_Utility(), isObject = ref.isObject, isFunction = ref.isFunction, getValue = ref.getValue;
		XMLNode = require_XMLNode();
		XMLAttribute = require_XMLAttribute();
		module.exports = (function(superClass) {
			extend(XMLElement, superClass);
			function XMLElement(parent, name, attributes) {
				XMLElement.__super__.constructor.call(this, parent);
				if (name == null) throw new Error("Missing element name. " + this.debugInfo());
				this.name = this.stringify.eleName(name);
				this.attributes = {};
				if (attributes != null) this.attribute(attributes);
				if (parent.isDocument) {
					this.isRoot = true;
					this.documentObject = parent;
					parent.rootObject = this;
				}
			}
			XMLElement.prototype.clone = function() {
				var att, attName, clonedSelf = Object.create(this), ref1;
				if (clonedSelf.isRoot) clonedSelf.documentObject = null;
				clonedSelf.attributes = {};
				ref1 = this.attributes;
				for (attName in ref1) {
					if (!hasProp.call(ref1, attName)) continue;
					att = ref1[attName];
					clonedSelf.attributes[attName] = att.clone();
				}
				clonedSelf.children = [];
				this.children.forEach(function(child) {
					var clonedChild = child.clone();
					clonedChild.parent = clonedSelf;
					return clonedSelf.children.push(clonedChild);
				});
				return clonedSelf;
			};
			XMLElement.prototype.attribute = function(name, value) {
				var attName, attValue;
				if (name != null) name = getValue(name);
				if (isObject(name)) for (attName in name) {
					if (!hasProp.call(name, attName)) continue;
					attValue = name[attName];
					this.attribute(attName, attValue);
				}
				else {
					if (isFunction(value)) value = value.apply();
					if (!this.options.skipNullAttributes || value != null) this.attributes[name] = new XMLAttribute(this, name, value);
				}
				return this;
			};
			XMLElement.prototype.removeAttribute = function(name) {
				var attName, i, len;
				if (name == null) throw new Error("Missing attribute name. " + this.debugInfo());
				name = getValue(name);
				if (Array.isArray(name)) for (i = 0, len = name.length; i < len; i++) {
					attName = name[i];
					delete this.attributes[attName];
				}
				else delete this.attributes[name];
				return this;
			};
			XMLElement.prototype.toString = function(options) {
				return this.options.writer.set(options).element(this);
			};
			XMLElement.prototype.att = function(name, value) {
				return this.attribute(name, value);
			};
			XMLElement.prototype.a = function(name, value) {
				return this.attribute(name, value);
			};
			return XMLElement;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLCData.js
var require_XMLCData = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLNode, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		XMLNode = require_XMLNode();
		module.exports = (function(superClass) {
			extend(XMLCData, superClass);
			function XMLCData(parent, text) {
				XMLCData.__super__.constructor.call(this, parent);
				if (text == null) throw new Error("Missing CDATA text. " + this.debugInfo());
				this.text = this.stringify.cdata(text);
			}
			XMLCData.prototype.clone = function() {
				return Object.create(this);
			};
			XMLCData.prototype.toString = function(options) {
				return this.options.writer.set(options).cdata(this);
			};
			return XMLCData;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLComment.js
var require_XMLComment = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLNode, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		XMLNode = require_XMLNode();
		module.exports = (function(superClass) {
			extend(XMLComment, superClass);
			function XMLComment(parent, text) {
				XMLComment.__super__.constructor.call(this, parent);
				if (text == null) throw new Error("Missing comment text. " + this.debugInfo());
				this.text = this.stringify.comment(text);
			}
			XMLComment.prototype.clone = function() {
				return Object.create(this);
			};
			XMLComment.prototype.toString = function(options) {
				return this.options.writer.set(options).comment(this);
			};
			return XMLComment;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLDeclaration.js
var require_XMLDeclaration = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLNode, isObject, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		isObject = require_Utility().isObject;
		XMLNode = require_XMLNode();
		module.exports = (function(superClass) {
			extend(XMLDeclaration, superClass);
			function XMLDeclaration(parent, version, encoding, standalone) {
				var ref;
				XMLDeclaration.__super__.constructor.call(this, parent);
				if (isObject(version)) ref = version, version = ref.version, encoding = ref.encoding, standalone = ref.standalone;
				if (!version) version = "1.0";
				this.version = this.stringify.xmlVersion(version);
				if (encoding != null) this.encoding = this.stringify.xmlEncoding(encoding);
				if (standalone != null) this.standalone = this.stringify.xmlStandalone(standalone);
			}
			XMLDeclaration.prototype.toString = function(options) {
				return this.options.writer.set(options).declaration(this);
			};
			return XMLDeclaration;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLDTDAttList.js
var require_XMLDTDAttList = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLNode, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		XMLNode = require_XMLNode();
		module.exports = (function(superClass) {
			extend(XMLDTDAttList, superClass);
			function XMLDTDAttList(parent, elementName, attributeName, attributeType, defaultValueType, defaultValue) {
				XMLDTDAttList.__super__.constructor.call(this, parent);
				if (elementName == null) throw new Error("Missing DTD element name. " + this.debugInfo());
				if (attributeName == null) throw new Error("Missing DTD attribute name. " + this.debugInfo(elementName));
				if (!attributeType) throw new Error("Missing DTD attribute type. " + this.debugInfo(elementName));
				if (!defaultValueType) throw new Error("Missing DTD attribute default. " + this.debugInfo(elementName));
				if (defaultValueType.indexOf("#") !== 0) defaultValueType = "#" + defaultValueType;
				if (!defaultValueType.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT. " + this.debugInfo(elementName));
				if (defaultValue && !defaultValueType.match(/^(#FIXED|#DEFAULT)$/)) throw new Error("Default value only applies to #FIXED or #DEFAULT. " + this.debugInfo(elementName));
				this.elementName = this.stringify.eleName(elementName);
				this.attributeName = this.stringify.attName(attributeName);
				this.attributeType = this.stringify.dtdAttType(attributeType);
				this.defaultValue = this.stringify.dtdAttDefault(defaultValue);
				this.defaultValueType = defaultValueType;
			}
			XMLDTDAttList.prototype.toString = function(options) {
				return this.options.writer.set(options).dtdAttList(this);
			};
			return XMLDTDAttList;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLDTDEntity.js
var require_XMLDTDEntity = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLNode, isObject, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		isObject = require_Utility().isObject;
		XMLNode = require_XMLNode();
		module.exports = (function(superClass) {
			extend(XMLDTDEntity, superClass);
			function XMLDTDEntity(parent, pe, name, value) {
				XMLDTDEntity.__super__.constructor.call(this, parent);
				if (name == null) throw new Error("Missing DTD entity name. " + this.debugInfo(name));
				if (value == null) throw new Error("Missing DTD entity value. " + this.debugInfo(name));
				this.pe = !!pe;
				this.name = this.stringify.eleName(name);
				if (!isObject(value)) this.value = this.stringify.dtdEntityValue(value);
				else {
					if (!value.pubID && !value.sysID) throw new Error("Public and/or system identifiers are required for an external entity. " + this.debugInfo(name));
					if (value.pubID && !value.sysID) throw new Error("System identifier is required for a public external entity. " + this.debugInfo(name));
					if (value.pubID != null) this.pubID = this.stringify.dtdPubID(value.pubID);
					if (value.sysID != null) this.sysID = this.stringify.dtdSysID(value.sysID);
					if (value.nData != null) this.nData = this.stringify.dtdNData(value.nData);
					if (this.pe && this.nData) throw new Error("Notation declaration is not allowed in a parameter entity. " + this.debugInfo(name));
				}
			}
			XMLDTDEntity.prototype.toString = function(options) {
				return this.options.writer.set(options).dtdEntity(this);
			};
			return XMLDTDEntity;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLDTDElement.js
var require_XMLDTDElement = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLNode, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		XMLNode = require_XMLNode();
		module.exports = (function(superClass) {
			extend(XMLDTDElement, superClass);
			function XMLDTDElement(parent, name, value) {
				XMLDTDElement.__super__.constructor.call(this, parent);
				if (name == null) throw new Error("Missing DTD element name. " + this.debugInfo());
				if (!value) value = "(#PCDATA)";
				if (Array.isArray(value)) value = "(" + value.join(",") + ")";
				this.name = this.stringify.eleName(name);
				this.value = this.stringify.dtdElementValue(value);
			}
			XMLDTDElement.prototype.toString = function(options) {
				return this.options.writer.set(options).dtdElement(this);
			};
			return XMLDTDElement;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLDTDNotation.js
var require_XMLDTDNotation = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLNode, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		XMLNode = require_XMLNode();
		module.exports = (function(superClass) {
			extend(XMLDTDNotation, superClass);
			function XMLDTDNotation(parent, name, value) {
				XMLDTDNotation.__super__.constructor.call(this, parent);
				if (name == null) throw new Error("Missing DTD notation name. " + this.debugInfo(name));
				if (!value.pubID && !value.sysID) throw new Error("Public or system identifiers are required for an external entity. " + this.debugInfo(name));
				this.name = this.stringify.eleName(name);
				if (value.pubID != null) this.pubID = this.stringify.dtdPubID(value.pubID);
				if (value.sysID != null) this.sysID = this.stringify.dtdSysID(value.sysID);
			}
			XMLDTDNotation.prototype.toString = function(options) {
				return this.options.writer.set(options).dtdNotation(this);
			};
			return XMLDTDNotation;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLDocType.js
var require_XMLDocType = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLNode, isObject, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		isObject = require_Utility().isObject;
		XMLNode = require_XMLNode();
		XMLDTDAttList = require_XMLDTDAttList();
		XMLDTDEntity = require_XMLDTDEntity();
		XMLDTDElement = require_XMLDTDElement();
		XMLDTDNotation = require_XMLDTDNotation();
		module.exports = (function(superClass) {
			extend(XMLDocType, superClass);
			function XMLDocType(parent, pubID, sysID) {
				var ref, ref1;
				XMLDocType.__super__.constructor.call(this, parent);
				this.name = "!DOCTYPE";
				this.documentObject = parent;
				if (isObject(pubID)) ref = pubID, pubID = ref.pubID, sysID = ref.sysID;
				if (sysID == null) ref1 = [pubID, sysID], sysID = ref1[0], pubID = ref1[1];
				if (pubID != null) this.pubID = this.stringify.dtdPubID(pubID);
				if (sysID != null) this.sysID = this.stringify.dtdSysID(sysID);
			}
			XMLDocType.prototype.element = function(name, value) {
				var child = new XMLDTDElement(this, name, value);
				this.children.push(child);
				return this;
			};
			XMLDocType.prototype.attList = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
				var child = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
				this.children.push(child);
				return this;
			};
			XMLDocType.prototype.entity = function(name, value) {
				var child = new XMLDTDEntity(this, false, name, value);
				this.children.push(child);
				return this;
			};
			XMLDocType.prototype.pEntity = function(name, value) {
				var child = new XMLDTDEntity(this, true, name, value);
				this.children.push(child);
				return this;
			};
			XMLDocType.prototype.notation = function(name, value) {
				var child = new XMLDTDNotation(this, name, value);
				this.children.push(child);
				return this;
			};
			XMLDocType.prototype.toString = function(options) {
				return this.options.writer.set(options).docType(this);
			};
			XMLDocType.prototype.ele = function(name, value) {
				return this.element(name, value);
			};
			XMLDocType.prototype.att = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
				return this.attList(elementName, attributeName, attributeType, defaultValueType, defaultValue);
			};
			XMLDocType.prototype.ent = function(name, value) {
				return this.entity(name, value);
			};
			XMLDocType.prototype.pent = function(name, value) {
				return this.pEntity(name, value);
			};
			XMLDocType.prototype.not = function(name, value) {
				return this.notation(name, value);
			};
			XMLDocType.prototype.up = function() {
				return this.root() || this.documentObject;
			};
			return XMLDocType;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLRaw.js
var require_XMLRaw = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLNode, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		XMLNode = require_XMLNode();
		module.exports = (function(superClass) {
			extend(XMLRaw, superClass);
			function XMLRaw(parent, text) {
				XMLRaw.__super__.constructor.call(this, parent);
				if (text == null) throw new Error("Missing raw text. " + this.debugInfo());
				this.value = this.stringify.raw(text);
			}
			XMLRaw.prototype.clone = function() {
				return Object.create(this);
			};
			XMLRaw.prototype.toString = function(options) {
				return this.options.writer.set(options).raw(this);
			};
			return XMLRaw;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLText.js
var require_XMLText = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLNode, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		XMLNode = require_XMLNode();
		module.exports = (function(superClass) {
			extend(XMLText, superClass);
			function XMLText(parent, text) {
				XMLText.__super__.constructor.call(this, parent);
				if (text == null) throw new Error("Missing element text. " + this.debugInfo());
				this.value = this.stringify.eleText(text);
			}
			XMLText.prototype.clone = function() {
				return Object.create(this);
			};
			XMLText.prototype.toString = function(options) {
				return this.options.writer.set(options).text(this);
			};
			return XMLText;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLProcessingInstruction.js
var require_XMLProcessingInstruction = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLNode, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		XMLNode = require_XMLNode();
		module.exports = (function(superClass) {
			extend(XMLProcessingInstruction, superClass);
			function XMLProcessingInstruction(parent, target, value) {
				XMLProcessingInstruction.__super__.constructor.call(this, parent);
				if (target == null) throw new Error("Missing instruction target. " + this.debugInfo());
				this.target = this.stringify.insTarget(target);
				if (value) this.value = this.stringify.insValue(value);
			}
			XMLProcessingInstruction.prototype.clone = function() {
				return Object.create(this);
			};
			XMLProcessingInstruction.prototype.toString = function(options) {
				return this.options.writer.set(options).processingInstruction(this);
			};
			return XMLProcessingInstruction;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLDummy.js
var require_XMLDummy = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLNode, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		XMLNode = require_XMLNode();
		module.exports = (function(superClass) {
			extend(XMLDummy, superClass);
			function XMLDummy(parent) {
				XMLDummy.__super__.constructor.call(this, parent);
				this.isDummy = true;
			}
			XMLDummy.prototype.clone = function() {
				return Object.create(this);
			};
			XMLDummy.prototype.toString = function(options) {
				return "";
			};
			return XMLDummy;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLNode.js
var require_XMLNode = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLCData, XMLComment, XMLDeclaration, XMLDocType, XMLDummy, XMLElement, XMLProcessingInstruction, XMLRaw, XMLText, getValue, isEmpty, isFunction, isObject, ref, hasProp = {}.hasOwnProperty;
		ref = require_Utility(), isObject = ref.isObject, isFunction = ref.isFunction, isEmpty = ref.isEmpty, getValue = ref.getValue;
		XMLElement = null;
		XMLCData = null;
		XMLComment = null;
		XMLDeclaration = null;
		XMLDocType = null;
		XMLRaw = null;
		XMLText = null;
		XMLProcessingInstruction = null;
		XMLDummy = null;
		module.exports = (function() {
			function XMLNode(parent) {
				this.parent = parent;
				if (this.parent) {
					this.options = this.parent.options;
					this.stringify = this.parent.stringify;
				}
				this.children = [];
				if (!XMLElement) {
					XMLElement = require_XMLElement();
					XMLCData = require_XMLCData();
					XMLComment = require_XMLComment();
					XMLDeclaration = require_XMLDeclaration();
					XMLDocType = require_XMLDocType();
					XMLRaw = require_XMLRaw();
					XMLText = require_XMLText();
					XMLProcessingInstruction = require_XMLProcessingInstruction();
					XMLDummy = require_XMLDummy();
				}
			}
			XMLNode.prototype.element = function(name, attributes, text) {
				var childNode, item, j, k, key, lastChild = null, len, len1, ref1, ref2, val;
				if (attributes === null && text == null) ref1 = [{}, null], attributes = ref1[0], text = ref1[1];
				if (attributes == null) attributes = {};
				attributes = getValue(attributes);
				if (!isObject(attributes)) ref2 = [attributes, text], text = ref2[0], attributes = ref2[1];
				if (name != null) name = getValue(name);
				if (Array.isArray(name)) for (j = 0, len = name.length; j < len; j++) {
					item = name[j];
					lastChild = this.element(item);
				}
				else if (isFunction(name)) lastChild = this.element(name.apply());
				else if (isObject(name)) for (key in name) {
					if (!hasProp.call(name, key)) continue;
					val = name[key];
					if (isFunction(val)) val = val.apply();
					if (isObject(val) && isEmpty(val)) val = null;
					if (!this.options.ignoreDecorators && this.stringify.convertAttKey && key.indexOf(this.stringify.convertAttKey) === 0) lastChild = this.attribute(key.substr(this.stringify.convertAttKey.length), val);
					else if (!this.options.separateArrayItems && Array.isArray(val)) for (k = 0, len1 = val.length; k < len1; k++) {
						item = val[k];
						childNode = {};
						childNode[key] = item;
						lastChild = this.element(childNode);
					}
					else if (isObject(val)) {
						lastChild = this.element(key);
						lastChild.element(val);
					} else lastChild = this.element(key, val);
				}
				else if (this.options.skipNullNodes && text === null) lastChild = this.dummy();
				else if (!this.options.ignoreDecorators && this.stringify.convertTextKey && name.indexOf(this.stringify.convertTextKey) === 0) lastChild = this.text(text);
				else if (!this.options.ignoreDecorators && this.stringify.convertCDataKey && name.indexOf(this.stringify.convertCDataKey) === 0) lastChild = this.cdata(text);
				else if (!this.options.ignoreDecorators && this.stringify.convertCommentKey && name.indexOf(this.stringify.convertCommentKey) === 0) lastChild = this.comment(text);
				else if (!this.options.ignoreDecorators && this.stringify.convertRawKey && name.indexOf(this.stringify.convertRawKey) === 0) lastChild = this.raw(text);
				else if (!this.options.ignoreDecorators && this.stringify.convertPIKey && name.indexOf(this.stringify.convertPIKey) === 0) lastChild = this.instruction(name.substr(this.stringify.convertPIKey.length), text);
				else lastChild = this.node(name, attributes, text);
				if (lastChild == null) throw new Error("Could not create any elements with: " + name + ". " + this.debugInfo());
				return lastChild;
			};
			XMLNode.prototype.insertBefore = function(name, attributes, text) {
				var child, i, removed;
				if (this.isRoot) throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
				i = this.parent.children.indexOf(this);
				removed = this.parent.children.splice(i);
				child = this.parent.element(name, attributes, text);
				Array.prototype.push.apply(this.parent.children, removed);
				return child;
			};
			XMLNode.prototype.insertAfter = function(name, attributes, text) {
				var child, i, removed;
				if (this.isRoot) throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
				i = this.parent.children.indexOf(this);
				removed = this.parent.children.splice(i + 1);
				child = this.parent.element(name, attributes, text);
				Array.prototype.push.apply(this.parent.children, removed);
				return child;
			};
			XMLNode.prototype.remove = function() {
				var i;
				if (this.isRoot) throw new Error("Cannot remove the root element. " + this.debugInfo());
				i = this.parent.children.indexOf(this);
				[].splice.apply(this.parent.children, [i, i - i + 1].concat([]));
				return this.parent;
			};
			XMLNode.prototype.node = function(name, attributes, text) {
				var child, ref1;
				if (name != null) name = getValue(name);
				attributes || (attributes = {});
				attributes = getValue(attributes);
				if (!isObject(attributes)) ref1 = [attributes, text], text = ref1[0], attributes = ref1[1];
				child = new XMLElement(this, name, attributes);
				if (text != null) child.text(text);
				this.children.push(child);
				return child;
			};
			XMLNode.prototype.text = function(value) {
				var child = new XMLText(this, value);
				this.children.push(child);
				return this;
			};
			XMLNode.prototype.cdata = function(value) {
				var child = new XMLCData(this, value);
				this.children.push(child);
				return this;
			};
			XMLNode.prototype.comment = function(value) {
				var child = new XMLComment(this, value);
				this.children.push(child);
				return this;
			};
			XMLNode.prototype.commentBefore = function(value) {
				var i = this.parent.children.indexOf(this), removed = this.parent.children.splice(i);
				this.parent.comment(value);
				Array.prototype.push.apply(this.parent.children, removed);
				return this;
			};
			XMLNode.prototype.commentAfter = function(value) {
				var i = this.parent.children.indexOf(this), removed = this.parent.children.splice(i + 1);
				this.parent.comment(value);
				Array.prototype.push.apply(this.parent.children, removed);
				return this;
			};
			XMLNode.prototype.raw = function(value) {
				var child = new XMLRaw(this, value);
				this.children.push(child);
				return this;
			};
			XMLNode.prototype.dummy = function() {
				var child = new XMLDummy(this);
				this.children.push(child);
				return child;
			};
			XMLNode.prototype.instruction = function(target, value) {
				var insTarget, insValue, instruction, j, len;
				if (target != null) target = getValue(target);
				if (value != null) value = getValue(value);
				if (Array.isArray(target)) for (j = 0, len = target.length; j < len; j++) {
					insTarget = target[j];
					this.instruction(insTarget);
				}
				else if (isObject(target)) for (insTarget in target) {
					if (!hasProp.call(target, insTarget)) continue;
					insValue = target[insTarget];
					this.instruction(insTarget, insValue);
				}
				else {
					if (isFunction(value)) value = value.apply();
					instruction = new XMLProcessingInstruction(this, target, value);
					this.children.push(instruction);
				}
				return this;
			};
			XMLNode.prototype.instructionBefore = function(target, value) {
				var i = this.parent.children.indexOf(this), removed = this.parent.children.splice(i);
				this.parent.instruction(target, value);
				Array.prototype.push.apply(this.parent.children, removed);
				return this;
			};
			XMLNode.prototype.instructionAfter = function(target, value) {
				var i = this.parent.children.indexOf(this), removed = this.parent.children.splice(i + 1);
				this.parent.instruction(target, value);
				Array.prototype.push.apply(this.parent.children, removed);
				return this;
			};
			XMLNode.prototype.declaration = function(version, encoding, standalone) {
				var doc = this.document(), xmldec = new XMLDeclaration(doc, version, encoding, standalone);
				if (doc.children[0] instanceof XMLDeclaration) doc.children[0] = xmldec;
				else doc.children.unshift(xmldec);
				return doc.root() || doc;
			};
			XMLNode.prototype.doctype = function(pubID, sysID) {
				var child, doc = this.document(), doctype = new XMLDocType(doc, pubID, sysID), i, j, k, len, len1, ref1 = doc.children, ref2;
				for (i = j = 0, len = ref1.length; j < len; i = ++j) {
					child = ref1[i];
					if (child instanceof XMLDocType) {
						doc.children[i] = doctype;
						return doctype;
					}
				}
				ref2 = doc.children;
				for (i = k = 0, len1 = ref2.length; k < len1; i = ++k) {
					child = ref2[i];
					if (child.isRoot) {
						doc.children.splice(i, 0, doctype);
						return doctype;
					}
				}
				doc.children.push(doctype);
				return doctype;
			};
			XMLNode.prototype.up = function() {
				if (this.isRoot) throw new Error("The root node has no parent. Use doc() if you need to get the document object.");
				return this.parent;
			};
			XMLNode.prototype.root = function() {
				var node = this;
				while (node) if (node.isDocument) return node.rootObject;
				else if (node.isRoot) return node;
				else node = node.parent;
			};
			XMLNode.prototype.document = function() {
				var node = this;
				while (node) if (node.isDocument) return node;
				else node = node.parent;
			};
			XMLNode.prototype.end = function(options) {
				return this.document().end(options);
			};
			XMLNode.prototype.prev = function() {
				var i = this.parent.children.indexOf(this);
				while (i > 0 && this.parent.children[i - 1].isDummy) i = i - 1;
				if (i < 1) throw new Error("Already at the first node. " + this.debugInfo());
				return this.parent.children[i - 1];
			};
			XMLNode.prototype.next = function() {
				var i = this.parent.children.indexOf(this);
				while (i < this.parent.children.length - 1 && this.parent.children[i + 1].isDummy) i = i + 1;
				if (i === -1 || i === this.parent.children.length - 1) throw new Error("Already at the last node. " + this.debugInfo());
				return this.parent.children[i + 1];
			};
			XMLNode.prototype.importDocument = function(doc) {
				var clonedRoot = doc.root().clone();
				clonedRoot.parent = this;
				clonedRoot.isRoot = false;
				this.children.push(clonedRoot);
				return this;
			};
			XMLNode.prototype.debugInfo = function(name) {
				var ref1, ref2;
				name = name || this.name;
				if (name == null && !((ref1 = this.parent) != null ? ref1.name : void 0)) return "";
				else if (name == null) return "parent: <" + this.parent.name + ">";
				else if (!((ref2 = this.parent) != null ? ref2.name : void 0)) return "node: <" + name + ">";
				else return "node: <" + name + ">, parent: <" + this.parent.name + ">";
			};
			XMLNode.prototype.ele = function(name, attributes, text) {
				return this.element(name, attributes, text);
			};
			XMLNode.prototype.nod = function(name, attributes, text) {
				return this.node(name, attributes, text);
			};
			XMLNode.prototype.txt = function(value) {
				return this.text(value);
			};
			XMLNode.prototype.dat = function(value) {
				return this.cdata(value);
			};
			XMLNode.prototype.com = function(value) {
				return this.comment(value);
			};
			XMLNode.prototype.ins = function(target, value) {
				return this.instruction(target, value);
			};
			XMLNode.prototype.doc = function() {
				return this.document();
			};
			XMLNode.prototype.dec = function(version, encoding, standalone) {
				return this.declaration(version, encoding, standalone);
			};
			XMLNode.prototype.dtd = function(pubID, sysID) {
				return this.doctype(pubID, sysID);
			};
			XMLNode.prototype.e = function(name, attributes, text) {
				return this.element(name, attributes, text);
			};
			XMLNode.prototype.n = function(name, attributes, text) {
				return this.node(name, attributes, text);
			};
			XMLNode.prototype.t = function(value) {
				return this.text(value);
			};
			XMLNode.prototype.d = function(value) {
				return this.cdata(value);
			};
			XMLNode.prototype.c = function(value) {
				return this.comment(value);
			};
			XMLNode.prototype.r = function(value) {
				return this.raw(value);
			};
			XMLNode.prototype.i = function(target, value) {
				return this.instruction(target, value);
			};
			XMLNode.prototype.u = function() {
				return this.up();
			};
			XMLNode.prototype.importXMLBuilder = function(doc) {
				return this.importDocument(doc);
			};
			return XMLNode;
		})();
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLStringifier.js
var require_XMLStringifier = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var bind = function(fn, me) {
			return function() {
				return fn.apply(me, arguments);
			};
		}, hasProp = {}.hasOwnProperty;
		module.exports = (function() {
			function XMLStringifier(options) {
				this.assertLegalChar = bind(this.assertLegalChar, this);
				var key, ref, value;
				options || (options = {});
				this.noDoubleEncoding = options.noDoubleEncoding;
				ref = options.stringify || {};
				for (key in ref) {
					if (!hasProp.call(ref, key)) continue;
					value = ref[key];
					this[key] = value;
				}
			}
			XMLStringifier.prototype.eleName = function(val) {
				val = "" + val || "";
				return this.assertLegalChar(val);
			};
			XMLStringifier.prototype.eleText = function(val) {
				val = "" + val || "";
				return this.assertLegalChar(this.elEscape(val));
			};
			XMLStringifier.prototype.cdata = function(val) {
				val = "" + val || "";
				val = val.replace("]]>", "]]]]><![CDATA[>");
				return this.assertLegalChar(val);
			};
			XMLStringifier.prototype.comment = function(val) {
				val = "" + val || "";
				if (val.match(/--/)) throw new Error("Comment text cannot contain double-hypen: " + val);
				return this.assertLegalChar(val);
			};
			XMLStringifier.prototype.raw = function(val) {
				return "" + val || "";
			};
			XMLStringifier.prototype.attName = function(val) {
				return val = "" + val || "";
			};
			XMLStringifier.prototype.attValue = function(val) {
				val = "" + val || "";
				return this.attEscape(val);
			};
			XMLStringifier.prototype.insTarget = function(val) {
				return "" + val || "";
			};
			XMLStringifier.prototype.insValue = function(val) {
				val = "" + val || "";
				if (val.match(/\?>/)) throw new Error("Invalid processing instruction value: " + val);
				return val;
			};
			XMLStringifier.prototype.xmlVersion = function(val) {
				val = "" + val || "";
				if (!val.match(/1\.[0-9]+/)) throw new Error("Invalid version number: " + val);
				return val;
			};
			XMLStringifier.prototype.xmlEncoding = function(val) {
				val = "" + val || "";
				if (!val.match(/^[A-Za-z](?:[A-Za-z0-9._-])*$/)) throw new Error("Invalid encoding: " + val);
				return val;
			};
			XMLStringifier.prototype.xmlStandalone = function(val) {
				if (val) return "yes";
				else return "no";
			};
			XMLStringifier.prototype.dtdPubID = function(val) {
				return "" + val || "";
			};
			XMLStringifier.prototype.dtdSysID = function(val) {
				return "" + val || "";
			};
			XMLStringifier.prototype.dtdElementValue = function(val) {
				return "" + val || "";
			};
			XMLStringifier.prototype.dtdAttType = function(val) {
				return "" + val || "";
			};
			XMLStringifier.prototype.dtdAttDefault = function(val) {
				if (val != null) return "" + val || "";
				else return val;
			};
			XMLStringifier.prototype.dtdEntityValue = function(val) {
				return "" + val || "";
			};
			XMLStringifier.prototype.dtdNData = function(val) {
				return "" + val || "";
			};
			XMLStringifier.prototype.convertAttKey = "@";
			XMLStringifier.prototype.convertPIKey = "?";
			XMLStringifier.prototype.convertTextKey = "#text";
			XMLStringifier.prototype.convertCDataKey = "#cdata";
			XMLStringifier.prototype.convertCommentKey = "#comment";
			XMLStringifier.prototype.convertRawKey = "#raw";
			XMLStringifier.prototype.assertLegalChar = function(str) {
				var res = str.match(/[\0\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/);
				if (res) throw new Error("Invalid character in string: " + str + " at index " + res.index);
				return str;
			};
			XMLStringifier.prototype.elEscape = function(str) {
				var ampregex = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
				return str.replace(ampregex, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#xD;");
			};
			XMLStringifier.prototype.attEscape = function(str) {
				var ampregex = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
				return str.replace(ampregex, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/\t/g, "&#x9;").replace(/\n/g, "&#xA;").replace(/\r/g, "&#xD;");
			};
			return XMLStringifier;
		})();
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLWriterBase.js
var require_XMLWriterBase = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var hasProp = {}.hasOwnProperty;
		module.exports = (function() {
			function XMLWriterBase(options) {
				var key, ref, ref1, ref2, ref3, ref4, ref5, ref6, value;
				options || (options = {});
				this.pretty = options.pretty || false;
				this.allowEmpty = (ref = options.allowEmpty) != null ? ref : false;
				if (this.pretty) {
					this.indent = (ref1 = options.indent) != null ? ref1 : "  ";
					this.newline = (ref2 = options.newline) != null ? ref2 : "\n";
					this.offset = (ref3 = options.offset) != null ? ref3 : 0;
					this.dontprettytextnodes = (ref4 = options.dontprettytextnodes) != null ? ref4 : 0;
				} else {
					this.indent = "";
					this.newline = "";
					this.offset = 0;
					this.dontprettytextnodes = 0;
				}
				this.spacebeforeslash = (ref5 = options.spacebeforeslash) != null ? ref5 : "";
				if (this.spacebeforeslash === true) this.spacebeforeslash = " ";
				this.newlinedefault = this.newline;
				this.prettydefault = this.pretty;
				ref6 = options.writer || {};
				for (key in ref6) {
					if (!hasProp.call(ref6, key)) continue;
					value = ref6[key];
					this[key] = value;
				}
			}
			XMLWriterBase.prototype.set = function(options) {
				var key, ref, value;
				options || (options = {});
				if ("pretty" in options) this.pretty = options.pretty;
				if ("allowEmpty" in options) this.allowEmpty = options.allowEmpty;
				if (this.pretty) {
					this.indent = "indent" in options ? options.indent : "  ";
					this.newline = "newline" in options ? options.newline : "\n";
					this.offset = "offset" in options ? options.offset : 0;
					this.dontprettytextnodes = "dontprettytextnodes" in options ? options.dontprettytextnodes : 0;
				} else {
					this.indent = "";
					this.newline = "";
					this.offset = 0;
					this.dontprettytextnodes = 0;
				}
				this.spacebeforeslash = "spacebeforeslash" in options ? options.spacebeforeslash : "";
				if (this.spacebeforeslash === true) this.spacebeforeslash = " ";
				this.newlinedefault = this.newline;
				this.prettydefault = this.pretty;
				ref = options.writer || {};
				for (key in ref) {
					if (!hasProp.call(ref, key)) continue;
					value = ref[key];
					this[key] = value;
				}
				return this;
			};
			XMLWriterBase.prototype.space = function(level) {
				var indent;
				if (this.pretty) {
					indent = (level || 0) + this.offset + 1;
					if (indent > 0) return new Array(indent).join(this.indent);
					else return "";
				} else return "";
			};
			return XMLWriterBase;
		})();
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLStringWriter.js
var require_XMLStringWriter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLDummy, XMLElement, XMLProcessingInstruction, XMLRaw, XMLText, XMLWriterBase, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		XMLDeclaration = require_XMLDeclaration();
		XMLDocType = require_XMLDocType();
		XMLCData = require_XMLCData();
		XMLComment = require_XMLComment();
		XMLElement = require_XMLElement();
		XMLRaw = require_XMLRaw();
		XMLText = require_XMLText();
		XMLProcessingInstruction = require_XMLProcessingInstruction();
		XMLDummy = require_XMLDummy();
		XMLDTDAttList = require_XMLDTDAttList();
		XMLDTDElement = require_XMLDTDElement();
		XMLDTDEntity = require_XMLDTDEntity();
		XMLDTDNotation = require_XMLDTDNotation();
		XMLWriterBase = require_XMLWriterBase();
		module.exports = (function(superClass) {
			extend(XMLStringWriter, superClass);
			function XMLStringWriter(options) {
				XMLStringWriter.__super__.constructor.call(this, options);
			}
			XMLStringWriter.prototype.document = function(doc) {
				var child, i, len, r, ref;
				this.textispresent = false;
				r = "";
				ref = doc.children;
				for (i = 0, len = ref.length; i < len; i++) {
					child = ref[i];
					if (child instanceof XMLDummy) continue;
					r += (function() {
						switch (false) {
							case !(child instanceof XMLDeclaration): return this.declaration(child);
							case !(child instanceof XMLDocType): return this.docType(child);
							case !(child instanceof XMLComment): return this.comment(child);
							case !(child instanceof XMLProcessingInstruction): return this.processingInstruction(child);
							default: return this.element(child, 0);
						}
					}).call(this);
				}
				if (this.pretty && r.slice(-this.newline.length) === this.newline) r = r.slice(0, -this.newline.length);
				return r;
			};
			XMLStringWriter.prototype.attribute = function(att) {
				return " " + att.name + "=\"" + att.value + "\"";
			};
			XMLStringWriter.prototype.cdata = function(node, level) {
				return this.space(level) + "<![CDATA[" + node.text + "]]>" + this.newline;
			};
			XMLStringWriter.prototype.comment = function(node, level) {
				return this.space(level) + "<!-- " + node.text + " -->" + this.newline;
			};
			XMLStringWriter.prototype.declaration = function(node, level) {
				var r = this.space(level);
				r += "<?xml version=\"" + node.version + "\"";
				if (node.encoding != null) r += " encoding=\"" + node.encoding + "\"";
				if (node.standalone != null) r += " standalone=\"" + node.standalone + "\"";
				r += this.spacebeforeslash + "?>";
				r += this.newline;
				return r;
			};
			XMLStringWriter.prototype.docType = function(node, level) {
				var child, i, len, r, ref;
				level || (level = 0);
				r = this.space(level);
				r += "<!DOCTYPE " + node.root().name;
				if (node.pubID && node.sysID) r += " PUBLIC \"" + node.pubID + "\" \"" + node.sysID + "\"";
				else if (node.sysID) r += " SYSTEM \"" + node.sysID + "\"";
				if (node.children.length > 0) {
					r += " [";
					r += this.newline;
					ref = node.children;
					for (i = 0, len = ref.length; i < len; i++) {
						child = ref[i];
						r += (function() {
							switch (false) {
								case !(child instanceof XMLDTDAttList): return this.dtdAttList(child, level + 1);
								case !(child instanceof XMLDTDElement): return this.dtdElement(child, level + 1);
								case !(child instanceof XMLDTDEntity): return this.dtdEntity(child, level + 1);
								case !(child instanceof XMLDTDNotation): return this.dtdNotation(child, level + 1);
								case !(child instanceof XMLCData): return this.cdata(child, level + 1);
								case !(child instanceof XMLComment): return this.comment(child, level + 1);
								case !(child instanceof XMLProcessingInstruction): return this.processingInstruction(child, level + 1);
								default: throw new Error("Unknown DTD node type: " + child.constructor.name);
							}
						}).call(this);
					}
					r += "]";
				}
				r += this.spacebeforeslash + ">";
				r += this.newline;
				return r;
			};
			XMLStringWriter.prototype.element = function(node, level) {
				var att, child, i, j, len, len1, name, r, ref, ref1, ref2, space, textispresentwasset;
				level || (level = 0);
				textispresentwasset = false;
				if (this.textispresent) {
					this.newline = "";
					this.pretty = false;
				} else {
					this.newline = this.newlinedefault;
					this.pretty = this.prettydefault;
				}
				space = this.space(level);
				r = "";
				r += space + "<" + node.name;
				ref = node.attributes;
				for (name in ref) {
					if (!hasProp.call(ref, name)) continue;
					att = ref[name];
					r += this.attribute(att);
				}
				if (node.children.length === 0 || node.children.every(function(e) {
					return e.value === "";
				})) if (this.allowEmpty) r += "></" + node.name + ">" + this.newline;
				else r += this.spacebeforeslash + "/>" + this.newline;
				else if (this.pretty && node.children.length === 1 && node.children[0].value != null) {
					r += ">";
					r += node.children[0].value;
					r += "</" + node.name + ">" + this.newline;
				} else {
					if (this.dontprettytextnodes) {
						ref1 = node.children;
						for (i = 0, len = ref1.length; i < len; i++) {
							child = ref1[i];
							if (child.value != null) {
								this.textispresent++;
								textispresentwasset = true;
								break;
							}
						}
					}
					if (this.textispresent) {
						this.newline = "";
						this.pretty = false;
						space = this.space(level);
					}
					r += ">" + this.newline;
					ref2 = node.children;
					for (j = 0, len1 = ref2.length; j < len1; j++) {
						child = ref2[j];
						r += (function() {
							switch (false) {
								case !(child instanceof XMLCData): return this.cdata(child, level + 1);
								case !(child instanceof XMLComment): return this.comment(child, level + 1);
								case !(child instanceof XMLElement): return this.element(child, level + 1);
								case !(child instanceof XMLRaw): return this.raw(child, level + 1);
								case !(child instanceof XMLText): return this.text(child, level + 1);
								case !(child instanceof XMLProcessingInstruction): return this.processingInstruction(child, level + 1);
								case !(child instanceof XMLDummy): return "";
								default: throw new Error("Unknown XML node type: " + child.constructor.name);
							}
						}).call(this);
					}
					if (textispresentwasset) this.textispresent--;
					if (!this.textispresent) {
						this.newline = this.newlinedefault;
						this.pretty = this.prettydefault;
					}
					r += space + "</" + node.name + ">" + this.newline;
				}
				return r;
			};
			XMLStringWriter.prototype.processingInstruction = function(node, level) {
				var r = this.space(level) + "<?" + node.target;
				if (node.value) r += " " + node.value;
				r += this.spacebeforeslash + "?>" + this.newline;
				return r;
			};
			XMLStringWriter.prototype.raw = function(node, level) {
				return this.space(level) + node.value + this.newline;
			};
			XMLStringWriter.prototype.text = function(node, level) {
				return this.space(level) + node.value + this.newline;
			};
			XMLStringWriter.prototype.dtdAttList = function(node, level) {
				var r = this.space(level) + "<!ATTLIST " + node.elementName + " " + node.attributeName + " " + node.attributeType;
				if (node.defaultValueType !== "#DEFAULT") r += " " + node.defaultValueType;
				if (node.defaultValue) r += " \"" + node.defaultValue + "\"";
				r += this.spacebeforeslash + ">" + this.newline;
				return r;
			};
			XMLStringWriter.prototype.dtdElement = function(node, level) {
				return this.space(level) + "<!ELEMENT " + node.name + " " + node.value + this.spacebeforeslash + ">" + this.newline;
			};
			XMLStringWriter.prototype.dtdEntity = function(node, level) {
				var r = this.space(level) + "<!ENTITY";
				if (node.pe) r += " %";
				r += " " + node.name;
				if (node.value) r += " \"" + node.value + "\"";
				else {
					if (node.pubID && node.sysID) r += " PUBLIC \"" + node.pubID + "\" \"" + node.sysID + "\"";
					else if (node.sysID) r += " SYSTEM \"" + node.sysID + "\"";
					if (node.nData) r += " NDATA " + node.nData;
				}
				r += this.spacebeforeslash + ">" + this.newline;
				return r;
			};
			XMLStringWriter.prototype.dtdNotation = function(node, level) {
				var r = this.space(level) + "<!NOTATION " + node.name;
				if (node.pubID && node.sysID) r += " PUBLIC \"" + node.pubID + "\" \"" + node.sysID + "\"";
				else if (node.pubID) r += " PUBLIC \"" + node.pubID + "\"";
				else if (node.sysID) r += " SYSTEM \"" + node.sysID + "\"";
				r += this.spacebeforeslash + ">" + this.newline;
				return r;
			};
			XMLStringWriter.prototype.openNode = function(node, level) {
				var att, name, r, ref;
				level || (level = 0);
				if (node instanceof XMLElement) {
					r = this.space(level) + "<" + node.name;
					ref = node.attributes;
					for (name in ref) {
						if (!hasProp.call(ref, name)) continue;
						att = ref[name];
						r += this.attribute(att);
					}
					r += (node.children ? ">" : "/>") + this.newline;
					return r;
				} else {
					r = this.space(level) + "<!DOCTYPE " + node.rootNodeName;
					if (node.pubID && node.sysID) r += " PUBLIC \"" + node.pubID + "\" \"" + node.sysID + "\"";
					else if (node.sysID) r += " SYSTEM \"" + node.sysID + "\"";
					r += (node.children ? " [" : ">") + this.newline;
					return r;
				}
			};
			XMLStringWriter.prototype.closeNode = function(node, level) {
				level || (level = 0);
				switch (false) {
					case !(node instanceof XMLElement): return this.space(level) + "</" + node.name + ">" + this.newline;
					case !(node instanceof XMLDocType): return this.space(level) + "]>" + this.newline;
				}
			};
			return XMLStringWriter;
		})(XMLWriterBase);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLDocument.js
var require_XMLDocument = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLNode, XMLStringWriter, XMLStringifier, isPlainObject, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		isPlainObject = require_Utility().isPlainObject;
		XMLNode = require_XMLNode();
		XMLStringifier = require_XMLStringifier();
		XMLStringWriter = require_XMLStringWriter();
		module.exports = (function(superClass) {
			extend(XMLDocument, superClass);
			function XMLDocument(options) {
				XMLDocument.__super__.constructor.call(this, null);
				this.name = "?xml";
				options || (options = {});
				if (!options.writer) options.writer = new XMLStringWriter();
				this.options = options;
				this.stringify = new XMLStringifier(options);
				this.isDocument = true;
			}
			XMLDocument.prototype.end = function(writer) {
				var writerOptions;
				if (!writer) writer = this.options.writer;
				else if (isPlainObject(writer)) {
					writerOptions = writer;
					writer = this.options.writer.set(writerOptions);
				}
				return writer.document(this);
			};
			XMLDocument.prototype.toString = function(options) {
				return this.options.writer.set(options).document(this);
			};
			return XMLDocument;
		})(XMLNode);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLDocumentCB.js
var require_XMLDocumentCB = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLAttribute, XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLElement, XMLProcessingInstruction, XMLRaw, XMLStringWriter, XMLStringifier, XMLText, getValue, isFunction, isObject, isPlainObject, ref, hasProp = {}.hasOwnProperty;
		ref = require_Utility(), isObject = ref.isObject, isFunction = ref.isFunction, isPlainObject = ref.isPlainObject, getValue = ref.getValue;
		XMLElement = require_XMLElement();
		XMLCData = require_XMLCData();
		XMLComment = require_XMLComment();
		XMLRaw = require_XMLRaw();
		XMLText = require_XMLText();
		XMLProcessingInstruction = require_XMLProcessingInstruction();
		XMLDeclaration = require_XMLDeclaration();
		XMLDocType = require_XMLDocType();
		XMLDTDAttList = require_XMLDTDAttList();
		XMLDTDEntity = require_XMLDTDEntity();
		XMLDTDElement = require_XMLDTDElement();
		XMLDTDNotation = require_XMLDTDNotation();
		XMLAttribute = require_XMLAttribute();
		XMLStringifier = require_XMLStringifier();
		XMLStringWriter = require_XMLStringWriter();
		module.exports = (function() {
			function XMLDocumentCB(options, onData, onEnd) {
				var writerOptions;
				this.name = "?xml";
				options || (options = {});
				if (!options.writer) options.writer = new XMLStringWriter(options);
				else if (isPlainObject(options.writer)) {
					writerOptions = options.writer;
					options.writer = new XMLStringWriter(writerOptions);
				}
				this.options = options;
				this.writer = options.writer;
				this.stringify = new XMLStringifier(options);
				this.onDataCallback = onData || function() {};
				this.onEndCallback = onEnd || function() {};
				this.currentNode = null;
				this.currentLevel = -1;
				this.openTags = {};
				this.documentStarted = false;
				this.documentCompleted = false;
				this.root = null;
			}
			XMLDocumentCB.prototype.node = function(name, attributes, text) {
				var ref1, ref2;
				if (name == null) throw new Error("Missing node name.");
				if (this.root && this.currentLevel === -1) throw new Error("Document can only have one root node. " + this.debugInfo(name));
				this.openCurrent();
				name = getValue(name);
				if (attributes === null && text == null) ref1 = [{}, null], attributes = ref1[0], text = ref1[1];
				if (attributes == null) attributes = {};
				attributes = getValue(attributes);
				if (!isObject(attributes)) ref2 = [attributes, text], text = ref2[0], attributes = ref2[1];
				this.currentNode = new XMLElement(this, name, attributes);
				this.currentNode.children = false;
				this.currentLevel++;
				this.openTags[this.currentLevel] = this.currentNode;
				if (text != null) this.text(text);
				return this;
			};
			XMLDocumentCB.prototype.element = function(name, attributes, text) {
				if (this.currentNode && this.currentNode instanceof XMLDocType) return this.dtdElement.apply(this, arguments);
				else return this.node(name, attributes, text);
			};
			XMLDocumentCB.prototype.attribute = function(name, value) {
				var attName, attValue;
				if (!this.currentNode || this.currentNode.children) throw new Error("att() can only be used immediately after an ele() call in callback mode. " + this.debugInfo(name));
				if (name != null) name = getValue(name);
				if (isObject(name)) for (attName in name) {
					if (!hasProp.call(name, attName)) continue;
					attValue = name[attName];
					this.attribute(attName, attValue);
				}
				else {
					if (isFunction(value)) value = value.apply();
					if (!this.options.skipNullAttributes || value != null) this.currentNode.attributes[name] = new XMLAttribute(this, name, value);
				}
				return this;
			};
			XMLDocumentCB.prototype.text = function(value) {
				var node;
				this.openCurrent();
				node = new XMLText(this, value);
				this.onData(this.writer.text(node, this.currentLevel + 1), this.currentLevel + 1);
				return this;
			};
			XMLDocumentCB.prototype.cdata = function(value) {
				var node;
				this.openCurrent();
				node = new XMLCData(this, value);
				this.onData(this.writer.cdata(node, this.currentLevel + 1), this.currentLevel + 1);
				return this;
			};
			XMLDocumentCB.prototype.comment = function(value) {
				var node;
				this.openCurrent();
				node = new XMLComment(this, value);
				this.onData(this.writer.comment(node, this.currentLevel + 1), this.currentLevel + 1);
				return this;
			};
			XMLDocumentCB.prototype.raw = function(value) {
				var node;
				this.openCurrent();
				node = new XMLRaw(this, value);
				this.onData(this.writer.raw(node, this.currentLevel + 1), this.currentLevel + 1);
				return this;
			};
			XMLDocumentCB.prototype.instruction = function(target, value) {
				var i, insTarget, insValue, len, node;
				this.openCurrent();
				if (target != null) target = getValue(target);
				if (value != null) value = getValue(value);
				if (Array.isArray(target)) for (i = 0, len = target.length; i < len; i++) {
					insTarget = target[i];
					this.instruction(insTarget);
				}
				else if (isObject(target)) for (insTarget in target) {
					if (!hasProp.call(target, insTarget)) continue;
					insValue = target[insTarget];
					this.instruction(insTarget, insValue);
				}
				else {
					if (isFunction(value)) value = value.apply();
					node = new XMLProcessingInstruction(this, target, value);
					this.onData(this.writer.processingInstruction(node, this.currentLevel + 1), this.currentLevel + 1);
				}
				return this;
			};
			XMLDocumentCB.prototype.declaration = function(version, encoding, standalone) {
				var node;
				this.openCurrent();
				if (this.documentStarted) throw new Error("declaration() must be the first node.");
				node = new XMLDeclaration(this, version, encoding, standalone);
				this.onData(this.writer.declaration(node, this.currentLevel + 1), this.currentLevel + 1);
				return this;
			};
			XMLDocumentCB.prototype.doctype = function(root, pubID, sysID) {
				this.openCurrent();
				if (root == null) throw new Error("Missing root node name.");
				if (this.root) throw new Error("dtd() must come before the root node.");
				this.currentNode = new XMLDocType(this, pubID, sysID);
				this.currentNode.rootNodeName = root;
				this.currentNode.children = false;
				this.currentLevel++;
				this.openTags[this.currentLevel] = this.currentNode;
				return this;
			};
			XMLDocumentCB.prototype.dtdElement = function(name, value) {
				var node;
				this.openCurrent();
				node = new XMLDTDElement(this, name, value);
				this.onData(this.writer.dtdElement(node, this.currentLevel + 1), this.currentLevel + 1);
				return this;
			};
			XMLDocumentCB.prototype.attList = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
				var node;
				this.openCurrent();
				node = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
				this.onData(this.writer.dtdAttList(node, this.currentLevel + 1), this.currentLevel + 1);
				return this;
			};
			XMLDocumentCB.prototype.entity = function(name, value) {
				var node;
				this.openCurrent();
				node = new XMLDTDEntity(this, false, name, value);
				this.onData(this.writer.dtdEntity(node, this.currentLevel + 1), this.currentLevel + 1);
				return this;
			};
			XMLDocumentCB.prototype.pEntity = function(name, value) {
				var node;
				this.openCurrent();
				node = new XMLDTDEntity(this, true, name, value);
				this.onData(this.writer.dtdEntity(node, this.currentLevel + 1), this.currentLevel + 1);
				return this;
			};
			XMLDocumentCB.prototype.notation = function(name, value) {
				var node;
				this.openCurrent();
				node = new XMLDTDNotation(this, name, value);
				this.onData(this.writer.dtdNotation(node, this.currentLevel + 1), this.currentLevel + 1);
				return this;
			};
			XMLDocumentCB.prototype.up = function() {
				if (this.currentLevel < 0) throw new Error("The document node has no parent.");
				if (this.currentNode) {
					if (this.currentNode.children) this.closeNode(this.currentNode);
					else this.openNode(this.currentNode);
					this.currentNode = null;
				} else this.closeNode(this.openTags[this.currentLevel]);
				delete this.openTags[this.currentLevel];
				this.currentLevel--;
				return this;
			};
			XMLDocumentCB.prototype.end = function() {
				while (this.currentLevel >= 0) this.up();
				return this.onEnd();
			};
			XMLDocumentCB.prototype.openCurrent = function() {
				if (this.currentNode) {
					this.currentNode.children = true;
					return this.openNode(this.currentNode);
				}
			};
			XMLDocumentCB.prototype.openNode = function(node) {
				if (!node.isOpen) {
					if (!this.root && this.currentLevel === 0 && node instanceof XMLElement) this.root = node;
					this.onData(this.writer.openNode(node, this.currentLevel), this.currentLevel);
					return node.isOpen = true;
				}
			};
			XMLDocumentCB.prototype.closeNode = function(node) {
				if (!node.isClosed) {
					this.onData(this.writer.closeNode(node, this.currentLevel), this.currentLevel);
					return node.isClosed = true;
				}
			};
			XMLDocumentCB.prototype.onData = function(chunk, level) {
				this.documentStarted = true;
				return this.onDataCallback(chunk, level + 1);
			};
			XMLDocumentCB.prototype.onEnd = function() {
				this.documentCompleted = true;
				return this.onEndCallback();
			};
			XMLDocumentCB.prototype.debugInfo = function(name) {
				if (name == null) return "";
				else return "node: <" + name + ">";
			};
			XMLDocumentCB.prototype.ele = function() {
				return this.element.apply(this, arguments);
			};
			XMLDocumentCB.prototype.nod = function(name, attributes, text) {
				return this.node(name, attributes, text);
			};
			XMLDocumentCB.prototype.txt = function(value) {
				return this.text(value);
			};
			XMLDocumentCB.prototype.dat = function(value) {
				return this.cdata(value);
			};
			XMLDocumentCB.prototype.com = function(value) {
				return this.comment(value);
			};
			XMLDocumentCB.prototype.ins = function(target, value) {
				return this.instruction(target, value);
			};
			XMLDocumentCB.prototype.dec = function(version, encoding, standalone) {
				return this.declaration(version, encoding, standalone);
			};
			XMLDocumentCB.prototype.dtd = function(root, pubID, sysID) {
				return this.doctype(root, pubID, sysID);
			};
			XMLDocumentCB.prototype.e = function(name, attributes, text) {
				return this.element(name, attributes, text);
			};
			XMLDocumentCB.prototype.n = function(name, attributes, text) {
				return this.node(name, attributes, text);
			};
			XMLDocumentCB.prototype.t = function(value) {
				return this.text(value);
			};
			XMLDocumentCB.prototype.d = function(value) {
				return this.cdata(value);
			};
			XMLDocumentCB.prototype.c = function(value) {
				return this.comment(value);
			};
			XMLDocumentCB.prototype.r = function(value) {
				return this.raw(value);
			};
			XMLDocumentCB.prototype.i = function(target, value) {
				return this.instruction(target, value);
			};
			XMLDocumentCB.prototype.att = function() {
				if (this.currentNode && this.currentNode instanceof XMLDocType) return this.attList.apply(this, arguments);
				else return this.attribute.apply(this, arguments);
			};
			XMLDocumentCB.prototype.a = function() {
				if (this.currentNode && this.currentNode instanceof XMLDocType) return this.attList.apply(this, arguments);
				else return this.attribute.apply(this, arguments);
			};
			XMLDocumentCB.prototype.ent = function(name, value) {
				return this.entity(name, value);
			};
			XMLDocumentCB.prototype.pent = function(name, value) {
				return this.pEntity(name, value);
			};
			XMLDocumentCB.prototype.not = function(name, value) {
				return this.notation(name, value);
			};
			return XMLDocumentCB;
		})();
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/XMLStreamWriter.js
var require_XMLStreamWriter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLDummy, XMLElement, XMLProcessingInstruction, XMLRaw, XMLText, XMLWriterBase, extend = function(child, parent) {
			for (var key in parent) if (hasProp.call(parent, key)) child[key] = parent[key];
			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		}, hasProp = {}.hasOwnProperty;
		XMLDeclaration = require_XMLDeclaration();
		XMLDocType = require_XMLDocType();
		XMLCData = require_XMLCData();
		XMLComment = require_XMLComment();
		XMLElement = require_XMLElement();
		XMLRaw = require_XMLRaw();
		XMLText = require_XMLText();
		XMLProcessingInstruction = require_XMLProcessingInstruction();
		XMLDummy = require_XMLDummy();
		XMLDTDAttList = require_XMLDTDAttList();
		XMLDTDElement = require_XMLDTDElement();
		XMLDTDEntity = require_XMLDTDEntity();
		XMLDTDNotation = require_XMLDTDNotation();
		XMLWriterBase = require_XMLWriterBase();
		module.exports = (function(superClass) {
			extend(XMLStreamWriter, superClass);
			function XMLStreamWriter(stream, options) {
				XMLStreamWriter.__super__.constructor.call(this, options);
				this.stream = stream;
			}
			XMLStreamWriter.prototype.document = function(doc) {
				var child, i, j, len, len1, ref = doc.children, ref1, results;
				for (i = 0, len = ref.length; i < len; i++) {
					child = ref[i];
					child.isLastRootNode = false;
				}
				doc.children[doc.children.length - 1].isLastRootNode = true;
				ref1 = doc.children;
				results = [];
				for (j = 0, len1 = ref1.length; j < len1; j++) {
					child = ref1[j];
					if (child instanceof XMLDummy) continue;
					switch (false) {
						case !(child instanceof XMLDeclaration):
							results.push(this.declaration(child));
							break;
						case !(child instanceof XMLDocType):
							results.push(this.docType(child));
							break;
						case !(child instanceof XMLComment):
							results.push(this.comment(child));
							break;
						case !(child instanceof XMLProcessingInstruction):
							results.push(this.processingInstruction(child));
							break;
						default: results.push(this.element(child));
					}
				}
				return results;
			};
			XMLStreamWriter.prototype.attribute = function(att) {
				return this.stream.write(" " + att.name + "=\"" + att.value + "\"");
			};
			XMLStreamWriter.prototype.cdata = function(node, level) {
				return this.stream.write(this.space(level) + "<![CDATA[" + node.text + "]]>" + this.endline(node));
			};
			XMLStreamWriter.prototype.comment = function(node, level) {
				return this.stream.write(this.space(level) + "<!-- " + node.text + " -->" + this.endline(node));
			};
			XMLStreamWriter.prototype.declaration = function(node, level) {
				this.stream.write(this.space(level));
				this.stream.write("<?xml version=\"" + node.version + "\"");
				if (node.encoding != null) this.stream.write(" encoding=\"" + node.encoding + "\"");
				if (node.standalone != null) this.stream.write(" standalone=\"" + node.standalone + "\"");
				this.stream.write(this.spacebeforeslash + "?>");
				return this.stream.write(this.endline(node));
			};
			XMLStreamWriter.prototype.docType = function(node, level) {
				var child, i, len, ref;
				level || (level = 0);
				this.stream.write(this.space(level));
				this.stream.write("<!DOCTYPE " + node.root().name);
				if (node.pubID && node.sysID) this.stream.write(" PUBLIC \"" + node.pubID + "\" \"" + node.sysID + "\"");
				else if (node.sysID) this.stream.write(" SYSTEM \"" + node.sysID + "\"");
				if (node.children.length > 0) {
					this.stream.write(" [");
					this.stream.write(this.endline(node));
					ref = node.children;
					for (i = 0, len = ref.length; i < len; i++) {
						child = ref[i];
						switch (false) {
							case !(child instanceof XMLDTDAttList):
								this.dtdAttList(child, level + 1);
								break;
							case !(child instanceof XMLDTDElement):
								this.dtdElement(child, level + 1);
								break;
							case !(child instanceof XMLDTDEntity):
								this.dtdEntity(child, level + 1);
								break;
							case !(child instanceof XMLDTDNotation):
								this.dtdNotation(child, level + 1);
								break;
							case !(child instanceof XMLCData):
								this.cdata(child, level + 1);
								break;
							case !(child instanceof XMLComment):
								this.comment(child, level + 1);
								break;
							case !(child instanceof XMLProcessingInstruction):
								this.processingInstruction(child, level + 1);
								break;
							default: throw new Error("Unknown DTD node type: " + child.constructor.name);
						}
					}
					this.stream.write("]");
				}
				this.stream.write(this.spacebeforeslash + ">");
				return this.stream.write(this.endline(node));
			};
			XMLStreamWriter.prototype.element = function(node, level) {
				var att, child, i, len, name, ref, ref1, space;
				level || (level = 0);
				space = this.space(level);
				this.stream.write(space + "<" + node.name);
				ref = node.attributes;
				for (name in ref) {
					if (!hasProp.call(ref, name)) continue;
					att = ref[name];
					this.attribute(att);
				}
				if (node.children.length === 0 || node.children.every(function(e) {
					return e.value === "";
				})) if (this.allowEmpty) this.stream.write("></" + node.name + ">");
				else this.stream.write(this.spacebeforeslash + "/>");
				else if (this.pretty && node.children.length === 1 && node.children[0].value != null) {
					this.stream.write(">");
					this.stream.write(node.children[0].value);
					this.stream.write("</" + node.name + ">");
				} else {
					this.stream.write(">" + this.newline);
					ref1 = node.children;
					for (i = 0, len = ref1.length; i < len; i++) {
						child = ref1[i];
						switch (false) {
							case !(child instanceof XMLCData):
								this.cdata(child, level + 1);
								break;
							case !(child instanceof XMLComment):
								this.comment(child, level + 1);
								break;
							case !(child instanceof XMLElement):
								this.element(child, level + 1);
								break;
							case !(child instanceof XMLRaw):
								this.raw(child, level + 1);
								break;
							case !(child instanceof XMLText):
								this.text(child, level + 1);
								break;
							case !(child instanceof XMLProcessingInstruction):
								this.processingInstruction(child, level + 1);
								break;
							case !(child instanceof XMLDummy): break;
							default: throw new Error("Unknown XML node type: " + child.constructor.name);
						}
					}
					this.stream.write(space + "</" + node.name + ">");
				}
				return this.stream.write(this.endline(node));
			};
			XMLStreamWriter.prototype.processingInstruction = function(node, level) {
				this.stream.write(this.space(level) + "<?" + node.target);
				if (node.value) this.stream.write(" " + node.value);
				return this.stream.write(this.spacebeforeslash + "?>" + this.endline(node));
			};
			XMLStreamWriter.prototype.raw = function(node, level) {
				return this.stream.write(this.space(level) + node.value + this.endline(node));
			};
			XMLStreamWriter.prototype.text = function(node, level) {
				return this.stream.write(this.space(level) + node.value + this.endline(node));
			};
			XMLStreamWriter.prototype.dtdAttList = function(node, level) {
				this.stream.write(this.space(level) + "<!ATTLIST " + node.elementName + " " + node.attributeName + " " + node.attributeType);
				if (node.defaultValueType !== "#DEFAULT") this.stream.write(" " + node.defaultValueType);
				if (node.defaultValue) this.stream.write(" \"" + node.defaultValue + "\"");
				return this.stream.write(this.spacebeforeslash + ">" + this.endline(node));
			};
			XMLStreamWriter.prototype.dtdElement = function(node, level) {
				this.stream.write(this.space(level) + "<!ELEMENT " + node.name + " " + node.value);
				return this.stream.write(this.spacebeforeslash + ">" + this.endline(node));
			};
			XMLStreamWriter.prototype.dtdEntity = function(node, level) {
				this.stream.write(this.space(level) + "<!ENTITY");
				if (node.pe) this.stream.write(" %");
				this.stream.write(" " + node.name);
				if (node.value) this.stream.write(" \"" + node.value + "\"");
				else {
					if (node.pubID && node.sysID) this.stream.write(" PUBLIC \"" + node.pubID + "\" \"" + node.sysID + "\"");
					else if (node.sysID) this.stream.write(" SYSTEM \"" + node.sysID + "\"");
					if (node.nData) this.stream.write(" NDATA " + node.nData);
				}
				return this.stream.write(this.spacebeforeslash + ">" + this.endline(node));
			};
			XMLStreamWriter.prototype.dtdNotation = function(node, level) {
				this.stream.write(this.space(level) + "<!NOTATION " + node.name);
				if (node.pubID && node.sysID) this.stream.write(" PUBLIC \"" + node.pubID + "\" \"" + node.sysID + "\"");
				else if (node.pubID) this.stream.write(" PUBLIC \"" + node.pubID + "\"");
				else if (node.sysID) this.stream.write(" SYSTEM \"" + node.sysID + "\"");
				return this.stream.write(this.spacebeforeslash + ">" + this.endline(node));
			};
			XMLStreamWriter.prototype.endline = function(node) {
				if (!node.isLastRootNode) return this.newline;
				else return "";
			};
			return XMLStreamWriter;
		})(XMLWriterBase);
	}).call(exports);
}));
//#endregion
//#region node_modules/xmlbuilder/lib/index.js
var require_lib$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var XMLDocument, XMLDocumentCB, XMLStreamWriter, XMLStringWriter, assign, isFunction, ref = require_Utility();
		assign = ref.assign, isFunction = ref.isFunction;
		XMLDocument = require_XMLDocument();
		XMLDocumentCB = require_XMLDocumentCB();
		XMLStringWriter = require_XMLStringWriter();
		XMLStreamWriter = require_XMLStreamWriter();
		module.exports.create = function(name, xmldec, doctype, options) {
			var doc, root;
			if (name == null) throw new Error("Root element needs a name.");
			options = assign({}, xmldec, doctype, options);
			doc = new XMLDocument(options);
			root = doc.element(name);
			if (!options.headless) {
				doc.declaration(options);
				if (options.pubID != null || options.sysID != null) doc.doctype(options);
			}
			return root;
		};
		module.exports.begin = function(options, onData, onEnd) {
			var ref1;
			if (isFunction(options)) {
				ref1 = [options, onData], onData = ref1[0], onEnd = ref1[1];
				options = {};
			}
			if (onData) return new XMLDocumentCB(options, onData, onEnd);
			else return new XMLDocument(options);
		};
		module.exports.stringWriter = function(options) {
			return new XMLStringWriter(options);
		};
		module.exports.streamWriter = function(stream, options) {
			return new XMLStreamWriter(stream, options);
		};
	}).call(exports);
}));
//#endregion
//#region node_modules/mammoth/lib/xml/writer.js
var require_writer = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var xmlbuilder = require_lib$1();
	exports.writeString = writeString;
	function writeString(root, namespaces) {
		var uriToPrefix = _.invert(namespaces);
		var nodeWriters = {
			element: writeElement,
			text: writeTextNode
		};
		function writeNode(builder, node) {
			return nodeWriters[node.type](builder, node);
		}
		function writeElement(builder, element) {
			var elementBuilder = builder.element(mapElementName(element.name), element.attributes);
			element.children.forEach(function(child) {
				writeNode(elementBuilder, child);
			});
		}
		function mapElementName(name) {
			var longFormMatch = /^\{(.*)\}(.*)$/.exec(name);
			if (longFormMatch) {
				var prefix = uriToPrefix[longFormMatch[1]];
				return prefix + (prefix === "" ? "" : ":") + longFormMatch[2];
			} else return name;
		}
		function writeDocument(root) {
			var builder = xmlbuilder.create(mapElementName(root.name), {
				version: "1.0",
				encoding: "UTF-8",
				standalone: true
			});
			_.forEach(namespaces, function(uri, prefix) {
				var key = "xmlns" + (prefix === "" ? "" : ":" + prefix);
				builder.attribute(key, uri);
			});
			root.children.forEach(function(child) {
				writeNode(builder, child);
			});
			return builder.end();
		}
		return writeDocument(root);
	}
	function writeTextNode(builder, node) {
		builder.text(node.value);
	}
}));
//#endregion
//#region node_modules/mammoth/lib/xml/index.js
var require_xml = /* @__PURE__ */ __commonJSMin(((exports) => {
	var nodes = require_nodes();
	exports.Element = nodes.Element;
	exports.element = nodes.element;
	exports.emptyElement = nodes.emptyElement;
	exports.text = nodes.text;
	exports.readString = require_reader().readString;
	exports.writeString = require_writer().writeString;
}));
//#endregion
//#region node_modules/mammoth/lib/docx/office-xml-reader.js
var require_office_xml_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var promises = require_promises();
	var xml = require_xml();
	exports.read = read;
	exports.readXmlFromZipFile = readXmlFromZipFile;
	var xmlNamespaceMap = {
		"http://schemas.openxmlformats.org/wordprocessingml/2006/main": "w",
		"http://schemas.openxmlformats.org/officeDocument/2006/relationships": "r",
		"http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing": "wp",
		"http://schemas.openxmlformats.org/drawingml/2006/main": "a",
		"http://schemas.openxmlformats.org/drawingml/2006/picture": "pic",
		"http://purl.oclc.org/ooxml/wordprocessingml/main": "w",
		"http://purl.oclc.org/ooxml/officeDocument/relationships": "r",
		"http://purl.oclc.org/ooxml/drawingml/wordprocessingDrawing": "wp",
		"http://purl.oclc.org/ooxml/drawingml/main": "a",
		"http://purl.oclc.org/ooxml/drawingml/picture": "pic",
		"http://schemas.openxmlformats.org/package/2006/content-types": "content-types",
		"http://schemas.openxmlformats.org/package/2006/relationships": "relationships",
		"http://schemas.openxmlformats.org/markup-compatibility/2006": "mc",
		"urn:schemas-microsoft-com:vml": "v",
		"urn:schemas-microsoft-com:office:word": "office-word",
		"http://schemas.microsoft.com/office/word/2010/wordml": "wordml"
	};
	function read(xmlString) {
		return xml.readString(xmlString, xmlNamespaceMap).then(function(document) {
			return collapseAlternateContent(document)[0];
		});
	}
	function readXmlFromZipFile(docxFile, path) {
		if (docxFile.exists(path)) return docxFile.read(path, "utf-8").then(stripUtf8Bom).then(read);
		else return promises.resolve(null);
	}
	function stripUtf8Bom(xmlString) {
		return xmlString.replace(/^\uFEFF/g, "");
	}
	function collapseAlternateContent(node) {
		if (node.type === "element") if (node.name === "mc:AlternateContent") return node.firstOrEmpty("mc:Fallback").children;
		else {
			node.children = _.flatten(node.children.map(collapseAlternateContent, true));
			return [node];
		}
		else return [node];
	}
}));
//#endregion
//#region node_modules/dingbat-to-unicode/dist/dingbats.js
var require_dingbats = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = [
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "32",
			"Dingbat hex": "20",
			"Unicode dec": "32",
			"Unicode hex": "20"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "33",
			"Dingbat hex": "21",
			"Unicode dec": "33",
			"Unicode hex": "21"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "34",
			"Dingbat hex": "22",
			"Unicode dec": "8704",
			"Unicode hex": "2200"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "35",
			"Dingbat hex": "23",
			"Unicode dec": "35",
			"Unicode hex": "23"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "36",
			"Dingbat hex": "24",
			"Unicode dec": "8707",
			"Unicode hex": "2203"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "37",
			"Dingbat hex": "25",
			"Unicode dec": "37",
			"Unicode hex": "25"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "38",
			"Dingbat hex": "26",
			"Unicode dec": "38",
			"Unicode hex": "26"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "39",
			"Dingbat hex": "27",
			"Unicode dec": "8717",
			"Unicode hex": "220D"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "40",
			"Dingbat hex": "28",
			"Unicode dec": "40",
			"Unicode hex": "28"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "41",
			"Dingbat hex": "29",
			"Unicode dec": "41",
			"Unicode hex": "29"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "42",
			"Dingbat hex": "2A",
			"Unicode dec": "42",
			"Unicode hex": "2A"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "43",
			"Dingbat hex": "2B",
			"Unicode dec": "43",
			"Unicode hex": "2B"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "44",
			"Dingbat hex": "2C",
			"Unicode dec": "44",
			"Unicode hex": "2C"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "45",
			"Dingbat hex": "2D",
			"Unicode dec": "8722",
			"Unicode hex": "2212"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "46",
			"Dingbat hex": "2E",
			"Unicode dec": "46",
			"Unicode hex": "2E"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "47",
			"Dingbat hex": "2F",
			"Unicode dec": "47",
			"Unicode hex": "2F"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "48",
			"Dingbat hex": "30",
			"Unicode dec": "48",
			"Unicode hex": "30"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "49",
			"Dingbat hex": "31",
			"Unicode dec": "49",
			"Unicode hex": "31"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "50",
			"Dingbat hex": "32",
			"Unicode dec": "50",
			"Unicode hex": "32"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "51",
			"Dingbat hex": "33",
			"Unicode dec": "51",
			"Unicode hex": "33"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "52",
			"Dingbat hex": "34",
			"Unicode dec": "52",
			"Unicode hex": "34"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "53",
			"Dingbat hex": "35",
			"Unicode dec": "53",
			"Unicode hex": "35"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "54",
			"Dingbat hex": "36",
			"Unicode dec": "54",
			"Unicode hex": "36"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "55",
			"Dingbat hex": "37",
			"Unicode dec": "55",
			"Unicode hex": "37"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "56",
			"Dingbat hex": "38",
			"Unicode dec": "56",
			"Unicode hex": "38"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "57",
			"Dingbat hex": "39",
			"Unicode dec": "57",
			"Unicode hex": "39"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "58",
			"Dingbat hex": "3A",
			"Unicode dec": "58",
			"Unicode hex": "3A"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "59",
			"Dingbat hex": "3B",
			"Unicode dec": "59",
			"Unicode hex": "3B"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "60",
			"Dingbat hex": "3C",
			"Unicode dec": "60",
			"Unicode hex": "3C"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "61",
			"Dingbat hex": "3D",
			"Unicode dec": "61",
			"Unicode hex": "3D"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "62",
			"Dingbat hex": "3E",
			"Unicode dec": "62",
			"Unicode hex": "3E"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "63",
			"Dingbat hex": "3F",
			"Unicode dec": "63",
			"Unicode hex": "3F"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "64",
			"Dingbat hex": "40",
			"Unicode dec": "8773",
			"Unicode hex": "2245"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "65",
			"Dingbat hex": "41",
			"Unicode dec": "913",
			"Unicode hex": "391"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "66",
			"Dingbat hex": "42",
			"Unicode dec": "914",
			"Unicode hex": "392"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "67",
			"Dingbat hex": "43",
			"Unicode dec": "935",
			"Unicode hex": "3A7"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "68",
			"Dingbat hex": "44",
			"Unicode dec": "916",
			"Unicode hex": "394"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "69",
			"Dingbat hex": "45",
			"Unicode dec": "917",
			"Unicode hex": "395"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "70",
			"Dingbat hex": "46",
			"Unicode dec": "934",
			"Unicode hex": "3A6"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "71",
			"Dingbat hex": "47",
			"Unicode dec": "915",
			"Unicode hex": "393"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "72",
			"Dingbat hex": "48",
			"Unicode dec": "919",
			"Unicode hex": "397"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "73",
			"Dingbat hex": "49",
			"Unicode dec": "921",
			"Unicode hex": "399"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "74",
			"Dingbat hex": "4A",
			"Unicode dec": "977",
			"Unicode hex": "3D1"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "75",
			"Dingbat hex": "4B",
			"Unicode dec": "922",
			"Unicode hex": "39A"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "76",
			"Dingbat hex": "4C",
			"Unicode dec": "923",
			"Unicode hex": "39B"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "77",
			"Dingbat hex": "4D",
			"Unicode dec": "924",
			"Unicode hex": "39C"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "78",
			"Dingbat hex": "4E",
			"Unicode dec": "925",
			"Unicode hex": "39D"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "79",
			"Dingbat hex": "4F",
			"Unicode dec": "927",
			"Unicode hex": "39F"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "80",
			"Dingbat hex": "50",
			"Unicode dec": "928",
			"Unicode hex": "3A0"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "81",
			"Dingbat hex": "51",
			"Unicode dec": "920",
			"Unicode hex": "398"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "82",
			"Dingbat hex": "52",
			"Unicode dec": "929",
			"Unicode hex": "3A1"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "83",
			"Dingbat hex": "53",
			"Unicode dec": "931",
			"Unicode hex": "3A3"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "84",
			"Dingbat hex": "54",
			"Unicode dec": "932",
			"Unicode hex": "3A4"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "85",
			"Dingbat hex": "55",
			"Unicode dec": "933",
			"Unicode hex": "3A5"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "86",
			"Dingbat hex": "56",
			"Unicode dec": "962",
			"Unicode hex": "3C2"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "87",
			"Dingbat hex": "57",
			"Unicode dec": "937",
			"Unicode hex": "3A9"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "88",
			"Dingbat hex": "58",
			"Unicode dec": "926",
			"Unicode hex": "39E"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "89",
			"Dingbat hex": "59",
			"Unicode dec": "936",
			"Unicode hex": "3A8"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "90",
			"Dingbat hex": "5A",
			"Unicode dec": "918",
			"Unicode hex": "396"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "91",
			"Dingbat hex": "5B",
			"Unicode dec": "91",
			"Unicode hex": "5B"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "92",
			"Dingbat hex": "5C",
			"Unicode dec": "8756",
			"Unicode hex": "2234"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "93",
			"Dingbat hex": "5D",
			"Unicode dec": "93",
			"Unicode hex": "5D"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "94",
			"Dingbat hex": "5E",
			"Unicode dec": "8869",
			"Unicode hex": "22A5"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "95",
			"Dingbat hex": "5F",
			"Unicode dec": "95",
			"Unicode hex": "5F"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "96",
			"Dingbat hex": "60",
			"Unicode dec": "8254",
			"Unicode hex": "203E"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "97",
			"Dingbat hex": "61",
			"Unicode dec": "945",
			"Unicode hex": "3B1"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "98",
			"Dingbat hex": "62",
			"Unicode dec": "946",
			"Unicode hex": "3B2"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "99",
			"Dingbat hex": "63",
			"Unicode dec": "967",
			"Unicode hex": "3C7"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "100",
			"Dingbat hex": "64",
			"Unicode dec": "948",
			"Unicode hex": "3B4"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "101",
			"Dingbat hex": "65",
			"Unicode dec": "949",
			"Unicode hex": "3B5"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "102",
			"Dingbat hex": "66",
			"Unicode dec": "966",
			"Unicode hex": "3C6"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "103",
			"Dingbat hex": "67",
			"Unicode dec": "947",
			"Unicode hex": "3B3"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "104",
			"Dingbat hex": "68",
			"Unicode dec": "951",
			"Unicode hex": "3B7"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "105",
			"Dingbat hex": "69",
			"Unicode dec": "953",
			"Unicode hex": "3B9"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "106",
			"Dingbat hex": "6A",
			"Unicode dec": "981",
			"Unicode hex": "3D5"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "107",
			"Dingbat hex": "6B",
			"Unicode dec": "954",
			"Unicode hex": "3BA"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "108",
			"Dingbat hex": "6C",
			"Unicode dec": "955",
			"Unicode hex": "3BB"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "109",
			"Dingbat hex": "6D",
			"Unicode dec": "956",
			"Unicode hex": "3BC"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "110",
			"Dingbat hex": "6E",
			"Unicode dec": "957",
			"Unicode hex": "3BD"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "111",
			"Dingbat hex": "6F",
			"Unicode dec": "959",
			"Unicode hex": "3BF"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "112",
			"Dingbat hex": "70",
			"Unicode dec": "960",
			"Unicode hex": "3C0"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "113",
			"Dingbat hex": "71",
			"Unicode dec": "952",
			"Unicode hex": "3B8"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "114",
			"Dingbat hex": "72",
			"Unicode dec": "961",
			"Unicode hex": "3C1"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "115",
			"Dingbat hex": "73",
			"Unicode dec": "963",
			"Unicode hex": "3C3"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "116",
			"Dingbat hex": "74",
			"Unicode dec": "964",
			"Unicode hex": "3C4"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "117",
			"Dingbat hex": "75",
			"Unicode dec": "965",
			"Unicode hex": "3C5"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "118",
			"Dingbat hex": "76",
			"Unicode dec": "982",
			"Unicode hex": "3D6"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "119",
			"Dingbat hex": "77",
			"Unicode dec": "969",
			"Unicode hex": "3C9"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "120",
			"Dingbat hex": "78",
			"Unicode dec": "958",
			"Unicode hex": "3BE"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "121",
			"Dingbat hex": "79",
			"Unicode dec": "968",
			"Unicode hex": "3C8"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "122",
			"Dingbat hex": "7A",
			"Unicode dec": "950",
			"Unicode hex": "3B6"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "123",
			"Dingbat hex": "7B",
			"Unicode dec": "123",
			"Unicode hex": "7B"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "124",
			"Dingbat hex": "7C",
			"Unicode dec": "124",
			"Unicode hex": "7C"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "125",
			"Dingbat hex": "7D",
			"Unicode dec": "125",
			"Unicode hex": "7D"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "126",
			"Dingbat hex": "7E",
			"Unicode dec": "126",
			"Unicode hex": "7E"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "160",
			"Dingbat hex": "A0",
			"Unicode dec": "8364",
			"Unicode hex": "20AC"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "161",
			"Dingbat hex": "A1",
			"Unicode dec": "978",
			"Unicode hex": "3D2"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "162",
			"Dingbat hex": "A2",
			"Unicode dec": "8242",
			"Unicode hex": "2032"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "163",
			"Dingbat hex": "A3",
			"Unicode dec": "8804",
			"Unicode hex": "2264"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "164",
			"Dingbat hex": "A4",
			"Unicode dec": "8260",
			"Unicode hex": "2044"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "165",
			"Dingbat hex": "A5",
			"Unicode dec": "8734",
			"Unicode hex": "221E"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "166",
			"Dingbat hex": "A6",
			"Unicode dec": "402",
			"Unicode hex": "192"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "167",
			"Dingbat hex": "A7",
			"Unicode dec": "9827",
			"Unicode hex": "2663"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "168",
			"Dingbat hex": "A8",
			"Unicode dec": "9830",
			"Unicode hex": "2666"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "169",
			"Dingbat hex": "A9",
			"Unicode dec": "9829",
			"Unicode hex": "2665"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "170",
			"Dingbat hex": "AA",
			"Unicode dec": "9824",
			"Unicode hex": "2660"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "171",
			"Dingbat hex": "AB",
			"Unicode dec": "8596",
			"Unicode hex": "2194"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "172",
			"Dingbat hex": "AC",
			"Unicode dec": "8592",
			"Unicode hex": "2190"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "173",
			"Dingbat hex": "AD",
			"Unicode dec": "8593",
			"Unicode hex": "2191"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "174",
			"Dingbat hex": "AE",
			"Unicode dec": "8594",
			"Unicode hex": "2192"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "175",
			"Dingbat hex": "AF",
			"Unicode dec": "8595",
			"Unicode hex": "2193"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "176",
			"Dingbat hex": "B0",
			"Unicode dec": "176",
			"Unicode hex": "B0"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "177",
			"Dingbat hex": "B1",
			"Unicode dec": "177",
			"Unicode hex": "B1"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "178",
			"Dingbat hex": "B2",
			"Unicode dec": "8243",
			"Unicode hex": "2033"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "179",
			"Dingbat hex": "B3",
			"Unicode dec": "8805",
			"Unicode hex": "2265"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "180",
			"Dingbat hex": "B4",
			"Unicode dec": "215",
			"Unicode hex": "D7"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "181",
			"Dingbat hex": "B5",
			"Unicode dec": "8733",
			"Unicode hex": "221D"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "182",
			"Dingbat hex": "B6",
			"Unicode dec": "8706",
			"Unicode hex": "2202"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "183",
			"Dingbat hex": "B7",
			"Unicode dec": "8226",
			"Unicode hex": "2022"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "184",
			"Dingbat hex": "B8",
			"Unicode dec": "247",
			"Unicode hex": "F7"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "185",
			"Dingbat hex": "B9",
			"Unicode dec": "8800",
			"Unicode hex": "2260"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "186",
			"Dingbat hex": "BA",
			"Unicode dec": "8801",
			"Unicode hex": "2261"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "187",
			"Dingbat hex": "BB",
			"Unicode dec": "8776",
			"Unicode hex": "2248"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "188",
			"Dingbat hex": "BC",
			"Unicode dec": "8230",
			"Unicode hex": "2026"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "189",
			"Dingbat hex": "BD",
			"Unicode dec": "9168",
			"Unicode hex": "23D0"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "190",
			"Dingbat hex": "BE",
			"Unicode dec": "9135",
			"Unicode hex": "23AF"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "191",
			"Dingbat hex": "BF",
			"Unicode dec": "8629",
			"Unicode hex": "21B5"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "192",
			"Dingbat hex": "C0",
			"Unicode dec": "8501",
			"Unicode hex": "2135"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "193",
			"Dingbat hex": "C1",
			"Unicode dec": "8465",
			"Unicode hex": "2111"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "194",
			"Dingbat hex": "C2",
			"Unicode dec": "8476",
			"Unicode hex": "211C"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "195",
			"Dingbat hex": "C3",
			"Unicode dec": "8472",
			"Unicode hex": "2118"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "196",
			"Dingbat hex": "C4",
			"Unicode dec": "8855",
			"Unicode hex": "2297"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "197",
			"Dingbat hex": "C5",
			"Unicode dec": "8853",
			"Unicode hex": "2295"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "198",
			"Dingbat hex": "C6",
			"Unicode dec": "8709",
			"Unicode hex": "2205"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "199",
			"Dingbat hex": "C7",
			"Unicode dec": "8745",
			"Unicode hex": "2229"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "200",
			"Dingbat hex": "C8",
			"Unicode dec": "8746",
			"Unicode hex": "222A"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "201",
			"Dingbat hex": "C9",
			"Unicode dec": "8835",
			"Unicode hex": "2283"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "202",
			"Dingbat hex": "CA",
			"Unicode dec": "8839",
			"Unicode hex": "2287"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "203",
			"Dingbat hex": "CB",
			"Unicode dec": "8836",
			"Unicode hex": "2284"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "204",
			"Dingbat hex": "CC",
			"Unicode dec": "8834",
			"Unicode hex": "2282"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "205",
			"Dingbat hex": "CD",
			"Unicode dec": "8838",
			"Unicode hex": "2286"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "206",
			"Dingbat hex": "CE",
			"Unicode dec": "8712",
			"Unicode hex": "2208"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "207",
			"Dingbat hex": "CF",
			"Unicode dec": "8713",
			"Unicode hex": "2209"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "208",
			"Dingbat hex": "D0",
			"Unicode dec": "8736",
			"Unicode hex": "2220"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "209",
			"Dingbat hex": "D1",
			"Unicode dec": "8711",
			"Unicode hex": "2207"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "210",
			"Dingbat hex": "D2",
			"Unicode dec": "174",
			"Unicode hex": "AE"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "211",
			"Dingbat hex": "D3",
			"Unicode dec": "169",
			"Unicode hex": "A9"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "212",
			"Dingbat hex": "D4",
			"Unicode dec": "8482",
			"Unicode hex": "2122"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "213",
			"Dingbat hex": "D5",
			"Unicode dec": "8719",
			"Unicode hex": "220F"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "214",
			"Dingbat hex": "D6",
			"Unicode dec": "8730",
			"Unicode hex": "221A"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "215",
			"Dingbat hex": "D7",
			"Unicode dec": "8901",
			"Unicode hex": "22C5"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "216",
			"Dingbat hex": "D8",
			"Unicode dec": "172",
			"Unicode hex": "AC"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "217",
			"Dingbat hex": "D9",
			"Unicode dec": "8743",
			"Unicode hex": "2227"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "218",
			"Dingbat hex": "DA",
			"Unicode dec": "8744",
			"Unicode hex": "2228"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "219",
			"Dingbat hex": "DB",
			"Unicode dec": "8660",
			"Unicode hex": "21D4"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "220",
			"Dingbat hex": "DC",
			"Unicode dec": "8656",
			"Unicode hex": "21D0"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "221",
			"Dingbat hex": "DD",
			"Unicode dec": "8657",
			"Unicode hex": "21D1"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "222",
			"Dingbat hex": "DE",
			"Unicode dec": "8658",
			"Unicode hex": "21D2"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "223",
			"Dingbat hex": "DF",
			"Unicode dec": "8659",
			"Unicode hex": "21D3"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "224",
			"Dingbat hex": "E0",
			"Unicode dec": "9674",
			"Unicode hex": "25CA"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "225",
			"Dingbat hex": "E1",
			"Unicode dec": "12296",
			"Unicode hex": "3008"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "226",
			"Dingbat hex": "E2",
			"Unicode dec": "174",
			"Unicode hex": "AE"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "227",
			"Dingbat hex": "E3",
			"Unicode dec": "169",
			"Unicode hex": "A9"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "228",
			"Dingbat hex": "E4",
			"Unicode dec": "8482",
			"Unicode hex": "2122"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "229",
			"Dingbat hex": "E5",
			"Unicode dec": "8721",
			"Unicode hex": "2211"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "230",
			"Dingbat hex": "E6",
			"Unicode dec": "9115",
			"Unicode hex": "239B"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "231",
			"Dingbat hex": "E7",
			"Unicode dec": "9116",
			"Unicode hex": "239C"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "232",
			"Dingbat hex": "E8",
			"Unicode dec": "9117",
			"Unicode hex": "239D"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "233",
			"Dingbat hex": "E9",
			"Unicode dec": "9121",
			"Unicode hex": "23A1"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "234",
			"Dingbat hex": "EA",
			"Unicode dec": "9122",
			"Unicode hex": "23A2"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "235",
			"Dingbat hex": "EB",
			"Unicode dec": "9123",
			"Unicode hex": "23A3"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "236",
			"Dingbat hex": "EC",
			"Unicode dec": "9127",
			"Unicode hex": "23A7"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "237",
			"Dingbat hex": "ED",
			"Unicode dec": "9128",
			"Unicode hex": "23A8"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "238",
			"Dingbat hex": "EE",
			"Unicode dec": "9129",
			"Unicode hex": "23A9"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "239",
			"Dingbat hex": "EF",
			"Unicode dec": "9130",
			"Unicode hex": "23AA"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "240",
			"Dingbat hex": "F0",
			"Unicode dec": "63743",
			"Unicode hex": "F8FF"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "241",
			"Dingbat hex": "F1",
			"Unicode dec": "12297",
			"Unicode hex": "3009"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "242",
			"Dingbat hex": "F2",
			"Unicode dec": "8747",
			"Unicode hex": "222B"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "243",
			"Dingbat hex": "F3",
			"Unicode dec": "8992",
			"Unicode hex": "2320"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "244",
			"Dingbat hex": "F4",
			"Unicode dec": "9134",
			"Unicode hex": "23AE"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "245",
			"Dingbat hex": "F5",
			"Unicode dec": "8993",
			"Unicode hex": "2321"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "246",
			"Dingbat hex": "F6",
			"Unicode dec": "9118",
			"Unicode hex": "239E"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "247",
			"Dingbat hex": "F7",
			"Unicode dec": "9119",
			"Unicode hex": "239F"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "248",
			"Dingbat hex": "F8",
			"Unicode dec": "9120",
			"Unicode hex": "23A0"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "249",
			"Dingbat hex": "F9",
			"Unicode dec": "9124",
			"Unicode hex": "23A4"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "250",
			"Dingbat hex": "FA",
			"Unicode dec": "9125",
			"Unicode hex": "23A5"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "251",
			"Dingbat hex": "FB",
			"Unicode dec": "9126",
			"Unicode hex": "23A6"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "252",
			"Dingbat hex": "FC",
			"Unicode dec": "9131",
			"Unicode hex": "23AB"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "253",
			"Dingbat hex": "FD",
			"Unicode dec": "9132",
			"Unicode hex": "23AC"
		},
		{
			"Typeface name": "Symbol",
			"Dingbat dec": "254",
			"Dingbat hex": "FE",
			"Unicode dec": "9133",
			"Unicode hex": "23AD"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "32",
			"Dingbat hex": "20",
			"Unicode dec": "32",
			"Unicode hex": "20"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "33",
			"Dingbat hex": "21",
			"Unicode dec": "128375",
			"Unicode hex": "1F577"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "34",
			"Dingbat hex": "22",
			"Unicode dec": "128376",
			"Unicode hex": "1F578"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "35",
			"Dingbat hex": "23",
			"Unicode dec": "128370",
			"Unicode hex": "1F572"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "36",
			"Dingbat hex": "24",
			"Unicode dec": "128374",
			"Unicode hex": "1F576"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "37",
			"Dingbat hex": "25",
			"Unicode dec": "127942",
			"Unicode hex": "1F3C6"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "38",
			"Dingbat hex": "26",
			"Unicode dec": "127894",
			"Unicode hex": "1F396"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "39",
			"Dingbat hex": "27",
			"Unicode dec": "128391",
			"Unicode hex": "1F587"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "40",
			"Dingbat hex": "28",
			"Unicode dec": "128488",
			"Unicode hex": "1F5E8"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "41",
			"Dingbat hex": "29",
			"Unicode dec": "128489",
			"Unicode hex": "1F5E9"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "42",
			"Dingbat hex": "2A",
			"Unicode dec": "128496",
			"Unicode hex": "1F5F0"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "43",
			"Dingbat hex": "2B",
			"Unicode dec": "128497",
			"Unicode hex": "1F5F1"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "44",
			"Dingbat hex": "2C",
			"Unicode dec": "127798",
			"Unicode hex": "1F336"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "45",
			"Dingbat hex": "2D",
			"Unicode dec": "127895",
			"Unicode hex": "1F397"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "46",
			"Dingbat hex": "2E",
			"Unicode dec": "128638",
			"Unicode hex": "1F67E"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "47",
			"Dingbat hex": "2F",
			"Unicode dec": "128636",
			"Unicode hex": "1F67C"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "48",
			"Dingbat hex": "30",
			"Unicode dec": "128469",
			"Unicode hex": "1F5D5"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "49",
			"Dingbat hex": "31",
			"Unicode dec": "128470",
			"Unicode hex": "1F5D6"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "50",
			"Dingbat hex": "32",
			"Unicode dec": "128471",
			"Unicode hex": "1F5D7"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "51",
			"Dingbat hex": "33",
			"Unicode dec": "9204",
			"Unicode hex": "23F4"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "52",
			"Dingbat hex": "34",
			"Unicode dec": "9205",
			"Unicode hex": "23F5"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "53",
			"Dingbat hex": "35",
			"Unicode dec": "9206",
			"Unicode hex": "23F6"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "54",
			"Dingbat hex": "36",
			"Unicode dec": "9207",
			"Unicode hex": "23F7"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "55",
			"Dingbat hex": "37",
			"Unicode dec": "9194",
			"Unicode hex": "23EA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "56",
			"Dingbat hex": "38",
			"Unicode dec": "9193",
			"Unicode hex": "23E9"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "57",
			"Dingbat hex": "39",
			"Unicode dec": "9198",
			"Unicode hex": "23EE"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "58",
			"Dingbat hex": "3A",
			"Unicode dec": "9197",
			"Unicode hex": "23ED"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "59",
			"Dingbat hex": "3B",
			"Unicode dec": "9208",
			"Unicode hex": "23F8"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "60",
			"Dingbat hex": "3C",
			"Unicode dec": "9209",
			"Unicode hex": "23F9"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "61",
			"Dingbat hex": "3D",
			"Unicode dec": "9210",
			"Unicode hex": "23FA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "62",
			"Dingbat hex": "3E",
			"Unicode dec": "128474",
			"Unicode hex": "1F5DA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "63",
			"Dingbat hex": "3F",
			"Unicode dec": "128499",
			"Unicode hex": "1F5F3"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "64",
			"Dingbat hex": "40",
			"Unicode dec": "128736",
			"Unicode hex": "1F6E0"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "65",
			"Dingbat hex": "41",
			"Unicode dec": "127959",
			"Unicode hex": "1F3D7"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "66",
			"Dingbat hex": "42",
			"Unicode dec": "127960",
			"Unicode hex": "1F3D8"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "67",
			"Dingbat hex": "43",
			"Unicode dec": "127961",
			"Unicode hex": "1F3D9"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "68",
			"Dingbat hex": "44",
			"Unicode dec": "127962",
			"Unicode hex": "1F3DA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "69",
			"Dingbat hex": "45",
			"Unicode dec": "127964",
			"Unicode hex": "1F3DC"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "70",
			"Dingbat hex": "46",
			"Unicode dec": "127981",
			"Unicode hex": "1F3ED"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "71",
			"Dingbat hex": "47",
			"Unicode dec": "127963",
			"Unicode hex": "1F3DB"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "72",
			"Dingbat hex": "48",
			"Unicode dec": "127968",
			"Unicode hex": "1F3E0"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "73",
			"Dingbat hex": "49",
			"Unicode dec": "127958",
			"Unicode hex": "1F3D6"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "74",
			"Dingbat hex": "4A",
			"Unicode dec": "127965",
			"Unicode hex": "1F3DD"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "75",
			"Dingbat hex": "4B",
			"Unicode dec": "128739",
			"Unicode hex": "1F6E3"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "76",
			"Dingbat hex": "4C",
			"Unicode dec": "128269",
			"Unicode hex": "1F50D"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "77",
			"Dingbat hex": "4D",
			"Unicode dec": "127956",
			"Unicode hex": "1F3D4"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "78",
			"Dingbat hex": "4E",
			"Unicode dec": "128065",
			"Unicode hex": "1F441"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "79",
			"Dingbat hex": "4F",
			"Unicode dec": "128066",
			"Unicode hex": "1F442"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "80",
			"Dingbat hex": "50",
			"Unicode dec": "127966",
			"Unicode hex": "1F3DE"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "81",
			"Dingbat hex": "51",
			"Unicode dec": "127957",
			"Unicode hex": "1F3D5"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "82",
			"Dingbat hex": "52",
			"Unicode dec": "128740",
			"Unicode hex": "1F6E4"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "83",
			"Dingbat hex": "53",
			"Unicode dec": "127967",
			"Unicode hex": "1F3DF"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "84",
			"Dingbat hex": "54",
			"Unicode dec": "128755",
			"Unicode hex": "1F6F3"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "85",
			"Dingbat hex": "55",
			"Unicode dec": "128364",
			"Unicode hex": "1F56C"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "86",
			"Dingbat hex": "56",
			"Unicode dec": "128363",
			"Unicode hex": "1F56B"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "87",
			"Dingbat hex": "57",
			"Unicode dec": "128360",
			"Unicode hex": "1F568"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "88",
			"Dingbat hex": "58",
			"Unicode dec": "128264",
			"Unicode hex": "1F508"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "89",
			"Dingbat hex": "59",
			"Unicode dec": "127892",
			"Unicode hex": "1F394"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "90",
			"Dingbat hex": "5A",
			"Unicode dec": "127893",
			"Unicode hex": "1F395"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "91",
			"Dingbat hex": "5B",
			"Unicode dec": "128492",
			"Unicode hex": "1F5EC"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "92",
			"Dingbat hex": "5C",
			"Unicode dec": "128637",
			"Unicode hex": "1F67D"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "93",
			"Dingbat hex": "5D",
			"Unicode dec": "128493",
			"Unicode hex": "1F5ED"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "94",
			"Dingbat hex": "5E",
			"Unicode dec": "128490",
			"Unicode hex": "1F5EA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "95",
			"Dingbat hex": "5F",
			"Unicode dec": "128491",
			"Unicode hex": "1F5EB"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "96",
			"Dingbat hex": "60",
			"Unicode dec": "11156",
			"Unicode hex": "2B94"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "97",
			"Dingbat hex": "61",
			"Unicode dec": "10004",
			"Unicode hex": "2714"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "98",
			"Dingbat hex": "62",
			"Unicode dec": "128690",
			"Unicode hex": "1F6B2"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "99",
			"Dingbat hex": "63",
			"Unicode dec": "11036",
			"Unicode hex": "2B1C"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "100",
			"Dingbat hex": "64",
			"Unicode dec": "128737",
			"Unicode hex": "1F6E1"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "101",
			"Dingbat hex": "65",
			"Unicode dec": "128230",
			"Unicode hex": "1F4E6"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "102",
			"Dingbat hex": "66",
			"Unicode dec": "128753",
			"Unicode hex": "1F6F1"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "103",
			"Dingbat hex": "67",
			"Unicode dec": "11035",
			"Unicode hex": "2B1B"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "104",
			"Dingbat hex": "68",
			"Unicode dec": "128657",
			"Unicode hex": "1F691"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "105",
			"Dingbat hex": "69",
			"Unicode dec": "128712",
			"Unicode hex": "1F6C8"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "106",
			"Dingbat hex": "6A",
			"Unicode dec": "128745",
			"Unicode hex": "1F6E9"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "107",
			"Dingbat hex": "6B",
			"Unicode dec": "128752",
			"Unicode hex": "1F6F0"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "108",
			"Dingbat hex": "6C",
			"Unicode dec": "128968",
			"Unicode hex": "1F7C8"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "109",
			"Dingbat hex": "6D",
			"Unicode dec": "128372",
			"Unicode hex": "1F574"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "110",
			"Dingbat hex": "6E",
			"Unicode dec": "11044",
			"Unicode hex": "2B24"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "111",
			"Dingbat hex": "6F",
			"Unicode dec": "128741",
			"Unicode hex": "1F6E5"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "112",
			"Dingbat hex": "70",
			"Unicode dec": "128660",
			"Unicode hex": "1F694"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "113",
			"Dingbat hex": "71",
			"Unicode dec": "128472",
			"Unicode hex": "1F5D8"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "114",
			"Dingbat hex": "72",
			"Unicode dec": "128473",
			"Unicode hex": "1F5D9"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "115",
			"Dingbat hex": "73",
			"Unicode dec": "10067",
			"Unicode hex": "2753"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "116",
			"Dingbat hex": "74",
			"Unicode dec": "128754",
			"Unicode hex": "1F6F2"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "117",
			"Dingbat hex": "75",
			"Unicode dec": "128647",
			"Unicode hex": "1F687"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "118",
			"Dingbat hex": "76",
			"Unicode dec": "128653",
			"Unicode hex": "1F68D"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "119",
			"Dingbat hex": "77",
			"Unicode dec": "9971",
			"Unicode hex": "26F3"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "120",
			"Dingbat hex": "78",
			"Unicode dec": "10680",
			"Unicode hex": "29B8"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "121",
			"Dingbat hex": "79",
			"Unicode dec": "8854",
			"Unicode hex": "2296"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "122",
			"Dingbat hex": "7A",
			"Unicode dec": "128685",
			"Unicode hex": "1F6AD"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "123",
			"Dingbat hex": "7B",
			"Unicode dec": "128494",
			"Unicode hex": "1F5EE"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "124",
			"Dingbat hex": "7C",
			"Unicode dec": "9168",
			"Unicode hex": "23D0"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "125",
			"Dingbat hex": "7D",
			"Unicode dec": "128495",
			"Unicode hex": "1F5EF"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "126",
			"Dingbat hex": "7E",
			"Unicode dec": "128498",
			"Unicode hex": "1F5F2"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "128",
			"Dingbat hex": "80",
			"Unicode dec": "128697",
			"Unicode hex": "1F6B9"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "129",
			"Dingbat hex": "81",
			"Unicode dec": "128698",
			"Unicode hex": "1F6BA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "130",
			"Dingbat hex": "82",
			"Unicode dec": "128713",
			"Unicode hex": "1F6C9"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "131",
			"Dingbat hex": "83",
			"Unicode dec": "128714",
			"Unicode hex": "1F6CA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "132",
			"Dingbat hex": "84",
			"Unicode dec": "128700",
			"Unicode hex": "1F6BC"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "133",
			"Dingbat hex": "85",
			"Unicode dec": "128125",
			"Unicode hex": "1F47D"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "134",
			"Dingbat hex": "86",
			"Unicode dec": "127947",
			"Unicode hex": "1F3CB"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "135",
			"Dingbat hex": "87",
			"Unicode dec": "9975",
			"Unicode hex": "26F7"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "136",
			"Dingbat hex": "88",
			"Unicode dec": "127938",
			"Unicode hex": "1F3C2"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "137",
			"Dingbat hex": "89",
			"Unicode dec": "127948",
			"Unicode hex": "1F3CC"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "138",
			"Dingbat hex": "8A",
			"Unicode dec": "127946",
			"Unicode hex": "1F3CA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "139",
			"Dingbat hex": "8B",
			"Unicode dec": "127940",
			"Unicode hex": "1F3C4"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "140",
			"Dingbat hex": "8C",
			"Unicode dec": "127949",
			"Unicode hex": "1F3CD"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "141",
			"Dingbat hex": "8D",
			"Unicode dec": "127950",
			"Unicode hex": "1F3CE"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "142",
			"Dingbat hex": "8E",
			"Unicode dec": "128664",
			"Unicode hex": "1F698"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "143",
			"Dingbat hex": "8F",
			"Unicode dec": "128480",
			"Unicode hex": "1F5E0"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "144",
			"Dingbat hex": "90",
			"Unicode dec": "128738",
			"Unicode hex": "1F6E2"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "145",
			"Dingbat hex": "91",
			"Unicode dec": "128176",
			"Unicode hex": "1F4B0"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "146",
			"Dingbat hex": "92",
			"Unicode dec": "127991",
			"Unicode hex": "1F3F7"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "147",
			"Dingbat hex": "93",
			"Unicode dec": "128179",
			"Unicode hex": "1F4B3"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "148",
			"Dingbat hex": "94",
			"Unicode dec": "128106",
			"Unicode hex": "1F46A"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "149",
			"Dingbat hex": "95",
			"Unicode dec": "128481",
			"Unicode hex": "1F5E1"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "150",
			"Dingbat hex": "96",
			"Unicode dec": "128482",
			"Unicode hex": "1F5E2"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "151",
			"Dingbat hex": "97",
			"Unicode dec": "128483",
			"Unicode hex": "1F5E3"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "152",
			"Dingbat hex": "98",
			"Unicode dec": "10031",
			"Unicode hex": "272F"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "153",
			"Dingbat hex": "99",
			"Unicode dec": "128388",
			"Unicode hex": "1F584"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "154",
			"Dingbat hex": "9A",
			"Unicode dec": "128389",
			"Unicode hex": "1F585"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "155",
			"Dingbat hex": "9B",
			"Unicode dec": "128387",
			"Unicode hex": "1F583"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "156",
			"Dingbat hex": "9C",
			"Unicode dec": "128390",
			"Unicode hex": "1F586"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "157",
			"Dingbat hex": "9D",
			"Unicode dec": "128441",
			"Unicode hex": "1F5B9"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "158",
			"Dingbat hex": "9E",
			"Unicode dec": "128442",
			"Unicode hex": "1F5BA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "159",
			"Dingbat hex": "9F",
			"Unicode dec": "128443",
			"Unicode hex": "1F5BB"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "160",
			"Dingbat hex": "A0",
			"Unicode dec": "128373",
			"Unicode hex": "1F575"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "161",
			"Dingbat hex": "A1",
			"Unicode dec": "128368",
			"Unicode hex": "1F570"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "162",
			"Dingbat hex": "A2",
			"Unicode dec": "128445",
			"Unicode hex": "1F5BD"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "163",
			"Dingbat hex": "A3",
			"Unicode dec": "128446",
			"Unicode hex": "1F5BE"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "164",
			"Dingbat hex": "A4",
			"Unicode dec": "128203",
			"Unicode hex": "1F4CB"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "165",
			"Dingbat hex": "A5",
			"Unicode dec": "128466",
			"Unicode hex": "1F5D2"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "166",
			"Dingbat hex": "A6",
			"Unicode dec": "128467",
			"Unicode hex": "1F5D3"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "167",
			"Dingbat hex": "A7",
			"Unicode dec": "128366",
			"Unicode hex": "1F56E"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "168",
			"Dingbat hex": "A8",
			"Unicode dec": "128218",
			"Unicode hex": "1F4DA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "169",
			"Dingbat hex": "A9",
			"Unicode dec": "128478",
			"Unicode hex": "1F5DE"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "170",
			"Dingbat hex": "AA",
			"Unicode dec": "128479",
			"Unicode hex": "1F5DF"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "171",
			"Dingbat hex": "AB",
			"Unicode dec": "128451",
			"Unicode hex": "1F5C3"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "172",
			"Dingbat hex": "AC",
			"Unicode dec": "128450",
			"Unicode hex": "1F5C2"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "173",
			"Dingbat hex": "AD",
			"Unicode dec": "128444",
			"Unicode hex": "1F5BC"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "174",
			"Dingbat hex": "AE",
			"Unicode dec": "127917",
			"Unicode hex": "1F3AD"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "175",
			"Dingbat hex": "AF",
			"Unicode dec": "127900",
			"Unicode hex": "1F39C"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "176",
			"Dingbat hex": "B0",
			"Unicode dec": "127896",
			"Unicode hex": "1F398"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "177",
			"Dingbat hex": "B1",
			"Unicode dec": "127897",
			"Unicode hex": "1F399"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "178",
			"Dingbat hex": "B2",
			"Unicode dec": "127911",
			"Unicode hex": "1F3A7"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "179",
			"Dingbat hex": "B3",
			"Unicode dec": "128191",
			"Unicode hex": "1F4BF"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "180",
			"Dingbat hex": "B4",
			"Unicode dec": "127902",
			"Unicode hex": "1F39E"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "181",
			"Dingbat hex": "B5",
			"Unicode dec": "128247",
			"Unicode hex": "1F4F7"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "182",
			"Dingbat hex": "B6",
			"Unicode dec": "127903",
			"Unicode hex": "1F39F"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "183",
			"Dingbat hex": "B7",
			"Unicode dec": "127916",
			"Unicode hex": "1F3AC"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "184",
			"Dingbat hex": "B8",
			"Unicode dec": "128253",
			"Unicode hex": "1F4FD"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "185",
			"Dingbat hex": "B9",
			"Unicode dec": "128249",
			"Unicode hex": "1F4F9"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "186",
			"Dingbat hex": "BA",
			"Unicode dec": "128254",
			"Unicode hex": "1F4FE"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "187",
			"Dingbat hex": "BB",
			"Unicode dec": "128251",
			"Unicode hex": "1F4FB"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "188",
			"Dingbat hex": "BC",
			"Unicode dec": "127898",
			"Unicode hex": "1F39A"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "189",
			"Dingbat hex": "BD",
			"Unicode dec": "127899",
			"Unicode hex": "1F39B"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "190",
			"Dingbat hex": "BE",
			"Unicode dec": "128250",
			"Unicode hex": "1F4FA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "191",
			"Dingbat hex": "BF",
			"Unicode dec": "128187",
			"Unicode hex": "1F4BB"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "192",
			"Dingbat hex": "C0",
			"Unicode dec": "128421",
			"Unicode hex": "1F5A5"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "193",
			"Dingbat hex": "C1",
			"Unicode dec": "128422",
			"Unicode hex": "1F5A6"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "194",
			"Dingbat hex": "C2",
			"Unicode dec": "128423",
			"Unicode hex": "1F5A7"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "195",
			"Dingbat hex": "C3",
			"Unicode dec": "128377",
			"Unicode hex": "1F579"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "196",
			"Dingbat hex": "C4",
			"Unicode dec": "127918",
			"Unicode hex": "1F3AE"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "197",
			"Dingbat hex": "C5",
			"Unicode dec": "128379",
			"Unicode hex": "1F57B"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "198",
			"Dingbat hex": "C6",
			"Unicode dec": "128380",
			"Unicode hex": "1F57C"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "199",
			"Dingbat hex": "C7",
			"Unicode dec": "128223",
			"Unicode hex": "1F4DF"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "200",
			"Dingbat hex": "C8",
			"Unicode dec": "128385",
			"Unicode hex": "1F581"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "201",
			"Dingbat hex": "C9",
			"Unicode dec": "128384",
			"Unicode hex": "1F580"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "202",
			"Dingbat hex": "CA",
			"Unicode dec": "128424",
			"Unicode hex": "1F5A8"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "203",
			"Dingbat hex": "CB",
			"Unicode dec": "128425",
			"Unicode hex": "1F5A9"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "204",
			"Dingbat hex": "CC",
			"Unicode dec": "128447",
			"Unicode hex": "1F5BF"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "205",
			"Dingbat hex": "CD",
			"Unicode dec": "128426",
			"Unicode hex": "1F5AA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "206",
			"Dingbat hex": "CE",
			"Unicode dec": "128476",
			"Unicode hex": "1F5DC"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "207",
			"Dingbat hex": "CF",
			"Unicode dec": "128274",
			"Unicode hex": "1F512"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "208",
			"Dingbat hex": "D0",
			"Unicode dec": "128275",
			"Unicode hex": "1F513"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "209",
			"Dingbat hex": "D1",
			"Unicode dec": "128477",
			"Unicode hex": "1F5DD"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "210",
			"Dingbat hex": "D2",
			"Unicode dec": "128229",
			"Unicode hex": "1F4E5"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "211",
			"Dingbat hex": "D3",
			"Unicode dec": "128228",
			"Unicode hex": "1F4E4"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "212",
			"Dingbat hex": "D4",
			"Unicode dec": "128371",
			"Unicode hex": "1F573"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "213",
			"Dingbat hex": "D5",
			"Unicode dec": "127779",
			"Unicode hex": "1F323"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "214",
			"Dingbat hex": "D6",
			"Unicode dec": "127780",
			"Unicode hex": "1F324"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "215",
			"Dingbat hex": "D7",
			"Unicode dec": "127781",
			"Unicode hex": "1F325"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "216",
			"Dingbat hex": "D8",
			"Unicode dec": "127782",
			"Unicode hex": "1F326"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "217",
			"Dingbat hex": "D9",
			"Unicode dec": "9729",
			"Unicode hex": "2601"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "218",
			"Dingbat hex": "DA",
			"Unicode dec": "127784",
			"Unicode hex": "1F328"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "219",
			"Dingbat hex": "DB",
			"Unicode dec": "127783",
			"Unicode hex": "1F327"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "220",
			"Dingbat hex": "DC",
			"Unicode dec": "127785",
			"Unicode hex": "1F329"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "221",
			"Dingbat hex": "DD",
			"Unicode dec": "127786",
			"Unicode hex": "1F32A"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "222",
			"Dingbat hex": "DE",
			"Unicode dec": "127788",
			"Unicode hex": "1F32C"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "223",
			"Dingbat hex": "DF",
			"Unicode dec": "127787",
			"Unicode hex": "1F32B"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "224",
			"Dingbat hex": "E0",
			"Unicode dec": "127772",
			"Unicode hex": "1F31C"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "225",
			"Dingbat hex": "E1",
			"Unicode dec": "127777",
			"Unicode hex": "1F321"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "226",
			"Dingbat hex": "E2",
			"Unicode dec": "128715",
			"Unicode hex": "1F6CB"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "227",
			"Dingbat hex": "E3",
			"Unicode dec": "128719",
			"Unicode hex": "1F6CF"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "228",
			"Dingbat hex": "E4",
			"Unicode dec": "127869",
			"Unicode hex": "1F37D"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "229",
			"Dingbat hex": "E5",
			"Unicode dec": "127864",
			"Unicode hex": "1F378"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "230",
			"Dingbat hex": "E6",
			"Unicode dec": "128718",
			"Unicode hex": "1F6CE"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "231",
			"Dingbat hex": "E7",
			"Unicode dec": "128717",
			"Unicode hex": "1F6CD"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "232",
			"Dingbat hex": "E8",
			"Unicode dec": "9413",
			"Unicode hex": "24C5"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "233",
			"Dingbat hex": "E9",
			"Unicode dec": "9855",
			"Unicode hex": "267F"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "234",
			"Dingbat hex": "EA",
			"Unicode dec": "128710",
			"Unicode hex": "1F6C6"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "235",
			"Dingbat hex": "EB",
			"Unicode dec": "128392",
			"Unicode hex": "1F588"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "236",
			"Dingbat hex": "EC",
			"Unicode dec": "127891",
			"Unicode hex": "1F393"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "237",
			"Dingbat hex": "ED",
			"Unicode dec": "128484",
			"Unicode hex": "1F5E4"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "238",
			"Dingbat hex": "EE",
			"Unicode dec": "128485",
			"Unicode hex": "1F5E5"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "239",
			"Dingbat hex": "EF",
			"Unicode dec": "128486",
			"Unicode hex": "1F5E6"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "240",
			"Dingbat hex": "F0",
			"Unicode dec": "128487",
			"Unicode hex": "1F5E7"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "241",
			"Dingbat hex": "F1",
			"Unicode dec": "128746",
			"Unicode hex": "1F6EA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "242",
			"Dingbat hex": "F2",
			"Unicode dec": "128063",
			"Unicode hex": "1F43F"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "243",
			"Dingbat hex": "F3",
			"Unicode dec": "128038",
			"Unicode hex": "1F426"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "244",
			"Dingbat hex": "F4",
			"Unicode dec": "128031",
			"Unicode hex": "1F41F"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "245",
			"Dingbat hex": "F5",
			"Unicode dec": "128021",
			"Unicode hex": "1F415"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "246",
			"Dingbat hex": "F6",
			"Unicode dec": "128008",
			"Unicode hex": "1F408"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "247",
			"Dingbat hex": "F7",
			"Unicode dec": "128620",
			"Unicode hex": "1F66C"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "248",
			"Dingbat hex": "F8",
			"Unicode dec": "128622",
			"Unicode hex": "1F66E"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "249",
			"Dingbat hex": "F9",
			"Unicode dec": "128621",
			"Unicode hex": "1F66D"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "250",
			"Dingbat hex": "FA",
			"Unicode dec": "128623",
			"Unicode hex": "1F66F"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "251",
			"Dingbat hex": "FB",
			"Unicode dec": "128506",
			"Unicode hex": "1F5FA"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "252",
			"Dingbat hex": "FC",
			"Unicode dec": "127757",
			"Unicode hex": "1F30D"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "253",
			"Dingbat hex": "FD",
			"Unicode dec": "127759",
			"Unicode hex": "1F30F"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "254",
			"Dingbat hex": "FE",
			"Unicode dec": "127758",
			"Unicode hex": "1F30E"
		},
		{
			"Typeface name": "Webdings",
			"Dingbat dec": "255",
			"Dingbat hex": "FF",
			"Unicode dec": "128330",
			"Unicode hex": "1F54A"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "32",
			"Dingbat hex": "20",
			"Unicode dec": "32",
			"Unicode hex": "20"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "33",
			"Dingbat hex": "21",
			"Unicode dec": "128393",
			"Unicode hex": "1F589"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "34",
			"Dingbat hex": "22",
			"Unicode dec": "9986",
			"Unicode hex": "2702"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "35",
			"Dingbat hex": "23",
			"Unicode dec": "9985",
			"Unicode hex": "2701"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "36",
			"Dingbat hex": "24",
			"Unicode dec": "128083",
			"Unicode hex": "1F453"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "37",
			"Dingbat hex": "25",
			"Unicode dec": "128365",
			"Unicode hex": "1F56D"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "38",
			"Dingbat hex": "26",
			"Unicode dec": "128366",
			"Unicode hex": "1F56E"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "39",
			"Dingbat hex": "27",
			"Unicode dec": "128367",
			"Unicode hex": "1F56F"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "40",
			"Dingbat hex": "28",
			"Unicode dec": "128383",
			"Unicode hex": "1F57F"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "41",
			"Dingbat hex": "29",
			"Unicode dec": "9990",
			"Unicode hex": "2706"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "42",
			"Dingbat hex": "2A",
			"Unicode dec": "128386",
			"Unicode hex": "1F582"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "43",
			"Dingbat hex": "2B",
			"Unicode dec": "128387",
			"Unicode hex": "1F583"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "44",
			"Dingbat hex": "2C",
			"Unicode dec": "128234",
			"Unicode hex": "1F4EA"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "45",
			"Dingbat hex": "2D",
			"Unicode dec": "128235",
			"Unicode hex": "1F4EB"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "46",
			"Dingbat hex": "2E",
			"Unicode dec": "128236",
			"Unicode hex": "1F4EC"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "47",
			"Dingbat hex": "2F",
			"Unicode dec": "128237",
			"Unicode hex": "1F4ED"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "48",
			"Dingbat hex": "30",
			"Unicode dec": "128448",
			"Unicode hex": "1F5C0"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "49",
			"Dingbat hex": "31",
			"Unicode dec": "128449",
			"Unicode hex": "1F5C1"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "50",
			"Dingbat hex": "32",
			"Unicode dec": "128462",
			"Unicode hex": "1F5CE"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "51",
			"Dingbat hex": "33",
			"Unicode dec": "128463",
			"Unicode hex": "1F5CF"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "52",
			"Dingbat hex": "34",
			"Unicode dec": "128464",
			"Unicode hex": "1F5D0"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "53",
			"Dingbat hex": "35",
			"Unicode dec": "128452",
			"Unicode hex": "1F5C4"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "54",
			"Dingbat hex": "36",
			"Unicode dec": "8987",
			"Unicode hex": "231B"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "55",
			"Dingbat hex": "37",
			"Unicode dec": "128430",
			"Unicode hex": "1F5AE"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "56",
			"Dingbat hex": "38",
			"Unicode dec": "128432",
			"Unicode hex": "1F5B0"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "57",
			"Dingbat hex": "39",
			"Unicode dec": "128434",
			"Unicode hex": "1F5B2"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "58",
			"Dingbat hex": "3A",
			"Unicode dec": "128435",
			"Unicode hex": "1F5B3"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "59",
			"Dingbat hex": "3B",
			"Unicode dec": "128436",
			"Unicode hex": "1F5B4"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "60",
			"Dingbat hex": "3C",
			"Unicode dec": "128427",
			"Unicode hex": "1F5AB"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "61",
			"Dingbat hex": "3D",
			"Unicode dec": "128428",
			"Unicode hex": "1F5AC"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "62",
			"Dingbat hex": "3E",
			"Unicode dec": "9991",
			"Unicode hex": "2707"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "63",
			"Dingbat hex": "3F",
			"Unicode dec": "9997",
			"Unicode hex": "270D"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "64",
			"Dingbat hex": "40",
			"Unicode dec": "128398",
			"Unicode hex": "1F58E"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "65",
			"Dingbat hex": "41",
			"Unicode dec": "9996",
			"Unicode hex": "270C"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "66",
			"Dingbat hex": "42",
			"Unicode dec": "128399",
			"Unicode hex": "1F58F"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "67",
			"Dingbat hex": "43",
			"Unicode dec": "128077",
			"Unicode hex": "1F44D"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "68",
			"Dingbat hex": "44",
			"Unicode dec": "128078",
			"Unicode hex": "1F44E"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "69",
			"Dingbat hex": "45",
			"Unicode dec": "9756",
			"Unicode hex": "261C"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "70",
			"Dingbat hex": "46",
			"Unicode dec": "9758",
			"Unicode hex": "261E"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "71",
			"Dingbat hex": "47",
			"Unicode dec": "9757",
			"Unicode hex": "261D"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "72",
			"Dingbat hex": "48",
			"Unicode dec": "9759",
			"Unicode hex": "261F"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "73",
			"Dingbat hex": "49",
			"Unicode dec": "128400",
			"Unicode hex": "1F590"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "74",
			"Dingbat hex": "4A",
			"Unicode dec": "9786",
			"Unicode hex": "263A"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "75",
			"Dingbat hex": "4B",
			"Unicode dec": "128528",
			"Unicode hex": "1F610"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "76",
			"Dingbat hex": "4C",
			"Unicode dec": "9785",
			"Unicode hex": "2639"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "77",
			"Dingbat hex": "4D",
			"Unicode dec": "128163",
			"Unicode hex": "1F4A3"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "78",
			"Dingbat hex": "4E",
			"Unicode dec": "128369",
			"Unicode hex": "1F571"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "79",
			"Dingbat hex": "4F",
			"Unicode dec": "127987",
			"Unicode hex": "1F3F3"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "80",
			"Dingbat hex": "50",
			"Unicode dec": "127985",
			"Unicode hex": "1F3F1"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "81",
			"Dingbat hex": "51",
			"Unicode dec": "9992",
			"Unicode hex": "2708"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "82",
			"Dingbat hex": "52",
			"Unicode dec": "9788",
			"Unicode hex": "263C"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "83",
			"Dingbat hex": "53",
			"Unicode dec": "127778",
			"Unicode hex": "1F322"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "84",
			"Dingbat hex": "54",
			"Unicode dec": "10052",
			"Unicode hex": "2744"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "85",
			"Dingbat hex": "55",
			"Unicode dec": "128326",
			"Unicode hex": "1F546"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "86",
			"Dingbat hex": "56",
			"Unicode dec": "10014",
			"Unicode hex": "271E"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "87",
			"Dingbat hex": "57",
			"Unicode dec": "128328",
			"Unicode hex": "1F548"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "88",
			"Dingbat hex": "58",
			"Unicode dec": "10016",
			"Unicode hex": "2720"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "89",
			"Dingbat hex": "59",
			"Unicode dec": "10017",
			"Unicode hex": "2721"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "90",
			"Dingbat hex": "5A",
			"Unicode dec": "9770",
			"Unicode hex": "262A"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "91",
			"Dingbat hex": "5B",
			"Unicode dec": "9775",
			"Unicode hex": "262F"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "92",
			"Dingbat hex": "5C",
			"Unicode dec": "128329",
			"Unicode hex": "1F549"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "93",
			"Dingbat hex": "5D",
			"Unicode dec": "9784",
			"Unicode hex": "2638"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "94",
			"Dingbat hex": "5E",
			"Unicode dec": "9800",
			"Unicode hex": "2648"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "95",
			"Dingbat hex": "5F",
			"Unicode dec": "9801",
			"Unicode hex": "2649"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "96",
			"Dingbat hex": "60",
			"Unicode dec": "9802",
			"Unicode hex": "264A"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "97",
			"Dingbat hex": "61",
			"Unicode dec": "9803",
			"Unicode hex": "264B"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "98",
			"Dingbat hex": "62",
			"Unicode dec": "9804",
			"Unicode hex": "264C"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "99",
			"Dingbat hex": "63",
			"Unicode dec": "9805",
			"Unicode hex": "264D"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "100",
			"Dingbat hex": "64",
			"Unicode dec": "9806",
			"Unicode hex": "264E"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "101",
			"Dingbat hex": "65",
			"Unicode dec": "9807",
			"Unicode hex": "264F"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "102",
			"Dingbat hex": "66",
			"Unicode dec": "9808",
			"Unicode hex": "2650"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "103",
			"Dingbat hex": "67",
			"Unicode dec": "9809",
			"Unicode hex": "2651"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "104",
			"Dingbat hex": "68",
			"Unicode dec": "9810",
			"Unicode hex": "2652"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "105",
			"Dingbat hex": "69",
			"Unicode dec": "9811",
			"Unicode hex": "2653"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "106",
			"Dingbat hex": "6A",
			"Unicode dec": "128624",
			"Unicode hex": "1F670"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "107",
			"Dingbat hex": "6B",
			"Unicode dec": "128629",
			"Unicode hex": "1F675"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "108",
			"Dingbat hex": "6C",
			"Unicode dec": "9899",
			"Unicode hex": "26AB"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "109",
			"Dingbat hex": "6D",
			"Unicode dec": "128318",
			"Unicode hex": "1F53E"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "110",
			"Dingbat hex": "6E",
			"Unicode dec": "9724",
			"Unicode hex": "25FC"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "111",
			"Dingbat hex": "6F",
			"Unicode dec": "128911",
			"Unicode hex": "1F78F"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "112",
			"Dingbat hex": "70",
			"Unicode dec": "128912",
			"Unicode hex": "1F790"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "113",
			"Dingbat hex": "71",
			"Unicode dec": "10065",
			"Unicode hex": "2751"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "114",
			"Dingbat hex": "72",
			"Unicode dec": "10066",
			"Unicode hex": "2752"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "115",
			"Dingbat hex": "73",
			"Unicode dec": "128927",
			"Unicode hex": "1F79F"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "116",
			"Dingbat hex": "74",
			"Unicode dec": "10731",
			"Unicode hex": "29EB"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "117",
			"Dingbat hex": "75",
			"Unicode dec": "9670",
			"Unicode hex": "25C6"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "118",
			"Dingbat hex": "76",
			"Unicode dec": "10070",
			"Unicode hex": "2756"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "119",
			"Dingbat hex": "77",
			"Unicode dec": "11049",
			"Unicode hex": "2B29"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "120",
			"Dingbat hex": "78",
			"Unicode dec": "8999",
			"Unicode hex": "2327"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "121",
			"Dingbat hex": "79",
			"Unicode dec": "11193",
			"Unicode hex": "2BB9"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "122",
			"Dingbat hex": "7A",
			"Unicode dec": "8984",
			"Unicode hex": "2318"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "123",
			"Dingbat hex": "7B",
			"Unicode dec": "127989",
			"Unicode hex": "1F3F5"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "124",
			"Dingbat hex": "7C",
			"Unicode dec": "127990",
			"Unicode hex": "1F3F6"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "125",
			"Dingbat hex": "7D",
			"Unicode dec": "128630",
			"Unicode hex": "1F676"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "126",
			"Dingbat hex": "7E",
			"Unicode dec": "128631",
			"Unicode hex": "1F677"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "127",
			"Dingbat hex": "7F",
			"Unicode dec": "9647",
			"Unicode hex": "25AF"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "128",
			"Dingbat hex": "80",
			"Unicode dec": "127243",
			"Unicode hex": "1F10B"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "129",
			"Dingbat hex": "81",
			"Unicode dec": "10112",
			"Unicode hex": "2780"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "130",
			"Dingbat hex": "82",
			"Unicode dec": "10113",
			"Unicode hex": "2781"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "131",
			"Dingbat hex": "83",
			"Unicode dec": "10114",
			"Unicode hex": "2782"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "132",
			"Dingbat hex": "84",
			"Unicode dec": "10115",
			"Unicode hex": "2783"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "133",
			"Dingbat hex": "85",
			"Unicode dec": "10116",
			"Unicode hex": "2784"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "134",
			"Dingbat hex": "86",
			"Unicode dec": "10117",
			"Unicode hex": "2785"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "135",
			"Dingbat hex": "87",
			"Unicode dec": "10118",
			"Unicode hex": "2786"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "136",
			"Dingbat hex": "88",
			"Unicode dec": "10119",
			"Unicode hex": "2787"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "137",
			"Dingbat hex": "89",
			"Unicode dec": "10120",
			"Unicode hex": "2788"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "138",
			"Dingbat hex": "8A",
			"Unicode dec": "10121",
			"Unicode hex": "2789"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "139",
			"Dingbat hex": "8B",
			"Unicode dec": "127244",
			"Unicode hex": "1F10C"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "140",
			"Dingbat hex": "8C",
			"Unicode dec": "10122",
			"Unicode hex": "278A"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "141",
			"Dingbat hex": "8D",
			"Unicode dec": "10123",
			"Unicode hex": "278B"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "142",
			"Dingbat hex": "8E",
			"Unicode dec": "10124",
			"Unicode hex": "278C"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "143",
			"Dingbat hex": "8F",
			"Unicode dec": "10125",
			"Unicode hex": "278D"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "144",
			"Dingbat hex": "90",
			"Unicode dec": "10126",
			"Unicode hex": "278E"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "145",
			"Dingbat hex": "91",
			"Unicode dec": "10127",
			"Unicode hex": "278F"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "146",
			"Dingbat hex": "92",
			"Unicode dec": "10128",
			"Unicode hex": "2790"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "147",
			"Dingbat hex": "93",
			"Unicode dec": "10129",
			"Unicode hex": "2791"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "148",
			"Dingbat hex": "94",
			"Unicode dec": "10130",
			"Unicode hex": "2792"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "149",
			"Dingbat hex": "95",
			"Unicode dec": "10131",
			"Unicode hex": "2793"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "150",
			"Dingbat hex": "96",
			"Unicode dec": "128610",
			"Unicode hex": "1F662"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "151",
			"Dingbat hex": "97",
			"Unicode dec": "128608",
			"Unicode hex": "1F660"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "152",
			"Dingbat hex": "98",
			"Unicode dec": "128609",
			"Unicode hex": "1F661"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "153",
			"Dingbat hex": "99",
			"Unicode dec": "128611",
			"Unicode hex": "1F663"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "154",
			"Dingbat hex": "9A",
			"Unicode dec": "128606",
			"Unicode hex": "1F65E"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "155",
			"Dingbat hex": "9B",
			"Unicode dec": "128604",
			"Unicode hex": "1F65C"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "156",
			"Dingbat hex": "9C",
			"Unicode dec": "128605",
			"Unicode hex": "1F65D"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "157",
			"Dingbat hex": "9D",
			"Unicode dec": "128607",
			"Unicode hex": "1F65F"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "158",
			"Dingbat hex": "9E",
			"Unicode dec": "8729",
			"Unicode hex": "2219"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "159",
			"Dingbat hex": "9F",
			"Unicode dec": "8226",
			"Unicode hex": "2022"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "160",
			"Dingbat hex": "A0",
			"Unicode dec": "11037",
			"Unicode hex": "2B1D"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "161",
			"Dingbat hex": "A1",
			"Unicode dec": "11096",
			"Unicode hex": "2B58"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "162",
			"Dingbat hex": "A2",
			"Unicode dec": "128902",
			"Unicode hex": "1F786"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "163",
			"Dingbat hex": "A3",
			"Unicode dec": "128904",
			"Unicode hex": "1F788"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "164",
			"Dingbat hex": "A4",
			"Unicode dec": "128906",
			"Unicode hex": "1F78A"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "165",
			"Dingbat hex": "A5",
			"Unicode dec": "128907",
			"Unicode hex": "1F78B"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "166",
			"Dingbat hex": "A6",
			"Unicode dec": "128319",
			"Unicode hex": "1F53F"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "167",
			"Dingbat hex": "A7",
			"Unicode dec": "9642",
			"Unicode hex": "25AA"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "168",
			"Dingbat hex": "A8",
			"Unicode dec": "128910",
			"Unicode hex": "1F78E"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "169",
			"Dingbat hex": "A9",
			"Unicode dec": "128961",
			"Unicode hex": "1F7C1"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "170",
			"Dingbat hex": "AA",
			"Unicode dec": "128965",
			"Unicode hex": "1F7C5"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "171",
			"Dingbat hex": "AB",
			"Unicode dec": "9733",
			"Unicode hex": "2605"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "172",
			"Dingbat hex": "AC",
			"Unicode dec": "128971",
			"Unicode hex": "1F7CB"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "173",
			"Dingbat hex": "AD",
			"Unicode dec": "128975",
			"Unicode hex": "1F7CF"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "174",
			"Dingbat hex": "AE",
			"Unicode dec": "128979",
			"Unicode hex": "1F7D3"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "175",
			"Dingbat hex": "AF",
			"Unicode dec": "128977",
			"Unicode hex": "1F7D1"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "176",
			"Dingbat hex": "B0",
			"Unicode dec": "11216",
			"Unicode hex": "2BD0"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "177",
			"Dingbat hex": "B1",
			"Unicode dec": "8982",
			"Unicode hex": "2316"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "178",
			"Dingbat hex": "B2",
			"Unicode dec": "11214",
			"Unicode hex": "2BCE"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "179",
			"Dingbat hex": "B3",
			"Unicode dec": "11215",
			"Unicode hex": "2BCF"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "180",
			"Dingbat hex": "B4",
			"Unicode dec": "11217",
			"Unicode hex": "2BD1"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "181",
			"Dingbat hex": "B5",
			"Unicode dec": "10026",
			"Unicode hex": "272A"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "182",
			"Dingbat hex": "B6",
			"Unicode dec": "10032",
			"Unicode hex": "2730"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "183",
			"Dingbat hex": "B7",
			"Unicode dec": "128336",
			"Unicode hex": "1F550"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "184",
			"Dingbat hex": "B8",
			"Unicode dec": "128337",
			"Unicode hex": "1F551"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "185",
			"Dingbat hex": "B9",
			"Unicode dec": "128338",
			"Unicode hex": "1F552"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "186",
			"Dingbat hex": "BA",
			"Unicode dec": "128339",
			"Unicode hex": "1F553"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "187",
			"Dingbat hex": "BB",
			"Unicode dec": "128340",
			"Unicode hex": "1F554"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "188",
			"Dingbat hex": "BC",
			"Unicode dec": "128341",
			"Unicode hex": "1F555"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "189",
			"Dingbat hex": "BD",
			"Unicode dec": "128342",
			"Unicode hex": "1F556"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "190",
			"Dingbat hex": "BE",
			"Unicode dec": "128343",
			"Unicode hex": "1F557"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "191",
			"Dingbat hex": "BF",
			"Unicode dec": "128344",
			"Unicode hex": "1F558"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "192",
			"Dingbat hex": "C0",
			"Unicode dec": "128345",
			"Unicode hex": "1F559"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "193",
			"Dingbat hex": "C1",
			"Unicode dec": "128346",
			"Unicode hex": "1F55A"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "194",
			"Dingbat hex": "C2",
			"Unicode dec": "128347",
			"Unicode hex": "1F55B"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "195",
			"Dingbat hex": "C3",
			"Unicode dec": "11184",
			"Unicode hex": "2BB0"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "196",
			"Dingbat hex": "C4",
			"Unicode dec": "11185",
			"Unicode hex": "2BB1"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "197",
			"Dingbat hex": "C5",
			"Unicode dec": "11186",
			"Unicode hex": "2BB2"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "198",
			"Dingbat hex": "C6",
			"Unicode dec": "11187",
			"Unicode hex": "2BB3"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "199",
			"Dingbat hex": "C7",
			"Unicode dec": "11188",
			"Unicode hex": "2BB4"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "200",
			"Dingbat hex": "C8",
			"Unicode dec": "11189",
			"Unicode hex": "2BB5"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "201",
			"Dingbat hex": "C9",
			"Unicode dec": "11190",
			"Unicode hex": "2BB6"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "202",
			"Dingbat hex": "CA",
			"Unicode dec": "11191",
			"Unicode hex": "2BB7"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "203",
			"Dingbat hex": "CB",
			"Unicode dec": "128618",
			"Unicode hex": "1F66A"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "204",
			"Dingbat hex": "CC",
			"Unicode dec": "128619",
			"Unicode hex": "1F66B"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "205",
			"Dingbat hex": "CD",
			"Unicode dec": "128597",
			"Unicode hex": "1F655"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "206",
			"Dingbat hex": "CE",
			"Unicode dec": "128596",
			"Unicode hex": "1F654"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "207",
			"Dingbat hex": "CF",
			"Unicode dec": "128599",
			"Unicode hex": "1F657"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "208",
			"Dingbat hex": "D0",
			"Unicode dec": "128598",
			"Unicode hex": "1F656"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "209",
			"Dingbat hex": "D1",
			"Unicode dec": "128592",
			"Unicode hex": "1F650"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "210",
			"Dingbat hex": "D2",
			"Unicode dec": "128593",
			"Unicode hex": "1F651"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "211",
			"Dingbat hex": "D3",
			"Unicode dec": "128594",
			"Unicode hex": "1F652"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "212",
			"Dingbat hex": "D4",
			"Unicode dec": "128595",
			"Unicode hex": "1F653"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "213",
			"Dingbat hex": "D5",
			"Unicode dec": "9003",
			"Unicode hex": "232B"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "214",
			"Dingbat hex": "D6",
			"Unicode dec": "8998",
			"Unicode hex": "2326"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "215",
			"Dingbat hex": "D7",
			"Unicode dec": "11160",
			"Unicode hex": "2B98"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "216",
			"Dingbat hex": "D8",
			"Unicode dec": "11162",
			"Unicode hex": "2B9A"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "217",
			"Dingbat hex": "D9",
			"Unicode dec": "11161",
			"Unicode hex": "2B99"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "218",
			"Dingbat hex": "DA",
			"Unicode dec": "11163",
			"Unicode hex": "2B9B"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "219",
			"Dingbat hex": "DB",
			"Unicode dec": "11144",
			"Unicode hex": "2B88"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "220",
			"Dingbat hex": "DC",
			"Unicode dec": "11146",
			"Unicode hex": "2B8A"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "221",
			"Dingbat hex": "DD",
			"Unicode dec": "11145",
			"Unicode hex": "2B89"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "222",
			"Dingbat hex": "DE",
			"Unicode dec": "11147",
			"Unicode hex": "2B8B"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "223",
			"Dingbat hex": "DF",
			"Unicode dec": "129128",
			"Unicode hex": "1F868"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "224",
			"Dingbat hex": "E0",
			"Unicode dec": "129130",
			"Unicode hex": "1F86A"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "225",
			"Dingbat hex": "E1",
			"Unicode dec": "129129",
			"Unicode hex": "1F869"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "226",
			"Dingbat hex": "E2",
			"Unicode dec": "129131",
			"Unicode hex": "1F86B"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "227",
			"Dingbat hex": "E3",
			"Unicode dec": "129132",
			"Unicode hex": "1F86C"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "228",
			"Dingbat hex": "E4",
			"Unicode dec": "129133",
			"Unicode hex": "1F86D"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "229",
			"Dingbat hex": "E5",
			"Unicode dec": "129135",
			"Unicode hex": "1F86F"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "230",
			"Dingbat hex": "E6",
			"Unicode dec": "129134",
			"Unicode hex": "1F86E"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "231",
			"Dingbat hex": "E7",
			"Unicode dec": "129144",
			"Unicode hex": "1F878"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "232",
			"Dingbat hex": "E8",
			"Unicode dec": "129146",
			"Unicode hex": "1F87A"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "233",
			"Dingbat hex": "E9",
			"Unicode dec": "129145",
			"Unicode hex": "1F879"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "234",
			"Dingbat hex": "EA",
			"Unicode dec": "129147",
			"Unicode hex": "1F87B"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "235",
			"Dingbat hex": "EB",
			"Unicode dec": "129148",
			"Unicode hex": "1F87C"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "236",
			"Dingbat hex": "EC",
			"Unicode dec": "129149",
			"Unicode hex": "1F87D"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "237",
			"Dingbat hex": "ED",
			"Unicode dec": "129151",
			"Unicode hex": "1F87F"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "238",
			"Dingbat hex": "EE",
			"Unicode dec": "129150",
			"Unicode hex": "1F87E"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "239",
			"Dingbat hex": "EF",
			"Unicode dec": "8678",
			"Unicode hex": "21E6"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "240",
			"Dingbat hex": "F0",
			"Unicode dec": "8680",
			"Unicode hex": "21E8"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "241",
			"Dingbat hex": "F1",
			"Unicode dec": "8679",
			"Unicode hex": "21E7"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "242",
			"Dingbat hex": "F2",
			"Unicode dec": "8681",
			"Unicode hex": "21E9"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "243",
			"Dingbat hex": "F3",
			"Unicode dec": "11012",
			"Unicode hex": "2B04"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "244",
			"Dingbat hex": "F4",
			"Unicode dec": "8691",
			"Unicode hex": "21F3"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "245",
			"Dingbat hex": "F5",
			"Unicode dec": "11009",
			"Unicode hex": "2B01"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "246",
			"Dingbat hex": "F6",
			"Unicode dec": "11008",
			"Unicode hex": "2B00"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "247",
			"Dingbat hex": "F7",
			"Unicode dec": "11011",
			"Unicode hex": "2B03"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "248",
			"Dingbat hex": "F8",
			"Unicode dec": "11010",
			"Unicode hex": "2B02"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "249",
			"Dingbat hex": "F9",
			"Unicode dec": "129196",
			"Unicode hex": "1F8AC"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "250",
			"Dingbat hex": "FA",
			"Unicode dec": "129197",
			"Unicode hex": "1F8AD"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "251",
			"Dingbat hex": "FB",
			"Unicode dec": "128502",
			"Unicode hex": "1F5F6"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "252",
			"Dingbat hex": "FC",
			"Unicode dec": "10003",
			"Unicode hex": "2713"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "253",
			"Dingbat hex": "FD",
			"Unicode dec": "128503",
			"Unicode hex": "1F5F7"
		},
		{
			"Typeface name": "Wingdings",
			"Dingbat dec": "254",
			"Dingbat hex": "FE",
			"Unicode dec": "128505",
			"Unicode hex": "1F5F9"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "32",
			"Dingbat hex": "20",
			"Unicode dec": "32",
			"Unicode hex": "20"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "33",
			"Dingbat hex": "21",
			"Unicode dec": "128394",
			"Unicode hex": "1F58A"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "34",
			"Dingbat hex": "22",
			"Unicode dec": "128395",
			"Unicode hex": "1F58B"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "35",
			"Dingbat hex": "23",
			"Unicode dec": "128396",
			"Unicode hex": "1F58C"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "36",
			"Dingbat hex": "24",
			"Unicode dec": "128397",
			"Unicode hex": "1F58D"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "37",
			"Dingbat hex": "25",
			"Unicode dec": "9988",
			"Unicode hex": "2704"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "38",
			"Dingbat hex": "26",
			"Unicode dec": "9984",
			"Unicode hex": "2700"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "39",
			"Dingbat hex": "27",
			"Unicode dec": "128382",
			"Unicode hex": "1F57E"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "40",
			"Dingbat hex": "28",
			"Unicode dec": "128381",
			"Unicode hex": "1F57D"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "41",
			"Dingbat hex": "29",
			"Unicode dec": "128453",
			"Unicode hex": "1F5C5"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "42",
			"Dingbat hex": "2A",
			"Unicode dec": "128454",
			"Unicode hex": "1F5C6"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "43",
			"Dingbat hex": "2B",
			"Unicode dec": "128455",
			"Unicode hex": "1F5C7"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "44",
			"Dingbat hex": "2C",
			"Unicode dec": "128456",
			"Unicode hex": "1F5C8"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "45",
			"Dingbat hex": "2D",
			"Unicode dec": "128457",
			"Unicode hex": "1F5C9"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "46",
			"Dingbat hex": "2E",
			"Unicode dec": "128458",
			"Unicode hex": "1F5CA"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "47",
			"Dingbat hex": "2F",
			"Unicode dec": "128459",
			"Unicode hex": "1F5CB"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "48",
			"Dingbat hex": "30",
			"Unicode dec": "128460",
			"Unicode hex": "1F5CC"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "49",
			"Dingbat hex": "31",
			"Unicode dec": "128461",
			"Unicode hex": "1F5CD"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "50",
			"Dingbat hex": "32",
			"Unicode dec": "128203",
			"Unicode hex": "1F4CB"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "51",
			"Dingbat hex": "33",
			"Unicode dec": "128465",
			"Unicode hex": "1F5D1"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "52",
			"Dingbat hex": "34",
			"Unicode dec": "128468",
			"Unicode hex": "1F5D4"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "53",
			"Dingbat hex": "35",
			"Unicode dec": "128437",
			"Unicode hex": "1F5B5"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "54",
			"Dingbat hex": "36",
			"Unicode dec": "128438",
			"Unicode hex": "1F5B6"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "55",
			"Dingbat hex": "37",
			"Unicode dec": "128439",
			"Unicode hex": "1F5B7"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "56",
			"Dingbat hex": "38",
			"Unicode dec": "128440",
			"Unicode hex": "1F5B8"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "57",
			"Dingbat hex": "39",
			"Unicode dec": "128429",
			"Unicode hex": "1F5AD"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "58",
			"Dingbat hex": "3A",
			"Unicode dec": "128431",
			"Unicode hex": "1F5AF"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "59",
			"Dingbat hex": "3B",
			"Unicode dec": "128433",
			"Unicode hex": "1F5B1"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "60",
			"Dingbat hex": "3C",
			"Unicode dec": "128402",
			"Unicode hex": "1F592"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "61",
			"Dingbat hex": "3D",
			"Unicode dec": "128403",
			"Unicode hex": "1F593"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "62",
			"Dingbat hex": "3E",
			"Unicode dec": "128408",
			"Unicode hex": "1F598"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "63",
			"Dingbat hex": "3F",
			"Unicode dec": "128409",
			"Unicode hex": "1F599"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "64",
			"Dingbat hex": "40",
			"Unicode dec": "128410",
			"Unicode hex": "1F59A"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "65",
			"Dingbat hex": "41",
			"Unicode dec": "128411",
			"Unicode hex": "1F59B"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "66",
			"Dingbat hex": "42",
			"Unicode dec": "128072",
			"Unicode hex": "1F448"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "67",
			"Dingbat hex": "43",
			"Unicode dec": "128073",
			"Unicode hex": "1F449"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "68",
			"Dingbat hex": "44",
			"Unicode dec": "128412",
			"Unicode hex": "1F59C"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "69",
			"Dingbat hex": "45",
			"Unicode dec": "128413",
			"Unicode hex": "1F59D"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "70",
			"Dingbat hex": "46",
			"Unicode dec": "128414",
			"Unicode hex": "1F59E"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "71",
			"Dingbat hex": "47",
			"Unicode dec": "128415",
			"Unicode hex": "1F59F"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "72",
			"Dingbat hex": "48",
			"Unicode dec": "128416",
			"Unicode hex": "1F5A0"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "73",
			"Dingbat hex": "49",
			"Unicode dec": "128417",
			"Unicode hex": "1F5A1"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "74",
			"Dingbat hex": "4A",
			"Unicode dec": "128070",
			"Unicode hex": "1F446"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "75",
			"Dingbat hex": "4B",
			"Unicode dec": "128071",
			"Unicode hex": "1F447"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "76",
			"Dingbat hex": "4C",
			"Unicode dec": "128418",
			"Unicode hex": "1F5A2"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "77",
			"Dingbat hex": "4D",
			"Unicode dec": "128419",
			"Unicode hex": "1F5A3"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "78",
			"Dingbat hex": "4E",
			"Unicode dec": "128401",
			"Unicode hex": "1F591"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "79",
			"Dingbat hex": "4F",
			"Unicode dec": "128500",
			"Unicode hex": "1F5F4"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "80",
			"Dingbat hex": "50",
			"Unicode dec": "128504",
			"Unicode hex": "1F5F8"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "81",
			"Dingbat hex": "51",
			"Unicode dec": "128501",
			"Unicode hex": "1F5F5"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "82",
			"Dingbat hex": "52",
			"Unicode dec": "9745",
			"Unicode hex": "2611"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "83",
			"Dingbat hex": "53",
			"Unicode dec": "11197",
			"Unicode hex": "2BBD"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "84",
			"Dingbat hex": "54",
			"Unicode dec": "9746",
			"Unicode hex": "2612"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "85",
			"Dingbat hex": "55",
			"Unicode dec": "11198",
			"Unicode hex": "2BBE"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "86",
			"Dingbat hex": "56",
			"Unicode dec": "11199",
			"Unicode hex": "2BBF"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "87",
			"Dingbat hex": "57",
			"Unicode dec": "128711",
			"Unicode hex": "1F6C7"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "88",
			"Dingbat hex": "58",
			"Unicode dec": "10680",
			"Unicode hex": "29B8"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "89",
			"Dingbat hex": "59",
			"Unicode dec": "128625",
			"Unicode hex": "1F671"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "90",
			"Dingbat hex": "5A",
			"Unicode dec": "128628",
			"Unicode hex": "1F674"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "91",
			"Dingbat hex": "5B",
			"Unicode dec": "128626",
			"Unicode hex": "1F672"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "92",
			"Dingbat hex": "5C",
			"Unicode dec": "128627",
			"Unicode hex": "1F673"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "93",
			"Dingbat hex": "5D",
			"Unicode dec": "8253",
			"Unicode hex": "203D"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "94",
			"Dingbat hex": "5E",
			"Unicode dec": "128633",
			"Unicode hex": "1F679"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "95",
			"Dingbat hex": "5F",
			"Unicode dec": "128634",
			"Unicode hex": "1F67A"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "96",
			"Dingbat hex": "60",
			"Unicode dec": "128635",
			"Unicode hex": "1F67B"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "97",
			"Dingbat hex": "61",
			"Unicode dec": "128614",
			"Unicode hex": "1F666"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "98",
			"Dingbat hex": "62",
			"Unicode dec": "128612",
			"Unicode hex": "1F664"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "99",
			"Dingbat hex": "63",
			"Unicode dec": "128613",
			"Unicode hex": "1F665"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "100",
			"Dingbat hex": "64",
			"Unicode dec": "128615",
			"Unicode hex": "1F667"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "101",
			"Dingbat hex": "65",
			"Unicode dec": "128602",
			"Unicode hex": "1F65A"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "102",
			"Dingbat hex": "66",
			"Unicode dec": "128600",
			"Unicode hex": "1F658"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "103",
			"Dingbat hex": "67",
			"Unicode dec": "128601",
			"Unicode hex": "1F659"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "104",
			"Dingbat hex": "68",
			"Unicode dec": "128603",
			"Unicode hex": "1F65B"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "105",
			"Dingbat hex": "69",
			"Unicode dec": "9450",
			"Unicode hex": "24EA"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "106",
			"Dingbat hex": "6A",
			"Unicode dec": "9312",
			"Unicode hex": "2460"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "107",
			"Dingbat hex": "6B",
			"Unicode dec": "9313",
			"Unicode hex": "2461"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "108",
			"Dingbat hex": "6C",
			"Unicode dec": "9314",
			"Unicode hex": "2462"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "109",
			"Dingbat hex": "6D",
			"Unicode dec": "9315",
			"Unicode hex": "2463"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "110",
			"Dingbat hex": "6E",
			"Unicode dec": "9316",
			"Unicode hex": "2464"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "111",
			"Dingbat hex": "6F",
			"Unicode dec": "9317",
			"Unicode hex": "2465"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "112",
			"Dingbat hex": "70",
			"Unicode dec": "9318",
			"Unicode hex": "2466"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "113",
			"Dingbat hex": "71",
			"Unicode dec": "9319",
			"Unicode hex": "2467"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "114",
			"Dingbat hex": "72",
			"Unicode dec": "9320",
			"Unicode hex": "2468"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "115",
			"Dingbat hex": "73",
			"Unicode dec": "9321",
			"Unicode hex": "2469"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "116",
			"Dingbat hex": "74",
			"Unicode dec": "9471",
			"Unicode hex": "24FF"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "117",
			"Dingbat hex": "75",
			"Unicode dec": "10102",
			"Unicode hex": "2776"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "118",
			"Dingbat hex": "76",
			"Unicode dec": "10103",
			"Unicode hex": "2777"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "119",
			"Dingbat hex": "77",
			"Unicode dec": "10104",
			"Unicode hex": "2778"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "120",
			"Dingbat hex": "78",
			"Unicode dec": "10105",
			"Unicode hex": "2779"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "121",
			"Dingbat hex": "79",
			"Unicode dec": "10106",
			"Unicode hex": "277A"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "122",
			"Dingbat hex": "7A",
			"Unicode dec": "10107",
			"Unicode hex": "277B"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "123",
			"Dingbat hex": "7B",
			"Unicode dec": "10108",
			"Unicode hex": "277C"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "124",
			"Dingbat hex": "7C",
			"Unicode dec": "10109",
			"Unicode hex": "277D"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "125",
			"Dingbat hex": "7D",
			"Unicode dec": "10110",
			"Unicode hex": "277E"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "126",
			"Dingbat hex": "7E",
			"Unicode dec": "10111",
			"Unicode hex": "277F"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "128",
			"Dingbat hex": "80",
			"Unicode dec": "9737",
			"Unicode hex": "2609"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "129",
			"Dingbat hex": "81",
			"Unicode dec": "127765",
			"Unicode hex": "1F315"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "130",
			"Dingbat hex": "82",
			"Unicode dec": "9789",
			"Unicode hex": "263D"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "131",
			"Dingbat hex": "83",
			"Unicode dec": "9790",
			"Unicode hex": "263E"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "132",
			"Dingbat hex": "84",
			"Unicode dec": "11839",
			"Unicode hex": "2E3F"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "133",
			"Dingbat hex": "85",
			"Unicode dec": "10013",
			"Unicode hex": "271D"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "134",
			"Dingbat hex": "86",
			"Unicode dec": "128327",
			"Unicode hex": "1F547"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "135",
			"Dingbat hex": "87",
			"Unicode dec": "128348",
			"Unicode hex": "1F55C"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "136",
			"Dingbat hex": "88",
			"Unicode dec": "128349",
			"Unicode hex": "1F55D"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "137",
			"Dingbat hex": "89",
			"Unicode dec": "128350",
			"Unicode hex": "1F55E"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "138",
			"Dingbat hex": "8A",
			"Unicode dec": "128351",
			"Unicode hex": "1F55F"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "139",
			"Dingbat hex": "8B",
			"Unicode dec": "128352",
			"Unicode hex": "1F560"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "140",
			"Dingbat hex": "8C",
			"Unicode dec": "128353",
			"Unicode hex": "1F561"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "141",
			"Dingbat hex": "8D",
			"Unicode dec": "128354",
			"Unicode hex": "1F562"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "142",
			"Dingbat hex": "8E",
			"Unicode dec": "128355",
			"Unicode hex": "1F563"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "143",
			"Dingbat hex": "8F",
			"Unicode dec": "128356",
			"Unicode hex": "1F564"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "144",
			"Dingbat hex": "90",
			"Unicode dec": "128357",
			"Unicode hex": "1F565"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "145",
			"Dingbat hex": "91",
			"Unicode dec": "128358",
			"Unicode hex": "1F566"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "146",
			"Dingbat hex": "92",
			"Unicode dec": "128359",
			"Unicode hex": "1F567"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "147",
			"Dingbat hex": "93",
			"Unicode dec": "128616",
			"Unicode hex": "1F668"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "148",
			"Dingbat hex": "94",
			"Unicode dec": "128617",
			"Unicode hex": "1F669"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "149",
			"Dingbat hex": "95",
			"Unicode dec": "8901",
			"Unicode hex": "22C5"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "150",
			"Dingbat hex": "96",
			"Unicode dec": "128900",
			"Unicode hex": "1F784"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "151",
			"Dingbat hex": "97",
			"Unicode dec": "10625",
			"Unicode hex": "2981"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "152",
			"Dingbat hex": "98",
			"Unicode dec": "9679",
			"Unicode hex": "25CF"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "153",
			"Dingbat hex": "99",
			"Unicode dec": "9675",
			"Unicode hex": "25CB"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "154",
			"Dingbat hex": "9A",
			"Unicode dec": "128901",
			"Unicode hex": "1F785"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "155",
			"Dingbat hex": "9B",
			"Unicode dec": "128903",
			"Unicode hex": "1F787"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "156",
			"Dingbat hex": "9C",
			"Unicode dec": "128905",
			"Unicode hex": "1F789"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "157",
			"Dingbat hex": "9D",
			"Unicode dec": "8857",
			"Unicode hex": "2299"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "158",
			"Dingbat hex": "9E",
			"Unicode dec": "10687",
			"Unicode hex": "29BF"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "159",
			"Dingbat hex": "9F",
			"Unicode dec": "128908",
			"Unicode hex": "1F78C"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "160",
			"Dingbat hex": "A0",
			"Unicode dec": "128909",
			"Unicode hex": "1F78D"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "161",
			"Dingbat hex": "A1",
			"Unicode dec": "9726",
			"Unicode hex": "25FE"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "162",
			"Dingbat hex": "A2",
			"Unicode dec": "9632",
			"Unicode hex": "25A0"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "163",
			"Dingbat hex": "A3",
			"Unicode dec": "9633",
			"Unicode hex": "25A1"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "164",
			"Dingbat hex": "A4",
			"Unicode dec": "128913",
			"Unicode hex": "1F791"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "165",
			"Dingbat hex": "A5",
			"Unicode dec": "128914",
			"Unicode hex": "1F792"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "166",
			"Dingbat hex": "A6",
			"Unicode dec": "128915",
			"Unicode hex": "1F793"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "167",
			"Dingbat hex": "A7",
			"Unicode dec": "128916",
			"Unicode hex": "1F794"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "168",
			"Dingbat hex": "A8",
			"Unicode dec": "9635",
			"Unicode hex": "25A3"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "169",
			"Dingbat hex": "A9",
			"Unicode dec": "128917",
			"Unicode hex": "1F795"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "170",
			"Dingbat hex": "AA",
			"Unicode dec": "128918",
			"Unicode hex": "1F796"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "171",
			"Dingbat hex": "AB",
			"Unicode dec": "128919",
			"Unicode hex": "1F797"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "172",
			"Dingbat hex": "AC",
			"Unicode dec": "128920",
			"Unicode hex": "1F798"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "173",
			"Dingbat hex": "AD",
			"Unicode dec": "11049",
			"Unicode hex": "2B29"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "174",
			"Dingbat hex": "AE",
			"Unicode dec": "11045",
			"Unicode hex": "2B25"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "175",
			"Dingbat hex": "AF",
			"Unicode dec": "9671",
			"Unicode hex": "25C7"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "176",
			"Dingbat hex": "B0",
			"Unicode dec": "128922",
			"Unicode hex": "1F79A"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "177",
			"Dingbat hex": "B1",
			"Unicode dec": "9672",
			"Unicode hex": "25C8"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "178",
			"Dingbat hex": "B2",
			"Unicode dec": "128923",
			"Unicode hex": "1F79B"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "179",
			"Dingbat hex": "B3",
			"Unicode dec": "128924",
			"Unicode hex": "1F79C"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "180",
			"Dingbat hex": "B4",
			"Unicode dec": "128925",
			"Unicode hex": "1F79D"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "181",
			"Dingbat hex": "B5",
			"Unicode dec": "128926",
			"Unicode hex": "1F79E"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "182",
			"Dingbat hex": "B6",
			"Unicode dec": "11050",
			"Unicode hex": "2B2A"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "183",
			"Dingbat hex": "B7",
			"Unicode dec": "11047",
			"Unicode hex": "2B27"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "184",
			"Dingbat hex": "B8",
			"Unicode dec": "9674",
			"Unicode hex": "25CA"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "185",
			"Dingbat hex": "B9",
			"Unicode dec": "128928",
			"Unicode hex": "1F7A0"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "186",
			"Dingbat hex": "BA",
			"Unicode dec": "9686",
			"Unicode hex": "25D6"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "187",
			"Dingbat hex": "BB",
			"Unicode dec": "9687",
			"Unicode hex": "25D7"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "188",
			"Dingbat hex": "BC",
			"Unicode dec": "11210",
			"Unicode hex": "2BCA"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "189",
			"Dingbat hex": "BD",
			"Unicode dec": "11211",
			"Unicode hex": "2BCB"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "190",
			"Dingbat hex": "BE",
			"Unicode dec": "11200",
			"Unicode hex": "2BC0"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "191",
			"Dingbat hex": "BF",
			"Unicode dec": "11201",
			"Unicode hex": "2BC1"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "192",
			"Dingbat hex": "C0",
			"Unicode dec": "11039",
			"Unicode hex": "2B1F"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "193",
			"Dingbat hex": "C1",
			"Unicode dec": "11202",
			"Unicode hex": "2BC2"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "194",
			"Dingbat hex": "C2",
			"Unicode dec": "11043",
			"Unicode hex": "2B23"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "195",
			"Dingbat hex": "C3",
			"Unicode dec": "11042",
			"Unicode hex": "2B22"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "196",
			"Dingbat hex": "C4",
			"Unicode dec": "11203",
			"Unicode hex": "2BC3"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "197",
			"Dingbat hex": "C5",
			"Unicode dec": "11204",
			"Unicode hex": "2BC4"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "198",
			"Dingbat hex": "C6",
			"Unicode dec": "128929",
			"Unicode hex": "1F7A1"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "199",
			"Dingbat hex": "C7",
			"Unicode dec": "128930",
			"Unicode hex": "1F7A2"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "200",
			"Dingbat hex": "C8",
			"Unicode dec": "128931",
			"Unicode hex": "1F7A3"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "201",
			"Dingbat hex": "C9",
			"Unicode dec": "128932",
			"Unicode hex": "1F7A4"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "202",
			"Dingbat hex": "CA",
			"Unicode dec": "128933",
			"Unicode hex": "1F7A5"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "203",
			"Dingbat hex": "CB",
			"Unicode dec": "128934",
			"Unicode hex": "1F7A6"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "204",
			"Dingbat hex": "CC",
			"Unicode dec": "128935",
			"Unicode hex": "1F7A7"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "205",
			"Dingbat hex": "CD",
			"Unicode dec": "128936",
			"Unicode hex": "1F7A8"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "206",
			"Dingbat hex": "CE",
			"Unicode dec": "128937",
			"Unicode hex": "1F7A9"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "207",
			"Dingbat hex": "CF",
			"Unicode dec": "128938",
			"Unicode hex": "1F7AA"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "208",
			"Dingbat hex": "D0",
			"Unicode dec": "128939",
			"Unicode hex": "1F7AB"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "209",
			"Dingbat hex": "D1",
			"Unicode dec": "128940",
			"Unicode hex": "1F7AC"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "210",
			"Dingbat hex": "D2",
			"Unicode dec": "128941",
			"Unicode hex": "1F7AD"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "211",
			"Dingbat hex": "D3",
			"Unicode dec": "128942",
			"Unicode hex": "1F7AE"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "212",
			"Dingbat hex": "D4",
			"Unicode dec": "128943",
			"Unicode hex": "1F7AF"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "213",
			"Dingbat hex": "D5",
			"Unicode dec": "128944",
			"Unicode hex": "1F7B0"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "214",
			"Dingbat hex": "D6",
			"Unicode dec": "128945",
			"Unicode hex": "1F7B1"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "215",
			"Dingbat hex": "D7",
			"Unicode dec": "128946",
			"Unicode hex": "1F7B2"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "216",
			"Dingbat hex": "D8",
			"Unicode dec": "128947",
			"Unicode hex": "1F7B3"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "217",
			"Dingbat hex": "D9",
			"Unicode dec": "128948",
			"Unicode hex": "1F7B4"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "218",
			"Dingbat hex": "DA",
			"Unicode dec": "128949",
			"Unicode hex": "1F7B5"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "219",
			"Dingbat hex": "DB",
			"Unicode dec": "128950",
			"Unicode hex": "1F7B6"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "220",
			"Dingbat hex": "DC",
			"Unicode dec": "128951",
			"Unicode hex": "1F7B7"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "221",
			"Dingbat hex": "DD",
			"Unicode dec": "128952",
			"Unicode hex": "1F7B8"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "222",
			"Dingbat hex": "DE",
			"Unicode dec": "128953",
			"Unicode hex": "1F7B9"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "223",
			"Dingbat hex": "DF",
			"Unicode dec": "128954",
			"Unicode hex": "1F7BA"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "224",
			"Dingbat hex": "E0",
			"Unicode dec": "128955",
			"Unicode hex": "1F7BB"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "225",
			"Dingbat hex": "E1",
			"Unicode dec": "128956",
			"Unicode hex": "1F7BC"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "226",
			"Dingbat hex": "E2",
			"Unicode dec": "128957",
			"Unicode hex": "1F7BD"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "227",
			"Dingbat hex": "E3",
			"Unicode dec": "128958",
			"Unicode hex": "1F7BE"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "228",
			"Dingbat hex": "E4",
			"Unicode dec": "128959",
			"Unicode hex": "1F7BF"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "229",
			"Dingbat hex": "E5",
			"Unicode dec": "128960",
			"Unicode hex": "1F7C0"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "230",
			"Dingbat hex": "E6",
			"Unicode dec": "128962",
			"Unicode hex": "1F7C2"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "231",
			"Dingbat hex": "E7",
			"Unicode dec": "128964",
			"Unicode hex": "1F7C4"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "232",
			"Dingbat hex": "E8",
			"Unicode dec": "128966",
			"Unicode hex": "1F7C6"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "233",
			"Dingbat hex": "E9",
			"Unicode dec": "128969",
			"Unicode hex": "1F7C9"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "234",
			"Dingbat hex": "EA",
			"Unicode dec": "128970",
			"Unicode hex": "1F7CA"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "235",
			"Dingbat hex": "EB",
			"Unicode dec": "10038",
			"Unicode hex": "2736"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "236",
			"Dingbat hex": "EC",
			"Unicode dec": "128972",
			"Unicode hex": "1F7CC"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "237",
			"Dingbat hex": "ED",
			"Unicode dec": "128974",
			"Unicode hex": "1F7CE"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "238",
			"Dingbat hex": "EE",
			"Unicode dec": "128976",
			"Unicode hex": "1F7D0"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "239",
			"Dingbat hex": "EF",
			"Unicode dec": "128978",
			"Unicode hex": "1F7D2"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "240",
			"Dingbat hex": "F0",
			"Unicode dec": "10041",
			"Unicode hex": "2739"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "241",
			"Dingbat hex": "F1",
			"Unicode dec": "128963",
			"Unicode hex": "1F7C3"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "242",
			"Dingbat hex": "F2",
			"Unicode dec": "128967",
			"Unicode hex": "1F7C7"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "243",
			"Dingbat hex": "F3",
			"Unicode dec": "10031",
			"Unicode hex": "272F"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "244",
			"Dingbat hex": "F4",
			"Unicode dec": "128973",
			"Unicode hex": "1F7CD"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "245",
			"Dingbat hex": "F5",
			"Unicode dec": "128980",
			"Unicode hex": "1F7D4"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "246",
			"Dingbat hex": "F6",
			"Unicode dec": "11212",
			"Unicode hex": "2BCC"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "247",
			"Dingbat hex": "F7",
			"Unicode dec": "11213",
			"Unicode hex": "2BCD"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "248",
			"Dingbat hex": "F8",
			"Unicode dec": "8251",
			"Unicode hex": "203B"
		},
		{
			"Typeface name": "Wingdings 2",
			"Dingbat dec": "249",
			"Dingbat hex": "F9",
			"Unicode dec": "8258",
			"Unicode hex": "2042"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "32",
			"Dingbat hex": "20",
			"Unicode dec": "32",
			"Unicode hex": "20"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "33",
			"Dingbat hex": "21",
			"Unicode dec": "11104",
			"Unicode hex": "2B60"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "34",
			"Dingbat hex": "22",
			"Unicode dec": "11106",
			"Unicode hex": "2B62"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "35",
			"Dingbat hex": "23",
			"Unicode dec": "11105",
			"Unicode hex": "2B61"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "36",
			"Dingbat hex": "24",
			"Unicode dec": "11107",
			"Unicode hex": "2B63"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "37",
			"Dingbat hex": "25",
			"Unicode dec": "11110",
			"Unicode hex": "2B66"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "38",
			"Dingbat hex": "26",
			"Unicode dec": "11111",
			"Unicode hex": "2B67"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "39",
			"Dingbat hex": "27",
			"Unicode dec": "11113",
			"Unicode hex": "2B69"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "40",
			"Dingbat hex": "28",
			"Unicode dec": "11112",
			"Unicode hex": "2B68"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "41",
			"Dingbat hex": "29",
			"Unicode dec": "11120",
			"Unicode hex": "2B70"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "42",
			"Dingbat hex": "2A",
			"Unicode dec": "11122",
			"Unicode hex": "2B72"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "43",
			"Dingbat hex": "2B",
			"Unicode dec": "11121",
			"Unicode hex": "2B71"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "44",
			"Dingbat hex": "2C",
			"Unicode dec": "11123",
			"Unicode hex": "2B73"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "45",
			"Dingbat hex": "2D",
			"Unicode dec": "11126",
			"Unicode hex": "2B76"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "46",
			"Dingbat hex": "2E",
			"Unicode dec": "11128",
			"Unicode hex": "2B78"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "47",
			"Dingbat hex": "2F",
			"Unicode dec": "11131",
			"Unicode hex": "2B7B"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "48",
			"Dingbat hex": "30",
			"Unicode dec": "11133",
			"Unicode hex": "2B7D"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "49",
			"Dingbat hex": "31",
			"Unicode dec": "11108",
			"Unicode hex": "2B64"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "50",
			"Dingbat hex": "32",
			"Unicode dec": "11109",
			"Unicode hex": "2B65"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "51",
			"Dingbat hex": "33",
			"Unicode dec": "11114",
			"Unicode hex": "2B6A"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "52",
			"Dingbat hex": "34",
			"Unicode dec": "11116",
			"Unicode hex": "2B6C"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "53",
			"Dingbat hex": "35",
			"Unicode dec": "11115",
			"Unicode hex": "2B6B"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "54",
			"Dingbat hex": "36",
			"Unicode dec": "11117",
			"Unicode hex": "2B6D"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "55",
			"Dingbat hex": "37",
			"Unicode dec": "11085",
			"Unicode hex": "2B4D"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "56",
			"Dingbat hex": "38",
			"Unicode dec": "11168",
			"Unicode hex": "2BA0"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "57",
			"Dingbat hex": "39",
			"Unicode dec": "11169",
			"Unicode hex": "2BA1"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "58",
			"Dingbat hex": "3A",
			"Unicode dec": "11170",
			"Unicode hex": "2BA2"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "59",
			"Dingbat hex": "3B",
			"Unicode dec": "11171",
			"Unicode hex": "2BA3"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "60",
			"Dingbat hex": "3C",
			"Unicode dec": "11172",
			"Unicode hex": "2BA4"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "61",
			"Dingbat hex": "3D",
			"Unicode dec": "11173",
			"Unicode hex": "2BA5"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "62",
			"Dingbat hex": "3E",
			"Unicode dec": "11174",
			"Unicode hex": "2BA6"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "63",
			"Dingbat hex": "3F",
			"Unicode dec": "11175",
			"Unicode hex": "2BA7"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "64",
			"Dingbat hex": "40",
			"Unicode dec": "11152",
			"Unicode hex": "2B90"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "65",
			"Dingbat hex": "41",
			"Unicode dec": "11153",
			"Unicode hex": "2B91"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "66",
			"Dingbat hex": "42",
			"Unicode dec": "11154",
			"Unicode hex": "2B92"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "67",
			"Dingbat hex": "43",
			"Unicode dec": "11155",
			"Unicode hex": "2B93"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "68",
			"Dingbat hex": "44",
			"Unicode dec": "11136",
			"Unicode hex": "2B80"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "69",
			"Dingbat hex": "45",
			"Unicode dec": "11139",
			"Unicode hex": "2B83"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "70",
			"Dingbat hex": "46",
			"Unicode dec": "11134",
			"Unicode hex": "2B7E"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "71",
			"Dingbat hex": "47",
			"Unicode dec": "11135",
			"Unicode hex": "2B7F"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "72",
			"Dingbat hex": "48",
			"Unicode dec": "11140",
			"Unicode hex": "2B84"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "73",
			"Dingbat hex": "49",
			"Unicode dec": "11142",
			"Unicode hex": "2B86"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "74",
			"Dingbat hex": "4A",
			"Unicode dec": "11141",
			"Unicode hex": "2B85"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "75",
			"Dingbat hex": "4B",
			"Unicode dec": "11143",
			"Unicode hex": "2B87"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "76",
			"Dingbat hex": "4C",
			"Unicode dec": "11151",
			"Unicode hex": "2B8F"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "77",
			"Dingbat hex": "4D",
			"Unicode dec": "11149",
			"Unicode hex": "2B8D"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "78",
			"Dingbat hex": "4E",
			"Unicode dec": "11150",
			"Unicode hex": "2B8E"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "79",
			"Dingbat hex": "4F",
			"Unicode dec": "11148",
			"Unicode hex": "2B8C"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "80",
			"Dingbat hex": "50",
			"Unicode dec": "11118",
			"Unicode hex": "2B6E"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "81",
			"Dingbat hex": "51",
			"Unicode dec": "11119",
			"Unicode hex": "2B6F"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "82",
			"Dingbat hex": "52",
			"Unicode dec": "9099",
			"Unicode hex": "238B"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "83",
			"Dingbat hex": "53",
			"Unicode dec": "8996",
			"Unicode hex": "2324"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "84",
			"Dingbat hex": "54",
			"Unicode dec": "8963",
			"Unicode hex": "2303"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "85",
			"Dingbat hex": "55",
			"Unicode dec": "8997",
			"Unicode hex": "2325"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "86",
			"Dingbat hex": "56",
			"Unicode dec": "9251",
			"Unicode hex": "2423"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "87",
			"Dingbat hex": "57",
			"Unicode dec": "9085",
			"Unicode hex": "237D"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "88",
			"Dingbat hex": "58",
			"Unicode dec": "8682",
			"Unicode hex": "21EA"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "89",
			"Dingbat hex": "59",
			"Unicode dec": "11192",
			"Unicode hex": "2BB8"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "90",
			"Dingbat hex": "5A",
			"Unicode dec": "129184",
			"Unicode hex": "1F8A0"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "91",
			"Dingbat hex": "5B",
			"Unicode dec": "129185",
			"Unicode hex": "1F8A1"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "92",
			"Dingbat hex": "5C",
			"Unicode dec": "129186",
			"Unicode hex": "1F8A2"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "93",
			"Dingbat hex": "5D",
			"Unicode dec": "129187",
			"Unicode hex": "1F8A3"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "94",
			"Dingbat hex": "5E",
			"Unicode dec": "129188",
			"Unicode hex": "1F8A4"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "95",
			"Dingbat hex": "5F",
			"Unicode dec": "129189",
			"Unicode hex": "1F8A5"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "96",
			"Dingbat hex": "60",
			"Unicode dec": "129190",
			"Unicode hex": "1F8A6"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "97",
			"Dingbat hex": "61",
			"Unicode dec": "129191",
			"Unicode hex": "1F8A7"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "98",
			"Dingbat hex": "62",
			"Unicode dec": "129192",
			"Unicode hex": "1F8A8"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "99",
			"Dingbat hex": "63",
			"Unicode dec": "129193",
			"Unicode hex": "1F8A9"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "100",
			"Dingbat hex": "64",
			"Unicode dec": "129194",
			"Unicode hex": "1F8AA"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "101",
			"Dingbat hex": "65",
			"Unicode dec": "129195",
			"Unicode hex": "1F8AB"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "102",
			"Dingbat hex": "66",
			"Unicode dec": "129104",
			"Unicode hex": "1F850"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "103",
			"Dingbat hex": "67",
			"Unicode dec": "129106",
			"Unicode hex": "1F852"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "104",
			"Dingbat hex": "68",
			"Unicode dec": "129105",
			"Unicode hex": "1F851"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "105",
			"Dingbat hex": "69",
			"Unicode dec": "129107",
			"Unicode hex": "1F853"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "106",
			"Dingbat hex": "6A",
			"Unicode dec": "129108",
			"Unicode hex": "1F854"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "107",
			"Dingbat hex": "6B",
			"Unicode dec": "129109",
			"Unicode hex": "1F855"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "108",
			"Dingbat hex": "6C",
			"Unicode dec": "129111",
			"Unicode hex": "1F857"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "109",
			"Dingbat hex": "6D",
			"Unicode dec": "129110",
			"Unicode hex": "1F856"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "110",
			"Dingbat hex": "6E",
			"Unicode dec": "129112",
			"Unicode hex": "1F858"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "111",
			"Dingbat hex": "6F",
			"Unicode dec": "129113",
			"Unicode hex": "1F859"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "112",
			"Dingbat hex": "70",
			"Unicode dec": "9650",
			"Unicode hex": "25B2"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "113",
			"Dingbat hex": "71",
			"Unicode dec": "9660",
			"Unicode hex": "25BC"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "114",
			"Dingbat hex": "72",
			"Unicode dec": "9651",
			"Unicode hex": "25B3"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "115",
			"Dingbat hex": "73",
			"Unicode dec": "9661",
			"Unicode hex": "25BD"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "116",
			"Dingbat hex": "74",
			"Unicode dec": "9664",
			"Unicode hex": "25C0"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "117",
			"Dingbat hex": "75",
			"Unicode dec": "9654",
			"Unicode hex": "25B6"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "118",
			"Dingbat hex": "76",
			"Unicode dec": "9665",
			"Unicode hex": "25C1"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "119",
			"Dingbat hex": "77",
			"Unicode dec": "9655",
			"Unicode hex": "25B7"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "120",
			"Dingbat hex": "78",
			"Unicode dec": "9699",
			"Unicode hex": "25E3"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "121",
			"Dingbat hex": "79",
			"Unicode dec": "9698",
			"Unicode hex": "25E2"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "122",
			"Dingbat hex": "7A",
			"Unicode dec": "9700",
			"Unicode hex": "25E4"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "123",
			"Dingbat hex": "7B",
			"Unicode dec": "9701",
			"Unicode hex": "25E5"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "124",
			"Dingbat hex": "7C",
			"Unicode dec": "128896",
			"Unicode hex": "1F780"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "125",
			"Dingbat hex": "7D",
			"Unicode dec": "128898",
			"Unicode hex": "1F782"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "126",
			"Dingbat hex": "7E",
			"Unicode dec": "128897",
			"Unicode hex": "1F781"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "128",
			"Dingbat hex": "80",
			"Unicode dec": "128899",
			"Unicode hex": "1F783"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "129",
			"Dingbat hex": "81",
			"Unicode dec": "11205",
			"Unicode hex": "2BC5"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "130",
			"Dingbat hex": "82",
			"Unicode dec": "11206",
			"Unicode hex": "2BC6"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "131",
			"Dingbat hex": "83",
			"Unicode dec": "11207",
			"Unicode hex": "2BC7"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "132",
			"Dingbat hex": "84",
			"Unicode dec": "11208",
			"Unicode hex": "2BC8"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "133",
			"Dingbat hex": "85",
			"Unicode dec": "11164",
			"Unicode hex": "2B9C"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "134",
			"Dingbat hex": "86",
			"Unicode dec": "11166",
			"Unicode hex": "2B9E"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "135",
			"Dingbat hex": "87",
			"Unicode dec": "11165",
			"Unicode hex": "2B9D"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "136",
			"Dingbat hex": "88",
			"Unicode dec": "11167",
			"Unicode hex": "2B9F"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "137",
			"Dingbat hex": "89",
			"Unicode dec": "129040",
			"Unicode hex": "1F810"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "138",
			"Dingbat hex": "8A",
			"Unicode dec": "129042",
			"Unicode hex": "1F812"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "139",
			"Dingbat hex": "8B",
			"Unicode dec": "129041",
			"Unicode hex": "1F811"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "140",
			"Dingbat hex": "8C",
			"Unicode dec": "129043",
			"Unicode hex": "1F813"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "141",
			"Dingbat hex": "8D",
			"Unicode dec": "129044",
			"Unicode hex": "1F814"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "142",
			"Dingbat hex": "8E",
			"Unicode dec": "129046",
			"Unicode hex": "1F816"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "143",
			"Dingbat hex": "8F",
			"Unicode dec": "129045",
			"Unicode hex": "1F815"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "144",
			"Dingbat hex": "90",
			"Unicode dec": "129047",
			"Unicode hex": "1F817"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "145",
			"Dingbat hex": "91",
			"Unicode dec": "129048",
			"Unicode hex": "1F818"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "146",
			"Dingbat hex": "92",
			"Unicode dec": "129050",
			"Unicode hex": "1F81A"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "147",
			"Dingbat hex": "93",
			"Unicode dec": "129049",
			"Unicode hex": "1F819"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "148",
			"Dingbat hex": "94",
			"Unicode dec": "129051",
			"Unicode hex": "1F81B"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "149",
			"Dingbat hex": "95",
			"Unicode dec": "129052",
			"Unicode hex": "1F81C"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "150",
			"Dingbat hex": "96",
			"Unicode dec": "129054",
			"Unicode hex": "1F81E"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "151",
			"Dingbat hex": "97",
			"Unicode dec": "129053",
			"Unicode hex": "1F81D"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "152",
			"Dingbat hex": "98",
			"Unicode dec": "129055",
			"Unicode hex": "1F81F"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "153",
			"Dingbat hex": "99",
			"Unicode dec": "129024",
			"Unicode hex": "1F800"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "154",
			"Dingbat hex": "9A",
			"Unicode dec": "129026",
			"Unicode hex": "1F802"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "155",
			"Dingbat hex": "9B",
			"Unicode dec": "129025",
			"Unicode hex": "1F801"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "156",
			"Dingbat hex": "9C",
			"Unicode dec": "129027",
			"Unicode hex": "1F803"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "157",
			"Dingbat hex": "9D",
			"Unicode dec": "129028",
			"Unicode hex": "1F804"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "158",
			"Dingbat hex": "9E",
			"Unicode dec": "129030",
			"Unicode hex": "1F806"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "159",
			"Dingbat hex": "9F",
			"Unicode dec": "129029",
			"Unicode hex": "1F805"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "160",
			"Dingbat hex": "A0",
			"Unicode dec": "129031",
			"Unicode hex": "1F807"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "161",
			"Dingbat hex": "A1",
			"Unicode dec": "129032",
			"Unicode hex": "1F808"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "162",
			"Dingbat hex": "A2",
			"Unicode dec": "129034",
			"Unicode hex": "1F80A"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "163",
			"Dingbat hex": "A3",
			"Unicode dec": "129033",
			"Unicode hex": "1F809"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "164",
			"Dingbat hex": "A4",
			"Unicode dec": "129035",
			"Unicode hex": "1F80B"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "165",
			"Dingbat hex": "A5",
			"Unicode dec": "129056",
			"Unicode hex": "1F820"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "166",
			"Dingbat hex": "A6",
			"Unicode dec": "129058",
			"Unicode hex": "1F822"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "167",
			"Dingbat hex": "A7",
			"Unicode dec": "129060",
			"Unicode hex": "1F824"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "168",
			"Dingbat hex": "A8",
			"Unicode dec": "129062",
			"Unicode hex": "1F826"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "169",
			"Dingbat hex": "A9",
			"Unicode dec": "129064",
			"Unicode hex": "1F828"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "170",
			"Dingbat hex": "AA",
			"Unicode dec": "129066",
			"Unicode hex": "1F82A"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "171",
			"Dingbat hex": "AB",
			"Unicode dec": "129068",
			"Unicode hex": "1F82C"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "172",
			"Dingbat hex": "AC",
			"Unicode dec": "129180",
			"Unicode hex": "1F89C"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "173",
			"Dingbat hex": "AD",
			"Unicode dec": "129181",
			"Unicode hex": "1F89D"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "174",
			"Dingbat hex": "AE",
			"Unicode dec": "129182",
			"Unicode hex": "1F89E"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "175",
			"Dingbat hex": "AF",
			"Unicode dec": "129183",
			"Unicode hex": "1F89F"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "176",
			"Dingbat hex": "B0",
			"Unicode dec": "129070",
			"Unicode hex": "1F82E"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "177",
			"Dingbat hex": "B1",
			"Unicode dec": "129072",
			"Unicode hex": "1F830"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "178",
			"Dingbat hex": "B2",
			"Unicode dec": "129074",
			"Unicode hex": "1F832"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "179",
			"Dingbat hex": "B3",
			"Unicode dec": "129076",
			"Unicode hex": "1F834"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "180",
			"Dingbat hex": "B4",
			"Unicode dec": "129078",
			"Unicode hex": "1F836"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "181",
			"Dingbat hex": "B5",
			"Unicode dec": "129080",
			"Unicode hex": "1F838"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "182",
			"Dingbat hex": "B6",
			"Unicode dec": "129082",
			"Unicode hex": "1F83A"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "183",
			"Dingbat hex": "B7",
			"Unicode dec": "129081",
			"Unicode hex": "1F839"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "184",
			"Dingbat hex": "B8",
			"Unicode dec": "129083",
			"Unicode hex": "1F83B"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "185",
			"Dingbat hex": "B9",
			"Unicode dec": "129176",
			"Unicode hex": "1F898"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "186",
			"Dingbat hex": "BA",
			"Unicode dec": "129178",
			"Unicode hex": "1F89A"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "187",
			"Dingbat hex": "BB",
			"Unicode dec": "129177",
			"Unicode hex": "1F899"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "188",
			"Dingbat hex": "BC",
			"Unicode dec": "129179",
			"Unicode hex": "1F89B"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "189",
			"Dingbat hex": "BD",
			"Unicode dec": "129084",
			"Unicode hex": "1F83C"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "190",
			"Dingbat hex": "BE",
			"Unicode dec": "129086",
			"Unicode hex": "1F83E"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "191",
			"Dingbat hex": "BF",
			"Unicode dec": "129085",
			"Unicode hex": "1F83D"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "192",
			"Dingbat hex": "C0",
			"Unicode dec": "129087",
			"Unicode hex": "1F83F"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "193",
			"Dingbat hex": "C1",
			"Unicode dec": "129088",
			"Unicode hex": "1F840"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "194",
			"Dingbat hex": "C2",
			"Unicode dec": "129090",
			"Unicode hex": "1F842"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "195",
			"Dingbat hex": "C3",
			"Unicode dec": "129089",
			"Unicode hex": "1F841"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "196",
			"Dingbat hex": "C4",
			"Unicode dec": "129091",
			"Unicode hex": "1F843"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "197",
			"Dingbat hex": "C5",
			"Unicode dec": "129092",
			"Unicode hex": "1F844"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "198",
			"Dingbat hex": "C6",
			"Unicode dec": "129094",
			"Unicode hex": "1F846"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "199",
			"Dingbat hex": "C7",
			"Unicode dec": "129093",
			"Unicode hex": "1F845"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "200",
			"Dingbat hex": "C8",
			"Unicode dec": "129095",
			"Unicode hex": "1F847"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "201",
			"Dingbat hex": "C9",
			"Unicode dec": "11176",
			"Unicode hex": "2BA8"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "202",
			"Dingbat hex": "CA",
			"Unicode dec": "11177",
			"Unicode hex": "2BA9"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "203",
			"Dingbat hex": "CB",
			"Unicode dec": "11178",
			"Unicode hex": "2BAA"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "204",
			"Dingbat hex": "CC",
			"Unicode dec": "11179",
			"Unicode hex": "2BAB"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "205",
			"Dingbat hex": "CD",
			"Unicode dec": "11180",
			"Unicode hex": "2BAC"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "206",
			"Dingbat hex": "CE",
			"Unicode dec": "11181",
			"Unicode hex": "2BAD"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "207",
			"Dingbat hex": "CF",
			"Unicode dec": "11182",
			"Unicode hex": "2BAE"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "208",
			"Dingbat hex": "D0",
			"Unicode dec": "11183",
			"Unicode hex": "2BAF"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "209",
			"Dingbat hex": "D1",
			"Unicode dec": "129120",
			"Unicode hex": "1F860"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "210",
			"Dingbat hex": "D2",
			"Unicode dec": "129122",
			"Unicode hex": "1F862"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "211",
			"Dingbat hex": "D3",
			"Unicode dec": "129121",
			"Unicode hex": "1F861"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "212",
			"Dingbat hex": "D4",
			"Unicode dec": "129123",
			"Unicode hex": "1F863"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "213",
			"Dingbat hex": "D5",
			"Unicode dec": "129124",
			"Unicode hex": "1F864"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "214",
			"Dingbat hex": "D6",
			"Unicode dec": "129125",
			"Unicode hex": "1F865"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "215",
			"Dingbat hex": "D7",
			"Unicode dec": "129127",
			"Unicode hex": "1F867"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "216",
			"Dingbat hex": "D8",
			"Unicode dec": "129126",
			"Unicode hex": "1F866"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "217",
			"Dingbat hex": "D9",
			"Unicode dec": "129136",
			"Unicode hex": "1F870"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "218",
			"Dingbat hex": "DA",
			"Unicode dec": "129138",
			"Unicode hex": "1F872"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "219",
			"Dingbat hex": "DB",
			"Unicode dec": "129137",
			"Unicode hex": "1F871"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "220",
			"Dingbat hex": "DC",
			"Unicode dec": "129139",
			"Unicode hex": "1F873"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "221",
			"Dingbat hex": "DD",
			"Unicode dec": "129140",
			"Unicode hex": "1F874"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "222",
			"Dingbat hex": "DE",
			"Unicode dec": "129141",
			"Unicode hex": "1F875"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "223",
			"Dingbat hex": "DF",
			"Unicode dec": "129143",
			"Unicode hex": "1F877"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "224",
			"Dingbat hex": "E0",
			"Unicode dec": "129142",
			"Unicode hex": "1F876"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "225",
			"Dingbat hex": "E1",
			"Unicode dec": "129152",
			"Unicode hex": "1F880"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "226",
			"Dingbat hex": "E2",
			"Unicode dec": "129154",
			"Unicode hex": "1F882"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "227",
			"Dingbat hex": "E3",
			"Unicode dec": "129153",
			"Unicode hex": "1F881"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "228",
			"Dingbat hex": "E4",
			"Unicode dec": "129155",
			"Unicode hex": "1F883"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "229",
			"Dingbat hex": "E5",
			"Unicode dec": "129156",
			"Unicode hex": "1F884"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "230",
			"Dingbat hex": "E6",
			"Unicode dec": "129157",
			"Unicode hex": "1F885"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "231",
			"Dingbat hex": "E7",
			"Unicode dec": "129159",
			"Unicode hex": "1F887"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "232",
			"Dingbat hex": "E8",
			"Unicode dec": "129158",
			"Unicode hex": "1F886"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "233",
			"Dingbat hex": "E9",
			"Unicode dec": "129168",
			"Unicode hex": "1F890"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "234",
			"Dingbat hex": "EA",
			"Unicode dec": "129170",
			"Unicode hex": "1F892"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "235",
			"Dingbat hex": "EB",
			"Unicode dec": "129169",
			"Unicode hex": "1F891"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "236",
			"Dingbat hex": "EC",
			"Unicode dec": "129171",
			"Unicode hex": "1F893"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "237",
			"Dingbat hex": "ED",
			"Unicode dec": "129172",
			"Unicode hex": "1F894"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "238",
			"Dingbat hex": "EE",
			"Unicode dec": "129174",
			"Unicode hex": "1F896"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "239",
			"Dingbat hex": "EF",
			"Unicode dec": "129173",
			"Unicode hex": "1F895"
		},
		{
			"Typeface name": "Wingdings 3",
			"Dingbat dec": "240",
			"Dingbat hex": "F0",
			"Unicode dec": "129175",
			"Unicode hex": "1F897"
		}
	];
}));
//#endregion
//#region node_modules/dingbat-to-unicode/dist/index.js
var require_dist = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __importDefault = exports && exports.__importDefault || function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.hex = exports.dec = exports.codePoint = void 0;
	var dingbats_1 = __importDefault(require_dingbats());
	var dingbatsByCodePoint = {};
	var fromCodePoint = String.fromCodePoint ? String.fromCodePoint : fromCodePointPolyfill;
	for (var _i = 0, dingbats_2 = dingbats_1.default; _i < dingbats_2.length; _i++) {
		var dingbat = dingbats_2[_i];
		var codePoint_1 = parseInt(dingbat["Unicode dec"], 10);
		var scalarValue = {
			codePoint: codePoint_1,
			string: fromCodePoint(codePoint_1)
		};
		dingbatsByCodePoint[dingbat["Typeface name"].toUpperCase() + "_" + dingbat["Dingbat dec"]] = scalarValue;
	}
	function codePoint(typeface, codePoint) {
		return dingbatsByCodePoint[typeface.toUpperCase() + "_" + codePoint];
	}
	exports.codePoint = codePoint;
	function dec(typeface, dec) {
		return codePoint(typeface, parseInt(dec, 10));
	}
	exports.dec = dec;
	function hex(typeface, hex) {
		return codePoint(typeface, parseInt(hex, 16));
	}
	exports.hex = hex;
	function fromCodePointPolyfill(codePoint) {
		if (codePoint <= 65535) return String.fromCharCode(codePoint);
		else {
			var highSurrogate = Math.floor((codePoint - 65536) / 1024) + 55296;
			var lowSurrogate = (codePoint - 65536) % 1024 + 56320;
			return String.fromCharCode(highSurrogate, lowSurrogate);
		}
	}
}));
//#endregion
//#region node_modules/mammoth/lib/transforms.js
var require_transforms = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	exports.paragraph = paragraph;
	exports.run = run;
	exports._elements = elements;
	exports._elementsOfType = elementsOfType;
	exports.getDescendantsOfType = getDescendantsOfType;
	exports.getDescendants = getDescendants;
	function paragraph(transform) {
		return elementsOfType("paragraph", transform);
	}
	function run(transform) {
		return elementsOfType("run", transform);
	}
	function elementsOfType(elementType, transform) {
		return elements(function(element) {
			if (element.type === elementType) return transform(element);
			else return element;
		});
	}
	function elements(transform) {
		return function transformElement(element) {
			if (element.children) {
				var children = _.map(element.children, transformElement);
				element = _.extend(element, { children });
			}
			return transform(element);
		};
	}
	function getDescendantsOfType(element, type) {
		return getDescendants(element).filter(function(descendant) {
			return descendant.type === type;
		});
	}
	function getDescendants(element) {
		var descendants = [];
		visitDescendants(element, function(descendant) {
			descendants.push(descendant);
		});
		return descendants;
	}
	function visitDescendants(element, visit) {
		if (element.children) element.children.forEach(function(child) {
			visitDescendants(child, visit);
			visit(child);
		});
	}
}));
//#endregion
//#region node_modules/mammoth/lib/docx/uris.js
var require_uris = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.uriToZipEntryName = uriToZipEntryName;
	exports.replaceFragment = replaceFragment;
	function uriToZipEntryName(base, uri) {
		if (uri.charAt(0) === "/") return uri.substr(1);
		else return base + "/" + uri;
	}
	function replaceFragment(uri, fragment) {
		var hashIndex = uri.indexOf("#");
		if (hashIndex !== -1) uri = uri.substring(0, hashIndex);
		return uri + "#" + fragment;
	}
}));
//#endregion
//#region node_modules/mammoth/lib/docx/body-reader.js
var require_body_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.createBodyReader = createBodyReader;
	exports._readNumberingProperties = readNumberingProperties;
	var dingbatToUnicode = require_dist();
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var documents = require_documents();
	var Result = require_results().Result;
	var warning = require_results().warning;
	var xml = require_xml();
	var transforms = require_transforms();
	var uris = require_uris();
	function createBodyReader(options) {
		return {
			readXmlElement: function(element) {
				return new BodyReader(options).readXmlElement(element);
			},
			readXmlElements: function(elements) {
				return new BodyReader(options).readXmlElements(elements);
			}
		};
	}
	function BodyReader(options) {
		var complexFieldStack = [];
		var currentInstrText = [];
		var deletedParagraphContents = [];
		var relationships = options.relationships;
		var contentTypes = options.contentTypes;
		var docxFile = options.docxFile;
		var files = options.files;
		var numbering = options.numbering;
		var styles = options.styles;
		function readXmlElements(elements) {
			return combineResults(elements.map(readXmlElement));
		}
		function readXmlElement(element) {
			if (element.type === "element") {
				var handler = xmlElementReaders[element.name];
				if (handler) return handler(element);
				else if (!Object.prototype.hasOwnProperty.call(ignoreElements, element.name)) return emptyResultWithMessages([warning("An unrecognised element was ignored: " + element.name)]);
			}
			return emptyResult();
		}
		function readParagraphProperties(element) {
			return readParagraphStyle(element).map(function(style) {
				return {
					type: "paragraphProperties",
					styleId: style.styleId,
					styleName: style.name,
					alignment: element.firstOrEmpty("w:jc").attributes["w:val"],
					numbering: readNumberingProperties(style.styleId, element.firstOrEmpty("w:numPr"), numbering),
					indent: readParagraphIndent(element.firstOrEmpty("w:ind"))
				};
			});
		}
		function readParagraphIndent(element) {
			return {
				start: element.attributes["w:start"] || element.attributes["w:left"],
				end: element.attributes["w:end"] || element.attributes["w:right"],
				firstLine: element.attributes["w:firstLine"],
				hanging: element.attributes["w:hanging"]
			};
		}
		function readRunProperties(element) {
			return readRunStyle(element).map(function(style) {
				var fontSizeString = element.firstOrEmpty("w:sz").attributes["w:val"];
				var fontSize = /^[0-9]+$/.test(fontSizeString) ? parseInt(fontSizeString, 10) / 2 : null;
				return {
					type: "runProperties",
					styleId: style.styleId,
					styleName: style.name,
					verticalAlignment: element.firstOrEmpty("w:vertAlign").attributes["w:val"],
					font: element.firstOrEmpty("w:rFonts").attributes["w:ascii"],
					fontSize,
					isBold: readBooleanElement(element.first("w:b")),
					isUnderline: readUnderline(element.first("w:u")),
					isItalic: readBooleanElement(element.first("w:i")),
					isStrikethrough: readBooleanElement(element.first("w:strike")),
					isAllCaps: readBooleanElement(element.first("w:caps")),
					isSmallCaps: readBooleanElement(element.first("w:smallCaps")),
					highlight: readHighlightValue(element.firstOrEmpty("w:highlight").attributes["w:val"])
				};
			});
		}
		function readUnderline(element) {
			if (element) {
				var value = element.attributes["w:val"];
				return value !== void 0 && value !== "false" && value !== "0" && value !== "none";
			} else return false;
		}
		function readBooleanElement(element) {
			if (element) {
				var value = element.attributes["w:val"];
				return value !== "false" && value !== "0";
			} else return false;
		}
		function readBooleanAttributeValue(value) {
			return value !== "false" && value !== "0";
		}
		function readHighlightValue(value) {
			if (!value || value === "none") return null;
			else return value;
		}
		function readParagraphStyle(element) {
			return readStyle(element, "w:pStyle", "Paragraph", styles.findParagraphStyleById);
		}
		function readRunStyle(element) {
			return readStyle(element, "w:rStyle", "Run", styles.findCharacterStyleById);
		}
		function readTableStyle(element) {
			return readStyle(element, "w:tblStyle", "Table", styles.findTableStyleById);
		}
		function readStyle(element, styleTagName, styleType, findStyleById) {
			var messages = [];
			var styleElement = element.first(styleTagName);
			var styleId = null;
			var name = null;
			if (styleElement) {
				styleId = styleElement.attributes["w:val"];
				if (styleId) {
					var style = findStyleById(styleId);
					if (style) name = style.name;
					else messages.push(undefinedStyleWarning(styleType, styleId));
				}
			}
			return elementResultWithMessages({
				styleId,
				name
			}, messages);
		}
		function readFldChar(element) {
			var type = element.attributes["w:fldCharType"];
			if (type === "begin") {
				complexFieldStack.push({
					type: "begin",
					fldChar: element
				});
				currentInstrText = [];
			} else if (type === "end") {
				var complexFieldEnd = complexFieldStack.pop();
				if (complexFieldEnd.type === "begin") complexFieldEnd = parseCurrentInstrText(complexFieldEnd);
				if (complexFieldEnd.type === "checkbox") return elementResult(documents.checkbox({ checked: complexFieldEnd.checked }));
			} else if (type === "separate") {
				var complexField = parseCurrentInstrText(complexFieldStack.pop());
				complexFieldStack.push(complexField);
			}
			return emptyResult();
		}
		function currentHyperlinkOptions() {
			var topHyperlink = _.last(complexFieldStack.filter(function(complexField) {
				return complexField.type === "hyperlink";
			}));
			return topHyperlink ? topHyperlink.options : null;
		}
		function parseCurrentInstrText(complexField) {
			return parseInstrText(currentInstrText.join(""), complexField.type === "begin" ? complexField.fldChar : xml.emptyElement);
		}
		function parseInstrText(instrText, fldChar) {
			var linkResult = /^\s*HYPERLINK\s+(\\l\s+)?(?:"(.*)"|([^\\]\S*))/.exec(instrText);
			if (linkResult) {
				var location = linkResult[2] === void 0 ? linkResult[3] : linkResult[2];
				return {
					type: "hyperlink",
					options: linkResult[1] === void 0 ? { href: location } : { anchor: location }
				};
			}
			if (/\s*FORMCHECKBOX\s*/.exec(instrText)) {
				var checkboxElement = fldChar.firstOrEmpty("w:ffData").firstOrEmpty("w:checkBox");
				var checkedElement = checkboxElement.first("w:checked");
				return {
					type: "checkbox",
					checked: checkedElement == null ? readBooleanElement(checkboxElement.first("w:default")) : readBooleanElement(checkedElement)
				};
			}
			return { type: "unknown" };
		}
		function readInstrText(element) {
			currentInstrText.push(element.text());
			return emptyResult();
		}
		function readSymbol(element) {
			var font = element.attributes["w:font"];
			var char = element.attributes["w:char"];
			var unicodeCharacter = dingbatToUnicode.hex(font, char);
			if (unicodeCharacter == null && /^F0..$/.test(char)) unicodeCharacter = dingbatToUnicode.hex(font, char.substring(2));
			if (unicodeCharacter == null) return emptyResultWithMessages([warning("A w:sym element with an unsupported character was ignored: char " + char + " in font " + font)]);
			else return elementResult(new documents.Text(unicodeCharacter.string));
		}
		function noteReferenceReader(noteType) {
			return function(element) {
				var noteId = element.attributes["w:id"];
				return elementResult(new documents.NoteReference({
					noteType,
					noteId
				}));
			};
		}
		function readCommentReference(element) {
			return elementResult(documents.commentReference({ commentId: element.attributes["w:id"] }));
		}
		function readChildElements(element) {
			return readXmlElements(element.children);
		}
		var xmlElementReaders = {
			"w:p": function(element) {
				var paragraphPropertiesElement = element.firstOrEmpty("w:pPr");
				if (!!paragraphPropertiesElement.firstOrEmpty("w:rPr").first("w:del")) {
					element.children.forEach(function(child) {
						deletedParagraphContents.push(child);
					});
					return emptyResult();
				} else {
					var childrenXml = element.children;
					if (deletedParagraphContents.length > 0) {
						childrenXml = deletedParagraphContents.concat(childrenXml);
						deletedParagraphContents = [];
					}
					return ReadResult.map(readParagraphProperties(paragraphPropertiesElement), readXmlElements(childrenXml), function(properties, children) {
						return new documents.Paragraph(children, properties);
					}).insertExtra();
				}
			},
			"w:r": function(element) {
				return ReadResult.map(readRunProperties(element.firstOrEmpty("w:rPr")), readXmlElements(element.children), function(properties, children) {
					var hyperlinkOptions = currentHyperlinkOptions();
					if (hyperlinkOptions !== null) children = [new documents.Hyperlink(children, hyperlinkOptions)];
					return new documents.Run(children, properties);
				});
			},
			"w:fldChar": readFldChar,
			"w:instrText": readInstrText,
			"w:t": function(element) {
				return elementResult(new documents.Text(element.text()));
			},
			"w:tab": function(element) {
				return elementResult(new documents.Tab());
			},
			"w:noBreakHyphen": function() {
				return elementResult(new documents.Text("‑"));
			},
			"w:softHyphen": function(element) {
				return elementResult(new documents.Text("­"));
			},
			"w:sym": readSymbol,
			"w:hyperlink": function(element) {
				var relationshipId = element.attributes["r:id"];
				var anchor = element.attributes["w:anchor"];
				return readXmlElements(element.children).map(function(children) {
					function create(options) {
						var targetFrame = element.attributes["w:tgtFrame"] || null;
						return new documents.Hyperlink(children, _.extend({ targetFrame }, options));
					}
					if (relationshipId) {
						var href = relationships.findTargetByRelationshipId(relationshipId);
						if (anchor) href = uris.replaceFragment(href, anchor);
						return create({ href });
					} else if (anchor) return create({ anchor });
					else return children;
				});
			},
			"w:tbl": readTable,
			"w:tr": readTableRow,
			"w:tc": readTableCell,
			"w:footnoteReference": noteReferenceReader("footnote"),
			"w:endnoteReference": noteReferenceReader("endnote"),
			"w:commentReference": readCommentReference,
			"w:br": function(element) {
				var breakType = element.attributes["w:type"];
				if (breakType == null || breakType === "textWrapping") return elementResult(documents.lineBreak);
				else if (breakType === "page") return elementResult(documents.pageBreak);
				else if (breakType === "column") return elementResult(documents.columnBreak);
				else return emptyResultWithMessages([warning("Unsupported break type: " + breakType)]);
			},
			"w:bookmarkStart": function(element) {
				var name = element.attributes["w:name"];
				if (name === "_GoBack") return emptyResult();
				else return elementResult(new documents.BookmarkStart({ name }));
			},
			"mc:AlternateContent": function(element) {
				return readChildElements(element.firstOrEmpty("mc:Fallback"));
			},
			"w:sdt": function(element) {
				return readXmlElements(element.firstOrEmpty("w:sdtContent").children).map(function(content) {
					var checkbox = element.firstOrEmpty("w:sdtPr").first("wordml:checkbox");
					if (checkbox) {
						var checkedElement = checkbox.first("wordml:checked");
						var isChecked = !!checkedElement && readBooleanAttributeValue(checkedElement.attributes["wordml:val"]);
						var documentCheckbox = documents.checkbox({ checked: isChecked });
						var hasCheckbox = false;
						var replacedContent = content.map(transforms._elementsOfType(documents.types.text, function(text) {
							if (text.value.length > 0 && !hasCheckbox) {
								hasCheckbox = true;
								return documentCheckbox;
							} else return text;
						}));
						if (hasCheckbox) return replacedContent;
						else return documentCheckbox;
					} else return content;
				});
			},
			"w:ins": readChildElements,
			"w:object": readChildElements,
			"w:smartTag": readChildElements,
			"w:drawing": readChildElements,
			"w:pict": function(element) {
				return readChildElements(element).toExtra();
			},
			"v:roundrect": readChildElements,
			"v:shape": readChildElements,
			"v:textbox": readChildElements,
			"w:txbxContent": readChildElements,
			"wp:inline": readDrawingElement,
			"wp:anchor": readDrawingElement,
			"v:imagedata": readImageData,
			"v:group": readChildElements,
			"v:rect": readChildElements
		};
		return {
			readXmlElement,
			readXmlElements
		};
		function readTable(element) {
			var propertiesResult = readTableProperties(element.firstOrEmpty("w:tblPr"));
			return readXmlElements(element.children).flatMap(calculateRowSpans).flatMap(function(children) {
				return propertiesResult.map(function(properties) {
					return documents.Table(children, properties);
				});
			});
		}
		function readTableProperties(element) {
			return readTableStyle(element).map(function(style) {
				return {
					styleId: style.styleId,
					styleName: style.name
				};
			});
		}
		function readTableRow(element) {
			var properties = element.firstOrEmpty("w:trPr");
			if (!!properties.first("w:del")) return emptyResult();
			var isHeader = !!properties.first("w:tblHeader");
			return readXmlElements(element.children).map(function(children) {
				return documents.TableRow(children, { isHeader });
			});
		}
		function readTableCell(element) {
			return readXmlElements(element.children).map(function(children) {
				var properties = element.firstOrEmpty("w:tcPr");
				var gridSpan = properties.firstOrEmpty("w:gridSpan").attributes["w:val"];
				var colSpan = gridSpan ? parseInt(gridSpan, 10) : 1;
				var cell = documents.TableCell(children, { colSpan });
				cell._vMerge = readVMerge(properties);
				return cell;
			});
		}
		function readVMerge(properties) {
			var element = properties.first("w:vMerge");
			if (element) {
				var val = element.attributes["w:val"];
				return val === "continue" || !val;
			} else return null;
		}
		function calculateRowSpans(rows) {
			if (_.any(rows, function(row) {
				return row.type !== documents.types.tableRow;
			})) {
				removeVMergeProperties(rows);
				return elementResultWithMessages(rows, [warning("unexpected non-row element in table, cell merging may be incorrect")]);
			}
			if (_.any(rows, function(row) {
				return _.any(row.children, function(cell) {
					return cell.type !== documents.types.tableCell;
				});
			})) {
				removeVMergeProperties(rows);
				return elementResultWithMessages(rows, [warning("unexpected non-cell element in table row, cell merging may be incorrect")]);
			}
			var columns = {};
			rows.forEach(function(row) {
				var cellIndex = 0;
				row.children.forEach(function(cell) {
					if (cell._vMerge && columns[cellIndex]) columns[cellIndex].rowSpan++;
					else {
						columns[cellIndex] = cell;
						cell._vMerge = false;
					}
					cellIndex += cell.colSpan;
				});
			});
			rows.forEach(function(row) {
				row.children = row.children.filter(function(cell) {
					return !cell._vMerge;
				});
				row.children.forEach(function(cell) {
					delete cell._vMerge;
				});
			});
			return elementResult(rows);
		}
		function removeVMergeProperties(rows) {
			rows.forEach(function(row) {
				transforms.getDescendantsOfType(row, documents.types.tableCell).forEach(function(cell) {
					delete cell._vMerge;
				});
			});
		}
		function readDrawingElement(element) {
			return combineResults(element.getElementsByTagName("a:graphic").getElementsByTagName("a:graphicData").getElementsByTagName("pic:pic").getElementsByTagName("pic:blipFill").getElementsByTagName("a:blip").map(readBlip.bind(null, element)));
		}
		function readBlip(element, blip) {
			var propertiesElement = element.firstOrEmpty("wp:docPr");
			var properties = propertiesElement.attributes;
			var altText = isBlank(properties.descr) ? properties.title : properties.descr;
			var blipImageFile = findBlipImageFile(blip);
			if (blipImageFile === null) return emptyResultWithMessages([warning("Could not find image file for a:blip element")]);
			return readImage(blipImageFile, altText).map(function(imageElement) {
				var relationshipId = propertiesElement.firstOrEmpty("a:hlinkClick").attributes["r:id"];
				if (relationshipId) {
					var href = relationships.findTargetByRelationshipId(relationshipId);
					return new documents.Hyperlink([imageElement], { href });
				} else return imageElement;
			});
		}
		function isBlank(value) {
			return value == null || /^\s*$/.test(value);
		}
		function findBlipImageFile(blip) {
			var embedRelationshipId = blip.attributes["r:embed"];
			var linkRelationshipId = blip.attributes["r:link"];
			if (embedRelationshipId) return findEmbeddedImageFile(embedRelationshipId);
			else if (linkRelationshipId) {
				var imagePath = relationships.findTargetByRelationshipId(linkRelationshipId);
				return {
					path: imagePath,
					read: files.read.bind(files, imagePath)
				};
			} else return null;
		}
		function readImageData(element) {
			var relationshipId = element.attributes["r:id"];
			if (relationshipId) return readImage(findEmbeddedImageFile(relationshipId), element.attributes["o:title"]);
			else return emptyResultWithMessages([warning("A v:imagedata element without a relationship ID was ignored")]);
		}
		function findEmbeddedImageFile(relationshipId) {
			var path = uris.uriToZipEntryName("word", relationships.findTargetByRelationshipId(relationshipId));
			return {
				path,
				read: docxFile.read.bind(docxFile, path)
			};
		}
		function readImage(imageFile, altText) {
			var contentType = contentTypes.findContentType(imageFile.path);
			return elementResultWithMessages(documents.Image({
				readImage: imageFile.read,
				altText,
				contentType
			}), supportedImageTypes[contentType] ? [] : warning("Image of type " + contentType + " is unlikely to display in web browsers"));
		}
		function undefinedStyleWarning(type, styleId) {
			return warning(type + " style with ID " + styleId + " was referenced but not defined in the document");
		}
	}
	function readNumberingProperties(styleId, element, numbering) {
		var level = element.firstOrEmpty("w:ilvl").attributes["w:val"];
		var numId = element.firstOrEmpty("w:numId").attributes["w:val"];
		if (level !== void 0 && numId !== void 0) return numbering.findLevel(numId, level);
		if (styleId != null) {
			var levelByStyleId = numbering.findLevelByParagraphStyleId(styleId);
			if (levelByStyleId != null) return levelByStyleId;
		}
		if (numId !== void 0) return numbering.findLevel(numId, "0");
		return null;
	}
	var supportedImageTypes = {
		"image/png": true,
		"image/gif": true,
		"image/jpeg": true,
		"image/svg+xml": true,
		"image/tiff": true
	};
	var ignoreElements = {
		"office-word:wrap": true,
		"v:shadow": true,
		"v:shapetype": true,
		"w:annotationRef": true,
		"w:bookmarkEnd": true,
		"w:sectPr": true,
		"w:proofErr": true,
		"w:lastRenderedPageBreak": true,
		"w:commentRangeStart": true,
		"w:commentRangeEnd": true,
		"w:del": true,
		"w:footnoteRef": true,
		"w:endnoteRef": true,
		"w:pPr": true,
		"w:rPr": true,
		"w:tblPr": true,
		"w:tblGrid": true,
		"w:trPr": true,
		"w:tcPr": true
	};
	function emptyResultWithMessages(messages) {
		return new ReadResult(null, null, messages);
	}
	function emptyResult() {
		return new ReadResult(null);
	}
	function elementResult(element) {
		return new ReadResult(element);
	}
	function elementResultWithMessages(element, messages) {
		return new ReadResult(element, null, messages);
	}
	function ReadResult(element, extra, messages) {
		this.value = element || [];
		this.extra = extra || [];
		this._result = new Result({
			element: this.value,
			extra
		}, messages);
		this.messages = this._result.messages;
	}
	ReadResult.prototype.toExtra = function() {
		return new ReadResult(null, joinElements(this.extra, this.value), this.messages);
	};
	ReadResult.prototype.insertExtra = function() {
		var extra = this.extra;
		if (extra && extra.length) return new ReadResult(joinElements(this.value, extra), null, this.messages);
		else return this;
	};
	ReadResult.prototype.map = function(func) {
		var result = this._result.map(function(value) {
			return func(value.element);
		});
		return new ReadResult(result.value, this.extra, result.messages);
	};
	ReadResult.prototype.flatMap = function(func) {
		var result = this._result.flatMap(function(value) {
			return func(value.element)._result;
		});
		return new ReadResult(result.value.element, joinElements(this.extra, result.value.extra), result.messages);
	};
	ReadResult.map = function(first, second, func) {
		return new ReadResult(func(first.value, second.value), joinElements(first.extra, second.extra), first.messages.concat(second.messages));
	};
	function combineResults(results) {
		var result = Result.combine(_.pluck(results, "_result"));
		return new ReadResult(_.flatten(_.pluck(result.value, "element")), _.filter(_.flatten(_.pluck(result.value, "extra")), identity), result.messages);
	}
	function joinElements(first, second) {
		return _.flatten([first, second]);
	}
	function identity(value) {
		return value;
	}
}));
//#endregion
//#region node_modules/mammoth/lib/docx/document-xml-reader.js
var require_document_xml_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.DocumentXmlReader = DocumentXmlReader;
	var documents = require_documents();
	var Result = require_results().Result;
	function DocumentXmlReader(options) {
		var bodyReader = options.bodyReader;
		function convertXmlToDocument(element) {
			var body = element.first("w:body");
			if (body == null) throw new Error("Could not find the body element: are you sure this is a docx file?");
			var result = bodyReader.readXmlElements(body.children).map(function(children) {
				return new documents.Document(children, {
					notes: options.notes,
					comments: options.comments
				});
			});
			return new Result(result.value, result.messages);
		}
		return { convertXmlToDocument };
	}
}));
//#endregion
//#region node_modules/mammoth/lib/docx/relationships-reader.js
var require_relationships_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.readRelationships = readRelationships;
	exports.defaultValue = new Relationships([]);
	exports.Relationships = Relationships;
	function readRelationships(element) {
		var relationships = [];
		element.children.forEach(function(child) {
			if (child.name === "relationships:Relationship") {
				var relationship = {
					relationshipId: child.attributes.Id,
					target: child.attributes.Target,
					type: child.attributes.Type
				};
				relationships.push(relationship);
			}
		});
		return new Relationships(relationships);
	}
	function Relationships(relationships) {
		var targetsByRelationshipId = {};
		relationships.forEach(function(relationship) {
			targetsByRelationshipId[relationship.relationshipId] = relationship.target;
		});
		var targetsByType = {};
		relationships.forEach(function(relationship) {
			if (!targetsByType[relationship.type]) targetsByType[relationship.type] = [];
			targetsByType[relationship.type].push(relationship.target);
		});
		return {
			findTargetByRelationshipId: function(relationshipId) {
				return targetsByRelationshipId[relationshipId];
			},
			findTargetsByType: function(type) {
				return targetsByType[type] || [];
			}
		};
	}
}));
//#endregion
//#region node_modules/mammoth/lib/docx/content-types-reader.js
var require_content_types_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.readContentTypesFromXml = readContentTypesFromXml;
	var fallbackContentTypes = {
		"png": "png",
		"gif": "gif",
		"jpeg": "jpeg",
		"jpg": "jpeg",
		"tif": "tiff",
		"tiff": "tiff",
		"bmp": "bmp"
	};
	exports.defaultContentTypes = contentTypes({}, {});
	function readContentTypesFromXml(element) {
		var extensionDefaults = {};
		var overrides = {};
		element.children.forEach(function(child) {
			if (child.name === "content-types:Default") extensionDefaults[child.attributes.Extension] = child.attributes.ContentType;
			if (child.name === "content-types:Override") {
				var name = child.attributes.PartName;
				if (name.charAt(0) === "/") name = name.substring(1);
				overrides[name] = child.attributes.ContentType;
			}
		});
		return contentTypes(overrides, extensionDefaults);
	}
	function contentTypes(overrides, extensionDefaults) {
		return { findContentType: function(path) {
			var overrideContentType = overrides[path];
			if (overrideContentType) return overrideContentType;
			else {
				var pathParts = path.split(".");
				var extension = pathParts[pathParts.length - 1];
				if (extensionDefaults.hasOwnProperty(extension)) return extensionDefaults[extension];
				else {
					var fallback = fallbackContentTypes[extension.toLowerCase()];
					if (fallback) return "image/" + fallback;
					else return null;
				}
			}
		} };
	}
}));
//#endregion
//#region node_modules/mammoth/lib/docx/numbering-xml.js
var require_numbering_xml = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	exports.readNumberingXml = readNumberingXml;
	exports.Numbering = Numbering;
	exports.defaultNumbering = new Numbering({}, {});
	function Numbering(nums, abstractNums, styles) {
		var allLevels = _.flatten(_.values(abstractNums).map(function(abstractNum) {
			return _.values(abstractNum.levels);
		}));
		var levelsByParagraphStyleId = _.indexBy(allLevels.filter(function(level) {
			return level.paragraphStyleId != null;
		}), "paragraphStyleId");
		function findLevel(numId, level) {
			return findLevelWithSeenNumIds(numId, level, {});
		}
		function findLevelWithSeenNumIds(numId, level, seenNumIds) {
			if (seenNumIds[numId]) return null;
			seenNumIds[numId] = true;
			var num = nums[numId];
			if (!num) return null;
			var abstractNum = abstractNums[num.abstractNumId];
			if (!abstractNum) return null;
			else if (abstractNum.numStyleLink == null) return abstractNums[num.abstractNumId].levels[level];
			else return findLevelWithSeenNumIds(styles.findNumberingStyleById(abstractNum.numStyleLink).numId, level, seenNumIds);
		}
		function findLevelByParagraphStyleId(styleId) {
			return levelsByParagraphStyleId[styleId] || null;
		}
		return {
			findLevel,
			findLevelByParagraphStyleId
		};
	}
	function readNumberingXml(root, options) {
		if (!options || !options.styles) throw new Error("styles is missing");
		var abstractNums = readAbstractNums(root);
		return new Numbering(readNums(root, abstractNums), abstractNums, options.styles);
	}
	function readAbstractNums(root) {
		var abstractNums = {};
		root.getElementsByTagName("w:abstractNum").forEach(function(element) {
			var id = element.attributes["w:abstractNumId"];
			abstractNums[id] = readAbstractNum(element);
		});
		return abstractNums;
	}
	function readAbstractNum(element) {
		var levels = {};
		var levelWithoutIndex = null;
		element.getElementsByTagName("w:lvl").forEach(function(levelElement) {
			var levelIndex = levelElement.attributes["w:ilvl"];
			var isOrdered = levelElement.firstOrEmpty("w:numFmt").attributes["w:val"] !== "bullet";
			var paragraphStyleId = levelElement.firstOrEmpty("w:pStyle").attributes["w:val"];
			if (levelIndex === void 0) levelWithoutIndex = {
				isOrdered,
				level: "0",
				paragraphStyleId
			};
			else levels[levelIndex] = {
				isOrdered,
				level: levelIndex,
				paragraphStyleId
			};
		});
		if (levelWithoutIndex !== null && levels[levelWithoutIndex.level] === void 0) levels[levelWithoutIndex.level] = levelWithoutIndex;
		return {
			levels,
			numStyleLink: element.firstOrEmpty("w:numStyleLink").attributes["w:val"]
		};
	}
	function readNums(root) {
		var nums = {};
		root.getElementsByTagName("w:num").forEach(function(element) {
			var numId = element.attributes["w:numId"];
			nums[numId] = { abstractNumId: element.first("w:abstractNumId").attributes["w:val"] };
		});
		return nums;
	}
}));
//#endregion
//#region node_modules/mammoth/lib/docx/styles-reader.js
var require_styles_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.readStylesXml = readStylesXml;
	exports.Styles = Styles;
	exports.defaultStyles = new Styles({}, {});
	function Styles(paragraphStyles, characterStyles, tableStyles, numberingStyles) {
		return {
			findParagraphStyleById: function(styleId) {
				return paragraphStyles[styleId];
			},
			findCharacterStyleById: function(styleId) {
				return characterStyles[styleId];
			},
			findTableStyleById: function(styleId) {
				return tableStyles[styleId];
			},
			findNumberingStyleById: function(styleId) {
				return numberingStyles[styleId];
			}
		};
	}
	Styles.EMPTY = new Styles({}, {}, {}, {});
	function readStylesXml(root) {
		var paragraphStyles = {};
		var characterStyles = {};
		var tableStyles = {};
		var numberingStyles = {};
		var styles = {
			"paragraph": paragraphStyles,
			"character": characterStyles,
			"table": tableStyles,
			"numbering": numberingStyles
		};
		root.getElementsByTagName("w:style").forEach(function(styleElement) {
			var style = readStyleElement(styleElement);
			var styleSet = styles[style.type];
			if (styleSet && styleSet[style.styleId] === void 0) styleSet[style.styleId] = style;
		});
		return new Styles(paragraphStyles, characterStyles, tableStyles, numberingStyles);
	}
	function readStyleElement(styleElement) {
		var type = styleElement.attributes["w:type"];
		if (type === "numbering") return readNumberingStyleElement(type, styleElement);
		else return {
			type,
			styleId: readStyleId(styleElement),
			name: styleName(styleElement)
		};
	}
	function styleName(styleElement) {
		var nameElement = styleElement.first("w:name");
		return nameElement ? nameElement.attributes["w:val"] : null;
	}
	function readNumberingStyleElement(type, styleElement) {
		var styleId = readStyleId(styleElement);
		return {
			type,
			numId: styleElement.firstOrEmpty("w:pPr").firstOrEmpty("w:numPr").firstOrEmpty("w:numId").attributes["w:val"],
			styleId
		};
	}
	function readStyleId(styleElement) {
		return styleElement.attributes["w:styleId"];
	}
}));
//#endregion
//#region node_modules/mammoth/lib/docx/notes-reader.js
var require_notes_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	var documents = require_documents();
	var Result = require_results().Result;
	exports.createFootnotesReader = createReader.bind(exports, "footnote");
	exports.createEndnotesReader = createReader.bind(exports, "endnote");
	function createReader(noteType, bodyReader) {
		function readNotesXml(element) {
			return Result.combine(element.getElementsByTagName("w:" + noteType).filter(isFootnoteElement).map(readFootnoteElement));
		}
		function isFootnoteElement(element) {
			var type = element.attributes["w:type"];
			return type !== "continuationSeparator" && type !== "separator";
		}
		function readFootnoteElement(footnoteElement) {
			var id = footnoteElement.attributes["w:id"];
			return bodyReader.readXmlElements(footnoteElement.children).map(function(body) {
				return documents.Note({
					noteType,
					noteId: id,
					body
				});
			});
		}
		return readNotesXml;
	}
}));
//#endregion
//#region node_modules/mammoth/lib/docx/comments-reader.js
var require_comments_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	var documents = require_documents();
	var Result = require_results().Result;
	function createCommentsReader(bodyReader) {
		function readCommentsXml(element) {
			return Result.combine(element.getElementsByTagName("w:comment").map(readCommentElement));
		}
		function readCommentElement(element) {
			var id = element.attributes["w:id"];
			function readOptionalAttribute(name) {
				return (element.attributes[name] || "").trim() || null;
			}
			return bodyReader.readXmlElements(element.children).map(function(body) {
				return documents.comment({
					commentId: id,
					body,
					authorName: readOptionalAttribute("w:author"),
					authorInitials: readOptionalAttribute("w:initials")
				});
			});
		}
		return readCommentsXml;
	}
	exports.createCommentsReader = createCommentsReader;
}));
//#endregion
//#region node_modules/mammoth/browser/docx/files.js
var require_files = /* @__PURE__ */ __commonJSMin(((exports) => {
	var promises = require_promises();
	exports.Files = Files;
	function Files() {
		function read(uri) {
			return promises.reject(/* @__PURE__ */ new Error("could not open external image: '" + uri + "'\ncannot open linked files from a web browser"));
		}
		return { read };
	}
}));
//#endregion
//#region node_modules/mammoth/lib/docx/docx-reader.js
var require_docx_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.read = read;
	exports._findPartPaths = findPartPaths;
	var promises = require_promises();
	var documents = require_documents();
	var Result = require_results().Result;
	var zipfile = require_zipfile();
	var readXmlFromZipFile = require_office_xml_reader().readXmlFromZipFile;
	var createBodyReader = require_body_reader().createBodyReader;
	var DocumentXmlReader = require_document_xml_reader().DocumentXmlReader;
	var relationshipsReader = require_relationships_reader();
	var contentTypesReader = require_content_types_reader();
	var numberingXml = require_numbering_xml();
	var stylesReader = require_styles_reader();
	var notesReader = require_notes_reader();
	var commentsReader = require_comments_reader();
	var Files = require_files().Files;
	function read(docxFile, input, options) {
		input = input || {};
		options = options || {};
		var files = new Files({
			externalFileAccess: options.externalFileAccess,
			relativeToFile: input.path
		});
		return promises.props({
			contentTypes: readContentTypesFromZipFile(docxFile),
			partPaths: findPartPaths(docxFile),
			docxFile,
			files
		}).also(function(result) {
			return { styles: readStylesFromZipFile(docxFile, result.partPaths.styles) };
		}).also(function(result) {
			return { numbering: readNumberingFromZipFile(docxFile, result.partPaths.numbering, result.styles) };
		}).also(function(result) {
			return {
				footnotes: readXmlFileWithBody(result.partPaths.footnotes, result, function(bodyReader, xml) {
					if (xml) return notesReader.createFootnotesReader(bodyReader)(xml);
					else return new Result([]);
				}),
				endnotes: readXmlFileWithBody(result.partPaths.endnotes, result, function(bodyReader, xml) {
					if (xml) return notesReader.createEndnotesReader(bodyReader)(xml);
					else return new Result([]);
				}),
				comments: readXmlFileWithBody(result.partPaths.comments, result, function(bodyReader, xml) {
					if (xml) return commentsReader.createCommentsReader(bodyReader)(xml);
					else return new Result([]);
				})
			};
		}).also(function(result) {
			return { notes: result.footnotes.flatMap(function(footnotes) {
				return result.endnotes.map(function(endnotes) {
					return new documents.Notes(footnotes.concat(endnotes));
				});
			}) };
		}).then(function(result) {
			return readXmlFileWithBody(result.partPaths.mainDocument, result, function(bodyReader, xml) {
				return result.notes.flatMap(function(notes) {
					return result.comments.flatMap(function(comments) {
						return new DocumentXmlReader({
							bodyReader,
							notes,
							comments
						}).convertXmlToDocument(xml);
					});
				});
			});
		});
	}
	function findPartPaths(docxFile) {
		return readPackageRelationships(docxFile).then(function(packageRelationships) {
			var mainDocumentPath = findPartPath({
				docxFile,
				relationships: packageRelationships,
				relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
				basePath: "",
				fallbackPath: "word/document.xml"
			});
			if (!docxFile.exists(mainDocumentPath)) throw new Error("Could not find main document part. Are you sure this is a valid .docx file?");
			return xmlFileReader({
				filename: relationshipsFilename(mainDocumentPath),
				readElement: relationshipsReader.readRelationships,
				defaultValue: relationshipsReader.defaultValue
			})(docxFile).then(function(documentRelationships) {
				function findPartRelatedToMainDocument(name) {
					return findPartPath({
						docxFile,
						relationships: documentRelationships,
						relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/" + name,
						basePath: zipfile.splitPath(mainDocumentPath).dirname,
						fallbackPath: "word/" + name + ".xml"
					});
				}
				return {
					mainDocument: mainDocumentPath,
					comments: findPartRelatedToMainDocument("comments"),
					endnotes: findPartRelatedToMainDocument("endnotes"),
					footnotes: findPartRelatedToMainDocument("footnotes"),
					numbering: findPartRelatedToMainDocument("numbering"),
					styles: findPartRelatedToMainDocument("styles")
				};
			});
		});
	}
	function findPartPath(options) {
		var docxFile = options.docxFile;
		var relationships = options.relationships;
		var relationshipType = options.relationshipType;
		var basePath = options.basePath;
		var fallbackPath = options.fallbackPath;
		var validTargets = relationships.findTargetsByType(relationshipType).map(function(target) {
			return stripPrefix(zipfile.joinPath(basePath, target), "/");
		}).filter(function(target) {
			return docxFile.exists(target);
		});
		if (validTargets.length === 0) return fallbackPath;
		else return validTargets[0];
	}
	function stripPrefix(value, prefix) {
		if (value.substring(0, prefix.length) === prefix) return value.substring(prefix.length);
		else return value;
	}
	function xmlFileReader(options) {
		return function(zipFile) {
			return readXmlFromZipFile(zipFile, options.filename).then(function(element) {
				return element ? options.readElement(element) : options.defaultValue;
			});
		};
	}
	function readXmlFileWithBody(filename, options, func) {
		return xmlFileReader({
			filename: relationshipsFilename(filename),
			readElement: relationshipsReader.readRelationships,
			defaultValue: relationshipsReader.defaultValue
		})(options.docxFile).then(function(relationships) {
			var bodyReader = new createBodyReader({
				relationships,
				contentTypes: options.contentTypes,
				docxFile: options.docxFile,
				numbering: options.numbering,
				styles: options.styles,
				files: options.files
			});
			return readXmlFromZipFile(options.docxFile, filename).then(function(xml) {
				return func(bodyReader, xml);
			});
		});
	}
	function relationshipsFilename(filename) {
		var split = zipfile.splitPath(filename);
		return zipfile.joinPath(split.dirname, "_rels", split.basename + ".rels");
	}
	var readContentTypesFromZipFile = xmlFileReader({
		filename: "[Content_Types].xml",
		readElement: contentTypesReader.readContentTypesFromXml,
		defaultValue: contentTypesReader.defaultContentTypes
	});
	function readNumberingFromZipFile(zipFile, path, styles) {
		return xmlFileReader({
			filename: path,
			readElement: function(element) {
				return numberingXml.readNumberingXml(element, { styles });
			},
			defaultValue: numberingXml.defaultNumbering
		})(zipFile);
	}
	function readStylesFromZipFile(zipFile, path) {
		return xmlFileReader({
			filename: path,
			readElement: stylesReader.readStylesXml,
			defaultValue: stylesReader.defaultStyles
		})(zipFile);
	}
	var readPackageRelationships = xmlFileReader({
		filename: "_rels/.rels",
		readElement: relationshipsReader.readRelationships,
		defaultValue: relationshipsReader.defaultValue
	});
}));
//#endregion
//#region node_modules/mammoth/lib/docx/style-map.js
var require_style_map = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var promises = require_promises();
	var xml = require_xml();
	exports.writeStyleMap = writeStyleMap;
	exports.readStyleMap = readStyleMap;
	var schema = "http://schemas.zwobble.org/mammoth/style-map";
	var styleMapPath = "mammoth/style-map";
	var styleMapAbsolutePath = "/" + styleMapPath;
	function writeStyleMap(docxFile, styleMap) {
		docxFile.write(styleMapPath, styleMap);
		return updateRelationships(docxFile).then(function() {
			return updateContentTypes(docxFile);
		});
	}
	function updateRelationships(docxFile) {
		var path = "word/_rels/document.xml.rels";
		var relationshipsUri = "http://schemas.openxmlformats.org/package/2006/relationships";
		var relationshipElementName = "{" + relationshipsUri + "}Relationship";
		return docxFile.read(path, "utf8").then(xml.readString).then(function(relationshipsContainer) {
			var relationships = relationshipsContainer.children;
			addOrUpdateElement(relationships, relationshipElementName, "Id", {
				"Id": "rMammothStyleMap",
				"Type": schema,
				"Target": styleMapAbsolutePath
			});
			var namespaces = { "": relationshipsUri };
			return docxFile.write(path, xml.writeString(relationshipsContainer, namespaces));
		});
	}
	function updateContentTypes(docxFile) {
		var path = "[Content_Types].xml";
		var contentTypesUri = "http://schemas.openxmlformats.org/package/2006/content-types";
		var overrideName = "{" + contentTypesUri + "}Override";
		return docxFile.read(path, "utf8").then(xml.readString).then(function(typesElement) {
			var children = typesElement.children;
			addOrUpdateElement(children, overrideName, "PartName", {
				"PartName": styleMapAbsolutePath,
				"ContentType": "text/prs.mammoth.style-map"
			});
			var namespaces = { "": contentTypesUri };
			return docxFile.write(path, xml.writeString(typesElement, namespaces));
		});
	}
	function addOrUpdateElement(elements, name, identifyingAttribute, attributes) {
		var existingElement = _.find(elements, function(element) {
			return element.name === name && element.attributes[identifyingAttribute] === attributes[identifyingAttribute];
		});
		if (existingElement) existingElement.attributes = attributes;
		else elements.push(xml.element(name, attributes));
	}
	function readStyleMap(docxFile) {
		if (docxFile.exists(styleMapPath)) return docxFile.read(styleMapPath, "utf8");
		else return promises.resolve(null);
	}
}));
//#endregion
//#region node_modules/mammoth/lib/html/ast.js
var require_ast = /* @__PURE__ */ __commonJSMin(((exports) => {
	var htmlPaths = require_html_paths();
	function nonFreshElement(tagName, attributes, children) {
		return elementWithTag(htmlPaths.element(tagName, attributes, { fresh: false }), children);
	}
	function freshElement(tagName, attributes, children) {
		return elementWithTag(htmlPaths.element(tagName, attributes, { fresh: true }), children);
	}
	function elementWithTag(tag, children) {
		return {
			type: "element",
			tag,
			children: children || []
		};
	}
	function text(value) {
		return {
			type: "text",
			value
		};
	}
	var forceWrite = { type: "forceWrite" };
	exports.freshElement = freshElement;
	exports.nonFreshElement = nonFreshElement;
	exports.elementWithTag = elementWithTag;
	exports.text = text;
	exports.forceWrite = forceWrite;
	var voidTagNames = {
		"br": true,
		"hr": true,
		"img": true,
		"input": true
	};
	function isVoidElement(node) {
		return node.children.length === 0 && voidTagNames[node.tag.tagName];
	}
	exports.isVoidElement = isVoidElement;
}));
//#endregion
//#region node_modules/mammoth/lib/html/simplify.js
var require_simplify = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var ast = require_ast();
	function simplify(nodes) {
		return collapse(removeEmpty(nodes));
	}
	function collapse(nodes) {
		var children = [];
		nodes.map(collapseNode).forEach(function(child) {
			appendChild(children, child);
		});
		return children;
	}
	function collapseNode(node) {
		return collapsers[node.type](node);
	}
	var collapsers = {
		element: collapseElement,
		text: identity,
		forceWrite: identity
	};
	function collapseElement(node) {
		return ast.elementWithTag(node.tag, collapse(node.children));
	}
	function identity(value) {
		return value;
	}
	function appendChild(children, child) {
		var lastChild = children[children.length - 1];
		if (child.type === "element" && !child.tag.fresh && lastChild && lastChild.type === "element" && child.tag.matchesElement(lastChild.tag)) {
			if (child.tag.separator) appendChild(lastChild.children, ast.text(child.tag.separator));
			child.children.forEach(function(grandChild) {
				appendChild(lastChild.children, grandChild);
			});
		} else children.push(child);
	}
	function removeEmpty(nodes) {
		return flatMap(nodes, function(node) {
			return emptiers[node.type](node);
		});
	}
	function flatMap(values, func) {
		return _.flatten(_.map(values, func), true);
	}
	var emptiers = {
		element: elementEmptier,
		text: textEmptier,
		forceWrite: neverEmpty
	};
	function neverEmpty(node) {
		return [node];
	}
	function elementEmptier(element) {
		var children = removeEmpty(element.children);
		if (children.length === 0 && !ast.isVoidElement(element)) return [];
		else return [ast.elementWithTag(element.tag, children)];
	}
	function textEmptier(node) {
		if (node.value.length === 0) return [];
		else return [node];
	}
	module.exports = simplify;
}));
//#endregion
//#region node_modules/mammoth/lib/html/index.js
var require_html = /* @__PURE__ */ __commonJSMin(((exports) => {
	var ast = require_ast();
	exports.freshElement = ast.freshElement;
	exports.nonFreshElement = ast.nonFreshElement;
	exports.elementWithTag = ast.elementWithTag;
	exports.text = ast.text;
	exports.forceWrite = ast.forceWrite;
	exports.simplify = require_simplify();
	function write(writer, nodes) {
		nodes.forEach(function(node) {
			writeNode(writer, node);
		});
	}
	function writeNode(writer, node) {
		toStrings[node.type](writer, node);
	}
	var toStrings = {
		element: generateElementString,
		text: generateTextString,
		forceWrite: function() {}
	};
	function generateElementString(writer, node) {
		if (ast.isVoidElement(node)) writer.selfClosing(node.tag.tagName, node.tag.attributes);
		else {
			writer.open(node.tag.tagName, node.tag.attributes);
			write(writer, node.children);
			writer.close(node.tag.tagName);
		}
	}
	function generateTextString(writer, node) {
		writer.text(node.value);
	}
	exports.write = write;
}));
//#endregion
//#region node_modules/mammoth/lib/styles/html-paths.js
var require_html_paths = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var html = require_html();
	exports.topLevelElement = topLevelElement;
	exports.elements = elements;
	exports.element = element;
	function topLevelElement(tagName, attributes) {
		return elements([element(tagName, attributes, { fresh: true })]);
	}
	function elements(elementStyles) {
		return new HtmlPath(elementStyles.map(function(elementStyle) {
			if (_.isString(elementStyle)) return element(elementStyle);
			else return elementStyle;
		}));
	}
	function HtmlPath(elements) {
		this._elements = elements;
	}
	HtmlPath.prototype.wrap = function wrap(children) {
		var result = children();
		for (var index = this._elements.length - 1; index >= 0; index--) result = this._elements[index].wrapNodes(result);
		return result;
	};
	function element(tagName, attributes, options) {
		options = options || {};
		return new Element(tagName, attributes, options);
	}
	function Element(tagName, attributes, options) {
		var tagNames = {};
		if (_.isArray(tagName)) {
			tagName.forEach(function(tagName) {
				tagNames[tagName] = true;
			});
			tagName = tagName[0];
		} else tagNames[tagName] = true;
		this.tagName = tagName;
		this.tagNames = tagNames;
		this.attributes = attributes || {};
		this.fresh = options.fresh;
		this.separator = options.separator;
	}
	Element.prototype.matchesElement = function(element) {
		return this.tagNames[element.tagName] && _.isEqual(this.attributes || {}, element.attributes || {});
	};
	Element.prototype.wrap = function wrap(generateNodes) {
		return this.wrapNodes(generateNodes());
	};
	Element.prototype.wrapNodes = function wrapNodes(nodes) {
		return [html.elementWithTag(this, nodes)];
	};
	exports.empty = elements([]);
	exports.ignore = { wrap: function() {
		return [];
	} };
}));
//#endregion
//#region node_modules/mammoth/lib/images.js
var require_images = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var promises = require_promises();
	var Html = require_html();
	exports.imgElement = imgElement;
	function imgElement(func) {
		return function(element, messages) {
			return promises.when(func(element)).then(function(result) {
				var attributes = {};
				if (element.altText) attributes.alt = element.altText;
				_.extend(attributes, result);
				return [Html.freshElement("img", attributes)];
			});
		};
	}
	exports.inline = exports.imgElement;
	exports.dataUri = imgElement(function(element) {
		return element.readAsBase64String().then(function(imageBuffer) {
			return { src: "data:" + element.contentType + ";base64," + imageBuffer };
		});
	});
	function imageFilenameExtension(image) {
		return image.contentType.split(/\/|\\/)[1];
	}
	exports.imageFilenameExtension = imageFilenameExtension;
}));
//#endregion
//#region node_modules/mammoth/lib/writers/html-writer.js
var require_html_writer = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	exports.writer = writer;
	function writer(options) {
		options = options || {};
		if (options.prettyPrint) return prettyWriter();
		else return simpleWriter();
	}
	var indentedElements = {
		div: true,
		p: true,
		ul: true,
		li: true
	};
	function prettyWriter() {
		var indentationLevel = 0;
		var indentation = "  ";
		var stack = [];
		var start = true;
		var inText = false;
		var writer = simpleWriter();
		function open(tagName, attributes) {
			if (indentedElements[tagName]) indent();
			stack.push(tagName);
			writer.open(tagName, attributes);
			if (indentedElements[tagName]) indentationLevel++;
			start = false;
		}
		function close(tagName) {
			if (indentedElements[tagName]) {
				indentationLevel--;
				indent();
			}
			stack.pop();
			writer.close(tagName);
		}
		function text(value) {
			startText();
			var text = isInPre() ? value : value.replace("\n", "\n  ");
			writer.text(text);
		}
		function selfClosing(tagName, attributes) {
			indent();
			writer.selfClosing(tagName, attributes);
		}
		function insideIndentedElement() {
			return stack.length === 0 || indentedElements[stack[stack.length - 1]];
		}
		function startText() {
			if (!inText) {
				indent();
				inText = true;
			}
		}
		function indent() {
			inText = false;
			if (!start && insideIndentedElement() && !isInPre()) {
				writer._append("\n");
				for (var i = 0; i < indentationLevel; i++) writer._append(indentation);
			}
		}
		function isInPre() {
			return _.some(stack, function(tagName) {
				return tagName === "pre";
			});
		}
		return {
			asString: writer.asString,
			open,
			close,
			text,
			selfClosing
		};
	}
	function simpleWriter() {
		var fragments = [];
		function open(tagName, attributes) {
			var attributeString = generateAttributeString(attributes);
			fragments.push("<" + tagName + attributeString + ">");
		}
		function close(tagName) {
			fragments.push("</" + tagName + ">");
		}
		function selfClosing(tagName, attributes) {
			var attributeString = generateAttributeString(attributes);
			fragments.push("<" + tagName + attributeString + " />");
		}
		function generateAttributeString(attributes) {
			return _.map(attributes, function(value, key) {
				return " " + key + "=\"" + escapeHtmlAttribute(value) + "\"";
			}).join("");
		}
		function text(value) {
			fragments.push(escapeHtmlText(value));
		}
		function append(html) {
			fragments.push(html);
		}
		function asString() {
			return fragments.join("");
		}
		return {
			asString,
			open,
			close,
			text,
			selfClosing,
			_append: append
		};
	}
	function escapeHtmlText(value) {
		return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}
	function escapeHtmlAttribute(value) {
		return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}
}));
//#endregion
//#region node_modules/mammoth/lib/writers/markdown-writer.js
var require_markdown_writer = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	function symmetricMarkdownElement(end) {
		return markdownElement(end, end);
	}
	function markdownElement(start, end) {
		return function() {
			return {
				start,
				end
			};
		};
	}
	function markdownLink(attributes) {
		var href = attributes.href || "";
		if (href) return {
			start: "[",
			end: "](" + href + ")",
			anchorPosition: "before"
		};
		else return {};
	}
	function markdownImage(attributes) {
		var src = attributes.src || "";
		var altText = attributes.alt || "";
		if (src || altText) return { start: "![" + altText + "](" + src + ")" };
		else return {};
	}
	function markdownList(options) {
		return function(attributes, list) {
			return {
				start: list ? "\n" : "",
				end: list ? "" : "\n",
				list: {
					isOrdered: options.isOrdered,
					indent: list ? list.indent + 1 : 0,
					count: 0
				}
			};
		};
	}
	function markdownListItem(attributes, list, listItem) {
		list = list || {
			indent: 0,
			isOrdered: false,
			count: 0
		};
		list.count++;
		listItem.hasClosed = false;
		var bullet = list.isOrdered ? list.count + "." : "-";
		return {
			start: repeatString("	", list.indent) + bullet + " ",
			end: function() {
				if (!listItem.hasClosed) {
					listItem.hasClosed = true;
					return "\n";
				}
			}
		};
	}
	var htmlToMarkdown = {
		"p": markdownElement("", "\n\n"),
		"br": markdownElement("", "  \n"),
		"ul": markdownList({ isOrdered: false }),
		"ol": markdownList({ isOrdered: true }),
		"li": markdownListItem,
		"strong": symmetricMarkdownElement("__"),
		"em": symmetricMarkdownElement("*"),
		"a": markdownLink,
		"img": markdownImage
	};
	(function() {
		for (var i = 1; i <= 6; i++) htmlToMarkdown["h" + i] = markdownElement(repeatString("#", i) + " ", "\n\n");
	})();
	function repeatString(value, count) {
		return new Array(count + 1).join(value);
	}
	function markdownWriter() {
		var fragments = [];
		var elementStack = [];
		var list = null;
		var listItem = {};
		function open(tagName, attributes) {
			attributes = attributes || {};
			var element = (htmlToMarkdown[tagName] || function() {
				return {};
			})(attributes, list, listItem);
			elementStack.push({
				end: element.end,
				list
			});
			if (element.list) list = element.list;
			var anchorBeforeStart = element.anchorPosition === "before";
			if (anchorBeforeStart) writeAnchor(attributes);
			fragments.push(element.start || "");
			if (!anchorBeforeStart) writeAnchor(attributes);
		}
		function writeAnchor(attributes) {
			if (attributes.id) fragments.push("<a id=\"" + attributes.id + "\"></a>");
		}
		function close(tagName) {
			var element = elementStack.pop();
			list = element.list;
			var end = _.isFunction(element.end) ? element.end() : element.end;
			fragments.push(end || "");
		}
		function selfClosing(tagName, attributes) {
			open(tagName, attributes);
			close(tagName);
		}
		function text(value) {
			fragments.push(escapeMarkdown(value));
		}
		function asString() {
			return fragments.join("");
		}
		return {
			asString,
			open,
			close,
			text,
			selfClosing
		};
	}
	exports.writer = markdownWriter;
	function escapeMarkdown(value) {
		return value.replace(/\\/g, "\\\\").replace(/([\`\*_\{\}\[\]\(\)\#\+\-\.\!])/g, "\\$1");
	}
}));
//#endregion
//#region node_modules/mammoth/lib/writers/index.js
var require_writers = /* @__PURE__ */ __commonJSMin(((exports) => {
	var htmlWriter = require_html_writer();
	var markdownWriter = require_markdown_writer();
	exports.writer = writer;
	function writer(options) {
		options = options || {};
		if (options.outputFormat === "markdown") return markdownWriter.writer();
		else return htmlWriter.writer(options);
	}
}));
//#endregion
//#region node_modules/mammoth/lib/document-to-html.js
var require_document_to_html = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var promises = require_promises();
	var documents = require_documents();
	var htmlPaths = require_html_paths();
	var results = require_results();
	var images = require_images();
	var Html = require_html();
	var writers = require_writers();
	exports.DocumentConverter = DocumentConverter;
	function DocumentConverter(options) {
		return { convertToHtml: function(element) {
			return new DocumentConversion(options, _.indexBy(element.type === documents.types.document ? element.comments : [], "commentId")).convertToHtml(element);
		} };
	}
	function DocumentConversion(options, comments) {
		var noteNumber = 1;
		var noteReferences = [];
		var referencedComments = [];
		options = _.extend({ ignoreEmptyParagraphs: true }, options);
		var idPrefix = options.idPrefix === void 0 ? "" : options.idPrefix;
		var ignoreEmptyParagraphs = options.ignoreEmptyParagraphs;
		var defaultParagraphStyle = htmlPaths.topLevelElement("p");
		var styleMap = options.styleMap || [];
		function convertToHtml(document) {
			var messages = [];
			var html = elementToHtml(document, messages, {});
			var deferredNodes = [];
			walkHtml(html, function(node) {
				if (node.type === "deferred") deferredNodes.push(node);
			});
			var deferredValues = {};
			return promises.mapSeries(deferredNodes, function(deferred) {
				return deferred.value().then(function(value) {
					deferredValues[deferred.id] = value;
				});
			}).then(function() {
				function replaceDeferred(nodes) {
					return flatMap(nodes, function(node) {
						if (node.type === "deferred") return deferredValues[node.id];
						else if (node.children) return [_.extend({}, node, { children: replaceDeferred(node.children) })];
						else return [node];
					});
				}
				var writer = writers.writer({
					prettyPrint: options.prettyPrint,
					outputFormat: options.outputFormat
				});
				Html.write(writer, Html.simplify(replaceDeferred(html)));
				return new results.Result(writer.asString(), messages);
			});
		}
		function convertElements(elements, messages, options) {
			return flatMap(elements, function(element) {
				return elementToHtml(element, messages, options);
			});
		}
		function elementToHtml(element, messages, options) {
			if (!options) throw new Error("options not set");
			var handler = elementConverters[element.type];
			if (handler) return handler(element, messages, options);
			else return [];
		}
		function convertParagraph(element, messages, options) {
			return htmlPathForParagraph(element, messages).wrap(function() {
				var content = convertElements(element.children, messages, options);
				if (ignoreEmptyParagraphs) return content;
				else return [Html.forceWrite].concat(content);
			});
		}
		function htmlPathForParagraph(element, messages) {
			var style = findStyle(element);
			if (style) return style.to;
			else {
				if (element.styleId) messages.push(unrecognisedStyleWarning("paragraph", element));
				return defaultParagraphStyle;
			}
		}
		function convertRun(run, messages, options) {
			var nodes = function() {
				return convertElements(run.children, messages, options);
			};
			var paths = [];
			if (run.highlight !== null) {
				var path = findHtmlPath({
					type: "highlight",
					color: run.highlight
				});
				if (path) paths.push(path);
			}
			if (run.isSmallCaps) paths.push(findHtmlPathForRunProperty("smallCaps"));
			if (run.isAllCaps) paths.push(findHtmlPathForRunProperty("allCaps"));
			if (run.isStrikethrough) paths.push(findHtmlPathForRunProperty("strikethrough", "s"));
			if (run.isUnderline) paths.push(findHtmlPathForRunProperty("underline"));
			if (run.verticalAlignment === documents.verticalAlignment.subscript) paths.push(htmlPaths.element("sub", {}, { fresh: false }));
			if (run.verticalAlignment === documents.verticalAlignment.superscript) paths.push(htmlPaths.element("sup", {}, { fresh: false }));
			if (run.isItalic) paths.push(findHtmlPathForRunProperty("italic", "em"));
			if (run.isBold) paths.push(findHtmlPathForRunProperty("bold", "strong"));
			var stylePath = htmlPaths.empty;
			var style = findStyle(run);
			if (style) stylePath = style.to;
			else if (run.styleId) messages.push(unrecognisedStyleWarning("run", run));
			paths.push(stylePath);
			paths.forEach(function(path) {
				nodes = path.wrap.bind(path, nodes);
			});
			return nodes();
		}
		function findHtmlPathForRunProperty(elementType, defaultTagName) {
			var path = findHtmlPath({ type: elementType });
			if (path) return path;
			else if (defaultTagName) return htmlPaths.element(defaultTagName, {}, { fresh: false });
			else return htmlPaths.empty;
		}
		function findHtmlPath(element, defaultPath) {
			var style = findStyle(element);
			return style ? style.to : defaultPath;
		}
		function findStyle(element) {
			for (var i = 0; i < styleMap.length; i++) if (styleMap[i].from.matches(element)) return styleMap[i];
		}
		function recoveringConvertImage(convertImage) {
			return function(image, messages) {
				return promises.attempt(function() {
					return convertImage(image, messages);
				}).caught(function(error) {
					messages.push(results.error(error));
					return [];
				});
			};
		}
		function noteHtmlId(note) {
			return referentHtmlId(note.noteType, note.noteId);
		}
		function noteRefHtmlId(note) {
			return referenceHtmlId(note.noteType, note.noteId);
		}
		function referentHtmlId(referenceType, referenceId) {
			return htmlId(referenceType + "-" + referenceId);
		}
		function referenceHtmlId(referenceType, referenceId) {
			return htmlId(referenceType + "-ref-" + referenceId);
		}
		function htmlId(suffix) {
			return idPrefix + suffix;
		}
		var defaultTablePath = htmlPaths.elements([htmlPaths.element("table", {}, { fresh: true })]);
		function convertTable(element, messages, options) {
			return findHtmlPath(element, defaultTablePath).wrap(function() {
				return convertTableChildren(element, messages, options);
			});
		}
		function convertTableChildren(element, messages, options) {
			var bodyIndex = _.findIndex(element.children, function(child) {
				return !child.type === documents.types.tableRow || !child.isHeader;
			});
			if (bodyIndex === -1) bodyIndex = element.children.length;
			var children;
			if (bodyIndex === 0) children = convertElements(element.children, messages, _.extend({}, options, { isTableHeader: false }));
			else {
				var headRows = convertElements(element.children.slice(0, bodyIndex), messages, _.extend({}, options, { isTableHeader: true }));
				var bodyRows = convertElements(element.children.slice(bodyIndex), messages, _.extend({}, options, { isTableHeader: false }));
				children = [Html.freshElement("thead", {}, headRows), Html.freshElement("tbody", {}, bodyRows)];
			}
			return [Html.forceWrite].concat(children);
		}
		function convertTableRow(element, messages, options) {
			var children = convertElements(element.children, messages, options);
			return [Html.freshElement("tr", {}, [Html.forceWrite].concat(children))];
		}
		function convertTableCell(element, messages, options) {
			var tagName = options.isTableHeader ? "th" : "td";
			var children = convertElements(element.children, messages, options);
			var attributes = {};
			if (element.colSpan !== 1) attributes.colspan = element.colSpan.toString();
			if (element.rowSpan !== 1) attributes.rowspan = element.rowSpan.toString();
			return [Html.freshElement(tagName, attributes, [Html.forceWrite].concat(children))];
		}
		function convertCommentReference(reference, messages, options) {
			return findHtmlPath(reference, htmlPaths.ignore).wrap(function() {
				var comment = comments[reference.commentId];
				var count = referencedComments.length + 1;
				var label = "[" + commentAuthorLabel(comment) + count + "]";
				referencedComments.push({
					label,
					comment
				});
				return [Html.freshElement("a", {
					href: "#" + referentHtmlId("comment", reference.commentId),
					id: referenceHtmlId("comment", reference.commentId)
				}, [Html.text(label)])];
			});
		}
		function convertComment(referencedComment, messages, options) {
			var label = referencedComment.label;
			var comment = referencedComment.comment;
			var body = convertElements(comment.body, messages, options).concat([Html.nonFreshElement("p", {}, [Html.text(" "), Html.freshElement("a", { "href": "#" + referenceHtmlId("comment", comment.commentId) }, [Html.text("↑")])])]);
			return [Html.freshElement("dt", { "id": referentHtmlId("comment", comment.commentId) }, [Html.text("Comment " + label)]), Html.freshElement("dd", {}, body)];
		}
		function convertBreak(element, messages, options) {
			return htmlPathForBreak(element).wrap(function() {
				return [];
			});
		}
		function htmlPathForBreak(element) {
			var style = findStyle(element);
			if (style) return style.to;
			else if (element.breakType === "line") return htmlPaths.topLevelElement("br");
			else return htmlPaths.empty;
		}
		var elementConverters = {
			"document": function(document, messages, options) {
				var children = convertElements(document.children, messages, options);
				var notesNodes = convertElements(noteReferences.map(function(noteReference) {
					return document.notes.resolve(noteReference);
				}), messages, options);
				return children.concat([Html.freshElement("ol", {}, notesNodes), Html.freshElement("dl", {}, flatMap(referencedComments, function(referencedComment) {
					return convertComment(referencedComment, messages, options);
				}))]);
			},
			"paragraph": convertParagraph,
			"run": convertRun,
			"text": function(element, messages, options) {
				return [Html.text(element.value)];
			},
			"tab": function(element, messages, options) {
				return [Html.text("	")];
			},
			"hyperlink": function(element, messages, options) {
				var attributes = { href: element.anchor ? "#" + htmlId(element.anchor) : element.href };
				if (element.targetFrame != null) attributes.target = element.targetFrame;
				var children = convertElements(element.children, messages, options);
				return [Html.nonFreshElement("a", attributes, children)];
			},
			"checkbox": function(element) {
				var attributes = { type: "checkbox" };
				if (element.checked) attributes["checked"] = "checked";
				return [Html.freshElement("input", attributes)];
			},
			"bookmarkStart": function(element, messages, options) {
				return [Html.freshElement("a", { id: htmlId(element.name) }, [Html.forceWrite])];
			},
			"noteReference": function(element, messages, options) {
				noteReferences.push(element);
				var anchor = Html.freshElement("a", {
					href: "#" + noteHtmlId(element),
					id: noteRefHtmlId(element)
				}, [Html.text("[" + noteNumber++ + "]")]);
				return [Html.freshElement("sup", {}, [anchor])];
			},
			"note": function(element, messages, options) {
				var children = convertElements(element.body, messages, options);
				var backLink = Html.elementWithTag(htmlPaths.element("p", {}, { fresh: false }), [Html.text(" "), Html.freshElement("a", { href: "#" + noteRefHtmlId(element) }, [Html.text("↑")])]);
				var body = children.concat([backLink]);
				return Html.freshElement("li", { id: noteHtmlId(element) }, body);
			},
			"commentReference": convertCommentReference,
			"comment": convertComment,
			"image": deferredConversion(recoveringConvertImage(options.convertImage || images.dataUri)),
			"table": convertTable,
			"tableRow": convertTableRow,
			"tableCell": convertTableCell,
			"break": convertBreak
		};
		return { convertToHtml };
	}
	var deferredId = 1;
	function deferredConversion(func) {
		return function(element, messages, options) {
			return [{
				type: "deferred",
				id: deferredId++,
				value: function() {
					return func(element, messages, options);
				}
			}];
		};
	}
	function unrecognisedStyleWarning(type, element) {
		return results.warning("Unrecognised " + type + " style: '" + element.styleName + "' (Style ID: " + element.styleId + ")");
	}
	function flatMap(values, func) {
		return _.flatten(values.map(func), true);
	}
	function walkHtml(nodes, callback) {
		nodes.forEach(function(node) {
			callback(node);
			if (node.children) walkHtml(node.children, callback);
		});
	}
	var commentAuthorLabel = exports.commentAuthorLabel = function commentAuthorLabel(comment) {
		return comment.authorInitials || "";
	};
}));
//#endregion
//#region node_modules/mammoth/lib/raw-text.js
var require_raw_text = /* @__PURE__ */ __commonJSMin(((exports) => {
	var documents = require_documents();
	function convertElementToRawText(element) {
		if (element.type === "text") return element.value;
		else if (element.type === documents.types.tab) return "	";
		else {
			var tail = element.type === "paragraph" ? "\n\n" : "";
			return (element.children || []).map(convertElementToRawText).join("") + tail;
		}
	}
	exports.convertElementToRawText = convertElementToRawText;
}));
//#endregion
//#region node_modules/lop/lib/TokenIterator.js
var require_TokenIterator = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var TokenIterator = module.exports = function(tokens, startIndex) {
		this._tokens = tokens;
		this._startIndex = startIndex || 0;
	};
	TokenIterator.prototype.head = function() {
		return this._tokens[this._startIndex];
	};
	TokenIterator.prototype.tail = function(startIndex) {
		return new TokenIterator(this._tokens, this._startIndex + 1);
	};
	TokenIterator.prototype.toArray = function() {
		return this._tokens.slice(this._startIndex);
	};
	TokenIterator.prototype.end = function() {
		return this._tokens[this._tokens.length - 1];
	};
	TokenIterator.prototype.to = function(end) {
		var start = this.head().source;
		var endToken = end.head() || end.end();
		return start.to(endToken.source);
	};
}));
//#endregion
//#region node_modules/lop/lib/parser.js
var require_parser = /* @__PURE__ */ __commonJSMin(((exports) => {
	var TokenIterator = require_TokenIterator();
	exports.Parser = function(options) {
		var parseTokens = function(parser, tokens) {
			return parser(new TokenIterator(tokens));
		};
		return { parseTokens };
	};
}));
//#endregion
//#region node_modules/option/index.js
var require_option = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.none = Object.create({
		value: function() {
			throw new Error("Called value on none");
		},
		isNone: function() {
			return true;
		},
		isSome: function() {
			return false;
		},
		map: function() {
			return exports.none;
		},
		flatMap: function() {
			return exports.none;
		},
		filter: function() {
			return exports.none;
		},
		toArray: function() {
			return [];
		},
		orElse: callOrReturn,
		valueOrElse: callOrReturn
	});
	function callOrReturn(value) {
		if (typeof value == "function") return value();
		else return value;
	}
	exports.some = function(value) {
		return new Some(value);
	};
	var Some = function(value) {
		this._value = value;
	};
	Some.prototype.value = function() {
		return this._value;
	};
	Some.prototype.isNone = function() {
		return false;
	};
	Some.prototype.isSome = function() {
		return true;
	};
	Some.prototype.map = function(func) {
		return new Some(func(this._value));
	};
	Some.prototype.flatMap = function(func) {
		return func(this._value);
	};
	Some.prototype.filter = function(predicate) {
		return predicate(this._value) ? this : exports.none;
	};
	Some.prototype.toArray = function() {
		return [this._value];
	};
	Some.prototype.orElse = function(value) {
		return this;
	};
	Some.prototype.valueOrElse = function(value) {
		return this._value;
	};
	exports.isOption = function(value) {
		return value === exports.none || value instanceof Some;
	};
	exports.fromNullable = function(value) {
		if (value == null) return exports.none;
		return new Some(value);
	};
}));
//#endregion
//#region node_modules/lop/lib/parsing-results.js
var require_parsing_results = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		failure: function(errors, remaining) {
			if (errors.length < 1) throw new Error("Failure must have errors");
			return new Result({
				status: "failure",
				remaining,
				errors
			});
		},
		error: function(errors, remaining) {
			if (errors.length < 1) throw new Error("Failure must have errors");
			return new Result({
				status: "error",
				remaining,
				errors
			});
		},
		success: function(value, remaining, source) {
			return new Result({
				status: "success",
				value,
				source,
				remaining,
				errors: []
			});
		},
		cut: function(remaining) {
			return new Result({
				status: "cut",
				remaining,
				errors: []
			});
		}
	};
	var Result = function(options) {
		this._value = options.value;
		this._status = options.status;
		this._hasValue = options.value !== void 0;
		this._remaining = options.remaining;
		this._source = options.source;
		this._errors = options.errors;
	};
	Result.prototype.map = function(func) {
		if (this._hasValue) return new Result({
			value: func(this._value, this._source),
			status: this._status,
			remaining: this._remaining,
			source: this._source,
			errors: this._errors
		});
		else return this;
	};
	Result.prototype.changeRemaining = function(remaining) {
		return new Result({
			value: this._value,
			status: this._status,
			remaining,
			source: this._source,
			errors: this._errors
		});
	};
	Result.prototype.isSuccess = function() {
		return this._status === "success" || this._status === "cut";
	};
	Result.prototype.isFailure = function() {
		return this._status === "failure";
	};
	Result.prototype.isError = function() {
		return this._status === "error";
	};
	Result.prototype.isCut = function() {
		return this._status === "cut";
	};
	Result.prototype.value = function() {
		return this._value;
	};
	Result.prototype.remaining = function() {
		return this._remaining;
	};
	Result.prototype.source = function() {
		return this._source;
	};
	Result.prototype.errors = function() {
		return this._errors;
	};
}));
//#endregion
//#region node_modules/lop/lib/errors.js
var require_errors = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.error = function(options) {
		return new Error(options);
	};
	var Error = function(options) {
		this.expected = options.expected;
		this.actual = options.actual;
		this._location = options.location;
	};
	Error.prototype.describe = function() {
		return (this._location ? this._location.describe() + ":\n" : "") + "Expected " + this.expected + "\nbut got " + this.actual;
	};
	Error.prototype.lineNumber = function() {
		return this._location.lineNumber();
	};
	Error.prototype.characterNumber = function() {
		return this._location.characterNumber();
	};
}));
//#endregion
//#region node_modules/lop/lib/lazy-iterators.js
var require_lazy_iterators = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.fromArray = function(array) {
		var index = 0;
		var hasNext = function() {
			return index < array.length;
		};
		return new LazyIterator({
			hasNext,
			next: function() {
				if (!hasNext()) throw new Error("No more elements");
				else return array[index++];
			}
		});
	};
	var LazyIterator = function(iterator) {
		this._iterator = iterator;
	};
	LazyIterator.prototype.map = function(func) {
		var iterator = this._iterator;
		return new LazyIterator({
			hasNext: function() {
				return iterator.hasNext();
			},
			next: function() {
				return func(iterator.next());
			}
		});
	};
	LazyIterator.prototype.filter = function(condition) {
		var iterator = this._iterator;
		var moved = false;
		var hasNext = false;
		var next;
		var moveIfNecessary = function() {
			if (moved) return;
			moved = true;
			hasNext = false;
			while (iterator.hasNext() && !hasNext) {
				next = iterator.next();
				hasNext = condition(next);
			}
		};
		return new LazyIterator({
			hasNext: function() {
				moveIfNecessary();
				return hasNext;
			},
			next: function() {
				moveIfNecessary();
				var toReturn = next;
				moved = false;
				return toReturn;
			}
		});
	};
	LazyIterator.prototype.first = function() {
		var iterator = this._iterator;
		if (this._iterator.hasNext()) return iterator.next();
		else return null;
	};
	LazyIterator.prototype.toArray = function() {
		var result = [];
		while (this._iterator.hasNext()) result.push(this._iterator.next());
		return result;
	};
}));
//#endregion
//#region node_modules/lop/lib/rules.js
var require_rules = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var options = require_option();
	var results = require_parsing_results();
	var errors = require_errors();
	var lazyIterators = require_lazy_iterators();
	exports.token = function(tokenType, value) {
		var matchValue = value !== void 0;
		return function(input) {
			var token = input.head();
			if (token && token.name === tokenType && (!matchValue || token.value === value)) return results.success(token.value, input.tail(), token.source);
			else return describeTokenMismatch(input, describeToken({
				name: tokenType,
				value
			}));
		};
	};
	exports.tokenOfType = function(tokenType) {
		return exports.token(tokenType);
	};
	exports.firstOf = function(name, parsers) {
		if (!_.isArray(parsers)) parsers = Array.prototype.slice.call(arguments, 1);
		return function(input) {
			return lazyIterators.fromArray(parsers).map(function(parser) {
				return parser(input);
			}).filter(function(result) {
				return result.isSuccess() || result.isError();
			}).first() || describeTokenMismatch(input, name);
		};
	};
	exports.then = function(parser, func) {
		return function(input) {
			var result = parser(input);
			if (!result.map) console.log(result);
			return result.map(func);
		};
	};
	exports.sequence = function() {
		var parsers = Array.prototype.slice.call(arguments, 0);
		var rule = function(input) {
			var result = _.foldl(parsers, function(memo, parser) {
				var result = memo.result;
				var hasCut = memo.hasCut;
				if (!result.isSuccess()) return {
					result,
					hasCut
				};
				var subResult = parser(result.remaining());
				if (subResult.isCut()) return {
					result,
					hasCut: true
				};
				else if (subResult.isSuccess()) {
					var values;
					if (parser.isCaptured) values = result.value().withValue(parser, subResult.value());
					else values = result.value();
					var remaining = subResult.remaining();
					var source = input.to(remaining);
					return {
						result: results.success(values, remaining, source),
						hasCut
					};
				} else if (hasCut) return {
					result: results.error(subResult.errors(), subResult.remaining()),
					hasCut
				};
				else return {
					result: subResult,
					hasCut
				};
			}, {
				result: results.success(new SequenceValues(), input),
				hasCut: false
			}).result;
			var source = input.to(result.remaining());
			return result.map(function(values) {
				return values.withValue(exports.sequence.source, source);
			});
		};
		rule.head = function() {
			var firstCapture = _.find(parsers, isCapturedRule);
			return exports.then(rule, exports.sequence.extract(firstCapture));
		};
		rule.map = function(func) {
			return exports.then(rule, function(result) {
				return func.apply(this, result.toArray());
			});
		};
		function isCapturedRule(subRule) {
			return subRule.isCaptured;
		}
		return rule;
	};
	var SequenceValues = function(values, valuesArray) {
		this._values = values || {};
		this._valuesArray = valuesArray || [];
	};
	SequenceValues.prototype.withValue = function(rule, value) {
		if (rule.captureName && rule.captureName in this._values) throw new Error("Cannot add second value for capture \"" + rule.captureName + "\"");
		else {
			var newValues = _.clone(this._values);
			newValues[rule.captureName] = value;
			return new SequenceValues(newValues, this._valuesArray.concat([value]));
		}
	};
	SequenceValues.prototype.get = function(rule) {
		if (rule.captureName in this._values) return this._values[rule.captureName];
		else throw new Error("No value for capture \"" + rule.captureName + "\"");
	};
	SequenceValues.prototype.toArray = function() {
		return this._valuesArray;
	};
	exports.sequence.capture = function(rule, name) {
		var captureRule = function() {
			return rule.apply(this, arguments);
		};
		captureRule.captureName = name;
		captureRule.isCaptured = true;
		return captureRule;
	};
	exports.sequence.extract = function(rule) {
		return function(result) {
			return result.get(rule);
		};
	};
	exports.sequence.applyValues = function(func) {
		var rules = Array.prototype.slice.call(arguments, 1);
		return function(result) {
			var values = rules.map(function(rule) {
				return result.get(rule);
			});
			return func.apply(this, values);
		};
	};
	exports.sequence.source = { captureName: "☃source☃" };
	exports.sequence.cut = function() {
		return function(input) {
			return results.cut(input);
		};
	};
	exports.optional = function(rule) {
		return function(input) {
			var result = rule(input);
			if (result.isSuccess()) return result.map(options.some);
			else if (result.isFailure()) return results.success(options.none, input);
			else return result;
		};
	};
	exports.zeroOrMoreWithSeparator = function(rule, separator) {
		return repeatedWithSeparator(rule, separator, false);
	};
	exports.oneOrMoreWithSeparator = function(rule, separator) {
		return repeatedWithSeparator(rule, separator, true);
	};
	var zeroOrMore = exports.zeroOrMore = function(rule) {
		return function(input) {
			var values = [];
			var result;
			while ((result = rule(input)) && result.isSuccess()) {
				input = result.remaining();
				values.push(result.value());
			}
			if (result.isError()) return result;
			else return results.success(values, input);
		};
	};
	exports.oneOrMore = function(rule) {
		return exports.oneOrMoreWithSeparator(rule, noOpRule);
	};
	function noOpRule(input) {
		return results.success(null, input);
	}
	var repeatedWithSeparator = function(rule, separator, isOneOrMore) {
		return function(input) {
			var result = rule(input);
			if (result.isSuccess()) {
				var mainRule = exports.sequence.capture(rule, "main");
				var remainingResult = zeroOrMore(exports.then(exports.sequence(separator, mainRule), exports.sequence.extract(mainRule)))(result.remaining());
				return results.success([result.value()].concat(remainingResult.value()), remainingResult.remaining());
			} else if (isOneOrMore || result.isError()) return result;
			else return results.success([], input);
		};
	};
	exports.leftAssociative = function(leftRule, rightRule, func) {
		var rights;
		if (func) rights = [{
			func,
			rule: rightRule
		}];
		else rights = rightRule;
		rights = rights.map(function(right) {
			return exports.then(right.rule, function(rightValue) {
				return function(leftValue, source) {
					return right.func(leftValue, rightValue, source);
				};
			});
		});
		var repeatedRule = exports.firstOf.apply(null, ["rules"].concat(rights));
		return function(input) {
			var start = input;
			var leftResult = leftRule(input);
			if (!leftResult.isSuccess()) return leftResult;
			var repeatedResult = repeatedRule(leftResult.remaining());
			while (repeatedResult.isSuccess()) {
				var remaining = repeatedResult.remaining();
				var source = start.to(repeatedResult.remaining());
				var right = repeatedResult.value();
				leftResult = results.success(right(leftResult.value(), source), remaining, source);
				repeatedResult = repeatedRule(leftResult.remaining());
			}
			if (repeatedResult.isError()) return repeatedResult;
			return leftResult;
		};
	};
	exports.leftAssociative.firstOf = function() {
		return Array.prototype.slice.call(arguments, 0);
	};
	exports.nonConsuming = function(rule) {
		return function(input) {
			return rule(input).changeRemaining(input);
		};
	};
	var describeToken = function(token) {
		if (token.value) return token.name + " \"" + token.value + "\"";
		else return token.name;
	};
	function describeTokenMismatch(input, expected) {
		var error;
		var token = input.head();
		if (token) error = errors.error({
			expected,
			actual: describeToken(token),
			location: token.source
		});
		else error = errors.error({
			expected,
			actual: "end of tokens"
		});
		return results.failure([error], input);
	}
}));
//#endregion
//#region node_modules/lop/lib/StringSource.js
var require_StringSource = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(string, description) {
		return {
			asString: function() {
				return string;
			},
			range: function(startIndex, endIndex) {
				return new StringSourceRange(string, description, startIndex, endIndex);
			}
		};
	};
	var StringSourceRange = function(string, description, startIndex, endIndex) {
		this._string = string;
		this._description = description;
		this._startIndex = startIndex;
		this._endIndex = endIndex;
	};
	StringSourceRange.prototype.to = function(otherRange) {
		return new StringSourceRange(this._string, this._description, this._startIndex, otherRange._endIndex);
	};
	StringSourceRange.prototype.describe = function() {
		var position = this._position();
		return (this._description ? this._description + "\n" : "") + "Line number: " + position.lineNumber + "\nCharacter number: " + position.characterNumber;
	};
	StringSourceRange.prototype.lineNumber = function() {
		return this._position().lineNumber;
	};
	StringSourceRange.prototype.characterNumber = function() {
		return this._position().characterNumber;
	};
	StringSourceRange.prototype._position = function() {
		var self = this;
		var index = 0;
		var nextNewLine = function() {
			return self._string.indexOf("\n", index);
		};
		var lineNumber = 1;
		while (nextNewLine() !== -1 && nextNewLine() < this._startIndex) {
			index = nextNewLine() + 1;
			lineNumber += 1;
		}
		var characterNumber = this._startIndex - index + 1;
		return {
			lineNumber,
			characterNumber
		};
	};
}));
//#endregion
//#region node_modules/lop/lib/Token.js
var require_Token = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(name, value, source) {
		this.name = name;
		this.value = value;
		if (source) this.source = source;
	};
}));
//#endregion
//#region node_modules/lop/lib/bottom-up.js
var require_bottom_up = /* @__PURE__ */ __commonJSMin(((exports) => {
	var rules = require_rules();
	var results = require_parsing_results();
	exports.parser = function(name, prefixRules, infixRuleBuilders) {
		var self = {
			rule,
			leftAssociative,
			rightAssociative
		};
		var infixRules = new InfixRules(infixRuleBuilders.map(createInfixRule));
		var prefixRule = rules.firstOf(name, prefixRules);
		function createInfixRule(infixRuleBuilder) {
			return {
				name: infixRuleBuilder.name,
				rule: lazyRule(infixRuleBuilder.ruleBuilder.bind(null, self))
			};
		}
		function rule() {
			return createRule(infixRules);
		}
		function leftAssociative(name) {
			return createRule(infixRules.untilExclusive(name));
		}
		function rightAssociative(name) {
			return createRule(infixRules.untilInclusive(name));
		}
		function createRule(infixRules) {
			return apply.bind(null, infixRules);
		}
		function apply(infixRules, tokens) {
			var leftResult = prefixRule(tokens);
			if (leftResult.isSuccess()) return infixRules.apply(leftResult);
			else return leftResult;
		}
		return self;
	};
	function InfixRules(infixRules) {
		function untilExclusive(name) {
			return new InfixRules(infixRules.slice(0, ruleNames().indexOf(name)));
		}
		function untilInclusive(name) {
			return new InfixRules(infixRules.slice(0, ruleNames().indexOf(name) + 1));
		}
		function ruleNames() {
			return infixRules.map(function(rule) {
				return rule.name;
			});
		}
		function apply(leftResult) {
			var currentResult;
			var source;
			while (true) {
				currentResult = applyToTokens(leftResult.remaining());
				if (currentResult.isSuccess()) {
					source = leftResult.source().to(currentResult.source());
					leftResult = results.success(currentResult.value()(leftResult.value(), source), currentResult.remaining(), source);
				} else if (currentResult.isFailure()) return leftResult;
				else return currentResult;
			}
		}
		function applyToTokens(tokens) {
			return rules.firstOf("infix", infixRules.map(function(infix) {
				return infix.rule;
			}))(tokens);
		}
		return {
			apply,
			untilExclusive,
			untilInclusive
		};
	}
	exports.infix = function(name, ruleBuilder) {
		function map(func) {
			return exports.infix(name, function(parser) {
				var rule = ruleBuilder(parser);
				return function(tokens) {
					return rule(tokens).map(function(right) {
						return function(left, source) {
							return func(left, right, source);
						};
					});
				};
			});
		}
		return {
			name,
			ruleBuilder,
			map
		};
	};
	var lazyRule = function(ruleBuilder) {
		var rule;
		return function(input) {
			if (!rule) rule = ruleBuilder();
			return rule(input);
		};
	};
}));
//#endregion
//#region node_modules/lop/lib/regex-tokeniser.js
var require_regex_tokeniser = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Token = require_Token();
	var StringSource = require_StringSource();
	exports.RegexTokeniser = RegexTokeniser;
	function RegexTokeniser(rules) {
		rules = rules.map(function(rule) {
			return {
				name: rule.name,
				regex: new RegExp(rule.regex.source, "g")
			};
		});
		function tokenise(input, description) {
			var source = new StringSource(input, description);
			var index = 0;
			var tokens = [];
			while (index < input.length) {
				var result = readNextToken(input, index, source);
				index = result.endIndex;
				tokens.push(result.token);
			}
			tokens.push(endToken(input, source));
			return tokens;
		}
		function readNextToken(string, startIndex, source) {
			for (var i = 0; i < rules.length; i++) {
				var regex = rules[i].regex;
				regex.lastIndex = startIndex;
				var result = regex.exec(string);
				if (result) {
					var endIndex = startIndex + result[0].length;
					if (result.index === startIndex && endIndex > startIndex) {
						var value = result[1];
						var token = new Token(rules[i].name, value, source.range(startIndex, endIndex));
						return {
							token,
							endIndex
						};
					}
				}
			}
			var endIndex = startIndex + 1;
			var token = new Token("unrecognisedCharacter", string.substring(startIndex, endIndex), source.range(startIndex, endIndex));
			return {
				token,
				endIndex
			};
		}
		function endToken(input, source) {
			return new Token("end", null, source.range(input.length, input.length));
		}
		return { tokenise };
	}
}));
//#endregion
//#region node_modules/lop/index.js
var require_lop = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.Parser = require_parser().Parser;
	exports.rules = require_rules();
	exports.errors = require_errors();
	exports.results = require_parsing_results();
	exports.StringSource = require_StringSource();
	exports.Token = require_Token();
	exports.bottomUp = require_bottom_up();
	exports.RegexTokeniser = require_regex_tokeniser().RegexTokeniser;
	exports.rule = function(ruleBuilder) {
		var rule;
		return function(input) {
			if (!rule) rule = ruleBuilder();
			return rule(input);
		};
	};
}));
//#endregion
//#region node_modules/mammoth/lib/styles/document-matchers.js
var require_document_matchers = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.paragraph = paragraph;
	exports.run = run;
	exports.table = table;
	exports.bold = new Matcher("bold");
	exports.italic = new Matcher("italic");
	exports.underline = new Matcher("underline");
	exports.strikethrough = new Matcher("strikethrough");
	exports.allCaps = new Matcher("allCaps");
	exports.smallCaps = new Matcher("smallCaps");
	exports.highlight = highlight;
	exports.commentReference = new Matcher("commentReference");
	exports.lineBreak = new BreakMatcher({ breakType: "line" });
	exports.pageBreak = new BreakMatcher({ breakType: "page" });
	exports.columnBreak = new BreakMatcher({ breakType: "column" });
	exports.equalTo = equalTo;
	exports.startsWith = startsWith;
	function paragraph(options) {
		return new Matcher("paragraph", options);
	}
	function run(options) {
		return new Matcher("run", options);
	}
	function table(options) {
		return new Matcher("table", options);
	}
	function highlight(options) {
		return new HighlightMatcher(options);
	}
	function Matcher(elementType, options) {
		options = options || {};
		this._elementType = elementType;
		this._styleId = options.styleId;
		this._styleName = options.styleName;
		if (options.list) {
			this._listIndex = options.list.levelIndex;
			this._listIsOrdered = options.list.isOrdered;
		}
	}
	Matcher.prototype.matches = function(element) {
		return element.type === this._elementType && (this._styleId === void 0 || element.styleId === this._styleId) && (this._styleName === void 0 || element.styleName && this._styleName.operator(this._styleName.operand, element.styleName)) && (this._listIndex === void 0 || isList(element, this._listIndex, this._listIsOrdered)) && (this._breakType === void 0 || this._breakType === element.breakType);
	};
	function HighlightMatcher(options) {
		options = options || {};
		this._color = options.color;
	}
	HighlightMatcher.prototype.matches = function(element) {
		return element.type === "highlight" && (this._color === void 0 || element.color === this._color);
	};
	function BreakMatcher(options) {
		options = options || {};
		this._breakType = options.breakType;
	}
	BreakMatcher.prototype.matches = function(element) {
		return element.type === "break" && (this._breakType === void 0 || element.breakType === this._breakType);
	};
	function isList(element, levelIndex, isOrdered) {
		return element.numbering && element.numbering.level == levelIndex && element.numbering.isOrdered == isOrdered;
	}
	function equalTo(value) {
		return {
			operator: operatorEqualTo,
			operand: value
		};
	}
	function startsWith(value) {
		return {
			operator: operatorStartsWith,
			operand: value
		};
	}
	function operatorEqualTo(first, second) {
		return first.toUpperCase() === second.toUpperCase();
	}
	function operatorStartsWith(first, second) {
		return second.toUpperCase().indexOf(first.toUpperCase()) === 0;
	}
}));
//#endregion
//#region node_modules/mammoth/lib/styles/parser/tokeniser.js
var require_tokeniser = /* @__PURE__ */ __commonJSMin(((exports) => {
	var RegexTokeniser = require_lop().RegexTokeniser;
	exports.tokenise = tokenise;
	var stringPrefix = "'((?:\\\\.|[^'])*)";
	function tokenise(string) {
		var identifierCharacter = "(?:[a-zA-Z\\-_]|\\\\.)";
		return new RegexTokeniser([
			{
				name: "identifier",
				regex: new RegExp("(" + identifierCharacter + "(?:" + identifierCharacter + "|[0-9])*)")
			},
			{
				name: "dot",
				regex: /\./
			},
			{
				name: "colon",
				regex: /:/
			},
			{
				name: "gt",
				regex: />/
			},
			{
				name: "whitespace",
				regex: /\s+/
			},
			{
				name: "arrow",
				regex: /=>/
			},
			{
				name: "equals",
				regex: /=/
			},
			{
				name: "startsWith",
				regex: /\^=/
			},
			{
				name: "open-paren",
				regex: /\(/
			},
			{
				name: "close-paren",
				regex: /\)/
			},
			{
				name: "open-square-bracket",
				regex: /\[/
			},
			{
				name: "close-square-bracket",
				regex: /\]/
			},
			{
				name: "string",
				regex: new RegExp(stringPrefix + "'")
			},
			{
				name: "unterminated-string",
				regex: new RegExp(stringPrefix)
			},
			{
				name: "integer",
				regex: /([0-9]+)/
			},
			{
				name: "choice",
				regex: /\|/
			},
			{
				name: "bang",
				regex: /(!)/
			}
		]).tokenise(string);
	}
}));
//#endregion
//#region node_modules/mammoth/lib/style-reader.js
var require_style_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var lop = require_lop();
	var documentMatchers = require_document_matchers();
	var htmlPaths = require_html_paths();
	var tokenise = require_tokeniser().tokenise;
	var results = require_results();
	exports.readHtmlPath = readHtmlPath;
	exports.readDocumentMatcher = readDocumentMatcher;
	exports.readStyle = readStyle;
	function readStyle(string) {
		return parseString(styleRule, string);
	}
	function createStyleRule() {
		return lop.rules.sequence(lop.rules.sequence.capture(documentMatcherRule()), lop.rules.tokenOfType("whitespace"), lop.rules.tokenOfType("arrow"), lop.rules.sequence.capture(lop.rules.optional(lop.rules.sequence(lop.rules.tokenOfType("whitespace"), lop.rules.sequence.capture(htmlPathRule())).head())), lop.rules.tokenOfType("end")).map(function(documentMatcher, htmlPath) {
			return {
				from: documentMatcher,
				to: htmlPath.valueOrElse(htmlPaths.empty)
			};
		});
	}
	function readDocumentMatcher(string) {
		return parseString(documentMatcherRule(), string);
	}
	function documentMatcherRule() {
		var sequence = lop.rules.sequence;
		var identifierToConstant = function(identifier, constant) {
			return lop.rules.then(lop.rules.token("identifier", identifier), function() {
				return constant;
			});
		};
		var paragraphRule = identifierToConstant("p", documentMatchers.paragraph);
		var runRule = identifierToConstant("r", documentMatchers.run);
		var elementTypeRule = lop.rules.firstOf("p or r or table", paragraphRule, runRule);
		var styleIdRule = lop.rules.sequence(lop.rules.tokenOfType("dot"), lop.rules.sequence.cut(), lop.rules.sequence.capture(identifierRule)).map(function(styleId) {
			return { styleId };
		});
		var styleNameMatcherRule = lop.rules.firstOf("style name matcher", lop.rules.then(lop.rules.sequence(lop.rules.tokenOfType("equals"), lop.rules.sequence.cut(), lop.rules.sequence.capture(stringRule)).head(), function(styleName) {
			return { styleName: documentMatchers.equalTo(styleName) };
		}), lop.rules.then(lop.rules.sequence(lop.rules.tokenOfType("startsWith"), lop.rules.sequence.cut(), lop.rules.sequence.capture(stringRule)).head(), function(styleName) {
			return { styleName: documentMatchers.startsWith(styleName) };
		}));
		var styleNameRule = lop.rules.sequence(lop.rules.tokenOfType("open-square-bracket"), lop.rules.sequence.cut(), lop.rules.token("identifier", "style-name"), lop.rules.sequence.capture(styleNameMatcherRule), lop.rules.tokenOfType("close-square-bracket")).head();
		var listTypeRule = lop.rules.firstOf("list type", identifierToConstant("ordered-list", { isOrdered: true }), identifierToConstant("unordered-list", { isOrdered: false }));
		var listRule = sequence(lop.rules.tokenOfType("colon"), sequence.capture(listTypeRule), sequence.cut(), lop.rules.tokenOfType("open-paren"), sequence.capture(integerRule), lop.rules.tokenOfType("close-paren")).map(function(listType, levelNumber) {
			return { list: {
				isOrdered: listType.isOrdered,
				levelIndex: levelNumber - 1
			} };
		});
		function createMatcherSuffixesRule(rules) {
			var matcherSuffix = lop.rules.firstOf.apply(lop.rules.firstOf, ["matcher suffix"].concat(rules));
			var matcherSuffixes = lop.rules.zeroOrMore(matcherSuffix);
			return lop.rules.then(matcherSuffixes, function(suffixes) {
				var matcherOptions = {};
				suffixes.forEach(function(suffix) {
					_.extend(matcherOptions, suffix);
				});
				return matcherOptions;
			});
		}
		var paragraphOrRun = sequence(sequence.capture(elementTypeRule), sequence.capture(createMatcherSuffixesRule([
			styleIdRule,
			styleNameRule,
			listRule
		]))).map(function(createMatcher, matcherOptions) {
			return createMatcher(matcherOptions);
		});
		var table = sequence(lop.rules.token("identifier", "table"), sequence.capture(createMatcherSuffixesRule([styleIdRule, styleNameRule]))).map(function(options) {
			return documentMatchers.table(options);
		});
		var bold = identifierToConstant("b", documentMatchers.bold);
		var italic = identifierToConstant("i", documentMatchers.italic);
		var underline = identifierToConstant("u", documentMatchers.underline);
		var strikethrough = identifierToConstant("strike", documentMatchers.strikethrough);
		var allCaps = identifierToConstant("all-caps", documentMatchers.allCaps);
		var smallCaps = identifierToConstant("small-caps", documentMatchers.smallCaps);
		var highlight = sequence(lop.rules.token("identifier", "highlight"), lop.rules.sequence.capture(lop.rules.optional(lop.rules.sequence(lop.rules.tokenOfType("open-square-bracket"), lop.rules.sequence.cut(), lop.rules.token("identifier", "color"), lop.rules.tokenOfType("equals"), lop.rules.sequence.capture(stringRule), lop.rules.tokenOfType("close-square-bracket")).head()))).map(function(color) {
			return documentMatchers.highlight({ color: color.valueOrElse(void 0) });
		});
		var commentReference = identifierToConstant("comment-reference", documentMatchers.commentReference);
		var breakMatcher = sequence(lop.rules.token("identifier", "br"), sequence.cut(), lop.rules.tokenOfType("open-square-bracket"), lop.rules.token("identifier", "type"), lop.rules.tokenOfType("equals"), sequence.capture(stringRule), lop.rules.tokenOfType("close-square-bracket")).map(function(breakType) {
			switch (breakType) {
				case "line": return documentMatchers.lineBreak;
				case "page": return documentMatchers.pageBreak;
				case "column": return documentMatchers.columnBreak;
				default:
			}
		});
		return lop.rules.firstOf("element type", paragraphOrRun, table, bold, italic, underline, strikethrough, allCaps, smallCaps, highlight, commentReference, breakMatcher);
	}
	function readHtmlPath(string) {
		return parseString(htmlPathRule(), string);
	}
	function htmlPathRule() {
		var capture = lop.rules.sequence.capture;
		var whitespaceRule = lop.rules.tokenOfType("whitespace");
		var freshRule = lop.rules.then(lop.rules.optional(lop.rules.sequence(lop.rules.tokenOfType("colon"), lop.rules.token("identifier", "fresh"))), function(option) {
			return option.map(function() {
				return true;
			}).valueOrElse(false);
		});
		var separatorRule = lop.rules.then(lop.rules.optional(lop.rules.sequence(lop.rules.tokenOfType("colon"), lop.rules.token("identifier", "separator"), lop.rules.tokenOfType("open-paren"), capture(stringRule), lop.rules.tokenOfType("close-paren")).head()), function(option) {
			return option.valueOrElse("");
		});
		var tagNamesRule = lop.rules.oneOrMoreWithSeparator(identifierRule, lop.rules.tokenOfType("choice"));
		var styleElementRule = lop.rules.sequence(capture(tagNamesRule), capture(lop.rules.zeroOrMore(attributeOrClassRule)), capture(freshRule), capture(separatorRule)).map(function(tagName, attributesList, fresh, separator) {
			var attributes = {};
			var options = {};
			attributesList.forEach(function(attribute) {
				if (attribute.append && attributes[attribute.name]) attributes[attribute.name] += " " + attribute.value;
				else attributes[attribute.name] = attribute.value;
			});
			if (fresh) options.fresh = true;
			if (separator) options.separator = separator;
			return htmlPaths.element(tagName, attributes, options);
		});
		return lop.rules.firstOf("html path", lop.rules.then(lop.rules.tokenOfType("bang"), function() {
			return htmlPaths.ignore;
		}), lop.rules.then(lop.rules.zeroOrMoreWithSeparator(styleElementRule, lop.rules.sequence(whitespaceRule, lop.rules.tokenOfType("gt"), whitespaceRule)), htmlPaths.elements));
	}
	var identifierRule = lop.rules.then(lop.rules.tokenOfType("identifier"), decodeEscapeSequences);
	var integerRule = lop.rules.tokenOfType("integer");
	var stringRule = lop.rules.then(lop.rules.tokenOfType("string"), decodeEscapeSequences);
	var escapeSequences = {
		"n": "\n",
		"r": "\r",
		"t": "	"
	};
	function decodeEscapeSequences(value) {
		return value.replace(/\\(.)/g, function(match, code) {
			return escapeSequences[code] || code;
		});
	}
	var attributeRule = lop.rules.sequence(lop.rules.tokenOfType("open-square-bracket"), lop.rules.sequence.cut(), lop.rules.sequence.capture(identifierRule), lop.rules.tokenOfType("equals"), lop.rules.sequence.capture(stringRule), lop.rules.tokenOfType("close-square-bracket")).map(function(name, value) {
		return {
			name,
			value,
			append: false
		};
	});
	var classRule = lop.rules.sequence(lop.rules.tokenOfType("dot"), lop.rules.sequence.cut(), lop.rules.sequence.capture(identifierRule)).map(function(className) {
		return {
			name: "class",
			value: className,
			append: true
		};
	});
	var attributeOrClassRule = lop.rules.firstOf("attribute or class", attributeRule, classRule);
	function parseString(rule, string) {
		var tokens = tokenise(string);
		var parseResult = lop.Parser().parseTokens(rule, tokens);
		if (parseResult.isSuccess()) return results.success(parseResult.value());
		else return new results.Result(null, [results.warning(describeFailure(string, parseResult))]);
	}
	function describeFailure(input, parseResult) {
		return "Did not understand this style mapping, so ignored it: " + input + "\n" + parseResult.errors().map(describeError).join("\n");
	}
	function describeError(error) {
		return "Error was at character number " + error.characterNumber() + ": Expected " + error.expected + " but got " + error.actual;
	}
	var styleRule = createStyleRule();
}));
//#endregion
//#region node_modules/mammoth/lib/options-reader.js
var require_options_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.readOptions = readOptions;
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var defaultStyleMap = exports._defaultStyleMap = [
		"p.Heading1 => h1:fresh",
		"p.Heading2 => h2:fresh",
		"p.Heading3 => h3:fresh",
		"p.Heading4 => h4:fresh",
		"p.Heading5 => h5:fresh",
		"p.Heading6 => h6:fresh",
		"p[style-name='Heading 1'] => h1:fresh",
		"p[style-name='Heading 2'] => h2:fresh",
		"p[style-name='Heading 3'] => h3:fresh",
		"p[style-name='Heading 4'] => h4:fresh",
		"p[style-name='Heading 5'] => h5:fresh",
		"p[style-name='Heading 6'] => h6:fresh",
		"p[style-name='heading 1'] => h1:fresh",
		"p[style-name='heading 2'] => h2:fresh",
		"p[style-name='heading 3'] => h3:fresh",
		"p[style-name='heading 4'] => h4:fresh",
		"p[style-name='heading 5'] => h5:fresh",
		"p[style-name='heading 6'] => h6:fresh",
		"p.Heading => h1:fresh",
		"p[style-name='Heading'] => h1:fresh",
		"r[style-name='Strong'] => strong",
		"p[style-name='footnote text'] => p:fresh",
		"r[style-name='footnote reference'] =>",
		"p[style-name='endnote text'] => p:fresh",
		"r[style-name='endnote reference'] =>",
		"p[style-name='annotation text'] => p:fresh",
		"r[style-name='annotation reference'] =>",
		"p[style-name='Footnote'] => p:fresh",
		"r[style-name='Footnote anchor'] =>",
		"p[style-name='Endnote'] => p:fresh",
		"r[style-name='Endnote anchor'] =>",
		"p:unordered-list(1) => ul > li:fresh",
		"p:unordered-list(2) => ul|ol > li > ul > li:fresh",
		"p:unordered-list(3) => ul|ol > li > ul|ol > li > ul > li:fresh",
		"p:unordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh",
		"p:unordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh",
		"p:ordered-list(1) => ol > li:fresh",
		"p:ordered-list(2) => ul|ol > li > ol > li:fresh",
		"p:ordered-list(3) => ul|ol > li > ul|ol > li > ol > li:fresh",
		"p:ordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh",
		"p:ordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh",
		"r[style-name='Hyperlink'] =>",
		"p[style-name='Normal'] => p:fresh",
		"p.Body => p:fresh",
		"p[style-name='Body'] => p:fresh"
	];
	var standardOptions = exports._standardOptions = {
		externalFileAccess: false,
		transformDocument: identity,
		includeDefaultStyleMap: true,
		includeEmbeddedStyleMap: true
	};
	function readOptions(options) {
		options = options || {};
		return _.extend({}, standardOptions, options, {
			customStyleMap: readStyleMap(options.styleMap),
			readStyleMap: function() {
				var styleMap = this.customStyleMap;
				if (this.includeEmbeddedStyleMap) styleMap = styleMap.concat(readStyleMap(this.embeddedStyleMap));
				if (this.includeDefaultStyleMap) styleMap = styleMap.concat(defaultStyleMap);
				return styleMap;
			}
		});
	}
	function readStyleMap(styleMap) {
		if (!styleMap) return [];
		else if (_.isString(styleMap)) return styleMap.split("\n").map(function(line) {
			return line.trim();
		}).filter(function(line) {
			return line !== "" && line.charAt(0) !== "#";
		});
		else return styleMap;
	}
	function identity(value) {
		return value;
	}
}));
//#endregion
//#region node_modules/mammoth/browser/unzip.js
var require_unzip = /* @__PURE__ */ __commonJSMin(((exports) => {
	var promises = require_promises();
	var zipfile = require_zipfile();
	exports.openZip = openZip;
	function openZip(options) {
		if (options.arrayBuffer) return promises.resolve(zipfile.openArrayBuffer(options.arrayBuffer));
		else return promises.reject(/* @__PURE__ */ new Error("Could not find file in options"));
	}
}));
//#endregion
//#region node_modules/mammoth/lib/underline.js
var require_underline = /* @__PURE__ */ __commonJSMin(((exports) => {
	var htmlPaths = require_html_paths();
	var Html = require_html();
	exports.element = element;
	function element(name) {
		return function(html) {
			return Html.elementWithTag(htmlPaths.element(name), [html]);
		};
	}
}));
//#endregion
//#region node_modules/mammoth/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _ = (init_index_all(), __toCommonJS(index_all_exports));
	var docxReader = require_docx_reader();
	var docxStyleMap = require_style_map();
	var DocumentConverter = require_document_to_html().DocumentConverter;
	var convertElementToRawText = require_raw_text().convertElementToRawText;
	var readStyle = require_style_reader().readStyle;
	var readOptions = require_options_reader().readOptions;
	var unzip = require_unzip();
	var Result = require_results().Result;
	exports.convertToHtml = convertToHtml;
	exports.convertToMarkdown = convertToMarkdown;
	exports.convert = convert;
	exports.extractRawText = extractRawText;
	exports.images = require_images();
	exports.transforms = require_transforms();
	exports.underline = require_underline();
	exports.embedStyleMap = embedStyleMap;
	exports.readEmbeddedStyleMap = readEmbeddedStyleMap;
	function convertToHtml(input, options) {
		return convert(input, options);
	}
	function convertToMarkdown(input, options) {
		var markdownOptions = Object.create(options || {});
		markdownOptions.outputFormat = "markdown";
		return convert(input, markdownOptions);
	}
	function convert(input, options) {
		options = readOptions(options);
		return unzip.openZip(input).tap(function(docxFile) {
			return docxStyleMap.readStyleMap(docxFile).then(function(styleMap) {
				options.embeddedStyleMap = styleMap;
			});
		}).then(function(docxFile) {
			return docxReader.read(docxFile, input, options).then(function(documentResult) {
				return documentResult.map(options.transformDocument);
			}).then(function(documentResult) {
				return convertDocumentToHtml(documentResult, options);
			});
		});
	}
	function readEmbeddedStyleMap(input) {
		return unzip.openZip(input).then(docxStyleMap.readStyleMap);
	}
	function convertDocumentToHtml(documentResult, options) {
		var styleMapResult = parseStyleMap(options.readStyleMap());
		var documentConverter = new DocumentConverter(_.extend({}, options, { styleMap: styleMapResult.value }));
		return documentResult.flatMapThen(function(document) {
			return styleMapResult.flatMapThen(function(styleMap) {
				return documentConverter.convertToHtml(document);
			});
		});
	}
	function parseStyleMap(styleMap) {
		return Result.combine((styleMap || []).map(readStyle)).map(function(styleMap) {
			return styleMap.filter(function(styleMapping) {
				return !!styleMapping;
			});
		});
	}
	function extractRawText(input) {
		return unzip.openZip(input).then(docxReader.read).then(function(documentResult) {
			return documentResult.map(convertElementToRawText);
		});
	}
	function embedStyleMap(input, styleMap) {
		return unzip.openZip(input).tap(function(docxFile) {
			return docxStyleMap.writeStyleMap(docxFile, styleMap);
		}).then(function(docxFile) {
			return docxFile.toArrayBuffer();
		}).then(function(arrayBuffer) {
			return {
				toArrayBuffer: function() {
					return arrayBuffer;
				},
				toBuffer: function() {
					return Buffer.from(arrayBuffer);
				}
			};
		});
	}
	exports.styleMapping = function() {
		throw new Error("Use a raw string instead of mammoth.styleMapping e.g. \"p[style-name='Title'] => h1\" instead of mammoth.styleMapping(\"p[style-name='Title'] => h1\")");
	};
}));
//#endregion
export default require_lib();
