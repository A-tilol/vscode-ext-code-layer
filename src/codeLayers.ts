import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as Diff from 'diff';

const LAYER1 = "layer1";
const LAYER_FILE_NAME = "layer";

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

	getLayers(): LayerItem[] {
		return this.items;
	}

	createLayerFile() {
		let curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
		if (curFilePath === undefined) {
			console.log("Failed to get a fsPath.");
			return;
		}

		const layerDir = getLayerDirPath();
		if (!fs.existsSync(layerDir)) {
			fs.mkdirSync(layerDir);
		}

		const text = vscode.window.activeTextEditor?.document.getText();
		let layerJson = {
			"layer0": text,
			"layer1": text,
			"isVisible": true
		};

		const layerFilePath = getLayerFilePath();
		fs.writeFileSync(layerFilePath, JSON.stringify(layerJson, null, 2));
	}

	addNewLayer() {
		this.createLayerFile();

		const layer = new LayerItem(LAYER1);
		layer.command = {
			command: 'extension.selectLayer',
			title: "selectLayerTitle",
			arguments: [layer]
		};
		this.items.push(layer);
		this.refresh();
	}

	restore() {
		if (!fs.existsSync(getLayerFilePath())) {
			this.refresh();
			return;
		}

		const layerJson = JSON.parse(fs.readFileSync(getLayerFilePath(), "utf-8"));
		const layer = new LayerItem(LAYER1, layerJson.isVisible);
		layer.command = {
			command: 'extension.selectLayer',
			title: "selectLayerTitle",
			arguments: [layer]
		};
		this.items = [layer];

		this.refresh();

		if (layerJson.isVisible) {
			colorDiff();
		}
	}

	toggleLayerVisibility() {
		// TODO: if provide multiple layers, search for a items by a item lambel.
		const isVisible = this.items[0].isVisible;
		if (isVisible) {
			hideNewLayer();
		} else {
			exposeNewLayer();
		}

		this.items[0].setIcon(!isVisible);
		this.items[0].isVisible = !isVisible;

		this.refresh();
	}

}

export class LayerItem extends vscode.TreeItem {
	contextValue = 'codelayer';

	constructor(
		public readonly label: string,
		public isVisible: boolean = true,
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.setIcon(isVisible);
	}

	get tooltip(): string {
		return `${this.label}`;
	}

	get description(): string {
		return "";
	}

	setIcon(isVisible: boolean) {
		let icon = 'visibility.svg';
		if (!isVisible) {
			icon = 'visibility_off.svg';
		}

		this.iconPath = {
			light: path.join(__filename, '..', '..', 'resources', 'light', icon),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', icon)
		};
	}
}


function getLayerDirPath(): string {
	let curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
	if (curFilePath === undefined) {
		console.log("Failed to get a fsPath.");
		return "";
	}
	return path.join(path.dirname(curFilePath), ".layer");
}

function getLayerFilePath(): string {
	let curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
	if (curFilePath === undefined) {
		console.log("Failed to get a fsPath.");
		return "";
	}
	const layerFileName = `${path.basename(curFilePath)}.${LAYER_FILE_NAME}`;
	return path.join(getLayerDirPath(), layerFileName);
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

	const text = vscode.window.activeTextEditor?.document.getText();
	// TODO: set a character encoding of a target file
	let layerJson = JSON.parse(fs.readFileSync(getLayerFilePath(), "utf-8"));
	layerJson.layer1 = text;
	fs.writeFileSync(getLayerFilePath(), JSON.stringify(layerJson, null, 2));

	const diff = Diff.diffLines(layerJson.layer0, layerJson.layer1);
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

	vscode.window.activeTextEditor?.setDecorations(decLines.decorator, decLines.ranges);
}

function hideNewLayer() {
	const curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
	if (curFilePath === undefined) {
		console.log("Failed to get a fsPath.");
		return;
	}
	let layerJson = JSON.parse(fs.readFileSync(getLayerFilePath(), "utf-8"));
	fs.writeFileSync(curFilePath, layerJson.layer0);

	layerJson.isVisible = false;
	fs.writeFileSync(getLayerFilePath(), JSON.stringify(layerJson, null, 2));

	if (decLines !== undefined) {
		decLines.decorator.dispose();
	}
}

function exposeNewLayer() {
	const text = vscode.window.activeTextEditor?.document.getText();
	let layerJson = JSON.parse(fs.readFileSync(getLayerFilePath(), "utf-8"));
	layerJson.layer0 = text;
	layerJson.isVisible = true;
	fs.writeFileSync(getLayerFilePath(), JSON.stringify(layerJson, null, 2));

	const curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
	if (curFilePath === undefined) {
		console.log("Failed to get a fsPath.");
		return;
	}
	fs.writeFileSync(curFilePath, layerJson.layer1);

	setTimeout(colorDiff, 200);
}