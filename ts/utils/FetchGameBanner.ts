import { requestUrl } from 'obsidian';

export async function fetchGameBanner(gameName:string): Promise<string[]> {

    const url = "https://store.steampowered.com/search?"
    const params = {
        term: gameName,
        ignore_preferences: "1",
        ndl: "1",
    }
    
    const response = await requestUrl({
        url: url + new URLSearchParams(params).toString(),
        method: "GET"
    });
    
    if (response.status !== 200) {
        console.error("Failed to fetch game data from Steam:", response.status);
        return [];
    }

    const htmlText = response.text;

    const regex = /https:\/\/store\.steampowered\.com\/app\/(\d+)/g;
    const matches = Array.from(htmlText.matchAll(regex), (m) => m[1]);

    if (matches.length === 0) {
        return [];
    }

    return matches.map(
        gameId => `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${gameId}/header.jpg`
    );
}