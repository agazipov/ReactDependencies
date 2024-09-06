import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';

interface IFileIsExport {
	path: string;
	name: string;
}

interface IComponentAsNode {
	name: string;
	child: string[];
}

interface IComponentsList { [key: string]: IComponentAsNode }

interface INode {
	parentRef: string;
	name: string;
	id: string;
}

/**
 * Получает файлы из директории проекта
 * @param dir корень проекта
 * @param files_ список файлов проекта
 * @returns список файлов проекта
 */
function getFiles(dir: string, files_: string[] = []): string[] {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const name = path.join(dir, file);
		if (fs.statSync(name).isDirectory()) {
			getFiles(name, files_);
		} else {
			const ext = path.extname(name);
			if (ext === '.js' || ext === '.jsx' || ext === '.ts' || ext === '.tsx') {
				files_.push(name);
			}
		}
	}
	return files_;
}

function isReactComponent(path: NodePath) {
	let hasJSX = false;
	path.traverse({
		JSXElement() {
			hasJSX = true;
		}
	});
	return hasJSX;
}

function generateId(length: number = 8): string {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}

/**
 * Парсит файлы проекта в дерево.
 * В первом цикле проходится по файлам и находит компоненты по дефолтным экспортам.
 * Во втором цикле в этих фалах сравнивает импорты с вхождение jsx и результат добавляет как узел дерева.
 * Проходит рекурсивно от начального элемента и возвращает массив зависимостей для постороения дерева. 
 * @param rootPath корень проекта
 * @returns массив зависимостей IComponentAsNode
 */
function analyzeProject(rootPath: string) {
	const files = getFiles(rootPath);

	const filesIsExport: IFileIsExport[] = []; // список файлов как компонентов
	const componentsList: IComponentsList = {}; // список компонентов как узлы дерева

	files.forEach(file => {
		const content = fs.readFileSync(file, 'utf8'); // 'd:\\clear_skill\\v0.2\\ride_project\\src\\pages\\app\\App.tsx'
		const ast = parser.parse(content, {
			sourceType: 'module',
			plugins: ['jsx', 'typescript']
		});
		traverse(ast, {
			ExportDefaultDeclaration(path) {
				const declaration = path.node.declaration;
				let exportName;

				if (declaration.type === 'Identifier') {
					exportName = declaration.name;
				} else if (declaration.type === 'FunctionDeclaration') {
					exportName = declaration.id?.name;
					if (isReactComponent(path)) {
						if (exportName) {
							filesIsExport.push({ path: file, name: exportName });
						}
					}
				}
				//  else if (declaration.type === 'ClassDeclaration') {
				// 	exportName = declaration.id?.name;
				// 	if (isReactComponent(path)) {
				// 		filesIsExport.push(exportName);
				// 	}
				// } else if (declaration.type === 'ArrowFunctionExpression' || declaration.type === 'FunctionExpression') {
				// 	exportName = path.parentPath.parentPath?.node.id ? path.parentPath.parentPath.node.id.name : 'anonymous';
				// 	if (isReactComponent(path)) {
				// 		fileList.push(exportName);
				// 	}
				// }
			},
		});
	});

	filesIsExport.forEach(file => {
		const imports: string[] = []; // список импортов в файле
		const childList: string[] = []; // список компонентов которые возвращаются в компоненте

		const content = fs.readFileSync(file.path, 'utf8'); // 'd:\\clear_skill\\v0.2\\ride_project\\src\\pages\\app\\App.tsx'
		const ast = parser.parse(content, {
			sourceType: 'module',
			plugins: ['jsx', 'typescript']
		});

		traverse(ast, {
			ImportDeclaration(path) { // получаю список импортов	
				for (let index = 0; index < path.node.specifiers.length; index++) {
					if (filesIsExport.some(component => component.name === path.node.specifiers[index].local.name)) { // проверка что компонент существует
						imports.push(path.node.specifiers[index].local.name);
					}
				}
			},

			JSXIdentifier(path) { // сравниваю импорты с вхождением jsx и добавляю их как детей компонента
				// console.log(`import file: ${file.match(/[^\\]*$/)}`, imports);
				if (imports.includes(path.node.name)) {
					childList.push(path.node.name);
				}
			}
		});

		const node: IComponentAsNode = { name: file.name, child: childList };
		componentsList[file.name] = node;
	});

	const tree = generateTree(componentsList);
	console.log('tree', tree);

	return tree;
}

function generateTree(components: IComponentsList) {
	const tree: INode[] = [];
	const app: IComponentAsNode = components['App'];

	function recursion(component: IComponentAsNode, parentID: string = 'App') {
		if (component.child.length === 0) {
			return;
		}
		component.child.forEach(child => {
			let id = generateId();
			tree.push({ parentRef: parentID, name: child, id: id });
			recursion(components[child], id);
		});
	}

	recursion(app);
	return tree;
}

/**
 * Генерирует строку зависимостей для библиотеки mermaid
 * @param components основной массив компонетов
 * @returns строка в ввиде графа
 */
function generateMermaidGraph(components: INode[]) {
	let mermaidString = 'graph TD;\n';

	components.forEach(obj => {
		if (obj.parentRef) {
			mermaidString += `    ${obj.parentRef} --> ${obj.id}[${obj.name}];\n`;
		}
	});

	return mermaidString;
}

/**
 * Представление webview для vcsoda. Рисует зависимости.
 * @param diagram строка в ввиде графа
 */
function showMermaidDiagram(diagram: string) {
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
                ${diagram}
            </div>
        </body>
        </html>
    `;
}

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "ReactGrafDependencies" is now active!');

	const disposable = vscode.commands.registerCommand('react-graf.reactGrafDep', () => {
		const rootPath = vscode.workspace.rootPath;
		if (rootPath) {
			const srcPath = path.join(rootPath, 'src');
			const dependencies = analyzeProject(srcPath);
			// vscode.window.showInformationMessage(`dependencies ${rootPath2}`);
			const diagram = generateMermaidGraph(dependencies);
			showMermaidDiagram(diagram);
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
