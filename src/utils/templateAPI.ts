import {MarkdownView, Plugin, TAbstractFile, TFile} from "obsidian";
import {isPair, isScalar, parseDocument, Document as Doc} from 'yaml';

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
				await applyTemplateToNewFile(file);
			}
		})
	);
}

export function getTemplateOfFile(file: TFile | undefined): TFile | undefined {
	if (!file) return;

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

export function getActiveMarkdownView() {
	return getCtx().app.workspace.getActiveViewOfType(MarkdownView);
}

export function getActiveMarkdownFile() {
	return getActiveMarkdownView()?.file ?? undefined;
}

export function getFilePropsUnsorted(file: TFile | undefined): Record<string, any> | undefined {
	if (!file) return;
	return getCtx().app.metadataCache.getFileCache(file)?.frontmatter;
}

export async function getFileProps(file: TFile | undefined): Promise<Map<string, any>> {
	if (!file) return new Map();

	const content = await this.app.vault.read(file);
	const doc = parseDocument(content);
	const items = doc.contents;

	const map = new Map<string, any>();
	// 3. Verifica se il frontmatter (Root YAML) esiste ed è una Mappa/Oggetto
	if (items && 'items' in items && Array.isArray(items.items)) {
		for (const pair of items.items) {
			// Verifica che l'elemento sia una coppia chiave-valore YAML valida
			if (isPair(pair) && pair.key) {
				// Estrai la chiave come stringa
				const key = isScalar(pair.key) ? String(pair.key.value) : String(pair.key);

				// Converti il valore del nodo in un tipo JavaScript nativo
				const value = pair.value ? pair.value.toJSON() : null;

				// Inserisci nella Map (mantiene l'ordine esatto di lettura)
				map.set(key, value);
			}
		}
	}

	return map;
}

export async function setFileProps(file: TFile | undefined, newPropsMap: Map<string, any>) {
	if (!file) return;

	const doc = new Doc(newPropsMap);

	for (const [key, value] of Object.entries(newPropsMap)) {
		doc.set(key, value);
	}

	console.log(doc);

	const newFrontmatterStr = `---\n${doc.toString()}---`;

	console.log(newFrontmatterStr);

	const rawContent = await this.app.vault.read(file);
	const markdownBody = rawContent.replace(/^---[\s\S]*?---\n?/, '');
	const finalContent = `${newFrontmatterStr}\n${markdownBody}`;

	await this.app.vault.modify(file, finalContent);

}

export async function applyTemplateToNewFile(file: TFile) {
	const templateFile = getTemplateOfFile(file);
	if (!templateFile) return;

	const templateContent = await getCtx().app.vault.read(templateFile);
	await getCtx().app.vault.modify(file, templateContent);

}

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


// ESISTE SOLO PER COMPATIBILITà COL SUPPORTO DI SPOTIFY
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
