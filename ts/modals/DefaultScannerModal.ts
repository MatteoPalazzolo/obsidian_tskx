import { App, Modal, TFile } from 'obsidian';

export class DefaultScannerModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.setText("Scanner");
        contentEl.addClass("MissingBannerModal");
        
        const selectedFiles = await this.getDefaultImageFiles();
        const mediaNames = this.orderFilesInDict(selectedFiles);

        for (const k of Object.keys(mediaNames)) {
            contentEl.createEl('h3', { text: k });
            const ul = contentEl.createEl("ul");
            for (const name of mediaNames[k]) {
                this.createInternalLink(ul, name);
            }
        }

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private async getDefaultImageFiles(): Promise<TFile[]> {
        const ANALYSIS_PATH = "Analysis/";
        const DEFAULT_IMAGE = "![header](replace.jpg)";
        const files = this.app.vault.getFiles().filter((file: TFile) => file.path.startsWith(ANALYSIS_PATH));

        const filteredFiles = [];
        for (const file of files) {
            const content = await this.app.vault.read(file);
            if (content.includes(DEFAULT_IMAGE)) {
                filteredFiles.push(file);
            }
        }

        return filteredFiles;
    }

    private orderFilesInDict(files: TFile[]) : {[key: string]: string[]} {
        const PATHS: {[key: string]: string} = {
            Anime: "Analysis/Anime/",
            Film: "Analysis/Film/",
            Books: "Analysis/Books/",
            Podcast: "Analysis/Podcast/",
            "TV Series": "Analysis/Serie TV/",
            TTRPG: "Analysis/TTRPG/",
            Videogames: "Analysis/Videogiochi/",
        }

        const outDict: {[key: string]: string[]} = {};
        for (const k of Object.keys(PATHS)) {
            const tmp = files.filter((file: TFile) => file.path.startsWith(PATHS[k]));
            outDict[k] = tmp.map((file: TFile) => file.basename);
        }

        return outDict;
    }

    private createInternalLink(parent: HTMLElement, name: string): HTMLElement {

        const internalLink = parent.createEl("li").createEl("a", {
            text: name,
        });

        internalLink.addClass("internal-link");

        internalLink.addEventListener("click", (event: MouseEvent) => {
            event.preventDefault();
            this.app.workspace.openLinkText(name, "", true);
            this.close();
        });

        return internalLink;
    }

}