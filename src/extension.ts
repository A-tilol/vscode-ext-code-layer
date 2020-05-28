'use strict';

import * as vscode from 'vscode';

import { LayerProvider, LayerItem, Utils } from './codeLayers';

export function activate(context: vscode.ExtensionContext) {
	let disposable: vscode.Disposable;
	const codeLayersProvider = new LayerProvider();
	vscode.window.registerTreeDataProvider('codeLayers', codeLayersProvider);

	context.subscriptions.push(vscode.commands.registerCommand('codeLayers.addLayer', () => {
		vscode.window.activeTextEditor?.document.save().then(() => {
			codeLayersProvider.addLayer();
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codeLayers.mergeLayer', () => {
		vscode.window.activeTextEditor?.document.save().then(() => {
			codeLayersProvider.mergeLayer();
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codeLayers.deleteLayer', () => {
		vscode.window.activeTextEditor?.document.save().then(() => {
			codeLayersProvider.deleteLayer();
		});
	}));

	// when a layer item on a view is selected
	context.subscriptions.push(vscode.commands.registerCommand('codeLayers.toggleLayerVisibility', () => {
		vscode.window.activeTextEditor?.document.save().then(() => {
			codeLayersProvider.toggleLayerVisibility();
		});
	}));

	// refresh a layer tree view
	context.subscriptions.push(vscode.commands.registerCommand('codeLayers.refreshLayer', () => {
		vscode.window.activeTextEditor?.document.save().then(() => {
			codeLayersProvider.refresh();
		});
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
