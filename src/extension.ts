'use strict';

import * as vscode from 'vscode';

import { LayerProvider, LayerItem, colorDiff, hideNewLayer, exposeNewLayer } from './codeLayers';

export function activate(context: vscode.ExtensionContext) {

	// Samples of `window.registerTreeDataProvider`
	const codeLayersProvider = new LayerProvider();
	vscode.window.registerTreeDataProvider('codeLayers', codeLayersProvider);

	// refresh a layer tree view
	vscode.commands.registerCommand('codeLayers.refreshEntry', () => codeLayersProvider.refresh());

	// when a layer item on a view is selected
	vscode.commands.registerCommand('extension.selectLayer', moduleName => {
		hideNewLayer();
		vscode.window.showInformationMessage(`${moduleName} is selected.`);
	});

	vscode.commands.registerCommand('codeLayers.addEntry', () => {
		codeLayersProvider.addNewLayer();
	});


	vscode.commands.registerCommand('codeLayers.editEntry', (node: LayerItem) => {
		exposeNewLayer();
		vscode.window.showInformationMessage(`enable layer ${node.label}.`);
	});


	vscode.commands.registerCommand('codeLayers.deleteEntry', (node: LayerItem) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));

	// when modifying the document
	vscode.workspace.onDidSaveTextDocument(() => {
		colorDiff();
	}, null, context.subscriptions);

	vscode.window.onDidChangeActiveTextEditor(() => {
		console.log("onDidChangeActiveTextEditor");
		codeLayersProvider.restore();
	});
}
