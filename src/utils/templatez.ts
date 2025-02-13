import { Plugin, TAbstractFile, TFile } from "obsidian";
import { delay } from "./delay";

export async function registerTemplatezListener(this: Plugin) {
    // wait a bit to avoid event trigger on file loaded from the valut
    await delay(300); 
    
    this.app.vault.on("create", file => {
        if (file.name.startsWith("Untitled") && file instanceof TFile) {
            templetizeFile.call(this, file);
        }
    });

}

export async function templetizeFile(this: Plugin, file: TAbstractFile) {
    if (!(file instanceof TFile) || file.extension !== "md") {
        return;
    }

    let f: TAbstractFile = file;
    while (true) {

        if (f.parent) {
            f = f.parent
        } else {
            break;
        }

        const folderPath = f.path === "/" ? "" : f.path + "/";
        const templateFile = this.app.vault.getAbstractFileByPath(folderPath + "!Template.md");
        if (templateFile === null || !(templateFile instanceof TFile)) {
            continue;
        } else {
            const templateContent = await this.app.vault.read(templateFile);
            await this.app.vault.modify(file, templateContent);
            break;
        }

    }
    
}