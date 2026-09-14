
export function mergeSecondOnFirstMap(
	templateMap: Map<string, any>,
	fileMap: Map<string, any>,
	tail = true
): Map<string, any> {
	const merged = new Map<string, any>();

	// 1. Inserisce prima le proprietà del TEMPLATE (mantenendo il loro ordine)
	for (const [key, templateValue] of templateMap.entries()) {
		if (fileMap.has(key)) {
			// Se il file ha un valore per questa chiave, usa quello del file
			merged.set(key, fileMap.get(key));
		} else {
			// Altrimenti usa il valore di default del template
			merged.set(key, templateValue);
		}
	}

	if (!tail)
		return merged;

	// 2. Accoda in fondo le proprietà del FILE che NON esistono nel template
	for (const [key, fileValue] of fileMap.entries()) {
		if (!merged.has(key)) {
			merged.set(key, fileValue);
		}
	}

	return merged;
}

export type MapConformanceStatus = 'ok' | 'extra' | 'missing';

export function computeMapConformance(
	currentProps: Map<string, unknown>,
	templateProps: Map<string, unknown>
): MapConformanceStatus {
	const currentKeys = new Set(currentProps.keys());
	const templateKeys = new Set(templateProps.keys());

	const hasMissing = [...templateKeys].some(k => !currentKeys.has(k));
	if (hasMissing) return 'missing';

	const hasExtra = [...currentKeys].some(k => !templateKeys.has(k));
	if (hasExtra) return 'extra';

	return 'ok';
}
