import { App, Modal, Notice, TFile, setIcon } from 'obsidian';
import { 
    fetchSteamBanner, 
    fetchItchioBanner, 
    fetchTMDbBanner 
} from '../utils/FetchBanner';

export class BannerSearchModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    HEADER_REGEX = /!\[header\]\((.*?)\)/;
    MEDIA_REGEX = /(?<=Analysis\/)[^/]+(?=\/)/;
    MEDIA_TO_SCRAPER: {[key:string] : ((name: string) => Promise<string[]>)[] } = {
        All: [
            fetchSteamBanner,
            fetchItchioBanner,
            fetchTMDbBanner
        ],
        Videogiochi: [
            fetchSteamBanner,
            fetchItchioBanner
        ],
        Film: [
            fetchTMDbBanner
        ],
        "Serie TV": [
            fetchTMDbBanner
        ],
        Anime: [
            fetchTMDbBanner
        ],
        Libri: [

        ],
        TTRPG: [

        ]
    }

    checkboxEl: HTMLInputElement;

    async onOpen() {
        const { contentEl } = this;
        contentEl.addClass("BannerSearchModal");
        contentEl.createEl('h3', { text: 'Banner Search' });

        const searchBarDivEl =  contentEl.createDiv({ cls: 'input-container' });

        const inputEl = searchBarDivEl.createEl('input', {
            type: 'text', cls: 'text-input-class', placeholder: 'game to search for...' 
        });
       
        const selectEl = searchBarDivEl.createEl('select', { type: 'text', cls: 'dropdown' });
        
        const searchButtonEl = searchBarDivEl.createSpan({ cls: 'clickable-icon' });
        setIcon(searchButtonEl, 'search');

        const checkboxDiv = contentEl.createDiv({ cls: 'my-checkbox-container' });
        checkboxDiv.createEl('label', { cls: 'mod-checkbox', text: "replace current header image" });
        this.checkboxEl = checkboxDiv.createEl('input', { type: 'checkbox' });

        contentEl.createEl("hr");

        const imgContainerEl = contentEl.createDiv({ cls: 'images-container' });

        // search on open
        const { name, mediaType } = this.getCurrentFileInfo();

        if (name) {
            inputEl.value = name;
        } else {
            new Notice(`Target filename not detected.`);
        }

        this.getMediaTypeList().forEach( mt => selectEl.createEl("option", { text: mt }) );
        if (mediaType) {
            selectEl.value = Object.keys(this.MEDIA_TO_SCRAPER).includes(mediaType) ? mediaType : "All";
        } else {
            new Notice(`Target media type not detected.`);
        }

        this.searchAndLoadBanner(imgContainerEl, name, mediaType);

        // search on keydown
        inputEl.addEventListener('keydown', evt => {
            if (evt.key === "Enter") {
                this.searchAndLoadBanner(imgContainerEl, inputEl.value, selectEl.value);
            }
        });
        
        // search on button click
        searchButtonEl.addEventListener('click', (evt: MouseEvent) => 
            this.searchAndLoadBanner(imgContainerEl, inputEl.value, selectEl.value)
        );

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private getMediaTypeList() : string[] {
        const mediaTypeList: string[] = [];
        this.app.vault.getFiles().forEach((file: TFile) => {
            const match = file.path.match(this.MEDIA_REGEX);
            if (match && !mediaTypeList.includes(match[0])) {
                mediaTypeList.push(match[0])
            }

        });
        return ["All", ...mediaTypeList];
    }

    private async searchAndLoadBanner(parent: HTMLElement, name: string | undefined, mediaType: string | undefined) {

        parent.empty();

        if (!name || name.trim() === "" || !mediaType) {
            new Notice("Invalid input.");
            return
        }

        const bannerList = [];
        for (const func of this.MEDIA_TO_SCRAPER[mediaType] ?? this.MEDIA_TO_SCRAPER["All"]) {
            const links = await func(name);
            bannerList.push(...links.slice(0,5));
        }

        bannerList.forEach(url => {
            const img = parent.createEl('img', { attr: { src: url }, cls: "click" });
            // onclick: copy to clipboard
            img.addEventListener("click", (evt: MouseEvent) => {
                const imgSrc = (evt.currentTarget as HTMLImageElement).src;
                if (this.checkboxEl.checked) {
                    this.replaceBannerImage(imgSrc);
                } else {
                    this.copyToClipboard(imgSrc);
                }
                
            });
        });
    }

    private async replaceBannerImage(imgSrc: string) {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice("No active file found.");
            return;
        }

        const fileContent = await this.app.vault.read(activeFile);
        
        const match = this.HEADER_REGEX.exec(fileContent);
        if (!match) {
            new Notice("No header image link found.");
            return;
        }

        const oldLink = match[1];
        const updatedContent = fileContent.replace(oldLink, imgSrc);

        await this.app.vault.modify(activeFile, updatedContent);
    }

    private copyToClipboard(imgSrc: string) {
        navigator.clipboard.writeText(imgSrc).then(() => {
            new Notice('Link copiato nella clipboard!');
            console.log('Link copiato nella clipboard!');
        }).catch(err => {
            new Notice('Errore nel copiare il testo:', err);
            console.log('Errore nel copiare il testo:', err);
        });
    }

    private getCurrentFileInfo() : { name: string | undefined, mediaType: string | undefined } {
        const currentFile = this.app.workspace.getActiveFile();
        
        if (!currentFile) {
            return {
                name: undefined,
                mediaType: undefined
            };
        }

        let mediaType = undefined;

        const match = currentFile.path.match(this.MEDIA_REGEX);
        if (match) {
            mediaType = match[0];
        }

        return {
            name: currentFile.basename,
            mediaType
        };
    }

}