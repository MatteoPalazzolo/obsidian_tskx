import { MarkdownView, Plugin, setIcon, WorkspaceLeaf } from "obsidian";
import { createElInline } from "../utils/dom";
import {
	getActiveMarkdownFile, getActiveMarkdownView,
	getFileProps,
	getTemplateOfFile,
	setFileProps,
} from "../utils/templateAPI";
import { mergeSecondOnFirstMap, computeMapConformance, type MapConformanceStatus } from "../utils/mapOperations";

let reconformButtonDiv: HTMLDivElement | undefined;
let currentObserver: MutationObserver | undefined;

function createButton(): HTMLDivElement {
	const btn = createElInline('div', 'metadata-add-button text-icon-button', undefined, [
		createElInline('span', 'text-button-icon', undefined, undefined, el => setIcon(el, 'list-restart')),
		createElInline('span', 'text-button-label', undefined, 'Reconform from Template')
	]);

	btn.addEventListener('click', async () => {
		const file = getActiveMarkdownFile();
		const template = getTemplateOfFile(file);
		if (!template) return;

		const currentProps = await getFileProps(file);
		const templateProps = await getFileProps(template);
		const merged = mergeSecondOnFirstMap(templateProps, currentProps);

		await setFileProps(file, merged);
	});

	return btn;
}

/**
 * Ricalcola tutto in base alla view attualmente attiva.
 * Va richiamata ad ogni cambio di leaf/file.
 */
export function refreshButton(): void {
	if (!reconformButtonDiv) return;

	// scollega l'observer precedente, il vecchio container potrebbe non essere più quello attivo
	currentObserver?.disconnect();
	currentObserver = undefined;

	const activeView = getActiveMarkdownView();
	if (!activeView) {
		reconformButtonDiv.remove();
		return;
	}

	const file = getActiveMarkdownFile();
	const template = getTemplateOfFile(file);

	if (!template) {
		reconformButtonDiv.remove();
		return;
	}

	reconformButtonDiv.setAttribute('aria-label', template.path);

	// scope della ricerca: SOLO il container della view attiva, mai document globale
	const container = activeView.containerEl.querySelector('.metadata-container');
	if (!container) {
		reconformButtonDiv.remove();
		return;
	}

	const insertButton = () => {
		const contentDiv = container.querySelector('.metadata-content');
		if (!contentDiv) return;
		if (contentDiv && !contentDiv.contains(reconformButtonDiv!)) {
			contentDiv.append(reconformButtonDiv!);
		}
	};

	insertButton();

	/*
	currentObserver = new MutationObserver(insertButton);
	currentObserver.observe(container, { childList: true, subtree: true });
	*/
}

export function init(plugin: Plugin): void {
	reconformButtonDiv = createButton();

	// eventi che possono cambiare la view/file attivi
	plugin.registerEvent(
		plugin.app.workspace.on('active-leaf-change', () => refreshButton())
	);
	plugin.registerEvent(
		plugin.app.workspace.on('file-open', () => refreshButton())
	);
}

export function clear(): void {
	currentObserver?.disconnect();
	currentObserver = undefined;
	reconformButtonDiv?.remove();
}
