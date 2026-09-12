import { _ as constants, a as asciiAlphanumeric, d as markdownLineEnding, f as markdownLineEndingOrSpace, g as codes, h as unicodeWhitespace, m as unicodePunctuation, p as markdownSpace, r as types, t as factorySpace } from "./dev-Zw4g8Z-R.js";
//#region node_modules/micromark-util-chunked/dev/index.js
/**
* Like `Array#splice`, but smarter for giant arrays.
*
* `Array#splice` takes all items to be inserted as individual argument which
* causes a stack overflow in V8 when trying to insert 100k items for instance.
*
* Otherwise, this does not return the removed items, and takes `items` as an
* array instead of rest parameters.
*
* @template {unknown} T
*   Item type.
* @param {Array<T>} list
*   List to operate on.
* @param {number} start
*   Index to remove/insert at (can be negative).
* @param {number} remove
*   Number of items to remove.
* @param {Array<T>} items
*   Items to inject into `list`.
* @returns {void}
*   Nothing.
*/
function splice(list, start, remove, items) {
	const end = list.length;
	let chunkStart = 0;
	/** @type {Array<unknown>} */
	let parameters;
	if (start < 0) start = -start > end ? 0 : end + start;
	else start = start > end ? end : start;
	remove = remove > 0 ? remove : 0;
	if (items.length < constants.v8MaxSafeChunkSize) {
		parameters = Array.from(items);
		parameters.unshift(start, remove);
		list.splice(...parameters);
	} else {
		if (remove) list.splice(start, remove);
		while (chunkStart < items.length) {
			parameters = items.slice(chunkStart, chunkStart + constants.v8MaxSafeChunkSize);
			parameters.unshift(start, 0);
			list.splice(...parameters);
			chunkStart += constants.v8MaxSafeChunkSize;
			start += constants.v8MaxSafeChunkSize;
		}
	}
}
/**
* Append `items` (an array) at the end of `list` (another array).
* When `list` was empty, returns `items` instead.
*
* This prevents a potentially expensive operation when `list` is empty,
* and adds items in batches to prevent V8 from hanging.
*
* @template {unknown} T
*   Item type.
* @param {Array<T>} list
*   List to operate on.
* @param {Array<T>} items
*   Items to add to `list`.
* @returns {Array<T>}
*   Either `list` or `items`.
*/
function push(list, items) {
	if (list.length > 0) {
		splice(list, list.length, 0, items);
		return list;
	}
	return items;
}
//#endregion
//#region node_modules/micromark-util-combine-extensions/index.js
/**
* @typedef {import('micromark-util-types').Extension} Extension
* @typedef {import('micromark-util-types').Handles} Handles
* @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
* @typedef {import('micromark-util-types').NormalizedExtension} NormalizedExtension
*/
var hasOwnProperty = {}.hasOwnProperty;
/**
* Combine multiple syntax extensions into one.
*
* @param {Array<Extension>} extensions
*   List of syntax extensions.
* @returns {NormalizedExtension}
*   A single combined extension.
*/
function combineExtensions(extensions) {
	/** @type {NormalizedExtension} */
	const all = {};
	let index = -1;
	while (++index < extensions.length) syntaxExtension(all, extensions[index]);
	return all;
}
/**
* Merge `extension` into `all`.
*
* @param {NormalizedExtension} all
*   Extension to merge into.
* @param {Extension} extension
*   Extension to merge.
* @returns {void}
*/
function syntaxExtension(all, extension) {
	/** @type {keyof Extension} */
	let hook;
	for (hook in extension) {
		/** @type {Record<string, unknown>} */
		const left = (hasOwnProperty.call(all, hook) ? all[hook] : void 0) || (all[hook] = {});
		/** @type {Record<string, unknown> | undefined} */
		const right = extension[hook];
		/** @type {string} */
		let code;
		if (right) for (code in right) {
			if (!hasOwnProperty.call(left, code)) left[code] = [];
			const value = right[code];
			constructs(left[code], Array.isArray(value) ? value : value ? [value] : []);
		}
	}
}
/**
* Merge `list` into `existing` (both lists of constructs).
* Mutates `existing`.
*
* @param {Array<unknown>} existing
* @param {Array<unknown>} list
* @returns {void}
*/
function constructs(existing, list) {
	let index = -1;
	/** @type {Array<unknown>} */
	const before = [];
	while (++index < list.length) (list[index].add === "after" ? existing : before).push(list[index]);
	splice(existing, 0, 0, before);
}
/**
* Combine multiple HTML extensions into one.
*
* @param {Array<HtmlExtension>} htmlExtensions
*   List of HTML extensions.
* @returns {HtmlExtension}
*   A single combined HTML extension.
*/
function combineHtmlExtensions(htmlExtensions) {
	/** @type {HtmlExtension} */
	const handlers = {};
	let index = -1;
	while (++index < htmlExtensions.length) htmlExtension(handlers, htmlExtensions[index]);
	return handlers;
}
/**
* Merge `extension` into `all`.
*
* @param {HtmlExtension} all
*   Extension to merge into.
* @param {HtmlExtension} extension
*   Extension to merge.
* @returns {void}
*/
function htmlExtension(all, extension) {
	/** @type {keyof HtmlExtension} */
	let hook;
	for (hook in extension) {
		const left = (hasOwnProperty.call(all, hook) ? all[hook] : void 0) || (all[hook] = {});
		const right = extension[hook];
		/** @type {keyof Handles} */
		let type;
		if (right) for (type in right) left[type] = right[type];
	}
}
//#endregion
//#region node_modules/micromark-util-symbol/values.js
/**
* This module is compiled away!
*
* While micromark works based on character codes, this module includes the
* string versions of ’em.
* The C0 block, except for LF, CR, HT, and w/ the replacement character added,
* are available here.
*/
var values = {
	ht: "	",
	lf: "\n",
	cr: "\r",
	space: " ",
	exclamationMark: "!",
	quotationMark: "\"",
	numberSign: "#",
	dollarSign: "$",
	percentSign: "%",
	ampersand: "&",
	apostrophe: "'",
	leftParenthesis: "(",
	rightParenthesis: ")",
	asterisk: "*",
	plusSign: "+",
	comma: ",",
	dash: "-",
	dot: ".",
	slash: "/",
	digit0: "0",
	digit1: "1",
	digit2: "2",
	digit3: "3",
	digit4: "4",
	digit5: "5",
	digit6: "6",
	digit7: "7",
	digit8: "8",
	digit9: "9",
	colon: ":",
	semicolon: ";",
	lessThan: "<",
	equalsTo: "=",
	greaterThan: ">",
	questionMark: "?",
	atSign: "@",
	uppercaseA: "A",
	uppercaseB: "B",
	uppercaseC: "C",
	uppercaseD: "D",
	uppercaseE: "E",
	uppercaseF: "F",
	uppercaseG: "G",
	uppercaseH: "H",
	uppercaseI: "I",
	uppercaseJ: "J",
	uppercaseK: "K",
	uppercaseL: "L",
	uppercaseM: "M",
	uppercaseN: "N",
	uppercaseO: "O",
	uppercaseP: "P",
	uppercaseQ: "Q",
	uppercaseR: "R",
	uppercaseS: "S",
	uppercaseT: "T",
	uppercaseU: "U",
	uppercaseV: "V",
	uppercaseW: "W",
	uppercaseX: "X",
	uppercaseY: "Y",
	uppercaseZ: "Z",
	leftSquareBracket: "[",
	backslash: "\\",
	rightSquareBracket: "]",
	caret: "^",
	underscore: "_",
	graveAccent: "`",
	lowercaseA: "a",
	lowercaseB: "b",
	lowercaseC: "c",
	lowercaseD: "d",
	lowercaseE: "e",
	lowercaseF: "f",
	lowercaseG: "g",
	lowercaseH: "h",
	lowercaseI: "i",
	lowercaseJ: "j",
	lowercaseK: "k",
	lowercaseL: "l",
	lowercaseM: "m",
	lowercaseN: "n",
	lowercaseO: "o",
	lowercaseP: "p",
	lowercaseQ: "q",
	lowercaseR: "r",
	lowercaseS: "s",
	lowercaseT: "t",
	lowercaseU: "u",
	lowercaseV: "v",
	lowercaseW: "w",
	lowercaseX: "x",
	lowercaseY: "y",
	lowercaseZ: "z",
	leftCurlyBrace: "{",
	verticalBar: "|",
	rightCurlyBrace: "}",
	tilde: "~",
	replacementCharacter: "�"
};
//#endregion
//#region node_modules/micromark-util-encode/index.js
var characterReferences = {
	"\"": "quot",
	"&": "amp",
	"<": "lt",
	">": "gt"
};
/**
* Encode only the dangerous HTML characters.
*
* This ensures that certain characters which have special meaning in HTML are
* dealt with.
* Technically, we can skip `>` and `"` in many cases, but CM includes them.
*
* @param {string} value
*   Value to encode.
* @returns {string}
*   Encoded value.
*/
function encode(value) {
	return value.replace(/["&<>]/g, replace);
	/**
	* @param {string} value
	* @returns {string}
	*/
	function replace(value) {
		return "&" + characterReferences[value] + ";";
	}
}
//#endregion
//#region node_modules/micromark-util-normalize-identifier/dev/index.js
/**
* Normalize an identifier (as found in references, definitions).
*
* Collapses markdown whitespace, trim, and then lower- and uppercase.
*
* Some characters are considered “uppercase”, such as U+03F4 (`ϴ`), but if their
* lowercase counterpart (U+03B8 (`θ`)) is uppercased will result in a different
* uppercase character (U+0398 (`Θ`)).
* So, to get a canonical form, we perform both lower- and uppercase.
*
* Using uppercase last makes sure keys will never interact with default
* prototypal values (such as `constructor`): nothing in the prototype of
* `Object` is uppercase.
*
* @param {string} value
*   Identifier to normalize.
* @returns {string}
*   Normalized identifier.
*/
function normalizeIdentifier(value) {
	return value.replace(/[\t\n\r ]+/g, values.space).replace(/^ | $/g, "").toLowerCase().toUpperCase();
}
//#endregion
//#region node_modules/micromark-util-sanitize-uri/dev/index.js
/**
* Make a value safe for injection as a URL.
*
* This encodes unsafe characters with percent-encoding and skips already
* encoded sequences (see `normalizeUri`).
* Further unsafe characters are encoded as character references (see
* `micromark-util-encode`).
*
* A regex of allowed protocols can be given, in which case the URL is
* sanitized.
* For example, `/^(https?|ircs?|mailto|xmpp)$/i` can be used for `a[href]`, or
* `/^https?$/i` for `img[src]` (this is what `github.com` allows).
* If the URL includes an unknown protocol (one not matched by `protocol`, such
* as a dangerous example, `javascript:`), the value is ignored.
*
* @param {string | undefined} url
*   URI to sanitize.
* @param {RegExp | null | undefined} [protocol]
*   Allowed protocols.
* @returns {string}
*   Sanitized URI.
*/
function sanitizeUri(url, protocol) {
	const value = encode(normalizeUri(url || ""));
	if (!protocol) return value;
	const colon = value.indexOf(":");
	const questionMark = value.indexOf("?");
	const numberSign = value.indexOf("#");
	const slash = value.indexOf("/");
	if (colon < 0 || slash > -1 && colon > slash || questionMark > -1 && colon > questionMark || numberSign > -1 && colon > numberSign || protocol.test(value.slice(0, colon))) return value;
	return "";
}
/**
* Normalize a URL.
*
* Encode unsafe characters with percent-encoding, skipping already encoded
* sequences.
*
* @param {string} value
*   URI to normalize.
* @returns {string}
*   Normalized URI.
*/
function normalizeUri(value) {
	/** @type {Array<string>} */
	const result = [];
	let index = -1;
	let start = 0;
	let skip = 0;
	while (++index < value.length) {
		const code = value.charCodeAt(index);
		/** @type {string} */
		let replace = "";
		if (code === codes.percentSign && asciiAlphanumeric(value.charCodeAt(index + 1)) && asciiAlphanumeric(value.charCodeAt(index + 2))) skip = 2;
		else if (code < 128) {
			if (!/[!#$&-;=?-Z_a-z~]/.test(String.fromCharCode(code))) replace = String.fromCharCode(code);
		} else if (code > 55295 && code < 57344) {
			const next = value.charCodeAt(index + 1);
			if (code < 56320 && next > 56319 && next < 57344) {
				replace = String.fromCharCode(code, next);
				skip = 1;
			} else replace = values.replacementCharacter;
		} else replace = String.fromCharCode(code);
		if (replace) {
			result.push(value.slice(start, index), encodeURIComponent(replace));
			start = index + skip + 1;
			replace = "";
		}
		if (skip) {
			index += skip;
			skip = 0;
		}
	}
	return result.join("") + value.slice(start);
}
//#endregion
//#region node_modules/micromark-util-classify-character/dev/index.js
/**
* @typedef {import('micromark-util-types').Code} Code
*/
/**
* Classify whether a code represents whitespace, punctuation, or something
* else.
*
* Used for attention (emphasis, strong), whose sequences can open or close
* based on the class of surrounding characters.
*
* > 👉 **Note**: eof (`null`) is seen as whitespace.
*
* @param {Code} code
*   Code.
* @returns {typeof constants.characterGroupWhitespace | typeof constants.characterGroupPunctuation | undefined}
*   Group.
*/
function classifyCharacter(code) {
	if (code === codes.eof || markdownLineEndingOrSpace(code) || unicodeWhitespace(code)) return constants.characterGroupWhitespace;
	if (unicodePunctuation(code)) return constants.characterGroupPunctuation;
}
//#endregion
//#region node_modules/micromark-util-resolve-all/index.js
/**
* @typedef {import('micromark-util-types').Event} Event
* @typedef {import('micromark-util-types').Resolver} Resolver
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
*/
/**
* Call all `resolveAll`s.
*
* @param {Array<{resolveAll?: Resolver | undefined}>} constructs
*   List of constructs, optionally with `resolveAll`s.
* @param {Array<Event>} events
*   List of events.
* @param {TokenizeContext} context
*   Context used by `tokenize`.
* @returns {Array<Event>}
*   Changed events.
*/
function resolveAll(constructs, events, context) {
	/** @type {Array<Resolver>} */
	const called = [];
	let index = -1;
	while (++index < constructs.length) {
		const resolve = constructs[index].resolveAll;
		if (resolve && !called.includes(resolve)) {
			events = resolve(events, context);
			called.push(resolve);
		}
	}
	return events;
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/blank-line.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var blankLine = {
	tokenize: tokenizeBlankLine,
	partial: true
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeBlankLine(effects, ok, nok) {
	return start;
	/**
	* Start of blank line.
	*
	* > 👉 **Note**: `␠` represents a space character.
	*
	* ```markdown
	* > | ␠␠␊
	*     ^
	* > | ␊
	*     ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		return markdownSpace(code) ? factorySpace(effects, after, types.linePrefix)(code) : after(code);
	}
	/**
	* At eof/eol, after optional whitespace.
	*
	* > 👉 **Note**: `␠` represents a space character.
	*
	* ```markdown
	* > | ␠␠␊
	*       ^
	* > | ␊
	*     ^
	* ```
	*
	* @type {State}
	*/
	function after(code) {
		return code === codes.eof || markdownLineEnding(code) ? ok(code) : nok(code);
	}
}
//#endregion
export { normalizeIdentifier as a, combineExtensions as c, splice as d, sanitizeUri as i, combineHtmlExtensions as l, resolveAll as n, encode as o, classifyCharacter as r, values as s, blankLine as t, push as u };
