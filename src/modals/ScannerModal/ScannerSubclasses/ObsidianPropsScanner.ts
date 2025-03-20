import { TFile } from "obsidian";
import { AllertLevel, ScannerABC } from "./!ScannerABC";

export class ObsidianPropsScanner extends ScannerABC {
    
    // rendering
    scannerName = "Coerenza delle proprietà tra file e template";
    allertLevel = AllertLevel.Warning;
    
    // logic
    autofix = false;

    _scan(file: TFile, content: string): boolean {
        return true;
    }

}