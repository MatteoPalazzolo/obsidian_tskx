import { TFile } from "obsidian";
import { AllertLevel, ScannerABC } from "./!ScannerABC";

export class FillScanner extends ScannerABC {
    
    // rendering
    scannerName = "FILL";
    allertLevel = AllertLevel.Info;
    
    // logic
    autofix = false;

    _scan(file: TFile, content: string): boolean {
        return /#FILL/.test(content);
    }

}