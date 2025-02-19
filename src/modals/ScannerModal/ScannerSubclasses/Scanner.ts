import { Notice, TFile } from "obsidian";

export enum AllertLevel {
    Suggestion,
    Info,
    Warning,
    Error
}

export abstract class ScannerABC {
    
    abstract readonly scannerName: string;
    abstract readonly allertLevel: AllertLevel;
    abstract readonly autofix: boolean;

    positive: TFile[] = [];

    constructor() {

    }

    scan(file: TFile, content: string): boolean {
        if (this._scan(file, content)) {
            this.positive.push(file);
            return true;
        }
        return false;
    }

    fix(): boolean {
        if (!this.autofix) {
            new Notice("ERROR: autofix not avaliable!");
            return false;
        }
        return this._fix();
    }

    render(parent: HTMLElement) {
        console.log(this.positive);
        const detailsEl = parent.createEl("details");
        const itemsElList = this.positive.map( f => detailsEl.createSpan({ text: f.name }) );
    }

    abstract _scan(file: TFile, content: string): boolean;
    abstract _fix(): boolean;

}