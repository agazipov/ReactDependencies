window.addEventListener('load', () => {
    mermaid.initialize({ startOnLoad: true });
    mermaid.contentLoaded();   

    const zoomController = new Zoom({
        svgSelector: '.mermaid svg',
        zoomInButtonId: 'zoomInButton',
        zoomOutButtonId: 'zoomOutButton'
    });
});