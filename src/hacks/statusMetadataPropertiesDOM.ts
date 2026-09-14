import {debounce, Plugin, setIcon} from "obsidian";
import { createElInline } from "../utils/dom";
import {
	getActiveMarkdownFile,
	getActiveMarkdownView,
	getFileProps,
	getTemplateOfFile,
} from "../utils/templateAPI";
import { computeMapConformance, type MapConformanceStatus } from "../utils/mapOperations";

const STATUS_CONFIG: Record<MapConformanceStatus, { icon: string; label: string; style: Partial<CSSStyleDeclaration> }> = {
	ok:      { icon: 'circle-check-big',   label: 'Conforme al template',                    style: { color: 'var(--text-success)' } },
	extra:   { icon: 'circle-alert', label: 'Proprietà extra rispetto al template',    style: { color: 'var(--text-warning)' } },
	missing: { icon: 'circle-x',   label: 'Proprietà mancanti rispetto al template', style: { color: 'var(--text-error)' } },
};

let statusIconSpan: HTMLSpanElement | undefined;
let currentObserver: MutationObserver | undefined;

function createStatusIcon(): HTMLSpanElement {
	return createElInline('span', 'text-button-icon reconform-status-icon');
}

/**
 * Ricalcola tutto in base alla view attualmente attiva.
 * Va richiamata ad ogni cambio di leaf/file, o al cambio del metadata del file.
 */
export async function refreshIcon(): Promise<void> {
	if (!statusIconSpan) return;

	// scollega l'observer precedente, il vecchio container potrebbe non essere più quello attivo
	currentObserver?.disconnect();
	currentObserver = undefined;

	const activeView = getActiveMarkdownView();
	if (!activeView) {
		statusIconSpan.remove();
		return;
	}

	const file = getActiveMarkdownFile();
	const template = getTemplateOfFile(file);

	if (!template) {
		statusIconSpan.remove();
		return;
	}

	const currentProps = await getFileProps(file);
	const templateProps = await getFileProps(template);
	const status = computeMapConformance(currentProps, templateProps);
	const config = STATUS_CONFIG[status];

	setIcon(statusIconSpan, config.icon);
	statusIconSpan.setCssStyles(Object.assign(config.style, { marginLeft: '5px', marginRight: '0px' }));
	statusIconSpan.setAttribute('aria-label', config.label);

	// scope della ricerca: SOLO il container della view attiva, mai document globale
	const container = activeView.containerEl.querySelector('.metadata-container');
	if (!container) {
		statusIconSpan.remove();
		return;
	}

	const insertIcon = () => {
		const buttonDiv = container.querySelector('.metadata-add-button');
		if (!buttonDiv) return;
		if (buttonDiv.previousElementSibling !== statusIconSpan) {
			buttonDiv.before(statusIconSpan!);
		}
	};

	insertIcon();
	/*
	currentObserver = new MutationObserver(insertIcon);
	currentObserver.observe(container, { childList: true, subtree: true });
	*/
}

const debouncedRefreshIcon = debounce(refreshIcon, 200, true);

export function init(plugin: Plugin): void {
	statusIconSpan = createStatusIcon();

	// eventi che possono cambiare la view/file attivi
	plugin.registerEvent(
		plugin.app.workspace.on('active-leaf-change', () => void refreshIcon())
	);
	plugin.registerEvent(
		plugin.app.workspace.on('file-open', () => void refreshIcon())
	);

	// aggiorna lo stato quando cambia il metadata del file attivo
	plugin.registerEvent(
		plugin.app.metadataCache.on('changed', (changedFile) => {
			const active = getActiveMarkdownFile();
			if (changedFile.path === active?.path) {
				void debouncedRefreshIcon();
			}
		})
	);
}

export function clear(): void {
	currentObserver?.disconnect();
	currentObserver = undefined;
	statusIconSpan?.remove();
}
