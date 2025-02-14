import { Plugin, TAbstractFile, TFile } from "obsidian";
import { delay } from "./delay";

export async function registerTemplatezListener(this: Plugin) {
    // wait a bit to avoid event trigger on file loaded from the valut
    await delay(300); 
    
    this.app.vault.on("create", async file => {
        if (!(file instanceof TFile) || file.extension !== "md") {
            return;
        }
        const content = await this.app.vault.read(file);
        if (file.name.startsWith("Untitled") && content === "") {
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

        if (templateFile !== null && templateFile instanceof TFile) {
            const templateContent = await this.app.vault.read(templateFile);
            this.app.vault.modify(file, templateContent);
            break;
        }

    }
    
}

export function escapeFilePropertyStrings(s: string): string {
    if (s.includes(":")) {
        if (!s.includes('"')) {
            return `"${s}"`;
        }
        else if (!s.includes("'")) {
            return `'${s}'`;
        } 
        else {
            return `"${s.replace(/"/g, '\\\"')}"`;
        }
    }
    if (s.startsWith("'")) {
        if (!s.includes('"')) {
            return `"${s}"`;
        } 
        else {
            return `"${s.replace(/"/g, '\\\"')}"`;
        }
    } 
    else if (s.startsWith('"')) {
        if (!s.includes("'")) {
            return `'${s}'`;
        } 
        else {
            return `"${s.replace(/"/g, '\\\"')}"`;
        }
    }
    else if (s.startsWith("`")) {
        if (!s.includes('"')) {
            return `"${s}"`;
        }
        else if (!s.includes("'")) {
            return `'${s}'`;
        } 
        else {
            return `"${s.replace(/"/g, '\\\"')}"`;
        }
    }
    else {
        return s;
    }

}

