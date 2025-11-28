import { Plugin, TAbstractFile, TFile } from "obsidian";
import { parse, stringify } from 'yaml';
import { delay } from "./delay";


/**
 * [THIS] Registra il listener che permette di popolare un file alla creazione con il contenuto del rispettivo template.
 *
 * @returns
 */
export async function registerTemplatezListener(this: Plugin) {

    // wait a bit to avoid event trigger on ALL THE FILES loaded from the valut
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

/**
 * [THIS] Ottiene il template relativo al file richiesto.
 *
 * @param {TFile} file - File di cui cercare il template.
 * @returns {Promise<TFile | undefined>} File del template.
 */
export function getTemplateOfFile(this: Plugin, file: TFile): TFile | undefined {
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

        if (templateFile !== null && templateFile instanceof TFile && templateFile.path !== file.path) {
            return templateFile;
        }
    }

}

/**
 * [THIS] Ottiene il file del template relativo al file richiesto.
 *
 * @param {TFile} file - File di cui estrarre le props.
 * @returns {Promise<TFile | undefined>} Mappa contenente le proprietà del file.
 */
export async function getFilePropsAsMap(this: Plugin, file: TFile): Promise<Map<string, any>> {
    if (!file) {
		console.warn("WARNING: no file");
		return new Map<string, any>();
	}

	const fileContent = await this.app.vault.read(file);

    if (!fileContent.startsWith("---\n")) {
        console.warn("WARNING: the file is missing the property section");
        return new Map<string, any>();
    }

    if (/^---\s*?\n---/.test(fileContent)) {
        console.warn("WARNING: the property section is empty");
        return new Map<string, any>();
    }

	const yamlData = fileContent.split("---\n")[1];
	const mapData: Map<string,any> = parse(yamlData, {mapAsMap: true});

    return mapData;
}

/**
 * [THIS] Replace file content with its template.
 *
 * @param {TAbstractFile} file - File di cui cercare e applicare il proprio template.
 * @returns
 */
export async function templetizeFile(this: Plugin, file: TAbstractFile) {
    if (!(file instanceof TFile) || file.extension !== "md") {
        return;
    }
    const templateFile = await getTemplateOfFile.call(this, file);
    if (templateFile) {
        const templateContent = await this.app.vault.read(templateFile);
        await this.app.vault.modify(file, templateContent);
    }
}

/**
 * Conforma una stringa con la convenzione delle proprietà di Obsidian per evitare errori.
 *
 * @param {string} s - Stringa di cui fare l'escape.
 * @returns {string} Escaped string.
 */
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

/**
 * [THIS] Valida un !Template controllando la coerenza delle proprietà col parent.
 *
 * @param {TFile} templateFile - File del !Template da validare.
 * @returns {Promise<Boolean>} - Is coerente.
 */
export async function isTemplateCoherentToParentTemplate(this: Plugin, templateFile: TFile): Promise<{ isValid: boolean, neededProps: Set<string>, extraProps: Set<string> }> {

	const parentTemplateFile: TFile | undefined = getTemplateOfFile.call(this,templateFile);
	if (parentTemplateFile === undefined)
		return {
			isValid: true,
			neededProps: new Set<string>(),
			extraProps: new Set<string>(),
		};

	const templatePropsMap: Map<string,any> = await getFilePropsAsMap.call(this,templateFile);
	const parentPropsMap: Map<string,any> = await getFilePropsAsMap.call(this,parentTemplateFile);

	const templatePropsSet: Set<string> = new Set(templatePropsMap.keys());
	const parentPropsSet: Set<string> = new Set<string>(parentPropsMap.keys());
	const intersection = parentPropsSet.intersection(templatePropsSet);

	return {
		isValid: parentPropsSet.isSubsetOf(templatePropsSet),
		neededProps: parentPropsSet.difference(intersection),
		extraProps: templatePropsSet.difference(intersection),
	};

}

