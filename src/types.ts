export interface IFileIsExport {
	path: string;
	name: string;
}

export interface IFileIsExportAsObj  {[key: string]: IFileIsExport};

export interface IComponentAsNode {
	name: string;
	child: string[];
}

export interface IComponentsList { [key: string]: IComponentAsNode }

export interface INode {
	parentRef: string;
	name: string;
	id: string;
}