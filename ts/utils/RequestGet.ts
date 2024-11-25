import { requestUrl, RequestUrlResponse } from 'obsidian';

export async function requestGetText(url:string, params={}, headers={}) : Promise<string> {

    console.info("requesting to", url + new URLSearchParams(params).toString());

    const response = await requestUrl({
        url: url + new URLSearchParams(params).toString(),
        method: "GET",
        headers
    });
    
    if (response.status !== 200) {
        console.error("Failed to fetch data:", response.status);
        return "";
    }
    
    return response.text;
}

export async function requestGetJson(url:string, params={}, headers={}) : Promise<{}> {

    console.info("requesting to", url + new URLSearchParams(params).toString());

    const response = await requestUrl({
        url: url + new URLSearchParams(params).toString(),
        method: "GET",
        headers
    });
    
    if (response.status !== 200) {
        console.error("Failed to fetch data:", response.status);
        return {};
    }
    
    return response.json;
}