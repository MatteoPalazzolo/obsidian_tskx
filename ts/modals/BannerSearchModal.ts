import { App, Modal, Notice } from 'obsidian';
import { fetchSteamBanner, fetchItchioBanner, fetchTMDbBanner } from '../utils/FetchBanner';

export class BannerSearchModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.addClass("BannerSearchModal");
        contentEl.createEl('h3', { text: 'Banner Search' });

        const inputEl = contentEl.createEl('input', { type: 'text', cls: 'text-input-class' });
        inputEl.placeholder = "game to search for...";

        const imgContainerEl = contentEl.createDiv();

        const name = this.app.workspace.getActiveFile()?.basename;
        if (name) {
            inputEl.value = name;
            this.loadBanner(imgContainerEl, name);
        } else {
            new Notice(`Target file not detected.`);
        }

        inputEl.addEventListener('keydown', async event => {
            if (event.key === "Enter") {
                imgContainerEl.empty();
                if (inputEl.value.trim() !== "") {
                    new Notice(`You entered: ${inputEl.value.trim()}`);
                    this.loadBanner(imgContainerEl, inputEl.value);
                }
            }
        });



    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private async loadBanner(parent: HTMLElement, name: string): Promise<void> {
        const steamBannerList = await fetchSteamBanner(name);
        const itchioBannerList = await fetchItchioBanner(name);
        const TMDbBannerList = await fetchTMDbBanner(name);
        const bannerList = [
            ...steamBannerList.slice(0, 5),
            ...itchioBannerList.slice(0, 5),
            ...TMDbBannerList.slice(0, 5)
        ];
        bannerList.forEach(url => {
            const img = parent.createEl('img', { attr: { src: url }, cls: "banner-image-selection click" });
            // onclick: copy to clipboard
            img.addEventListener("click", function (evt: MouseEvent) {
                const imgSrc = this.src;
                navigator.clipboard.writeText(imgSrc).then(() => {
                    new Notice('Link copiato nella clipboard!');
                    console.log('Link copiato nella clipboard!');
                }).catch(err => {
                    new Notice('Errore nel copiare il testo:', err);
                    console.log('Errore nel copiare il testo:', err);
                });
            });
        });
    }
}