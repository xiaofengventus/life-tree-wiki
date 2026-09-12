//#region node_modules/micromark-util-symbol/constants.js
/**
* This module is compiled away!
*
* Parsing markdown comes with a couple of constants, such as minimum or maximum
* sizes of certain sequences.
* Additionally, there are a couple symbols used inside micromark.
* These are all defined here, but compiled away by scripts.
*/
var constants = {
	attentionSideBefore: 1,
	attentionSideAfter: 2,
	atxHeadingOpeningFenceSizeMax: 6,
	autolinkDomainSizeMax: 63,
	autolinkSchemeSizeMax: 32,
	cdataOpeningString: "CDATA[",
	characterGroupWhitespace: 1,
	characterGroupPunctuation: 2,
	characterReferenceDecimalSizeMax: 7,
	characterReferenceHexadecimalSizeMax: 6,
	characterReferenceNamedSizeMax: 31,
	codeFencedSequenceSizeMin: 3,
	contentTypeDocument: "document",
	contentTypeFlow: "flow",
	contentTypeContent: "content",
	contentTypeString: "string",
	contentTypeText: "text",
	hardBreakPrefixSizeMin: 2,
	htmlRaw: 1,
	htmlComment: 2,
	htmlInstruction: 3,
	htmlDeclaration: 4,
	htmlCdata: 5,
	htmlBasic: 6,
	htmlComplete: 7,
	htmlRawSizeMax: 8,
	linkResourceDestinationBalanceMax: 32,
	linkReferenceSizeMax: 999,
	listItemValueSizeMax: 10,
	numericBaseDecimal: 10,
	numericBaseHexadecimal: 16,
	tabSize: 4,
	thematicBreakMarkerCountMin: 3,
	v8MaxSafeChunkSize: 1e4
};
//#endregion
//#region node_modules/micromark-util-symbol/codes.js
/**
* Character codes.
*
* This module is compiled away!
*
* micromark works based on character codes.
* This module contains constants for the ASCII block and the replacement
* character.
* A couple of them are handled in a special way, such as the line endings
* (CR, LF, and CR+LF, commonly known as end-of-line: EOLs), the tab (horizontal
* tab) and its expansion based on what column it’s at (virtual space),
* and the end-of-file (eof) character.
* As values are preprocessed before handling them, the actual characters LF,
* CR, HT, and NUL (which is present as the replacement character), are
* guaranteed to not exist.
*
* Unicode basic latin block.
*/
var codes = {
	carriageReturn: -5,
	lineFeed: -4,
	carriageReturnLineFeed: -3,
	horizontalTab: -2,
	virtualSpace: -1,
	eof: null,
	nul: 0,
	soh: 1,
	stx: 2,
	etx: 3,
	eot: 4,
	enq: 5,
	ack: 6,
	bel: 7,
	bs: 8,
	ht: 9,
	lf: 10,
	vt: 11,
	ff: 12,
	cr: 13,
	so: 14,
	si: 15,
	dle: 16,
	dc1: 17,
	dc2: 18,
	dc3: 19,
	dc4: 20,
	nak: 21,
	syn: 22,
	etb: 23,
	can: 24,
	em: 25,
	sub: 26,
	esc: 27,
	fs: 28,
	gs: 29,
	rs: 30,
	us: 31,
	space: 32,
	exclamationMark: 33,
	quotationMark: 34,
	numberSign: 35,
	dollarSign: 36,
	percentSign: 37,
	ampersand: 38,
	apostrophe: 39,
	leftParenthesis: 40,
	rightParenthesis: 41,
	asterisk: 42,
	plusSign: 43,
	comma: 44,
	dash: 45,
	dot: 46,
	slash: 47,
	digit0: 48,
	digit1: 49,
	digit2: 50,
	digit3: 51,
	digit4: 52,
	digit5: 53,
	digit6: 54,
	digit7: 55,
	digit8: 56,
	digit9: 57,
	colon: 58,
	semicolon: 59,
	lessThan: 60,
	equalsTo: 61,
	greaterThan: 62,
	questionMark: 63,
	atSign: 64,
	uppercaseA: 65,
	uppercaseB: 66,
	uppercaseC: 67,
	uppercaseD: 68,
	uppercaseE: 69,
	uppercaseF: 70,
	uppercaseG: 71,
	uppercaseH: 72,
	uppercaseI: 73,
	uppercaseJ: 74,
	uppercaseK: 75,
	uppercaseL: 76,
	uppercaseM: 77,
	uppercaseN: 78,
	uppercaseO: 79,
	uppercaseP: 80,
	uppercaseQ: 81,
	uppercaseR: 82,
	uppercaseS: 83,
	uppercaseT: 84,
	uppercaseU: 85,
	uppercaseV: 86,
	uppercaseW: 87,
	uppercaseX: 88,
	uppercaseY: 89,
	uppercaseZ: 90,
	leftSquareBracket: 91,
	backslash: 92,
	rightSquareBracket: 93,
	caret: 94,
	underscore: 95,
	graveAccent: 96,
	lowercaseA: 97,
	lowercaseB: 98,
	lowercaseC: 99,
	lowercaseD: 100,
	lowercaseE: 101,
	lowercaseF: 102,
	lowercaseG: 103,
	lowercaseH: 104,
	lowercaseI: 105,
	lowercaseJ: 106,
	lowercaseK: 107,
	lowercaseL: 108,
	lowercaseM: 109,
	lowercaseN: 110,
	lowercaseO: 111,
	lowercaseP: 112,
	lowercaseQ: 113,
	lowercaseR: 114,
	lowercaseS: 115,
	lowercaseT: 116,
	lowercaseU: 117,
	lowercaseV: 118,
	lowercaseW: 119,
	lowercaseX: 120,
	lowercaseY: 121,
	lowercaseZ: 122,
	leftCurlyBrace: 123,
	verticalBar: 124,
	rightCurlyBrace: 125,
	tilde: 126,
	del: 127,
	byteOrderMarker: 65279,
	replacementCharacter: 65533
};
//#endregion
//#region node_modules/micromark-util-character/dev/lib/unicode-punctuation-regex.js
/**
* Regular expression that matches a unicode punctuation character.
*/
var unicodePunctuationRegex = /[!-/:-@[-`{-~\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]/;
//#endregion
//#region node_modules/micromark-util-character/dev/index.js
/**
* @typedef {import('micromark-util-types').Code} Code
*/
/**
* Check whether the character code represents an ASCII alpha (`a` through `z`,
* case insensitive).
*
* An **ASCII alpha** is an ASCII upper alpha or ASCII lower alpha.
*
* An **ASCII upper alpha** is a character in the inclusive range U+0041 (`A`)
* to U+005A (`Z`).
*
* An **ASCII lower alpha** is a character in the inclusive range U+0061 (`a`)
* to U+007A (`z`).
*
* @param code
*   Code.
* @returns
*   Whether it matches.
*/
var asciiAlpha = regexCheck(/[A-Za-z]/);
/**
* Check whether the character code represents an ASCII alphanumeric (`a`
* through `z`, case insensitive, or `0` through `9`).
*
* An **ASCII alphanumeric** is an ASCII digit (see `asciiDigit`) or ASCII alpha
* (see `asciiAlpha`).
*
* @param code
*   Code.
* @returns
*   Whether it matches.
*/
var asciiAlphanumeric = regexCheck(/[\dA-Za-z]/);
/**
* Check whether the character code represents an ASCII atext.
*
* atext is an ASCII alphanumeric (see `asciiAlphanumeric`), or a character in
* the inclusive ranges U+0023 NUMBER SIGN (`#`) to U+0027 APOSTROPHE (`'`),
* U+002A ASTERISK (`*`), U+002B PLUS SIGN (`+`), U+002D DASH (`-`), U+002F
* SLASH (`/`), U+003D EQUALS TO (`=`), U+003F QUESTION MARK (`?`), U+005E
* CARET (`^`) to U+0060 GRAVE ACCENT (`` ` ``), or U+007B LEFT CURLY BRACE
* (`{`) to U+007E TILDE (`~`).
*
* See:
* **\[RFC5322]**:
* [Internet Message Format](https://tools.ietf.org/html/rfc5322).
* P. Resnick.
* IETF.
*
* @param code
*   Code.
* @returns
*   Whether it matches.
*/
var asciiAtext = regexCheck(/[#-'*+\--9=?A-Z^-~]/);
/**
* Check whether a character code is an ASCII control character.
*
* An **ASCII control** is a character in the inclusive range U+0000 NULL (NUL)
* to U+001F (US), or U+007F (DEL).
*
* @param {Code} code
*   Code.
* @returns {boolean}
*   Whether it matches.
*/
function asciiControl(code) {
	return code !== null && (code < codes.space || code === codes.del);
}
/**
* Check whether the character code represents an ASCII digit (`0` through `9`).
*
* An **ASCII digit** is a character in the inclusive range U+0030 (`0`) to
* U+0039 (`9`).
*
* @param code
*   Code.
* @returns
*   Whether it matches.
*/
var asciiDigit = regexCheck(/\d/);
/**
* Check whether the character code represents an ASCII hex digit (`a` through
* `f`, case insensitive, or `0` through `9`).
*
* An **ASCII hex digit** is an ASCII digit (see `asciiDigit`), ASCII upper hex
* digit, or an ASCII lower hex digit.
*
* An **ASCII upper hex digit** is a character in the inclusive range U+0041
* (`A`) to U+0046 (`F`).
*
* An **ASCII lower hex digit** is a character in the inclusive range U+0061
* (`a`) to U+0066 (`f`).
*
* @param code
*   Code.
* @returns
*   Whether it matches.
*/
var asciiHexDigit = regexCheck(/[\dA-Fa-f]/);
/**
* Check whether the character code represents ASCII punctuation.
*
* An **ASCII punctuation** is a character in the inclusive ranges U+0021
* EXCLAMATION MARK (`!`) to U+002F SLASH (`/`), U+003A COLON (`:`) to U+0040 AT
* SIGN (`@`), U+005B LEFT SQUARE BRACKET (`[`) to U+0060 GRAVE ACCENT
* (`` ` ``), or U+007B LEFT CURLY BRACE (`{`) to U+007E TILDE (`~`).
*
* @param code
*   Code.
* @returns
*   Whether it matches.
*/
var asciiPunctuation = regexCheck(/[!-/:-@[-`{-~]/);
/**
* Check whether a character code is a markdown line ending.
*
* A **markdown line ending** is the virtual characters M-0003 CARRIAGE RETURN
* LINE FEED (CRLF), M-0004 LINE FEED (LF) and M-0005 CARRIAGE RETURN (CR).
*
* In micromark, the actual character U+000A LINE FEED (LF) and U+000D CARRIAGE
* RETURN (CR) are replaced by these virtual characters depending on whether
* they occurred together.
*
* @param {Code} code
*   Code.
* @returns {boolean}
*   Whether it matches.
*/
function markdownLineEnding(code) {
	return code !== null && code < codes.horizontalTab;
}
/**
* Check whether a character code is a markdown line ending (see
* `markdownLineEnding`) or markdown space (see `markdownSpace`).
*
* @param {Code} code
*   Code.
* @returns {boolean}
*   Whether it matches.
*/
function markdownLineEndingOrSpace(code) {
	return code !== null && (code < codes.nul || code === codes.space);
}
/**
* Check whether a character code is a markdown space.
*
* A **markdown space** is the concrete character U+0020 SPACE (SP) and the
* virtual characters M-0001 VIRTUAL SPACE (VS) and M-0002 HORIZONTAL TAB (HT).
*
* In micromark, the actual character U+0009 CHARACTER TABULATION (HT) is
* replaced by one M-0002 HORIZONTAL TAB (HT) and between 0 and 3 M-0001 VIRTUAL
* SPACE (VS) characters, depending on the column at which the tab occurred.
*
* @param {Code} code
*   Code.
* @returns {boolean}
*   Whether it matches.
*/
function markdownSpace(code) {
	return code === codes.horizontalTab || code === codes.virtualSpace || code === codes.space;
}
/**
* Check whether the character code represents Unicode punctuation.
*
* A **Unicode punctuation** is a character in the Unicode `Pc` (Punctuation,
* Connector), `Pd` (Punctuation, Dash), `Pe` (Punctuation, Close), `Pf`
* (Punctuation, Final quote), `Pi` (Punctuation, Initial quote), `Po`
* (Punctuation, Other), or `Ps` (Punctuation, Open) categories, or an ASCII
* punctuation (see `asciiPunctuation`).
*
* See:
* **\[UNICODE]**:
* [The Unicode Standard](https://www.unicode.org/versions/).
* Unicode Consortium.
*
* @param code
*   Code.
* @returns
*   Whether it matches.
*/
var unicodePunctuation = regexCheck(unicodePunctuationRegex);
/**
* Check whether the character code represents Unicode whitespace.
*
* Note that this does handle micromark specific markdown whitespace characters.
* See `markdownLineEndingOrSpace` to check that.
*
* A **Unicode whitespace** is a character in the Unicode `Zs` (Separator,
* Space) category, or U+0009 CHARACTER TABULATION (HT), U+000A LINE FEED (LF),
* U+000C (FF), or U+000D CARRIAGE RETURN (CR) (**\[UNICODE]**).
*
* See:
* **\[UNICODE]**:
* [The Unicode Standard](https://www.unicode.org/versions/).
* Unicode Consortium.
*
* @param code
*   Code.
* @returns
*   Whether it matches.
*/
var unicodeWhitespace = regexCheck(/\s/);
/**
* Create a code check from a regex.
*
* @param {RegExp} regex
* @returns {(code: Code) => boolean}
*/
function regexCheck(regex) {
	return check;
	/**
	* Check whether a code matches the bound regex.
	*
	* @param {Code} code
	*   Character code.
	* @returns {boolean}
	*   Whether the character code matches the bound regex.
	*/
	function check(code) {
		return code !== null && regex.test(String.fromCharCode(code));
	}
}
//#endregion
//#region node_modules/micromark-util-symbol/types.js
/**
* This module is compiled away!
*
* Here is the list of all types of tokens exposed by micromark, with a short
* explanation of what they include and where they are found.
* In picking names, generally, the rule is to be as explicit as possible
* instead of reusing names.
* For example, there is a `definitionDestination` and a `resourceDestination`,
* instead of one shared name.
*/
var types = {
	data: "data",
	whitespace: "whitespace",
	lineEnding: "lineEnding",
	lineEndingBlank: "lineEndingBlank",
	linePrefix: "linePrefix",
	lineSuffix: "lineSuffix",
	atxHeading: "atxHeading",
	atxHeadingSequence: "atxHeadingSequence",
	atxHeadingText: "atxHeadingText",
	autolink: "autolink",
	autolinkEmail: "autolinkEmail",
	autolinkMarker: "autolinkMarker",
	autolinkProtocol: "autolinkProtocol",
	characterEscape: "characterEscape",
	characterEscapeValue: "characterEscapeValue",
	characterReference: "characterReference",
	characterReferenceMarker: "characterReferenceMarker",
	characterReferenceMarkerNumeric: "characterReferenceMarkerNumeric",
	characterReferenceMarkerHexadecimal: "characterReferenceMarkerHexadecimal",
	characterReferenceValue: "characterReferenceValue",
	codeFenced: "codeFenced",
	codeFencedFence: "codeFencedFence",
	codeFencedFenceSequence: "codeFencedFenceSequence",
	codeFencedFenceInfo: "codeFencedFenceInfo",
	codeFencedFenceMeta: "codeFencedFenceMeta",
	codeFlowValue: "codeFlowValue",
	codeIndented: "codeIndented",
	codeText: "codeText",
	codeTextData: "codeTextData",
	codeTextPadding: "codeTextPadding",
	codeTextSequence: "codeTextSequence",
	content: "content",
	definition: "definition",
	definitionDestination: "definitionDestination",
	definitionDestinationLiteral: "definitionDestinationLiteral",
	definitionDestinationLiteralMarker: "definitionDestinationLiteralMarker",
	definitionDestinationRaw: "definitionDestinationRaw",
	definitionDestinationString: "definitionDestinationString",
	definitionLabel: "definitionLabel",
	definitionLabelMarker: "definitionLabelMarker",
	definitionLabelString: "definitionLabelString",
	definitionMarker: "definitionMarker",
	definitionTitle: "definitionTitle",
	definitionTitleMarker: "definitionTitleMarker",
	definitionTitleString: "definitionTitleString",
	emphasis: "emphasis",
	emphasisSequence: "emphasisSequence",
	emphasisText: "emphasisText",
	escapeMarker: "escapeMarker",
	hardBreakEscape: "hardBreakEscape",
	hardBreakTrailing: "hardBreakTrailing",
	htmlFlow: "htmlFlow",
	htmlFlowData: "htmlFlowData",
	htmlText: "htmlText",
	htmlTextData: "htmlTextData",
	image: "image",
	label: "label",
	labelText: "labelText",
	labelLink: "labelLink",
	labelImage: "labelImage",
	labelMarker: "labelMarker",
	labelImageMarker: "labelImageMarker",
	labelEnd: "labelEnd",
	link: "link",
	paragraph: "paragraph",
	reference: "reference",
	referenceMarker: "referenceMarker",
	referenceString: "referenceString",
	resource: "resource",
	resourceDestination: "resourceDestination",
	resourceDestinationLiteral: "resourceDestinationLiteral",
	resourceDestinationLiteralMarker: "resourceDestinationLiteralMarker",
	resourceDestinationRaw: "resourceDestinationRaw",
	resourceDestinationString: "resourceDestinationString",
	resourceMarker: "resourceMarker",
	resourceTitle: "resourceTitle",
	resourceTitleMarker: "resourceTitleMarker",
	resourceTitleString: "resourceTitleString",
	setextHeading: "setextHeading",
	setextHeadingText: "setextHeadingText",
	setextHeadingLine: "setextHeadingLine",
	setextHeadingLineSequence: "setextHeadingLineSequence",
	strong: "strong",
	strongSequence: "strongSequence",
	strongText: "strongText",
	thematicBreak: "thematicBreak",
	thematicBreakSequence: "thematicBreakSequence",
	blockQuote: "blockQuote",
	blockQuotePrefix: "blockQuotePrefix",
	blockQuoteMarker: "blockQuoteMarker",
	blockQuotePrefixWhitespace: "blockQuotePrefixWhitespace",
	listOrdered: "listOrdered",
	listUnordered: "listUnordered",
	listItemIndent: "listItemIndent",
	listItemMarker: "listItemMarker",
	listItemPrefix: "listItemPrefix",
	listItemPrefixWhitespace: "listItemPrefixWhitespace",
	listItemValue: "listItemValue",
	chunkDocument: "chunkDocument",
	chunkContent: "chunkContent",
	chunkFlow: "chunkFlow",
	chunkText: "chunkText",
	chunkString: "chunkString"
};
//#endregion
//#region node_modules/dequal/dist/index.mjs
var has = Object.prototype.hasOwnProperty;
function find(iter, tar, key) {
	for (key of iter.keys()) if (dequal(key, tar)) return key;
}
function dequal(foo, bar) {
	var ctor, len, tmp;
	if (foo === bar) return true;
	if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
		if (ctor === Date) return foo.getTime() === bar.getTime();
		if (ctor === RegExp) return foo.toString() === bar.toString();
		if (ctor === Array) {
			if ((len = foo.length) === bar.length) while (len-- && dequal(foo[len], bar[len]));
			return len === -1;
		}
		if (ctor === Set) {
			if (foo.size !== bar.size) return false;
			for (len of foo) {
				tmp = len;
				if (tmp && typeof tmp === "object") {
					tmp = find(bar, tmp);
					if (!tmp) return false;
				}
				if (!bar.has(tmp)) return false;
			}
			return true;
		}
		if (ctor === Map) {
			if (foo.size !== bar.size) return false;
			for (len of foo) {
				tmp = len[0];
				if (tmp && typeof tmp === "object") {
					tmp = find(bar, tmp);
					if (!tmp) return false;
				}
				if (!dequal(len[1], bar.get(tmp))) return false;
			}
			return true;
		}
		if (ctor === ArrayBuffer) {
			foo = new Uint8Array(foo);
			bar = new Uint8Array(bar);
		} else if (ctor === DataView) {
			if ((len = foo.byteLength) === bar.byteLength) while (len-- && foo.getInt8(len) === bar.getInt8(len));
			return len === -1;
		}
		if (ArrayBuffer.isView(foo)) {
			if ((len = foo.byteLength) === bar.byteLength) while (len-- && foo[len] === bar[len]);
			return len === -1;
		}
		if (!ctor || typeof foo === "object") {
			len = 0;
			for (ctor in foo) {
				if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
				if (!(ctor in bar) || !dequal(foo[ctor], bar[ctor])) return false;
			}
			return Object.keys(bar).length === len;
		}
	}
	return foo !== foo && bar !== bar;
}
//#endregion
//#region node_modules/kleur/index.mjs
var FORCE_COLOR;
var NODE_DISABLE_COLORS;
var NO_COLOR;
var TERM;
var isTTY = true;
if (typeof process !== "undefined") {
	({FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM} = process.env || {});
	isTTY = process.stdout && process.stdout.isTTY;
}
var $ = {
	enabled: !NODE_DISABLE_COLORS && NO_COLOR == null && TERM !== "dumb" && (FORCE_COLOR != null && FORCE_COLOR !== "0" || isTTY),
	reset: init(0, 0),
	bold: init(1, 22),
	dim: init(2, 22),
	italic: init(3, 23),
	underline: init(4, 24),
	inverse: init(7, 27),
	hidden: init(8, 28),
	strikethrough: init(9, 29),
	black: init(30, 39),
	red: init(31, 39),
	green: init(32, 39),
	yellow: init(33, 39),
	blue: init(34, 39),
	magenta: init(35, 39),
	cyan: init(36, 39),
	white: init(37, 39),
	gray: init(90, 39),
	grey: init(90, 39),
	bgBlack: init(40, 49),
	bgRed: init(41, 49),
	bgGreen: init(42, 49),
	bgYellow: init(43, 49),
	bgBlue: init(44, 49),
	bgMagenta: init(45, 49),
	bgCyan: init(46, 49),
	bgWhite: init(47, 49)
};
function run(arr, str) {
	let i = 0, tmp, beg = "", end = "";
	for (; i < arr.length; i++) {
		tmp = arr[i];
		beg += tmp.open;
		end += tmp.close;
		if (!!~str.indexOf(tmp.close)) str = str.replace(tmp.rgx, tmp.close + tmp.open);
	}
	return beg + str + end;
}
function chain(has, keys) {
	let ctx = {
		has,
		keys
	};
	ctx.reset = $.reset.bind(ctx);
	ctx.bold = $.bold.bind(ctx);
	ctx.dim = $.dim.bind(ctx);
	ctx.italic = $.italic.bind(ctx);
	ctx.underline = $.underline.bind(ctx);
	ctx.inverse = $.inverse.bind(ctx);
	ctx.hidden = $.hidden.bind(ctx);
	ctx.strikethrough = $.strikethrough.bind(ctx);
	ctx.black = $.black.bind(ctx);
	ctx.red = $.red.bind(ctx);
	ctx.green = $.green.bind(ctx);
	ctx.yellow = $.yellow.bind(ctx);
	ctx.blue = $.blue.bind(ctx);
	ctx.magenta = $.magenta.bind(ctx);
	ctx.cyan = $.cyan.bind(ctx);
	ctx.white = $.white.bind(ctx);
	ctx.gray = $.gray.bind(ctx);
	ctx.grey = $.grey.bind(ctx);
	ctx.bgBlack = $.bgBlack.bind(ctx);
	ctx.bgRed = $.bgRed.bind(ctx);
	ctx.bgGreen = $.bgGreen.bind(ctx);
	ctx.bgYellow = $.bgYellow.bind(ctx);
	ctx.bgBlue = $.bgBlue.bind(ctx);
	ctx.bgMagenta = $.bgMagenta.bind(ctx);
	ctx.bgCyan = $.bgCyan.bind(ctx);
	ctx.bgWhite = $.bgWhite.bind(ctx);
	return ctx;
}
function init(open, close) {
	let blk = {
		open: `\x1b[${open}m`,
		close: `\x1b[${close}m`,
		rgx: new RegExp(`\\x1b\\[${close}m`, "g")
	};
	return function(txt) {
		if (this !== void 0 && this.has !== void 0) {
			~this.has.indexOf(open) || (this.has.push(open), this.keys.push(blk));
			return txt === void 0 ? this : $.enabled ? run(this.keys, txt + "") : txt + "";
		}
		return txt === void 0 ? chain([open], [blk]) : $.enabled ? run([blk], txt + "") : txt + "";
	};
}
//#endregion
//#region node_modules/diff/lib/index.mjs
function Diff() {}
Diff.prototype = {
	diff: function diff(oldString, newString) {
		var _options$timeout;
		var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
		var callback = options.callback;
		if (typeof options === "function") {
			callback = options;
			options = {};
		}
		this.options = options;
		var self = this;
		function done(value) {
			if (callback) {
				setTimeout(function() {
					callback(void 0, value);
				}, 0);
				return true;
			} else return value;
		}
		oldString = this.castInput(oldString);
		newString = this.castInput(newString);
		oldString = this.removeEmpty(this.tokenize(oldString));
		newString = this.removeEmpty(this.tokenize(newString));
		var newLen = newString.length, oldLen = oldString.length;
		var editLength = 1;
		var maxEditLength = newLen + oldLen;
		if (options.maxEditLength) maxEditLength = Math.min(maxEditLength, options.maxEditLength);
		var maxExecutionTime = (_options$timeout = options.timeout) !== null && _options$timeout !== void 0 ? _options$timeout : Infinity;
		var abortAfterTimestamp = Date.now() + maxExecutionTime;
		var bestPath = [{
			oldPos: -1,
			lastComponent: void 0
		}];
		var newPos = this.extractCommon(bestPath[0], newString, oldString, 0);
		if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) return done([{
			value: this.join(newString),
			count: newString.length
		}]);
		var minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
		function execEditLength() {
			for (var diagonalPath = Math.max(minDiagonalToConsider, -editLength); diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
				var basePath = void 0;
				var removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
				if (removePath) bestPath[diagonalPath - 1] = void 0;
				var canAdd = false;
				if (addPath) {
					var addPathNewPos = addPath.oldPos - diagonalPath;
					canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
				}
				var canRemove = removePath && removePath.oldPos + 1 < oldLen;
				if (!canAdd && !canRemove) {
					bestPath[diagonalPath] = void 0;
					continue;
				}
				if (!canRemove || canAdd && removePath.oldPos + 1 < addPath.oldPos) basePath = self.addToPath(addPath, true, void 0, 0);
				else basePath = self.addToPath(removePath, void 0, true, 1);
				newPos = self.extractCommon(basePath, newString, oldString, diagonalPath);
				if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) return done(buildValues(self, basePath.lastComponent, newString, oldString, self.useLongestToken));
				else {
					bestPath[diagonalPath] = basePath;
					if (basePath.oldPos + 1 >= oldLen) maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
					if (newPos + 1 >= newLen) minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
				}
			}
			editLength++;
		}
		if (callback) (function exec() {
			setTimeout(function() {
				if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) return callback();
				if (!execEditLength()) exec();
			}, 0);
		})();
		else while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
			var ret = execEditLength();
			if (ret) return ret;
		}
	},
	addToPath: function addToPath(path, added, removed, oldPosInc) {
		var last = path.lastComponent;
		if (last && last.added === added && last.removed === removed) return {
			oldPos: path.oldPos + oldPosInc,
			lastComponent: {
				count: last.count + 1,
				added,
				removed,
				previousComponent: last.previousComponent
			}
		};
		else return {
			oldPos: path.oldPos + oldPosInc,
			lastComponent: {
				count: 1,
				added,
				removed,
				previousComponent: last
			}
		};
	},
	extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
		var newLen = newString.length, oldLen = oldString.length, oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
		while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
			newPos++;
			oldPos++;
			commonCount++;
		}
		if (commonCount) basePath.lastComponent = {
			count: commonCount,
			previousComponent: basePath.lastComponent
		};
		basePath.oldPos = oldPos;
		return newPos;
	},
	equals: function equals(left, right) {
		if (this.options.comparator) return this.options.comparator(left, right);
		else return left === right || this.options.ignoreCase && left.toLowerCase() === right.toLowerCase();
	},
	removeEmpty: function removeEmpty(array) {
		var ret = [];
		for (var i = 0; i < array.length; i++) if (array[i]) ret.push(array[i]);
		return ret;
	},
	castInput: function castInput(value) {
		return value;
	},
	tokenize: function tokenize(value) {
		return value.split("");
	},
	join: function join(chars) {
		return chars.join("");
	}
};
function buildValues(diff, lastComponent, newString, oldString, useLongestToken) {
	var components = [];
	var nextComponent;
	while (lastComponent) {
		components.push(lastComponent);
		nextComponent = lastComponent.previousComponent;
		delete lastComponent.previousComponent;
		lastComponent = nextComponent;
	}
	components.reverse();
	var componentPos = 0, componentLen = components.length, newPos = 0, oldPos = 0;
	for (; componentPos < componentLen; componentPos++) {
		var component = components[componentPos];
		if (!component.removed) {
			if (!component.added && useLongestToken) {
				var value = newString.slice(newPos, newPos + component.count);
				value = value.map(function(value, i) {
					var oldValue = oldString[oldPos + i];
					return oldValue.length > value.length ? oldValue : value;
				});
				component.value = diff.join(value);
			} else component.value = diff.join(newString.slice(newPos, newPos + component.count));
			newPos += component.count;
			if (!component.added) oldPos += component.count;
		} else {
			component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
			oldPos += component.count;
			if (componentPos && components[componentPos - 1].added) {
				var tmp = components[componentPos - 1];
				components[componentPos - 1] = components[componentPos];
				components[componentPos] = tmp;
			}
		}
	}
	var finalComponent = components[componentLen - 1];
	if (componentLen > 1 && typeof finalComponent.value === "string" && (finalComponent.added || finalComponent.removed) && diff.equals("", finalComponent.value)) {
		components[componentLen - 2].value += finalComponent.value;
		components.pop();
	}
	return components;
}
var characterDiff = new Diff();
function diffChars(oldStr, newStr, options) {
	return characterDiff.diff(oldStr, newStr, options);
}
var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;
var reWhitespace = /\S/;
var wordDiff = new Diff();
wordDiff.equals = function(left, right) {
	if (this.options.ignoreCase) {
		left = left.toLowerCase();
		right = right.toLowerCase();
	}
	return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
};
wordDiff.tokenize = function(value) {
	var tokens = value.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/);
	for (var i = 0; i < tokens.length - 1; i++) if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
		tokens[i] += tokens[i + 2];
		tokens.splice(i + 1, 2);
		i--;
	}
	return tokens;
};
var lineDiff = new Diff();
lineDiff.tokenize = function(value) {
	if (this.options.stripTrailingCr) value = value.replace(/\r\n/g, "\n");
	var retLines = [], linesAndNewlines = value.split(/(\n|\r\n)/);
	if (!linesAndNewlines[linesAndNewlines.length - 1]) linesAndNewlines.pop();
	for (var i = 0; i < linesAndNewlines.length; i++) {
		var line = linesAndNewlines[i];
		if (i % 2 && !this.options.newlineIsToken) retLines[retLines.length - 1] += line;
		else {
			if (this.options.ignoreWhitespace) line = line.trim();
			retLines.push(line);
		}
	}
	return retLines;
};
function diffLines(oldStr, newStr, callback) {
	return lineDiff.diff(oldStr, newStr, callback);
}
var sentenceDiff = new Diff();
sentenceDiff.tokenize = function(value) {
	return value.split(/(\S.+?[.!?])(?=\s+|$)/);
};
var cssDiff = new Diff();
cssDiff.tokenize = function(value) {
	return value.split(/([{}:;,]|\s+)/);
};
function _typeof(obj) {
	"@babel/helpers - typeof";
	if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") _typeof = function(obj) {
		return typeof obj;
	};
	else _typeof = function(obj) {
		return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	};
	return _typeof(obj);
}
var objectPrototypeToString = Object.prototype.toString;
var jsonDiff = new Diff();
jsonDiff.useLongestToken = true;
jsonDiff.tokenize = lineDiff.tokenize;
jsonDiff.castInput = function(value) {
	var _this$options = this.options, undefinedReplacement = _this$options.undefinedReplacement, _this$options$stringi = _this$options.stringifyReplacer, stringifyReplacer = _this$options$stringi === void 0 ? function(k, v) {
		return typeof v === "undefined" ? undefinedReplacement : v;
	} : _this$options$stringi;
	return typeof value === "string" ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), stringifyReplacer, "  ");
};
jsonDiff.equals = function(left, right) {
	return Diff.prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, "$1"), right.replace(/,([\r\n])/g, "$1"));
};
function canonicalize(obj, stack, replacementStack, replacer, key) {
	stack = stack || [];
	replacementStack = replacementStack || [];
	if (replacer) obj = replacer(key, obj);
	var i;
	for (i = 0; i < stack.length; i += 1) if (stack[i] === obj) return replacementStack[i];
	var canonicalizedObj;
	if ("[object Array]" === objectPrototypeToString.call(obj)) {
		stack.push(obj);
		canonicalizedObj = new Array(obj.length);
		replacementStack.push(canonicalizedObj);
		for (i = 0; i < obj.length; i += 1) canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, key);
		stack.pop();
		replacementStack.pop();
		return canonicalizedObj;
	}
	if (obj && obj.toJSON) obj = obj.toJSON();
	if (_typeof(obj) === "object" && obj !== null) {
		stack.push(obj);
		canonicalizedObj = {};
		replacementStack.push(canonicalizedObj);
		var sortedKeys = [], _key;
		for (_key in obj)
 /* istanbul ignore else */
		if (obj.hasOwnProperty(_key)) sortedKeys.push(_key);
		sortedKeys.sort();
		for (i = 0; i < sortedKeys.length; i += 1) {
			_key = sortedKeys[i];
			canonicalizedObj[_key] = canonicalize(obj[_key], stack, replacementStack, replacer, _key);
		}
		stack.pop();
		replacementStack.pop();
	} else canonicalizedObj = obj;
	return canonicalizedObj;
}
var arrayDiff = new Diff();
arrayDiff.tokenize = function(value) {
	return value.slice();
};
arrayDiff.join = arrayDiff.removeEmpty = function(value) {
	return value;
};
function diffArrays(oldArr, newArr, callback) {
	return arrayDiff.diff(oldArr, newArr, callback);
}
//#endregion
//#region node_modules/uvu/diff/index.mjs
var colors = {
	"--": $.red,
	"··": $.grey,
	"++": $.green
};
var TITLE = $.dim().italic;
var TAB = $.dim("→");
var SPACE = $.dim("·");
var NL = $.dim("↵");
var LOG = (sym, str) => colors[sym](sym + PRETTY(str)) + "\n";
var LINE = (num, x) => $.dim("L" + String(num).padStart(x, "0") + " ");
var PRETTY = (str) => str.replace(/[ ]/g, SPACE).replace(/\t/g, TAB).replace(/(\r?\n)/g, NL);
function line(obj, prev, pad) {
	let char = obj.removed ? "--" : obj.added ? "++" : "··";
	let arr = obj.value.replace(/\r?\n$/, "").split("\n");
	let i = 0, tmp, out = "";
	if (obj.added) out += colors[char]().underline(TITLE("Expected:")) + "\n";
	else if (obj.removed) out += colors[char]().underline(TITLE("Actual:")) + "\n";
	for (; i < arr.length; i++) {
		tmp = arr[i];
		if (tmp != null) {
			if (prev) out += LINE(prev + i, pad);
			out += LOG(char, tmp || "\n");
		}
	}
	return out;
}
function arrays(input, expect) {
	let arr = diffArrays(input, expect);
	let i = 0, j = 0, k = 0, tmp, val, char, isObj, str;
	let out = LOG("··", "[");
	for (; i < arr.length; i++) {
		char = (tmp = arr[i]).removed ? "--" : tmp.added ? "++" : "··";
		if (tmp.added) out += colors[char]().underline(TITLE("Expected:")) + "\n";
		else if (tmp.removed) out += colors[char]().underline(TITLE("Actual:")) + "\n";
		for (j = 0; j < tmp.value.length; j++) {
			isObj = tmp.value[j] && typeof tmp.value[j] === "object";
			val = stringify(tmp.value[j]).split(/\r?\n/g);
			for (k = 0; k < val.length;) {
				str = "  " + val[k++] + (isObj ? "" : ",");
				if (isObj && k === val.length && j + 1 < tmp.value.length) str += ",";
				out += LOG(char, str);
			}
		}
	}
	return out + LOG("··", "]");
}
function lines(input, expect, linenum = 0) {
	let i = 0, tmp, output = "";
	let arr = diffLines(input, expect);
	let pad = String(expect.split(/\r?\n/g).length - linenum).length;
	for (; i < arr.length; i++) {
		output += line(tmp = arr[i], linenum, pad);
		if (linenum && !tmp.removed) linenum += tmp.count;
	}
	return output;
}
function chars(input, expect) {
	let arr = diffChars(input, expect);
	let i = 0, output = "", tmp;
	let l1 = input.length;
	let l2 = expect.length;
	let p1 = PRETTY(input);
	let p2 = PRETTY(expect);
	tmp = arr[i];
	if (l1 === l2) {} else if (tmp.removed && arr[i + 1]) {
		let del = tmp.count - arr[i + 1].count;
		if (del == 0) {} else if (del > 0) {
			expect = " ".repeat(del) + expect;
			p2 = " ".repeat(del) + p2;
			l2 += del;
		} else if (del < 0) {
			input = " ".repeat(-del) + input;
			p1 = " ".repeat(-del) + p1;
			l1 += -del;
		}
	}
	output += direct(p1, p2, l1, l2);
	if (l1 === l2) for (tmp = "  "; i < l1; i++) tmp += input[i] === expect[i] ? " " : "^";
	else for (tmp = "  "; i < arr.length; i++) {
		tmp += (arr[i].added || arr[i].removed ? "^" : " ").repeat(Math.max(arr[i].count, 0));
		if (i + 1 < arr.length && (arr[i].added && arr[i + 1].removed || arr[i].removed && arr[i + 1].added)) arr[i + 1].count -= arr[i].count;
	}
	return output + $.red(tmp);
}
function direct(input, expect, lenA = String(input).length, lenB = String(expect).length) {
	let gutter = 4;
	let lenC = Math.max(lenA, lenB);
	let typeA = typeof input, typeB = typeof expect;
	if (typeA !== typeB) {
		gutter = 2;
		let delA = gutter + lenC - lenA;
		let delB = gutter + lenC - lenB;
		input += " ".repeat(delA) + $.dim(`[${typeA}]`);
		expect += " ".repeat(delB) + $.dim(`[${typeB}]`);
		lenA += delA + typeA.length + 2;
		lenB += delB + typeB.length + 2;
		lenC = Math.max(lenA, lenB);
	}
	return colors["++"]("++" + expect + " ".repeat(gutter + lenC - lenB) + TITLE("(Expected)")) + "\n" + colors["--"]("--" + input + " ".repeat(gutter + lenC - lenA) + TITLE("(Actual)")) + "\n";
}
function sort(input, expect) {
	var k, i = 0, tmp, isArr = Array.isArray(input);
	var keys = [], out = isArr ? Array(input.length) : {};
	if (isArr) for (i = 0; i < out.length; i++) {
		tmp = input[i];
		if (!tmp || typeof tmp !== "object") out[i] = tmp;
		else out[i] = sort(tmp, expect[i]);
	}
	else {
		for (k in expect) keys.push(k);
		for (; i < keys.length; i++) if (Object.prototype.hasOwnProperty.call(input, k = keys[i])) if (!(tmp = input[k]) || typeof tmp !== "object") out[k] = tmp;
		else out[k] = sort(tmp, expect[k]);
		for (k in input) if (!out.hasOwnProperty(k)) out[k] = input[k];
	}
	return out;
}
function circular() {
	var cache = /* @__PURE__ */ new Set();
	return function print(key, val) {
		if (val === void 0) return "[__VOID__]";
		if (typeof val === "number" && val !== val) return "[__NAN__]";
		if (typeof val === "bigint") return val.toString();
		if (!val || typeof val !== "object") return val;
		if (cache.has(val)) return "[Circular]";
		cache.add(val);
		return val;
	};
}
function stringify(input) {
	return JSON.stringify(input, circular(), 2).replace(/"\[__NAN__\]"/g, "NaN").replace(/"\[__VOID__\]"/g, "undefined");
}
function compare(input, expect) {
	if (Array.isArray(expect) && Array.isArray(input)) return arrays(input, expect);
	if (expect instanceof RegExp) return chars("" + input, "" + expect);
	let isA = input && typeof input == "object";
	let isB = expect && typeof expect == "object";
	if (isA && isB) input = sort(input, expect);
	if (isB) expect = stringify(expect);
	if (isA) input = stringify(input);
	if (expect && typeof expect == "object") {
		input = stringify(sort(input, expect));
		expect = stringify(expect);
	}
	isA = typeof input == "string";
	isB = typeof expect == "string";
	if (isA && /\r?\n/.test(input)) return lines(input, "" + expect);
	if (isB && /\r?\n/.test(expect)) return lines("" + input, expect);
	if (isA && isB) return chars(input, expect);
	return direct(input, expect);
}
//#endregion
//#region node_modules/uvu/assert/index.mjs
function dedent(str) {
	str = str.replace(/\r?\n/g, "\n");
	let arr = str.match(/^[ \t]*(?=\S)/gm);
	let i = 0, min = Infinity, len = (arr || []).length;
	for (; i < len; i++) min = Math.min(min, arr[i].length);
	return len && min ? str.replace(new RegExp(`^[ \\t]{${min}}`, "gm"), "") : str;
}
var Assertion = class extends Error {
	constructor(opts = {}) {
		super(opts.message);
		this.name = "Assertion";
		this.code = "ERR_ASSERTION";
		if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
		this.details = opts.details || false;
		this.generated = !!opts.generated;
		this.operator = opts.operator;
		this.expects = opts.expects;
		this.actual = opts.actual;
	}
};
function assert(bool, actual, expects, operator, detailer, backup, msg) {
	if (bool) return;
	let message = msg || backup;
	if (msg instanceof Error) throw msg;
	throw new Assertion({
		actual,
		expects,
		operator,
		message,
		details: detailer && detailer(actual, expects),
		generated: !msg
	});
}
function ok(val, msg) {
	assert(!!val, false, true, "ok", false, "Expected value to be truthy", msg);
}
function is(val, exp, msg) {
	assert(val === exp, val, exp, "is", compare, "Expected values to be strictly equal:", msg);
}
function not(val, msg) {
	assert(!val, true, false, "not", false, "Expected value to be falsey", msg);
}
not.ok = not;
is.not = function(val, exp, msg) {
	assert(val !== exp, val, exp, "is.not", false, "Expected values not to be strictly equal", msg);
};
not.equal = function(val, exp, msg) {
	assert(!dequal(val, exp), val, exp, "not.equal", false, "Expected values not to be deeply equal", msg);
};
not.type = function(val, exp, msg) {
	let tmp = typeof val;
	assert(tmp !== exp, tmp, exp, "not.type", false, `Expected "${tmp}" not to be "${exp}"`, msg);
};
not.instance = function(val, exp, msg) {
	let name = "`" + (exp.name || exp.constructor.name) + "`";
	assert(!(val instanceof exp), val, exp, "not.instance", false, `Expected value not to be an instance of ${name}`, msg);
};
not.snapshot = function(val, exp, msg) {
	val = dedent(val);
	exp = dedent(exp);
	assert(val !== exp, val, exp, "not.snapshot", false, "Expected value not to match snapshot", msg);
};
not.fixture = function(val, exp, msg) {
	val = dedent(val);
	exp = dedent(exp);
	assert(val !== exp, val, exp, "not.fixture", false, "Expected value not to match fixture", msg);
};
not.match = function(val, exp, msg) {
	if (typeof exp === "string") assert(!val.includes(exp), val, exp, "not.match", false, `Expected value not to include "${exp}" substring`, msg);
	else assert(!exp.test(val), val, exp, "not.match", false, `Expected value not to match \`${String(exp)}\` pattern`, msg);
};
not.throws = function(blk, exp, msg) {
	if (!msg && typeof exp === "string") {
		msg = exp;
		exp = null;
	}
	try {
		blk();
	} catch (err) {
		if (typeof exp === "function") assert(!exp(err), true, false, "not.throws", false, "Expected function not to throw matching exception", msg);
		else if (exp instanceof RegExp) assert(!exp.test(err.message), true, false, "not.throws", false, `Expected function not to throw exception matching \`${String(exp)}\` pattern`, msg);
		else if (!exp) assert(false, true, false, "not.throws", false, "Expected function not to throw", msg);
	}
};
//#endregion
//#region node_modules/micromark-factory-space/dev/index.js
/**
* @typedef {import('micromark-util-types').Effects} Effects
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenType} TokenType
*/
/**
* Parse spaces and tabs.
*
* There is no `nok` parameter:
*
* *   spaces in markdown are often optional, in which case this factory can be
*     used and `ok` will be switched to whether spaces were found or not
* *   one line ending or space can be detected with `markdownSpace(code)` right
*     before using `factorySpace`
*
* ###### Examples
*
* Where `␉` represents a tab (plus how much it expands) and `␠` represents a
* single space.
*
* ```markdown
* ␉
* ␠␠␠␠
* ␉␠
* ```
*
* @param {Effects} effects
*   Context.
* @param {State} ok
*   State switched to when successful.
* @param {TokenType} type
*   Type (`' \t'`).
* @param {number | undefined} [max=Infinity]
*   Max (exclusive).
* @returns
*   Start state.
*/
function factorySpace(effects, ok, type, max) {
	const limit = max ? max - 1 : Number.POSITIVE_INFINITY;
	let size = 0;
	return start;
	/** @type {State} */
	function start(code) {
		if (markdownSpace(code)) {
			effects.enter(type);
			return prefix(code);
		}
		return ok(code);
	}
	/** @type {State} */
	function prefix(code) {
		if (markdownSpace(code) && size++ < limit) {
			effects.consume(code);
			return prefix;
		}
		effects.exit(type);
		return ok(code);
	}
}
//#endregion
export { constants as _, asciiAlphanumeric as a, asciiDigit as c, markdownLineEnding as d, markdownLineEndingOrSpace as f, codes as g, unicodeWhitespace as h, asciiAlpha as i, asciiHexDigit as l, unicodePunctuation as m, ok as n, asciiAtext as o, markdownSpace as p, types as r, asciiControl as s, factorySpace as t, asciiPunctuation as u };
