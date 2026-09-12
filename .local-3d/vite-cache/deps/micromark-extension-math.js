import katex from "./katex.js";
import { _ as constants, d as markdownLineEnding, g as codes, n as ok, r as types, t as factorySpace } from "./dev-Zw4g8Z-R.js";
//#region node_modules/micromark-extension-math/dev/lib/math-flow.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/** @type {Construct} */
var mathFlow = {
	tokenize: tokenizeMathFenced,
	concrete: true
};
/** @type {Construct} */
var nonLazyContinuation = {
	tokenize: tokenizeNonLazyContinuation,
	partial: true
};
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeMathFenced(effects, ok$2, nok) {
	const self = this;
	const tail = self.events[self.events.length - 1];
	const initialSize = tail && tail[1].type === types.linePrefix ? tail[2].sliceSerialize(tail[1], true).length : 0;
	let sizeOpen = 0;
	return start;
	/**
	* Start of math.
	*
	* ```markdown
	* > | $$
	*     ^
	*   | \frac{1}{2}
	*   | $$
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.dollarSign, "expected `$`");
		effects.enter("mathFlow");
		effects.enter("mathFlowFence");
		effects.enter("mathFlowFenceSequence");
		return sequenceOpen(code);
	}
	/**
	* In opening fence sequence.
	*
	* ```markdown
	* > | $$
	*      ^
	*   | \frac{1}{2}
	*   | $$
	* ```
	*
	* @type {State}
	*/
	function sequenceOpen(code) {
		if (code === codes.dollarSign) {
			effects.consume(code);
			sizeOpen++;
			return sequenceOpen;
		}
		if (sizeOpen < 2) return nok(code);
		effects.exit("mathFlowFenceSequence");
		return factorySpace(effects, metaBefore, types.whitespace)(code);
	}
	/**
	* In opening fence, before meta.
	*
	* ```markdown
	* > | $$asciimath
	*       ^
	*   | x < y
	*   | $$
	* ```
	*
	* @type {State}
	*/
	function metaBefore(code) {
		if (code === codes.eof || markdownLineEnding(code)) return metaAfter(code);
		effects.enter("mathFlowFenceMeta");
		effects.enter(types.chunkString, { contentType: constants.contentTypeString });
		return meta(code);
	}
	/**
	* In meta.
	*
	* ```markdown
	* > | $$asciimath
	*        ^
	*   | x < y
	*   | $$
	* ```
	*
	* @type {State}
	*/
	function meta(code) {
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.chunkString);
			effects.exit("mathFlowFenceMeta");
			return metaAfter(code);
		}
		if (code === codes.dollarSign) return nok(code);
		effects.consume(code);
		return meta;
	}
	/**
	* After meta.
	*
	* ```markdown
	* > | $$
	*       ^
	*   | \frac{1}{2}
	*   | $$
	* ```
	*
	* @type {State}
	*/
	function metaAfter(code) {
		effects.exit("mathFlowFence");
		if (self.interrupt) return ok$2(code);
		return effects.attempt(nonLazyContinuation, beforeNonLazyContinuation, after)(code);
	}
	/**
	* After eol/eof in math, at a non-lazy closing fence or content.
	*
	* ```markdown
	*   | $$
	* > | \frac{1}{2}
	*     ^
	* > | $$
	*     ^
	* ```
	*
	* @type {State}
	*/
	function beforeNonLazyContinuation(code) {
		return effects.attempt({
			tokenize: tokenizeClosingFence,
			partial: true
		}, after, contentStart)(code);
	}
	/**
	* Before math content, definitely not before a closing fence.
	*
	* ```markdown
	*   | $$
	* > | \frac{1}{2}
	*     ^
	*   | $$
	* ```
	*
	* @type {State}
	*/
	function contentStart(code) {
		return (initialSize ? factorySpace(effects, beforeContentChunk, types.linePrefix, initialSize + 1) : beforeContentChunk)(code);
	}
	/**
	* Before math content, after optional prefix.
	*
	* ```markdown
	*   | $$
	* > | \frac{1}{2}
	*     ^
	*   | $$
	* ```
	*
	* @type {State}
	*/
	function beforeContentChunk(code) {
		if (code === codes.eof) return after(code);
		if (markdownLineEnding(code)) return effects.attempt(nonLazyContinuation, beforeNonLazyContinuation, after)(code);
		effects.enter("mathFlowValue");
		return contentChunk(code);
	}
	/**
	* In math content.
	*
	* ```markdown
	*   | $$
	* > | \frac{1}{2}
	*      ^
	*   | $$
	* ```
	*
	* @type {State}
	*/
	function contentChunk(code) {
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit("mathFlowValue");
			return beforeContentChunk(code);
		}
		effects.consume(code);
		return contentChunk;
	}
	/**
	* After math (ha!).
	*
	* ```markdown
	*   | $$
	*   | \frac{1}{2}
	* > | $$
	*       ^
	* ```
	*
	* @type {State}
	*/
	function after(code) {
		effects.exit("mathFlow");
		return ok$2(code);
	}
	/** @type {Tokenizer} */
	function tokenizeClosingFence(effects, ok$3, nok) {
		let size = 0;
		ok(self.parser.constructs.disable.null, "expected `disable.null`");
		/**
		* Before closing fence, at optional whitespace.
		*
		* ```markdown
		*   | $$
		*   | \frac{1}{2}
		* > | $$
		*     ^
		* ```
		*/
		return factorySpace(effects, beforeSequenceClose, types.linePrefix, self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : constants.tabSize);
		/**
		* In closing fence, after optional whitespace, at sequence.
		*
		* ```markdown
		*   | $$
		*   | \frac{1}{2}
		* > | $$
		*     ^
		* ```
		*
		* @type {State}
		*/
		function beforeSequenceClose(code) {
			effects.enter("mathFlowFence");
			effects.enter("mathFlowFenceSequence");
			return sequenceClose(code);
		}
		/**
		* In closing fence sequence.
		*
		* ```markdown
		*   | $$
		*   | \frac{1}{2}
		* > | $$
		*      ^
		* ```
		*
		* @type {State}
		*/
		function sequenceClose(code) {
			if (code === codes.dollarSign) {
				size++;
				effects.consume(code);
				return sequenceClose;
			}
			if (size < sizeOpen) return nok(code);
			effects.exit("mathFlowFenceSequence");
			return factorySpace(effects, afterSequenceClose, types.whitespace)(code);
		}
		/**
		* After closing fence sequence, after optional whitespace.
		*
		* ```markdown
		*   | $$
		*   | \frac{1}{2}
		* > | $$
		*       ^
		* ```
		*
		* @type {State}
		*/
		function afterSequenceClose(code) {
			if (code === codes.eof || markdownLineEnding(code)) {
				effects.exit("mathFlowFence");
				return ok$3(code);
			}
			return nok(code);
		}
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeNonLazyContinuation(effects, ok$4, nok) {
	const self = this;
	return start;
	/** @type {State} */
	function start(code) {
		if (code === null) return ok$4(code);
		ok(markdownLineEnding(code), "expected eol");
		effects.enter(types.lineEnding);
		effects.consume(code);
		effects.exit(types.lineEnding);
		return lineStart;
	}
	/** @type {State} */
	function lineStart(code) {
		return self.parser.lazy[self.now().line] ? nok(code) : ok$4(code);
	}
}
//#endregion
//#region node_modules/micromark-extension-math/dev/lib/math-text.js
/**
* @typedef {import('micromark-util-types').Construct} Construct
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
* @typedef {import('micromark-util-types').Previous} Previous
* @typedef {import('micromark-util-types').Resolver} Resolver
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').Token} Token
*
* @typedef Options
*   Configuration.
* @property {boolean | null | undefined} [singleDollarTextMath=true]
*   Whether to support math (text) with a single dollar.
*   Single dollars work in Pandoc and many other places, but often interfere
*   with “normal” dollars in text.
*   If you turn this off, you can use two or more dollars for text math.

*/
/**
* @param {Options | null | undefined} [options]
* @returns {Construct}
*/
function mathText(options) {
	let single = (options || {}).singleDollarTextMath;
	if (single === null || single === void 0) single = true;
	return {
		tokenize: tokenizeMathText,
		resolve: resolveMathText,
		previous
	};
	/**
	* @this {TokenizeContext}
	* @type {Tokenizer}
	*/
	function tokenizeMathText(effects, ok$1, nok) {
		const self = this;
		let sizeOpen = 0;
		/** @type {number} */
		let size;
		/** @type {Token} */
		let token;
		return start;
		/**
		* Start of math (text).
		*
		* ```markdown
		* > | $a$
		*     ^
		* > | \$a$
		*      ^
		* ```
		*
		* @type {State}
		*/
		function start(code) {
			ok(code === codes.dollarSign, "expected `$`");
			ok(previous.call(self, self.previous), "expected correct previous");
			effects.enter("mathText");
			effects.enter("mathTextSequence");
			return sequenceOpen(code);
		}
		/**
		* In opening sequence.
		*
		* ```markdown
		* > | $a$
		*     ^
		* ```
		*
		* @type {State}
		*/
		function sequenceOpen(code) {
			if (code === codes.dollarSign) {
				effects.consume(code);
				sizeOpen++;
				return sequenceOpen;
			}
			if (sizeOpen < 2 && !single) return nok(code);
			effects.exit("mathTextSequence");
			return between(code);
		}
		/**
		* Between something and something else.
		*
		* ```markdown
		* > | $a$
		*      ^^
		* ```
		*
		* @type {State}
		*/
		function between(code) {
			if (code === codes.eof) return nok(code);
			if (code === codes.dollarSign) {
				token = effects.enter("mathTextSequence");
				size = 0;
				return sequenceClose(code);
			}
			if (code === codes.space) {
				effects.enter("space");
				effects.consume(code);
				effects.exit("space");
				return between;
			}
			if (markdownLineEnding(code)) {
				effects.enter(types.lineEnding);
				effects.consume(code);
				effects.exit(types.lineEnding);
				return between;
			}
			effects.enter("mathTextData");
			return data(code);
		}
		/**
		* In data.
		*
		* ```markdown
		* > | $a$
		*      ^
		* ```
		*
		* @type {State}
		*/
		function data(code) {
			if (code === codes.eof || code === codes.space || code === codes.dollarSign || markdownLineEnding(code)) {
				effects.exit("mathTextData");
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
			if (code === codes.dollarSign) {
				effects.consume(code);
				size++;
				return sequenceClose;
			}
			if (size === sizeOpen) {
				effects.exit("mathTextSequence");
				effects.exit("mathText");
				return ok$1(code);
			}
			token.type = "mathTextData";
			return data(code);
		}
	}
}
/** @type {Resolver} */
function resolveMathText(events) {
	let tailExitIndex = events.length - 4;
	let headEnterIndex = 3;
	/** @type {number} */
	let index;
	/** @type {number | undefined} */
	let enter;
	if ((events[headEnterIndex][1].type === types.lineEnding || events[headEnterIndex][1].type === "space") && (events[tailExitIndex][1].type === types.lineEnding || events[tailExitIndex][1].type === "space")) {
		index = headEnterIndex;
		while (++index < tailExitIndex) if (events[index][1].type === "mathTextData") {
			events[tailExitIndex][1].type = "mathTextPadding";
			events[headEnterIndex][1].type = "mathTextPadding";
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
		events[enter][1].type = "mathTextData";
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
	return code !== codes.dollarSign || this.events[this.events.length - 1][1].type === types.characterEscape;
}
//#endregion
//#region node_modules/micromark-extension-math/dev/lib/syntax.js
/**
* @typedef {import('micromark-util-types').Extension} Extension
* @typedef {import('./math-text.js').Options} Options
*/
/**
* Create an extension for `micromark` to enable math syntax.
*
* @param {Options | null | undefined} [options]
*   Configuration.
* @returns {Extension}
*   Extension for `micromark` that can be passed in `extensions`, to
*   enable math syntax.
*/
function math(options) {
	return {
		flow: { [codes.dollarSign]: mathFlow },
		text: { [codes.dollarSign]: mathText(options) }
	};
}
//#endregion
//#region node_modules/micromark-extension-math/dev/lib/html.js
/**
* @typedef {import('katex').KatexOptions} KatexOptions
* @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
*/
/**
* @typedef {Omit<KatexOptions, 'displayMode'>} Options
*   Configuration for HTML output.
*
*   > 👉 **Note**: passed to `katex.renderToString`.
*   > `displayMode` is overwritten by this plugin, to `false` for math in
*   > text, and `true` for math in flow.
*/
/** @type {import('katex')['default']['renderToString']} */
var renderToString = katex.renderToString;
/**
* Create an extension for `micromark` to support math when serializing to
* HTML.
*
* > 👉 **Note**: this uses KaTeX to render math.
*
* @param {Options | null | undefined} [options]
*   Configuration.
* @returns {HtmlExtension}
*   Extension for `micromark` that can be passed in `htmlExtensions`, to
*   support math when serializing to HTML.
*/
function mathHtml(options) {
	return {
		enter: {
			mathFlow() {
				this.lineEndingIfNeeded();
				this.tag("<div class=\"math math-display\">");
			},
			mathFlowFenceMeta() {
				this.buffer();
			},
			mathText() {
				this.tag("<span class=\"math math-inline\">");
				this.buffer();
			}
		},
		exit: {
			mathFlow() {
				const value = this.resume();
				this.tag(math(value.replace(/(?:\r?\n|\r)$/, ""), true));
				this.tag("</div>");
				this.setData("mathFlowOpen");
				this.setData("slurpOneLineEnding");
			},
			mathFlowFence() {
				if (!this.getData("mathFlowOpen")) {
					this.setData("mathFlowOpen", true);
					this.setData("slurpOneLineEnding", true);
					this.buffer();
				}
			},
			mathFlowFenceMeta() {
				this.resume();
			},
			mathFlowValue(token) {
				this.raw(this.sliceSerialize(token));
			},
			mathText() {
				const value = this.resume();
				this.tag(math(value, false));
				this.tag("</span>");
			},
			mathTextData(token) {
				this.raw(this.sliceSerialize(token));
			}
		}
	};
	/**
	* @param {string} value
	* @param {boolean} displayMode
	* @returns {string}
	*/
	function math(value, displayMode) {
		return renderToString(value, Object.assign({}, options, { displayMode }));
	}
}
//#endregion
export { math, mathHtml };
