export interface IFileIsExport {
	path: string;
	name: string;
}

export interface IFileAsReactComponent  {[key: string]: IFileIsExport};

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

export interface ZoomControllerOptions {
    svgSelector: string;
    zoomInButtonId: string;
    zoomOutButtonId: string;
}