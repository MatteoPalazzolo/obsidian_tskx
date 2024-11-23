import { App, Modal, Notice } from 'obsidian';
import { fetchGameBanner } from '../utils/FetchGameBanner';

export class SearchThisGameModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	async onOpen() {
		const {contentEl} = this;
        
        contentEl.createEl('h3', { text: 'This Game Image' });

        const val = this.app.workspace.getActiveFile()?.basename;
        if (val === undefined) {
            new Notice(`Target file not detected.`);
        }

        const bannerImgUrlList = await fetchGameBanner(val as string);
        bannerImgUrlList.slice(0,6).forEach(url => {
            contentEl.createEl('img', { attr: { src: url }, cls :"banner-image-selection" })
        });

    }
    
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}