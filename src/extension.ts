import * as vscode from 'vscode';

var timeout: NodeJS.Timeout;
var textOvers: TextOver[] = [];
var fontFamily: string = 'Verdana';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration('editor');
	fontFamily = config.fontFamily;

	let onTextChangeDisposable = vscode.workspace.onDidChangeTextDocument(onTextChanged);
	context.subscriptions.push(onTextChangeDisposable);
	timeout = setInterval(() => textOvers = textOvers.filter((e, i) => e.update(i, 30)), 30);
}

// This method is called when your extension is deactivated
export function deactivate() {
	clearInterval(timeout);
}

function onTextChanged(e: vscode.TextDocumentChangeEvent): void {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	if (e.contentChanges.length == 0) return;
	const char = e.contentChanges[0].text;
	const cursor = editor.selection.active;
	if (!cursor) return;

	const spaces = parseInt(editor.options.tabSize?.toString() ?? '0');
	const tabs = editor.options.insertSpaces ? ' '.repeat(spaces) : '\t'.repeat(spaces);

	function textToString() {
		if (char === '') return 'DELETE';
		if (char === ' ') return 'SPACE';
		if (char === tabs) return 'TAB';
		if (char.includes('\n')) return 'ENTER';
		if (char.length > 1) return 'CTRL+V';
		return char.toUpperCase();
	}

	const text = textToString();
	const over = char === '' ? 0 : 1;
	const pos = new vscode.Position(cursor.line, cursor.character + over);
	textOvers.push(new TextOver(editor, pos, text));
}


class TextOver {
	private readonly totalTimeMs = 400;
	private text: string;
	private color: string;
	private shadowColor: string;
	private offx: number;
	private offy: number;
	private degs: number;
	private moveDist: number;
	private moveDirX: number;
	private moveDirY: number;
	private fontSize: number;
	private timeMs: number = this.totalTimeMs;
	private ranges: vscode.Range[];
	private editor: vscode.TextEditor;
	private decoration: vscode.TextEditorDecorationType | null;

	constructor(editor: vscode.TextEditor, pos: vscode.Position, text: string) {
		this.text = text;
		this.editor = editor;
		this.fontSize = 24;
		this.offy = ((Math.random() - 0.75) * 20);
		this.offx = ((Math.random() - 0.75) * 30);
		this.degs = (Math.random() - 0.5) * 20;
		this.moveDist = Math.random() * 10;
		this.moveDirX = (Math.random() - 0.5) * 2;
		this.moveDirY = (Math.random() - 0.5) * 2;
		const rColor = Color.randomSaturatedColor();
		this.color = rColor.desaturated(0.8).toHexCode();
		this.shadowColor = rColor.toHexCode();
		this.ranges = [new vscode.Range(pos, pos)];
		this.decoration = null;
	}

	public isComplete(): boolean {
		return this.timeMs < 0;
	}

	public update(index: number, delta: number): boolean {
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

	private createDecoration(index: number): vscode.TextEditorDecorationType {
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
			text-shadow: 0px 0px 4px ${this.shadowColor};
			
			-webkit-text-stroke: 1px white;
			text-stroke: 1px white;
			font-size: ${this.fontSize}px;
			font-weight: bold;
			font-family: ${fontFamily}, Verdana;`;

		return vscode.window.createTextEditorDecorationType(
			<vscode.DecorationRenderOptions>{
				after: {
					contentText: this.text,
					textDecoration: style,
				},
				textDecoration: `none; position: relative; `,
				rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
			},
		);
	}
}

class Color {
	private r: number;
	private g: number;
	private b: number;

	constructor(r: number, g: number, b: number) {
		this.r = r;
		this.g = g;
		this.b = b;
	}

	public static randomSaturatedColor(): Color {
		var r = Math.floor(Math.random() * 255);
		var g = Math.floor(Math.random() * 255);
		var b = Math.floor(Math.random() * 255);

		if (r < g && r < b) {
			r = 0;
			if (g > b) g = 255;

		} else if (g < b && g < r) {
			g = 0;
			if (r > b) r = 255;
		} else {
			b = 0;
			if (r > g) r = 255;
		}

		return new Color(r, g, b);
	}

	public desaturated(f: number): Color {
		const l = 0.3 * this.r + 0.6 * this.g + 0.1 * this.b;
		const r = this.r + f * (l - this.r);
		const g = this.g + f * (l - this.g);
		const b = this.b + f * (l - this.b);
		return new Color(r, g, b);
	}

	public toHexCode(): string {
		const hr = Math.floor(this.r).toString(16).padStart(2, '0');
		const hg = Math.floor(this.g).toString(16).padStart(2, '0');
		const hb = Math.floor(this.b).toString(16).padStart(2, '0');
		return `#${hr}${hg}${hb}`;
	}
}


class CubicCurve {
	static readonly ease = new CubicCurve(0.25, 0.1, 0.25, 1.0);
	static readonly easeInBack = new CubicCurve(0.6, -0.28, 0.735, 0.045);

	private a: number;
	private b: number;
	private c: number;
	private d: number;
	private _cubicErrorBound: number = 0.001;

	constructor(a: number, b: number, c: number, d: number) {
		this.a = a;
		this.b = b;
		this.c = c;
		this.d = d;
	}

	public transform(t: number): number {
		if (t <= 0) return 0;
		if (t >= 1) return 1;
		return this.transformInternal(t);
	}

	private evaluateCubic(a: number, b: number, m: number): number {
		return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m;
	}

	private transformInternal(t: number): number {
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
			} else {
				end = midpoint;
			}
		}
	}
}