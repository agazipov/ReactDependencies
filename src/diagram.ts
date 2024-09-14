import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Analyzer } from './analyzer';

interface vscodeApi {
    postMessage(message: any): void;
}

declare const vscodeApi: vscodeApi;

export class Diagram {
    private rootPath: string;
    private context: vscode.ExtensionContext;

    constructor(rootPath: string, context: vscode.ExtensionContext) {
        this.rootPath = rootPath;
        this.context = context;
    }

    /**
     * Представление webview для vcsoda. Рисует зависимости.
     * @param diagram строка в ввиде графа
     */
    webView() {
        const panel = vscode.window.createWebviewPanel(
            'reactGrafDep',
            'ReactGrafDependencies',
            vscode.ViewColumn.One,
            {
                enableScripts: true, // Enable scripts in the Webview
            }
        );

        panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'readDirectory':
                        const files = await this.readDirectory();
                        panel.webview.postMessage({ command: 'directoryContent', files });
                        return;
                }
            },
            undefined,
            this.context.subscriptions
        );

        const scriptPathOnDisk = vscode.Uri.file(path.join(__dirname, 'control/', 'init.js'));
        const scriptUri = panel.webview.asWebviewUri(scriptPathOnDisk);

        panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dependency Graph</title>
            <style>
                .zoom-buttons {
                    position: fixed;
                    margin-bottom: 10px;
                    bottom: 10px;
                    right: 10px;
                    z-index: 100;
                }
                .zoom-buttons button {
                    margin-right: 5px;
                }
                .diagram {
                    display: none;
                }
            </style>
            <script>
                const vscode = acquireVsCodeApi();
                window.onload = function() {
                    vscode.postMessage({ command: 'get-data' });
                    console.log('Ready to accept data.');
                };
            </script>
            <script src="${scriptUri}"></script>
        </head>
        <body>
            <div class="settings">
                <button id="initButton">Init</button>
            </div>
            <div class="diagram">
                <div class="zoom-buttons">
                    <button id="zoomInButton">Zoom In</button>
                    <button id="zoomOutButton">Zoom Out</button>
                </div>
                <div class="mermaid">
                </div>
            </div>
        </body>
        </html>
    `;
    }

    async readDirectory(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            try {
                const analizeApp = new Analyzer(this.rootPath);
                const mermaidString = analizeApp.result;
                resolve(mermaidString);
            } catch (error) {
                reject(error);
            }
        });
    }
}