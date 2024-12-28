import { Modal, Notice, TFile } from "obsidian";
import { LinkProcessorSettings } from "src/types";


export abstract class LinkProcessor<T> {

    thisModal: Modal;
    title: string;
    settings: LinkProcessorSettings;
    link: string;
    ansContainerEl: HTMLDivElement;

    constructor(
        thisModal: Modal,
        title: string,
        settings: LinkProcessorSettings,
        link: string,
        ansContainerEl: HTMLDivElement
    ) {
        this.thisModal = thisModal;
        this.title = title;
        this.settings = settings;
        this.link = link;
        this.ansContainerEl = ansContainerEl;
    }

    private isFilenameAvaliable(filename: string, path: string): boolean {
        return this.thisModal.app.vault.getFiles().filter(file => file.basename === filename && file.path.startsWith(path)).length === 0;
    }

    async processLink() {

        this.ansContainerEl.empty();

        let out: { filename: string, data: T } | undefined;
        
        try {
            out = await this.getDataFromLink();
        }  catch (error) {
            new Notice("ERROR: data fetching failed")
            console.error("an error occurred while fetching data:", error);
            return;
        }

        if (!out) {
            return;
        }
        const { data, filename } = out;

        this.ansContainerEl.createEl('h4', { text: this.title });

        const inputDiv = this.ansContainerEl.createDiv({ cls: 'input-div' });

        // Filename Input
        inputDiv.createEl('h6', { text: "Filename" });
        const fileNameInput = inputDiv.createEl('input', {
            type: 'text', cls: 'text-input-class' + (this.isFilenameAvaliable(filename, this.settings.destinationFolder) ? '' : ' error'),
            value: filename, placeholder: "File Name"
        });
        fileNameInput.addEventListener('input', evt => {
            if (this.isFilenameAvaliable(fileNameInput.value.trim(), this.settings.destinationFolder)) {
                fileNameInput.classList.remove('error');
            } else {
                fileNameInput.classList.add('error');
            }
        });

        // Details Text
        ["```DETAILS", ...this.formatData(data), "```"].forEach(e =>
            this.ansContainerEl.createDiv({
                cls: 'show-details-div'
            }).createSpan({
                text: e
            })
        );

        // Commit Button
        this.ansContainerEl.createDiv(
            { cls: 'confirm-note-creation-div' }
        ).createEl('button',
            { text: 'Sure Af Dude', cls: 'mod-warning' }
        ).addEventListener('click', async () => {
            if (!this.isFilenameAvaliable(fileNameInput.value, this.settings.destinationFolder)) {
                new Notice("ERROR: File Already Exists!")
                return;
            }
            await this.commit(fileNameInput.value, data);
            this.thisModal.close();
        });

    }

    private async commit(filename: string, ans: T) {

        const forbiddenCharsRegex = /[*"\/<>:|?]{1}/g;
        const newFilePath = this.settings.destinationFolder + filename.trim().replace(forbiddenCharsRegex, "_") + ".md";

        const file = this.thisModal.app.vault.getAbstractFileByPath(this.settings.templateFilePath);

        if (!file || !(file instanceof TFile)) {
            new Notice(this.settings.templateFilePath + " NOT FOUND!");
            return;
        }
        
        const templateContent = await this.thisModal.app.vault.cachedRead(file);
        const newFileContent = this.processTemplate(templateContent, ans);

        const newFile = await this.thisModal.app.vault.create(newFilePath, newFileContent).catch((error: Error) => {
            new Notice("Failed to create note:\n" + error.message.split("\n")[0])
            console.error(error);
        });

        if (newFile) {
            this.thisModal.app.workspace.getLeaf(false).openFile(newFile);
        }
    }

    abstract getDataFromLink(): Promise<{ filename: string, data: T } | undefined>;

    abstract formatData(data: T): string[];  

    abstract processTemplate(templateContent: string, data: T): string;

}