import { $ as readBlob, B as handleSelfCloseTags, Et as ERROR_TYPES, H as imgToDataUrl, Z as nodeRichTextToTextWithWrap, n as addXmlns, rt as resizeImgSize, tt as removeHTMLEntities, ut as walk, x as downloadFile, xt as SVG } from "./utils-DKbIT76G.js";
//#region node_modules/simple-mind-map/src/utils/simulateCSSBackgroundInCanvas.js
var getNumberValueFromStr = (value) => {
	return String(value).split(/\s+/).map((item) => {
		if (/^[\d.]+/.test(item)) {
			let res = /^([\d.]+)(.*)$/.exec(item);
			return [Number(res[1]), res[2]];
		} else return item;
	});
};
var zoomWidth = (ratio, height) => {
	return ratio * height;
};
var zoomHeight = (ratio, width) => {
	return width / ratio;
};
var keyWordToPercentageMap = {
	left: 0,
	top: 0,
	center: 50,
	bottom: 100,
	right: 100
};
var handleBackgroundSize = ({ backgroundSize, drawOpt, imageRatio, canvasWidth, canvasHeight, canvasRatio }) => {
	if (backgroundSize) {
		let backgroundSizeValueArr = getNumberValueFromStr(backgroundSize);
		if (backgroundSizeValueArr[0] === "auto" && backgroundSizeValueArr[1] === "auto") return;
		if (backgroundSizeValueArr[0] === "cover") {
			if (imageRatio > canvasRatio) {
				drawOpt.height = canvasHeight;
				drawOpt.width = zoomWidth(imageRatio, canvasHeight);
			} else {
				drawOpt.width = canvasWidth;
				drawOpt.height = zoomHeight(imageRatio, canvasWidth);
			}
			return;
		}
		if (backgroundSizeValueArr[0] === "contain") {
			if (imageRatio > canvasRatio) {
				drawOpt.width = canvasWidth;
				drawOpt.height = zoomHeight(imageRatio, canvasWidth);
			} else {
				drawOpt.height = canvasHeight;
				drawOpt.width = zoomWidth(imageRatio, canvasHeight);
			}
			return;
		}
		let newNumberWidth = -1;
		if (backgroundSizeValueArr[0]) {
			if (Array.isArray(backgroundSizeValueArr[0])) if (backgroundSizeValueArr[0][1] === "%") {
				drawOpt.width = backgroundSizeValueArr[0][0] / 100 * canvasWidth;
				newNumberWidth = drawOpt.width;
			} else {
				drawOpt.width = backgroundSizeValueArr[0][0];
				newNumberWidth = backgroundSizeValueArr[0][0];
			}
			else if (backgroundSizeValueArr[0] === "auto") {
				if (backgroundSizeValueArr[1]) if (backgroundSizeValueArr[1][1] === "%") drawOpt.width = zoomWidth(imageRatio, backgroundSizeValueArr[1][0] / 100 * canvasHeight);
				else drawOpt.width = zoomWidth(imageRatio, backgroundSizeValueArr[1][0]);
			}
		}
		if (backgroundSizeValueArr[1] && Array.isArray(backgroundSizeValueArr[1])) if (backgroundSizeValueArr[1][1] === "%") drawOpt.height = backgroundSizeValueArr[1][0] / 100 * canvasHeight;
		else drawOpt.height = backgroundSizeValueArr[1][0];
		else if (newNumberWidth !== -1) drawOpt.height = zoomHeight(imageRatio, newNumberWidth);
	}
};
var handleBackgroundPosition = ({ backgroundPosition, drawOpt, imgWidth, imgHeight, canvasWidth, canvasHeight }) => {
	if (backgroundPosition) {
		let backgroundPositionValueArr = getNumberValueFromStr(backgroundPosition);
		backgroundPositionValueArr = backgroundPositionValueArr.map((item) => {
			if (typeof item === "string") return keyWordToPercentageMap[item] !== void 0 ? [keyWordToPercentageMap[item], "%"] : item;
			return item;
		});
		if (Array.isArray(backgroundPositionValueArr[0])) {
			if (backgroundPositionValueArr.length === 1) backgroundPositionValueArr.push([50, "%"]);
			if (backgroundPositionValueArr[0][1] === "%") drawOpt.x = backgroundPositionValueArr[0][0] / 100 * canvasWidth - backgroundPositionValueArr[0][0] / 100 * imgWidth;
			else drawOpt.x = backgroundPositionValueArr[0][0];
			if (backgroundPositionValueArr[1][1] === "%") drawOpt.y = backgroundPositionValueArr[1][0] / 100 * canvasHeight - backgroundPositionValueArr[1][0] / 100 * imgHeight;
			else drawOpt.y = backgroundPositionValueArr[1][0];
		}
	}
};
var handleBackgroundRepeat = ({ ctx, image, backgroundRepeat, drawOpt, imgWidth, imgHeight, canvasWidth, canvasHeight }) => {
	if (backgroundRepeat) {
		let ox = drawOpt.x;
		let oy = drawOpt.y;
		let oxRepeatNum = Math.ceil(ox / imgWidth);
		let oyRepeatNum = Math.ceil(oy / imgHeight);
		let oxRepeatX = ox - oxRepeatNum * imgWidth;
		let oxRepeatY = oy - oyRepeatNum * imgHeight;
		let backgroundRepeatValueArr = getNumberValueFromStr(backgroundRepeat);
		if (backgroundRepeatValueArr[0] === "no-repeat" || imgWidth >= canvasWidth && imgHeight >= canvasHeight) return;
		if (backgroundRepeatValueArr[0] === "repeat-x") {
			if (canvasWidth > imgWidth) {
				let x = oxRepeatX;
				while (x < canvasWidth) {
					drawImage(ctx, image, {
						...drawOpt,
						x
					});
					x += imgWidth;
				}
				return true;
			}
		}
		if (backgroundRepeatValueArr[0] === "repeat-y") {
			if (canvasHeight > imgHeight) {
				let y = oxRepeatY;
				while (y < canvasHeight) {
					drawImage(ctx, image, {
						...drawOpt,
						y
					});
					y += imgHeight;
				}
				return true;
			}
		}
		if (backgroundRepeatValueArr[0] === "repeat") {
			let x = oxRepeatX;
			while (x < canvasWidth) {
				if (canvasHeight > imgHeight) {
					let y = oxRepeatY;
					while (y < canvasHeight) {
						drawImage(ctx, image, {
							...drawOpt,
							x,
							y
						});
						y += imgHeight;
					}
				}
				x += imgWidth;
			}
			return true;
		}
	}
};
var drawImage = (ctx, image, drawOpt) => {
	ctx.drawImage(image, drawOpt.sx, drawOpt.sy, drawOpt.swidth, drawOpt.sheight, drawOpt.x, drawOpt.y, drawOpt.width, drawOpt.height);
};
var drawBackgroundImageToCanvas = (ctx, width, height, img, { backgroundSize, backgroundPosition, backgroundRepeat }, callback = () => {}) => {
	let canvasRatio = width / height;
	let image = new Image();
	image.src = img;
	image.onload = () => {
		let imgWidth = image.width;
		let imgHeight = image.height;
		let imageRatio = imgWidth / imgHeight;
		let drawOpt = {
			sx: 0,
			sy: 0,
			swidth: imgWidth,
			sheight: imgHeight,
			x: 0,
			y: 0,
			width: imgWidth,
			height: imgHeight
		};
		handleBackgroundSize({
			backgroundSize,
			drawOpt,
			imageRatio,
			canvasWidth: width,
			canvasHeight: height,
			canvasRatio
		});
		handleBackgroundPosition({
			backgroundPosition,
			drawOpt,
			imgWidth: drawOpt.width,
			imgHeight: drawOpt.height,
			imageRatio,
			canvasWidth: width,
			canvasHeight: height,
			canvasRatio
		});
		if (!handleBackgroundRepeat({
			ctx,
			image,
			backgroundRepeat,
			drawOpt,
			imgWidth: drawOpt.width,
			imgHeight: drawOpt.height,
			imageRatio,
			canvasWidth: width,
			canvasHeight: height,
			canvasRatio
		})) drawImage(ctx, image, drawOpt);
		callback();
	};
	image.onerror = (e) => {
		callback(e);
	};
};
//#endregion
//#region node_modules/simple-mind-map/src/parse/toMarkdown.js
var getNodeText$1 = (data) => {
	return data.richText ? nodeRichTextToTextWithWrap(data.text) : data.text;
};
var getTitleMark = (level) => {
	return new Array(level).fill("#").join("");
};
var getIndentMark = (level) => {
	return new Array(level - 6).fill("   ").join("") + "*";
};
var transformToMarkdown = (root) => {
	let content = "";
	walk(root, null, (node, parent, isRoot, layerIndex) => {
		const level = layerIndex + 1;
		if (level <= 6) content += getTitleMark(level);
		else content += getIndentMark(level);
		content += " " + getNodeText$1(node.data);
		const generalization = node.data.generalization;
		if (Array.isArray(generalization)) content += generalization.map((item) => {
			return ` [${getNodeText$1(item)}]`;
		});
		else if (generalization && generalization.text) {
			const generalizationText = getNodeText$1(generalization);
			content += ` [${generalizationText}]`;
		}
		content += "\n\n";
		if (node.data.note) content += node.data.note + "\n\n";
	}, () => {}, true);
	return content;
};
//#endregion
//#region node_modules/simple-mind-map/src/parse/toTxt.js
var getNodeText = (data) => {
	return data.richText ? nodeRichTextToTextWithWrap(data.text) : data.text;
};
var getIndent = (level) => {
	return new Array(level).fill("   ").join("");
};
var transformToTxt = (root) => {
	let content = "";
	walk(root, null, (node, parent, isRoot, layerIndex) => {
		content += getIndent(layerIndex);
		content += " " + getNodeText(node.data);
		const generalization = node.data.generalization;
		if (Array.isArray(generalization)) content += generalization.map((item) => {
			return ` [${getNodeText(item)}]`;
		});
		else if (generalization && generalization.text) content += ` [${getNodeText(generalization)}]`;
		content += "\n\n";
	}, () => {}, true);
	return content;
};
//#endregion
//#region node_modules/simple-mind-map/src/plugins/Export.js
var Export = class {
	constructor(opt) {
		this.mindMap = opt.mindMap;
	}
	async export(type, isDownload = true, name = "思维导图", ...args) {
		if (this[type]) {
			const result = await this[type](name, ...args);
			if (isDownload) downloadFile(result, name + "." + type);
			return result;
		} else return null;
	}
	createTransformImgTaskList(svg, tagName, propName, getUrlFn) {
		return svg.find(tagName).map(async (item) => {
			const imgUlr = getUrlFn(item);
			if (/^data:/.test(imgUlr) || imgUlr === "none") return;
			const imgData = await imgToDataUrl(imgUlr);
			item.attr(propName, imgData);
		});
	}
	async getSvgData(node) {
		let { exportPaddingX, exportPaddingY, errorHandler, resetCss, addContentToHeader, addContentToFooter, handleBeingExportSvg } = this.mindMap.opt;
		let { svg, svgHTML, clipData } = this.mindMap.getSvgData({
			paddingX: exportPaddingX,
			paddingY: exportPaddingY,
			addContentToHeader,
			addContentToFooter,
			node
		});
		if (clipData) {
			clipData.paddingX = exportPaddingX;
			clipData.paddingY = exportPaddingY;
		}
		let svgIsChange = false;
		const task1 = this.createTransformImgTaskList(svg, "image", "href", (item) => {
			return item.attr("href") || item.attr("xlink:href");
		});
		const task2 = this.createTransformImgTaskList(svg, "img", "src", (item) => {
			return item.attr("src");
		});
		const taskList = [...task1, ...task2];
		try {
			await Promise.all(taskList);
		} catch (error) {
			errorHandler(ERROR_TYPES.EXPORT_LOAD_IMAGE_ERROR, error);
		}
		if (this.mindMap.richText) {
			const foreignObjectList = svg.find("foreignObject");
			if (foreignObjectList.length > 0) {
				foreignObjectList[0].add(SVG(`<style>${resetCss}</style>`));
				svgIsChange = true;
			}
			if (this.mindMap.formula) {
				if (svg.find(".ql-formula").length > 0) {
					const styleText = this.mindMap.formula.getStyleText();
					if (styleText) {
						const styleEl = document.createElement("style");
						styleEl.innerHTML = styleText;
						addXmlns(styleEl);
						foreignObjectList[0].add(styleEl);
						svgIsChange = true;
					}
				}
			}
		}
		if (typeof handleBeingExportSvg === "function") {
			svgIsChange = true;
			svg = handleBeingExportSvg(svg);
		}
		if (taskList.length > 0 || svgIsChange) svgHTML = svg.svg();
		return {
			node: svg,
			str: svgHTML,
			clipData
		};
	}
	svgToPng(svgSrc, transparent, clipData = null) {
		const { maxCanvasSize, minExportImgCanvasScale } = this.mindMap.opt;
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.setAttribute("crossOrigin", "anonymous");
			img.onload = async () => {
				try {
					const canvas = document.createElement("canvas");
					const dpr = Math.max(window.devicePixelRatio, minExportImgCanvasScale);
					let imgWidth = img.width;
					let imgHeight = img.height;
					let paddingX = 0;
					let paddingY = 0;
					if (clipData) {
						paddingX = clipData.paddingX;
						paddingY = clipData.paddingY;
						imgWidth = clipData.width + paddingX * 2;
						imgHeight = clipData.height + paddingY * 2;
					}
					let canvasWidth = imgWidth * dpr;
					let canvasHeight = imgHeight * dpr;
					if (canvasWidth > maxCanvasSize || canvasHeight > maxCanvasSize) {
						let newWidth = null;
						let newHeight = null;
						if (canvasWidth > maxCanvasSize) newWidth = maxCanvasSize;
						else if (canvasHeight > maxCanvasSize) newHeight = maxCanvasSize;
						const res = resizeImgSize(canvasWidth, canvasHeight, newWidth, newHeight);
						canvasWidth = res[0];
						canvasHeight = res[1];
					}
					canvas.width = canvasWidth;
					canvas.height = canvasHeight;
					const styleWidth = canvasWidth / dpr;
					const styleHeight = canvasHeight / dpr;
					canvas.style.width = styleWidth + "px";
					canvas.style.height = styleHeight + "px";
					const ctx = canvas.getContext("2d");
					ctx.scale(dpr, dpr);
					if (!transparent) await this.drawBackgroundToCanvas(ctx, styleWidth, styleHeight);
					if (clipData) ctx.drawImage(img, clipData.left, clipData.top, clipData.width, clipData.height, paddingX, paddingY, clipData.width, clipData.height);
					else ctx.drawImage(img, 0, 0, styleWidth, styleHeight);
					resolve(canvas.toDataURL());
				} catch (error) {
					reject(error);
				}
			};
			img.onerror = (e) => {
				reject(e);
			};
			img.src = svgSrc;
		});
	}
	drawBackgroundToCanvas(ctx, width, height) {
		return new Promise((resolve, reject) => {
			const { backgroundColor = "#fff", backgroundImage, backgroundRepeat = "no-repeat", backgroundPosition = "center center", backgroundSize = "cover" } = this.mindMap.themeConfig;
			ctx.save();
			ctx.rect(0, 0, width, height);
			ctx.fillStyle = backgroundColor;
			ctx.fill();
			ctx.restore();
			if (backgroundImage && backgroundImage !== "none") {
				ctx.save();
				drawBackgroundImageToCanvas(ctx, width, height, backgroundImage, {
					backgroundRepeat,
					backgroundPosition,
					backgroundSize
				}, (err) => {
					if (err) reject(err);
					else resolve();
					ctx.restore();
				});
			} else resolve();
		});
	}
	drawBackgroundToSvg(svg) {
		return new Promise(async (resolve) => {
			const { backgroundColor = "#fff", backgroundImage, backgroundRepeat = "repeat" } = this.mindMap.themeConfig;
			svg.css("background-color", backgroundColor);
			if (backgroundImage && backgroundImage !== "none") {
				const imgDataUrl = await imgToDataUrl(backgroundImage);
				svg.css("background-image", `url(${imgDataUrl})`);
				svg.css("background-repeat", backgroundRepeat);
				resolve();
			} else resolve();
		});
	}
	/**
	* 方法1.把svg的图片都转化成data:url格式，再转换
	* 方法2.把svg的图片提取出来再挨个绘制到canvas里，最后一起转换
	*/
	async png(name, transparent = false, node = null) {
		this.handleNodeExport(node);
		const { str, clipData } = await this.getSvgData(node);
		const svgUrl = await this.fixSvgStrAndToBlob(str);
		return await this.svgToPng(svgUrl, transparent, clipData);
	}
	handleNodeExport(node) {
		if (node && node.getData("isActive")) {
			node.deactivate();
			const { alwaysShowExpandBtn, notShowExpandBtn } = this.mindMap.opt;
			if (!alwaysShowExpandBtn && !notShowExpandBtn && node.getData("expand")) node.removeExpandBtn();
		}
	}
	async pdf(name, transparent = false) {
		if (!this.mindMap.doExportPDF) throw new Error("请注册ExportPDF插件");
		const img = await this.png(name, transparent);
		return await this.mindMap.doExportPDF.pdf(img);
	}
	async xmind(name) {
		if (!this.mindMap.doExportXMind) throw new Error("请注册ExportXMind插件");
		const data = this.mindMap.getData();
		return await readBlob(await this.mindMap.doExportXMind.xmind(data, name));
	}
	async svg(name) {
		const { node } = await this.getSvgData();
		node.first().before(SVG(`<title>${name}</title>`));
		await this.drawBackgroundToSvg(node);
		const str = node.svg();
		return await this.fixSvgStrAndToBlob(str);
	}
	async fixSvgStrAndToBlob(str) {
		str = removeHTMLEntities(str);
		str = handleSelfCloseTags(str);
		return await readBlob(new Blob([str], { type: "image/svg+xml" }));
	}
	async json(name, withConfig = true) {
		const data = this.mindMap.getData(withConfig);
		const str = JSON.stringify(data);
		return await readBlob(new Blob([str]));
	}
	async smm(name, withConfig) {
		return await this.json(name, withConfig);
	}
	async md() {
		const content = transformToMarkdown(this.mindMap.getData());
		return await readBlob(new Blob([content]));
	}
	async txt() {
		const content = transformToTxt(this.mindMap.getData());
		return await readBlob(new Blob([content]));
	}
};
Export.instanceName = "doExport";
//#endregion
export { Export as default };
