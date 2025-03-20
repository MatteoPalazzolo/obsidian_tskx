import { App, Modal, TFile } from 'obsidian';
import { ScannerABC } from './ScannerSubclasses/!ScannerABC';
import { TodoScanner } from './ScannerSubclasses/TodoScanner';
import { FillScanner } from './ScannerSubclasses/FillScanner';
import { ObsidianPropsScanner } from './ScannerSubclasses/ObsidianPropsScanner';


const ANALYSIS_PATH = "!MediaAnalysis";

export class ScannerModal extends Modal {
    
    scannerList: ScannerABC[];

    constructor(app: App) {
        super(app);
        this.scannerList = [
            new TodoScanner(this),
            new FillScanner(this),
            new ObsidianPropsScanner(this),
        ]
    }  

    async onOpen() {
        const { contentEl } = this;
        contentEl.addClass("ScannerModal");
        contentEl.createEl('h3', { text: 'Scanner' });             
        
        await this.runAllScanner();
        this.scannerList.forEach( 
            scanner => scanner.render(contentEl)
        );

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private async runAllScanner() {
        const files = this.app.vault.getFiles().filter(
            (file: TFile) => file.path.startsWith(ANALYSIS_PATH + "/")
        );
        for (const f of files) {
            const content = await this.app.vault.read(f);
            for (const scanner of this.scannerList) {
                scanner.scan(f, content);
            }
        }
    }

}