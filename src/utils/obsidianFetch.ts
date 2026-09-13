import { requestUrl } from 'obsidian';

// Helper privato per costruire l'URL con i parametri
function buildUrl(url: string, params: Record<string, any>): string {
	const urlObj = new URL(url);
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null) {
			urlObj.searchParams.append(key, String(value));
		}
	});
	return urlObj.toString();
}

/**
 * Funzione base per le richieste Obsidian
 */
async function baseRequest(url: string, params = {}, headers = {}) {
	const finalUrl = buildUrl(url, params);

	try {
		const response = await requestUrl({
			url: finalUrl,
			method: "GET",
			headers: {
				"Accept": "application/json", // Default utile
				...headers
			}
		});

		if (response.status < 200 || response.status >= 300) {
			console.error(`Request failed with status ${response.status}:`, finalUrl);
			return null;
		}

		return response;
	} catch (error) {
		console.error("ObsidianFetch Error:", error);
		return null;
	}
}

// --- Funzioni esportate ---

export async function obsidianFetchGetText(url: string, params = {}, headers = {}): Promise<string> {
	const res = await baseRequest(url, params, headers);
	return res?.text || "";
}

export async function obsidianFetchGetJson<T>(url: string, params = {}, headers = {}): Promise<T | null> {
	const res = await baseRequest(url, params, headers);
	return res ? (res.json as T) : null;
}
