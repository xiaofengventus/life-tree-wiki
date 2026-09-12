import { o as __toESM, r as __exportAll, t as __commonJSMin } from "./rolldown-runtime-D1cXj70v.js";
import { _ as constants, a as asciiAlphanumeric, c as asciiDigit, d as markdownLineEnding, f as markdownLineEndingOrSpace, g as codes, i as asciiAlpha, l as asciiHexDigit, n as ok, o as asciiAtext, p as markdownSpace, r as types, s as asciiControl, t as factorySpace, u as asciiPunctuation } from "./dev-Zw4g8Z-R.js";
import { a as normalizeIdentifier, c as combineExtensions, d as splice, i as sanitizeUri, l as combineHtmlExtensions, n as resolveAll, o as encode, r as classifyCharacter, s as values, t as blankLine, u as push } from "./blank-line-CUN1gS5u.js";
//#region node_modules/decode-named-character-reference/index.dom.js
var element = document.createElement("i");
/**
* @param {string} value
* @returns {string | false}
*/
function decodeNamedCharacterReference(value) {
	const characterReference = "&" + value + ";";
	element.innerHTML = characterReference;
	const character = element.textContent;
	if (character.charCodeAt(character.length - 1) === 59 && value !== "semi") return false;
	return character === characterReference ? false : character;
}
//#endregion
//#region node_modules/micromark-util-decode-numeric-character-reference/dev/index.js
/**
* Turn the number (in string form as either hexa- or plain decimal) coming from
* a numeric character reference into a character.
*
* Sort of like `String.fromCharCode(Number.parseInt(value, base))`, but makes
* non-characters and control characters safe.
*
* @param {string} value
*   Value to decode.
* @param {number} base
*   Numeric base.
* @returns {string}
*   Character.
*/
function decodeNumericCharacterReference(value, base) {
	const code = Number.parseInt(value, base);
	if (code < codes.ht || code === codes.vt || code > codes.cr && code < codes.space || code > codes.tilde && code < 160 || code > 55295 && code < 57344 || code > 64975 && code < 65008 || (code & 65535) === 65535 || (code & 65535) === 65534 || code > 1114111) return values.replacementCharacter;
	return String.fromCharCode(code);
}
//#endregion
//#region node_modules/micromark/dev/lib/compile.js
/**
* While micromark is a lexer/tokenizer, the common case of going from markdown
* to html is currently built in as this module, even though the parts can be
* used separately to build ASTs, CSTs, or many other output formats.
*
* Having an HTML compiler built in is useful because it allows us to check for
* compliancy to CommonMark, the de facto norm of markdown, specified in roughly
* 600 input/output cases.
*
* This module has an interface that accepts lists of events instead of the
* whole at once, however, because markdown can’t be truly streaming, we buffer
* events before processing and outputting the final result.
*/
/**
* @typedef {import('micromark-util-types').Compile} Compile
* @typedef {import('micromark-util-types').CompileContext} CompileContext
* @typedef {import('micromark-util-types').CompileData} CompileData
* @typedef {import('micromark-util-types').CompileOptions} CompileOptions
* @typedef {import('micromark-util-types').Definition} Definition
* @typedef {import('micromark-util-types').Event} Event
* @typedef {import('micromark-util-types').Handle} Handle
* @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
* @typedef {import('micromark-util-types').NormalizedHtmlExtension} NormalizedHtmlExtension
* @typedef {import('micromark-util-types').Token} Token
*/
/**
* @typedef Media
* @property {boolean | undefined} [image]
* @property {string | undefined} [labelId]
* @property {string | undefined} [label]
* @property {string | undefined} [referenceId]
* @property {string | undefined} [destination]
* @property {string | undefined} [title]
*/
var hasOwnProperty = {}.hasOwnProperty;
/**
* These two are allowlists of safe protocols for full URLs in respectively the
* `href` (on `<a>`) and `src` (on `<img>`) attributes.
* They are based on what is allowed on GitHub,
* <https://github.com/syntax-tree/hast-util-sanitize/blob/9275b21/lib/github.json#L31>
*/
var protocolHref = /^(https?|ircs?|mailto|xmpp)$/i;
var protocolSrc = /^https?$/i;
/**
* @param {CompileOptions | null | undefined} [options]
* @returns {Compile}
*/
function compile(options) {
	const settings = options || {};
	/**
	* Tags is needed because according to markdown, links and emphasis and
	* whatnot can exist in images, however, as HTML doesn’t allow content in
	* images, the tags are ignored in the `alt` attribute, but the content
	* remains.
	*
	* @type {boolean | undefined}
	*/
	let tags = true;
	/**
	* An object to track identifiers to media (URLs and titles) defined with
	* definitions.
	*
	* @type {Record<string, Definition>}
	*/
	const definitions = {};
	/**
	* A lot of the handlers need to capture some of the output data, modify it
	* somehow, and then deal with it.
	* We do that by tracking a stack of buffers, that can be opened (with
	* `buffer`) and closed (with `resume`) to access them.
	*
	* @type {Array<Array<string>>}
	*/
	const buffers = [[]];
	/**
	* As we can have links in images and the other way around, where the deepest
	* ones are closed first, we need to track which one we’re in.
	*
	* @type {Array<Media>}
	*/
	const mediaStack = [];
	/**
	* Same as `mediaStack` for tightness, which is specific to lists.
	* We need to track if we’re currently in a tight or loose container.
	*
	* @type {Array<boolean>}
	*/
	const tightStack = [];
	/**
	* Combine the HTML extensions with the default handlers.
	* An HTML extension is an object whose fields are either `enter` or `exit`
	* (reflecting whether a token is entered or exited).
	* The values at such objects are names of tokens mapping to handlers.
	* Handlers are called, respectively when a token is opener or closed, with
	* that token, and a context as `this`.
	*/
	const handlers = combineHtmlExtensions([{
		enter: {
			blockQuote: onenterblockquote,
			codeFenced: onentercodefenced,
			codeFencedFenceInfo: buffer,
			codeFencedFenceMeta: buffer,
			codeIndented: onentercodeindented,
			codeText: onentercodetext,
			content: onentercontent,
			definition: onenterdefinition,
			definitionDestinationString: onenterdefinitiondestinationstring,
			definitionLabelString: buffer,
			definitionTitleString: buffer,
			emphasis: onenteremphasis,
			htmlFlow: onenterhtmlflow,
			htmlText: onenterhtml,
			image: onenterimage,
			label: buffer,
			link: onenterlink,
			listItemMarker: onenterlistitemmarker,
			listItemValue: onenterlistitemvalue,
			listOrdered: onenterlistordered,
			listUnordered: onenterlistunordered,
			paragraph: onenterparagraph,
			reference: buffer,
			resource: onenterresource,
			resourceDestinationString: onenterresourcedestinationstring,
			resourceTitleString: buffer,
			setextHeading: onentersetextheading,
			strong: onenterstrong
		},
		exit: {
			atxHeading: onexitatxheading,
			atxHeadingSequence: onexitatxheadingsequence,
			autolinkEmail: onexitautolinkemail,
			autolinkProtocol: onexitautolinkprotocol,
			blockQuote: onexitblockquote,
			characterEscapeValue: onexitdata,
			characterReferenceMarkerHexadecimal: onexitcharacterreferencemarker,
			characterReferenceMarkerNumeric: onexitcharacterreferencemarker,
			characterReferenceValue: onexitcharacterreferencevalue,
			codeFenced: onexitflowcode,
			codeFencedFence: onexitcodefencedfence,
			codeFencedFenceInfo: onexitcodefencedfenceinfo,
			codeFencedFenceMeta: resume,
			codeFlowValue: onexitcodeflowvalue,
			codeIndented: onexitflowcode,
			codeText: onexitcodetext,
			codeTextData: onexitdata,
			data: onexitdata,
			definition: onexitdefinition,
			definitionDestinationString: onexitdefinitiondestinationstring,
			definitionLabelString: onexitdefinitionlabelstring,
			definitionTitleString: onexitdefinitiontitlestring,
			emphasis: onexitemphasis,
			hardBreakEscape: onexithardbreak,
			hardBreakTrailing: onexithardbreak,
			htmlFlow: onexithtml,
			htmlFlowData: onexitdata,
			htmlText: onexithtml,
			htmlTextData: onexitdata,
			image: onexitmedia,
			label: onexitlabel,
			labelText: onexitlabeltext,
			lineEnding: onexitlineending,
			link: onexitmedia,
			listOrdered: onexitlistordered,
			listUnordered: onexitlistunordered,
			paragraph: onexitparagraph,
			reference: resume,
			referenceString: onexitreferencestring,
			resource: resume,
			resourceDestinationString: onexitresourcedestinationstring,
			resourceTitleString: onexitresourcetitlestring,
			setextHeading: onexitsetextheading,
			setextHeadingLineSequence: onexitsetextheadinglinesequence,
			setextHeadingText: onexitsetextheadingtext,
			strong: onexitstrong,
			thematicBreak: onexitthematicbreak
		}
	}].concat(settings.htmlExtensions || []));
	/**
	* Handlers do often need to keep track of some state.
	* That state is provided here as a key-value store (an object).
	*
	* @type {CompileData}
	*/
	const data = {
		tightStack,
		definitions
	};
	/**
	* The context for handlers references a couple of useful functions.
	* In handlers from extensions, those can be accessed at `this`.
	* For the handlers here, they can be accessed directly.
	*
	* @type {Omit<CompileContext, 'sliceSerialize'>}
	*/
	const context = {
		lineEndingIfNeeded,
		options: settings,
		encode: encode$1,
		raw,
		tag,
		buffer,
		resume,
		setData,
		getData
	};
	/**
	* Generally, micromark copies line endings (`'\r'`, `'\n'`, `'\r\n'`) in the
	* markdown document over to the compiled HTML.
	* In some cases, such as `> a`, CommonMark requires that extra line endings
	* are added: `<blockquote>\n<p>a</p>\n</blockquote>`.
	* This variable hold the default line ending when given (or `undefined`),
	* and in the latter case will be updated to the first found line ending if
	* there is one.
	*/
	let lineEndingStyle = settings.defaultLineEnding;
	return compile;
	/**
	* Deal w/ a slice of events.
	* Return either the empty string if there’s nothing of note to return, or the
	* result when done.
	*
	* @param {Array<Event>} events
	* @returns {string}
	*/
	function compile(events) {
		let index = -1;
		let start = 0;
		/** @type {Array<number>} */
		const listStack = [];
		/** @type {Array<Event>} */
		let head = [];
		/** @type {Array<Event>} */
		let body = [];
		while (++index < events.length) {
			if (!lineEndingStyle && (events[index][1].type === types.lineEnding || events[index][1].type === types.lineEndingBlank)) lineEndingStyle = events[index][2].sliceSerialize(events[index][1]);
			if (events[index][1].type === types.listOrdered || events[index][1].type === types.listUnordered) if (events[index][0] === "enter") listStack.push(index);
			else prepareList(events.slice(listStack.pop(), index));
			if (events[index][1].type === types.definition) if (events[index][0] === "enter") {
				body = push(body, events.slice(start, index));
				start = index;
			} else {
				head = push(head, events.slice(start, index + 1));
				start = index + 1;
			}
		}
		head = push(head, body);
		head = push(head, events.slice(start));
		index = -1;
		const result = head;
		if (handlers.enter.null) handlers.enter.null.call(context);
		while (++index < events.length) {
			const handles = handlers[result[index][0]];
			const kind = result[index][1].type;
			const handle = handles[kind];
			if (hasOwnProperty.call(handles, kind) && handle) handle.call(Object.assign({ sliceSerialize: result[index][2].sliceSerialize }, context), result[index][1]);
		}
		if (handlers.exit.null) handlers.exit.null.call(context);
		return buffers[0].join("");
	}
	/**
	* Figure out whether lists are loose or not.
	*
	* @param {Array<Event>} slice
	* @returns {void}
	*/
	function prepareList(slice) {
		const length = slice.length;
		let index = 0;
		let containerBalance = 0;
		let loose = false;
		/** @type {boolean | undefined} */
		let atMarker;
		while (++index < length) {
			const event = slice[index];
			if (event[1]._container) {
				atMarker = void 0;
				if (event[0] === "enter") containerBalance++;
				else containerBalance--;
			} else switch (event[1].type) {
				case types.listItemPrefix:
					if (event[0] === "exit") atMarker = true;
					break;
				case types.linePrefix: break;
				case types.lineEndingBlank:
					if (event[0] === "enter" && !containerBalance) if (atMarker) atMarker = void 0;
					else loose = true;
					break;
				default: atMarker = void 0;
			}
		}
		slice[0][1]._loose = loose;
	}
	/**
	* @type {CompileContext['setData']}
	*/
	function setData(key, value) {
		data[key] = value;
	}
	/**
	* @type {CompileContext['getData']}
	*/
	function getData(key) {
		return data[key];
	}
	/** @type {CompileContext['buffer']} */
	function buffer() {
		buffers.push([]);
	}
	/** @type {CompileContext['resume']} */
	function resume() {
		const buf = buffers.pop();
		ok(buf !== void 0, "Cannot resume w/o buffer");
		return buf.join("");
	}
	/** @type {CompileContext['tag']} */
	function tag(value) {
		if (!tags) return;
		setData("lastWasTag", true);
		buffers[buffers.length - 1].push(value);
	}
	/** @type {CompileContext['raw']} */
	function raw(value) {
		setData("lastWasTag");
		buffers[buffers.length - 1].push(value);
	}
	/**
	* Output an extra line ending.
	*
	* @returns {void}
	*/
	function lineEnding() {
		raw(lineEndingStyle || "\n");
	}
	/** @type {CompileContext['lineEndingIfNeeded']} */
	function lineEndingIfNeeded() {
		const buffer = buffers[buffers.length - 1];
		const slice = buffer[buffer.length - 1];
		const previous = slice ? slice.charCodeAt(slice.length - 1) : codes.eof;
		if (previous === codes.lf || previous === codes.cr || previous === codes.eof) return;
		lineEnding();
	}
	/** @type {CompileContext['encode']} */
	function encode$1(value) {
		return getData("ignoreEncode") ? value : encode(value);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onenterlistordered(token) {
		tightStack.push(!token._loose);
		lineEndingIfNeeded();
		tag("<ol");
		setData("expectFirstItem", true);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onenterlistunordered(token) {
		tightStack.push(!token._loose);
		lineEndingIfNeeded();
		tag("<ul");
		setData("expectFirstItem", true);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onenterlistitemvalue(token) {
		if (getData("expectFirstItem")) {
			const value = Number.parseInt(this.sliceSerialize(token), constants.numericBaseDecimal);
			if (value !== 1) tag(" start=\"" + encode$1(String(value)) + "\"");
		}
	}
	function onenterlistitemmarker() {
		if (getData("expectFirstItem")) tag(">");
		else onexitlistitem();
		lineEndingIfNeeded();
		tag("<li>");
		setData("expectFirstItem");
		setData("lastWasTag");
	}
	function onexitlistordered() {
		onexitlistitem();
		tightStack.pop();
		lineEnding();
		tag("</ol>");
	}
	function onexitlistunordered() {
		onexitlistitem();
		tightStack.pop();
		lineEnding();
		tag("</ul>");
	}
	function onexitlistitem() {
		if (getData("lastWasTag") && !getData("slurpAllLineEndings")) lineEndingIfNeeded();
		tag("</li>");
		setData("slurpAllLineEndings");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onenterblockquote() {
		tightStack.push(false);
		lineEndingIfNeeded();
		tag("<blockquote>");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitblockquote() {
		tightStack.pop();
		lineEndingIfNeeded();
		tag("</blockquote>");
		setData("slurpAllLineEndings");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onenterparagraph() {
		if (!tightStack[tightStack.length - 1]) {
			lineEndingIfNeeded();
			tag("<p>");
		}
		setData("slurpAllLineEndings");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitparagraph() {
		if (tightStack[tightStack.length - 1]) setData("slurpAllLineEndings", true);
		else tag("</p>");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onentercodefenced() {
		lineEndingIfNeeded();
		tag("<pre><code");
		setData("fencesCount", 0);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitcodefencedfenceinfo() {
		tag(" class=\"language-" + resume() + "\"");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitcodefencedfence() {
		const count = getData("fencesCount") || 0;
		if (!count) {
			tag(">");
			setData("slurpOneLineEnding", true);
		}
		setData("fencesCount", count + 1);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onentercodeindented() {
		lineEndingIfNeeded();
		tag("<pre><code>");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitflowcode() {
		const count = getData("fencesCount");
		if (count !== void 0 && count < 2 && data.tightStack.length > 0 && !getData("lastWasTag")) lineEnding();
		if (getData("flowCodeSeenData")) lineEndingIfNeeded();
		tag("</code></pre>");
		if (count !== void 0 && count < 2) lineEndingIfNeeded();
		setData("flowCodeSeenData");
		setData("fencesCount");
		setData("slurpOneLineEnding");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onenterimage() {
		mediaStack.push({ image: true });
		tags = void 0;
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onenterlink() {
		mediaStack.push({});
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitlabeltext(token) {
		mediaStack[mediaStack.length - 1].labelId = this.sliceSerialize(token);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitlabel() {
		mediaStack[mediaStack.length - 1].label = resume();
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitreferencestring(token) {
		mediaStack[mediaStack.length - 1].referenceId = this.sliceSerialize(token);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onenterresource() {
		buffer();
		mediaStack[mediaStack.length - 1].destination = "";
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onenterresourcedestinationstring() {
		buffer();
		setData("ignoreEncode", true);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitresourcedestinationstring() {
		mediaStack[mediaStack.length - 1].destination = resume();
		setData("ignoreEncode");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitresourcetitlestring() {
		mediaStack[mediaStack.length - 1].title = resume();
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitmedia() {
		let index = mediaStack.length - 1;
		const media = mediaStack[index];
		const id = media.referenceId || media.labelId;
		ok(id !== void 0, "media should have `referenceId` or `labelId`");
		ok(media.label !== void 0, "media should have `label`");
		const context = media.destination === void 0 ? definitions[normalizeIdentifier(id)] : media;
		tags = true;
		while (index--) if (mediaStack[index].image) {
			tags = void 0;
			break;
		}
		if (media.image) {
			tag("<img src=\"" + sanitizeUri(context.destination, settings.allowDangerousProtocol ? void 0 : protocolSrc) + "\" alt=\"");
			raw(media.label);
			tag("\"");
		} else tag("<a href=\"" + sanitizeUri(context.destination, settings.allowDangerousProtocol ? void 0 : protocolHref) + "\"");
		tag(context.title ? " title=\"" + context.title + "\"" : "");
		if (media.image) tag(" />");
		else {
			tag(">");
			raw(media.label);
			tag("</a>");
		}
		mediaStack.pop();
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onenterdefinition() {
		buffer();
		mediaStack.push({});
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitdefinitionlabelstring(token) {
		resume();
		mediaStack[mediaStack.length - 1].labelId = this.sliceSerialize(token);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onenterdefinitiondestinationstring() {
		buffer();
		setData("ignoreEncode", true);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitdefinitiondestinationstring() {
		mediaStack[mediaStack.length - 1].destination = resume();
		setData("ignoreEncode");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitdefinitiontitlestring() {
		mediaStack[mediaStack.length - 1].title = resume();
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitdefinition() {
		const media = mediaStack[mediaStack.length - 1];
		ok(media.labelId !== void 0, "media should have `labelId`");
		const id = normalizeIdentifier(media.labelId);
		resume();
		if (!hasOwnProperty.call(definitions, id)) definitions[id] = mediaStack[mediaStack.length - 1];
		mediaStack.pop();
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onentercontent() {
		setData("slurpAllLineEndings", true);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitatxheadingsequence(token) {
		if (getData("headingRank")) return;
		setData("headingRank", this.sliceSerialize(token).length);
		lineEndingIfNeeded();
		tag("<h" + getData("headingRank") + ">");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onentersetextheading() {
		buffer();
		setData("slurpAllLineEndings");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitsetextheadingtext() {
		setData("slurpAllLineEndings", true);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitatxheading() {
		tag("</h" + getData("headingRank") + ">");
		setData("headingRank");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitsetextheadinglinesequence(token) {
		setData("headingRank", this.sliceSerialize(token).charCodeAt(0) === codes.equalsTo ? 1 : 2);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitsetextheading() {
		const value = resume();
		lineEndingIfNeeded();
		tag("<h" + getData("headingRank") + ">");
		raw(value);
		tag("</h" + getData("headingRank") + ">");
		setData("slurpAllLineEndings");
		setData("headingRank");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitdata(token) {
		raw(encode$1(this.sliceSerialize(token)));
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitlineending(token) {
		if (getData("slurpAllLineEndings")) return;
		if (getData("slurpOneLineEnding")) {
			setData("slurpOneLineEnding");
			return;
		}
		if (getData("inCodeText")) {
			raw(" ");
			return;
		}
		raw(encode$1(this.sliceSerialize(token)));
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitcodeflowvalue(token) {
		raw(encode$1(this.sliceSerialize(token)));
		setData("flowCodeSeenData", true);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexithardbreak() {
		tag("<br />");
	}
	function onenterhtmlflow() {
		lineEndingIfNeeded();
		onenterhtml();
	}
	function onexithtml() {
		setData("ignoreEncode");
	}
	function onenterhtml() {
		if (settings.allowDangerousHtml) setData("ignoreEncode", true);
	}
	function onenteremphasis() {
		tag("<em>");
	}
	function onenterstrong() {
		tag("<strong>");
	}
	function onentercodetext() {
		setData("inCodeText", true);
		tag("<code>");
	}
	function onexitcodetext() {
		setData("inCodeText");
		tag("</code>");
	}
	function onexitemphasis() {
		tag("</em>");
	}
	function onexitstrong() {
		tag("</strong>");
	}
	function onexitthematicbreak() {
		lineEndingIfNeeded();
		tag("<hr />");
	}
	/**
	* @this {CompileContext}
	* @param {Token} token
	*/
	function onexitcharacterreferencemarker(token) {
		setData("characterReferenceType", token.type);
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitcharacterreferencevalue(token) {
		let value = this.sliceSerialize(token);
		value = getData("characterReferenceType") ? decodeNumericCharacterReference(value, getData("characterReferenceType") === types.characterReferenceMarkerNumeric ? constants.numericBaseDecimal : constants.numericBaseHexadecimal) : decodeNamedCharacterReference(value);
		raw(encode$1(value));
		setData("characterReferenceType");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitautolinkprotocol(token) {
		const uri = this.sliceSerialize(token);
		tag("<a href=\"" + sanitizeUri(uri, settings.allowDangerousProtocol ? void 0 : protocolHref) + "\">");
		raw(encode$1(uri));
		tag("</a>");
	}
	/**
	* @this {CompileContext}
	* @type {Handle}
	*/
	function onexitautolinkemail(token) {
		const uri = this.sliceSerialize(token);
		tag("<a href=\"" + sanitizeUri("mailto:" + uri) + "\">");
		raw(encode$1(uri));
		tag("</a>");
	}
}
//#endregion
//#region node_modules/micromark/dev/lib/initialize/content.js
/**
* @typedef {import('micromark-util-types').InitialConstruct} InitialConstruct
* @typedef {import('micromark-util-types').Initializer} Initializer
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').Token} Token
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
*/
/** @type {InitialConstruct} */
var content$1 = { tokenize: initializeContent };
/**
* @this {TokenizeContext}
* @type {Initializer}
*/
function initializeContent(effects) {
	const contentStart = effects.attempt(this.parser.constructs.contentInitial, afterContentStartConstruct, paragraphInitial);
	/** @type {Token} */
	let previous;
	return contentStart;
	/** @type {State} */
	function afterContentStartConstruct(code) {
		ok(code === codes.eof || markdownLineEnding(code), "expected eol or eof");
		if (code === codes.eof) {
			effects.consume(code);
			return;
		}
		effects.enter(types.lineEnding);
		effects.consume(code);
		effects.exit(types.lineEnding);
		return factorySpace(effects, contentStart, types.linePrefix);
	}
	/** @type {State} */
	function paragraphInitial(code) {
		ok(code !== codes.eof && !markdownLineEnding(code), "expected anything other than a line ending or EOF");
		effects.enter(types.paragraph);
		return lineStart(code);
	}
	/** @type {State} */
	function lineStart(code) {
		const token = effects.enter(types.chunkText, {
			contentType: constants.contentTypeText,
			previous
		});
		if (previous) previous.next = token;
		previous = token;
		return data(code);
	}
	/** @type {State} */
	function data(code) {
		if (code === codes.eof) {
			effects.exit(types.chunkText);
			effects.exit(types.paragraph);
			effects.consume(code);
			return;
		}
		if (markdownLineEnding(code)) {
			effects.consume(code);
			effects.exit(types.chunkText);
			return lineStart;
		}
		effects.consume(code);
		return data;
	}
}
//#endregion
//#region node_modules/micromark/dev/lib/initialize/document.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').ContainerState} ContainerState
* @typedef {import('micromark-util-types').InitialConstruct} InitialConstruct
* @typedef {import('micromark-util-types').Initializer} Initializer
* @typedef {import('micromark-util-types').Point} Point
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').Token} Token
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/**
* @typedef {[Construct, ContainerState]} StackItem
*/
/** @type {InitialConstruct} */
var document$2 = { tokenize: initializeDocument };
/** @type {Construct} */
var containerConstruct = { tokenize: tokenizeContainer };
/**
* @this {TokenizeContext}
* @type {Initializer}
*/
function initializeDocument(effects) {
	const self = this;
	/** @type {Array<StackItem>} */
	const stack = [];
	let continued = 0;
	/** @type {TokenizeContext | undefined} */
	let childFlow;
	/** @type {Token | undefined} */
	let childToken;
	/** @type {number} */
	let lineStartOffset;
	return start;
	/** @type {State} */
	function start(code) {
		if (continued < stack.length) {
			const item = stack[continued];
			self.containerState = item[1];
			ok(item[0].continuation, "expected `continuation` to be defined on container construct");
			return effects.attempt(item[0].continuation, documentContinue, checkNewContainers)(code);
		}
		return checkNewContainers(code);
	}
	/** @type {State} */
	function documentContinue(code) {
		ok(self.containerState, "expected `containerState` to be defined after continuation");
		continued++;
		if (self.containerState._closeFlow) {
			self.containerState._closeFlow = void 0;
			if (childFlow) closeFlow();
			const indexBeforeExits = self.events.length;
			let indexBeforeFlow = indexBeforeExits;
			/** @type {Point | undefined} */
			let point;
			while (indexBeforeFlow--) if (self.events[indexBeforeFlow][0] === "exit" && self.events[indexBeforeFlow][1].type === types.chunkFlow) {
				point = self.events[indexBeforeFlow][1].end;
				break;
			}
			ok(point, "could not find previous flow chunk");
			exitContainers(continued);
			let index = indexBeforeExits;
			while (index < self.events.length) {
				self.events[index][1].end = Object.assign({}, point);
				index++;
			}
			splice(self.events, indexBeforeFlow + 1, 0, self.events.slice(indexBeforeExits));
			self.events.length = index;
			return checkNewContainers(code);
		}
		return start(code);
	}
	/** @type {State} */
	function checkNewContainers(code) {
		if (continued === stack.length) {
			if (!childFlow) return documentContinued(code);
			if (childFlow.currentConstruct && childFlow.currentConstruct.concrete) return flowStart(code);
			self.interrupt = Boolean(childFlow.currentConstruct && !childFlow._gfmTableDynamicInterruptHack);
		}
		self.containerState = {};
		return effects.check(containerConstruct, thereIsANewContainer, thereIsNoNewContainer)(code);
	}
	/** @type {State} */
	function thereIsANewContainer(code) {
		if (childFlow) closeFlow();
		exitContainers(continued);
		return documentContinued(code);
	}
	/** @type {State} */
	function thereIsNoNewContainer(code) {
		self.parser.lazy[self.now().line] = continued !== stack.length;
		lineStartOffset = self.now().offset;
		return flowStart(code);
	}
	/** @type {State} */
	function documentContinued(code) {
		self.containerState = {};
		return effects.attempt(containerConstruct, containerContinue, flowStart)(code);
	}
	/** @type {State} */
	function containerContinue(code) {
		ok(self.currentConstruct, "expected `currentConstruct` to be defined on tokenizer");
		ok(self.containerState, "expected `containerState` to be defined on tokenizer");
		continued++;
		stack.push([self.currentConstruct, self.containerState]);
		return documentContinued(code);
	}
	/** @type {State} */
	function flowStart(code) {
		if (code === codes.eof) {
			if (childFlow) closeFlow();
			exitContainers(0);
			effects.consume(code);
			return;
		}
		childFlow = childFlow || self.parser.flow(self.now());
		effects.enter(types.chunkFlow, {
			contentType: constants.contentTypeFlow,
			previous: childToken,
			_tokenizer: childFlow
		});
		return flowContinue(code);
	}
	/** @type {State} */
	function flowContinue(code) {
		if (code === codes.eof) {
			writeToChild(effects.exit(types.chunkFlow), true);
			exitContainers(0);
			effects.consume(code);
			return;
		}
		if (markdownLineEnding(code)) {
			effects.consume(code);
			writeToChild(effects.exit(types.chunkFlow));
			continued = 0;
			self.interrupt = void 0;
			return start;
		}
		effects.consume(code);
		return flowContinue;
	}
	/**
	* @param {Token} token
	* @param {boolean | undefined} [eof]
	* @returns {void}
	*/
	function writeToChild(token, eof) {
		ok(childFlow, "expected `childFlow` to be defined when continuing");
		const stream = self.sliceStream(token);
		if (eof) stream.push(null);
		token.previous = childToken;
		if (childToken) childToken.next = token;
		childToken = token;
		childFlow.defineSkip(token.start);
		childFlow.write(stream);
		if (self.parser.lazy[token.start.line]) {
			let index = childFlow.events.length;
			while (index--) if (childFlow.events[index][1].start.offset < lineStartOffset && (!childFlow.events[index][1].end || childFlow.events[index][1].end.offset > lineStartOffset)) return;
			const indexBeforeExits = self.events.length;
			let indexBeforeFlow = indexBeforeExits;
			/** @type {boolean | undefined} */
			let seen;
			/** @type {Point | undefined} */
			let point;
			while (indexBeforeFlow--) if (self.events[indexBeforeFlow][0] === "exit" && self.events[indexBeforeFlow][1].type === types.chunkFlow) {
				if (seen) {
					point = self.events[indexBeforeFlow][1].end;
					break;
				}
				seen = true;
			}
			ok(point, "could not find previous flow chunk");
			exitContainers(continued);
			index = indexBeforeExits;
			while (index < self.events.length) {
				self.events[index][1].end = Object.assign({}, point);
				index++;
			}
			splice(self.events, indexBeforeFlow + 1, 0, self.events.slice(indexBeforeExits));
			self.events.length = index;
		}
	}
	/**
	* @param {number} size
	* @returns {void}
	*/
	function exitContainers(size) {
		let index = stack.length;
		while (index-- > size) {
			const entry = stack[index];
			self.containerState = entry[1];
			ok(entry[0].exit, "expected `exit` to be defined on container construct");
			entry[0].exit.call(self, effects);
		}
		stack.length = size;
	}
	function closeFlow() {
		ok(self.containerState, "expected `containerState` to be defined when closing flow");
		ok(childFlow, "expected `childFlow` to be defined when closing it");
		childFlow.write([codes.eof]);
		childToken = void 0;
		childFlow = void 0;
		self.containerState._closeFlow = void 0;
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeContainer(effects, ok$35, nok) {
	ok(this.parser.constructs.disable.null, "expected `disable.null` to be populated");
	return factorySpace(effects, effects.attempt(this.parser.constructs.document, ok$35, nok), types.linePrefix, this.parser.constructs.disable.null.includes("codeIndented") ? void 0 : constants.tabSize);
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/attention.js
/**
* @typedef {import('micromark-util-types').Code} Code
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').Event} Event
* @typedef {import('micromark-util-types').Point} Point
* @typedef {import('micromark-util-types').Resolver} Resolver
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').Token} Token
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var attention = {
	name: "attention",
	tokenize: tokenizeAttention,
	resolveAll: resolveAllAttention
};
/**
* Take all events and resolve attention to emphasis or strong.
*
* @type {Resolver}
*/
function resolveAllAttention(events, context) {
	let index = -1;
	/** @type {number} */
	let open;
	/** @type {Token} */
	let group;
	/** @type {Token} */
	let text;
	/** @type {Token} */
	let openingSequence;
	/** @type {Token} */
	let closingSequence;
	/** @type {number} */
	let use;
	/** @type {Array<Event>} */
	let nextEvents;
	/** @type {number} */
	let offset;
	while (++index < events.length) if (events[index][0] === "enter" && events[index][1].type === "attentionSequence" && events[index][1]._close) {
		open = index;
		while (open--) if (events[open][0] === "exit" && events[open][1].type === "attentionSequence" && events[open][1]._open && context.sliceSerialize(events[open][1]).charCodeAt(0) === context.sliceSerialize(events[index][1]).charCodeAt(0)) {
			if ((events[open][1]._close || events[index][1]._open) && (events[index][1].end.offset - events[index][1].start.offset) % 3 && !((events[open][1].end.offset - events[open][1].start.offset + events[index][1].end.offset - events[index][1].start.offset) % 3)) continue;
			use = events[open][1].end.offset - events[open][1].start.offset > 1 && events[index][1].end.offset - events[index][1].start.offset > 1 ? 2 : 1;
			const start = Object.assign({}, events[open][1].end);
			const end = Object.assign({}, events[index][1].start);
			movePoint(start, -use);
			movePoint(end, use);
			openingSequence = {
				type: use > 1 ? types.strongSequence : types.emphasisSequence,
				start,
				end: Object.assign({}, events[open][1].end)
			};
			closingSequence = {
				type: use > 1 ? types.strongSequence : types.emphasisSequence,
				start: Object.assign({}, events[index][1].start),
				end
			};
			text = {
				type: use > 1 ? types.strongText : types.emphasisText,
				start: Object.assign({}, events[open][1].end),
				end: Object.assign({}, events[index][1].start)
			};
			group = {
				type: use > 1 ? types.strong : types.emphasis,
				start: Object.assign({}, openingSequence.start),
				end: Object.assign({}, closingSequence.end)
			};
			events[open][1].end = Object.assign({}, openingSequence.start);
			events[index][1].start = Object.assign({}, closingSequence.end);
			nextEvents = [];
			if (events[open][1].end.offset - events[open][1].start.offset) nextEvents = push(nextEvents, [[
				"enter",
				events[open][1],
				context
			], [
				"exit",
				events[open][1],
				context
			]]);
			nextEvents = push(nextEvents, [
				[
					"enter",
					group,
					context
				],
				[
					"enter",
					openingSequence,
					context
				],
				[
					"exit",
					openingSequence,
					context
				],
				[
					"enter",
					text,
					context
				]
			]);
			ok(context.parser.constructs.insideSpan.null, "expected `insideSpan` to be populated");
			nextEvents = push(nextEvents, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + 1, index), context));
			nextEvents = push(nextEvents, [
				[
					"exit",
					text,
					context
				],
				[
					"enter",
					closingSequence,
					context
				],
				[
					"exit",
					closingSequence,
					context
				],
				[
					"exit",
					group,
					context
				]
			]);
			if (events[index][1].end.offset - events[index][1].start.offset) {
				offset = 2;
				nextEvents = push(nextEvents, [[
					"enter",
					events[index][1],
					context
				], [
					"exit",
					events[index][1],
					context
				]]);
			} else offset = 0;
			splice(events, open - 1, index - open + 3, nextEvents);
			index = open + nextEvents.length - offset - 2;
			break;
		}
	}
	index = -1;
	while (++index < events.length) if (events[index][1].type === "attentionSequence") events[index][1].type = "data";
	return events;
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeAttention(effects, ok$34) {
	const attentionMarkers = this.parser.constructs.attentionMarkers.null;
	const previous = this.previous;
	const before = classifyCharacter(previous);
	/** @type {NonNullable<Code>} */
	let marker;
	return start;
	/**
	* Before a sequence.
	*
	* ```markdown
	* > | **
	*     ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.asterisk || code === codes.underscore, "expected asterisk or underscore");
		marker = code;
		effects.enter("attentionSequence");
		return inside(code);
	}
	/**
	* In a sequence.
	*
	* ```markdown
	* > | **
	*     ^^
	* ```
	*
	* @type {State}
	*/
	function inside(code) {
		if (code === marker) {
			effects.consume(code);
			return inside;
		}
		const token = effects.exit("attentionSequence");
		const after = classifyCharacter(code);
		ok(attentionMarkers, "expected `attentionMarkers` to be populated");
		const open = !after || after === constants.characterGroupPunctuation && before || attentionMarkers.includes(code);
		const close = !before || before === constants.characterGroupPunctuation && after || attentionMarkers.includes(previous);
		token._open = Boolean(marker === codes.asterisk ? open : open && (before || !close));
		token._close = Boolean(marker === codes.asterisk ? close : close && (after || !open));
		return ok$34(code);
	}
}
/**
* Move a point a bit.
*
* Note: `move` only works inside lines! It’s not possible to move past other
* chunks (replacement characters, tabs, or line endings).
*
* @param {Point} point
* @param {number} offset
* @returns {void}
*/
function movePoint(point, offset) {
	point.column += offset;
	point.offset += offset;
	point._bufferIndex += offset;
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/autolink.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var autolink = {
	name: "autolink",
	tokenize: tokenizeAutolink
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeAutolink(effects, ok$33, nok) {
	let size = 0;
	return start;
	/**
	* Start of an autolink.
	*
	* ```markdown
	* > | a<https://example.com>b
	*      ^
	* > | a<user@example.com>b
	*      ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.lessThan, "expected `<`");
		effects.enter(types.autolink);
		effects.enter(types.autolinkMarker);
		effects.consume(code);
		effects.exit(types.autolinkMarker);
		effects.enter(types.autolinkProtocol);
		return open;
	}
	/**
	* After `<`, at protocol or atext.
	*
	* ```markdown
	* > | a<https://example.com>b
	*       ^
	* > | a<user@example.com>b
	*       ^
	* ```
	*
	* @type {State}
	*/
	function open(code) {
		if (asciiAlpha(code)) {
			effects.consume(code);
			return schemeOrEmailAtext;
		}
		return emailAtext(code);
	}
	/**
	* At second byte of protocol or atext.
	*
	* ```markdown
	* > | a<https://example.com>b
	*        ^
	* > | a<user@example.com>b
	*        ^
	* ```
	*
	* @type {State}
	*/
	function schemeOrEmailAtext(code) {
		if (code === codes.plusSign || code === codes.dash || code === codes.dot || asciiAlphanumeric(code)) {
			size = 1;
			return schemeInsideOrEmailAtext(code);
		}
		return emailAtext(code);
	}
	/**
	* In ambiguous protocol or atext.
	*
	* ```markdown
	* > | a<https://example.com>b
	*        ^
	* > | a<user@example.com>b
	*        ^
	* ```
	*
	* @type {State}
	*/
	function schemeInsideOrEmailAtext(code) {
		if (code === codes.colon) {
			effects.consume(code);
			size = 0;
			return urlInside;
		}
		if ((code === codes.plusSign || code === codes.dash || code === codes.dot || asciiAlphanumeric(code)) && size++ < constants.autolinkSchemeSizeMax) {
			effects.consume(code);
			return schemeInsideOrEmailAtext;
		}
		size = 0;
		return emailAtext(code);
	}
	/**
	* After protocol, in URL.
	*
	* ```markdown
	* > | a<https://example.com>b
	*             ^
	* ```
	*
	* @type {State}
	*/
	function urlInside(code) {
		if (code === codes.greaterThan) {
			effects.exit(types.autolinkProtocol);
			effects.enter(types.autolinkMarker);
			effects.consume(code);
			effects.exit(types.autolinkMarker);
			effects.exit(types.autolink);
			return ok$33;
		}
		if (code === codes.eof || code === codes.space || code === codes.lessThan || asciiControl(code)) return nok(code);
		effects.consume(code);
		return urlInside;
	}
	/**
	* In email atext.
	*
	* ```markdown
	* > | a<user.name@example.com>b
	*              ^
	* ```
	*
	* @type {State}
	*/
	function emailAtext(code) {
		if (code === codes.atSign) {
			effects.consume(code);
			return emailAtSignOrDot;
		}
		if (asciiAtext(code)) {
			effects.consume(code);
			return emailAtext;
		}
		return nok(code);
	}
	/**
	* In label, after at-sign or dot.
	*
	* ```markdown
	* > | a<user.name@example.com>b
	*                 ^       ^
	* ```
	*
	* @type {State}
	*/
	function emailAtSignOrDot(code) {
		return asciiAlphanumeric(code) ? emailLabel(code) : nok(code);
	}
	/**
	* In label, where `.` and `>` are allowed.
	*
	* ```markdown
	* > | a<user.name@example.com>b
	*                   ^
	* ```
	*
	* @type {State}
	*/
	function emailLabel(code) {
		if (code === codes.dot) {
			effects.consume(code);
			size = 0;
			return emailAtSignOrDot;
		}
		if (code === codes.greaterThan) {
			effects.exit(types.autolinkProtocol).type = types.autolinkEmail;
			effects.enter(types.autolinkMarker);
			effects.consume(code);
			effects.exit(types.autolinkMarker);
			effects.exit(types.autolink);
			return ok$33;
		}
		return emailValue(code);
	}
	/**
	* In label, where `.` and `>` are *not* allowed.
	*
	* Though, this is also used in `emailLabel` to parse other values.
	*
	* ```markdown
	* > | a<user.name@ex-ample.com>b
	*                    ^
	* ```
	*
	* @type {State}
	*/
	function emailValue(code) {
		if ((code === codes.dash || asciiAlphanumeric(code)) && size++ < constants.autolinkDomainSizeMax) {
			const next = code === codes.dash ? emailValue : emailLabel;
			effects.consume(code);
			return next;
		}
		return nok(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/block-quote.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').Exiter} Exiter
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var blockQuote = {
	name: "blockQuote",
	tokenize: tokenizeBlockQuoteStart,
	continuation: { tokenize: tokenizeBlockQuoteContinuation },
	exit
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeBlockQuoteStart(effects, ok$31, nok) {
	const self = this;
	return start;
	/**
	* Start of block quote.
	*
	* ```markdown
	* > | > a
	*     ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		if (code === codes.greaterThan) {
			const state = self.containerState;
			ok(state, "expected `containerState` to be defined in container");
			if (!state.open) {
				effects.enter(types.blockQuote, { _container: true });
				state.open = true;
			}
			effects.enter(types.blockQuotePrefix);
			effects.enter(types.blockQuoteMarker);
			effects.consume(code);
			effects.exit(types.blockQuoteMarker);
			return after;
		}
		return nok(code);
	}
	/**
	* After `>`, before optional whitespace.
	*
	* ```markdown
	* > | > a
	*      ^
	* ```
	*
	* @type {State}
	*/
	function after(code) {
		if (markdownSpace(code)) {
			effects.enter(types.blockQuotePrefixWhitespace);
			effects.consume(code);
			effects.exit(types.blockQuotePrefixWhitespace);
			effects.exit(types.blockQuotePrefix);
			return ok$31;
		}
		effects.exit(types.blockQuotePrefix);
		return ok$31(code);
	}
}
/**
* Start of block quote continuation.
*
* ```markdown
*   | > a
* > | > b
*     ^
* ```
*
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeBlockQuoteContinuation(effects, ok$32, nok) {
	const self = this;
	return contStart;
	/**
	* Start of block quote continuation.
	*
	* Also used to parse the first block quote opening.
	*
	* ```markdown
	*   | > a
	* > | > b
	*     ^
	* ```
	*
	* @type {State}
	*/
	function contStart(code) {
		if (markdownSpace(code)) {
			ok(self.parser.constructs.disable.null, "expected `disable.null` to be populated");
			return factorySpace(effects, contBefore, types.linePrefix, self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : constants.tabSize)(code);
		}
		return contBefore(code);
	}
	/**
	* At `>`, after optional whitespace.
	*
	* Also used to parse the first block quote opening.
	*
	* ```markdown
	*   | > a
	* > | > b
	*     ^
	* ```
	*
	* @type {State}
	*/
	function contBefore(code) {
		return effects.attempt(blockQuote, ok$32, nok)(code);
	}
}
/** @type {Exiter} */
function exit(effects) {
	effects.exit(types.blockQuote);
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/character-escape.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var characterEscape = {
	name: "characterEscape",
	tokenize: tokenizeCharacterEscape
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeCharacterEscape(effects, ok$30, nok) {
	return start;
	/**
	* Start of character escape.
	*
	* ```markdown
	* > | a\*b
	*      ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.backslash, "expected `\\`");
		effects.enter(types.characterEscape);
		effects.enter(types.escapeMarker);
		effects.consume(code);
		effects.exit(types.escapeMarker);
		return inside;
	}
	/**
	* After `\`, at punctuation.
	*
	* ```markdown
	* > | a\*b
	*       ^
	* ```
	*
	* @type {State}
	*/
	function inside(code) {
		if (asciiPunctuation(code)) {
			effects.enter(types.characterEscapeValue);
			effects.consume(code);
			effects.exit(types.characterEscapeValue);
			effects.exit(types.characterEscape);
			return ok$30;
		}
		return nok(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/character-reference.js
/**
* @typedef {import('micromark-util-types').Code} Code
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var characterReference = {
	name: "characterReference",
	tokenize: tokenizeCharacterReference
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeCharacterReference(effects, ok$29, nok) {
	const self = this;
	let size = 0;
	/** @type {number} */
	let max;
	/** @type {(code: Code) => boolean} */
	let test;
	return start;
	/**
	* Start of character reference.
	*
	* ```markdown
	* > | a&amp;b
	*      ^
	* > | a&#123;b
	*      ^
	* > | a&#x9;b
	*      ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.ampersand, "expected `&`");
		effects.enter(types.characterReference);
		effects.enter(types.characterReferenceMarker);
		effects.consume(code);
		effects.exit(types.characterReferenceMarker);
		return open;
	}
	/**
	* After `&`, at `#` for numeric references or alphanumeric for named
	* references.
	*
	* ```markdown
	* > | a&amp;b
	*       ^
	* > | a&#123;b
	*       ^
	* > | a&#x9;b
	*       ^
	* ```
	*
	* @type {State}
	*/
	function open(code) {
		if (code === codes.numberSign) {
			effects.enter(types.characterReferenceMarkerNumeric);
			effects.consume(code);
			effects.exit(types.characterReferenceMarkerNumeric);
			return numeric;
		}
		effects.enter(types.characterReferenceValue);
		max = constants.characterReferenceNamedSizeMax;
		test = asciiAlphanumeric;
		return value(code);
	}
	/**
	* After `#`, at `x` for hexadecimals or digit for decimals.
	*
	* ```markdown
	* > | a&#123;b
	*        ^
	* > | a&#x9;b
	*        ^
	* ```
	*
	* @type {State}
	*/
	function numeric(code) {
		if (code === codes.uppercaseX || code === codes.lowercaseX) {
			effects.enter(types.characterReferenceMarkerHexadecimal);
			effects.consume(code);
			effects.exit(types.characterReferenceMarkerHexadecimal);
			effects.enter(types.characterReferenceValue);
			max = constants.characterReferenceHexadecimalSizeMax;
			test = asciiHexDigit;
			return value;
		}
		effects.enter(types.characterReferenceValue);
		max = constants.characterReferenceDecimalSizeMax;
		test = asciiDigit;
		return value(code);
	}
	/**
	* After markers (`&#x`, `&#`, or `&`), in value, before `;`.
	*
	* The character reference kind defines what and how many characters are
	* allowed.
	*
	* ```markdown
	* > | a&amp;b
	*       ^^^
	* > | a&#123;b
	*        ^^^
	* > | a&#x9;b
	*         ^
	* ```
	*
	* @type {State}
	*/
	function value(code) {
		if (code === codes.semicolon && size) {
			const token = effects.exit(types.characterReferenceValue);
			if (test === asciiAlphanumeric && !decodeNamedCharacterReference(self.sliceSerialize(token))) return nok(code);
			effects.enter(types.characterReferenceMarker);
			effects.consume(code);
			effects.exit(types.characterReferenceMarker);
			effects.exit(types.characterReference);
			return ok$29;
		}
		if (test(code) && size++ < max) {
			effects.consume(code);
			return value;
		}
		return nok(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/code-fenced.js
/**
* @typedef {import('micromark-util-types').Code} Code
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var nonLazyContinuation = {
	tokenize: tokenizeNonLazyContinuation,
	partial: true
};
/** @type {Construct} */
var codeFenced = {
	name: "codeFenced",
	tokenize: tokenizeCodeFenced,
	concrete: true
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeCodeFenced(effects, ok$26, nok) {
	const self = this;
	/** @type {Construct} */
	const closeStart = {
		tokenize: tokenizeCloseStart,
		partial: true
	};
	let initialPrefix = 0;
	let sizeOpen = 0;
	/** @type {NonNullable<Code>} */
	let marker;
	return start;
	/**
	* Start of code.
	*
	* ```markdown
	* > | ~~~js
	*     ^
	*   | alert(1)
	*   | ~~~
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		return beforeSequenceOpen(code);
	}
	/**
	* In opening fence, after prefix, at sequence.
	*
	* ```markdown
	* > | ~~~js
	*     ^
	*   | alert(1)
	*   | ~~~
	* ```
	*
	* @type {State}
	*/
	function beforeSequenceOpen(code) {
		ok(code === codes.graveAccent || code === codes.tilde, "expected `` ` `` or `~`");
		const tail = self.events[self.events.length - 1];
		initialPrefix = tail && tail[1].type === types.linePrefix ? tail[2].sliceSerialize(tail[1], true).length : 0;
		marker = code;
		effects.enter(types.codeFenced);
		effects.enter(types.codeFencedFence);
		effects.enter(types.codeFencedFenceSequence);
		return sequenceOpen(code);
	}
	/**
	* In opening fence sequence.
	*
	* ```markdown
	* > | ~~~js
	*      ^
	*   | alert(1)
	*   | ~~~
	* ```
	*
	* @type {State}
	*/
	function sequenceOpen(code) {
		if (code === marker) {
			sizeOpen++;
			effects.consume(code);
			return sequenceOpen;
		}
		if (sizeOpen < constants.codeFencedSequenceSizeMin) return nok(code);
		effects.exit(types.codeFencedFenceSequence);
		return markdownSpace(code) ? factorySpace(effects, infoBefore, types.whitespace)(code) : infoBefore(code);
	}
	/**
	* In opening fence, after the sequence (and optional whitespace), before info.
	*
	* ```markdown
	* > | ~~~js
	*        ^
	*   | alert(1)
	*   | ~~~
	* ```
	*
	* @type {State}
	*/
	function infoBefore(code) {
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.codeFencedFence);
			return self.interrupt ? ok$26(code) : effects.check(nonLazyContinuation, atNonLazyBreak, after)(code);
		}
		effects.enter(types.codeFencedFenceInfo);
		effects.enter(types.chunkString, { contentType: constants.contentTypeString });
		return info(code);
	}
	/**
	* In info.
	*
	* ```markdown
	* > | ~~~js
	*        ^
	*   | alert(1)
	*   | ~~~
	* ```
	*
	* @type {State}
	*/
	function info(code) {
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.chunkString);
			effects.exit(types.codeFencedFenceInfo);
			return infoBefore(code);
		}
		if (markdownSpace(code)) {
			effects.exit(types.chunkString);
			effects.exit(types.codeFencedFenceInfo);
			return factorySpace(effects, metaBefore, types.whitespace)(code);
		}
		if (code === codes.graveAccent && code === marker) return nok(code);
		effects.consume(code);
		return info;
	}
	/**
	* In opening fence, after info and whitespace, before meta.
	*
	* ```markdown
	* > | ~~~js eval
	*           ^
	*   | alert(1)
	*   | ~~~
	* ```
	*
	* @type {State}
	*/
	function metaBefore(code) {
		if (code === codes.eof || markdownLineEnding(code)) return infoBefore(code);
		effects.enter(types.codeFencedFenceMeta);
		effects.enter(types.chunkString, { contentType: constants.contentTypeString });
		return meta(code);
	}
	/**
	* In meta.
	*
	* ```markdown
	* > | ~~~js eval
	*           ^
	*   | alert(1)
	*   | ~~~
	* ```
	*
	* @type {State}
	*/
	function meta(code) {
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.chunkString);
			effects.exit(types.codeFencedFenceMeta);
			return infoBefore(code);
		}
		if (code === codes.graveAccent && code === marker) return nok(code);
		effects.consume(code);
		return meta;
	}
	/**
	* At eol/eof in code, before a non-lazy closing fence or content.
	*
	* ```markdown
	* > | ~~~js
	*          ^
	* > | alert(1)
	*             ^
	*   | ~~~
	* ```
	*
	* @type {State}
	*/
	function atNonLazyBreak(code) {
		ok(markdownLineEnding(code), "expected eol");
		return effects.attempt(closeStart, after, contentBefore)(code);
	}
	/**
	* Before code content, not a closing fence, at eol.
	*
	* ```markdown
	*   | ~~~js
	* > | alert(1)
	*             ^
	*   | ~~~
	* ```
	*
	* @type {State}
	*/
	function contentBefore(code) {
		ok(markdownLineEnding(code), "expected eol");
		effects.enter(types.lineEnding);
		effects.consume(code);
		effects.exit(types.lineEnding);
		return contentStart;
	}
	/**
	* Before code content, not a closing fence.
	*
	* ```markdown
	*   | ~~~js
	* > | alert(1)
	*     ^
	*   | ~~~
	* ```
	*
	* @type {State}
	*/
	function contentStart(code) {
		return initialPrefix > 0 && markdownSpace(code) ? factorySpace(effects, beforeContentChunk, types.linePrefix, initialPrefix + 1)(code) : beforeContentChunk(code);
	}
	/**
	* Before code content, after optional prefix.
	*
	* ```markdown
	*   | ~~~js
	* > | alert(1)
	*     ^
	*   | ~~~
	* ```
	*
	* @type {State}
	*/
	function beforeContentChunk(code) {
		if (code === codes.eof || markdownLineEnding(code)) return effects.check(nonLazyContinuation, atNonLazyBreak, after)(code);
		effects.enter(types.codeFlowValue);
		return contentChunk(code);
	}
	/**
	* In code content.
	*
	* ```markdown
	*   | ~~~js
	* > | alert(1)
	*     ^^^^^^^^
	*   | ~~~
	* ```
	*
	* @type {State}
	*/
	function contentChunk(code) {
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.codeFlowValue);
			return beforeContentChunk(code);
		}
		effects.consume(code);
		return contentChunk;
	}
	/**
	* After code.
	*
	* ```markdown
	*   | ~~~js
	*   | alert(1)
	* > | ~~~
	*        ^
	* ```
	*
	* @type {State}
	*/
	function after(code) {
		effects.exit(types.codeFenced);
		return ok$26(code);
	}
	/**
	* @this {TokenizeContext}
	* @type {Tokenizer}
	*/
	function tokenizeCloseStart(effects, ok$27, nok) {
		let size = 0;
		return startBefore;
		/**
		*
		*
		* @type {State}
		*/
		function startBefore(code) {
			ok(markdownLineEnding(code), "expected eol");
			effects.enter(types.lineEnding);
			effects.consume(code);
			effects.exit(types.lineEnding);
			return start;
		}
		/**
		* Before closing fence, at optional whitespace.
		*
		* ```markdown
		*   | ~~~js
		*   | alert(1)
		* > | ~~~
		*     ^
		* ```
		*
		* @type {State}
		*/
		function start(code) {
			ok(self.parser.constructs.disable.null, "expected `disable.null` to be populated");
			effects.enter(types.codeFencedFence);
			return markdownSpace(code) ? factorySpace(effects, beforeSequenceClose, types.linePrefix, self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : constants.tabSize)(code) : beforeSequenceClose(code);
		}
		/**
		* In closing fence, after optional whitespace, at sequence.
		*
		* ```markdown
		*   | ~~~js
		*   | alert(1)
		* > | ~~~
		*     ^
		* ```
		*
		* @type {State}
		*/
		function beforeSequenceClose(code) {
			if (code === marker) {
				effects.enter(types.codeFencedFenceSequence);
				return sequenceClose(code);
			}
			return nok(code);
		}
		/**
		* In closing fence sequence.
		*
		* ```markdown
		*   | ~~~js
		*   | alert(1)
		* > | ~~~
		*     ^
		* ```
		*
		* @type {State}
		*/
		function sequenceClose(code) {
			if (code === marker) {
				size++;
				effects.consume(code);
				return sequenceClose;
			}
			if (size >= sizeOpen) {
				effects.exit(types.codeFencedFenceSequence);
				return markdownSpace(code) ? factorySpace(effects, sequenceCloseAfter, types.whitespace)(code) : sequenceCloseAfter(code);
			}
			return nok(code);
		}
		/**
		* After closing fence sequence, after optional whitespace.
		*
		* ```markdown
		*   | ~~~js
		*   | alert(1)
		* > | ~~~
		*        ^
		* ```
		*
		* @type {State}
		*/
		function sequenceCloseAfter(code) {
			if (code === codes.eof || markdownLineEnding(code)) {
				effects.exit(types.codeFencedFence);
				return ok$27(code);
			}
			return nok(code);
		}
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeNonLazyContinuation(effects, ok$28, nok) {
	const self = this;
	return start;
	/**
	*
	*
	* @type {State}
	*/
	function start(code) {
		if (code === codes.eof) return nok(code);
		ok(markdownLineEnding(code), "expected eol");
		effects.enter(types.lineEnding);
		effects.consume(code);
		effects.exit(types.lineEnding);
		return lineStart;
	}
	/**
	*
	*
	* @type {State}
	*/
	function lineStart(code) {
		return self.parser.lazy[self.now().line] ? nok(code) : ok$28(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/code-indented.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var codeIndented = {
	name: "codeIndented",
	tokenize: tokenizeCodeIndented
};
/** @type {Construct} */
var furtherStart = {
	tokenize: tokenizeFurtherStart,
	partial: true
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeCodeIndented(effects, ok$25, nok) {
	const self = this;
	return start;
	/**
	* Start of code (indented).
	*
	* > **Parsing note**: it is not needed to check if this first line is a
	* > filled line (that it has a non-whitespace character), because blank lines
	* > are parsed already, so we never run into that.
	*
	* ```markdown
	* > |     aaa
	*     ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(markdownSpace(code));
		effects.enter(types.codeIndented);
		return factorySpace(effects, afterPrefix, types.linePrefix, constants.tabSize + 1)(code);
	}
	/**
	* At start, after 1 or 4 spaces.
	*
	* ```markdown
	* > |     aaa
	*         ^
	* ```
	*
	* @type {State}
	*/
	function afterPrefix(code) {
		const tail = self.events[self.events.length - 1];
		return tail && tail[1].type === types.linePrefix && tail[2].sliceSerialize(tail[1], true).length >= constants.tabSize ? atBreak(code) : nok(code);
	}
	/**
	* At a break.
	*
	* ```markdown
	* > |     aaa
	*         ^  ^
	* ```
	*
	* @type {State}
	*/
	function atBreak(code) {
		if (code === codes.eof) return after(code);
		if (markdownLineEnding(code)) return effects.attempt(furtherStart, atBreak, after)(code);
		effects.enter(types.codeFlowValue);
		return inside(code);
	}
	/**
	* In code content.
	*
	* ```markdown
	* > |     aaa
	*         ^^^^
	* ```
	*
	* @type {State}
	*/
	function inside(code) {
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.codeFlowValue);
			return atBreak(code);
		}
		effects.consume(code);
		return inside;
	}
	/** @type {State} */
	function after(code) {
		effects.exit(types.codeIndented);
		return ok$25(code);
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeFurtherStart(effects, ok, nok) {
	const self = this;
	return furtherStart;
	/**
	* At eol, trying to parse another indent.
	*
	* ```markdown
	* > |     aaa
	*            ^
	*   |     bbb
	* ```
	*
	* @type {State}
	*/
	function furtherStart(code) {
		if (self.parser.lazy[self.now().line]) return nok(code);
		if (markdownLineEnding(code)) {
			effects.enter(types.lineEnding);
			effects.consume(code);
			effects.exit(types.lineEnding);
			return furtherStart;
		}
		return factorySpace(effects, afterPrefix, types.linePrefix, constants.tabSize + 1)(code);
	}
	/**
	* At start, after 1 or 4 spaces.
	*
	* ```markdown
	* > |     aaa
	*         ^
	* ```
	*
	* @type {State}
	*/
	function afterPrefix(code) {
		const tail = self.events[self.events.length - 1];
		return tail && tail[1].type === types.linePrefix && tail[2].sliceSerialize(tail[1], true).length >= constants.tabSize ? ok(code) : markdownLineEnding(code) ? furtherStart(code) : nok(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/code-text.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').Previous} Previous
* @typedef {import('micromark-util-types').Resolver} Resolver
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').Token} Token
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var codeText = {
	name: "codeText",
	tokenize: tokenizeCodeText,
	resolve: resolveCodeText,
	previous
};
/** @type {Resolver} */
function resolveCodeText(events) {
	let tailExitIndex = events.length - 4;
	let headEnterIndex = 3;
	/** @type {number} */
	let index;
	/** @type {number | undefined} */
	let enter;
	if ((events[headEnterIndex][1].type === types.lineEnding || events[headEnterIndex][1].type === "space") && (events[tailExitIndex][1].type === types.lineEnding || events[tailExitIndex][1].type === "space")) {
		index = headEnterIndex;
		while (++index < tailExitIndex) if (events[index][1].type === types.codeTextData) {
			events[headEnterIndex][1].type = types.codeTextPadding;
			events[tailExitIndex][1].type = types.codeTextPadding;
			headEnterIndex += 2;
			tailExitIndex -= 2;
			break;
		}
	}
	index = headEnterIndex - 1;
	tailExitIndex++;
	while (++index <= tailExitIndex) if (enter === void 0) {
		if (index !== tailExitIndex && events[index][1].type !== types.lineEnding) enter = index;
	} else if (index === tailExitIndex || events[index][1].type === types.lineEnding) {
		events[enter][1].type = types.codeTextData;
		if (index !== enter + 2) {
			events[enter][1].end = events[index - 1][1].end;
			events.splice(enter + 2, index - enter - 2);
			tailExitIndex -= index - enter - 2;
			index = enter + 2;
		}
		enter = void 0;
	}
	return events;
}
/**
* @this {TokenizeContext}
* @type {Previous}
*/
function previous(code) {
	return code !== codes.graveAccent || this.events[this.events.length - 1][1].type === types.characterEscape;
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeCodeText(effects, ok$24, nok) {
	const self = this;
	let sizeOpen = 0;
	/** @type {number} */
	let size;
	/** @type {Token} */
	let token;
	return start;
	/**
	* Start of code (text).
	*
	* ```markdown
	* > | `a`
	*     ^
	* > | \`a`
	*      ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.graveAccent, "expected `` ` ``");
		ok(previous.call(self, self.previous), "expected correct previous");
		effects.enter(types.codeText);
		effects.enter(types.codeTextSequence);
		return sequenceOpen(code);
	}
	/**
	* In opening sequence.
	*
	* ```markdown
	* > | `a`
	*     ^
	* ```
	*
	* @type {State}
	*/
	function sequenceOpen(code) {
		if (code === codes.graveAccent) {
			effects.consume(code);
			sizeOpen++;
			return sequenceOpen;
		}
		effects.exit(types.codeTextSequence);
		return between(code);
	}
	/**
	* Between something and something else.
	*
	* ```markdown
	* > | `a`
	*      ^^
	* ```
	*
	* @type {State}
	*/
	function between(code) {
		if (code === codes.eof) return nok(code);
		if (code === codes.space) {
			effects.enter("space");
			effects.consume(code);
			effects.exit("space");
			return between;
		}
		if (code === codes.graveAccent) {
			token = effects.enter(types.codeTextSequence);
			size = 0;
			return sequenceClose(code);
		}
		if (markdownLineEnding(code)) {
			effects.enter(types.lineEnding);
			effects.consume(code);
			effects.exit(types.lineEnding);
			return between;
		}
		effects.enter(types.codeTextData);
		return data(code);
	}
	/**
	* In data.
	*
	* ```markdown
	* > | `a`
	*      ^
	* ```
	*
	* @type {State}
	*/
	function data(code) {
		if (code === codes.eof || code === codes.space || code === codes.graveAccent || markdownLineEnding(code)) {
			effects.exit(types.codeTextData);
			return between(code);
		}
		effects.consume(code);
		return data;
	}
	/**
	* In closing sequence.
	*
	* ```markdown
	* > | `a`
	*       ^
	* ```
	*
	* @type {State}
	*/
	function sequenceClose(code) {
		if (code === codes.graveAccent) {
			effects.consume(code);
			size++;
			return sequenceClose;
		}
		if (size === sizeOpen) {
			effects.exit(types.codeTextSequence);
			effects.exit(types.codeText);
			return ok$24(code);
		}
		token.type = types.codeTextData;
		return data(code);
	}
}
//#endregion
//#region node_modules/micromark-util-subtokenize/dev/index.js
/**
* @typedef {import('micromark-util-types').Chunk} Chunk
* @typedef {import('micromark-util-types').Event} Event
* @typedef {import('micromark-util-types').Token} Token
*/
/**
* Tokenize subcontent.
*
* @param {Array<Event>} events
*   List of events.
* @returns {boolean}
*   Whether subtokens were found.
*/
function subtokenize(events) {
	/** @type {Record<string, number>} */
	const jumps = {};
	let index = -1;
	/** @type {Event} */
	let event;
	/** @type {number | undefined} */
	let lineIndex;
	/** @type {number} */
	let otherIndex;
	/** @type {Event} */
	let otherEvent;
	/** @type {Array<Event>} */
	let parameters;
	/** @type {Array<Event>} */
	let subevents;
	/** @type {boolean | undefined} */
	let more;
	while (++index < events.length) {
		while (index in jumps) index = jumps[index];
		event = events[index];
		if (index && event[1].type === types.chunkFlow && events[index - 1][1].type === types.listItemPrefix) {
			ok(event[1]._tokenizer, "expected `_tokenizer` on subtokens");
			subevents = event[1]._tokenizer.events;
			otherIndex = 0;
			if (otherIndex < subevents.length && subevents[otherIndex][1].type === types.lineEndingBlank) otherIndex += 2;
			if (otherIndex < subevents.length && subevents[otherIndex][1].type === types.content) while (++otherIndex < subevents.length) {
				if (subevents[otherIndex][1].type === types.content) break;
				if (subevents[otherIndex][1].type === types.chunkText) {
					subevents[otherIndex][1]._isInFirstContentOfListItem = true;
					otherIndex++;
				}
			}
		}
		if (event[0] === "enter") {
			if (event[1].contentType) {
				Object.assign(jumps, subcontent(events, index));
				index = jumps[index];
				more = true;
			}
		} else if (event[1]._container) {
			otherIndex = index;
			lineIndex = void 0;
			while (otherIndex--) {
				otherEvent = events[otherIndex];
				if (otherEvent[1].type === types.lineEnding || otherEvent[1].type === types.lineEndingBlank) {
					if (otherEvent[0] === "enter") {
						if (lineIndex) events[lineIndex][1].type = types.lineEndingBlank;
						otherEvent[1].type = types.lineEnding;
						lineIndex = otherIndex;
					}
				} else break;
			}
			if (lineIndex) {
				event[1].end = Object.assign({}, events[lineIndex][1].start);
				parameters = events.slice(lineIndex, index);
				parameters.unshift(event);
				splice(events, lineIndex, index - lineIndex + 1, parameters);
			}
		}
	}
	return !more;
}
/**
* Tokenize embedded tokens.
*
* @param {Array<Event>} events
* @param {number} eventIndex
* @returns {Record<string, number>}
*/
function subcontent(events, eventIndex) {
	const token = events[eventIndex][1];
	const context = events[eventIndex][2];
	let startPosition = eventIndex - 1;
	/** @type {Array<number>} */
	const startPositions = [];
	ok(token.contentType, "expected `contentType` on subtokens");
	const tokenizer = token._tokenizer || context.parser[token.contentType](token.start);
	const childEvents = tokenizer.events;
	/** @type {Array<[number, number]>} */
	const jumps = [];
	/** @type {Record<string, number>} */
	const gaps = {};
	/** @type {Array<Chunk>} */
	let stream;
	/** @type {Token | undefined} */
	let previous;
	let index = -1;
	/** @type {Token | undefined} */
	let current = token;
	let adjust = 0;
	let start = 0;
	const breaks = [start];
	while (current) {
		while (events[++startPosition][1] !== current);
		ok(!previous || current.previous === previous, "expected previous to match");
		ok(!previous || previous.next === current, "expected next to match");
		startPositions.push(startPosition);
		if (!current._tokenizer) {
			stream = context.sliceStream(current);
			if (!current.next) stream.push(codes.eof);
			if (previous) tokenizer.defineSkip(current.start);
			if (current._isInFirstContentOfListItem) tokenizer._gfmTasklistFirstContentOfListItem = true;
			tokenizer.write(stream);
			if (current._isInFirstContentOfListItem) tokenizer._gfmTasklistFirstContentOfListItem = void 0;
		}
		previous = current;
		current = current.next;
	}
	current = token;
	while (++index < childEvents.length) if (childEvents[index][0] === "exit" && childEvents[index - 1][0] === "enter" && childEvents[index][1].type === childEvents[index - 1][1].type && childEvents[index][1].start.line !== childEvents[index][1].end.line) {
		ok(current, "expected a current token");
		start = index + 1;
		breaks.push(start);
		current._tokenizer = void 0;
		current.previous = void 0;
		current = current.next;
	}
	tokenizer.events = [];
	if (current) {
		current._tokenizer = void 0;
		current.previous = void 0;
		ok(!current.next, "expected no next token");
	} else breaks.pop();
	index = breaks.length;
	while (index--) {
		const slice = childEvents.slice(breaks[index], breaks[index + 1]);
		const start = startPositions.pop();
		ok(start !== void 0, "expected a start position when splicing");
		jumps.unshift([start, start + slice.length - 1]);
		splice(events, start, 2, slice);
	}
	index = -1;
	while (++index < jumps.length) {
		gaps[adjust + jumps[index][0]] = adjust + jumps[index][1];
		adjust += jumps[index][1] - jumps[index][0] - 1;
	}
	return gaps;
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/content.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').Resolver} Resolver
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').Token} Token
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/**
* No name because it must not be turned off.
* @type {Construct}
*/
var content = {
	tokenize: tokenizeContent,
	resolve: resolveContent
};
/** @type {Construct} */
var continuationConstruct = {
	tokenize: tokenizeContinuation,
	partial: true
};
/**
* Content is transparent: it’s parsed right now. That way, definitions are also
* parsed right now: before text in paragraphs (specifically, media) are parsed.
*
* @type {Resolver}
*/
function resolveContent(events) {
	subtokenize(events);
	return events;
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeContent(effects, ok$22) {
	/** @type {Token | undefined} */
	let previous;
	return chunkStart;
	/**
	* Before a content chunk.
	*
	* ```markdown
	* > | abc
	*     ^
	* ```
	*
	* @type {State}
	*/
	function chunkStart(code) {
		ok(code !== codes.eof && !markdownLineEnding(code), "expected no eof or eol");
		effects.enter(types.content);
		previous = effects.enter(types.chunkContent, { contentType: constants.contentTypeContent });
		return chunkInside(code);
	}
	/**
	* In a content chunk.
	*
	* ```markdown
	* > | abc
	*     ^^^
	* ```
	*
	* @type {State}
	*/
	function chunkInside(code) {
		if (code === codes.eof) return contentEnd(code);
		if (markdownLineEnding(code)) return effects.check(continuationConstruct, contentContinue, contentEnd)(code);
		effects.consume(code);
		return chunkInside;
	}
	/**
	*
	*
	* @type {State}
	*/
	function contentEnd(code) {
		effects.exit(types.chunkContent);
		effects.exit(types.content);
		return ok$22(code);
	}
	/**
	*
	*
	* @type {State}
	*/
	function contentContinue(code) {
		ok(markdownLineEnding(code), "expected eol");
		effects.consume(code);
		effects.exit(types.chunkContent);
		ok(previous, "expected previous token");
		previous.next = effects.enter(types.chunkContent, {
			contentType: constants.contentTypeContent,
			previous
		});
		previous = previous.next;
		return chunkInside;
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeContinuation(effects, ok$23, nok) {
	const self = this;
	return startLookahead;
	/**
	*
	*
	* @type {State}
	*/
	function startLookahead(code) {
		ok(markdownLineEnding(code), "expected a line ending");
		effects.exit(types.chunkContent);
		effects.enter(types.lineEnding);
		effects.consume(code);
		effects.exit(types.lineEnding);
		return factorySpace(effects, prefixed, types.linePrefix);
	}
	/**
	*
	*
	* @type {State}
	*/
	function prefixed(code) {
		if (code === codes.eof || markdownLineEnding(code)) return nok(code);
		ok(self.parser.constructs.disable.null, "expected `disable.null` to be populated");
		const tail = self.events[self.events.length - 1];
		if (!self.parser.constructs.disable.null.includes("codeIndented") && tail && tail[1].type === types.linePrefix && tail[2].sliceSerialize(tail[1], true).length >= constants.tabSize) return ok$23(code);
		return effects.interrupt(self.parser.constructs.flow, nok, ok$23)(code);
	}
}
//#endregion
//#region node_modules/micromark-factory-destination/dev/index.js
/**
* @typedef {import('micromark-util-types').Effects} Effects
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenType} TokenType
*/
/**
* Parse destinations.
*
* ###### Examples
*
* ```markdown
* <a>
* <a\>b>
* <a b>
* <a)>
* a
* a\)b
* a(b)c
* a(b)
* ```
*
* @param {Effects} effects
*   Context.
* @param {State} ok
*   State switched to when successful.
* @param {State} nok
*   State switched to when unsuccessful.
* @param {TokenType} type
*   Type for whole (`<a>` or `b`).
* @param {TokenType} literalType
*   Type when enclosed (`<a>`).
* @param {TokenType} literalMarkerType
*   Type for enclosing (`<` and `>`).
* @param {TokenType} rawType
*   Type when not enclosed (`b`).
* @param {TokenType} stringType
*   Type for the value (`a` or `b`).
* @param {number | undefined} [max=Infinity]
*   Depth of nested parens (inclusive).
* @returns {State}
*   Start state.
*/
function factoryDestination(effects, ok, nok, type, literalType, literalMarkerType, rawType, stringType, max) {
	const limit = max || Number.POSITIVE_INFINITY;
	let balance = 0;
	return start;
	/**
	* Start of destination.
	*
	* ```markdown
	* > | <aa>
	*     ^
	* > | aa
	*     ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		if (code === codes.lessThan) {
			effects.enter(type);
			effects.enter(literalType);
			effects.enter(literalMarkerType);
			effects.consume(code);
			effects.exit(literalMarkerType);
			return enclosedBefore;
		}
		if (code === codes.eof || code === codes.space || code === codes.rightParenthesis || asciiControl(code)) return nok(code);
		effects.enter(type);
		effects.enter(rawType);
		effects.enter(stringType);
		effects.enter(types.chunkString, { contentType: constants.contentTypeString });
		return raw(code);
	}
	/**
	* After `<`, at an enclosed destination.
	*
	* ```markdown
	* > | <aa>
	*      ^
	* ```
	*
	* @type {State}
	*/
	function enclosedBefore(code) {
		if (code === codes.greaterThan) {
			effects.enter(literalMarkerType);
			effects.consume(code);
			effects.exit(literalMarkerType);
			effects.exit(literalType);
			effects.exit(type);
			return ok;
		}
		effects.enter(stringType);
		effects.enter(types.chunkString, { contentType: constants.contentTypeString });
		return enclosed(code);
	}
	/**
	* In enclosed destination.
	*
	* ```markdown
	* > | <aa>
	*      ^
	* ```
	*
	* @type {State}
	*/
	function enclosed(code) {
		if (code === codes.greaterThan) {
			effects.exit(types.chunkString);
			effects.exit(stringType);
			return enclosedBefore(code);
		}
		if (code === codes.eof || code === codes.lessThan || markdownLineEnding(code)) return nok(code);
		effects.consume(code);
		return code === codes.backslash ? enclosedEscape : enclosed;
	}
	/**
	* After `\`, at a special character.
	*
	* ```markdown
	* > | <a\*a>
	*        ^
	* ```
	*
	* @type {State}
	*/
	function enclosedEscape(code) {
		if (code === codes.lessThan || code === codes.greaterThan || code === codes.backslash) {
			effects.consume(code);
			return enclosed;
		}
		return enclosed(code);
	}
	/**
	* In raw destination.
	*
	* ```markdown
	* > | aa
	*     ^
	* ```
	*
	* @type {State}
	*/
	function raw(code) {
		if (!balance && (code === codes.eof || code === codes.rightParenthesis || markdownLineEndingOrSpace(code))) {
			effects.exit(types.chunkString);
			effects.exit(stringType);
			effects.exit(rawType);
			effects.exit(type);
			return ok(code);
		}
		if (balance < limit && code === codes.leftParenthesis) {
			effects.consume(code);
			balance++;
			return raw;
		}
		if (code === codes.rightParenthesis) {
			effects.consume(code);
			balance--;
			return raw;
		}
		if (code === codes.eof || code === codes.space || code === codes.leftParenthesis || asciiControl(code)) return nok(code);
		effects.consume(code);
		return code === codes.backslash ? rawEscape : raw;
	}
	/**
	* After `\`, at special character.
	*
	* ```markdown
	* > | a\*a
	*       ^
	* ```
	*
	* @type {State}
	*/
	function rawEscape(code) {
		if (code === codes.leftParenthesis || code === codes.rightParenthesis || code === codes.backslash) {
			effects.consume(code);
			return raw;
		}
		return raw(code);
	}
}
//#endregion
//#region node_modules/micromark-factory-label/dev/index.js
/**
* @typedef {import('micromark-util-types').Effects} Effects
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').TokenType} TokenType
*/
/**
* Parse labels.
*
* > 👉 **Note**: labels in markdown are capped at 999 characters in the string.
*
* ###### Examples
*
* ```markdown
* [a]
* [a
* b]
* [a\]b]
* ```
*
* @this {TokenizeContext}
*   Tokenize context.
* @param {Effects} effects
*   Context.
* @param {State} ok
*   State switched to when successful.
* @param {State} nok
*   State switched to when unsuccessful.
* @param {TokenType} type
*   Type of the whole label (`[a]`).
* @param {TokenType} markerType
*   Type for the markers (`[` and `]`).
* @param {TokenType} stringType
*   Type for the identifier (`a`).
* @returns {State}
*   Start state.
*/
function factoryLabel(effects, ok$21, nok, type, markerType, stringType) {
	const self = this;
	let size = 0;
	/** @type {boolean} */
	let seen;
	return start;
	/**
	* Start of label.
	*
	* ```markdown
	* > | [a]
	*     ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.leftSquareBracket, "expected `[`");
		effects.enter(type);
		effects.enter(markerType);
		effects.consume(code);
		effects.exit(markerType);
		effects.enter(stringType);
		return atBreak;
	}
	/**
	* In label, at something, before something else.
	*
	* ```markdown
	* > | [a]
	*      ^
	* ```
	*
	* @type {State}
	*/
	function atBreak(code) {
		if (size > constants.linkReferenceSizeMax || code === codes.eof || code === codes.leftSquareBracket || code === codes.rightSquareBracket && !seen || code === codes.caret && !size && "_hiddenFootnoteSupport" in self.parser.constructs) return nok(code);
		if (code === codes.rightSquareBracket) {
			effects.exit(stringType);
			effects.enter(markerType);
			effects.consume(code);
			effects.exit(markerType);
			effects.exit(type);
			return ok$21;
		}
		if (markdownLineEnding(code)) {
			effects.enter(types.lineEnding);
			effects.consume(code);
			effects.exit(types.lineEnding);
			return atBreak;
		}
		effects.enter(types.chunkString, { contentType: constants.contentTypeString });
		return labelInside(code);
	}
	/**
	* In label, in text.
	*
	* ```markdown
	* > | [a]
	*      ^
	* ```
	*
	* @type {State}
	*/
	function labelInside(code) {
		if (code === codes.eof || code === codes.leftSquareBracket || code === codes.rightSquareBracket || markdownLineEnding(code) || size++ > constants.linkReferenceSizeMax) {
			effects.exit(types.chunkString);
			return atBreak(code);
		}
		effects.consume(code);
		if (!seen) seen = !markdownSpace(code);
		return code === codes.backslash ? labelEscape : labelInside;
	}
	/**
	* After `\`, at a special character.
	*
	* ```markdown
	* > | [a\*a]
	*        ^
	* ```
	*
	* @type {State}
	*/
	function labelEscape(code) {
		if (code === codes.leftSquareBracket || code === codes.backslash || code === codes.rightSquareBracket) {
			effects.consume(code);
			size++;
			return labelInside;
		}
		return labelInside(code);
	}
}
//#endregion
//#region node_modules/micromark-factory-title/dev/index.js
/**
* @typedef {import('micromark-util-types').Code} Code
* @typedef {import('micromark-util-types').Effects} Effects
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenType} TokenType
*/
/**
* Parse titles.
*
* ###### Examples
*
* ```markdown
* "a"
* 'b'
* (c)
* "a
* b"
* 'a
*     b'
* (a\)b)
* ```
*
* @param {Effects} effects
*   Context.
* @param {State} ok
*   State switched to when successful.
* @param {State} nok
*   State switched to when unsuccessful.
* @param {TokenType} type
*   Type of the whole title (`"a"`, `'b'`, `(c)`).
* @param {TokenType} markerType
*   Type for the markers (`"`, `'`, `(`, and `)`).
* @param {TokenType} stringType
*   Type for the value (`a`).
* @returns {State}
*   Start state.
*/
function factoryTitle(effects, ok, nok, type, markerType, stringType) {
	/** @type {NonNullable<Code>} */
	let marker;
	return start;
	/**
	* Start of title.
	*
	* ```markdown
	* > | "a"
	*     ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		if (code === codes.quotationMark || code === codes.apostrophe || code === codes.leftParenthesis) {
			effects.enter(type);
			effects.enter(markerType);
			effects.consume(code);
			effects.exit(markerType);
			marker = code === codes.leftParenthesis ? codes.rightParenthesis : code;
			return begin;
		}
		return nok(code);
	}
	/**
	* After opening marker.
	*
	* This is also used at the closing marker.
	*
	* ```markdown
	* > | "a"
	*      ^
	* ```
	*
	* @type {State}
	*/
	function begin(code) {
		if (code === marker) {
			effects.enter(markerType);
			effects.consume(code);
			effects.exit(markerType);
			effects.exit(type);
			return ok;
		}
		effects.enter(stringType);
		return atBreak(code);
	}
	/**
	* At something, before something else.
	*
	* ```markdown
	* > | "a"
	*      ^
	* ```
	*
	* @type {State}
	*/
	function atBreak(code) {
		if (code === marker) {
			effects.exit(stringType);
			return begin(marker);
		}
		if (code === codes.eof) return nok(code);
		if (markdownLineEnding(code)) {
			effects.enter(types.lineEnding);
			effects.consume(code);
			effects.exit(types.lineEnding);
			return factorySpace(effects, atBreak, types.linePrefix);
		}
		effects.enter(types.chunkString, { contentType: constants.contentTypeString });
		return inside(code);
	}
	/**
	*
	*
	* @type {State}
	*/
	function inside(code) {
		if (code === marker || code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.chunkString);
			return atBreak(code);
		}
		effects.consume(code);
		return code === codes.backslash ? escape : inside;
	}
	/**
	* After `\`, at a special character.
	*
	* ```markdown
	* > | "a\*b"
	*      ^
	* ```
	*
	* @type {State}
	*/
	function escape(code) {
		if (code === marker || code === codes.backslash) {
			effects.consume(code);
			return inside;
		}
		return inside(code);
	}
}
//#endregion
//#region node_modules/micromark-factory-whitespace/dev/index.js
/**
* @typedef {import('micromark-util-types').Effects} Effects
* @typedef {import('micromark-util-types').State} State
*/
/**
* Parse spaces and tabs.
*
* There is no `nok` parameter:
*
* *   line endings or spaces in markdown are often optional, in which case this
*     factory can be used and `ok` will be switched to whether spaces were found
*     or not
* *   one line ending or space can be detected with
*     `markdownLineEndingOrSpace(code)` right before using `factoryWhitespace`
*
* @param {Effects} effects
*   Context.
* @param {State} ok
*   State switched to when successful.
* @returns
*   Start state.
*/
function factoryWhitespace(effects, ok) {
	/** @type {boolean} */
	let seen;
	return start;
	/** @type {State} */
	function start(code) {
		if (markdownLineEnding(code)) {
			effects.enter(types.lineEnding);
			effects.consume(code);
			effects.exit(types.lineEnding);
			seen = true;
			return start;
		}
		if (markdownSpace(code)) return factorySpace(effects, start, seen ? types.linePrefix : types.lineSuffix)(code);
		return ok(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/definition.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var definition = {
	name: "definition",
	tokenize: tokenizeDefinition
};
/** @type {Construct} */
var titleBefore = {
	tokenize: tokenizeTitleBefore,
	partial: true
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeDefinition(effects, ok$20, nok) {
	const self = this;
	/** @type {string} */
	let identifier;
	return start;
	/**
	* At start of a definition.
	*
	* ```markdown
	* > | [a]: b "c"
	*     ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		effects.enter(types.definition);
		return before(code);
	}
	/**
	* After optional whitespace, at `[`.
	*
	* ```markdown
	* > | [a]: b "c"
	*     ^
	* ```
	*
	* @type {State}
	*/
	function before(code) {
		ok(code === codes.leftSquareBracket, "expected `[`");
		return factoryLabel.call(self, effects, labelAfter, nok, types.definitionLabel, types.definitionLabelMarker, types.definitionLabelString)(code);
	}
	/**
	* After label.
	*
	* ```markdown
	* > | [a]: b "c"
	*        ^
	* ```
	*
	* @type {State}
	*/
	function labelAfter(code) {
		identifier = normalizeIdentifier(self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1));
		if (code === codes.colon) {
			effects.enter(types.definitionMarker);
			effects.consume(code);
			effects.exit(types.definitionMarker);
			return markerAfter;
		}
		return nok(code);
	}
	/**
	* After marker.
	*
	* ```markdown
	* > | [a]: b "c"
	*         ^
	* ```
	*
	* @type {State}
	*/
	function markerAfter(code) {
		return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, destinationBefore)(code) : destinationBefore(code);
	}
	/**
	* Before destination.
	*
	* ```markdown
	* > | [a]: b "c"
	*          ^
	* ```
	*
	* @type {State}
	*/
	function destinationBefore(code) {
		return factoryDestination(effects, destinationAfter, nok, types.definitionDestination, types.definitionDestinationLiteral, types.definitionDestinationLiteralMarker, types.definitionDestinationRaw, types.definitionDestinationString)(code);
	}
	/**
	* After destination.
	*
	* ```markdown
	* > | [a]: b "c"
	*           ^
	* ```
	*
	* @type {State}
	*/
	function destinationAfter(code) {
		return effects.attempt(titleBefore, after, after)(code);
	}
	/**
	* After definition.
	*
	* ```markdown
	* > | [a]: b
	*           ^
	* > | [a]: b "c"
	*               ^
	* ```
	*
	* @type {State}
	*/
	function after(code) {
		return markdownSpace(code) ? factorySpace(effects, afterWhitespace, types.whitespace)(code) : afterWhitespace(code);
	}
	/**
	* After definition, after optional whitespace.
	*
	* ```markdown
	* > | [a]: b
	*           ^
	* > | [a]: b "c"
	*               ^
	* ```
	*
	* @type {State}
	*/
	function afterWhitespace(code) {
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.definition);
			self.parser.defined.push(identifier);
			return ok$20(code);
		}
		return nok(code);
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeTitleBefore(effects, ok, nok) {
	return titleBefore;
	/**
	* After destination, at whitespace.
	*
	* ```markdown
	* > | [a]: b
	*           ^
	* > | [a]: b "c"
	*           ^
	* ```
	*
	* @type {State}
	*/
	function titleBefore(code) {
		return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, beforeMarker)(code) : nok(code);
	}
	/**
	* At title.
	*
	* ```markdown
	*   | [a]: b
	* > | "c"
	*     ^
	* ```
	*
	* @type {State}
	*/
	function beforeMarker(code) {
		return factoryTitle(effects, titleAfter, nok, types.definitionTitle, types.definitionTitleMarker, types.definitionTitleString)(code);
	}
	/**
	* After title.
	*
	* ```markdown
	* > | [a]: b "c"
	*               ^
	* ```
	*
	* @type {State}
	*/
	function titleAfter(code) {
		return markdownSpace(code) ? factorySpace(effects, titleAfterOptionalWhitespace, types.whitespace)(code) : titleAfterOptionalWhitespace(code);
	}
	/**
	* After title, after optional whitespace.
	*
	* ```markdown
	* > | [a]: b "c"
	*               ^
	* ```
	*
	* @type {State}
	*/
	function titleAfterOptionalWhitespace(code) {
		return code === codes.eof || markdownLineEnding(code) ? ok(code) : nok(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/hard-break-escape.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var hardBreakEscape = {
	name: "hardBreakEscape",
	tokenize: tokenizeHardBreakEscape
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeHardBreakEscape(effects, ok$19, nok) {
	return start;
	/**
	* Start of a hard break (escape).
	*
	* ```markdown
	* > | a\
	*      ^
	*   | b
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.backslash, "expected `\\`");
		effects.enter(types.hardBreakEscape);
		effects.consume(code);
		return after;
	}
	/**
	* After `\`, at eol.
	*
	* ```markdown
	* > | a\
	*       ^
	*   | b
	* ```
	*
	*  @type {State}
	*/
	function after(code) {
		if (markdownLineEnding(code)) {
			effects.exit(types.hardBreakEscape);
			return ok$19(code);
		}
		return nok(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/heading-atx.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').Resolver} Resolver
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').Token} Token
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var headingAtx = {
	name: "headingAtx",
	tokenize: tokenizeHeadingAtx,
	resolve: resolveHeadingAtx
};
/** @type {Resolver} */
function resolveHeadingAtx(events, context) {
	let contentEnd = events.length - 2;
	let contentStart = 3;
	/** @type {Token} */
	let content;
	/** @type {Token} */
	let text;
	if (events[contentStart][1].type === types.whitespace) contentStart += 2;
	if (contentEnd - 2 > contentStart && events[contentEnd][1].type === types.whitespace) contentEnd -= 2;
	if (events[contentEnd][1].type === types.atxHeadingSequence && (contentStart === contentEnd - 1 || contentEnd - 4 > contentStart && events[contentEnd - 2][1].type === types.whitespace)) contentEnd -= contentStart + 1 === contentEnd ? 2 : 4;
	if (contentEnd > contentStart) {
		content = {
			type: types.atxHeadingText,
			start: events[contentStart][1].start,
			end: events[contentEnd][1].end
		};
		text = {
			type: types.chunkText,
			start: events[contentStart][1].start,
			end: events[contentEnd][1].end,
			contentType: constants.contentTypeText
		};
		splice(events, contentStart, contentEnd - contentStart + 1, [
			[
				"enter",
				content,
				context
			],
			[
				"enter",
				text,
				context
			],
			[
				"exit",
				text,
				context
			],
			[
				"exit",
				content,
				context
			]
		]);
	}
	return events;
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeHeadingAtx(effects, ok$18, nok) {
	let size = 0;
	return start;
	/**
	* Start of a heading (atx).
	*
	* ```markdown
	* > | ## aa
	*     ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		effects.enter(types.atxHeading);
		return before(code);
	}
	/**
	* After optional whitespace, at `#`.
	*
	* ```markdown
	* > | ## aa
	*     ^
	* ```
	*
	* @type {State}
	*/
	function before(code) {
		ok(code === codes.numberSign, "expected `#`");
		effects.enter(types.atxHeadingSequence);
		return sequenceOpen(code);
	}
	/**
	* In opening sequence.
	*
	* ```markdown
	* > | ## aa
	*     ^
	* ```
	*
	* @type {State}
	*/
	function sequenceOpen(code) {
		if (code === codes.numberSign && size++ < constants.atxHeadingOpeningFenceSizeMax) {
			effects.consume(code);
			return sequenceOpen;
		}
		if (code === codes.eof || markdownLineEndingOrSpace(code)) {
			effects.exit(types.atxHeadingSequence);
			return atBreak(code);
		}
		return nok(code);
	}
	/**
	* After something, before something else.
	*
	* ```markdown
	* > | ## aa
	*       ^
	* ```
	*
	* @type {State}
	*/
	function atBreak(code) {
		if (code === codes.numberSign) {
			effects.enter(types.atxHeadingSequence);
			return sequenceFurther(code);
		}
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.atxHeading);
			return ok$18(code);
		}
		if (markdownSpace(code)) return factorySpace(effects, atBreak, types.whitespace)(code);
		effects.enter(types.atxHeadingText);
		return data(code);
	}
	/**
	* In further sequence (after whitespace).
	*
	* Could be normal “visible” hashes in the heading or a final sequence.
	*
	* ```markdown
	* > | ## aa ##
	*           ^
	* ```
	*
	* @type {State}
	*/
	function sequenceFurther(code) {
		if (code === codes.numberSign) {
			effects.consume(code);
			return sequenceFurther;
		}
		effects.exit(types.atxHeadingSequence);
		return atBreak(code);
	}
	/**
	* In text.
	*
	* ```markdown
	* > | ## aa
	*        ^
	* ```
	*
	* @type {State}
	*/
	function data(code) {
		if (code === codes.eof || code === codes.numberSign || markdownLineEndingOrSpace(code)) {
			effects.exit(types.atxHeadingText);
			return atBreak(code);
		}
		effects.consume(code);
		return data;
	}
}
//#endregion
//#region node_modules/micromark-util-html-tag-name/index.js
/**
* List of lowercase HTML “block” tag names.
*
* The list, when parsing HTML (flow), results in more relaxed rules (condition
* 6).
* Because they are known blocks, the HTML-like syntax doesn’t have to be
* strictly parsed.
* For tag names not in this list, a more strict algorithm (condition 7) is used
* to detect whether the HTML-like syntax is seen as HTML (flow) or not.
*
* This is copied from:
* <https://spec.commonmark.org/0.30/#html-blocks>.
*
* > 👉 **Note**: `search` was added in `CommonMark@0.31`.
*/
var htmlBlockNames = [
	"address",
	"article",
	"aside",
	"base",
	"basefont",
	"blockquote",
	"body",
	"caption",
	"center",
	"col",
	"colgroup",
	"dd",
	"details",
	"dialog",
	"dir",
	"div",
	"dl",
	"dt",
	"fieldset",
	"figcaption",
	"figure",
	"footer",
	"form",
	"frame",
	"frameset",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"head",
	"header",
	"hr",
	"html",
	"iframe",
	"legend",
	"li",
	"link",
	"main",
	"menu",
	"menuitem",
	"nav",
	"noframes",
	"ol",
	"optgroup",
	"option",
	"p",
	"param",
	"search",
	"section",
	"summary",
	"table",
	"tbody",
	"td",
	"tfoot",
	"th",
	"thead",
	"title",
	"tr",
	"track",
	"ul"
];
/**
* List of lowercase HTML “raw” tag names.
*
* The list, when parsing HTML (flow), results in HTML that can include lines
* without exiting, until a closing tag also in this list is found (condition
* 1).
*
* This module is copied from:
* <https://spec.commonmark.org/0.30/#html-blocks>.
*
* > 👉 **Note**: `textarea` was added in `CommonMark@0.30`.
*/
var htmlRawNames = [
	"pre",
	"script",
	"style",
	"textarea"
];
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/html-flow.js
/**
* @typedef {import('micromark-util-types').Code} Code
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').Resolver} Resolver
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var htmlFlow = {
	name: "htmlFlow",
	tokenize: tokenizeHtmlFlow,
	resolveTo: resolveToHtmlFlow,
	concrete: true
};
/** @type {Construct} */
var blankLineBefore = {
	tokenize: tokenizeBlankLineBefore,
	partial: true
};
var nonLazyContinuationStart = {
	tokenize: tokenizeNonLazyContinuationStart,
	partial: true
};
/** @type {Resolver} */
function resolveToHtmlFlow(events) {
	let index = events.length;
	while (index--) if (events[index][0] === "enter" && events[index][1].type === types.htmlFlow) break;
	if (index > 1 && events[index - 2][1].type === types.linePrefix) {
		events[index][1].start = events[index - 2][1].start;
		events[index + 1][1].start = events[index - 2][1].start;
		events.splice(index - 2, 2);
	}
	return events;
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeHtmlFlow(effects, ok$16, nok) {
	const self = this;
	/** @type {number} */
	let marker;
	/** @type {boolean} */
	let closingTag;
	/** @type {string} */
	let buffer;
	/** @type {number} */
	let index;
	/** @type {Code} */
	let markerB;
	return start;
	/**
	* Start of HTML (flow).
	*
	* ```markdown
	* > | <x />
	*     ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		return before(code);
	}
	/**
	* At `<`, after optional whitespace.
	*
	* ```markdown
	* > | <x />
	*     ^
	* ```
	*
	* @type {State}
	*/
	function before(code) {
		ok(code === codes.lessThan, "expected `<`");
		effects.enter(types.htmlFlow);
		effects.enter(types.htmlFlowData);
		effects.consume(code);
		return open;
	}
	/**
	* After `<`, at tag name or other stuff.
	*
	* ```markdown
	* > | <x />
	*      ^
	* > | <!doctype>
	*      ^
	* > | <!--xxx-->
	*      ^
	* ```
	*
	* @type {State}
	*/
	function open(code) {
		if (code === codes.exclamationMark) {
			effects.consume(code);
			return declarationOpen;
		}
		if (code === codes.slash) {
			effects.consume(code);
			closingTag = true;
			return tagCloseStart;
		}
		if (code === codes.questionMark) {
			effects.consume(code);
			marker = constants.htmlInstruction;
			return self.interrupt ? ok$16 : continuationDeclarationInside;
		}
		if (asciiAlpha(code)) {
			effects.consume(code);
			buffer = String.fromCharCode(code);
			return tagName;
		}
		return nok(code);
	}
	/**
	* After `<!`, at declaration, comment, or CDATA.
	*
	* ```markdown
	* > | <!doctype>
	*       ^
	* > | <!--xxx-->
	*       ^
	* > | <![CDATA[>&<]]>
	*       ^
	* ```
	*
	* @type {State}
	*/
	function declarationOpen(code) {
		if (code === codes.dash) {
			effects.consume(code);
			marker = constants.htmlComment;
			return commentOpenInside;
		}
		if (code === codes.leftSquareBracket) {
			effects.consume(code);
			marker = constants.htmlCdata;
			index = 0;
			return cdataOpenInside;
		}
		if (asciiAlpha(code)) {
			effects.consume(code);
			marker = constants.htmlDeclaration;
			return self.interrupt ? ok$16 : continuationDeclarationInside;
		}
		return nok(code);
	}
	/**
	* After `<!-`, inside a comment, at another `-`.
	*
	* ```markdown
	* > | <!--xxx-->
	*        ^
	* ```
	*
	* @type {State}
	*/
	function commentOpenInside(code) {
		if (code === codes.dash) {
			effects.consume(code);
			return self.interrupt ? ok$16 : continuationDeclarationInside;
		}
		return nok(code);
	}
	/**
	* After `<![`, inside CDATA, expecting `CDATA[`.
	*
	* ```markdown
	* > | <![CDATA[>&<]]>
	*        ^^^^^^
	* ```
	*
	* @type {State}
	*/
	function cdataOpenInside(code) {
		const value = constants.cdataOpeningString;
		if (code === value.charCodeAt(index++)) {
			effects.consume(code);
			if (index === value.length) return self.interrupt ? ok$16 : continuation;
			return cdataOpenInside;
		}
		return nok(code);
	}
	/**
	* After `</`, in closing tag, at tag name.
	*
	* ```markdown
	* > | </x>
	*       ^
	* ```
	*
	* @type {State}
	*/
	function tagCloseStart(code) {
		if (asciiAlpha(code)) {
			effects.consume(code);
			buffer = String.fromCharCode(code);
			return tagName;
		}
		return nok(code);
	}
	/**
	* In tag name.
	*
	* ```markdown
	* > | <ab>
	*      ^^
	* > | </ab>
	*       ^^
	* ```
	*
	* @type {State}
	*/
	function tagName(code) {
		if (code === codes.eof || code === codes.slash || code === codes.greaterThan || markdownLineEndingOrSpace(code)) {
			const slash = code === codes.slash;
			const name = buffer.toLowerCase();
			if (!slash && !closingTag && htmlRawNames.includes(name)) {
				marker = constants.htmlRaw;
				return self.interrupt ? ok$16(code) : continuation(code);
			}
			if (htmlBlockNames.includes(buffer.toLowerCase())) {
				marker = constants.htmlBasic;
				if (slash) {
					effects.consume(code);
					return basicSelfClosing;
				}
				return self.interrupt ? ok$16(code) : continuation(code);
			}
			marker = constants.htmlComplete;
			return self.interrupt && !self.parser.lazy[self.now().line] ? nok(code) : closingTag ? completeClosingTagAfter(code) : completeAttributeNameBefore(code);
		}
		if (code === codes.dash || asciiAlphanumeric(code)) {
			effects.consume(code);
			buffer += String.fromCharCode(code);
			return tagName;
		}
		return nok(code);
	}
	/**
	* After closing slash of a basic tag name.
	*
	* ```markdown
	* > | <div/>
	*          ^
	* ```
	*
	* @type {State}
	*/
	function basicSelfClosing(code) {
		if (code === codes.greaterThan) {
			effects.consume(code);
			return self.interrupt ? ok$16 : continuation;
		}
		return nok(code);
	}
	/**
	* After closing slash of a complete tag name.
	*
	* ```markdown
	* > | <x/>
	*        ^
	* ```
	*
	* @type {State}
	*/
	function completeClosingTagAfter(code) {
		if (markdownSpace(code)) {
			effects.consume(code);
			return completeClosingTagAfter;
		}
		return completeEnd(code);
	}
	/**
	* At an attribute name.
	*
	* At first, this state is used after a complete tag name, after whitespace,
	* where it expects optional attributes or the end of the tag.
	* It is also reused after attributes, when expecting more optional
	* attributes.
	*
	* ```markdown
	* > | <a />
	*        ^
	* > | <a :b>
	*        ^
	* > | <a _b>
	*        ^
	* > | <a b>
	*        ^
	* > | <a >
	*        ^
	* ```
	*
	* @type {State}
	*/
	function completeAttributeNameBefore(code) {
		if (code === codes.slash) {
			effects.consume(code);
			return completeEnd;
		}
		if (code === codes.colon || code === codes.underscore || asciiAlpha(code)) {
			effects.consume(code);
			return completeAttributeName;
		}
		if (markdownSpace(code)) {
			effects.consume(code);
			return completeAttributeNameBefore;
		}
		return completeEnd(code);
	}
	/**
	* In attribute name.
	*
	* ```markdown
	* > | <a :b>
	*         ^
	* > | <a _b>
	*         ^
	* > | <a b>
	*         ^
	* ```
	*
	* @type {State}
	*/
	function completeAttributeName(code) {
		if (code === codes.dash || code === codes.dot || code === codes.colon || code === codes.underscore || asciiAlphanumeric(code)) {
			effects.consume(code);
			return completeAttributeName;
		}
		return completeAttributeNameAfter(code);
	}
	/**
	* After attribute name, at an optional initializer, the end of the tag, or
	* whitespace.
	*
	* ```markdown
	* > | <a b>
	*         ^
	* > | <a b=c>
	*         ^
	* ```
	*
	* @type {State}
	*/
	function completeAttributeNameAfter(code) {
		if (code === codes.equalsTo) {
			effects.consume(code);
			return completeAttributeValueBefore;
		}
		if (markdownSpace(code)) {
			effects.consume(code);
			return completeAttributeNameAfter;
		}
		return completeAttributeNameBefore(code);
	}
	/**
	* Before unquoted, double quoted, or single quoted attribute value, allowing
	* whitespace.
	*
	* ```markdown
	* > | <a b=c>
	*          ^
	* > | <a b="c">
	*          ^
	* ```
	*
	* @type {State}
	*/
	function completeAttributeValueBefore(code) {
		if (code === codes.eof || code === codes.lessThan || code === codes.equalsTo || code === codes.greaterThan || code === codes.graveAccent) return nok(code);
		if (code === codes.quotationMark || code === codes.apostrophe) {
			effects.consume(code);
			markerB = code;
			return completeAttributeValueQuoted;
		}
		if (markdownSpace(code)) {
			effects.consume(code);
			return completeAttributeValueBefore;
		}
		return completeAttributeValueUnquoted(code);
	}
	/**
	* In double or single quoted attribute value.
	*
	* ```markdown
	* > | <a b="c">
	*           ^
	* > | <a b='c'>
	*           ^
	* ```
	*
	* @type {State}
	*/
	function completeAttributeValueQuoted(code) {
		if (code === markerB) {
			effects.consume(code);
			markerB = null;
			return completeAttributeValueQuotedAfter;
		}
		if (code === codes.eof || markdownLineEnding(code)) return nok(code);
		effects.consume(code);
		return completeAttributeValueQuoted;
	}
	/**
	* In unquoted attribute value.
	*
	* ```markdown
	* > | <a b=c>
	*          ^
	* ```
	*
	* @type {State}
	*/
	function completeAttributeValueUnquoted(code) {
		if (code === codes.eof || code === codes.quotationMark || code === codes.apostrophe || code === codes.slash || code === codes.lessThan || code === codes.equalsTo || code === codes.greaterThan || code === codes.graveAccent || markdownLineEndingOrSpace(code)) return completeAttributeNameAfter(code);
		effects.consume(code);
		return completeAttributeValueUnquoted;
	}
	/**
	* After double or single quoted attribute value, before whitespace or the
	* end of the tag.
	*
	* ```markdown
	* > | <a b="c">
	*            ^
	* ```
	*
	* @type {State}
	*/
	function completeAttributeValueQuotedAfter(code) {
		if (code === codes.slash || code === codes.greaterThan || markdownSpace(code)) return completeAttributeNameBefore(code);
		return nok(code);
	}
	/**
	* In certain circumstances of a complete tag where only an `>` is allowed.
	*
	* ```markdown
	* > | <a b="c">
	*             ^
	* ```
	*
	* @type {State}
	*/
	function completeEnd(code) {
		if (code === codes.greaterThan) {
			effects.consume(code);
			return completeAfter;
		}
		return nok(code);
	}
	/**
	* After `>` in a complete tag.
	*
	* ```markdown
	* > | <x>
	*        ^
	* ```
	*
	* @type {State}
	*/
	function completeAfter(code) {
		if (code === codes.eof || markdownLineEnding(code)) return continuation(code);
		if (markdownSpace(code)) {
			effects.consume(code);
			return completeAfter;
		}
		return nok(code);
	}
	/**
	* In continuation of any HTML kind.
	*
	* ```markdown
	* > | <!--xxx-->
	*          ^
	* ```
	*
	* @type {State}
	*/
	function continuation(code) {
		if (code === codes.dash && marker === constants.htmlComment) {
			effects.consume(code);
			return continuationCommentInside;
		}
		if (code === codes.lessThan && marker === constants.htmlRaw) {
			effects.consume(code);
			return continuationRawTagOpen;
		}
		if (code === codes.greaterThan && marker === constants.htmlDeclaration) {
			effects.consume(code);
			return continuationClose;
		}
		if (code === codes.questionMark && marker === constants.htmlInstruction) {
			effects.consume(code);
			return continuationDeclarationInside;
		}
		if (code === codes.rightSquareBracket && marker === constants.htmlCdata) {
			effects.consume(code);
			return continuationCdataInside;
		}
		if (markdownLineEnding(code) && (marker === constants.htmlBasic || marker === constants.htmlComplete)) {
			effects.exit(types.htmlFlowData);
			return effects.check(blankLineBefore, continuationAfter, continuationStart)(code);
		}
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.htmlFlowData);
			return continuationStart(code);
		}
		effects.consume(code);
		return continuation;
	}
	/**
	* In continuation, at eol.
	*
	* ```markdown
	* > | <x>
	*        ^
	*   | asd
	* ```
	*
	* @type {State}
	*/
	function continuationStart(code) {
		return effects.check(nonLazyContinuationStart, continuationStartNonLazy, continuationAfter)(code);
	}
	/**
	* In continuation, at eol, before non-lazy content.
	*
	* ```markdown
	* > | <x>
	*        ^
	*   | asd
	* ```
	*
	* @type {State}
	*/
	function continuationStartNonLazy(code) {
		ok(markdownLineEnding(code));
		effects.enter(types.lineEnding);
		effects.consume(code);
		effects.exit(types.lineEnding);
		return continuationBefore;
	}
	/**
	* In continuation, before non-lazy content.
	*
	* ```markdown
	*   | <x>
	* > | asd
	*     ^
	* ```
	*
	* @type {State}
	*/
	function continuationBefore(code) {
		if (code === codes.eof || markdownLineEnding(code)) return continuationStart(code);
		effects.enter(types.htmlFlowData);
		return continuation(code);
	}
	/**
	* In comment continuation, after one `-`, expecting another.
	*
	* ```markdown
	* > | <!--xxx-->
	*             ^
	* ```
	*
	* @type {State}
	*/
	function continuationCommentInside(code) {
		if (code === codes.dash) {
			effects.consume(code);
			return continuationDeclarationInside;
		}
		return continuation(code);
	}
	/**
	* In raw continuation, after `<`, at `/`.
	*
	* ```markdown
	* > | <script>console.log(1)<\/script>
	*                            ^
	* ```
	*
	* @type {State}
	*/
	function continuationRawTagOpen(code) {
		if (code === codes.slash) {
			effects.consume(code);
			buffer = "";
			return continuationRawEndTag;
		}
		return continuation(code);
	}
	/**
	* In raw continuation, after `</`, in a raw tag name.
	*
	* ```markdown
	* > | <script>console.log(1)<\/script>
	*                             ^^^^^^
	* ```
	*
	* @type {State}
	*/
	function continuationRawEndTag(code) {
		if (code === codes.greaterThan) {
			const name = buffer.toLowerCase();
			if (htmlRawNames.includes(name)) {
				effects.consume(code);
				return continuationClose;
			}
			return continuation(code);
		}
		if (asciiAlpha(code) && buffer.length < constants.htmlRawSizeMax) {
			effects.consume(code);
			buffer += String.fromCharCode(code);
			return continuationRawEndTag;
		}
		return continuation(code);
	}
	/**
	* In cdata continuation, after `]`, expecting `]>`.
	*
	* ```markdown
	* > | <![CDATA[>&<]]>
	*                  ^
	* ```
	*
	* @type {State}
	*/
	function continuationCdataInside(code) {
		if (code === codes.rightSquareBracket) {
			effects.consume(code);
			return continuationDeclarationInside;
		}
		return continuation(code);
	}
	/**
	* In declaration or instruction continuation, at `>`.
	*
	* ```markdown
	* > | <!-->
	*         ^
	* > | <?>
	*       ^
	* > | <!q>
	*        ^
	* > | <!--ab-->
	*             ^
	* > | <![CDATA[>&<]]>
	*                   ^
	* ```
	*
	* @type {State}
	*/
	function continuationDeclarationInside(code) {
		if (code === codes.greaterThan) {
			effects.consume(code);
			return continuationClose;
		}
		if (code === codes.dash && marker === constants.htmlComment) {
			effects.consume(code);
			return continuationDeclarationInside;
		}
		return continuation(code);
	}
	/**
	* In closed continuation: everything we get until the eol/eof is part of it.
	*
	* ```markdown
	* > | <!doctype>
	*               ^
	* ```
	*
	* @type {State}
	*/
	function continuationClose(code) {
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.htmlFlowData);
			return continuationAfter(code);
		}
		effects.consume(code);
		return continuationClose;
	}
	/**
	* Done.
	*
	* ```markdown
	* > | <!doctype>
	*               ^
	* ```
	*
	* @type {State}
	*/
	function continuationAfter(code) {
		effects.exit(types.htmlFlow);
		return ok$16(code);
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeNonLazyContinuationStart(effects, ok, nok) {
	const self = this;
	return start;
	/**
	* At eol, before continuation.
	*
	* ```markdown
	* > | * ```js
	*            ^
	*   | b
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		if (markdownLineEnding(code)) {
			effects.enter(types.lineEnding);
			effects.consume(code);
			effects.exit(types.lineEnding);
			return after;
		}
		return nok(code);
	}
	/**
	* A continuation.
	*
	* ```markdown
	*   | * ```js
	* > | b
	*     ^
	* ```
	*
	* @type {State}
	*/
	function after(code) {
		return self.parser.lazy[self.now().line] ? nok(code) : ok(code);
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeBlankLineBefore(effects, ok$17, nok) {
	return start;
	/**
	* Before eol, expecting blank line.
	*
	* ```markdown
	* > | <div>
	*          ^
	*   |
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(markdownLineEnding(code), "expected a line ending");
		effects.enter(types.lineEnding);
		effects.consume(code);
		effects.exit(types.lineEnding);
		return effects.attempt(blankLine, ok$17, nok);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/html-text.js
/**
* @typedef {import('micromark-util-types').Code} Code
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var htmlText = {
	name: "htmlText",
	tokenize: tokenizeHtmlText
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeHtmlText(effects, ok$15, nok) {
	const self = this;
	/** @type {NonNullable<Code> | undefined} */
	let marker;
	/** @type {number} */
	let index;
	/** @type {State} */
	let returnState;
	return start;
	/**
	* Start of HTML (text).
	*
	* ```markdown
	* > | a <b> c
	*       ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.lessThan, "expected `<`");
		effects.enter(types.htmlText);
		effects.enter(types.htmlTextData);
		effects.consume(code);
		return open;
	}
	/**
	* After `<`, at tag name or other stuff.
	*
	* ```markdown
	* > | a <b> c
	*        ^
	* > | a <!doctype> c
	*        ^
	* > | a <!--b--> c
	*        ^
	* ```
	*
	* @type {State}
	*/
	function open(code) {
		if (code === codes.exclamationMark) {
			effects.consume(code);
			return declarationOpen;
		}
		if (code === codes.slash) {
			effects.consume(code);
			return tagCloseStart;
		}
		if (code === codes.questionMark) {
			effects.consume(code);
			return instruction;
		}
		if (asciiAlpha(code)) {
			effects.consume(code);
			return tagOpen;
		}
		return nok(code);
	}
	/**
	* After `<!`, at declaration, comment, or CDATA.
	*
	* ```markdown
	* > | a <!doctype> c
	*         ^
	* > | a <!--b--> c
	*         ^
	* > | a <![CDATA[>&<]]> c
	*         ^
	* ```
	*
	* @type {State}
	*/
	function declarationOpen(code) {
		if (code === codes.dash) {
			effects.consume(code);
			return commentOpenInside;
		}
		if (code === codes.leftSquareBracket) {
			effects.consume(code);
			index = 0;
			return cdataOpenInside;
		}
		if (asciiAlpha(code)) {
			effects.consume(code);
			return declaration;
		}
		return nok(code);
	}
	/**
	* In a comment, after `<!-`, at another `-`.
	*
	* ```markdown
	* > | a <!--b--> c
	*          ^
	* ```
	*
	* @type {State}
	*/
	function commentOpenInside(code) {
		if (code === codes.dash) {
			effects.consume(code);
			return commentEnd;
		}
		return nok(code);
	}
	/**
	* In comment.
	*
	* ```markdown
	* > | a <!--b--> c
	*           ^
	* ```
	*
	* @type {State}
	*/
	function comment(code) {
		if (code === codes.eof) return nok(code);
		if (code === codes.dash) {
			effects.consume(code);
			return commentClose;
		}
		if (markdownLineEnding(code)) {
			returnState = comment;
			return lineEndingBefore(code);
		}
		effects.consume(code);
		return comment;
	}
	/**
	* In comment, after `-`.
	*
	* ```markdown
	* > | a <!--b--> c
	*             ^
	* ```
	*
	* @type {State}
	*/
	function commentClose(code) {
		if (code === codes.dash) {
			effects.consume(code);
			return commentEnd;
		}
		return comment(code);
	}
	/**
	* In comment, after `--`.
	*
	* ```markdown
	* > | a <!--b--> c
	*              ^
	* ```
	*
	* @type {State}
	*/
	function commentEnd(code) {
		return code === codes.greaterThan ? end(code) : code === codes.dash ? commentClose(code) : comment(code);
	}
	/**
	* After `<![`, in CDATA, expecting `CDATA[`.
	*
	* ```markdown
	* > | a <![CDATA[>&<]]> b
	*          ^^^^^^
	* ```
	*
	* @type {State}
	*/
	function cdataOpenInside(code) {
		const value = constants.cdataOpeningString;
		if (code === value.charCodeAt(index++)) {
			effects.consume(code);
			return index === value.length ? cdata : cdataOpenInside;
		}
		return nok(code);
	}
	/**
	* In CDATA.
	*
	* ```markdown
	* > | a <![CDATA[>&<]]> b
	*                ^^^
	* ```
	*
	* @type {State}
	*/
	function cdata(code) {
		if (code === codes.eof) return nok(code);
		if (code === codes.rightSquareBracket) {
			effects.consume(code);
			return cdataClose;
		}
		if (markdownLineEnding(code)) {
			returnState = cdata;
			return lineEndingBefore(code);
		}
		effects.consume(code);
		return cdata;
	}
	/**
	* In CDATA, after `]`, at another `]`.
	*
	* ```markdown
	* > | a <![CDATA[>&<]]> b
	*                    ^
	* ```
	*
	* @type {State}
	*/
	function cdataClose(code) {
		if (code === codes.rightSquareBracket) {
			effects.consume(code);
			return cdataEnd;
		}
		return cdata(code);
	}
	/**
	* In CDATA, after `]]`, at `>`.
	*
	* ```markdown
	* > | a <![CDATA[>&<]]> b
	*                     ^
	* ```
	*
	* @type {State}
	*/
	function cdataEnd(code) {
		if (code === codes.greaterThan) return end(code);
		if (code === codes.rightSquareBracket) {
			effects.consume(code);
			return cdataEnd;
		}
		return cdata(code);
	}
	/**
	* In declaration.
	*
	* ```markdown
	* > | a <!b> c
	*          ^
	* ```
	*
	* @type {State}
	*/
	function declaration(code) {
		if (code === codes.eof || code === codes.greaterThan) return end(code);
		if (markdownLineEnding(code)) {
			returnState = declaration;
			return lineEndingBefore(code);
		}
		effects.consume(code);
		return declaration;
	}
	/**
	* In instruction.
	*
	* ```markdown
	* > | a <?b?> c
	*         ^
	* ```
	*
	* @type {State}
	*/
	function instruction(code) {
		if (code === codes.eof) return nok(code);
		if (code === codes.questionMark) {
			effects.consume(code);
			return instructionClose;
		}
		if (markdownLineEnding(code)) {
			returnState = instruction;
			return lineEndingBefore(code);
		}
		effects.consume(code);
		return instruction;
	}
	/**
	* In instruction, after `?`, at `>`.
	*
	* ```markdown
	* > | a <?b?> c
	*           ^
	* ```
	*
	* @type {State}
	*/
	function instructionClose(code) {
		return code === codes.greaterThan ? end(code) : instruction(code);
	}
	/**
	* After `</`, in closing tag, at tag name.
	*
	* ```markdown
	* > | a </b> c
	*         ^
	* ```
	*
	* @type {State}
	*/
	function tagCloseStart(code) {
		if (asciiAlpha(code)) {
			effects.consume(code);
			return tagClose;
		}
		return nok(code);
	}
	/**
	* After `</x`, in a tag name.
	*
	* ```markdown
	* > | a </b> c
	*          ^
	* ```
	*
	* @type {State}
	*/
	function tagClose(code) {
		if (code === codes.dash || asciiAlphanumeric(code)) {
			effects.consume(code);
			return tagClose;
		}
		return tagCloseBetween(code);
	}
	/**
	* In closing tag, after tag name.
	*
	* ```markdown
	* > | a </b> c
	*          ^
	* ```
	*
	* @type {State}
	*/
	function tagCloseBetween(code) {
		if (markdownLineEnding(code)) {
			returnState = tagCloseBetween;
			return lineEndingBefore(code);
		}
		if (markdownSpace(code)) {
			effects.consume(code);
			return tagCloseBetween;
		}
		return end(code);
	}
	/**
	* After `<x`, in opening tag name.
	*
	* ```markdown
	* > | a <b> c
	*         ^
	* ```
	*
	* @type {State}
	*/
	function tagOpen(code) {
		if (code === codes.dash || asciiAlphanumeric(code)) {
			effects.consume(code);
			return tagOpen;
		}
		if (code === codes.slash || code === codes.greaterThan || markdownLineEndingOrSpace(code)) return tagOpenBetween(code);
		return nok(code);
	}
	/**
	* In opening tag, after tag name.
	*
	* ```markdown
	* > | a <b> c
	*         ^
	* ```
	*
	* @type {State}
	*/
	function tagOpenBetween(code) {
		if (code === codes.slash) {
			effects.consume(code);
			return end;
		}
		if (code === codes.colon || code === codes.underscore || asciiAlpha(code)) {
			effects.consume(code);
			return tagOpenAttributeName;
		}
		if (markdownLineEnding(code)) {
			returnState = tagOpenBetween;
			return lineEndingBefore(code);
		}
		if (markdownSpace(code)) {
			effects.consume(code);
			return tagOpenBetween;
		}
		return end(code);
	}
	/**
	* In attribute name.
	*
	* ```markdown
	* > | a <b c> d
	*          ^
	* ```
	*
	* @type {State}
	*/
	function tagOpenAttributeName(code) {
		if (code === codes.dash || code === codes.dot || code === codes.colon || code === codes.underscore || asciiAlphanumeric(code)) {
			effects.consume(code);
			return tagOpenAttributeName;
		}
		return tagOpenAttributeNameAfter(code);
	}
	/**
	* After attribute name, before initializer, the end of the tag, or
	* whitespace.
	*
	* ```markdown
	* > | a <b c> d
	*           ^
	* ```
	*
	* @type {State}
	*/
	function tagOpenAttributeNameAfter(code) {
		if (code === codes.equalsTo) {
			effects.consume(code);
			return tagOpenAttributeValueBefore;
		}
		if (markdownLineEnding(code)) {
			returnState = tagOpenAttributeNameAfter;
			return lineEndingBefore(code);
		}
		if (markdownSpace(code)) {
			effects.consume(code);
			return tagOpenAttributeNameAfter;
		}
		return tagOpenBetween(code);
	}
	/**
	* Before unquoted, double quoted, or single quoted attribute value, allowing
	* whitespace.
	*
	* ```markdown
	* > | a <b c=d> e
	*            ^
	* ```
	*
	* @type {State}
	*/
	function tagOpenAttributeValueBefore(code) {
		if (code === codes.eof || code === codes.lessThan || code === codes.equalsTo || code === codes.greaterThan || code === codes.graveAccent) return nok(code);
		if (code === codes.quotationMark || code === codes.apostrophe) {
			effects.consume(code);
			marker = code;
			return tagOpenAttributeValueQuoted;
		}
		if (markdownLineEnding(code)) {
			returnState = tagOpenAttributeValueBefore;
			return lineEndingBefore(code);
		}
		if (markdownSpace(code)) {
			effects.consume(code);
			return tagOpenAttributeValueBefore;
		}
		effects.consume(code);
		return tagOpenAttributeValueUnquoted;
	}
	/**
	* In double or single quoted attribute value.
	*
	* ```markdown
	* > | a <b c="d"> e
	*             ^
	* ```
	*
	* @type {State}
	*/
	function tagOpenAttributeValueQuoted(code) {
		if (code === marker) {
			effects.consume(code);
			marker = void 0;
			return tagOpenAttributeValueQuotedAfter;
		}
		if (code === codes.eof) return nok(code);
		if (markdownLineEnding(code)) {
			returnState = tagOpenAttributeValueQuoted;
			return lineEndingBefore(code);
		}
		effects.consume(code);
		return tagOpenAttributeValueQuoted;
	}
	/**
	* In unquoted attribute value.
	*
	* ```markdown
	* > | a <b c=d> e
	*            ^
	* ```
	*
	* @type {State}
	*/
	function tagOpenAttributeValueUnquoted(code) {
		if (code === codes.eof || code === codes.quotationMark || code === codes.apostrophe || code === codes.lessThan || code === codes.equalsTo || code === codes.graveAccent) return nok(code);
		if (code === codes.slash || code === codes.greaterThan || markdownLineEndingOrSpace(code)) return tagOpenBetween(code);
		effects.consume(code);
		return tagOpenAttributeValueUnquoted;
	}
	/**
	* After double or single quoted attribute value, before whitespace or the end
	* of the tag.
	*
	* ```markdown
	* > | a <b c="d"> e
	*               ^
	* ```
	*
	* @type {State}
	*/
	function tagOpenAttributeValueQuotedAfter(code) {
		if (code === codes.slash || code === codes.greaterThan || markdownLineEndingOrSpace(code)) return tagOpenBetween(code);
		return nok(code);
	}
	/**
	* In certain circumstances of a tag where only an `>` is allowed.
	*
	* ```markdown
	* > | a <b c="d"> e
	*               ^
	* ```
	*
	* @type {State}
	*/
	function end(code) {
		if (code === codes.greaterThan) {
			effects.consume(code);
			effects.exit(types.htmlTextData);
			effects.exit(types.htmlText);
			return ok$15;
		}
		return nok(code);
	}
	/**
	* At eol.
	*
	* > 👉 **Note**: we can’t have blank lines in text, so no need to worry about
	* > empty tokens.
	*
	* ```markdown
	* > | a <!--a
	*            ^
	*   | b-->
	* ```
	*
	* @type {State}
	*/
	function lineEndingBefore(code) {
		ok(returnState, "expected return state");
		ok(markdownLineEnding(code), "expected eol");
		effects.exit(types.htmlTextData);
		effects.enter(types.lineEnding);
		effects.consume(code);
		effects.exit(types.lineEnding);
		return lineEndingAfter;
	}
	/**
	* After eol, at optional whitespace.
	*
	* > 👉 **Note**: we can’t have blank lines in text, so no need to worry about
	* > empty tokens.
	*
	* ```markdown
	*   | a <!--a
	* > | b-->
	*     ^
	* ```
	*
	* @type {State}
	*/
	function lineEndingAfter(code) {
		ok(self.parser.constructs.disable.null, "expected `disable.null` to be populated");
		return markdownSpace(code) ? factorySpace(effects, lineEndingAfterPrefix, types.linePrefix, self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : constants.tabSize)(code) : lineEndingAfterPrefix(code);
	}
	/**
	* After eol, after optional whitespace.
	*
	* > 👉 **Note**: we can’t have blank lines in text, so no need to worry about
	* > empty tokens.
	*
	* ```markdown
	*   | a <!--a
	* > | b-->
	*     ^
	* ```
	*
	* @type {State}
	*/
	function lineEndingAfterPrefix(code) {
		effects.enter(types.htmlTextData);
		return returnState(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/label-end.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').Event} Event
* @typedef {import('micromark-util-types').Resolver} Resolver
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').Token} Token
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var labelEnd = {
	name: "labelEnd",
	tokenize: tokenizeLabelEnd,
	resolveTo: resolveToLabelEnd,
	resolveAll: resolveAllLabelEnd
};
/** @type {Construct} */
var resourceConstruct = { tokenize: tokenizeResource };
/** @type {Construct} */
var referenceFullConstruct = { tokenize: tokenizeReferenceFull };
/** @type {Construct} */
var referenceCollapsedConstruct = { tokenize: tokenizeReferenceCollapsed };
/** @type {Resolver} */
function resolveAllLabelEnd(events) {
	let index = -1;
	while (++index < events.length) {
		const token = events[index][1];
		if (token.type === types.labelImage || token.type === types.labelLink || token.type === types.labelEnd) {
			events.splice(index + 1, token.type === types.labelImage ? 4 : 2);
			token.type = types.data;
			index++;
		}
	}
	return events;
}
/** @type {Resolver} */
function resolveToLabelEnd(events, context) {
	let index = events.length;
	let offset = 0;
	/** @type {Token} */
	let token;
	/** @type {number | undefined} */
	let open;
	/** @type {number | undefined} */
	let close;
	/** @type {Array<Event>} */
	let media;
	while (index--) {
		token = events[index][1];
		if (open) {
			if (token.type === types.link || token.type === types.labelLink && token._inactive) break;
			if (events[index][0] === "enter" && token.type === types.labelLink) token._inactive = true;
		} else if (close) {
			if (events[index][0] === "enter" && (token.type === types.labelImage || token.type === types.labelLink) && !token._balanced) {
				open = index;
				if (token.type !== types.labelLink) {
					offset = 2;
					break;
				}
			}
		} else if (token.type === types.labelEnd) close = index;
	}
	ok(open !== void 0, "`open` is supposed to be found");
	ok(close !== void 0, "`close` is supposed to be found");
	const group = {
		type: events[open][1].type === types.labelLink ? types.link : types.image,
		start: Object.assign({}, events[open][1].start),
		end: Object.assign({}, events[events.length - 1][1].end)
	};
	const label = {
		type: types.label,
		start: Object.assign({}, events[open][1].start),
		end: Object.assign({}, events[close][1].end)
	};
	const text = {
		type: types.labelText,
		start: Object.assign({}, events[open + offset + 2][1].end),
		end: Object.assign({}, events[close - 2][1].start)
	};
	media = [[
		"enter",
		group,
		context
	], [
		"enter",
		label,
		context
	]];
	media = push(media, events.slice(open + 1, open + offset + 3));
	media = push(media, [[
		"enter",
		text,
		context
	]]);
	ok(context.parser.constructs.insideSpan.null, "expected `insideSpan.null` to be populated");
	media = push(media, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + offset + 4, close - 3), context));
	media = push(media, [
		[
			"exit",
			text,
			context
		],
		events[close - 2],
		events[close - 1],
		[
			"exit",
			label,
			context
		]
	]);
	media = push(media, events.slice(close + 1));
	media = push(media, [[
		"exit",
		group,
		context
	]]);
	splice(events, open, events.length, media);
	return events;
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeLabelEnd(effects, ok$11, nok) {
	const self = this;
	let index = self.events.length;
	/** @type {Token} */
	let labelStart;
	/** @type {boolean} */
	let defined;
	while (index--) if ((self.events[index][1].type === types.labelImage || self.events[index][1].type === types.labelLink) && !self.events[index][1]._balanced) {
		labelStart = self.events[index][1];
		break;
	}
	return start;
	/**
	* Start of label end.
	*
	* ```markdown
	* > | [a](b) c
	*       ^
	* > | [a][b] c
	*       ^
	* > | [a][] b
	*       ^
	* > | [a] b
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.rightSquareBracket, "expected `]`");
		if (!labelStart) return nok(code);
		if (labelStart._inactive) return labelEndNok(code);
		defined = self.parser.defined.includes(normalizeIdentifier(self.sliceSerialize({
			start: labelStart.end,
			end: self.now()
		})));
		effects.enter(types.labelEnd);
		effects.enter(types.labelMarker);
		effects.consume(code);
		effects.exit(types.labelMarker);
		effects.exit(types.labelEnd);
		return after;
	}
	/**
	* After `]`.
	*
	* ```markdown
	* > | [a](b) c
	*       ^
	* > | [a][b] c
	*       ^
	* > | [a][] b
	*       ^
	* > | [a] b
	*       ^
	* ```
	*
	* @type {State}
	*/
	function after(code) {
		if (code === codes.leftParenthesis) return effects.attempt(resourceConstruct, labelEndOk, defined ? labelEndOk : labelEndNok)(code);
		if (code === codes.leftSquareBracket) return effects.attempt(referenceFullConstruct, labelEndOk, defined ? referenceNotFull : labelEndNok)(code);
		return defined ? labelEndOk(code) : labelEndNok(code);
	}
	/**
	* After `]`, at `[`, but not at a full reference.
	*
	* > 👉 **Note**: we only get here if the label is defined.
	*
	* ```markdown
	* > | [a][] b
	*        ^
	* > | [a] b
	*        ^
	* ```
	*
	* @type {State}
	*/
	function referenceNotFull(code) {
		return effects.attempt(referenceCollapsedConstruct, labelEndOk, labelEndNok)(code);
	}
	/**
	* Done, we found something.
	*
	* ```markdown
	* > | [a](b) c
	*           ^
	* > | [a][b] c
	*           ^
	* > | [a][] b
	*          ^
	* > | [a] b
	*        ^
	* ```
	*
	* @type {State}
	*/
	function labelEndOk(code) {
		return ok$11(code);
	}
	/**
	* Done, it’s nothing.
	*
	* There was an okay opening, but we didn’t match anything.
	*
	* ```markdown
	* > | [a](b c
	*        ^
	* > | [a][b c
	*        ^
	* > | [a] b
	*        ^
	* ```
	*
	* @type {State}
	*/
	function labelEndNok(code) {
		labelStart._balanced = true;
		return nok(code);
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeResource(effects, ok$12, nok) {
	return resourceStart;
	/**
	* At a resource.
	*
	* ```markdown
	* > | [a](b) c
	*        ^
	* ```
	*
	* @type {State}
	*/
	function resourceStart(code) {
		ok(code === codes.leftParenthesis, "expected left paren");
		effects.enter(types.resource);
		effects.enter(types.resourceMarker);
		effects.consume(code);
		effects.exit(types.resourceMarker);
		return resourceBefore;
	}
	/**
	* In resource, after `(`, at optional whitespace.
	*
	* ```markdown
	* > | [a](b) c
	*         ^
	* ```
	*
	* @type {State}
	*/
	function resourceBefore(code) {
		return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, resourceOpen)(code) : resourceOpen(code);
	}
	/**
	* In resource, after optional whitespace, at `)` or a destination.
	*
	* ```markdown
	* > | [a](b) c
	*         ^
	* ```
	*
	* @type {State}
	*/
	function resourceOpen(code) {
		if (code === codes.rightParenthesis) return resourceEnd(code);
		return factoryDestination(effects, resourceDestinationAfter, resourceDestinationMissing, types.resourceDestination, types.resourceDestinationLiteral, types.resourceDestinationLiteralMarker, types.resourceDestinationRaw, types.resourceDestinationString, constants.linkResourceDestinationBalanceMax)(code);
	}
	/**
	* In resource, after destination, at optional whitespace.
	*
	* ```markdown
	* > | [a](b) c
	*          ^
	* ```
	*
	* @type {State}
	*/
	function resourceDestinationAfter(code) {
		return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, resourceBetween)(code) : resourceEnd(code);
	}
	/**
	* At invalid destination.
	*
	* ```markdown
	* > | [a](<<) b
	*         ^
	* ```
	*
	* @type {State}
	*/
	function resourceDestinationMissing(code) {
		return nok(code);
	}
	/**
	* In resource, after destination and whitespace, at `(` or title.
	*
	* ```markdown
	* > | [a](b ) c
	*           ^
	* ```
	*
	* @type {State}
	*/
	function resourceBetween(code) {
		if (code === codes.quotationMark || code === codes.apostrophe || code === codes.leftParenthesis) return factoryTitle(effects, resourceTitleAfter, nok, types.resourceTitle, types.resourceTitleMarker, types.resourceTitleString)(code);
		return resourceEnd(code);
	}
	/**
	* In resource, after title, at optional whitespace.
	*
	* ```markdown
	* > | [a](b "c") d
	*              ^
	* ```
	*
	* @type {State}
	*/
	function resourceTitleAfter(code) {
		return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, resourceEnd)(code) : resourceEnd(code);
	}
	/**
	* In resource, at `)`.
	*
	* ```markdown
	* > | [a](b) d
	*          ^
	* ```
	*
	* @type {State}
	*/
	function resourceEnd(code) {
		if (code === codes.rightParenthesis) {
			effects.enter(types.resourceMarker);
			effects.consume(code);
			effects.exit(types.resourceMarker);
			effects.exit(types.resource);
			return ok$12;
		}
		return nok(code);
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeReferenceFull(effects, ok$13, nok) {
	const self = this;
	return referenceFull;
	/**
	* In a reference (full), at the `[`.
	*
	* ```markdown
	* > | [a][b] d
	*        ^
	* ```
	*
	* @type {State}
	*/
	function referenceFull(code) {
		ok(code === codes.leftSquareBracket, "expected left bracket");
		return factoryLabel.call(self, effects, referenceFullAfter, referenceFullMissing, types.reference, types.referenceMarker, types.referenceString)(code);
	}
	/**
	* In a reference (full), after `]`.
	*
	* ```markdown
	* > | [a][b] d
	*          ^
	* ```
	*
	* @type {State}
	*/
	function referenceFullAfter(code) {
		return self.parser.defined.includes(normalizeIdentifier(self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1))) ? ok$13(code) : nok(code);
	}
	/**
	* In reference (full) that was missing.
	*
	* ```markdown
	* > | [a][b d
	*        ^
	* ```
	*
	* @type {State}
	*/
	function referenceFullMissing(code) {
		return nok(code);
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeReferenceCollapsed(effects, ok$14, nok) {
	return referenceCollapsedStart;
	/**
	* In reference (collapsed), at `[`.
	*
	* > 👉 **Note**: we only get here if the label is defined.
	*
	* ```markdown
	* > | [a][] d
	*        ^
	* ```
	*
	* @type {State}
	*/
	function referenceCollapsedStart(code) {
		ok(code === codes.leftSquareBracket, "expected left bracket");
		effects.enter(types.reference);
		effects.enter(types.referenceMarker);
		effects.consume(code);
		effects.exit(types.referenceMarker);
		return referenceCollapsedOpen;
	}
	/**
	* In reference (collapsed), at `]`.
	*
	* > 👉 **Note**: we only get here if the label is defined.
	*
	* ```markdown
	* > | [a][] d
	*         ^
	* ```
	*
	*  @type {State}
	*/
	function referenceCollapsedOpen(code) {
		if (code === codes.rightSquareBracket) {
			effects.enter(types.referenceMarker);
			effects.consume(code);
			effects.exit(types.referenceMarker);
			effects.exit(types.reference);
			return ok$14;
		}
		return nok(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/label-start-image.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var labelStartImage = {
	name: "labelStartImage",
	tokenize: tokenizeLabelStartImage,
	resolveAll: labelEnd.resolveAll
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeLabelStartImage(effects, ok$10, nok) {
	const self = this;
	return start;
	/**
	* Start of label (image) start.
	*
	* ```markdown
	* > | a ![b] c
	*       ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.exclamationMark, "expected `!`");
		effects.enter(types.labelImage);
		effects.enter(types.labelImageMarker);
		effects.consume(code);
		effects.exit(types.labelImageMarker);
		return open;
	}
	/**
	* After `!`, at `[`.
	*
	* ```markdown
	* > | a ![b] c
	*        ^
	* ```
	*
	* @type {State}
	*/
	function open(code) {
		if (code === codes.leftSquareBracket) {
			effects.enter(types.labelMarker);
			effects.consume(code);
			effects.exit(types.labelMarker);
			effects.exit(types.labelImage);
			return after;
		}
		return nok(code);
	}
	/**
	* After `![`.
	*
	* ```markdown
	* > | a ![b] c
	*         ^
	* ```
	*
	* This is needed in because, when GFM footnotes are enabled, images never
	* form when started with a `^`.
	* Instead, links form:
	*
	* ```markdown
	* ![^a](b)
	*
	* ![^a][b]
	*
	* [b]: c
	* ```
	*
	* ```html
	* <p>!<a href=\"b\">^a</a></p>
	* <p>!<a href=\"c\">^a</a></p>
	* ```
	*
	* @type {State}
	*/
	function after(code) {
		/* c8 ignore next 3 */
		return code === codes.caret && "_hiddenFootnoteSupport" in self.parser.constructs ? nok(code) : ok$10(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/label-start-link.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var labelStartLink = {
	name: "labelStartLink",
	tokenize: tokenizeLabelStartLink,
	resolveAll: labelEnd.resolveAll
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeLabelStartLink(effects, ok$9, nok) {
	const self = this;
	return start;
	/**
	* Start of label (link) start.
	*
	* ```markdown
	* > | a [b] c
	*       ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.leftSquareBracket, "expected `[`");
		effects.enter(types.labelLink);
		effects.enter(types.labelMarker);
		effects.consume(code);
		effects.exit(types.labelMarker);
		effects.exit(types.labelLink);
		return after;
	}
	/** @type {State} */
	function after(code) {
		/* c8 ignore next 3 */
		return code === codes.caret && "_hiddenFootnoteSupport" in self.parser.constructs ? nok(code) : ok$9(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/line-ending.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var lineEnding = {
	name: "lineEnding",
	tokenize: tokenizeLineEnding
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeLineEnding(effects, ok$8) {
	return start;
	/** @type {State} */
	function start(code) {
		ok(markdownLineEnding(code), "expected eol");
		effects.enter(types.lineEnding);
		effects.consume(code);
		effects.exit(types.lineEnding);
		return factorySpace(effects, ok$8, types.linePrefix);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/thematic-break.js
/**
* @typedef {import('micromark-util-types').Code} Code
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var thematicBreak = {
	name: "thematicBreak",
	tokenize: tokenizeThematicBreak
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeThematicBreak(effects, ok$7, nok) {
	let size = 0;
	/** @type {NonNullable<Code>} */
	let marker;
	return start;
	/**
	* Start of thematic break.
	*
	* ```markdown
	* > | ***
	*     ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		effects.enter(types.thematicBreak);
		return before(code);
	}
	/**
	* After optional whitespace, at marker.
	*
	* ```markdown
	* > | ***
	*     ^
	* ```
	*
	* @type {State}
	*/
	function before(code) {
		ok(code === codes.asterisk || code === codes.dash || code === codes.underscore, "expected `*`, `-`, or `_`");
		marker = code;
		return atBreak(code);
	}
	/**
	* After something, before something else.
	*
	* ```markdown
	* > | ***
	*     ^
	* ```
	*
	* @type {State}
	*/
	function atBreak(code) {
		if (code === marker) {
			effects.enter(types.thematicBreakSequence);
			return sequence(code);
		}
		if (size >= constants.thematicBreakMarkerCountMin && (code === codes.eof || markdownLineEnding(code))) {
			effects.exit(types.thematicBreak);
			return ok$7(code);
		}
		return nok(code);
	}
	/**
	* In sequence.
	*
	* ```markdown
	* > | ***
	*     ^
	* ```
	*
	* @type {State}
	*/
	function sequence(code) {
		if (code === marker) {
			effects.consume(code);
			size++;
			return sequence;
		}
		effects.exit(types.thematicBreakSequence);
		return markdownSpace(code) ? factorySpace(effects, atBreak, types.whitespace)(code) : atBreak(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/list.js
/**
* @typedef {import('micromark-util-types').Code} Code
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').ContainerState} ContainerState
* @typedef {import('micromark-util-types').Exiter} Exiter
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var list = {
	name: "list",
	tokenize: tokenizeListStart,
	continuation: { tokenize: tokenizeListContinuation },
	exit: tokenizeListEnd
};
/** @type {Construct} */
var listItemPrefixWhitespaceConstruct = {
	tokenize: tokenizeListItemPrefixWhitespace,
	partial: true
};
/** @type {Construct} */
var indentConstruct = {
	tokenize: tokenizeIndent,
	partial: true
};
/**
* @type {Tokenizer}
* @this {TokenizeContext}
*/
function tokenizeListStart(effects, ok$3, nok) {
	const self = this;
	const tail = self.events[self.events.length - 1];
	let initialSize = tail && tail[1].type === types.linePrefix ? tail[2].sliceSerialize(tail[1], true).length : 0;
	let size = 0;
	return start;
	/** @type {State} */
	function start(code) {
		ok(self.containerState, "expected state");
		const kind = self.containerState.type || (code === codes.asterisk || code === codes.plusSign || code === codes.dash ? types.listUnordered : types.listOrdered);
		if (kind === types.listUnordered ? !self.containerState.marker || code === self.containerState.marker : asciiDigit(code)) {
			if (!self.containerState.type) {
				self.containerState.type = kind;
				effects.enter(kind, { _container: true });
			}
			if (kind === types.listUnordered) {
				effects.enter(types.listItemPrefix);
				return code === codes.asterisk || code === codes.dash ? effects.check(thematicBreak, nok, atMarker)(code) : atMarker(code);
			}
			if (!self.interrupt || code === codes.digit1) {
				effects.enter(types.listItemPrefix);
				effects.enter(types.listItemValue);
				return inside(code);
			}
		}
		return nok(code);
	}
	/** @type {State} */
	function inside(code) {
		ok(self.containerState, "expected state");
		if (asciiDigit(code) && ++size < constants.listItemValueSizeMax) {
			effects.consume(code);
			return inside;
		}
		if ((!self.interrupt || size < 2) && (self.containerState.marker ? code === self.containerState.marker : code === codes.rightParenthesis || code === codes.dot)) {
			effects.exit(types.listItemValue);
			return atMarker(code);
		}
		return nok(code);
	}
	/**
	* @type {State}
	**/
	function atMarker(code) {
		ok(self.containerState, "expected state");
		ok(code !== codes.eof, "eof (`null`) is not a marker");
		effects.enter(types.listItemMarker);
		effects.consume(code);
		effects.exit(types.listItemMarker);
		self.containerState.marker = self.containerState.marker || code;
		return effects.check(blankLine, self.interrupt ? nok : onBlank, effects.attempt(listItemPrefixWhitespaceConstruct, endOfPrefix, otherPrefix));
	}
	/** @type {State} */
	function onBlank(code) {
		ok(self.containerState, "expected state");
		self.containerState.initialBlankLine = true;
		initialSize++;
		return endOfPrefix(code);
	}
	/** @type {State} */
	function otherPrefix(code) {
		if (markdownSpace(code)) {
			effects.enter(types.listItemPrefixWhitespace);
			effects.consume(code);
			effects.exit(types.listItemPrefixWhitespace);
			return endOfPrefix;
		}
		return nok(code);
	}
	/** @type {State} */
	function endOfPrefix(code) {
		ok(self.containerState, "expected state");
		self.containerState.size = initialSize + self.sliceSerialize(effects.exit(types.listItemPrefix), true).length;
		return ok$3(code);
	}
}
/**
* @type {Tokenizer}
* @this {TokenizeContext}
*/
function tokenizeListContinuation(effects, ok$4, nok) {
	const self = this;
	ok(self.containerState, "expected state");
	self.containerState._closeFlow = void 0;
	return effects.check(blankLine, onBlank, notBlank);
	/** @type {State} */
	function onBlank(code) {
		ok(self.containerState, "expected state");
		ok(typeof self.containerState.size === "number", "expected size");
		self.containerState.furtherBlankLines = self.containerState.furtherBlankLines || self.containerState.initialBlankLine;
		return factorySpace(effects, ok$4, types.listItemIndent, self.containerState.size + 1)(code);
	}
	/** @type {State} */
	function notBlank(code) {
		ok(self.containerState, "expected state");
		if (self.containerState.furtherBlankLines || !markdownSpace(code)) {
			self.containerState.furtherBlankLines = void 0;
			self.containerState.initialBlankLine = void 0;
			return notInCurrentItem(code);
		}
		self.containerState.furtherBlankLines = void 0;
		self.containerState.initialBlankLine = void 0;
		return effects.attempt(indentConstruct, ok$4, notInCurrentItem)(code);
	}
	/** @type {State} */
	function notInCurrentItem(code) {
		ok(self.containerState, "expected state");
		self.containerState._closeFlow = true;
		self.interrupt = void 0;
		ok(self.parser.constructs.disable.null, "expected `disable.null` to be populated");
		return factorySpace(effects, effects.attempt(list, ok$4, nok), types.linePrefix, self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : constants.tabSize)(code);
	}
}
/**
* @type {Tokenizer}
* @this {TokenizeContext}
*/
function tokenizeIndent(effects, ok$5, nok) {
	const self = this;
	ok(self.containerState, "expected state");
	ok(typeof self.containerState.size === "number", "expected size");
	return factorySpace(effects, afterPrefix, types.listItemIndent, self.containerState.size + 1);
	/** @type {State} */
	function afterPrefix(code) {
		ok(self.containerState, "expected state");
		const tail = self.events[self.events.length - 1];
		return tail && tail[1].type === types.listItemIndent && tail[2].sliceSerialize(tail[1], true).length === self.containerState.size ? ok$5(code) : nok(code);
	}
}
/**
* @type {Exiter}
* @this {TokenizeContext}
*/
function tokenizeListEnd(effects) {
	ok(this.containerState, "expected state");
	ok(typeof this.containerState.type === "string", "expected type");
	effects.exit(this.containerState.type);
}
/**
* @type {Tokenizer}
* @this {TokenizeContext}
*/
function tokenizeListItemPrefixWhitespace(effects, ok$6, nok) {
	const self = this;
	ok(self.parser.constructs.disable.null, "expected `disable.null` to be populated");
	return factorySpace(effects, afterPrefix, types.listItemPrefixWhitespace, self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : constants.tabSize + 1);
	/** @type {State} */
	function afterPrefix(code) {
		const tail = self.events[self.events.length - 1];
		return !markdownSpace(code) && tail && tail[1].type === types.listItemPrefixWhitespace ? ok$6(code) : nok(code);
	}
}
//#endregion
//#region node_modules/micromark-core-commonmark/dev/lib/setext-underline.js
/**
* @typedef {import('micromark-util-types').Code} Code
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').Resolver} Resolver
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var setextUnderline = {
	name: "setextUnderline",
	tokenize: tokenizeSetextUnderline,
	resolveTo: resolveToSetextUnderline
};
/** @type {Resolver} */
function resolveToSetextUnderline(events, context) {
	let index = events.length;
	/** @type {number | undefined} */
	let content;
	/** @type {number | undefined} */
	let text;
	/** @type {number | undefined} */
	let definition;
	while (index--) if (events[index][0] === "enter") {
		if (events[index][1].type === types.content) {
			content = index;
			break;
		}
		if (events[index][1].type === types.paragraph) text = index;
	} else {
		if (events[index][1].type === types.content) events.splice(index, 1);
		if (!definition && events[index][1].type === types.definition) definition = index;
	}
	ok(text !== void 0, "expected a `text` index to be found");
	ok(content !== void 0, "expected a `text` index to be found");
	const heading = {
		type: types.setextHeading,
		start: Object.assign({}, events[text][1].start),
		end: Object.assign({}, events[events.length - 1][1].end)
	};
	events[text][1].type = types.setextHeadingText;
	if (definition) {
		events.splice(text, 0, [
			"enter",
			heading,
			context
		]);
		events.splice(definition + 1, 0, [
			"exit",
			events[content][1],
			context
		]);
		events[content][1].end = Object.assign({}, events[definition][1].end);
	} else events[content][1] = heading;
	events.push([
		"exit",
		heading,
		context
	]);
	return events;
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeSetextUnderline(effects, ok$2, nok) {
	const self = this;
	/** @type {NonNullable<Code>} */
	let marker;
	return start;
	/**
	* At start of heading (setext) underline.
	*
	* ```markdown
	*   | aa
	* > | ==
	*     ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		let index = self.events.length;
		/** @type {boolean | undefined} */
		let paragraph;
		ok(code === codes.dash || code === codes.equalsTo, "expected `=` or `-`");
		while (index--) if (self.events[index][1].type !== types.lineEnding && self.events[index][1].type !== types.linePrefix && self.events[index][1].type !== types.content) {
			paragraph = self.events[index][1].type === types.paragraph;
			break;
		}
		if (!self.parser.lazy[self.now().line] && (self.interrupt || paragraph)) {
			effects.enter(types.setextHeadingLine);
			marker = code;
			return before(code);
		}
		return nok(code);
	}
	/**
	* After optional whitespace, at `-` or `=`.
	*
	* ```markdown
	*   | aa
	* > | ==
	*     ^
	* ```
	*
	* @type {State}
	*/
	function before(code) {
		effects.enter(types.setextHeadingLineSequence);
		return inside(code);
	}
	/**
	* In sequence.
	*
	* ```markdown
	*   | aa
	* > | ==
	*     ^
	* ```
	*
	* @type {State}
	*/
	function inside(code) {
		if (code === marker) {
			effects.consume(code);
			return inside;
		}
		effects.exit(types.setextHeadingLineSequence);
		return markdownSpace(code) ? factorySpace(effects, after, types.lineSuffix)(code) : after(code);
	}
	/**
	* After sequence, after optional whitespace.
	*
	* ```markdown
	*   | aa
	* > | ==
	*       ^
	* ```
	*
	* @type {State}
	*/
	function after(code) {
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.setextHeadingLine);
			return ok$2(code);
		}
		return nok(code);
	}
}
//#endregion
//#region node_modules/micromark/dev/lib/initialize/flow.js
/**
* @typedef {import('micromark-util-types').InitialConstruct} InitialConstruct
* @typedef {import('micromark-util-types').Initializer} Initializer
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
*/
/** @type {InitialConstruct} */
var flow$1 = { tokenize: initializeFlow };
/**
* @this {TokenizeContext}
* @type {Initializer}
*/
function initializeFlow(effects) {
	const self = this;
	const initial = effects.attempt(blankLine, atBlankEnding, effects.attempt(this.parser.constructs.flowInitial, afterConstruct, factorySpace(effects, effects.attempt(this.parser.constructs.flow, afterConstruct, effects.attempt(content, afterConstruct)), types.linePrefix)));
	return initial;
	/** @type {State} */
	function atBlankEnding(code) {
		ok(code === codes.eof || markdownLineEnding(code), "expected eol or eof");
		if (code === codes.eof) {
			effects.consume(code);
			return;
		}
		effects.enter(types.lineEndingBlank);
		effects.consume(code);
		effects.exit(types.lineEndingBlank);
		self.currentConstruct = void 0;
		return initial;
	}
	/** @type {State} */
	function afterConstruct(code) {
		ok(code === codes.eof || markdownLineEnding(code), "expected eol or eof");
		if (code === codes.eof) {
			effects.consume(code);
			return;
		}
		effects.enter(types.lineEnding);
		effects.consume(code);
		effects.exit(types.lineEnding);
		self.currentConstruct = void 0;
		return initial;
	}
}
//#endregion
//#region node_modules/micromark/dev/lib/initialize/text.js
/**
* @typedef {import('micromark-util-types').Code} Code
* @typedef {import('micromark-util-types').InitialConstruct} InitialConstruct
* @typedef {import('micromark-util-types').Initializer} Initializer
* @typedef {import('micromark-util-types').Resolver} Resolver
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
*/
var resolver = { resolveAll: createResolver() };
var string$1 = initializeFactory("string");
var text$1 = initializeFactory("text");
/**
* @param {'string' | 'text'} field
* @returns {InitialConstruct}
*/
function initializeFactory(field) {
	return {
		tokenize: initializeText,
		resolveAll: createResolver(field === "text" ? resolveAllLineSuffixes : void 0)
	};
	/**
	* @this {TokenizeContext}
	* @type {Initializer}
	*/
	function initializeText(effects) {
		const self = this;
		const constructs = this.parser.constructs[field];
		const text = effects.attempt(constructs, start, notText);
		return start;
		/** @type {State} */
		function start(code) {
			return atBreak(code) ? text(code) : notText(code);
		}
		/** @type {State} */
		function notText(code) {
			if (code === codes.eof) {
				effects.consume(code);
				return;
			}
			effects.enter(types.data);
			effects.consume(code);
			return data;
		}
		/** @type {State} */
		function data(code) {
			if (atBreak(code)) {
				effects.exit(types.data);
				return text(code);
			}
			effects.consume(code);
			return data;
		}
		/**
		* @param {Code} code
		* @returns {boolean}
		*/
		function atBreak(code) {
			if (code === codes.eof) return true;
			const list = constructs[code];
			let index = -1;
			if (list) {
				ok(Array.isArray(list), "expected `disable.null` to be populated");
				while (++index < list.length) {
					const item = list[index];
					if (!item.previous || item.previous.call(self, self.previous)) return true;
				}
			}
			return false;
		}
	}
}
/**
* @param {Resolver | undefined} [extraResolver]
* @returns {Resolver}
*/
function createResolver(extraResolver) {
	return resolveAllText;
	/** @type {Resolver} */
	function resolveAllText(events, context) {
		let index = -1;
		/** @type {number | undefined} */
		let enter;
		while (++index <= events.length) if (enter === void 0) {
			if (events[index] && events[index][1].type === types.data) {
				enter = index;
				index++;
			}
		} else if (!events[index] || events[index][1].type !== types.data) {
			if (index !== enter + 2) {
				events[enter][1].end = events[index - 1][1].end;
				events.splice(enter + 2, index - enter - 2);
				index = enter + 2;
			}
			enter = void 0;
		}
		return extraResolver ? extraResolver(events, context) : events;
	}
}
/**
* A rather ugly set of instructions which again looks at chunks in the input
* stream.
* The reason to do this here is that it is *much* faster to parse in reverse.
* And that we can’t hook into `null` to split the line suffix before an EOF.
* To do: figure out if we can make this into a clean utility, or even in core.
* As it will be useful for GFMs literal autolink extension (and maybe even
* tables?)
*
* @type {Resolver}
*/
function resolveAllLineSuffixes(events, context) {
	let eventIndex = 0;
	while (++eventIndex <= events.length) if ((eventIndex === events.length || events[eventIndex][1].type === types.lineEnding) && events[eventIndex - 1][1].type === types.data) {
		const data = events[eventIndex - 1][1];
		const chunks = context.sliceStream(data);
		let index = chunks.length;
		let bufferIndex = -1;
		let size = 0;
		/** @type {boolean | undefined} */
		let tabs;
		while (index--) {
			const chunk = chunks[index];
			if (typeof chunk === "string") {
				bufferIndex = chunk.length;
				while (chunk.charCodeAt(bufferIndex - 1) === codes.space) {
					size++;
					bufferIndex--;
				}
				if (bufferIndex) break;
				bufferIndex = -1;
			} else if (chunk === codes.horizontalTab) {
				tabs = true;
				size++;
			} else if (chunk === codes.virtualSpace) {} else {
				index++;
				break;
			}
		}
		if (size) {
			const token = {
				type: eventIndex === events.length || tabs || size < constants.hardBreakPrefixSizeMin ? types.lineSuffix : types.hardBreakTrailing,
				start: {
					line: data.end.line,
					column: data.end.column - size,
					offset: data.end.offset - size,
					_index: data.start._index + index,
					_bufferIndex: index ? bufferIndex : data.start._bufferIndex + bufferIndex
				},
				end: Object.assign({}, data.end)
			};
			data.end = Object.assign({}, token.start);
			if (data.start.offset === data.end.offset) Object.assign(data, token);
			else {
				events.splice(eventIndex, 0, [
					"enter",
					token,
					context
				], [
					"exit",
					token,
					context
				]);
				eventIndex += 2;
			}
		}
		eventIndex++;
	}
	return events;
}
//#endregion
//#region node_modules/ms/index.js
var require_ms = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Helpers.
	*/
	var s = 1e3;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;
	/**
	* Parse or format the given `val`.
	*
	* Options:
	*
	*  - `long` verbose formatting [false]
	*
	* @param {String|Number} val
	* @param {Object} [options]
	* @throws {Error} throw an error if val is not a non-empty string or a number
	* @return {String|Number}
	* @api public
	*/
	module.exports = function(val, options) {
		options = options || {};
		var type = typeof val;
		if (type === "string" && val.length > 0) return parse(val);
		else if (type === "number" && isFinite(val)) return options.long ? fmtLong(val) : fmtShort(val);
		throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
	};
	/**
	* Parse the given `str` and return milliseconds.
	*
	* @param {String} str
	* @return {Number}
	* @api private
	*/
	function parse(str) {
		str = String(str);
		if (str.length > 100) return;
		var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
		if (!match) return;
		var n = parseFloat(match[1]);
		switch ((match[2] || "ms").toLowerCase()) {
			case "years":
			case "year":
			case "yrs":
			case "yr":
			case "y": return n * y;
			case "weeks":
			case "week":
			case "w": return n * w;
			case "days":
			case "day":
			case "d": return n * d;
			case "hours":
			case "hour":
			case "hrs":
			case "hr":
			case "h": return n * h;
			case "minutes":
			case "minute":
			case "mins":
			case "min":
			case "m": return n * m;
			case "seconds":
			case "second":
			case "secs":
			case "sec":
			case "s": return n * s;
			case "milliseconds":
			case "millisecond":
			case "msecs":
			case "msec":
			case "ms": return n;
			default: return;
		}
	}
	/**
	* Short format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtShort(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return Math.round(ms / d) + "d";
		if (msAbs >= h) return Math.round(ms / h) + "h";
		if (msAbs >= m) return Math.round(ms / m) + "m";
		if (msAbs >= s) return Math.round(ms / s) + "s";
		return ms + "ms";
	}
	/**
	* Long format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtLong(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return plural(ms, msAbs, d, "day");
		if (msAbs >= h) return plural(ms, msAbs, h, "hour");
		if (msAbs >= m) return plural(ms, msAbs, m, "minute");
		if (msAbs >= s) return plural(ms, msAbs, s, "second");
		return ms + " ms";
	}
	/**
	* Pluralization helper.
	*/
	function plural(ms, msAbs, n, name) {
		var isPlural = msAbs >= n * 1.5;
		return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
	}
}));
//#endregion
//#region node_modules/debug/src/common.js
var require_common = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the common logic for both the Node.js and web browser
	* implementations of `debug()`.
	*/
	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = require_ms();
		createDebug.destroy = destroy;
		Object.keys(env).forEach((key) => {
			createDebug[key] = env[key];
		});
		/**
		* The currently active debug mode names, and names to skip.
		*/
		createDebug.names = [];
		createDebug.skips = [];
		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};
		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;
			for (let i = 0; i < namespace.length; i++) {
				hash = (hash << 5) - hash + namespace.charCodeAt(i);
				hash |= 0;
			}
			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;
		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;
			let namespacesCache;
			let enabledCache;
			function debug(...args) {
				if (!debug.enabled) return;
				const self = debug;
				const curr = Number(/* @__PURE__ */ new Date());
				self.diff = curr - (prevTime || curr);
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;
				args[0] = createDebug.coerce(args[0]);
				if (typeof args[0] !== "string") args.unshift("%O");
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					if (match === "%%") return "%";
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === "function") {
						const val = args[index];
						match = formatter.call(self, val);
						args.splice(index, 1);
						index--;
					}
					return match;
				});
				createDebug.formatArgs.call(self, args);
				(self.log || createDebug.log).apply(self, args);
			}
			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy;
			Object.defineProperty(debug, "enabled", {
				enumerable: true,
				configurable: false,
				get: () => {
					if (enableOverride !== null) return enableOverride;
					if (namespacesCache !== createDebug.namespaces) {
						namespacesCache = createDebug.namespaces;
						enabledCache = createDebug.enabled(namespace);
					}
					return enabledCache;
				},
				set: (v) => {
					enableOverride = v;
				}
			});
			if (typeof createDebug.init === "function") createDebug.init(debug);
			return debug;
		}
		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}
		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);
			createDebug.namespaces = namespaces;
			createDebug.names = [];
			createDebug.skips = [];
			const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
			for (const ns of split) if (ns[0] === "-") createDebug.skips.push(ns.slice(1));
			else createDebug.names.push(ns);
		}
		/**
		* Checks if the given string matches a namespace template, honoring
		* asterisks as wildcards.
		*
		* @param {String} search
		* @param {String} template
		* @return {Boolean}
		*/
		function matchesTemplate(search, template) {
			let searchIndex = 0;
			let templateIndex = 0;
			let starIndex = -1;
			let matchIndex = 0;
			while (searchIndex < search.length) if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) if (template[templateIndex] === "*") {
				starIndex = templateIndex;
				matchIndex = searchIndex;
				templateIndex++;
			} else {
				searchIndex++;
				templateIndex++;
			}
			else if (starIndex !== -1) {
				templateIndex = starIndex + 1;
				matchIndex++;
				searchIndex = matchIndex;
			} else return false;
			while (templateIndex < template.length && template[templateIndex] === "*") templateIndex++;
			return templateIndex === template.length;
		}
		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [...createDebug.names, ...createDebug.skips.map((namespace) => "-" + namespace)].join(",");
			createDebug.enable("");
			return namespaces;
		}
		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			for (const skip of createDebug.skips) if (matchesTemplate(name, skip)) return false;
			for (const ns of createDebug.names) if (matchesTemplate(name, ns)) return true;
			return false;
		}
		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) return val.stack || val.message;
			return val;
		}
		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
		}
		createDebug.enable(createDebug.load());
		return createDebug;
	}
	module.exports = setup;
}));
var debug = (0, (/* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the web browser implementation of `debug()`.
	*/
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = localstorage();
	exports.destroy = (() => {
		let warned = false;
		return () => {
			if (!warned) {
				warned = true;
				console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
			}
		};
	})();
	/**
	* Colors.
	*/
	exports.colors = [
		"#0000CC",
		"#0000FF",
		"#0033CC",
		"#0033FF",
		"#0066CC",
		"#0066FF",
		"#0099CC",
		"#0099FF",
		"#00CC00",
		"#00CC33",
		"#00CC66",
		"#00CC99",
		"#00CCCC",
		"#00CCFF",
		"#3300CC",
		"#3300FF",
		"#3333CC",
		"#3333FF",
		"#3366CC",
		"#3366FF",
		"#3399CC",
		"#3399FF",
		"#33CC00",
		"#33CC33",
		"#33CC66",
		"#33CC99",
		"#33CCCC",
		"#33CCFF",
		"#6600CC",
		"#6600FF",
		"#6633CC",
		"#6633FF",
		"#66CC00",
		"#66CC33",
		"#9900CC",
		"#9900FF",
		"#9933CC",
		"#9933FF",
		"#99CC00",
		"#99CC33",
		"#CC0000",
		"#CC0033",
		"#CC0066",
		"#CC0099",
		"#CC00CC",
		"#CC00FF",
		"#CC3300",
		"#CC3333",
		"#CC3366",
		"#CC3399",
		"#CC33CC",
		"#CC33FF",
		"#CC6600",
		"#CC6633",
		"#CC9900",
		"#CC9933",
		"#CCCC00",
		"#CCCC33",
		"#FF0000",
		"#FF0033",
		"#FF0066",
		"#FF0099",
		"#FF00CC",
		"#FF00FF",
		"#FF3300",
		"#FF3333",
		"#FF3366",
		"#FF3399",
		"#FF33CC",
		"#FF33FF",
		"#FF6600",
		"#FF6633",
		"#FF9900",
		"#FF9933",
		"#FFCC00",
		"#FFCC33"
	];
	/**
	* Currently only WebKit-based Web Inspectors, Firefox >= v31,
	* and the Firebug extension (any Firefox version) are known
	* to support "%c" CSS customizations.
	*
	* TODO: add a `localStorage` variable to explicitly enable/disable colors
	*/
	function useColors() {
		if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) return true;
		if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) return false;
		let m;
		return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
	}
	/**
	* Colorize log arguments if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
		if (!this.useColors) return;
		const c = "color: " + this.color;
		args.splice(1, 0, c, "color: inherit");
		let index = 0;
		let lastC = 0;
		args[0].replace(/%[a-zA-Z%]/g, (match) => {
			if (match === "%%") return;
			index++;
			if (match === "%c") lastC = index;
		});
		args.splice(lastC, 0, c);
	}
	/**
	* Invokes `console.debug()` when available.
	* No-op when `console.debug` is not a "function".
	* If `console.debug` is not available, falls back
	* to `console.log`.
	*
	* @api public
	*/
	exports.log = console.debug || console.log || (() => {});
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		try {
			if (namespaces) exports.storage.setItem("debug", namespaces);
			else exports.storage.removeItem("debug");
		} catch (error) {}
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		let r;
		try {
			r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
		} catch (error) {}
		if (!r && typeof process !== "undefined" && "env" in process) r = process.env.DEBUG;
		return r;
	}
	/**
	* Localstorage attempts to return the localstorage.
	*
	* This is necessary because safari throws
	* when a user disables cookies/localstorage
	* and you attempt to access it.
	*
	* @return {LocalStorage}
	* @api private
	*/
	function localstorage() {
		try {
			return localStorage;
		} catch (error) {}
	}
	module.exports = require_common()(exports);
	var { formatters } = module.exports;
	/**
	* Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	*/
	formatters.j = function(v) {
		try {
			return JSON.stringify(v);
		} catch (error) {
			return "[UnexpectedJSONParseError]: " + error.message;
		}
	};
})))(), 1)).default)("micromark");
/**
* Create a tokenizer.
* Tokenizers deal with one type of data (e.g., containers, flow, text).
* The parser is the object dealing with it all.
* `initialize` works like other constructs, except that only its `tokenize`
* function is used, in which case it doesn’t receive an `ok` or `nok`.
* `from` can be given to set the point before the first character, although
* when further lines are indented, they must be set with `defineSkip`.
*
* @param {ParseContext} parser
* @param {InitialConstruct} initialize
* @param {Omit<Point, '_bufferIndex' | '_index'> | undefined} [from]
* @returns {TokenizeContext}
*/
function createTokenizer(parser, initialize, from) {
	/** @type {Point} */
	let point = Object.assign(from ? Object.assign({}, from) : {
		line: 1,
		column: 1,
		offset: 0
	}, {
		_index: 0,
		_bufferIndex: -1
	});
	/** @type {Record<string, number>} */
	const columnStart = {};
	/** @type {Array<Construct>} */
	const resolveAllConstructs = [];
	/** @type {Array<Chunk>} */
	let chunks = [];
	/** @type {Array<Token>} */
	let stack = [];
	/** @type {boolean | undefined} */
	let consumed = true;
	/**
	* Tools used for tokenizing.
	*
	* @type {Effects}
	*/
	const effects = {
		consume,
		enter,
		exit,
		attempt: constructFactory(onsuccessfulconstruct),
		check: constructFactory(onsuccessfulcheck),
		interrupt: constructFactory(onsuccessfulcheck, { interrupt: true })
	};
	/**
	* State and tools for resolving and serializing.
	*
	* @type {TokenizeContext}
	*/
	const context = {
		previous: codes.eof,
		code: codes.eof,
		containerState: {},
		events: [],
		parser,
		sliceStream,
		sliceSerialize,
		now,
		defineSkip,
		write
	};
	/**
	* The state function.
	*
	* @type {State | void}
	*/
	let state = initialize.tokenize.call(context, effects);
	/**
	* Track which character we expect to be consumed, to catch bugs.
	*
	* @type {Code}
	*/
	let expectedCode;
	if (initialize.resolveAll) resolveAllConstructs.push(initialize);
	return context;
	/** @type {TokenizeContext['write']} */
	function write(slice) {
		chunks = push(chunks, slice);
		main();
		if (chunks[chunks.length - 1] !== codes.eof) return [];
		addResult(initialize, 0);
		context.events = resolveAll(resolveAllConstructs, context.events, context);
		return context.events;
	}
	/** @type {TokenizeContext['sliceSerialize']} */
	function sliceSerialize(token, expandTabs) {
		return serializeChunks(sliceStream(token), expandTabs);
	}
	/** @type {TokenizeContext['sliceStream']} */
	function sliceStream(token) {
		return sliceChunks(chunks, token);
	}
	/** @type {TokenizeContext['now']} */
	function now() {
		const { line, column, offset, _index, _bufferIndex } = point;
		return {
			line,
			column,
			offset,
			_index,
			_bufferIndex
		};
	}
	/** @type {TokenizeContext['defineSkip']} */
	function defineSkip(value) {
		columnStart[value.line] = value.column;
		accountForPotentialSkip();
		debug("position: define skip: `%j`", point);
	}
	/**
	* Main loop (note that `_index` and `_bufferIndex` in `point` are modified by
	* `consume`).
	* Here is where we walk through the chunks, which either include strings of
	* several characters, or numerical character codes.
	* The reason to do this in a loop instead of a call is so the stack can
	* drain.
	*
	* @returns {void}
	*/
	function main() {
		/** @type {number} */
		let chunkIndex;
		while (point._index < chunks.length) {
			const chunk = chunks[point._index];
			if (typeof chunk === "string") {
				chunkIndex = point._index;
				if (point._bufferIndex < 0) point._bufferIndex = 0;
				while (point._index === chunkIndex && point._bufferIndex < chunk.length) go(chunk.charCodeAt(point._bufferIndex));
			} else go(chunk);
		}
	}
	/**
	* Deal with one code.
	*
	* @param {Code} code
	* @returns {void}
	*/
	function go(code) {
		ok(consumed === true, "expected character to be consumed");
		consumed = void 0;
		debug("main: passing `%s` to %s", code, state && state.name);
		expectedCode = code;
		ok(typeof state === "function", "expected state");
		state = state(code);
	}
	/** @type {Effects['consume']} */
	function consume(code) {
		ok(code === expectedCode, "expected given code to equal expected code");
		debug("consume: `%s`", code);
		ok(consumed === void 0, "expected code to not have been consumed: this might be because `return x(code)` instead of `return x` was used");
		ok(code === null ? context.events.length === 0 || context.events[context.events.length - 1][0] === "exit" : context.events[context.events.length - 1][0] === "enter", "expected last token to be open");
		if (markdownLineEnding(code)) {
			point.line++;
			point.column = 1;
			point.offset += code === codes.carriageReturnLineFeed ? 2 : 1;
			accountForPotentialSkip();
			debug("position: after eol: `%j`", point);
		} else if (code !== codes.virtualSpace) {
			point.column++;
			point.offset++;
		}
		if (point._bufferIndex < 0) point._index++;
		else {
			point._bufferIndex++;
			if (point._bufferIndex === chunks[point._index].length) {
				point._bufferIndex = -1;
				point._index++;
			}
		}
		context.previous = code;
		consumed = true;
	}
	/** @type {Effects['enter']} */
	function enter(type, fields) {
		/** @type {Token} */
		const token = fields || {};
		token.type = type;
		token.start = now();
		ok(typeof type === "string", "expected string type");
		ok(type.length > 0, "expected non-empty string");
		debug("enter: `%s`", type);
		context.events.push([
			"enter",
			token,
			context
		]);
		stack.push(token);
		return token;
	}
	/** @type {Effects['exit']} */
	function exit(type) {
		ok(typeof type === "string", "expected string type");
		ok(type.length > 0, "expected non-empty string");
		const token = stack.pop();
		ok(token, "cannot close w/o open tokens");
		token.end = now();
		ok(type === token.type, "expected exit token to match current token");
		ok(!(token.start._index === token.end._index && token.start._bufferIndex === token.end._bufferIndex), "expected non-empty token (`" + type + "`)");
		debug("exit: `%s`", token.type);
		context.events.push([
			"exit",
			token,
			context
		]);
		return token;
	}
	/**
	* Use results.
	*
	* @type {ReturnHandle}
	*/
	function onsuccessfulconstruct(construct, info) {
		addResult(construct, info.from);
	}
	/**
	* Discard results.
	*
	* @type {ReturnHandle}
	*/
	function onsuccessfulcheck(_, info) {
		info.restore();
	}
	/**
	* Factory to attempt/check/interrupt.
	*
	* @param {ReturnHandle} onreturn
	* @param {{interrupt?: boolean | undefined} | undefined} [fields]
	*/
	function constructFactory(onreturn, fields) {
		return hook;
		/**
		* Handle either an object mapping codes to constructs, a list of
		* constructs, or a single construct.
		*
		* @param {Array<Construct> | Construct | ConstructRecord} constructs
		* @param {State} returnState
		* @param {State | undefined} [bogusState]
		* @returns {State}
		*/
		function hook(constructs, returnState, bogusState) {
			/** @type {Array<Construct>} */
			let listOfConstructs;
			/** @type {number} */
			let constructIndex;
			/** @type {Construct} */
			let currentConstruct;
			/** @type {Info} */
			let info;
			return Array.isArray(constructs) ? handleListOfConstructs(constructs) : "tokenize" in constructs ? handleListOfConstructs([constructs]) : handleMapOfConstructs(constructs);
			/**
			* Handle a list of construct.
			*
			* @param {ConstructRecord} map
			* @returns {State}
			*/
			function handleMapOfConstructs(map) {
				return start;
				/** @type {State} */
				function start(code) {
					const def = code !== null && map[code];
					const all = code !== null && map.null;
					return handleListOfConstructs([...Array.isArray(def) ? def : def ? [def] : [], ...Array.isArray(all) ? all : all ? [all] : []])(code);
				}
			}
			/**
			* Handle a list of construct.
			*
			* @param {Array<Construct>} list
			* @returns {State}
			*/
			function handleListOfConstructs(list) {
				listOfConstructs = list;
				constructIndex = 0;
				if (list.length === 0) {
					ok(bogusState, "expected `bogusState` to be given");
					return bogusState;
				}
				return handleConstruct(list[constructIndex]);
			}
			/**
			* Handle a single construct.
			*
			* @param {Construct} construct
			* @returns {State}
			*/
			function handleConstruct(construct) {
				return start;
				/** @type {State} */
				function start(code) {
					info = store();
					currentConstruct = construct;
					if (!construct.partial) context.currentConstruct = construct;
					ok(context.parser.constructs.disable.null, "expected `disable.null` to be populated");
					if (construct.name && context.parser.constructs.disable.null.includes(construct.name)) return nok(code);
					return construct.tokenize.call(fields ? Object.assign(Object.create(context), fields) : context, effects, ok$1, nok)(code);
				}
			}
			/** @type {State} */
			function ok$1(code) {
				ok(code === expectedCode, "expected code");
				consumed = true;
				onreturn(currentConstruct, info);
				return returnState;
			}
			/** @type {State} */
			function nok(code) {
				ok(code === expectedCode, "expected code");
				consumed = true;
				info.restore();
				if (++constructIndex < listOfConstructs.length) return handleConstruct(listOfConstructs[constructIndex]);
				return bogusState;
			}
		}
	}
	/**
	* @param {Construct} construct
	* @param {number} from
	* @returns {void}
	*/
	function addResult(construct, from) {
		if (construct.resolveAll && !resolveAllConstructs.includes(construct)) resolveAllConstructs.push(construct);
		if (construct.resolve) splice(context.events, from, context.events.length - from, construct.resolve(context.events.slice(from), context));
		if (construct.resolveTo) context.events = construct.resolveTo(context.events, context);
		ok(construct.partial || context.events.length === 0 || context.events[context.events.length - 1][0] === "exit", "expected last token to end");
	}
	/**
	* Store state.
	*
	* @returns {Info}
	*/
	function store() {
		const startPoint = now();
		const startPrevious = context.previous;
		const startCurrentConstruct = context.currentConstruct;
		const startEventsIndex = context.events.length;
		const startStack = Array.from(stack);
		return {
			restore,
			from: startEventsIndex
		};
		/**
		* Restore state.
		*
		* @returns {void}
		*/
		function restore() {
			point = startPoint;
			context.previous = startPrevious;
			context.currentConstruct = startCurrentConstruct;
			context.events.length = startEventsIndex;
			stack = startStack;
			accountForPotentialSkip();
			debug("position: restore: `%j`", point);
		}
	}
	/**
	* Move the current point a bit forward in the line when it’s on a column
	* skip.
	*
	* @returns {void}
	*/
	function accountForPotentialSkip() {
		if (point.line in columnStart && point.column < 2) {
			point.column = columnStart[point.line];
			point.offset += columnStart[point.line] - 1;
		}
	}
}
/**
* Get the chunks from a slice of chunks in the range of a token.
*
* @param {Array<Chunk>} chunks
* @param {Pick<Token, 'end' | 'start'>} token
* @returns {Array<Chunk>}
*/
function sliceChunks(chunks, token) {
	const startIndex = token.start._index;
	const startBufferIndex = token.start._bufferIndex;
	const endIndex = token.end._index;
	const endBufferIndex = token.end._bufferIndex;
	/** @type {Array<Chunk>} */
	let view;
	if (startIndex === endIndex) {
		ok(endBufferIndex > -1, "expected non-negative end buffer index");
		ok(startBufferIndex > -1, "expected non-negative start buffer index");
		view = [chunks[startIndex].slice(startBufferIndex, endBufferIndex)];
	} else {
		view = chunks.slice(startIndex, endIndex);
		if (startBufferIndex > -1) {
			const head = view[0];
			if (typeof head === "string") view[0] = head.slice(startBufferIndex);
			else {
				ok(startBufferIndex === 0, "expected `startBufferIndex` to be `0`");
				view.shift();
			}
		}
		if (endBufferIndex > 0) view.push(chunks[endIndex].slice(0, endBufferIndex));
	}
	return view;
}
/**
* Get the string value of a slice of chunks.
*
* @param {Array<Chunk>} chunks
* @param {boolean | undefined} [expandTabs=false]
* @returns {string}
*/
function serializeChunks(chunks, expandTabs) {
	let index = -1;
	/** @type {Array<string>} */
	const result = [];
	/** @type {boolean | undefined} */
	let atTab;
	while (++index < chunks.length) {
		const chunk = chunks[index];
		/** @type {string} */
		let value;
		if (typeof chunk === "string") value = chunk;
		else switch (chunk) {
			case codes.carriageReturn:
				value = values.cr;
				break;
			case codes.lineFeed:
				value = values.lf;
				break;
			case codes.carriageReturnLineFeed:
				value = values.cr + values.lf;
				break;
			case codes.horizontalTab:
				value = expandTabs ? values.space : values.ht;
				break;
			case codes.virtualSpace:
				if (!expandTabs && atTab) continue;
				value = values.space;
				break;
			default:
				ok(typeof chunk === "number", "expected number");
				value = String.fromCharCode(chunk);
		}
		atTab = chunk === codes.horizontalTab;
		result.push(value);
	}
	return result.join("");
}
//#endregion
//#region node_modules/micromark/dev/lib/constructs.js
/**
* @typedef {import('micromark-util-types').Extension} Extension
*/
var constructs_exports = /* @__PURE__ */ __exportAll({
	attentionMarkers: () => attentionMarkers,
	contentInitial: () => contentInitial,
	disable: () => disable,
	document: () => document$1,
	flow: () => flow,
	flowInitial: () => flowInitial,
	insideSpan: () => insideSpan,
	string: () => string,
	text: () => text
});
/** @satisfies {Extension['document']} */
var document$1 = {
	[codes.asterisk]: list,
	[codes.plusSign]: list,
	[codes.dash]: list,
	[codes.digit0]: list,
	[codes.digit1]: list,
	[codes.digit2]: list,
	[codes.digit3]: list,
	[codes.digit4]: list,
	[codes.digit5]: list,
	[codes.digit6]: list,
	[codes.digit7]: list,
	[codes.digit8]: list,
	[codes.digit9]: list,
	[codes.greaterThan]: blockQuote
};
/** @satisfies {Extension['contentInitial']} */
var contentInitial = { [codes.leftSquareBracket]: definition };
/** @satisfies {Extension['flowInitial']} */
var flowInitial = {
	[codes.horizontalTab]: codeIndented,
	[codes.virtualSpace]: codeIndented,
	[codes.space]: codeIndented
};
/** @satisfies {Extension['flow']} */
var flow = {
	[codes.numberSign]: headingAtx,
	[codes.asterisk]: thematicBreak,
	[codes.dash]: [setextUnderline, thematicBreak],
	[codes.lessThan]: htmlFlow,
	[codes.equalsTo]: setextUnderline,
	[codes.underscore]: thematicBreak,
	[codes.graveAccent]: codeFenced,
	[codes.tilde]: codeFenced
};
/** @satisfies {Extension['string']} */
var string = {
	[codes.ampersand]: characterReference,
	[codes.backslash]: characterEscape
};
/** @satisfies {Extension['text']} */
var text = {
	[codes.carriageReturn]: lineEnding,
	[codes.lineFeed]: lineEnding,
	[codes.carriageReturnLineFeed]: lineEnding,
	[codes.exclamationMark]: labelStartImage,
	[codes.ampersand]: characterReference,
	[codes.asterisk]: attention,
	[codes.lessThan]: [autolink, htmlText],
	[codes.leftSquareBracket]: labelStartLink,
	[codes.backslash]: [hardBreakEscape, characterEscape],
	[codes.rightSquareBracket]: labelEnd,
	[codes.underscore]: attention,
	[codes.graveAccent]: codeText
};
/** @satisfies {Extension['insideSpan']} */
var insideSpan = { null: [attention, resolver] };
/** @satisfies {Extension['attentionMarkers']} */
var attentionMarkers = { null: [codes.asterisk, codes.underscore] };
/** @satisfies {Extension['disable']} */
var disable = { null: [] };
//#endregion
//#region node_modules/micromark/dev/lib/parse.js
/**
* @typedef {import('micromark-util-types').Create} Create
* @typedef {import('micromark-util-types').FullNormalizedExtension} FullNormalizedExtension
* @typedef {import('micromark-util-types').InitialConstruct} InitialConstruct
* @typedef {import('micromark-util-types').ParseContext} ParseContext
* @typedef {import('micromark-util-types').ParseOptions} ParseOptions
*/
/**
* @param {ParseOptions | null | undefined} [options]
* @returns {ParseContext}
*/
function parse(options) {
	/** @type {ParseContext} */
	const parser = {
		defined: [],
		lazy: {},
		constructs: combineExtensions([constructs_exports, ...(options || {}).extensions || []]),
		content: create(content$1),
		document: create(document$2),
		flow: create(flow$1),
		string: create(string$1),
		text: create(text$1)
	};
	return parser;
	/**
	* @param {InitialConstruct} initial
	*/
	function create(initial) {
		return creator;
		/** @type {Create} */
		function creator(from) {
			return createTokenizer(parser, initial, from);
		}
	}
}
//#endregion
//#region node_modules/micromark/dev/lib/postprocess.js
/**
* @typedef {import('micromark-util-types').Event} Event
*/
/**
* @param {Array<Event>} events
* @returns {Array<Event>}
*/
function postprocess(events) {
	while (!subtokenize(events));
	return events;
}
//#endregion
//#region node_modules/micromark/dev/lib/preprocess.js
/**
* @typedef {import('micromark-util-types').Chunk} Chunk
* @typedef {import('micromark-util-types').Code} Code
* @typedef {import('micromark-util-types').Encoding} Encoding
* @typedef {import('micromark-util-types').Value} Value
*/
/**
* @callback Preprocessor
* @param {Value} value
* @param {Encoding | null | undefined} [encoding]
* @param {boolean | null | undefined} [end=false]
* @returns {Array<Chunk>}
*/
var search = /[\0\t\n\r]/g;
/**
* @returns {Preprocessor}
*/
function preprocess() {
	let column = 1;
	let buffer = "";
	/** @type {boolean | undefined} */
	let start = true;
	/** @type {boolean | undefined} */
	let atCarriageReturn;
	return preprocessor;
	/** @type {Preprocessor} */
	function preprocessor(value, encoding, end) {
		/** @type {Array<Chunk>} */
		const chunks = [];
		/** @type {RegExpMatchArray | null} */
		let match;
		/** @type {number} */
		let next;
		/** @type {number} */
		let startPosition;
		/** @type {number} */
		let endPosition;
		/** @type {Code} */
		let code;
		value = buffer + value.toString(encoding);
		startPosition = 0;
		buffer = "";
		if (start) {
			if (value.charCodeAt(0) === codes.byteOrderMarker) startPosition++;
			start = void 0;
		}
		while (startPosition < value.length) {
			search.lastIndex = startPosition;
			match = search.exec(value);
			endPosition = match && match.index !== void 0 ? match.index : value.length;
			code = value.charCodeAt(endPosition);
			if (!match) {
				buffer = value.slice(startPosition);
				break;
			}
			if (code === codes.lf && startPosition === endPosition && atCarriageReturn) {
				chunks.push(codes.carriageReturnLineFeed);
				atCarriageReturn = void 0;
			} else {
				if (atCarriageReturn) {
					chunks.push(codes.carriageReturn);
					atCarriageReturn = void 0;
				}
				if (startPosition < endPosition) {
					chunks.push(value.slice(startPosition, endPosition));
					column += endPosition - startPosition;
				}
				switch (code) {
					case codes.nul:
						chunks.push(codes.replacementCharacter);
						column++;
						break;
					case codes.ht:
						next = Math.ceil(column / constants.tabSize) * constants.tabSize;
						chunks.push(codes.horizontalTab);
						while (column++ < next) chunks.push(codes.virtualSpace);
						break;
					case codes.lf:
						chunks.push(codes.lineFeed);
						column = 1;
						break;
					default:
						atCarriageReturn = true;
						column = 1;
				}
			}
			startPosition = endPosition + 1;
		}
		if (end) {
			if (atCarriageReturn) chunks.push(codes.carriageReturn);
			if (buffer) chunks.push(buffer);
			chunks.push(codes.eof);
		}
		return chunks;
	}
}
//#endregion
//#region node_modules/micromark/dev/index.js
/**
* @typedef {import('micromark-util-types').Encoding} Encoding
* @typedef {import('micromark-util-types').Options} Options
* @typedef {import('micromark-util-types').Value} Value
*/
/**
* Compile markdown to HTML.
*
* @overload
* @param {Value} value
*   Markdown to parse (`string` or `Buffer`).
* @param {Encoding | null | undefined} encoding
*   Character encoding to understand `value` as when it’s a `Buffer`
*   (`string`, default: `'utf8'`).
* @param {Options | null | undefined} [options]
*   Configuration.
* @returns {string}
*   Compiled HTML.
*
* @overload
* @param {Value} value
*   Markdown to parse (`string` or `Buffer`).
* @param {Options | null | undefined} [options]
*   Configuration.
* @returns {string}
*   Compiled HTML.
*
* @param {Value} value
*   Markdown to parse (`string` or `Buffer`).
* @param {Options | Encoding | null | undefined} [encoding]
*   Character encoding to understand `value` as when it’s a `Buffer`
*   (`string`, default: `'utf8'`).
* @param {Options | null | undefined} [options]
*   Configuration.
* @returns {string}
*   Compiled HTML.
*/
function micromark(value, encoding, options) {
	if (typeof encoding !== "string") {
		options = encoding;
		encoding = void 0;
	}
	return compile(options)(postprocess(parse(options).document().write(preprocess()(value, encoding, true))));
}
//#endregion
export { micromark };
