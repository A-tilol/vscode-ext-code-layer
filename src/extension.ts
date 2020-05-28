'use strict';

import * as vscode from 'vscode';

import { LayerProvider, LayerItem, Utils } from './codeLayers';

export function activate(context: vscode.ExtensionContext) {

	const codeLayersProvider = new LayerProvider();
	vscode.window.registerTreeDataProvider('codeLayers', codeLayersProvider);

	vscode.commands.registerCommand('codeLayers.addEntry', () => {
		codeLayersProvider.addLayer();
	});

	vscode.commands.registerCommand('codeLayers.mergeEntry', () => {
		codeLayersProvider.mergeLayer();
	});

	vscode.commands.registerCommand('codeLayers.deleteEntry', (layer: LayerItem) => {
		codeLayersProvider.deleteLayer();
	});

	// when a layer item on a view is selected
	vscode.commands.registerCommand('extension.selectLayer', () => {
		codeLayersProvider.toggleLayerVisibility();
	});

	// refresh a layer tree view
	vscode.commands.registerCommand('codeLayers.refreshEntry', () => codeLayersProvider.refresh());

	vscode.workspace.onDidSaveTextDocument(() => {
		if (codeLayersProvider.getLayers()[0].isVisible) {
			Utils.colorDiff();
		}
	}, null, context.subscriptions);

	vscode.window.onDidChangeActiveTextEditor(() => {
		codeLayersProvider.restoreLayer();
	}, null, context.subscriptions);
}
