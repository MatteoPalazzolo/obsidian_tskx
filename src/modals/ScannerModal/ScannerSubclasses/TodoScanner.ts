import { TFile } from "obsidian";
import { AllertLevel, ScannerABC } from "./Scanner";

export class TodoScanner extends ScannerABC {
    scannerName = "TODO";
    allertLevel = AllertLevel.Info;
    autofix     = false;

    constructor() {
        super();
    }

    _scan(file: TFile, content: string): boolean {
        if (/#FILL/.test(content)) {
            console.log(/#FILL/.test(content))
        }
        return /#FILL/.test(content);
    }
    
    _fix(): boolean {
        return false;
    }

}