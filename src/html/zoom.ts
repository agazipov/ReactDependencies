interface ZoomControllerOptions {
    svgSelector: string;
    zoomInButtonId: string;
    zoomOutButtonId: string;
}

class Zoom {
    private svgElement: SVGSVGElement | null;
    private zoomInButton: HTMLButtonElement | null;
    private zoomOutButton: HTMLButtonElement | null;
    private scale: number;

    constructor(options: ZoomControllerOptions) {
        this.svgElement = document.querySelector(options.svgSelector);
        this.zoomInButton = document.getElementById(options.zoomInButtonId) as HTMLButtonElement | null;
        this.zoomOutButton = document.getElementById(options.zoomOutButtonId) as HTMLButtonElement | null;
        this.scale = 1;

        if (!this.svgElement) {
            console.error('SVG element not found');
        }

        if (!this.zoomInButton) {
            console.error('Zoom In button not found');
        }

        if (!this.zoomOutButton) {
            console.error('Zoom Out button not found');
        }

        this.attachEventListeners();
    }

    private attachEventListeners() {
        if (this.zoomInButton) {
            this.zoomInButton.addEventListener('click', this.zoomIn.bind(this));
        }

        if (this.zoomOutButton) {
            this.zoomOutButton.addEventListener('click', this.zoomOut.bind(this));
        }
    }

    private zoomIn() {
        if (this.svgElement) {
            this.scale += 0.1;
            this.svgElement.style.width = (this.scale * 100) + '%';
        }
    }

    private zoomOut() {
        if (this.svgElement) {
            this.scale -= 0.1;
            this.svgElement.style.width = (this.scale * 100) + '%';
        }
    }
}