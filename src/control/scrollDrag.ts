export class ScrollDrag {
    private isDragging: boolean;
    private startX: number;
    private startY: number;
    private scrollLeft: number;
    private scrollTop: number;

    constructor() {
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.scrollLeft = 0;
        this.scrollTop = 0;

        this.bindEvents();
    }

    private bindEvents(): void {
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }

    private handleMouseDown(e: MouseEvent): void {
        e.preventDefault();
        this.isDragging = true;
        this.startX = e.clientX + this.scrollLeft;
        this.startY = e.clientY + this.scrollTop;
        document.body.style.cursor = 'grabbing';
    }

    private handleMouseMove(e: MouseEvent): void {
        if (!this.isDragging) {
            return;
        };

        this.scrollLeft = this.startX - e.clientX;
        this.scrollTop = this.startY - e.clientY;

        document.documentElement.scrollLeft = this.scrollLeft;
        document.documentElement.scrollTop = this.scrollTop;
    }

    private handleMouseUp(): void {
        this.isDragging = false;
        document.body.style.cursor = 'grab';
    }

    private handleMouseLeave(): void {
        this.isDragging = false;
        document.body.style.cursor = 'grab';
    }
}