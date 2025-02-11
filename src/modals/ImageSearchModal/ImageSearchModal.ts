import { App, Modal, setIcon, TFile } from "obsidian";
import {
    fetchSteamBanner,
    fetchItchioBanner,
    fetchTMDbBanner
} from './imageScrapers';
import { copyToClipboard } from "src/utils/clipboard";

//TOEDIT: da modificare per aggiungere scrapers
type ScraperName = "steam" | "itchio" | "tmdb";
type ScraperGenerator = (q: string) => AsyncGenerator<string>;
const SCRAPERS: Record<ScraperName, ScraperGenerator> = {
    "steam": fetchSteamBanner,
    "itchio": fetchItchioBanner,
    "tmdb": fetchTMDbBanner
}

//TOEDIT: da modificare per assegnare cartelle a scraper
const FILEPATH_TO_SCRAPERS: Record<string, ScraperName[]> = {
    "!MediaAnalysis/!Videogames/!Videogames": ["steam", "itchio"],
    "!MediaAnalysis/!Movies&Shows/!Movies": ["tmdb"],
    "!MediaAnalysis/!Movies&Shows/!Shows": ["tmdb"]
}

export class ImageSearchModal extends Modal {

    public  targetGalleryRaw: string;
    public  targetGalleryContent: string[];
    public  fromGalleryButton: boolean;
    private activeScrapers: Record<ScraperName, boolean>;
    private selectedImages: string[];
    private imgContainerEl: HTMLDivElement;
    private activeFile: TFile | null;

    constructor(app: App, targetGalleryRaw = "") {
        super(app);
        // genera dinamicamente un dizionario che associa ad ogni nome di scraper un valore booleano
        this.activeScrapers = Object.fromEntries(Object.keys(SCRAPERS).map((k) => [k, false])) as Record<ScraperName, boolean>;
        this.selectedImages = [];
        this.targetGalleryRaw = targetGalleryRaw;
        this.targetGalleryContent = this.galleryRawToContent(targetGalleryRaw)[1];
        this.activeFile = this.app.workspace.getActiveFile();
        this.fromGalleryButton = targetGalleryRaw !== "";
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.addClass("ImageSearchModal");
        contentEl.createEl('h3', { text: 'Image Search' });

        if (this.targetGalleryRaw === "") {
            [this.targetGalleryRaw, this.targetGalleryContent] = await this.getFirstGalleryInCurrentFile();
        }

        const searchBarDivEl = contentEl.createDiv({ cls: 'input-container' });

        const inputEl = searchBarDivEl.createEl('input', {
            type: 'text', cls: 'text-input-class', placeholder: 'query'
        });

        const searchButtonEl = searchBarDivEl.createSpan({ cls: 'clickable-icon' });
        setIcon(searchButtonEl, 'search');
        const commitButtonEl = searchBarDivEl.createSpan({ cls: 'clickable-icon' });
        if (!this.activeFile || this.targetGalleryRaw === "") {
            setIcon(commitButtonEl, 'clipboard');
        } else {
            setIcon(commitButtonEl, 'pencil');
        }

        const checkboxDiv = contentEl.createDiv({ cls: 'my-checkbox-container' });

        // Get file info
        const fileName = this.activeFile?.basename ?? "";
        const filePath = this.activeFile?.parent?.path ?? "";

        // Autofill query with fileName
        if (fileName && !this.fromGalleryButton) {
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
            
            // utilizza il percorso più lungo che combacia
            if (filePath && !this.fromGalleryButton) {
                let path = "";
                for (const testPath of Object.keys(FILEPATH_TO_SCRAPERS)) {
                    if (filePath.startsWith(testPath)) {
                        if (path === "" || testPath.length > path.length) {
                            path = testPath;
                        }
                    }
                }
                if (path && FILEPATH_TO_SCRAPERS[path].contains(scraperName)) {
                    this.activeScrapers[scraperName] = true;
                    checkbox.checked = true;
                }
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
        if (!this.activeFile) {
            return ["", []];
        }

        const currentContent = await this.app.vault.read(this.activeFile);
        return this.galleryRawToContent(currentContent);
                
    }


    private galleryRawToContent(text: string): [string, string[]] {
        const matchB = text.match(/!\[header\]\(([\S]*)\)/);
        if (matchB) {
            const url = (matchB[1] ?? "").trim();
            return [matchB[0], [url]]; 
        }

        // const matchA = text.match(/```gallery[\s]*\n([\S\s]*?)\n```/);
        const matchA = text.match(/```gallery[\s]*?\n```(?!gallery)|```gallery[\s]*\n([\S\s]*?)\n```(?!gallery)/);
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
        const newGalleryContent = '```gallery\n' + this.selectedImages.join('\n') + '\n```';
        
        if (!this.activeFile || this.targetGalleryRaw === "") {
            copyToClipboard(newGalleryContent);
        } else {
            const currentContent = await this.app.vault.read(this.activeFile);
            const newContent = currentContent.replace(this.targetGalleryRaw, newGalleryContent);
            this.app.vault.modify(this.activeFile, newContent);
        }

    }


    private async searchAndLoadImages(query: string) {
        this.imgContainerEl.empty();
        this.selectedImages = [];

        const activeScrapersList = Object.keys(this.activeScrapers).filter((v: ScraperName) => this.activeScrapers[v] == true);

        let id = 0;
        const avoidUrlRepetition = new Set<string>();

        for (const targetImageUrl of this.targetGalleryContent) {
            this.createImageCheckbox(targetImageUrl, id, true);
            avoidUrlRepetition.add(targetImageUrl);
            id += 1;
        }

        if (id > 0) {
            this.imgContainerEl.createEl('hr');
        }
        
        for (const scraper of activeScrapersList) {
            for await (const url of SCRAPERS[scraper as ScraperName](query)) {
                if (url === 'line') {
                    this.imgContainerEl.createEl('hr');
                } 
                else if (!avoidUrlRepetition.has(url)) {
                    this.createImageCheckbox(url, id, false);
                    avoidUrlRepetition.add(url);
                    id += 1;
                }                

            }

        }

        if (activeScrapersList.length === 0) {
            this.imgContainerEl.createEl('hr');
            this.imgContainerEl.createSpan({ cls: 'empty-selection', text: 'There are no active scrapers!'});
            // new Notice("WARNING: no active scraper was found!");
        }
        else if (id <= this.targetGalleryContent.length) {
            this.imgContainerEl.createEl('hr');
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

        console.log(this.selectedImages);
        
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
            console.log(this.selectedImages);
        }

    }
    
}

// New Layout
//TODO: rifare layout della galleria su figma

// Fancy Stuff
//TODO: trovare il modo di far vedere l'ordine di selezione nel modale con le checkbox
//TODO: se arrivo fino a quì sarebbe il caso di aggiungere anche un indicatore del numero dell'immagine nel display della galleria (persona style?)
