'use strict';

import * as vscode from 'vscode';

import { LayerProvider, LayerItem } from './codeLayers';

export function activate(context: vscode.ExtensionContext) {

	// Samples of `window.registerTreeDataProvider`
	const codeLayersProvider = new LayerProvider();
	vscode.window.registerTreeDataProvider('codeLayers', codeLayersProvider);
	vscode.commands.registerCommand('codeLayers.refreshEntry', () => codeLayersProvider.refresh());
	vscode.commands.registerCommand('extension.selectLayer', moduleName => vscode.window.showInformationMessage(`${moduleName} is selected.`));

	vscode.commands.registerCommand('codeLayers.addEntry', () => {
		codeLayersProvider.addNewLayer();
	});


	vscode.commands.registerCommand('codeLayers.editEntry', (node: LayerItem) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
	vscode.commands.registerCommand('codeLayers.deleteEntry', (node: LayerItem) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));
}
