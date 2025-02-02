import { App, Modal } from "obsidian";

export class ImageSearchModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.addClass("BannerSearchModal");
        contentEl.createEl('h3', { text: 'Banner Search' });

        const searchBarDivEl = contentEl.createDiv({ cls: 'input-container' });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}