import { ScrollDrag } from "./scrollDrag";
import { Zoom } from "./zoom";

export const index = window.addEventListener('load', () => {
    mermaid.initialize({ startOnLoad: true });
    mermaid.contentLoaded();   

    const zoomController = new Zoom({
        svgSelector: '.mermaid svg',
        zoomInButtonId: 'zoomInButton',
        zoomOutButtonId: 'zoomOutButton'
    });

    const scrollDrag = new ScrollDrag();
});