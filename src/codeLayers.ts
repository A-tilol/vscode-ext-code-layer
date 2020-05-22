import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

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
