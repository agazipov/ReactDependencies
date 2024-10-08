import * as fs from 'fs';
import * as path from 'path';
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import { IComponentAsNode, IComponentsList, IFileIsExport, IFileAsReactComponent, INode } from "./types/types";

export class Analyzer {
    private rootPath: string;

    private astCache: { [key: string]: any } = {};
    private contentCache: { [key: string]: string } = {};

    private pathsToFiles: string[] = [];
    private filesAsReactComponent: IFileAsReactComponent = {}; // список файлов как компонентов
    private componentsList: IComponentsList = {}; // список компонентов как узлы дерева

    private characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    private tree: INode[] = [];
    private mermaidString: string = 'graph TD;\n';
    result: string[] = [];

    constructor(rootPath: string) {
        this.rootPath = rootPath;
        this.getFiles(this.rootPath);
        this.analyzeProject();
        this.generateMermaidGraph();
    }

    private getFiles(dir: string) {
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const name = path.join(dir, file);
                if (fs.statSync(name).isDirectory()) {
                    this.getFiles(name);
                } else {
                    const ext = path.extname(name);
                    if (ext === '.js' || ext === '.jsx' || ext === '.ts' || ext === '.tsx') {
                        this.pathsToFiles.push(name);
                    }
                }
            }
        } catch (error) {
            console.error(`Error reading directory ${dir}:`, error);
        }
    }

    private getAst(filePath: string) {
        try {
            if (!this.astCache[filePath]) {
                if (!this.contentCache[filePath]) {
                    this.contentCache[filePath] = fs.readFileSync(filePath, 'utf8');
                }
                this.astCache[filePath] = parser.parse(this.contentCache[filePath], {
                    sourceType: 'module',
                    plugins: ['jsx', 'typescript']
                });
            }
        } catch (error) {
            console.error(`Error parsing file ${filePath}:`, error);
        }
    }

    private generateId(length: number = 8): string {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += this.characters.charAt(Math.floor(Math.random() * this.characters.length));
        }
        return result;
    }

    private isReactComponent(path: NodePath) {
        let hasJSX = false;
        path.traverse({
            JSXElement() {
                hasJSX = true;
            }
        });
        return hasJSX;
    }

    /**
    * Парсит файлы проекта в дерево.
    * В первом цикле проходится по файлам и находит компоненты по дефолтным экспортам.
    * Во втором цикле в этих фалах сравнивает импорты с вхождением jsx и результат добавляет как узел дерева.
    * Проходит рекурсивно от начального элемента и возвращает массив зависимостей для постороения дерева. 
    * @param rootPath корень проекта
    * @returns массив зависимостей IComponentAsNode
    */
    private analyzeProject() {
        this.pathsToFiles.forEach(filePath => this.findExports(filePath));
        Object.values(this.filesAsReactComponent).forEach(file => this.findImportsAndJSX(file));
        this.generateTree();
    }

    private generateTree() {
        const app: IComponentAsNode = this.componentsList['App'];
        if (!app) {
            console.error('App component not found');
            return;
        }

        const recursion = (component: IComponentAsNode, parentID: string = 'App') => {
            if (component.child.length === 0) {
                return;
            }
            component.child.forEach(child => {
                let id = this.generateId();
                this.tree.push({ parentRef: parentID, name: child, id: id });
                recursion(this.componentsList[child], id);
            });
        };

        recursion(app);
    }

    private findExports(filePath: string) {
        this.getAst(filePath);

        traverse(this.astCache[filePath], {
            // Обработка объявлений переменных
            VariableDeclarator: (path) => {
                if (this.isReactComponent(path)  && path.node.init && path.node.init.type === 'ArrowFunctionExpression') {
                    if (path.node.id.type === 'Identifier') {
                        let fileName = path.node.id.name;
                        if (fileName) {
                            this.filesAsReactComponent[fileName] = { path: filePath, name: fileName };
                        }
                    }
                }
            },


            // Обработка обычных функций
            FunctionDeclaration: (path) => {                
                if (this.isReactComponent(path)) {
                    let fileName = path.node.id?.name;
                    if (fileName) {
                        this.filesAsReactComponent[fileName] = { path: filePath, name: fileName };
                    }
                }
            },
        });
    }

    private findImportsAndJSX(file: IFileIsExport) {
        this.getAst(file.path);

        const imports: string[] = [];
        const childList: string[] = [];

        traverse(this.astCache[file.path], {
            ImportDeclaration: (path) => {
                for (let index = 0; index < path.node.specifiers.length; index++) {
                    if (this.filesAsReactComponent[path.node.specifiers[index].local.name]) { // проверка что импорт соответствует существующим компонентам
                        imports.push(path.node.specifiers[index].local.name);
                    }
                }
            },
            JSXIdentifier: (path) => {
                if (imports.includes(path.node.name)) {
                    childList.push(path.node.name);
                }
            }
        });

        this.componentsList[file.name] = { name: file.name, child: childList };
    }

    /**
    * Генерирует строку зависимостей для библиотеки mermaid
    * @returns строка в ввиде графа
    */
    private generateMermaidGraph() {
        this.tree.forEach(node => {
            if (node.parentRef) {
                this.mermaidString += `    ${node.parentRef} ==> ${node.id}[${node.name}];\n`;
            }
        });
        this.result.push(this.mermaidString);
    }
}