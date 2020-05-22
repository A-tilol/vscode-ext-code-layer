import * as vscode from 'vscode';
import * as path from 'path';

export class LayerProvider implements vscode.TreeDataProvider<LayerItem> {

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

	private getLayers(): LayerItem[] {
		return [
			new LayerItem("base layer", vscode.TreeItemCollapsibleState.None, {
				command: 'extension.selectLayer',
				title: "",
				arguments: ["base layer arg"]
			}),
			new LayerItem("debug layer", vscode.TreeItemCollapsibleState.None, {
				command: 'extension.selectLayer',
				title: "",
				arguments: ["debug layer arg"]
			})
		];
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
