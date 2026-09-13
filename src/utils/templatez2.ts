import { Plugin, TAbstractFile, TFile } from "obsidian";
import { delay } from "./delay";

export async function registerTemplatezListener(this: Plugin) {
	await delay(300);

	this.registerEvent(
		this.app.vault.on("create", async file => {
			if (!(file instanceof TFile) || file.extension !== "md") return;

			// NOTA: create si triggera ad ogni avvio dell'app, non solo quando viene creato un nuovo file
			if (file.name.startsWith("Untitled") && file.stat.size === 0) {
				templetizeFile.call(this, file);
			}
		})
	);
}

export function getTemplateOfFile(this: Plugin, file: TFile): TFile | undefined {
	if (file.extension !== "md") return;

	let f: TAbstractFile = file;
	while (f.parent) {
		f = f.parent;
		const folderPath = f.path === "/" ? "" : f.path + "/";
		const templateFile = this.app.vault.getAbstractFileByPath(folderPath + "!Template.md");

		if (templateFile instanceof TFile && templateFile.path !== file.path) {
			return templateFile;
		}
	}
}

/**
 * Ottiene le proprietà di un file in modo síncrono sfruttando la cache di Obsidian.
 */
export function getFileProps(this: Plugin, file: TFile): Record<string, any> | undefined {
	return this.app.metadataCache.getFileCache(file)?.frontmatter;
}

export async function templetizeFile(this: Plugin, file: TFile) {
	const templateFile = getTemplateOfFile.call(this, file);
	if (!templateFile) return;

	// Se vuoi copiare il contenuto grezzo:
	const templateContent = await this.app.vault.read(templateFile);
	await this.app.vault.modify(file, templateContent);

	// NOTA: Se volessi applicare solo/anche le proprietà del template in modo sicuro:
	// const templateProps = getFileProps.call(this, templateFile);
	// if (templateProps) {
	//     await this.app.fileManager.processFrontMatter(file, (fm) => {
	//         Object.assign(fm, templateProps);
	//     });
	// }
}

/**
 * Valida la coerenza tra template síncronamente usando la metadataCache.
 */
export function isTemplateCoherentToParentTemplate(
	this: Plugin,
	templateFile: TFile
): { isValid: boolean, neededProps: Set<string>, extraProps: Set<string> } {

	const parentTemplateFile = getTemplateOfFile.call(this, templateFile);
	if (!parentTemplateFile) {
		return { isValid: true, neededProps: new Set(), extraProps: new Set() };
	}

	// Lettura istantanea dalla cache
	const templateProps = getFileProps.call(this, templateFile) ?? {};
	const parentProps = getFileProps.call(this, parentTemplateFile) ?? {};

	const templatePropsSet = new Set(Object.keys(templateProps));
	const parentPropsSet = new Set(Object.keys(parentProps));

	// Rimuove 'position' che è una chiave inserita automaticamente da Obsidian nella cache
	templatePropsSet.delete('position');
	parentPropsSet.delete('position');

	const intersection = parentPropsSet.intersection(templatePropsSet);

	return {
		isValid: parentPropsSet.isSubsetOf(templatePropsSet),
		neededProps: parentPropsSet.difference(intersection),
		extraProps: templatePropsSet.difference(intersection),
	};
}
