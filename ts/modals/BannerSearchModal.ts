import { App, Modal, Notice } from 'obsidian';
import { fetchSteamBanner, fetchItchioBanner, fetchTMDbBanner } from '../utils/FetchBanner';

export class BannerSearchModal extends Modal {
	constructor(app: App) {
		super(app);
	}
    
	async onOpen() {
		const {contentEl} = this;
        
        contentEl.createEl('h3', { text: 'This Game Image' });

        const val = this.app.workspace.getActiveFile()?.basename;
        if (val === undefined) {
            new Notice(`Target file not detected.`);
            return
        }

        const steamBannerList = await fetchSteamBanner(val);
        const itchioBannerList = await fetchItchioBanner(val);
        const TMDbBannerList = await fetchTMDbBanner(val);
        const bannerList = [
            ...steamBannerList.slice(0,5),
            ...itchioBannerList.slice(0,5),
            ...TMDbBannerList.slice(0,5)
        ];
        bannerList.forEach(url => {
            const img = contentEl.createEl('img', { attr: { src: url }, cls :"banner-image-selection click" });
            // onclick: copy to clipboard
            img.addEventListener("click", function(evt: MouseEvent) {
                const imgSrc = this.src;
                navigator.clipboard.writeText(imgSrc).then(() => {
                    new Notice('Link copiato nella clipboard!');
                    console.log('Link copiato nella clipboard!');
                  }).catch(err => {
                    new Notice('Errore nel copiare il testo:', err);
                    console.log('Errore nel copiare il testo:', err);
                  });
            })
        });

    }
    
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}