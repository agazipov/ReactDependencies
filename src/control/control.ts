import { ScrollDrag } from "./scrollDrag";
import { Settings } from "./settings";
import { Zoom } from "./zoom";

export class Control {
    index() {
        window.addEventListener('load', () => {
            const settings = new Settings();
            
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'directoryContent':
                        // Создаем элемент script для загрузки Mermaid
                        const script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js';
                        script.onload = function () {
                            // После загрузки Mermaid, инициализируем диаграмму
                            mermaid.initialize({ startOnLoad: true });
                            // Вставка диаграммы в контейнер
                            const container = document.querySelector('.mermaid') as HTMLElement;
                            container.textContent = message.files[0];
                            // Рендеринг диаграммы
                            mermaid.init(undefined, container).then(() => {
                                // Инициализация zoomController и scrollDrag после рендеринга диаграммы
                                const zoomController = new Zoom({
                                    svgSelector: '.mermaid svg',
                                    zoomInButtonId: 'zoomInButton',
                                    zoomOutButtonId: 'zoomOutButton'
                                });
                                const scrollDrag = new ScrollDrag();
                            });
                        };
                        document.head.appendChild(script);
                        break;
                }
            });
        });
    }
}