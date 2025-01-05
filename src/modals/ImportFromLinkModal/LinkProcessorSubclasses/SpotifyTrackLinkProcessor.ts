import { Modal, Notice } from "obsidian";
import { LinkProcessorSettings, SecretSettings } from "src/types";
import { LinkProcessor } from "./LinkProcessor";
import { Track, SpotifyApi } from "@spotify/web-api-ts-sdk";
import dayjs from "dayjs";

interface NewSpotifyTrackData {
    name: string,
    album: string,
    artists: string[],
    track_number: number
}

export class SpotifyTrackLinkProcessor extends LinkProcessor<NewSpotifyTrackData> {

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
        super(thisModal, "Spotify Track", settings, link, ansContainerEl);
        this.uid = uid;
        this.secretSettings = secretSettings;
    }

    async getDataFromLink(): Promise<{ filename: string, data: NewSpotifyTrackData } | undefined> {

        const {clientId, secretId} = this.secretSettings.spotify;

        if (!clientId || !secretId) {
            new Notice("Secret Spotify Credentials NOT FOUND!");
            return;
        }

        const sdk: SpotifyApi = SpotifyApi.withClientCredentials(clientId, secretId);

        const ans: Track = await sdk.tracks.get(this.uid);
        // console.info(ans);

        const newData: NewSpotifyTrackData = {
            name: ans.name,
            track_number: ans.track_number,
            artists: ans.artists.map(a => a.name),
            album: ans.album.name
        };
        // console.info(newData);

        return {
            filename: newData.name,
            data: newData
        };
    }

    formatData(data: NewSpotifyTrackData): string[] {
        return [
            "Name: " + data.name,
            "Artist: " + data.artists.join(", "),
            "Album: " + data.album,
            "Index: " + data.track_number
        ];

    }

    processTemplate(templateContent: string, data: NewSpotifyTrackData): string {
        return templateContent
            .replace("<% tp.date.now(\"YYYY-MM-DD\") %>", dayjs().format("YYYY-MM-DD"))
            .replace("{name}", data.name)
            .replace("{author}", "\n  - " + data.artists.join("\n  - "))
            .replace("{album}", data.album)
            .replace("{index}", "" + data.track_number)
            .replace("https://open.spotify.com/track/", `https://open.spotify.com/track/${this.uid}`);
    }

}