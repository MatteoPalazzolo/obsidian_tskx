import { App, Modal, Notice, setIcon } from "obsidian";
import {
    fetchSteamBanner,
    fetchItchioBanner,
    fetchTMDbBanner
} from './imageScrapers';
import { ANALYSIS_FOLDER_NAME } from "src/conts";
import { copyToClipboard } from "src/utils/clipboard";


type ScraperName = "steam" | "itchio" | "tmdb";
type ScraperGenerator = (q: string) => AsyncGenerator<string>;

const SCRAPERS: Record<ScraperName, ScraperGenerator> = {
    "steam": fetchSteamBanner,
    "itchio": fetchItchioBanner,
    "tmdb": fetchTMDbBanner
}

type MediaCategory = "Videogames" | "Shows" | "Movies";

const CATEGORY_TO_SCRAPERS: Record<MediaCategory, ScraperName[]> = {
    "Videogames": ["steam", "itchio"],
    "Shows": ["tmdb"],
    "Movies": ["tmdb"]
}


export class ImageSearchModal extends Modal {

    public  targetGalleryRaw: string;
    public  targetGalleryContent: string[];
    private activeScrapers: Record<ScraperName, boolean>;
    private selectedImages: string[];
    private imgContainerEl: HTMLDivElement;

    constructor(app: App, targetGalleryRaw = "") {
        super(app);
        // genera dinamicamente un dizionario che associa ad ogni nome di scraper un valore booleano
        this.activeScrapers = Object.fromEntries(Object.keys(SCRAPERS).map((k) => [k, false])) as Record<ScraperName, boolean>;
        this.selectedImages = [];
        this.targetGalleryRaw = targetGalleryRaw;
        this.targetGalleryContent = [];
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.addClass("ImageSearchModal");
        contentEl.createEl('h3', { text: 'Image Search' });

        if (this.targetGalleryRaw === "") {
            [this.targetGalleryRaw, this.targetGalleryContent] = await this.getFirstGalleryInCurrentFile();
        }
        if (this.targetGalleryRaw === "") {
            new Notice("WARNING: no active gallery was found!");
            return;
        }

        const searchBarDivEl = contentEl.createDiv({ cls: 'input-container' });

        const inputEl = searchBarDivEl.createEl('input', {
            type: 'text', cls: 'text-input-class', placeholder: 'query'
        });

        const searchButtonEl = searchBarDivEl.createSpan({ cls: 'clickable-icon' });
        setIcon(searchButtonEl, 'search');
        const commitButtonEl = searchBarDivEl.createSpan({ cls: 'clickable-icon' });
        setIcon(commitButtonEl, 'send');

        const checkboxDiv = contentEl.createDiv({ cls: 'my-checkbox-container' });

        // Get file info
        const { fileName, fileCategory } = this.getCurrentFileInfo();

        // Autofill query with fileName
        if (fileName) {
            inputEl.value = fileName;
        } else {
            // new Notice(`Target filename not detected.`);
        }
        
        // Create a checkbox for each scraper
        for (const scraperName of Object.keys(SCRAPERS) as ScraperName[]) {
            checkboxDiv.createEl('label', { cls: 'mod-checkbox', text: scraperName, attr: { for: "checkbox-" + scraperName } });
            const checkbox = checkboxDiv.createEl('input', { type: 'checkbox', attr: { id: "checkbox-" + scraperName } });
            checkbox.oninput = (e) => {
                this.activeScrapers[scraperName] = (e.currentTarget as HTMLInputElement).checked;
            }
            if (
                fileCategory && 
                Object.keys(CATEGORY_TO_SCRAPERS).contains(fileCategory) && 
                CATEGORY_TO_SCRAPERS[fileCategory].contains(scraperName)
            ) {
                this.activeScrapers[scraperName] = true;
                checkbox.checked = true;
            }
        }

        contentEl.createEl('hr');

        this.imgContainerEl = contentEl.createDiv({ cls: 'images-container' });
        
        this.searchAndLoadImages(fileName);

        // search on keydown
        inputEl.onkeydown = (evt) => {
            if (evt.key === "Enter") {
                this.searchAndLoadImages(inputEl.value);
            }
        };

        // search on click
        searchButtonEl.onclick = (evt: MouseEvent) =>
            this.searchAndLoadImages(inputEl.value);

        // commit image selection on click
        commitButtonEl.onclick = (evt: MouseEvent) => {
            this.commitSelectionToGallery();
            this.close();
        }
        
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }


    private async getFirstGalleryInCurrentFile(): Promise<[string, string[]]> {

        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice("WARNING: no active file was found!");
            return ["", []];
        }

        const currentContent = await this.app.vault.read(activeFile);
        const matchB = currentContent.match(/!\[header\]\(([\S]*)\)/);
        if (matchB) {
            const urlList = (matchB[1] ?? "")
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line);
            return [matchB[0], urlList]; 
        }

        const matchA = currentContent.match(/```gallery[\s]*\n([\S\s]*?)\n```/);
        if (matchA) {
            const urlList = (matchA[1] ?? "")
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line);
            return [matchA[0], urlList]; 
        }
        
        return ["", []];
    }


    private async commitSelectionToGallery() {
        const newGalleryContent = '\n' + '```gallery' + '\n' + this.selectedImages.join('\n') + '\n' + '```';
        const activeFile = this.app.workspace.getActiveFile();
        console.log(activeFile);
        if (!activeFile) {
            new Notice("WARNING: No active file was found!");
            return;
        }
        const currentContent = await this.app.vault.read(activeFile);
        const newContent = currentContent.replace(this.targetGalleryRaw, newGalleryContent);
        await this.app.vault.modify(activeFile, newContent);
    }


    private async searchAndLoadImages(query: string) {
        this.imgContainerEl.empty();

        const activeScrapersList = Object.keys(this.activeScrapers).filter((v: ScraperName) => this.activeScrapers[v] == true);

        if (activeScrapersList.length === 0) {
            this.imgContainerEl.createSpan({ cls: 'empty-selection', text: 'There are no active scrapers!'});
            // new Notice("WARNING: no active scraper was found!");
            return;
        }

        let id = 0;
        const allUrls = [];

        for (const targetImageUrl of this.targetGalleryContent) {
            this.createImageCheckbox(targetImageUrl, id, true);
            id += 1;
            allUrls.push(targetImageUrl);
        }

        if (id > 0) {
            this.imgContainerEl.createEl('hr');
        }
        
        for (const scraper of activeScrapersList) {
            for await (const url of SCRAPERS[scraper as ScraperName](query)) {
                if (url === 'line') {
                    this.imgContainerEl.createEl('hr');
                } 
                else if (!allUrls.contains(url)) {
                    this.createImageCheckbox(url, id);
                    id += 1;
                    allUrls.push(url);
                }                

            }

        }

        if (id === 0) {
            this.imgContainerEl.createSpan({ cls: 'empty-selection', text: 'No image found!'});
            // new Notice("WARNING: no image found!");
        }

    }


    private createImageCheckbox(url: string, id: number, startChecked: boolean = false) {
        
        const div = this.imgContainerEl.createDiv({ attr: { src: url }, cls: 'my-image-checkbox-div' });
            const label = div.createEl('label', { attr: { for: 'my-checkbox-' + id }  });
                const img = label.createEl('img', { attr: { src: url }  });
            const checkbox = div.createEl('input', { attr: { id: 'my-checkbox-' + id, 'data-url': url }, type: 'checkbox' })

        if (startChecked) {
            checkbox.checked = true;
            this.selectedImages.push(url);
        }
        
        img.onmousedown = (evt: MouseEvent) => {
            const imgSrc = (evt.currentTarget as HTMLImageElement).src;
            if (evt.button === 2 /* right mouse button */) {
                copyToClipboard(imgSrc);
            }
        };

        checkbox.oninput = (evt: InputEvent) => {
            const url = checkbox.getAttribute('data-url') ?? "";
            if (checkbox.checked) {
                this.selectedImages.push(url);
            } else {
                const i = this.selectedImages.indexOf(url);
                this.selectedImages.splice(i, 1);    
            }
        }

    }


    private getCurrentFileInfo(): { fileName: string, fileCategory: MediaCategory | "" } {
        const currentFile = this.app.workspace.getActiveFile();

        if (!currentFile) {
            return { fileName: "", fileCategory: "" };
        }
        
        const regex = new RegExp(ANALYSIS_FOLDER_NAME + "\/!(.*)\/") // /!Analysis\/!(.*)\//
        const match = currentFile.path.match(regex);

        return {
            fileName: currentFile.basename,
            fileCategory: match ? match[1].replace(/!/g,"") as MediaCategory : ""
        };
    }
    
}


//TODO: inserire un button direttamente sulla galleria che apra il modulo per editarla, in modo da poter avere più di una galleria per file

//TODO: trovare il modo di far vedere l'ordine di selezione nel modale con le checkbox
//TODO: se arrivo fino a quì sarebbe il caso di aggiungere anche un indicatore del numero dell'immagine nel display della galleria (persona style?)
