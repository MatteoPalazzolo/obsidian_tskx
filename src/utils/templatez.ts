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

export async function getTemplateOfFile(this: Plugin, file: TFile): Promise<TFile | undefined> {
    if (file.extension !== "md") {
        return;
    }

    let f: TAbstractFile = file;
    while (true) {

        if (f.parent) {
            f = f.parent;
        } else {
            return;
        }

        const folderPath = f.path === "/" ? "" : f.path + "/";
        const templateFile = this.app.vault.getAbstractFileByPath(folderPath + "!Template.md");

        if (templateFile !== null && templateFile instanceof TFile) {
            return templateFile;
        }
    }

}

export async function getFilePropsAsObject(this: Plugin, file: TFile): Promise<Record<string, any>> {
    const fileContent = await this.app.vault.read(file);

    if (!fileContent.startsWith("---")) {
        console.warn("WARNING: the file is missing the property section");
        return {};
    }

    if (/^---[\s]*?\n---/.test(fileContent)) {
        console.warn("WARNING: the property section is empty");
        return {};
    }

    // prendi le proprietà riconoscendone il tipo di dato
    // TODO: molto complesso, forse è meglio farlo con un cliclo for alla vecchia maniera

    return {};
}

export async function templetizeFile(this: Plugin, file: TAbstractFile) {
    if (!(file instanceof TFile) || file.extension !== "md") {
        return;
    }
    const templateFile = getTemplateOfFile.call(this, file);
    if (templateFile) {
        const templateContent = await this.app.vault.read(templateFile);
        this.app.vault.modify(file, templateContent);
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

