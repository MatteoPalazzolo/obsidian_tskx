import { App, Modal, Notice } from 'obsidian';
import { fetchGameBanner } from '../utils/FetchGameBanner';

export class SearchBarModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
        
        contentEl.createEl('h3', { text: 'Banner Finder' });

        const input = contentEl.createEl('input', { type: 'text' });
        input.addClass('text-input-class');
        input.placeholder = "game to search for...";

        const div = contentEl.createDiv();

        input.addEventListener('keydown', async event => {
            if (event.key === "Enter" && input.value.trim() !== "") {
                new Notice(`You entered: ${input.value}`);
                const bannerImgUrlList = await fetchGameBanner(input.value);
                div.empty()
                bannerImgUrlList.slice(0,6).forEach(url => {
                    div.createEl('img', { attr: { src: url }, cls: "banner-image-selection" });
                });
            }
        });

    }
    
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}