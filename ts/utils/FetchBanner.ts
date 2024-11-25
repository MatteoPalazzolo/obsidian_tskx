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



/*
// npm i imdb-scraper
import IMDBScraper from 'imdb-scraper';

export async function fetchOMDbBanner(name:string): Promise<string[]> {
   
    const url = "http://www.omdbapi.com/?"
    const params = {
        apikey: "",
        t: name
    }

    const res = await requestGet(url, params);
    if (!res)
        return [];
    const ans = res.json;
    
    console.log(ans)

    const Imdb = new IMDBScraper()
    Imdb.title(ans.imdbID)
    .then(res => console.log(res))
    .catch(err => console.log(err))

    return [];
}*/

export async function fetchTMDbBanner(name: string): Promise<string[]> {

    const url = "https://api.themoviedb.org/3/search/movie?"
    const params = {
        query: name,
        include_adult: true,
        language: "en-US",
        page: 1
    }
    const headers = {
        accept: 'application/json',
    }

    const jsonData: any = await requestGetJson(url, params, headers);
    
    const imgUrls: string[] = []
    jsonData.results.forEach((el: any) => {
        if (el.backdrop_path)
            imgUrls.push("https://image.tmdb.org/t/p/w600_and_h900_bestv2" + el.backdrop_path)
        if (el.poster_path)
            imgUrls.push("https://image.tmdb.org/t/p/w600_and_h900_bestv2" + el.poster_path)
    });;

    return imgUrls;
}
