import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';

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

interface IComponent {
	name: string;
	parent: string;
	child: string[];
}

/**
 * Парсит файлы проекта в граф. 
 * @param rootPath корень проекта
 * @returns массив зависимостей IComponent
 */
function analyzeProject(rootPath: string) {
	const files = getFiles(rootPath);
	//основной массив компонетов
	const components: IComponent[] = [];
	// вспомогательный список компонентов для удаления лишних потомков
	const componentsListExport: string[] = [];
	const componentsList: string[] = [];

	const content = fs.readFileSync('d:\\clear_skill\\v0.2\\ride_project\\src\\pages\\app\\App.tsx', 'utf8');		
	const ast = parser.parse(content, {
		sourceType: 'module',
		plugins: ['jsx', 'typescript']
	});
	console.log('ast', ast);
	const identifiers: any = [];
	const imports: any = [];
	traverse(ast, {
		ImportDeclaration(path) {
			imports.push(path.node.specifiers.map(specifier => specifier.local.name));
		},
		JSXIdentifier(path) {
			if (imports.flat().includes(path.node.name)) {
				identifiers.push(path.node.name);
			}
		  }
	});
	console.log('imports', imports.flat());
	console.log('identifiers', identifiers);
	
	files.forEach(file => {
		const content = fs.readFileSync(file, 'utf8');		
		const ast = parser.parse(content, {
			sourceType: 'module',
			plugins: ['jsx', 'typescript']
		});


		traverse(ast, {
			// находим файлы с объявленным дефолтным экспортом
			ExportDefaultDeclaration(path) {

				if (Array.isArray(path.container)) {
					path.container.forEach((node: any) => { // типизировать**
						try {
							// экспорты в name и список компонентов
							if (node.type === 'ExportDefaultDeclaration' && node.declaration.type !== 'MemberExpression') { // 'MemberExpression' - export default slice.reducer;
								let nameComponentFromList = '';
								if (node.declaration.name) {
									nameComponentFromList = node.declaration.name;
								} else { // 'FunctionDeclaration'
									nameComponentFromList = node.declaration.id.name;
								}
								componentsListExport.push(nameComponentFromList);
							}
						} catch (error: any) {
							console.error(error.message);
						}
					});
				}
			},
		});
	});

	// traverse(ast, {
	// 	FunctionExpression(path) {
	// 		console.log('functionExpression', path);
	// 		// if (path.parentPath.isVariableDeclarator() && path.parentPath.node.id.type === 'Identifier' && path.parentPath.node.id.name) {
	// 		// }
	// 	},
	// });

	files.forEach(file => {
		const content = fs.readFileSync(file, 'utf8');
		const ast = parser.parse(content, {
			sourceType: 'module',
			plugins: ['jsx', 'typescript']
		});
		let currentFunctionName: string = '';
		traverse(ast, {
			JSXOpeningElement(path) {
				// const newComponent: IComponent = {
				// 	name: '',
				// 	parent: '',
				// 	child: []
				// };
				if (path.node.name.type === 'JSXIdentifier') {
					const componentName = path.node.name.name;
					if (componentsListExport.includes(componentName)) {
						// newComponent.name = componentName;
						// components.push(newComponent);
						// console.log('componentName', componentName);
					}
				}
			},
			FunctionDeclaration(path) {
				if (path.node.id) {
					currentFunctionName = path.node.id.name;
					path.traverse({
						JSXOpeningElement(innerPath) {
							if (innerPath.node.name.type === 'JSXIdentifier') {
								const componentName = innerPath.node.name.name;
								if (componentsListExport.includes(componentName)) {
									const newComponent: IComponent = {
										name: '',
										parent: '',
										child: []
									};
									newComponent.name = componentName;
									newComponent.parent = currentFunctionName;
									components.push(newComponent);
									console.log('currentFunctionName', currentFunctionName);
								}
							}
						},
					});
				}
			},
			CallExpression(path) {
				if (path.node.callee.type === 'Identifier') {
					const args = path.node.arguments;
					if (args.length > 0 && args[0].type === 'ArrayExpression') {
						args[0].elements.forEach(element => {
							if (element && element.type === 'ObjectExpression') {
								element.properties.forEach(prop => {
									if (prop.type === 'ObjectProperty' && prop.value.type === 'JSXElement' && prop.value.openingElement.name.type === 'JSXIdentifier') {
										const componentName = prop.value.openingElement.name.name;
										console.log('callExpresion', componentName);
									}
								});
							}
						});
					}
				}

				// if (path.node.callee.name === 'createBrowserRouter') {
				// 	const args = path.node.arguments;
				// 	if (args.length > 0 && args[0].type === 'ArrayExpression') {
				// 		args[0].elements.forEach(element => {
				// 			if (element.type === 'ObjectExpression') {
				// 				element.properties.forEach(prop => {
				// 					if (prop.key.name === 'element' && prop.value.type === 'JSXElement') {
				// 						const componentName = prop.value.openingElement.name.name;
				// 						components.add(componentName);
				// 					}
				// 				});
				// 			}
				// 		});
				// 	}
				// }
			},

			// проверяем использование элементов
			// JSXElement(path) {
			// 	if (Array.isArray(path.container)) {
			// 		// инициализируем новый компонент
			// 		const newComponent: IComponent = {
			// 			name: '',
			// 			parent: '',
			// 			child: []
			// 		};
			// 		path.container.forEach((node: any) => { // типизировать**
			// 			try {
			// 				// импорты в них будут добавлены в child
			// 				if (node.type === 'ImportDeclaration') {
			// 					if (node.specifiers.length !== 0) { // то-же Node, ошибка при иморте стилей. добавить цикл для деструктуризации**
			// 						// newComponent.child.push(node.specifiers[0].local.name);
			// 					}
			// 				}
			// 				// экспорты в name и список компонентов
			// 				if (node.openingElement) {
			// 					if (node.openingElement.name.type === 'JSXIdentifier') {
			// 						if (componentsListExport.includes(node.openingElement.name.name)) {
			// 							console.log('JSXIdentifier', node.openingElement.name.name);
			// 							newComponent.name = node.openingElement.name.name;
			// 							components.push(newComponent);
			// 						}
			// 					}
			// 				}
			// 				// if (node.type === 'ExportDefaultDeclaration' && node.declaration.type !== 'MemberExpression') { // 'MemberExpression' - export default slice.reducer;
			// 				// 	if (node.declaration.name) {
			// 				// 		newComponent.name = node.declaration.name;
			// 				// 	} else { // 'FunctionDeclaration'
			// 				// 		newComponent.name = node.declaration.id.name;
			// 				// 	}
			// 				// 	components.push(newComponent);
			// 				// }
			// 			} catch (error: any) {
			// 				console.error(error.message);
			// 			}
			// 		});
			// 	}
			// },
		});
	});
	console.log('componentsListExport', componentsListExport);
	console.log('componentsList', componentsList);
	console.log('components', components);

	const findChild = childSeparator(components, componentsList);
	const result = setParents(findChild);

	return result;
}

/**
 * Удаляет из импортов значения не соответствующие спииску компонентов
 * @param components основной массив компонетов
 * @param componentsList вспомогательный список компонентов
 * @returns отредактированный список компонентов
 */
function childSeparator(components: IComponent[], componentsList: string[]) {
	return components.map(component => {
		return {
			...component, child: component.child.filter(item => componentsList.includes(item))
		};
	});
}

/**
 * Назначает родителя согласно списка потомков
 * @param components основной массив компонетов
 * @returns отредактированный список компонентов
 */
function setParents(components: IComponent[]) {
	const nameToObject: { [key: string]: IComponent } = {};
	components.forEach(obj => {
		nameToObject[obj.name] = obj;
	});

	components.forEach(obj => {
		obj.child.forEach(childName => {
			if (nameToObject[childName]) {
				nameToObject[childName].parent = obj.name;
			}
		});
	});

	return components;
}

/**
 * Генерирует строку зависимостей для библиотеки mermaid
 * @param components основной массив компонетов
 * @returns строка в ввиде графа
 */
function generateMermaidGraph(components: IComponent[]) {
	let mermaidString = 'graph TD;\n';

	components.forEach(obj => {
		if (obj.parent) {
			mermaidString += `    ${obj.parent} --> ${obj.name};\n`;
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
