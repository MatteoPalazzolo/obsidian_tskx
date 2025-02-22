import { App, Modal, Notice, setIcon, TFile } from "obsidian";

export enum AllertLevel {
    Suggestion,
    Info,
    Warning,
    Error
}

type AllertLevelStyle = { className: string, primaryColor: string, secondaryColor: string, iconName: string }
const ALLERT_LEVEL_STYLE: Record<AllertLevel, AllertLevelStyle> = {
    [AllertLevel.Suggestion]: {
        className: "suggestion",
        primaryColor: "#a3e635", // Verde chiaro (Suggerimento)
        secondaryColor: "#65a30d", // Verde scuro
        iconName: "message-circle-more"
    },
    [AllertLevel.Info]: {
        className: "info",
        primaryColor: "#3b82f6", // Blu acceso (Informazione)
        secondaryColor: "#1e40af", // Blu scuro
        iconName: "info"
    },
    [AllertLevel.Warning]: {
        className: "warning",
        primaryColor: "#facc15", // Giallo (Attenzione)
        secondaryColor: "#b45309", // Arancione scuro
        iconName: "triangle-alert"
    },
    [AllertLevel.Error]: {
        className: "error",
        primaryColor: "#ef4444", // Rosso acceso (Errore)
        secondaryColor: "#991b1b", // Rosso scuro
        iconName: "circle-x"
    }
};


export abstract class ScannerABC {
    
    // rendering
    abstract readonly scannerName: string;
    abstract readonly allertLevel: AllertLevel;

    // logic
    abstract readonly autofix: boolean;
    positive: TFile[] = [];
    modal: Modal;

    constructor(modal: Modal) {
        this.modal = modal;
    }

    scan(file: TFile, content: string): boolean {
        if (this._scan(file, content)) {
            //TODO: ignora i !Template.md
            this.positive.push(file);
            return true;
        }
        return false;
    }

    fix(target: TFile): boolean {
        new Notice("ERROR: autofix not avaliable!");
        throw new Error("ERROR: autofix not avaliable!");
    }

    render(parent: HTMLElement) {
        
        const {
            className,
            primaryColor,
            secondaryColor,
            iconName
        } = ALLERT_LEVEL_STYLE[this.allertLevel];

        const detailsEl = parent.createEl("details", { cls: className });
        detailsEl.style.setProperty("--main-color", primaryColor);
        detailsEl.style.setProperty("--side-color", secondaryColor);

        const summaryEl = detailsEl.createEl("summary");
        setIcon(summaryEl, iconName);
        summaryEl.createSpan({ text: this.scannerName, cls: 'title' })

        const counter = this.positive.length < 10 ? '0'+this.positive.length : ''+this.positive.length;
        summaryEl.createSpan({ text: counter, cls: 'clickable-icon' });

        if (this.autofix) {
            const fixBtnEl = summaryEl.createSpan({ cls: 'clickable-icon btn-fix' });
            setIcon(fixBtnEl, "recycle");
            fixBtnEl.onclick = e => {
                e.preventDefault();
                this.positive.forEach( f => this.fix(f) );
                this.modal.close();
            }
        }
        
        this.positive.
            filter( f => f.name !== "!Template.md" ).
            // sort by name in ascending order 
            // https://stackoverflow.com/questions/43311121/sort-an-array-of-objects-in-typescript
            sort((a, b) => (a.name < b.name ? -1 : 1)).
            forEach( f => {
                const itemEl = detailsEl.createDiv({ cls: 'item-container' });
                const fileNameEl = itemEl.createEl("a", { text: f.name.slice(0,-3), cls: 'internal-link name' });

                fileNameEl.onclick = e => {
                    e.preventDefault();
                    this.modal.app.workspace.openLinkText(f.name, f.path, false);
                    this.modal.close();
                }

                if (this.autofix) {
                    const fixBtnEl = itemEl.createSpan({ cls: 'btn-fix clickable-icon' });
                    setIcon(fixBtnEl, "recycle");
                    fixBtnEl.onclick = e => {
                        e.preventDefault();
                        this.fix(f);
                        this.modal.close();
                    }
                }

            });

    }

    abstract _scan(file: TFile, content: string): boolean;

}