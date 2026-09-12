import { _ as constants, a as asciiAlphanumeric, d as markdownLineEnding, f as markdownLineEndingOrSpace, g as codes, h as unicodeWhitespace, i as asciiAlpha, m as unicodePunctuation, n as ok, p as markdownSpace, r as types, s as asciiControl, t as factorySpace } from "./dev-Zw4g8Z-R.js";
import { a as normalizeIdentifier, c as combineExtensions, d as splice, i as sanitizeUri, l as combineHtmlExtensions, n as resolveAll, r as classifyCharacter, t as blankLine } from "./blank-line-CUN1gS5u.js";
//#region node_modules/micromark-extension-gfm-autolink-literal/dev/lib/syntax.js
/**
* @typedef {import('micromark-util-types').Code} Code
* @typedef {import('micromark-util-types').ConstructRecord} ConstructRecord
* @typedef {import('micromark-util-types').Event} Event
* @typedef {import('micromark-util-types').Extension} Extension
* @typedef {import('micromark-util-types').Previous} Previous
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
var wwwPrefix = {
	tokenize: tokenizeWwwPrefix,
	partial: true
};
var domain = {
	tokenize: tokenizeDomain,
	partial: true
};
var path = {
	tokenize: tokenizePath,
	partial: true
};
var trail = {
	tokenize: tokenizeTrail,
	partial: true
};
var emailDomainDotTrail = {
	tokenize: tokenizeEmailDomainDotTrail,
	partial: true
};
var wwwAutolink = {
	tokenize: tokenizeWwwAutolink,
	previous: previousWww
};
var protocolAutolink = {
	tokenize: tokenizeProtocolAutolink,
	previous: previousProtocol
};
var emailAutolink = {
	tokenize: tokenizeEmailAutolink,
	previous: previousEmail
};
/** @type {ConstructRecord} */
var text = {};
/**
* Extension for `micromark` that can be passed in `extensions` to enable GFM
* autolink literal syntax.
*
* @type {Extension}
*/
var gfmAutolinkLiteral = { text };
/** @type {Code} */
var code = codes.digit0;
while (code < codes.leftCurlyBrace) {
	text[code] = emailAutolink;
	code++;
	if (code === codes.colon) code = codes.uppercaseA;
	else if (code === codes.leftSquareBracket) code = codes.lowercaseA;
}
text[codes.plusSign] = emailAutolink;
text[codes.dash] = emailAutolink;
text[codes.dot] = emailAutolink;
text[codes.underscore] = emailAutolink;
text[codes.uppercaseH] = [emailAutolink, protocolAutolink];
text[codes.lowercaseH] = [emailAutolink, protocolAutolink];
text[codes.uppercaseW] = [emailAutolink, wwwAutolink];
text[codes.lowercaseW] = [emailAutolink, wwwAutolink];
/**
* Email autolink literal.
*
* ```markdown
* > | a contact@example.org b
*       ^^^^^^^^^^^^^^^^^^^
* ```
*
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeEmailAutolink(effects, ok, nok) {
	const self = this;
	/** @type {boolean | undefined} */
	let dot;
	/** @type {boolean} */
	let data;
	return start;
	/**
	* Start of email autolink literal.
	*
	* ```markdown
	* > | a contact@example.org b
	*       ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		if (!gfmAtext(code) || !previousEmail.call(self, self.previous) || previousUnbalanced(self.events)) return nok(code);
		effects.enter("literalAutolink");
		effects.enter("literalAutolinkEmail");
		return atext(code);
	}
	/**
	* In email atext.
	*
	* ```markdown
	* > | a contact@example.org b
	*       ^
	* ```
	*
	* @type {State}
	*/
	function atext(code) {
		if (gfmAtext(code)) {
			effects.consume(code);
			return atext;
		}
		if (code === codes.atSign) {
			effects.consume(code);
			return emailDomain;
		}
		return nok(code);
	}
	/**
	* In email domain.
	*
	* The reference code is a bit overly complex as it handles the `@`, of which
	* there may be just one.
	* Source: <https://github.com/github/cmark-gfm/blob/ef1cfcb/extensions/autolink.c#L318>
	*
	* ```markdown
	* > | a contact@example.org b
	*               ^
	* ```
	*
	* @type {State}
	*/
	function emailDomain(code) {
		if (code === codes.dot) return effects.check(emailDomainDotTrail, emailDomainAfter, emailDomainDot)(code);
		if (code === codes.dash || code === codes.underscore || asciiAlphanumeric(code)) {
			data = true;
			effects.consume(code);
			return emailDomain;
		}
		return emailDomainAfter(code);
	}
	/**
	* In email domain, on dot that is not a trail.
	*
	* ```markdown
	* > | a contact@example.org b
	*                      ^
	* ```
	*
	* @type {State}
	*/
	function emailDomainDot(code) {
		effects.consume(code);
		dot = true;
		return emailDomain;
	}
	/**
	* After email domain.
	*
	* ```markdown
	* > | a contact@example.org b
	*                          ^
	* ```
	*
	* @type {State}
	*/
	function emailDomainAfter(code) {
		if (data && dot && asciiAlpha(self.previous)) {
			effects.exit("literalAutolinkEmail");
			effects.exit("literalAutolink");
			return ok(code);
		}
		return nok(code);
	}
}
/**
* `www` autolink literal.
*
* ```markdown
* > | a www.example.org b
*       ^^^^^^^^^^^^^^^
* ```
*
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeWwwAutolink(effects, ok, nok) {
	const self = this;
	return wwwStart;
	/**
	* Start of www autolink literal.
	*
	* ```markdown
	* > | www.example.com/a?b#c
	*     ^
	* ```
	*
	* @type {State}
	*/
	function wwwStart(code) {
		if (code !== codes.uppercaseW && code !== codes.lowercaseW || !previousWww.call(self, self.previous) || previousUnbalanced(self.events)) return nok(code);
		effects.enter("literalAutolink");
		effects.enter("literalAutolinkWww");
		return effects.check(wwwPrefix, effects.attempt(domain, effects.attempt(path, wwwAfter), nok), nok)(code);
	}
	/**
	* After a www autolink literal.
	*
	* ```markdown
	* > | www.example.com/a?b#c
	*                          ^
	* ```
	*
	* @type {State}
	*/
	function wwwAfter(code) {
		effects.exit("literalAutolinkWww");
		effects.exit("literalAutolink");
		return ok(code);
	}
}
/**
* Protocol autolink literal.
*
* ```markdown
* > | a https://example.org b
*       ^^^^^^^^^^^^^^^^^^^
* ```
*
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeProtocolAutolink(effects, ok, nok) {
	const self = this;
	let buffer = "";
	let seen = false;
	return protocolStart;
	/**
	* Start of protocol autolink literal.
	*
	* ```markdown
	* > | https://example.com/a?b#c
	*     ^
	* ```
	*
	* @type {State}
	*/
	function protocolStart(code) {
		if ((code === codes.uppercaseH || code === codes.lowercaseH) && previousProtocol.call(self, self.previous) && !previousUnbalanced(self.events)) {
			effects.enter("literalAutolink");
			effects.enter("literalAutolinkHttp");
			buffer += String.fromCodePoint(code);
			effects.consume(code);
			return protocolPrefixInside;
		}
		return nok(code);
	}
	/**
	* In protocol.
	*
	* ```markdown
	* > | https://example.com/a?b#c
	*     ^^^^^
	* ```
	*
	* @type {State}
	*/
	function protocolPrefixInside(code) {
		if (asciiAlpha(code) && buffer.length < 5) {
			buffer += String.fromCodePoint(code);
			effects.consume(code);
			return protocolPrefixInside;
		}
		if (code === codes.colon) {
			const protocol = buffer.toLowerCase();
			if (protocol === "http" || protocol === "https") {
				effects.consume(code);
				return protocolSlashesInside;
			}
		}
		return nok(code);
	}
	/**
	* In slashes.
	*
	* ```markdown
	* > | https://example.com/a?b#c
	*           ^^
	* ```
	*
	* @type {State}
	*/
	function protocolSlashesInside(code) {
		if (code === codes.slash) {
			effects.consume(code);
			if (seen) return afterProtocol;
			seen = true;
			return protocolSlashesInside;
		}
		return nok(code);
	}
	/**
	* After protocol, before domain.
	*
	* ```markdown
	* > | https://example.com/a?b#c
	*             ^
	* ```
	*
	* @type {State}
	*/
	function afterProtocol(code) {
		return code === codes.eof || asciiControl(code) || markdownLineEndingOrSpace(code) || unicodeWhitespace(code) || unicodePunctuation(code) ? nok(code) : effects.attempt(domain, effects.attempt(path, protocolAfter), nok)(code);
	}
	/**
	* After a protocol autolink literal.
	*
	* ```markdown
	* > | https://example.com/a?b#c
	*                              ^
	* ```
	*
	* @type {State}
	*/
	function protocolAfter(code) {
		effects.exit("literalAutolinkHttp");
		effects.exit("literalAutolink");
		return ok(code);
	}
}
/**
* `www` prefix.
*
* ```markdown
* > | a www.example.org b
*       ^^^^
* ```
*
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeWwwPrefix(effects, ok, nok) {
	let size = 0;
	return wwwPrefixInside;
	/**
	* In www prefix.
	*
	* ```markdown
	* > | www.example.com
	*     ^^^^
	* ```
	*
	* @type {State}
	*/
	function wwwPrefixInside(code) {
		if ((code === codes.uppercaseW || code === codes.lowercaseW) && size < 3) {
			size++;
			effects.consume(code);
			return wwwPrefixInside;
		}
		if (code === codes.dot && size === 3) {
			effects.consume(code);
			return wwwPrefixAfter;
		}
		return nok(code);
	}
	/**
	* After www prefix.
	*
	* ```markdown
	* > | www.example.com
	*         ^
	* ```
	*
	* @type {State}
	*/
	function wwwPrefixAfter(code) {
		return code === codes.eof ? nok(code) : ok(code);
	}
}
/**
* Domain.
*
* ```markdown
* > | a https://example.org b
*               ^^^^^^^^^^^
* ```
*
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeDomain(effects, ok, nok) {
	/** @type {boolean | undefined} */
	let underscoreInLastSegment;
	/** @type {boolean | undefined} */
	let underscoreInLastLastSegment;
	/** @type {boolean | undefined} */
	let seen;
	return domainInside;
	/**
	* In domain.
	*
	* ```markdown
	* > | https://example.com/a
	*             ^^^^^^^^^^^
	* ```
	*
	* @type {State}
	*/
	function domainInside(code) {
		if (code === codes.dot || code === codes.underscore) return effects.check(trail, domainAfter, domainAtPunctuation)(code);
		if (code === codes.eof || markdownLineEndingOrSpace(code) || unicodeWhitespace(code) || code !== codes.dash && unicodePunctuation(code)) return domainAfter(code);
		seen = true;
		effects.consume(code);
		return domainInside;
	}
	/**
	* In domain, at potential trailing punctuation, that was not trailing.
	*
	* ```markdown
	* > | https://example.com
	*                    ^
	* ```
	*
	* @type {State}
	*/
	function domainAtPunctuation(code) {
		if (code === codes.underscore) underscoreInLastSegment = true;
		else {
			underscoreInLastLastSegment = underscoreInLastSegment;
			underscoreInLastSegment = void 0;
		}
		effects.consume(code);
		return domainInside;
	}
	/**
	* After domain.
	*
	* ```markdown
	* > | https://example.com/a
	*                        ^
	* ```
	*
	* @type {State} */
	function domainAfter(code) {
		if (underscoreInLastLastSegment || underscoreInLastSegment || !seen) return nok(code);
		return ok(code);
	}
}
/**
* Path.
*
* ```markdown
* > | a https://example.org/stuff b
*                          ^^^^^^
* ```
*
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizePath(effects, ok) {
	let sizeOpen = 0;
	let sizeClose = 0;
	return pathInside;
	/**
	* In path.
	*
	* ```markdown
	* > | https://example.com/a
	*                        ^^
	* ```
	*
	* @type {State}
	*/
	function pathInside(code) {
		if (code === codes.leftParenthesis) {
			sizeOpen++;
			effects.consume(code);
			return pathInside;
		}
		if (code === codes.rightParenthesis && sizeClose < sizeOpen) return pathAtPunctuation(code);
		if (code === codes.exclamationMark || code === codes.quotationMark || code === codes.ampersand || code === codes.apostrophe || code === codes.rightParenthesis || code === codes.asterisk || code === codes.comma || code === codes.dot || code === codes.colon || code === codes.semicolon || code === codes.lessThan || code === codes.questionMark || code === codes.rightSquareBracket || code === codes.underscore || code === codes.tilde) return effects.check(trail, ok, pathAtPunctuation)(code);
		if (code === codes.eof || markdownLineEndingOrSpace(code) || unicodeWhitespace(code)) return ok(code);
		effects.consume(code);
		return pathInside;
	}
	/**
	* In path, at potential trailing punctuation, that was not trailing.
	*
	* ```markdown
	* > | https://example.com/a"b
	*                          ^
	* ```
	*
	* @type {State}
	*/
	function pathAtPunctuation(code) {
		if (code === codes.rightParenthesis) sizeClose++;
		effects.consume(code);
		return pathInside;
	}
}
/**
* Trail.
*
* This calls `ok` if this *is* the trail, followed by an end, which means
* the entire trail is not part of the link.
* It calls `nok` if this *is* part of the link.
*
* ```markdown
* > | https://example.com").
*                        ^^^
* ```
*
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeTrail(effects, ok, nok) {
	return trail;
	/**
	* In trail of domain or path.
	*
	* ```markdown
	* > | https://example.com").
	*                        ^
	* ```
	*
	* @type {State}
	*/
	function trail(code) {
		if (code === codes.exclamationMark || code === codes.quotationMark || code === codes.apostrophe || code === codes.rightParenthesis || code === codes.asterisk || code === codes.comma || code === codes.dot || code === codes.colon || code === codes.semicolon || code === codes.questionMark || code === codes.underscore || code === codes.tilde) {
			effects.consume(code);
			return trail;
		}
		if (code === codes.ampersand) {
			effects.consume(code);
			return trailCharRefStart;
		}
		if (code === codes.rightSquareBracket) {
			effects.consume(code);
			return trailBracketAfter;
		}
		if (code === codes.lessThan || code === codes.eof || markdownLineEndingOrSpace(code) || unicodeWhitespace(code)) return ok(code);
		return nok(code);
	}
	/**
	* In trail, after `]`.
	*
	* > 👉 **Note**: this deviates from `cmark-gfm` to fix a bug.
	* > See end of <https://github.com/github/cmark-gfm/issues/278> for more.
	*
	* ```markdown
	* > | https://example.com](
	*                         ^
	* ```
	*
	* @type {State}
	*/
	function trailBracketAfter(code) {
		if (code === codes.eof || code === codes.leftParenthesis || code === codes.leftSquareBracket || markdownLineEndingOrSpace(code) || unicodeWhitespace(code)) return ok(code);
		return trail(code);
	}
	/**
	* In character-reference like trail, after `&`.
	*
	* ```markdown
	* > | https://example.com&amp;).
	*                         ^
	* ```
	*
	* @type {State}
	*/
	function trailCharRefStart(code) {
		return asciiAlpha(code) ? trailCharRefInside(code) : nok(code);
	}
	/**
	* In character-reference like trail.
	*
	* ```markdown
	* > | https://example.com&amp;).
	*                         ^
	* ```
	*
	* @type {State}
	*/
	function trailCharRefInside(code) {
		if (code === codes.semicolon) {
			effects.consume(code);
			return trail;
		}
		if (asciiAlpha(code)) {
			effects.consume(code);
			return trailCharRefInside;
		}
		return nok(code);
	}
}
/**
* Dot in email domain trail.
*
* This calls `ok` if this *is* the trail, followed by an end, which means
* the trail is not part of the link.
* It calls `nok` if this *is* part of the link.
*
* ```markdown
* > | contact@example.org.
*                        ^
* ```
*
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeEmailDomainDotTrail(effects, ok, nok) {
	return start;
	/**
	* Dot.
	*
	* ```markdown
	* > | contact@example.org.
	*                    ^   ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		effects.consume(code);
		return after;
	}
	/**
	* After dot.
	*
	* ```markdown
	* > | contact@example.org.
	*                     ^   ^
	* ```
	*
	* @type {State}
	*/
	function after(code) {
		return asciiAlphanumeric(code) ? nok(code) : ok(code);
	}
}
/**
* See:
* <https://github.com/github/cmark-gfm/blob/ef1cfcb/extensions/autolink.c#L156>.
*
* @type {Previous}
*/
function previousWww(code) {
	return code === codes.eof || code === codes.leftParenthesis || code === codes.asterisk || code === codes.underscore || code === codes.leftSquareBracket || code === codes.rightSquareBracket || code === codes.tilde || markdownLineEndingOrSpace(code);
}
/**
* See:
* <https://github.com/github/cmark-gfm/blob/ef1cfcb/extensions/autolink.c#L214>.
*
* @type {Previous}
*/
function previousProtocol(code) {
	return !asciiAlpha(code);
}
/**
* @this {TokenizeContext}
* @type {Previous}
*/
function previousEmail(code) {
	return !(code === codes.slash || gfmAtext(code));
}
/**
* @param {Code} code
* @returns {boolean}
*/
function gfmAtext(code) {
	return code === codes.plusSign || code === codes.dash || code === codes.dot || code === codes.underscore || asciiAlphanumeric(code);
}
/**
* @param {Array<Event>} events
* @returns {boolean}
*/
function previousUnbalanced(events) {
	let index = events.length;
	let result = false;
	while (index--) {
		const token = events[index][1];
		if ((token.type === "labelLink" || token.type === "labelImage") && !token._balanced) {
			result = true;
			break;
		}
		if (token._gfmAutolinkLiteralWalkedInto) {
			result = false;
			break;
		}
	}
	if (events.length > 0 && !result) events[events.length - 1][1]._gfmAutolinkLiteralWalkedInto = true;
	return result;
}
//#endregion
//#region node_modules/micromark-extension-gfm-autolink-literal/dev/lib/html.js
/**
* @typedef {import('micromark-util-types').CompileContext} CompileContext
* @typedef {import('micromark-util-types').Handle} Handle
* @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
* @typedef {import('micromark-util-types').Token} Token
*/
/**
* Extension for `micromark` that can be passed in `htmlExtensions` to support
* GFM autolink literals when serializing to HTML.
*
* @type {HtmlExtension}
*/
var gfmAutolinkLiteralHtml = { exit: {
	literalAutolinkEmail,
	literalAutolinkHttp,
	literalAutolinkWww
} };
/**
* @this {CompileContext}
* @type {Handle}
*/
function literalAutolinkWww(token) {
	anchorFromToken.call(this, token, "http://");
}
/**
* @this {CompileContext}
* @type {Handle}
*/
function literalAutolinkEmail(token) {
	anchorFromToken.call(this, token, "mailto:");
}
/**
* @this {CompileContext}
* @type {Handle}
*/
function literalAutolinkHttp(token) {
	anchorFromToken.call(this, token);
}
/**
* @this CompileContext
* @param {Token} token
* @param {string | null | undefined} [protocol]
* @returns {void}
*/
function anchorFromToken(token, protocol) {
	const url = this.sliceSerialize(token);
	this.tag("<a href=\"" + sanitizeUri((protocol || "") + url) + "\">");
	this.raw(this.encode(url));
	this.tag("</a>");
}
//#endregion
//#region node_modules/micromark-extension-gfm-footnote/dev/lib/syntax.js
/**
* @typedef {import('micromark-util-types').Event} Event
* @typedef {import('micromark-util-types').Exiter} Exiter
* @typedef {import('micromark-util-types').Extension} Extension
* @typedef {import('micromark-util-types').Resolver} Resolver
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').Token} Token
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
var indent = {
	tokenize: tokenizeIndent,
	partial: true
};
/**
* Create an extension for `micromark` to enable GFM footnote syntax.
*
* @returns {Extension}
*   Extension for `micromark` that can be passed in `extensions` to
*   enable GFM footnote syntax.
*/
function gfmFootnote() {
	/** @type {Extension} */
	return {
		document: { [codes.leftSquareBracket]: {
			tokenize: tokenizeDefinitionStart,
			continuation: { tokenize: tokenizeDefinitionContinuation },
			exit: gfmFootnoteDefinitionEnd
		} },
		text: {
			[codes.leftSquareBracket]: { tokenize: tokenizeGfmFootnoteCall },
			[codes.rightSquareBracket]: {
				add: "after",
				tokenize: tokenizePotentialGfmFootnoteCall,
				resolveTo: resolveToPotentialGfmFootnoteCall
			}
		}
	};
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizePotentialGfmFootnoteCall(effects, ok$4, nok) {
	const self = this;
	let index = self.events.length;
	/** @type {Array<string>} */
	const defined = self.parser.gfmFootnotes || (self.parser.gfmFootnotes = []);
	/** @type {Token} */
	let labelStart;
	while (index--) {
		const token = self.events[index][1];
		if (token.type === types.labelImage) {
			labelStart = token;
			break;
		}
		if (token.type === "gfmFootnoteCall" || token.type === types.labelLink || token.type === types.label || token.type === types.image || token.type === types.link) break;
	}
	return start;
	/**
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.rightSquareBracket, "expected `]`");
		if (!labelStart || !labelStart._balanced) return nok(code);
		const id = normalizeIdentifier(self.sliceSerialize({
			start: labelStart.end,
			end: self.now()
		}));
		if (id.codePointAt(0) !== codes.caret || !defined.includes(id.slice(1))) return nok(code);
		effects.enter("gfmFootnoteCallLabelMarker");
		effects.consume(code);
		effects.exit("gfmFootnoteCallLabelMarker");
		return ok$4(code);
	}
}
/** @type {Resolver} */
function resolveToPotentialGfmFootnoteCall(events, context) {
	let index = events.length;
	/** @type {Token | undefined} */
	let labelStart;
	while (index--) if (events[index][1].type === types.labelImage && events[index][0] === "enter") {
		labelStart = events[index][1];
		break;
	}
	ok(labelStart, "expected `labelStart` to resolve");
	events[index + 1][1].type = types.data;
	events[index + 3][1].type = "gfmFootnoteCallLabelMarker";
	/** @type {Token} */
	const call = {
		type: "gfmFootnoteCall",
		start: Object.assign({}, events[index + 3][1].start),
		end: Object.assign({}, events[events.length - 1][1].end)
	};
	/** @type {Token} */
	const marker = {
		type: "gfmFootnoteCallMarker",
		start: Object.assign({}, events[index + 3][1].end),
		end: Object.assign({}, events[index + 3][1].end)
	};
	marker.end.column++;
	marker.end.offset++;
	marker.end._bufferIndex++;
	/** @type {Token} */
	const string = {
		type: "gfmFootnoteCallString",
		start: Object.assign({}, marker.end),
		end: Object.assign({}, events[events.length - 1][1].start)
	};
	/** @type {Token} */
	const chunk = {
		type: types.chunkString,
		contentType: "string",
		start: Object.assign({}, string.start),
		end: Object.assign({}, string.end)
	};
	/** @type {Array<Event>} */
	const replacement = [
		events[index + 1],
		events[index + 2],
		[
			"enter",
			call,
			context
		],
		events[index + 3],
		events[index + 4],
		[
			"enter",
			marker,
			context
		],
		[
			"exit",
			marker,
			context
		],
		[
			"enter",
			string,
			context
		],
		[
			"enter",
			chunk,
			context
		],
		[
			"exit",
			chunk,
			context
		],
		[
			"exit",
			string,
			context
		],
		events[events.length - 2],
		events[events.length - 1],
		[
			"exit",
			call,
			context
		]
	];
	events.splice(index, events.length - index + 1, ...replacement);
	return events;
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeGfmFootnoteCall(effects, ok$5, nok) {
	const self = this;
	/** @type {Array<string>} */
	const defined = self.parser.gfmFootnotes || (self.parser.gfmFootnotes = []);
	let size = 0;
	/** @type {boolean} */
	let data;
	return start;
	/**
	* Start of footnote label.
	*
	* ```markdown
	* > | a [^b] c
	*       ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.leftSquareBracket, "expected `[`");
		effects.enter("gfmFootnoteCall");
		effects.enter("gfmFootnoteCallLabelMarker");
		effects.consume(code);
		effects.exit("gfmFootnoteCallLabelMarker");
		return callStart;
	}
	/**
	* After `[`, at `^`.
	*
	* ```markdown
	* > | a [^b] c
	*        ^
	* ```
	*
	* @type {State}
	*/
	function callStart(code) {
		if (code !== codes.caret) return nok(code);
		effects.enter("gfmFootnoteCallMarker");
		effects.consume(code);
		effects.exit("gfmFootnoteCallMarker");
		effects.enter("gfmFootnoteCallString");
		effects.enter("chunkString").contentType = "string";
		return callData;
	}
	/**
	* In label.
	*
	* ```markdown
	* > | a [^b] c
	*         ^
	* ```
	*
	* @type {State}
	*/
	function callData(code) {
		if (size > constants.linkReferenceSizeMax || code === codes.rightSquareBracket && !data || code === codes.eof || code === codes.leftSquareBracket || markdownLineEndingOrSpace(code)) return nok(code);
		if (code === codes.rightSquareBracket) {
			effects.exit("chunkString");
			const token = effects.exit("gfmFootnoteCallString");
			if (!defined.includes(normalizeIdentifier(self.sliceSerialize(token)))) return nok(code);
			effects.enter("gfmFootnoteCallLabelMarker");
			effects.consume(code);
			effects.exit("gfmFootnoteCallLabelMarker");
			effects.exit("gfmFootnoteCall");
			return ok$5;
		}
		if (!markdownLineEndingOrSpace(code)) data = true;
		size++;
		effects.consume(code);
		return code === codes.backslash ? callEscape : callData;
	}
	/**
	* On character after escape.
	*
	* ```markdown
	* > | a [^b\c] d
	*           ^
	* ```
	*
	* @type {State}
	*/
	function callEscape(code) {
		if (code === codes.leftSquareBracket || code === codes.backslash || code === codes.rightSquareBracket) {
			effects.consume(code);
			size++;
			return callData;
		}
		return callData(code);
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeDefinitionStart(effects, ok$6, nok) {
	const self = this;
	/** @type {Array<string>} */
	const defined = self.parser.gfmFootnotes || (self.parser.gfmFootnotes = []);
	/** @type {string} */
	let identifier;
	let size = 0;
	/** @type {boolean | undefined} */
	let data;
	return start;
	/**
	* Start of GFM footnote definition.
	*
	* ```markdown
	* > | [^a]: b
	*     ^
	* ```
	*
	* @type {State}
	*/
	function start(code) {
		ok(code === codes.leftSquareBracket, "expected `[`");
		effects.enter("gfmFootnoteDefinition")._container = true;
		effects.enter("gfmFootnoteDefinitionLabel");
		effects.enter("gfmFootnoteDefinitionLabelMarker");
		effects.consume(code);
		effects.exit("gfmFootnoteDefinitionLabelMarker");
		return labelAtMarker;
	}
	/**
	* In label, at caret.
	*
	* ```markdown
	* > | [^a]: b
	*      ^
	* ```
	*
	* @type {State}
	*/
	function labelAtMarker(code) {
		if (code === codes.caret) {
			effects.enter("gfmFootnoteDefinitionMarker");
			effects.consume(code);
			effects.exit("gfmFootnoteDefinitionMarker");
			effects.enter("gfmFootnoteDefinitionLabelString");
			effects.enter("chunkString").contentType = "string";
			return labelInside;
		}
		return nok(code);
	}
	/**
	* In label.
	*
	* > 👉 **Note**: `cmark-gfm` prevents whitespace from occurring in footnote
	* > definition labels.
	*
	* ```markdown
	* > | [^a]: b
	*       ^
	* ```
	*
	* @type {State}
	*/
	function labelInside(code) {
		if (size > constants.linkReferenceSizeMax || code === codes.rightSquareBracket && !data || code === codes.eof || code === codes.leftSquareBracket || markdownLineEndingOrSpace(code)) return nok(code);
		if (code === codes.rightSquareBracket) {
			effects.exit("chunkString");
			const token = effects.exit("gfmFootnoteDefinitionLabelString");
			identifier = normalizeIdentifier(self.sliceSerialize(token));
			effects.enter("gfmFootnoteDefinitionLabelMarker");
			effects.consume(code);
			effects.exit("gfmFootnoteDefinitionLabelMarker");
			effects.exit("gfmFootnoteDefinitionLabel");
			return labelAfter;
		}
		if (!markdownLineEndingOrSpace(code)) data = true;
		size++;
		effects.consume(code);
		return code === codes.backslash ? labelEscape : labelInside;
	}
	/**
	* After `\`, at a special character.
	*
	* > 👉 **Note**: `cmark-gfm` currently does not support escaped brackets:
	* > <https://github.com/github/cmark-gfm/issues/240>
	*
	* ```markdown
	* > | [^a\*b]: c
	*         ^
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
	/**
	* After definition label.
	*
	* ```markdown
	* > | [^a]: b
	*         ^
	* ```
	*
	* @type {State}
	*/
	function labelAfter(code) {
		if (code === codes.colon) {
			effects.enter("definitionMarker");
			effects.consume(code);
			effects.exit("definitionMarker");
			if (!defined.includes(identifier)) defined.push(identifier);
			return factorySpace(effects, whitespaceAfter, "gfmFootnoteDefinitionWhitespace");
		}
		return nok(code);
	}
	/**
	* After definition prefix.
	*
	* ```markdown
	* > | [^a]: b
	*           ^
	* ```
	*
	* @type {State}
	*/
	function whitespaceAfter(code) {
		return ok$6(code);
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeDefinitionContinuation(effects, ok, nok) {
	return effects.check(blankLine, ok, effects.attempt(indent, ok, nok));
}
/** @type {Exiter} */
function gfmFootnoteDefinitionEnd(effects) {
	effects.exit("gfmFootnoteDefinition");
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeIndent(effects, ok, nok) {
	const self = this;
	return factorySpace(effects, afterPrefix, "gfmFootnoteDefinitionIndent", constants.tabSize + 1);
	/**
	* @type {State}
	*/
	function afterPrefix(code) {
		const tail = self.events[self.events.length - 1];
		return tail && tail[1].type === "gfmFootnoteDefinitionIndent" && tail[2].sliceSerialize(tail[1], true).length === constants.tabSize ? ok(code) : nok(code);
	}
}
//#endregion
//#region node_modules/micromark-extension-gfm-footnote/dev/lib/html.js
/**
* @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
*/
/**
* @callback BackLabelTemplate
*   Generate a back label dynamically.
*
*   For the following markdown:
*
*   ```markdown
*   Alpha[^micromark], bravo[^micromark], and charlie[^remark].
*
*   [^remark]: things about remark
*   [^micromark]: things about micromark
*   ```
*
*   This function will be called with:
*
*   * `0` and `0` for the backreference from `things about micromark` to
*      `alpha`, as it is the first used definition, and the first call to it
*   * `0` and `1` for the backreference from `things about micromark` to
*      `bravo`, as it is the first used definition, and the second call to it
*   * `1` and `0` for the backreference from `things about remark` to
*      `charlie`, as it is the second used definition
* @param {number} referenceIndex
*   Index of the definition in the order that they are first referenced,
*   0-indexed.
* @param {number} rereferenceIndex
*   Index of calls to the same definition, 0-indexed.
* @returns {string}
*   Back label to use when linking back from definitions to their reference.
*/
/**
* @typedef Options
*   Configuration.
* @property {string} [clobberPrefix='user-content-']
*   Prefix to use before the `id` attribute on footnotes to prevent them from
*   *clobbering*.
*
*   The default is `'user-content-'`.
*   Pass `''` for trusted markdown and when you are careful with
*   polyfilling.
*   You could pass a different prefix.
*
*   DOM clobbering is this:
*
*   ```html
*   <p id="x"></p>
*   <script>alert(x) // `x` now refers to the `p#x` DOM element<\/script>
*   ```
*
*   The above example shows that elements are made available by browsers, by
*   their ID, on the `window` object.
*   This is a security risk because you might be expecting some other variable
*   at that place.
*   It can also break polyfills.
*   Using a prefix solves these problems.
* @property {string} [label='Footnotes']
*   Textual label to use for the footnotes section.
*
*   The default value is `'Footnotes'`.
*   Change it when the markdown is not in English.
*
*   This label is typically hidden visually (assuming a `sr-only` CSS class
*   is defined that does that) and so affects screen readers only.
*   If you do have such a class, but want to show this section to everyone,
*   pass different attributes with the `labelAttributes` option.
* @property {string} [labelAttributes='class="sr-only"']
*   Attributes to use on the footnote label.
*
*   Change it to show the label and add other attributes.
*
*   This label is typically hidden visually (assuming an `sr-only` CSS class
*   is defined that does that) and so affects screen readers only.
*   If you do have such a class, but want to show this section to everyone,
*   pass an empty string.
*   You can also add different attributes.
*
*   > 👉 **Note**: `id="footnote-label"` is always added, because footnote
*   > calls use it with `aria-describedby` to provide an accessible label.
* @property {string} [labelTagName='h2']
*   HTML tag name to use for the footnote label element.
*
*   Change it to match your document structure.
*
*   This label is typically hidden visually (assuming a `sr-only` CSS class
*   is defined that does that) and so affects screen readers only.
*   If you do have such a class, but want to show this section to everyone,
*   pass different attributes with the `labelAttributes` option.
* @property {BackLabelTemplate | string} [backLabel]
*   Textual label to describe the backreference back to references.
*
*   The default value is:
*
*   ```js
*   function defaultBackLabel(referenceIndex, rereferenceIndex) {
*    return (
*      'Back to reference ' +
*      (referenceIndex + 1) +
*      (rereferenceIndex > 1 ? '-' + rereferenceIndex : '')
*    )
*  }
*   ```
*
*   Change it when the markdown is not in English.
*
*   This label is used in the `aria-label` attribute on each backreference
*   (the `↩` links).
*   It affects users of assistive technology.
*/
var own = {}.hasOwnProperty;
/** @type {Options} */
var emptyOptions = {};
/**
* Generate the default label that GitHub uses on backreferences.
*
* @param {number} referenceIndex
*   Index of the definition in the order that they are first referenced,
*   0-indexed.
* @param {number} rereferenceIndex
*   Index of calls to the same definition, 0-indexed.
* @returns {string}
*   Default label.
*/
function defaultBackLabel(referenceIndex, rereferenceIndex) {
	return "Back to reference " + (referenceIndex + 1) + (rereferenceIndex > 1 ? "-" + rereferenceIndex : "");
}
/**
* Create an extension for `micromark` to support GFM footnotes when
* serializing to HTML.
*
* @param {Options | null | undefined} [options]
*   Configuration.
* @returns {HtmlExtension}
*   Extension for `micromark` that can be passed in `htmlExtensions` to
*   support GFM footnotes when serializing to HTML.
*/
function gfmFootnoteHtml(options) {
	const config = options || emptyOptions;
	const label = config.label || "Footnotes";
	const labelTagName = config.labelTagName || "h2";
	const labelAttributes = config.labelAttributes === null || config.labelAttributes === void 0 ? "class=\"sr-only\"" : config.labelAttributes;
	const backLabel = config.backLabel || defaultBackLabel;
	const clobberPrefix = config.clobberPrefix === null || config.clobberPrefix === void 0 ? "user-content-" : config.clobberPrefix;
	return {
		enter: {
			gfmFootnoteDefinition() {
				this.getData("tightStack").push(false);
			},
			gfmFootnoteDefinitionLabelString() {
				this.buffer();
			},
			gfmFootnoteCallString() {
				this.buffer();
			}
		},
		exit: {
			gfmFootnoteDefinition() {
				let definitions = this.getData("gfmFootnoteDefinitions");
				const footnoteStack = this.getData("gfmFootnoteDefinitionStack");
				ok(footnoteStack, "expected `footnoteStack`");
				const tightStack = this.getData("tightStack");
				const current = footnoteStack.pop();
				const value = this.resume();
				ok(current, "expected to be in a footnote");
				if (!definitions) this.setData("gfmFootnoteDefinitions", definitions = {});
				if (!own.call(definitions, current)) definitions[current] = value;
				tightStack.pop();
				this.setData("slurpOneLineEnding", true);
				this.setData("lastWasTag");
			},
			gfmFootnoteDefinitionLabelString(token) {
				let footnoteStack = this.getData("gfmFootnoteDefinitionStack");
				if (!footnoteStack) this.setData("gfmFootnoteDefinitionStack", footnoteStack = []);
				footnoteStack.push(normalizeIdentifier(this.sliceSerialize(token)));
				this.resume();
				this.buffer();
			},
			gfmFootnoteCallString(token) {
				let calls = this.getData("gfmFootnoteCallOrder");
				let counts = this.getData("gfmFootnoteCallCounts");
				const id = normalizeIdentifier(this.sliceSerialize(token));
				/** @type {number} */
				let counter;
				this.resume();
				if (!calls) this.setData("gfmFootnoteCallOrder", calls = []);
				if (!counts) this.setData("gfmFootnoteCallCounts", counts = {});
				const index = calls.indexOf(id);
				const safeId = sanitizeUri(id.toLowerCase());
				if (index === -1) {
					calls.push(id);
					counts[id] = 1;
					counter = calls.length;
				} else {
					counts[id]++;
					counter = index + 1;
				}
				const reuseCounter = counts[id];
				this.tag("<sup><a href=\"#" + clobberPrefix + "fn-" + safeId + "\" id=\"" + clobberPrefix + "fnref-" + safeId + (reuseCounter > 1 ? "-" + reuseCounter : "") + "\" data-footnote-ref=\"\" aria-describedby=\"footnote-label\">" + String(counter) + "</a></sup>");
			},
			null() {
				const calls = this.getData("gfmFootnoteCallOrder") || [];
				const counts = this.getData("gfmFootnoteCallCounts") || {};
				const definitions = this.getData("gfmFootnoteDefinitions") || {};
				let index = -1;
				if (calls.length > 0) {
					this.lineEndingIfNeeded();
					this.tag("<section data-footnotes=\"\" class=\"footnotes\"><" + labelTagName + " id=\"footnote-label\"" + (labelAttributes ? " " + labelAttributes : "") + ">");
					this.raw(this.encode(label));
					this.tag("</" + labelTagName + ">");
					this.lineEndingIfNeeded();
					this.tag("<ol>");
				}
				while (++index < calls.length) {
					const id = calls[index];
					const safeId = sanitizeUri(id.toLowerCase());
					let referenceIndex = 0;
					/** @type {Array<string>} */
					const references = [];
					while (++referenceIndex <= counts[id]) references.push("<a href=\"#" + clobberPrefix + "fnref-" + safeId + (referenceIndex > 1 ? "-" + referenceIndex : "") + "\" data-footnote-backref=\"\" aria-label=\"" + this.encode(typeof backLabel === "string" ? backLabel : backLabel(index, referenceIndex)) + "\" class=\"data-footnote-backref\">↩" + (referenceIndex > 1 ? "<sup>" + referenceIndex + "</sup>" : "") + "</a>");
					const reference = references.join(" ");
					let injected = false;
					this.lineEndingIfNeeded();
					this.tag("<li id=\"" + clobberPrefix + "fn-" + safeId + "\">");
					this.lineEndingIfNeeded();
					this.tag(definitions[id].replace(/<\/p>(?:\r?\n|\r)?$/, ($0) => {
						injected = true;
						return " " + reference + $0;
					}));
					if (!injected) {
						this.lineEndingIfNeeded();
						this.tag(reference);
					}
					this.lineEndingIfNeeded();
					this.tag("</li>");
				}
				if (calls.length > 0) {
					this.lineEndingIfNeeded();
					this.tag("</ol>");
					this.lineEndingIfNeeded();
					this.tag("</section>");
				}
			}
		}
	};
}
//#endregion
//#region node_modules/micromark-extension-gfm-strikethrough/dev/lib/html.js
/**
* @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
*/
/**
* Extension for `micromark` that can be passed in `htmlExtensions`, to
* support GFM strikethrough when serializing to HTML.
*
* @type {HtmlExtension}
*/
var gfmStrikethroughHtml = {
	enter: { strikethrough() {
		this.tag("<del>");
	} },
	exit: { strikethrough() {
		this.tag("</del>");
	} }
};
//#endregion
//#region node_modules/micromark-extension-gfm-strikethrough/dev/lib/syntax.js
/**
* @typedef {import('micromark-util-types').Event} Event
* @typedef {import('micromark-util-types').Extension} Extension
* @typedef {import('micromark-util-types').Resolver} Resolver
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').Token} Token
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*
* @typedef Options
*   Configuration (optional).
* @property {boolean} [singleTilde=true]
*   Whether to support strikethrough with a single tilde.
*
*   Single tildes work on github.com, but are technically prohibited by the
*   GFM spec.
*/
/**
* Create an extension for `micromark` to enable GFM strikethrough syntax.
*
* @param {Options | null | undefined} [options]
*   Configuration.
* @returns {Extension}
*   Extension for `micromark` that can be passed in `extensions`, to
*   enable GFM strikethrough syntax.
*/
function gfmStrikethrough(options) {
	let single = (options || {}).singleTilde;
	const tokenizer = {
		tokenize: tokenizeStrikethrough,
		resolveAll: resolveAllStrikethrough
	};
	if (single === null || single === void 0) single = true;
	return {
		text: { [codes.tilde]: tokenizer },
		insideSpan: { null: [tokenizer] },
		attentionMarkers: { null: [codes.tilde] }
	};
	/**
	* Take events and resolve strikethrough.
	*
	* @type {Resolver}
	*/
	function resolveAllStrikethrough(events, context) {
		let index = -1;
		while (++index < events.length) if (events[index][0] === "enter" && events[index][1].type === "strikethroughSequenceTemporary" && events[index][1]._close) {
			let open = index;
			while (open--) if (events[open][0] === "exit" && events[open][1].type === "strikethroughSequenceTemporary" && events[open][1]._open && events[index][1].end.offset - events[index][1].start.offset === events[open][1].end.offset - events[open][1].start.offset) {
				events[index][1].type = "strikethroughSequence";
				events[open][1].type = "strikethroughSequence";
				/** @type {Token} */
				const strikethrough = {
					type: "strikethrough",
					start: Object.assign({}, events[open][1].start),
					end: Object.assign({}, events[index][1].end)
				};
				/** @type {Token} */
				const text = {
					type: "strikethroughText",
					start: Object.assign({}, events[open][1].end),
					end: Object.assign({}, events[index][1].start)
				};
				/** @type {Array<Event>} */
				const nextEvents = [
					[
						"enter",
						strikethrough,
						context
					],
					[
						"enter",
						events[open][1],
						context
					],
					[
						"exit",
						events[open][1],
						context
					],
					[
						"enter",
						text,
						context
					]
				];
				const insideSpan = context.parser.constructs.insideSpan.null;
				if (insideSpan) splice(nextEvents, nextEvents.length, 0, resolveAll(insideSpan, events.slice(open + 1, index), context));
				splice(nextEvents, nextEvents.length, 0, [
					[
						"exit",
						text,
						context
					],
					[
						"enter",
						events[index][1],
						context
					],
					[
						"exit",
						events[index][1],
						context
					],
					[
						"exit",
						strikethrough,
						context
					]
				]);
				splice(events, open - 1, index - open + 3, nextEvents);
				index = open + nextEvents.length - 2;
				break;
			}
		}
		index = -1;
		while (++index < events.length) if (events[index][1].type === "strikethroughSequenceTemporary") events[index][1].type = types.data;
		return events;
	}
	/**
	* @this {TokenizeContext}
	* @type {Tokenizer}
	*/
	function tokenizeStrikethrough(effects, ok$3, nok) {
		const previous = this.previous;
		const events = this.events;
		let size = 0;
		return start;
		/** @type {State} */
		function start(code) {
			ok(code === codes.tilde, "expected `~`");
			if (previous === codes.tilde && events[events.length - 1][1].type !== types.characterEscape) return nok(code);
			effects.enter("strikethroughSequenceTemporary");
			return more(code);
		}
		/** @type {State} */
		function more(code) {
			const before = classifyCharacter(previous);
			if (code === codes.tilde) {
				if (size > 1) return nok(code);
				effects.consume(code);
				size++;
				return more;
			}
			if (size < 2 && !single) return nok(code);
			const token = effects.exit("strikethroughSequenceTemporary");
			const after = classifyCharacter(code);
			token._open = !after || after === constants.attentionSideAfter && Boolean(before);
			token._close = !before || before === constants.attentionSideAfter && Boolean(after);
			return ok$3(code);
		}
	}
}
//#endregion
//#region node_modules/micromark-extension-gfm-table/dev/lib/html.js
/**
* @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
*/
/**
* @typedef {import('./infer.js').Align} Align
*/
var alignment = {
	none: "",
	left: " align=\"left\"",
	right: " align=\"right\"",
	center: " align=\"center\""
};
/**
* Extension for `micromark` that can be passed in `htmlExtensions` to support
* GFM tables when serializing to HTML.
*
* @type {HtmlExtension}
*/
var gfmTableHtml = {
	enter: {
		table(token) {
			const tableAlign = token._align;
			ok(tableAlign, "expected `_align`");
			this.lineEndingIfNeeded();
			this.tag("<table>");
			this.setData("tableAlign", tableAlign);
		},
		tableBody() {
			this.tag("<tbody>");
		},
		tableData() {
			const tableAlign = this.getData("tableAlign");
			const tableColumn = this.getData("tableColumn");
			ok(tableAlign, "expected `tableAlign`");
			ok(typeof tableColumn === "number", "expected `tableColumn`");
			const align = alignment[tableAlign[tableColumn]];
			if (align === void 0) this.buffer();
			else {
				this.lineEndingIfNeeded();
				this.tag("<td" + align + ">");
			}
		},
		tableHead() {
			this.lineEndingIfNeeded();
			this.tag("<thead>");
		},
		tableHeader() {
			const tableAlign = this.getData("tableAlign");
			const tableColumn = this.getData("tableColumn");
			ok(tableAlign, "expected `tableAlign`");
			ok(typeof tableColumn === "number", "expected `tableColumn`");
			const align = alignment[tableAlign[tableColumn]];
			this.lineEndingIfNeeded();
			this.tag("<th" + align + ">");
		},
		tableRow() {
			this.setData("tableColumn", 0);
			this.lineEndingIfNeeded();
			this.tag("<tr>");
		}
	},
	exit: {
		codeTextData(token) {
			let value = this.sliceSerialize(token);
			if (this.getData("tableAlign")) value = value.replace(/\\([\\|])/g, replace);
			this.raw(this.encode(value));
		},
		table() {
			this.setData("tableAlign");
			this.setData("slurpAllLineEndings");
			this.lineEndingIfNeeded();
			this.tag("</table>");
		},
		tableBody() {
			this.lineEndingIfNeeded();
			this.tag("</tbody>");
		},
		tableData() {
			const tableAlign = this.getData("tableAlign");
			const tableColumn = this.getData("tableColumn");
			ok(tableAlign, "expected `tableAlign`");
			ok(typeof tableColumn === "number", "expected `tableColumn`");
			if (tableColumn in tableAlign) {
				this.tag("</td>");
				this.setData("tableColumn", tableColumn + 1);
			} else this.resume();
		},
		tableHead() {
			this.lineEndingIfNeeded();
			this.tag("</thead>");
		},
		tableHeader() {
			const tableColumn = this.getData("tableColumn");
			ok(typeof tableColumn === "number", "expected `tableColumn`");
			this.tag("</th>");
			this.setData("tableColumn", tableColumn + 1);
		},
		tableRow() {
			const tableAlign = this.getData("tableAlign");
			let tableColumn = this.getData("tableColumn");
			ok(tableAlign, "expected `tableAlign`");
			ok(typeof tableColumn === "number", "expected `tableColumn`");
			while (tableColumn < tableAlign.length) {
				this.lineEndingIfNeeded();
				this.tag("<td" + alignment[tableAlign[tableColumn]] + "></td>");
				tableColumn++;
			}
			this.setData("tableColumn", tableColumn);
			this.lineEndingIfNeeded();
			this.tag("</tr>");
		}
	}
};
/**
* @param {string} $0
* @param {string} $1
* @returns {string}
*/
function replace($0, $1) {
	return $1 === "|" ? $1 : $0;
}
//#endregion
//#region node_modules/micromark-extension-gfm-table/dev/lib/edit-map.js
/**
* @typedef {import('micromark-util-types').Event} Event
*/
/**
* @typedef {[number, number, Array<Event>]} Change
* @typedef {[number, number, number]} Jump
*/
/**
* Tracks a bunch of edits.
*/
var EditMap = class {
	/**
	* Create a new edit map.
	*/
	constructor() {
		/**
		* Record of changes.
		*
		* @type {Array<Change>}
		*/
		this.map = [];
	}
	/**
	* Create an edit: a remove and/or add at a certain place.
	*
	* @param {number} index
	* @param {number} remove
	* @param {Array<Event>} add
	* @returns {void}
	*/
	add(index, remove, add) {
		addImpl(this, index, remove, add);
	}
	/**
	* Done, change the events.
	*
	* @param {Array<Event>} events
	* @returns {void}
	*/
	consume(events) {
		this.map.sort((a, b) => a[0] - b[0]);
		/* c8 ignore next 3 -- `resolve` is never called without tables, so without edits. */
		if (this.map.length === 0) return;
		let index = this.map.length;
		/** @type {Array<Array<Event>>} */
		const vecs = [];
		while (index > 0) {
			index -= 1;
			vecs.push(events.slice(this.map[index][0] + this.map[index][1]));
			vecs.push(this.map[index][2]);
			events.length = this.map[index][0];
		}
		vecs.push([...events]);
		events.length = 0;
		let slice = vecs.pop();
		while (slice) {
			events.push(...slice);
			slice = vecs.pop();
		}
		this.map.length = 0;
	}
};
/**
* Create an edit.
*
* @param {EditMap} editMap
* @param {number} at
* @param {number} remove
* @param {Array<Event>} add
* @returns {void}
*/
function addImpl(editMap, at, remove, add) {
	let index = 0;
	/* c8 ignore next 3 -- `resolve` is never called without tables, so without edits. */
	if (remove === 0 && add.length === 0) return;
	while (index < editMap.map.length) {
		if (editMap.map[index][0] === at) {
			editMap.map[index][1] += remove;
			editMap.map[index][2].push(...add);
			return;
		}
		index += 1;
	}
	editMap.map.push([
		at,
		remove,
		add
	]);
}
//#endregion
//#region node_modules/micromark-extension-gfm-table/dev/lib/infer.js
/**
* @typedef {import('micromark-util-types').Event} Event
*/
/**
* @typedef {'left' | 'center' | 'right' | 'none'} Align
*/
/**
* Figure out the alignment of a GFM table.
*
* @param {Array<Event>} events
* @param {number} index
* @returns {Array<Align>}
*/
function gfmTableAlign(events, index) {
	ok(events[index][1].type === "table", "expected table");
	let inDelimiterRow = false;
	/** @type {Array<Align>} */
	const align = [];
	while (index < events.length) {
		const event = events[index];
		if (inDelimiterRow) {
			if (event[0] === "enter") {
				if (event[1].type === "tableContent") align.push(events[index + 1][1].type === "tableDelimiterMarker" ? "left" : "none");
			} else if (event[1].type === "tableContent") {
				if (events[index - 1][1].type === "tableDelimiterMarker") {
					const alignIndex = align.length - 1;
					align[alignIndex] = align[alignIndex] === "left" ? "center" : "right";
				}
			} else if (event[1].type === "tableDelimiterRow") break;
		} else if (event[0] === "enter" && event[1].type === "tableDelimiterRow") inDelimiterRow = true;
		index += 1;
	}
	return align;
}
//#endregion
//#region node_modules/micromark-extension-gfm-table/dev/lib/syntax.js
/**
* @typedef {import('micromark-util-types').Event} Event
* @typedef {import('micromark-util-types').Extension} Extension
* @typedef {import('micromark-util-types').Point} Point
* @typedef {import('micromark-util-types').Resolver} Resolver
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').Token} Token
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
/**
* @typedef {[number, number, number, number]} Range
*   Cell info.
*
* @typedef {0 | 1 | 2 | 3} RowKind
*   Where we are: `1` for head row, `2` for delimiter row, `3` for body row.
*/
/**
* Extension for `micromark` that can be passed in `extensions` to enable GFM
* table syntax.
*
* @type {Extension}
*/
var gfmTable = { flow: { null: {
	tokenize: tokenizeTable,
	resolveAll: resolveTable
} } };
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeTable(effects, ok$2, nok) {
	const self = this;
	let size = 0;
	let sizeB = 0;
	/** @type {boolean | undefined} */
	let seen;
	return start;
	/**
	* Start of a GFM table.
	*
	* If there is a valid table row or table head before, then we try to parse
	* another row.
	* Otherwise, we try to parse a head.
	*
	* ```markdown
	* > | | a |
	*     ^
	*   | | - |
	* > | | b |
	*     ^
	* ```
	* @type {State}
	*/
	function start(code) {
		let index = self.events.length - 1;
		while (index > -1) {
			const type = self.events[index][1].type;
			if (type === types.lineEnding || type === types.linePrefix) index--;
			else break;
		}
		const tail = index > -1 ? self.events[index][1].type : null;
		const next = tail === "tableHead" || tail === "tableRow" ? bodyRowStart : headRowBefore;
		if (next === bodyRowStart && self.parser.lazy[self.now().line]) return nok(code);
		return next(code);
	}
	/**
	* Before table head row.
	*
	* ```markdown
	* > | | a |
	*     ^
	*   | | - |
	*   | | b |
	* ```
	*
	* @type {State}
	*/
	function headRowBefore(code) {
		effects.enter("tableHead");
		effects.enter("tableRow");
		return headRowStart(code);
	}
	/**
	* Before table head row, after whitespace.
	*
	* ```markdown
	* > | | a |
	*     ^
	*   | | - |
	*   | | b |
	* ```
	*
	* @type {State}
	*/
	function headRowStart(code) {
		if (code === codes.verticalBar) return headRowBreak(code);
		seen = true;
		sizeB += 1;
		return headRowBreak(code);
	}
	/**
	* At break in table head row.
	*
	* ```markdown
	* > | | a |
	*     ^
	*       ^
	*         ^
	*   | | - |
	*   | | b |
	* ```
	*
	* @type {State}
	*/
	function headRowBreak(code) {
		if (code === codes.eof) return nok(code);
		if (markdownLineEnding(code)) {
			if (sizeB > 1) {
				sizeB = 0;
				self.interrupt = true;
				effects.exit("tableRow");
				effects.enter(types.lineEnding);
				effects.consume(code);
				effects.exit(types.lineEnding);
				return headDelimiterStart;
			}
			return nok(code);
		}
		if (markdownSpace(code)) return factorySpace(effects, headRowBreak, types.whitespace)(code);
		sizeB += 1;
		if (seen) {
			seen = false;
			size += 1;
		}
		if (code === codes.verticalBar) {
			effects.enter("tableCellDivider");
			effects.consume(code);
			effects.exit("tableCellDivider");
			seen = true;
			return headRowBreak;
		}
		effects.enter(types.data);
		return headRowData(code);
	}
	/**
	* In table head row data.
	*
	* ```markdown
	* > | | a |
	*       ^
	*   | | - |
	*   | | b |
	* ```
	*
	* @type {State}
	*/
	function headRowData(code) {
		if (code === codes.eof || code === codes.verticalBar || markdownLineEndingOrSpace(code)) {
			effects.exit(types.data);
			return headRowBreak(code);
		}
		effects.consume(code);
		return code === codes.backslash ? headRowEscape : headRowData;
	}
	/**
	* In table head row escape.
	*
	* ```markdown
	* > | | a\-b |
	*         ^
	*   | | ---- |
	*   | | c    |
	* ```
	*
	* @type {State}
	*/
	function headRowEscape(code) {
		if (code === codes.backslash || code === codes.verticalBar) {
			effects.consume(code);
			return headRowData;
		}
		return headRowData(code);
	}
	/**
	* Before delimiter row.
	*
	* ```markdown
	*   | | a |
	* > | | - |
	*     ^
	*   | | b |
	* ```
	*
	* @type {State}
	*/
	function headDelimiterStart(code) {
		self.interrupt = false;
		if (self.parser.lazy[self.now().line]) return nok(code);
		effects.enter("tableDelimiterRow");
		seen = false;
		if (markdownSpace(code)) {
			ok(self.parser.constructs.disable.null, "expected `disabled.null`");
			return factorySpace(effects, headDelimiterBefore, types.linePrefix, self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : constants.tabSize)(code);
		}
		return headDelimiterBefore(code);
	}
	/**
	* Before delimiter row, after optional whitespace.
	*
	* Reused when a `|` is found later, to parse another cell.
	*
	* ```markdown
	*   | | a |
	* > | | - |
	*     ^
	*   | | b |
	* ```
	*
	* @type {State}
	*/
	function headDelimiterBefore(code) {
		if (code === codes.dash || code === codes.colon) return headDelimiterValueBefore(code);
		if (code === codes.verticalBar) {
			seen = true;
			effects.enter("tableCellDivider");
			effects.consume(code);
			effects.exit("tableCellDivider");
			return headDelimiterCellBefore;
		}
		return headDelimiterNok(code);
	}
	/**
	* After `|`, before delimiter cell.
	*
	* ```markdown
	*   | | a |
	* > | | - |
	*      ^
	* ```
	*
	* @type {State}
	*/
	function headDelimiterCellBefore(code) {
		if (markdownSpace(code)) return factorySpace(effects, headDelimiterValueBefore, types.whitespace)(code);
		return headDelimiterValueBefore(code);
	}
	/**
	* Before delimiter cell value.
	*
	* ```markdown
	*   | | a |
	* > | | - |
	*       ^
	* ```
	*
	* @type {State}
	*/
	function headDelimiterValueBefore(code) {
		if (code === codes.colon) {
			sizeB += 1;
			seen = true;
			effects.enter("tableDelimiterMarker");
			effects.consume(code);
			effects.exit("tableDelimiterMarker");
			return headDelimiterLeftAlignmentAfter;
		}
		if (code === codes.dash) {
			sizeB += 1;
			return headDelimiterLeftAlignmentAfter(code);
		}
		if (code === codes.eof || markdownLineEnding(code)) return headDelimiterCellAfter(code);
		return headDelimiterNok(code);
	}
	/**
	* After delimiter cell left alignment marker.
	*
	* ```markdown
	*   | | a  |
	* > | | :- |
	*        ^
	* ```
	*
	* @type {State}
	*/
	function headDelimiterLeftAlignmentAfter(code) {
		if (code === codes.dash) {
			effects.enter("tableDelimiterFiller");
			return headDelimiterFiller(code);
		}
		return headDelimiterNok(code);
	}
	/**
	* In delimiter cell filler.
	*
	* ```markdown
	*   | | a |
	* > | | - |
	*       ^
	* ```
	*
	* @type {State}
	*/
	function headDelimiterFiller(code) {
		if (code === codes.dash) {
			effects.consume(code);
			return headDelimiterFiller;
		}
		if (code === codes.colon) {
			seen = true;
			effects.exit("tableDelimiterFiller");
			effects.enter("tableDelimiterMarker");
			effects.consume(code);
			effects.exit("tableDelimiterMarker");
			return headDelimiterRightAlignmentAfter;
		}
		effects.exit("tableDelimiterFiller");
		return headDelimiterRightAlignmentAfter(code);
	}
	/**
	* After delimiter cell right alignment marker.
	*
	* ```markdown
	*   | |  a |
	* > | | -: |
	*         ^
	* ```
	*
	* @type {State}
	*/
	function headDelimiterRightAlignmentAfter(code) {
		if (markdownSpace(code)) return factorySpace(effects, headDelimiterCellAfter, types.whitespace)(code);
		return headDelimiterCellAfter(code);
	}
	/**
	* After delimiter cell.
	*
	* ```markdown
	*   | |  a |
	* > | | -: |
	*          ^
	* ```
	*
	* @type {State}
	*/
	function headDelimiterCellAfter(code) {
		if (code === codes.verticalBar) return headDelimiterBefore(code);
		if (code === codes.eof || markdownLineEnding(code)) {
			if (!seen || size !== sizeB) return headDelimiterNok(code);
			effects.exit("tableDelimiterRow");
			effects.exit("tableHead");
			return ok$2(code);
		}
		return headDelimiterNok(code);
	}
	/**
	* In delimiter row, at a disallowed byte.
	*
	* ```markdown
	*   | | a |
	* > | | x |
	*       ^
	* ```
	*
	* @type {State}
	*/
	function headDelimiterNok(code) {
		return nok(code);
	}
	/**
	* Before table body row.
	*
	* ```markdown
	*   | | a |
	*   | | - |
	* > | | b |
	*     ^
	* ```
	*
	* @type {State}
	*/
	function bodyRowStart(code) {
		effects.enter("tableRow");
		return bodyRowBreak(code);
	}
	/**
	* At break in table body row.
	*
	* ```markdown
	*   | | a |
	*   | | - |
	* > | | b |
	*     ^
	*       ^
	*         ^
	* ```
	*
	* @type {State}
	*/
	function bodyRowBreak(code) {
		if (code === codes.verticalBar) {
			effects.enter("tableCellDivider");
			effects.consume(code);
			effects.exit("tableCellDivider");
			return bodyRowBreak;
		}
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit("tableRow");
			return ok$2(code);
		}
		if (markdownSpace(code)) return factorySpace(effects, bodyRowBreak, types.whitespace)(code);
		effects.enter(types.data);
		return bodyRowData(code);
	}
	/**
	* In table body row data.
	*
	* ```markdown
	*   | | a |
	*   | | - |
	* > | | b |
	*       ^
	* ```
	*
	* @type {State}
	*/
	function bodyRowData(code) {
		if (code === codes.eof || code === codes.verticalBar || markdownLineEndingOrSpace(code)) {
			effects.exit(types.data);
			return bodyRowBreak(code);
		}
		effects.consume(code);
		return code === codes.backslash ? bodyRowEscape : bodyRowData;
	}
	/**
	* In table body row escape.
	*
	* ```markdown
	*   | | a    |
	*   | | ---- |
	* > | | b\-c |
	*         ^
	* ```
	*
	* @type {State}
	*/
	function bodyRowEscape(code) {
		if (code === codes.backslash || code === codes.verticalBar) {
			effects.consume(code);
			return bodyRowData;
		}
		return bodyRowData(code);
	}
}
/** @type {Resolver} */
function resolveTable(events, context) {
	let index = -1;
	let inFirstCellAwaitingPipe = true;
	/** @type {RowKind} */
	let rowKind = 0;
	/** @type {Range} */
	let lastCell = [
		0,
		0,
		0,
		0
	];
	/** @type {Range} */
	let cell = [
		0,
		0,
		0,
		0
	];
	let afterHeadAwaitingFirstBodyRow = false;
	let lastTableEnd = 0;
	/** @type {Token | undefined} */
	let currentTable;
	/** @type {Token | undefined} */
	let currentBody;
	/** @type {Token | undefined} */
	let currentCell;
	const map = new EditMap();
	while (++index < events.length) {
		const event = events[index];
		const token = event[1];
		if (event[0] === "enter") {
			if (token.type === "tableHead") {
				afterHeadAwaitingFirstBodyRow = false;
				if (lastTableEnd !== 0) {
					ok(currentTable, "there should be a table opening");
					flushTableEnd(map, context, lastTableEnd, currentTable, currentBody);
					currentBody = void 0;
					lastTableEnd = 0;
				}
				currentTable = {
					type: "table",
					start: Object.assign({}, token.start),
					end: Object.assign({}, token.end)
				};
				map.add(index, 0, [[
					"enter",
					currentTable,
					context
				]]);
			} else if (token.type === "tableRow" || token.type === "tableDelimiterRow") {
				inFirstCellAwaitingPipe = true;
				currentCell = void 0;
				lastCell = [
					0,
					0,
					0,
					0
				];
				cell = [
					0,
					index + 1,
					0,
					0
				];
				if (afterHeadAwaitingFirstBodyRow) {
					afterHeadAwaitingFirstBodyRow = false;
					currentBody = {
						type: "tableBody",
						start: Object.assign({}, token.start),
						end: Object.assign({}, token.end)
					};
					map.add(index, 0, [[
						"enter",
						currentBody,
						context
					]]);
				}
				rowKind = token.type === "tableDelimiterRow" ? 2 : currentBody ? 3 : 1;
			} else if (rowKind && (token.type === types.data || token.type === "tableDelimiterMarker" || token.type === "tableDelimiterFiller")) {
				inFirstCellAwaitingPipe = false;
				if (cell[2] === 0) {
					if (lastCell[1] !== 0) {
						cell[0] = cell[1];
						currentCell = flushCell(map, context, lastCell, rowKind, void 0, currentCell);
						lastCell = [
							0,
							0,
							0,
							0
						];
					}
					cell[2] = index;
				}
			} else if (token.type === "tableCellDivider") if (inFirstCellAwaitingPipe) inFirstCellAwaitingPipe = false;
			else {
				if (lastCell[1] !== 0) {
					cell[0] = cell[1];
					currentCell = flushCell(map, context, lastCell, rowKind, void 0, currentCell);
				}
				lastCell = cell;
				cell = [
					lastCell[1],
					index,
					0,
					0
				];
			}
		} else if (token.type === "tableHead") {
			afterHeadAwaitingFirstBodyRow = true;
			lastTableEnd = index;
		} else if (token.type === "tableRow" || token.type === "tableDelimiterRow") {
			lastTableEnd = index;
			if (lastCell[1] !== 0) {
				cell[0] = cell[1];
				currentCell = flushCell(map, context, lastCell, rowKind, index, currentCell);
			} else if (cell[1] !== 0) currentCell = flushCell(map, context, cell, rowKind, index, currentCell);
			rowKind = 0;
		} else if (rowKind && (token.type === types.data || token.type === "tableDelimiterMarker" || token.type === "tableDelimiterFiller")) cell[3] = index;
	}
	if (lastTableEnd !== 0) {
		ok(currentTable, "expected table opening");
		flushTableEnd(map, context, lastTableEnd, currentTable, currentBody);
	}
	map.consume(context.events);
	index = -1;
	while (++index < context.events.length) {
		const event = context.events[index];
		if (event[0] === "enter" && event[1].type === "table") event[1]._align = gfmTableAlign(context.events, index);
	}
	return events;
}
/**
*
* @param {EditMap} map
* @param {TokenizeContext} context
* @param {Range} range
* @param {RowKind} rowKind
* @param {number | undefined} rowEnd
* @param {Token | undefined} previousCell
* @returns {Token | undefined}
*/
function flushCell(map, context, range, rowKind, rowEnd, previousCell) {
	const groupName = rowKind === 1 ? "tableHeader" : rowKind === 2 ? "tableDelimiter" : "tableData";
	const valueName = "tableContent";
	if (range[0] !== 0) {
		ok(previousCell, "expected previous cell enter");
		previousCell.end = Object.assign({}, getPoint(context.events, range[0]));
		map.add(range[0], 0, [[
			"exit",
			previousCell,
			context
		]]);
	}
	const now = getPoint(context.events, range[1]);
	previousCell = {
		type: groupName,
		start: Object.assign({}, now),
		end: Object.assign({}, now)
	};
	map.add(range[1], 0, [[
		"enter",
		previousCell,
		context
	]]);
	if (range[2] !== 0) {
		const relatedStart = getPoint(context.events, range[2]);
		const relatedEnd = getPoint(context.events, range[3]);
		/** @type {Token} */
		const valueToken = {
			type: valueName,
			start: Object.assign({}, relatedStart),
			end: Object.assign({}, relatedEnd)
		};
		map.add(range[2], 0, [[
			"enter",
			valueToken,
			context
		]]);
		ok(range[3] !== 0);
		if (rowKind !== 2) {
			const start = context.events[range[2]];
			const end = context.events[range[3]];
			start[1].end = Object.assign({}, end[1].end);
			start[1].type = types.chunkText;
			start[1].contentType = constants.contentTypeText;
			if (range[3] > range[2] + 1) {
				const a = range[2] + 1;
				const b = range[3] - range[2] - 1;
				map.add(a, b, []);
			}
		}
		map.add(range[3] + 1, 0, [[
			"exit",
			valueToken,
			context
		]]);
	}
	if (rowEnd !== void 0) {
		previousCell.end = Object.assign({}, getPoint(context.events, rowEnd));
		map.add(rowEnd, 0, [[
			"exit",
			previousCell,
			context
		]]);
		previousCell = void 0;
	}
	return previousCell;
}
/**
* Generate table end (and table body end).
*
* @param {EditMap} map
* @param {TokenizeContext} context
* @param {number} index
* @param {Token} table
* @param {Token | undefined} tableBody
*/
function flushTableEnd(map, context, index, table, tableBody) {
	/** @type {Array<Event>} */
	const exits = [];
	const related = getPoint(context.events, index);
	if (tableBody) {
		tableBody.end = Object.assign({}, related);
		exits.push([
			"exit",
			tableBody,
			context
		]);
	}
	table.end = Object.assign({}, related);
	exits.push([
		"exit",
		table,
		context
	]);
	map.add(index + 1, 0, exits);
}
/**
* @param {Array<Event>} events
* @param {number} index
* @returns {readonly Point}
*/
function getPoint(events, index) {
	const event = events[index];
	const side = event[0] === "enter" ? "start" : "end";
	return event[1][side];
}
//#endregion
//#region node_modules/micromark-extension-gfm-tagfilter/index.js
/**
* @typedef {import('micromark-util-types').CompileContext} CompileContext
* @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
* @typedef {import('micromark-util-types').Token} Token
*/
var reFlow = /<(\/?)(iframe|noembed|noframes|plaintext|script|style|title|textarea|xmp)(?=[\t\n\f\r />])/gi;
var reText = new RegExp("^" + reFlow.source, "i");
/**
* Extension for `micromark` that can be passed in `htmlExtensions`, to
* support GitHub’s weird and useless tagfilter when serializing to HTML.
*
* @type {HtmlExtension}
*/
var gfmTagfilterHtml = { exit: {
	htmlFlowData(token) {
		exitHtmlData.call(this, token, reFlow);
	},
	htmlTextData(token) {
		exitHtmlData.call(this, token, reText);
	}
} };
/**
* @this {CompileContext}
* @param {Token} token
* @param {RegExp} filter
*/
function exitHtmlData(token, filter) {
	let value = this.sliceSerialize(token);
	if (this.options.allowDangerousHtml) value = value.replace(filter, "&lt;$1$2");
	this.raw(this.encode(value));
}
//#endregion
//#region node_modules/micromark-extension-gfm-task-list-item/dev/lib/html.js
/**
* @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
*/
/**
* Extension for `micromark` that can be passed in `htmlExtensions` to
* support GFM task list items when serializing to HTML.
*
* @type {HtmlExtension}
*/
var gfmTaskListItemHtml = {
	enter: { taskListCheck() {
		this.tag("<input type=\"checkbox\" disabled=\"\" ");
	} },
	exit: {
		taskListCheck() {
			this.tag("/>");
		},
		taskListCheckValueChecked() {
			this.tag("checked=\"\" ");
		}
	}
};
//#endregion
//#region node_modules/micromark-extension-gfm-task-list-item/dev/lib/syntax.js
/**
* @typedef {import('micromark-util-types').Extension} Extension
* @typedef {import('micromark-util-types').State} State
* @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
* @typedef {import('micromark-util-types').Tokenizer} Tokenizer
*/
var tasklistCheck = { tokenize: tokenizeTasklistCheck };
/**
* Extension for `micromark` that can be passed in `extensions`, to
* enable GFM task list items syntax.
*
* @type {Extension}
*/
var gfmTaskListItem = { text: { [codes.leftSquareBracket]: tasklistCheck } };
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function tokenizeTasklistCheck(effects, ok$1, nok) {
	const self = this;
	return open;
	/**
	* At start of task list item check.
	*
	* ```markdown
	* > | * [x] y.
	*       ^
	* ```
	*
	* @type {State}
	*/
	function open(code) {
		ok(code === codes.leftSquareBracket, "expected `[`");
		if (self.previous !== codes.eof || !self._gfmTasklistFirstContentOfListItem) return nok(code);
		effects.enter("taskListCheck");
		effects.enter("taskListCheckMarker");
		effects.consume(code);
		effects.exit("taskListCheckMarker");
		return inside;
	}
	/**
	* In task list item check.
	*
	* ```markdown
	* > | * [x] y.
	*        ^
	* ```
	*
	* @type {State}
	*/
	function inside(code) {
		if (markdownLineEndingOrSpace(code)) {
			effects.enter("taskListCheckValueUnchecked");
			effects.consume(code);
			effects.exit("taskListCheckValueUnchecked");
			return close;
		}
		if (code === codes.uppercaseX || code === codes.lowercaseX) {
			effects.enter("taskListCheckValueChecked");
			effects.consume(code);
			effects.exit("taskListCheckValueChecked");
			return close;
		}
		return nok(code);
	}
	/**
	* At close of task list item check.
	*
	* ```markdown
	* > | * [x] y.
	*         ^
	* ```
	*
	* @type {State}
	*/
	function close(code) {
		if (code === codes.rightSquareBracket) {
			effects.enter("taskListCheckMarker");
			effects.consume(code);
			effects.exit("taskListCheckMarker");
			effects.exit("taskListCheck");
			return after;
		}
		return nok(code);
	}
	/**
	* @type {State}
	*/
	function after(code) {
		if (markdownLineEnding(code)) return ok$1(code);
		if (markdownSpace(code)) return effects.check({ tokenize: spaceThenNonSpace }, ok$1, nok)(code);
		return nok(code);
	}
}
/**
* @this {TokenizeContext}
* @type {Tokenizer}
*/
function spaceThenNonSpace(effects, ok, nok) {
	return factorySpace(effects, after, types.whitespace);
	/**
	* After whitespace, after task list item check.
	*
	* ```markdown
	* > | * [x] y.
	*           ^
	* ```
	*
	* @type {State}
	*/
	function after(code) {
		return code === codes.eof ? nok(code) : ok(code);
	}
}
//#endregion
//#region node_modules/micromark-extension-gfm/index.js
/**
* @typedef {import('micromark-extension-gfm-footnote').HtmlOptions} HtmlOptions
* @typedef {import('micromark-extension-gfm-strikethrough').Options} Options
* @typedef {import('micromark-util-types').Extension} Extension
* @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
*/
/**
* Create an extension for `micromark` to enable GFM syntax.
*
* @param {Options | null | undefined} [options]
*   Configuration (optional).
*
*   Passed to `micromark-extens-gfm-strikethrough`.
* @returns {Extension}
*   Extension for `micromark` that can be passed in `extensions` to enable GFM
*   syntax.
*/
function gfm(options) {
	return combineExtensions([
		gfmAutolinkLiteral,
		gfmFootnote(),
		gfmStrikethrough(options),
		gfmTable,
		gfmTaskListItem
	]);
}
/**
* Create an extension for `micromark` to support GFM when serializing to HTML.
*
* @param {HtmlOptions | null | undefined} [options]
*   Configuration.
*
*   Passed to `micromark-extens-gfm-footnote`.
* @returns {HtmlExtension}
*   Extension for `micromark` that can be passed in `htmlExtensions` to
*   support GFM when serializing to HTML.
*/
function gfmHtml(options) {
	return combineHtmlExtensions([
		gfmAutolinkLiteralHtml,
		gfmFootnoteHtml(options),
		gfmStrikethroughHtml,
		gfmTableHtml,
		gfmTagfilterHtml,
		gfmTaskListItemHtml
	]);
}
//#endregion
export { gfm, gfmHtml };
