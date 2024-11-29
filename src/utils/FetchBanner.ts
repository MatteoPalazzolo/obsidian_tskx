import { requestGetText, requestGetJson } from './RequestGet';

export async function fetchSteamBanner(name: string): Promise<string[][]> {
    // 1) steam impedisce di accedere alle pagine +18 senza un account --> 
    //    questa funzione non ritorna le immagini di quel tipo di giochi

    // STEP 1 : richiesta alla funzione di search
    const url = "https://store.steampowered.com/search?";
    const params = {
        term: name,
        ignore_preferences: "1",
        ndl: "1",
    };
    const htmlText = await requestGetText(url, params);

    // STEP 2 : altro
    const idRegex = /https:\/\/store\.steampowered\.com\/app\/\d+/g;
    const idLinks = Array.from(htmlText.matchAll(idRegex), match => match[0]).slice(0,5);
    
    console.groupCollapsed(idLinks.length)
    console.log(htmlText);
    console.log(idLinks);
    console.groupEnd()

    const imagesRegex = /href="[^"]*(https:\/\/shared.fastly.steamstatic.com\/store_item_assets\/steam\/apps\/[^"]*.jpg)[^"]*"/g;
    const imagesLinks: string[][] = [];

    for (let idLink of idLinks) {
        const imagesHtml = await requestGetText(idLink);
        const imageLinks = Array.from(imagesHtml.matchAll(imagesRegex), match => match[1]);

        console.groupCollapsed(imageLinks.length + " " + idLink)
        console.log(imagesHtml);
        console.log(imageLinks);
        console.groupEnd()

        imagesLinks.push(imageLinks);
    }

    return imagesLinks;
}

export async function fetchItchioBanner(name: string): Promise<string[][]> {
    
    // STEP 1 : richiesta alla funzione di search
    const url = "https://itch.io/search?";
    const params = {
        q: name
    };
    const textHtml = await requestGetText(url, params);

    // STEP 2 : altro
    const idRegex = /<a[^>]*?class="title game_link"[^>]*?href="(https:\/\/[a-zA-Z0-9-]+\.itch\.io\/[^"]+)|<a[^>]*?href="(https:\/\/[a-zA-Z0-9-]+\.itch\.io\/[^"]+)[^>]*?class="title game_link"/g;
    const idLinks = Array.from(textHtml.matchAll(idRegex), match => match[1] ?? match[2]).slice(0,5);

    console.groupCollapsed(idLinks.length)
    console.log(textHtml);
    console.log(idLinks);
    console.groupEnd()

    const imagesRegex = /<a[^>]*?href="(https:\/\/img\.itch\.zone\/[^"]*)"[^>]*?target="_blank"|<a[^>]*?target="_blank"[^>]*?href="(https:\/\/img\.itch\.zone\/[^"]*)"/g;;
    const imagesLinks: string[][] = [];

    for (let idLink of idLinks) {
        const imagesHtml = await requestGetText(idLink);
        const imageLinks = Array.from(imagesHtml.matchAll(imagesRegex), match => match[1] ?? match[2]);

        console.groupCollapsed(imageLinks.length + " " + idLink)
        console.log(imagesHtml);
        console.log(imageLinks);
        console.groupEnd()
        
        imagesLinks.push(imageLinks);
    }

    return imagesLinks;

}

export async function fetchTMDbBanner(name: string): Promise<string[][]> {
    
    // STEP 1 : richiesta alla funzione di search
    const url = "https://www.themoviedb.org";
    const params = {
        query: name
    };
    const linkHtml = await requestGetText(url + "/search?", params);

    // STEP 2 : altro
    const linkRegex = /class="poster"[\s\S]*?href="(.+?)"/g;
    
    const mediaLinks = Array.from(linkHtml.matchAll(linkRegex), match => url + match[1] + "/images/backdrops").slice(0,5);
    
    const imagesRegex = /class="card compact ok"[\s\S]*?href="(.+?)"/g;
    const imagesLinks: string[][] = [];

    for (let mediaLink of mediaLinks) {
        const imagesHtml = await requestGetText(mediaLink);
        const imageLinks = Array.from(imagesHtml.matchAll(imagesRegex), match => match[1]);
        imagesLinks.push(imageLinks);
    }

    return imagesLinks;

}