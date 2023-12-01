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
const color_1 = require("./utils/color");
const cubic_curve_1 = require("./utils/cubic_curve");
var enabled = false;
var timeout;
var textOvers = [];
var fontFamily = 'Verdana';
// This method is called when your extension is activated
function activate(context) {
    function isFunnyCodeEnabled() {
        const config = vscode.workspace.getConfiguration("funnycode");
        const inspect = config.inspect("enabled");
        return !!(inspect?.globalValue ?? inspect?.defaultValue ?? true);
    }
    function toogleFunnyCode() {
        const value = isFunnyCodeEnabled();
        const config = vscode.workspace.getConfiguration("funnycode");
        config.update("enabled", !value, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(value ? "Funny Code Disabled!" : "Funny Code Enabled!");
    }
    function onFunnyCodeEnabledChanged(event) {
        if (!event.affectsConfiguration("funnycode.enabled"))
            return;
        enabled = isFunnyCodeEnabled();
    }
    const config = vscode.workspace.getConfiguration('editor');
    fontFamily = config.fontFamily;
    enabled = isFunnyCodeEnabled();
    const toogleCommand = vscode.commands.registerCommand("funnycode.toggleEnable", toogleFunnyCode);
    context.subscriptions.push(toogleCommand);
    const configSub = vscode.workspace.onDidChangeConfiguration(onFunnyCodeEnabledChanged);
    context.subscriptions.push(configSub);
    const onTextChangeDisposable = vscode.workspace.onDidChangeTextDocument(onTextChanged);
    context.subscriptions.push(onTextChangeDisposable);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() {
    const c = new vscode.Color(1, 1, 1, 1);
    clearTimeout();
}
exports.deactivate = deactivate;
function startTimeout() {
    if (timeout)
        return;
    timeout = setInterval(() => {
        textOvers = textOvers.filter((e, i) => e.update(i, 30));
        if (textOvers.length == 0)
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
    if (!enabled)
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
    const data = textToRender(text, editor);
    const over = text === '' ? 0 : 1;
    const pos = new vscode.Position(cursor.line, cursor.character + over);
    textOvers.push(new TextOver(editor, pos, data));
    startTimeout();
}
class TextOver {
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
        const rColor = color_1.ColorUtils.saturated(color_1.ColorUtils.random());
        this.textColor = color_1.ColorUtils.toHexCode(color_1.ColorUtils.desaturated(rColor, 0.6));
        this.shadowColor = color_1.ColorUtils.toHexCode(rColor);
        this.strokeColor = "white";
        this.ranges = [new vscode.Range(pos, pos)];
        this.decoration = null;
    }
    isComplete() {
        return this.timeMs < 0;
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
    randomColor() {
        return color_1.ColorUtils.saturated(color_1.ColorUtils.random());
    }
}
//# sourceMappingURL=extension.js.map