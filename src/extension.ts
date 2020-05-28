'use strict';

import * as vscode from 'vscode';

import { LayerProvider, LayerItem, Utils } from './codeLayers';

export function activate(context: vscode.ExtensionContext) {
	let disposable: vscode.Disposable;
	const codeLayersProvider = new LayerProvider();
	vscode.window.registerTreeDataProvider('codeLayers', codeLayersProvider);

	context.subscriptions.push(vscode.commands.registerCommand('codeLayers.addEntry', () => {
		codeLayersProvider.addLayer();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codeLayers.mergeEntry', () => {
		codeLayersProvider.mergeLayer();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codeLayers.deleteEntry', () => {
		codeLayersProvider.deleteLayer();
	}));

	// when a layer item on a view is selected
	context.subscriptions.push(vscode.commands.registerCommand('extension.selectLayer', () => {
		codeLayersProvider.toggleLayerVisibility();
	}));

	// refresh a layer tree view
	context.subscriptions.push(vscode.commands.registerCommand('codeLayers.refreshEntry', () => {
		codeLayersProvider.refresh();
	}));

	vscode.workspace.onDidSaveTextDocument(() => {
		if (codeLayersProvider.getLayers()[0].isVisible) {
			Utils.colorDiff();
		}
	}, null, context.subscriptions);

	vscode.window.onDidChangeActiveTextEditor(() => {
		codeLayersProvider.restoreLayer();
	}, null, context.subscriptions);
}
