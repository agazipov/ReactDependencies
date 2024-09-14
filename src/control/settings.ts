interface vscode {
    postMessage(message: any): void;
}

declare const vscode: vscode;

export class Settings {
    private settingsContainer: HTMLElement | null;
    private diagramContainer: HTMLElement | null;
    private initButton: HTMLButtonElement | null;
    private isView: boolean;

    constructor () {
        this.settingsContainer = document.querySelector('.settings') as HTMLElement | null;
        this.diagramContainer = document.querySelector('.diagram') as HTMLElement | null;
        this.initButton = document.getElementById('initButton') as HTMLButtonElement | null;
        this.isView = false;

        if (!this.settingsContainer) {
            console.error('Settings Container not found');
        }
        if (!this.diagramContainer) {
            console.error('Diagram Container not found');
        }
        if (!this.initButton) {
            console.error('Init Button not found');
        }

        this.bindEvent();
    }

    private bindEvent(): void {
        if (this.initButton) {
            this.initButton.addEventListener('click', this.handleInit.bind(this));
        }
    }

    private handleInit(e: MouseEvent): void {        
        if (this.diagramContainer) {   
            if (this.isView) {
                this.diagramContainer.style.display = 'none';
            } else {
                this.diagramContainer.style.display = 'block';
                this.readDirectory();
            }
        }
        this.isView = !this.isView;
    }

    private readDirectory() {
        vscode.postMessage({ command: 'readDirectory' });
    }
}