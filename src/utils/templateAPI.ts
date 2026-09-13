import {MarkdownView, Plugin, TAbstractFile, TFile} from "obsidian";

let ctx: Plugin | undefined;

export function init(context: Plugin): void {
	if (!context) {
		throw new Error("PluginContext init failed! Invalid context.");
	}
	ctx = context;
}

function getCtx(): Plugin {
	if (!ctx) {
		throw new Error("PluginContext non inizializzato! Chiama init(this) nel metodo onload().");
	}
	return ctx;
}

export async function registerTemplatezListener() {
	getCtx().registerEvent(
		getCtx().app.vault.on("create", async file => {
			if (!(file instanceof TFile) || file.extension !== "md") return;

			// NOTA: create si triggera ad ogni avvio dell'app, non solo quando viene creato un nuovo file
			if (file.name.startsWith("Untitled") && file.stat.size === 0) {
				await templetizeFile(file);
			}
		})
	);
}

export function getTemplateOfFile(file: TFile): TFile | undefined {
	if (file.extension !== "md") return;

	let f: TAbstractFile = file;
	while (f.parent) {
		f = f.parent;
		const folderPath = f.path === "/" ? "" : f.path + "/";
		const templateFile = getCtx().app.vault.getAbstractFileByPath(folderPath + "!Template.md");

		if (templateFile instanceof TFile && templateFile.path !== file.path) {
			return templateFile;
		}
	}
}

export function getTemplateOfCurrentFile(): TFile | undefined  {
	let activeFile = getCtx().app.workspace.getActiveFile() ?? undefined;

	if (!activeFile) {
		const markdownView = getCtx().app.workspace.getActiveViewOfType(MarkdownView);
		activeFile = markdownView?.file ?? undefined;
	}

	console.log("Active file:", activeFile);
	if (!activeFile) return;
	return getTemplateOfFile(activeFile);
}

/**
 * Ottiene le proprietà di un file in modo síncrono sfruttando la cache di Obsidian.
 */
export function getFileProps(file: TFile): Record<string, any> | undefined {
	return getCtx().app.metadataCache.getFileCache(file)?.frontmatter;
}

export async function templetizeFile(file: TFile) {
	const templateFile = getTemplateOfFile(file);
	if (!templateFile) return;

	// Se vuoi copiare il contenuto grezzo:
	const templateContent = await getCtx().app.vault.read(templateFile);
	await getCtx().app.vault.modify(file, templateContent);

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
	templateFile: TFile
): { isValid: boolean, neededProps: Set<string>, extraProps: Set<string> } {

	const parentTemplateFile = getTemplateOfFile(templateFile);
	if (!parentTemplateFile) {
		return { isValid: true, neededProps: new Set(), extraProps: new Set() };
	}

	// Lettura istantanea dalla cache
	const templateProps = getFileProps(templateFile) ?? {};
	const parentProps = getFileProps(parentTemplateFile) ?? {};

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
