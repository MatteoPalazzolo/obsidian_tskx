import { Plugin } from "obsidian";
import { requestGetJson } from "src/utils/requestGet";

// TODO: al momento funziona bene, ma il layout non è molto flessibile e non è estendibile, modificare all'occorrenza
export function registerIframeMarkdownPostProcessor(this: Plugin) {
    this.registerMarkdownPostProcessor((element, context) => {

        element.querySelectorAll("p").forEach(async p => {
            const text = element.textContent?.trim() ?? "";

            // Spotify
            const spotifyMatch = text.match(/(?:https|http):\/\/open.spotify.com.*?\/(\w*)\/(\w*)(?:$|\?)/);
            if (spotifyMatch) {
                const [, thisType, thisId] = spotifyMatch;
                const iframe = document.createElement("iframe");
                iframe.classList.add('spotify-iframe');
                iframe.classList.add(thisType);
                iframe.src = `https://open.spotify.com/embed/${thisType}/${thisId}?theme=1`;
                iframe.loading = "lazy";
                p.replaceWith(iframe);
                return;
            }

            // Youtube
            const youtubeMatch = text.match(/(?:https|http):\/\/youtu.be\/(\w+)(?:$|\?)|(?:https|http):\/\/www.youtube.com\/embed\/(\w+)(?:$|\?)|(?:https|http):\/\/www.youtube.com\/watch\?v=(\w+)(?:$|&)/);
            if (youtubeMatch) {
                const [, thisId] = youtubeMatch.filter(id => id);
                const iframe = document.createElement("iframe");
                iframe.classList.add('youtube-iframe');
                iframe.src = `https://www.youtube.com/embed/${thisId}`;
                iframe.loading = "lazy";
                p.replaceWith(iframe);
                return;
            }

            // Steam & ItchIo
            if (await createSteamAndItchioWidget(text, p)) {
                return;
            }

            // Steam
            const steamMatch = text.match(/(?:https|http):\/\/store.steampowered.com\/.*?(\d+?)(?:$|\?|\/)/);
            if (steamMatch) {
                const [, thisId] = steamMatch;
                const iframe = document.createElement("iframe");
                iframe.classList.add('steam-iframe');
                iframe.src = `https://store.steampowered.com/widget/${thisId}?t=`;
                iframe.loading = "lazy";
                p.replaceWith(iframe);
                return;
            }

            // ItchIo Embed Link
            const itchioMatch1 = text.match(/(?:https|http):\/\/itch.io\/.*?(\d+?)(?:$|\?|\/)/);
            if (itchioMatch1) {
                const [, thisId] = itchioMatch1;
                const iframe = document.createElement("iframe");
                iframe.classList.add('itchio-iframe');
                iframe.src = `https://itch.io/embed/${thisId}?dark=true`;
                iframe.loading = "lazy";
                p.replaceWith(iframe);
                return;
            }

            // ItchIo Website Link
            const itchioMatch2 = text.match(/(?:https|http):\/\/([^\/]+?)\.itch.io\/(.+?)(?:$|\?|\/)/);
            if (itchioMatch2) {
                const [, devName, gameName] = itchioMatch2;

                const ans: { content: string } = await requestGetJson(`https://${devName}.itch.io/${gameName}/embed`);
                const idMatch = ans.content.match(/embed\\\/(\d+?)&quot/);
                if (!idMatch)
                    return;

                const [, thisId] = idMatch;
                const iframe = document.createElement("iframe");
                iframe.classList.add('itchio-iframe');
                iframe.src = `https://itch.io/embed/${thisId}?dark=true`;
                iframe.loading = "lazy";
                p.replaceWith(iframe);
                return;
            }


        });

    });
}

async function createSteamAndItchioWidget(text: string, target: HTMLElement): Promise<boolean> {
    const links = text.split("\n");

    if (links.length !== 2) {
        return false;
    }

    const container = document.createElement("div");
    container.classList.add('steam-itchio-iframe-container');
    
    const out: string[] = [];
    for (const link of links) {

        // Steam
        const steamMatch = link.match(/(?:https|http):\/\/store.steampowered.com\/.*?(\d+?)(?:$|\?|\/)/);
        if (steamMatch) {
            const [, thisId] = steamMatch;
            const iframe = container.createEl("iframe");
            iframe.classList.add('steam-iframe');
            iframe.src = `https://store.steampowered.com/widget/${thisId}?t=`;
            iframe.loading = "lazy";
            out.push("steam");
            continue;
        }

        // ItchIo Embed Link
        const itchioMatch1 = link.match(/(?:https|http):\/\/itch.io\/.*?(\d+?)(?:$|\?|\/)/);
        if (itchioMatch1) {
            const [, thisId] = itchioMatch1;
            const iframe = container.createEl("iframe");
            iframe.classList.add('itchio-iframe');
            iframe.src = `https://itch.io/embed/${thisId}?dark=true`;
            iframe.loading = "lazy";
            out.push("itchio");
            continue;
        }

        // ItchIo Website Link
        const itchioMatch2 = link.match(/(?:https|http):\/\/([^\/]+?)\.itch.io\/(.+?)(?:$|\?|\/)/);
        if (itchioMatch2) {
            const [, devName, gameName] = itchioMatch2;

            const ans: { content: string } = await requestGetJson(`https://${devName}.itch.io/${gameName}/embed`);
            const idMatch = ans.content.match(/embed\\\/(\d+?)&quot/);
            
            if (!idMatch)
                continue

            const [, thisId] = idMatch;
            const iframe = container.createEl("iframe");
            iframe.classList.add('itchio-iframe');
            iframe.src = `https://itch.io/embed/${thisId}?dark=true`;
            iframe.loading = "lazy";
            out.push("itchio");
            continue;
        }
    }

    if (out.filter(el => el === "steam").length === 1 && 
        out.filter(el => el === "itchio").length === 1) {
        target.replaceWith(container);
        return true;
    }

    return false;

}