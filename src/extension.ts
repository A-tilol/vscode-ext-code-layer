'use strict';

import * as vscode from 'vscode';

import { LayerProvider, LayerItem, Utils } from './codeLayers';

export function activate(context: vscode.ExtensionContext) {

	const codeLayersProvider = new LayerProvider();
	vscode.window.registerTreeDataProvider('codeLayers', codeLayersProvider);

	// refresh a layer tree view
	vscode.commands.registerCommand('codeLayers.refreshEntry', () => codeLayersProvider.refresh());

	// when a layer item on a view is selected
	vscode.commands.registerCommand('extension.selectLayer', (layerItem: LayerItem) => {
		console.log(layerItem);
		codeLayersProvider.toggleLayerVisibility();
		vscode.window.showInformationMessage(`${layerItem.label} is selected.`);
	});

	vscode.commands.registerCommand('codeLayers.addEntry', () => {
		codeLayersProvider.addLayer();
	});

	vscode.commands.registerCommand('codeLayers.deleteEntry', (node: LayerItem) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));

	vscode.workspace.onDidSaveTextDocument(() => {
		if (codeLayersProvider.getLayers()[0].isVisible) {
			Utils.colorDiff();
		}
	}, null, context.subscriptions);

	vscode.window.onDidChangeActiveTextEditor(() => {
		console.log("onDidChangeActiveTextEditor");
		codeLayersProvider.restore();
	});
}
