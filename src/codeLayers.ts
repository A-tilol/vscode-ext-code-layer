import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as Diff from 'diff';

export class LayerProvider implements vscode.TreeDataProvider<LayerItem> {

	private items: LayerItem[] = [];

	private _onDidChangeTreeData: vscode.EventEmitter<LayerItem | undefined> = new vscode.EventEmitter<LayerItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<LayerItem | undefined> = this._onDidChangeTreeData.event;

	constructor() {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: LayerItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: LayerItem): Thenable<LayerItem[]> {
		return Promise.resolve(this.getLayers());
	}

	createBaseLayerFile() {
		let curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
		if (curFilePath === undefined) {
			console.log("Failed to get a fsPath.");
			return;
		}
		console.log("curpath", curFilePath);

		const curDir = path.dirname(curFilePath);
		console.log("curDir:", curDir);

		const layerDir = path.join(curDir, ".layer");
		console.log("layerDir:", layerDir);

		if (!fs.existsSync(layerDir)) {
			fs.mkdirSync(layerDir);
			console.log("create a dir");
		}

		const layerFilePath = path.join(layerDir, "base.txt");

		fs.copyFileSync(curFilePath, layerFilePath);
	}

	createNewLayerFile() {
		let curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
		if (curFilePath === undefined) {
			console.log("Failed to get a fsPath.");
			return;
		}
		console.log("curpath", curFilePath);

		const curDir = path.dirname(curFilePath);
		console.log("curDir:", curDir);

		const layerDir = path.join(curDir, ".layer");
		console.log("layerDir:", layerDir);

		if (!fs.existsSync(layerDir)) {
			fs.mkdirSync(layerDir);
			console.log("create a dir");
		}

		const layerFilePath = path.join(layerDir, "new.txt");

		fs.copyFileSync(curFilePath, layerFilePath);
	}

	addNewLayer() {
		this.createBaseLayerFile();
		this.createNewLayerFile();

		const layer = new LayerItem("new layer", vscode.TreeItemCollapsibleState.None, {
			command: 'extension.selectLayer',
			title: "",
			arguments: ["new layer arg"]
		});
		this.items.push(layer);
		this.refresh();
	}

	private getLayers(): LayerItem[] {
		return this.items;
	}
}

export class LayerItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return `${this.label}`;
	}

	get description(): string {
		return "description";
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'codelayer';
}

// let decorator: vscode.TextEditorDecorationType;
class DecLines {
	ranges: vscode.Range[] = [];
	decorator: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
}
let decLines: DecLines;

export function colorDiff() {
	if (decLines !== undefined) {
		decLines.decorator.dispose();
	}

	decLines = {
		ranges: [],
		decorator: vscode.window.createTextEditorDecorationType({
			'isWholeLine': true,
			'borderWidth': '1px',
			'borderRadius': '2px',
			'borderStyle': 'solid',
			'light': {
				'backgroundColor': 'rgba(58, 70, 101, 0.3)',
				'borderColor': 'rgba(58, 70, 101, 0.4)',
			},
			'dark': {
				'backgroundColor': 'rgba(117, 141, 203, 0.3)',
				'borderColor': 'rgba(117, 141, 203, 0.4)',
			}
		})
	};

	let curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
	if (curFilePath === undefined) {
		console.log("Failed to get a fsPath.");
		return;
	}
	const curDir = path.dirname(curFilePath);
	const layerDir = path.join(curDir, ".layer");

	const baseLayerPath = path.join(layerDir, "base.txt");
	const newLayerPath = path.join(layerDir, "new.txt");

	fs.copyFileSync(curFilePath, newLayerPath);

	// TODO: set a character encoding of a target file
	const baseLayer = fs.readFileSync(baseLayerPath, "utf-8");
	const curFile = fs.readFileSync(curFilePath, "utf-8");

	const diff = Diff.diffLines(baseLayer, curFile);
	console.log(diff);
	let startLine = 0;
	diff.forEach(part => {
		if (part.count === undefined) {
			return;
		}
		if (part.removed) {
			return;
		}
		if (!part.added) {
			startLine += part.count;
			return;
		}
		const endLine = startLine + part.count - 1;
		const range = new vscode.Range(new vscode.Position(startLine, 0), new vscode.Position(endLine, 0));
		decLines.ranges.push(range);

		startLine = endLine + 1;
	});

	const editor = vscode.window.activeTextEditor;
	if (editor === undefined) { return; }

	editor.setDecorations(decLines.decorator, decLines.ranges);
}

export function hideNewLayer() {
	let curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
	if (curFilePath === undefined) {
		console.log("Failed to get a fsPath.");
		return;
	}
	const curDir = path.dirname(curFilePath);
	const layerDir = path.join(curDir, ".layer");

	const baseLayerPath = path.join(layerDir, "base.txt");

	fs.copyFileSync(baseLayerPath, curFilePath);

	if (decLines !== undefined) {
		decLines.decorator.dispose();
	}
}

export function exposeNewLayer() {
	let curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
	if (curFilePath === undefined) {
		console.log("Failed to get a fsPath.");
		return;
	}
	const curDir = path.dirname(curFilePath);
	const layerDir = path.join(curDir, ".layer");
	const newLayerPath = path.join(layerDir, "new.txt");
	const newLayer = fs.readFileSync(newLayerPath, "utf-8");
	fs.writeFileSync(curFilePath, newLayer);
	setTimeout(colorDiff, 100);
}