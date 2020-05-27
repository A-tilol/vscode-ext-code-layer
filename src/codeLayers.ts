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

	addLayer() {
		Utils.createLayerFile();

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
		if (!fs.existsSync(Utils.getLayerFilePath())) {
			this.refresh();
			return;
		}

		const layerJson = JSON.parse(fs.readFileSync(Utils.getLayerFilePath(), "utf-8"));
		const layer = new LayerItem(LAYER1, layerJson.isVisible);
		layer.command = {
			command: 'extension.selectLayer',
			title: "selectLayerTitle",
			arguments: [layer]
		};
		this.items = [layer];

		this.refresh();

		if (layerJson.isVisible) {
			Utils.colorDiff();
		}
	}

	toggleLayerVisibility() {
		// TODO: if provide multiple layers, search for a items by a item lambel.
		const isVisible = this.items[0].isVisible;
		if (isVisible) {
			Utils.hideLayer();
		} else {
			Utils.exposeLayer();
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

export class Utils {

	public static getLayerDirPath(): string {
		let curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
		if (curFilePath === undefined) {
			console.log("Failed to get a fsPath.");
			return "";
		}
		return path.join(path.dirname(curFilePath), ".layer");
	}

	public static getLayerFilePath(): string {
		let curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
		if (curFilePath === undefined) {
			console.log("Failed to get a fsPath.");
			return "";
		}
		const layerFileName = `${path.basename(curFilePath)}.${LAYER_FILE_NAME}`;
		return path.join(Utils.getLayerDirPath(), layerFileName);
	}

	public static colorDiff() {
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
					'backgroundColor': 'rgba(200, 220, 240, 0.1)',
					'borderColor': 'rgba(200, 220, 240, 0.4)',
				},
				'dark': {
					'backgroundColor': 'rgba(117, 141, 203, 0.1)',
					'borderColor': 'rgba(117, 141, 203, 0.4)',
				}
			})
		};

		const text = vscode.window.activeTextEditor?.document.getText();
		// TODO: set a character encoding of a target file
		let layerJson = JSON.parse(fs.readFileSync(Utils.getLayerFilePath(), "utf-8"));
		layerJson.layer1 = text;
		fs.writeFileSync(Utils.getLayerFilePath(), JSON.stringify(layerJson, null, 2));

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

	public static createLayerFile() {
		let curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
		if (curFilePath === undefined) {
			console.log("Failed to get a fsPath.");
			return;
		}

		const layerDir = Utils.getLayerDirPath();
		if (!fs.existsSync(layerDir)) {
			fs.mkdirSync(layerDir);
		}

		const text = vscode.window.activeTextEditor?.document.getText();
		let layerJson = {
			"layer0": text,
			"layer1": text,
			"isVisible": true
		};

		const layerFilePath = Utils.getLayerFilePath();
		fs.writeFileSync(layerFilePath, JSON.stringify(layerJson, null, 2));
	}

	public static hideLayer() {
		const curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
		if (curFilePath === undefined) {
			console.log("Failed to get a fsPath.");
			return;
		}
		let layerJson = JSON.parse(fs.readFileSync(Utils.getLayerFilePath(), "utf-8"));
		fs.writeFileSync(curFilePath, layerJson.layer0);

		layerJson.isVisible = false;
		fs.writeFileSync(Utils.getLayerFilePath(), JSON.stringify(layerJson, null, 2));

		if (decLines !== undefined) {
			decLines.decorator.dispose();
		}
	}

	public static exposeLayer() {
		const text = vscode.window.activeTextEditor?.document.getText();
		let layerJson = JSON.parse(fs.readFileSync(Utils.getLayerFilePath(), "utf-8"));
		layerJson.layer0 = text;
		layerJson.isVisible = true;
		fs.writeFileSync(Utils.getLayerFilePath(), JSON.stringify(layerJson, null, 2));

		const curFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
		if (curFilePath === undefined) {
			console.log("Failed to get a fsPath.");
			return;
		}
		fs.writeFileSync(curFilePath, layerJson.layer1);

		setTimeout(Utils.colorDiff, 200);
	}
}

class DecLines {
	ranges: vscode.Range[] = [];
	decorator: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
}
let decLines: DecLines;
