import { requestGetText } from "src/utils/requestGet";

export async function* fetchSteamBanner(q: string): AsyncGenerator<string> {
    // 1) steam impedisce di accedere alle pagine +18 senza un account --> 
    //    questa funzione non ritorna le immagini di quel tipo di giochi

    // STEP 1 : richiesta alla funzione di search
    const url = "https://store.steampowered.com/search?";
    const params = {
        term: q,
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
    console.groupEnd();

    const imagesRegex = /href="[^"]*(https:\/\/shared.cloudflare.steamstatic.com\/store_item_assets\/steam\/apps\/[^"]*.jpg)[^"]*"/g;

    for (let idLink of idLinks) {
        const imagesHtml = await requestGetText(idLink);
        const imageLinks = Array.from(imagesHtml.matchAll(imagesRegex), match => match[1]);

        console.groupCollapsed(imageLinks.length + " " + idLink)
        console.log(imagesHtml);
        console.log(imageLinks);
        console.groupEnd()

        for (const imgUrl of imageLinks) {
            yield imgUrl;
        }
        yield 'line';

    }
    
}

export async function* fetchItchioBanner(q: string): AsyncGenerator<string> {
    
    // STEP 1 : richiesta alla funzione di search
    const url = "https://itch.io/search?";
    const params = {
        q: q
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

    for (let idLink of idLinks) {
        const imagesHtml = await requestGetText(idLink);
        const imageLinks = Array.from(imagesHtml.matchAll(imagesRegex), match => match[1] ?? match[2]);

        console.groupCollapsed(imageLinks.length + " " + idLink)
        console.log(imagesHtml);
        console.log(imageLinks);
        console.groupEnd()
        
        for (const imgUrl of imageLinks) {
            yield imgUrl;
        }
        yield 'line';
    }

}

export async function* fetchTMDbBanner(q: string): AsyncGenerator<string> {
    
    // STEP 1 : richiesta alla funzione di search
    const url = "https://www.themoviedb.org";
    const params = {
        query: q
    };
    const linkHtml = await requestGetText(url + "/search?", params);

    // STEP 2 : altro
    const linkRegex = /class="poster"[\s\S]*?href="(.+?)"/g;
    
    const mediaLinks = Array.from(linkHtml.matchAll(linkRegex), match => url + match[1] + "/images/backdrops").slice(0,5);
    
    const imagesRegex = /class="card compact ok"[\s\S]*?href="(.+?)"/g;

    for (let mediaLink of mediaLinks) {
        const imagesHtml = await requestGetText(mediaLink);
        const imageLinks = Array.from(imagesHtml.matchAll(imagesRegex), match => match[1]);
        
        for (const imgUrl of imageLinks) {
            yield imgUrl;
        }
        yield 'line';
    }

}