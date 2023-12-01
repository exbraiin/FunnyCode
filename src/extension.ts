import * as vscode from 'vscode';
import { ColorUtils } from './utils/color';
import { CubicCurve } from './utils/cubic_curve';

var enabled: boolean = false;
var timeout: NodeJS.Timeout | null;
var textOvers: TextOver[] = [];
var fontFamily: string = 'Verdana';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	function isFunnyCodeEnabled(): boolean {
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

	function onFunnyCodeEnabledChanged(event: vscode.ConfigurationChangeEvent) {
		if (!event.affectsConfiguration("funnycode.enabled")) return;
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

// This method is called when your extension is deactivated
export function deactivate() {
	const c = new vscode.Color(1, 1, 1, 1);
	clearTimeout();
}

function startTimeout() {
	if (timeout) return;
	timeout = setInterval(() => {
		textOvers = textOvers.filter((e, i) => e.update(i, 30));
		if (textOvers.length == 0) clearTimeout();
	}, 30);
}

function clearTimeout(): void {
	if (!timeout) return;
	clearInterval(timeout);
	timeout = null;
}

function textToRender(text: string, editor: vscode.TextEditor) {
	if (text === '') return 'DELETE';
	if (text === ' ') return 'SPACE';
	if (text.includes('\n')) return 'ENTER';
	const tabSize = editor.options.tabSize;
	const tabSpace = editor.options.insertSpaces ?? false;
	const spaces = !tabSize ? 0 : parseInt(tabSize.toString());
	const tabs = (tabSpace ? ' ' : '\t').repeat(spaces);
	if (text === tabs) return 'TAB';
	if (text.length > 2) return 'CTRL+V';
	return text.toUpperCase();
}

function onTextChanged(e: vscode.TextDocumentChangeEvent): void {
	if (!enabled) return;
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	if (e.contentChanges.length == 0) return;
	const text = e.contentChanges[0].text;
	const cursor = editor.selection.active;
	if (!cursor) return;



	const data = textToRender(text, editor);
	const over = text === '' ? 0 : 1;
	const pos = new vscode.Position(cursor.line, cursor.character + over);
	textOvers.push(new TextOver(editor, pos, data));
	startTimeout();
}

class TextOver {
	private readonly totalTimeMs = 400;
	private text: string;
	private textColor: string;
	private shadowColor: string;
	private strokeColor: string;
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
		this.moveDirY = (Math.random() / 2 + 0.5) * -5;
		const rColor = ColorUtils.saturated(ColorUtils.random());
		this.textColor = ColorUtils.toHexCode(ColorUtils.desaturated(rColor, 0.6));
		this.shadowColor = ColorUtils.toHexCode(rColor);
		this.strokeColor = "white";
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

			color: ${this.textColor};
			text-align: center;
			text-shadow: 0px 0px 4px ${this.shadowColor};
			
			-webkit-text-stroke: 1px ${this.strokeColor};
			text-stroke: 1px ${this.strokeColor};
			font-size: ${this.fontSize}px;
			font-weight: bold;
			font-family: ${fontFamily}, Verdana;`;

		return vscode.window.createTextEditorDecorationType(
			<vscode.DecorationRenderOptions>{
				before: {
					contentText: this.text,
					textDecoration: style,
				},
			},
		);
	}

	private randomColor(): vscode.Color {
		return ColorUtils.saturated(ColorUtils.random());
	}
}
