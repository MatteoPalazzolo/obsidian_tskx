import { requestGetText, requestGetJson } from './RequestGet';


export async function fetchSteamBanner(name: string): Promise<string[]> {

    // STEP 1 : richiesta alla funzione di search
    const url = "https://store.steampowered.com/search?"
    const params = {
        term: name,
        ignore_preferences: "1",
        ndl: "1",
    }

    const htmlText = await requestGetText(url, params);

    // STEP 2 : estrazione dei link utili
    const regex = /https:\/\/store\.steampowered\.com\/app\/(\d+)/g;
    const matches = Array.from(htmlText.matchAll(regex), (m) => m[1]);

    if (matches.length === 0) {
        return [];
    }

    return matches.map(
        gameId => `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${gameId}/header.jpg`
    );
}

export async function fetchItchioBanner(name: string): Promise<string[]> {

    // STEP 1 : richiesta alla funzione di search
    const url = "https://itch.io/search?"
    const params = {
        q: name
    }

    const htmlText = await requestGetText(url, params);
    
    // STEP 2 : estrazione dei link utili
    const regex = /https:\/\/img\.itch\.zone\/[^'"\s]+/g;
    const imgUrls = htmlText.match(regex);

    if (!imgUrls) {
        return [];
    }

    return imgUrls;

}

export async function fetchTMDbBanner(name: string): Promise<string[]> {
    const url = "https://www.themoviedb.org"
    const params = {
        query: name
    }

    const linkHtml = await requestGetText(url + "/search?", params);
    const linkRegex = /class="poster"[\s\S]*?href="(.+?)"/g;
    
    const mediaLinks = [...linkHtml.matchAll(linkRegex)].map( match => url + match[1] + "/images/backdrops" ).slice(0,5);
    
    // const imagesRegex = /class="card compact ok"[\s\S]*?src="(.+?)"/g;
    const imagesRegex = /class="card compact ok"[\s\S]*?href="(.+?)"/g;
    const imagesLinks = [];

    for (let mediaLink of mediaLinks) {
        const imagesHtml = await requestGetText(mediaLink);
        imagesLinks.push(...[...imagesHtml.matchAll(imagesRegex)].map( match => match[1] ));
    }

    return imagesLinks;

}