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
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
var timeout;
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    let onTextChangeDisposable = vscode.workspace.onDidChangeTextDocument(onTextChanged);
    context.subscriptions.push(onTextChangeDisposable);
    timeout = setInterval(() => {
        textOvers.forEach((e, i) => e.update(i, 30));
        textOvers = textOvers.filter((e) => !e.isComplete());
    }, 30);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() {
    clearInterval(timeout);
}
exports.deactivate = deactivate;
let textOvers = [];
function onTextChanged(e) {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    if (e.contentChanges.length == 0)
        return '';
    const char = e.contentChanges[0].text;
    const spaces = parseInt(editor.options.tabSize?.toString() ?? '0');
    const tabs = editor.options.insertSpaces ? ' '.repeat(spaces) : '\t'.repeat(spaces);
    function textToString() {
        if (char === '')
            return 'BACKSPACE';
        if (char === ' ')
            return 'SPACE';
        if (char === tabs)
            return 'TAB';
        if (char.includes('\n'))
            return 'ENTER';
        if (char.length > 1)
            return 'PASTE';
        return char.toUpperCase();
    }
    const text = textToString();
    const cursor = editor.selection.active;
    if (!cursor)
        return;
    const over = char === '' ? 0 : 1;
    const pos = new vscode.Position(cursor.line, cursor.character + over);
    textOvers.push(new TextOver(editor, pos, text));
}
class TextOver {
    totalTimeMs = 400;
    text;
    color;
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
        const colors = ['#fff7ae', '#fccb7d', '#f0bcbc', '#e7bae4', '#c9a7d8', '#9d9bd6', '#9dc0c9', '#abd7b5'];
        const idx = Math.floor(Math.random() * (colors.length - 1));
        this.text = text;
        this.editor = editor;
        this.fontSize = 24;
        this.offy = ((Math.random() - 0.75) * 20);
        this.offx = ((Math.random() - 0.75) * 30);
        this.degs = (Math.random() - 0.5) * 20;
        this.moveDist = Math.random() * 10;
        this.moveDirX = (Math.random() - 0.5) * 2;
        this.moveDirY = (Math.random() - 0.5) * 2;
        this.color = colors[idx];
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
            return;
        }
        this.decoration?.dispose();
        this.decoration = this.createDecoration(index + 1);
        this.editor.setDecorations(this.decoration, this.ranges);
    }
    createDecoration(index) {
        const progressInv = this.timeMs / this.totalTimeMs;
        const progress = 1 - progressInv;
        const opacity = CubicCurve.ease.transform(progressInv);
        const scale = 0.5 + CubicCurve.easeInBack.transform(progressInv * 1.2);
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

			color: ${this.color};
			text-align: center;
			text-shadow: 2px 2px 0px white;
			-webkit-text-stroke: 1px #444;
			text-stroke: 1px #444;
			font-size: ${this.fontSize}px;
			font-weight: bold;
			font-family: Verdana;
			letter-spacing: 0px;`;
        return vscode.window.createTextEditorDecorationType({
            after: {
                contentText: this.text,
                textDecoration: style,
            },
            textDecoration: `none; position: relative; `,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        });
    }
}
class CubicCurve {
    static ease = new CubicCurve(0.25, 0.1, 0.25, 1.0);
    static easeInBack = new CubicCurve(0.6, -0.28, 0.735, 0.045);
    a;
    b;
    c;
    d;
    _cubicErrorBound = 0.001;
    constructor(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }
    transform(t) {
        if (t <= 0)
            return 0;
        if (t >= 1)
            return 1;
        return this.transformInternal(t);
    }
    evaluateCubic(a, b, m) {
        return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m;
    }
    transformInternal(t) {
        let start = 0.0;
        let end = 1.0;
        while (true) {
            let midpoint = (start + end) / 2;
            let estimate = this.evaluateCubic(this.a, this.c, midpoint);
            let abs = Math.abs(t - estimate);
            if (abs < this._cubicErrorBound) {
                return this.evaluateCubic(this.b, this.d, midpoint);
            }
            if (estimate < t) {
                start = midpoint;
            }
            else {
                end = midpoint;
            }
        }
    }
}
//# sourceMappingURL=extension.js.map