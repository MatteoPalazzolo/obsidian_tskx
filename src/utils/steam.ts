import {obsidianFetchGetText} from "./obsidianFetch";

/**
 * Searches for a game on Steam and returns the top 5 steam app ids.
 * @param gameTitle The title of the game to search for.
 * @param limit The maximum number of app page links to return. Defaults to 5.
 * @returns A promise that resolves to an array of steam app ids.
 */
export async function getSteamIdsFromTitle(gameTitle: string, limit: number = 5): Promise<number[]> {
	const searchUrl = "https://store.steampowered.com/search?";
	const params = {
		term: gameTitle,
		ignore_preferences: "1",
		ndl: "1",
	};

	const htmlText = await obsidianFetchGetText(searchUrl, params);

	// This regex finds links like https://store.steampowered.com/app/123456/ and captures the app ID.
	const steamAppIdRegex = /https:\/\/store\.steampowered\.com\/app\/(\d+)/g;
	return Array.from(htmlText.matchAll(steamAppIdRegex), match => match[1]).slice(0, limit).map(Number);

	// const idLinks = appIds.map(id => `https://store.steampowered.com/app/${id}`);
}
