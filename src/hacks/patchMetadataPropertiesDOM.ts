import {Plugin, setIcon} from "obsidian";
import {createElInline} from "../utils/dom";
import {getTemplateOfCurrentFile} from "../utils/templateAPI";

let controller = new AbortController();
let observer: MutationObserver | undefined;
let reconformButtonDiv: HTMLDivElement | undefined;

export function init(): void {
	const templatePath = getTemplateOfCurrentFile()?.path ?? "";
	reconformButtonDiv = createElInline('div', 'metadata-add-button text-icon-button', {'aria-label': templatePath}, [
		createElInline('span', 'text-button-icon', undefined, undefined, el => setIcon(el, 'list-restart')),
		createElInline('span', 'text-button-label', undefined, 'Reconform from Template')
	]);
}

export function bind() {
	if (!reconformButtonDiv) {
		throw new Error("reconformButtonDiv non inizializzato! Chiama init(this) nel metodo onload().");
	}

	const container = document.querySelector('.metadata-container');
	if (!container) {
		throw new Error("'.metadata-container' non trovato!");
	}

	reconformButtonDiv.addEventListener('click', () => {
		console.log("AIUTO!!!")
	}, { signal: controller.signal });

	const ensureButtonInserted = () => {
		if (!reconformButtonDiv) {
			throw new Error("reconformButtonDiv non inizializzato! Chiama init(this) nel metodo onload().");
		}

		const contentDiv = container.querySelector('.metadata-content');
		if (!contentDiv) {
			throw new Error("'.metadata-content' non trovato!");
		}
		if (contentDiv && !contentDiv.contains(reconformButtonDiv)) {
			contentDiv.append(reconformButtonDiv);
		}
	};

	ensureButtonInserted();
	// assicura il reinserimento nel caso in cui venga rimosso dal DOM (es. cambio di nota)
	observer = new MutationObserver(ensureButtonInserted);
	observer.observe(container, { childList: true, subtree: true });
}

export function clear() {
	if (!reconformButtonDiv) {
		throw new Error("reconformButtonDiv non inizializzato! Chiama init(this) nel metodo onload().");
	}

	if (observer) {
		observer.disconnect();
		observer = undefined;
	}

	controller.abort();
	controller = new AbortController();

	reconformButtonDiv.remove();
}
