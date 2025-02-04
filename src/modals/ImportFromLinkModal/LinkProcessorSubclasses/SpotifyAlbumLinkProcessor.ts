import { Modal, Notice } from "obsidian";
import { LinkProcessorSettings, SecretSettings } from "src/types";
import { LinkProcessor } from "./LinkProcessor";
import { Album, SpotifyApi } from "@spotify/web-api-ts-sdk";
import dayjs from "dayjs";

interface NewSpotifyAlbumData {
    name: string,
    artists: string[]
}

export class SpotifyAlbumLinkProcessor extends LinkProcessor<NewSpotifyAlbumData> {

    uid: string;
    secretSettings: SecretSettings;

    constructor(
        thisModal: Modal,
        settings: LinkProcessorSettings,
        link: string,
        ansContainerEl: HTMLDivElement,
        uid: string,
        secretSettings: SecretSettings
    ) {
        super(thisModal, "Spotify Album", settings, link, ansContainerEl);
        this.uid = uid;
        this.secretSettings = secretSettings;
    }

    async getDataFromLink(): Promise<{ filename: string, data: NewSpotifyAlbumData } | undefined> {

        const {clientId, secretId} = this.secretSettings.spotify;

        if (!clientId || !secretId) {
            new Notice("Secret Spotify Credentials NOT FOUND!");
            return;
        }

        const sdk: SpotifyApi = SpotifyApi.withClientCredentials(clientId, secretId);

        const ans: Album = await sdk.albums.get(this.uid);
        // console.info(ans);

        const newData: NewSpotifyAlbumData = {
            name: ans.name,
            artists: ans.artists.map(a => a.name)
        };
        // console.info(newData);

        return {
            filename: newData.name,
            data: newData
        };
    }

    formatData(data: NewSpotifyAlbumData): string[] {
        return [
            "Name: " + data.name,
            "Artist: " + data.artists.join(", ")
        ];

    }

    processTemplate(templateContent: string, data: NewSpotifyAlbumData): string {
        return templateContent
            .replace("<% tp.date.now(\"YYYY-MM-DD\") %>", dayjs().format("YYYY-MM-DD"))
            .replace("{title}", data.name)
            .replace("{author}", "\n  - " + data.artists.join("\n  - "))
            .replace("https://open.spotify.com/album/", `https://open.spotify.com/album/${this.uid}`);

    }

}