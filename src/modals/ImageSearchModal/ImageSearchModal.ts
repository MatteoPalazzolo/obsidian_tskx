import { App, Modal, setIcon } from "obsidian";
import {
    fetchSteamBanner,
    fetchItchioBanner,
    fetchTMDbBanner
} from './imageScrapers';

type ScraperName = "steam" | "itchio" | "tmdb";
type ScraperGenerator = (q: string) => AsyncGenerator<string>;

const SCRAPERS: Record<ScraperName, ScraperGenerator> = {
    "steam": fetchSteamBanner,
    "itchio": fetchItchioBanner,
    "tmdb": fetchTMDbBanner
}

export class ImageSearchModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    activeScrapers: Record<ScraperName, boolean> = {
        "steam": false,
        "itchio": false,
        "tmdb": false
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.addClass("BannerSearchModal");
        contentEl.createEl('h3', { text: 'Image Search' });

        const searchBarDivEl = contentEl.createDiv({ cls: 'input-container' });

        const inputEl = searchBarDivEl.createEl('input', {
            type: 'text', cls: 'text-input-class', placeholder: 'game to search for...'
        });

        const searchButtonEl = searchBarDivEl.createSpan({ cls: 'clickable-icon' });
        setIcon(searchButtonEl, 'search');

        const checkboxDiv = contentEl.createDiv({ cls: 'my-checkbox-container' });
        
        for (const scraperName of Object.keys(SCRAPERS) as ScraperName[]) {
            checkboxDiv.createEl('label', { cls: 'mod-checkbox', text: scraperName, attr: { for: "checkbox-" + scraperName } });
            const checkbox = checkboxDiv.createEl('input', { type: 'checkbox', attr: { id: "checkbox-" + scraperName } });
            checkbox.oninput = (e) => {
                this.activeScrapers[scraperName] = (e.currentTarget as HTMLInputElement).checked;
            }
        }

        contentEl.createEl('hr');

        const imgContainerEl = contentEl.createDiv({ cls: 'images-container' });

        //CSS column: 300px
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}