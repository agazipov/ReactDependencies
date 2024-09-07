import { Analyzer } from "./analyzer";
import * as vscode from 'vscode';

export class Diagram extends Analyzer {
    private mermaidString: string = 'graph TD;\n';

    constructor(rootPath: string) {
        super(rootPath);
        this.analyzeProject();
        this.generateMermaidGraph();
    }

    /**
    * Генерирует строку зависимостей для библиотеки mermaid
    * @returns строка в ввиде графа
    */
    private generateMermaidGraph() {
        this.tree.forEach(node => {
            if (node.parentRef) {
                this.mermaidString += `    ${node.parentRef} --> ${node.id}[${node.name}];\n`;
            }
        });
    }

    /**
     * Представление webview для vcsoda. Рисует зависимости.
     * @param diagram строка в ввиде графа
     */
    showMermaidDiagram() {
        const panel = vscode.window.createWebviewPanel(
            'reactGrafDep',
            'ReactGrafDependencies',
            vscode.ViewColumn.One,
            {
                enableScripts: true, // Enable scripts in the Webview
            }
        );

        panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dependency Graph</title>
            <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
            <script>
                window.addEventListener('load', () => {
                    mermaid.initialize({ startOnLoad: true });
                    mermaid.contentLoaded();
                });
            </script>
        </head>
        <body>
            <div class="mermaid">
                ${this.mermaidString}
            </div>
        </body>
        </html>
    `;
    }
}