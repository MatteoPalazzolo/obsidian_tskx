
export function createElInline<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className?: string,
	customData?: { [k:string]: string },
	content?: string | Node | (string | Node)[],
	callback?: (el: HTMLElementTagNameMap[K]) => void
): HTMLElementTagNameMap[K] {
	const el = document.createElement(tag);

	if (className) el.className = className;

	if (customData) {
		Object.entries(customData).forEach(([chiave, valore]) => {
			console.log(chiave, valore);
			el.setAttribute(chiave, valore);
		});
	}

	if (content) {
		if (Array.isArray(content)) {
			el.append(...content);
		} else {
			el.append(content);
		}
	}

	if (callback) {
		callback(el);
	}

	return el;
}
