"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const configs_1 = require("./configs");
const color_1 = require("./utils/color");
const cubic_curve_1 = require("./utils/cubic_curve");
var timeout;
var decorations = [];
var fontFamily = 'Verdana';
var lastCursor;
// This method is called when your extension is activated
function activate(context) {
    configs_1.Configs.activate(context);
    const config = vscode.workspace.getConfiguration('editor');
    fontFamily = config.fontFamily;
    const onTextChangeDisposable = vscode.workspace.onDidChangeTextDocument(onTextChanged);
    context.subscriptions.push(onTextChangeDisposable);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() {
    clearTimeout();
}
exports.deactivate = deactivate;
function startTimeout() {
    if (timeout)
        return;
    timeout = setInterval(() => {
        decorations = decorations.filter((e, i) => e.update(i, 30));
        if (decorations.length == 0)
            clearTimeout();
    }, 30);
}
function clearTimeout() {
    if (!timeout)
        return;
    clearInterval(timeout);
    timeout = null;
}
function textToRender(text, editor) {
    if (text === '')
        return 'DELETE';
    if (text === ' ')
        return 'SPACE';
    if (text.includes('\n'))
        return 'ENTER';
    const tabSize = editor.options.tabSize;
    const tabSpace = editor.options.insertSpaces ?? false;
    const spaces = !tabSize ? 0 : parseInt(tabSize.toString());
    const tabs = (tabSpace ? ' ' : '\t').repeat(spaces);
    if (text === tabs)
        return 'TAB';
    if (text.length > 2)
        return 'CTRL+V';
    return text.toUpperCase();
}
function onTextChanged(e) {
    if (!configs_1.Configs.isExtensionEnabled)
        return;
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    if (e.contentChanges.length == 0)
        return;
    const text = e.contentChanges[0].text;
    const cursor = editor.selection.active;
    if (!cursor)
        return;
    if (lastCursor != undefined && cursor.isEqual(lastCursor))
        return;
    lastCursor = cursor;
    const data = textToRender(text, editor);
    const over = text === '' ? 0 : 1;
    const pos = new vscode.Position(cursor.line, cursor.character + over);
    decorations.push(new CharDecor(editor, pos, data));
    if (configs_1.Configs.isCursorEnabled)
        decorations.push(new CursorDecor(editor, pos));
    startTimeout();
}
class CharDecor {
    totalTimeMs = 400;
    text;
    textColor;
    shadowColor;
    strokeColor;
    offx;
    offy;
    degs;
    moveDist;
    moveDirX;
    moveDirY;
    fontSize;
    timeMs = this.totalTimeMs;
    ranges;
    editor;
    decoration;
    constructor(editor, pos, text) {
        this.text = text;
        this.editor = editor;
        this.fontSize = 24;
        this.offy = ((Math.random() - 0.75) * 20);
        this.offx = ((Math.random() - 0.75) * 30);
        this.degs = (Math.random() - 0.5) * 20;
        this.moveDist = Math.random() * 10;
        this.moveDirX = (Math.random() - 0.5) * 2;
        this.moveDirY = (Math.random() / 2 + 0.5) * -5;
        if (configs_1.Configs.isGrayscaleEnabled) {
            const rColor = color_1.ColorUtils.randomGrayscale();
            this.textColor = color_1.ColorUtils.toHexCode(rColor);
            this.shadowColor = color_1.ColorUtils.toHexCode(rColor);
        }
        else {
            const rColor = color_1.ColorUtils.saturated(color_1.ColorUtils.random());
            this.textColor = color_1.ColorUtils.toHexCode(color_1.ColorUtils.desaturated(rColor, 0.6));
            this.shadowColor = color_1.ColorUtils.toHexCode(rColor);
        }
        this.strokeColor = 'white';
        this.ranges = [new vscode.Range(pos, pos)];
        this.decoration = null;
    }
    update(index, delta) {
        this.timeMs -= delta;
        if (this.timeMs < 0) {
            this.decoration?.dispose();
            return false;
        }
        this.decoration?.dispose();
        this.decoration = this.createDecoration(index + 1);
        this.editor.setDecorations(this.decoration, this.ranges);
        return true;
    }
    createDecoration(index) {
        const progressInv = this.timeMs / this.totalTimeMs;
        const progress = 1 - progressInv;
        const opacity = cubic_curve_1.CubicCurve.ease.transform(progressInv);
        const scale = 0.5 + cubic_curve_1.CubicCurve.easeInBack.transform(progressInv * 1.2);
        const x = Math.round(this.offx + this.moveDirX * this.moveDist * progress);
        const y = Math.round(this.offy + this.moveDirY * this.moveDist * progress);
        const style = `
			none;		
			position: absolute;
			top: ${y}px;
			margin-left: ${x}px;
			display: inline-block;
			z-index: ${index};
			opacity: ${opacity};
			pointer-events: none;
			transform: translate(-50%, -150%) rotate(${this.degs}deg) scale(${scale});

			color: ${this.textColor};
			text-align: center;
			text-shadow: 0px 0px 4px ${this.shadowColor};
			
			-webkit-text-stroke: 1px ${this.strokeColor};
			text-stroke: 1px ${this.strokeColor};
			font-size: ${this.fontSize}px;
			font-weight: bold;
			font-family: ${fontFamily}, Verdana;`;
        return vscode.window.createTextEditorDecorationType({
            before: {
                contentText: this.text,
                textDecoration: style,
            },
        });
    }
}
class CursorDecor {
    totalTimeMs = 400;
    editor;
    ranges;
    timeMs = this.totalTimeMs;
    color;
    decoration;
    constructor(editor, pos) {
        this.editor = editor;
        this.decoration = null;
        const rColor = color_1.ColorUtils.saturated(color_1.ColorUtils.random());
        this.color = color_1.ColorUtils.toHexCode(color_1.ColorUtils.desaturated(rColor, 0.6));
        this.ranges = [new vscode.Range(pos, pos)];
    }
    update(index, delta) {
        this.timeMs -= delta;
        if (this.timeMs < 0) {
            this.decoration?.dispose();
            return false;
        }
        this.decoration?.dispose();
        this.decoration = this.createDecoration(index + 1);
        this.editor.setDecorations(this.decoration, this.ranges);
        return true;
    }
    createDecoration(index) {
        const progressInv = this.timeMs / this.totalTimeMs;
        const progress = 1 - progressInv;
        const opacity = cubic_curve_1.CubicCurve.ease.transform(progressInv);
        const scale = 0.5 + cubic_curve_1.CubicCurve.easeInBack.transform(progress);
        const style = `
			none;
			position: absolute;
			top: 0px;
			margin-left: 0px;
			width: 50px;
			height: 50px;
			z-index: ${index};
			background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJUExURf///wAAAAAAAH5RqV0AAAADdFJOU///ANfKDUEAAAAJcEhZcwAADsIAAA7CARUoSoAAAABcSURBVDhP3ZMxDoAwDAMT///RGLiAqkqEgYXeFvuWNkqoIRQXRIbADEJSKwnMIWRBL8a0eArkEysJfjXzxN682EXDMkL3Ub9Y9ydCQT4dTnELBGYQqA2BsfCItAGWIwaVIuQAoAAAAABJRU5ErkJggg==');
			background-repeat: no-repeat;
  			background-size: 100% 100%;
			opacity: ${opacity};
			transform: translate(-50%, -30%) scale(${scale})`;
        return vscode.window.createTextEditorDecorationType({
            after: {
                contentText: '',
                textDecoration: style,
            },
        });
    }
}
//# sourceMappingURL=extension.js.map