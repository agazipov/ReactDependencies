import * as vscode from 'vscode';
import * as path from 'path';
import { Diagram } from './diagram';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "ReactGrafDependencies" is now active!');

	const disposable = vscode.commands.registerCommand('react-graf.reactGrafDep', () => {
		const rootPath = vscode.workspace.rootPath;
		if (rootPath) {
			const srcPath = path.join(rootPath, 'src');
			const diagram = new Diagram(srcPath, context);
			diagram.webView();
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
